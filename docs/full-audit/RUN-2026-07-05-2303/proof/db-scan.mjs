// db-scan.mjs — KONSOLIDOVANÝ READ-ONLY DB scan (integrity + orphan/cascade).
// Sloučení proof/integrity-scan.mjs + proof/orphan-scan.mjs + doplněné FK hrany
// potvrzené seedem (proof/seed-min.mjs) a nálezy auditu (DI-RUN-09/10/11, CD-RUN-11).
//
// ⚠️ READ-ONLY GARANCE: skript používá VÝHRADNĚ find / aggregate / distinct /
//    countDocuments / listCollections. ŽÁDNÝ insert / update / delete / drop /
//    bulkWrite / findOneAndUpdate / createIndex — nic mutačního. Bezpečné proti PRODU.
//
// Spuštění (driver `mongodb` žije jen v backend/node_modules → cwd = backend):
//   cd backend
//   MONGO_URI="mongodb://user:pass@host/dbname" node <abs-cesta>/db-scan.mjs
// ENV:
//   MONGO_URI    connection string (fallback mongodb://127.0.0.1:27017/ikaros)
//   WORLD_SLUG   (volitelné) — jen informativní log; scan běží nad celou DB
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ikaros';
const client = new MongoClient(uri);
await client.connect();
const db = client.db();
const C = (n) => db.collection(n);

const rows = [];
// finding = tag/původ hrany; count = počet orphanů (>0 = nález, -1 = chyba dotazu)
const push = (label, count, finding) => rows.push({ label, count, finding });

// Set _id (nebo jiného pole) dané kolekce jako string (pro porovnání se string FK).
async function idSet(coll, field = '_id') {
  const docs = await C(coll)
    .find({}, { projection: { [field]: 1 } })
    .toArray();
  return new Set(
    docs.map((d) => String(field === '_id' ? d._id : d[field])).filter(Boolean),
  );
}

// Počet dokumentů v `coll`, jejichž `field` (string, neprázdný) NENÍ ve validSet.
// Prázdný string / null / chybějící pole = "žádná reference" → NEpočítá se jako orphan.
async function countDangling(coll, field, validSet, extra = {}) {
  const docs = await C(coll)
    .find(
      { [field]: { $exists: true, $nin: [null, ''] }, ...extra },
      { projection: { [field]: 1 } },
    )
    .toArray();
  return docs.filter((d) => !validSet.has(String(d[field]))).length;
}

// Bezpečný wrapper — nechybující kolekce/pole nezhavaruje celý sken.
async function safe(label, finding, fn) {
  try {
    push(label, await fn(), finding);
  } catch (e) {
    push(label, -1, `${finding} · chyba: ${e.message}`);
  }
}

// ---------- 0) TYPE detektor (mix bsonType na FK poli = mina pro string-porovnání) ----------
const TYPE_TARGETS = [
  ['custom_emotes', 'worldId'],
  ['custom_emotes', 'createdBy'],
  ['pages', 'worldId'],
  ['characters', 'worldId'],
  ['worldmemberships', 'worldId'],
  ['worldmemberships', 'userId'],
  ['worlds', 'ownerId'],
  ['chatmessages', 'senderId'],
  ['channelreadstatus', 'channelId'],
  ['campaignPurchases', 'accountId'],
  ['campaignPurchases', 'shopItemId'],
  ['campaignRelationships', 'subjectAId'],
  ['mapScenes', 'templateId'],
];
console.log('=== TYPE (bsonType per FK pole; MIX = false-negative riziko) ===');
for (const [coll, field] of TYPE_TARGETS) {
  try {
    const agg = await C(coll)
      .aggregate([
        { $match: { [field]: { $exists: true, $ne: null } } },
        { $group: { _id: { $type: `$${field}` }, n: { $sum: 1 } } },
      ])
      .toArray();
    const types = agg.map((a) => `${a._id}:${a.n}`).join(', ');
    const mixed = agg.length > 1 ? '  ⚠️ MIX!' : '';
    console.log(`  ${coll}.${field} → ${types || '(prázdné)'}${mixed}`);
  } catch (e) {
    console.log(`  ${coll}.${field} → chyba: ${e.message}`);
  }
}

