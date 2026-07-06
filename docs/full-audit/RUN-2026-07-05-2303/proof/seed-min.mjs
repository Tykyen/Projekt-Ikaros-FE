// seed-min.mjs — MINIMÁLNÍ reprezentativní dataset PROTI lokální (prázdné) Mongo,
// aby šlo dokázat, že integrity-scan.mjs a orphan-scan.mjs reálně detekují orphany.
//
// Vkládá konzistentní jádro (users/worlds/worldmemberships/characters/chatchannels/
// channelreadstatus/bestiae/campaignSubjects/character_accounts/campaignShopItems/
// campaignPurchases) + 3 ZÁMĚRNÉ orphan dokumenty (viz log na konci).
//
// Driver `mongodb` žije jen v backend/node_modules (FE repo ho nemá) → ESM import
// resolution vyžaduje spustit TENTO soubor s cwd = backend (nebo zkopírovaný tam):
//   cd backend && node "<abs-cesta-k-tomuto-souboru>/seed-min.mjs"
// ENV: MONGO_URI (default mongodb://127.0.0.1:27017/ikaros)

import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ikaros';
const client = new MongoClient(uri);
await client.connect();
const db = client.db();
const C = (n) => db.collection(n);
const oid = () => new ObjectId();
const s = (id) => String(id);
const now = new Date();

// Fake/neexistující id — NIKDY nevloženy jako _id žádného dokumentu. Použity
// jen jako "dangling" FK hodnoty pro záměrné orphany.
const FAKE_WORLD_ID = s(oid());
const FAKE_CHANNEL_ID = s(oid());
const FAKE_ACCOUNT_ID = s(oid());
const FAKE_SHOPITEM_ID = s(oid());

// ---------- Users ----------
const u1 = {
  _id: oid(), email: 'pj.tester@proof.local', username: 'pj_tester',
  usernameLower: 'pj_tester', passwordHash: 'x', role: 2, chatColor: '#FFFFFF',
  favoriteCharacters: {}, favoritePageSlugs: {}, createdAt: now, updatedAt: now,
};
const u2 = {
  _id: oid(), email: 'hrac.jedna@proof.local', username: 'hrac_jedna',
  usernameLower: 'hrac_jedna', passwordHash: 'x', role: 2, chatColor: '#FFFFFF',
  favoriteCharacters: {}, favoritePageSlugs: {}, createdAt: now, updatedAt: now,
};
const u3 = {
  _id: oid(), email: 'hrac.dva@proof.local', username: 'hrac_dva',
  usernameLower: 'hrac_dva', passwordHash: 'x', role: 2, chatColor: '#FFFFFF',
  favoriteCharacters: {}, favoritePageSlugs: {}, createdAt: now, updatedAt: now,
};
await C('users').insertMany([u1, u2, u3]);

// ---------- Worlds ----------
const w1 = {
  _id: oid(), name: 'Proof Testovaci Svet', slug: 'proof-testovaci-svet',
  previousSlugs: [], system: 'matrix', ownerId: s(u1._id), isActive: true,
  deletedAt: null, deletedBy: null, accessMode: 'private', playerCount: 2,
  dice: [], tones: [], offeredCharacters: [], defaultCalendarConfigSlug: 'gregorian',
  timelineEpoch: 0, themeId: 'modre-nebe', themeOverrides: {}, lastSeqNumber: 0,
  magicTraditions: [], createdAt: now, updatedAt: now,
};
await C('worlds').insertOne(w1);

// ---------- WorldMemberships (VALID) ----------
const m1 = { _id: oid(), userId: s(u1._id), worldId: s(w1._id), role: 5 /* PJ */, joinedAt: now, akj: 0, isFree: false };
const m2 = { _id: oid(), userId: s(u2._id), worldId: s(w1._id), role: 2 /* Hrac */, joinedAt: now, akj: 0, isFree: false };
await C('worldmemberships').insertMany([m1, m2]);

