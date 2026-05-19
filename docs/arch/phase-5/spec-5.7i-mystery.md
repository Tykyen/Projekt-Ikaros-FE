# Spec 5.7i — Skin „Mystery"

**Status:** ✅ Implementováno (2026-05-19)
**Rozsah:** FE — nový světový skin `mystery`: `index.ts` + `decorations.css`, registrace, napojení žánru; pozadí dle prompt souboru
**Větev:** `main`
**Velikost:** ~6 souborů
**Autor:** PJ + Claude
**Datum:** 2026-05-19
**Souvisí:** master [spec-5.7.md](./spec-5.7.md). Prompt assetů: [prompts-5.7i-mystery-assets.md](./prompts-5.7i-mystery-assets.md)

---

## 1. Cíl

Žánrový skin `mystery` pro žánr **Mystery**. Nálada: **detektivní noir** — deštivá městská noc, žluté světlo lampy, vyšetřování.

---

## 2. Vizuální identita (design audit `frontend-design`, 2026-05-19)

### 2.1 Reference look

**Deštivá ulice za noci** — mokrá dlažba odrážející žluté světlo pouliční lampy, mlha, cigaretový kouř, kontrastní noirové stíny. Šedomodrá tma proťatá teplým jantarem lampy.

**Atmosféra:** `Deštivá noirová ulice — žluté světlo lampy v šedomodré mlze`

**NE:** neon (`ikaros`, `cyberpunk`), syté barvy, fantasy. Tady tlumená šedomodrá + jeden teplý jantar.

### 2.2 Paleta (přesné hex)

| Role | Hodnota |
|---|---|
| bg primary / secondary | `#0c0f14` / `#161b24` |
| overlay | `linear-gradient(180deg, rgba(8,10,14,.2) 0%, rgba(8,10,14,.5) 100%)` |
| surface / strong / soft | `rgba(22,27,36,.78)` / `rgba(9,12,17,.92)` / `rgba(34,42,54,.46)` |
| accent — jantar lampy | `#d8a24a` · bright `#f0c878` |
| accent secondary — studená noirová modř | `#5e7488` |
| border / soft | `rgba(216,162,74,.46)` / `rgba(216,162,74,.24)` |
| border secondary | `rgba(94,116,136,.42)` |
| text — kalná bílá | `#d2d4d8` · muted `#8a909c` · dim `#525964` |
| heading | `#e4e2da` |
| glow jantar / modř | `rgba(216,162,74,.34)` / `rgba(94,116,136,.3)` |

### 2.3 Signature ornament (CSS/SVG)

- **Déšť** — jemné šikmé deštivé čáry stékající plochou (CSS `repeating-linear-gradient` + animace, `prefers-reduced-motion` respekt)
- jantarový svit nadpisů (jako světlo lampy)
- panely 3D řeší jednotná vrstva (krok 5.8)

### 2.4 Font

- **display / logo:** `Cinzel` — vrytý serif (titulky případu)
- **body:** `Crimson Pro` — klidný čtecí serif (spisy, deníky)
- ověřit/doplnit v `index.html`

---

## 3. Soubory

- `src/themes/themes/mystery/index.ts` + `decorations.css`.
- `types.ts` — `ThemeId` + `'mystery'`.
- `registry.ts` — import + zápis.
- `genres.ts` — žánr `Mystery` → `theme: 'mystery'`.

## 4. Assety

Pozadí — `public/themes/backgrounds/mystery.webp` + thumbnail (autor dle [prompts-5.7i-mystery-assets.md](./prompts-5.7i-mystery-assets.md)). Ornamenty CSS.

## 5. Out of scope

- Ostatní žánrové skiny. JS efekty — `mystery` je CSS-only (déšť = CSS animace).

## 6. Acceptance kritéria

1. `ThemeId` obsahuje `'mystery'`; `getTheme('mystery')` vrací skin (`scope: 'world'`).
2. `index.ts` kompletní `vars`; `decorations.css` originální.
3. `themeForGenre('Mystery')` → `'mystery'`.
4. `background`/`thumbnail` bez 404.
5. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
6. `mobil-desktop` audit.

## 7. Otevřené body

1. **Paleta** §2.2 — souhlas, nebo posun?
2. **Font** — `Cinzel` + `Crimson Pro`, nebo jiná dvojice?
3. **Pozadí** — po schválení vygeneruješ dle prompt souboru.
