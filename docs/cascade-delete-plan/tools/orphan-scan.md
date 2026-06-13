# M-SCAN — orphan-scan (tvrdý důkaz cascade nálezů)

> **READ-ONLY** sken databáze: spočítá reálné **orphans** (osiřelé child záznamy), **dangling refs**
> (visící odkazy na neexistující ID) a **kandidáty na blob leak**. Žádný zápis, žádné mazání — jen
> `find`/`count`. Bezpečné i proti produkci.
>
> Tohle je L4 důkaz pro [`../../cascade-delete-audit.md`](../../cascade-delete-audit.md): zatímco čtení
> kódu říká „cascade tu chybí" (L2), tenhle sken řekne „**v DB teď leží N osiřelých záznamů**" — reálný
> dopad, ne hypotéza. Analog k TLC běhu u state-consistency.

## Co měří (mapování na nálezy)

| Kontrola | Nález | Co počítá |
|---|---|---|
| `pages` / `characters` / world-scoped s `worldId` ∉ worlds | `OR` (CD-06 zbytky) | osiřelé po neúplném world cascade |
| `character_diaries/_calendars/...` s `characterId` ∉ characters | `OR` (CD-09) | osiřelé subdocy po character delete |
| `worldmemberships.currentSceneId` ∉ mapScenes | **CD-04** `DR` | hráči na mrtvé scéně |
| `worldmemberships.characterPath` ∉ characters.slug | `DR` | membership na smazanou postavu |
| `worlds.ownerId` ∉ users | `DR` | svět s mrtvým ownerem |
| `User.favoritePageSlugs` ∉ pages.slug | **CD-08** `OR` | mrtvé oblíbené |

> Blob leak (CD-01/02/03) se neměří odsud — vyžaduje **Cloudinary** list `ikaros/**` vs DB URL refs
> (viz sekce „Blob audit" níže).

## Skript

```js
// orphan-scan.mjs — READ-ONLY cascade-delete orphan/dangling scan.
// Spuštění:  MONGO_URI="mongodb://user:pass@host/dbname" node orphan-scan.mjs
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
if (!uri) { console.error('Chybí MONGO_URI'); process.exit(1); }

const client = new MongoClient(uri);
await client.connect();
const db = client.db();
const C = (n) => db.collection(n);

// Set všech _id dané kolekce jako string (pro porovnání s string FK v child kolekcích).
async function idSet(coll, field = '_id') {
  const docs = await C(coll).find({}, { projection: { [field]: 1 } }).toArray();
  return new Set(docs.map((d) => String(field === '_id' ? d._id : d[field])));
}

// Spočítej dokumenty v `coll`, jejichž `field` (string) není v `validSet`.
async function countDangling(coll, field, validSet, extraFilter = {}) {
  const docs = await C(coll)
    .find({ [field]: { $ne: null, $exists: true }, ...extraFilter },
          { projection: { [field]: 1 } })
    .toArray();
  return docs.filter((d) => !validSet.has(String(d[field]))).length;
}

const worldIds = await idSet('worlds');
const charIds = await idSet('characters');
const charSlugs = await idSet('characters', 'slug');
const sceneIds = await idSet('mapScenes');
const userIds = await idSet('users');
const pageSlugs = await idSet('pages', 'slug');

const rows = [];
const push = (label, n, finding) => rows.push({ label, orphans: n, finding });

// --- Orphans: child s worldId mimo worlds ---
const WORLD_SCOPED = ['pages','characters','chatchannels','chatgroups','chatmessages',
  'mapScenes','worldMaps','game_events','timeline_events','worldnews','worldsettings',
  'worldmemberships','custom_emotes','sounds','world_currencies','bestiae'];
for (const coll of WORLD_SCOPED) {
  push(`${coll}.worldId ∉ worlds`, await countDangling(coll, 'worldId', worldIds), 'OR/CD-06');
}

// --- Orphans: subdocy s characterId mimo characters ---
for (const coll of ['character_diaries','character_calendars','character_finances',
                    'character_inventories','character_notes','character_accounts']) {
  push(`${coll}.characterId ∉ characters`, await countDangling(coll, 'characterId', charIds), 'OR/CD-09');
}

// --- Dangling refs ---
push('membership.currentSceneId ∉ mapScenes',
     await countDangling('worldmemberships', 'currentSceneId', sceneIds), 'DR/CD-04');
push('membership.characterPath ∉ characters.slug',
     await countDangling('worldmemberships', 'characterPath', charSlugs), 'DR');
push('worlds.ownerId ∉ users',
     await countDangling('worlds', 'ownerId', userIds), 'DR');

// --- favoritePageSlugs (pole per world) ---
let favOrphans = 0;
const users = await C('users').find(
  { favoritePageSlugs: { $exists: true } },
  { projection: { favoritePageSlugs: 1 } }).toArray();
for (const u of users) {
  const fav = u.favoritePageSlugs || {};
  for (const wid of Object.keys(fav)) {
    for (const slug of (fav[wid] || [])) if (!pageSlugs.has(String(slug))) favOrphans++;
  }
}
push('favoritePageSlugs ∉ pages.slug', favOrphans, 'OR/CD-08');

// --- Výstup ---
console.table(rows);
const total = rows.reduce((s, r) => s + r.orphans, 0);
console.log(`\nCELKEM osiřelých/dangling: ${total}`);
console.log(total === 0
  ? '✅ Žádné orphans — cascade je v praxi čistá (přesto kód chybí cleanup → riziko do budoucna).'
  : '🐛 Orphans nalezeny — potvrzuje nálezy CD-xx reálnými daty.');

await client.close();
```

## Jak spustit

```bash
# v BE repu (má mongodb driver) nebo kdekoli s `npm i mongodb`
MONGO_URI="mongodb://...<connection z BE .env>..." node orphan-scan.mjs
```

⚠️ **Bezpečnost:** skript jen čte (`find`/`projection`). Žádný `delete`/`update`. Lze pustit i proti
produkční DB (jen čte metadata) — ale ber connection z [paměti server-swap]: produkční cíl je
`www.projekt-ikaros.com`. Pro jistotu **nejdřív dev/staging**.

## Jak číst výstup

- **0 všude** = cascade je _v praxi_ čistá (zatím se nic kritického nesmazalo / data malá). Kód ale
  pořád chybí cleanup → nález CD-xx platí jako **riziko**, jen ještě „nevybuchlo".
- **N > 0 u `membership.currentSceneId`** = přímý důkaz CD-04 (tolik hráčů uvízlo na mrtvé scéně).
- **N > 0 u subdocs/world-scoped** = potvrzení neúplných cascade (CD-06/CD-09) reálnými čísly.

## Blob audit (CD-01/02/03 — samostatně, potřebuje Cloudinary)

Orphan-scan nevidí Cloudinary. Pro blob leak:

```js
// blob-audit.mjs (náčrt) — vyžaduje cloudinary credentials z BE .env
import { v2 as cloudinary } from 'cloudinary';
// 1) cloudinary.api.resources({ prefix: 'ikaros/', max_results: 500, ... }) — stránkovaně sesbírej public_id
// 2) z DB sesbírej všechny URL: pages.imageUrl, pages.galleryImages[], world.imageUrl,
//    worldmemberships.avatarUrl, custom_emotes.*, gallery.*
// 3) public_id v Cloudinary BEZ odpovídající DB URL = orphaned blob (leak) → reálný count + náklad
```

> Tohle dá tvrdé číslo „kolik MB mrtvých obrázků platíme" — nejsilnější argument pro opravu CD-01/02/03.
