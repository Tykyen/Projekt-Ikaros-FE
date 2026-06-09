# F9 — Herní akce (GameEvents) Matrix → Ikaros

> Migrace světa **matrix**. Kontext: [`HANDOFF.md`](./HANDOFF.md), [`index.md`](./index.md). Paměť: `project_matrix_full_migration`.
> Stav: **✅ HOTOVO — živé v newmatrix (2026-06-09).** Naimportováno **15 herních akcí** (6 budoucích / 9 archiv), 8 obrázků base64→Cloudinary, 13 RSVP userId přes F1, groupOnly=false. Cílová feature existuje (`game_events`, spec 9.1-I).
>
> **Soubory (BE repo):** `migration/f9-upload.mjs` (base64→Cloudinary `f9-image-map.json`), `f9-build.mjs` → `f9-data.json(.gz)`, `f9-import.js`, workflow `import-matrix-game-events.yml` (3 režimy, `_mig:'f9'`, upsert podle `_id`).

## Klíčové zjištění (oprava HANDOFF předpokladu)
HANDOFF u F9 čekal *„9.8M velký objem, archive policy cut-off 24h"*. **Realita:** `GameEvents` je jen **15 dokumentů** — 9.8 MB je kvůli **base64 PNG obrázkům inline** (`imageUrl: data:image/png;base64,…`). Tvar je **skoro 1:1** s Ikaros `game_events` (feature portovaná) a jsou to **kalendářní akce** (Sraz, Podzemní krypty…), ne herní log.

## Zdroj
`C:\Matrix\dump\MatrixDatabase\GameEvents.bson` (15 docs). Klíče: `_id, title, date, targetGroup, imageUrl, description, confirmable, confirmedBy, worldId(jen 4/15)`. Ověřeno:
- `date`: **100% ISO** `YYYY-MM-DDTHH:mm` (`2026-04-14`…`2026-12-19`). 6 budoucích, 9 minulých (>24h → archiv).
- `worldId`: 4/15 vyplněno, vždy `"6d6174726978000000000001"` (matrix). 11 chybí.
- `targetGroup`: `""` (4×) + frakce `Evropani`/`Lumíci`/`MI6` (11×).
- `confirmable`: mix true/false. `confirmedBy`: 4 eventy neprázdné, tvar `{userId(starý Matrix), userName}`.
- `imageUrl`: **8× base64 PNG** (468 KB–3.5 MB, vše < Cloudinary 10 MB limit), 7× prázdné.

## Cílový model
`game_events` ([schema](../../../../Projekt-ikaros/backend/src/modules/game-events/schemas/game-event.schema.ts)): `worldId:str, title(1-200), date(ISO str), description(≤5000), imageUrl?:str|null, imageFocalX/Y?, imageZoom?, imageFit?, targetGroup?:str|null, groupOnly:bool(def false), confirmable:bool(def true), confirmedBy:[{userId,userName}], comments:[], reminderSent:bool(def false)` + timestamps. Index `{worldId,date}`.
**Archive policy (9.1-I):** žádné pole — počítá se z `date` vs `now−24h`. Hráč vidí jen `date ≥ cutoff`, archiv (`< cutoff`) jen PomocnyPJ+. → migrované minulé akce uvidí v archivu jen PJ (správně).
**`groupOnly`:** true → akci vidí jen PJ + členové `targetGroup`. Filtr matchuje `targetGroup` na `membership.group`.

## Rozhodnutí (k potvrzení)
1. **worldId** = string `"6d6174726978000000000001"` (doplnit všem 15).
2. **Obrázky → Cloudinary** (potvrzeno): 8 base64 PNG → webp. Cloudinary `upload(dataUri)` bere base64 přímo (ne GDrive). `f9-upload.mjs` (vzor F8, oddělené soubory, folder `matrix/events`). 7 prázdných → `imageUrl=null`.
3. **`confirmedBy`** zachovat, ale **`userId` mapovat přes F1** (oldId→newId; všechny 4 (Zara/Tyky/Abi/Neville) mapují čistě). `userName` 1:1. → RSVP zůstane funkční.
4. **`targetGroup`:** `""` → null. Frakce → zachovat název. **`groupOnly = false`** (navrhuji) — všichni vidí, targetGroup = tag/filtr. *Důvod: bezpečné (neztratí viditelnost); groupOnly=true by skryl akci všem mimo frakci, a kdyby název přesně nematchoval `membership.group`, neviděl by ji nikdo kromě PJ.* 🔀 Alternativa: groupOnly=true (frakční akce soukromé) — jen pokud potvrdíš, že chceš.
5. **`date`** 1:1 (už ISO). `description`/`title`/`confirmable` 1:1. `comments=[]`, `reminderSent=false`.
6. **timestamps:** `createdAt` = parsed `date` (akce vznikla k datu), `updatedAt` = now. `_mig:'f9'`. Zachovat `_id`.

## Transformace (per event)
| Matrix | Ikaros | Pravidlo |
|---|---|---|
| `_id` | `_id` | zachovat |
| `title`,`date`,`description`,`confirmable` | stejné | 1:1 (date už ISO) |
| `imageUrl` (base64) | `imageUrl` | Cloudinary URL z f9-image-map; prázdné→null |
| `targetGroup` `""` | `targetGroup` | null; frakce→zachovat |
| — | `groupOnly` | false (rozhodnutí 4) |
| `confirmedBy[].userId` | `confirmedBy[].userId` | **F1 map** oldId→newId |
| `confirmedBy[].userName` | `confirmedBy[].userName` | 1:1 |
| — | `worldId`,`comments[]`,`reminderSent`,`_mig` | doplnit |

## Mechanika — 3 fáze (vzor F8)
### Fáze A — `migration/f9-upload.mjs`
Vzor F8 upload, ale vstup = **base64 z TimelineEvents… ne — z GameEvents.bson** (events s `data:` imageUrl). Cloudinary `upload(dataUri, {public_id: eventId, format:'webp', folder:'matrix/events'})`. Oddělené `f9-image-progress.ndjson` + `f9-image-map.json` (eventId→secure_url).

### Fáze B — `migration/f9-build.mjs`
Načte GameEvents.bson + f9-image-map.json + F1 user-map (OWNER mapa pro confirmedBy). Transformuje → `migration/f9-data.json(.gz)` = `{events[]}`. Souhrn: počty, obrázků napárováno, confirmedBy mapováno, archiv/budoucí.

### Fáze C — workflow `import-matrix-game-events.yml` (3 režimy)
`dry-run`/`import`(IMPORT)/`rollback`(ROLLBACK). mongosh, IIFE, world `6d61…01`, upsert podle `_id`. **Dry-run ověří:** že `game_events` v matrix světě prázdné; výpis akcí `date/title/targetGroup/img?`; budoucí vs archiv počet. **Rollback:** `deleteMany({_mig:'f9'})`.

## Mimo rozsah
- `imageFocalX/Y/Zoom/Fit` (Matrix nemá → null/default).
- `comments` (Matrix nemá → []).
- `reminderSent` (job dořeší → false).

## Otevřené body
1. Potvrdit rozhodnutí, hlavně **`groupOnly`** (false navrhuji vs true).
2. (žádný slug-drift — GameEvents nemají odkazy.)
