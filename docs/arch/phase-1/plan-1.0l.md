# Plán 1.0l — Temná červeň visual upgrade

**Datum:** 2026-05-10
**Status:** ✅ Implementováno (2026-05-10)
**Spec:** [`spec-1.0l-temna-cerven-upgrade.md`](spec-1.0l-temna-cerven-upgrade.md) ✅
**Asset prompty:** [`prompts-1.0l-temna-cerven-assets.md`](prompts-1.0l-temna-cerven-assets.md) ✅
**Pořadí prací:** Pre-flight → Asset pipeline → Tokens → Decorations → Animace → Skin selector logic → Mobile breakpoints → A11y polish → Test sweep
**Branch:** `feat/krok-1.0l-temna-cerven-upgrade`
**Single PR** — kompletní skin v jednom kroku

---

## 0. Pre-flight

### 0.1 Vstupní assety (✅ všechny dodány)

| Asset | Status | Zdroj | Cílové rozměry |
|---|---|---|---|
| `logo.png` | ✅ user dodal | `assets-source/themes/temna-cerven/logo.png` | zachovat orig (~600×183) |
| `medailon.png` | ✅ user dodal | `…/medailon.png` | zachovat orig (~600×740) |
| `corner-tl.png` | ✅ AI gen | `…/corner-tl.png` | resize 256×256 |
| `wax-seal.png` | ✅ AI gen | `…/wax-seal.png` | resize 192×192 |
| `jet-bead-frame.png` | ✅ AI gen | `…/jet-bead-frame.png` | resize 320×320 |
| `bat-arch.png` | ✅ AI gen | `…/bat-arch.png` | resize 1600×400 |
| `divider-rose.png` | ✅ AI gen | `…/divider-rose.png` | resize 600×140 |
| `icon-uvodnik.png` | ✅ AI gen | `…/icon-uvodnik.png` | resize 96×96 |
| `icon-vytvorit-svet.png` | ✅ AI gen | `…/icon-vytvorit-svet.png` | resize 96×96 |
| `icon-diskuze.png` | ✅ AI gen | `…/icon-diskuze.png` | resize 96×96 |
| `icon-clanky.png` | ✅ AI gen | `…/icon-clanky.png` | resize 96×96 |
| `icon-galerie.png` | ✅ AI gen | `…/icon-galerie.png` | resize 96×96 |
| `icon-napoveda.png` | ✅ AI gen | `…/icon-napoveda.png` | resize 96×96 |
| `icon-hospoda.png` | ✅ AI gen | `…/icon-hospoda.png` | resize 96×96 |

**Public BG** `public/themes/backgrounds/temna-cerven.webp` ✅ existuje (gotická katedrála), **neměníme**.
**Thumbnail** `public/themes/thumbnails/temna-cerven.webp` ⚠️ ověřit existence (pokud chybí, vygenerovat z medailon nebo z welcome card screenshot).

### 0.2 Folder convention ✅ OK

Source folder má lowercase slug: `assets-source/themes/temna-cerven/` (✅ správně, žádný rename — odlišnost od nemrtvi 1.0k kde bylo nutné `Nemrtví → nemrtvi`).

### 0.3 Verifikace v kódu (žádný shared edit)

- [x] `data-shell="ikaros"` na root — existuje v [`IkarosLayout.tsx:377`](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx)
- [x] `data-frame-panel="topbar|sidebar|right|card|novinky"` — existuje
- [x] `data-nav-item`, `data-nav-key="<key>"` — existuje
- [x] Nav keys: `uvodnik`, `napoveda`, `diskuze`, `clanky`, `galerie`, `vytvorit-svet`, `hospoda` — sdíleno
- [x] `data-corner="tl|tr|bl|br"` — existuje (CornerOrnament komponenta z 1.0i)
- [x] `data-andel-medallion` — existuje
- [x] `data-pj-badge` — existuje
- [x] `data-section-title`, `data-section-divider` — existuje
- [x] `data-logo`, `data-header-button` — existuje
- [x] `data-novinky-add`, `data-add-btn` — existuje
- [x] `temnaCervenTheme` je v registry ([`registry.ts`](../../../src/themes/registry.ts))
- [ ] **Otevřená otázka: skin selector grid v ADMINISTRACE** vyžaduje nový komponent (`SkinSelector`) NEBO inline render v RightPanel? **Předpoklad pro plán:** vytvořit nový shared komponent `src/shared/ui/SkinSelector/SkinSelector.tsx` (renderuje 21 swatches z theme registry), který se použije v ADMINISTRACE sekci pravého panelu. **Alternativa:** pouze CSS scope (skin selector už existuje jinde) — ověřit v 0.4.

### 0.4 Audit existujícího skin selector

Před vytvořením nového komponentu ověřit, jestli skin selector už není někde implementován (např. v Settings page, Admin sekci, nebo Theme switcher):

```powershell
Get-ChildItem -Recurse src -Include *.tsx | Select-String -Pattern "ThemeSwitcher|SkinSelector|skin.?picker|ThemeGallery"
```

Pokud existuje použitelný komponent → použít. Pokud ne → vytvořit nový `SkinSelector.tsx` per spec 4.5 (4-col scroll grid, max-height 200px, custom granátový scrollbar, 21 swatches).

### 0.5 **Žádný edit** v shared komponentách

Per spec 5 (Out of scope) — žádná React komponenta se nemodifikuje. Čistá CSS úprava přes `[data-theme="temna-cerven"]` selector.

**Výjimka:** pokud se v 0.4 vytvoří nový `SkinSelector.tsx`, integrace do `IkarosLayout.tsx` bude vyžadovat **1 řádek** v ADMINISTRACE sekci pravého panelu — `<SkinSelector />`. Toto je shared edit, ale je nový komponent (žádná regrese stávajícího chování pro ostatní skiny — komponent může být always-rendered nebo gated `data-admin` boolean). **Pokud user nechce shared edit ani v této formě**, fallback: skin selector renderovat jen v ADMINISTRACE sekci a per project memory už by mohl existovat. Q-1 v 0.6.

