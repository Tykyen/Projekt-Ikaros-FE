// db-connect-check.mjs — ověří připojení + census kolekcí (READ-ONLY).
import { getClient } from './_conn.mjs';

const { client, db, info } = await getClient();
console.log(`✅ Připojeno → host=${info.host}:${info.port} db=${info.db} auth=${info.hasAuth ? 'ano' : 'ne'}`);

const colls = (await db.listCollections().toArray()).map((c) => c.name).sort();
console.log(`Kolekcí: ${colls.length}\n`);

let total = 0;
const rows = [];
for (const name of colls) {
  const n = await db.collection(name).countDocuments();
  total += n;
  rows.push({ collection: name, docs: n });
}
console.table(rows);
console.log(`\nCELKEM dokumentů: ${total}`);
await client.close();
