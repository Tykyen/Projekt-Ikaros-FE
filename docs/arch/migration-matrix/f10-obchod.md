# F10 — Obchod (DO_OBCHODU stránky) Matrix → Ikaros

> Migrace světa **matrix**. Kontext: [`HANDOFF.md`](./HANDOFF.md), [`index.md`](./index.md). Paměť: `project_matrix_full_migration`.
> Stav: **✅ HOTOVO — živé v newmatrix (2026-06-09).** Naimportováno **255 položek obchodu** (ceny GBP 249 / USD 6 z ručního ceníku, popisy ze stránek, referenceLink, isShared=true). 5 ne-zboží stránek (kategorie/lokace) vyřazeno uživatelem. PJ doplní skupiny/slevy v UI. Cílová feature existuje (`campaignShopItems`, fáze 9, route `/svet/:w/obchod`).
>
> **Soubory (BE repo):** `migration/f10-build.mjs` (ceník+texty), `f10-data.json(.gz)`, `f10-import.js`, workflow `import-matrix-shop.yml` (3 režimy, `_mig:'f10'`, upsert podle `_id`=page._id). Ceník `C:\Users\arafo\Downloads\f10-obchod-cenik.csv` (uživatel vyplnil ceny + sloupec **Typ**=skupina).
>
> **Skupiny (follow-up, live 2026-06-09):** 19 jednoúrovňových skupin z ceníkového sloupce „Typ" (Praktická výbava 38, Technická výbava 31, Pistole 28, Útočné pušky 23…) → `campaignShopGroups`, 255 položek zařazeno (`groupId`). Soubory `f10-groups-{build.mjs,data.json.gz,import.js}` + workflow `import-matrix-shop-groups.yml` (`_mig:'f10g'`, deterministické `_id`, položka→groupId podle referenceLink=slug).
> **Měny:** položky v GBP/USD; PJ musí v Měnách světa (`world_currencies`) přidat měny s kódem `GBP`+`USD` (matrix seed má jen CR/NUSD), jinak nákup zablokován (chybějící kurz). Řeší uživatel v UI.

## Klíčové zjištění
- **Obchod EXISTUJE** (campaign modul, fáze 9) → F10 je čistá migrace, NE FE feature (na rozdíl od gating obavy).
- **Matrix neměl obchod jako strukturu** — položky jsou jen **stránky označené `DO_OBCHODU`** v ručně revidované klasifikaci. **260 stránek** (sloupec `DO_OBCHODU="Obchod"` v `f2-klasifikace.csv`; materiály/látky/zboží: dwimerit, duraocel, krvavá medovina…).
- ⚠️ **Žádné obrázky k řešení:** `campaignShopItems` **nemá `imageUrl`** a FE karta obchodu je textová. Obrázek položky = obrázek **odkazované stránky** přes `referenceLink` (stránky obrázky mají z F12). → žádný upload, žádná fáze A.
- **Matrix nemá ceny/měny/skupiny** → doplnit defaulty (price 0, PJ doladí v UI).

## Zdroj
`C:\Users\arafo\Downloads\f2-klasifikace.csv` (11 sloupců, `;` delimiter, robustní parser). 260 řádků s `DO_OBCHODU="Obchod"`. Z každého: `slug`, `titul`.

## Cílový model
`campaignShopItems` ([schema](../../../../Projekt-ikaros/backend/src/modules/campaign/schemas/) campaign modul): `worldId, ownerId, isShared, name(required), description?, groupId(''), subgroupId?, price(0), currencyCode(''), discountPercent(0), linkedItemIds[], referenceLink?(wiki slug), isRecommended(false)` + timestamps. Index `{worldId,ownerId}`, `{worldId,isShared}`, `{worldId,groupId}`.

**Shop access (kritické):** `resolveShopScope` — **hráč vidí JEN `isShared:true`** (na rozdíl od pavučiny, kde hráč viděl jen své). PomocnyPJ+ vidí vše. → migrované položky **musí mít `isShared=true`**, jinak je hráči neuvidí.

