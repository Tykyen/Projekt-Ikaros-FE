# Side-task — AKJ shielded existence indicator

**Status:** ✅ IMPLEMENTOVÁNO (D-062a + D-062b, 2026-05-24). D-062c (listings stub) zůstává otevřený dluh.
**Souvisí s dluhem:** D-062
**Rozsah:** FE (rozšíření `AccessDenied` komponenty + `usePageMeta` hooku) + BE (rozšíření `GET /pages/meta/:slug` endpointu o AKJ info)
**Velikost:** odhad ~5 souborů FE / ~2 BE / ~180 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-24
**Souvisí:** [spec-7.1.md](../phase-7/spec-7.1.md) (PageViewer), [AccessDenied.tsx](../../../src/features/world/pages/PageViewer/components/AccessDenied.tsx), [usePageMeta.ts](../../../src/features/world/pages/api/usePageMeta.ts)

---

## 1. Cíl — dva oddělené UI prvky (D-062a + D-062b)

Vychází z legacy Matrix vzoru (`C:/Matrix/Matrix/frontend/src/pages/Page.tsx`), který měl 3 AKJ visualizační prvky. Pro D-062 přebíráme dva (třetí zůstává odložený jako D-062c).

### D-062a — Konkrétní AKJ ve screenu „Stránka je zašifrovaná" (klik bez přístupu)

