// Log hygiene audit (14. styl) — M-SCAN (katalog log volání + taint) + M-DOCKER (sink) + 3RD (wire debug).
// Čte BE src + FE src. Read-only (kromě --emit baseline). Vzor: error-contract-scan.mjs / prod-config-scan.mjs.
// Spuštění:  node scripts/log-hygiene-scan.mjs            (souhrn)
//            node scripts/log-hygiene-scan.mjs --list     (+ seznam flagnutých volání SEC/PII/OBJ)
//            node scripts/log-hygiene-scan.mjs --docker   (+ sink scan compose + 3RD wire debug)
//            node scripts/log-hygiene-scan.mjs --ci       (exit≠0 nad baseline: console v runtime / 3RD debug / SEC)
import fs from 'node:fs';
import path from 'node:path';

const FE = 'c:/Matrix/ProjektIkaros/Projekt-ikaros-FE';
const BE = 'c:/Matrix/ProjektIkaros/Projekt-ikaros';
const BE_SRC = `${BE}/backend/src`;
const FE_SRC = `${FE}/src`;

const IGNORE_DIRS = new Set(['node_modules', 'dist', 'coverage', '.worktrees', '.clone', '.git', 'data', 'storybook-static']);
const isCode = (n) => (n.endsWith('.ts') || n.endsWith('.tsx')) && !n.endsWith('.d.ts');

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

// cesta: runtime vs test vs seed/migrace (jiná kategorie rizika)
function pathKind(r) {
  if (/\.spec\.|\.test\.|__tests__|\/test\//.test(r)) return 'test';
  if (/\.seed\.|\/seed\/|-seed\.|\.matrix-seed\.|migration|-migration\./i.test(r)) return 'seed';
  return 'runtime';
}

// ── najdi volání loggeru/console (balanc závorek, multiline; přeskoč string literály) ──
const CALLEE = /(?:^|[^.\w$])(console|(?:this\.)?logger|Logger)\.(log|debug|verbose|info|warn|error|trace|dir|table)\s*\(/g;
function findLogCalls(src) {
  const out = [];
  let m;
  while ((m = CALLEE.exec(src))) {
    const sink = m[1];      // console | logger | this.logger | Logger
    const level = m[2];
    let i = CALLEE.lastIndex, depth = 1;
    const start = i;
    while (i < src.length && depth > 0) {
      const ch = src[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === '`' || ch === '"' || ch === "'") {
        const q = ch; i++;
        while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      }
      i++;
    }
    const argsRaw = src.slice(start, i - 1);
    const line = src.slice(0, m.index).split('\n').length;
    out.push({ sink: sink.replace('this.', ''), level, argsRaw, line });
  }
  return out;
}

// vyřízni OBSAH string/template literálů → zůstane jen "kód" (proměnné, property přístupy)
function codeOnly(s) {
  let out = '', i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '`' || ch === '"' || ch === "'") {
      const q = ch; i++;
      // u template literálu zachovej ${...} výrazy (tam tečou proměnné!)
      while (i < s.length && s[i] !== q) {
        if (s[i] === '\\') { i += 2; continue; }
        if (q === '`' && s[i] === '$' && s[i + 1] === '{') {
          i += 2; let d = 1;
          while (i < s.length && d > 0) { if (s[i] === '{') d++; else if (s[i] === '}') d--; if (d > 0) out += s[i]; i++; }
          continue;
        }
        i++;
      }
      i++;
      out += ' ';
    } else { out += ch; i++; }
  }
  return out;
}

