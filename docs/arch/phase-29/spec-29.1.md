# Spec 29.1 — Deník: optimistic-lock `expectedUpdatedAt`

**Status:** ✅ Implementováno 2026-07-24 (kód + testy + funkce/napoveda). Čeká BE restart + živé ověření (dva taby / PJ+hráč).
**Rozsah:** BE + FE — malý; dotažení už half-wired vzoru (D-073) na deníkovou HP cestu
**Repo:** `Projekt-ikaros-FE` (FE) + `Projekt-ikaros/backend` (BE), commit přímo na `main`
**Velikost:** odhad ~10 souborů / ~200 ř. (BE ~5, FE ~5) + testy
**Autor:** PJ + Claude
**Datum:** 2026-07-24
**Souvisí:** dluh D-DIARY-HP-DELTA + D-073 · vzor: pages (7.2k), currencies, character-account (RC-E7) · sousedí s 29.2 (Token→deník HP sync 5 systémů)

---

## 1. Cíl

Souběžné úpravy HP v deníku dnes končí **last-write-wins** (BE plochý `$set` absolutní hodnoty, FE počítá novou hodnotu ze stale cache — 12 combat panelů + deníkový tab). Dva zapisovatelé = tiché „zmizelé HP". Cíl: dotáhnout **optimistic-lock `expectedUpdatedAt`** na deníkovou PATCH cestu — souběžný přepis skončí **viditelným 409 `DIARY_CONFLICT`** místo tiché ztráty, klient refetchne aktuální stav.

---

## 2. Kontext / motivace

- HP PC/NPC nežije ve `stats` ani v root Character — je v subdoku **`CharacterDiary.customData`** pod per-systémovými plochými klíči (`drdh_hp`, `hp_current`, `jad_hpCur`, `matrix_health`, …; mapa v `token-hp-diary-map.ts`).
- Bestie tokeny mají HP jako **atomickou deltu** (`$add` v Mongu, lost-update-safe). Deník ne — proto dluh „Bestie deltu mají, deník ne".
- **Substrát je hotový:** `character-diaries` má `@Schema({ timestamps: true })`, `toEntity` už `updatedAt` vrací na drát ([character-diary.repository.ts:195]). Chybí jen vlastní zámek nad tím.
- Vzor je hotový ve 4 modulech (pages, currencies, characters, character-account) — kopírujeme, nevymýšlíme.
- **Trigger dle karty:** stížnost na „zmizelé HP" v betě **nebo** volná kapacita ~1 den. Řešíme teď (proaktivně, karta je „malý náklad").

**Když ne:** v betě u souběhu (2 zařízení, PJ+hráč, dva taby) HP tiše mizí — klasický lost-update, těžko reprodukovatelný bug report.

---

## 3. Audit současného stavu

### BE — `Projekt-ikaros/backend`
| Vrstva | Soubor | Stav |
|---|---|---|
| Endpoint | `character-subdocs.controller.ts:59` `@Patch('diary')` → `PATCH /worlds/:worldId/characters/:slug/diary` | OK |
| Service | `character-subdocs.service.ts` `updateDiary` (~268–337) | **žádná concurrency kontrola** |
| Repo (hot) | `character-diary.repository.ts` `updateWithCustomDataPatch` (61–85): `findOneAndUpdate({ characterId }, {$set/$unset})` | **bez `updatedAt` filtru** |
| DTO | `dto/update-character-diary.dto.ts` (55–87) | **`expectedUpdatedAt` chybí** |
| Entity/wire | `interfaces/character-diary.interface.ts:30` + `toEntity:195` | `updatedAt?` **už se vrací** ✅ |
| Error kód | `common/errors/error-codes.generated.ts` | **`DIARY_CONFLICT` neexistuje** (jen PAGE/CURRENCY/CHARACTER/ACCOUNT `_CONFLICT`) |
| 2. zapisovatel | `maps/operations/map-operations.service.ts` `syncTokenHpToDiary` (~1679–1721) | server-authoritative best-effort, **bez** klientského tokenu |

Referenční vzor (pages): app-pre-check `page.updatedAt.toISOString() !== dto.expectedUpdatedAt` → `ConflictException({code:'PAGE_CONFLICT', serverUpdatedAt})` (567–579) · atomický `updateIfUnchanged(id, patch, new Date(dto.expectedUpdatedAt))` (repo 74–90) · destrukturace `const { expectedUpdatedAt: _ignored, ...persistDto } = dto` (592).

