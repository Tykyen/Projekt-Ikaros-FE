# Spec 5.4 — Restrukturalizace stránky světa (`/svet/:worldSlug`)

**Status:** ✅ Schváleno + implementováno (2026-05-18)
**Rozsah:** FE — přestavba layoutu `WorldDashboardPage`: nízký hero, název nahoře, oddělení member / non-member obsahu, kompaktní info blok. Bez BE změn.
**Větev:** `feat/krok-5.4-svet-restruktura`
**Velikost:** odhad ~10 souborů / ~450 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-18
**Souvisí:** [spec-2.4.md](../phase-2/spec-2.4.md), [spec-5.2.md](spec-5.2.md)
**Navazuje:** krok 5.7 — žánrové skiny světa (obrázková pozadí + textury per skin)

---

## 1. Cíl

Stránka `/svet/:worldSlug` zabírá příliš mnoho vertikálního místa, než se uživatel dostane k obsahu. Hero banner (`aspect-ratio: 16/7`, ~720 px na šířce 1650 px) tlačí všechno dolů, název světa je schovaný dole v obrázku a člen dostane nad dashboardem celý informační blok určený pro rozhodování o vstupu.

**Krok 1** většího záměru „změnit skiny v rámci světa" — sjednotit **shared strukturu** stránky světa nezávislou na žánrovém skinu. Skiny (krok 5.5) pak mění jen barvy / pozadí / textury uvnitř téhle struktury.

Cíle:

