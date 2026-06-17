/**
 * Optimalizace materiálových textur 3D kostek.
 *
 * Vstup:  public/dice-box/textures/skins/<Skupina>/<Český Název>.png  (1254², ~3 MB)
 * Výstup: public/dice-box/textures/skins/<group-slug>/<name-slug>.webp (640², ~40 KB)
 *       + src/features/world/chat/dice/lib/dice3dMaterials.generated.json (manifest)
 *
 * Originály se PŘESUNOU do zálohy mimo repo (BACKUP_DIR), ať se nic neztratí.
 * Idempotentní/resumovatelné — zdrojové (české) složky zpracuje, slug složky ignoruje.
 *
 * Spuštění: node scripts/optimize-dice-skins.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

// Stabilita na Windows — bez tohoto libvips občas nativně spadne
// (STATUS_STACK_BUFFER_OVERRUN) při dávce mnoha obrázků.
sharp.cache(false);
sharp.concurrency(1);

const ROOT = 'public/dice-box/textures/skins';
const OUT_SIZE = 640;
const QUALITY = 82;
const MANIFEST = 'src/features/world/chat/dice/lib/dice3dMaterials.generated.json';
const BACKUP_DIR = 'C:/tmp/dice-skins-src-backup';

const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // odstraň kombinující diakritiku
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isGroupDir = (d) => fs.statSync(path.join(ROOT, d)).isDirectory();
// Zdrojová skupina = český název (≠ vlastní slug). Slug složky přeskoč.
const isSourceGroup = (d) => isGroupDir(d) && d !== slug(d);

async function processOne(srcAbs, outAbs) {
  await sharp(srcAbs)
    .resize(OUT_SIZE, OUT_SIZE, { fit: 'cover' })
    .webp({ quality: QUALITY })
    .toFile(outAbs);
}

async function main() {
  const groups = fs.readdirSync(ROOT).filter(isSourceGroup);
  if (groups.length === 0) {
    console.log('Žádné zdrojové (české) skupiny — vše už zpracováno.');
    return;
  }
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  // Načti případný dřívější manifest (resumovatelnost).
  const byId = new Map();
  if (fs.existsSync(MANIFEST)) {
    try {
      for (const m of JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))) byId.set(m.id, m);
    } catch {
      /* poškozený → přepíšeme */
    }
  }
  const writeManifest = () => {
    const merged = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
    fs.writeFileSync(MANIFEST, JSON.stringify(merged, null, 2) + '\n');
    return merged.length;
  };

  let ok = 0;
  const failed = [];

  for (const group of groups) {
    const groupSlug = slug(group);
    const srcDir = path.join(ROOT, group);
    const outDir = path.join(ROOT, groupSlug);
    fs.mkdirSync(outDir, { recursive: true });

    const files = fs
      .readdirSync(srcDir)
      .filter((f) => /\.(png|jpe?g|webp)$/i.test(f));

    for (const file of files) {
      const baseCzech = file.replace(/\.[^.]+$/, '');
      const nameSlug = slug(baseCzech);
      const outRel = `textures/skins/${groupSlug}/${nameSlug}.webp`;
      const outAbs = path.join('public/dice-box', outRel);
      try {
        await processOne(path.join(srcDir, file), outAbs);
        byId.set(`${groupSlug}-${nameSlug}`, {
          id: `${groupSlug}-${nameSlug}`,
          group,
          groupSlug,
          name: baseCzech,
          source: outRel,
        });
        ok++;
      } catch (e) {
        failed.push(`${group}/${file}: ${e.message}`);
      }
    }

    // Manifest zapsat PŘED přesunem zdroje (durabilita při pádu).
    writeManifest();
    const dest = path.join(BACKUP_DIR, group);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.renameSync(srcDir, dest);
  }

  const total = writeManifest();
  console.log(`✓ zpracováno tento běh: ${ok}, manifest celkem: ${total}`);
  if (failed.length) console.log(`✗ selhalo (${failed.length}):\n  ${failed.join('\n  ')}`);
  console.log(`✓ originály přesunuty: ${BACKUP_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