## Rozhodnutí (k potvrzení)
1. **worldId** = string `"6d6174726978000000000001"`.
2. **`ownerId` = Tyky (PJ), `isShared = true`** pro všech 260. *Důvod isShared=true: jinak hráči obchod nevidí (shop access).*
3. **`name`** = `titul` stránky. **`referenceLink`** = slug stránky (proklik na wiki s popisem+obrázkem).
4. **`_id` shop item = `_id` odkazované prod stránky.** Workflow resolve slug→Page, vezme `page._id` jako shop item `_id`. Důvod: idempotence (stabilní) + 1:1 vazba položka↔stránka. Stránka chybí (slug-drift/neexist.) → **skip + log** (položka bez stránky nemá smysl).
5. **`description` = plný text stránky** (`plainText`, vč. sekce „Cena / hodnota na trhu" kde je) — uživatel chce data v položce, ne jen odkaz. **`price`/`currencyCode` z ručního ceníku** `C:\Users\arafo\Downloads\f10-obchod-cenik.csv` (uživatel vyplní ceny, default měna GBP; prázdná cena→0). **`groupId=''`, `isRecommended=false`** → PJ roztřídí do skupin v UI. *(Auto-extrakce ceny zamítnuta: jen 13/260 má v textu číslo, navíc rozsahy/„cca"/různé měny £$/falešné pozitivy „poměr cena-výkon".)* Měna v ceníku: GBP/USD/EUR/… → currencyCode (ISO); textové „libra"→GBP, „dolar"→USD mapováno při buildu.
6. `_mig:'f10'`.

## Transformace (per stránka)
| Zdroj | Ikaros shop item | Pravidlo |
|---|---|---|
| `titul` | `name` | 1:1 |
| `slug` (přemapovaný) | `referenceLink` | = prod Page.slug |
| Page `_id` | `_id` | reuse (idempotence) |
| — | `worldId, ownerId=Tyky, isShared=true` | doplnit |
| — | `price=0, currencyCode='', groupId='', discountPercent=0, linkedItemIds=[], isRecommended=false, description` | defaulty |
| — | `_mig` | `'f10'` |

## Mechanika — 2 fáze (vzor F6, bez upload)
### Fáze A — build `migration/f10-build.mjs`
Parsuje `f2-klasifikace.csv` (robustní CSV parser), vyfiltruje `DO_OBCHODU="Obchod"`, výstup `migration/f10-data.json(.gz)` = `[{slug, name}]` (260). ALIAS slug-drift (F6/F7). Souhrn: počet, kategorie distribuce, přemapované slugy.

### Fáze B — workflow `import-matrix-shop.yml` (3 režimy)
`dry-run`/`import`(IMPORT)/`rollback`(ROLLBACK). mongosh, IIFE, world `6d61…01`. Per `{slug, name}`:
1. `page = db.pages.findOne({slug, worldId})` (+ ObjectId fallback). Chybí → skip+log.
2. Upsert `campaignShopItems` `_id = page._id`: `{worldId, ownerId=Tyky, isShared:true, name, referenceLink: page.slug, price:0, currencyCode:'', groupId:'', subgroupId:undefined, discountPercent:0, linkedItemIds:[], isRecommended:false, description:'', _mig:'f10', createdAt, updatedAt}`.

**Dry-run ověří:** Tyky existuje; kolik z 260 slugů má prod Page (chybějící → seznam pro ALIAS); že `campaignShopItems` v matrix světě prázdné. **Rollback:** `deleteMany({_mig:'f10'})`.

## Mimo rozsah
- Ceny, měny, slevy, skupiny/podskupiny (PJ doplní v UI).
- `linkedItemIds` ("často spolu") — PJ nastaví.
- Nákupní transakce / wallet (runtime, ne migrace).
- Obrázky položek (neexistují — referenceLink na stránku).

## Otevřené body
1. Potvrdit rozhodnutí (price 0 + bez skupin + isShared=true).
2. ALIAS slug-drift se finalizuje po dry-run.
3. `description` prázdné vs krátký výňatek z `plainText` stránky — navrhuji prázdné (referenceLink dá plný popis).
