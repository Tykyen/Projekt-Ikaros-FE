# Plan 10.2c-edit-9b + 9c — Token modal: deník/poznámky inline + bestie statblok + per-hráč view

**Spec:** rozšíření [`spec-10.2e.md`](spec-10.2e.md) §TokenStatbarModal
**Status:** ✅ schváleno uživatelem 2026-05-28 („dotáhni to")
**Velikost:** **M** (4 nové sub-komponenty, 2 wrappery, 1 přepsaný hlavní modal, ~7 testů)
**Žádná BE změna** — `useUpdateCharacterDiary` + `useUpdateCharacterNotes` už existují (8.1 subdoc API). Tokenův `characterSlug` stačí jako join.

---

## 1 — Motivace

Aktuální `TokenStatbarModal` má jen tab Staty. Old Matrix `NpcDiary` měl statbloky + Poznámky + per-system sheet. Pravidlo uživatele:
> Postava má deník, NPC má deník, Bestie má svoje staty.

Plus pravidlo: hráč na cizí token vidí jen veřejné info (jméno, zranění); deník/poznámky cizích postav je PJ-only doména.

---

## 2 — Pořadí kroků (logická členění, jeden git commit)

| # | Co | Soubory |
|---|---|---|
| **C1** | Util `tokenViewMode(token, currentUserId, isPJ, mySlugs)` → `'pj' \| 'owner' \| 'limited'` — sjednocená derivace per-token view permission | `utils/tokenViewMode.ts` + test |
| **C2** | `TokenDiaryTab` wrapper kolem `DiaryTab` — embedduje s `mode='edit'`, lazy load Workspace's `WorldContext`, sticky bar inline | `components/tokens/TokenDiaryTab.tsx` |
| **C3** | `TokenNotesTab` wrapper kolem `NotesTab` — autosave funguje out-of-the-box | `components/tokens/TokenNotesTab.tsx` |
| **C4** | `BestieStatblock` komponent — read-only `EntityStatbar` (per-system schema) + `bestie.notes` field pod (PJ only). Lookup bestie z `bestiarQueryKey` cache | `components/tokens/BestieStatblock.tsx` + CSS |
| **C5** | `TokenStatbarModal` přepsán: tabs Staty/Deník/Poznámky (PC/NPC), jen Staty (Bestie). Per-hráč: `tokenViewMode === 'limited'` → bez tabs, jen read-only summary (jméno + zranění) | `TokenStatbarModal.tsx` + CSS |
| **C6** | Testy: tokenViewMode 6 scénářů, modal render varianty (PC PJ / PC vlastní hráč / PC cizí hráč / NPC PJ / NPC hráč / Bestie PJ / Bestie hráč) | `__tests__/` |
| **C7** | Spec + memory + nápověda | `spec-10.2e.md`, MEMORY.md, HelpPage |

---

## 3 — Klíčové detaily

### 3.1 `tokenViewMode` util

```ts
// utils/tokenViewMode.ts
import type { MapToken } from '../types';

export type TokenViewMode = 'pj' | 'owner' | 'limited';

export function tokenViewMode(
  token: MapToken,
  currentUserId: string | null,
  isPJ: boolean,
  mySlugs: string[],
): TokenViewMode {
  if (isPJ) return 'pj';
  if (!currentUserId) return 'limited';
  // Vlastní PC = token.characterSlug v mých slugs (z useMyCharacterSlugs)
  if (!token.isNpc && mySlugs.includes(token.characterSlug)) return 'owner';
  return 'limited';
}
```

📚 **Co to je:** Existujicí `useTokenPermissions` vrací jen `canDrag` predicate. Pro modal potřebuju tři rozlišitelné módy (PJ vidí vše, vlastník vidí vše svého, cizí jen veřejné). Nový util sjednocuje, modal podle něj rendruje tabs.

### 3.2 `TokenDiaryTab` wrapper

```tsx
// components/tokens/TokenDiaryTab.tsx
import { useState } from 'react';
import { DiaryTab } from '@/features/world/pages/CharacterDetailPage/components/DiaryTab';
import { useUnsavedGuard } from '...';

interface Props {
  characterSlug: string;
  canEdit: boolean;
  onDirtyChange: (dirty: boolean) => void;
}

export function TokenDiaryTab({ characterSlug, canEdit, onDirtyChange }: Props) {
  return (
    <div className={styles.embeddedDiary}>
      <DiaryTab
        slug={characterSlug}
        mode={canEdit ? 'edit' : 'view'}
        onExitEdit={() => {}}   /* modal close = exit, no in-tab toggle */
        onDirtyChange={onDirtyChange}
      />
    </div>
  );
}
```

⚠️ **Pozor — DiaryTab dependency na WorldContext:** `useWorldContext()` musí být v provideru. Token modal je v `TacticalMapView` který je uvnitř `WorldLayout` (= context dostupný). ✓

⚠️ **Pozor — sticky bar:** `DiaryTab` v `mode='edit'` renderuje `<EditStickyBar>` (sticky bottom). Uvnitř modálu se to bude jevit jako sticky bottom modal body. Akceptovatelné, nepřepisuju jejich UX.

### 3.3 `BestieStatblock`

```tsx
// components/tokens/BestieStatblock.tsx
import { EntityStatbar } from '../schema-form/EntityStatbar';
import { EntitySchemaForm } from '../schema-form/EntitySchemaForm';

interface Props {
  token: MapToken;        // má token.templateId = bestie.id
  systemId: string;
  canEdit: boolean;       // PJ může editovat HP/zranění; hráč read-only
  bestieNotes?: string;   // bestie.notes z queryClient lookup, jen PJ
}

export function BestieStatblock({ token, systemId, canEdit, bestieNotes }: Props) {
  const schema = systemEntitySchemaRegistry.get(systemId, 'token');
  const stats = token.systemStats ?? { /* BC fallback */ };
  
  return (
    <div className={styles.bestieView}>
      {canEdit
        ? <EntitySchemaForm schema={schema} value={stats} onChange={...} />
        : <EntityStatbar schema={schema} value={stats} />
      }
      {bestieNotes && (
        <section className={styles.bestieNotes}>
          <h4>📝 Poznámky k bestii</h4>
          <p>{bestieNotes}</p>
        </section>
      )}
    </div>
  );
}
```

Bestie nemá deník (project memory [[project-npc-vs-bestie]]). Statblok je read-only template snapshot — token drží `systemStats` z bestie.

### 3.4 `TokenStatbarModal` přepsaný

Stavový stroj:

```ts
type ModalVariant = 
  | { kind: 'bestie'; canEdit: boolean }
  | { kind: 'character'; viewMode: 'pj' | 'owner' | 'limited' };

const variant: ModalVariant = useMemo(() => {
  if (tokenIsBestie(token)) return { kind: 'bestie', canEdit: isPJ };
  return { kind: 'character', viewMode: tokenViewMode(token, currentUserId, isPJ, mySlugs) };
}, [token, currentUserId, isPJ, mySlugs]);
```

Render:

```tsx
<Modal title={displayName} size="lg" footer={...}>
  <Header /> {/* avatar + name + status badge — beze změny */}
  
  {variant.kind === 'bestie' && (
    <BestieStatblock token={token} systemId={...} canEdit={variant.canEdit} bestieNotes={...} />
  )}
  
  {variant.kind === 'character' && variant.viewMode === 'limited' && (
    <LimitedTokenView token={token} schema={schema} />
    /* jen Staty read-only s subset polí (HP, zranění); žádné tabs */
  )}
  
  {variant.kind === 'character' && variant.viewMode !== 'limited' && (
    <Tabs>
      <Tab id="stats" label="Staty">
        <EntitySchemaForm schema={schema} value={stats} onChange={setStats} disabled={false} />
      </Tab>
      <Tab id="diary" label="Deník">
        <TokenDiaryTab characterSlug={token.characterSlug} canEdit={true} onDirtyChange={setDirty} />
      </Tab>
      <Tab id="notes" label="Poznámky">
        <TokenNotesTab characterSlug={token.characterSlug} canEdit={variant.viewMode === 'pj'} />
        {/* Poznámky = `character.notes` subdoc, vidí PJ vždy + vlastník svoje */}
      </Tab>
    </Tabs>
  )}
</Modal>
```

### 3.5 Per-hráč view restrictions

| Variant | Token kind | Co vidí | Co edituje |
|---|---|---|---|
| `pj` | PC/NPC | tabs Staty + Deník + Poznámky (vše) | vše |
| `pj` | Bestie | EntitySchemaForm + bestie.notes read-only | jen staty (HP, zranění) |
| `owner` | vlastní PC | tabs Staty + Deník + Poznámky | vše (HP, deník vlastní, poznámky vlastní) |
| `limited` | cizí PC/NPC | LimitedTokenView (jméno, status badge, HP %, zranění) | nic |
| `limited` | Bestie | EntityStatbar read-only (žádné notes) | nic |

⚠️ **Pozor — BE auth:** Tabs samy o sobě nejsou bezpečnostní hranice — BE už autorizuje `PATCH /characters/:slug/diary` přes `CharactersController` (PJ + vlastník). Hráč na cizí token, kdyby se dostal do tab Deník bypassem, BE odpoví 403. Tabs UI = UX gating, BE = security gating. ✓

### 3.6 Mazat token v limited view

Hráč nemá `Smazat token` tlačítko — `canDelete = isPJ`. ✓ (zachováno z existing kódu)

---

## 4 — Tests plan

| Soubor | Co pokrývá |
|---|---|
| `__tests__/tokenViewMode.test.ts` | 6 scénářů: PJ libovolný=pj, hráč vlastní PC=owner, hráč cizí PC=limited, hráč NPC=limited, hráč bestie=limited, anon=limited |
| `__tests__/TokenStatbarModal.spec.tsx` | Render variant: bestie PJ (statblok + notes), bestie hráč (statbar bez notes), PC PJ (3 tabs), PC vlastník (3 tabs), PC cizí hráč (limited view), NPC PJ (3 tabs), NPC hráč (limited) |
| `__tests__/BestieStatblock.spec.tsx` | bestie.notes shown jen pro PJ (canEdit=true); read-only EntityStatbar pro hráče |

---

## 5 — Real-time chování

- Token staty (HP) přes `token.update` op → existing pipeline → WS broadcast (10.2e)
- Deník postavy přes `PATCH /diary` → invalidate `useCharacterDiary` query → ostatní v tom samém modalu uvidí po refetch (žádný WS pro deníky v MVP, defer 10.2i)
- Token modal jednoho usera = local state; ostatní useři otevřou svůj modal nezávisle

⚠️ **Známé omezení:** PJ-A edituje deník postavy ve svém token modalu, PJ-B má otevřený stejný modal → PJ-B neuvidí změny okamžitě (žádný WS pro `/characters/:slug/diary`). Pro MVP akceptovatelné, deník není „real-time" doména. Defer do 10.2i.

---

## 6 — Risk, rollback

**Risk:** Střední.
- Embedding `DiaryTab`/`NotesTab` riziko: jejich layout je navržen pro fullscreen tab, ne pro modal — možná layout glitches (sticky bar inside modal, header overlap). Mitigace: vlastní CSS container `.embeddedDiary` s overflow scroll a fixed max-height.
- WorldContext dependency v subkomponentě DiaryTab → token modal mountovat jen pokud `WorldContext` dostupný (vždy je v TacticalMapView). ✓

**Rollback:** Revert PR — modal se vrátí na single-tab Staty view.

---

## 7 — Out of scope

- WS broadcast pro `character.diary.update` (defer 10.2i)
- Bidirectional sync token ↔ character (existing — token.update → character sync na BE pro `systemStats`, ale ne pro `diary.customData`)
- Edit bestie šablony z tokenu (PJ může editovat v Bestiar page, ne v token modal — bestie token = instance snapshot, edit šablony tady by porušil snapshot semantics)
