// Production config audit (12. styl) — M-ENV (4-zdroj env diff) + M-FALLBACK (katalog dev defaultů).
// Čte OBA repo (FE + BE). Read-only. Vzor: route-audit.mjs.
// Spuštění: node scripts/prod-config-scan.mjs   (z FE repo rootu)
//
// 4 zdroje pravdy:
//   1. KÓD        — co aplikace reálně čte (process.env / ConfigService.get / import.meta.env)
//   2. EXAMPLE    — .env.example (FE + BE) = dokumentace pro vývojáře
//   3. DEPLOY     — .github/workflows/deploy.yml (FE + BE) = co se předává do prod
//   4. COMPOSE    — docker-compose(.prod).yml = co se injektuje do kontejneru
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Portabilní cesty (AR-09): relativně od scripts/ + env override pro CI multi-repo.
const FE = path.resolve(__dirname, '..');
const BE = process.env.IKAROS_BE_ROOT || path.resolve(__dirname, '../../Projekt-ikaros');

// ── soubory 4 zdrojů ──
const SRC_DIRS = [`${FE}/src`, `${BE}/backend/src`];
const EXAMPLE_FILES = [`${FE}/.env.example`, `${FE}/.env.development`, `${BE}/backend/.env.example`];
const DEPLOY_FILES = [`${FE}/.github/workflows/deploy.yml`, `${BE}/.github/workflows/deploy.yml`];
const COMPOSE_FILES = [
  `${FE}/docker-compose.yml`,
  `${BE}/docker-compose.yml`,
  `${BE}/docker-compose.prod.yml`,
];
const DOCKERFILES = [`${FE}/Dockerfile`, `${BE}/backend/Dockerfile`];

// systémové / test-only / build proměnné, co nepatří do prod inventáře
const IGNORE = new Set([
  'NODE_ENV', 'JEST_WORKER_ID', 'PARITY_REGENERATE', 'CI', 'PATH', 'HOME', 'PWD',
  'npm_package_version', 'TZ', 'DEPLOY_PATH', 'COMPOSE_FILE',
  // bash proměnné z deploy.yml verify scriptu (ne env)
  'RUNNING', 'TOTAL',
  // meilisearch container-internal env (ne náš kód)
  'MEILI_ENV', 'MEILI_NO_ANALYTICS',
]);

const IGNORE_DIRS = new Set(['node_modules', 'dist', 'coverage', '.worktrees', '.clone', '.git', 'data']);

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function read(p) { return exists(p) ? fs.readFileSync(p, 'utf8') : ''; }

function walk(dir, pred) {
  const out = [];
  if (!exists(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!IGNORE_DIRS.has(e.name)) stack.push(path.join(d, e.name)); }
      else if (pred(e.name)) out.push(path.join(d, e.name));
    }
  }
  return out;
}

const isCode = (n) =>
  (n.endsWith('.ts') || n.endsWith('.tsx')) &&
  !n.endsWith('.spec.ts') && !n.endsWith('.spec.tsx') &&
  !n.endsWith('.test.ts') && !n.endsWith('.test.tsx') && !n.endsWith('.d.ts');

const ENV_NAME = '[A-Z][A-Z0-9_]{1,}';

// ── 1. KÓD: čtené env + fallback katalog ──
const readInCode = new Map(); // name -> Set(file:line)
const fallbacks = []; // {name, fallback, file, line}
const codeFiles = SRC_DIRS.flatMap((d) => walk(d, isCode));

const patterns = [
  new RegExp(`process\\.env\\.(${ENV_NAME})`, 'g'),
  new RegExp(`(?:config|configService|this\\.config|this\\.configService)\\.get(?:<[^>]*>)?\\(\\s*['"\`](${ENV_NAME})['"\`]`, 'g'),
  new RegExp(`import\\.meta\\.env\\.(VITE_[A-Z0-9_]+)`, 'g'),
];
// fallback A: ('X') ?? 'lit'/num  |  process.env.X ?? 'lit'/num  |  ... || 'lit'/num
const fbPattern = new RegExp(
  `(?:process\\.env\\.(${ENV_NAME})|\\.get(?:<[^>]*>)?\\(\\s*['"\`](${ENV_NAME})['"\`]\\)|import\\.meta\\.env\\.(VITE_[A-Z0-9_]+))\\s*(?:\\?\\?|\\|\\|)\\s*(?:['"\`]([^'"\`]*)['"\`]|(\\d+))`,
  'g',
);
// fallback B: ConfigService 2-arg default → .get('X', 'lit'/num)
const fbPattern2 = new RegExp(
  `\\.get(?:<[^>]*>)?\\(\\s*['"\`](${ENV_NAME})['"\`]\\s*,\\s*(?:['"\`]([^'"\`]*)['"\`]|(\\d+))`,
  'g',
);

for (const f of codeFiles) {
  const src = read(f);
  const fwd = f.replace(/\\/g, '/');
  const baseDir = SRC_DIRS.find((d) => fwd.startsWith(d)) ?? '';
  const rel = path.relative(path.dirname(baseDir), f).replace(/\\/g, '/');
  const lineOf = (idx) => src.slice(0, idx).split('\n').length;
  for (const re of patterns) {
    let m;
    while ((m = re.exec(src))) {
      const name = m[1];
      if (IGNORE.has(name)) continue;
      if (!readInCode.has(name)) readInCode.set(name, new Set());
      readInCode.get(name).add(`${rel}:${lineOf(m.index)}`);
    }
  }
  let fm;
  while ((fm = fbPattern.exec(src))) {
    const name = fm[1] || fm[2] || fm[3];
    if (IGNORE.has(name)) continue;
    const fallback = fm[4] !== undefined ? fm[4] : fm[5];
    fallbacks.push({ name, fallback, file: rel, line: lineOf(fm.index) });
  }
  let fm2;
  while ((fm2 = fbPattern2.exec(src))) {
    const name = fm2[1];
    if (IGNORE.has(name)) continue;
    const fallback = fm2[2] !== undefined ? fm2[2] : fm2[3];
    fallbacks.push({ name, fallback, file: rel, line: lineOf(fm2.index) });
  }
}

