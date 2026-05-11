import sharp from 'sharp';
import path from 'node:path';
import { stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Post-process arabsky-svet decor: resize všech 14 AI gen assetů na cílové rozměry.
// logo + medailon ponecháváme v originálních rozměrech (auto-trim už proběhl v themes:optimize).
// Spustit po `npm run themes:optimize`.
//
// Windows: nečteme+nepíšeme do stejného souboru přímo (file lock) —
// místo toho readFile do bufferu, sharp z bufferu, pak writeFile výstup.

const DECOR = path.resolve('public/themes/arabsky-svet/decor');

const TASKS = [
  { in: 'corner-tl.webp',           out: 'corner-tl.webp',           w: 256,  h: 256  },
  { in: 'mukarnas-cornice.webp',    out: 'mukarnas-cornice.webp',    w: 1920, h: 80,   fit: 'contain', sharper: true },
  { in: 'narghile-smoke.webp',      out: 'narghile-smoke.webp',      w: 180,  h: 800,  fit: 'contain' },
  { in: 'genie-lamp.webp',          out: 'genie-lamp.webp',          w: 180,  h: 320,  fit: 'contain' },
  { in: 'caustic-glow.webp',        out: 'caustic-glow.webp',        w: 400,  h: 500,  fit: 'contain' },
  { in: 'carpet-strip.webp',        out: 'carpet-strip.webp',        w: 1200, h: 60,   fit: 'contain', sharper: true },
  { in: 'rose-petals-scatter.webp', out: 'rose-petals-scatter.webp', w: 800,  h: 400,  fit: 'contain' },
  { in: 'icon-uvodnik.webp',        out: 'icon-uvodnik.webp',        w: 96,   h: 96   },
  { in: 'icon-vytvorit-svet.webp',  out: 'icon-vytvorit-svet.webp',  w: 96,   h: 96   },
  { in: 'icon-diskuze.webp',        out: 'icon-diskuze.webp',        w: 96,   h: 96   },
  { in: 'icon-clanky.webp',         out: 'icon-clanky.webp',         w: 96,   h: 96   },
  { in: 'icon-galerie.webp',        out: 'icon-galerie.webp',        w: 96,   h: 96   },
  { in: 'icon-napoveda.webp',       out: 'icon-napoveda.webp',       w: 96,   h: 96   },
  { in: 'icon-hospoda.webp',        out: 'icon-hospoda.webp',        w: 96,   h: 96   },
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
  console.log('[arabsky-svet] Finalizing decor assets...');
  for (const task of TASKS) {
    try { await processOne(task); }
    catch (err) { console.error(`✗ ${task.in}: ${err.message}`); }
  }
  console.log('[arabsky-svet] Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
