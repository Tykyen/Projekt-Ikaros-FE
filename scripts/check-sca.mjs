// 14.6 SCA brána — `npm audit` (prod, high+) s DOKUMENTOVANÝM allowlistem.
//
// `npm audit` hlásí podle VERZE balíku, ne podle toho, jestli zranitelnou cestu
// reálně používáme. Občas tak spadne na advisory, které se naší architektury
// funkčně netýká a NEMÁ vydaný fix (upgrade není kam, downgrade = breaking).
// Holý `npm audit --audit-level=high` v takovém případě natvrdo blokuje deploy
// bez možnosti vědomé výjimky.
//
// Tenhle guard běží místo holého auditu: propustí JEN advisory na allowlistu
// (každé s důvodem + datem revize), na všechno ostatní high/critical selže
// stejně jako dřív. Allowlist má EXPIRACI — po `reviewBy` guard spadne, aby
// výjimka nezůstala věčná a někdo ji znovu posoudil (mezitím ať fix vyjde).
// Vzor `check-bundle-budget.mjs` / `check-csp-hash.mjs`.
//
// Datum se nebere z `new Date()` (nešlo by testovat/reprodukovat v CI logu
// deterministicky) — čte se z env `SCA_TODAY` (CI ho nastaví na `date`), lokálně
// fallback na dnešek.
import { execSync } from 'node:child_process';

/**
 * Vědomě přijatá advisory. Match podle GHSA (z `via.url`) NEBO číselného
 * `source`. Změna = bezpečnostní risk-accept rozhodnutí, ne tichý posun.
 */
const ALLOWLIST = [
  {
    ghsa: 'GHSA-qwww-vcr4-c8h2',
    source: 1124282,
    pkg: 'react-router',
    reason:
      'CSRF bypass je v RSC / Framework módu react-routeru (server actions). ' +
      'Projekt je Vite SPA s client-side routingem (createBrowserRouter); RSC ' +
      'mode nepoužíváme (grep RSC/ServerRouter/framework/@react-router/dev = 0). ' +
      'Fix je až v 8.3.0 (range >=7.12.0 <8.3.0), ta ještě nevyšla (latest 7.18.1) ' +
      '— upgrade není kam, downgrade na 7.11 je breaking. Čekáme na patchnutou ' +
      '7.x / v8 (Dependabot to zvedne).',
    reviewBy: '2026-09-30',
  },
];

const today = process.env.SCA_TODAY?.slice(0, 10) || new Date().toISOString().slice(0, 10);

// npm audit vrací exit 1, když něco najde → execSync hodí; JSON je na stdout.
let raw;
try {
  raw = execSync('npm audit --omit=dev --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} catch (e) {
  raw = e.stdout; // nenulový exit = nalezené vulnerabilities; výstup je pořád validní JSON
}
if (!raw) {
  console.error('check-sca: `npm audit` nevrátil žádný výstup — nelze ověřit, selhávám (fail-safe).');
  process.exit(1);
}

let audit;
try {
  audit = JSON.parse(raw);
} catch {
  console.error('check-sca: výstup `npm audit --json` není validní JSON — selhávám (fail-safe).');
  process.exit(1);
}

const ghsaOf = (url) => (url && url.match(/GHSA-[a-z0-9-]+/i)?.[0]) || null;
const isBlockingSeverity = (s) => s === 'high' || s === 'critical';
const allowByGhsa = new Map(ALLOWLIST.map((a) => [a.ghsa, a]));
const allowBySource = new Map(ALLOWLIST.map((a) => [a.source, a]));

const blocking = []; // neomluvená high/critical advisory
const allowed = []; // propuštěná (na allowlistu)
const expired = []; // na allowlistu, ale po reviewBy

for (const [pkg, v] of Object.entries(audit.vulnerabilities || {})) {
  for (const via of v.via || []) {
    if (typeof via !== 'object') continue; // string = tranzitivní přes jiný balík (řeší se u zdroje)
    if (!isBlockingSeverity(via.severity)) continue;
    const ghsa = ghsaOf(via.url);
    const entry = allowByGhsa.get(ghsa) || allowBySource.get(via.source);
    if (!entry) {
      blocking.push({ pkg, ghsa, source: via.source, title: via.title, severity: via.severity });
      continue;
    }
    if (today > entry.reviewBy) {
      expired.push({ ...entry, ghsa, title: via.title });
    } else {
      allowed.push({ ...entry, ghsa, title: via.title });
    }
  }
}

// Advisory z allowlistu, které audit UŽ nehlásí (fix vyšel) → uklidit z allowlistu.
const seen = new Set([...allowed, ...expired].map((a) => a.ghsa));
const stale = ALLOWLIST.filter((a) => !seen.has(a.ghsa));

if (blocking.length) {
  console.error('check-sca: ✗ neomluvené high/critical advisory (prod závislosti):');
  for (const b of blocking) {
    console.error(`  · ${b.severity.toUpperCase()} ${b.pkg} — ${b.title} [${b.ghsa || b.source}]`);
  }
  console.error(
    '\nFix (upgrade/patch), NEBO — když se cesta reálně netýká naší architektury a' +
      ' fix neexistuje — přidej advisory do ALLOWLIST v scripts/check-sca.mjs' +
      ' s důvodem + reviewBy (bezpečnostní risk-accept, prodiskutovat).',
  );
  process.exit(1);
}

if (expired.length) {
  console.error('check-sca: ✗ výjimka(y) po datu revize — přehodnoť risk-accept (možná už vyšel fix):');
  for (const e of expired) console.error(`  · ${e.ghsa} (reviewBy ${e.reviewBy}) — ${e.reason}`);
  process.exit(1);
}

for (const a of allowed) {
  console.log(`check-sca: ⚠ povoleno do ${a.reviewBy} — ${a.ghsa} (${a.pkg}): ${a.reason}`);
}
if (stale.length) {
  console.log(
    'check-sca: ℹ allowlist obsahuje advisory, které audit už nehlásí (fix vyšel?) — ukliď: ' +
      stale.map((s) => s.ghsa).join(', '),
  );
}
console.log(`check-sca: OK — 0 neomluvených high/critical (${allowed.length} povoleno na allowlistu).`);
