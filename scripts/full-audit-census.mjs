#!/usr/bin/env node
// full-audit-census.mjs — coverage drift detektor pro skill "plný audit".
//
// Spočítá ŽIVÝ povrch kódu BE+FE (capability markery: kolekce, listenery, query-keys, upload sites,
// delete cesty, transakce, env, …), namapuje každou kategorii na audit, který ji má pokrýt, a diffne
// proti baseline. Smysl: scannery (audit:routes/ws/…) se rozšiřují samy, ale MANUÁLNÍ SWEEPY mají
// v plánech zamrzlou inventuru. Když kód přeroste (71. kolekce, 41. listener), tenhle nástroj to
// ukáže jako coverage drift → kde rozšířit kontrolu.
//
// Flags:
//   --json              strojový výstup (skill ho parsuje)
//   --update-baseline   uloží aktuální census jako nový baseline (docs/full-audit/coverage-baseline.json)
//   --ci                exit 1, pokud přibyl povrch ve SWEEP-auditu bez aktualizace baseline (drift guard)
//
// BE root: $IKAROS_BE_ROOT nebo ../../Projekt-ikaros (shodně s anti-regression-scan.mjs).

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FE_ROOT = resolve(__dirname, '..');
const BE_REPO = process.env.IKAROS_BE_ROOT || resolve(__dirname, '../../Projekt-ikaros');
const BE_ROOT = resolve(BE_REPO, 'backend');
const DOCS = resolve(FE_ROOT, 'docs');
const BASELINE = resolve(DOCS, 'full-audit/coverage-baseline.json');

const args = process.argv.slice(2);
const FLAG_JSON = args.includes('--json');
const FLAG_UPDATE = args.includes('--update-baseline');
const FLAG_CI = args.includes('--ci');

// --- walk (prune node_modules/dist/.git) ---
function walk(root, exts) {
  const out = [];
  if (!existsSync(root)) return out;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = resolve(dir, e.name);
      if (e.isDirectory()) {
        if (['node_modules', 'dist', 'build', '.git', 'coverage', '.next'].includes(e.name)) continue;
        stack.push(full);
      } else if (e.isFile() && exts.some((x) => e.name.endsWith(x))) {
        out.push(full);
      }
    }
  }
  return out;
}

