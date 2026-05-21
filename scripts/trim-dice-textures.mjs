#!/usr/bin/env node
/**
 * Krok 6.3 D-NEW-dice-texture-trim — odstraní z `public/textures/` všechny
 * soubory, které nejsou referencované ze `src/features/world/chat/dice/lib/
 * diceSkins.ts`.
 *
 * Use case: starý Matrix dodal ~1820 textur do `public/textures/`, ale
 * `diceSkins.ts` (~30 skinů × ~70 polí) na všechny nemusí ukazovat —
 * některé skiny mají jen Fate facePlus/Minus/Blank a chybí jim polyhedral
 * sada. Zbytečné soubory zbytečně bobtnají repo.
 *
 * Provoz:
 *   node scripts/trim-dice-textures.mjs --dry-run   # report bez mazání
 *   node scripts/trim-dice-textures.mjs             # opravdové smazání
 *
 * Idempotentní — po opravdu spuštění už nemá co mazat.
 */

import { readFileSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { join, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SKINS_FILE = join(
  ROOT,
  'src/features/world/chat/dice/lib/diceSkins.ts',
);
const TEXTURES_DIR = join(ROOT, 'public/textures');

const dryRun = process.argv.includes('--dry-run');

// 1) Vytěžit všechny `/textures/...` reference z diceSkins.ts.
const skinsSource = readFileSync(SKINS_FILE, 'utf8');
const TEXTURE_PATTERN = /\/textures\/([^'")\s]+)/g;
const referencedFiles = new Set();
let match;
while ((match = TEXTURE_PATTERN.exec(skinsSource)) !== null) {
  referencedFiles.add(match[1]);
}

// 2) Projít fyzický obsah public/textures/.
let physicalFiles;
try {
  physicalFiles = readdirSync(TEXTURES_DIR);
} catch (err) {
  console.error(`Nelze číst ${TEXTURES_DIR}: ${err.message}`);
  process.exit(1);
}

// 3) Identifikovat neodkazované soubory.
const orphans = [];
let totalSize = 0;
for (const filename of physicalFiles) {
  const fullPath = join(TEXTURES_DIR, filename);
  const st = statSync(fullPath);
  if (!st.isFile()) continue;
  if (!referencedFiles.has(filename)) {
    orphans.push({ filename, size: st.size });
    totalSize += st.size;
  }
}

// 4) Report + mazání.
console.log(`Skin reference v diceSkins.ts: ${referencedFiles.size}`);
console.log(`Fyzicky v public/textures/:   ${physicalFiles.length}`);
console.log(`Nepoužité (osiřelé):          ${orphans.length}`);
console.log(`Celková velikost orphans:     ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

if (orphans.length === 0) {
  console.log('Nic ke smazání. ✅');
  process.exit(0);
}

if (dryRun) {
  console.log('\n--dry-run režim: žádné soubory nebyly smazány.');
  console.log('Příklady prvních 20 orphans:');
  for (const o of orphans.slice(0, 20)) {
    console.log(`  ${o.filename} (${(o.size / 1024).toFixed(1)} KB)`);
  }
  if (orphans.length > 20) {
    console.log(`  ... a dalších ${orphans.length - 20}.`);
  }
  process.exit(0);
}

// 5) Opravdu smazat.
console.log('\nMažu osiřelé soubory...');
let deleted = 0;
for (const { filename } of orphans) {
  try {
    unlinkSync(join(TEXTURES_DIR, filename));
    deleted++;
  } catch (err) {
    console.error(`  ✗ ${filename}: ${err.message}`);
  }
}
console.log(`Smazáno ${deleted}/${orphans.length} souborů.`);
console.log(`Uvolněno ${(totalSize / 1024 / 1024).toFixed(2)} MB.`);
console.log(
  `Spusť \`git add public/textures && git status\` pro ověření změny v repu.`,
);
