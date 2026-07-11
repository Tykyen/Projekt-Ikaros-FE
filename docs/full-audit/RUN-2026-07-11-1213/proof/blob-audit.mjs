// blob-audit.mjs — READ-ONLY blob leak audit (Cloudinary vs DB URL refs).
// Zdroj: náčrt v docs/cascade-delete-plan/tools/orphan-scan.md (sekce Blob audit).
// DB strana: deep-walk všech dokumentů → sesbírej cloudinary URL + public_id.
// Cloudinary strana: api.resources (GET, read-only, žádný delete) — bounded.
import { getClient, cloudinary } from './_conn.mjs';

const { client, db, info } = await getClient();
console.log(`DB=${info.db} @ ${info.host}:${info.port}\n`);

// --- 1) DB strana: sesbírej všechny cloudinary URL napříč kolekcemi (deep walk) ---
const urlRe = /https?:\/\/res\.cloudinary\.com\/[^\s"')]+/g;
// public_id z URL: .../upload/(v123/)?<public_id>.<ext>
function publicIdFromUrl(u) {
  const m = u.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?(?:\?.*)?$/);
  return m ? m[1] : null;
}
const dbUrls = new Set();
const dbById = new Map(); // public_id -> [coll:_id]
function walk(val, ref) {
  if (val == null) return;
  if (typeof val === 'string') {
    for (const u of val.match(urlRe) || []) {
      dbUrls.add(u);
      const pid = publicIdFromUrl(u);
      if (pid) { if (!dbById.has(pid)) dbById.set(pid, []); dbById.get(pid).push(ref); }
    }
  } else if (Array.isArray(val)) { for (const v of val) walk(v, ref); }
  else if (typeof val === 'object') { for (const k of Object.keys(val)) walk(val[k], ref); }
}
const colls = (await db.listCollections().toArray()).map((c) => c.name);
for (const name of colls) {
  for (const doc of await db.collection(name).find({}).toArray()) walk(doc, `${name}:${doc._id}`);
}
console.log(`DB cloudinary URL refs: ${dbUrls.size} (unikátních public_id: ${dbById.size})`);
for (const [pid, refs] of [...dbById].slice(0, 20)) console.log(`  ref ${pid}  ← ${refs.join(', ')}`);

// --- 2) Cloudinary strana: bounded read-only listing ---
let cloudReady = Boolean(process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME);
let cloudIds = new Set();
let cloudErr = null;
if (cloudReady) {
  try {
    let cursor;
    let pages = 0;
    do {
      const res = await cloudinary.api.resources({ type: 'upload', max_results: 500, next_cursor: cursor });
      for (const r of res.resources || []) cloudIds.add(r.public_id);
      cursor = res.next_cursor;
      pages += 1;
    } while (cursor && pages < 8); // strop 4000 blobů
    console.log(`\nCloudinary cloud=${cloudinary.config().cloud_name} blobů (type=upload): ${cloudIds.size} (stránek: ${pages})`);
  } catch (e) { cloudErr = e.message; cloudReady = false; }
}
if (!cloudReady) console.log(`\n⚠️ Cloudinary strana nedostupná${cloudErr ? ': ' + cloudErr : ' (chybí credentials)'} — audit jen DB strana.`);

// --- 3) Porovnání obou směrů ---
if (cloudReady) {
  // A) DB URL bez blobu v Cloudinary = broken image ref (dangling blob)
  const brokenRefs = [...dbById.keys()].filter((pid) => !cloudIds.has(pid));
  // B) Cloudinary blob bez DB reference = kandidát na orphaned blob (leak)
  const orphanBlobs = [...cloudIds].filter((pid) => !dbById.has(pid));
  console.log(`\n[DR] DB URL bez blobu v Cloudinary (broken ref): ${brokenRefs.length}`);
  for (const p of brokenRefs.slice(0, 10)) console.log(`  ${p}  ← ${dbById.get(p).join(', ')}`);
  console.log(`\n[EX] Cloudinary blob bez DB reference (orphaned blob leak kandidát): ${orphanBlobs.length}`);
  for (const p of orphanBlobs.slice(0, 10)) console.log(`  ${p}`);
  console.log('\n⚠️ POZOR interpretace: dev DB je malá → EX počet nadhodnocený (blob může patřit jinému/prod světu). Reálný leak count měř až proti plné DB.');
} else {
  console.log('\nDB strana hotová (URL inventura výše). Cloudinary porovnání přeskočeno.');
}

await client.close();