// ---------- Characters (VALID) ----------
const c1 = {
  _id: oid(), slug: 'hrdina-jedna', name: 'Hrdina Jedna', worldId: s(w1._id),
  userId: s(u2._id), isNpc: false, kind: 'persona', diaryData: {}, extraBlocks: [],
  customData: {}, preferredCalendarConfigId: null, createdAt: now, updatedAt: now,
};
const c2 = {
  _id: oid(), slug: 'strazny-npc', name: 'Strazny NPC', worldId: s(w1._id),
  isNpc: true, kind: 'persona', diaryData: {}, extraBlocks: [], customData: {},
  preferredCalendarConfigId: null, createdAt: now, updatedAt: now,
};
await C('characters').insertMany([c1, c2]);

// ---------- ★ ORPHAN #1 — characters.worldId ∉ worlds (OR/CD-06) ----------
const orphanChar = {
  _id: oid(), slug: 'osireny-hrdina', name: 'Osireny Hrdina (ORPHAN)',
  worldId: FAKE_WORLD_ID, userId: s(u3._id), isNpc: false, kind: 'persona',
  diaryData: {}, extraBlocks: [], customData: {}, preferredCalendarConfigId: null,
  createdAt: now, updatedAt: now,
};
await C('characters').insertOne(orphanChar);

// ---------- ChatChannels (VALID) ----------
const ch1 = {
  _id: oid(), groupId: null, worldId: s(w1._id), name: 'Obecny chat',
  isGlobal: false, accessMode: 'all', allowedRoles: [], allowedMemberIds: [],
  order: 0, isDeleted: false, type: 'all', combatants: [],
  combat: { active: false, round: 0 }, chatCombatConfig: {}, createdAt: now, updatedAt: now,
};
await C('chatchannels').insertOne(ch1);

// ---------- ChannelReadStatus (VALID) ----------
const rs1 = { _id: oid(), userId: s(u2._id), channelId: s(ch1._id), lastReadMessageId: null, lastReadAt: now };
await C('channelreadstatus').insertOne(rs1);

// ---------- ★ ORPHAN #2 — channelreadstatus.channelId ∉ chatchannels (CD-RUN-11) ----------
const orphanRs = { _id: oid(), userId: s(u2._id), channelId: FAKE_CHANNEL_ID, lastReadMessageId: null, lastReadAt: now };
await C('channelreadstatus').insertOne(orphanRs);

// ---------- Bestiae (VALID, s imageUrl) ----------
const b1 = {
  _id: oid(), scope: 'world', systemId: 'matrix', worldId: s(w1._id),
  name: 'Testovaci Bestie', imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/ikaros/bestiae/proof-test-bestie.webp',
  imageFocalX: null, imageFocalY: null, imageZoom: null, imageFit: null,
  notes: '', description: 'Proof bestie s obrazkem.', systemStats: {},
  deletedAt: null, createdAt: now, updatedAt: now,
};
await C('bestiae').insertOne(b1);

// ---------- CampaignSubjects (VALID) ----------
const cs1 = {
  _id: oid(), worldId: s(w1._id), ownerId: s(u1._id), isShared: true, type: 'NPC',
  name: 'Proof NPC Subjekt', tags: [], status: 'active', createdAt: now, updatedAt: now,
};
await C('campaignSubjects').insertOne(cs1);

// ---------- CharacterAccount + CampaignShopItem (VALID — podklad pro campaignPurchases) ----------
const acc1 = {
  _id: oid(), worldId: s(w1._id), label: 'Osobni ucet', ownerCharacterIds: [s(c1._id)],
  primaryOwnerId: s(c1._id), accountType: 'Osobni', accessLocation: null,
  currency: 'zlaty', balance: 100, incomeEntries: [], expenseEntries: [],
  transactions: [], notes: '', allowPlayerSelfAdjust: false, createdAt: now, updatedAt: now,
};
await C('character_accounts').insertOne(acc1);

