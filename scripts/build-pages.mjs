import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const output = resolve(process.argv[2] ?? '_site');
const installedThree = 'node_modules/three';
const publishedThree = 'vendor/three';
const index = await readFile('index.html', 'utf8');
const sources = ['style.css', ...(await readdir('.')).filter(file => file.endsWith('.js'))];
const assets = new Set();
for (const source of ['index.html', ...sources]) {
  const content = source === 'index.html' ? index : await readFile(source, 'utf8');
  for (const [asset] of content.matchAll(/\.\/assets\/[A-Za-z0-9_.-]+/g)) assets.add(asset.slice(2));
}

const three = [
  'LICENSE',
  'build/three.module.js',
  'build/three.core.js',
  'examples/jsm/controls/PointerLockControls.js',
];

async function copyToSite(source, pathname) {
  const destination = join(output, pathname);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

await mkdir(output);
await writeFile(
  join(output, 'index.html'),
  index.replaceAll(`./${installedThree}/`, `./${publishedThree}/`),
);
for (const file of [...sources, ...assets]) {
  await copyToSite(file, file);
}
for (const file of three) {
  await copyToSite(join(installedThree, file), join(publishedThree, file));
}
