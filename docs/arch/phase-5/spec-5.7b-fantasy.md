# Spec 5.7b — Skin „Fantasy"

**Status:** ✅ Implementováno (2026-05-19)
**Rozsah:** FE — nový světový skin `fantasy`: `index.ts` + `decorations.css`, registrace, napojení žánru; pozadí dodá autor dle prompt souboru
**Větev:** `main`
**Velikost:** ~6 souborů — `themes/fantasy/index.ts` + `decorations.css`, `types.ts`, `registry.ts`, `genres.ts`, pozadí webp + test
**Autor:** PJ + Claude
**Datum:** 2026-05-18
**Souvisí:** master [spec-5.7.md](./spec-5.7.md), infrastruktura [spec-5.7a](./spec-5.7a-infrastruktura.md). Prompt assetů: [prompts-5.7b-fantasy-assets.md](./prompts-5.7b-fantasy-assets.md)

---

## 1. Cíl

První žánrový skin reformy — `fantasy` pro žánr **Fantasy**. Nálada: **vznešená high fantasy** — elfí elegance, honosnost bez přeplácanosti.

---

## 2. Vizuální identita (design audit `frontend-design`, 2026-05-18)

### 2.1 Reference look

**Elfí síň za hvězdné noci** — Rivendell / Lothlórien: vysoké kamenné klenby, zlatý heraldický filigrán, smaragdové vitráže, slonovinové světlo. Klid a vznešenost, ne bitevní dramatika.

**Atmosféra:** `Vznešená elfí síň — zlatý filigrán a smaragdové světlo pod hvězdnou klenbou`

**NE:** generická D&D fantasy, hnědý pergamen, Hogwarts, kýčovitý medieval, neon. **NE** fialová (to je `ikaros`), **NE** ponurá mlžná zeleň (to by byla „temná lesní magie").

### 2.2 Paleta (přesné hex)

| Role | Hodnota | Použití |
|---|---|---|
| bg primary / secondary | `#0b1510` / `#13251c` | noční smaragdová čerň |
| overlay | `linear-gradient(180deg, rgba(8,18,13,.15) 0%, rgba(8,18,13,.45) 100%)` | jemné ztmavení |
| surface / strong / soft | `rgba(16,32,24,.74)` / `rgba(8,18,13,.9)` / `rgba(28,52,40,.46)` | glass panely |
| accent — zlato | `#e3c66b` | rámečky, akcenty |
| accent bright | `#f6e4a0` | jiskra na zlatě |
| accent secondary — smaragd | `#6fd3a8` | druhý akcent, glow |
| border / soft | `rgba(227,198,107,.5)` / `rgba(227,198,107,.26)` | zlaté okraje |
| border secondary | `rgba(111,211,168,.45)` | smaragdový okraj |
| text — slonová kost | `#f0e8d4` | běžný text |
| text muted / dim | `#aebfa8` / `#6a7a68` | tlumený |
| heading — vznešené zlato | `#f4dd92` | nadpisy |
| glow gold / emerald | `rgba(227,198,107,.4)` / `rgba(111,211,168,.36)` | záře |

### 2.3 Signature ornament (CSS/SVG — žádné rastry)

**Zlatý elfí filigrán** — tenká art-nouveau zlatá linka s lístky:
- rohové filigrány panelů (`decorations.css`, inline SVG `data-uri`)
- jemný zlatý glow + smaragdový druhotný svit nadpisů
- hvězdný třpyt v pozadí je součást rastrového pozadí, ne CSS

Klid — žádné hektické animace; nanejvýš velmi pomalý glow „dech" (`prefers-reduced-motion` respekt).

### 2.4 Font

- **display / logo:** `Marcellus` — vznešený římský serif, elfí elegance (odlišný od `Cinzel` ostatních skinů)
- **body:** `Cormorant Garamond` — jemný humanistický serif
- ověřit/doplnit v `index.html` při implementaci

---

## 3. Soubory

- `src/themes/themes/fantasy/index.ts` — `Theme`, `scope: 'world'`, `vars` přes `buildSkinVars` z palety §2.2, `fonts`, `background`/`thumbnail`, `decorationsModule`.
- `src/themes/themes/fantasy/decorations.css` — ornamenty §2.3, scoped `[data-theme='fantasy']`. Originální (žádné sdílení s jiným skinem).
- `types.ts` — `ThemeId` + `'fantasy'`.
- `registry.ts` — import + zápis; `THEMES` 22 → 23.
- `genres.ts` — žánr `Fantasy` přemapovat `theme: 'ikaros'` → `'fantasy'`.

## 4. Assety

- **Pozadí** — `public/themes/backgrounds/fantasy.webp` + `thumbnails/fantasy.webp`. Generuje autor dle [prompts-5.7b-fantasy-assets.md](./prompts-5.7b-fantasy-assets.md), zdroj do `assets-source/themes/fantasy/background.png`, převod skriptem (sharp → webp).
- Ornamenty — CSS/SVG, žádné rastry.

---

## 5. Out of scope

- Ostatní žánrové skiny (5.7c+).
- JS efekty — `fantasy` je CSS-only (žádný `effect`).

## 6. Acceptance kritéria

1. `ThemeId` obsahuje `'fantasy'`; `THEMES` má 23; `listThemes('world')` → `ikaros` + `fantasy`.
2. `getTheme('fantasy')` vrací skin (ne fallback); `scope: 'world'`.
3. `index.ts` má kompletní `vars`; `decorations.css` originální.
4. `themeForGenre('Fantasy')` → `'fantasy'`.
5. `background`/`thumbnail` bez 404.
6. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
7. `mobil-desktop` audit skinu.

## 7. Test plán

- `registry` — `THEMES` 23; `getTheme('fantasy').scope === 'world'`.
- `themeForGenre('Fantasy')` → `'fantasy'`; ostatní žánry stále `ikaros`.
- Smoke: svět se žánrem Fantasy / ručně zvolený skin → zlato-smaragdový vzhled.

## 8. Otevřené body

1. **Paleta** §2.2 — souhlas, nebo posun (víc zlata / víc smaragdu / jiný podklad)?
2. **Font** — `Marcellus` + `Cormorant Garamond`, nebo jiná dvojice?
3. **Pozadí** — po schválení vygeneruješ dle prompt souboru.
