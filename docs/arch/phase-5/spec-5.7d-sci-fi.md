# Spec 5.7d — Skin „Sci-Fi" (slug `vesmir`)

**Status:** ✅ Implementováno (2026-05-19)
**Rozsah:** FE — nový světový skin `vesmir`: `index.ts` + `decorations.css`, registrace, napojení žánru; pozadí dodá autor dle prompt souboru
**Větev:** `main`
**Velikost:** ~6 souborů — `themes/vesmir/index.ts` + `decorations.css`, `types.ts`, `registry.ts`, `genres.ts`, pozadí webp + test
**Autor:** PJ + Claude
**Datum:** 2026-05-19
**Souvisí:** master [spec-5.7.md](./spec-5.7.md). Prompt assetů: [prompts-5.7d-sci-fi-assets.md](./prompts-5.7d-sci-fi-assets.md)

---

## 1. Cíl

Žánrový skin `vesmir` pro žánr **Sci-Fi**. Nálada: **hard sci-fi — vesmírná loď**. Čistá, technická, sterilní — odlišná od neonu `ikaros`.

> Slug `vesmir` (ne `sci-fi`) — `sci-fi` drží platformový skin (krok 5.7, spec §2.2).

---

## 2. Vizuální identita (design audit `frontend-design`, 2026-05-19)

### 2.1 Reference look

**Můstek vesmírné lodi** — čisté kovové panely, prosklená kupole do vesmíru, technické linky, navigační HUD. Sterilní, přesné, klidné. NASA / *Interstellar* / *2001*. Žádný neon, žádné město.

**Atmosféra:** `Můstek hvězdné lodi — ledově modré panely a chladný jas dálného vesmíru`

**NE:** neonové synthwave (`ikaros`), fialová, zlato/smaragd, gotika, „špinavé" sci-fi (to je cyberpunk/postapo).

### 2.2 Paleta (přesné hex)

| Role | Hodnota |
|---|---|
| bg primary / secondary | `#070b12` / `#0f1826` |
| overlay | `linear-gradient(180deg, rgba(6,10,18,.18) 0%, rgba(6,10,18,.46) 100%)` |
| surface / strong / soft | `rgba(16,26,42,.74)` / `rgba(8,13,22,.9)` / `rgba(28,44,68,.46)` |
| accent — ledová cyan | `#4fd4e4` · bright `#9af0fa` |
| accent secondary — chladná modrá | `#5b8fd6` |
| border / soft | `rgba(79,212,228,.5)` / `rgba(79,212,228,.26)` |
| border secondary | `rgba(91,143,214,.45)` |
| text — chladná bílá | `#dde6ef` · muted `#8f9eb2` · dim `#52606f` |
| heading | `#eaf4fb` |
| glow cyan / modrá | `rgba(79,212,228,.4)` / `rgba(91,143,214,.32)` |

### 2.3 Signature ornament (CSS/SVG)

- **Skenovací linka / HUD** — tenká cyan horizontální „scan" linka přejíždějící pomalu plochou (CSS animace, `prefers-reduced-motion` respekt)
- jemné technické rohové značky panelů (CSS — žádné rastry)
- cyan svit nadpisů

### 2.4 Font

- **display / logo:** `Orbitron` — geometrický technický (sdíleno s base sci-fi fonty z 1.0d)
- **body:** `Exo 2` — čistý technický humanist
- ověřit/doplnit v `index.html`

---

## 3. Soubory

- `src/themes/themes/vesmir/index.ts` — `Theme`, `scope: 'world'`, `vars` přes `buildSkinVars` z §2.2.
- `src/themes/themes/vesmir/decorations.css` — ornamenty §2.3, scoped `[data-theme='vesmir']`.
- `types.ts` — `ThemeId` + `'vesmir'`.
- `registry.ts` — import + zápis.
- `genres.ts` — žánr `Sci-Fi` přemapovat `theme: 'ikaros'` → `'vesmir'`.

## 4. Assety

Pozadí — `public/themes/backgrounds/vesmir.webp` + thumbnail. Generuje autor dle [prompts-5.7d-sci-fi-assets.md](./prompts-5.7d-sci-fi-assets.md). Ornamenty CSS/SVG.

## 5. Out of scope

- Ostatní žánrové skiny.
- JS efekty — `vesmir` je CSS-only (scan linka = CSS animace).

## 6. Acceptance kritéria

1. `ThemeId` obsahuje `'vesmir'`; `getTheme('vesmir')` vrací skin (`scope: 'world'`).
2. `index.ts` kompletní `vars`; `decorations.css` originální.
3. `themeForGenre('Sci-Fi')` → `'vesmir'`.
4. `background`/`thumbnail` bez 404.
5. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
6. `mobil-desktop` audit.

## 7. Otevřené body

1. **Paleta** §2.2 — souhlas, nebo posun?
2. **Font** — `Orbitron` + `Exo 2`, nebo jiná dvojice?
3. **Pozadí** — po schválení vygeneruješ dle prompt souboru.
