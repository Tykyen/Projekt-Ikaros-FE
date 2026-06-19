// 14.3 — CSP hash guard.
// Inline pre-hydration <script> v index.html (theme setter proti FOUT) je v CSP
// povolen přes 'sha256-…' v script-src (nginx default.conf.template). Skript je
// statický → hash. Když ho někdo upraví a hash nepřepočítá, enforce-CSP v prod
// zablokuje vlastní skript = bílá stránka (motiv se nenastaví, React nenastartuje
// jak má). Tenhle guard to chytí už při buildu: běží po `vite build`, čte
// dist/index.html (přesně to, co nginx servíruje) a porovná s hashem v template.
// Mismatch → exit 1 → `npm run build` (a tím i Docker build / deploy) selže.
//
// `--print` jen vytiskne aktuální hash (na doplnění do template po úpravě skriptu).
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = resolve(root, 'dist/index.html');
const tplPath = resolve(root, 'default.conf.template');

let html;
try {
  html = readFileSync(htmlPath, 'utf8');
} catch {
  console.error(
    `check-csp-hash: ${htmlPath} neexistuje — spusť napřed \`vite build\` (guard čte buildnutý dist).`,
  );
  process.exit(1);
}

// První inline <script> bez atributů = pre-hydration theme setter v <head>.
// (Druhý <script type="module" src=…> má atributy → tenhle regex ho nematchne.)
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) {
  console.error('check-csp-hash: inline <script> v dist/index.html nenalezen.');
  process.exit(1);
}
// CRLF→LF normalizace: hash musí být platformně stabilní. Produkce (Linux
// nginx) servíruje LF; bez normalizace by Windows build (CRLF) spočítal jiný
// hash a guard by falešně selhal (resp. CSP by v prod blokovala skript).
// .gitattributes navíc drží index.html jako LF i v repu — tohle je pojistka.
const scriptBody = m[1].replace(/\r\n/g, '\n');
const expected = `sha256-${createHash('sha256').update(scriptBody, 'utf8').digest('base64')}`;

if (process.argv.includes('--print')) {
  console.log(expected);
  process.exit(0);
}

const tpl = readFileSync(tplPath, 'utf8');
if (!tpl.includes(`'${expected}'`)) {
  const found =
    tpl.match(/'sha256-[A-Za-z0-9+/=]+'/)?.[0] ?? '(žádný sha256 v template)';
  console.error(
    'check-csp-hash: hash inline skriptu NEsedí s CSP v default.conf.template.\n' +
      `  Skript v dist/index.html → '${expected}'\n` +
      `  Template script-src má   → ${found}\n` +
      "  Oprav hodnotu 'sha256-…' v default.conf.template (script-src) a rebuildni.",
  );
  process.exit(1);
}
console.log(`check-csp-hash: OK — script-src '${expected}'`);
