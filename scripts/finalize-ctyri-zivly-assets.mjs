import sharp from 'sharp';
import path from 'node:path';
import { stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Post-process ctyri-zivly decor: resize všech AI assetů na cílové rozměry.
// logo + medailon ponecháváme v originálních rozměrech (logo je horizontal banner
// s baked-in textem; medailon je square s baked-in 4-elementální kompozicí).
// Spustit po `npm run themes:optimize`.
//
// Windows: nečteme+nepíšeme do stejného souboru přímo (file lock) —
// místo toho readFile do bufferu, sharp z bufferu, pak writeFile výstup.

const DECOR = path.resolve('public/themes/ctyri-zivly/decor');
const THUMBNAILS = path.resolve('public/themes/thumbnails');

const TASKS = [
  { in: 'corner-tl.webp',          out: 'corner-tl.webp',          w: 256,  h: 256 },
  { in: 'cardinal-ruby.webp',      out: 'cardinal-ruby.webp',      w: 128,  h: 128 },
  { in: 'cardinal-sapphire.webp',  out: 'cardinal-sapphire.webp',  w: 128,  h: 128 },
  { in: 'cardinal-emerald.webp',   out: 'cardinal-emerald.webp',   w: 128,  h: 128 },
  { in: 'cardinal-topaz.webp',     out: 'cardinal-topaz.webp',     w: 128,  h: 128 },
  { in: 'compass.webp',            out: 'compass.webp',            w: 384,  h: 384 },
  { in: 'divider-chain.webp',      out: 'divider-chain.webp',      w: 800,  h: 128, fit: 'contain', sharper: true },
  { in: 'icon-uvodnik.webp',       out: 'icon-uvodnik.webp',       w: 96,   h: 96 },
  { in: 'icon-vytvorit-svet.webp', out: 'icon-vytvorit-svet.webp', w: 96,   h: 96 },
  { in: 'icon-diskuze.webp',       out: 'icon-diskuze.webp',       w: 96,   h: 96 },
  { in: 'icon-clanky.webp',        out: 'icon-clanky.webp',        w: 96,   h: 96 },
  { in: 'icon-galerie.webp',       out: 'icon-galerie.webp',       w: 96,   h: 96 },
  { in: 'icon-napoveda.webp',      out: 'icon-napoveda.webp',      w: 96,   h: 96 },
  { in: 'icon-hospoda.webp',       out: 'icon-hospoda.webp',       w: 96,   h: 96 },
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

async function ensureThumbnail() {
  const thumbPath = path.join(THUMBNAILS, 'ctyri-zivly.webp');
  if (existsSync(thumbPath)) {
    console.log(`✓ thumbnail ctyri-zivly.webp už existuje`);
    return;
  }
  const medailonPath = path.join(DECOR, 'medailon.webp');
  if (!existsSync(medailonPath)) {
    console.warn(`✗ medailon.webp neexistuje, nelze vygenerovat thumbnail`);
    return;
  }
  const buf = await readFile(medailonPath);
  const outBuf = await sharp(buf)
    .resize(320, 180, { fit: 'cover', position: 'center' })
    .sharpen({ sigma: 0.6 })
    .webp({ quality: 82, alphaQuality: 100 })
    .toBuffer();
  await writeFile(thumbPath, outBuf);
  const s = await stat(thumbPath);
  console.log(`✓ thumbnail ctyri-zivly.webp vygenerován z medailonu (320×180, ${(s.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log('[ctyri-zivly] Finalizing decor assets...');
  for (const task of TASKS) {
    try { await processOne(task); }
    catch (err) { console.error(`✗ ${task.in}: ${err.message}`); }
  }
  console.log('[ctyri-zivly] Generating thumbnail (if missing)...');
  try { await ensureThumbnail(); }
  catch (err) { console.error(`✗ thumbnail: ${err.message}`); }
  console.log('[ctyri-zivly] Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
