// Nav/routing integritní audit (10. styl) — client-side React Router v7.
// Diff: PATH-SET (router.tsx) × LINK-SET (FE to=/navigate(/<Navigate>/redirect()/nav config)
//   → dead links (odkaz nikam) + orphan routy (routa bez vstupu) + ambiguita (stejný rank).
// Vzor: scripts/route-audit.mjs (ten řeší HTTP API; tenhle client routy). `npm run audit:nav`.
//
// ⚠️ Předpoklady (laděno na tenhle router.tsx):
//   - router má 2 layout shelly: path '/' a path '/svet/:worldSlug', + top-level catch-all '*'.
//   - RR v6/v7 matchuje podle RANKINGU (specificity), ne pořadí v poli → "static za :slug" NENÍ mrtvé.
//     Reálné OR riziko = ambiguita (2 bare-dynamic sourozenci / duplicitní path), to hlídáme.
import fs from 'node:fs';
import path from 'node:path';

const FE = 'c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/src';
const ROUTER = path.join(FE, 'app', 'router.tsx');

function walk(dir, pred) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name !== 'node_modules') stack.push(p);
      } else if (pred(p)) out.push(p);
    }
  }
  return out;
}

// ── normalizace cesty na kanonické segmenty (':x' = jakýkoli param) ──
function norm(p) {
  return p
    .replace(/\$\{[^}]+\}/g, ':x') // ${slug}, ${g.key} → :x
    .replace(/:[A-Za-z0-9_]+/g, ':x') // :worldSlug → :x
    .replace(/\?.*$/, '')
    .replace(/#.*$/, '')
    .replace(/\/+$/, '')
    .replace(/^\//, '');
}
const segs = (p) => (p === '' ? [] : p.split('/'));

// route pattern matchne link, když má stejný počet segmentů a každý pár je
// shodný NEBO aspoň jeden je ':x' (wildcard) — tím wiki :slug pokryje /magicky-system.
function matches(routeSegs, linkSegs) {
  if (routeSegs.length !== linkSegs.length) return false;
  for (let i = 0; i < routeSegs.length; i++) {
    const r = routeSegs[i];
    const l = linkSegs[i];
    if (r === l) continue;
    if (r === ':x' || l === ':x') continue;
    return false;
  }
  return true;
}

// ── PATH-SET z router.tsx ──
const routerSrc = fs.readFileSync(ROUTER, 'utf8');
const anchorWorld = routerSrc.indexOf("path: '/svet/:worldSlug'");
const anchorRoot = routerSrc.indexOf("path: '/'");

const pathRe = /(?:path:\s*'([^']+)'|index:\s*true)/g;
const paths = [];
let m;
let order = 0;
while ((m = pathRe.exec(routerSrc))) {
  const raw = m[1] ?? '__index__';
  const pos = m.index;
  // parent shell podle pozice vůči anchorům
  let parent;
  if (raw === '/' || raw === '/svet/:worldSlug' || raw === '*') parent = 'top';
  else if (pos > anchorWorld) parent = 'world';
  else parent = 'root';
  // redirect? následujících ~80 znaků obsahuje <Navigate / redirect(
  const after = routerSrc.slice(pos, pos + 120);
  const isRedirect = /<Navigate\b|redirect\(/.test(after);
  // guard? hledej memberOnly / WorldMembershipGuard / RoleGuard / requireAuth v okně
  const win = routerSrc.slice(pos, pos + 400);
  let guard = 'none';
  if (/memberOnly\(/.test(win) || /WorldMembershipGuard/.test(win)) guard = 'membership';
  else if (/RoleGuard/.test(win)) guard = 'role';
  else if (/loader:\s*requireAuth/.test(win)) guard = 'auth';
  const roleM = win.match(/WorldRole\.(\w+)/);
  paths.push({ raw, parent, isRedirect, guard, role: roleM?.[1], order: order++, pos });
}

// full path + norm
const routes = [];
for (const r of paths) {
  if (r.parent === 'top') continue; // shelly + catch-all neřešíme jako cíle odkazů
  let full;
  if (r.raw === '__index__') {
    full = r.parent === 'world' ? '/svet/:worldSlug' : '/';
  } else if (r.parent === 'world') {
    full = `/svet/:worldSlug/${r.raw}`;
  } else {
    full = `/${r.raw}`;
  }
  const n = norm(full);
  routes.push({ ...r, full, n, segs: segs(n) });
}
const hasCatchAll = routerSrc.includes("path: '*'");

// ── LINK-SET z FE ──
const files = walk(FE, (p) =>
  (p.endsWith('.ts') || p.endsWith('.tsx')) &&
  !p.includes('__tests__') &&
  !/\.(spec|test)\.(ts|tsx)$/.test(p),
);

const links = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(FE, f);
  // same-file const X = `...` (prefix expanze, hlavně `b = /svet/${worldSlug}`)
  const consts = {};
  const cRe = /const\s+(\w+)\s*=\s*`([^`]*)`/g;
  let cm;
  while ((cm = cRe.exec(src))) consts[cm[1]] = cm[2];

  const push = (rawPath, kind, idx) => {
    if (rawPath == null) return;
    let p = rawPath;
    // expanze ${X} ze same-file constů (1 úroveň)
    p = p.replace(/\$\{(\w+)\}/g, (mm, name) => (consts[name] !== undefined ? consts[name] : mm));
    if (/^https?:/i.test(p) || p.startsWith('mailto:')) return; // externí
    if (p.startsWith('#') || p === '' || p === '/') return; // anchor / root
    const line = src.slice(0, idx).split('\n').length;
    // kandidátní norm tvary (link matchne routu, když některý kandidát sedí)
    let cands;
    if (p.startsWith('/')) {
      cands = [norm(p)];
    } else if (p.startsWith('..') || p.startsWith('./')) {
      return; // route-relativní (`../akce`) — staticky neresolvujeme (v1)
    } else {
      // bare relativní segment → typicky world-scoped (`to: 'admin/stranky'`)
      cands = [norm('/svet/:x/' + p)];
    }
    links.push({ raw: rawPath, p, cands, kind, file: rel, line });
  };

  // to="..." / to={`...`} / to={'...'} / to: `...`  (nav config)
  const toRe = /\bto[=:]\s*\{?\s*[`'"]([^`'"]*)[`'"]/g;
  let lm;
  while ((lm = toRe.exec(src))) push(lm[1], 'to', lm.index);
  // *href / *Href props (allHref, href) s interní cestou
  const hrefRe = /\b\w*[Hh]ref[=:]\s*\{?\s*[`'"]([^`'"]*)[`'"]/g;
  while ((lm = hrefRe.exec(src))) push(lm[1], 'href', lm.index);
  // navigate('...') / navigate(`...`)
  const navRe = /\bnavigate\(\s*[`'"]([^`'"]*)[`'"]/g;
  while ((lm = navRe.exec(src))) push(lm[1], 'navigate', lm.index);
  // redirect('...')
  const redRe = /\bredirect\(\s*[`'"]([^`'"]*)[`'"]/g;
  while ((lm = redRe.exec(src))) push(lm[1], 'redirect', lm.index);
}

// dedup link podle hlavního kandidáta (reporting)
const linkByN = new Map();
for (const l of links) {
  const key = l.cands[0];
  if (!linkByN.has(key)) linkByN.set(key, l);
}
const linkMatchesRoute = (l, r) => l.cands.some((c) => matches(r.segs, segs(c)));

// ── DIFF ──
// dead link = link, co nematchne žádnou routu (po žádném kandidátovi)
const dead = [];
for (const l of linkByN.values()) {
  const main = l.cands[0];
  if (main === '' || main === ':x') continue;
  const hit = routes.some((r) => linkMatchesRoute(l, r));
  if (!hit) dead.push(l);
}

// orphan routa = routa, kterou nematchne žádný link (po whitelistu)
const ORPHAN_WHITELIST = new Set([
  'reset-password', 'email-verify', 'email-change/confirm', // mailové
]);
const orphan = [];
for (const r of routes) {
  if (r.raw === '__index__') continue; // index = vstup z odjinud
  if (r.isRedirect) continue; // legacy redirect není cíl odkazu
  if (r.n === 'svet/:x/:x' || r.n === ':x') continue; // wiki/param catch-all
  if (ORPHAN_WHITELIST.has(r.raw)) continue;
  const linked = [...linkByN.values()].some((l) => linkMatchesRoute(l, r));
  if (!linked) orphan.push(r);
}

// ambiguita = víc rout se stejným norm (duplicitní vzor v JEDNOM shellu = stejný rank)
const byN = new Map();
for (const r of routes) {
  const key = `${r.parent}|${r.n}`;
  if (!byN.has(key)) byN.set(key, []);
  byN.get(key).push(r);
}
const ambiguous = [...byN.values()].filter((g) => g.length > 1);

// bare-dynamic sourozenci ve world shellu (2+ → ambiguita rankingu)
const worldBareDyn = routes.filter((r) => r.parent === 'world' && /^svet\/:x\/:x$/.test(r.n));

// ── REPORT ──
console.log(`PATH-SET: ${routes.length} rout (root+world) · catch-all '*': ${hasCatchAll ? 'ano' : 'CHYBÍ ⚠️'}`);
console.log(`LINK-SET: ${links.length} odkazů, ${linkByN.size} unikátních (norm)\n`);

console.log(`=== DEAD LINKS — odkaz nematchne žádnou routu (${dead.length}) ===`);
for (const l of dead.sort((a, b) => a.cands[0].localeCompare(b.cands[0])))
  console.log(`  ${l.kind.padEnd(9)} ${l.p.padEnd(45)} ${l.file}:${l.line}`);

console.log(`\n=== ORPHAN ROUTY — routa bez vstupního odkazu (${orphan.length}) ===`);
for (const r of orphan.sort((a, b) => a.n.localeCompare(b.n)))
  console.log(`  ${r.full.padEnd(48)} guard=${r.guard}${r.role ? `(${r.role})` : ''}`);

console.log(`\n=== AMBIGUITA — stejný vzor v jednom shellu (${ambiguous.length}) ===`);
for (const g of ambiguous) console.log(`  ${g[0].n}  ×${g.length}  (${g.map((x) => x.raw).join(', ')})`);
console.log(`  bare-dynamic world sourozenci (${worldBareDyn.length}): ${worldBareDyn.map((r) => r.raw).join(', ') || '—'}`);

const fail = dead.length > 0 || ambiguous.length > 0 || !hasCatchAll;
console.log(`\n${fail ? '❌ FAIL' : '✅ OK'} — dead:${dead.length} orphan:${orphan.length} ambiguita:${ambiguous.length}`);
process.exit(fail ? 1 : 0);
