// Offline náhled tisku (14.7 pilíř A) — bez běžící appky/BE.
//
// Proč: tisk nešel ověřit lokálně → ladilo se naslepo přes deploy na produkci
// (chybový deník CH-004). Tenhle harness vezme fixture HTML + tiskové CSS,
// vyrenderuje je ve stejné izolované šabloně jako `usePrint` (samostatné okno),
// emuluje `@media print` a vyplivne PDF do `out/`. Smyčka ladění je tím lokální
// a deterministická.
//
// Použití:
//   node scripts/print-preview/preview.mjs                 # PRODUKČNÍ CSS
//   node scripts/print-preview/preview.mjs --css baseline  # baseline (srovnání)
//
// `doc` (default) = JEDINÝ zdroj pravdy printDoc.css (týž soubor jako produkce
// přes ?raw) → náhled = přesně produkční tisk. `baseline` = historický snímek
// v css/baseline.css. Fixtures v `fixtures/*.html`.

import { chromium } from 'playwright';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROD_CSS = join(
  HERE,
  '..',
  '..',
  'src',
  'features',
  'world',
  'export',
  'print',
  'printDoc.css',
);
const cssArg = process.argv.includes('--css')
  ? process.argv[process.argv.indexOf('--css') + 1]
  : 'doc';
const cssPath = cssArg === 'doc' ? PROD_CSS : join(HERE, 'css', `${cssArg}.css`);
const printCss = readFileSync(cssPath, 'utf8');

const fixturesDir = join(HERE, 'fixtures');
const outDir = join(HERE, 'out');
mkdirSync(outDir, { recursive: true });

// Stejný skelet jako tiskové okno v printMode.ts: čistý dokument, JEN tiskové
// CSS (žádné kopírované stylesheets appky — to byl zdroj CH-007/008).
function wrap(bodyHtml) {
  return `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8">
<title>Tisk — náhled</title><style>${printCss}</style></head>
<body>${bodyHtml}</body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage();
const fixtures = readdirSync(fixturesDir).filter((f) => f.endsWith('.html'));

for (const file of fixtures) {
  const name = basename(file, '.html');
  const html = readFileSync(join(fixturesDir, file), 'utf8');
  await page.setContent(wrap(html), { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  const outFile = join(outDir, `${name}.${cssArg}.pdf`);
  await page.pdf({
    path: outFile,
    format: 'A4',
    printBackground: true,
    margin: { top: '12mm', bottom: '14mm', left: '12mm', right: '12mm' },
  });
  // Uložit i HTML, ať jde otevřít v prohlížeči a klikat.
  writeFileSync(join(outDir, `${name}.${cssArg}.html`), wrap(html), 'utf8');
  console.log(`✓ ${outFile}`);
}

await browser.close();
console.log(`\nHotovo — CSS „${cssArg}", ${fixtures.length} fixtur → ${outDir}`);
