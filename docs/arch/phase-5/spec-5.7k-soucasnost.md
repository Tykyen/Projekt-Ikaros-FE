# Spec 5.7k — Skin „Současnost" (slug `moderni`)

**Status:** ✅ Implementováno (2026-05-19)
**Rozsah:** FE — nový světový skin `moderni`: `index.ts` + `decorations.css`, registrace, napojení žánru; pozadí dle prompt souboru
**Větev:** `main`
**Velikost:** ~6 souborů
**Autor:** PJ + Claude
**Datum:** 2026-05-19
**Souvisí:** master [spec-5.7.md](./spec-5.7.md). Prompt assetů: [prompts-5.7k-soucasnost-assets.md](./prompts-5.7k-soucasnost-assets.md)

---

## 1. Cíl

Žánrový skin `moderni` pro žánr **Současnost**. Nálada: **každodenní útulno** — teplý obytný interiér za večera.

> Slug `moderni`. Skin zůstává **tmavý** (glass tokeny počítají s tmavým podkladem) — útulný večerní interiér, ne světlé téma.

---

## 2. Vizuální identita (design audit `frontend-design`, 2026-05-19)

### 2.1 Reference look

**Útulný obývací pokoj za večera** — teplé světlo lampy, dřevěné police s knihami, měkký textil, hrnek kávy. Klidné, lidské, současné. Žádné drama.

**Atmosféra:** `Útulný večerní interiér — teplé světlo lampy, dřevo a měkký textil`

**NE:** dramatické žánry, neon, syté barvy, fantasy. Tady tlumené teplé zemšté tóny.

### 2.2 Paleta (přesné hex)

| Role | Hodnota |
|---|---|
| bg primary / secondary | `#15110d` / `#221c15` |
| overlay | `linear-gradient(180deg, rgba(13,10,7,.16) 0%, rgba(13,10,7,.42) 100%)` |
| surface / strong / soft | `rgba(34,28,21,.78)` / `rgba(14,11,8,.9)` / `rgba(52,42,32,.46)` |
| accent — teplá terakota | `#c87e54` · bright `#e3a378` |
| accent secondary — šalvějová zeleň | `#7d9478` |
| border / soft | `rgba(200,126,84,.44)` / `rgba(200,126,84,.24)` |
| border secondary | `rgba(125,148,120,.4)` |
| text — krémová | `#e6ddcd` · muted `#ab9f8a` · dim `#675c4a` |
| heading | `#f0e8d6` |
| glow terakota / šalvěj | `rgba(200,126,84,.32)` / `rgba(125,148,120,.26)` |

### 2.3 Signature ornament (CSS/SVG)

- **Teplý kruh světla lampy** — měkká teplá záře z horního rohu (CSS radiální gradient, klidné, statické)
- jemný teplý svit nadpisů (měkký, útulný)
- panely 3D řeší jednotná vrstva (krok 5.8)

### 2.4 Font

- **display / logo:** `Fraunces` — moderní charakterní serif (teplý, ne strohý)
- **body:** `Newsreader` — příjemný čtecí serif
- ověřit/doplnit v `index.html`

---

## 3. Soubory

- `src/themes/themes/moderni/index.ts` + `decorations.css`.
- `types.ts` — `ThemeId` + `'moderni'`.
- `registry.ts` — import + zápis.
- `genres.ts` — žánr `Současnost` → `theme: 'moderni'`.

## 4. Assety

Pozadí — `public/themes/backgrounds/moderni.webp` + thumbnail (autor dle [prompts-5.7k-soucasnost-assets.md](./prompts-5.7k-soucasnost-assets.md)). Ornamenty CSS.

## 5. Out of scope

- Ostatní žánrové skiny. JS efekty — `moderni` je CSS-only.

## 6. Acceptance kritéria

1. `ThemeId` obsahuje `'moderni'`; `getTheme('moderni')` vrací skin (`scope: 'world'`).
2. `index.ts` kompletní `vars`; `decorations.css` originální.
3. `themeForGenre('Současnost')` → `'moderni'`.
4. `background`/`thumbnail` bez 404.
5. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
6. `mobil-desktop` audit.

## 7. Otevřené body

1. **Paleta** §2.2 — souhlas, nebo posun?
2. **Font** — `Fraunces` + `Newsreader`, nebo jiná dvojice?
3. **Pozadí** — po schválení vygeneruješ dle prompt souboru.
