# Plán 1.0k — Nemrtví visual upgrade

**Datum:** 2026-05-10
**Status:** ⏳ Čeká na schválení
**Spec:** [`spec-1.0k-nemrtvi-upgrade.md`](spec-1.0k-nemrtvi-upgrade.md) ✅
**Asset prompty:** [`prompts-1.0k-nemrtvi-assets.md`](prompts-1.0k-nemrtvi-assets.md) ✅
**Pořadí prací:** Pre-flight → Asset pipeline → Tokens → Decorations → Animace → Mobile breakpoints → A11y polish → Test sweep
**Branch:** `feat/krok-1.0k-nemrtvi-upgrade`
**Single PR** (per Q10 A — kompletní skin v jednom kroku)

---

## 0. Pre-flight

### 0.1 Vstupní assety (✅ všechny dodány)

| Asset | Status | Zdroj | Cílové rozměry |
|---|---|---|---|
| `logo.png` | ✅ user dodal | `assets-source/themes/Nemrtví/logo.png` | zachovat orig (1500×280) |
| `medailon.png` | ✅ user dodal | `assets-source/themes/Nemrtví/medailon.png` | zachovat orig (~600×740) |
| `corner-tl.png` | ✅ AI gen | `assets-source/themes/Nemrtví/corner-tl.png` | resize 256×256 |
| `divider-skull.png` | ✅ AI gen | `assets-source/themes/Nemrtví/divider-skull.png` | resize 600×140 |
| `skull-arch.png` | ✅ AI gen | `assets-source/themes/Nemrtví/skull-arch.png` | resize 1600×400 |
| `icon-uvodnik.png` | ✅ AI gen | `…/icon-uvodnik.png` | resize 96×96 |
| `icon-vytvorit-svet.png` | ✅ AI gen | `…/icon-vytvorit-svet.png` | resize 96×96 |
| `icon-diskuze.png` | ✅ AI gen | `…/icon-diskuze.png` | resize 96×96 |
| `icon-clanky.png` | ✅ AI gen | `…/icon-clanky.png` | resize 96×96 |
| `icon-galerie.png` | ✅ AI gen | `…/icon-galerie.png` | resize 96×96 |
| `icon-napoveda.png` | ✅ AI gen | `…/icon-napoveda.png` | resize 96×96 |
| `icon-hospoda.png` | ✅ AI gen | `…/icon-hospoda.png` | resize 96×96 |

**Public BG** `public/themes/backgrounds/nemrtvi.webp` ✅ existuje, sladěn s assety, **neměníme**.
**Thumbnail** `public/themes/thumbnails/nemrtvi.webp` ✅ existuje.

### 0.2 ⚠️ Folder rename — povinný před optimize

Source folder má diakritiku: `assets-source/themes/Nemrtví/`. Convention (per spec 1.6b — *"slug filenames, žádná diakritika"*) je lowercase slug: **`nemrtvi/`**.

**`optimize-theme-assets.mjs`** (řádek 132–137) iteruje subdirs a používá název složky jako `themeId`. Pokud zůstane `Nemrtví`, výstup půjde do `public/themes/Nemrtví/decor/` (wrong) místo `public/themes/nemrtvi/decor/` (CSS path).

**Akce:**
```powershell
Move-Item "assets-source/themes/Nemrtví" "assets-source/themes/nemrtvi"
```

Verifikace: `assets-source/themes/nemrtvi/` obsahuje 12 PNG souborů (logo + medailon + 10 AI assetů).

### 0.3 Verifikace v kódu (žádný shared edit)