### 0.6 Otázky k rozhodnutí během implementace

Žádné — všechny otevřené otázky vyřešeny ve specu 1.0l Q-1/Q-2/Q-3.

### 0.7 Akcepční podmínka regrese

21 ostatních témat (pergamen, hospoda, modré nebe, zlatý standard, sci-fi, bílá, nemrtví, …) **vizuálně identické** s pre-1.0l. Verifikace: `npm run dev` → manuálně cyklit dropdown switcher přes všech 22 témat → screenshot porovnání s pre-merge.

### 0.8 Font dostupnost

Verifikovat v [`index.html`](../../../index.html), které fonty jsou loaded. Per spec 4.9, temna-cerven potřebuje **4 fonty**:

| Font | Status v index.html | Akce |
|---|---|---|
| **Pirata One** | ✅ načten (přes hospodu) | nic — sdíleno |
| **Cormorant Garamond** | ✅ načten (přes přírodu) | nic — sdíleno |
| **Italianno** | ✅ načten (přes pergamen) | nic — sdíleno |
| **Marcellus SC** | ❌ NENÍ načten | **přidat** do Google Fonts URL |

**Akce:** přidat `family=Marcellus+SC` do existujícího Google Fonts URL v `index.html`.

**Diff:**
```diff
-…&family=Lora:ital,wght@0,400;0,700;1,400&family=New+Rocker&…
+…&family=Lora:ital,wght@0,400;0,700;1,400&family=Marcellus+SC&family=New+Rocker&…
```

(Vložit abecedně mezi Lora a New Rocker.)

### 0.9 Audit-derived constraints (musí dodržet implementace)

| # | Pravidlo | Kde se ověří |
|---|---|---|
| T1 | Atmosférický overlay = chandelier glow shora + oltářní červeň zdola + vinyl vignette + damask wallpaper + film grain (5 vrstev) | `decorations.css` body sekce |
| T2 | **Heartbeat tep** 6.4s loop, jen box-shadow swell na welcome card (lub @ 8%, dub @ 14%, klid 0%/18%/100%) — ne scale, ne translate | `decorations.css` welcome animation |
| T3 | **Padající okvětní lístky** 5 pseudo-elements `body > .petals > .petal:nth-child(1..5)`, drift 28-40s linear infinite staggered | `decorations.css` particles |
| T4 | **Blood drip** pod 4 panely (welcome + novinky + 2 sidebars), 5s loop, opacity 0%→70%→0%, `.drip` element | `decorations.css` panels |
| T5 | **Damask wallpaper** SVG inline data: URL, 80×120 tile, opacity 0.32, multiply blend | tokens v `index.ts` `--theme-damask-pattern` |
| T6 | **Film grain** SVG noise filter, opacity 0.35, mix-blend-mode overlay, fixed inset 0, z-index 1000 | `decorations.css` body::before |
| T7 | Topbar `background-color: solid` + tufting buttons na rozích + thin silver bracket pod text | `decorations.css` topbar |
| T8 | Welcome card glassmorphism + bat-arch crown ::before + 4 corner-tl + fold-line ::before center + wax-seal ::after position absolute bottom-left -8° rotate | `decorations.css` welcome |
| T9 | Welcome + Novinky **mají** 4 corner-tl ornaments (mirror); ostatní panely **NE** | `decorations.css` |
| T10 | Garnet drop-cap "V" — Pirata One, multi-stack text-shadow s garnet halo | `decorations.css` welcome drop-cap |
| T11 | Active NavItem = **silver bracket [ ]** ::before/::after L+R (NE červené pozadí), ikona `filter: drop-shadow(0 0 4px #bf1f3a)` | `decorations.css` NavItem |
| T12 | Hover NavItem/CTA = inset granátový rim + outer glow (240ms transition), žádný shine sweep, žádný flicker | `decorations.css` hover |
| T13 | "+" tlačítka v pravém panelu + "PŘIDAT NOVINKU" = granátový primary button (`btn-primary` styling) — gradient #a01029→#5a081a + silver border + outer glow | `decorations.css` CTA |
| T14 | **Pravý panel = ADMINISTRACE nahoře (skin selector + uživatelé) + divider-rose + MOJE DISKUZE / SVĚTY pod** (per Q-1 B) | DOM layout + `decorations.css` |
| T15 | Skin selector = scroll grid 4-col, max-height 200px, **21 swatches** (per Q-2 A), custom granátový scrollbar | `SkinSelector.tsx` + `decorations.css` |
| T16 | Medailon obtočen `jet-bead-frame.webp` přes `.portrait::before` (mask radial-gradient, transparent center) | `decorations.css` welcome medailon |
| T17 | Bat-arch nad welcome card 96/72/56 desktop/tablet/mobile výška | `decorations.css` welcome ::before |
| T18 | Wax-seal `.seal` element bottom: -18px; left: 36px; transform: rotate(-8deg); 64×64 background asset | `decorations.css` welcome ::after |
| C19 | Mobile (≤768px): topbar icon-only, drawer mode, medailon 140×140, bat-arch 56 výška, petals 2, drip jen na hero | `decorations.css` mobile |
| C20 | NavItem touch target ≥48px na mobile | `decorations.css` mobile |
| C21 | `reducedMotion: 'heavy'` v `temnaCervenTheme` objektu (už nastaveno) | `index.ts` |
| C22 | Reduced motion vypíná heartbeat + petals + drip + hover edge-light. Klik translateY **zachovat**. | `decorations.css` reduced-motion |
| C23 | Focus visible: garnet-incand outline 2px + granet glow halo | `decorations.css` a11y |
| C24 | `lint:colors` clean — žádné hardcoded barvy mimo `index.ts` tokens | `npm run lint:colors` |

