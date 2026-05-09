import { readdir, mkdir, stat, rename, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Po 1.6b: zdrojáky v assets-source/themes/, slug filenames (žádná diakritika).
// references/ → 320×180 thumbnails (vizuální náhled tématu, jiný obrázek než bg)
// backgrounds/ → 1920×1080 fullscreen background

const SRC_BASE = path.resolve('assets-source/themes');
const OUT_BASE = path.resolve('public/themes');

const TARGETS = [
  { src: 'references',  out: 'thumbnails',  width: 320,  height: 180,  quality: 82 },
  { src: 'backgrounds', out: 'backgrounds', width: 1920, height: 1080, quality: 80 },
];

async function processDir(target) {
  const { src, out, width, height, quality } = target;
  const srcDir = path.join(SRC_BASE, src);
  const outDir = path.join(OUT_BASE, out);

  if (!existsSync(srcDir)) {
    console.warn(`[themes] ${srcDir} neexistuje, skip`);
    return;
  }

  await mkdir(outDir, { recursive: true });

  const entries = await readdir(srcDir, { withFileTypes: true });
  const pngs = entries
    .filter((e) => e.isFile() && /\.png$/i.test(e.name))
    .map((e) => e.name);

  for (const file of pngs) {
    const srcPath = path.join(srcDir, file);
    const outName = file.toLowerCase().replace(/\.png$/i, '.webp');
    const outPath = path.join(outDir, outName);

    try {
      await sharp(srcPath)
        .resize(width, height, { fit: 'cover', position: 'center', withoutEnlargement: true })
        .webp({ quality })
        .toFile(outPath);
      const stats = await stat(outPath);
      console.log(`✓ ${file} → ${outName} (${(stats.size / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`✗ ${file}: ${err.message}`);
    }
  }
}

/**
 * Decor PNGs (logo, medailony, ornamenty per téma).
 * Zdroj: assets-source/themes/<themeId>/*.png
 * Cíl:   public/themes/<themeId>/decor/<name>.webp
 * Bez resize — zachová originální rozměry, jen WebP komprese.
 *
 * Chroma-key fallback: pokud PNG nemá alpha kanál, bílé pozadí (RGB ≥ 252)
 * převedeme na transparent + near-white (235–252) na soft fade pro antialiased
 * hrany. PNG s alpha kanálem projdou bez zásahu.
 */
const ACHROMATIC_TOLERANCE = 8; // max - min ≤ 8 → pixel je v podstatě šedý
const BRIGHT_HARD = 200;        // bright bg: ≥ 200 transparent
const BRIGHT_SOFT = 180;        // bright bg: [180, 200] fade
const DARK_HARD = 30;           // dark bg: ≤ 30 transparent
const DARK_SOFT = 55;           // dark bg: [30, 55] fade
const CORNER_LUM_TOLERANCE = 30;// rohy se musí lišit max o 30 luminance

/**
 * Detekuje pozadí z rohů. Vrací 'bright' / 'dark' / null.
 * Skipuje rohy s alpha < 255 (= reálně průhledný PNG → bg je už vyřešený).
 * Pokud opaque rohy nejsou konzistentně achromatic + uniform luminance, vrátí null.
 */
async function detectBgMode(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels; // 4 po ensureAlpha
  const corners = [[5, 5], [W - 5, 5], [5, H - 5], [W - 5, H - 5]];
  const lums = [];
  for (const [x, y] of corners) {
    const i = (y * W + x) * C;
    const a = data[i + 3];
    if (a < 255) continue; // skip semi/plně transparentní rohy
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (Math.max(r, g, b) - Math.min(r, g, b) > ACHROMATIC_TOLERANCE) return null;
    lums.push((r + g + b) / 3);
  }
  if (lums.length < 2) return null; // málo opaque dat = už průhledné
  if (Math.max(...lums) - Math.min(...lums) > CORNER_LUM_TOLERANCE) return null;
  const avg = lums.reduce((a, b) => a + b) / lums.length;
  if (avg >= BRIGHT_SOFT) return 'bright';
  if (avg <= DARK_SOFT) return 'dark';
  return null;
}

async function chromaKey(srcPath, outPath, mode) {
  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (Math.max(r, g, b) - Math.min(r, g, b) > ACHROMATIC_TOLERANCE) continue;
    const lum = (r + g + b) / 3;
    if (mode === 'bright') {
      if (lum >= BRIGHT_HARD) data[i + 3] = 0;
      else if (lum >= BRIGHT_SOFT) {
        const fade = 1 - (lum - BRIGHT_SOFT) / (BRIGHT_HARD - BRIGHT_SOFT);
        const desired = Math.round(255 * fade);
        if (data[i + 3] > desired) data[i + 3] = desired;
      }
    } else if (mode === 'dark') {
      if (lum <= DARK_HARD) data[i + 3] = 0;
      else if (lum <= DARK_SOFT) {
        const fade = 1 - (DARK_SOFT - lum) / (DARK_SOFT - DARK_HARD);
        const desired = Math.round(255 * fade);
        if (data[i + 3] > desired) data[i + 3] = desired;
      }
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 85 })
    .toFile(outPath);
}

async function processDecor() {
  if (!existsSync(SRC_BASE)) return;
  const entries = await readdir(SRC_BASE, { withFileTypes: true });
  const themeDirs = entries
    .filter((e) => e.isDirectory() && !['references', 'backgrounds'].includes(e.name))
    .map((e) => e.name);

  for (const themeId of themeDirs) {
    const srcDir = path.join(SRC_BASE, themeId);
    const outDir = path.join(OUT_BASE, themeId, 'decor');
    const files = (await readdir(srcDir, { withFileTypes: true }))
      .filter((e) => e.isFile() && /\.png$/i.test(e.name))
      .map((e) => e.name);
    if (files.length === 0) continue;
    await mkdir(outDir, { recursive: true });
    for (const file of files) {
      const srcPath = path.join(srcDir, file);
      const outName = file.toLowerCase().replace(/\.png$/i, '.webp');
      const outPath = path.join(outDir, outName);
      // Loga mívají velké průhledné okraje od AI generátorů — auto-trim na bounding box obsahu.
      const isLogo = /^logo\.png$/i.test(file);
      // Page-frame corner ornament: vygenerujeme 4 mirror varianty (tl/tr/bl/br) pro 4 rohy viewportu.
      const isPageFrame = /^page-frame-corner\.png$/i.test(file);
      // Nav end-cap: vygenerujeme 2 mirror varianty (-l, -r) pro oba konce sekčních dividerů + nav button rámečků.
      const isNavEndCap = /^nav-end-cap\.png$/i.test(file);
      try {
        let note = '';
        if (isLogo) {
          // Logo pipeline: chroma-key (white → transparent) + trim → WebP, vše v paměti
          // jedním sharp instance (Windows má file-lock issues s read+write na stejný path).
          const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (Math.max(r, g, b) - Math.min(r, g, b) > ACHROMATIC_TOLERANCE) continue;
            const lum = (r + g + b) / 3;
            if (lum >= BRIGHT_HARD) data[i + 3] = 0;
            else if (lum >= BRIGHT_SOFT) {
              const fade = 1 - (lum - BRIGHT_SOFT) / (BRIGHT_HARD - BRIGHT_SOFT);
              const desired = Math.round(255 * fade);
              if (data[i + 3] > desired) data[i + 3] = desired;
            }
          }
          const out = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
            .trim()
            .webp({ quality: 88 })
            .toFile(outPath);
          note = ` [chroma-keyed bright + trimmed → ${out.width}×${out.height}]`;
        } else {
          const mode = await detectBgMode(srcPath);
          if (mode) {
            await chromaKey(srcPath, outPath, mode);
            note = ` [chroma-keyed: ${mode}]`;
          } else {
            await sharp(srcPath).webp({ quality: 85 }).toFile(outPath);
            note = ' [pass-through: alpha or non-uniform bg]';
          }
        }
        const stats = await stat(outPath);
        console.log(`✓ ${themeId}/${file} → decor/${outName} (${(stats.size / 1024).toFixed(0)} KB)${note}`);

        // Page-frame corner: dodatečně vygeneruj tr/bl/br varianty z chroma-keyed bufferu
        if (isPageFrame) {
          const baseBuf = await sharp(outPath).toBuffer();
          const variants = [
            { suffix: '-tr', op: (s) => s.flop() },           // mirror horizontal
            { suffix: '-bl', op: (s) => s.flip() },           // mirror vertical
            { suffix: '-br', op: (s) => s.flip().flop() },    // both
          ];
          for (const v of variants) {
            const variantPath = path.join(outDir, outName.replace(/\.webp$/, v.suffix + '.webp'));
            await v.op(sharp(baseBuf)).webp({ quality: 85 }).toFile(variantPath);
          }
          // Rename TL variant to make naming consistent
          const tlPath = path.join(outDir, outName.replace(/\.webp$/, '-tl.webp'));
          if (existsSync(tlPath)) await unlink(tlPath);
          await rename(outPath, tlPath);
          console.log(`  + ${themeId}/${file} mirrors: -tl, -tr, -bl, -br`);
        }

        // Nav end-cap: zdrojový PNG má jewel vpravo (= -r). Vygenerujeme -l přes flop.
        if (isNavEndCap) {
          const baseBuf = await sharp(outPath).toBuffer();
          const lPath = path.join(outDir, outName.replace(/\.webp$/, '-l.webp'));
          const rPath = path.join(outDir, outName.replace(/\.webp$/, '-r.webp'));
          await Promise.all([
            sharp(baseBuf).flop().webp({ quality: 85 }).toFile(lPath),
            sharp(baseBuf).webp({ quality: 85 }).toFile(rPath),
          ]);
          // Drop the unsuffixed original (only -l + -r are referenced from CSS).
          if (existsSync(outPath)) {
            try { await unlink(outPath); } catch { /* Windows lock — ponecháme, je idempotent */ }
          }
          console.log(`  + ${themeId}/${file} mirrors: -l, -r`);
        }
      } catch (err) {
        console.error(`✗ ${themeId}/${file}: ${err.message}`);
      }
    }
  }
}

async function main() {
  console.log('[themes] Optimizing assets...');
  for (const target of TARGETS) {
    await processDir(target);
  }
  await processDecor();
  console.log('[themes] Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
