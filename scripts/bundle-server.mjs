import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SERVER_SRC = path.join(ROOT, 'server', 'src');
const OUT_DIR = path.join(ROOT, 'dist-server');

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(SERVER_SRC, 'index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: path.join(OUT_DIR, 'index.js'),
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

console.log(`Server bundled to ${path.join(OUT_DIR, 'index.js')}`);
