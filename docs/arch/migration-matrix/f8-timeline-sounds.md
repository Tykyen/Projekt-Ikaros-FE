# F8 — Timeline + zvuky Matrix → Ikaros

> Migrace světa **matrix**. Kontext: [`HANDOFF.md`](./HANDOFF.md), [`index.md`](./index.md). Paměť: `project_matrix_full_migration`.
> Stav: **✅ HOTOVO — živé v newmatrix (2026-06-09).** Naimportováno **97 timeline událostí** (97/97 obrázků na Cloudinary) + **9 zvuků** (per-world matrix, createdBy=Tyky). Obě cílové features existují (Timeline spec 9.3, Zvuky spec 13.3).
>
> **Soubory (BE repo):** `migration/f8-upload.mjs` (obrázky → `f8-image-map.json`), `f8-build.mjs` → `f8-data.json(.gz)`, `f8-import.js`, workflow `import-matrix-timeline.yml` (3 režimy, `_mig:'f8'`, upsert podle `_id`).
> **Úklid (PJ):** `svobodny-matrix` = 1 broken pageSlug (stránka neexistuje, „není potřeba") — event funguje, jen proklik neaktivní. Sounds enum pořadí ověřeno vizuálně v dry-run (kategorie sedí).

## Co to je
**Dvě nezávislé datové migrace** v jednom F bodě:
- **Timeline** (`TimelineEvents` 97) → Ikaros `timeline_events` (modul `timeline`, spec 9.3, route `/svet/:w/timeline`).
- **Zvuky** (`sounds` 9) → Ikaros `sounds` (modul `sounds`, spec 13.3, route `/svet/:w/zvuky`, YouTube přehrávač).

Obě cílové features hotové → čistá datová migrace (vzor F12/F7). Timeline navíc potřebuje **rehost obrázků GDrive→Cloudinary** (jako F12, ale 97 timeline obrázků **NENÍ ve F12 mapě**).

## Zdroj
`C:\Matrix\dump\MatrixDatabase\{TimelineEvents,sounds}.bson` (Node + `bson`).

### TimelineEvents (97)
Klíče: `_id, year, month, day, text, imageUrl, link`. Ověřené hodnoty napříč všemi:
- `year`: **string**, parsovatelné, **7 záporných** (`-10000`…`2039`).
- `month`/`day`: **stringy**, 18× `null`, 79× vyplněno; **dirty** hodnoty s tečkou (`"4."`, `"7."`) → parse.
- `text`: 0 prázdných, max **63 znaků** (krátký titulek, ne rich obsah). **Žádné `title`.**
- `imageUrl`: 97/97 = **GDrive ID** (28 zn), 0 http. **0 z nich ve `f12-map.json`** (F12 je nenahrál).
- `link`: 89× `/page/<slug>`, 8× prázdné, 0 http.

### sounds (9)
Klíče **PascalCase**: `Name, YoutubeUrl, MediaType, PrimaryFunction, Environment, EmotionalTone, Intensity, Duration, Loop, OnsetProfile, OutroProfile, FactionStyle, TechLevel, MagicLevel, CombatEnergy, Tags, Notes`. **Enum hodnoty = čísla** (indexy). Chybí `worldId/status/createdBy`. Matrix-specifické (LUMÍCI, frakce).

## Cílové modely
**`timeline_events`** ([schema](../../../../Projekt-ikaros/backend/src/modules/timeline/schemas/timeline-event.schema.ts)): `worldId:str, year:int, month:int(≥1), day:int(≥1), hour?:0-23, title:str(≤200,required), text:str(≤50000,required), imageUrl?:http|data, imageFocalX/Y?:0-100, link?:http, pageSlug?:kebab-case, celestialOverrides[]`. Kalendář přes `worldSettings.timelineCalendarSlug`. Index `{worldId,year,month,day}`. Práva: čtení Hrac+, write PomocnyPJ+.

**`sounds`** ([schema](../../../../Projekt-ikaros/backend/src/modules/sounds/schemas/sound.schema.ts)): `worldId?:str|null, name, youtubeUrl, mediaType, primaryFunction, environment, emotionalTone, intensity(1-5), duration, loop, onsetProfile, outroProfile, factionStyle, techLevel, magicLevel, combatEnergy, tags[], notes, status('active'|'pending'|'rejected'), proposedBy?, createdBy(required)`. Enumy = **string**.

## Rozhodnutí (k potvrzení)
1. **worldId** = string `"6d6174726978000000000001"` (obě kolekce). Sounds = **per-world matrix** (ne global) — jsou Matrix-specifické; PJ je v UI může nominovat do globálu sám.
2. **Obrázky timeline → nahrát do Cloudinary** (potvrzeno uživatelem). 97 GDrive ID, vzor F12 fáze A.
3. **`title` = `text`** (Matrix má jen `text` ≤63 zn; oba Ikaros fieldy required not-empty) → title = text, text = text.
4. **`month`/`day` null → `1`** (DTO Min 1); dirty `"4."` → `parseInt`=4. `year` string→int (záporné OK).
5. **`link` `/page/<slug>` → `pageSlug`** (strip `/page/`, slug-drift check jako F6); `link`=null (žádné externí). 8× bez linku → pageSlug=null.
6. **sounds `createdBy` = Tyky** (newId `6a22639538e14e7238e74ef9`), `status='active'`. Číselné enumy → string dle pořadí Ikaros enumu (mapy níže).
7. Zachovat původní `_id` (idempotence; reference nejsou). `_mig:'f8'`.

### Sounds enum mapy (index → Ikaros enum string)
```
mediaType:       [music, ambient, sfx, signal, voice]
primaryFunction: [safe, social, exploration, tension, threat, combat, ritual, horror, revelation, aftermath, transition, system]
environment:     [neutral, nature, urban, interior, industrial, military, sacral, arcane, digital, alien, ruin, void]
emotionalTone:   [calm, wonder, melancholy, mystery, dread, fear, urgency, aggression, grief, awe, faith, corruption]
onsetProfile:    [instant, fast, soft, slow]
outroProfile:    [hard, soft, fade, seamless]
factionStyle:    [civilian, noble, religious, military, corporate, criminal, tribal, arcane, alien]
techLevel:       [preindustrial, industrial, modern, advanced, posthuman]
magicLevel:      [none, low, medium, high, extreme]
combatEnergy:    [none, low, medium, high]
```
Všechny Matrix hodnoty jsou v rozsahu enumů (ověřeno). `intensity/duration/loop/tags/notes` 1:1.

## Transformace
**Timeline (per event):** `_id` zachovat; `year`=parseInt; `month`/`day`=parseInt(||1); `title`=text; `text`=text; `imageUrl`=Cloudinary URL z f8-image-map (jinak null); `pageSlug`=link.replace(`/page/`,'') (přemapovaný); +`worldId,_mig`.
**Sounds (per zvuk):** `_id` zachovat; PascalCase→camelCase; enum číslo→string (mapy); +`worldId,createdBy=Tyky,status='active',_mig`.

## Mechanika — 3 fáze (vzor F12)
### Fáze A — upload obrázků `migration/f8-upload.mjs`
Kopie F12 upload logiky (Cloudinary z `backend/.env`, GDrive `uc?export=download`→webp, 10MB→thumbnail fallback, NDJSON resume), ale **oddělené** soubory: `f8-image-progress.ndjson` + `f8-image-map.json` + folder `matrix/timeline` (ať nerozbije F12). Vstup = 97 `{eventId, gdriveId}` z TimelineEvents. Výstup mapa `gdriveId → secure_url`.

### Fáze B — build `migration/f8-build.mjs`
Načte oba bson + `f8-image-map.json`, transformuje, výstup `migration/f8-data.json(.gz)` = `{timeline[], sounds[]}`. Vypíše souhrn (počty, kolik obrázků napárováno, sounds enum mapping `název→kategorie` ke kontrole, kolik linků→pageSlug).

### Fáze C — workflow `import-matrix-timeline.yml` (3 režimy)
`dry-run`/`import`(IMPORT)/`rollback`(ROLLBACK). mongosh přes SSH, IIFE, world `6d61…01`. Upsert podle `_id`. **Dry-run ověří:** Tyky existuje (createdBy); kolik `pageSlug` sedí na prod Page (slug-drift seznam → ALIAS); že `timeline_events`+`sounds` v matrix světě prázdné; sounds `název→namapované kategorie` výpis. **Rollback:** `deleteMany({_mig:'f8'})` v obou kolekcích.

## Slug-drift (pageSlug)
89 timeline linků `/page/<slug>`. Slug nemusí v prod existovat (F6/F7 drift). Dry-run ověří proti prod `pages`, nesedící → ALIAS v `f8-build.mjs` (převzít z F6/F7: kraven→pumi-stin, mingguo→li-mingguo, john→john-willscar…). Broken pageSlug se uloží tak jako tak (event má title/text), proklik ožije po opravě.

## Rizika
- **Sounds enum pořadí:** spoléhá, že staré C# enum pořadí = Ikaros TS enum pořadí. Nelze ověřit ze zdrojáku (jen dump). Mitigace: jen 9 zvuků, dry-run vypíše `název→kategorie` k vizuální kontrole PJ před ostrým importem.
- **Timeline obrázky:** GDrive musí být veřejné (F12 ověřilo, že fungují). Fail upload → event bez obrázku (imageUrl=null), neblokuje.

## Mimo rozsah
- `celestialOverrides`, `imageFocalX/Y` (Matrix nemá → default null/center).
- `hour` (Matrix nemá → vynechat, optional).
- Sounds nominační workflow (importujeme rovnou `active`).
- GameEvents (F9), zbylé kolekce.

## Otevřené body
1. Potvrdit rozhodnutí (worldId/title=text/sounds per-world/createdBy=Tyky).
2. ALIAS slug-drift se finalizuje po dry-run.
3. Sounds enum pořadí — vizuální kontrola po dry-run.
