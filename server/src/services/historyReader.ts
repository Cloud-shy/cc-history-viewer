import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { CLAUDE_HOME } from '../config';
import type { HistoryEntry, SearchResult } from '../types';

const HISTORY_FILE = path.join(CLAUDE_HOME, 'history.jsonl');

let cachedEntries: HistoryEntry[] | null = null;

export async function readHistory(): Promise<HistoryEntry[]> {
  if (cachedEntries) return cachedEntries;

  const entries: HistoryEntry[] = [];
  try {
    const stream = fs.createReadStream(HISTORY_FILE, 'utf-8');
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        entries.push(JSON.parse(line));
      } catch {
        // skip malformed lines
      }
    }
  } catch {
    // file doesn't exist or can't be read
  }

  cachedEntries = entries;
  return entries;
}

export function getHistoryBySession(sessionId: string, history?: HistoryEntry[]): HistoryEntry[] {
  const h = history || cachedEntries || [];
  return h.filter((e) => e.sessionId === sessionId);
}

export function getHistoryByProject(projectPath: string, history?: HistoryEntry[]): HistoryEntry[] {
  const h = history || cachedEntries || [];
  return h.filter((e) => e.project === projectPath || e.project === projectPath.replace(/\//g, '\\'));
}

export async function search(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const q = query.toLowerCase();
  if (!q) return results;

  const history = await readHistory();

  // Search in history.jsonl
  for (const entry of history) {
    if (entry.display.toLowerCase().includes(q)) {
      results.push({
        projectId: encodeProjectPath(entry.project),
        sessionId: entry.sessionId,
        title: null,
        matchField: 'prompt',
        matchSnippet: entry.display.slice(0, 200),
        timestamp: new Date(entry.timestamp).toISOString(),
      });
    }
  }

  // Deduplicate by sessionId (keep first match)
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.projectId}:${r.sessionId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function encodeProjectPath(project: string): string {
  return project.replace(/\\/g, '-').replace(/:/g, '-');
}
