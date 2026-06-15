// Error contract audit (13. styl) — M-GREP (klasifikace throwů) + M-CONTRACT (FE↔BE code parity).
// Čte BE src (throwy, code literály) + FE src (kódy, na které FE reálně reaguje). Read-only.
// Spuštění:  node scripts/error-contract-scan.mjs            (souhrn)
//            node scripts/error-contract-scan.mjs --list     (+ seznam string-only throwů)
//            node scripts/error-contract-scan.mjs --contract (+ FE↔BE drift)
//            node scripts/error-contract-scan.mjs --ci       (exit≠0 při driftu / nad baseline)
// Vzor: prod-config-scan.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Portabilní cesty (AR-09): relativně od scripts/ + env override pro CI multi-repo.
const FE = path.resolve(__dirname, '..');
const BE = process.env.IKAROS_BE_ROOT || path.resolve(__dirname, '../../Projekt-ikaros');
const BE_SRC = `${BE}/backend/src`;
const FE_SRC = `${FE}/src`;

const IGNORE_DIRS = new Set(['node_modules', 'dist', 'coverage', '.worktrees', '.clone', '.git', 'data']);
const isCode = (n) =>
  (n.endsWith('.ts') || n.endsWith('.tsx')) &&
  !n.endsWith('.spec.ts') && !n.endsWith('.spec.tsx') &&
  !n.endsWith('.test.ts') && !n.endsWith('.test.tsx') && !n.endsWith('.d.ts');

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function read(p) { return exists(p) ? fs.readFileSync(p, 'utf8') : ''; }
function walk(dir) {
  const out = [];
  if (!exists(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!IGNORE_DIRS.has(e.name)) stack.push(path.join(d, e.name)); }
      else if (isCode(e.name)) out.push(path.join(d, e.name));
    }
  }
  return out;
}
const rel = (p) => p.replace(/\\/g, '/').replace(`${BE}/`, '').replace(`${FE}/`, '');

// ── M-GREP: najdi `throw new XException( …blok… )` (balanc závorek, multiline) ──
function findThrows(src) {
  const out = [];
  const re = /throw\s+new\s+(\w*Exception)\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    const cls = m[1];
    let i = re.lastIndex; // hned za '('
    let depth = 1;
    const start = i;
    while (i < src.length && depth > 0) {
      const ch = src[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === '`' || ch === '"' || ch === "'") {
        // přeskoč string literál (i s escapy / template)
        const q = ch; i++;
        while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      }
      i++;
    }
    const arg = src.slice(start, i - 1).trim();
    const line = src.slice(0, m.index).split('\n').length;
    out.push({ cls, arg, line });
  }
  return out;
}

