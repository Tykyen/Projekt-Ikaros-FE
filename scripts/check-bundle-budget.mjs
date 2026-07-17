// SLO S5 — bundle budget guard.
//
// `plny-audit` skill definuje SLO: **eager entry graf ≤ 350 kB gzip** (JS+CSS
// včetně modulepreload; bez fontů/obrázků, bez lazy chunků). Číslo ale žilo jen
// ve skillu — `npm run build` ho nikdy neměřil. SLO, které nikdo nevynucuje, se
// plní jen do prvního nešťastného importu: audit 11. 7. našel 457 kB (eager
// TipTap z news feedu), fix na 299 kB držel jen do dalšího barrel re-exportu.
// Tenhle guard běží po `vite build`, čte reálný `dist/index.html` a shodí build
// dřív, než se regrese dostane do Dockeru (vzor `check-csp-hash.mjs`).
//
// Proč gzip: nginx/Caddy servírují komprimovaně, uživatel stahuje tohle číslo.
// Proč jen eager graf: lazy chunky (mapa, editor) se stahují až při navigaci —
// do „čas do prvního renderu" nepatří a rozpočet by kazily.
//
// `--print` vypíše rozpad po souborech (na ladění, když guard spadne).
import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');
const htmlPath = join(distDir, 'index.html');

/** SLO S5 (plny-audit skill). Změna = vědomé rozhodnutí, ne tichý posun. */
const BUDGET_GZIP_BYTES = 350 * 1024;

const printOnly = process.argv.includes('--print');

let html;
try {
  html = readFileSync(htmlPath, 'utf8');
} catch {
  console.error(
    `check-bundle-budget: ${htmlPath} neexistuje — spusť po \`vite build\`.`,
  );
  process.exit(1);
}

// Eager graf = co prohlížeč stáhne PŘED prvním renderem: <script src>,
// <link rel=stylesheet> a <link rel=modulepreload>. Lazy import() chunky v
// index.html nejsou, takže se do součtu nedostanou.
const assets = new Set();
for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) assets.add(m[1]);
for (const m of html.matchAll(
  /<link[^>]+rel="(?:stylesheet|modulepreload)"[^>]+href="([^"]+)"/g,
))
  assets.add(m[1]);
// `rel` a `href` můžou být v opačném pořadí.
for (const m of html.matchAll(
  /<link[^>]+href="([^"]+)"[^>]+rel="(?:stylesheet|modulepreload)"/g,
))
  assets.add(m[1]);

const local = [...assets].filter((a) => a.startsWith('/') && !a.startsWith('//'));
if (local.length === 0) {
  console.error(
    'check-bundle-budget: v dist/index.html nenalezen žádný lokální asset — ' +
      'změnil se tvar výstupu? Guard by tiše prošel, proto raději selhávám.',
  );
  process.exit(1);
}

const rows = [];
let totalGzip = 0;
for (const asset of local) {
  const file = join(distDir, asset.replace(/^\//, ''));
  let raw;
  try {
    raw = readFileSync(file);
  } catch {
    console.error(`check-bundle-budget: chybí ${file} (odkázán z index.html).`);
    process.exit(1);
  }
  const gzip = gzipSync(raw).length;
  totalGzip += gzip;
  rows.push({ asset, raw: statSync(file).size, gzip });
}

const kb = (b) => `${(b / 1024).toFixed(1)} kB`;

if (printOnly) {
  rows.sort((a, b) => b.gzip - a.gzip);
  for (const r of rows) console.log(`${kb(r.gzip).padStart(10)}  ${r.asset}`);
}

const pct = Math.round((totalGzip / BUDGET_GZIP_BYTES) * 100);
if (totalGzip > BUDGET_GZIP_BYTES) {
  console.error(
    `\ncheck-bundle-budget: ✗ eager entry graf ${kb(totalGzip)} gzip > SLO ${kb(BUDGET_GZIP_BYTES)} (${pct} %).\n` +
      `Nejtěžší kusy (spusť \`npm run audit:bundle -- --print\` pro rozpad):\n` +
      rows
        .sort((a, b) => b.gzip - a.gzip)
        .slice(0, 3)
        .map((r) => `  ${kb(r.gzip).padStart(10)}  ${r.asset}`)
        .join('\n') +
      `\n\nObvyklá příčina: něco těžkého (TipTap/PIXI/three) se dostalo do eager grafu —\n` +
      `typicky přes barrel re-export (\`export * from\`) nebo vždy-mounted komponentu.\n` +
      `Řešení: React.lazy na dané routě/komponentě, nebo import z konkrétního modulu.\n`,
  );
  process.exit(1);
}

console.log(
  `check-bundle-budget: OK — eager entry graf ${kb(totalGzip)} gzip / ${kb(BUDGET_GZIP_BYTES)} SLO (${pct} %).`,
);
