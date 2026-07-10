/*
 * Import komunitních bestií do PROD Mongo. Běží UVNITŘ BE kontejneru
 * (má node + mongoose + MONGODB_URI na interní 'mongo:27017').
 *
 * Postup na serveru:
 *   docker cp bestie-all.ndjson projekt-ikaros-be:/tmp/bestie.ndjson
 *   docker cp import.js        projekt-ikaros-be:/tmp/import.js
 *   docker exec projekt-ikaros-be node /tmp/import.js
 *
 * Doplní reálné authorId (Superadmin z DB) místo placeholderu, idempotentně
 * (přeskočí bestie, které už podle clonedFromId existují).
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

  const lines = fs.readFileSync(NDJSON, 'utf8').split('\n').filter((l) => l.trim());
  console.log('Radku v souboru:', lines.length);

  let ins = 0;
  let skip = 0;
  for (const l of lines) {
    const d = JSON.parse(l);
    d.authorId = aid;
    d.approvedBy = aid;
    if (d.statblocks && d.statblocks.jad) d.statblocks.jad.authorId = aid;
    const exists = await db.collection('bestiae').findOne({ clonedFromId: d.clonedFromId });
    if (exists) {
      skip++;
      continue;
    }
    await db.collection('bestiae').insertOne(d);
    ins++;
    if (ins % 50 === 0) console.log('  ...vlozeno', ins);
  }
  console.log('HOTOVO. Vlozeno:', ins, '| preskoceno (uz existuji):', skip);
  await mongoose.disconnect();
})().catch((e) => {
  console.error('CHYBA:', e);
  process.exit(1);
});
