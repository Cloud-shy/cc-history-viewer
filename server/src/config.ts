import path from 'node:path';
import os from 'node:os';

const HOME = process.env.HOME || os.homedir();

export const CLAUDE_HOME = path.join(HOME, '.claude');
export const PORT = parseInt(process.env.PORT || '3001', 10);