// ── 2. EXAMPLE ──
const inExample = new Set();
for (const f of EXAMPLE_FILES) {
  for (const line of read(f).split('\n')) {
    const m = line.match(new RegExp(`^\\s*(${ENV_NAME})\\s*=`));
    if (m && !IGNORE.has(m[1])) inExample.add(m[1]);
  }
}

// ── 3. DEPLOY (vars./secrets. + levá strana KEY=) ──
const inDeploy = new Set();
for (const f of DEPLOY_FILES) {
  const src = read(f);
  let m;
  const reRef = new RegExp(`(?:vars|secrets)\\.(${ENV_NAME})`, 'g');
  while ((m = reRef.exec(src))) if (!IGNORE.has(m[1])) inDeploy.add(m[1]);
  const reKey = new RegExp(`^\\s*(${ENV_NAME})=`, 'gm');
  while ((m = reKey.exec(src))) if (!IGNORE.has(m[1])) inDeploy.add(m[1]);
}

// ── 4. COMPOSE (klíče v environment + ${VAR}) ──
const inCompose = new Set();
const composeRequired = new Set(); // ${VAR:?...}
for (const f of COMPOSE_FILES) {
  const src = read(f);
  let m;
  const reKey = new RegExp(`^\\s+(${ENV_NAME}):\\s`, 'gm');
  while ((m = reKey.exec(src))) if (!IGNORE.has(m[1])) inCompose.add(m[1]);
  const reVar = new RegExp(`\\$\\{(${ENV_NAME})(:\\?|:-|\\})`, 'g');
  while ((m = reVar.exec(src))) {
    if (IGNORE.has(m[1])) continue;
    inCompose.add(m[1]);
    if (m[2] === ':?') composeRequired.add(m[1]);
  }
}

// ── DIFF ──
const codeNames = [...readInCode.keys()].sort();
const provided = new Set([...inDeploy, ...inCompose]);

const readNotProvided = codeNames.filter((n) => !provided.has(n));
const providedNotRead = [...provided].filter((n) => !readInCode.has(n)).sort();
const exampleNotRead = [...inExample].filter((n) => !readInCode.has(n)).sort();
const readNotInExample = codeNames.filter((n) => !inExample.has(n));

// ── VÝSTUP ──
const log = console.log;
log('═══════════════════════════════════════════════════════════════');
log(' PRODUCTION CONFIG SCAN — M-ENV + M-FALLBACK');
log('═══════════════════════════════════════════════════════════════');
log(`\nKód čte: ${codeNames.length} env · example: ${inExample.size} · deploy: ${inDeploy.size} · compose: ${inCompose.size}`);

log(`\n── (a) ČTENO V KÓDU, ALE NEPŘEDÁNO (deploy+compose) — prod použije fallback (${readNotProvided.length}) ──`);
for (const n of readNotProvided) log(`  🔴 ${n.padEnd(28)} ${[...readInCode.get(n)][0]}`);

log(`\n── (b) PŘEDÁNO (deploy/compose), ALE NEČTENO V KÓDU — mrtvé/přejmenované (${providedNotRead.length}) ──`);
for (const n of providedNotRead) log(`  🟡 ${n.padEnd(28)} deploy:${inDeploy.has(n)} compose:${inCompose.has(n)}`);

log(`\n── (c) V .env.example, ALE NEČTENO V KÓDU — zavádějící dokumentace (${exampleNotRead.length}) ──`);
for (const n of exampleNotRead) log(`  🟡 ${n}`);

log(`\n── (d) ČTENO V KÓDU, ALE CHYBÍ V .env.example — nezdokumentováno pro vývojáře (${readNotInExample.length}) ──`);
for (const n of readNotInExample) log(`  🟠 ${n.padEnd(28)} ${[...readInCode.get(n)][0]}`);

log(`\n── COMPOSE fail-fast (\${VAR:?required}) — jen tyto mají pojistku (${composeRequired.size}) ──`);
log('  ' + [...composeRequired].sort().join(', '));

log(`\n── M-FALLBACK: katalog dev defaultů (${fallbacks.length}) ──`);
const risky = (v) => /localhost|127\.0\.0\.1|http:\/\/|newmatrix|patrikzplzne|^$/.test(v);
for (const fb of fallbacks.sort((a, b) => Number(risky(b.fallback)) - Number(risky(a.fallback)))) {
  const flag = risky(fb.fallback) ? '⚠️ ' : '   ';
  const covered = composeRequired.has(fb.name) ? ' [compose:?]' : '';
  log(`  ${flag}${fb.name.padEnd(24)} ?? "${fb.fallback}"  (${fb.file}:${fb.line})${covered}`);
}

log('\n═══════════════════════════════════════════════════════════════');
log(' Legenda: (a)=riziko prod degrade  (d)=doc gap  ⚠️=localhost/http/prázdný fallback');
log('═══════════════════════════════════════════════════════════════');
