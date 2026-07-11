// orphan-scan.mjs — READ-ONLY cascade-delete orphan/dangling scan.
// Zdroj: docs/cascade-delete-plan/tools/orphan-scan.md — materializováno + sample _id.
import { getClient, idSet, dangling } from './_conn.mjs';

const { client, db, info } = await getClient();
const C = (n) => db.collection(n);
console.log(`DB=${info.db} @ ${info.host}:${info.port}\n`);

const worldIds = await idSet(db, 'worlds');
const charIds = await idSet(db, 'characters');
const charSlugs = await idSet(db, 'characters', 'slug');
const sceneIds = await idSet(db, 'mapScenes');
const userIds = await idSet(db, 'users');
const pageSlugs = await idSet(db, 'pages', 'slug');

const rows = [];
const push = (label, r, finding) => {
  const count = typeof r === 'number' ? r : r.count;
  const samples = typeof r === 'number' ? [] : r.samples;
  rows.push({ label, orphans: count, finding, sample: samples.slice(0, 3).join(' | ') });
};

// --- Orphans: child s worldId mimo worlds ---
const WORLD_SCOPED = ['pages','characters','chatchannels','chatgroups','chatmessages',
  'mapScenes','worldMaps','game_events','timeline_events','worldnews','worldsettings',
  'worldmemberships','custom_emotes','sounds','world_currencies','bestiae'];
for (const coll of WORLD_SCOPED) {
  push(`${coll}.worldId ∉ worlds`, await dangling(db, coll, 'worldId', worldIds), 'OR/CD-06');
}

// --- Orphans: subdocy s characterId mimo characters ---
for (const coll of ['character_diaries','character_calendars','character_finances',
                    'character_inventories','character_notes','character_accounts']) {
  push(`${coll}.characterId ∉ characters`, await dangling(db, coll, 'characterId', charIds), 'OR/CD-09');
}

// --- Dangling refs ---
push('membership.currentSceneId ∉ mapScenes', await dangling(db, 'worldmemberships', 'currentSceneId', sceneIds), 'DR/CD-04');
push('membership.characterPath ∉ characters.slug', await dangling(db, 'worldmemberships', 'characterPath', charSlugs), 'DR');
push('worlds.ownerId ∉ users', await dangling(db, 'worlds', 'ownerId', userIds), 'DR');

// --- favoritePageSlugs (pole per world) ---
let favOrphans = 0;
const users = await C('users').find({ favoritePageSlugs: { $exists: true } }, { projection: { favoritePageSlugs: 1 } }).toArray();
for (const u of users) {
  const fav = u.favoritePageSlugs || {};
  for (const wid of Object.keys(fav)) for (const slug of (fav[wid] || [])) if (!pageSlugs.has(String(slug))) favOrphans++;
}
push('favoritePageSlugs ∉ pages.slug', favOrphans, 'OR/CD-08');

// --- Výstup ---
console.table(rows);
const bad = rows.filter((r) => r.orphans > 0);
const total = rows.reduce((s, r) => s + r.orphans, 0);
if (bad.length) { console.log('🐛 Detail orphanů:'); for (const b of bad) console.log(`  [${b.finding}] ${b.label} = ${b.orphans}  ${b.sample ? '→ ' + b.sample : ''}`); }
console.log(`\nCELKEM osiřelých/dangling: ${total}`);
console.log(total === 0
  ? '✅ Žádné orphans — cascade je v praxi čistá (přesto kód chybí cleanup → riziko do budoucna).'
  : '🐛 Orphans nalezeny — potvrzuje nálezy CD-xx reálnými daty.');

await client.close();