### FE — `Projekt-ikaros-FE`
| Vrstva | Soubor | Stav |
|---|---|---|
| Sdílený hook | `pages/api/useCharacterMutations.ts:177-193` `useUpdateCharacterDiary` | posílá `{customDataPatch}`, **žádné `expectedUpdatedAt`**; onError jen generický toast |
| Vstupní typ | `useCharacterMutations.ts:59-74` `UpdateDiaryInput` | **`expectedUpdatedAt` chybí** |
| Response typ | `characters.types.ts:98-105` `CharacterDiary` | **`updatedAt` chybí** (jediný subdoc bez něj; finance/inventory/currencies ho mají) |
| Query | `useCharacterSubdocs.ts` `useCharacterDiary`, key `['characters',worldId,'detail',slug,'diary']`, staleTime 30 s | OK |
| Cesta A | deníkový tab `DiaryTab.tsx` → **explicitní save** (akumuluje patch, uloží na tlačítko) | |
| Cesta B | **12 combat panelů** `tactical-map/.../system-panels/*CombatPanel.tsx` → **debounced auto-save 500 ms**, absolutní HP `clamp(cur+delta)` ze stale cache | ← jádro dluhu |

Referenční vzor: currencies `api.ts:42-93` (token z cache → PUT; na `CURRENCY_CONFLICT` rollback + friendly toast + centrální `invalidateQueries`) · pages `PageEditor.tsx:277-383` + `ConflictModal.tsx` (409 → modal Refresh/Přepsat/Zrušit).

---

## 4. Návrh řešení

