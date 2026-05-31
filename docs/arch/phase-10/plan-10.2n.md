# Plán 10.2n — Orchestrace: accordion + Přístup/viditelnost

> **Pro workery:** Task-po-tasku, checkbox tracking. TDD: test → red → impl → green → commit.
> Po BE změně `pnpm prettier --write` (jinak husky hook selže — `feedback_be_precommit_prettier`).
> ⚠️ **Nemíchat BE+FE v jedné dávce** (`feedback_no_mixed_be_fe_batch`) — fáze A (BE) → B (FE).

**Cíl:** Orchestrátor zvládne 10+ bestií / 5 NPC / 10 PC (sbalitelné palety) a převezme
„kdo co vidí" (per-scéna i per-hráč skrytí/zámek místo tabulky Rozmístění hráčů).

**Repo:** FE `c:\Matrix\ProjektIkaros\Projekt-ikaros-FE` · BE `c:\Matrix\ProjektIkaros\Projekt-ikaros\backend`
**Spec:** `docs/arch/phase-10/spec-10.2n.md`

## Odchylky při implementaci (záměr)
- **`scene.state` zůstal čistý** (nepřepisuje overrides). „Na všechny" řeší **FE sweep**
  v `AccessBoard`: po `scene.state {field}` vyšle pro každý dotčený override
  `scene.playerState {userId, [field]: null}`. Důvod: každý op má pak **čistý inverse**
  (undo korektní); wipe uvnitř `scene.state` by si vynutil hackovat inverse o snapshot.
- **Sbalitelné je vše** (user feedback): nejen palety, ale i „Aktivní scény" a „Přístup
  a viditelnost" sdílí `PaletteAccordion`, vše default zavřené.
- **Opraven pre-existující** mrtvý duplikát `case 'sound.playlist'` v `applyOperationToScene`.

## Klíčová rozhodnutí (potvrzeno uživatelem)
- **„na všechny" = zabudováno do `scene.state`**: nastaví per-scéna default **a smaže
  overrides daného pole** ze všech `playerStates`. Jeden atomický op.
- **Per-hráč** = nová op `scene.playerState {userId, isHidden?:bool|null, isLocked?:bool|null}`
  (`null` = smaž override pole → fallback na default).
- **Real-time = Varianta B**: `playerStates` se posílá všem na scéně, klient počítá `effective(me)`.
- **Přiřazení** zůstává manuální přes board (`+ přiřadit`), bez auto-assign.
- **Číslo kroku** 10.2n.

---

## Fáze A — Backend (per-hráč override)

### A1 — Schema + interface + mapper
- [ ] `schemas/map-scene.schema.ts` — `@Prop` `playerStates` (subdoc `{ userId, isHidden?, isLocked? }`, default `[]`), za řádky 51-52.
- [ ] `interfaces/map-scene.interface.ts` — `playerStates: ScenePlayerState[]` + typ.
- [ ] `repositories/maps.repository.ts` — **`toEntity` mapper** zahrne `playerStates` (⚠️ `project_be_field_checklist` — začít zde, jinak GET zahodí).

### A2 — Operace `scene.playerState` (DTO + registry)
- [ ] `dto/operations/scene-ops.dto.ts` — `ScenePlayerStateOpDto` (`@Equals('scene.playerState')`, `userId @IsString`, `isHidden?/isLocked? @IsOptional @IsBoolean` + `null` povolit přes `@ValidateIf`).
- [ ] `dto/operations/index.ts` — registr do union + discriminated map.
- [ ] `interfaces/map-operation.interface.ts` — typ varianty.

### A3 — applyAtomic + computeInverse
- [ ] `operations/map-operations.service.ts`:
  - [ ] `scene.playerState` apply — upsert do `playerStates` dle `userId`; pole s `null` smaž; prázdný entry (oba undefined) odeber.
  - [ ] **`scene.state` rozšířit** (řádek ~694) — kromě set `isHidden`/`isLocked` **smazat** dané pole z `playerStates[*]` (a vyčistit prázdné entries).
  - [ ] `computeInverse` (řádek ~271 oblast) pro `scene.playerState` (undo: předchozí override) i upravený `scene.state` (undo musí obnovit smazané overrides → inverse nese snapshot dotčených).
- [ ] BE testy (`map-operations.service.spec.ts`): playerState upsert/clear, scene.state wipe overrides, inverse round-trip.

### A4 — Authorizer
- [ ] `operations/operations-authorizer.service.ts`:
  - [ ] `token.move` (řádek 91) — `scene.isLocked` → **efektivní lock** pro `user.id`: `scene.playerStates.find(p=>p.userId===user.id)?.isLocked ?? scene.isLocked`.
  - [ ] `scene.playerState` je PJ-only **automaticky** (hráč spadne do `default` throw) — ověřit testem, nepřidávat do player switch.
