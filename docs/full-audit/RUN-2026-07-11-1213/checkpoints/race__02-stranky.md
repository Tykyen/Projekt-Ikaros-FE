# Checkpoint — race / 02-stranky (RUN-2026-07-11-1213)

Oblast: `docs/race-condition-plan/02-stranky.md` · registr `docs/race-condition-audit.md` · prefix `RC-`
BE: `c:/Matrix/ProjektIkaros/Projekt-ikaros/backend` · READ-ONLY.
Metoda: statika L1-L3 create/update/slug/AKJ grant + **reálný běh** race e2e suite.

## VERDIKT RC-P3 (priorita zadání) — ✅ DRŽÍ, premisa „500" NEPOTVRZENA

**Zadání tvrdilo, že e2e test RC-P3 („2 souběžné create stejného slugu → 500 místo 409") PADÁ. Proti aktuálnímu HEAD to NEPLATÍ — test je ZELENÝ.**

Reálný běh:
```
npx jest --config ./test/jest-e2e.json test/race/pages.race.e2e-spec.ts
Tests: 5 passed, 5 total   (baseline, RC-P1, RC-P2, RC-P3, RC-P4)
```
RC-P3 samostatně: `-t "RC-P3"` → 1 passed. `serverErrors === 0`, `created === 1`, `count === 1`.

### Kde by 500 vzniklo — a proč NEvzniká (přesná příčina)

Řetěz souběžného create stejného slugu:
1. Oba požadavky projdou `ensureAvailableSlug` (check-then-act, ne atomický):
   `pages.service.ts:415-431` → `existsBySlugAndWorld` (`repositories/pages.repository.ts:81-86`, `countDocuments`) vrátí oběma 0 (žádný doc ještě neuložen) → oba drží slug `p-dup-slug`.
2. Oba volají `pagesRepo.save` → `base-mongo.repository.ts:18-22` `new this.model(entity).save()`.
3. Unique index **existuje**: `schemas/page.schema.ts:80` `PageSchema.index({ worldId: 1, slug: 1 }, { unique: true })`. Druhý `.save()` → nativní `MongoServerError` **code 11000**.
4. `create` catch blok E11000 **NEmapuje** — jen DI-04 rollback postavy a `throw err`:
   `pages.service.ts:380-396`, konkrétně re-throw na `pages.service.ts:395`. Syrový error (code 11000 zachován) propadne dál.
5. **Přemapování na 409 dělá VÝHRADNĚ globální filtr** `HttpExceptionFilter`:
   `common/filters/http-exception.filter.ts:126-133` (větev EC-11) + `isDuplicateKey` `:172-178` (`e.code === 11000` → 409 `DUPLICATE_KEY`).
6. Filtr je registrován v produkci (`main.ts:77-79`) **i v test harness** (`test/helpers/app-factory.ts:118` `app.useGlobalFilters(new HttpExceptionFilter())`). Proto e2e vidí čistý 409, ne 500.

Závěr: registr `race-condition-audit.md:37` („RC-P3 DRŽÍ, create ošetřuje E11000") je **výsledkově správný, ale nepřesně formulovaný** — E11000 neošetřuje `create`, nýbrž globální filtr. Žádná regrese; premisa 500 v zadání se na HEAD nereprodukovala.

## Nálezy

### 🆕 RC-P3-F1 (⭐ nízká, latentní — křehkost, ne aktivní bug)
Korektní 409 u duplicitního slugu **stojí a padá s globálním filtrem**, servisní vrstva E11000 nechytá.
- `pages.service.ts:380-396` catch dělá jen DI-04 rollback + `throw err` (`:395`) — žádný `code===11000 → ConflictException`.
- Kdyby se odstranila/regresovala větev `http-exception.filter.ts:126-133`, nebo kdyby jakákoli cesta obešla globální filtr (jiný test app bez `useGlobalFilters`, přímé volání service v jiném kontextu), `create` vrátí **500 Internal** na běžnou souběžnou kolizi slugu.
- Návrh (gated souhlasem, netriviál): buď (a) v `create` obalit `pagesRepo.save` try/catch a `code===11000` přemapovat na `ConflictException(PAGE_SLUG_TAKEN, 409)` u zdroje (obranná redundance k filtru + doménový kód místo generického `DUPLICATE_KEY`), nebo (b) ponechat filtr jako jediný bod, ale doplnit anti-regression test „create bez globálního filtru → doménová 409" jako zub. Preferuji (a) — konzistentní s `ensureAvailableSlug` doménovým 409 a s worlds.service.ts:975 vzorem (code===11000 handling u zdroje).

### 🆕 RC-P3-F2 (⭐ nízká, UX pod souběhem — data-safe)
Souběžný **rename slugu** (update) dvou různých stránek na týž nový slug degraduje z „auto-suffix" na 409.
- `pages.service.ts:484-492`: rename cesta volá `ensureAvailableSlug` (stejný check-then-act). Dvě souběžné přejmenování na `foo`: oba `existsBySlugAndWorld('foo')=false` → oba zapíšou `foo`. Zápis jde přes `update` (`base-mongo.repository.ts:24-35` `findByIdAndUpdate $set`) nebo `updateIfUnchanged` → druhý → E11000 → **409** (filtr), místo zamýšleného auto-suffixu `foo-2`.
- Unique index chrání integritu (nikdy 2× `foo`), takže **žádná ztráta dat** — jen uživatel dostane konflikt tam, kde create UX slibuje auto-suffix. Nízká priorita; stejná třída jako F1.

### ♻️ Známé, opravené, ověřeno zelené (bez nového nálezu)
- **RC-P1** (LU) — `updateIfUnchanged` atomický cond. na `updatedAt` (`pages.service.ts:561-572`, repo `:63-79`). Barrier test zelený (conflicts===1).
- **RC-P2** (LU, AKJ grant souběh) — kryto RC-P1 fixem; 2 souběžné granty téže verze na túž `akjTabs` záložku → 1 projde, 1× 409. Barrier na `updateIfUnchanged` zelený. Bez nového produkčního kódu.
- **RC-P4** (PH) — null-guard po update → 404 (`pages.service.ts:578-582`). Gate test zelený.
- **RC-D2** (PH, cross-oblast) — `assertCanWrite` guard `isActive && !deletedAt` (`pages.service.ts:1244-1249`) + re-check `isWorldActive` po save (`:373-379`). Není jádro této oblasti, ale sdílí create cestu — bez konfliktu s výše uvedeným.

## Pokrytí oblasti (create / update / slug / AKJ grant souběh)
| Povrch | Uzel | Stav |
|---|---|---|
| create slug uniqueness | `pages.service.ts:297,415-431` + save + unique idx `page.schema.ts:80` | ✅ 409 přes globální filtr (viz RC-P3-F1 křehkost) |
| optimistic lock (update) | `pages.service.ts:561-572` / repo `updateIfUnchanged` | ✅ atomický (RC-P1) |
| AKJ granty (full-array akjTabs $set) | `pages.service.ts:539-541` + `updateIfUnchanged` | ✅ kryto RC-P1 (RC-P2) |
| slug rename (update) | `pages.service.ts:484-492` | ✅ data-safe; UX degradace pod souběhem (RC-P3-F2) |
| update-po-delete (phantom) | `pages.service.ts:578-582` | ✅ 404 (RC-P4) |

## Shrnutí
RC-P3 na HEAD **drží** (5/5 zelených). Premisa zadání o padajícím testu / 500 se nereprodukovala. 500 by vzniklo jen při výpadku globálního filtru — servisní vrstva E11000 sama nechytá (RC-P3-F1, latentní křehkost ⭐). Dále nalezena drobná UX degradace slug renamu pod souběhem (RC-P3-F2). Oba nálezy nízké priority, data-safe; fixy gated souhlasem.
