# race-condition / 02-stranky — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem kompletně:
- `backend/src/modules/pages/pages.service.ts` (961 ř.) — veškerá logika update/create/delete
- `backend/src/modules/pages/repositories/pages.repository.ts` — `updateIfUnchanged`, `toEntity`
- `backend/src/modules/pages/interfaces/pages-repository.interface.ts`
- `backend/src/modules/pages/schemas/page.schema.ts` — indexy
- `backend/src/modules/pages/pages.controller.ts`
- `backend/src/modules/pages/dto/update-page.dto.ts` + `create-page.dto.ts`
- `backend/src/modules/pages/pages.service.spec.ts` (942 ř.) — unit pokrytí
- `backend/test/race/pages.race.e2e-spec.ts` — deterministické race testy
- `backend/src/database/mongo/base-mongo.repository.ts` — `update` (plain `$set`)
- `backend/src/common/filters/http-exception.filter.ts` — E11000 → 409
- `backend/src/modules/characters/characters.service.ts` (create + update)
- `frontend/src/features/world/pages/PageEditor/PageEditor.tsx`
- `frontend/src/features/world/pages/PageEditor/hooks/usePageEditorState.ts`
- `frontend/src/features/world/pages/PageEditor/components/ConflictModal.tsx`
- `frontend/src/features/world/pages/api/useUpdatePage.ts`
- `frontend/src/features/world/pages/api/useCharacterMutations.ts`

Osy: LU (lost-update) · TOCTOU · PH (phantom/orphan) · AT (atomicita)

## Dosažená L vs cílová L

- L1 (hypotéza): ✅ všechny osy
- L2 (stres-stress): ✅ existující race suite (RC-P1..P4, 5/5 zelená)
- L3 (deterministická bariéra): ✅ `pages.race.e2e-spec.ts` Barrier/Gate na P1/P2/P4
- L4 (fix nasazen + zelená): ✅ RC-P1/P2/P3/P4 fixnuty, zelené
- L5-teeth (mutace): ⬜ Stryker nespouštěn nad pages race testy (mimo scope RO auditu)

**Dosaženo: L4 staticky. L5-teeth = PROOF-REQUEST.**

## Nálezy

### Nové (🆕)

**RC-RUN-01** · LU · `pages.service.ts:337–372` + `PageEditor.tsx:341–372`  
**FE `handleOverwriteConflict` neposílá `akjTabs` ani `ownerUserId`**  
Při 409 PAGE_CONFLICT uživatel zvolí „Přepsat" → `handleOverwriteConflict` volá `update.mutateAsync` bez polí `akjTabs` a `ownerUserId`. Na BE `pagesRepo.update` pak dostane `patch` bez `akjTabs` (podmínka `...(persistDto.akjTabs && {...})` neplatí), takže `akjTabs` v DB zůstane z předchozí verze, ne z editoru. To je OK pro `akjTabs` (PATCH semantika drží). Ale `ownerUserId` chybí taky — a pokud `type` je `Postava hráče`, pak `isPersona=true`, BE NEmaže `ownerUserId` (větev `!isPersona && {...}` neplatí), ale také ho nenastavuje → pokud PJ změnil přiřazení postavy jinému hráči a naráží na konflikt, „přepsání" tuto změnu tiše zahodí.  
**Kde:** `Projekt-ikaros-FE/src/features/world/pages/PageEditor/PageEditor.tsx:337–372`  
**Dopad:** 🟡 Tiché zahození změny `ownerUserId` na PC stránce při conflict-overwrite. `akjTabs` zahozen záměrně ale bez komentáře (lze mýlit).  
**Návrh:** Přidat `ownerUserId: state.ownerUserId || undefined` a `akjTabs: state.akjTabs` do `handleOverwriteConflict` payloadu (parita s `handleSave`). Přidat inline komentář proč `akjTabs` chybí nebo ho přidat.  
**L2** · 🆕

---

**RC-RUN-02** · LU · `pages.service.spec.ts:44–56`  
**Unit mock `IPagesRepository` neobsahuje `updateIfUnchanged` → optimistic-lock větev bez unit pokrytí**  
`mockPagesRepo` na řádku 44–56 deklaruje `findById / save / update / delete` atd., ale CHYBÍ `updateIfUnchanged`. Jakýkoliv unit test, který by zavolal `update()` s `dto.expectedUpdatedAt`, dostane `TypeError: pagesRepo.updateIfUnchanged is not a function`. Žádný existující unit test tuto větev netestuje (RC-P1 oprava v `.service.ts` řádky 409–421 nemá žádný unit test). Ochrana existuje pouze v e2e race testu (L3), ne v jednotkových testech.  
**Kde:** `backend/src/modules/pages/pages.service.spec.ts:44–56` + `pages.service.ts:409–421`  
**Dopad:** 🟡 Regression test gap — budoucí refactor service může rozbit `updateIfUnchanged` cestu, aniž to zachytí unit suite (unit projde, e2e odhalí pozdě).  
**Návrh:** Přidat `updateIfUnchanged: jest.fn()` do `mockPagesRepo`; přidat unit testy pro (a) `expectedUpdatedAt` → `updateIfUnchanged` null → 409, (b) `updateIfUnchanged` success → 200.  
**L1** · 🆕