- [ ] BE testy (`operations-authorizer.service.spec.ts`): hráč s per-hráč lock nesmí move; bez locku smí; hráč nesmí `scene.playerState`.
- [ ] `pnpm prettier --write` + BE build/test zelené.

---

## Fáze B — Frontend

### B1 — Typy + patcher (mirror BE)
- [ ] `types.ts` — `MapScene.playerStates: ScenePlayerState[]`; `MapOperation | { type:'scene.playerState'; userId; isHidden?:bool|null; isLocked?:bool|null }`.
- [ ] `utils/applyOperationToScene.ts` — `case 'scene.playerState'` (upsert/clear, mirror A3); rozšířit `case 'scene.state'` o wipe overrides.
- [ ] Test `utils/__tests__/applyOperationToScene.test.ts` — oba casy (vzor řádek 214).

### B2 — Efektivní stav v player view + gating
- [ ] `utils/sceneAccess.ts` (nový) — `effectiveHidden(scene, userId)`, `effectiveLocked(scene, userId)` (`override ?? default`). + test.
- [ ] `TacticalMapView.tsx:1137-1140` — `showHidden`/`showLocked` přes `effectiveHidden/Locked(scene, currentUser.id)` místo holého `scene.isHidden/isLocked`.
- [ ] `hooks/useTokenPermissions.ts:26` — efektivní lock pro `me` (param `userId`).

### B3 — Accordion palety (n-1)
- [ ] `components/pj-panel/PaletteAccordion.tsx` + `.module.css` — header (chevron + title + `.count` chip) + collapsible body; LS persist `ikr-map-pal-{id}`; a11y (aria-expanded, Enter/Space — vzor `MapPjPanel` header).
- [ ] Palety (`PcPalette`/`NpcCharacterPalette`/`BestiePalette`) vystaví počet aktivních přes `onCountChange(n)` (bez kopie filtru).
- [ ] `MapPjPanel.tsx` — obalit 3 spawn sekce do `PaletteAccordion` (default sbalené, count v hlavičce).
- [ ] Test: accordion toggle + persist.

### B4 — Board „Přístup a viditelnost" (n-2 + n-3)
- [ ] **Smazat** `MemberAssignmentTable.tsx` + `.module.css`; odebrat sekci z `MapPjPanel.tsx:248-258`.
- [ ] `components/pj-panel/AccessBoard.tsx` + `.module.css`:
  - [ ] Per aktivní scéna karta (sbalitelná): hlavička = název + „👁 vše"/„🔒 vše" (volá `scene.state`) + read-only mini-badge stavu.
  - [ ] Řádek hráče (seskupení `useWorldMembers` × `currentSceneId`): 👁/🚫 a 🔓/🔒 per-hráč toggle. Klik: `next=!effective`; pokud `next===sceneDefault` → `scene.playerState{userId, …:null}` (clear), jinak `scene.playerState{userId, …:next}`.
  - [ ] „+ přiřadit hráče" picker (členové mimo scénu) → `member.assignToScene`; × u řádku → `member.unassign`.
- [ ] `MapPjPanel.tsx` — `handleAssign/handleUnassign/mutation` zůstávají, předat do `AccessBoard`; per-scéna `scene.state` mutace přes `postMapOperation`.
- [ ] Test: board render (assign/override toggle, „na všechny" wipe), per-hráč clear-na-default logika.

### B5 — Závěr
- [ ] FE testy zelené (`pnpm test`), žádné nové TS/lint warningy (`feedback_preexist_debt_owned`).
- [ ] **`mobil-desktop`** audit — panel levý dolní, accordion + toggly touch-friendly (≥ ~32px), board karty stackují.
- [ ] **`napoveda`** — orchestrace (sbalitelné palety) + nový „Přístup a viditelnost" (per-scéna/per-hráč skrytí/zámek).
- [ ] roadmapa-fe: přidat `10.2n` a zaškrtnout.

---

## Mimo scope (dluh/defer)
- Per-token `isLocked` (D-066).
- Skrytí pozic tokenů ve skryté scéně z network payloadu (pre-existující — kandidát na dluh).

## Pořadí commitů (návrh)
1. A1+A2 (schema+dto+mapper) · 2. A3 (apply+inverse+test) · 3. A4 (authorizer+test) ·
4. B1+B2 (typy+patcher+efektivní stav) · 5. B3 (accordion) · 6. B4 (board, smazat tabulku) ·
7. B5 (mobil-desktop, napoveda, roadmapa).