function classify(arg) {
  const a = arg.trim();
  if (/^['"`]/.test(a)) return 'string';        // string literál message
  if (/^\{/.test(a)) {
    const hasCode = /\bcode\s*:/.test(a);
    return hasCode ? 'obj+code' : 'obj-code';
  }
  if (a === '') return 'empty';
  return 'var';                                  // proměnná / volání / jiné
}

const CODE_LIT = /\bcode\s*:\s*['"]([A-Za-z0-9_]+)['"]/g;
function extractCodes(arg, sink) {
  let m; while ((m = CODE_LIT.exec(arg))) sink.add(m[1]);
}

// ── BE scan ──
const beFiles = walk(BE_SRC);
const stats = { string: 0, 'obj+code': 0, 'obj-code': 0, var: 0, empty: 0 };
const byClass = {};
let statusCodeDead = 0;
const beCodes = new Set();
const throwCodes = new Set(); // JEN z throw new *Exception (bez currency/DTO `code:` šumu) — zdroj pro --emit
const stringOnly = [];   // {file,line,cls,snippet}
const perFile = {};      // file -> {string,obj+code,obj-code,var}

for (const f of beFiles) {
  const src = read(f);
  const throws = findThrows(src);
  if (!throws.length) continue;
  const r = rel(f);
  perFile[r] = { total: 0, string: 0, 'obj+code': 0, 'obj-code': 0, var: 0 };
  for (const t of throws) {
    const k = classify(t.arg);
    stats[k]++;
    perFile[r].total++;
    if (perFile[r][k] !== undefined) perFile[r][k]++;
    byClass[t.cls] = (byClass[t.cls] || 0) + 1;
    if (/\bstatusCode\s*:/.test(t.arg)) statusCodeDead++;
    extractCodes(t.arg, beCodes);
    extractCodes(t.arg, throwCodes);
    if (k === 'string') {
      stringOnly.push({ file: r, line: t.line, cls: t.cls, snippet: t.arg.replace(/\s+/g, ' ').slice(0, 70) });
    }
  }
}

// guard kódy (mimo throw — některé guardy hodí v objektu)
for (const f of beFiles) extractCodes(read(f), beCodes);

// WS chyby
let wsEmitErr = 0, wsReturnErr = 0;
const wsFiles = new Set();
for (const f of beFiles) {
  const src = read(f);
  const e = (src.match(/\.emit\(\s*['"]error['"]/g) || []).length;
  const r = (src.match(/return\s*\{\s*error\s*:/g) || []).length;
  if (e || r) wsFiles.add(rel(f));
  wsEmitErr += e; wsReturnErr += r;
}

// ── M-CONTRACT: FE kódy, na které FE reálně reaguje ──
const feFiles = walk(FE_SRC);
const feHandlerFiles = feFiles.filter((f) => {
  const s = read(f);
  return /parseApiErrorCode|\.error\?\.code|RegisterErrorCode|error\.code/.test(s);
});
const feCodes = new Set();
const feCodeLoc = {};
const SCREAM = /['"]([A-Z][A-Z0-9_]{2,})['"]/g;
const HTTP_VERBS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'PJ', 'NPC', 'AKJ']);
// FE interní sentinely (ne BE kódy) — fallback hodnoty, ne kontrakt
const FE_SENTINELS = new Set(['UNKNOWN']);
// generické HttpStatus[status] názvy = filtr fallback, ne doménový kód (FE je smí mít jako záchyt)
const HTTP_STATUS_NAMES = new Set([
  'CONFLICT', 'BAD_REQUEST', 'NOT_FOUND', 'FORBIDDEN', 'UNAUTHORIZED',
  'TOO_MANY_REQUESTS', 'GONE', 'BAD_GATEWAY', 'UNSUPPORTED_MEDIA_TYPE',
  'INTERNAL_SERVER_ERROR', 'UNKNOWN_ERROR', 'PAYLOAD_TOO_LARGE',
]);
// jen řádky v kontextu kódu (code ===, case '...', mapy), ne libovolný SCREAMING string
for (const f of feHandlerFiles) {
  const s = read(f);
  const lines = s.split('\n');
  lines.forEach((rawLn, idx) => {
    const ln = rawLn.replace(/\/\/.*/, ''); // strip řádkový komentář (bez $ — `.` nematchuje CRLF \r)
    if (!/code|case\s+['"]|===|switch|Banner|mapError/i.test(ln)) return;
    let m; while ((m = SCREAM.exec(ln))) {
      const c = m[1];
      // HTTP metody/role + generické HttpStatus názvy (filtr je dává jako fallback místo
      // doménového code → FE je smí použít jako záchytnou větev, není to drift).
      if (HTTP_VERBS.has(c) || HTTP_STATUS_NAMES.has(c) || FE_SENTINELS.has(c)) continue;
      feCodes.add(c);
      (feCodeLoc[c] ||= []).push(`${rel(f)}:${idx + 1}`);
    }
  });
}

// drift
const feNotInBe = [...feCodes].filter((c) => !throwCodes.has(c)).sort();  // FE čeká, BE nehází
const beFieldMapCandidates = [...throwCodes].filter((c) => !feCodes.has(c)).sort(); // BE hází, FE nemapuje (info)

// ── výstup ──
const args = process.argv.slice(2);
const wantList = args.includes('--list');
const wantContract = args.includes('--contract');
const wantCi = args.includes('--ci');

const totalThrows = Object.values(stats).reduce((a, b) => a + b, 0);
console.log('═══ ERROR CONTRACT SCAN (M-GREP) ═══');
console.log(`BE souborů s throw: ${Object.keys(perFile).length}  ·  throwů celkem: ${totalThrows}`);
console.log('\nKlasifikace message argumentu:');
console.log(`  string literál (→ code=HttpStatus[status], generický):  ${stats.string}`);
console.log(`  objekt s code  (→ doménový kód, FE field-mapping):      ${stats['obj+code']}`);
console.log(`  objekt bez code(→ code=HttpStatus[status], generický):  ${stats['obj-code']}`);
console.log(`  proměnná/jiné  (→ nelze staticky určit):                ${stats.var}`);
console.log(`  prázdné:                                                ${stats.empty}`);
const generic = stats.string + stats['obj-code'];
console.log(`\n  ⇒ ${generic}/${totalThrows} throwů NEdá FE doménový kód (${Math.round((generic / totalThrows) * 100)} %) → generic fallback (CO/EX)`);
console.log(`  ⇒ statusCode v těle (MRTVÉ pole, filtr ho ignoruje): ${statusCodeDead}`);
console.log(`\nExceptionClass distribuce:`);
for (const [c, n] of Object.entries(byClass).sort((a, b) => b[1] - a[1])) console.log(`  ${c.padEnd(28)} ${n}`);
console.log(`\nWS chyby (mimo HTTP filtr): emit('error') ×${wsEmitErr} · return{error} ×${wsReturnErr}  v ${wsFiles.size} souborech`);
console.log(`BE doménových code literálů: ${beCodes.size}`);

if (wantList) {
  console.log(`\n─── string-only throwy (${stringOnly.length}) — generic code, žádný field-mapping ───`);
  for (const s of stringOnly) console.log(`  ${s.file}:${s.line}  ${s.cls}  "${s.snippet}"`);
}

if (wantContract) {
  console.log('\n═══ M-CONTRACT (FE↔BE code parity) ═══');
  console.log(`FE handler souborů: ${feHandlerFiles.length}  ·  FE kódů v handlerech: ${feCodes.size}`);
  console.log(`\n🔴 FE→BE drift (FE čeká kód, BE ho neposílá → mrtvá větev / typo):`);
  if (!feNotInBe.length) console.log('  (žádný)');
  for (const c of feNotInBe) console.log(`  ${c.padEnd(28)} ${(feCodeLoc[c] || []).join(', ')}`);
  console.log(`\nℹ️  BE kódy, na které FE NEmapuje (info — většina jen text přes parseApiError): ${beFieldMapCandidates.length}`);
  console.log('   ' + beFieldMapCandidates.join(', '));
}

// F4 — vygeneruj sdílený ErrorCode typ z BE throwů do OBOU repo (single source = BE).
if (args.includes('--emit')) {
  const sorted = [...throwCodes].sort();
  const header = `// AUTO-GENEROVÁNO: \`node scripts/error-contract-scan.mjs --emit\` — NEUPRAVUJ ručně.\n// Doménové error kódy z BE \`throw new *Exception({ code })\`. Single source = BE; FE je zrcadlo.\n// Sdílený kontrakt (error-contract audit F4) — drift hlídá \`npm run audit:errors --ci\` (M-CONTRACT).\n`;
  const body =
    `${header}\nexport const ERROR_CODES = [\n` +
    sorted.map((c) => `  '${c}',`).join('\n') +
    `\n] as const;\n\nexport type ErrorCode = (typeof ERROR_CODES)[number];\n`;
  const beOut = `${BE}/backend/src/common/errors/error-codes.generated.ts`;
  const feOut = `${FE}/src/shared/types/errorCodes.generated.ts`;
  fs.mkdirSync(path.dirname(beOut), { recursive: true });
  fs.writeFileSync(beOut, body, 'utf8');
  fs.writeFileSync(feOut, body, 'utf8');
  console.log(`\n📝 --emit: ${sorted.length} kódů → ${rel(beOut)} + ${rel(feOut)}`);
}

if (wantCi) {
  const fail = feNotInBe.length;
  if (fail) { console.error(`\n❌ CI: ${fail} FE→BE drift kódů`); process.exit(1); }
  console.log('\n✅ CI: žádný FE→BE drift');
}
