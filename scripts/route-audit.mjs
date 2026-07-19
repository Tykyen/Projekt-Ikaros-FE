// FE↔BE kontraktní audit: porovná BE routes vs FE api volání.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readFileSync = fs.readFileSync;

// Portabilní cesty (AR-09): relativně od scripts/ + env override pro CI multi-repo.
const BE_ROOT = process.env.IKAROS_BE_ROOT || path.resolve(__dirname, '../../Projekt-ikaros');
const BE = path.resolve(BE_ROOT, 'backend/src');
const FE = path.resolve(__dirname, '..', 'src');

function walk(dir, pred) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') stack.push(p); }
      else if (pred(p)) out.push(p);
    }
  }
  return out;
}

function norm(p) {
  return p
    .replace(/\$\{[^}]+\}/g, ':x')   // FE template ${...}
    .replace(/\$\{.*$/, '')          // 23.7 — utni „dangling" ${ (ternár s vnitřní
                                     // uvozovkou utne capture regexu, viz dryRun query)
    .replace(/:[A-Za-z0-9_]+/g, ':x') // :param
    .replace(/\?.*$/, '')            // strip query
    .replace(/\/$/, '')              // trailing slash
    .replace(/^\//, '');             // leading slash
}

// ── BE routes ──
const beRoutes = new Set();
for (const f of walk(BE, p => p.endsWith('.controller.ts'))) {
  const src = readFileSync(f, 'utf8');
  const baseM = src.match(/@Controller\(\s*['"`]([^'"`]*)['"`]/);
  const base = baseM ? baseM[1] : '';
  const re = /@(Get|Post|Put|Patch|Delete)\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/g;
  let m;
  while ((m = re.exec(src))) {
    const method = m[1].toUpperCase();
    const sub = m[2] || '';
    const full = norm([base, sub].filter(Boolean).join('/'));
    beRoutes.add(`${method} ${full}`);
  }
}

// 23.7 — resolve modulových konstant/base helperů PŘED norm. FE api soubory
// staví cesty přes `const PREFIX = '/x'` / `const base = (id) => \`/worlds/${id}/chat\``.
// Bez resolve scanner zredukuje `${PREFIX}` na `:x` → ztratí prefix → ~62 falešně
// „missing". Sesbírá same-file consty (string/template literál i 1-arg arrow
// vracející template) a substituuje `${NAME}` / `${NAME(...)}` jejich tělem.
function collectConsts(src) {
  const map = new Map();
  // arrow helper: const base = (args) => `TEMPLATE`
  const arrowRe = /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*`([^`]*)`/g;
  let m;
  while ((m = arrowRe.exec(src))) map.set(m[1], { body: m[2], fn: true });
  // plain const: const PREFIX = '/x' | "/x" | `/x/${y}`
  const constRe = /const\s+(\w+)\s*=\s*(['"`])([^'"`]*)\2\s*;/g;
  while ((m = constRe.exec(src))) {
    if (!map.has(m[1])) map.set(m[1], { body: m[3], fn: false });
  }
  return map;
}

function resolveConsts(raw, consts) {
  let out = raw;
  for (let i = 0; i < 5 && /\$\{/.test(out); i++) {
    let changed = false;
    for (const [name, def] of consts) {
      const token = def.fn
        ? new RegExp('\\$\\{' + name + '\\([^}]*\\)\\}', 'g')
        : new RegExp('\\$\\{' + name + '\\}', 'g');
      if (token.test(out)) {
        out = out.replace(token, def.body);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return out;
}

// ── FE calls ──
const feCalls = [];
for (const f of walk(FE, p => (p.endsWith('.ts') || p.endsWith('.tsx')) && !p.includes('__tests__') && !p.endsWith('.spec.ts') && !p.endsWith('.spec.tsx') && !p.endsWith('.test.ts') && !p.endsWith('.test.tsx'))) {
  const src = readFileSync(f, 'utf8');
  const consts = collectConsts(src);
  const re = /\bapi\.(get|post|put|patch|delete)\s*(?:<[^>]*>)?\s*\(\s*[`'"]([^`'"]*)[`'"]/g;
  let m;
  while ((m = re.exec(src))) {
    const method = m[1].toUpperCase();
    const p = norm(resolveConsts(m[2], consts));
    feCalls.push({ method, path: p, file: path.relative(FE, f) });
  }
}

// ── Porovnání ──
function beHas(method, p) {
  if (beRoutes.has(`${method} ${p}`)) return true;
  // tolerantní: BE route je prefix FE cesty (nested) nebo naopak
  for (const r of beRoutes) {
    const [rm, rp] = r.split(' ');
    if (rm !== method) continue;
    if (rp === p) return true;
  }
  return false;
}

// 23.7 — allowlist FE volání, která scanner staticky neresolvne (dynamický
// základ z runtime hodnoty apod.) a jsou ověřená ručně. Formát: `METHOD path`.
// Drž PRÁZDNÝ, dokud to jde — po vylepšení resolveru je 0 falešných pozitiv.
const ALLOWLIST = new Set([]);

const missing = [];
const seen = new Set();
for (const c of feCalls) {
  const key = `${c.method} ${c.path}`;
  if (seen.has(key)) continue;
  seen.add(key);
  if (ALLOWLIST.has(key)) continue;
  if (!beHas(c.method, c.path)) missing.push(c);
}

console.log(`BE routes: ${beRoutes.size}, FE unikátních volání: ${seen.size}`);
console.log(`\n=== FE volání BEZ odpovídající BE route (${missing.length}) ===`);
for (const c of missing.sort((a,b)=>a.path.localeCompare(b.path))) {
  console.log(`  ${c.method.padEnd(6)} ${c.path.padEnd(55)} ${c.file}`);
}

// 23.7 — `--ci` režim: reálný drift (FE volá neexistující BE route) shodí CI.
// Bez flagu jen reportuje (lokální průzkum). Gate běží v crossrepo jobu.
if (process.argv.includes('--ci') && missing.length > 0) {
  console.error(
    `\n❌ ROUTE DRIFT: ${missing.length} FE volání bez BE route. Oprav volání, ` +
      `BE route, nebo (u ověřených dynamických) přidej do ALLOWLIST v route-audit.mjs.`,
  );
  process.exit(1);
}
