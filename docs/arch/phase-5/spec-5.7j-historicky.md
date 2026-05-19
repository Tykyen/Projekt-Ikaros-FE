# Spec 5.7j — Skin „Historický" (slug `historie`)

**Status:** ✅ Implementováno (2026-05-19)
**Rozsah:** FE — nový světový skin `historie`: `index.ts` + `decorations.css`, registrace, napojení žánru; pozadí dle prompt souboru
**Větev:** `main`
**Velikost:** ~6 souborů
**Autor:** PJ + Claude
**Datum:** 2026-05-19
**Souvisí:** master [spec-5.7.md](./spec-5.7.md). Prompt assetů: [prompts-5.7j-historicky-assets.md](./prompts-5.7j-historicky-assets.md)

---

## 1. Cíl

Žánrový skin `historie` pro žánr **Historický**. Nálada: **renesance / barokní dvůr** — opulentní sály, olejomalby, svícny.

---

## 2. Vizuální identita (design audit `frontend-design`, 2026-05-19)

### 2.1 Reference look

**Barokní dvorní sál** — těžké závěsy, olejomalby ve zlatých rámech, svícny, mahagon a štuk. Tlumená vinná červeň, staré matné zlato, teplé šero osvětlené svícemi.

**Atmosféra:** `Barokní dvorní sál — vinná červeň, staré zlato a mahagon ve světle svící`

**NE:** vznešený smaragd elfí (`fantasy`), krvavá gotika (`dark-fantasy`), mosaz (`steampunk`), neon, syté barvy.

### 2.2 Paleta (přesné hex)

| Role | Hodnota |
|---|---|
| bg primary / secondary | `#160d0c` / `#241612` |
| overlay | `linear-gradient(180deg, rgba(14,8,7,.2) 0%, rgba(14,8,7,.5) 100%)` |
| surface / strong / soft | `rgba(36,22,18,.78)` / `rgba(16,9,8,.92)` / `rgba(56,32,26,.46)` |
| accent — staré matné zlato | `#bd9a4e` · bright `#ddc079` |
| accent secondary — vinná červeň | `#8a3b3a` |
| border / soft | `rgba(189,154,78,.48)` / `rgba(189,154,78,.26)` |
| border secondary | `rgba(138,59,58,.46)` |
| text — slonovinová | `#e6dcc6` · muted `#ab9c80` · dim `#675a44` |
| heading | `#f0e6cc` |
| glow zlato / víno | `rgba(189,154,78,.38)` / `rgba(138,59,58,.3)` |

### 2.3 Signature ornament (CSS/SVG)

- **Štukový rám / damaškový vzor** — jemný zlatý damaškový/ornamentální vzor v rozích obrazovky (CSS radiální gradienty, statické, klidné)
- teplý zlatý svit nadpisů
- panely 3D řeší jednotná vrstva (krok 5.8)

### 2.4 Font

- **display / logo:** `Cormorant` — vznešený renesanční serif
- **body:** `EB Garamond` — klasický humanistický serif
- ověřit/doplnit v `index.html`

---

## 3. Soubory

- `src/themes/themes/historie/index.ts` + `decorations.css`.
- `types.ts` — `ThemeId` + `'historie'`.
- `registry.ts` — import + zápis.
- `genres.ts` — žánr `Historický` → `theme: 'historie'`.

## 4. Assety

Pozadí — `public/themes/backgrounds/historie.webp` + thumbnail (autor dle [prompts-5.7j-historicky-assets.md](./prompts-5.7j-historicky-assets.md)). Ornamenty CSS.

## 5. Out of scope

- Ostatní žánrové skiny. JS efekty — `historie` je CSS-only.

## 6. Acceptance kritéria

1. `ThemeId` obsahuje `'historie'`; `getTheme('historie')` vrací skin (`scope: 'world'`).
2. `index.ts` kompletní `vars`; `decorations.css` originální.
3. `themeForGenre('Historický')` → `'historie'`.
4. `background`/`thumbnail` bez 404.
5. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
6. `mobil-desktop` audit.

## 7. Otevřené body

1. **Paleta** §2.2 — souhlas, nebo posun?
2. **Font** — `Cormorant` + `EB Garamond`, nebo jiná dvojice?
3. **Pozadí** — po schválení vygeneruješ dle prompt souboru.