Čistý optimistic-lock (**cesta „c" z karty**) — **žádná** konverze HP na deltu (`$inc`); to je 29.2 / „náklad střední". Absolutní zápis zůstává, jen ho zamkneme razítkem.

### 4.1 BE — zámek na deníkové PATCH cestě (vzor pages)

1. **DTO** `update-character-diary.dto.ts`: `@IsOptional() @IsString() expectedUpdatedAt?: string;`
2. **Repo** `character-diary.repository.ts`: nová `updateWithCustomDataPatchIfUnchanged(characterId, extras, patch, expectedUpdatedAt: Date)` — kopie `updateWithCustomDataPatch`, ale filtr `{ characterId, updatedAt: expectedUpdatedAt }`; `null` = konflikt. (Pozor: klíč je `characterId`, **ne `_id`**.)
3. **Service** `updateDiary`: hned na začátku `const { expectedUpdatedAt, ...rest } = dto` (aby token nikdy neprosákl do `$set`). Pokud `expectedUpdatedAt` **a** dokument má `updatedAt`:
   - app-pre-check `existing.updatedAt.toISOString() !== expectedUpdatedAt` → `ConflictException({ code:'DIARY_CONFLICT', serverUpdatedAt })`,
   - jinak zapiš přes `…IfUnchanged(...)`; na `null` (souběh mezi checkem a zápisem) → `ConflictException({ code:'DIARY_CONFLICT' })`.
   - Bez tokenu (legacy / placeholder bez `updatedAt`) → **současná cesta beze změny** (plain `$set`).
4. **Error kontrakt**: přidat throw → přegenerovat `error-codes.generated.ts` (`scripts/error-contract-scan.mjs --emit`), jinak spadne `npm run audit:errors`.
5. **token-sync `syncTokenHpToDiary` zůstává beze změny** — píše bez tokenu (nemá od koho vzít verzi). Důsledek je žádoucí: mapa bumpne `updatedAt` → následný ruční save se stale tokenem dostane 409 a uvidí hodnotu z mapy. (Souběh mapa↔ruční je mimo rozsah — patří k 29.2.)

### 4.2 FE — token z cache + rozvětvené 409 UX

1. **Typ** `CharacterDiary`: `+ updatedAt?: string;` · `UpdateDiaryInput`: `+ expectedUpdatedAt?: string;`
2. **Hook** `useUpdateCharacterDiary` (vzor `useUpdateCurrencies`): v `mutationFn` doplní `expectedUpdatedAt` z `qc.getQueryData(subdoc diary)?.updatedAt` (pokud caller neposlal vlastní a token existuje). `onSuccess` už dělá `setQueryData` z PATCH response → čerstvý token pro další edit hned. Bez tokenu → payload ho vynechá (BE spadne na plain path).
3. **Conflict helper** `isDiaryConflict(err) = parseApiErrorCode(err) === 'DIARY_CONFLICT'` (nový kód přidat do FE `errorCodes.generated.ts` — mirror BE).
4. **409 UX — rozvětvené dle cesty** (klíčové, viz karta „Pozor na UX 409 u debounced auto-save"):
   - **Combat panely (hot path, debounced):** centrálně v hooku — na `DIARY_CONFLICT` **friendly toast** („HP mezitím upravil někdo jiný — načítám aktuální stav.") + `invalidateQueries(diary)` (refetch). Pending absolutní zápis se **zahodí, NEretryuje** — re-derivace absolutní hodnoty z nové báze by přepsala cizí změnu (clobber-loop). Uživatel po refetchi vidí čerstvé HP a doklikne. → lost-update se stane viditelným, ne destruktivním.
   - **Deníkový tab (explicitní save, drží rozepsaný draft):** převzít **`ConflictModal`** z PageEditoru — „Načíst aktuální" (refetch, ztratíš rozepsané) / „Přepsat" (resend **bez** `expectedUpdatedAt`) / „Zrušit" (zůstat v editoru). Slepý refetch by zahodil delší draft.

---

## 5. Out of scope

- **Konverze HP na deltu (`$inc`)** — to je cesta a/b, „náklad střední"; patří k 29.2.
- **Souběh token-sync (mapa) ↔ ruční edit** — token-sync zůstává bez locku (server-authoritative). Ošetření by chtělo delta zápis nebo retry token-syncu → 29.2.
- **Ostatní subdoc cesty** (finance/inventory už token mají; notes/calendar mimo tuto kartu).
- **Optimistic `onMutate`** v combat panelech — neřešíme, jen 409 refetch.

---

## 6. Acceptance kritéria

1. ✅ BE: PATCH `.../diary` s `expectedUpdatedAt` ≠ aktuální `updatedAt` → **409 `DIARY_CONFLICT`** (nic se nezapíše).
2. ✅ BE: PATCH s **sedícím** `expectedUpdatedAt` → zápis projde, vrátí nový `updatedAt`.
3. ✅ BE: PATCH **bez** `expectedUpdatedAt` → současné chování (plain `$set`), žádná regrese.
4. ✅ BE: `expectedUpdatedAt` se **nikdy** nezapíše do `customData` (destrukturace).
5. ✅ BE: `DIARY_CONFLICT` v `error-codes.generated.ts`, `npm run audit:errors` zelený.
6. ✅ FE: combat panel odešle `expectedUpdatedAt` z cache; na 409 → toast + refetch, žádný clobber-retry.
7. ✅ FE: deníkový tab na 409 → ConflictModal (3 volby), „Přepsat" projde bez tokenu.
8. ✅ FE: bez `updatedAt` v cache (legacy) → PATCH bez tokenu (žádná regrese).
9. ✅ `funkce` + `napoveda` aktualizované (změna chování — souběžná editace deníku).

---

## 7. Test plán

**BE (jest, vzor `character-accounts.service.spec.ts`):** `updateDiary` — (a) konflikt → `ConflictException DIARY_CONFLICT`, (b) sedící token → success + nový updatedAt, (c) bez tokenu → plain path. `--runInBand` (flaky mongo).
**FE (vitest, vzor `currencies/api.spec.tsx`):** `useUpdateCharacterDiary` — (a) posílá `expectedUpdatedAt` z cache, (b) bez updatedAt v cache → payload bez tokenu, (c) `DIARY_CONFLICT` → `invalidateQueries` volán + toast.
**Manuál (uživatel, živý web):** dva taby / PJ+hráč — v obou uprav HP téže postavy, druhý save → toast + refetch (panel) / modal (tab), HP nezmizí.

---

## 8. Riziko & rollback

| Riziko | Mitigace |
|---|---|
| Token prosákne do `customData` (persistuje se) | Destrukturace hned na vstupu service (AK #4) + BE test |
| Clobber-loop u debounced auto-save | Na 409 **zahodit** pending, neretryovat; jen refetch (AK #6) |
| Deníkový tab ztratí rozepsaný draft při refetch | ConflictModal se 3 volbami místo slepého refetch (AK #7) |
| `DIARY_CONFLICT` chybí v kontraktu → audit red | Přegenerovat error-codes + FE mirror (AK #5) |
| BE restart nutný (jinak starý bundle dropne field) | Deploy + BE restart před FE testem (memory `fb_be_restart`) |
| Legacy deníky bez `updatedAt` | Bez tokenu → plain path, žádná regrese (AK #3/#8) |

**Rollback:** aditivní změna. Revert BE commitu (DTO+repo+service) vrátí plain `$set`; FE token je best-effort (bez BE podpory se pošle a BE ho ignoruje) → FE revert netřeba spěchat.

---

## 9. Otázky k autorovi

Delegováno, volby zvoleny sám (vyber = nejlepší dle vzoru a rozsahu karty):

- **Optimistic-lock, ne delta** — karta explicitně „cesta (c)"; delta = 29.2.
- **Nový error kód `DIARY_CONFLICT`** (ne recyklace `CHARACTER_CONFLICT`) — konzistence s PAGE/CURRENCY/ACCOUNT, čitelný pro FE branching.
- **Rozvětvené 409 UX** — combat panely tiše (toast+refetch), deníkový tab modal. Jediné skutečné produktové rozhodnutí; kdyby stačil i pro tab jen toast+refetch (bez draft-ochrany), řekni — ušetří ~1 komponentu.
- **token-sync mimo rozsah** — zůstává bez locku (nemá klientskou verzi).

---

**Po schválení specu napíšu implementační plán** (přesné file diffy BE i FE, pořadí BE→restart→FE).
