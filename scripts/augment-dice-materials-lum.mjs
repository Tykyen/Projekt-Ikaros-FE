/**
 * Doplní do manifestu materiálů příznak `light` (světlý povrch) podle
 * průměrného jasu textury. Použije se pro volbu barvy čísla na kostce
 * (tmavé číslo na světlém materiálu, světlé na tmavém).
 *
 * Spuštění: node scripts/augment-dice-materials-lum.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs';

sharp.cache(false);
sharp.concurrency(1);

const MANIFEST = 'src/features/world/chat/dice/lib/dice3dMaterials.generated.json';
const LIGHT_THRESHOLD = 150; // perceived luminance 0..255

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  for (const m of manifest) {
    const file = `public/dice-box/${m.source}`;
    try {
      const { channels } = await sharp(file).stats();
      const [r, g, b] = channels;
      const lum = 0.299 * r.mean + 0.587 * g.mean + 0.114 * b.mean;
      m.light = lum > LIGHT_THRESHOLD;
      m.lum = Math.round(lum);
    } catch (e) {
      m.light = false;
      console.log(`! ${m.id}: ${e.message}`);
    }
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  const light = manifest.filter((m) => m.light);
  console.log(`✓ ${manifest.length} materiálů, světlých: ${light.length}`);
  console.log('  světlé:', light.map((m) => m.id).join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
