import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const files = await walk(dist);
let changedHtml = 0;

for (const file of files) {
  if (extname(file) !== '.html') continue;
  const current = await readFile(file, 'utf8');
  let next = current;

  next = next.replace(
    /<link[^>]*rel=["']icon["'][^>]*href=["']\/favicon\.png["'][^>]*>/gi,
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
  );
  next = next.replace(
    /<link[^>]*href=["']\/favicon\.png["'][^>]*rel=["']icon["'][^>]*>/gi,
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
  );
  next = next.replace(/src=(["'])\/favicon\.png\1/gi, 'src="/favicon.svg"');
  next = next.replace(
    /\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\s*/g,
    '\n',
  );

  if (next !== current) {
    await writeFile(file, next, 'utf8');
    changedHtml += 1;
  }
}

const manifestPath = resolve(dist, 'site.webmanifest');
try {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.icons = [
    {
      src: '/favicon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
    },
  ];
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

console.log(`Optimized favicon references in ${changedHtml} HTML files.`);
