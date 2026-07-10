/*
 * 21.5a — Import komunitního herbáře (56 rostlin) do PROD Mongo. Běží UVNITŘ
 * BE kontejneru (má MONGODB_URI + mongoose v /app/node_modules). Obrázky už
 * jsou na Cloudinary (WebP, nahrané lokálním --export). Tenhle skript jen vloží
 * dokumenty do kolekce `plants`.
 * Idempotentní: smaže předchozí seed této dávky (dle `seedTag`) a vloží znovu —
 * ručně vytvořené rostliny (bez seedTag) se NEdotkne. Opakované spuštění dá
 * stejný výsledek.
 */
const mongoose = require('mongoose');
const fs = require('fs');
const NDJSON = process.env.NDJSON || '/tmp/plants.ndjson';
const AUTHOR_EMAIL = 'tykytanjunior@gmail.com';
const SEED_TAG = 'herbar:lektvary-herbar:v1';

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI neni v prostredi (spoustis v BE kontejneru?)');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const author = await db.collection('users').findOne({ email: AUTHOR_EMAIL });
  if (!author) throw new Error('Autor (Superadmin) nenalezen: ' + AUTHOR_EMAIL);
  const aid = String(author._id);
  console.log('Autor:', AUTHOR_EMAIL, '->', aid);

  const del = await db.collection('plants').deleteMany({ seedTag: SEED_TAG });
  console.log('Smazano predchozich seed rostlin:', del.deletedCount);

  const lines = fs.readFileSync(NDJSON, 'utf8').split('\n').filter((l) => l.trim());
  console.log('Radku v souboru:', lines.length);

  const docs = lines.map((l) => {
    const d = JSON.parse(l);
    d.authorId = aid;
    d.approvedBy = aid;
    for (const k of ['approvedAt', 'createdAt', 'updatedAt']) if (d[k]) d[k] = new Date(d[k]);
    d.seedTag = SEED_TAG;
    return d;
  });

  const r = await db.collection('plants').insertMany(docs, { ordered: false });
  console.log('HOTOVO. Vlozeno:', r.insertedCount, '/', docs.length);
  await mongoose.disconnect();
})().catch((e) => {
  console.error('CHYBA:', e);
  process.exit(1);
});
