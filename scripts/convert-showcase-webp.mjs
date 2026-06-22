// Jednorázová konverze showcase obrázků úvodní stránky (spec 15.7):
// PNG (mezery/diakritika v názvu) → WebP se slug názvem, resize max 1600px,
// smazání originálu .png po úspěchu. Vzor: convert-states-webp.mjs (15.6).
import sharp from 'sharp';
import { stat, unlink, access } from 'node:fs/promises';
import { join } from 'node:path';

const dir = new URL('../public/images/showcase/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

// Explicitní mapa zdroj(.png) → cíl(slug.webp). Zdroje mají mezery a diakritiku.
const MAP = {
  'úvod světa.png': 'showcase_uvod_sveta.webp',
  'Vzhled postav.png': 'showcase_vzhled_postav.webp',
  'taktická mapa.png': 'showcase_takticka_mapa.webp',
  'Deník postavy.png': 'showcase_denik_postavy.webp',
  'Chatovací hra.png': 'showcase_chat.webp',
};

let before = 0;
let after = 0;

for (const [srcName, outName] of Object.entries(MAP)) {
  const src = join(dir, srcName);
  try {
    await access(src);
  } catch {
    console.log(`SKIP (chybí): ${srcName}`);
    continue;
  }
  const out = join(dir, outName);
  const sizeBefore = (await stat(src)).size;
  await sharp(src)
    .resize({ width: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(out);
  const sizeAfter = (await stat(out)).size;
  await unlink(src);
  before += sizeBefore;
  after += sizeAfter;
  console.log(
    `${srcName.padEnd(20)} → ${outName.padEnd(28)} ${(sizeBefore / 1024).toFixed(0).padStart(5)} KB → ${(sizeAfter / 1024).toFixed(0).padStart(4)} KB`,
  );
}

console.log(
  `\nCelkem: ${(before / 1024 / 1024).toFixed(2)} MB → ${(after / 1024 / 1024).toFixed(2)} MB (${before ? (100 - (after / before) * 100).toFixed(0) : 0} % úspora)`,
);