---

## 1. Asset pipeline

### 1.1 Krok 1 — WebP konverze (žádný rename, folder už je slug)

```powershell
# Folder je už lowercase slug — žádný Move-Item potřeba
# Spustit existující optimize pipeline (chroma-key dark bg → transparent + WebP convert)
npm run themes:optimize
```

**Výstup:** `public/themes/temna-cerven/decor/*.webp` (14 souborů: logo + medailon + 12 AI)

**Pozn.:** AI assety mají transparent PNG (per acceptance criteria 1.0l), takže whiteBgKey trick (jako u nemrtvi skull-arch) NENÍ potřeba.

### 1.2 Krok 2 — Finalize script (resize na cílové rozměry)

Vytvořit `scripts/finalize-temna-cerven-assets.mjs` per `finalize-nemrtvi-assets.mjs` pattern:

```javascript
import sharp from 'sharp';
import path from 'node:path';
import { stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Post-process temna-cerven decor: resize všech AI assetů na cílové rozměry.
// logo + medailon ponecháváme v originálních rozměrech (logo je horizontal banner
// s baked-in textem, downscale by ho rozmazal).
// Spustit po `npm run themes:optimize`.

const DECOR = path.resolve('public/themes/temna-cerven/decor');

const TASKS = [
  { in: 'corner-tl.webp',          out: 'corner-tl.webp',          w: 256,  h: 256 },
  { in: 'wax-seal.webp',           out: 'wax-seal.webp',           w: 192,  h: 192 },
  { in: 'jet-bead-frame.webp',     out: 'jet-bead-frame.webp',     w: 320,  h: 320 },
  { in: 'bat-arch.webp',           out: 'bat-arch.webp',           w: 1600, h: 400, fit: 'contain', sharper: true },
  { in: 'divider-rose.webp',       out: 'divider-rose.webp',       w: 600,  h: 140, fit: 'contain', sharper: true },
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
  console.log('[temna-cerven] Finalizing decor assets...');
  for (const task of TASKS) {
    try { await processOne(task); }
    catch (err) { console.error(`✗ ${task.in}: ${err.message}`); }
  }
  console.log('[temna-cerven] Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
```

Spustit:
```powershell
node scripts/finalize-temna-cerven-assets.mjs
```

### 1.3 Krok 3 — Verifikace

```powershell
Get-ChildItem "public/themes/temna-cerven/decor/" | Select-Object Name, Length
```

Očekáváno **14** .webp souborů, celkem cca **700–1100 KB**.

---

## 2. Theme tokens — `src/themes/themes/temna-cerven/index.ts`

Kompletní přepsání (z ~51 řádků na ~110). Zachovat:
- `id: 'temna-cerven'`, `name: 'Temná červeň'`, `scope: 'both'`
- `thumbnail`, `background` cesty
- `decorationsModule: () => import('./decorations.css')`
- `reducedMotion: 'heavy'`

Změnit:
- `atmosphere`: nový popis (`"Salón nesmrtelného šlechtice — křižácké železo, baroque stříbro, viktoriánský granát, krev jako klenot"`)
- `vars`: kompletní rewrite paletu (per spec 4.10) + asset URLs (12 nových)
- `fonts`: `{ logo: 'Pirata One', display: 'Pirata One', body: 'Cormorant Garamond' }`

**Snippet — kompletní `vars` blok** viz spec sekce 4.10. Implementuje se 1:1 — token names s prefixem `--theme-` (bordeaux, garnet, silver, jet, velvet, rose-blush) odpovídají `decorations.css` referencím.

**Damask SVG inline** — minified data: URL musí být přesně:
```typescript
'--theme-damask-pattern':
  'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'120\' viewBox=\'0 0 80 120\'><g fill=\'none\' stroke=\'%237e0a1e\' stroke-width=\'0.6\' opacity=\'0.32\'><path d=\'M40 4c-8 8-8 22 0 30 8-8 8-22 0-30zM40 86c-8 8-8 22 0 30 8-8 8-22 0-30z\'/><path d=\'M40 18c-12 0-22 10-22 22s10 22 22 22 22-10 22-22-10-22-22-22zm0 6a16 16 0 1 1 0 32 16 16 0 0 1 0-32z\'/><path d=\'M22 40c-4-4-12-4-16 0M58 40c4-4 12-4 16 0\'/></g></svg>")',
```

---

## 3. Decorations.css — kompletní rewrite

Přepis z 22 řádků na cca **750+ řádků** per pergamen/nemrtvi pattern.

### 3.1 Struktura sekcí