- [x] `data-nav-key` atribut **už existuje** v [`IkarosLayout.tsx`](../../../src/components/layout/IkarosLayout.tsx) — z pergamen 1.0i
- [x] Nav keys: `uvodnik`, `napoveda`, `diskuze`, `clanky`, `galerie`, `vytvorit-svet`, `hospoda` — sdíleno
- [x] `data-frame-panel` atributy `sidebar` / `right` / `card` / `novinky` — existují
- [x] `data-andel-medallion` atribut — existuje
- [x] `nemrtviTheme` je v registry ([`registry.ts`](../../../src/themes/registry.ts))
- [x] **Žádný edit** v `IkarosLayout`, `IkarosCard`, `CornerOrnament`, `WelcomeHero`, `DashboardPage`, `RightPanel`, `NovinkyPanel`, shared komponentách (čisto CSS upgrade přes `[data-theme="nemrtvi"]`)

### 0.4 Akcepční podmínka regrese

21 ostatních témat (pergamen, hospoda, modré nebe, zlatý standard, sci-fi, bílá, …) **vizuálně identické** s pre-1.0k. Verifikace: `npm run dev` → manuálně cyklit dropdown switcher přes všech 22 témat → screenshot porovnání s pre-merge.

### 0.5 Font dostupnost

Verifikovat v [`index.html`](../../../index.html), které fonty jsou loaded. Per spec 4.10, nemrtví potřebuje **3 nové fonty**:

| Font | Status | Akce |
|---|---|---|
| **UnifrakturCook** | ❓ ověřit | pravděpodobně **přidat** (žádný jiný skin to nepoužívá) |
| **New Rocker** | ❓ ověřit | pravděpodobně **přidat** |
| **IM Fell DW Pica** | ❓ ověřit | pravděpodobně **přidat** (pergamen má `IM Fell English`, ne DW Pica) |

**Akce:** přidat Google Fonts `<link>` do `index.html` per existující pattern. Jeden link s `family=` URL spojuje všechny 3.

**Příklad:**
```html
<link
  href="https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&family=New+Rocker&family=IM+Fell+DW+Pica:ital@0;1&display=swap"
  rel="stylesheet"
/>
```

### 0.6 Audit-derived constraints (musí dodržet implementace)

| # | Pravidlo | Kde se ověří |
|---|---|---|
| N1 | Atmosférický overlay = pure linear darken (rgb 8,10,8) | `decorations.css` overlay sekce |
| N2 | Ghost-pulse 8s loop, opacity 0.6→1.0→0.6 (efektivní 0.13→0.22), z **horní třetiny** (ne zespoda) | `decorations.css` ::after sekce |
| N3 | Topbar `background-color: solid` (žádný backdrop-filter — heavy iron) | `decorations.css` topbar |
| N4 | Welcome card glassmorphism (backdrop-filter blur 8px) + skull-arch crown ::before nahoře | `decorations.css` welcome |
| N5 | Welcome + Novinky **mají** 4 corner-tl ornaments (mirror); ostatní panely **NE** | `decorations.css` welcome + novinky |
| N6 | Bone drop-cap "V" v `welcomeBody p:first-of-type::first-letter` — UnifrakturCook + multi-stack text-shadow | `decorations.css` welcome |
| N7 | Active NavItem = **recess-into-stone** (inset shadow), NE candle flicker, NE warm pulse | `decorations.css` NavItem |
| N8 | Hover NavItem/CTA = teal edge-light fill, NE shine sweep | `decorations.css` hover |
| N9 | Drifting dust motes 3 částice 30s loop, opacity 0.15 | `decorations.css` particles |
| N10 | "+" tlačítka v pravém panelu + "PŘIDAT NOVINKU" = CSS-only stone button (žádný custom asset) | `decorations.css` CTA |
| C11 | Mobile (≤768px): topbar icon-only, drawer mode, medailon 120×144, corner-welcome 56×56, dust motes hidden | `decorations.css` mobile |
| C12 | NavItem touch target ≥48px na mobile | `decorations.css` mobile |
| C13 | `reducedMotion: 'heavy'` v `nemrtviTheme` objektu (už nastaveno) | `index.ts` |
| C14 | Reduced motion vypíná ghost-pulse + dust motes + hover edge-light. Klik scale **zachovat**. | `decorations.css` reduced-motion |
| C15 | Focus visible: radium-bright outline 2px + ghost glow | `decorations.css` a11y |
| C16 | `lint:colors` clean — žádné hardcoded barvy mimo `index.ts` tokens | `npm run lint:colors` |

