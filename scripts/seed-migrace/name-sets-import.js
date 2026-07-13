/*
 * 21.2a — Import jmenných sad (Morvol + státy světa, ~76 sad) do PROD Mongo.
 * Běží UVNITŘ BE kontejneru (MONGODB_URI + mongoose v /app). Bez obrázků.
 * Idempotentní: smaže předchozí seed (dle seedTag) a vloží znovu; ručně
 * vytvořených sad se nedotkne. Vstup: SEED_JSON (default /tmp/name-sets-seed.json).
 */
const mongoose = require('mongoose');
const fs = require('fs');

const SEED_JSON = process.env.SEED_JSON || '/tmp/name-sets-seed.json';
const AUTHOR_EMAIL = 'tykytanjunior@gmail.com';
const SEED_TAG = 'name-sets:v1';

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI neni v prostredi (spoustis v BE kontejneru?)');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const author = await db.collection('users').findOne({ email: AUTHOR_EMAIL });
  if (!author) throw new Error('Autor (Superadmin) nenalezen: ' + AUTHOR_EMAIL);
  const aid = String(author._id);
  console.log('Autor:', AUTHOR_EMAIL, '->', aid);

  const seed = JSON.parse(fs.readFileSync(SEED_JSON, 'utf8'));
  console.log('Vstup:', seed.sets.length, 'sad');

  const del = await db.collection('name_sets').deleteMany({ seedTag: SEED_TAG });
  console.log('Smazano predchozich:', del.deletedCount);

  const now = new Date();
  const docs = seed.sets.map((s) => ({
    scope: 'community',
    name: s.name,
    category: s.category,
    description: s.description || '',
    surnameNote: s.surnameNote,
    tags: s.tags,
    maleNames: s.maleNames,
    femaleNames: s.femaleNames,
    surnames: s.surnames,
    epithets: s.epithets ?? [],
    femaleSurnameRule: s.femaleSurnameRule ?? 'none',
    frequencySorted: s.frequencySorted ?? false,
    demography: s.demography,
    status: 'approved',
    authorId: aid,
    approvedBy: aid,
    approvedAt: now,
    seedTag: SEED_TAG,
    createdAt: now,
    updatedAt: now,
  }));

  const r = await db.collection('name_sets').insertMany(docs, { ordered: false });
  console.log('HOTOVO. Vlozeno:', r.insertedCount, '/', docs.length);
  await mongoose.disconnect();
})().catch((e) => {
  console.error('CHYBA:', e);
  process.exit(1);
});
