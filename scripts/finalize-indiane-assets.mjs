import sharp from 'sharp';
import path from 'node:path';
import { stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Post-process indiane decor: resize 7 nav medailonů + corner + medailon-frame
// + drum-pictograph + decor-fire-stones + feather-stamp + petroglyph-divider
// na cílové rozměry. logo, medailon (banner) ponecháváme v originálních rozměrech.
// Spustit po `npm run themes:optimize`.
//
// Windows: nečteme+nepíšeme do stejného souboru přímo (file lock) —
// místo toho readFile do bufferu, sharp z bufferu, pak writeFile výstup.

const DECOR = path.resolve('public/themes/indiane/decor');

const TASKS = [
  { in: 'corner-tl.webp',          out: 'corner-tl.webp',          w: 256,  h: 256 },
  { in: 'medailon-frame.webp',     out: 'medailon-frame.webp',     w: 800,  h: 600,  fit: 'contain' },
  { in: 'drum-pictograph.webp',    out: 'drum-pictograph.webp',    w: 720,  h: 540,  fit: 'contain' },
  { in: 'icon-uvodnik.webp',       out: 'icon-uvodnik.webp',       w: 96,   h: 96   },
  { in: 'icon-vytvorit-svet.webp', out: 'icon-vytvorit-svet.webp', w: 96,   h: 96   },
  { in: 'icon-diskuze.webp',       out: 'icon-diskuze.webp',       w: 96,   h: 96   },
  { in: 'icon-clanky.webp',        out: 'icon-clanky.webp',        w: 96,   h: 96   },
  { in: 'icon-galerie.webp',       out: 'icon-galerie.webp',       w: 96,   h: 96   },
  { in: 'icon-napoveda.webp',      out: 'icon-napoveda.webp',      w: 96,   h: 96   },
  { in: 'icon-hospoda.webp',       out: 'icon-hospoda.webp',       w: 96,   h: 96   },
  { in: 'feather-stamp.webp',      out: 'feather-stamp.webp',      w: 96,   h: 96,   sharper: true },
  { in: 'decor-fire-stones.webp',  out: 'decor-fire-stones.webp',  w: 1200, h: 300,  fit: 'contain' },
  { in: 'petroglyph-divider.webp', out: 'petroglyph-divider.webp', w: 800,  h: 80,   fit: 'contain', sharper: true },
];

async function processOne({ in: inFile, out: outFile, w, h, sharper, fit }) {
  const inPath = path.join(DECOR, inFile);
  const outPath = path.join(DECOR, outFile);
  if (!existsSync(inPath)) {
    console.warn(`✗ ${inFile} neexistuje, skip`);
    return;
  }
  const buf = await readFile(inPath);
  let pipeline = sharp(buf)
    .resize(w, h, { fit: fit || 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  pipeline = sharper
    ? pipeline.sharpen({ sigma: 0.6, m1: 1.0, m2: 0.5 })
    : pipeline.sharpen({ sigma: 0.4 });

  const outBuf = await pipeline.webp({ quality: 90, alphaQuality: 100 }).toBuffer();
  await writeFile(outPath, outBuf);

  const s = await stat(outPath);
  console.log(`✓ ${inFile} → ${outFile} (${w}×${h}, ${(s.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log('[indiane] Finalizing decor assets...');
  for (const task of TASKS) {
    try { await processOne(task); }
    catch (err) { console.error(`✗ ${task.in}: ${err.message}`); }
  }
  console.log('[indiane] Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
