// integrity-scan.mjs — READ-ONLY DB integrity scan (TYPE/OR/RR/DUP/INV/CARD/STATE/SET/TEMP).
// Zdroj: docs/db-integrity-plan/tools/integrity-scan.md — materializováno + sample _id.
// Připojení bere z backend/.env (viz _conn.mjs). Žádný write/update/delete.
import { getClient, idSet, dangling } from './_conn.mjs';

const { client, db, info } = await getClient();
const C = (n) => db.collection(n);
console.log(`DB=${info.db} @ ${info.host}:${info.port}\n`);

const rows = [];
const push = (label, r, finding) => {
  const count = typeof r === 'number' ? r : r.count;
  const samples = typeof r === 'number' ? [] : r.samples;
  rows.push({ label, count, finding, sample: samples.slice(0, 3).join(' | ') });
};

// ---------- 0) TYPE detektor (běží první) ----------
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

const worldIds  = await idSet(db, 'worlds');
const charIds   = await idSet(db, 'characters');
const charSlugs = await idSet(db, 'characters', 'slug');
const sceneIds  = await idSet(db, 'mapScenes');
const userIds   = await idSet(db, 'users');
const pageSlugs = await idSet(db, 'pages', 'slug');
const channelIds = await idSet(db, 'chatchannels');
const calIds    = await idSet(db, 'world_calendar_configs');
const calSlugs  = await idSet(db, 'world_calendar_configs', 'slug');

// ---------- 1) OR — orphans (child s worldId mimo worlds) ----------
const WORLD_SCOPED = ['pages','characters','chatchannels','chatgroups','chatmessages','mapScenes',
  'worldMapEntries','worldMapFolders','game_events','timeline_events','worldnews','worldsettings',
  'worldmemberships','custom_emotes','sounds','world_currencies','bestiae','world_calendar_configs',
  'world_gm_notes','world_page_templates','scheduledMessages','campaignSubjects','campaignScenarios',
  'campaignShopGroups','campaignShopItems','campaignPurchases','world_weather_generators','universeMaps'];
for (const coll of WORLD_SCOPED) {
  try { push(`${coll}.worldId ∉ worlds`, await dangling(db, coll, 'worldId', worldIds), 'OR'); }
  catch (e) { push(`${coll}.worldId`, -1, `chyba: ${e.message}`); }
}
for (const coll of ['character_diaries','character_calendars','character_finances',
                    'character_inventories','character_notes','character_accounts']) {
  push(`${coll}.characterId ∉ characters`, await dangling(db, coll, 'characterId', charIds), 'OR/CD-09');
}
push('chatmessages.channelId ∉ chatchannels', await dangling(db, 'chatmessages', 'channelId', channelIds), 'OR');

// ---------- 2) RR — broken refs ----------
push('membership.currentSceneId ∉ mapScenes', await dangling(db, 'worldmemberships', 'currentSceneId', sceneIds), 'RR/CD-04');
push('membership.characterPath ∉ characters.slug', await dangling(db, 'worldmemberships', 'characterPath', charSlugs), 'RR/K-DI2');
push('worlds.ownerId ∉ users', await dangling(db, 'worlds', 'ownerId', userIds), 'RR');
push('worldnews.linkPageSlug ∉ pages.slug', await dangling(db, 'worldnews', 'linkPageSlug', pageSlugs), 'RR/K-DI2');
push('timeline.pageSlug ∉ pages.slug', await dangling(db, 'timeline_events', 'pageSlug', pageSlugs), 'RR/K-DI2');
push('campaignSubjects.linkedPageSlug ∉ pages.slug', await dangling(db, 'campaignSubjects', 'linkedPageSlug', pageSlugs), 'RR/K-DI2');
push('campaignSubjects.linkedCharacterSlug ∉ characters.slug', await dangling(db, 'campaignSubjects', 'linkedCharacterSlug', charSlugs), 'RR');
push('worldsettings.timelineCalendarSlug ∉ calendar.slug', await dangling(db, 'worldsettings', 'timelineCalendarSlug', calSlugs), 'RR/K-DI7');
push('character.preferredCalendarConfigId ∉ calendar', await dangling(db, 'characters', 'preferredCalendarConfigId', calIds), 'RR/K-DI7');