```css
/* ── Temná červeň — salón nesmrtelného šlechtice, vampire-collector ── */

/* Sekce 1: Background overlay + damask wallpaper + film grain */
[data-theme="temna-cerven"] { … 5-vrstvý gradient + damask + bg color … }
[data-theme="temna-cerven"] body::before { … film grain SVG noise … }

/* Sekce 2: Padající okvětní lístky růží (5 staggered) */
[data-theme="temna-cerven"][data-shell="ikaros"]::before { … petals container … }
@keyframes drift { … }

/* Sekce 3: Topbar — solidní zčernalý kov + tufting */
[data-theme="temna-cerven"] [data-frame-panel="topbar"] { … }
[data-theme="temna-cerven"] [data-frame-panel="topbar"]::before,
[data-theme="temna-cerven"] [data-frame-panel="topbar"]::after { … tufting buttons … }

/* Sekce 4: Logo */
[data-theme="temna-cerven"] [data-logo] {
  background-image: var(--asset-logo);
  filter: drop-shadow(0 0 14px rgba(191, 31, 58, .45));
}

/* Sekce 5: Header buttons — silver name plates */
[data-theme="temna-cerven"] [data-header-button] { … gradient + 1px silver border … }
[data-theme="temna-cerven"] [data-header-button]::after { … thin silver bracket pod text … }
[data-theme="temna-cerven"] [data-header-button]:hover { … silver bright + granet glow … }

/* Sekce 6: Glass panels (sidebar left + right) — čalouněné panely */
[data-theme="temna-cerven"] [data-frame-panel="sidebar"],
[data-theme="temna-cerven"] [data-frame-panel="right"] {
  background: linear-gradient + var(--theme-damask-pattern);
  background-blend-mode: normal, multiply;
  …
}
[data-theme="temna-cerven"] [data-frame-panel="sidebar"]::before,
[data-theme="temna-cerven"] [data-frame-panel="sidebar"]::after,
[data-theme="temna-cerven"] [data-frame-panel="right"]::before,
[data-theme="temna-cerven"] [data-frame-panel="right"]::after { … tufting buttons (4 rohy) … }

/* Sekce 7: Welcome card — hero centerpiece */
[data-theme="temna-cerven"] [data-frame-panel="card"] { … glassmorphism + damask … animation: heartbeat 6.4s … }
[data-theme="temna-cerven"] [data-frame-panel="card"]::before { … bat-arch crown … }
[data-theme="temna-cerven"] [data-frame-panel="card"]::after { … fold-line vertical center … }
@keyframes heartbeat { … lub-DUB … }

/* Sekce 8: 4 corner-tl ornaments */
[data-theme="temna-cerven"] [data-frame-panel="card"] [data-corner="tl"],
…tr/bl/br { … corner-tl mirror via scaleX/Y … }

/* Sekce 9: Wax-seal hanging from welcome card bottom-left */
[data-theme="temna-cerven"] [data-frame-panel="card"] .seal { … 64×64 background-image … }
/* (.seal element musí existovat — pokud ne, fallback ::after pseudo) */

/* Sekce 10: Medailon — Ikaros bird v iron-cross frame */
[data-theme="temna-cerven"] [data-andel-medallion] {
  background-image: var(--asset-medailon);
  filter: drop-shadow(0 0 22px rgba(168, 19, 46, .45));
}
/* Jet-bead frame okolo medailonu */
[data-theme="temna-cerven"] [data-andel-medallion]::before {
  content: '';
  position: absolute;
  inset: -18px;
  background-image: var(--asset-jet-bead-frame);
  …
}

/* Sekce 11: Garnet drop-cap "V" */
[data-theme="temna-cerven"] .welcomeBody > p:first-of-type::first-letter { … Pirata One + garnet halo … }

/* Sekce 12: Welcome heading + body + signature */
[data-theme="temna-cerven"] .welcomeTitle { … Pirata One 38px … }
[data-theme="temna-cerven"] .welcomeBody { … Cormorant Garamond … }
[data-theme="temna-cerven"] .welcomeSignature { … Italianno + ink-blood … }

/* Sekce 13: Section title (NAVIGACE, MOJE DISKUZE, …) + cabochon decorations */
[data-theme="temna-cerven"] [data-section-title] { … Pirata One uppercase + garnet cabochons … }

/* Sekce 14: Divider-rose mezi sekcemi */
[data-theme="temna-cerven"] [data-section-divider] { background-image: var(--asset-divider-rose); … }

/* Sekce 15: NavItem */
[data-theme="temna-cerven"] [data-nav-item] { … čalouněný styling … }
[data-theme="temna-cerven"] [data-nav-item]:hover { … inset granet rim + outer glow … }
[data-theme="temna-cerven"] [data-nav-item][aria-current="page"] { … silver bracket [ ] + ikona granet glow … }

/* Sekce 16: Nav icons (skrýt SVG, render asset) */
[data-theme="temna-cerven"] [data-nav-item] svg { display: none; }
[data-theme="temna-cerven"] [data-nav-item][data-nav-key="uvodnik"]::before {
  content: ''; background-image: var(--asset-icon-uvodnik); …
}
… (7× per icon-X)

/* Sekce 17: Right panel — ADMINISTRACE + MOJE DISKUZE / SVĚTY (Q-1 B) */
[data-theme="temna-cerven"] [data-frame-panel="right"] [data-pj-badge] { … garnet styling … }
[data-theme="temna-cerven"] [data-frame-panel="right"] button[data-add-btn] { … granátový primary CTA … }

/* Sekce 18: ADMINISTRACE tag + skin selector grid */
[data-theme="temna-cerven"] .admin-tag { … Pirata One + ⚜ ikony + garnet halo … }
[data-theme="temna-cerven"] .skin-selector { … 4-col grid + scroll + custom scrollbar … }
[data-theme="temna-cerven"] .skin-swatch { … aspect-ratio 1:1 + radial-gradient z theme.vars … }
[data-theme="temna-cerven"] .skin-swatch.active { … garnet bright border + glow + ⚜ overlay … }

/* Sekce 19: User row v ADMINISTRACE */
[data-theme="temna-cerven"] .user-row { … 1px silver border + avatar + role badge … }

/* Sekce 20: Novinky panel */
[data-theme="temna-cerven"] [data-frame-panel="novinky"] { … glassmorphism + damask + 4 corner-tl … }

/* Sekce 21: PŘIDAT NOVINKU button */
[data-theme="temna-cerven"] [data-novinky-add] { … granátový primary CTA … }

/* Sekce 22: Blood drip pod 4 panely */
[data-theme="temna-cerven"] [data-frame-panel="card"] .drip,
[data-theme="temna-cerven"] [data-frame-panel="novinky"] .drip,
[data-theme="temna-cerven"] [data-frame-panel="sidebar"] .drip,
[data-theme="temna-cerven"] [data-frame-panel="right"] .drip { … 6×14 droplet … animation: drip 5s … }
@keyframes drip { … }

/* Sekce 23: Focus visible */
[data-theme="temna-cerven"] :focus-visible { … garnet-incand outline 2px + glow … }

/* Sekce 24: Scrollbar */
[data-theme="temna-cerven"] ::-webkit-scrollbar { … silver-tarnish + garnet thumb … }

/* Sekce 25: Tablet (1024–1279px) breakpoints */
@media (max-width: 1279px) and (min-width: 1024px) { [data-theme="temna-cerven"] … }

/* Sekce 26: Tablet narrow (769–1023px) breakpoints */
@media (max-width: 1023px) { [data-theme="temna-cerven"] … }

/* Sekce 27: Mobile (≤768px) breakpoints */
@media (max-width: 768px) { [data-theme="temna-cerven"] … }

/* Sekce 28: Mobile small (≤480px) — petals hidden, fold-line hidden */
@media (max-width: 480px) { [data-theme="temna-cerven"] … }

/* Sekce 29: Reduced motion — heartbeat/petals/drip OFF, klik translateY ON */
@media (prefers-reduced-motion: reduce) { [data-theme="temna-cerven"] … }

/* Sekce 30: Forced colors */
@media (forced-colors: active) { [data-theme="temna-cerven"] … }
```

