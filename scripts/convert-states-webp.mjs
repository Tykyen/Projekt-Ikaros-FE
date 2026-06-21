// Jednorázová konverze ilustrací prázdných/chybových stavů (spec 15.6):
// JPEG → WebP, resize na max 768px, smazání originálu .jpg po úspěchu.
import sharp from 'sharp';
import { readdir, stat, unlink } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const dir = new URL('../public/illustrations/states/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const files = (await readdir(dir)).filter((f) => extname(f).toLowerCase() === '.jpg');
let before = 0;
let after = 0;

for (const f of files) {
  const src = join(dir, f);
  const out = join(dir, basename(f, '.jpg') + '.webp');
  const sizeBefore = (await stat(src)).size;
  await sharp(src)
    .resize({ width: 768, height: 768, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(out);
  const sizeAfter = (await stat(out)).size;
  await unlink(src);
  before += sizeBefore;
  after += sizeAfter;
  console.log(
    `${f.padEnd(22)} ${(sizeBefore / 1024).toFixed(0).padStart(5)} KB → ${(sizeAfter / 1024).toFixed(0).padStart(4)} KB`,
  );
}

console.log(
  `\nCelkem: ${(before / 1024 / 1024).toFixed(2)} MB → ${(after / 1024 / 1024).toFixed(2)} MB (${(100 - (after / before) * 100).toFixed(0)} % úspora)`,
);
