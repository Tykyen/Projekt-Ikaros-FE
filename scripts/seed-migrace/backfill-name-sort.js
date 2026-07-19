/*
 * D-NAMESORT backfill — dopočítá řadicí klíč (nameSort / u hádanek questionSort)
 * existujícím dokumentům 8 komunitních katalogů. Nové/updatnuté dokumenty klíč
 * dostávají hookem (sortKeyPlugin); tohle je jednorázový dohon historie.
 *
 * Běží UVNITŘ BE kontejneru (mongoose v /app/node_modules, MONGODB_URI v env) —
 * `docker exec -w /app projekt-ikaros-be node backfill-name-sort.js`.
 *
 * IDEMPOTENTNÍ: přepočítá klíč a zapíše JEN tam, kde se liší; re-run nic nedělá.
 * Default DRY-RUN (jen spočítá). Skutečný zápis: env `APPLY=1` nebo `--apply`.
 * Native driver (bulkWrite) → NEspouští mongoose hooky (tedy ani sortKeyPlugin);
 * fold logika je proto inline, shodná s common/utils/name-sort.foldSortKey.
 */
const mongoose = require('mongoose');

function foldSortKey(value) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Kolekce → zdrojové pole (identita) a cílový řadicí klíč. Shodné s TS backfillem
// backend/scripts/backfill-name-sort/index.ts (riddles řadí přes `question`).
const TARGETS = [
  { collection: 'bestiae', source: 'name', target: 'nameSort' },
  { collection: 'spells', source: 'name', target: 'nameSort' },
  { collection: 'community_items', source: 'name', target: 'nameSort' },
  { collection: 'potions', source: 'name', target: 'nameSort' },
  { collection: 'plants', source: 'name', target: 'nameSort' },
  { collection: 'price_lists', source: 'name', target: 'nameSort' },
  { collection: 'riddles', source: 'question', target: 'questionSort' },
  { collection: 'name_sets', source: 'name', target: 'nameSort' },
];

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri)
    throw new Error('MONGODB_URI neni v prostredi (spoustis v BE kontejneru?)');
  const apply = process.env.APPLY === '1' || process.argv.includes('--apply');

  console.log(apply ? '=== APPLY (zapis) ===' : '=== DRY-RUN (bez zapisu) ===');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  let grandTotal = 0;
  let grandChanged = 0;
  try {
    for (const { collection, source, target } of TARGETS) {
      const col = db.collection(collection);
      const cursor = col.find(
        {},
        { projection: { _id: 1, [source]: 1, [target]: 1 } },
      );
      let total = 0;
      let changed = 0;
      let ops = [];
      for await (const doc of cursor) {
        total++;
        const next = foldSortKey(doc[source]);
        if (doc[target] === next) continue;
        changed++;
        ops.push({
          updateOne: { filter: { _id: doc._id }, update: { $set: { [target]: next } } },
        });
        if (apply && ops.length >= 500) {
          await col.bulkWrite(ops);
          ops = [];
        }
      }
      if (apply && ops.length > 0) await col.bulkWrite(ops);
      grandTotal += total;
      grandChanged += changed;
      console.log(
        `  ${collection.padEnd(16)} ${String(total).padStart(6)} docs · ` +
          `${apply ? 'zapsano' : 'k zapisu'} ${changed} × ${target}`,
      );
    }

    console.log('===========================================');
    console.log(`Dokumentu celkem:  ${grandTotal}`);
    console.log(`${apply ? 'Zapsano' : 'K zapisu'} klicu: ${grandChanged}`);
    console.log('===========================================');
    if (!apply) console.log('Pro skutecny zapis spust znovu s APPLY=1.');
  } finally {
    await mongoose.disconnect();
  }
  process.exit(0);
})().catch((e) => {
  console.error('Backfill selhal:', e);
  process.exit(1);
});
