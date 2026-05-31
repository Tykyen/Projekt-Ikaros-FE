# Plán 10.2j — Viditelný hod kostkou na mapě

> **Pro agentní workery:** Implementuj task-po-tasku. Kroky mají checkbox (`- [ ]`)
> pro tracking. TDD: test → red → impl → green → commit. Časté commity. Po BE změně
> `pnpm prettier --write` (jinak husky hook selže — viz memory `feedback_be_precommit_prettier`).

**Cíl:** Přinést na taktickou mapu viditelný hod kostkou (overlay + persistovaný log
hodů) s world-level viditelností a reuse 6.3 dice enginu/skinů.

**Architektura:** Mapa má izolovaný dice prostor; sdílí jen 6.3 knihovnu kostek
(`rollEngine`, `dicePayload`, `DiceRollOverlay`, `DicePickerPopover`, `SkinPickerPanel`,
`useDiceSkinMapping`). Hody se persistují přes novou map op `dice.roll` (operations
model 10.2-prep-1, cap 50). Viditelnost = 3 boolean na `World`. Overlay i log filtrují
přes sdílený `canSeeRoll` helper. Clear = per-user localStorage timestamp.

**Tech stack:** NestJS + Mongoose (BE), React 19 + TanStack Query + PixiJS v8 (FE),
socket.io, react-hook-form + zod (world settings), vitest + jest.

**Repo cesty:**
- FE: `c:\Matrix\ProjektIkaros\Projekt-ikaros-FE`
- BE: `c:\Matrix\ProjektIkaros\Projekt-ikaros\backend`

**Spec:** `docs/arch/phase-10/spec-10.2j.md`

---

## Odchylky od spec (zjištěné při průzkumu — záměr)

- **Vězení kostek (spec j-6):** 6.3 už má jail v `useDiceSkinMapping`
  (`toggleJail/isJailed/jailed`, persist `WorldMembership.jailedDiceSkins`) + UI v
  `SkinPickerPanel` záložka „Vězení". **Neportujeme legacy `DiceJailTray`** — reuse
  `SkinPickerPanel`. Sdílení chat↔mapa je automatické (per-membership).
- **`DicePayload` import:** map kód importuje `DicePayload` přímo z
  `@/features/world/chat/dice/lib/dicePayload` (čistý typ/lib, žádný UI coupling).
  Žádné vytahování do `_shared`.
- **Roll tvar:** roll nese `rollerKind` + `category` (NE visibility enum). Viditelnost
  je odvozená runtime z `World.diceVisibility` (3 boolean), neukládá se na roll.

---

## File Structure

### BE (`backend/src/modules/maps/`)
- **Modify** `dto/operations/index.ts` — registr `dice.roll` op + union.
- **Create** `dto/operations/dice-ops.dto.ts` — `DiceRollOpDto` + `DiceRollPayloadDto`.
- **Modify** `schemas/map-scene.schema.ts` — `diceRolls` pole.
- **Modify** `operations/map-operations.service.ts` — `applyAtomic` + `computeInverse` case.
- **Modify** `operations/operations-authorizer.service.ts` — `dice.roll` gate.

### BE (`backend/src/modules/worlds/`)
- **Modify** `schemas/world.schema.ts` — `diceVisibility` pole.
- **Modify** `interfaces/world.interface.ts` — `WorldDiceVisibility` + World pole.
- **Modify** `repositories/worlds.repository.ts` — toEntity mapper.
- **Modify** `dto/update-world.dto.ts` — `diceVisibility` validace.

### FE (`src/features/world/tactical-map/`)
- **Modify** `types.ts` — `MapDiceRoll`, `MapScene.diceRolls`, `MapOperation` + `dice.roll`.
- **Modify** `utils/applyOperationToScene.ts` — `dice.roll` patcher case (cap 50).
- **Create** `utils/diceVisibility.ts` — `canSeeRoll` helper.
- **Modify** `hooks/useMapScene.ts` — `diceMutation` (optimistic op).
- **Create** `hooks/useMapDiceRoll.ts` — orchestrace hodu (roll → op → overlay).
- **Create** `components/dice/DiceLogPanel.tsx` + `.module.css` — log panel (port vzhledu).
- **Create** `components/dice/DiceRollButton.tsx` — „vlastní hod" tlačítko + picker.
- **Modify** `TacticalMapView.tsx` — mount overlay + log + roll button.
- **Modify** `map-systems/types.ts` — `rollCategories` v `MapSystemPlugin`.
- **Modify** `map-systems/plugins.ts` — kategorie pro matrix/fate/ostatní.

### FE (world settings + shared)
- **Modify** `src/shared/types/index.ts` — `World.diceVisibility`.
- **Modify** `src/features/world/.../useUpdateWorld.ts` — `UpdateWorldInput.diceVisibility`.
- **Modify** `WorldSettingsPage/tabs/BasicInfoTab.tsx` — 3 toggly pod „Kostky / mechaniky".

### FE theme
- **Modify** `src/themes/_shared/map-tokens.css` — `--map-dice-*` proměnné (pokud nestačí stávající).

---

## FÁZE A — BE: `World.diceVisibility`

### Task A1: World schema + interface + mapper

**Files:**
- Modify: `backend/src/modules/worlds/schemas/world.schema.ts`
- Modify: `backend/src/modules/worlds/interfaces/world.interface.ts`
- Modify: `backend/src/modules/worlds/repositories/worlds.repository.ts`

- [ ] **Step 1: Interface** — do `world.interface.ts` přidat (nad `export interface World`):

```typescript
/** 10.2j — viditelnost hodů kostkou na taktické mapě (world-level). */
export interface WorldDiceVisibility {
  /** Hráči vidí PJ hody. Default false. */
  showPjRolls: boolean;
  /** Hráči vidí hody NPC + bestií. Default false. */
  showNpcBestieRolls: boolean;
  /** Hráči vidí hody spoluhráčů. Default true. */
  showTeammateRolls: boolean;
}
```
A do `World` interface (vedle `activeMapWeather`):
```typescript
  /** 10.2j — viditelnost hodů na mapě. `undefined` = výchozí (jen vlastní + spoluhráči). */
  diceVisibility?: WorldDiceVisibility;
```

- [ ] **Step 2: Schema** — do `world.schema.ts` přidat (vedle `activeMapWeather` prop):

