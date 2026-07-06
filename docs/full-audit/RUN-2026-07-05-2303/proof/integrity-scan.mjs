// integrity-scan.mjs — READ-ONLY DB integrity scan (TYPE/OR/RR/DUP/INV).
// Materializováno z docs/db-integrity-plan/tools/integrity-scan.md (RUN-2026-07-05-2303, ÚKOL 4).
// Spuštění:  MONGO_URI="mongodb://user:pass@host/dbname" node integrity-scan.mjs
// Volitelně: WORLD_SLUG="matrix" node integrity-scan.mjs   (zúží na jeden svět)
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
if (!uri) { console.error('Chybí MONGO_URI'); process.exit(1); }

const client = new MongoClient(uri);
await client.connect();
const db = client.db();
const C = (n) => db.collection(n);
const rows = [];
const push = (label, n, finding) => rows.push({ label, count: n, finding });

// ---------- 0) TYPE detektor (běží první) ----------
// Pro klíčová FK pole: jaký bsonType mají hodnoty napříč kolekcí? Mix = mina.
const TYPE_TARGETS = [
  ['custom_emotes', 'worldId'], ['custom_emotes', 'createdBy'],
  ['pages', 'worldId'], ['characters', 'worldId'], ['worldmemberships', 'worldId'],
  ['worldmemberships', 'userId'], ['worlds', 'ownerId'], ['chatmessages', 'senderId'],
];
console.log('=== TYPE (bsonType per FK pole) ===');
for (const [coll, field] of TYPE_TARGETS) {
  const agg = await C(coll).aggregate([
    { $match: { [field]: { $exists: true, $ne: null } } },
    { $group: { _id: { $type: `$${field}` }, n: { $sum: 1 } } },
  ]).toArray();
  const types = agg.map((a) => `${a._id}:${a.n}`).join(', ');
  const mixed = agg.length > 1 ? '  ⚠️ MIX!' : '';
  console.log(`  ${coll}.${field} → ${types || '(prázdné)'}${mixed}`);
}

// Set _id / pole dané kolekce jako string (pro porovnání se string FK).
async function idSet(coll, field = '_id') {
  const docs = await C(coll).find({}, { projection: { [field]: 1 } }).toArray();
  return new Set(docs.map((d) => String(field === '_id' ? d._id : d[field])).filter(Boolean));
}
// Count dokumentů v `coll`, jejichž `field` (string) není ve validSet.
async function countDangling(coll, field, validSet, extra = {}) {
  const docs = await C(coll)
    .find({ [field]: { $ne: null, $exists: true }, ...extra }, { projection: { [field]: 1 } })
    .toArray();
  return docs.filter((d) => !validSet.has(String(d[field]))).length;
}

const worldIds  = await idSet('worlds');
const charIds   = await idSet('characters');
const charSlugs = await idSet('characters', 'slug');
const sceneIds  = await idSet('mapScenes');
const userIds   = await idSet('users');
const pageSlugs = await idSet('pages', 'slug');
const channelIds = await idSet('chatchannels');
const calIds    = await idSet('world_calendar_configs');
const calSlugs  = await idSet('world_calendar_configs', 'slug');

// ---------- 1) OR — orphans (child s worldId mimo worlds) ----------
const WORLD_SCOPED = ['pages','characters','chatchannels','chatgroups','chatmessages','mapScenes',
  'worldMapEntries','worldMapFolders','game_events','timeline_events','worldnews','worldsettings',
  'worldmemberships','custom_emotes','sounds','world_currencies','bestiae','world_calendar_configs',
  'world_gm_notes','world_page_templates','scheduledMessages','campaignSubjects','campaignScenarios',
  'campaignShopGroups','campaignShopItems','campaignPurchases','world_weather_generators','universeMaps'];
for (const coll of WORLD_SCOPED) {
  try { push(`${coll}.worldId ∉ worlds`, await countDangling(coll, 'worldId', worldIds), 'OR'); }
  catch (e) { push(`${coll}.worldId`, -1, `chyba: ${e.message}`); }
}
for (const coll of ['character_diaries','character_calendars','character_finances',
                    'character_inventories','character_notes','character_accounts']) {
  push(`${coll}.characterId ∉ characters`, await countDangling(coll, 'characterId', charIds), 'OR/CD-09');
}
push('chatmessages.channelId ∉ chatchannels', await countDangling('chatmessages', 'channelId', channelIds), 'OR');