// ---------- Předpočítané sety _id / slugů ----------
const worldIds = await idSet('worlds');
const charIds = await idSet('characters');
const charSlugs = await idSet('characters', 'slug');
const sceneIds = await idSet('mapScenes');
const userIds = await idSet('users');
const pageSlugs = await idSet('pages', 'slug');
const channelIds = await idSet('chatchannels');
const calIds = await idSet('world_calendar_configs');
const calSlugs = await idSet('world_calendar_configs', 'slug');
const accountIds = await idSet('character_accounts'); // ORPHAN-3
const shopItemIds = await idSet('campaignShopItems'); // ORPHAN-3
const subjectIds = await idSet('campaignSubjects'); // DI-RUN-09/10
const mapTemplateIds = await idSet('mapTemplates'); // DI-RUN-11

// ---------- 1) OR — orphans: child.worldId mimo worlds ----------
// Sjednocení WORLD_SCOPED z obou původních skriptů.
const WORLD_SCOPED = [
  'pages', 'characters', 'chatchannels', 'chatgroups', 'chatmessages', 'mapScenes',
  'worldMaps', 'worldMapEntries', 'worldMapFolders', 'game_events', 'timeline_events',
  'worldnews', 'worldsettings', 'worldmemberships', 'custom_emotes', 'sounds',
  'world_currencies', 'bestiae', 'world_calendar_configs', 'world_gm_notes',
  'world_page_templates', 'scheduledMessages', 'campaignSubjects', 'campaignScenarios',
  'campaignShopGroups', 'campaignShopItems', 'campaignPurchases', 'campaignRelationships',
  'world_weather_generators', 'universeMaps',
];
for (const coll of WORLD_SCOPED) {
  await safe(`${coll}.worldId ∉ worlds`, 'OR/CD-06', () =>
    countDangling(coll, 'worldId', worldIds),
  );
}

// ---------- 1b) OR — subdocy s characterId mimo characters ----------
for (const coll of [
  'character_diaries', 'character_calendars', 'character_finances',
  'character_inventories', 'character_notes', 'character_accounts',
]) {
  await safe(`${coll}.characterId ∉ characters`, 'OR/CD-09', () =>
    countDangling(coll, 'characterId', charIds),
  );
}

// ---------- 1c) OR — chat FK ----------
await safe('chatmessages.channelId ∉ chatchannels', 'OR', () =>
  countDangling('chatmessages', 'channelId', channelIds),
);
// ★ NOVÉ — CD-RUN-11 / ORPHAN-2 (žádný z původních skriptů tuto kolekci nekontroloval)
await safe('channelreadstatus.channelId ∉ chatchannels', 'OR/CD-RUN-11', () =>
  countDangling('channelreadstatus', 'channelId', channelIds),
);

// ---------- 1d) OR — campaign string-FK (★ NOVÉ, DI-RUN + ORPHAN-3) ----------
await safe('campaignPurchases.accountId ∉ character_accounts', 'RR/DI-RUN/ORPHAN-3', () =>
  countDangling('campaignPurchases', 'accountId', accountIds),
);
await safe('campaignPurchases.shopItemId ∉ campaignShopItems', 'RR/DI-RUN/ORPHAN-3', () =>
  countDangling('campaignPurchases', 'shopItemId', shopItemIds),
);
// ★ NOVÉ — DI-RUN-09/10: relationship subjekty
await safe('campaignRelationships.subjectAId ∉ campaignSubjects', 'RR/DI-RUN-09', () =>
  countDangling('campaignRelationships', 'subjectAId', subjectIds),
);
await safe('campaignRelationships.subjectBId ∉ campaignSubjects', 'RR/DI-RUN-10', () =>
  countDangling('campaignRelationships', 'subjectBId', subjectIds),
);
// ★ NOVÉ — DI-RUN-11: scéna vytvořená ze šablony (optional templateId)
await safe('mapScenes.templateId ∉ mapTemplates', 'RR/DI-RUN-11', () =>
  countDangling('mapScenes', 'templateId', mapTemplateIds),
);

