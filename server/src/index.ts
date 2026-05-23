import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { exec } from 'node:child_process';
import { PORT } from './config';

const serverDir = (() => {
  // @ts-ignore — __dirname is available in CJS bundle
  if (typeof __dirname !== 'undefined') return __dirname;
  const url = import.meta.url;
  if (url && url !== 'file:///empty.js') {
    const p = url.replace('file:///', '').replace(/^\/([A-Za-z]:)/, '$1');
    return path.dirname(p);
  }
  return process.cwd();
})();
import { projectsRouter } from './routes/projects';
import { sessionsRouter } from './routes/sessions';
import { transcriptRouter } from './routes/transcript';
import { searchRouter } from './routes/search';
import { errorHandler } from './middleware/errorHandler';

const isTauri = process.env.TAURI === '1';
const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/projects', projectsRouter);
app.use('/api/projects', sessionsRouter);
app.use('/api/sessions', transcriptRouter);
app.use('/api/search', searchRouter);

// Serve static client files — from disk, or from embedded assets (SEA mode)
serveClient();

app.use(errorHandler);

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n  Claude Code History Viewer`);
  console.log(`  ${url}\n`);

  // Auto-open the browser (standalone / dev mode only)
  if (!isTauri) {
    const platform = process.platform;
    const cmd = platform === 'win32'
      ? `start "" "${url}"`
      : platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;

    exec(cmd, (err) => {
      if (err) console.log(`  (Could not open browser automatically: ${err.message})`);
    });
  }
});

async function serveClient() {
  const clientDist = findClientDist();
  if (clientDist) {
    console.log(`Serving files from: ${clientDist}`);
    app.use(express.static(clientDist));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(clientDist, 'index.html'));
      }
    });
    return;
  }

  console.log('No static files available — API-only mode');
}

function findClientDist(): string | null {
  const candidates = [
    path.join(serverDir, 'client', 'dist'),
    path.join(serverDir, '..', 'client', 'dist'),
    path.join(serverDir, '..', '..', 'client', 'dist'),
    // Tauri bundles ../ resources under _up_/ relative to exe
    path.join(serverDir, '..', '..', '_up_', 'client', 'dist'),
    path.join(serverDir, '..', '..', '..', '_up_', 'client', 'dist'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }
  return null;
}