const item1 = {
  _id: oid(), worldId: s(w1._id), ownerId: s(u1._id), isShared: true,
  name: 'Prasny mec', groupId: '', price: 10, currencyCode: 'zlaty',
  discountPercent: 0, linkedItemIds: [], isRecommended: false, createdAt: now, updatedAt: now,
};
await C('campaignShopItems').insertOne(item1);

// ---------- CampaignPurchases (VALID) ----------
const purchase1 = {
  _id: oid(), worldId: s(w1._id), characterId: s(c1._id), buyerUserId: s(u2._id),
  shopItemId: s(item1._id), itemSnapshot: {}, quantity: 1, unitPriceOriginal: 10,
  discountPercent: 0, accountId: s(acc1._id), accountTransactionId: '',
  paidAmount: 10, paidCurrency: 'zlaty', inventorySectionId: '', inventoryItemId: '',
  status: 'active', createdAt: now, updatedAt: now,
};
await C('campaignPurchases').insertOne(purchase1);

// ---------- ★ ORPHAN #3 — campaignPurchases.accountId/shopItemId ∉ character_accounts/campaignShopItems (DI-RUN string-FK) ----------
const orphanPurchase = {
  _id: oid(), worldId: s(w1._id), characterId: s(c1._id), buyerUserId: s(u2._id),
  shopItemId: FAKE_SHOPITEM_ID, itemSnapshot: {}, quantity: 1, unitPriceOriginal: 10,
  discountPercent: 0, accountId: FAKE_ACCOUNT_ID, accountTransactionId: '',
  paidAmount: 10, paidCurrency: 'zlaty', inventorySectionId: '', inventoryItemId: '',
  status: 'active', createdAt: now, updatedAt: now,
};
await C('campaignPurchases').insertOne(orphanPurchase);

// ---------- LOG ----------
console.log('=== SEED HOTOV (DB: %s) ===', db.databaseName);
console.log('users:', 3, '→', [u1, u2, u3].map((u) => s(u._id)).join(', '));
console.log('worlds:', 1, '→', s(w1._id));
console.log('worldmemberships (valid):', 2);
console.log('characters (valid):', 2, '→', [s(c1._id), s(c2._id)].join(', '));
console.log('chatchannels (valid):', 1, '→', s(ch1._id));
console.log('channelreadstatus (valid):', 1);
console.log('bestiae (valid, s imageUrl):', 1, '→', s(b1._id));
console.log('campaignSubjects (valid):', 1, '→', s(cs1._id));
console.log('character_accounts (valid):', 1, '→', s(acc1._id));
console.log('campaignShopItems (valid):', 1, '→', s(item1._id));
console.log('campaignPurchases (valid):', 1, '→', s(purchase1._id));
console.log('\n=== ★ ZÁMĚRNÉ ORPHANY (_id) — MUSÍ je najít scan ★ ===');
console.log('ORPHAN-1 [characters._id=%s] worldId=%s ∉ worlds  (OR/CD-06, orphan-scan i integrity-scan)', s(orphanChar._id), FAKE_WORLD_ID);
console.log('ORPHAN-2 [channelreadstatus._id=%s] channelId=%s ∉ chatchannels  (CD-RUN-11 — POZOR: žádný ze scanů tuto kolekci vůbec nekontroluje)', s(orphanRs._id), FAKE_CHANNEL_ID);
console.log('ORPHAN-3 [campaignPurchases._id=%s] accountId=%s ∉ character_accounts, shopItemId=%s ∉ campaignShopItems  (DI-RUN string-FK — POZOR: žádný ze scanů tato pole nekontroluje, jen worldId)', s(orphanPurchase._id), FAKE_ACCOUNT_ID, FAKE_SHOPITEM_ID);
console.log('\nPOZN: 4. orphan (blob imageUrl/avatarUrl bez Cloudinary entity) VYNECHÁN — ani integrity-scan.mjs ani orphan-scan.mjs neobsahuje ŽÁDNOU blob-check logiku (ověřeno čtením kódu), seedovat by bylo zavádějící (scan by ho principiálně nemohl najít).');

await client.close();