// ---------- 2) RR — broken refs (z integrity-scan) ----------
await safe('worldmemberships.currentSceneId ∉ mapScenes', 'RR/CD-04', () =>
  countDangling('worldmemberships', 'currentSceneId', sceneIds),
);
await safe('worldmemberships.characterPath ∉ characters.slug', 'RR/K-DI2', () =>
  countDangling('worldmemberships', 'characterPath', charSlugs),
);
await safe('worlds.ownerId ∉ users', 'RR', () =>
  countDangling('worlds', 'ownerId', userIds),
);
await safe('worldnews.linkPageSlug ∉ pages.slug', 'RR/K-DI2', () =>
  countDangling('worldnews', 'linkPageSlug', pageSlugs),
);
await safe('timeline_events.pageSlug ∉ pages.slug', 'RR/K-DI2', () =>
  countDangling('timeline_events', 'pageSlug', pageSlugs),
);
await safe('campaignSubjects.linkedPageSlug ∉ pages.slug', 'RR/K-DI2', () =>
  countDangling('campaignSubjects', 'linkedPageSlug', pageSlugs),
);
await safe('campaignSubjects.linkedCharacterSlug ∉ characters.slug', 'RR', () =>
  countDangling('campaignSubjects', 'linkedCharacterSlug', charSlugs),
);
await safe('worldsettings.timelineCalendarSlug ∉ calendar.slug', 'RR/K-DI7', () =>
  countDangling('worldsettings', 'timelineCalendarSlug', calSlugs),
);
await safe('characters.preferredCalendarConfigId ∉ calendar', 'RR/K-DI7', () =>
  countDangling('characters', 'preferredCalendarConfigId', calIds),
);

// self-ref dangling parent
await safe('worldMapFolders.parentId ∉ worldMapFolders', 'RR/SET/K-DI12', async () =>
  countDangling('worldMapFolders', 'parentId', await idSet('worldMapFolders')),
);
await safe('campaignShopGroups.parentId ∉ campaignShopGroups', 'RR/SET/K-DI12', async () =>
  countDangling('campaignShopGroups', 'parentId', await idSet('campaignShopGroups')),
);

// favoritePageSlugs (Map per svět uvnitř users)
await safe('users.favoritePageSlugs ∉ pages.slug', 'RR/CD-08', async () => {
  let favOrphans = 0;
  const us = await C('users')
    .find({ favoritePageSlugs: { $exists: true } }, { projection: { favoritePageSlugs: 1 } })
    .toArray();
  for (const u of us) {
    const fav = u.favoritePageSlugs || {};
    for (const wid of Object.keys(fav))
      for (const sl of fav[wid] || []) if (!pageSlugs.has(String(sl))) favOrphans++;
  }
  return favOrphans;
});

// ---------- 3) DUP — duplicitní unique klíče ----------
async function dupCount(coll, keyExpr, extra = {}) {
  const agg = await C(coll)
    .aggregate([
      { $match: extra },
      { $group: { _id: keyExpr, n: { $sum: 1 } } },
      { $match: { n: { $gt: 1 } } },
    ])
    .toArray();
  return agg.length;
}
await safe('DUP worldmemberships {userId,worldId}', 'DUP/IDX', () =>
  dupCount('worldmemberships', { u: '$userId', w: '$worldId' }),
);
await safe('DUP characters {worldId,slug}', 'DUP/IDX', () =>
  dupCount('characters', { w: '$worldId', s: '$slug' }),
);
await safe('DUP pages {worldId,slug}', 'DUP/IDX', () =>
  dupCount('pages', { w: '$worldId', s: '$slug' }),
);
await safe('DUP world_weather_generators {worldId,name}', 'DUP/K-DI3', () =>
  dupCount('world_weather_generators', { w: '$worldId', n: '$name' }),
);
await safe('DUP channelreadstatus {userId,channelId}', 'DUP/IDX', () =>
  dupCount('channelreadstatus', { u: '$userId', c: '$channelId' }),
);

