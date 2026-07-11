// sensitivity-check.mjs — dokáže, že scanner NENÍ slepý.
// Do SCRATCH db `ikaros_audit_scratch`: (1) čistý stav → scan musí dát 0,
// (2) nastražený orphan → scan musí dát přesně 1 a trefit planted _id, (3) dropDatabase.
import { getClient, idSet, dangling } from './_conn.mjs';

const SCRATCH = 'ikaros_audit_scratch';
const { client, db } = await getClient({ dbNameOverride: SCRATCH });
console.log(`Scratch DB: ${SCRATCH}\n`);

// čistý start
await db.dropDatabase();

async function scanOrphans() {
  const worldIds = await idSet(db, 'worlds');
  return dangling(db, 'characters', 'worldId', worldIds);
}

// --- Fáze 1: čistý stav (1 svět + 1 validní postava) ---
const world = await db.collection('worlds').insertOne({ name: 'Scratch Svet', slug: 'scratch' });
const wid = String(world.insertedId);
await db.collection('characters').insertOne({ name: 'Validni', slug: 'validni', worldId: wid });
const clean = await scanOrphans();
console.log(`Fáze 1 (čistý): orphans = ${clean.count}  →  ${clean.count === 0 ? 'OK (0)' : '❌ ČEKÁNO 0'}`);

// --- Fáze 2: nastražený orphan (worldId na neexistující svět) ---
const FAKE_WORLD = '0123456789abcdef01234567';
const planted = await db.collection('characters').insertOne({ name: 'Nastrazeny Orphan', slug: 'orphan', worldId: FAKE_WORLD });
const pid = String(planted.insertedId);
const dirty = await scanOrphans();
const hit = dirty.samples.some((s) => s.startsWith(pid));
console.log(`Fáze 2 (orphan): orphans = ${dirty.count}  sample=${dirty.samples.join(';')}`);
console.log(`  planted _id=${pid} → ${hit ? 'DETEKOVÁN ✅' : 'NEDETEKOVÁN ❌'}`);

const pass = clean.count === 0 && dirty.count === 1 && hit;
console.log(`\nSENSITIVITA: ${pass ? '✅ OK — scanner reaguje na nastražený orphan (differenciál 0→1, trefil planted _id).' : '❌ SELHALA — scanner slepý nebo šum.'}`);

// --- Fáze 3: úklid ---
await db.dropDatabase();
const stillThere = (await client.db().admin().listDatabases()).databases.some((d) => d.name === SCRATCH);
console.log(`Scratch dropnuta: ${stillThere ? '❌ stále existuje' : 'OK (pryč)'}`);

await client.close();
process.exit(pass && !stillThere ? 0 : 1);