```typescript
/**
 * 10.2j — viditelnost hodů kostkou na mapě.
 * `{ showPjRolls, showNpcBestieRolls, showTeammateRolls }` nebo `undefined`.
 */
@Prop({ type: Object, default: undefined })
diceVisibility?: {
  showPjRolls: boolean;
  showNpcBestieRolls: boolean;
  showTeammateRolls: boolean;
};
```

- [ ] **Step 3: Mapper** — do `worlds.repository.ts` `toEntity` přidat (vedle `activeMapWeather`):

```typescript
    diceVisibility:
      (doc.diceVisibility as World['diceVisibility']) ?? undefined,
```

- [ ] **Step 4: Commit**

```bash
cd backend && pnpm prettier --write "src/modules/worlds/**/*.ts" && pnpm typecheck
git add src/modules/worlds/schemas/world.schema.ts src/modules/worlds/interfaces/world.interface.ts src/modules/worlds/repositories/worlds.repository.ts
git commit -m "feat(10.2j): World.diceVisibility schema + interface + mapper"
```
Expected: typecheck PASS.

### Task A2: UpdateWorldDto validace + test

**Files:**
- Modify: `backend/src/modules/worlds/dto/update-world.dto.ts`
- Test: `backend/src/modules/worlds/worlds.service.spec.ts` (nebo existující world update spec)

- [ ] **Step 1: Write failing test** — ověř, že `update` uloží `diceVisibility`. Přidej do world update specu:

```typescript
it('uloží diceVisibility patch (10.2j)', async () => {
  const dto = {
    diceVisibility: {
      showPjRolls: false,
      showNpcBestieRolls: true,
      showTeammateRolls: true,
    },
  };
  worldsRepo.update.mockResolvedValue({ ...baseWorld, ...dto } as World);
  const result = await service.update(baseWorld.id, dto, pjUser);
  expect(worldsRepo.update).toHaveBeenCalledWith(
    baseWorld.id,
    expect.objectContaining({ diceVisibility: dto.diceVisibility }),
  );
  expect(result.diceVisibility).toEqual(dto.diceVisibility);
});
```
(Pozn.: pokud spec používá jiné názvy mocků/fixtures, zarovnej na ně — přečti hlavičku specu.)

- [ ] **Step 2: Run → fail** — `cd backend && pnpm test worlds.service` → FAIL (validace shodí neznámé pole / patch nepřijde).

- [ ] **Step 3: DTO** — do `update-world.dto.ts` přidat nested DTO + pole:

```typescript
import { Type } from 'class-transformer';
import { IsBoolean, ValidateNested } from 'class-validator';

class DiceVisibilityDto {
  @IsBoolean() showPjRolls!: boolean;
  @IsBoolean() showNpcBestieRolls!: boolean;
  @IsBoolean() showTeammateRolls!: boolean;
}

// v UpdateWorldDto:
  @IsOptional()
  @ValidateNested()
  @Type(() => DiceVisibilityDto)
  diceVisibility?: DiceVisibilityDto;
```

- [ ] **Step 4: Run → pass** — `pnpm test worlds.service` → PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && pnpm prettier --write "src/modules/worlds/**/*.ts"
git add src/modules/worlds/dto/update-world.dto.ts src/modules/worlds/worlds.service.spec.ts
git commit -m "feat(10.2j): UpdateWorldDto diceVisibility + test"
```

---

## FÁZE B — BE: `dice.roll` map operace

### Task B1: MapScene.diceRolls schema (cap pole)

**Files:**
- Modify: `backend/src/modules/maps/schemas/map-scene.schema.ts`

- [ ] **Step 1: Schema** — přidat pole (vedle `effects`):

```typescript
/**
 * 10.2j — persistovaná historie hodů scény. Cap 50 nejnovějších
 * (atomic `$push` + `$slice: -50` v applyAtomic). Tvar: MapDiceRoll
 * (byUserId, rollerName, rollerKind, category, dicePayload, rolledAt, tokenId?).
 */
