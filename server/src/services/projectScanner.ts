import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { CLAUDE_HOME } from '../config';
import { decodePath, encodePath } from './pathEncoder';
import { readMeta } from './sessionMetadata';
import type { ProjectSummary, SessionSummary } from '../types';

const PROJECTS_DIR = path.join(CLAUDE_HOME, 'projects');

// Build a mapping from encoded project id -> real display path using history.jsonl
async function buildPathMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const historyFile = path.join(CLAUDE_HOME, 'history.jsonl');
    const stream = fs.createReadStream(historyFile, 'utf-8');
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.project) {
          const encoded = encodePath(entry.project);
          if (!map.has(encoded)) {
            map.set(encoded, entry.project);
          }
        }
      } catch { /* skip */ }
    }
  } catch { /* file not found */ }
  return map;
}

let pathMapCache: Map<string, string> | null = null;

async function getPathMap(): Promise<Map<string, string>> {
  if (!pathMapCache) {
    pathMapCache = await buildPathMap();
  }
  return pathMapCache;
}

export async function scanProjects(): Promise<ProjectSummary[]> {
  const projects: ProjectSummary[] = [];
  const pathMap = await getPathMap();

  let dirEntries: fs.Dirent[];
  try {
    dirEntries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
  } catch {
    return projects;
  }

  for (const entry of dirEntries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'memory' || entry.name.startsWith('.')) continue;

    const projectDir = path.join(PROJECTS_DIR, entry.name);
    const jsonlFiles = findJsonlFiles(projectDir);
    if (jsonlFiles.length === 0) continue;

    let realPath = pathMap.get(entry.name);
    if (!realPath) {
      // Try to read cwd from first session file
      realPath = await readCwdFromSession(jsonlFiles[0]) || decodePath(entry.name);
    }
    const basename = path.basename(realPath);

    projects.push({
      id: entry.name,
      displayPath: realPath,
      shortName: basename || realPath,
      sessionCount: jsonlFiles.length,
    });
  }

  projects.sort((a, b) => a.shortName.localeCompare(b.shortName));
  return projects;
}

export async function getProjectSessions(projectId: string): Promise<SessionSummary[]> {
  const projectDir = path.join(PROJECTS_DIR, projectId);
  const sessions: SessionSummary[] = [];

  let dirEntries: fs.Dirent[];
  try {
    dirEntries = fs.readdirSync(projectDir, { withFileTypes: true });
  } catch {
    return sessions;
  }

  for (const entry of dirEntries) {
    if (!entry.isFile() || !entry.name.endsWith('.jsonl')) continue;

    const sessionId = entry.name.replace('.jsonl', '');
    const filePath = path.join(projectDir, entry.name);

    const meta = await readSessionMeta(filePath);
    const userMeta = readMeta(projectId, sessionId);
    sessions.push({
      sessionId,
      title: userMeta.customTitle || meta.title,
      firstPrompt: meta.firstPrompt,
      messageCount: meta.lineCount,
      startedAt: meta.startedAt,
      lastActivityAt: meta.lastActivityAt,
      gitBranch: meta.gitBranch,
      starred: !!userMeta.starred,
    });
  }

  // Sort by last activity, most recent first
  sessions.sort((a, b) => {
    const ta = a.lastActivityAt || '';
    const tb = b.lastActivityAt || '';
    return tb.localeCompare(ta);
  });

  return sessions;
}

async function readSessionMeta(filePath: string): Promise<{
  title: string | null;
  firstPrompt: string | null;
  lineCount: number;
  startedAt: string | null;
  lastActivityAt: string | null;
  gitBranch: string | null;
}> {
  let title: string | null = null;
  let firstPrompt: string | null = null;
  let startedAt: string | null = null;
  let lastActivityAt: string | null = null;
  let gitBranch: string | null = null;
  let lineCount = 0;

  try {
    const stream = fs.createReadStream(filePath, 'utf-8');
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;
      lineCount++;
      try {
        const obj = JSON.parse(line);
        if (!startedAt && obj.timestamp) {
          startedAt = typeof obj.timestamp === 'number'
            ? new Date(obj.timestamp).toISOString()
            : obj.timestamp;
        }
        if (obj.timestamp) {
          lastActivityAt = typeof obj.timestamp === 'number'
            ? new Date(obj.timestamp).toISOString()
            : obj.timestamp;
        }
        if (!title && obj.type === 'ai-title' && obj.aiTitle) {
          title = obj.aiTitle;
        }
        if (!firstPrompt && obj.type === 'user' && obj.message?.role === 'user' && typeof obj.message?.content === 'string') {
          firstPrompt = obj.message.content.slice(0, 200);
        }
        if (!gitBranch && obj.gitBranch) {
          gitBranch = obj.gitBranch;
        }
      } catch {
        // skip malformed
      }
    }
  } catch {
    // file read error
  }

  return { title, firstPrompt, lineCount, startedAt, lastActivityAt, gitBranch };
}

function findJsonlFiles(dir: string): string[] {
  try {
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.jsonl') && !f.includes('agent-'))
      .map(f => path.join(dir, f));
  } catch {
    return [];
  }
}

async function readCwdFromSession(filePath: string): Promise<string | null> {
  try {
    const stream = fs.createReadStream(filePath, 'utf-8');
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.cwd && typeof obj.cwd === 'string') {
          rl.close();
          stream.destroy();
          return obj.cwd;
        }
        if (obj.type === 'user' && obj.message?.cwd) {
          rl.close();
          stream.destroy();
          return obj.message.cwd as string;
        }
      } catch { /* skip */ }
    }
  } catch { /* file read error */ }
  return null;
}