// ── taint klasifikace ──
const SENSITIVE_SEC = /\b(?:token|password|passwd|pwd|secret|hash|jwt|bearer|authorization|cookie|session|apikey|api_?key|credential|privateKey|refreshToken|accessToken|heslo|tajn)\w*/i;
const SENSITIVE_PII = /\b(?:e-?mail|emailaddress|phone|ipaddress|firstname|lastname|fullname)\b/i;
const ERR_OBJ = /(?:^|[\s,])(?:err|error|e|exception|ex)(?:\s+as\s+\w+)?\s*(?:,|$|\))/; // bare err objekt jako argument
const WHOLE_OBJ = /\b(?:dto|payload|req\.body|request\.body|body|user|member|membership|account|entity|document|doc)\b/i;
const JSON_STR = /JSON\.stringify\s*\(/;
// false-positive whitelist (jméno obsahuje citlivý kořen, ale není citlivé)
const WHITELIST = /\b(?:tokenize|tokenizer|tokens?Count|hashtag|hashmap|emailVerified|emailSent|hasEmail|MailerService|MAIL_FROM|tokenService|TokenService|sessionStorage|cookieParser|secretName|hashedId)\b/i;

function taint(call) {
  const code = codeOnly(call.argsRaw);
  const cats = new Set();
  const clean = code.replace(WHITELIST, ' ');
  if (SENSITIVE_SEC.test(clean)) cats.add('SEC');
  if (SENSITIVE_PII.test(clean)) cats.add('PII');
  // 2.+ argument = bare err objekt (NestJS to bere jako trace, ale objekt zaloguje celý)
  const args = splitTopArgs(call.argsRaw);
  if (args.length >= 2) {
    for (let k = 1; k < args.length; k++) {
      if (/^\s*(?:err|error|e|exception|ex)\s*(?:as\s+\w+)?\s*$/.test(args[k])) cats.add('OBJ');
    }
  }
  // jediný argument = bare proměnná/objekt (ne string, ne template) → OBJ
  if (args.length === 1) {
    const a = args[0].trim();
    if (a && !/^['"`]/.test(a) && /^[A-Za-z_$]/.test(a) && !/^\d/.test(a)) cats.add('OBJ');
  }
  if (JSON_STR.test(code)) cats.add('JSON');
  if (WHOLE_OBJ.test(clean) && !/\.(id|_id|length|name|slug|count)\b/.test(clean)) cats.add('CTX');
  return cats;
}

// rozděl argumenty na top-level úrovni (čárky mimo závorky/stringy)
function splitTopArgs(s) {
  const out = []; let depth = 0, cur = '', i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '`' || ch === '"' || ch === "'") {
      const q = ch; cur += ch; i++;
      while (i < s.length && s[i] !== q) { if (s[i] === '\\') { cur += s[i]; i++; } cur += s[i]; i++; }
      cur += s[i] ?? ''; i++;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; i++; continue; }
    cur += ch; i++;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

// ── scan ──
function scanRepo(srcDir) {
  const files = walk(srcDir);
  const calls = [];
  for (const f of files) {
    const src = read(f);
    const r = rel(f);
    const kind = pathKind(r);
    for (const c of findLogCalls(src)) {
      calls.push({ file: r, kind, ...c, cats: [...taint(c)] });
    }
  }
  return calls;
}

const beCalls = scanRepo(BE_SRC);
const feCalls = scanRepo(FE_SRC);
const all = [...beCalls.map((c) => ({ ...c, repo: 'BE' })), ...feCalls.map((c) => ({ ...c, repo: 'FE' }))];

function summarize(calls, label) {
  const byLevel = {}, byKind = { runtime: 0, test: 0, seed: 0 };
  let consoleRuntime = 0, debugVerbose = 0;
  const flagged = { SEC: 0, PII: 0, OBJ: 0, JSON: 0, CTX: 0 };
  for (const c of calls) {
    byLevel[c.level] = (byLevel[c.level] || 0) + 1;
    byKind[c.kind]++;
    if (c.sink === 'console' && c.kind === 'runtime') consoleRuntime++;
    if ((c.level === 'debug' || c.level === 'verbose') && c.kind === 'runtime') debugVerbose++;
    if (c.kind === 'runtime') for (const cat of c.cats) if (flagged[cat] !== undefined) flagged[cat]++;
  }
  console.log(`\n─── ${label} ─── ${calls.length} log volání (runtime ${byKind.runtime} / test ${byKind.test} / seed ${byKind.seed})`);
  console.log('  úrovně: ' + Object.entries(byLevel).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  '));
  console.log(`  console.* v runtime cestě: ${consoleRuntime}   ·   logger.debug/verbose v runtime: ${debugVerbose}`);
  console.log(`  🚩 runtime taint: SEC:${flagged.SEC}  PII:${flagged.PII}  OBJ:${flagged.OBJ}  JSON:${flagged.JSON}  CTX:${flagged.CTX}`);
  return { consoleRuntime, debugVerbose, flagged };
}

console.log('═══ LOG HYGIENE SCAN (M-SCAN) ═══');
const beSum = summarize(beCalls, 'BE (NestJS)');
const feSum = summarize(feCalls, 'FE (React)');

const args = process.argv.slice(2);

if (args.includes('--list')) {
  console.log('\n═══ Flagnutá runtime volání (SEC/PII/OBJ/JSON/CTX) — verdikt ručně ═══');
  const flaggedCalls = all.filter((c) => c.kind === 'runtime' && c.cats.length);
  for (const c of flaggedCalls.sort((a, b) => (b.cats.length - a.cats.length))) {
    const snip = codeOnly(c.argsRaw).replace(/\s+/g, ' ').trim().slice(0, 80);
    console.log(`  [${c.cats.join(',').padEnd(11)}] ${c.repo} ${c.file}:${c.line} ${c.sink}.${c.level}(  ${snip} )`);
  }
  console.log(`\n  celkem flagnutých runtime volání: ${flaggedCalls.length}`);
}

// ── M-DOCKER + 3RD ──
function dockerScan() {
  console.log('\n═══ M-DOCKER (sink) + 3RD (wire debug) ═══');
  for (const cf of ['docker-compose.prod.yml', 'docker-compose.yml']) {
    const p = `${BE}/${cf}`;
    if (!exists(p)) { console.log(`  ${cf}: (chybí)`); continue; }
    const s = read(p);
    const hasLogging = /^\s*logging:/m.test(s);
    const maxSize = /max-size/.test(s);
    const driver = (s.match(/logging:[\s\S]{0,120}?driver:\s*["']?([\w-]+)/) || [])[1];
    console.log(`  ${cf}: logging blok=${hasLogging ? 'ANO' : '❌ NE'}  driver=${driver || '(default json-file)'}  rotace(max-size)=${maxSize ? 'ANO' : '❌ NE'}`);
  }
  // 3RD wire debug napříč oběma repo
  const patterns = [
    ['mongoose.set debug', /mongoose\.set\(\s*['"]debug['"]\s*,\s*true/],
    ['nodemailer logger:true', /logger:\s*true/],
    ['nodemailer debug:true', /debug:\s*true/],
    ['DEBUG env (compose/deploy)', /DEBUG\s*[=:]\s*['"]?[\w*:]+/],
  ];
  const scanFiles = [...walk(BE_SRC), ...walk(FE_SRC),
    `${BE}/docker-compose.prod.yml`, `${BE}/docker-compose.yml`];
  console.log('  3RD wire-level debug:');
  for (const [name, re] of patterns) {
    const hits = [];
    for (const f of scanFiles) { const s = read(f); if (re.test(s)) hits.push(rel(f)); }
    console.log(`    ${name.padEnd(28)} ${hits.length ? '🔴 ' + hits.join(', ') : '✅ OFF'}`);
  }
  // top-level handler
  let hasTop = false;
  for (const f of walk(BE_SRC)) { if (/process\.on\(\s*['"](?:unhandledRejection|uncaughtException)['"]/.test(read(f))) hasTop = true; }
  console.log(`  TOP-level handler (unhandledRejection/uncaughtException): ${hasTop ? '✅ ANO' : '❌ chybí'}`);
}
if (args.includes('--docker')) dockerScan();

if (args.includes('--ci')) {
  // baseline = známý akceptovaný stav po opravách LH-01..12; CI selže při ZHORŠENÍ
  // (nový SEC taint / nová console v BE runtime / zapnutý 3RD wire debug).
  //   beConsole 3 = socket-io.adapter startup + env.validation + redis err.message (benigní)
  //   sec 1       = log-mailer dev-branch token[0:8] (v prod gated, LH-04) — ⚖️
  const BASELINE = { beConsole: 3, sec: 1 };
  let fail = 0;
  if (beSum.flagged.SEC > BASELINE.sec) { console.error(`❌ CI: nový SEC taint v BE runtime: ${beSum.flagged.SEC} > ${BASELINE.sec}`); fail++; }
  if (beSum.consoleRuntime > BASELINE.beConsole) { console.error(`❌ CI: nová console.* v BE runtime: ${beSum.consoleRuntime} > ${BASELINE.beConsole}`); fail++; }
  // 3RD wire debug se nesmí objevit (mongoose/nodemailer/socket.io)
  const wireRe = [/mongoose\.set\(\s*['"]debug['"]\s*,\s*true/, /logger:\s*true/, /debug:\s*true/];
  for (const f of [...walk(BE_SRC)]) {
    const s = read(f);
    for (const re of wireRe) if (re.test(s)) { console.error(`❌ CI: 3RD wire debug zapnut: ${rel(f)}`); fail++; }
  }
  if (fail) process.exit(1);
  console.log('\n✅ CI: žádné zhoršení nad baseline (SEC/console/3RD)');
}
