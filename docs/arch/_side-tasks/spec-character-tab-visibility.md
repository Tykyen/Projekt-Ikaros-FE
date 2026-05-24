# Side-task — Konfigurovatelná viditelnost tabů Postavy / NPC

**Status:** ✅ IMPLEMENTOVÁNO (2026-05-24)
**Rozsah:** FE (rozšíření `WorldSettingsPage` o novou záložku + filtrace v `PostavaLayout`) + BE (rozšíření `WorldSettings` o pole `characterTabVisibility` + DTO/sanitace)
**Velikost:** odhad ~8 souborů / ~350 ř. FE, ~3 soubory BE
**Autor:** PJ + Claude
**Datum:** 2026-05-24
**Souvisí:** [spec-9.1.md](../phase-9/spec-9.1.md) (Page+Character unifikace — PostavaLayout 6 tabů), [spec-5.3.md](../phase-5/spec-5.3.md) (Nastavení světa — tabová stránka), `WorldSettings` v `src/shared/types/index.ts:428`

---

## 1. Cíl

PJ může v **Nastavení světa** určit, které z taby `Soukromé / Deník / Finance / Výbava / Kalendář / Poznámky` jsou viditelné u stránek typu **Postava hráče** a **NPC**. Konfigurace per typ, ne per stránka. **Profil** je vždy povinný (nelze skrýt).

Schování je čistě UX vrstva — data subdokumentů (Diary/Finance/Inventory/Calendar/Notes) se v MongoDB nemažou ani neukrývají, takže zapnutí tabu zpět **okamžitě obnoví původní obsah**.

---

## 2. Motivace

