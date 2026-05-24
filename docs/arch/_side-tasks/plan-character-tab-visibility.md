# Plán — Konfigurovatelná viditelnost tabů Postavy / NPC

**Spec:** [spec-character-tab-visibility.md](./spec-character-tab-visibility.md)
**Status:** ✅ IMPLEMENTOVÁNO (2026-05-24)
**Výsledek:** FE 1146 → 1162 testů (helper + tab spec), BE 91 testů (incl. +6 nových sanitace testů), tsc ✓, lint OK na novém kódu.
**Velikost:** ~10 souborů FE (~350 ř.) + ~3 soubory BE (~80 ř.)
**Datum:** 2026-05-24

---

## 1. Pořadí kroků

```
1. BE rozšíření (datový model + DTO + sanitace)        ← začíná, FE bez něj nepojede
2. Sdílené typy FE (CharacterTabId, helper getVisibleTabs)
3. FE mutation hook rozšíření (payload type)
4. FE nová záložka „Postavy & NPC" (matrix UI)
5. FE registrace záložky v WorldSettingsPage
6. FE filtrace v PostavaLayout (auto-switch edge case)
7. Testy (unit + integration)
8. mobil-desktop audit
9. Skill napoveda — aktualizace nápovědy
10. Update roadmapy + uzavření spec status na IMPLEMENTED
```

Krok 1–3 nezávislé na 4–6 → můžou jet paralelně, ale FE potřebuje typy z 2 než spustí 4.

---

## 2. BE změny

### 2.1 `world-settings.schema.ts` (entita)

Cesta: `Projekt-ikaros/backend/src/modules/worlds/schemas/world-settings.schema.ts` (přesný název potvrdím při implementaci, pravděpodobné dle existující struktury).

Přidat pole:

```ts
@Prop({
  type: {
    PostavaHrace: { type: [String], default: undefined },
    NPC:          { type: [String], default: undefined },
  },
  _id: false,
  required: false,
})
characterTabVisibility?: {
  PostavaHrace?: string[];
  NPC?: string[];
};
```

⚠️ **Důležité — žádná migrace:** Default `undefined` → existující dokumenty zůstanou beze změny. FE helper `getVisibleTabs` při `undefined` vrátí `CHARACTER_TAB_IDS` = vše. Žádný backfill skript.

### 2.2 `update-world-settings.dto.ts`

```ts
import { IsArray, IsIn, IsOptional, ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const TAB_WHITELIST = ['soukrome','denik','finance','vybava','kalendar','poznamky'] as const;

class CharacterTabVisibilityDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsIn(TAB_WHITELIST, { each: true })
  PostavaHrace?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsIn(TAB_WHITELIST, { each: true })
  NPC?: string[];
}

export class UpdateWorldSettingsDto {
  // … existing
  @IsOptional()
  @ValidateNested()
  @Type(() => CharacterTabVisibilityDto)
  characterTabVisibility?: CharacterTabVisibilityDto;
}
```

**Sanitace v service** (před save):
- Dedup: `Array.from(new Set(list))`
- Cap na 6: `list.slice(0, 6)`
- Drop neznámých: filter přes `TAB_WHITELIST` (mimo `@IsIn` redundantní bezpečnost po update)

### 2.3 Service `worlds.service.ts` (nebo `world-settings.service.ts`)

V `updateSettings(worldId, dto)`:
- Pokud `dto.characterTabVisibility` přítomné → sanituj per klíč (dedup + filter + slice)
- `null` nebo neposkytnuté → nech existující hodnotu beze změny (PATCH semantika)
- **Reset na výchozí** = klient pošle `characterTabVisibility: { PostavaHrace: [...všech 6], NPC: [...všech 6] }`, BE to uloží beze změny. Není potřeba speciální reset endpoint.

**Guard:** Existující `canAdminWorld` (PJ+) na `PUT /worlds/:id/settings` zůstává beze změny. Žádný nový guard.

### 2.4 Testy BE

