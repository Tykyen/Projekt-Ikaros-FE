import sharp from 'sharp';
import path from 'node:path';
import { stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Post-process nemrtvi decor: resize 7 nav medailony + corner + divider-skull + skull-arch
// na cílové rozměry. logo, medailon ponecháváme v originálních rozměrech.
// Spustit po `npm run themes:optimize`.
//
// Windows: nečteme+nepíšeme do stejného souboru přímo (file lock) —
// místo toho readFile do bufferu, sharp z bufferu, pak writeFile výstup.
//
// `whiteBgKey: true` — asset měl source PNG bez alpha kanálu (uživatelský export),
// optimize krok pass-through neprovedl chroma-key (corners non-uniform).
// Čteme přímo source PNG a ručně převedeme bílé pixely (lum ≥ 220) na transparent.

const SOURCE = path.resolve('assets-source/themes/nemrtvi');
const DECOR = path.resolve('public/themes/nemrtvi/decor');

const TASKS = [
  { in: 'corner-tl.webp',          out: 'corner-tl.webp',          w: 256,  h: 256 },
  { in: 'divider-skull.webp',      out: 'divider-skull.webp',      w: 600,  h: 140, fit: 'contain', sharper: true },
  { in: 'skull-arch.png',          out: 'skull-arch.webp',         w: 1600, h: 400, fit: 'contain', whiteBgKey: true, fromSource: true },
  { in: 'icon-uvodnik.webp',       out: 'icon-uvodnik.webp',       w: 96,   h: 96  },
  { in: 'icon-vytvorit-svet.webp', out: 'icon-vytvorit-svet.webp', w: 96,   h: 96  },
  { in: 'icon-diskuze.webp',       out: 'icon-diskuze.webp',       w: 96,   h: 96  },
  { in: 'icon-clanky.webp',        out: 'icon-clanky.webp',        w: 96,   h: 96  },
  { in: 'icon-galerie.webp',       out: 'icon-galerie.webp',       w: 96,   h: 96  },
  { in: 'icon-napoveda.webp',      out: 'icon-napoveda.webp',      w: 96,   h: 96  },
  { in: 'icon-hospoda.webp',       out: 'icon-hospoda.webp',       w: 96,   h: 96  },
];

const WHITE_HARD = 220; // ≥ 220 lum → fully transparent
const WHITE_SOFT = 190; // [190, 220] → fade out
const ACHROMATIC_TOLERANCE = 12; // |R-G|, |G-B|, |R-B| ≤ 12 → near-grayscale

async function applyWhiteBgKey(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (Math.max(r, g, b) - Math.min(r, g, b) > ACHROMATIC_TOLERANCE) continue;
    const lum = (r + g + b) / 3;
    if (lum >= WHITE_HARD) {
      data[i + 3] = 0;
    } else if (lum >= WHITE_SOFT) {
      const fade = 1 - (lum - WHITE_SOFT) / (WHITE_HARD - WHITE_SOFT);
      const desired = Math.round(255 * fade);
      if (data[i + 3] > desired) data[i + 3] = desired;
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function processOne({ in: inFile, out: outFile, w, h, sharper, fit, whiteBgKey, fromSource }) {
  const inPath = path.join(fromSource ? SOURCE : DECOR, inFile);
  const outPath = path.join(DECOR, outFile);
  if (!existsSync(inPath)) {
    console.warn(`✗ ${inFile} neexistuje, skip`);
    return;
  }
  let buf = await readFile(inPath);

  if (whiteBgKey) {
    buf = await applyWhiteBgKey(buf);
  }

  let pipeline = sharp(buf)
    .resize(w, h, { fit: fit || 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  pipeline = sharper
    ? pipeline.sharpen({ sigma: 0.6, m1: 1.0, m2: 0.5 })
    : pipeline.sharpen({ sigma: 0.4 });

  const outBuf = await pipeline.webp({ quality: 90, alphaQuality: 100 }).toBuffer();
  await writeFile(outPath, outBuf);

  const s = await stat(outPath);
  const note = whiteBgKey ? ' [white-bg keyed]' : '';
  console.log(`✓ ${inFile} → ${outFile} (${w}×${h}, ${(s.size / 1024).toFixed(1)} KB)${note}`);
}

async function main() {
  console.log('[nemrtvi] Finalizing decor assets...');
  for (const task of TASKS) {
    try { await processOne(task); }
    catch (err) { console.error(`✗ ${task.in}: ${err.message}`); }
  }
  console.log('[nemrtvi] Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