`PostavaLayout` dnes ([PostavaLayout.tsx:128-152](../../../src/features/world/pages/PageViewer/layouts/PostavaLayout.tsx#L128-L152)) renderuje **stejných 6 tabů pro PC i NPC bez ohledu na obsah**. PJ, který přepne hráčskou postavu na NPC, dostane plnou sadu tabů včetně Soukromé a Deník, i když je pro dané NPC nedává smysl. PJ chce možnost taby per typ skrýt a vrátit.

Zvolená cesta: **symetrický default (PC = NPC = vše zapnuto)** + override v Nastavení. Důvody:
- nepřekvapí existující světy (zpětná kompatibilita)
- NPC i PC mohou mít legitimně všechny taby (lichvář-NPC potřebuje Finance, drak má Výbavu, sledovaný NPC má Deník)
- PJ rozhoduje per svět, ne autor platformy globálně

### 2.1 Vztah k existujícím mechanismům viditelnosti

| Mechanismus | Co řeší | Aplikace |
|---|---|---|
| **AKJ úrovně** | Veřejnost vs. utajení celé Page / bloku | Korektor- mohou nevidět ani existenci stránky |
| **`canSeePrivate` (role guard, [PostavaLayout.tsx:60](../../../src/features/world/pages/PageViewer/layouts/PostavaLayout.tsx#L60))** | Subdoc taby (Soukromé/Deník/…) | Hráč/Korektor → jen Profil; PomocnyPJ+ / vlastník PC → všechny taby |
| **Tato feature** | UI struktura světa | Schová taby z pohledu **těch, kdo by je jinak viděli** (PJ, PomocnyPJ, vlastník PC) |

**Důležité:** Tato feature **s hráči/Korektorem nehne** — ti vidí jen Profil díky existujícímu role guardu. Filtruje pohled rolí, které by jinak měly přístup ke všem 6 subdoc tabům. Smysl: konzistentní svět („svět bez peněz" → Finance schované **i** vlastníkovi PC).

---

## 3. Audit současného stavu

### 3.1 FE

- **`PostavaLayout`** ([PostavaLayout.tsx:128-152](../../../src/features/world/pages/PageViewer/layouts/PostavaLayout.tsx#L128-L152)) staticky vrací 6 tabů. Žádná filtrace per `page.type`. Visibility řeší jen `canSeePrivate` (role) a `character` (existuje subdoc kontejner).
- **`WorldSettingsPage`** ([src/features/world/pages/WorldSettingsPage/](../../../src/features/world/pages/WorldSettingsPage/)) — tabová stránka, 6 existujících tabů (Základní info, Přístup, Členové, AKJ úrovně, Vzhled, Členství). Vzor pro novou záložku: [`AccessModeTab.tsx`](../../../src/features/world/pages/WorldSettingsPage/tabs/AccessModeTab.tsx).
- **`WorldSettings` interface** ([src/shared/types/index.ts:428](../../../src/shared/types/index.ts#L428)) — pole `hiddenNavItems`, `customGroups`, `groupColors`, `akjTypes`, `hideDefaultWeather`. Vhodné místo pro rozšíření.
- **Mutation hook** pro `PUT /worlds/:worldId/settings` už existuje (používá ho MembersTab + AKJTab) — stačí přidat klíč do payloadu.

### 3.2 BE

- **`WorldSettings` entita** + `UpdateWorldSettingsDto` (NestJS modul `worlds`). Endpoint `PUT /worlds/:worldId/settings`, guard `canAdminWorld` = **PJ+**.
- Žádná validace tabů zatím není — nutno přidat whitelist allowed tab IDs.

---

## 4. Datový model

### 4.1 Rozšíření `WorldSettings`

```ts
// src/shared/types/index.ts
export type CharacterTabId =
  | 'soukrome'
  | 'denik'
  | 'finance'
  | 'vybava'
  | 'kalendar'
  | 'poznamky';

export const CHARACTER_TAB_IDS: CharacterTabId[] = [
  'soukrome', 'denik', 'finance', 'vybava', 'kalendar', 'poznamky',
];

/** Per Page.type seznam viditelných tabů (kromě „profil", který je vždy zobrazen). */
export interface CharacterTabVisibility {
  PostavaHrace: CharacterTabId[];
  NPC: CharacterTabId[];
}

export interface WorldSettings {
  // … existing
  /** Default: všech 6 tabů povoleno pro oba typy. */
  characterTabVisibility?: CharacterTabVisibility;
}
```

**Reprezentace = whitelist viditelných tabů.** Důvody:
- explicitní: pole `['denik','finance']` znamená „přesně tyto jsou vidět" — žádná negace
- forward-compat: kdyby přibyl tab `nový`, starý seznam ho prostě nezná → nezobrazí se (PJ ho musí v nastavení odškrtnout aktivně)
- snadný diff pro audit log (až bude potřeba)

**Default při chybějícím poli:** `CHARACTER_TAB_IDS` celé pole (všechno zapnuto). Pomocná funkce:

```ts
// src/features/world/lib/characterTabVisibility.ts
export function getVisibleTabs(
  pageType: 'Postava hráče' | 'NPC',
  settings: WorldSettings | undefined,
): Set<CharacterTabId> {
  const key = pageType === 'Postava hráče' ? 'PostavaHrace' : 'NPC';
  const list = settings?.characterTabVisibility?.[key];
  return new Set(list ?? CHARACTER_TAB_IDS);
}
```

### 4.2 BE validace

- `UpdateWorldSettingsDto.characterTabVisibility` — volitelné, objekt se dvěma klíči
- Každý klíč: `string[]`, prvky musí být z `CHARACTER_TAB_IDS` whitelistu, max 6 prvků, deduplikované
- Neznámé hodnoty se **dropují** (ne 400) — robust forward-compat

---

## 5. UI — nová záložka v Nastavení světa

### 5.1 Pozice + role

- Nová záložka **„Postavy & NPC"** v `WorldSettingsPage`, pozice **mezi „AKJ úrovně" a „Šablony"**.
- Minimální role: **PJ+**. Rozhoduje o struktuře světa (analogie Šablony/Vzhled), ne o povolení obsahu jako AKJ — proto PomocnyPJ ne. BE guard `canAdminWorld` (PJ+) na `PUT /worlds/:id/settings` se použije beze změny.
- Ikona: `UserCog` (lucide).

### 5.2 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Postavy & NPC                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Vyber, které sekce se zobrazí na detailu Postavy a NPC.        │
│  Skrytí je vratné — data se nemažou, jen schovají z UI.         │
│  Tab „Profil" je vždy povinný.                                  │
│                                                                 │
│              Profil  Soukromé  Deník  Finance  Výbava  Kalendář Poznámky  │
│  PC          [✓]     [✓]       [✓]    [✓]      [✓]     [✓]      [✓]      │
│              vždy                                                │
│  NPC         [✓]     [✓]       [✓]    [✓]      [✓]     [✓]      [✓]      │
│              vždy                                                │
│                                                                 │
│  [Resetovat na výchozí (vše zapnuto)]    [Uložit změny]         │
└─────────────────────────────────────────────────────────────────┘
```

**Detaily:**
- Sloupec **Profil** je v hlavičce a obě řádky mají disabled checkbox `[✓]` se subtextem „vždy" — komunikuje povinnost
- Checkboxy pro 6 zbylých tabů: per řádek + sloupec, click = lokální dirty state
- **Resetovat** = lokální reset state na všechno zapnuto, neuloží automaticky
- **Uložit změny** = `PUT /worlds/:worldId/settings` s payloadem `{ characterTabVisibility }`
- Disabled u nedoteknutého formu, error/success toast po uložení (vzor z existujících tabů)
- **Mobil:** sloupce nezakroutíme — překlopit do dvou samostatných sekcí (PC sekce / NPC sekce), každá s 6 toggle řádky pod sebou. Breakpoint ≤ 768px.

### 5.3 Implementace

- Nový soubor: `src/features/world/pages/WorldSettingsPage/tabs/CharacterTabsVisibilityTab.tsx`
- Reuse: `SectionCard`, `Button`, existující toast pattern
- Mutation: rozšířit stávající `useUpdateWorldSettings` hook (přidat `characterTabVisibility` do payload typu)
- Registrace v `WorldSettingsPage.tsx` tabs array

---

## 6. UI — filtrace v `PostavaLayout`

### 6.1 Změny v `PostavaLayout.tsx`

- Načíst `WorldSettings` (přes `useWorldSettings(worldId)` — pokud hook neexistuje, vytvořit; jinak reuse z 5.3)
- Spočítat `visibleTabs = getVisibleTabs(page.type, settings)`
- V tabs array filtrovat: tab je v listu **jen pokud `visibleTabs.has(tab.id)`** (Profil vždy zachován)
- V render-conditions (řádky 178–229) přidat guard `visibleTabs.has('denik')` apod. — aby aktivní tab nemohl být schovaný (edge case 7.3)

### 6.2 Aplikace filtrace per role

Filtrace se aplikuje **až po existujícím `canSeePrivate` guardu** — tedy ovlivňuje jen role, které by jinak subdoc taby viděly:

| Role | Před filtrem | Po filtru |
|---|---|---|
| Hráč / Korektor (bez owneru) | jen Profil | jen Profil (no-op) |
| PomocnyPJ | všech 7 tabů | Profil + povolené v matrix |
| PJ | všech 7 tabů | Profil + povolené v matrix |
| Vlastník PC | všech 7 tabů své postavy | Profil + povolené v matrix |

**Vlastník PC dostane filtr taky** — záměr: konzistentní svět. Pokud PJ schová Finance globálně („svět bez peněz"), nikdo Finance nevidí. Data se **nemažou** — kdyby PJ tab vrátil, vlastníkova data se objeví, kde byla. Vlastnictví dat ≠ ovládání UI struktury světa.

### 6.3 BE access

- BE `assertSubdocAccess` zůstává beze změny (kontroluje **roli**, ne viditelnost). To je správně: pokud někdo zkusí přímý API call na schovaný tab a má roli, dostane 200. Schovávání tabu je UX, ne security.
- ⚠️ **Důsledek:** Pokud někdo zná přímou URL `/api/characters/.../diary`, data dostane. To akceptujeme — souvisí s rolí, ne s nastavením světa. PJ má jiné nástroje (smazat data, schránit subdoc) pokud chce skutečně utajit.

---

## 7. Edge cases

1. **Existující světy bez `characterTabVisibility`:** `getVisibleTabs` vrátí default (vše) → žádná regrese.
2. **Page bez `characterRef`** (legacy/migrace): subdoc taby skryté i tak (jako dnes — řádek 135 `character && canSeePrivate`). Visibility filter aplikujeme **až po** existující condition.
3. **Aktivní tab se schová** (PJ odškrtne Finance, hráč má `activeTab='finance'`): při dalším renderu detekovat `!visibleTabs.has(activeTab)` → `useEffect` přepne na `'profil'`.
4. **Lokace** (Page.type = 'Lokace'): mimo scope této spec, řízeno `LokaceLayout` — žádná změna.
5. **Optimistic concurrency:** standard `WorldSettings.updatedAt` token — pokud BE vrátí 409, FE ukáže toast „Mezitím byl změněn jiným uživatelem, načti znovu".

---

## 8. Mimo scope

- **Per-Page override** (jednotlivá NPC stránka si overridne nastavení světa) — zavrženo už v brainstormingu (rozbíjí konzistenci).
- **Filtrace polí uvnitř Profilu** (řádky `Hlavní město`, `Měna`…) — řízeno `Page.table` per stránka, ne globální nastavení.
- **Per-role visibility** (např. hráč vidí jiné taby než PJ) — kdyby bylo třeba, samostatná spec.
- **Lokace tab matrix** — Lokace má jen Kalendář (Layout to řeší staticky), pokud by se mělo zobecnit, samostatný krok.
- **Audit log změn nastavení** — bude součástí obecného audit logu (mimo tento side-task).

---

## 9. Akceptační kritéria

- [ ] `WorldSettings` v BE rozšířeno o `characterTabVisibility`, DTO validuje whitelist + max 6 + dedup
- [ ] FE `WorldSettings` interface rozšířeno o `characterTabVisibility`
- [ ] Nová záložka „Postavy & NPC" v `WorldSettingsPage` — matrix UI, Reset + Uložit
- [ ] `PostavaLayout` filtruje taby přes `getVisibleTabs(page.type, settings)`
- [ ] Profil vždy viditelný (disabled checkbox v UI)
- [ ] Default při chybějícím poli = vše zapnuto (zpětná kompatibilita)
- [ ] Schování aktivního tabu = auto-switch na Profil
- [ ] `mobil-desktop` skill audit (matrix UI na mobilu = dvě stacked sekce)
- [ ] Spuštěn skill `napoveda` — aktualizace stránky Nápověda
- [ ] Unit testy: `getVisibleTabs` (default, override, prázdný list), `CharacterTabsVisibilityTab` (toggle, save, reset)
- [ ] BE: validation pipe drop neznámých hodnot (whitelist test)

---

## 10. Rozhodnutí (schváleno 2026-05-24)

1. **Default:** vše otevřeno pro PC i NPC. PJ skrývá v Nastavení. ✅
2. **Pozice záložky:** mezi AKJ úrovně a Šablony. ✅
3. **Role pro editaci:** **PJ+** (rozhodnutí o struktuře světa, ne o povolení obsahu jako AKJ). Stávající `canAdminWorld` guard bez úprav. ✅
4. **Název záložky:** „Postavy & NPC". ✅
5. **Fallback při schování aktivního tabu:** auto-switch na Profil. ✅
6. **Vlastník PC filtrován taky:** ano — konzistentní svět, data se nemažou. ✅
7. **Hráč / Korektor:** beze změny — vidí jen Profil díky existujícímu `canSeePrivate` guardu, nová matrix s nimi nehne. ✅
