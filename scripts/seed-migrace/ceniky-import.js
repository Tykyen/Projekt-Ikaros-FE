/*
 * 21.5f — Import komunitních ceníků (20 ceníků, ~1000 položek) + zbraní/zbrojí
 * do katalogu Předmětů (103 ks, matrix statblok) do PROD Mongo. Běží UVNITŘ
 * BE kontejneru (má MONGODB_URI, CLOUDINARY_URL a node_modules v /app).
 *
 * Postup: 1) smaž předchozí seed (dle seedTag, ručně vytvořených se nedotkne),
 * 2) nahraj obrázky na Cloudinary (folder community-ceniky; zdroj = Wikimedia
 *    URL v seed JSONu; stabilní public_id → opakovaný běh přepíše, neduplikuje),
 * 3) vlož community_items (zbraně/zbroje), 4) vlož price_lists s provázáním
 *    linkedKey → linkedItemId. Idempotentní.
 *
 * Vstup: SEED_JSON (default /tmp/ceniky-seed.json) — generuje se lokálně
 * z Ceník.xlsx (Morvol) + kurátorovaného výběru obrázků (dry-run schválen).
 */
const mongoose = require('mongoose');
const crypto = require('crypto');
const fs = require('fs');

const SEED_JSON = process.env.SEED_JSON || '/tmp/ceniky-seed.json';
const AUTHOR_EMAIL = 'tykytanjunior@gmail.com';
// 21.5g — parametrizace pro další éry (defaulty = morvol, zpětně kompatibilní)
const SEED_TAG = process.env.SEED_TAG || 'ceniky:morvol:v1';
const ITEM_TAGS = (process.env.ITEM_TAGS || 'morvol').split(',');
const CLOUD_FOLDER = 'community-ceniky';
/** Přeskoč Cloudinary upload (rychlý test bez obrázků): SKIP_IMAGES=1 */
const SKIP_IMAGES = process.env.SKIP_IMAGES === '1';

let cloudinary = null;
if (!SKIP_IMAGES) {
  cloudinary = require('cloudinary').v2; // config z CLOUDINARY_URL
}

async function uploadImage(srcUrl, publicId) {
  const res = await cloudinary.uploader.upload(srcUrl, {
    folder: CLOUD_FOLDER,
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    format: 'webp',
    transformation: [{ width: 800, crop: 'limit' }],
  });
  return { url: res.secure_url, bytes: res.bytes };
}

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
  console.log(
    `Vstup: ${seed.priceLists.length} ceniku, ${seed.communityItems.length} predmetu`,
  );

  // 1) uklid predchoziho behu
  const delItems = await db.collection('community_items').deleteMany({ seedTag: SEED_TAG });
  const delLists = await db.collection('price_lists').deleteMany({ seedTag: SEED_TAG });
  console.log(`Smazano: ${delItems.deletedCount} predmetu, ${delLists.deletedCount} ceniku`);

  // 2) obrazky -> Cloudinary (stabilni public_id = slug klice polozky)
  const imageCache = new Map(); // srcUrl -> {url, bytes}
  async function resolveImage(entity) {
    if (SKIP_IMAGES || !entity.imageSrc) return;
    const cacheKey = entity.imageSrc;
    if (!imageCache.has(cacheKey)) {
      const publicId = entity.key.replace(/[^a-z0-9-]+/g, '-');
      try {
        imageCache.set(cacheKey, await uploadImage(entity.imageSrc, publicId));
      } catch (e) {
        console.error(`!! upload selhal (${entity.key}): ${e.message}`);
        imageCache.set(cacheKey, null);
      }
      await new Promise((r) => setTimeout(r, 150));
    }
    const up = imageCache.get(cacheKey);
    if (up) {
      entity.imageUrl = up.url;
      entity.imageBytes = up.bytes;
    }
    delete entity.imageSrc;
  }

  let n = 0;
  const allWithImages = [
    ...seed.communityItems,
    ...seed.priceLists, // titulní obrázky ceníků (key = klíč ceníku)
    ...seed.priceLists.flatMap((l) => l.items),
  ].filter((e) => e.imageSrc);
  console.log(`Obrazku k nahrani: ${allWithImages.length} (unikatnich zdroju mene — cache)`);
  for (const e of allWithImages) {
    await resolveImage(e);
    n++;
    if (n % 50 === 0) console.log(`  obrazky ${n}/${allWithImages.length}…`);
  }

  const now = new Date();
  const approvedFields = {
    status: 'approved',
    authorId: aid,
    approvedBy: aid,
    approvedAt: now,
    seedTag: SEED_TAG,
    createdAt: now,
    updatedAt: now,
  };

  // 3) community_items (zbrane/zbroje s matrix statblokem)
  const itemDocs = seed.communityItems.map((it) => ({
    scope: 'community',
    systemId: 'matrix',
    name: it.name,
    imageUrl: it.imageUrl,
    imageBytes: it.imageBytes,
    imageFocalX: null,
    imageFocalY: null,
    imageZoom: null,
    imageFit: null,
    kind: it.kind,
    description: it.description || '',
    tags: ITEM_TAGS,
    suggestedPrice: it.suggestedPrice ?? null,
    // 21.5g — bez systemStats = předmět jen s jádrem (žádný statblok)
    statblocks: it.systemStats
      ? {
          matrix: {
            systemStats: it.systemStats,
            status: 'approved', // data od autora systemu (matrix = Morvol)
            authorId: aid,
            createdAt: now,
          },
        }
      : {},
    seedKey: it.key,
    ...approvedFields,
  }));
  const insItems = await db.collection('community_items').insertMany(itemDocs, { ordered: false });
  console.log('Vlozeno predmetu:', insItems.insertedCount);

  // mapa linkedKey -> _id vlozeneho predmetu
  const keyToId = new Map();
  itemDocs.forEach((d, i) => keyToId.set(d.seedKey, String(insItems.insertedIds[i])));

  // 4) price_lists (polozky: uuid id + linkedItemId dle mapy)
  const listDocs = seed.priceLists.map((l) => ({
    scope: 'community',
    name: l.name,
    description: l.description || '',
    imageUrl: l.imageUrl,
    imageBytes: l.imageBytes,
    imageFocalX: null,
    imageFocalY: null,
    imageZoom: null,
    imageFit: null,
    tags: l.tags,
    currency: l.currency || 'gsc', // 21.5g — měna zobrazení (usd = éra Přítomnost)
    items: l.items.map((it) => ({
      id: crypto.randomUUID(),
      name: it.name,
      description: it.description || undefined,
      section: it.section || undefined,
      imageUrl: it.imageUrl,
      imageBytes: it.imageBytes,
      imageFocalX: null,
      imageFocalY: null,
      imageZoom: null,
      imageFit: null,
      imageCredit: it.imageCredit || undefined,
      gold: it.gold,
      silver: it.silver,
      copper: it.copper,
      linkedItemId: it.linkedKey ? keyToId.get(it.linkedKey) : undefined,
    })),
    ...approvedFields,
  }));
  const insLists = await db.collection('price_lists').insertMany(listDocs, { ordered: false });
  console.log('Vlozeno ceniku:', insLists.insertedCount);

  const missingLinks = listDocs
    .flatMap((l) => l.items)
    .filter((it) => it.linkedItemId === undefined && it.linkedKey).length;
  if (missingLinks) console.warn('!! nenapojenych linku:', missingLinks);

  console.log('HOTOVO.');
  await mongoose.disconnect();
})().catch((e) => {
  console.error('CHYBA:', e);
  process.exit(1);
});