### 3.2 Klíčové signature snippety

#### Heartbeat tep srdce upíra (welcome card)

```css
[data-theme="temna-cerven"] [data-frame-panel="card"] {
  position: relative;
  animation: heartbeat 6.4s ease-in-out infinite;
  will-change: box-shadow;
}

@keyframes heartbeat {
  0%, 18%, 100% {
    box-shadow:
      inset 0 1px 0 rgba(212, 200, 190, 0.08),
      inset 0 -2px 6px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(126, 10, 30, 0.55) inset,
      0 28px 70px rgba(0, 0, 0, 0.6);
  }
  8% {  /* lub */
    box-shadow:
      inset 0 1px 0 rgba(212, 200, 190, 0.08),
      inset 0 -2px 6px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(191, 31, 58, 0.7) inset,
      0 0 28px rgba(168, 19, 46, 0.18),
      0 28px 70px rgba(0, 0, 0, 0.6);
  }
  14% {  /* dub */
    box-shadow:
      inset 0 1px 0 rgba(212, 200, 190, 0.08),
      inset 0 -2px 6px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(212, 200, 190, 0.4) inset,
      0 0 22px rgba(168, 19, 46, 0.10),
      0 28px 70px rgba(0, 0, 0, 0.6);
  }
}
```

#### Bat-arch crown nad welcome card

```css
[data-theme="temna-cerven"] [data-frame-panel="card"]::before {
  content: '';
  position: absolute;
  top: -32px;
  left: 0;
  right: 0;
  height: 96px;
  background-image: var(--asset-bat-arch);
  background-size: contain;
  background-position: center top;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 2;
}

@media (max-width: 1279px) {
  [data-theme="temna-cerven"] [data-frame-panel="card"]::before {
    top: -24px; height: 72px;
  }
}
@media (max-width: 768px) {
  [data-theme="temna-cerven"] [data-frame-panel="card"]::before {
    top: -16px; height: 56px;
  }
}
```

#### 4 corner-tl ornaments (mirror via CSS scaleX/Y)

```css
[data-theme="temna-cerven"] [data-frame-panel="card"] [data-corner="tl"],
[data-theme="temna-cerven"] [data-frame-panel="card"] [data-corner="tr"],
[data-theme="temna-cerven"] [data-frame-panel="card"] [data-corner="bl"],
[data-theme="temna-cerven"] [data-frame-panel="card"] [data-corner="br"] {
  background-image: var(--asset-corner);
  background-size: contain;
  background-repeat: no-repeat;
  width: 96px; height: 96px;
  position: absolute;
  pointer-events: none;
  z-index: 1;
  filter: drop-shadow(0 1px 0 #000) drop-shadow(0 0 6px rgba(168, 19, 46, .35));
}
[data-theme="temna-cerven"] [data-frame-panel="card"] [data-corner="tl"] { top: 8px; left: 8px; transform: none; }
[data-theme="temna-cerven"] [data-frame-panel="card"] [data-corner="tr"] { top: 8px; right: 8px; transform: scaleX(-1); }
[data-theme="temna-cerven"] [data-frame-panel="card"] [data-corner="bl"] { bottom: 8px; left: 8px; transform: scaleY(-1); }
[data-theme="temna-cerven"] [data-frame-panel="card"] [data-corner="br"] { bottom: 8px; right: 8px; transform: scale(-1, -1); }

/* Stejné pro [data-frame-panel="novinky"], menší rozměry 80→64→48 */
```

#### Garnet drop-cap "V"

```css
[data-theme="temna-cerven"] .welcomeBody > p:first-of-type::first-letter {
  font-family: 'Pirata One', Georgia, serif;
  font-size: 4.2em;
  line-height: 0.85;
  float: left;
  padding: 0.05em 0.10em 0 0;
  color: var(--theme-garnet-bright);
  text-shadow:
    0 0 0.04em rgba(0, 0, 0, 1),
    0 2px 0.06em rgba(0, 0, 0, 0.9),
    0 0 0.25em rgba(168, 19, 46, 0.35),
    0 0 0.5em rgba(74, 6, 18, 0.25);
}
```

#### Active NavItem — silver bracket [ ] (signature, NE pozadí)

```css
[data-theme="temna-cerven"] [data-nav-item][aria-current="page"] {
  background: linear-gradient(180deg, rgba(74, 6, 18, .7), rgba(30, 6, 12, .85));
  color: var(--theme-silver-bright);
  border: 1px solid rgba(212, 200, 190, .35);
  box-shadow:
    0 0 0 1px var(--theme-border-garnet) inset,
    0 0 22px rgba(191, 31, 58, 0.35);
  position: relative;
}
[data-theme="temna-cerven"] [data-nav-item][aria-current="page"]::before,
[data-theme="temna-cerven"] [data-nav-item][aria-current="page"]::after {
  content: '';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 14px;
  border: 1px solid var(--theme-silver-tarnish);
}
[data-theme="temna-cerven"] [data-nav-item][aria-current="page"]::before { left: -3px; border-right: none; }
[data-theme="temna-cerven"] [data-nav-item][aria-current="page"]::after  { right: -3px; border-left: none; }

/* Active nav icon glow */
[data-theme="temna-cerven"] [data-nav-item][aria-current="page"]::before /* icon */ {
  filter: drop-shadow(0 0 4px var(--theme-garnet-incand));
}
```

