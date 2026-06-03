// D-029 — PWA ikony z brandového anděla (téma magie medailon).
// Generuje icon-192/512 (any) + icon-maskable-512 (safe-zone padding).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'assets-source/themes/magie/medailon.png';
const OUT = 'public/icons';
const BG = { r: 20, g: 16, b: 30, alpha: 1 }; // #14101e (manifest background_color)

mkdirSync(OUT, { recursive: true });

// "any" — full medailon, podložené brandovou fialovou (medailon má alpha okraje)
for (const size of [192, 512]) {
  await sharp(SRC)
    .resize(size, size, { fit: 'contain', background: BG })
    .flatten({ background: BG })
    .png()
    .toFile(`${OUT}/icon-${size}.png`);
}

// "maskable" — obsah v centrálních ~80 %, okolo safe-zone padding (BG)
const inner = 410;
const pad = (512 - inner) / 2; // 51
await sharp(SRC)
  .resize(inner, inner, { fit: 'contain', background: BG })
  .flatten({ background: BG })
  .extend({ top: pad, bottom: pad, left: pad, right: pad, background: BG })
  .png()
  .toFile(`${OUT}/icon-maskable-512.png`);

console.log('PWA ikony vygenerovány do', OUT);