---

**RC-RUN-03** · TOCTOU · `pages.service.ts:355–369` + `characters.service.ts:230–262`  
**Wiki→persona type transition: 2 souběžné PATCHe (bez `expectedUpdatedAt`) mohou volat `charactersService.create` se stejným slugem**  
Scénář: stránka bez `characterRef`, dva PJ současně přepínají `type: 'Ostatní'→'Postava hráče'` bez optimistic tokenu. Oba projdou app-level check (no `expectedUpdatedAt`), oba vidí `!page.characterRef`, oba volají `charactersService.create({slug})`. První uspěje, druhý narazí na E11000 → global filter → 409 DUPLICATE_KEY. Druhý PATCH selže před zápisem stránky. Výsledek: 1 Character, 1 úspěšný PATCH. Čistý — žádný orphan, žádné double-write na stránce. **Hypotéza: DRŽÍ** (unique index zachytí). Ale: chybí deterministický e2e test pro tento průchod — pokrytí jen static L1.  
**Kde:** `pages.service.ts:355`, `characters.service.ts:232`  
**Dopad:** ⚪ Funkčně v pořádku (unique index drží), ale testovací mezera — L1 pouze.  
**Návrh:** Doplnit race e2e test (M-STRESS / M-BARRIER na `charactersRepo.save`) pro wiki→persona transition.  
**L1** · 🆕

---

**RC-RUN-04** · LU · `pages.service.ts:319–329`  
**App-level optimistic check má `null` mezeru: `page.updatedAt` null → check přeskočen, ale `updateIfUnchanged` pak vrátí null → falešný 409**  
Na řádku 322: `if (serverUpdatedAt && serverUpdatedAt !== dto.expectedUpdatedAt)` — pokud `page.updatedAt` je null, `serverUpdatedAt` je null, podmínka neplatí → app-level check přeskočen (OK). Ale poté (řádek 410) `updateIfUnchanged(id, patch, new Date(dto.expectedUpdatedAt))` hledá v DB `{ _id, updatedAt: expectedDate }`. Pokud DB dokument má `updatedAt: null`, filtr neodpovídá → vrátí null → service hodí 409 „Stránka byla mezitím upravena". Falešně pozitivní 409 pro stránky bez `updatedAt` (historická data nebo race na mongo insert timing).  
**Kde:** `pages.service.ts:319–322` vs `pages.service.ts:410–414` + `repositories/pages.repository.ts:63–79`  
**Dopad:** 🟡 Falešný 409 pro stránky bez `updatedAt`. V praxi minimální (Mongoose `timestamps:true` je od začátku projektu), ale technicky možné při edge-case dat.  
**Návrh:** Pokud `page.updatedAt` je null a `dto.expectedUpdatedAt` je přítomen → buď vrátit 409 ihned v app-level (konzistentní), nebo v `updateIfUnchanged` filtru ošetřit null jako wildcard.  
**L1** · 🆕

---

### Potvrzeno z předchozího průchodu — drží ✅

| ID | Stav v HEAD | Poznámka |
|---|---|---|
| RC-P1 | ✅ OPRAVENO — `updateIfUnchanged` v repo | Atomický lock v DB, ne jen app-level |
| RC-P2 | ✅ KRYTÝ RC-P1 fixem | `expectedUpdatedAt` cesta kryje i grant payload |
| RC-P3 | ✅ DRŽÍ | E11000 → 409, 1 stránka v DB |
| RC-P4 | ✅ OPRAVENO | null-guard → 404 |

## PROOF-REQUEST

**PR-02-A — L5 Stryker mutace: pages race e2e**  
Test `🐛 RC-P1` používá bariéru na `pagesRepo.update` (buggy cesta). Po fixu bariéra jde přes `updateIfUnchanged`. Stryker mutace by měl ověřit, že odebráním `updateIfUnchanged` (návrat k `update`) bariérový test zčervená. Nelze provést staticky; vyžaduje `npx stryker run --mutate "pages.repository.ts"` nebo manuální revert + race run.

**PR-02-B — L3 deterministický test wiki→persona TOCTOU (RC-RUN-03)**  
Chybí test, který deterministicky vynutí dva souběžné wiki→persona PATCHe bez tokenu na bariéru `charactersRepo.save`. Aktuálně jen L1 hypotéza. Potřeba `withBarrier(charRepo, 'save', barrier)` v `pages.race.e2e-spec.ts`.