#### Padající okvětní lístky růží (signature)

```css
[data-theme="temna-cerven"][data-shell="ikaros"]::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 999;
  overflow: hidden;
  /* SVG-as-background s 5 petals — nebo lépe, použít wrapper element */
}

/* Alternativa: wrapper s 5 child petals (vyžaduje DOM nodes — viz 4.5 React shared edit) */
.petals .petal {
  position: absolute;
  width: 10px; height: 14px;
  background: radial-gradient(ellipse at 30% 20%, var(--theme-garnet-incand), var(--theme-garnet-deep) 75%);
  border-radius: 80% 10% 80% 10% / 60% 10% 90% 10%;
  filter: blur(.3px) drop-shadow(0 0 4px rgba(0, 0, 0, .6));
  opacity: .55;
  animation: drift linear infinite;
}
.petals .petal:nth-child(1) { left: 8%;  top: -20px; animation-duration: 28s; animation-delay: -3s;  transform: rotate(20deg); }
.petals .petal:nth-child(2) { left: 22%; top: -20px; animation-duration: 36s; animation-delay: -10s; transform: rotate(-15deg); }
.petals .petal:nth-child(3) { left: 47%; top: -20px; animation-duration: 32s; animation-delay: -18s; transform: rotate(45deg); }
.petals .petal:nth-child(4) { left: 71%; top: -20px; animation-duration: 40s; animation-delay: -7s;  transform: rotate(-30deg); }
.petals .petal:nth-child(5) { left: 88%; top: -20px; animation-duration: 30s; animation-delay: -22s; transform: rotate(10deg); }

@keyframes drift {
  0%   { transform: translate(0, -30px) rotate(0deg); opacity: 0; }
  8%   { opacity: .6; }
  100% { transform: translate(70px, 110vh) rotate(540deg); opacity: 0; }
}
```

> **Pozn:** petals vyžadují DOM nodes. **Implementace bez shared edit:** vytvořit 5 prázdných divů přes CSS `::before`/`::after` na wrapper elementu (např. `[data-shell="ikaros"]::before`/`::after`) — limitované na 2 petals.
> **Alternativa:** přidat 5 prázdných `<div class="petal"></div>` do `IkarosLayout.tsx` jako sibling shell, gated `[data-theme="temna-cerven"]` v CSS pro display.
> **Předpoklad pro plán:** přidat `<div class="petals" data-theme-decoration="petals"><div class="petal"/>×5</div>` do IkarosLayout — minimální shared edit, gated displej:
> ```css
> [data-theme-decoration="petals"] { display: none; }
> [data-theme="temna-cerven"] [data-theme-decoration="petals"] { display: block; }
> ```

#### Blood drip pod panely

```css
.drip {
  position: absolute;
  left: 50%;
  bottom: -8px;
  transform: translateX(-50%);
  width: 6px; height: 14px;
  background: radial-gradient(ellipse at 50% 30%, var(--theme-garnet-incand), var(--theme-garnet-deep) 70%, transparent 100%);
  border-radius: 50% 50% 50% 50% / 30% 30% 70% 70%;
  filter: blur(.3px) drop-shadow(0 0 3px rgba(168, 19, 46, .4));
  animation: drip 5s ease-in infinite;
  opacity: 0;
  pointer-events: none;
}

@keyframes drip {
  0%, 60%, 100% { transform: translate(-50%, 0) scaleY(1); opacity: 0; }
  70% { opacity: .85; transform: translate(-50%, 0) scaleY(1); }
  95% { opacity: 0; transform: translate(-50%, 16px) scaleY(1.6); }
}

/* Aplikováno na 4 panely */
[data-theme="temna-cerven"] [data-frame-panel="card"],
[data-theme="temna-cerven"] [data-frame-panel="novinky"],
[data-theme="temna-cerven"] [data-frame-panel="sidebar"],
[data-theme="temna-cerven"] [data-frame-panel="right"] {
  position: relative;
  /* .drip element přidán přes pseudo nebo DOM, viz petals pozn. */
}
```

> **Pozn:** drip vyžaduje DOM node (nelze přes ::after — to už používáme pro tufting buttons). **Implementace:** přidat `<div class="drip" data-theme-decoration="drip" />` do každého panelu v IkarosLayout (4 lokace), gated displej via CSS jako u petals.

#### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  [data-theme="temna-cerven"] [data-frame-panel="card"] { animation: none; }
  [data-theme="temna-cerven"] [data-theme-decoration="petals"] { display: none; }
  [data-theme="temna-cerven"] .drip { display: none; }
  [data-theme="temna-cerven"] [data-nav-item],
  [data-theme="temna-cerven"] [data-header-button],
  [data-theme="temna-cerven"] [data-add-btn],
  [data-theme="temna-cerven"] [data-novinky-add] {
    transition-duration: 0ms;
  }
  /* Klik translateY zachováno (UX feedback nutný) */
}
```

---

## 4. SkinSelector komponent (per Q-2 A)

### 4.1 Audit (per pre-flight 0.4)

```powershell
Get-ChildItem -Recurse src -Include *.tsx | Select-String -Pattern "ThemeSwitcher|SkinSelector|skin.?picker"
```

Pokud existuje `ThemeSwitcher` nebo podobný komponent → **použít** (potřeba jen vystylovat per spec 4.5).

Pokud neexistuje (předpokládám neexistuje pro skin grid) → vytvořit nový.

### 4.2 Nový komponent `src/shared/ui/SkinSelector/SkinSelector.tsx`

```tsx
import { useTheme } from '@/themes/useTheme';
import { themes } from '@/themes/registry';
import s from './SkinSelector.module.css';

