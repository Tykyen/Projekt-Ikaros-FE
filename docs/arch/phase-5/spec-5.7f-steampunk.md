# Spec 5.7f — Skin „Steampunk"

**Status:** ✅ Implementováno (2026-05-19)
**Rozsah:** FE — nový světový skin `steampunk`: `index.ts` + `decorations.css`, registrace, napojení žánru; pozadí dle prompt souboru
**Větev:** `main`
**Velikost:** ~6 souborů
**Autor:** PJ + Claude
**Datum:** 2026-05-19
**Souvisí:** master [spec-5.7.md](./spec-5.7.md). Prompt assetů: [prompts-5.7f-steampunk-assets.md](./prompts-5.7f-steampunk-assets.md)

---

## 1. Cíl

Žánrový skin `steampunk` pro žánr **Steampunk**. Nálada: **parní metropole** — kouřící komíny, vzducholodě, smog, měď a mosaz.

---

## 2. Vizuální identita (design audit `frontend-design`, 2026-05-19)

### 2.1 Reference look

**Parní metropole za soumraku** — komíny chrlící páru, vzducholodě nad střechami, mosazné a měděné konstrukce, smogová mlha v jantarovém světle. Viktoriánská průmyslová estetika.

**Atmosféra:** `Parní metropole — měděné komíny, vzducholodě a jantarový smog`

**NE:** zlato/smaragd (`fantasy`), kyselá žlutá (`cyberpunk`), fialová (`ikaros`), čisté sci-fi, generická AI steampunk.

### 2.2 Paleta (přesné hex)

| Role | Hodnota |
|---|---|
| bg primary / secondary | `#16100a` / `#241a10` |
| overlay | `linear-gradient(180deg, rgba(14,9,5,.2) 0%, rgba(14,9,5,.5) 100%)` |
| surface / strong / soft | `rgba(36,26,16,.78)` / `rgba(16,11,6,.92)` / `rgba(56,40,22,.46)` |
| accent — leštěná mosaz | `#c8893a` · bright `#e6b260` |
| accent secondary — měděná patina | `#5fa890` |
| border / soft | `rgba(200,137,58,.5)` / `rgba(200,137,58,.26)` |
| border secondary | `rgba(95,168,144,.42)` |
| text — pergamenová | `#e8dcc4` · muted `#ac9a78` · dim `#6a5c40` |
| heading | `#f0e4c8` |
| glow mosaz / patina | `rgba(200,137,58,.4)` / `rgba(95,168,144,.3)` |

### 2.3 Signature ornament (CSS/SVG)

- **Stoupající pára** — jemné měkké obláčky páry stoupající od dolního okraje (CSS gradient + pomalá animace, `prefers-reduced-motion` respekt)
- mosazný teplý svit nadpisů
- panely 3D řeší jednotná vrstva (krok 5.8)

### 2.4 Font

- **display / logo:** `Cinzel` — římský serif (sdíleno; vrytý mosazný nápis)
- **body:** `Spectral` — viktoriánský čtecí serif
- ověřit/doplnit v `index.html`

---

## 3. Soubory

- `src/themes/themes/steampunk/index.ts` + `decorations.css`.
- `types.ts` — `ThemeId` + `'steampunk'`.
- `registry.ts` — import + zápis.
- `genres.ts` — žánr `Steampunk` → `theme: 'steampunk'`.

## 4. Assety

Pozadí — `public/themes/backgrounds/steampunk.webp` + thumbnail (autor dle [prompts-5.7f-steampunk-assets.md](./prompts-5.7f-steampunk-assets.md)). Ornamenty CSS.

## 5. Out of scope

- Ostatní žánrové skiny. JS efekty — `steampunk` je CSS-only.

## 6. Acceptance kritéria

1. `ThemeId` obsahuje `'steampunk'`; `getTheme('steampunk')` vrací skin (`scope: 'world'`).
2. `index.ts` kompletní `vars`; `decorations.css` originální.
3. `themeForGenre('Steampunk')` → `'steampunk'`.
4. `background`/`thumbnail` bez 404.
5. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
6. `mobil-desktop` audit.

## 7. Otevřené body

1. **Paleta** §2.2 — souhlas, nebo posun?
2. **Font** — `Cinzel` + `Spectral`, nebo jiná dvojice?
3. **Pozadí** — po schválení vygeneruješ dle prompt souboru.