Když uživatel klikne na odkaz vedoucí na AKJ-chráněnou stránku, místo generického „Nemáš oprávnění" dostane:
- **Existence stránky je potvrzena**
- **Konkrétní úroveň AKJ** (číslo + jméno z `WorldSettings.akjTypes`)
- **Wood-Wide hint** (zachováno z dnešního stavu)
- **Hint co dál** („Promluv s PJ světa")

### D-062b — „Úspěšně dešifrováno" banner v otevřené AKJ-chráněné stránce

Když user **má** přístup a stránka má `accessRequirements` (jakýkoliv typ), na začátku obsahu zobrazí banner indikující, že content je citlivý:

```
┌──────────────────────────────────────────────┐
│ ⚠ UTAJENÝ ARCHIV [AKJ: 3 — Tajný spis]      │
│   Úspěšně dešifrováno                        │
└──────────────────────────────────────────────┘
```

Smysl: uživatel vidí, že má před sebou utajený obsah (herní imerze + reminder, že tu nemá vést běžnou debatu). Theme variants (fantasy = 📜 zlatý / dark = ☠ červený / light = 🗝 bronzový / default = ⚠ modrý) je čistě CSS, ne logika.

Banner je **statický** (informační), nemá interakce. Pouze otevřené stránky s `accessRequirements != []` ho mají.

## 2. Out of scope (D-062c — další iterace)

- **Listings stub** (`GET /pages` a `/pages/directory` aktuálně vrací AKJ-chráněné stránky bez indikace) + inline AKJ badgy v hlavičce stránky (Matrix `matrix-cta--blue "AKJ: 3"`). Větší scope (BE filter + nový response shape + badge komponenta). Řeší samostatný side-task po D-062a+b.
- **Wikilink rendering** — vyřešeno pomocí D-062a (klik vede do AccessDenied s konkrétní úrovní).
- **Search filtering** — AKJ není v indexu, mimo scope.

## 3. Audit současného stavu

### FE
- **[AccessDenied.tsx](../../../src/features/world/pages/PageViewer/components/AccessDenied.tsx)** — 403 screen. Aktuálně:
  - Generic text „Nemáš dostatečná oprávnění. Tvůj přístupový klíč (AKJ) nebo role nedosahuje požadované úrovně."
  - Pokud `usePageMeta.isWoodWide=true` → přidá hint o Wood-Wide lore
  - Akce: Zpět, Seznam stránek, (PomocnyPJ+: Otevřít v editoru)

- **[usePageMeta.ts](../../../src/features/world/pages/api/usePageMeta.ts)** — vrací `{ isWoodWide }`. Není auth-guarded, vrací 404 jen pokud stránka neexistuje.

### BE
- **[pages.service.ts:402](../../../../Projekt-ikaros/backend/src/modules/pages/pages.service.ts)** — `assertAccess`: loop nad `accessRequirements`, pokud fail → `ForbiddenException('PAGE_ACCESS_DENIED')`. Silent, bez info-leak.
- **`accessRequirements`** podporuje typy: `UserId`, `AKJ` (value = required level number), `Role` (value = WorldRole), `AKJType` (value = key do `WorldSettings.akjTypes`).
- **`GET /pages/meta/:slug`** — lehký endpoint, vrací `{ isWoodWide }`. Musíme rozšířit.

## 4. Datový model

### Rozšíření meta response

```ts
// FE: src/features/world/pages/api/usePageMeta.ts
export interface PageMeta {
  isWoodWide: boolean;
  /** D-062a — shielded existence: pokud stránka má AKJ requirement(s), vrátíme highest level. */
  shieldedBy?: ShieldedRequirement[];
}

export interface ShieldedRequirement {
  type: 'AKJ' | 'AKJType' | 'Role';
  /** Pro AKJ: numerická úroveň. Pro AKJType: key i resolved label/level. Pro Role: WorldRole. */
  level?: number;
  akjKey?: string;
  akjLabel?: string;
  roleLabel?: string;
}
```

### Co vrací BE meta endpoint

- **Stránka neexistuje** → 404 (beze změny)
- **Stránka existuje, user má přístup** → `{ isWoodWide, shieldedBy: undefined }` (nebudeme leakovat info když to user nepotřebuje)
- **Stránka existuje, user nemá přístup** → `{ isWoodWide, shieldedBy: [...požadavky] }`

Co je v `shieldedBy`:
- Filtrujeme jen ty, které user **nesplňuje** (důvody zamítnutí)
- Pro `UserId` requirement → **neukazujeme** (privacy — kdo má přístup je tajné)
- Pro `AKJ` → ukážeme číslo `level`
- Pro `AKJType` → resolve podle `WorldSettings.akjTypes` na `{ key, name, level }`
- Pro `Role` → label rolea, který user nemá

### Žádná migrace dat — meta endpoint nový shape, FE backward-compat na `shieldedBy?:`.

## 5. UI — dva místa, dvě komponenty

### 5a) `AccessDenied` (klik bez přístupu) — D-062a

### Layout (návrh)

```
  ┌─────────────────────────────────────────────────┐
  │           [ShieldAlert ikona, 48px]             │
  │                                                 │
  │          Stránka je zašifrovaná                 │
  │                                                 │
  │    Existuje, ale nemáš dostatečný přístup.      │
  │                                                 │
  │    ┌─────────────────────────────────────┐      │
  │    │ 🔒 AKJ úroveň 3 — Tajný spis        │      │
  │    └─────────────────────────────────────┘      │
  │                                                 │
  │    Promluv s PJ světa o získání úrovně.         │
  │                                                 │
  │    [🌍 Wood-Wide lore hint, pokud isWoodWide]   │
  │                                                 │
  │  [ ← Zpět ]  [Seznam stránek]  [⚙ Editor (PJ)]  │
  └─────────────────────────────────────────────────┘
```

**Změny:**
- Nadpis: „Stránka je zašifrovaná" (místo „Přístup zamítnut") — pozitivnější, herněji laděný
- Body: „Existuje, ale nemáš dostatečný přístup." — potvrzení existence
- Nová **shielded card** s konkrétními požadavky:
  - Pro AKJ úroveň: `🔒 AKJ úroveň <X> — <jméno úrovně>`
  - Pro AKJType: `🔒 AKJ klíč: <name>` (key skryjeme, ukážeme jen lidský název)
  - Pro Role: `🛡 Role: <label>`
