#!/usr/bin/env node
/**
 * Krok 6.3 D-NEW-dice-texture-hosting — přepíše `/textures/...` URL v
 * `diceSkins.ts` na Cloudinary URL podle mappingu z `dice-textures-cdn.json`.
 *
 * Vstup:  scripts/dice-textures-cdn.json (z upload-dice-textures-to-cloudinary.mjs)
 * Výstup: src/features/world/chat/dice/lib/diceSkins.ts (přepsaný in-place)
 *
 * Idempotentní:
 * - Pokud URL v diceSkins.ts už začíná `https://`, nepřepíše.
 * - Pokud filename v `/textures/X` není v mapping, varuje a ponechá.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MAPPING_FILE = resolve(ROOT, 'scripts/dice-textures-cdn.json');
const SKINS_FILE = resolve(
  ROOT,
  'src/features/world/chat/dice/lib/diceSkins.ts',
);

const mapping = JSON.parse(readFileSync(MAPPING_FILE, 'utf8'));
console.log(`Mapping: ${Object.keys(mapping).length} souborů`);

let src = readFileSync(SKINS_FILE, 'utf8');
const before = src.length;

let replaced = 0;
let missing = 0;
const missingFiles = new Set();

// Regex matchne `/textures/<filename>` v jednoduchých nebo dvojitých uvozovkách.
src = src.replace(/(['"])\/textures\/([^'"]+)\1/g, (full, quote, filename) => {
  const entry = mapping[filename];
  if (!entry) {
    missing++;
    missingFiles.add(filename);
    return full; // nepřepisuj — varuj
  }
  replaced++;
  return `${quote}${entry.secureUrl}${quote}`;
});

writeFileSync(SKINS_FILE, src, 'utf8');
const after = src.length;

console.log(`Přepsáno: ${replaced} URL`);
console.log(`Nepřepsáno (chybí v mapping): ${missing}`);
console.log(`Velikost souboru: ${before} → ${after} bytes (Δ ${after - before})`);

if (missing > 0) {
  console.log('\n⚠ Chybějící mapping (prvních 20):');
  for (const f of Array.from(missingFiles).slice(0, 20)) {
    console.log(`  ${f}`);
  }
  if (missingFiles.size > 20) {
    console.log(`  ... a dalších ${missingFiles.size - 20}.`);
  }
  console.log(
    '\nSpusť upload skript znovu nebo dodej textury do public/textures/.',
  );
}
