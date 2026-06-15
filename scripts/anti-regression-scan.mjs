#!/usr/bin/env node
// anti-regression-scan.mjs — M-TRACE: traceability nález → pojistka → živost.
// 16. styl auditu (meta). Plán: docs/anti-regression-plan/. Registr: docs/anti-regression-audit.md.
//
// Fáze A: harvest nálezů (strojový počet) + načtení mapy nález→pojistka + stupeň G (G0–G4) + report.
// Flags:
//   --json   strojový výstup (pro generování master matice)
//   --ci     exit 1, pokud DŮLEŽITÝ nález klesne pod práh (default: důležitý && G<2)
//
// Zásada: per registr parsujeme JEN jeho vlastní prefix (cross-refs jinak znečišťují počty).

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FE_ROOT = resolve(__dirname, '..');
const DOCS = resolve(FE_ROOT, 'docs');
const BE_REPO = process.env.IKAROS_BE_ROOT || resolve(__dirname, '../../Projekt-ikaros');
const BE_ROOT = resolve(BE_REPO, 'backend');
const BE_CI = resolve(BE_REPO, '.github/workflows/ci.yml');
const MAP_PATH = resolve(DOCS, 'anti-regression-plan/anti-regression-map.json');

const args = process.argv.slice(2);
const FLAG_JSON = args.includes('--json');
const FLAG_CI = args.includes('--ci');
const FLAG_EMIT_MAP = args.includes('--emit-map');     // JSON skeleton ruční mapy (všech 266)
const FLAG_EMIT_MATRIX = args.includes('--emit-matrix'); // Markdown master matice (všech 266)

// --- zdroje: soubor + vlastní prefix (regex zachytí jen vlastní ID, ne cross-ref) ---
const SOURCES = [
  { audit: 'bug',             file: 'bug-audit.md',             re: /\bN-\d+\b/g },
  { audit: 'cache',           file: 'cache-audit.md',           re: /\bC-\d+\b/g },
  { audit: 'cascade-delete',  file: 'cascade-delete-audit.md',  re: /\bCD-\d+\b/g },
  { audit: 'db-integrity',    file: 'db-integrity-audit.md',    re: /\bDI-\d+\b/g },
  { audit: 'error-contract',  file: 'error-contract-audit.md',  re: /\bEC-\d+\b/g },
  { audit: 'form-schema',     file: 'form-schema-audit.md',     re: /\bF-\d+\b/g },
  { audit: 'log-hygiene',     file: 'log-hygiene-audit.md',     re: /\bLH-\d+\b/g },
  { audit: 'nav',             file: 'nav-audit.md',             re: /\bNAV-\d+\b/g },
  { audit: 'prod-config',     file: 'prod-config-audit.md',     re: /\bPC-\d+\b/g },
  { audit: 'race-condition',  file: 'race-condition-audit.md',  re: /\bRC-[A-Z]?\d+\b/g },
  { audit: 'role',            file: 'role-audit.md',            re: /\bR-\d+\b/g },
  { audit: 'seed-scenario',   file: 'seed-scenario-audit.md',   re: /\bSS-\d+\b/g },
  { audit: 'state-consist',   file: 'state-consistency-audit.md', re: /\bS-\d+\b/g },
  { audit: 'upload-media',    file: 'upload-media-audit.md',    re: /\bUM-\d+\b/g },
  { audit: 'ws',              file: 'ws-audit.md',              re: /\bW-\d+\b/g },
];

const SEV = { crit: '🔴', high: '🟠', med: '🟡' };