- Hint („Promluv s PJ světa o získání úrovně") — vrstvený podle situace
- Wood-Wide hint **zůstává** (orthogonální informace)

### Edge cases

1. **Více shielded requirements** (např. AKJ 3 + Role PomocnyPJ) → seznam všech, user vidí všechny překážky
2. **`shieldedBy` undefined** (BE neposlal — např. legacy backend, nebo user má přístup) → fallback na původní generic text
3. **Mix splněných/nesplněných** — BE filtruje jen nesplněné, takže FE dostává jen překážky
4. **AKJType s neexistujícím key v `WorldSettings.akjTypes`** (zombie reference) → BE vrátí `{ type: 'AKJType', akjKey: '<key>', akjLabel: '<key>' }` (fallback label = key), FE renderuje gracefully

### 5b) `AkjDecryptedBanner` (otevřená AKJ-chráněná stránka) — D-062b

**Render:** nová komponenta vložená do `PageViewerPage` (a do `PostavaLayout` pro typ PostavaHrace/NPC), pokud `page.accessRequirements != []`, zobrazí se nad obsahem stránky.

**Co banner obsahuje:**
- Ikona (default `⚠`, theme variants)
- Title: `UTAJENÝ ARCHIV [AKJ: <level> — <name>]` — pokud má `AKJType`/`AKJ`; pro pouze `Role` requirement: `UTAJENÝ ARCHIV [pro <role>]`; pro pouze `UserId`: `UTAJENÝ ARCHIV [vyhrazený přístup]`
- Subtitle: `Úspěšně dešifrováno`
- **Wood-Wide indikátor:** pokud `page.isWoodWide`, doplníme za level `(Wood-Wide)` nebo přidáme inline ikonu zeměkoule

**Datový zdroj:** `page.accessRequirements` (už dostupné z `usePage`) + `useWorldSettings` (resolution AKJType → name). Žádný extra API call.

**Edge cases:**
- Stránka bez `accessRequirements` → banner se nezobrazí
- Více requirements → vybereme nejvyšší AKJ úroveň pro title; pokud žádná AKJ, fallback na Role; pokud ani Role, na UserId text
- Theme: skin-aware styling přes CSS class (`data-theme` attribute na rootu), 1 banner CSS soubor s `data-theme` selektory

**Pozor — info-leak otázka:** Banner ukazuje user-i, že stránka je AKJ-chráněná, AŽ když ji vidí (užívá si přístup). To **není** info-leak — když má přístup, ví že stránka existuje. Smysl je herní imerze (uživatel ví, že čte tajný obsah) + reminder pro RP.

## 6. BE změny

### 6.1 `GET /pages/meta/:slug` v `pages.controller.ts`

Endpoint existuje. Rozšíříme service o resolution `shieldedBy`.

### 6.2 `pages.service.ts` — nová privátní metoda `computeShieldedBy`

```ts
private async computeShieldedBy(
  page: Page,
  userId: string | null,
  worldId: string,
): Promise<ShieldedRequirement[] | undefined> {
  if (!page.accessRequirements?.length) return undefined;

  const membership = userId
    ? await this.membershipRepo.findByUserAndWorld(userId, worldId)
    : null;
  const settings = await this.settingsRepo.findByWorldId(worldId);
  const akjTypes = settings?.akjTypes ?? [];

  const out: ShieldedRequirement[] = [];
  for (const req of page.accessRequirements) {
    if (req.type === 'AKJ') {
      const need = Number(req.value);
      const has = membership?.akj ?? 0;
      if (has < need) out.push({ type: 'AKJ', level: need });
    } else if (req.type === 'AKJType') {
      const def = akjTypes.find((a) => a.key === req.value);
      const need = def?.level ?? 0;
      const has = membership?.akj ?? 0;
      if (has < need) {
        out.push({
          type: 'AKJType',
          akjKey: String(req.value),
          akjLabel: def?.name ?? String(req.value),
          level: def?.level,
        });
      }
    } else if (req.type === 'Role') {
      const need = Number(req.value);
      const has = membership?.role ?? WorldRole.Zadatel;
      if (has < need) {
        out.push({ type: 'Role', roleLabel: roleLabel(need) });
      }
    }
    // UserId requirement — záměrně neukazujeme
  }
  return out.length > 0 ? out : undefined;
}
```

Volá se z existující `findPageMeta(slug, worldId, userId)` metody, která vrací `{ isWoodWide, shieldedBy }`.

### 6.3 Testy BE

- `pages.service.spec.ts`:
  - shielded AKJ 3, user akj 1 → `shieldedBy: [{ type: 'AKJ', level: 3 }]`
  - shielded AKJType `'top-secret'`, user nemá → resolved label + level
  - user má přístup → `shieldedBy: undefined`
  - více requirements → array s jen nesplněnými
  - UserId requirement → nepřidává do shieldedBy (privacy)
  - neznámý AKJType key → fallback label = key

## 7. FE změny

### 7.1 `usePageMeta.ts`

Rozšířit response type o `shieldedBy`. Žádná změna v hook těle (api.get pass-through).

### 7.2 `AccessDenied.tsx`

Nová `ShieldedRequirementsList` sub-komponenta. Pokud `meta.shieldedBy.length > 0` → render. Jinak fallback na původní generic text.

### 7.3 CSS

Nový blok `s.shieldedCard` v `AccessDenied.module.css` — odlišená vizuální karta s ikonou zámku a tokeny.

### 7.4 Nová komponenta `AkjDecryptedBanner` (D-062b)

- Cesta: `src/features/world/pages/PageViewer/components/AkjDecryptedBanner.tsx` + `.module.css`
- Props: `{ accessRequirements: AccessRequirement[]; isWoodWide?: boolean; worldId: string }`
- Resolution AKJType labelu interně přes `useWorldSettings(worldId)`.
- Theme variants: CSS přes `[data-theme="fantasy"]` selektory v root (skin id mapuje na barvu/emoji).
- Integrace:
  - `PageViewerPage.tsx` (případně `PostavaLayout.tsx` pro postavy/NPC) — nad obsahem
  - Pouze pokud `page.accessRequirements.length > 0`

### 7.5 Testy FE

- `AccessDenied.spec.tsx` (nová):
  - bez shieldedBy → generic text
  - s AKJ level 3 → zobrazí „AKJ úroveň 3"
  - s AKJType { akjLabel: 'Tajný spis', level: 3 } → zobrazí „AKJ úroveň 3 — Tajný spis"
  - s Role → zobrazí role label
  - mix shieldedBy + isWoodWide → obě sekce

- `AkjDecryptedBanner.spec.tsx` (nová):
  - prázdné accessRequirements → render nic (null)
  - AKJ level 3 → title obsahuje „AKJ: 3"
  - AKJType `'top-secret'` se settings → title obsahuje resolved name + level
  - jen Role requirement → title `[pro <role>]`
  - jen UserId requirement → title `[vyhrazený přístup]`
  - isWoodWide → přidá Wood-Wide indikátor

## 8. Akceptační kritéria

### D-062a (Access Denied screen)
- [ ] BE `GET /pages/meta/:slug` vrací `shieldedBy[]` (jen nesplněné requirements)
- [ ] BE: AKJ level resolve z přímé hodnoty + AKJType resolve z worldSettings.akjTypes
- [ ] BE: UserId requirement se neukazuje (privacy)
- [ ] FE `AccessDenied`: nový shielded card s konkrétními úrovněmi
- [ ] FE: fallback na generic text když `shieldedBy` chybí (backward compat)
- [ ] Wood-Wide hint nadále funguje (orthogonal)

### D-062b (Decrypted banner)
- [ ] FE `AkjDecryptedBanner`: nová komponenta
- [ ] Render na `PageViewerPage` + `PostavaLayout` nad obsahem, jen pro stránky s `accessRequirements.length > 0`
- [ ] Resolution AKJType label z `useWorldSettings` (graceful fallback na key)
- [ ] Wood-Wide indikátor v titulu pokud `page.isWoodWide`
- [ ] Theme variants přes CSS `[data-theme]` selektory (fantasy/dark/light/default)

### Common
- [ ] Unit testy: BE `computeShieldedBy` (5 scénářů), FE `AccessDenied` (5 scénářů), FE `AkjDecryptedBanner` (6 scénářů)
- [ ] `mobil-desktop` audit nové shielded card + banner

## 9. Otevřené body k odsouhlasení

1. **UserId requirement** — záměrně skrýváme z `shieldedBy` (privacy: kdo má přístup je tajné). Souhlas? Alternativa: ukázat „🔒 Stránka vyhrazena vybraným osobám" bez detailu kdo (bezpečné).
2. **Nadpis komponenty** — „Stránka je zašifrovaná" (navrženo) vs. „Stránka je utajená" vs. zachovat „Přístup zamítnut".
3. **Hint „Promluv s PJ"** — vždy / jen pro AKJ / vůbec? Navrženo vždy (univerzální).
4. **Listings stub** (D-062b) — odložit nebo udělat hned? Doporučuji odložit (větší scope, vyžaduje BE filter + nový endpoint shape).
