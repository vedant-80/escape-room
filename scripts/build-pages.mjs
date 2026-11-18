import { copyFile, mkdir, readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const output = resolve(process.argv[2] ?? '_site');
const sources = ['index.html', 'style.css', ...(await readdir('.')).filter(file => file.endsWith('.js'))];
const assets = new Set();
for (const source of sources) {
  const content = await readFile(source, 'utf8');
  for (const [asset] of content.matchAll(/\.\/assets\/[A-Za-z0-9_.-]+/g)) assets.add(asset.slice(2));
}

const three = [
  'LICENSE',
  'build/three.module.js',
  'build/three.core.js',
  'examples/jsm/controls/PointerLockControls.js',
].map(file => `node_modules/three/${file}`);

await mkdir(output);
for (const file of [...sources, ...assets, ...three]) {
  const destination = join(output, file);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(file, destination);
}
