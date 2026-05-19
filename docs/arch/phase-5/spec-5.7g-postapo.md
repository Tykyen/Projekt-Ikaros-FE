# Spec 5.7g — Skin „Post-apokalypsa" (slug `apokalypsa`)

**Status:** ✅ Implementováno (2026-05-19)
**Rozsah:** FE — nový světový skin `apokalypsa`: `index.ts` + `decorations.css`, registrace, napojení žánru; pozadí dle prompt souboru
**Větev:** `main`
**Velikost:** ~6 souborů
**Autor:** PJ + Claude
**Datum:** 2026-05-19
**Souvisí:** master [spec-5.7.md](./spec-5.7.md). Prompt assetů: [prompts-5.7g-postapo-assets.md](./prompts-5.7g-postapo-assets.md)

---

## 1. Cíl

Žánrový skin `apokalypsa` pro žánr **Post-apokalypsa**. Nálada: **zarůstající ruiny** — civilizace pohlcená přírodou, melancholie.

> Slug `apokalypsa` (ne `postapo` — to drží platformový skin, spec §2.2).

---

## 2. Vizuální identita (design audit `frontend-design`, 2026-05-19)

### 2.1 Reference look

**Město pohlcené přírodou** — popraskaný beton, mech a břečťan prorůstající ruinami, rozbitá okna, vzrostlé stromy v ulicích. Tlumené, vybledlé denní šero. Příroda v tichosti vítězí.

**Atmosféra:** `Město pohlcené přírodou — mech na betonu a tlumené šedozelené ticho`

**NE:** vznešený smaragd (`fantasy`), neon, jedovatá zeleň (to je „radioaktivní pustina" — jiný směr), syté barvy. Tady tlumeně, vybledle.

### 2.2 Paleta (přesné hex)

| Role | Hodnota |
|---|---|
| bg primary / secondary | `#10130e` / `#1b211a` |
| overlay | `linear-gradient(180deg, rgba(12,15,11,.18) 0%, rgba(12,15,11,.46) 100%)` |
| surface / strong / soft | `rgba(26,32,24,.76)` / `rgba(12,15,11,.9)` / `rgba(42,50,38,.46)` |
| accent — mechová zeleň | `#7e9c5c` · bright `#a8c47e` |
| accent secondary — rezavá hněď | `#a06840` |
| border / soft | `rgba(126,156,92,.5)` / `rgba(126,156,92,.26)` |
| border secondary | `rgba(160,104,64,.42)` |
| text — vybledlá šedá | `#d4d4c6` · muted `#909a84` · dim `#586050` |
| heading | `#e2e4d4` |
| glow zeleň / rez | `rgba(126,156,92,.36)` / `rgba(160,104,64,.3)` |

### 2.3 Signature ornament (CSS/SVG)

- **Prorůstající listoví** — jemné tmavě zelené úponky/listí v rozích panelů a obrazovky (CSS gradient / SVG, tiché, statické)
- tlumený zelený svit nadpisů (měkký, bez ostrosti)
- panely 3D řeší jednotná vrstva (krok 5.8)

### 2.4 Font

- **display / logo:** `Oswald` — kondenzovaný industriální (cedule, nápisy města)
- **body:** `Spectral` — klidný serif
- ověřit/doplnit v `index.html`

---

## 3. Soubory

- `src/themes/themes/apokalypsa/index.ts` + `decorations.css`.
- `types.ts` — `ThemeId` + `'apokalypsa'`.
- `registry.ts` — import + zápis.
- `genres.ts` — žánr `Post-apokalypsa` → `theme: 'apokalypsa'`.

## 4. Assety

Pozadí — `public/themes/backgrounds/apokalypsa.webp` + thumbnail (autor dle [prompts-5.7g-postapo-assets.md](./prompts-5.7g-postapo-assets.md)). Ornamenty CSS/SVG.

## 5. Out of scope

- Ostatní žánrové skiny. JS efekty — `apokalypsa` je CSS-only.

## 6. Acceptance kritéria

1. `ThemeId` obsahuje `'apokalypsa'`; `getTheme('apokalypsa')` vrací skin (`scope: 'world'`).
2. `index.ts` kompletní `vars`; `decorations.css` originální.
3. `themeForGenre('Post-apokalypsa')` → `'apokalypsa'`.
4. `background`/`thumbnail` bez 404.
5. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
6. `mobil-desktop` audit.

## 7. Otevřené body

1. **Paleta** §2.2 — souhlas, nebo posun?
2. **Font** — `Oswald` + `Spectral`, nebo jiná dvojice?
3. **Pozadí** — po schválení vygeneruješ dle prompt souboru.
