// Optimalizace default avatarů z assets-source/ → public/defaults/avatars/
// Krok 1.3a — generuje 512×512 + 256×256 WebP pro 3 typy: female, male, being.
// Spuštění: npm run defaults:optimize

import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const SRC = 'assets-source/default-avatars';
const OUT = 'public/defaults/avatars';
const TYPES = ['female', 'male', 'being'];
const QUALITY = 85;

await fs.mkdir(OUT, { recursive: true });

let total = 0;
for (const type of TYPES) {
  const input = path.join(SRC, `${type}.png`);
  try {
    await fs.access(input);
  } catch {
    console.error(`✗ ${input} neexistuje — přeskakuji`);
    continue;
  }

  const out512 = path.join(OUT, `${type}.webp`);
  const out256 = path.join(OUT, `${type}-sm.webp`);

  await sharp(input)
    .rotate()
    .resize(512, 512, { fit: 'cover', position: 'center' })
    .webp({ quality: QUALITY })
    .toFile(out512);

  await sharp(input)
    .rotate()
    .resize(256, 256, { fit: 'cover', position: 'center' })
    .webp({ quality: QUALITY })
    .toFile(out256);

  const stat512 = await fs.stat(out512);
  const stat256 = await fs.stat(out256);
  console.log(
    `✓ ${type}: ${out512} (${(stat512.size / 1024).toFixed(1)} KB), ${out256} (${(stat256.size / 1024).toFixed(1)} KB)`,
  );
  total += 2;
}

console.log(`\nHotovo. Vygenerováno ${total} souborů v ${OUT}/`);