// favoritePageSlugs (Map per svět)
let favOrphans = 0;
for (const u of await C('users').find({ favoritePageSlugs: { $exists: true } }, { projection: { favoritePageSlugs: 1 } }).toArray()) {
  const fav = u.favoritePageSlugs || {};
  for (const wid of Object.keys(fav)) for (const s of (fav[wid] || [])) if (!pageSlugs.has(String(s))) favOrphans++;
}
push('favoritePageSlugs ∉ pages.slug', favOrphans, 'RR/CD-08');

// self-ref dangling parent
push('worldMapFolders.parentId ∉ worldMapFolders', await dangling(db, 'worldMapFolders', 'parentId', await idSet(db, 'worldMapFolders')), 'RR/SET/K-DI12');
push('campaignShopGroups.parentId ∉ campaignShopGroups', await dangling(db, 'campaignShopGroups', 'parentId', await idSet(db, 'campaignShopGroups')), 'RR/SET/K-DI12');

// ---------- 3) DUP — duplicity ----------
async function dupCount(coll, keyExpr, extra = {}) {
  const agg = await C(coll).aggregate([
    { $match: extra }, { $group: { _id: keyExpr, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } },
  ]).toArray();
  return agg.length;
}
push('DUP membership {userId,worldId}', await dupCount('worldmemberships', { u: '$userId', w: '$worldId' }), 'DUP/IDX');
push('DUP characters {worldId,slug}', await dupCount('characters', { w: '$worldId', s: '$slug' }), 'DUP/IDX');
push('DUP pages {worldId,slug}', await dupCount('pages', { w: '$worldId', s: '$slug' }), 'DUP/IDX');
push('DUP weather generator {worldId,name}', await dupCount('world_weather_generators', { w: '$worldId', n: '$name' }), 'DUP/K-DI3');

// ---------- 4) INV/CARD/STATE/SET/TEMP ----------
for (const coll of ['character_diaries','character_finances','character_inventories','character_notes']) {
  const agg = await C(coll).aggregate([{ $group: { _id: '$characterId', n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]).toArray();
  push(`CARD ${coll}: >1 na postavu`, agg.length, 'CARD/K-DI11');
}
push('STATE characters isNpc=true ∧ userId set', await C('characters').countDocuments({ isNpc: true, userId: { $ne: null, $exists: true } }), 'STATE/K-DI14');
push('STATE worlds deletedAt ∧ isActive=true', await C('worlds').countDocuments({ deletedAt: { $ne: null, $exists: true }, isActive: true }), 'STATE/K-DI14');
push('SET friendship requester==recipient', await C('friendships').countDocuments({ $expr: { $eq: ['$requesterId', '$recipientId'] } }), 'SET');
push('SET relationship subjectA==subjectB', await C('campaignRelationships').countDocuments({ $expr: { $eq: ['$subjectAId', '$subjectBId'] } }), 'SET');
push('TEMP createdAt > updatedAt (pages)', await C('pages').countDocuments({ $expr: { $gt: ['$createdAt', '$updatedAt'] } }), 'TEMP');

// ---------- Výstup ----------
console.log('\n=== OR / RR / DUP / INV / CARD / STATE / SET / TEMP ===');
console.table(rows);
const bad = rows.filter((r) => r.count > 0);
const errs = rows.filter((r) => r.count < 0);
console.log(`\nNálezů s count>0: ${bad.length} | chyb dotazu: ${errs.length}`);
if (bad.length) { console.log('🐛 Detail nálezů:'); for (const b of bad) console.log(`  [${b.finding}] ${b.label} = ${b.count}  ${b.sample ? '→ ' + b.sample : ''}`); }
console.log(bad.length === 0
  ? '✅ Žádné nekonzistence — integrita v praxi čistá (kód ale pořád chybí validaci → riziko trvá).'
  : '🐛 Nekonzistence nalezeny — potvrzuje DI-xx reálnými daty. ⚠️ Nejdřív ověř TYPE blok (false-negative).');

await client.close();
