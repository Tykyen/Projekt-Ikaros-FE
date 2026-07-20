/*
 * B4d migrace — legacy `ikaros_discussion_reports` → generická `content_reports`
 * (modul `moderation`). Fáze B4d sjednotila diskuzní nahlašování pod generický
 * modul; starý dual-systém zmizel z kódu, ale data zůstala v původní kolekci.
 * Bez migrace jsou nevyřízené legacy reporty NEVIDITELNÉ — admin fronta
 * „Zpracovat" čte už jen `content_reports`.
 *
 * PROČ JS A NE TS (24.2 / D-074): produkční BE image nese jen `dist/` a prod
 * `node_modules`. Složka `backend/scripts/` se do image nekopíruje vůbec a
 * `ts-node` je devDependency, kterou smaže `npm prune --omit=dev`. Původní
 * `npm run migrate:discussion-reports` proto v produkci NEJDE spustit — padne
 * na obojím. Tenhle skript se do kontejneru dopraví přes `docker cp` a spustí
 * čistým `node`, stejně jako `backfill-name-sort.js`.
 *
 * Běží UVNITŘ BE kontejneru (mongoose v /app/node_modules, MONGODB_URI v env):
 *   `docker exec -w /app projekt-ikaros-be node migrate-discussion-reports.js`
 *
 * IDEMPOTENTNÍ: přeskočí reporty, které už v cíli jsou (klíč `targetId` +
 * `createdAtUtc`); re-run nevytvoří duplikáty.
 * NEMAŽE legacy kolekci — `ikaros_discussion_reports` zůstává jako audit stopa.
 * Default DRY-RUN (jen spočítá). Skutečný zápis: env `APPLY=1` nebo `--apply`.
 *
 * Mapovací logika je kopie `backend/scripts/migrate-discussion-reports-to-content-reports/mapper.ts`
 * (tam žijí i jednotkové testy). Migrace je jednorázová, takže se ta duplicita
 * po spuštění nemá jak rozejít; ověřeno proti schématu `content-report.schema.ts`
 * k 2026-07-20 (enumy `discussion_post` + `other` sedí).
 */
const mongoose = require('mongoose');

/** Idempotency klic — dvojice (targetId, createdAtUtc). */
function dedupeKey(targetId, createdAtUtc) {
  return `${targetId}|${new Date(createdAtUtc).getTime()}`;
}

/**
 * Legacy report nema kategorii → `other`; nema targetAuthorId (jen jmeno) ani
 * goodFaith/notifyMe/anonymous → bezpecne defaulty. `status` z `resolved`.
 */
function mapLegacyReport(r) {
  return {
    targetType: 'discussion_post',
    targetId: r.postId,
    targetUrl: `/ikaros/diskuze/${r.discussionId}`,
    targetSnapshot: r.postContentSnapshot,
    targetAuthorName: r.postAuthorName,
    category: 'other',
    reason: r.reason,
    reporterId: r.reporterId,
    reporterName: r.reporterName,
    goodFaith: true,
    notifyMe: false,
    anonymous: false,
    status: r.resolved ? 'resolved' : 'pending',
    createdAtUtc: r.createdAtUtc,
  };
}

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri)
    throw new Error('MONGODB_URI neni v prostredi (spoustis v BE kontejneru?)');
  const apply = process.env.APPLY === '1' || process.argv.includes('--apply');

  console.log(apply ? '=== APPLY (zapis) ===' : '=== DRY-RUN (bez zapisu) ===');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  try {
    const legacyCol = db.collection('ikaros_discussion_reports');
    const targetCol = db.collection('content_reports');

    const legacyTotal = await legacyCol.countDocuments();
    console.log(`Legacy reportu v ikaros_discussion_reports: ${legacyTotal}`);
    if (legacyTotal === 0) {
      console.log('Nic k migraci — kolekce je prazdna.');
      return;
    }

    // Idempotence — nacti klice uz zmigrovanych reportu, at re-run nevytvori duplikaty.
    const existing = new Set();
    const existingCursor = targetCol.find(
      { targetType: 'discussion_post' },
      { projection: { targetId: 1, createdAtUtc: 1 } },
    );
    for await (const doc of existingCursor) {
      if (doc.targetId && doc.createdAtUtc) {
        existing.add(dedupeKey(doc.targetId, doc.createdAtUtc));
      }
    }
    console.log(`Uz zmigrovanych discussion_post reportu: ${existing.size}`);

    let toInsert = [];
    let skipped = 0;
    let inserted = 0;

    const flush = async () => {
      if (toInsert.length === 0) return;
      if (apply) {
        const res = await targetCol.insertMany(toInsert, { ordered: false });
        inserted += res.insertedCount;
      } else {
        inserted += toInsert.length;
      }
      toInsert = [];
    };

    const cursor = legacyCol.find({});
    for await (const legacy of cursor) {
      const key = dedupeKey(legacy.postId, legacy.createdAtUtc);
      if (existing.has(key)) {
        skipped++;
        continue;
      }
      // Chran i proti duplikatum v ramci jednoho behu (dva legacy se stejnym klicem).
      existing.add(key);
      toInsert.push(mapLegacyReport(legacy));
      if (toInsert.length >= 500) await flush();
    }
    await flush();

    console.log('===========================================');
    console.log(`Legacy celkem:              ${legacyTotal}`);
    console.log(`${apply ? 'Vlozeno' : 'K vlozeni'}:                 ${inserted}`);
    console.log(`Preskoceno (uz migrovano):  ${skipped}`);
    console.log('===========================================');
    if (!apply) console.log('Pro skutecny zapis spust znovu s APPLY=1.');
  } finally {
    await mongoose.disconnect();
  }
  process.exit(0);
})().catch((e) => {
  console.error('Migrace selhala:', e);
  process.exit(1);
});
