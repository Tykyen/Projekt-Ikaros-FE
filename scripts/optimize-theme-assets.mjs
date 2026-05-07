import { readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC_BASE = path.resolve('docs/themes/assets');
const OUT_BASE = path.resolve('public/themes');

// Thumbnaily čteme z root assets/ (současné mockupy s diakritikou).
// Backgrounds čteme z assets/backgrounds/ (slugified PNGs dodané PJ).
const TARGETS = [
  { src: '.',           out: 'thumbnails',  width: 320,  height: 180,  quality: 82 },
  { src: 'backgrounds', out: 'backgrounds', width: 1920, height: 1080, quality: 80 },
];

// Mapping diakritiky / mezer / překlepů → ASCII slug (theme ID).
const FILENAME_MAP = {
  'Modré nebe.png': 'modre-nebe.png',
  'Zlatý standart.png': 'zlaty-standard.png',
  'Sci-fi.png': 'sci-fi.png',
  'Bílá.png': 'bila.png',
  'Vesmírná loď.png': 'vesmirna-lod.png',
  'Příroda.png': 'priroda.png',
  'Pergamen.png': 'pergamen.png',
  'Nemrtví.png': 'nemrtvi.png',
  'Čtyři živly.png': 'ctyri-zivly.png',
  'Vesmírná bitva.png': 'vesmirna-bitva.png',
  'Hospoda.png': 'hospoda.png',
  'Severské runy.png': 'severske-runy.png',
  'Indiáni.png': 'indiane.png',
  'Afrika.png': 'africke.png',
  'Arábie.png': 'arabsky-svet.png',
  'Kyberpunk.png': 'kyberpunk.png',
  'Apokalypsa.png': 'postapo.png',
  'Temná červeň.png': 'temna-cerven.png',
  'Magie.png': 'magie.png',
  'Měsíc.png': 'mesic.png',
  'Slunce.png': 'slunce.png',
};

function slugify(filename) {
  return FILENAME_MAP[filename] ?? filename.toLowerCase();
}

async function processDir(target) {
  const { src, out, width, height, quality } = target;
  const srcDir = path.join(SRC_BASE, src);
  const outDir = path.join(OUT_BASE, out);

  if (!existsSync(srcDir)) {
    console.warn(`[themes] ${srcDir} neexistuje, skip`);
    return;
  }

  await mkdir(outDir, { recursive: true });

  // withFileTypes: true → odfiltruje subdirectories (důležité pro src: '.' aby nezpracoval backgrounds/)
  const entries = await readdir(srcDir, { withFileTypes: true });
  const pngs = entries
    .filter((e) => e.isFile() && /\.png$/i.test(e.name))
    .map((e) => e.name);

  for (const file of pngs) {
    const srcPath = path.join(srcDir, file);
    const outName = slugify(file).replace(/\.png$/i, '.webp');
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
