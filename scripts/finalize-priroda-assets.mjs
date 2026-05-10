import sharp from 'sharp';
import path from 'node:path';
import { stat, unlink, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Post-process priroda decor: resize ikony + corner na cílové rozměry,
// generuj icon-leaf ve 2 velikostech (audit M3).
// Spustit po `npm run themes:optimize`.
//
// Windows: nečteme+nepíšeme do stejného souboru přímo (file lock) —
// místo toho readFile do bufferu, sharp z bufferu, pak writeFile výstup.

const DECOR = path.resolve('public/themes/priroda/decor');

const TASKS = [
  { in: 'icon-hospoda.webp',  out: 'icon-hospoda.webp',  w: 96,  h: 96  },
  { in: 'icon-uvodnik.webp',  out: 'icon-uvodnik.webp',  w: 96,  h: 96  },
  { in: 'icon-napoveda.webp', out: 'icon-napoveda.webp', w: 96,  h: 96  },
  { in: 'icon-leaf.webp',     out: 'icon-leaf-64.webp',  w: 64,  h: 64  },
  { in: 'icon-leaf.webp',     out: 'icon-leaf-32.webp',  w: 32,  h: 32, sharper: true },
  { in: 'corner-tl.webp',     out: 'corner-tl.webp',     w: 256, h: 256 },
];

async function processOne({ in: inFile, out: outFile, w, h, sharper }) {
  const inPath = path.join(DECOR, inFile);
  const outPath = path.join(DECOR, outFile);
  if (!existsSync(inPath)) {
    console.warn(`✗ ${inFile} neexistuje, skip`);
    return;
  }
  const buf = await readFile(inPath);
  let pipeline = sharp(buf)
    .resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  pipeline = sharper
    ? pipeline.sharpen({ sigma: 0.6, m1: 1.0, m2: 0.5 })
    : pipeline.sharpen({ sigma: 0.4 });

  const outBuf = await pipeline.webp({ quality: 90, alphaQuality: 100 }).toBuffer();
  await writeFile(outPath, outBuf);

  const s = await stat(outPath);
  console.log(`✓ ${inFile} → ${outFile} (${w}×${h}, ${(s.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log('[priroda] Finalizing decor assets...');
  for (const task of TASKS) {
    try { await processOne(task); }
    catch (err) { console.error(`✗ ${task.in}: ${err.message}`); }
  }

  const leafOrig = path.join(DECOR, 'icon-leaf.webp');
  if (existsSync(leafOrig)) {
    try {
      await unlink(leafOrig);
      console.log('✓ removed icon-leaf.webp (replaced by icon-leaf-64.webp + icon-leaf-32.webp)');
    } catch (e) {
      console.warn(`! icon-leaf.webp delete skipped: ${e.code} (manuálně později)`);
    }
  }
  console.log('[priroda] Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