---

## 1. Asset pipeline

### 1.1 Krok 1 — Folder rename + WebP konverze

```powershell
# Rename source folder to slug
Move-Item "assets-source/themes/Nemrtví" "assets-source/themes/nemrtvi"

# Run optimize (chroma-key dark bg → transparent + WebP convert)
npm run themes:optimize
```

**Výstup:** `public/themes/nemrtvi/decor/*.webp` (12 souborů)

### 1.2 Krok 2 — Finalize script (resize na cílové rozměry)

Vytvořit `scripts/finalize-nemrtvi-assets.mjs` per `finalize-hospoda-assets.mjs` pattern:

```javascript
import sharp from 'sharp';
import path from 'node:path';
import { stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const DECOR = path.resolve('public/themes/nemrtvi/decor');

const TASKS = [
  { in: 'corner-tl.webp',          out: 'corner-tl.webp',          w: 256,  h: 256 },
  { in: 'divider-skull.webp',      out: 'divider-skull.webp',      w: 600,  h: 140, fit: 'contain', sharper: true },
  { in: 'skull-arch.webp',         out: 'skull-arch.webp',         w: 1600, h: 400, fit: 'contain' },
  { in: 'icon-uvodnik.webp',       out: 'icon-uvodnik.webp',       w: 96,   h: 96 },
  { in: 'icon-vytvorit-svet.webp', out: 'icon-vytvorit-svet.webp', w: 96,   h: 96 },
  { in: 'icon-diskuze.webp',       out: 'icon-diskuze.webp',       w: 96,   h: 96 },
  { in: 'icon-clanky.webp',        out: 'icon-clanky.webp',        w: 96,   h: 96 },
  { in: 'icon-galerie.webp',       out: 'icon-galerie.webp',       w: 96,   h: 96 },
  { in: 'icon-napoveda.webp',      out: 'icon-napoveda.webp',      w: 96,   h: 96 },
  { in: 'icon-hospoda.webp',       out: 'icon-hospoda.webp',       w: 96,   h: 96 },
];

async function processOne({ in: inFile, out: outFile, w, h, sharper, fit }) {
  const inPath = path.join(DECOR, inFile);
  const outPath = path.join(DECOR, outFile);
  if (!existsSync(inPath)) {
    console.warn(`✗ ${inFile} neexistuje, skip`);
    return;
  }
  const buf = await readFile(inPath);
  let pipeline = sharp(buf)
    .resize(w, h, { fit: fit || 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  pipeline = sharper
    ? pipeline.sharpen({ sigma: 0.6, m1: 1.0, m2: 0.5 })
    : pipeline.sharpen({ sigma: 0.4 });

  const outBuf = await pipeline.webp({ quality: 90, alphaQuality: 100 }).toBuffer();
  await writeFile(outPath, outBuf);

  const s = await stat(outPath);
  console.log(`✓ ${inFile} → ${outFile} (${w}×${h}, ${(s.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log('[nemrtvi] Finalizing decor assets...');
  for (const task of TASKS) {
    try { await processOne(task); }
    catch (err) { console.error(`✗ ${task.in}: ${err.message}`); }
  }
  console.log('[nemrtvi] Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
```

> **Pozn.:** `logo.webp` a `medailon.webp` v TASKS NEJSOU — ponecháváme orig rozměry (logo je horizontal banner s baked-in textem, downscale by ho rozmazal). To samé pergamen i hospoda.

Spustit:
```powershell
node scripts/finalize-nemrtvi-assets.mjs
```

### 1.3 Krok 3 — Verifikace

```powershell
Get-ChildItem "public/themes/nemrtvi/decor/" | Select-Object Name, Length
```

Očekáváno 12 .webp souborů, celkem cca 600–900 KB.

---

## 2. Theme tokens — `src/themes/themes/nemrtvi/index.ts`

Kompletní přepsání (z `~51` řádků na `~95`). Zachovat:
- `id: 'nemrtvi'`, `name: 'Nemrtví'`, `scope: 'both'`
- `thumbnail`, `background` cesty
- `decorationsModule: () => import('./decorations.css')`
- `reducedMotion: 'heavy'`

Změnit:
- `atmosphere`: nový popis ("Opuštěná nekromantická kapitula — blackened iron, kosti, ghost-green záře")
- `vars`: kompletní rewrite paletu (per spec 4.11) + asset URLs
- `fonts`: `{ logo: 'UnifrakturCook', display: 'New Rocker', body: 'IM Fell DW Pica' }`

**Snippet — kompletní `vars` blok** viz spec sekce 4.11. Implementuje se 1:1.

---

## 3. Decorations.css — kompletní rewrite

Přepis z 22 řádků na cca 700+ řádků per pergamen pattern.

### 3.1 Struktura sekcí (per pergamen 743-řádkový template)

```css
/* ── Nemrtví — Sedlec Kostnice o půlnoci, ossuary dread ── */

/* Sekce 1: Background overlay + ghost-pulse + dust motes */
[data-theme="nemrtvi"] { … background-image, --theme-bg-overlay … }
[data-theme="nemrtvi"][data-shell="ikaros"]::after { … ghost-pulse … }
@keyframes ghost-breathe { … }
@keyframes dust-drift { … }

/* Sekce 2: Topbar — solid blackened iron */
[data-theme="nemrtvi"] [data-frame-panel="topbar"] { … }
[data-theme="nemrtvi"] [data-frame-panel="topbar"]::after { … iron hairline … }

/* Sekce 3: Logo */
[data-theme="nemrtvi"] [data-logo] { … background-image: var(--asset-logo) … }

/* Sekce 4: Header buttons */
[data-theme="nemrtvi"] [data-header-button] { … stone tablet styling … }
[data-theme="nemrtvi"] [data-header-button]:hover { … teal edge-light … }
[data-theme="nemrtvi"] [data-header-button][aria-current="page"] { … active … }

/* Sekce 5: Glass panels (sidebar left + right) */
[data-theme="nemrtvi"] [data-frame-panel="sidebar"],
[data-theme="nemrtvi"] [data-frame-panel="right"] { … stone panels, žádné corner ornaments … }

/* Sekce 6: Welcome card — hero centerpiece */
[data-theme="nemrtvi"] [data-frame-panel="card"] { … glassmorphism … }
[data-theme="nemrtvi"] [data-frame-panel="card"]::before { … skull-arch crown … }
[data-theme="nemrtvi"] [data-frame-panel="card"] [data-corner="tl"],
…tr/bl/br { … corner-tl mirror via scaleX/Y … }

/* Sekce 7: Medailon */
[data-theme="nemrtvi"] [data-andel-medallion] { … background-image: var(--asset-medailon) … }

/* Sekce 8: Bone drop-cap */
[data-theme="nemrtvi"] .welcomeBody > p:first-of-type::first-letter { … UnifrakturCook + ghost-glow … }

/* Sekce 9: Welcome heading + body + signature */
[data-theme="nemrtvi"] .welcomeTitle { … New Rocker … }
[data-theme="nemrtvi"] .welcomeBody { … IM Fell DW Pica … }

/* Sekce 10: Section title (NAVIGACE, MOJE DISKUZE, …) */
[data-theme="nemrtvi"] [data-section-title] { … New Rocker uppercase … }

/* Sekce 11: Divider-skull mezi sekcemi */
[data-theme="nemrtvi"] [data-section-divider] { … background-image: var(--asset-divider-skull) … }

/* Sekce 12: NavItem */
[data-theme="nemrtvi"] [data-nav-item] { … stone tablet … }
[data-theme="nemrtvi"] [data-nav-item]:hover { … teal edge-light … }
[data-theme="nemrtvi"] [data-nav-item][aria-current="page"] { … recess-into-stone … }

/* Sekce 13: Nav icons (skrýt SVG, render asset) */
[data-theme="nemrtvi"] [data-nav-item] svg { display: none; }
[data-theme="nemrtvi"] [data-nav-item][data-nav-key="uvodnik"]::before {
  content: ''; background-image: var(--asset-icon-uvodnik); …
}
… (7× per icon-X)

/* Sekce 14: Right panel (ADMINISTRACE, MOJE DISKUZE, MOJE SVĚTY) */
[data-theme="nemrtvi"] [data-frame-panel="right"] [data-pj-badge] { … }
[data-theme="nemrtvi"] [data-frame-panel="right"] button[data-add-btn] { … CSS-only stone CTA … }

/* Sekce 15: Novinky panel */
[data-theme="nemrtvi"] [data-frame-panel="novinky"] { … stone glassmorphism + 4 corner-tl … }

/* Sekce 16: PŘIDAT NOVINKU button */
[data-theme="nemrtvi"] [data-novinky-add] { … CSS-only stone CTA … }

/* Sekce 17: Focus visible */
[data-theme="nemrtvi"] :focus-visible { … radium glow outline … }

/* Sekce 18: Scrollbar */
[data-theme="nemrtvi"] ::-webkit-scrollbar { … iron + ghost … }

/* Sekce 19: Tablet (≤1023px) breakpoints */
@media (max-width: 1023px) { [data-theme="nemrtvi"] … }

/* Sekce 20: Mobile (≤768px) breakpoints */
@media (max-width: 768px) { [data-theme="nemrtvi"] … }

/* Sekce 21: Reduced motion */
@media (prefers-reduced-motion: reduce) { [data-theme="nemrtvi"] … }

/* Sekce 22: Forced colors */
@media (forced-colors: active) { [data-theme="nemrtvi"] … }
```

### 3.2 Klíčové snippety

#### Ghost-pulse (signature animation)

```css
[data-theme="nemrtvi"][data-shell="ikaros"]::after {
  content: '';
  position: fixed;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 25%,
    rgba(95, 200, 168, 0.22) 0%,
    rgba(95, 200, 168, 0.08) 35%,
    transparent 65%
  );
  pointer-events: none;
  z-index: 0;
  animation: ghost-breathe 8s ease-in-out infinite;
}

@keyframes ghost-breathe {
  0%, 100% { opacity: 0.6; }
  50%      { opacity: 1.0; }
}
```

#### Skull-arch crown nad welcome card

```css
[data-theme="nemrtvi"] [data-frame-panel="card"] {
  position: relative; /* anchor pro ::before */
  /* … glassmorphism background … */
}

[data-theme="nemrtvi"] [data-frame-panel="card"]::before {
  content: '';
  position: absolute;
  top: -32px;
  left: 0;
  right: 0;
  height: 96px;
  background-image: var(--asset-skull-arch);
  background-size: contain;
  background-position: center top;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 2;
}
```

#### 4 corner-tl ornaments (mirror přes CSS)

```css
[data-theme="nemrtvi"] [data-frame-panel="card"] [data-corner="tl"],
[data-theme="nemrtvi"] [data-frame-panel="card"] [data-corner="tr"],
[data-theme="nemrtvi"] [data-frame-panel="card"] [data-corner="bl"],
[data-theme="nemrtvi"] [data-frame-panel="card"] [data-corner="br"] {
  background-image: var(--asset-corner);
  background-size: contain;
  background-repeat: no-repeat;
  width: 96px;
  height: 96px;
  position: absolute;
  pointer-events: none;
  z-index: 1;
}
[data-theme="nemrtvi"] [data-frame-panel="card"] [data-corner="tl"] { top: 8px; left: 8px; transform: none; }
[data-theme="nemrtvi"] [data-frame-panel="card"] [data-corner="tr"] { top: 8px; right: 8px; transform: scaleX(-1); }
[data-theme="nemrtvi"] [data-frame-panel="card"] [data-corner="bl"] { bottom: 8px; left: 8px; transform: scaleY(-1); }
[data-theme="nemrtvi"] [data-frame-panel="card"] [data-corner="br"] { bottom: 8px; right: 8px; transform: scale(-1, -1); }
```

#### Bone drop-cap "V"

```css
[data-theme="nemrtvi"] .welcomeBody > p:first-of-type::first-letter {
  font-family: 'UnifrakturCook', Georgia, serif;
  font-size: 4.2em;
  line-height: 0.85;
  float: left;
  padding: 0.05em 0.10em 0 0;
  color: #cdc098;
  text-shadow:
    0 0 0.04em rgba(0, 0, 0, 1),
    0 2px 0.06em rgba(0, 0, 0, 0.9),
    0 0 0.25em rgba(95, 200, 168, 0.35),
    0 0 0.5em rgba(95, 200, 168, 0.15);
}
```

#### Active NavItem — recess-into-stone

```css
[data-theme="nemrtvi"] [data-nav-item][aria-current="page"] {
  background: linear-gradient(180deg, rgba(8, 10, 8, 0.95) 0%, rgba(4, 6, 4, 0.98) 100%);
  border-color: var(--theme-ghost-teal);
  box-shadow:
    inset 0 0 12px rgba(95, 200, 168, 0.25),
    inset 2px 0 0 var(--theme-ghost-teal);
  color: var(--theme-ghost-radium);
  text-shadow: 0 0 8px rgba(124, 255, 174, 0.4);
}
```

### 3.3 Anti-color-leak rule

`lint:colors` musí projít — žádné hardcoded `#xxxxxx` v `decorations.css` mimo:
- `0` čísel (transparent fallbacks)
- explicit `rgba()` s var-color uvnitř? Ne, tohle nepojde. Všechny barvy přes `var(--*)`.

**Pravidlo:** každá barva v `decorations.css` MUSÍ být `var(--theme-*)` nebo `var(--*)`. Pokud potřebuju RGB tuple pro `rgba(…, alpha)`, musím definovat token `--theme-X-rgb: 95 200 168` a použít `rgba(var(--theme-X-rgb) / alpha)`.

> **Pozn.:** pergamen + hospoda už tohle dělají. Implementace bude stejný pattern.

---

## 4. Animace & motion

| Element | Implementace | Reduced-motion |
|---|---|---|
| Ghost-pulse | `::after` fixed + `@keyframes ghost-breathe` 8s | vypnuto (`animation: none`) |
| Dust motes | 3× `<div>` v `decorations.css` přes `body::before/::after` + 1× extra layer s `linear-gradient` particles + `@keyframes dust-drift` 30s linear, staggered přes `animation-delay` | vypnuto |
| Hover NavItem | `transition: box-shadow 300ms ease-out, border-color 300ms` | zachováno (transition není animation) |
| Active NavItem | static — žádné keyframes | static |
| Klik tlačítko | `transition: transform 150ms ease-out` + `:active { transform: scale(0.92); }` | **zachováno** (UX feedback) |

---

## 5. Mobile breakpoints

Per spec sekce 4.13. 4 breakpointy:

```css
@media (max-width: 1279px) {
  /* Tablet wide: corners zmenšeny, medailon 220×268 */
}
@media (max-width: 1023px) {
  /* Tablet: navItem padding zúžen, medailon 200×240, corner 80×80 */
}
@media (max-width: 768px) {
  /* Mobile: header icon-only, drawer mode, medailon 120×144, corner 56×56, dust motes hidden */
  [data-theme="nemrtvi"][data-shell="ikaros"] body::before,
  [data-theme="nemrtvi"][data-shell="ikaros"] body::after {
    display: none; /* dust motes hidden */
  }
}
@media (max-width: 480px) {
  /* Mobile small: TYKY + ODHLÁSIT do hamburger drawer */
}
```

---

## 6. A11y polish

### 6.1 Focus visible

```css
[data-theme="nemrtvi"] :focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px var(--bg-primary),
    0 0 0 4px var(--theme-ghost-radium),
    0 0 14px var(--theme-ghost-soft);
}
```

### 6.2 Reduced motion (sekce 21)

```css
@media (prefers-reduced-motion: reduce) {
  [data-theme="nemrtvi"][data-shell="ikaros"]::after {
    animation: none;
    opacity: 0.7; /* statická hodnota uprostřed cyklu */
  }
  [data-theme="nemrtvi"] [data-dust-mote] {
    display: none;
  }
  [data-theme="nemrtvi"] [data-nav-item],
  [data-theme="nemrtvi"] [data-header-button] {
    transition: none;
  }
  /* Klik scale zachovat — UX feedback */
}
```

### 6.3 Forced colors (sekce 22)

```css
@media (forced-colors: active) {
  [data-theme="nemrtvi"] [data-corner],
  [data-theme="nemrtvi"] [data-frame-panel="card"]::before,
  [data-theme="nemrtvi"] [data-nav-item]::before {
    forced-color-adjust: none; /* zachovat asset, ne nahradit systémovou barvou */
  }
  [data-theme="nemrtvi"] [data-nav-item][aria-current="page"] {
    forced-color-adjust: none;
    outline: 2px solid Highlight;
  }
}
```

### 6.4 WCAG kontrast

Po implementaci spustit `npm run audit:contrast`. Očekávané poměry:
- Bone-ivory `#cdc098` na obsidián `#0c0d0a` → **10.8:1** ✅ AAA
- Teal-ghost `#5fc8a8` na obsidián `#0c0d0a` → **9.2:1** ✅ AAA
- Radium-bright `#7cffae` na obsidián `#0c0d0a` → **13.5:1** ✅ AAA

---

## 7. Test sweep

### 7.1 Automatizované

```powershell
npm run lint           # ESLint clean
npm run lint:colors    # žádné hardcoded barvy v decorations.css
npm run build          # TS + Vite build clean
npm run test:run       # 36+ unit testů themes (registry, applyTheme, useTheme)
npm run audit:contrast # WCAG AA pro nemrtvi theme
```

### 7.2 Manuální smoke test (`npm run dev`)

1. **Switch do nemrtvi** přes dropdown
2. Ověřit:
   - [ ] Topbar = solid blackened iron, iron hairline pod
   - [ ] Logo viditelné (horizontal banner s baked-in "Projekt Ikaros")
   - [ ] Welcome card má skull-arch crown nahoře
   - [ ] Welcome card má 4 corner-tl rohy (TL/TR/BL/BR mirror)
   - [ ] Welcome card má bone drop-cap "V" v prvním odstavci
   - [ ] Medailon viditelný vlevo welcome card s dodaným iron+skull rámem
   - [ ] Sidebar levý a pravý mají stone-tablet styling (žádné corner ornaments)
   - [ ] Divider-skull mezi sekcemi v panelech
   - [ ] 7 nav ikon zobrazeno místo lucide
   - [ ] Hover NavItem → teal edge-light glow
   - [ ] Active NavItem → recess-into-stone (inset shadow + radium text)
   - [ ] "+" tlačítka + "PŘIDAT NOVINKU" = CSS-only stone style
   - [ ] Novinky panel má 4 corner-tl rohy (menší než welcome)
   - [ ] Ghost-pulse subtle visible shora
   - [ ] Dust motes drifting (3 částice)
3. **Switch do pergamen, hospoda, příroda, zlatý-standard, modré nebe** — žádná regrese

### 7.3 Responsivita (Chrome DevTools)

| Rozlišení | Co ověřit |
|---|---|
| 1920×1080 (desktop) | Plný layout, medailon 280×340, corner-welcome 96×96 |
| 1280×800 (laptop) | Plný layout |
| 1024×768 (tablet) | Corner-welcome 80×80, medailon 220×268 |
| 768×1024 (tablet portrait) | Drawer mode, medailon 200×240 |
| 414×896 (mobile L) | Topbar icon-only, dust motes hidden, medailon 120×144, corner 56×56 |
| 320×568 (mobile S) | Hamburger menu (TYKY + ODHLÁSIT) |

### 7.4 Reduced motion

System preference → "Reduce motion" → ověřit:
- Ghost-pulse zastavený (statický opacity 0.7)
- Dust motes hidden
- Hover transitions vypnuté
- Klik scale **zachovaný** (UX feedback)

### 7.5 Forced colors

Windows high-contrast mode → ověřit:
- Corner ornaments + nav ikony viditelné (forced-color-adjust: none)
- Active nav má outline místo shadow
- UI plně čitelné

### 7.6 Storybook gallery

```powershell
npm run storybook
```

Themes → Gallery → All Themes → screenshot porovnání všech 22 skinů.

### 7.7 Mobil-desktop skill

Po dokončení implementace per project rule (`base.md`):
> **"Po každé grafické úpravě UI použij skill `mobil-desktop`."**

---

## 8. Roadmap & docs update

Po úspěšném testu:

1. **Update** [`docs/themes/nemrtvi.md`](../../themes/nemrtvi.md) — překlopit z staré vize na novou (princip + paleta + assets + animace + odlišení od ostatních skinů)
2. **Update** [`docs/roadmap-fe.md`](../../roadmap-fe.md) — checkbox "Nemrtví skin upgrade (1.0k)" ✓
3. **Pokud zruší dluh** — uzavřít v [`docs/dluhy.md`](../../dluhy.md) (žádné konkrétní známé)

---

## 9. Riziko & mitigace (cross-ref spec sekce 8)

| Riziko | Detekce při testu | Akce |
|---|---|---|
| Skull-arch over-the-top | Smoke test | Snížit výšku z 96 → 72px desktop |
| GPU strain (glassmorphism + ghost-pulse) | Test na low-end mobile | Snížit blur z 8 → 6px, omezit pulse opacity |
| Drop-cap "V" generic | Smoke test, side-by-side s pergamen | Zesílit ghost-glow shadow stack |
| IM Fell DW Pica nečitelný 14px | Audit:contrast + manuální | Zvýšit `font-size` o 1px nebo fallback `IM Fell English` |
| `cwebp` selže | Asset pipeline log | Pergamen + hospoda funguje, retry; pokud znovu, debug sharp version |

**Rollback:** git revert PR. Žádný BE / data dopad.

---

## 10. Pořadí prací (TODO sekvence)

```
[1] Pre-flight + folder rename + font check         (~15 min)
[2] npm run themes:optimize                         (~30 sec)
[3] Vytvořit + spustit finalize-nemrtvi-assets.mjs  (~5 min)
[4] Přepsat src/themes/themes/nemrtvi/index.ts      (~10 min)
[5] Přepsat src/themes/themes/nemrtvi/decorations.css (~60–90 min)
[6] npm run lint && lint:colors && build && test:run (~5 min)
[7] npm run audit:contrast                          (~1 min)
[8] Manuální smoke test (npm run dev)               (~15 min)
[9] Mobil-desktop skill                             (~10 min)
[10] Update docs/themes/nemrtvi.md + roadmap         (~5 min)
[11] Git commit + push + PR draft                   (~5 min)
```

**Celkový odhad:** 2.5–3.5 hodiny implementace.

---

## 📋 Po schválení plánu — start

Autor čeká na schválení tohoto plánu. Po schválení:
1. Vytvořím větev `feat/krok-1.0k-nemrtvi-upgrade`
2. Provedu TODO 1–11 v pořadí výše
3. Reportuji při milestonech (asset pipeline OK, decorations.css hotový, smoke test passed)