// --- metriky: každá kategorie povrchu → regex + cílový audit ---
// capture: 1 = sbírej group(1) jako pojmenovanou položku; 0 = položka = basename souboru s ≥1 zásahem.
// fileRe (volitelné): omez na soubory, jejichž basename matchuje (zúží šum).
// sweep: true = kategorie patří manuálnímu sweepu (zamrzlá inventura) → drift je coverage gap (CI guard).
const METRICS = [
  // ── BE struktura dat ──
  { key: 'be_collections', label: 'BE kolekce (@Schema)', repo: 'be', roots: ['src'], exts: ['.ts'],
    re: /@Schema\s*\(/g, capture: 0, fileRe: /\.schema\.ts$/, audits: ['db-integrity', 'cascade-delete'], sweep: true },
  { key: 'be_dtos', label: 'BE DTO soubory', repo: 'be', roots: ['src'], exts: ['.ts'],
    re: /export\s+class\s+\w+/g, capture: 0, fileRe: /\.dto\.ts$/, audits: ['form-schema'], sweep: true },
  // ── BE chování ──
  { key: 'be_gateways', label: 'BE WS gateways', repo: 'be', roots: ['src'], exts: ['.ts'],
    re: /@WebSocketGateway\s*\(/g, capture: 0, audits: ['ws-contract', 'state-consistency'], sweep: false },
  { key: 'be_emits', label: 'BE WS emit eventy', repo: 'be', roots: ['src'], exts: ['.ts'],
    re: /\.emit\(\s*['"]([A-Za-z0-9:_.-]+)['"]/g, capture: 1, audits: ['ws-contract', 'state-consistency'], sweep: false },
  { key: 'be_delete_calls', label: 'BE delete cesty', repo: 'be', roots: ['src'], exts: ['.ts'],
    re: /\.(findByIdAndDelete|findOneAndDelete|deleteOne|deleteMany|findByIdAndRemove)\(/g, capture: 0, audits: ['cascade-delete'], sweep: true },
  { key: 'be_onevent', label: 'BE @OnEvent listenery', repo: 'be', roots: ['src'], exts: ['.ts'],
    re: /@OnEvent\(\s*['"]([A-Za-z0-9_.]+)['"]/g, capture: 1, audits: ['cascade-delete', 'state-consistency'], sweep: false },
  { key: 'be_transactions', label: 'BE transakce', repo: 'be', roots: ['src'], exts: ['.ts'],
    re: /\.(startTransaction|withTransaction)\(/g, capture: 0, audits: ['race-condition', 'db-integrity'], sweep: true },
  { key: 'be_uploads', label: 'BE upload/blob sites', repo: 'be', roots: ['src'], exts: ['.ts'],
    re: /(uploadService\.\w+|cloudinary\.|deleteImage|deleteAttachments)/g, capture: 0, audits: ['upload-media', 'cascade-delete'], sweep: true },
  { key: 'be_env', label: 'BE process.env', repo: 'be', roots: ['src'], exts: ['.ts'],
    re: /process\.env\.([A-Z0-9_]+)/g, capture: 1, audits: ['prod-config'], sweep: false },
  { key: 'be_throws', label: 'BE throw new', repo: 'be', roots: ['src'], exts: ['.ts'],
    re: /throw\s+new\s+\w+/g, capture: 0, audits: ['error-contract'], sweep: false },
  { key: 'be_loggers', label: 'BE log volání', repo: 'be', roots: ['src'], exts: ['.ts'],
    re: /(this\.logger\.\w+|new\s+Logger\(|console\.(log|error|warn|debug))/g, capture: 0, audits: ['log-hygiene'], sweep: false },
  // ── FE ──
  { key: 'fe_listeners', label: 'FE socket listenery', repo: 'fe', roots: ['src'], exts: ['.ts', '.tsx'],
    re: /(?:socket\.on|useSocketEvent)\(\s*['"]([A-Za-z0-9:_.-]+)['"]/g, capture: 1, audits: ['state-consistency'], sweep: true },
  { key: 'fe_querykeys', label: 'FE query-keys (kořen)', repo: 'fe', roots: ['src'], exts: ['.ts', '.tsx'],
    re: /queryKey:\s*\[\s*['"]([A-Za-z0-9_-]+)['"]/g, capture: 1, audits: ['cache'], sweep: true },
  { key: 'fe_mutations', label: 'FE mutace', repo: 'fe', roots: ['src'], exts: ['.ts', '.tsx'],
    re: /useMutation\s*[(<]/g, capture: 0, audits: ['cache'], sweep: true },
  { key: 'fe_uploads', label: 'FE upload sites', repo: 'fe', roots: ['src'], exts: ['.ts', '.tsx'],
    re: /(uploadImage|FormData\(|multipart)/g, capture: 0, audits: ['upload-media'], sweep: false },
];

function census() {
  const out = {};
  for (const m of METRICS) {
    const root = m.repo === 'be' ? BE_ROOT : FE_ROOT;
    const items = new Set();
    let count = 0;
    let files = [];
    for (const r of m.roots) files = files.concat(walk(resolve(root, r), m.exts));
    for (const f of files) {
      if (m.fileRe && !m.fileRe.test(basename(f))) continue;
      let content;
      try { content = readFileSync(f, 'utf8'); } catch { continue; }
      const re = new RegExp(m.re.source, 'g');
      let mm, hit = false;
      while ((mm = re.exec(content))) {
        count++; hit = true;
        if (m.capture === 1 && mm[1]) items.add(mm[1]);
      }
      if (m.capture === 0 && hit) items.add(basename(f));
    }
    out[m.key] = { label: m.label, repo: m.repo, audits: m.audits, sweep: !!m.sweep, count, items: [...items].sort() };
  }
  return out;
}

function loadBaseline() {
  if (!existsSync(BASELINE)) return null;
  try { return JSON.parse(readFileSync(BASELINE, 'utf8')).metrics || null; }
  catch (e) { console.warn(`⚠️  baseline nečitelný: ${e.message}`); return null; }
}

function diff(base, cur) {
  const rows = [];
  const keys = new Set([...(base ? Object.keys(base) : []), ...Object.keys(cur)]);
  for (const k of keys) {
    const b = (base && base[k]) || { count: 0, items: [] };
    const c = cur[k] || { count: 0, items: [], label: k, audits: [], sweep: false };
    const added = c.items.filter((x) => !b.items.includes(x));
    const removed = (b.items || []).filter((x) => !c.items.includes(x));
    if (c.count !== b.count || added.length || removed.length) {
      rows.push({ key: k, label: c.label, audits: c.audits, sweep: c.sweep, was: b.count, now: c.count, added, removed });
    }
  }
  return rows;
}

// --- run ---
const cur = census();
const base = loadBaseline();

if (FLAG_UPDATE) {
  mkdirSync(dirname(BASELINE), { recursive: true });
  writeFileSync(BASELINE, JSON.stringify({ generatedAt: new Date().toISOString(), metrics: cur }, null, 2));
  console.log(`✅ baseline uložen: ${BASELINE}`);
  process.exit(0);
}

const drift = diff(base, cur);

if (FLAG_JSON) {
  console.log(JSON.stringify({ baselineExists: !!base, metrics: cur, drift }, null, 2));
} else {
  console.log('\n=== Coverage census — povrch kódu vs audity ===\n');
  if (!base) console.log('⚠️  žádný baseline — spusť `npm run audit:census -- --update-baseline` pro založení.\n');
  console.log('Kategorie                 | repo | počet | sweep | audit(y)');
  console.log('--------------------------|------|-------|-------|---------');
  for (const m of METRICS) {
    const c = cur[m.key];
    console.log(`${m.label.padEnd(25)} | ${c.repo.padEnd(4)} | ${String(c.count).padStart(5)} | ${c.sweep ? ' ✔   ' : '     '} | ${c.audits.join(', ')}`);
  }
  if (base) {
    console.log('\n--- 📈 Drift vs baseline ---');
    if (!drift.length) console.log('beze změny povrchu.');
    for (const d of drift) {
      const flag = d.sweep && d.added.length ? ' 🔴 SWEEP coverage gap' : '';
      console.log(`\n${d.label} (${d.audits.join(', ')}): ${d.was} → ${d.now}${flag}`);
      if (d.added.length) console.log(`  + nové: ${d.added.slice(0, 30).join(', ')}${d.added.length > 30 ? ` … (+${d.added.length - 30})` : ''}`);
      if (d.removed.length) console.log(`  - pryč: ${d.removed.slice(0, 30).join(', ')}${d.removed.length > 30 ? ` … (+${d.removed.length - 30})` : ''}`);
    }
  }
  console.log('');
}

if (FLAG_CI) {
  // Drift guard: přibyl povrch ve SWEEP-auditu (zamrzlá inventura) → audit přerostl, vyžaduje pozornost.
  const gaps = drift.filter((d) => d.sweep && d.added.length);
  if (gaps.length) {
    console.error(`❌ ${gaps.length} kategorií přerostlo manuální sweep audit (rozšiř kontrolu nebo --update-baseline):`);
    for (const g of gaps) console.error(`   ${g.label} +${g.added.length} → ${g.audits.join(', ')}`);
    process.exit(1);
  }
  console.log('✅ žádný coverage drift ve sweep-auditech.');
}