- `world-settings.service.spec.ts`: dedup, cap, whitelist drop, undefined-keys preserve old
- `world-settings.controller.spec.ts`: 400 při neznámém tab ID (validation pipe), 403 pro Korektor- (PomocnyPJ+ guard)
- ⚠️ Před commitem: `npx prettier --write` (viz [feedback_be_precommit_prettier](../../../../../C:/Users/arafo/.claude/projects/c--Matrix-ProjektIkaros-Projekt-ikaros-FE/memory/feedback_be_precommit_prettier.md))

---

## 3. FE — sdílené typy a helper

### 3.1 `src/shared/types/index.ts`

Po `AkjType` (cca ř. 422):

```ts
/** Side-task character-tab-visibility — ID tabů na PostavaLayout, kromě „profil". */
export type CharacterTabId =
  | 'soukrome' | 'denik' | 'finance' | 'vybava' | 'kalendar' | 'poznamky';

export const CHARACTER_TAB_IDS: readonly CharacterTabId[] = [
  'soukrome', 'denik', 'finance', 'vybava', 'kalendar', 'poznamky',
] as const;

export interface CharacterTabVisibility {
  PostavaHrace: CharacterTabId[];
  NPC: CharacterTabId[];
}
```

V `WorldSettings` (ř. 428) přidat:

```ts
characterTabVisibility?: CharacterTabVisibility;
```

### 3.2 `src/features/world/lib/characterTabVisibility.ts` (nový soubor)

```ts
import type { WorldSettings, CharacterTabId } from '@/shared/types';
import { CHARACTER_TAB_IDS } from '@/shared/types';

const PC_TYPE = 'Postava hráče';
const NPC_TYPE = 'NPC';

export function getVisibleTabs(
  pageType: string,
  settings: WorldSettings | undefined,
): Set<CharacterTabId> {
  const map = settings?.characterTabVisibility;
  if (!map) return new Set(CHARACTER_TAB_IDS);
  const key = pageType === PC_TYPE ? 'PostavaHrace' : pageType === NPC_TYPE ? 'NPC' : null;
  if (!key) return new Set(CHARACTER_TAB_IDS); // jiný typ Page (Lokace…) — bez filtrace
  const list = map[key];
  return new Set(list ?? CHARACTER_TAB_IDS);
}

export function isAllVisible(list: CharacterTabId[] | undefined): boolean {
  if (!list) return true;
  return CHARACTER_TAB_IDS.every((id) => list.includes(id));
}
```

Vystavit přes index.ts featury.

---

## 4. FE — rozšíření mutation hook

`src/features/world/api/useUpdateWorldSettings.ts`:

```ts
export interface UpdateWorldSettingsInput {
  customGroups?: string[];
  groupColors?: Record<string, string>;
  characterTabVisibility?: CharacterTabVisibility;  // ← přidat
}
```

Import `CharacterTabVisibility` z `@/shared/types`. Žádná další změna v hook těla — `api.put` payload je passthrough.

---

## 5. FE — nová záložka `CharacterTabsVisibilityTab.tsx`

### 5.1 Soubor

Cesta: `src/features/world/pages/WorldSettingsPage/tabs/CharacterTabsVisibilityTab.tsx`

### 5.2 Komponenta — kontrakt

```ts
export default function CharacterTabsVisibilityTab(): JSX.Element
```

**Závislosti:**
- `useWorldContext()` → `worldId`
- `useWorldSettings(worldId)` → načtení (cache z 5.3)
- `useUpdateWorldSettings(worldId)` → save
- `SettingsPanel` (wrapper s heading + popisem — vzor z `AkjTab`)
- `Button`, `Spinner` z `@/shared/ui`
- `toast` ze `sonner`

**Stavy:**
- `local: CharacterTabVisibility` — copy ze settings, mění se klikáním
- `dirty: boolean` — derived (deep compare s `settings.characterTabVisibility ?? default`)
- `loading` (settings query) / `saving` (mutation)