// ---------- 4) INV / CARD / STATE / SET / TEMP ----------
for (const coll of [
  'character_diaries', 'character_finances', 'character_inventories', 'character_notes',
]) {
  await safe(`CARD ${coll}: >1 na postavu`, 'CARD/K-DI11', async () => {
    const agg = await C(coll)
      .aggregate([
        { $group: { _id: '$characterId', n: { $sum: 1 } } },
        { $match: { n: { $gt: 1 } } },
      ])
      .toArray();
    return agg.length;
  });
}
await safe('STATE characters isNpc=true ∧ userId set', 'STATE/K-DI14', () =>
  C('characters').countDocuments({ isNpc: true, userId: { $ne: null, $exists: true } }),
);
await safe('STATE worlds deletedAt ∧ isActive=true', 'STATE/K-DI14', () =>
  C('worlds').countDocuments({ deletedAt: { $ne: null, $exists: true }, isActive: true }),
);
await safe('SET friendship requester==recipient', 'SET', () =>
  C('friendships').countDocuments({ $expr: { $eq: ['$requesterId', '$recipientId'] } }),
);
await safe('SET relationship subjectA==subjectB', 'SET', () =>
  C('campaignRelationships').countDocuments({ $expr: { $eq: ['$subjectAId', '$subjectBId'] } }),
);
await safe('TEMP pages createdAt > updatedAt', 'TEMP', () =>
  C('pages').countDocuments({ $expr: { $gt: ['$createdAt', '$updatedAt'] } }),
);

// ---------- 5) BLOB — informativní přehled (Cloudinary orphan check = TODO) ----------
// Read-only: countDocuments s filtrem neprázdného blob URL. NEřeší, zda blob
// reálně existuje v Cloudinary (to by chtělo Cloudinary Admin API) — jen kolik
// dokumentů drží blob referenci. TODO: cross-check s Cloudinary API (mimo tento sken).
const blobRows = [];
try {
  const colls = (await db.listCollections().toArray()).map((c) => c.name);
  for (const name of colls) {
    for (const field of ['imageUrl', 'avatarUrl']) {
      const n = await C(name).countDocuments({ [field]: { $type: 'string', $nin: [null, ''] } });
      if (n > 0) blobRows.push({ coll: name, field, docsWithBlob: n });
    }
  }
} catch (e) {
  console.log('BLOB sken chyba:', e.message);
}

// ---------- Výstup ----------
console.log('\n=== FK / OR / RR / DUP / INV / CARD / STATE / SET / TEMP ===');
console.table(rows);

console.log('\n=== BLOB (informativní — kolik dokumentů drží neprázdný blob URL) ===');
console.log('TODO: skutečný Cloudinary-orphan check vyžaduje Cloudinary Admin API (mimo tento read-only DB sken).');
if (blobRows.length) console.table(blobRows);
else console.log('  (žádná kolekce s neprázdným imageUrl/avatarUrl)');

const bad = rows.filter((r) => r.count > 0);
const errs = rows.filter((r) => r.count < 0);
const totalOrphans = bad.reduce((s, r) => s + r.count, 0);

console.log('\n=== SOUHRN: KOLEKCE.pole → počet orphanů (jen count>0) ===');
if (bad.length === 0) {
  console.log('  ✅ Žádné orphany/nekonzistence — integrita v praxi čistá.');
} else {
  for (const r of bad.sort((a, b) => b.count - a.count)) {
    console.log(`  🐛 ${r.label} → ${r.count}   [${r.finding}]`);
  }
}
if (errs.length) {
  console.log('\n  ⚠️ Chyby dotazu (kolekce/pole chybí?):');
  for (const r of errs) console.log(`     ${r.label} — ${r.finding}`);
}

console.log(`\nCELKEM orphanů (součet count>0): ${totalOrphans}`);
console.log(`Hran s nálezem: ${bad.length} | čistých hran: ${rows.length - bad.length - errs.length} | chyb dotazu: ${errs.length}`);
console.log(
  totalOrphans === 0
    ? '✅ Čistá DB (kód ale pořád může chybět validaci → riziko do budoucna trvá).'
    : '🐛 Nekonzistence nalezeny — potvrzuje DI-xx / CD-xx reálnými daty. ⚠️ Ověř TYPE blok výše (MIX = false-negative).',
);

await client.close();
process.exit(0); // scan report, ne CI gate → vždy exit 0
