/*
 * Import v2 komunitních bestií do PROD Mongo. Běží UVNITŘ BE kontejneru.
 * Nahrazuje předchozí (vadnou) migraci: SMAŽE všechny seed-migrované bestie
 * (clonedFromId ^seed:jad:) a vloží čerstvých ~584 z opraveného parseru.
 * Idempotentní přes delete+insert (opakované spuštění dá stejný výsledek).
 */
const mongoose = require('mongoose');
const fs = require('fs');
const NDJSON = process.env.NDJSON || '/tmp/bestie.ndjson';
const AUTHOR_EMAIL = 'tykytanjunior@gmail.com';

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI neni v prostredi (spoustis v BE kontejneru?)');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const author = await db.collection('users').findOne({ email: AUTHOR_EMAIL });
  if (!author) throw new Error('Autor (Superadmin) nenalezen: ' + AUTHOR_EMAIL);
  const aid = String(author._id);
  console.log('Autor:', AUTHOR_EMAIL, '->', aid);

  const del = await db.collection('bestiae').deleteMany({ clonedFromId: { $regex: '^seed:jad:' } });
  console.log('Smazano starych seed-migrovanych:', del.deletedCount);

  const lines = fs.readFileSync(NDJSON, 'utf8').split('\n').filter((l) => l.trim());
  console.log('Radku v souboru:', lines.length);

  const docs = lines.map((l) => {
    const d = JSON.parse(l);
    d.authorId = aid; d.approvedBy = aid;
    if (d.statblocks && d.statblocks.jad) d.statblocks.jad.authorId = aid;
    for (const k of ['approvedAt', 'createdAt', 'updatedAt']) if (d[k]) d[k] = new Date(d[k]);
    if (d.statblocks && d.statblocks.jad && d.statblocks.jad.createdAt) d.statblocks.jad.createdAt = new Date(d.statblocks.jad.createdAt);
    return d;
  });

  const r = await db.collection('bestiae').insertMany(docs, { ordered: false });
  console.log('HOTOVO. Vlozeno:', r.insertedCount, '/', docs.length);
  await mongoose.disconnect();
})().catch((e) => { console.error('CHYBA:', e); process.exit(1); });