// class-level scanner: audit → scanner, který hlídá CELOU jeho třídu (ne konkrétní nález).
// Když nález nemá cílený test, ale jeho audit má scanner, je aspoň G1 (papírový — scanner mimo CI),
// ne G0. ⚠️ class-krytí ≠ cílené (AIM se ověřuje ručně). Audity bez scanneru → zůstávají G0.
const AUDIT_SCANNER = {
  'error-contract': 'audit:errors',
  'log-hygiene': 'audit:logs',
  'prod-config': 'audit:config',
  'nav': 'audit:nav',
  'ws': 'audit:ws',
  'bug': 'audit:routes',
  'role': 'audit:routes',
};

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
// definiční řádek = ID stojí na začátku (po volitelném '|') → tabulkový registr.
// Severity/status z NĚJ (ne z legendy/souhrnu, kde se emoji lepí). Fallback: agregace.
function primaryLine(id, lines) {
  const reDef = new RegExp(`^\\s*\\|?\\s*\\*{0,2}${esc(id)}\\b`);
  return lines.find((l) => reDef.test(l));
}
function classifyStatus(id, lines) {
  const def = primaryLine(id, lines);
  const text = def || lines.join('\n');
  if (/✅|opraveno|OPRAVENO|GUARD\b/.test(text)) return 'fixed';
  if (/⚖️|by-design|akceptováno|přijaté riziko/i.test(text)) return 'bydesign';
  if (/OTEVŘEN|⬜|DEFER|defer|🚧/.test(text)) return 'open';
  if (/🐛|POTVRZENO/.test(text)) return 'confirmed';
  // fallback přes agregaci, pokud def řádek mlčí
  const all = lines.join('\n');
  if (/✅|OPRAVENO/.test(all)) return 'fixed';
  if (/⚖️|by-design/i.test(all)) return 'bydesign';
  if (/OTEVŘEN|DEFER/.test(all)) return 'open';
  return '?';
}
function classifySeverity(id, lines) {
  const def = primaryLine(id, lines);
  const text = def || lines.join('\n');
  if (text.includes('🔴')) return 'crit';
  if (text.includes('🟠')) return 'high';
  if (text.includes('🟡')) return 'med';
  return '?';
}

// --- harvest ---
function harvest() {
  const findings = new Map(); // id -> {id, audit, lines:Set, severity, status}
  for (const src of SOURCES) {
    const path = resolve(DOCS, src.file);
    if (!existsSync(path)) { console.warn(`⚠️  chybí registr: ${src.file}`); continue; }
    const content = readFileSync(path, 'utf8');
    const fileLines = content.split('\n');
    const idLines = new Map(); // id -> [lines]
    for (const line of fileLines) {
      const matches = line.match(src.re);
      if (!matches) continue;
      for (const id of new Set(matches)) {
        if (!idLines.has(id)) idLines.set(id, []);
        idLines.get(id).push(line);
      }
    }
    for (const [id, lines] of idLines) {
      findings.set(id, {
        id, audit: src.audit, lines,
        severity: classifySeverity(id, lines),
        status: classifyStatus(id, lines),
      });
    }
  }
  return findings;
}