1. **Nízký hero banner** — z `aspect-ratio: 16/7` na pevnou nízkou výšku (~220 px).
2. **Název nahoře** — `world.name` + badge jako overlay v **horní** části banneru, ne dole.
3. **Oddělit member / non-member obsah** — `WorldDetailInfo` (vč. „Detaily" Systém/Hráči/PJ) se renderuje **jen nečlenovi**.
4. **Člen** — po hero rovnou dashboard (Akce/Novinky/Oblíbené + StatBar); informace o světě jako kompaktní sbalitelný blok **pod** dashboardem.
5. Sjednotit vertikální rytmus stránky.

---

## 2. Kontext / motivace

`WorldDashboardPage` ([WorldDashboardPage.tsx](../../src/features/world/pages/WorldDashboardPage/WorldDashboardPage.tsx)) větví dle `useWorldStatus`:

| Pohled | Dnes renderuje |
|---|---|
| non-member | `WorldDetailHero` → `WorldDetailInfo` → `JoinCTA` (aside 360 px) |
| pending-access | `WorldDetailHero` → `WorldDetailInfo` → `AccessRequestPending` |
| member | `WorldDetailHero` → `WorldDetailInfo` → `WorldDashboard` |

**Problémy:**

- **Hero** ([WorldDetailHero.module.css:7](../../src/features/world/components/WorldDetailHero/WorldDetailHero.module.css#L7)) — `aspect-ratio: 16/7` = na desktopu ~720 px výšky. Název je overlay `bottom: 0`.
- **Duplicita** — `WorldDetailInfo` sekce „Detaily" obsahuje „Hráči", `WorldDashboard` `StatBar` taky „Hráčů".
- **Member redundance** — člen, který už ve světě je, dostane nad akcemi celý blok „O světě / Detaily / Tóny / Kostky" určený pro nečlena rozhodujícího se o vstupu.

---

## 3. Audit současného stavu

### 3.1 `WorldDetailHero`

- `aspect-ratio: 16/7`, `border-radius: 16px`, `background-size: cover`.
- `.overlay` — gradient **shora dolů**, ztmavení **dolní** části (název byl dole).
- `.content` — `position: absolute; bottom: 0` — badges + `h1` název dole.
- Mobil (≤768): `aspect-ratio: 16/9`.

### 3.2 `WorldDetailInfo`

- Grid `1fr 320px`: „O světě" (popis) + aside „Detaily" (Žánr/Systém/Hráči/PJ); pod tím „Tón a styl", „Kostky a mechaniky", „Hledáme" callout (každé `grid-column: 1/-1`).

### 3.3 `WorldDashboardPage` layout

- `.page` — `max-width: 1200px`, `padding: 20px`, `gap: 0`.
- Vertikální rytmus nekonzistentní — `.page gap: 0`, ale `WorldDetailInfo .grid` má `margin-top: 24px` a `WorldDashboard .wrap` taky `margin-top: 24px`. Mezery si řeší každá komponenta sama.

---

## 4. Návrh řešení

### 4.0 Dotčené soubory

```
src/features/world/
├── components/
│   ├── WorldDetailHero/WorldDetailHero.tsx          ← název nahoře
│   ├── WorldDetailHero/WorldDetailHero.module.css   ← nízký pruh, overlay shora
│   └── WorldAboutPanel/                             ← NOVÁ — kompaktní info blok pro člena
│       ├── WorldAboutPanel.tsx
│       ├── WorldAboutPanel.module.css
│       └── index.ts
└── pages/WorldDashboardPage/
    ├── WorldDashboardPage.tsx                       ← member větev: bez WorldDetailInfo, + WorldAboutPanel
    └── WorldDashboardPage.module.css                ← vertikální rytmus
```

`WorldDetailInfo` — beze změny vnitřku; jen se přestane volat pro člena.

### 4.1 Hero — nízký banner, název nahoře

`WorldDetailHero.module.css`:

- `aspect-ratio: 16/7` → **`height: clamp(180px, 24vh, 240px)`** (desktop). Mobil (≤768): `clamp(150px, 32vw, 200px)`.
- `.overlay` — gradient obrátit: ztmavení **horní** části (`surface-1` shora → `transparent` ~60 %), aby název nahoře byl čitelný na světlém obrázku.
- `.content` — `bottom: 0` → **`top: 0`**; `padding` shora; pořadí badges → `h1`.
- `.title` — `clamp(28px, 5vw, 48px)` → `clamp(24px, 3.5vw, 36px)` (nižší pruh = menší titulek); `font-family: var(--font-display)` (skin font).
- `border-radius` 16 px / 12 px mobil — beze změny.

### 4.2 `WorldDashboardPage` — větvení

```
member:        Hero → WorldDashboard → WorldAboutPanel
non-member:    Hero → WorldDetailInfo → JoinCTA (aside)        ← beze změny
pending:       Hero → WorldDetailInfo → AccessRequestPending   ← beze změny
```

Member větev: odebrat `<WorldDetailInfo>`, za `<WorldDashboard>` přidat `<WorldAboutPanel world={world} />`.

### 4.3 `WorldAboutPanel` — kompaktní info blok (NOVÁ komponenta)

- Render **pod** `StatBar`, jen v member větvi.
- **Sbalitelný** — nativní `<details>`/`<summary>` (bezbariérové, žádný JS stav). Sumář: ikona + „O světě" (uppercase, `letter-spacing`, jako `DashColumn` titulek). Default sbalený.
- Obsah po rozbalení: **popis** světa, **Tón a styl** (tóny chips), **Kostky a mechaniky** (dice chips) — reuse vizuálu chips z `WorldDetailInfo`.
- **Nezahrnuje** „Detaily" (Systém / Hráči / PJ) — to je rozhodovací info pro nečlena; Hráči jsou ve `StatBar`, systém + PJ v `/nastaveni`.
- Prázdné sekce (bez popisu / tónů / kostek) se vynechají; pokud je prázdné vše, panel se nerenderuje.
- Panel-styl shodný s `DashColumn` (`var(--surface-2)`, `var(--frame-border)`, `radius 12px`).

### 4.4 Vertikální rytmus

- `WorldDashboardPage.module.css` — `.page` dostane `gap: var(--sp-6)` (desktop) / `var(--sp-4)` (mobil ≤768).
- Zrušit `margin-top: 24px` v `WorldDetailInfo .grid` a `WorldDashboard .wrap` — mezery řídí `.page gap` jednotně.
- `.body` (non-member grid) — `margin-top` zrušit, řídí `gap`.

### 4.5 Design audit (`frontend-design`)

Shared struktura žije uvnitř světového motivu — barvy dědí z aktivního theme, audit řeší **strukturu a charakter**.

- **Hero jako „cedule světa"** — nízký pruh, ne dominantní fotka. Název v `--font-display` (žánrový charakter skinu), overlay ztmavení jen nahoře = obrázek zůstává čitelný dole (návaznost na pozadí v kroku 5.5).
- **Badge** (accessMode + žánr) nad názvem — drobné, `backdrop-filter: blur` zachovat.
- **Vertikální rytmus** — jeden `gap` token místo roztroušených `margin-top`; konzistentní dech mezi hero / dashboard / about.
- **`WorldAboutPanel` sbalený default** — neruší cestu člena k akcím; rozbalí si ho, kdo chce. Vizuálně tišší než sloupce dashboardu (sekundární obsah).
- **Tokeny only** — žádný hardcoded literál (`lint:colors` ✓).

> 🔀 **Alternativa (zamítnuta):** refaktor `WorldDetailInfo` na variantu `variant="member"`. Zamítnuto — member blok je sbalitelný, jiný layout (bez 2sloupcového gridu, bez Detaily), společného kódu málo; nová komponenta je čistší než větvení.

### 4.6 mobil-desktop + nápověda

`mobil-desktop` audit (hero výška, `WorldAboutPanel` na mobilu). `napoveda` — ověřit popis úvodní stránky světa.

---

## 5. Out of scope

- **Žánrové skiny světa** (pozadí, textury, ornamenty per skin) — krok 5.5.
- **Obsah dashboardu** (Akce/Novinky/Oblíbené, StatBar) — beze změny z 5.2.
- **`JoinCTA` / `AccessRequestPending`** — beze změny z 2.4.
- **`WorldDetailInfo` vnitřek** — beze změny; mění se jen kdy se volá.

---

## 6. Acceptance kritéria

1. Hero banner — pevná nízká výška ~220 px (desktop), název + badge v **horní** části, overlay ztmavuje horní okraj.
2. Member větev — `WorldDetailHero` → `WorldDashboard` → `WorldAboutPanel`; `WorldDetailInfo` se členovi **nerenderuje**.
3. Non-member a pending větve — beze změny obsahu, jen nižší hero.
4. `WorldAboutPanel` — sbalitelný `<details>`, default sbalený; popis + tóny + kostky; bez „Detaily"; prázdný → nerenderuje se.
5. Vertikální rytmus — jednotný `gap` na `.page`, žádné roztroušené `margin-top`.
6. Layout funguje na mobilu / tabletu / desktopu (`mobil-desktop` audit).
7. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓; žádný hardcoded barevný literál.
8. FE testy — `WorldAboutPanel` (render, sbalení, prázdný stav), member větev nerenderuje `WorldDetailInfo`.

---

## 7. Test plán

- `WorldDetailHero` — render názvu + badge, placeholder bez obrázku.
- `WorldAboutPanel` — render popis/tóny/kostky; prázdný → null; `<details>` toggle.
- `WorldDashboardPage` — member: `WorldDashboard` + `WorldAboutPanel`, **ne** `WorldDetailInfo`; non-member: `WorldDetailInfo` + `JoinCTA`.
- Smoke: člen → nízký hero + dashboard + sbalený about; nečlen → nízký hero + info + CTA; mobil.

---

## 8. Riziko & rollback

| Riziko | Pravd. | Dopad | Mitigace |
|---|---|---|---|
| Nízký hero ořízne obrázek nešťastně | Střední | Nízký | `background-position: center`; krok 5.5 řeší obrázky per skin. |
| Člen postrádá Systém/PJ info | Nízká | Nízký | Dostupné v `/nastaveni`; lze doplnit do `WorldAboutPanel` později. |
| Existující testy 2.4/5.2 na layoutu | Střední | Nízký | Projít a upravit dotčené testy. |

**Rollback:** Revert commitu — aditivní, izolované do `WorldDashboardPage` + hero.

---

## 9. Otázky k autorovi

Žádné — rozsah a vzhled odsouhlaseny (nízký banner s názvem nahoře, info pro člena = kompaktní blok pod dashboardem).

> Po schválení → implementační plán → potvrzení → kód.
