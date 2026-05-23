import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { CLAUDE_HOME } from '../config';

const PROJECTS_DIR = path.join(CLAUDE_HOME, 'projects');
const HISTORY_FILE = path.join(CLAUDE_HOME, 'history.jsonl');

export async function deleteSession(projectId: string, sessionId: string): Promise<void> {
  // 1. Delete the session JSONL file
  const sessionFile = path.join(PROJECTS_DIR, projectId, `${sessionId}.jsonl`);
  if (fs.existsSync(sessionFile)) {
    fs.unlinkSync(sessionFile);
  }

  // 2. Delete subagents directory if it exists
  const subagentsDir = path.join(PROJECTS_DIR, projectId, sessionId);
  if (fs.existsSync(subagentsDir)) {
    fs.rmSync(subagentsDir, { recursive: true, force: true });
  }

  // 3. Filter out session entries from history.jsonl
  if (fs.existsSync(HISTORY_FILE)) {
    await filterHistoryFile(sessionId);
  }
}

async function filterHistoryFile(sessionId: string): Promise<void> {
  const tmpFile = HISTORY_FILE + '.tmp';
  const lines: string[] = [];

  try {
    const stream = fs.createReadStream(HISTORY_FILE, 'utf-8');
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.sessionId !== sessionId) {
          lines.push(line);
        }
      } catch {
        lines.push(line); // keep malformed lines
      }
    }

    // Write back filtered content
    fs.writeFileSync(tmpFile, lines.join('\n') + (lines.length > 0 ? '\n' : ''));
    fs.renameSync(tmpFile, HISTORY_FILE);
  } catch {
    // clean up temp file on error
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}
