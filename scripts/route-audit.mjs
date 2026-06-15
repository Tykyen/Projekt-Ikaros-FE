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

// ── FE calls ──
const feCalls = [];
for (const f of walk(FE, p => (p.endsWith('.ts') || p.endsWith('.tsx')) && !p.includes('__tests__') && !p.endsWith('.spec.ts') && !p.endsWith('.spec.tsx') && !p.endsWith('.test.ts') && !p.endsWith('.test.tsx'))) {
  const src = readFileSync(f, 'utf8');
  const re = /\bapi\.(get|post|put|patch|delete)\s*(?:<[^>]*>)?\s*\(\s*[`'"]([^`'"]*)[`'"]/g;
  let m;
  while ((m = re.exec(src))) {
    const method = m[1].toUpperCase();
    const p = norm(m[2]);
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

const missing = [];
const seen = new Set();
for (const c of feCalls) {
  const key = `${c.method} ${c.path}`;
  if (seen.has(key)) continue;
  seen.add(key);
  if (!beHas(c.method, c.path)) missing.push(c);
}

console.log(`BE routes: ${beRoutes.size}, FE unikátních volání: ${seen.size}`);
console.log(`\n=== FE volání BEZ odpovídající BE route (${missing.length}) ===`);
for (const c of missing.sort((a,b)=>a.path.localeCompare(b.path))) {
  console.log(`  ${c.method.padEnd(6)} ${c.path.padEnd(55)} ${c.file}`);
}
