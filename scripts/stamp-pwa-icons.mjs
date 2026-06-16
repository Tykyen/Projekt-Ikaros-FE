// Cache-busting PWA ikon. Server servíruje ikony s `immutable` (rok), takže
// stabilní názvy (icon-192.png) klient nikdy znovu nestáhne → po změně loga
// drží starou. Manifest i index.html jsou `no-cache`, proto stačí do nich
// vrazit `?v=<hash obsahu>` — nová URL obejde immutable cache, klient stáhne
// čerstvou ikonu. Hash se mění JEN když se změní obsah ikony.
//
//   node scripts/stamp-pwa-icons.mjs   (běží automaticky v `npm run build`)
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const PUB = 'public';
const MANIFEST = path.join(PUB, 'manifest.webmanifest');
const INDEX = 'index.html';

const shortHash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);
const stripV = (url) => url.replace(/\?v=[a-f0-9]+$/, '');

// ── manifest ikony ──────────────────────────────────────────────────────
const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
for (const icon of manifest.icons ?? []) {
  const clean = stripV(icon.src); // "/icons/icon-192.png"
  const buf = await readFile(path.join(PUB, clean));
  icon.src = `${clean}?v=${shortHash(buf)}`;
}
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

// ── favicon v index.html ────────────────────────────────────────────────
const favBuf = await readFile(path.join(PUB, 'favicon.webp'));
const favV = shortHash(favBuf);
let index = await readFile(INDEX, 'utf8');
index = index.replace(
  /href="\/favicon\.webp(\?v=[a-f0-9]+)?"/,
  `href="/favicon.webp?v=${favV}"`,
);
await writeFile(INDEX, index);

console.log('✓ PWA ikony orazítkovány (cache-bust ?v=hash) v manifestu i index.html');
