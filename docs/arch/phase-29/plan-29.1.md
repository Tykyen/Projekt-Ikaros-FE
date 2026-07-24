# Plan 29.1 — Deník optimistic-lock — implementace

**Status:** schváleno (spec 29.1), commit na `main`, git řeší uživatel ručně.
**Pořadí:** BE (+ regen kontrakt) → BE test → *(BE restart udělá uživatel)* → FE typy/hook → FE UX → FE test → funkce+napoveda → ověření.

---

## A) BE — `Projekt-ikaros/backend`

### A1. DTO — `src/modules/character-subdocs/dto/update-character-diary.dto.ts`
Přidat na konec třídy `UpdateCharacterDiaryDto`:
```ts
/**
 * 29.1 (D-DIARY-HP-DELTA) — optimistic concurrency token. FE pošle `diary.updatedAt`
 * z GET; při neshodě 409 DIARY_CONFLICT (souběžná HP editace). Kontrolní pole,
 * NEpersistuje se (service ho vyřízne). Chybí-li → současné chování (plain $set).
 */
@IsOptional() @IsString() expectedUpdatedAt?: string;
```

### A2. Repo — `repositories/character-diary.repository.ts`
Nová atomická varianta vedle `updateWithCustomDataPatch` (kopie + filtr na `updatedAt`):
```ts
/** 29.1 — atomický optimistic lock nad delta-merge cestou (vzor pages.updateIfUnchanged).
 *  Filtr `{ characterId, updatedAt: expectedUpdatedAt }` → ze souběhu uspěje jeden; null = konflikt. */
async updateWithCustomDataPatchIfUnchanged(
  characterId: string,
  extras: Partial<CharacterDiary>,
  customDataPatch: Record<string, unknown>,
  expectedUpdatedAt: Date,
): Promise<CharacterDiary | null> {
  // …stejná stavba setOp/unsetOp jako updateWithCustomDataPatch…
  const doc = await this.model
    .findOneAndUpdate({ characterId, updatedAt: expectedUpdatedAt }, update, { new: true })
    .lean().exec();
  return doc ? this.toEntity(...) : null;
}
```

### A3. Service — `character-subdocs.service.ts` `updateDiary`
1. Import `ConflictException` (dnes jen `NotFoundException`).
2. Signatura `data` rozšířit o `expectedUpdatedAt?: string`.
3. Po `findByCharacterId` + moderation gate: `const { expectedUpdatedAt, ...dtoRest } = data;`
4. App pre-check (obě cesty): pokud `expectedUpdatedAt && existing.updatedAt` a `new Date(existing.updatedAt).toISOString() !== expectedUpdatedAt` → `throw new ConflictException({ code:'DIARY_CONFLICT', message:'Deník byl mezitím upraven. Načti aktuální verzi nebo přepiš.', serverUpdatedAt })`.
5. Dál používat `dtoRest` místo `data`. V delta cestě: když `expectedUpdatedAt` → `updateWithCustomDataPatchIfUnchanged(...,new Date(expectedUpdatedAt))`, na `null` → `ConflictException(DIARY_CONFLICT)` (race mezi checkem a zápisem); jinak `updateWithCustomDataPatch` (beze změny).
6. Legacy `customData` cesta: jen app pre-check (vzor characters module), atomiku neřešíme (deprecated, ne HP hot path).

### A4. Error kontrakt (spouští se z FE repa — skenuje BE)
```
cd Projekt-ikaros-FE && node scripts/error-contract-scan.mjs --emit
```
→ přepíše `backend/src/common/errors/error-codes.generated.ts` **i** `Projekt-ikaros-FE/src/shared/types/errorCodes.generated.ts` (obsahují nově `DIARY_CONFLICT`).

### A5. BE test — `character-subdocs.service.spec.ts` (vzor `character-accounts.service.spec.ts`)
`updateDiary`: (a) `expectedUpdatedAt` ≠ server → `ConflictException`, (b) sedící token → success, (c) bez tokenu → `updateWithCustomDataPatch` (plain). `--runInBand`.

**Ověření BE:** `npm run typecheck && npm run lint:check`; test `jest --runInBand character-subdocs`. *(prettier+jest ručně, hook jen typecheck+lint — memory fb_be_precommit.)*

---

## B) FE — `Projekt-ikaros-FE`

### B1. Typy — `src/features/world/pages/api/characters.types.ts`
`CharacterDiary` + `updatedAt?: string;` (D-073 token, jediný subdoc bez něj).

### B2. Vstupní typ + hook — `pages/api/useCharacterMutations.ts`
- `UpdateDiaryInput` + `expectedUpdatedAt?: string;`
- `useUpdateCharacterDiary.mutationFn` (vzor `useUpdateCurrencies`): doplnit token z cache
  ```ts
  const cached = qc.getQueryData<CharacterDiary>(charactersQueryKey.subdoc(worldId, slug, 'diary'))?.updatedAt;
  const expectedUpdatedAt = input.expectedUpdatedAt ?? (cached ? new Date(cached).toISOString() : undefined);
  return api.patch(..., { ...input, ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}) });
  ```
- `onError`: rozlišit `DIARY_CONFLICT` → friendly toast + `qc.invalidateQueries(subdoc diary)` (refetch), NEretryovat. Jinak stávající generický toast. `onSuccess` už `setQueryData` (čerstvý token).

### B3. 409 UX rozvětvení
- **Combat panely (12):** dědí centrální hook chování (toast+refetch) — nic per-panel navíc (dnes mají jen lokální `toast.error`; necháme hook rozhodnout, panel na conflict nedělá nic). Ověřit, že lokální onError panelu conflict nezdvojí.
- **Deníkový tab `DiaryTab.tsx`:** na 409 (`isDiaryConflict`) otevřít `ConflictModal` (převzít z `PageEditor/components/ConflictModal.tsx`): Načíst aktuální (refetch+re-hydrace) / Přepsat (`mutateAsync` bez `expectedUpdatedAt`) / Zrušit. *(Pokud uživatel řekne „stačí toast+refetch i pro tab" → vynechat modal.)*

### B4. FE test — `useCharacterMutations` spec (vzor `currencies/api.spec.tsx`)
(a) posílá `expectedUpdatedAt` z cache, (b) bez updatedAt → payload bez tokenu, (c) `DIARY_CONFLICT` → `invalidateQueries` + toast.

**Ověření FE:** `npm run build` (tsc -b, ne --noEmit); `vitest run` na dotčené specy; `eslint --fix` (NE prettier — obří diff).

---

## C) Doplňky (změna chování)
- `funkce`: dotčené topiky — deník/postavy (souběžná editace → 409 DIARY_CONFLICT).
- `napoveda`: errorTopics + changelog (nové chování „HP mezitím upravil někdo jiný").
- `mobil-desktop`: jen pokud ConflictModal v deníkovém tabu = nová UI (ověřit responsivitu staticky).
- Spec status → „hotovo"; případně zápis do `chybovy-denik` jako ✅ ŘEŠENÍ (netriviální, dva repo).

---

## Rizika při implementaci
- Token prosákne do `$set` → destrukturace hned po pre-checku (A3.3), BE test hlídá.
- `updatedAt` filtr míjí kvůli ms → `toISOString()` round-trip je přesný (vzor pages/account funguje).
- Combat panel dvojitý toast (lokální + hook) → sladit v B3.
- BE restart nutný před FE testem (memory fb_be_restart) — dělá uživatel.
