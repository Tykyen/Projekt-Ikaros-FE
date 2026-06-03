import sharp from 'sharp';
import path from 'node:path';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Orphan dark-background assety bez vlastního per-theme finalize skriptu.
// Source PNG mají plné ČERNÉ pozadí (ne bílé) — generický optimize pass-through
// alfu nevytvořil → na světlejším pozadí welcome karty prosvítal tmavý obdélník.
// Flood-fill od okrajů odstraní jen souvislé tmavé pozadí, vnitřek rámu zachová.
//
// mild=true → skip HSV saturation + inward propagation pásy (světlý/neon angel
// content by se jinak rozežral na ducha).

const SRC_BASE = path.resolve('assets-source/themes');
const OUT_BASE = path.resolve('public/themes');

const TASKS = [
  { theme: 'kyberpunk',    in: 'medailon.png',         out: 'medailon.webp',         w: 600,  h: null, mild: true },
  { theme: 'vesmirna-lod', in: 'andel-medallion.png',  out: 'andel-medallion.webp',  w: 600,  h: 600,  mild: true },
  { theme: 'sci-fi',       in: 'logo.png',             out: 'logo.webp',             w: 1200, h: null, mild: true, trim: true, sharper: true },
];

async function removeFlatBackground(buf, mild = false) {
  const src = sharp(buf).ensureAlpha();
  const meta = await src.metadata();
  const W = meta.width, H = meta.height;
  const raw = await src.raw().toBuffer();

  const M = 16;
  const samples = [];
  for (let k = 0; k < M; k++) {
    const x = ((k + 0.5) / M * W) | 0;
    const y = ((k + 0.5) / M * H) | 0;
    samples.push(x, (H - 1) * W + x, y * W, y * W + (W - 1));
  }
  let sumL = 0, n = 0;
  for (const idx of samples) {
    const i = idx * 4;
    const r = raw[i], g = raw[i + 1], b = raw[i + 2];
    if (Math.abs(r - g) > 12 || Math.abs(g - b) > 12) continue;
    sumL += 0.299 * r + 0.587 * g + 0.114 * b;
    n++;
  }
  const bgLuma = n > 0 ? sumL / n : 255;
  const isCheckerboard = bgLuma >= 60 && bgLuma <= 200;
  const lumaLo = isCheckerboard ? 60 : bgLuma - 28;
  const lumaHi = isCheckerboard ? 230 : bgLuma + 28;
  console.log(`  BG luma=${bgLuma.toFixed(0)} (${isCheckerboard ? 'checkerboard' : 'solid'})`);

  const visited = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) { stack.push(x, (H - 1) * W + x); }
  for (let y = 0; y < H; y++) { stack.push(y * W, y * W + (W - 1)); }

  const isBg = (r, g, b) => {
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luma < lumaLo || luma > lumaHi) return false;
    if (Math.abs(r - g) > 14 || Math.abs(g - b) > 14) return false;
    return true;
  };

  while (stack.length) {
    const idx = stack.pop();
    if (visited[idx]) continue;
    visited[idx] = 1;
    const i = idx * 4;
    if (!isBg(raw[i], raw[i + 1], raw[i + 2])) continue;
    raw[i + 3] = 0;
    const x = idx % W, y = (idx / W) | 0;
    if (x > 0) stack.push(idx - 1);
    if (x < W - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - W);
    if (y < H - 1) stack.push(idx + W);
  }

  if (!mild) for (let i = 0; i < raw.length; i += 4) {
    if (raw[i + 3] < 32) continue;
    const r = raw[i], g = raw[i + 1], b = raw[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat < 0.35) raw[i + 3] = Math.round(raw[i + 3] * Math.pow(sat / 0.35, 1.4));
  }

  // Hard alpha threshold — clean edges
  for (let i = 0; i < raw.length; i += 4) {
    const a = raw[i + 3];
    if (a === 0 || a === 255) continue;
    if (a < 80) raw[i + 3] = 0;
    else if (a > 200) raw[i + 3] = 255;
    else { const t = (a - 80) / 120; raw[i + 3] = Math.round(t * t * (3 - 2 * t) * 255); }
  }

  return sharp(raw, { raw: { width: W, height: H, channels: 4 } });
}

async function processOne({ theme, in: inFile, out: outFile, w, h, mild, trim, sharper }) {
  const inPath = path.join(SRC_BASE, theme, inFile);
  const outPath = path.join(OUT_BASE, theme, 'decor', outFile);
  if (!existsSync(inPath)) { console.warn(`✗ ${theme}/${inFile} neexistuje, skip`); return; }
  const buf = await readFile(inPath);
  let pipeline = await removeFlatBackground(buf, mild);
  if (trim) pipeline = pipeline.trim({ threshold: 5 });
  if (h === null) pipeline = pipeline.resize({ width: w, withoutEnlargement: true });
  else pipeline = pipeline.resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  pipeline = sharper ? pipeline.sharpen({ sigma: 0.6 }) : pipeline.sharpen({ sigma: 0.4 });
  const outBuf = await pipeline.webp({ quality: 92, alphaQuality: 100 }).toBuffer();
  await writeFile(outPath, outBuf);
  const s = await stat(outPath);
  const m = await sharp(outBuf).metadata();
  console.log(`✓ ${theme}/${inFile} → decor/${outFile} (${m.width}×${m.height}, alpha=${m.hasAlpha}, ${(s.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log('[dark-medallions] Finalizing orphan dark-bg assets...');
  for (const task of TASKS) {
    try { await processOne(task); } catch (e) { console.error(`✗ ${task.theme}/${task.in}: ${e.message}`); }
  }
  console.log('[dark-medallions] Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