**Render:**
- Heading + popis (3 věty)
- Tabulka 2×7 (PC řádek, NPC řádek; sloupce: Profil[disabled] + 6 toggle)
- Footer: `[Resetovat na výchozí]` (secondary) `[Uložit změny]` (primary, disabled if !dirty)

**Action handlery:**
- `toggle(typ, tabId)` → mutuje local state
- `reset()` → local = `{ PostavaHrace: [...all], NPC: [...all] }`
- `save()` → `mutation.mutate({ characterTabVisibility: local }, { onSuccess: toast.success, onError: toast.error })`

### 5.3 Mobil

Breakpoint ≤ 768px (viz base.md): místo tabulky vykresli **dvě sekce pod sebou**:

```
┌─ Postavy hráčů ──────────────┐
│ ☑ Profil  (vždy)             │
│ ☑ Soukromé                   │
│ ☑ Deník                      │
│ ... 6 řádků                  │
└──────────────────────────────┘

┌─ NPC ────────────────────────┐
│ ☑ Profil  (vždy)             │
│ ...                          │
└──────────────────────────────┘
```

Implementace přes CSS module — `display: grid` (desktop) / `display: flex; flex-direction: column` (mobil) přes media query. Žádný `useMediaQuery` hook potřeba.

### 5.4 CSS

Nový soubor: `CharacterTabsVisibilityTab.module.css` (~80 ř.).
- Grid: `grid-template-columns: 140px repeat(7, 1fr)` na desktop
- Disabled checkbox (Profil): opacity 0.5, cursor not-allowed, subtext „vždy"
- Hover row highlight (jemný)

---

## 6. Registrace v `WorldSettingsPage.tsx`

V `TABS` array, mezi `'akj'` (PomocnyPJ+) a `'sablony'` (Korektor+):

```ts
const CharacterTabsVisibilityTab = lazy(
  () => import('./tabs/CharacterTabsVisibilityTab'),
);

// v TABS array:
{
  id: 'postavy-npc',
  label: 'Postavy & NPC',
  icon: <UserCog size={18} />,  // import z lucide-react
  minRole: WorldRole.PJ,
  render: () => <CharacterTabsVisibilityTab />,
},
```

Pořadí v `TABS`: `akj → **postavy-npc** → sablony → vzhled` (mezi AKJ a Šablony — spec §10.2).

---

## 7. Filtrace v `PostavaLayout.tsx`

### 7.1 Změny v souboru `src/features/world/pages/PageViewer/layouts/PostavaLayout.tsx`

**Importy přidat:**
```ts
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { getVisibleTabs } from '@/features/world/lib/characterTabVisibility';
```

**V komponentě (po načtení `character`):**
```ts
const { data: settings } = useWorldSettings(worldId);
const visibleTabs = useMemo(
  () => getVisibleTabs(page.type, settings),
  [page.type, settings],
);
```

**V `tabs: TabItem[]` (řádky 128–152):**
- `Profil` — vždy
- `Soukromé` — `canSeePrivate && visibleTabs.has('soukrome')`
- 5 subdoc tabů — `character && canSeePrivate && visibleTabs.has(tabId)`

**Auto-switch (edge case 7.3 ve spec):**
```ts
useEffect(() => {
  if (activeTab !== 'profil' && !visibleTabs.has(activeTab as CharacterTabId)) {
    setActiveTab('profil');
    setEditMode(false);
  }
}, [visibleTabs, activeTab]);
```

⚠️ **Pozor:** Auto-switch musí proběhnout **až po validním načtení settings** (nehlavně `data` nikoli `isLoading`), jinak při prvním renderu (settings ještě nepřišly → `getVisibleTabs` vrátí default = vše) by se nic nepřepínalo — ale to je správně. Edge je: PJ schová tab → user už je na něm → další refresh ho přesune. OK.

**V render-conditions (řádky 178–229):**
- Přidat guard `visibleTabs.has(tabId)` jako AND s existující conditions — pro jistotu (kdyby auto-switch nestihl).

### 7.2 Test edge case