export function SkinSelector() {
  const { themeId, setTheme } = useTheme();
  const all = Object.values(themes);

  return (
    <div className={s.skinSelector} data-skin-selector>
      <label className={s.label}>Vzhled (skin)</label>
      <div className={s.grid}>
        {all.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${s.swatch} ${themeId === t.id ? s.active : ''}`}
            onClick={() => setTheme(t.id)}
            title={t.name}
            data-skin-swatch={t.id}
            style={{
              ['--swatch-bg-1' as string]: t.vars['--bg-primary'],
              ['--swatch-bg-2' as string]: t.vars['--accent'] || t.vars['--bg-secondary'],
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### 4.3 `SkinSelector.module.css` — base styly (theme-agnostic)

```css
.skinSelector {
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
}
.label {
  display: block;
  font-size: 10px;
  letter-spacing: 0.3em;
  text-align: center;
  text-transform: uppercase;
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 4px;
}
.swatch {
  appearance: none;
  cursor: pointer;
  aspect-ratio: 1 / 1;
  border: 1px solid currentColor;
  background:
    radial-gradient(circle at 30% 30%, var(--swatch-bg-2), var(--swatch-bg-1) 60%, #000 100%);
  transition: transform 240ms, box-shadow 240ms;
}
.swatch.active {
  /* theme-specific styling per data-theme overrides */
}
```

### 4.4 Theme-specific overrides v `decorations.css`

```css
[data-theme="temna-cerven"] [data-skin-selector] .label {
  font-family: var(--font-display);
  color: var(--theme-silver-tarnish);
}
[data-theme="temna-cerven"] [data-skin-selector] .grid {
  /* custom granátový scrollbar */
}
[data-theme="temna-cerven"] [data-skin-selector] .grid::-webkit-scrollbar { width: 6px; }
[data-theme="temna-cerven"] [data-skin-selector] .grid::-webkit-scrollbar-track {
  background: var(--theme-bordeaux-mid);
}
[data-theme="temna-cerven"] [data-skin-selector] .grid::-webkit-scrollbar-thumb {
  background: var(--theme-garnet);
  border-radius: 3px;
}
[data-theme="temna-cerven"] [data-skin-selector] .swatch {
  border-color: var(--theme-border-silver);
}
[data-theme="temna-cerven"] [data-skin-selector] .swatch:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 12px rgba(212, 200, 190, .3);
}
[data-theme="temna-cerven"] [data-skin-selector] .swatch.active {
  border-color: var(--theme-garnet-bright);
  box-shadow:
    0 0 0 1px var(--theme-garnet-bright) inset,
    0 0 14px var(--theme-garnet-incand);
}
[data-theme="temna-cerven"] [data-skin-selector] .swatch.active::after {
  content: '⚜';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--theme-silver-bright);
  font-size: 14px;
  text-shadow: 0 0 6px #000;
}
```

### 4.5 Integrace do `IkarosLayout.tsx`

V ADMINISTRACE sekci pravého panelu (existující pattern, hledat sekci `<aside data-frame-panel="right">` → ADMINISTRACE):

```tsx
import { SkinSelector } from '@/shared/ui/SkinSelector/SkinSelector';
…
<section className={s.adminSection}>
  <div className={s.adminTag}>ADMINISTRACE</div>
  <SkinSelector />
  <UserList />  {/* existing or new — placeholder */}
</section>
<div data-section-divider data-theme-decoration="divider-rose" />
<section className={s.diskuzeSection}>
  {/* existing MOJE DISKUZE */}
</section>
<section className={s.svetySection}>
  {/* existing MOJE SVĚTY */}
</section>
```

> **Otevřená koordinace:** UserList komponent existuje? Pokud ne, vytvořit minimální `<UserList />` který fetchne uživatele přes existující API (mock pro Storybook). Předpoklad: existuje (per project memory `project_admin_panel_decision.md`). Pokud ne, **separate plan extension** v 1.0l-fix.

### 4.6 Petals + Drip DOM nodes

V `IkarosLayout.tsx` přidat:

```tsx
{/* Atmosféra — gated displej via CSS */}
<div data-theme-decoration="petals" aria-hidden="true">
  <div className="petal" />
  <div className="petal" />
  <div className="petal" />
  <div className="petal" />
  <div className="petal" />
</div>

{/* Drip nodes přidat do každého panelu */}
<aside data-frame-panel="sidebar">
  {/* existing children */}
  <div data-theme-decoration="drip" aria-hidden="true" />
</aside>
…
```

CSS gating (v `decorations.css`):
```css
[data-theme-decoration="petals"],
[data-theme-decoration="drip"] { display: none; }

[data-theme="temna-cerven"] [data-theme-decoration="petals"],
[data-theme="temna-cerven"] [data-theme-decoration="drip"] { display: block; }
```

---

## 5. `index.html` font edit

Přidat `family=Marcellus+SC` do existující Google Fonts URL (abecedně mezi `Lora` a `New+Rocker`):

```diff
-…&family=Lora:ital,wght@0,400;0,700;1,400&family=New+Rocker&…
+…&family=Lora:ital,wght@0,400;0,700;1,400&family=Marcellus+SC&family=New+Rocker&…
```

Komentář aktualizovat:
```diff
-1.0k font diferenciace nemrtví:
+1.0k font diferenciace nemrtví:
+1.0l font diferenciace temna-cerven: + Marcellus SC (sub-display name plates)
```

---

## 6. Test sweep

### 6.1 Unit + lint + build

```powershell
npm run lint              # ESLint clean
npm run lint:colors       # žádné hardcoded barvy v decorations.css
npm run build             # TS + Vite build clean
npm run test              # 36+ unit testů pro themes (registry, applyTheme, useTheme) musí projít
npm run audit:contrast    # WCAG AA pro temna-cerven theme
```

### 6.2 Storybook gallery + dev

```powershell
npm run storybook
# Otevřít: Themes → Gallery → All Themes
# Verifikovat: temna-cerven vypadá per mockup, ostatních 21 skinů beze změny
```

```powershell
npm run dev
# Otevřít: http://localhost:5173
# Switch do temna-cerven přes ADMINISTRACE skin selector
# Manuální checklist (per spec 7.2):
# - Topbar solid blackened metal s tufting buttons na rozích
# - Logo + medailon zobrazeny (medailon obtočen jet-bead frame)
# - Welcome card má bat-arch crown nahoře, 4 corner-tl rohy, garnet drop-cap "V", wax-seal vlevo dole, fold-line uprostřed
# - Heartbeat tep welcome cardu vidět (subtle box-shadow swell každých 6.4s)
# - Padající okvětní lístky růží 5 staggered
# - Sidebary mají čalouněný frame + tufting + divider-rose mezi sekcemi
# - Blood drip pod panely občas spadne
# - NavItem hover (granátový rim glow) / active (silver bracket [ ] + ikona granet glow)
# - 7 nav ikon viditelných místo lucide
# - Pravý panel = ADMINISTRACE nahoře (skin selector grid + uživatelé) + divider-rose + MOJE DISKUZE / SVĚTY pod
# - "+" CTA + klik mikrointerakce
# - Damask wallpaper subtle visible na pozadí
```

### 6.3 Responsivita

Chrome DevTools breakpoints:
- 1920×1080 (desktop) — plný layout, 5 petals
- 1280×800 (laptop) — plný layout
- 1024×768 (tablet) — corners zmenšeny, 3 petals
- 768×1024 (tablet portrait) — drawer mode, ADMINISTRACE collapse
- 414×896 (mobile L) — petals 2, drip jen na hero, medailon 140×140
- 320×568 (mobile S) — hamburger menu, petals hidden, fold-line hidden

### 6.4 A11y

- **Reduced motion** (system preference) → heartbeat/petals/drip/hover-glow vypnuté, klik translateY zachováno
- **Forced colors** (Windows high contrast) → UI funkční, ornamenty neztrácí význam
- **Focus visible** → garnet outline 2px + glow halo na všech interaktivních prvcích
- **WCAG audit** — `npm run audit:contrast` projde (ink-blood signature whitelisted jako decorative)

### 6.5 Mobil-desktop skill

Per project rule `base.md` — **POVINNÉ** spustit po dokončení implementace:

```
/mobil-desktop
```

Skill ověří, že skin funguje na mobilu i desktopu bez regresí.

### 6.6 Regrese ostatních skinů

`npm run dev` → ručně cyklit přes všech 22 témat ve switcheru → screenshot porovnání s pre-merge:
- pergamen, hospoda, modré nebe, zlatý standard, sci-fi, bílá, vesmírná loď, příroda, nemrtví — bez vizuální změny
- temna-cerven — nový vzhled per mockup

---

## 7. Pořadí kroků (execution order)

1. **Pre-flight ověření** (0.1–0.9)
2. **`index.html`** — přidat Marcellus SC (sekce 5)
3. **Asset pipeline** — `npm run themes:optimize` + finalize script (sekce 1)
4. **`SkinSelector.tsx`** komponent + module.css (sekce 4.2–4.4) — **po auditu 0.4**
5. **`IkarosLayout.tsx`** — minimální shared edit (`<SkinSelector />`, petals, drip nodes per sekce 4.5–4.6)
6. **`themes/temna-cerven/index.ts`** — kompletní rewrite tokens + fonts + asset URLs (sekce 2)
7. **`themes/temna-cerven/decorations.css`** — kompletní rewrite ~750 řádků (sekce 3)
8. **Test sweep** — lint + build + storybook + dev (sekce 6.1–6.2)
9. **Responsivita** + **A11y** test (sekce 6.3–6.4)
10. **Mobil-desktop skill** (sekce 6.5)
11. **Regrese** ostatních skinů (sekce 6.6)
12. **Aktualizace docs** — `docs/themes/temna-cerven.md` (přepis starého náčrtu) + `docs/themes/README.md` (status: 1.0l hotový)
13. **Commit + PR** — single PR, dle commit conventionu z `git log` (`feat(themes/temna-cerven): krok 1.0l — vampire-collector synthesis upgrade`)

---

## 8. Estimát

- **Asset pipeline:** ~30 min (script + verifikace)
- **SkinSelector komponent:** ~45 min (audit + impl + module.css)
- **IkarosLayout shared edit:** ~15 min (4 řádky)
- **Tokens (`index.ts`):** ~30 min (rewrite + asset URLs)
- **Decorations.css (~750 řádků):** ~3-4h (sekce 1-30)
- **Test sweep + responsivita:** ~1.5h
- **Mobil-desktop check:** ~30 min
- **Doc updates + commit:** ~20 min

**Celkem: ~6-8h** soustředěné práce.

---

## 9. Rollback

`git revert` PR. Pokud už mergeováno: nový PR co vrací:
- `decorations.css` na 22-řádkovou verzi
- `index.ts` na 51-řádkovou verzi
- `index.html` font URL bez Marcellus SC
- Smaže `SkinSelector.tsx` + `SkinSelector.module.css` (pokud byly nově vytvořené)
- Smaže shared edit v `IkarosLayout.tsx` (petals, drip, SkinSelector integrace)
- Smaže `public/themes/temna-cerven/decor/` folder
- Smaže `scripts/finalize-temna-cerven-assets.mjs`

Žádný BE / data dopad. Bezpečné.

---

**Autor čeká na schválení tohoto plánu před zahájením implementace.**