@Prop({
  type: [MixedArraySubSchema],
  default: (): Record<string, unknown>[] => [],
})
diceRolls: Record<string, unknown>[];
```

- [ ] **Step 2: Commit**

```bash
cd backend && pnpm prettier --write "src/modules/maps/schemas/*.ts" && pnpm typecheck
git add src/modules/maps/schemas/map-scene.schema.ts
git commit -m "feat(10.2j): MapScene.diceRolls schema pole"
```

### Task B2: DiceRollOpDto + registr

**Files:**
- Create: `backend/src/modules/maps/dto/operations/dice-ops.dto.ts`
- Modify: `backend/src/modules/maps/dto/operations/index.ts`

- [ ] **Step 1: Create DTO** — `dice-ops.dto.ts`:

```typescript
import { Equals, IsIn, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DiceRollPayloadDto {
  @IsString() id!: string;
  @IsString() rolledAt!: string; // ISO
  @IsString() byUserId!: string;
  @IsString() rollerName!: string;
  @IsIn(['pc', 'pj', 'npc', 'bestie']) rollerKind!: string;
  @IsIn(['skill', 'initiative', 'custom']) category!: string;
  @IsOptional() @IsString() tokenId?: string;
  /** DicePayload (discriminated union z 6.3) — uloženo jako Mixed. */
  @IsObject() dicePayload!: Record<string, unknown>;
  [key: string]: unknown;
}

export class DiceRollOpDto {
  @Equals('dice.roll') type!: 'dice.roll';
  @IsObject()
  @ValidateNested()
  @Type(() => DiceRollPayloadDto)
  roll!: DiceRollPayloadDto;
}
```

- [ ] **Step 2: Registr** — v `index.ts` přidat import + zápis do `MAP_OPERATION_DTOS` + do `MapOperationPayload` union:

```typescript
import { DiceRollOpDto } from './dice-ops.dto';
// ...
  'dice.roll': DiceRollOpDto,
// ... v union typu přidat:
  | DiceRollOpDto
```

- [ ] **Step 3: Commit**

```bash
cd backend && pnpm prettier --write "src/modules/maps/dto/**/*.ts" && pnpm typecheck
git add src/modules/maps/dto/operations/dice-ops.dto.ts src/modules/maps/dto/operations/index.ts
git commit -m "feat(10.2j): DiceRollOpDto + registr v operations"
```

### Task B3: applyAtomic + computeInverse + test

**Files:**
- Modify: `backend/src/modules/maps/operations/map-operations.service.ts`
- Test: `backend/src/modules/maps/operations/map-operations.service.spec.ts`

- [ ] **Step 1: Write failing test** — append + cap:

```typescript
describe('dice.roll', () => {
  it('atomic $push + $slice -50 do diceRolls', async () => {
    const roll = {
      id: 'r1', rolledAt: '2026-05-31T08:00:00.000Z', byUserId: 'u1',
      rollerName: 'Tyky', rollerKind: 'pc', category: 'custom',
      dicePayload: { type: 'd20', faces: [18], sum: 18, total: 18 },
    };
    await service.applyAtomic(sceneId, { type: 'dice.roll', roll } as never);
    expect(mapsRepo.atomicUpdate).toHaveBeenCalledWith(
      { _id: sceneId },
      expect.objectContaining({
        $push: { diceRolls: { $each: [roll], $slice: -50 } },
        $set: expect.objectContaining({ lastModified: expect.anything() }),
      }),
    );
  });

  it('computeInverse je no-op (hody nejsou undo-relevantní)', () => {
    const inv = service.computeInverse(
      { type: 'dice.roll', roll: { id: 'r1' } } as never,
      baseScene,
    );
    expect(inv).toBeNull();
  });
});
```

- [ ] **Step 2: Run → fail** — `cd backend && pnpm test map-operations` → FAIL.

- [ ] **Step 3: applyAtomic case** — do switche `applyAtomic` (vedle `effect.add`):

```typescript
case 'dice.roll': {
  await this.mapsRepo.atomicUpdate(
    { _id: sceneId },
    {
      $push: {
        diceRolls: { $each: [op.roll], $slice: -50 },
      } as unknown as Record<string, unknown>,
      $set: { lastModified: now },
    },
  );
  return;
}
```

- [ ] **Step 4: computeInverse case** — do switche `computeInverse`:

```typescript
case 'dice.roll':
  // Hody nejsou undo-relevantní (cap je sám zahodí); žádná inverze.
  return null;
```
(Pokud `computeInverse` nevrací `null` jinde, zarovnej na existující „no-op" pattern v souboru — přečti, jak řeší ops bez inverze.)

- [ ] **Step 5: Run → pass** — `pnpm test map-operations` → PASS.

- [ ] **Step 6: Commit**

```bash
cd backend && pnpm prettier --write "src/modules/maps/**/*.ts"
git add src/modules/maps/operations/map-operations.service.ts src/modules/maps/operations/map-operations.service.spec.ts
git commit -m "feat(10.2j): dice.roll applyAtomic ($push+$slice -50) + computeInverse no-op"
```

### Task B4: OperationsAuthorizer gate + test

**Files:**
- Modify: `backend/src/modules/maps/operations/operations-authorizer.service.ts`
- Test: `backend/src/modules/maps/operations/operations-authorizer.service.spec.ts`

- [ ] **Step 1: Write failing tests:**

```typescript
describe('dice.roll authorization', () => {
  it('hráč smí hodit vlastním jménem (byUserId === user.id)', () => {
    expect(() =>
      authorizer.assertCanApply(
        { type: 'dice.roll', roll: { byUserId: playerUser.id, tokenId: undefined } } as never,
        playerUser, playerMembership, scene,
      ),
    ).not.toThrow();
  });

  it('hráč NEsmí hodit cizím byUserId (anti-spoof)', () => {
    expect(() =>
      authorizer.assertCanApply(
        { type: 'dice.roll', roll: { byUserId: 'someone-else' } } as never,
        playerUser, playerMembership, scene,
      ),
    ).toThrow(ForbiddenException);
  });

  it('hráč smí hodit za vlastní PC token (skill)', () => {
    const scn = { ...scene, tokens: [{ id: 't1', characterId: playerUser.id }] };
    expect(() =>
      authorizer.assertCanApply(
        { type: 'dice.roll', roll: { byUserId: playerUser.id, tokenId: 't1' } } as never,
        playerUser, playerMembership, scn,
      ),
    ).not.toThrow();
  });

  it('hráč NEsmí hodit za cizí/NPC token', () => {
    const scn = { ...scene, tokens: [{ id: 't1', characterId: 'gm-npc' }] };
    expect(() =>
      authorizer.assertCanApply(
        { type: 'dice.roll', roll: { byUserId: playerUser.id, tokenId: 't1' } } as never,
        playerUser, playerMembership, scn,
      ),
    ).toThrow(ForbiddenException);
  });
});
```
(Zarovnej názvy metody/fixtures na reálný spec — přečti hlavičku.)

- [ ] **Step 2: Run → fail** — `pnpm test operations-authorizer` → FAIL (default branch shodí hráče).

- [ ] **Step 3: Gate** — do hráčova switche (před `default:`) přidat:

```typescript
case 'dice.roll': {
  // Anti-spoof: hráč hází jen vlastním jménem.
  if (op.roll.byUserId !== user.id) {
    throw new ForbiddenException({
      statusCode: 403, code: 'MAP_DICE_SPOOF',
      message: 'Nelze házet cizím jménem.',
    });
  }
  // Skill/init hod za token → musí být vlastník PC tokenu.
  if (op.roll.tokenId) {
    const token = scene.tokens?.find((t) => t.id === op.roll.tokenId);
    if (!token || token.characterId !== user.id) {
      throw new ForbiddenException({
        statusCode: 403, code: 'MAP_DICE_TOKEN_FORBIDDEN',
        message: 'Nelze házet za cizí token.',
      });
    }
  }
  return;
}
```
(PJ/PomocnyPJ projde dřív přes `isWorldPJ` bypass — nemusí řešit.)

- [ ] **Step 4: Run → pass** — `pnpm test operations-authorizer` → PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && pnpm prettier --write "src/modules/maps/**/*.ts"
git add src/modules/maps/operations/operations-authorizer.service.ts src/modules/maps/operations/operations-authorizer.service.spec.ts
git commit -m "feat(10.2j): dice.roll authorizer (anti-spoof + token ownership)"
```

---

## FÁZE C — FE: typy + patcher + visibility helper

### Task C1: types.ts — MapDiceRoll + MapScene + MapOperation

**Files:**
- Modify: `src/features/world/tactical-map/types.ts`

- [ ] **Step 1: Přidat typ + import** — na vrch souboru:

```typescript
import type { DicePayload } from '@/features/world/chat/dice/lib/dicePayload';
```
Nový typ (vedle `MapEffect`):
```typescript
export type DiceRollerKind = 'pc' | 'pj' | 'npc' | 'bestie';
export type DiceRollCategory = 'skill' | 'initiative' | 'custom';

export interface MapDiceRoll {
  id: string;
  /** ISO timestamp. */
  rolledAt: string;
  byUserId: string;
  rollerName: string;
  rollerKind: DiceRollerKind;
  category: DiceRollCategory;
  /** Token, za který se hází (skill/init); chybí u custom. */
  tokenId?: string;
  dicePayload: DicePayload;
}
```

- [ ] **Step 2: MapScene pole** — přidat za `combat?: CombatState | null;`:

```typescript
  /** 10.2j — persistovaná historie hodů (cap 50, nejnovější na konci). */
  diceRolls?: MapDiceRoll[];
```

- [ ] **Step 3: MapOperation union** — přidat variantu:

```typescript
  // Dice (10.2j)
  | { type: 'dice.roll'; roll: MapDiceRoll }
```

- [ ] **Step 4: Commit**

```bash
git add src/features/world/tactical-map/types.ts
git commit -m "feat(10.2j): FE typy MapDiceRoll + MapScene.diceRolls + dice.roll op"
```

### Task C2: applyOperationToScene patcher + test

**Files:**
- Modify: `src/features/world/tactical-map/utils/applyOperationToScene.ts`
- Test: `src/features/world/tactical-map/utils/applyOperationToScene.spec.ts`

- [ ] **Step 1: Write failing test:**

```typescript
describe('dice.roll', () => {
  const roll = (id: string): MapDiceRoll => ({
    id, rolledAt: '2026-05-31T08:00:00.000Z', byUserId: 'u1',
    rollerName: 'Tyky', rollerKind: 'pc', category: 'custom',
    dicePayload: { type: 'd20', faces: [18], sum: 18, total: 18 } as never,
  });

  it('append do diceRolls', () => {
    const next = applyOperationToScene(baseScene, { type: 'dice.roll', roll: roll('r1') });
    expect(next.diceRolls).toHaveLength(1);
    expect(next.diceRolls?.[0].id).toBe('r1');
  });

  it('cap 50 — odřízne nejstarší', () => {
    const scene = { ...baseScene, diceRolls: Array.from({ length: 50 }, (_, i) => roll(`r${i}`)) };
    const next = applyOperationToScene(scene, { type: 'dice.roll', roll: roll('new') });
    expect(next.diceRolls).toHaveLength(50);
    expect(next.diceRolls?.[0].id).toBe('r1'); // r0 vypadl
    expect(next.diceRolls?.at(-1)?.id).toBe('new');
  });

  it('idempotent dedup podle id (optimistic + broadcast)', () => {
    const scene = { ...baseScene, diceRolls: [roll('r1')] };
    const next = applyOperationToScene(scene, { type: 'dice.roll', roll: roll('r1') });
    expect(next.diceRolls).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run → fail** — `pnpm test applyOperationToScene` → FAIL.

- [ ] **Step 3: Patcher case** — vložit před `default:`:

```typescript
    case 'dice.roll': {
      const current = scene.diceRolls ?? [];
      // Idempotent dedup (optimistic + WS broadcast téže op se stejným id).
      if (current.some((d) => d.id === op.roll.id)) {
        return scene;
      }
      const next = [...current, op.roll];
      if (next.length > 50) next.splice(0, next.length - 50);
      return { ...scene, diceRolls: next };
    }
```

- [ ] **Step 4: Run → pass** — `pnpm test applyOperationToScene` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/world/tactical-map/utils/applyOperationToScene.ts src/features/world/tactical-map/utils/applyOperationToScene.spec.ts
git commit -m "feat(10.2j): patcher dice.roll (append+cap 50+dedup) + testy"
```

### Task C3: canSeeRoll visibility helper + test

**Files:**
- Create: `src/features/world/tactical-map/utils/diceVisibility.ts`
- Test: `src/features/world/tactical-map/utils/diceVisibility.spec.ts`

- [ ] **Step 1: Write failing test:**

```typescript
import { canSeeRoll } from './diceVisibility';
import type { MapDiceRoll } from '../types';
import type { WorldDiceVisibility } from '@/shared/types';

const mk = (kind: MapDiceRoll['rollerKind'], by: string): MapDiceRoll => ({
  id: 'r', rolledAt: '', byUserId: by, rollerName: 'X',
  rollerKind: kind, category: 'custom',
  dicePayload: { type: 'd20', faces: [1], sum: 1, total: 1 } as never,
});
const VIS: WorldDiceVisibility = { showPjRolls: false, showNpcBestieRolls: false, showTeammateRolls: true };

it('PJ vidí vše', () => {
  expect(canSeeRoll(mk('pj', 'gm'), { userId: 'me', isPj: true }, VIS)).toBe(true);
  expect(canSeeRoll(mk('npc', 'gm'), { userId: 'me', isPj: true }, VIS)).toBe(true);
});
it('vlastní hod vždy', () => {
  expect(canSeeRoll(mk('pc', 'me'), { userId: 'me', isPj: false }, VIS)).toBe(true);
});
it('PJ hody skryté default', () => {
  expect(canSeeRoll(mk('pj', 'gm'), { userId: 'me', isPj: false }, VIS)).toBe(false);
});
it('NPC/bestie hody skryté default', () => {
  expect(canSeeRoll(mk('npc', 'gm'), { userId: 'me', isPj: false }, VIS)).toBe(false);
  expect(canSeeRoll(mk('bestie', 'gm'), { userId: 'me', isPj: false }, VIS)).toBe(false);
});
it('spoluhráči viditelní default', () => {
  expect(canSeeRoll(mk('pc', 'other'), { userId: 'me', isPj: false }, VIS)).toBe(true);
});
it('undefined visibility = výchozí (jen vlastní + spoluhráči)', () => {
  expect(canSeeRoll(mk('pj', 'gm'), { userId: 'me', isPj: false }, undefined)).toBe(false);
  expect(canSeeRoll(mk('pc', 'other'), { userId: 'me', isPj: false }, undefined)).toBe(true);
});
```

- [ ] **Step 2: Run → fail** — FAIL (modul neexistuje).

- [ ] **Step 3: Implement:**

```typescript
import type { MapDiceRoll } from '../types';
import type { WorldDiceVisibility } from '@/shared/types';

const DEFAULT_VIS: WorldDiceVisibility = {
  showPjRolls: false,
  showNpcBestieRolls: false,
  showTeammateRolls: true,
};

export interface DiceViewer {
  userId: string;
  isPj: boolean;
}

/** Smí `viewer` vidět tento hod? Řídí overlay na ploše i log. */
export function canSeeRoll(
  roll: MapDiceRoll,
  viewer: DiceViewer,
  visibility: WorldDiceVisibility | undefined,
): boolean {
  if (viewer.isPj) return true;
  if (roll.byUserId === viewer.userId) return true; // vlastní vždy
  const vis = visibility ?? DEFAULT_VIS;
  switch (roll.rollerKind) {
    case 'pj':
      return vis.showPjRolls;
    case 'npc':
    case 'bestie':
      return vis.showNpcBestieRolls;
    case 'pc':
      return vis.showTeammateRolls;
    default:
      return false;
  }
}
```

- [ ] **Step 4: Run → pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/world/tactical-map/utils/diceVisibility.ts src/features/world/tactical-map/utils/diceVisibility.spec.ts
git commit -m "feat(10.2j): canSeeRoll visibility helper + testy"
```

---

## FÁZE D — FE: World typ + world settings toggly

### Task D1: shared World typ + UpdateWorldInput

**Files:**
- Modify: `src/shared/types/index.ts`
- Modify: `src/features/world/.../useUpdateWorld.ts` (cesta dle průzkumu)

- [ ] **Step 1: shared typ** — přidat (vedle `ActiveMapWeather`):

```typescript
export interface WorldDiceVisibility {
  showPjRolls: boolean;
  showNpcBestieRolls: boolean;
  showTeammateRolls: boolean;
}
```
Do `World` interface (vedle `activeMapWeather`):
```typescript
  /** 10.2j — viditelnost hodů na mapě. */
  diceVisibility?: WorldDiceVisibility;
```

- [ ] **Step 2: UpdateWorldInput** — přidat:

```typescript
  diceVisibility?: WorldDiceVisibility;
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/types/index.ts src/features/world/**/useUpdateWorld.ts
git commit -m "feat(10.2j): FE World.diceVisibility + UpdateWorldInput"
```

### Task D2: BasicInfoTab toggly + test

**Files:**
- Modify: `src/features/world/pages/WorldSettingsPage/tabs/BasicInfoTab.tsx`
- Test: `src/features/world/pages/WorldSettingsPage/__tests__/BasicInfoTab.spec.tsx` (vytvoř pokud chybí)

- [ ] **Step 1: Write failing test** — render + toggle + submit posílá patch:

```typescript
it('uloží diceVisibility patch (10.2j)', async () => {
  const mutate = vi.fn().mockResolvedValue({});
  // ... mock useUpdateWorld → { mutateAsync: mutate, isPending: false }
  render(<BasicInfoTab world={{ ...world, diceVisibility: undefined }} />);
  await userEvent.click(screen.getByLabelText(/PJ hody/i));        // showPjRolls true
  await userEvent.click(screen.getByRole('button', { name: /Uložit změny/i }));
  expect(mutate).toHaveBeenCalledWith(
    expect.objectContaining({
      diceVisibility: { showPjRolls: true, showNpcBestieRolls: false, showTeammateRolls: true },
    }),
  );
});
```

- [ ] **Step 2: Run → fail** — `pnpm test BasicInfoTab` → FAIL.

- [ ] **Step 3: Implementace** — do `defaultValues` přidat:

```typescript
    diceVisibility: world?.diceVisibility ?? {
      showPjRolls: false,
      showNpcBestieRolls: false,
      showTeammateRolls: true,
    },
```
Do `onSubmit` patch diff (vedle `dice`):
```typescript
    const dv = values.diceVisibility;
    const cur = world.diceVisibility ?? { showPjRolls: false, showNpcBestieRolls: false, showTeammateRolls: true };
    if (
      dv.showPjRolls !== cur.showPjRolls ||
      dv.showNpcBestieRolls !== cur.showNpcBestieRolls ||
      dv.showTeammateRolls !== cur.showTeammateRolls
    ) {
      patch.diceVisibility = dv;
    }
```
JSX hned pod „Kostky / mechaniky" blokem (Controller + 3 checkboxy):
```tsx
<div className={sec.field}>
  <span className={sec.label}>Viditelnost hodů na mapě</span>
  <Controller
    name="diceVisibility"
    control={control}
    render={({ field }) => (
      <div className={sec.checkboxColumn}>
        <label>
          <input
            type="checkbox"
            checked={field.value.showPjRolls}
            onChange={(e) => field.onChange({ ...field.value, showPjRolls: e.target.checked })}
          />
          Hráči vidí PJ hody
        </label>
        <label>
          <input
            type="checkbox"
            checked={field.value.showNpcBestieRolls}
            onChange={(e) => field.onChange({ ...field.value, showNpcBestieRolls: e.target.checked })}
          />
          Hráči vidí hody NPC a bestií
        </label>
        <label>
          <input
            type="checkbox"
            checked={field.value.showTeammateRolls}
            onChange={(e) => field.onChange({ ...field.value, showTeammateRolls: e.target.checked })}
          />
          Hráči vidí hody spoluhráčů
        </label>
      </div>
    )}
  />
</div>
```
A do zod schema `basicInfoSchema` přidat `diceVisibility` objekt (3× `z.boolean()`).
(Pokud `sec.checkboxColumn` třída neexistuje, použij inline `style={{display:'flex',flexDirection:'column',gap:4}}` nebo přidej třídu do sections.module.css.)

- [ ] **Step 4: Run → pass** — `pnpm test BasicInfoTab` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/world/pages/WorldSettingsPage/tabs/BasicInfoTab.tsx src/features/world/pages/WorldSettingsPage/__tests__/BasicInfoTab.spec.tsx
git commit -m "feat(10.2j): world settings — 3 toggly viditelnosti hodů + test"
```

---

## FÁZE E — FE: per-system kategorie hodů

### Task E1: MapSystemPlugin rollCategories

**Files:**
- Modify: `src/features/world/map-systems/types.ts`
- Modify: `src/features/world/map-systems/plugins.ts`
- Test: `src/features/world/map-systems/registry.spec.ts` (rozšířit existující)

- [ ] **Step 1: Write failing test:**

```typescript
it('matrix/fate mají kategorie skill+initiative+custom', () => {
  expect(getMapSystemPlugin('matrix').rollCategories).toEqual(
    expect.arrayContaining(['skill', 'initiative', 'custom']),
  );
  expect(getMapSystemPlugin('fate').rollCategories).toContain('custom');
});
it('generic má aspoň custom', () => {
  expect(getMapSystemPlugin('neznamy').rollCategories).toContain('custom');
});
```

- [ ] **Step 2: Run → fail** — FAIL.

- [ ] **Step 3: Interface** — do `MapSystemPlugin` přidat:

```typescript
  /**
   * 10.2j — povolené kategorie hodů na mapě. Vždy aspoň 'custom'.
   * FATE/Matrix: skill + initiative + custom.
   */
  rollCategories: import('../tactical-map/types').DiceRollCategory[];
```

- [ ] **Step 4: Plugins** — doplnit do každého pluginu. `genericPlugin`: `rollCategories: ['custom']`. `matrixPlugin` + `fatePlugin`: `rollCategories: ['skill', 'initiative', 'custom']`. Ostatní (drd2/dnd5e/…): `['skill', 'initiative', 'custom']` (sjednoceno; jemnější ladění defer).

- [ ] **Step 5: Run → pass** — PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/world/map-systems/types.ts src/features/world/map-systems/plugins.ts src/features/world/map-systems/registry.spec.ts
git commit -m "feat(10.2j): map-systems rollCategories per systém + test"
```

---

## FÁZE F — FE: orchestrace hodu (roll → op → overlay)

### Task F1: diceMutation v useMapScene

**Files:**
- Modify: `src/features/world/tactical-map/hooks/useMapScene.ts`

- [ ] **Step 1: Přidat mutation** (vzor `effectMutation`):

```typescript
const diceMutation = useMutation({
  mutationFn: ({ sceneId, op }: { sceneId: string; op: MapOperation }) =>
    postMapOperation(sceneId, op),
  onMutate: ({ op }) => {
    if (!worldId || !scene) return { prev: null };
    const prev = queryClient.getQueryData(mapSceneQueryKey(worldId));
    queryClient.setQueryData(mapSceneQueryKey(worldId), applyOperationToScene(scene, op));
    return { prev };
  },
  onError: (err, _vars, ctx) => {
    if (worldId && ctx?.prev) queryClient.setQueryData(mapSceneQueryKey(worldId), ctx.prev);
    toast.error(`Hod selhal: ${parseApiError(err)}`);
  },
});
```
A přidat `rollDice: (op) => diceMutation.mutate(...)` do návratového objektu hooku (zarovnej na to, jak hook vrací ostatní mutace).

- [ ] **Step 2: Commit**

```bash
git add src/features/world/tactical-map/hooks/useMapScene.ts
git commit -m "feat(10.2j): useMapScene.rollDice optimistic mutation"
```

### Task F2: useMapDiceRoll — orchestrace

**Files:**
- Create: `src/features/world/tactical-map/hooks/useMapDiceRoll.ts`
- Test: `src/features/world/tactical-map/hooks/useMapDiceRoll.spec.ts`

Hook spojí: roll engine (6.3) → `MapDiceRoll` záznam → `rollDice` op → lokální overlay
trigger (přes `useDiceRollOverlay`). Vrací `roll(category, dicePayload, opts)`.

- [ ] **Step 1: Write failing test** — `roll('custom', payload)` volá `rollDice` s op `dice.roll` nesoucí správný `byUserId/rollerKind/category` a spustí overlay:

```typescript
it('custom hod → op dice.roll + overlay trigger', () => {
  const rollDice = vi.fn();
  const trigger = vi.fn();
  const { result } = renderHook(() => useMapDiceRoll({
    sceneId: 's1', worldId: 'w1',
    viewer: { userId: 'u1', isPj: false, displayName: 'Tyky' },
    rollDice, triggerOverlay: trigger, getSkin: () => 'core-obsidian',
  }));
  const payload = { type: 'd20', faces: [18], sum: 18, total: 18 } as never;
  result.current.roll({ category: 'custom', dicePayload: payload });
  expect(rollDice).toHaveBeenCalledWith(expect.objectContaining({
    sceneId: 's1',
    op: expect.objectContaining({
      type: 'dice.roll',
      roll: expect.objectContaining({ byUserId: 'u1', rollerKind: 'pc', category: 'custom', dicePayload: payload }),
    }),
  }));
  expect(trigger).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run → fail** — FAIL (modul neexistuje).

- [ ] **Step 3: Implement** — hook generuje `id` (crypto.randomUUID), `rolledAt` (new Date().toISOString()), `rollerKind` (z viewer/tokenu), složí op, zavolá `rollDice`, pak `triggerOverlay(payload, skin, displayName)`. (Overlay se spustí TOMU KDO HÁZÍ vždy — lokálně, ne přes WS.)

- [ ] **Step 4: Run → pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/world/tactical-map/hooks/useMapDiceRoll.ts src/features/world/tactical-map/hooks/useMapDiceRoll.spec.ts
git commit -m "feat(10.2j): useMapDiceRoll orchestrace (roll→op→overlay)"
```

### Task F3: live overlay pro cizí viditelné hody + catch-up guard

**Files:**
- Modify: `src/features/world/tactical-map/TacticalMapView.tsx`
- Modify: `src/features/world/tactical-map/hooks/useMapScene.ts` (onOperation hook → expose last live roll)

Když dorazí cizí `dice.roll` op **live** (ne při catch-up/replay) a `canSeeRoll` → spustit overlay.

- [ ] **Step 1:** V `useMapScene.onOperation` happy-path větvi (seq == expected) detekovat `op.type === 'dice.roll'` a přes callback `onLiveDiceRoll(roll)` notifikovat view. Catch-up/replay větev (gap) **nevolá** `onLiveDiceRoll` → guard proti overlayi starých hodů.

```typescript
// v happy-path větvi po setQueryData:
if (payload.op.type === 'dice.roll') {
  optionsRef.current.onLiveDiceRoll?.(payload.op.roll);
}
```
(Přidat `onLiveDiceRoll?: (roll: MapDiceRoll) => void` do options hooku.)

- [ ] **Step 2:** V `TacticalMapView` předat `onLiveDiceRoll` → pokud `roll.byUserId !== me` (vlastní už spustil F2) a `canSeeRoll(roll, viewer, world.diceVisibility)` → `triggerOverlay(roll.dicePayload, getSkin(...), roll.rollerName)`.

- [ ] **Step 3:** Doplnit guard „jen hody mladší než 10 s" (anti-replay pro jistotu při initial load): `if (Date.now() - new Date(roll.rolledAt).getTime() > 10_000) return;`.

- [ ] **Step 4: Commit**

```bash
git add src/features/world/tactical-map/hooks/useMapScene.ts src/features/world/tactical-map/TacticalMapView.tsx
git commit -m "feat(10.2j): live overlay cizích viditelných hodů + catch-up guard"
```

---

## FÁZE G — FE: UI komponenty (log panel + roll button)

### Task G1: DiceLogPanel + CSS (port vzhledu)

**Files:**
- Create: `src/features/world/tactical-map/components/dice/DiceLogPanel.tsx`
- Create: `src/features/world/tactical-map/components/dice/DiceLogPanel.module.css`
- Test: `src/features/world/tactical-map/components/dice/DiceLogPanel.spec.tsx`

Port legacy `.dice-log-*` vzhledu (glassmorphism, color-coded), ale CSS Modules +
theme proměnné (`--map-*`), scoped pod `[data-theme]` (theme izolace). Filtruje přes
`canSeeRoll` + per-user `clearedBefore` (localStorage `ikr-map-dice-cleared-<sceneId>`).

- [ ] **Step 1: Write failing test:**

```typescript
it('hráč vidí jen viditelné hody (canSeeRoll)', () => {
  const rolls = [mkRoll('pc', 'me'), mkRoll('pj', 'gm'), mkRoll('pc', 'other')];
  render(<DiceLogPanel rolls={rolls} viewer={{ userId: 'me', isPj: false }}
    visibility={{ showPjRolls: false, showNpcBestieRolls: false, showTeammateRolls: true }}
    sceneId="s1" />);
  expect(screen.getAllByTestId('dice-log-entry')).toHaveLength(2); // vlastní + spoluhráč, NE pj
});

it('clear nastaví clearedBefore a schová starší', async () => {
  // render s 2 hody v minulosti → klik ✕ → 0 entries; LS klíč nastaven
});
```

- [ ] **Step 2: Run → fail** — FAIL.

- [ ] **Step 3: Implement** — komponenta: filtr `rolls.filter(r => canSeeRoll(...) && new Date(r.rolledAt) > clearedBefore)`, `.slice(-30).reverse()`, render jméno + faces (color-coded ± dle dicePayload) + total + kategorie chip + čas. Header s ✕ → `setClearedBefore(new Date().toISOString())` + LS persist. Sbalitelný (LS `ikr-map-dice-log-open`). Pozice viz G3.

- [ ] **Step 4: Run → pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/world/tactical-map/components/dice/DiceLogPanel.tsx src/features/world/tactical-map/components/dice/DiceLogPanel.module.css src/features/world/tactical-map/components/dice/DiceLogPanel.spec.tsx
git commit -m "feat(10.2j): DiceLogPanel (port vzhledu, canSeeRoll filtr, per-user clear)"
```

### Task G2: DiceRollButton (vlastní hod)

**Files:**
- Create: `src/features/world/tactical-map/components/dice/DiceRollButton.tsx`

🎲 tlačítko, které otevře 6.3 `DicePickerPopover` (reuse). `onRoll(result)` →
`useMapDiceRoll.roll({ category: 'custom', dicePayload: result.dicePayload })`.

- [ ] **Step 1: Implement** — reuse `DicePickerPopover` s props z průzkumu (`worldDice`,
`worldSlug`, `canManageWorld`, `getSkin`, `onOpenSkinPicker`, `onOpenPoolPrompt`, `onRoll`).
SkinPicker = reuse `SkinPickerPanel` (obsahuje vězení). PoolPrompt = reuse `PoolPromptModal`.

- [ ] **Step 2: Smoke test** — render + klik otevře popover.

- [ ] **Step 3: Commit**

```bash
git add src/features/world/tactical-map/components/dice/DiceRollButton.tsx
git commit -m "feat(10.2j): DiceRollButton — vlastní hod (reuse 6.3 picker + skin + jail)"
```

### Task G3: Mount v TacticalMapView (overlay + log + button)

**Files:**
- Modify: `src/features/world/tactical-map/TacticalMapView.tsx`
- Modify: `src/features/world/tactical-map/TacticalMapView.module.css`

- [ ] **Step 1:** Obalit view do `DiceRollOverlayProvider` (nebo mountnout `DiceRollOverlay`
+ použít `useDiceRollOverlay`) — overlay vrstva nad mapou. Reuse z 6.3.

- [ ] **Step 2:** Mount `<DiceLogPanel>` — pozice **vlevo dole nad PJ panelem**. CSS slot:
PJ má panel `bottom:20px;left:20px;` (výška variabilní) → log dát `bottom: calc(20px + var(--map-pj-panel-height, 0px) + 12px); left: 20px;` NEBO jednodušeji slot `bottom: 360px; left: 20px` s media/fallbackem. U hráče (bez PJ panelu) `bottom: 20px; left: 20px`. Řešit přes třídu `isPj` na slotu.

```tsx
<div className={`${styles.diceLogSlot} ${isPJ ? styles.diceLogSlotPj : ''}`}>
  <DiceLogPanel
    rolls={scene?.diceRolls ?? []}
    viewer={{ userId: currentUser.id, isPj: isPJ }}
    visibility={world?.diceVisibility}
    sceneId={scene?.id ?? ''}
  />
</div>
```

- [ ] **Step 3:** Mount `<DiceRollButton>` — vedle iniciativní lišty nebo jako malý FAB
vlevo dole nad logem (drobné 🎲). Dostupné PJ i hráči.

- [ ] **Step 4:** Napojit `useMapDiceRoll` (getSkin z `useDiceSkinMapping(worldId)`,
`triggerOverlay` z overlay kontextu, `rollDice` z `useMapScene`) + `onLiveDiceRoll`
listener z F3.

- [ ] **Step 5: Commit**

```bash
git add src/features/world/tactical-map/TacticalMapView.tsx src/features/world/tactical-map/TacticalMapView.module.css
git commit -m "feat(10.2j): mount overlay + DiceLogPanel (nad PJ panelem) + roll button"
```

---

## FÁZE H — FE: spouštěče schopnost + iniciativa

### Task H1: Skill hod ze sheet/deník tlačítek

**Files:**
- Modify: token modal DiaryTab / per-system sheet komponenty (dle průzkumu, kde žijí
  skill roll tlačítka — `diary-systems/`).

Existující skill roll tlačítka dnes míří do chatu. Na mapě (kontext token modalu na mapě)
je přesměrovat na `useMapDiceRoll.roll({ category: 'skill', dicePayload, tokenId })`.

- [ ] **Step 1:** Najít, jak skill tlačítko vytváří `dicePayload` (reuse) a kde se
rozhoduje cíl (chat vs mapa). Zavést prop/kontext `onMapRoll?` — když je na mapě, použít ho.

- [ ] **Step 2:** Smoke/unit test že na mapě klik volá map roll s `category:'skill'` + `tokenId`.

- [ ] **Step 3: Commit** — `feat(10.2j): skill hod ze sheetů → map log (category skill)`.

### Task H2: Iniciativa hod z lišty

**Files:**
- Modify: `src/features/world/tactical-map/components/initiative/InitiativeBar.tsx` (+ InitiativeBarItem)

10.2f už má 🎲 „hod iniciativy". Rozšířit: vedle `token.update`+`reorder` vyslat i
`useMapDiceRoll.roll({ category: 'initiative', dicePayload, tokenId })` → vizuální hod + log.

- [ ] **Step 1:** Najít existující init roll handler, doplnit map roll volání.

- [ ] **Step 2:** Test že init hod zapíše `dice.roll` op s `category:'initiative'`.

- [ ] **Step 3: Commit** — `feat(10.2j): iniciativa hod → vizuální + map log (category initiative)`.

---

## FÁZE I — Dokončení

### Task I1: Roadmapa + spec done marker

**Files:**
- Modify: `docs/roadmap-fe.md` (řádek 1762 — odebrat „lazy-load three", označit `[x]`)
- Modify: `docs/roadmap-fe.md` (řádek 1781 — kostky napojení už hotové)

- [ ] **Step 1:** Přepsat 10.2j řádek: `[x] 10.2j — Hod kostkou: reuse 6.3 CSS dice
(žádný three.js), dice.roll op (persistovaný, cap 50), world-level visibility, log nad
PJ panelem, per-user clear, skill/init/custom spouštěče.` + datum.

- [ ] **Step 2: Commit** — `docs(10.2j): roadmapa done marker + odebrán three.js`.

### Task I2: mobil-desktop audit

- [ ] **Step 1:** Spustit skill `mobil-desktop` na: DiceLogPanel, DiceRollButton,
DicePickerPopover (na mapě), world settings toggly. Opravit nálezy.
- [ ] **Step 2: Commit** oprav.

### Task I3: napoveda

- [ ] **Step 1:** Spustit skill `napoveda` — doplnit hod na mapě + `World.diceVisibility`
nastavení do `/ikaros/napoveda`.
- [ ] **Step 2: Commit**.

### Task I4: FATE plus↔mínus bug (odložený dluh)

**Files:** `src/features/world/chat/dice/` (viz `docs/dluhy.md` [otevřeno 2026-05-31]).

- [ ] **Step 1: Repro test** — hod fate s plusem → ověř, že render plus tváře používá
`facePlusImg` (ne minus). Najít záměnu v `diceSkins.ts` / `diceTargets.ts` / `FateSkinModel`.
- [ ] **Step 2: Fix** záměny.
- [ ] **Step 3:** Vizuální ověření v chatu + na mapě.
- [ ] **Step 4: Commit** — `fix(10.2j): FATE plus se zobrazoval jako mínus` + přesun dluhu do „Vyřešené".

### Task I5: Full test sweep

- [ ] **Step 1:** `cd backend && pnpm test && pnpm typecheck && pnpm lint:check`.
- [ ] **Step 2:** FE: `pnpm test && pnpm typecheck`.
- [ ] **Step 3:** Ověřit, že žádné pre-existující TS/lint chyby nepřibyly (memory
`feedback_preexist_debt_owned`).

---

## Self-review (autor plánu)

**Spec coverage:**
- j-1 (datová vrstva, cap 50) → B1, B3, C1, C2 ✓
- j-2 (spouštěče skill/init/custom) → F2, G2, H1, H2 ✓
- j-3 (log panel, per-user clear, pozice nad PJ panelem) → G1, G3 ✓
- j-4 (world-level visibility, řídí overlay i log) → A1, A2, D1, D2, C3 ✓
- j-5 (overlay reuse, catch-up guard) → F2, F3, G3 ✓
- j-6 (set kostek + vězení = reuse SkinPickerPanel) → G2 ✓ (legacy jail tray vynechán — viz Odchylky)
- j-7 (WS dice.roll persistovaný) → B2, B3 ✓
- j-8 (per-system kategorie) → E1 ✓
- three.js drop + roadmapa → I1 ✓
- mobil-desktop, napoveda, FATE bug → I2, I3, I4 ✓

**Type konzistence:** `MapDiceRoll` (C1) sjednocené napříč BE DTO (B2), patcher (C2),
helper (C3), hook (F2), panel (G1). `WorldDiceVisibility` (A1/D1) shodné BE↔FE.
`canSeeRoll(roll, viewer, visibility)` signatura shodná C3 ↔ G1/F3.

**Placeholdery:** kde plán říká „zarovnej na reálný spec/cesta dle průzkumu", jde o
nutné dohledání v existujícím kódu (názvy mocků, přesná cesta hooku) — engineer to
najde grepem; ne vágní požadavek na chování.

**Otevřené k ověření při implementaci (ne placeholder, prober s uživatelem pokud blokuje):**
- Přesná cesta `useUpdateWorld.ts` a kde žije `basicInfoSchema` (D1/D2).
- Kde přesně žijí skill roll tlačítka v `diary-systems/` (H1) a jak dnes routují do chatu.
- Výška PJ panelu pro CSS slot logu (G3) — pokud variabilní, řešit `--map-pj-panel-height` var nebo flex anchor.
