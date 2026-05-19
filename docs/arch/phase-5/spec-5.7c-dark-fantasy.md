# Spec 5.7c — Skin „Dark Fantasy"

**Status:** ✅ Implementováno (2026-05-19)
**Rozsah:** FE — nový světový skin `dark-fantasy`: `index.ts` + `decorations.css`, registrace, napojení žánru; pozadí dodá autor dle prompt souboru
**Větev:** `main`
**Velikost:** ~6 souborů — `themes/dark-fantasy/index.ts` + `decorations.css`, `types.ts`, `registry.ts`, `genres.ts`, pozadí webp + test
**Autor:** PJ + Claude
**Datum:** 2026-05-19
**Souvisí:** master [spec-5.7.md](./spec-5.7.md). Prompt assetů: [prompts-5.7c-dark-fantasy-assets.md](./prompts-5.7c-dark-fantasy-assets.md)

---

## 1. Cíl

Žánrový skin `dark-fantasy` pro žánr **Dark Fantasy**. Nálada: **gotická — katedrály a krkavci**. Temná vznešenost, ne bezútěšnost.

---

## 2. Vizuální identita (design audit `frontend-design`, 2026-05-19)

### 2.1 Reference look

**Katedrála krkavců za krvavé noci** — gotické katedrály, lomené oblouky, krkavci, zlomené koruny, krvavý měsíc. Černá noc, krvavě rudé akcenty, studený stříbřitý měsíční svit.

**Atmosféra:** `Gotická katedrála pod krvavým měsícem — krkavci, zlomené koruny, studené stříbro`

**NE:** generická AI dark fantasy, neon, fialová (`ikaros`), zlato/smaragd (`fantasy`), kýčovitá krvavá řež.

### 2.2 Paleta (přesné hex)

| Role | Hodnota |
|---|---|
| bg primary / secondary | `#0c0608` / `#1a0e12` |
| overlay | `linear-gradient(180deg, rgba(8,4,6,.2) 0%, rgba(8,4,6,.5) 100%)` |
| surface / strong / soft | `rgba(22,12,16,.76)` / `rgba(10,5,7,.92)` / `rgba(40,20,26,.46)` |
| accent — krvavě rudá | `#b51e2e` · bright `#e0433f` |
| accent secondary — studené stříbro | `#c8ccd6` |
| border / soft | `rgba(181,30,46,.5)` / `rgba(181,30,46,.26)` |
| border secondary | `rgba(200,204,214,.42)` |
| text — popelavá | `#ddd6d2` · muted `#9a8e8e` · dim `#5e5054` |
| heading — kostní bílá | `#e8dcd6` |
| glow rudá / stříbro | `rgba(181,30,46,.4)` / `rgba(200,204,214,.3)` |

### 2.3 Signature ornament (CSS/SVG)

- **Krvavá vignette** — krvavě rudá záře prosakující z rohů obrazovky
- krvavo-stříbrný svit nadpisů (text-shadow)
- panely 3D řeší jednotná vrstva (krok 5.8); decorations jen barva/glow

### 2.4 Font

- **display / logo:** `Grenze Gotisch` — gotický blackletter, ale čitelný
- **body:** `EB Garamond` — klidný serif
- ověřit/doplnit v `index.html` při implementaci

---

## 3. Soubory

- `src/themes/themes/dark-fantasy/index.ts` — `Theme`, `scope: 'world'`, `vars` přes `buildSkinVars` z §2.2.
- `src/themes/themes/dark-fantasy/decorations.css` — ornamenty §2.3, scoped `[data-theme='dark-fantasy']`.
- `types.ts` — `ThemeId` + `'dark-fantasy'`.
- `registry.ts` — import + zápis.
- `genres.ts` — žánr `Dark Fantasy` přemapovat `theme: 'ikaros'` → `'dark-fantasy'`.

## 4. Assety

Pozadí — `public/themes/backgrounds/dark-fantasy.webp` + thumbnail. Generuje autor dle [prompts-5.7c-dark-fantasy-assets.md](./prompts-5.7c-dark-fantasy-assets.md). Ornamenty CSS/SVG.

## 5. Out of scope

- Ostatní žánrové skiny.
- JS efekty — `dark-fantasy` je CSS-only.

## 6. Acceptance kritéria

1. `ThemeId` obsahuje `'dark-fantasy'`; `getTheme('dark-fantasy')` vrací skin (`scope: 'world'`).
2. `index.ts` kompletní `vars`; `decorations.css` originální.
3. `themeForGenre('Dark Fantasy')` → `'dark-fantasy'`.
4. `background`/`thumbnail` bez 404.
5. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
6. `mobil-desktop` audit.

## 7. Otevřené body

1. **Paleta** §2.2 — souhlas, nebo posun?
2. **Font** — `Grenze Gotisch` + `EB Garamond`, nebo jiná dvojice?
3. **Pozadí** — po schválení vygeneruješ dle prompt souboru.