- Tab je v `tabs[]` jen když má visibility → user nedostane prázdný content area
- Tab byl viditelný, PJ ho schoval → useEffect přepne na Profil
- Settings ještě nenačtené (race) → default = vše viditelné, žádná blikací změna

---

## 8. Testy

### 8.1 Unit

- `characterTabVisibility.spec.ts`:
  - default (undefined settings) → all
  - default (undefined map) → all
  - PC list = `['denik']` → Set jen s denik
  - NPC list = `[]` → prázdný Set
  - jiný page.type (Lokace) → all (no-op)
  - `isAllVisible` (helper pro UI dirty detection)

- `CharacterTabsVisibilityTab.spec.tsx`:
  - Render bez settings → všechny checkboxy zaškrtnuté (default)
  - Klik na checkbox → dirty true, Uložit povolen
  - Reset → vrátí všech 12 checkboxů na zaškrtnuto
  - Save → volá mutation s celým objektem
  - Error → toast.error

### 8.2 Integration

- `PostavaLayout.spec.tsx` (rozšířit existující nebo nový):
  - Settings s NPC `['kalendar']` → render NPC page, vidět jen Profil + Kalendář
  - Settings s PC vše → render PC, vidět všech 7 tabů (Profil + 6)
  - Schovat aktivní tab → auto-switch na Profil

---

## 9. Závěr — sweep

- [ ] `lint`, `tsc`, `build`, `test:run` zelené (FE)
- [ ] BE testy zelené, `prettier --write` před commitem
- [ ] Skill `mobil-desktop` audit nové záložky
- [ ] Skill `napoveda` — doplnit do nápovědy (sekce „Nastavení světa" / „Postavy")
- [ ] Spec status na `IMPLEMENTED` + datum
- [ ] Plán: doplnit „implementováno YYYY-MM-DD"
- [ ] **Commit přímo na main** (viz [feedback_work_on_main](../../../../../C:/Users/arafo/.claude/projects/c--Matrix-ProjektIkaros-Projekt-ikaros-FE/memory/feedback_work_on_main.md)), zpráva: `feat(side-task): konfigurovatelná viditelnost tabů Postavy/NPC v Nastavení světa`

---

## 10. Odhad rozsahu

| Vrstva | Soubory | Řádky |
|---|---|---|
| BE schema + DTO + service + tests | 3–4 | ~80 |
| FE typy + helper | 2 | ~40 |
| FE mutation hook update | 1 | ~3 |
| FE nová záložka + CSS | 2 | ~180 |
| FE WorldSettingsPage registrace | 1 | ~10 |
| FE PostavaLayout filtrace | 1 | ~25 |
| FE testy | 2–3 | ~120 |
| **Celkem** | **~12–14** | **~460** |

---

## 11. Rizika

1. **`useWorldSettings` cache vs live update** — když PJ uloží změnu, hook query invalidace v `useUpdateWorldSettings.onSuccess` zařídí refetch. PostavaLayout dostane novou hodnotu přes stejný query klíč → auto-switch zafunguje. ✅
2. **BE schema migrace** — žádná. `undefined` pole je validní Mongo stav. ✅
3. **Guard mismatch** — vyřešeno: feature je PJ+ (struktura světa), stávající `canAdminWorld` se použije beze změny. ✅

---

## 12. Schváleno → kód

Po posledních úpravách (PJ+ guard, vlastník PC filtrován taky) je plán hotový. Pořadí implementace:

1. BE: schema + DTO + service sanitace + testy
2. FE: typy v `shared/types`
3. FE: helper `characterTabVisibility.ts` + testy
4. FE: rozšíření `useUpdateWorldSettings` payload typu
5. FE: nová záložka `CharacterTabsVisibilityTab` + CSS + test
6. FE: registrace v `WorldSettingsPage`
7. FE: filtrace v `PostavaLayout` + auto-switch + test
8. Sweep: lint, tsc, build, test (FE) + prettier --write + testy (BE)
9. `mobil-desktop` audit + `napoveda` skill
10. Spec/plán → IMPLEMENTED, commit na main
