import sharp from 'sharp';
import path from 'node:path';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SRC = path.resolve('assets-source/themes/slunce');
const DECOR = path.resolve('public/themes/slunce/decor');

const TASKS = [
  { in: 'logo.png',         out: 'logo.webp',         w: 1200, h: null, q: 90, sharper: true },
  { in: 'medailon.png',     out: 'medailon.webp',     w: 600,  h: 600,  q: 92 },
  { in: 'sun-corner.png',   out: 'sun-corner.webp',   w: 256,  h: 256,  q: 92 },
  { in: 'flame-disc.png',   out: 'flame-disc.webp',   w: 512,  h: 512,  q: 92 },
];

async function removeFlatBackground(buf) {
  const src = sharp(buf).ensureAlpha();
  const meta = await src.metadata();
  const W = meta.width, H = meta.height;
  const raw = await src.raw().toBuffer();

  const M = 16;
  const samples = [];
  for (let k = 0; k < M; k++) {
    const x = ((k + 0.5) / M * W) | 0;
    const y = ((k + 0.5) / M * H) | 0;
    samples.push(x);
    samples.push((H - 1) * W + x);
    samples.push(y * W);
    samples.push(y * W + (W - 1));
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
  const lumaLo = isCheckerboard ? 60  : bgLuma - 28;
  const lumaHi = isCheckerboard ? 230 : bgLuma + 28;
  console.log(`  BG luma=${bgLuma.toFixed(0)} (${isCheckerboard ? 'checkerboard' : 'solid'})`);

  const visited = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) { stack.push(x); stack.push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { stack.push(y * W); stack.push(y * W + (W - 1)); }

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
    if (x > 0)     stack.push(idx - 1);
    if (x < W - 1) stack.push(idx + 1);
    if (y > 0)     stack.push(idx - W);
    if (y < H - 1) stack.push(idx + W);
  }

  for (let i = 0; i < raw.length; i += 4) {
    if (raw[i + 3] < 32) continue;
    const r = raw[i], g = raw[i + 1], b = raw[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat < 0.35) {
      const factor = Math.pow(sat / 0.35, 1.4);
      raw[i + 3] = Math.round(raw[i + 3] * factor);
    }
  }

  for (let pass = 0; pass < 6; pass++) {
    const snapshot = new Uint8ClampedArray(raw);
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const idx = y * W + x;
        const i = idx * 4;
        if (snapshot[i + 3] === 0) continue;
        let minNeighborAlpha = 255;
        for (const ni of [idx - 1, idx + 1, idx - W, idx + W]) {
          if (snapshot[ni * 4 + 3] < minNeighborAlpha) minNeighborAlpha = snapshot[ni * 4 + 3];
        }
        if (minNeighborAlpha >= snapshot[i + 3]) continue;
        const r = snapshot[i], g = snapshot[i + 1], b = snapshot[i + 2];
        const chroma = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
        if (chroma < 50) {
          const t = chroma / 50;
          const lerpFactor = t * t;
          raw[i + 3] = Math.round(snapshot[i + 3] * lerpFactor + minNeighborAlpha * (1 - lerpFactor));
        }
      }
    }
  }

  for (let i = 0; i < raw.length; i += 4) {
    const a = raw[i + 3];
    if (a === 0 || a === 255) continue;
    if (a < 80) {
      raw[i + 3] = 0;
    } else if (a > 200) {
      raw[i + 3] = 255;
    } else {
      const t = (a - 80) / (200 - 80);
      const smooth = t * t * (3 - 2 * t);
      raw[i + 3] = Math.round(smooth * 255);
    }
  }

  return sharp(raw, { raw: { width: W, height: H, channels: 4 } });
}

async function processOne({ in: inFile, out: outFile, w, h, q, sharper }) {
  const inPath = path.join(SRC, inFile);
  const outPath = path.join(DECOR, outFile);
  if (!existsSync(inPath)) {
    console.warn(`✗ ${inFile} neexistuje, skip`);
    return;
  }
  const buf = await readFile(inPath);
  let pipeline = await removeFlatBackground(buf);
  if (h === null) {
    pipeline = pipeline.resize({ width: w, withoutEnlargement: true });
  } else {
    pipeline = pipeline.resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }
  pipeline = sharper ? pipeline.sharpen({ sigma: 0.6 }) : pipeline.sharpen({ sigma: 0.4 });
  const outBuf = await pipeline.webp({ quality: q, alphaQuality: 100 }).toBuffer();
  await writeFile(outPath, outBuf);
  const s = await stat(outPath);
  const meta = await sharp(outBuf).metadata();
  console.log(`✓ ${inFile} → ${outFile} (${meta.width}×${meta.height}, alpha=${meta.hasAlpha}, ${(s.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  await mkdir(DECOR, { recursive: true });
  console.log('[slunce] Finalizing decor assets...');
  for (const task of TASKS) {
    try { await processOne(task); }
    catch (err) { console.error(`✗ ${task.in}: ${err.message}`); }
  }
  console.log('[slunce] Done.');
}

main();
