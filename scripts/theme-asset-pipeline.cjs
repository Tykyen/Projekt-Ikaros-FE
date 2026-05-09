// Theme asset PNG → transparent WebP pipeline.
// Reusable: pass theme name as arg. Looks for assets-source/themes/<name>/ and writes to public/themes/<name>/decor/.
// Per-theme config below.

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Per-theme asset configs. Each entry: { w, h, q, mode: 'white'|'dark', lumaCut, neutral? }
const THEMES = {
  'vesmirna-lod': {
    'logo':            { w: 1086, h: 362, q: 90, mode: 'white', lumaCut: 232, neutral: true },
    'andel-medallion': { w: 600,  h: 600, q: 92, mode: 'dark',  lumaCut: 22,  neutral: false },
  },
};

async function processOne(themeName, name, cfg) {
  const inPath  = path.join(ROOT, 'assets-source', 'themes', themeName, name + '.png');
  const outPath = path.join(ROOT, 'public', 'themes', themeName, 'decor', name + '.webp');
  if (!fs.existsSync(inPath)) {
    console.log(`SKIP  ${name} — input missing (${inPath})`);
    return;
  }

  const src = sharp(inPath).ensureAlpha();
  const meta = await src.metadata();
  const W = meta.width, H = meta.height;
  const raw = await src.raw().toBuffer();

  // Flood-fill from edges
  const N = W * H;
  const visited = new Uint8Array(N);
  const stack = [];
  for (let x = 0; x < W; x++) { stack.push(x); stack.push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { stack.push(y * W); stack.push(y * W + (W - 1)); }

  const isBg = (r, g, b) => {
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (cfg.mode === 'white') {
      if (luma < cfg.lumaCut) return false;
      if (cfg.neutral && (Math.abs(r - g) > 8 || Math.abs(g - b) > 8)) return false;
      return true;
    }
    return luma < cfg.lumaCut;
  };

  let cleared = 0;
  while (stack.length) {
    const idx = stack.pop();
    if (visited[idx]) continue;
    visited[idx] = 1;
    const i = idx * 4;
    if (!isBg(raw[i], raw[i + 1], raw[i + 2])) continue;
    raw[i + 3] = 0;
    cleared++;
    const x = idx % W, y = (idx / W) | 0;
    if (x > 0)     stack.push(idx - 1);
    if (x < W - 1) stack.push(idx + 1);
    if (y > 0)     stack.push(idx - W);
    if (y < H - 1) stack.push(idx + W);
  }

  // Soft-edge alpha lerp (only edge pixels next to cleared neighbors)
  const ac = Buffer.from(raw);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const idx = y * W + x;
      const i = idx * 4;
      if (raw[i + 3] === 0) continue;
      let hasT = false;
      for (const ni of [idx - 1, idx + 1, idx - W, idx + W]) {
        if (raw[ni * 4 + 3] === 0) { hasT = true; break; }
      }
      if (!hasT) continue;
      const r = raw[i], g = raw[i + 1], b = raw[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (cfg.mode === 'white' && luma > 220) {
        const t = Math.max(0, Math.min(1, (cfg.lumaCut - luma) / 12));
        ac[i + 3] = Math.round(255 * t);
      } else if (cfg.mode === 'dark' && luma < 40) {
        const t = Math.max(0, Math.min(1, (luma - cfg.lumaCut) / 18));
        ac[i + 3] = Math.round(255 * t);
      }
    }
  }

  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const buf = await sharp(ac, { raw: { width: W, height: H, channels: 4 } })
    .resize(cfg.w, cfg.h, { fit: 'inside', kernel: 'lanczos3' })
    .webp({ quality: cfg.q, alphaQuality: 100, effort: 6 })
    .toBuffer();

  fs.writeFileSync(outPath, buf);
  const kb = (buf.length / 1024).toFixed(1);
  console.log(`OK    ${name.padEnd(20)} ${cfg.w}x${cfg.h}  ${kb} KB  cleared ${(cleared / N * 100).toFixed(1)}%  (${cfg.mode} bg)`);
}

(async () => {
  const themeName = process.argv[2];
  if (!themeName || !THEMES[themeName]) {
    console.log('Usage: node scripts/theme-asset-pipeline.cjs <theme-name>');
    console.log('Available themes:', Object.keys(THEMES).join(', '));
    process.exit(1);
  }
  for (const [name, cfg] of Object.entries(THEMES[themeName])) {
    try { await processOne(themeName, name, cfg); }
    catch (e) { console.log(`ERR   ${name}: ${e.message}`); }
  }
})();
