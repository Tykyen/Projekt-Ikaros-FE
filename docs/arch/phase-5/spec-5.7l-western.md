# Spec 5.7l — Skin „Western"

**Status:** ✅ Implementováno (2026-05-19)
**Rozsah:** FE — nový světový skin `western`: `index.ts` + `decorations.css`, registrace, napojení žánru; pozadí dle prompt souboru. **Poslední žánrový skin reformy 5.7.**
**Větev:** `main`
**Velikost:** ~6 souborů
**Autor:** PJ + Claude
**Datum:** 2026-05-19
**Souvisí:** master [spec-5.7.md](./spec-5.7.md). Prompt assetů: [prompts-5.7l-western-assets.md](./prompts-5.7l-western-assets.md)

---

## 1. Cíl

Žánrový skin `western` pro žánr **Western**. Nálada: **městečko na hranici** — prašné dřevěné pohraniční městečko za soumraku.

---

## 2. Vizuální identita (design audit `frontend-design`, 2026-05-19)

### 2.1 Reference look

**Prašná ulice pohraničního městečka za soumraku** — dřevěné fasády, salón, veranda, kůl na uvázání koní, prach ve vzduchu, dlouhé teplé světlo zapadajícího slunce. Opotřebované, lidské, opravdové.

**Atmosféra:** `Prašné pohraniční městečko — vybledlé dřevo a teplé soumračné světlo`

**NE:** mosazný průmysl (`steampunk`), barokní zlato (`historie`), zarostlé ruiny (`apokalypsa`), neon, syté barvy.

### 2.2 Paleta (přesné hex)

| Role | Hodnota |
|---|---|
| bg primary / secondary | `#171009` / `#241a10` |
| overlay | `linear-gradient(180deg, rgba(15,10,5,.18) 0%, rgba(15,10,5,.46) 100%)` |
| surface / strong / soft | `rgba(36,26,16,.78)` / `rgba(15,10,6,.9)` / `rgba(58,42,26,.46)` |
| accent — soumrační oranž | `#cf8a44` · bright `#e8ad6c` |
| accent secondary — vyprahlá šalvěj | `#8a8a64` |
| border / soft | `rgba(207,138,68,.44)` / `rgba(207,138,68,.24)` |
| border secondary | `rgba(138,138,100,.4)` |
| text — písková | `#e6d8bc` · muted `#ac9c78` · dim `#6a5c42` |
| heading | `#f0e4c2` |
| glow oranž / šalvěj | `rgba(207,138,68,.34)` / `rgba(138,138,100,.26)` |

### 2.3 Signature ornament (CSS/SVG)

- **Prach ve vzduchu** — jemné částečky prachu pomalu vznášející se v teplém světle (CSS, `prefers-reduced-motion` respekt)
- teplý soumrační svit nadpisů
- panely 3D řeší jednotná vrstva (krok 5.8)

### 2.4 Font

- **display / logo:** `Rye` — opotřebovaný western dřevotiskový font
- **body:** `Spectral` — klidný serif (čitelnost)
- ověřit/doplnit v `index.html`

---

## 3. Soubory

- `src/themes/themes/western/index.ts` + `decorations.css`.
- `types.ts` — `ThemeId` + `'western'`.
- `registry.ts` — import + zápis.
- `genres.ts` — žánr `Western` → `theme: 'western'`.

## 4. Assety

Pozadí — `public/themes/backgrounds/western.webp` + thumbnail (autor dle [prompts-5.7l-western-assets.md](./prompts-5.7l-western-assets.md)). Ornamenty CSS.

## 5. Out of scope

- JS efekty — `western` je CSS-only.

## 6. Acceptance kritéria

1. `ThemeId` obsahuje `'western'`; `getTheme('western')` vrací skin (`scope: 'world'`).
2. `index.ts` kompletní `vars`; `decorations.css` originální.
3. `themeForGenre('Western')` → `'western'`.
4. `background`/`thumbnail` bez 404.
5. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
6. `mobil-desktop` audit.
7. **Všech 12 world skinů hotovo** — `themeForGenre` mapuje všech 11 žánrů 1:1, žádný už nepadá na `ikaros` fallback.

## 7. Otevřené body

1. **Paleta** §2.2 — souhlas, nebo posun?
2. **Font** — `Rye` + `Spectral`, nebo jiná dvojice?
3. **Pozadí** — po schválení vygeneruješ dle prompt souboru.
