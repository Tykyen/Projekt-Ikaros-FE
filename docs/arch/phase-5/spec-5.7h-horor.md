# Spec 5.7h — Skin „Horor"

**Status:** ✅ Implementováno (2026-05-19)
**Rozsah:** FE — nový světový skin `horor`: `index.ts` + `decorations.css`, registrace, napojení žánru; pozadí dle prompt souboru
**Větev:** `main`
**Velikost:** ~6 souborů
**Autor:** PJ + Claude
**Datum:** 2026-05-19
**Souvisí:** master [spec-5.7.md](./spec-5.7.md). Prompt assetů: [prompts-5.7h-horor-assets.md](./prompts-5.7h-horor-assets.md)

---

## 1. Cíl

Žánrový skin `horor` pro žánr **Horor**. Nálada: **strašidelný dům — tma a svíčka**. Klaustrofobní strach, opuštěnost, slábnoucí světlo.

---

## 2. Vizuální identita (design audit `frontend-design`, 2026-05-19)

### 2.1 Reference look

**Opuštěné sídlo ve tmě** — prázdné pokoje, prach, pavučiny, jediná svíčka vrhající slabé chvějivé světlo do hluboké tmy. Tísnivé, tiché, klaustrofobní.

**Atmosféra:** `Opuštěné sídlo — slábnoucí svíčka, prach a tma za každými dveřmi`

**NE:** gotická vznešenost / krvavě rudá (`dark-fantasy`), neon, syté barvy, gore. Tady tma a slabý jantar.

### 2.2 Paleta (přesné hex)

| Role | Hodnota |
|---|---|
| bg primary / secondary | `#090807` / `#14110d` |
| overlay | `linear-gradient(180deg, rgba(5,4,3,.25) 0%, rgba(5,4,3,.6) 100%)` |
| surface / strong / soft | `rgba(20,17,13,.8)` / `rgba(7,6,5,.94)` / `rgba(34,28,20,.46)` |
| accent — slábnoucí jantar svíčky | `#c89a52` · bright `#e8c884` |
| accent secondary — chorobná šeď | `#8a8478` |
| border / soft | `rgba(200,154,82,.44)` / `rgba(200,154,82,.22)` |
| border secondary | `rgba(138,132,120,.4)` |
| text — špinavá bílá | `#ccc6ba` · muted `#8a8276` · dim `#544e44` |
| heading | `#ddd4c2` |
| glow jantar / šeď | `rgba(200,154,82,.34)` / `rgba(138,132,120,.26)` |

### 2.3 Signature ornament (CSS/SVG)

- **Chvějivé světlo svíčky** — pomalé nepravidelné kolísání jantarové záře (CSS `@keyframes` flicker na overlay, `prefers-reduced-motion` respekt)
- těžká černá vignette (tma za okraji, klaustrofobie)
- tlumený jantarový svit nadpisů
- panely 3D řeší jednotná vrstva (krok 5.8)

### 2.4 Font

- **display / logo:** `IM Fell English` — starý tiskový serif, neklidný a opotřebovaný
- **body:** `Cormorant Garamond` — tlumený serif
- ověřit/doplnit v `index.html`

---

## 3. Soubory

- `src/themes/themes/horor/index.ts` + `decorations.css`.
- `types.ts` — `ThemeId` + `'horor'`.
- `registry.ts` — import + zápis.
- `genres.ts` — žánr `Horor` → `theme: 'horor'`.

## 4. Assety

Pozadí — `public/themes/backgrounds/horor.webp` + thumbnail (autor dle [prompts-5.7h-horor-assets.md](./prompts-5.7h-horor-assets.md)). Ornamenty CSS.

## 5. Out of scope

- Ostatní žánrové skiny. JS efekty — `horor` je CSS-only (flicker = CSS animace).

## 6. Acceptance kritéria

1. `ThemeId` obsahuje `'horor'`; `getTheme('horor')` vrací skin (`scope: 'world'`).
2. `index.ts` kompletní `vars`; `decorations.css` originální.
3. `themeForGenre('Horor')` → `'horor'`.
4. `background`/`thumbnail` bez 404.
5. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
6. `mobil-desktop` audit.

## 7. Otevřené body

1. **Paleta** §2.2 — souhlas, nebo posun?
2. **Font** — `IM Fell English` + `Cormorant Garamond`, nebo jiná dvojice?
3. **Pozadí** — po schválení vygeneruješ dle prompt souboru.
