# Spec 5.7e — Skin „Cyberpunk"

**Status:** ✅ Implementováno (2026-05-19)
**Rozsah:** FE — nový světový skin `cyberpunk`: `index.ts` + `decorations.css`, registrace, napojení žánru; pozadí dodá autor dle prompt souboru
**Větev:** `main`
**Velikost:** ~6 souborů
**Autor:** PJ + Claude
**Datum:** 2026-05-19
**Souvisí:** master [spec-5.7.md](./spec-5.7.md). Prompt assetů: [prompts-5.7e-cyberpunk-assets.md](./prompts-5.7e-cyberpunk-assets.md)

---

## 1. Cíl

Žánrový skin `cyberpunk` pro žánr **Cyberpunk**. Nálada: **corpo dystopie — žlutá/černá**. Kyselý neon, ostré hrany, korporátní chlad — odlišný od fialového `ikaros`.

> Slug `cyberpunk` (platformový skin drží `kyberpunk` s „k" — bez kolize).

---

## 2. Vizuální identita (design audit `frontend-design`, 2026-05-19)

### 2.1 Reference look

**Korporátní megablok za noci** — ostrá kyselá žluť proti uhelné černi, varovné šrafování, technické značky, hutná hrana. Cyberpunk 2077 corpo estetika. Bez romantiky — chladná, agresivní.

**Atmosféra:** `Korporátní megablok — kyselý žlutý neon a varovné šrafy nad uhelnou tmou`

**NE:** fialová (`ikaros`), cyan (`vesmir`), teplé zlato (`fantasy`), romantický Blade Runner déšť, generická AI cyberpunk.

### 2.2 Paleta (přesné hex)

| Role | Hodnota |
|---|---|
| bg primary / secondary | `#0a0a08` / `#16160f` |
| overlay | `linear-gradient(180deg, rgba(8,8,5,.2) 0%, rgba(8,8,5,.5) 100%)` |
| surface / strong / soft | `rgba(22,22,14,.78)` / `rgba(10,10,7,.92)` / `rgba(40,38,20,.46)` |
| accent — kyselá žluť | `#f0d020` · bright `#fff04a` |
| accent secondary — chladná ocel | `#7d8a96` |
| border / soft | `rgba(240,208,32,.5)` / `rgba(240,208,32,.26)` |
| border secondary | `rgba(125,138,150,.45)` |
| text — kovová bílá | `#e6e4d8` · muted `#9a988a` · dim `#5c5a4c` |
| heading | `#f4f0dc` |
| glow žlutá / ocel | `rgba(240,208,32,.4)` / `rgba(125,138,150,.3)` |

### 2.3 Signature ornament (CSS/SVG)

- **Varovné šrafování** — žluto-černé diagonální hazard pruhy na okraji obrazovky (CSS `repeating-linear-gradient`)
- žlutý ostrý svit nadpisů (tvrdý, bez měkkého glow)
- panely 3D řeší jednotná vrstva (krok 5.8)

### 2.4 Font

- **display / logo:** `Chakra Petch` — technický hranatý sans, korporátní
- **body:** `Rajdhani` — technický condensed
- ověřit/doplnit v `index.html`

---

## 3. Soubory

- `src/themes/themes/cyberpunk/index.ts` + `decorations.css`.
- `types.ts` — `ThemeId` + `'cyberpunk'`.
- `registry.ts` — import + zápis.
- `genres.ts` — žánr `Cyberpunk` → `theme: 'cyberpunk'`.

## 4. Assety

Pozadí — `public/themes/backgrounds/cyberpunk.webp` + thumbnail (autor dle [prompts-5.7e-cyberpunk-assets.md](./prompts-5.7e-cyberpunk-assets.md)). Ornamenty CSS/SVG.

## 5. Out of scope

- Ostatní žánrové skiny. JS efekty — `cyberpunk` je CSS-only.

## 6. Acceptance kritéria

1. `ThemeId` obsahuje `'cyberpunk'`; `getTheme('cyberpunk')` vrací skin (`scope: 'world'`).
2. `index.ts` kompletní `vars`; `decorations.css` originální.
3. `themeForGenre('Cyberpunk')` → `'cyberpunk'`.
4. `background`/`thumbnail` bez 404.
5. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
6. `mobil-desktop` audit.

## 7. Otevřené body

1. **Paleta** §2.2 — souhlas, nebo posun?
2. **Font** — `Chakra Petch` + `Rajdhani`, nebo jiná dvojice?
3. **Pozadí** — po schválení vygeneruješ dle prompt souboru.