// ---------- 2) RR — broken refs ----------
push('membership.currentSceneId ∉ mapScenes', await countDangling('worldmemberships', 'currentSceneId', sceneIds), 'RR/CD-04');
push('membership.characterPath ∉ characters.slug', await countDangling('worldmemberships', 'characterPath', charSlugs), 'RR/K-DI2');
push('worlds.ownerId ∉ users', await countDangling('worlds', 'ownerId', userIds), 'RR');
push('worldnews.linkPageSlug ∉ pages.slug', await countDangling('worldnews', 'linkPageSlug', pageSlugs), 'RR/K-DI2');
push('timeline.pageSlug ∉ pages.slug', await countDangling('timeline_events', 'pageSlug', pageSlugs), 'RR/K-DI2');
push('campaignSubjects.linkedPageSlug ∉ pages.slug', await countDangling('campaignSubjects', 'linkedPageSlug', pageSlugs), 'RR/K-DI2');
push('campaignSubjects.linkedCharacterSlug ∉ characters.slug', await countDangling('campaignSubjects', 'linkedCharacterSlug', charSlugs), 'RR');
push('worldsettings.timelineCalendarSlug ∉ calendar.slug', await countDangling('worldsettings', 'timelineCalendarSlug', calSlugs), 'RR/K-DI7');
push('character.preferredCalendarConfigId ∉ calendar', await countDangling('characters', 'preferredCalendarConfigId', calIds), 'RR/K-DI7');

// favoritePageSlugs (Map per svět)
let favOrphans = 0;
for (const u of await C('users').find({ favoritePageSlugs: { $exists: true } }, { projection: { favoritePageSlugs: 1 } }).toArray()) {
  const fav = u.favoritePageSlugs || {};
  for (const wid of Object.keys(fav)) for (const s of (fav[wid] || [])) if (!pageSlugs.has(String(s))) favOrphans++;
}
push('favoritePageSlugs ∉ pages.slug', favOrphans, 'RR/CD-08');

// self-ref dangling parent
push('worldMapFolders.parentId ∉ worldMapFolders', await countDangling('worldMapFolders', 'parentId', await idSet('worldMapFolders')), 'RR/SET/K-DI12');
push('campaignShopGroups.parentId ∉ campaignShopGroups', await countDangling('campaignShopGroups', 'parentId', await idSet('campaignShopGroups')), 'RR/SET/K-DI12');

// ---------- 3) DUP — duplicity ----------
async function dupCount(coll, keyExpr, extra = {}) {
  const agg = await C(coll).aggregate([
    { $match: extra }, { $group: { _id: keyExpr, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } },
  ]).toArray();
  return agg.length; // počet duplikovaných klíčů
}
push('DUP membership {userId,worldId}', await dupCount('worldmemberships', { u: '$userId', w: '$worldId' }), 'DUP/IDX');
push('DUP characters {worldId,slug}', await dupCount('characters', { w: '$worldId', s: '$slug' }), 'DUP/IDX');
push('DUP pages {worldId,slug}', await dupCount('pages', { w: '$worldId', s: '$slug' }), 'DUP/IDX');
push('DUP weather generator {worldId,name}', await dupCount('world_weather_generators', { w: '$worldId', n: '$name' }), 'DUP/K-DI3');
// world_currencies.code je embedded array → dopočet zvlášť (níže v INV bloku)

// ---------- 4) INV/CARD/STATE/SET — invarianty (patro 2) ----------
// CARD: postava bez/2 deníky (a podobně). Očekáváno přesně 1 subdoc na postavu.
for (const coll of ['character_diaries','character_finances','character_inventories','character_notes']) {
  const agg = await C(coll).aggregate([{ $group: { _id: '$characterId', n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]).toArray();
  push(`CARD ${coll}: >1 na postavu`, agg.length, 'CARD/K-DI11');
}
// STATE: protichůdné flagy
push('STATE characters isNpc=true ∧ userId set', await C('characters').countDocuments({ isNpc: true, userId: { $ne: null, $exists: true } }), 'STATE/K-DI14');
push('STATE worlds deletedAt ∧ isActive=true', await C('worlds').countDocuments({ deletedAt: { $ne: null, $exists: true }, isActive: true }), 'STATE/K-DI14');
// SET: self-přátelství / self-relationship
push('SET friendship requester==recipient', await C('friendships').countDocuments({ $expr: { $eq: ['$requesterId', '$recipientId'] } }), 'SET');
push('SET relationship subjectA==subjectB', await C('campaignRelationships').countDocuments({ $expr: { $eq: ['$subjectAId', '$subjectBId'] } }), 'SET');
// TEMP
push('TEMP createdAt > updatedAt (pages)', await C('pages').countDocuments({ $expr: { $gt: ['$createdAt', '$updatedAt'] } }), 'TEMP');
// INV: playerCount vs skutečnost (vzorek — dopočítat per svět při ostrém běhu)
//   ponecháno jako TODO: aggregate membership count per worldId vs worlds.playerCount

// ---------- Výstup ----------
console.log('\n=== OR / RR / DUP / INV / CARD / STATE / SET / TEMP ===');
console.table(rows);
const bad = rows.filter((r) => r.count > 0);
const errs = rows.filter((r) => r.count < 0);
console.log(`\nNálezů s count>0: ${bad.length} | chyb dotazu: ${errs.length}`);
console.log(bad.length === 0
  ? '✅ Žádné nekonzistence — integrita v praxi čistá (kód ale pořád chybí validaci → riziko trvá).'
  : '🐛 Nekonzistence nalezeny — potvrzuje DI-xx reálnými daty. ⚠️ Nejdřív ověř TYPE blok (false-negative).');

await client.close();
