import { readdir, mkdir, stat } from 'node:fs/promises';
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

async function main() {
  console.log('[themes] Optimizing assets...');
  for (const target of TARGETS) {
    await processDir(target);
  }
  console.log('[themes] Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
