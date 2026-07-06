// orphan-scan.mjs — READ-ONLY cascade-delete orphan/dangling scan.
// Materializováno z docs/cascade-delete-plan/tools/orphan-scan.md (RUN-2026-07-05-2303, ÚKOL 4).
// Spuštění:  MONGO_URI="mongodb://user:pass@host/dbname" node orphan-scan.mjs
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
if (!uri) { console.error('Chybí MONGO_URI'); process.exit(1); }

const client = new MongoClient(uri);
await client.connect();
const db = client.db();
const C = (n) => db.collection(n);

// Set všech _id dané kolekce jako string (pro porovnání s string FK v child kolekcích).
async function idSet(coll, field = '_id') {
  const docs = await C(coll).find({}, { projection: { [field]: 1 } }).toArray();
  return new Set(docs.map((d) => String(field === '_id' ? d._id : d[field])));
}

// Spočítej dokumenty v `coll`, jejichž `field` (string) není v `validSet`.
async function countDangling(coll, field, validSet, extraFilter = {}) {
  const docs = await C(coll)
    .find({ [field]: { $ne: null, $exists: true }, ...extraFilter },
          { projection: { [field]: 1 } })
    .toArray();
  return docs.filter((d) => !validSet.has(String(d[field]))).length;
}

const worldIds = await idSet('worlds');
const charIds = await idSet('characters');
const charSlugs = await idSet('characters', 'slug');
const sceneIds = await idSet('mapScenes');
const userIds = await idSet('users');
const pageSlugs = await idSet('pages', 'slug');

const rows = [];
const push = (label, n, finding) => rows.push({ label, orphans: n, finding });

// --- Orphans: child s worldId mimo worlds ---
const WORLD_SCOPED = ['pages','characters','chatchannels','chatgroups','chatmessages',
  'mapScenes','worldMaps','game_events','timeline_events','worldnews','worldsettings',
  'worldmemberships','custom_emotes','sounds','world_currencies','bestiae'];
for (const coll of WORLD_SCOPED) {
  push(`${coll}.worldId ∉ worlds`, await countDangling(coll, 'worldId', worldIds), 'OR/CD-06');
}

// --- Orphans: subdocy s characterId mimo characters ---
for (const coll of ['character_diaries','character_calendars','character_finances',
                    'character_inventories','character_notes','character_accounts']) {
  push(`${coll}.characterId ∉ characters`, await countDangling(coll, 'characterId', charIds), 'OR/CD-09');
}

// --- Dangling refs ---
push('membership.currentSceneId ∉ mapScenes',
     await countDangling('worldmemberships', 'currentSceneId', sceneIds), 'DR/CD-04');
push('membership.characterPath ∉ characters.slug',
     await countDangling('worldmemberships', 'characterPath', charSlugs), 'DR');
push('worlds.ownerId ∉ users',
     await countDangling('worlds', 'ownerId', userIds), 'DR');

// --- favoritePageSlugs (pole per world) ---
let favOrphans = 0;
const users = await C('users').find(
  { favoritePageSlugs: { $exists: true } },
  { projection: { favoritePageSlugs: 1 } }).toArray();
for (const u of users) {
  const fav = u.favoritePageSlugs || {};
  for (const wid of Object.keys(fav)) {
    for (const slug of (fav[wid] || [])) if (!pageSlugs.has(String(slug))) favOrphans++;
  }
}
push('favoritePageSlugs ∉ pages.slug', favOrphans, 'OR/CD-08');

// --- Výstup ---
console.table(rows);
const total = rows.reduce((s, r) => s + r.orphans, 0);
console.log(`\nCELKEM osiřelých/dangling: ${total}`);
console.log(total === 0
  ? '✅ Žádné orphans — cascade je v praxi čistá (přesto kód chybí cleanup → riziko do budoucna).'
  : '🐛 Orphans nalezeny — potvrzuje nálezy CD-xx reálnými daty.');

await client.close();