// --- auto-discovery: které testy jmenovitě citují ID nálezu (= cílený regresní test) ---
// Konvence: test, který v názvu/komentáři uvádí ID (např. it('N-7 ...') / // RC-E2), je strojově
// dohledatelná pojistka. FE testy dnes ID necitují → index je hlavně BE.
const ID_TOKEN = /\b[A-Z]{1,3}-[A-Z]?\d+\b/g;
function walkTests(root, dirs, exts) {
  const out = [];
  for (const d of dirs) {
    const base = resolve(root, d);
    if (!existsSync(base)) continue;
    let entries;
    try { entries = readdirSync(base, { recursive: true, withFileTypes: true }); }
    catch { continue; }
    for (const e of entries) {
      if (!e.isFile()) continue;
      if (!exts.some((x) => e.name.endsWith(x))) continue;
      const full = resolve(e.parentPath || e.path || base, e.name);
      out.push(full);
    }
  }
  return out;
}
function buildTestIndex(validIds) {
  const index = new Map(); // id -> [{repo, file}]
  const sources = [
    { repo: 'be', root: BE_ROOT, dirs: ['src', 'test'], exts: ['.spec.ts', '.e2e-spec.ts'] },
    { repo: 'fe', root: FE_ROOT, dirs: ['src'], exts: ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'] },
  ];
  for (const s of sources) {
    for (const file of walkTests(s.root, s.dirs, s.exts)) {
      let content;
      try { content = readFileSync(file, 'utf8'); } catch { continue; }
      const ids = new Set((content.match(ID_TOKEN) || []).filter((id) => validIds.has(id)));
      for (const id of ids) {
        if (!index.has(id)) index.set(id, []);
        index.get(id).push({ repo: s.repo, file: relative(s.root, file).replace(/\\/g, '/') });
      }
    }
  }
  return index;
}

// --- mapa nález → pojistka ---
function loadMap() {
  if (!existsSync(MAP_PATH)) return {};
  try { return JSON.parse(readFileSync(MAP_PATH, 'utf8')).findings || {}; }
  catch (e) { console.warn(`⚠️  mapa nečitelná: ${e.message}`); return {}; }
}

function repoRoot(repo) { return repo === 'be' ? BE_ROOT : FE_ROOT; }

function resolveGuard(g) {
  // EX: existuje pojistka fyzicky?
  if (g.kind === 'test') {
    const f = resolve(repoRoot(g.repo), g.file);
    if (!existsSync(f)) return { exists: false };
    const ok = !g.symbol || readFileSync(f, 'utf8').includes(g.symbol);
    return { exists: ok };
  }
  if (g.kind === 'scanner' || g.kind === 'lint') {
    const pkg = JSON.parse(readFileSync(resolve(FE_ROOT, 'package.json'), 'utf8'));
    return { exists: !!(pkg.scripts && pkg.scripts[g.cmd]) };
  }
  if (g.kind === 'mutation') {
    return { exists: existsSync(resolve(repoRoot(g.repo), g.config || 'stryker.conf.json')) };
  }
  return { exists: false };
}

// Aktivní (ne-zakomentovaný) text všech workflow souborů obou repo — zdroj pravdy o živosti.
function loadCiText() {
  let txt = '';
  if (existsSync(BE_CI)) txt += readFileSync(BE_CI, 'utf8') + '\n';
  const feWf = resolve(FE_ROOT, '.github/workflows');
  if (existsSync(feWf)) {
    for (const f of readdirSync(feWf)) {
      if (f.endsWith('.yml') || f.endsWith('.yaml')) txt += readFileSync(resolve(feWf, f), 'utf8') + '\n';
    }
  }
  // zahoď zakomentované řádky (job připravený, ale neaktivní = neživý)
  return txt.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
}
const CI_ACTIVE = loadCiText();

function resolveLive(g) {
  // LIVE: spouští se automaticky v CI/precommit?
  if (g.kind === 'test') {
    if (g.repo === 'be') return /npm test|jest/.test(CI_ACTIVE); // BE ci.yml → npm test
    return /vitest run|test:run/.test(CI_ACTIVE); // FE: živý jen pokud workflow spouští vitest
  }
  if (g.kind === 'scanner' || g.kind === 'lint') {
    // živý jen pokud ho aktivní (ne-zakomentovaný) workflow reálně volá
    return CI_ACTIVE.includes(g.cmd);
  }
  if (g.kind === 'mutation') return false; // Stryker jen ručně
  return false;
}

function grade(f, mapEntry, discovered) {
  const guards = [...((mapEntry && mapEntry.guards) || []), ...(discovered || [])];
  if (guards.length === 0) return { g: 0, live: false, teeth: false };
  let g = 0, live = false, teeth = false;
  for (const guard of guards) {
    const ex = resolveGuard(guard).exists;
    if (!ex) continue;
    const lv = resolveLive(guard);
    if (lv) live = true;
    if (guard.kind === 'scanner' || guard.kind === 'lint') g = Math.max(g, lv ? 2 : 1);
    else if (guard.kind === 'test') g = Math.max(g, lv ? 3 : 1);
    else if (guard.kind === 'mutation') { teeth = true; }
  }
  if (teeth && g >= 3) g = 4;
  return { g, live, teeth };
}

function isImportant(f) {
  return f.severity === 'crit' || f.severity === 'high' || f.status === 'open';
}

// --- run ---
const findings = harvest();
const map = loadMap();
const testIndex = buildTestIndex(new Set(findings.keys()));
const rows = [];
for (const f of findings.values()) {
  const discovered = (testIndex.get(f.id) || []).map((t) => ({ kind: 'test', repo: t.repo, file: t.file, symbol: f.id }));
  // class-level scanner jako fallback, jen když není cílený test ani ruční guard
  const hasManual = map[f.id] && map[f.id].guards && map[f.id].guards.length;
  if (!discovered.length && !hasManual && AUDIT_SCANNER[f.audit]) {
    discovered.push({ kind: 'scanner', repo: 'fe', cmd: AUDIT_SCANNER[f.audit], classLevel: true });
  }
  const gr = grade(f, map[f.id], discovered);
  const m = map[f.id] || {};
  // ruční mapa smí přebít hrubou heuristiku statusu/severity + dodat třídu a poznámku
  const status = m.status || f.status;
  const severity = m.severity || f.severity;
  rows.push({ ...f, status, severity, ...gr, class: m.class || '?', note: m.note || '', important: isImportant({ ...f, status, severity }), discovered });
}

// per-audit souhrn
const byAudit = new Map();
for (const r of rows) {
  if (!byAudit.has(r.audit)) byAudit.set(r.audit, { n: 0, crit: 0, high: 0, med: 0, fixed: 0, open: 0, bydesign: 0, g0: 0 });
  const a = byAudit.get(r.audit);
  a.n++;
  if (r.severity === 'crit') a.crit++; if (r.severity === 'high') a.high++; if (r.severity === 'med') a.med++;
  if (r.status === 'fixed') a.fixed++; if (r.status === 'open') a.open++; if (r.status === 'bydesign') a.bydesign++;
  if (r.g === 0) a.g0++;
}

function guardLabel(r) {
  const t = r.discovered.find((g) => g.kind === 'test');
  if (t) return `${t.repo}:${t.file}`;
  const s = r.discovered.find((g) => g.classLevel);
  if (s) return `class:${s.cmd}`;
  return '—';
}

if (FLAG_EMIT_MAP) {
  // skeleton ruční mapy: status/severity = heuristika (člověk opraví), class/note prázdné, autodetect jako vodítko
  const findingsOut = {};
  for (const src of SOURCES) {
    for (const r of rows.filter((x) => x.audit === src.audit)) {
      findingsOut[r.id] = { class: '', severity: r.severity, status: r.status, note: '', _detected: guardLabel(r), guards: [] };
    }
  }
  console.log(JSON.stringify({ _doc: 'Ruční mapa nález→pojistka (16. audit). status/severity přepisují heuristiku; class+note vyplnit; guards=[ruční navíc]. _detected je jen vodítko (auto-discovery/class-scanner běží za běhu).', findings: findingsOut }, null, 2));
} else if (FLAG_EMIT_MATRIX) {
  console.log('| ID | Audit | Sev | Stav | Třída | G | LIVE | Pojistka | Pozn. |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const src of SOURCES) {
    for (const r of rows.filter((x) => x.audit === src.audit)) {
      console.log(`| ${r.id} | ${r.audit} | ${SEV[r.severity] || '?'} | ${r.status} | ${r.class} | G${r.g} | ${r.live ? '✅' : '—'} | ${guardLabel(r)} | ${r.note} |`);
    }
  }
} else if (FLAG_JSON) {
  console.log(JSON.stringify({ total: rows.length, rows }, null, 2));
} else {
  console.log('\n=== M-TRACE — Anti-regression traceability ===\n');
  console.log('Audit            | nál | 🔴 | 🟠 | 🟡 | opr | otv | b-d | G0');
  console.log('-----------------|-----|----|----|----|-----|-----|-----|----');
  for (const src of SOURCES) {
    const a = byAudit.get(src.audit); if (!a) continue;
    const p = (v, w) => String(v).padStart(w);
    console.log(`${src.audit.padEnd(16)} |${p(a.n,4)} |${p(a.crit,3)} |${p(a.high,3)} |${p(a.med,3)} |${p(a.fixed,4)} |${p(a.open,4)} |${p(a.bydesign,4)} |${p(a.g0,3)}`);
  }
  const gDist = [0,0,0,0,0];
  for (const r of rows) gDist[r.g]++;
  console.log('\n--- Σ -------------');
  console.log(`Nálezů celkem: ${rows.length}`);
  console.log(`Stupně G: G0=${gDist[0]} G1=${gDist[1]} G2=${gDist[2]} G3=${gDist[3]} G4=${gDist[4]}`);
  const important = rows.filter(r => r.important);
  const importantUnguarded = important.filter(r => r.g < 2);
  const fixedUnguarded = rows.filter(r => r.status === 'fixed' && r.g === 0);
  console.log(`Důležitých nálezů: ${important.length}; z toho bez živé pojistky (G<2): ${importantUnguarded.length}`);
  console.log(`🔴 Opravené nálezy bez JAKÉKOLI pojistky (fixed & G0 — můžou se tiše vrátit): ${fixedUnguarded.length}`);
  console.log(`Auto-discovery: ${rows.filter(r => r.discovered.some(g => g.kind === 'test')).length} nálezů má BE/FE test citující ID (cílený); ${rows.filter(r => r.discovered.some(g => g.classLevel)).length} jen class-scanner (G1)`);
  console.log(`Pojistek v ruční mapě: ${Object.keys(map).length}`);
}

if (FLAG_CI) {
  // Guard hlídá REGRESI: opravený důležitý nález, který ztratil živou pojistku (G<2).
  // NE otevřené nálezy (status 'open' = nikdy neopravené = dluh, ne regrese) ani
  // 'accepted' (vědomě jiný typ pojistky). Práh: fixed && (crit|high) && g<2.
  const fail = rows.filter(
    (r) => r.status === 'fixed' && (r.severity === 'crit' || r.severity === 'high') && r.g < 2,
  );
  if (fail.length) {
    console.error(`\n❌ ${fail.length} opravených důležitých nálezů bez živé pojistky (regrese-riziko, G<2):`);
    for (const r of fail) console.error(`   ${r.id} (${r.audit}, ${SEV[r.severity] || '?'})`);
    process.exit(1);
  }
  console.log('\n✅ Žádná regrese: každý opravený důležitý nález má živou pojistku (G≥2).');
}
