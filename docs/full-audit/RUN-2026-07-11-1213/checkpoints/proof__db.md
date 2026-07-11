# Checkpoint: proof +db (DB integrity / cascade orphan / blob)

Datum: 2026-07-11 · READ-ONLY proti lokální dev Mongo (docker `ikaros-mongo` mongo:7, `localhost:27017`, db `ikaros`, bez auth). NIKDY prod.

## Materializované skripty (`RUN/proof/`)
Zdroj = `docs/db-integrity-plan/tools/integrity-scan.md` + `docs/cascade-delete-plan/tools/orphan-scan.md` (blob = náčrt tamtéž), materializováno 1:1 + doplněny sample `_id`.

- `_conn.mjs` — sdílený connect helper. MONGODB_URI bere z `backend/.env` přes `dotenv.parse` (hodnota se NIKDY netiskne — CH-014). Balíčky (mongodb/dotenv/cloudinary) resolví z BE `node_modules` přes `createRequire` (proof je v jiném repu). Localhost fallback když host neresolvuje. Sanitizuje connection (jen host/port/db, bez credentials). Sdílené helpery `idSet` + `dangling` (vrací count + sample _id).
- `db-connect-check.mjs` — ping + census kolekcí.
- `integrity-scan.mjs` — TYPE / OR / RR / DUP / CARD / STATE / SET / TEMP (patra 1–3).
- `orphan-scan.mjs` — cascade OR / DR (world-scoped + character subdocs + dangling refs + favoritePageSlugs).
- `blob-audit.mjs` — deep-walk DB → cloudinary URL/public_id, vs Cloudinary `api.resources` (GET, read-only, strop 4000).
- `sensitivity-check.mjs` — scratch db differenciál 0→1 + dropDatabase.

## Census (18 dok / 11 kolekcí)
bestiae 1 · campaignPurchases 2 · campaignShopItems 1 · campaignSubjects 1 · channelreadstatus 2 · character_accounts 1 · characters 3 · chatchannels 1 · users 3 · worldmemberships 2 · worlds 1.
> Malá seed dev DB („Proof Testovaci Svet") → většina scan os = 0 (integrita v praxi čistá, ale kód pořád chybí validaci → riziko dle plánů trvá).

## Reálné nálezy
- 🐛 **OR / CD-06 — `characters.worldId ∉ worlds` = 1.** `_id=6a4ba954ab9ef23a75850324` (slug `osireny-hrdina`, „Osireny Hrdina (ORPHAN)"), `worldId=6a4ba954ab9ef23a75850318`, ale jediný svět je `6a4ba954ab9ef23a7585031f`. Detekováno OBĚMA skenery shodně (integrity-scan i orphan-scan). Ověřeno ručně proti `worlds._id` + výpisu postav (CH-056). = seedovaný orphan v dev DB; potvrzuje třídu OR/CD-06 reálným číslem.
- ✅ **TYPE** — všechna FK pole s daty = `string` (žádný ObjectId mix; `custom_emotes` v této DB prázdné → mina K-DI0 se tu neprojeví).
- ✅ Všechny ostatní osy (RR, DUP, CARD, STATE, SET, TEMP, subdoc OR, dangling refs, favoritePageSlugs) = **0**.
- **Blob:** DB strana = 1 ref `ikaros/bestiae/proof-test-bestie` (bestie seed). Vs Cloudinary cloud `dzht9sebg`: `[DR]` broken ref = 1 (ten fake seed public_id v Cloudinary neexistuje → správně visící). `[EX]` orphaned blob kandidát ≥ 4000 (strop) — **nadhodnoceno**: Cloudinary je sdílené s prod obsahem (community-herbar…), lokální DB je oddělená malá dev → reálný leak count NELZE z dev změřit (potřebuje plnou DB, ta je prod = zakázaná). Mechanika ověřena, číslo neinterpretovatelné.

## Sensitivity (scanner není slepý)
`sensitivity-check.mjs` v scratch db `ikaros_audit_scratch`: fáze 1 čistý stav (1 svět + 1 validní postava) → orphans **0**; fáze 2 nastražená postava s `worldId=0123…4567` (neexistuje) → orphans **1**, trefen planted `_id`; fáze 3 `dropDatabase()`. Differenciál 0→1 + shoda _id → **✅ OK, scanner detekuje**. Po běhu ověřeno: scratch db pryč, dev `ikaros` netknutá (18 dok).

## Jak reprodukovat
```bash
cd c:/Matrix/ProjektIkaros/Projekt-ikaros-FE/docs/full-audit/RUN-2026-07-11-1213/proof
node db-connect-check.mjs   # census
node integrity-scan.mjs     # TYPE/OR/RR/DUP/INV — nález: characters.worldId=1
node orphan-scan.mjs        # cascade OR/DR — nález: characters.worldId=1
node blob-audit.mjs         # DB URL vs Cloudinary (read-only)
node sensitivity-check.mjs  # scratch differenciál + drop (exit 0 = OK)
```
Předpoklady: docker `ikaros-mongo` běží; `backend/.env` má `MONGODB_URI` (+ `CLOUDINARY_URL` pro blob). Vše READ-ONLY kromě `sensitivity-check` (píše jen do scratch db, hned dropne). Dev DB potvrzeně netknutá.
