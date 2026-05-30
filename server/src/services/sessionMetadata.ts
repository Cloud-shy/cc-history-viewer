import fs from 'node:fs';
import path from 'node:path';
import { CLAUDE_HOME } from '../config';

const PROJECTS_DIR = path.join(CLAUDE_HOME, 'projects');

interface SessionMeta {
  customTitle?: string;
  starred?: boolean;
}

function metaPath(projectId: string, sessionId: string): string {
  return path.join(PROJECTS_DIR, projectId, `${sessionId}.meta.json`);
}

export function readMeta(projectId: string, sessionId: string): SessionMeta {
  const filePath = metaPath(projectId, sessionId);
  if (!fs.existsSync(filePath)) return {};

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Corrupt metadata file ${filePath}:`, (err as Error).message);
    return {};
  }
}

export function writeMeta(projectId: string, sessionId: string, meta: SessionMeta): void {
  const dir = path.join(PROJECTS_DIR, projectId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(metaPath(projectId, sessionId), JSON.stringify(meta, null, 2), 'utf-8');
}

export function updateMeta(
  projectId: string,
  sessionId: string,
  patch: Partial<SessionMeta>
): SessionMeta {
  const current = readMeta(projectId, sessionId);
  const updated = { ...current, ...patch };
  writeMeta(projectId, sessionId, updated);
  return updated;
}
