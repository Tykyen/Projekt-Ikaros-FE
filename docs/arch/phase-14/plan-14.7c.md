# Plán 14.7c — BE záloha světa (ZIP) + import (round-trip)

> Implementační plán k [spec-14.7.md](spec-14.7.md), sub-krok **14.7c** (pilíř B).
> Status: ✅ **export hotový (2026-06-19)** — c-1 (BE `world-export`, typecheck+lint zelené) + c-2 (FE tab „Export / Záloha"); **import (c-3/c-4) ODLOŽEN**. Mimo V1: binárky médií do ZIP, per-PJ poznámky, chat. Formát import-ready. **Čeká BE restart** + reálný download test uživatele.
> Repozitář: primárně **BE** `Projekt-ikaros/backend` (nový modul `world-export`) + FE UI (nastavení světa).
> Rozsah: export celého viditelného stromu **jednoho** světa do ZIP (JSON + média) + **import** zpět (nový svět z balíku, round-trip).

## Zjištění z průzkumu BE (mění návrh)

1. **Strom světa ≈ 29 entit** napříč ~15 moduly (World/Settings/Membership, Page+akjTabs, Character+5 subdoc+Account, Bestie, WorldMapEntry/Folder, MapScene, UniverseMap, CalendarConfig, Timeline, GameEvent, campaign 9 typů, WorldGmNotes, volitelně chat).
2. **ID formy:** většina **Mongo ObjectId** (→ string), výjimky **app UUID** (`WorldMapEntry`/`WorldMapFolder`/`EventComment`). Remap zvládne obě (string→string mapa).
3. **Viditelnostní filtry jsou `private`** (pages.service `assertAccess`/`filterAkjTabsForViewer`). → export volá **veřejné** service metody jiných modulů, které filtrují interně (`worldMaps.list`, `pages.findByWorld`, `bestiae.list`, campaign `resolveScope`); kde veřejná filtrující metoda chybí, přidat tenkou public metodu.
4. **Seed cascade** (`world.created` → pages/settings/kalendář seed; `character.created` emitAsync → 5 subdoc). **Import musí svět vytvořit BEZ seedu** (nový `skipSeed` flag), jinak duplikáty.
5. **`archiver` ani ZIP lib v BE není** → přidat `archiver`.
6. **Žádný media-download helper** → `fetch(url)` → buffer → `archive.append`.

## Klíčová rozhodnutí (k odsouhlasení)

1. **Reuse filtrů přes veřejné service metody** (ne zpřístupňování private). Export = orchestrátor volající `pagesService`/`worldMapsService`/`bestiaeService`/`campaignService`/`gameEventsService` se `userId`+rolí → dostane už filtrovaná data. „Co vidíš, to exportuješ" zadarmo.
2. **Scope v manifestu:** `pj-full` (Admin+ / WorldRole.PJ) | `viewer-partial` (PomocnyPJ a níž). Import přijme jen `pj-full`.
3. **Export = přímý stream** (`archiver` → `@Res() res`), žádná job infra. Velké světy: sledovat timeout (fallback async = budoucí).
4. **Import user vazby → importér.** `ownerId`/`userId`/`page.ownerUserId`/campaign `ownerId` → `requester.id`; membership = jen importér jako PJ; cizí memberships zahodit; `akjTabs.access`/`comments.authorId`/`confirmedBy` user-refs zahodit (neexistují).
5. **Import = svět bez seedu** (`createWorld(..., { skipSeed: true })`) → 2-pass insert importovaných entit. Slug kolize → nový slug (suffix).
6. **Chat** volitelný blok (default off), jak ve specu.

## Část c-1 — Export (BE)

Nový modul **`world-export`** (vzor `data-export`):
- `world-export.module.ts` — importuje moduly entit (worlds, pages, characters, character-subdocs, bestiae, world-maps, maps, universe, world-calendar-config, timeline, game-events, campaign, world-gm-notes, [chat]).
- `world-export.controller.ts` — `GET /worlds/:worldId/export?chat=0` (`JwtAuthGuard`); ověří membership + roli, určí scope, streamuje ZIP.
- `world-export.service.ts` — `buildExport(worldId, requester, { chat })`:
  - `resolveExportScope()` → `pj-full | viewer-partial | denied` (dle UserRole/WorldRole).
  - Sebere strom přes veřejné service metody (filtrované); `Promise.all` po skupinách.
  - Sestaví `data.json` (stabilní ID, ISO data).
  - Média: posbírá všechny `imageUrl`/`url` z entit → `fetch` → `archive.append(buffer, { name: 'media/<hash>.<ext>' })`; v `data.json` URL nahradí markerem `media/<hash>` (pro import re-upload).
  - `manifest.json` = `{ version:'1.0', scope, exportedAt, worldSlug, counts, hasChat }`.
- **ZIP:** `archiver('zip')` pipe do response; `Content-Disposition: attachment; filename="svet-<slug>-<datum>.zip"`.

## Část c-2 — FE export UI
- Sekce **„Export / Záloha"** v nastavení světa: tlačítko „Exportovat / Zálohovat vše" + chat checkbox + neurčitý progress + stažení (fetch blob → download).
- GDPR konzument `GET /data-export/me` (profil „Stáhnout moje data") — uzavře D-NEW-INV-ADMIN-UI.

## Část c-3 — Import (BE) — ⏸️ ODLOŽENO (2026-06-19)
> Import se zatím nestaví (rozhodnutí uživatele — nejrizikovější kus). Export níže popsaný formát drží import-ready, aby šel doplnit později. Zbytek sekce = budoucí návrh.

### (budoucí) Import — NEJRIZIKOVĚJŠÍ
- `POST /worlds/import` (multipart ZIP, `JwtAuthGuard`).
- Parse `manifest.json` → **odmítnout, pokud `scope !== 'pj-full'`** nebo `version` neznámá.
- **Vytvoř svět bez seedu** — rozšířit `worlds.service.create` o `{ skipSeed?: boolean }` (seed listenery kontrolují flag) → prázdný svět, importér = PJ owner.
- **2-pass remap** (`Map<oldId,newId>`):
  - Pass 1: vytvoř všechny entity s **novými ID**, FK pole zatím placeholder/null, user-refs → importér. Pořadí dle závislostí (World → Character(+subdoc) → Page → campaign → mapy → events).
  - Pass 2: přepiš FK z mapy (`characterRef`, `campaignSubjectId`, `preferredCalendarConfigId`, `folderId`/`parentId`, relationship `subjectA/B`/`storylineIds`, storyline `subjectIds`/`relationshipIds`, shop `groupId`/`subgroupId`/`linkedItemIds`).
- **Média:** `media/` z balíku → re-upload `uploadService` → nové URL → přepiš v entitách.
- **Character subdocs:** vytvořit přímo (ne přes `character.created` emit — ten by je seedoval prázdné); insert z balíku.
- Vrátí `{ worldId, slug }` nového světa.

## Část c-4 — FE import UI + round-trip
- Nastavení/úvod: „Importovat svět ze zálohy" → upload ZIP → progress → redirect na nový svět.
- **Round-trip test** (BE e2e): export `pj-full` seedovaného světa → import → porovnat počty entit + namátkové reference. Hlavní záruka integrity.

## Pořadí provádění
c-1 (export BE) → c-2 (FE export, ověřitelná hodnota: záloha funguje) → c-3 (import BE) → c-4 (FE import + round-trip). Export je samostatně hodnotný i bez importu.

## Soubory (orientačně)
- **BE nové:** `src/modules/world-export/{module,controller,service}.ts` + `interfaces/world-export-payload.interface.ts` + `world-import.service.ts`. `package.json` +`archiver`. `app.module.ts` registrace.
- **BE úpravy:** `worlds.service.create` (+`skipSeed`), seed listenery (respekt flagu), případně tenké public filtrující metody v dotčených service.
- **BE test:** `test/world-export.e2e-spec.ts` (round-trip).
- **FE:** sekce Export/Import v nastavení světa + `data-export/me` konzument; `funkce`/`napoveda`/roadmap.

## Rizika (BE)
- ⚠️ **Referenční integrita importu** — 2-pass remap musí pokrýt VŠECHNY FK (db-integrity audit eviduje string FK bez `ref:`). Round-trip test = brána.
- ⚠️ **Seed potlačení** — `skipSeed` se musí promítnout do VŠECH `@OnEvent('world.created')`/`character.created` listenerů, jinak částečný seed → kolize.
- ⚠️ **Circular refs campaign** (relationship↔storyline) — řeší Pass 2.
- ⚠️ **Velikost** — světy s mnoha médii = velký ZIP/dlouhý request → timeout; fetch médií sekvenčně může být pomalý.
- ⚠️ **Tainted/cizí URL** — média z umírajícího starého webu (audit propadlých odkazů) → fetch selže → graceful skip.
- ⚠️ **BE restart** po novém modulu/env; **jest `--maxWorkers=2`** (flaky MongoMemoryServer); BE precommit = typecheck+lint (testy ručně).
- ⚠️ **Leak-safe** — `viewer-partial` balík nesmí nést `accessRequirements`/`visibleToPlayerIds` cizích (filtry to už dělají, ověřit).

## Ověření (před push)
- BE: `npm run typecheck` + `npm run lint:check` + `npx jest --maxWorkers=2` zelené; round-trip e2e (export→import→diff počtů) zelený.
- Export jednoho světa = ZIP s `manifest.json`+`data.json`+`media/`; scope dle role.
- Import `pj-full` → nový svět s remapovanými ID, bez seed duplikátů; `viewer-partial` odmítnut.
- FE: `npm run build` + tlačítka ověřit `mobil-desktop`.
- Po BE změně **restart**; `funkce`+`napoveda`+roadmap; git na uživateli.
