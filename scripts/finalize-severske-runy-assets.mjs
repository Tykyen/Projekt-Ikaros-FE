import sharp from 'sharp';
import path from 'node:path';
import { stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Post-process severske-runy decor: resize všech AI assetů na cílové rozměry.
// logo + medailon ponecháváme v originálních rozměrech (logo má baked-in
// "Projekt Ikaros" text + Ikaros erb, medailon je rectangular self-framed
// shield — downscale by oba rozmazal).
// Spustit po `npm run themes:optimize`.

const DECOR = path.resolve('public/themes/severske-runy/decor');
const SOURCE = path.resolve('assets-source/themes/severske-runy');

// rune-circle-floor: source PNG má bílé pozadí (horní polovina) nad
// modrošedou kamennou podlahou (bez alpha) — optimize pass-through nezachytil.
// Čteme ze source + white-bg key: zprůhlední bílou, kamenná podlaha zůstane.
const WHITE_HARD = 220;
const WHITE_SOFT = 190;
const ACHROMATIC_TOLERANCE = 12;

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

const TASKS = [
  { in: 'corner-tl.webp',           out: 'corner-tl.webp',           w: 256,  h: 256 },
  { in: 'medailon-frame.webp',      out: 'medailon-frame.webp',      w: 384,  h: 384 },
  { in: 'welcome-arch.webp',        out: 'welcome-arch.webp',        w: 1280, h: 720,  fit: 'contain', sharper: true },
  { in: 'rune-circle-floor.png',    out: 'rune-circle-floor.webp',   w: 1600, h: 400,  fit: 'contain', sharper: true, whiteBgKey: true, fromSource: true },
  { in: 'wolfshield-divider.webp',  out: 'wolfshield-divider.webp',  w: 800,  h: 100,  fit: 'contain', sharper: true },
  { in: 'rune-knot-seal.webp',      out: 'rune-knot-seal.webp',      w: 128,  h: 128 },
  { in: 'icon-uvodnik.webp',        out: 'icon-uvodnik.webp',        w: 96,   h: 96 },
  { in: 'icon-vytvorit-svet.webp',  out: 'icon-vytvorit-svet.webp',  w: 96,   h: 96 },
  { in: 'icon-diskuze.webp',        out: 'icon-diskuze.webp',        w: 96,   h: 96 },
  { in: 'icon-clanky.webp',         out: 'icon-clanky.webp',         w: 96,   h: 96 },
  { in: 'icon-galerie.webp',        out: 'icon-galerie.webp',        w: 96,   h: 96 },
  { in: 'icon-napoveda.webp',       out: 'icon-napoveda.webp',       w: 96,   h: 96 },
  { in: 'icon-matrix.webp',         out: 'icon-matrix.webp',         w: 96,   h: 96 },
  { in: 'icon-novy-svet.webp',      out: 'icon-novy-svet.webp',      w: 96,   h: 96 },
  { in: 'icon-hospoda.webp',        out: 'icon-hospoda.webp',        w: 96,   h: 96 },
  { in: 'icon-chat.webp',           out: 'icon-chat.webp',           w: 96,   h: 96 },
];

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
  console.log(`✓ ${inFile} → ${outFile} (${w}×${h}, ${(s.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log('[severske-runy] Finalizing decor assets...');
  for (const task of TASKS) {
    try { await processOne(task); }
    catch (err) { console.error(`✗ ${task.in}: ${err.message}`); }
  }
  console.log('[severske-runy] Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
