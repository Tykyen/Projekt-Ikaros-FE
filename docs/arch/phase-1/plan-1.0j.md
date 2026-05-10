# Plán 1.0j — Hospoda visual upgrade

**Datum:** 2026-05-10
**Status:** ⏳ Čeká na schválení
**Spec:** [`spec-1.0j-hospoda-upgrade.md`](spec-1.0j-hospoda-upgrade.md) ✅
**Asset prompty:** [`prompts-1.0j-hospoda-assets.md`](prompts-1.0j-hospoda-assets.md) ✅
**Pořadí prací:** Pre-flight → Asset konverze → Tokens → Decorations → Animace → Mobile breakpoints → A11y polish → Test sweep
**Branch:** `feat/krok-1.0j-hospoda-upgrade`

---

## 0. Pre-flight

### 0.1 Vstupní assety (`assets-source/themes/hospoda/`)

| Asset | Status | Cílové rozměry | Source |
|---|---|---|---|
| `logo.png` | ⏳ user dodá | zachovat orig (~480×96 typicky) | user |
| `medailon.png` | ⏳ user dodá | zachovat orig (banner ~500×680) | user |
| `corner-tl.png` | ⏳ AI gen | resize 256×256 | ChatGPT/MJ |
| `icon-uvodnik.png` | ⏳ AI gen | resize 96×96 | ChatGPT/MJ |
| `icon-vytvorit-svet.png` | ⏳ AI gen | resize 96×96 | ChatGPT/MJ |
| `icon-diskuze.png` | ⏳ AI gen | resize 96×96 | ChatGPT/MJ |
| `icon-clanky.png` | ⏳ AI gen | resize 96×96 | ChatGPT/MJ |
| `icon-galerie.png` | ⏳ AI gen | resize 96×96 | ChatGPT/MJ |
| `icon-napoveda.png` | ⏳ AI gen | resize 96×96 | ChatGPT/MJ |
| `icon-hospoda.png` | ⏳ AI gen | resize 96×96 | ChatGPT/MJ |
| `decor-table-clutter.png` | ⏳ AI gen | resize 1200×120 (fit: cover) | ChatGPT/MJ |
| `iron-clasp-divider.png` | ⏳ AI gen | resize 240×32 (fit: contain) | ChatGPT/MJ |
| `brass-stamp-ikaros.png` | ⏳ AI gen | resize 96×96 | ChatGPT/MJ |

**Public BG** `public/themes/backgrounds/hospoda.webp` ✅ existuje, neměníme.
**Thumbnail** `public/themes/thumbnails/hospoda.webp` — verifikovat existenci, vytvořit z reference pokud neexistuje.

### 0.2 Verifikace v kódu (žádný shared edit)

- [x] `data-nav-key` atribut **už existuje** v `IkarosLayout.tsx:83` (NavItem) — z pergamen 1.0i
- [x] Nav keys: `uvodnik`, `napoveda`, `diskuze`, `clanky`, `galerie`, `vytvorit-svet`, `hospoda` — sdíleno s pergamenem
- [x] `data-frame-panel` atributy `sidebar`/`right`/`card`/`novinky` — existují
- [x] `data-andel-medallion` atribut — existuje (pergamen ho používá)
- [x] `hospodaTheme` je v registry (`registry.ts`)
- [x] **Žádný edit** v `IkarosLayout`, `IkarosCard`, `CornerOrnament`, `WelcomeHero`, `DashboardPage`, `RightPanel`, `NovinkyPanel`, shared komponentách
- [x] Cinzel Decorative + IM Fell English SC + Lora fonty — verifikovat v `theme.css` (krok 0.4)

### 0.3 Akcepční podmínka regrese

20 ostatních témat (modré nebe, zlatý standard, sci-fi, bílá, vesmirna-lod, magie, priroda, pergamen, …) **vizuálně identické** s pre-1.0j. Verifikace: `npm run dev` → manuálně cyklit dropdown switcher přes všech 21 témat → screenshot porovnání s pre-merge.

### 0.4 Font dostupnost

Verifikovat v [`src/styles/theme.css`](../../../src/styles/theme.css) nebo [`index.html`](../../../index.html), že tyto fonty jsou loaded:
- ✅ Cinzel (existing — pergamen)
- ✅ Cinzel Decorative — pravděpodobně potřeba **přidat** (pergamen použil normal Cinzel)
- ✅ IM Fell English / IM Fell English SC (existing — pergamen)
- ✅ Lora (existing — base)

**Pokud Cinzel Decorative chybí:** přidat do font-loader (Google Fonts link nebo woff2). 1 řádek v `theme.css` import statement nebo `<link>` v `index.html`.

### 0.5 Audit-derived constraints (musí dodržet implementace)

| # | Pravidlo | Kde se ověří |
|---|---|---|
| H1 | Atmosférický overlay = pure darken, žádné radial color tints (background je teplý) | `decorations.css` overlay sekce |
| H2 | Hearth pulse animace 6s loop, opacity 0.55→1.0→0.55 (efektivně 0.25→0.45) | `decorations.css` ::after sekce |
| H3 | Topbar `background-color: solid` (žádný backdrop-filter) | `decorations.css` topbar |
| H4 | Welcome card material = light parchment, ohnuté rohy (CSS pseudo) + 4 brass nity (CSS pseudo) | `decorations.css` welcome |
| H5 | Brass stamp **na obou** "+" tlačítkách — PŘIDAT NOVINKU + rightAddBtn (per spec sekce 4.5+4.6) | `decorations.css` CTA |
| H6 | Heraldický banner `width: 250px; height: 340px` desktop / `100×136` mobile | `decorations.css` welcome |
| H7 | Banner subtle flutter (scaleY ±1.5%, 6s loop) | `decorations.css` welcome |
| H8 | Spodní pás `position: fixed`, full-width, **`display: none` na mobile** | `decorations.css` decoration |
| H9 | Body `padding-bottom: 100px` (desktop) / `80px` (tablet) / `0` (mobile) — kvůli fixed pásu | `decorations.css` global |
| C10 | Mobile (≤768px): banner 100×136, corner 64×64, icon-only header | `decorations.css` mobile |
| C11 | NavItem touch target ≥48px na mobile | `decorations.css` mobile |
| C12 | `reducedMotion: 'safe'` v `hospodaTheme` objektu | `index.ts` |
| C13 | Reduced motion vypíná hearth pulse, banner flutter, candle flicker, brass shine sweep | `decorations.css` reduced-motion |
| C14 | Focus visible: brass outline 2px + glow | `decorations.css` a11y |
| C15 | `--theme-text-muted` WCAG AA na dark wood: použít `#b8a070` nebo brighter (test contrast) | `index.ts` |

---

## 1. Pořadí commitů

| # | Změna | Soubory | Commit message |
|---|---|---|---|
| **1** | Asset konverze (`themes:optimize` + nový `finalize-hospoda-assets.mjs`) | `public/themes/hospoda/decor/*.webp` (12 souborů + logo + medailon) | `chore(themes/hospoda): krok 1.0j #1 — convert + resize source PNGs to webp` |
| **2** | Plný přepis `index.ts` (paleta + tokens + assety + reducedMotion) | `src/themes/themes/hospoda/index.ts` | `feat(themes/hospoda): krok 1.0j #2 — full token model rewrite` |
| **3** | Plný přepis `decorations.css` — chrome, corners, NavItem, topbar, welcome card, novinky | `src/themes/themes/hospoda/decorations.css` | `feat(themes/hospoda): krok 1.0j #3 — full decorations rewrite` |
| **4** | Animace — hearth pulse, banner flutter, candle flicker, brass shine | `src/themes/themes/hospoda/decorations.css` | `feat(themes/hospoda): krok 1.0j #4 — animations + microinteractions` |
| **5** | Spodní pás se stolem (fixed bottom strip) + body padding | `src/themes/themes/hospoda/decorations.css` | `feat(themes/hospoda): krok 1.0j #5 — bottom table-clutter strip` |
| **6** | Mobile + tablet breakpointy (480/768/1024/1280px) | `src/themes/themes/hospoda/decorations.css` | `feat(themes/hospoda): krok 1.0j #6 — mobile + tablet breakpoints` |
| **7** | A11y polish — focus visible, reduced motion, scrollbar, forced-colors fallback | `src/themes/themes/hospoda/decorations.css` | `feat(themes/hospoda): krok 1.0j #7 — a11y + reduced motion polish` |

**Po každém commitu:** spustit `npm run typecheck` + manuální zkontrolování v dev serveru (přepnout na hospoda + jiné téma → ověřit no regrese).

---

## 2. Krok 1 — Asset konverze (detail)

### 2.1 Cílové soubory

Po `themes:optimize` + `finalize-hospoda-assets.mjs`:

| Zdroj (`assets-source/themes/hospoda/`) | Cíl (`public/themes/hospoda/decor/`) | Encode + resize |
|---|---|---|
| `logo.png` | `logo.webp` | zachovat orig (cwebp -q 92 -alpha_q 100) |
| `medailon.png` | `medailon.webp` | zachovat orig (cwebp -q 92 -alpha_q 100) |
| `corner-tl.png` | `corner-tl.webp` | resize 256×256 + sharpen sigma 0.4 |
| `icon-uvodnik.png` | `icon-uvodnik.webp` | resize 96×96 + sharpen sigma 0.4 |
| `icon-vytvorit-svet.png` | `icon-vytvorit-svet.webp` | resize 96×96 + sharpen sigma 0.4 |
| `icon-diskuze.png` | `icon-diskuze.webp` | resize 96×96 + sharpen sigma 0.4 |
| `icon-clanky.png` | `icon-clanky.webp` | resize 96×96 + sharpen sigma 0.4 |
| `icon-galerie.png` | `icon-galerie.webp` | resize 96×96 + sharpen sigma 0.4 |
| `icon-napoveda.png` | `icon-napoveda.webp` | resize 96×96 + sharpen sigma 0.4 |
| `icon-hospoda.png` | `icon-hospoda.webp` | resize 96×96 + sharpen sigma 0.4 |
| `decor-table-clutter.png` | `decor-table-clutter.webp` | resize 1200×120 (fit: cover) + sharpen sigma 0.4 |
| `iron-clasp-divider.png` | `iron-clasp-divider.webp` | resize 240×32 (fit: contain) + sharpen sigma 0.5 |
| `brass-stamp-ikaros.png` | `brass-stamp-ikaros.webp` | resize 96×96 + sharpen sigma 0.5 |

### 2.2 Pipeline

**Krok A:** `npm run themes:optimize` (existující skript) — auto-detekuje `assets-source/themes/hospoda/` a vytvoří initial WebP konverze v `public/themes/hospoda/decor/` (zachová orig rozměry).

**Krok B:** Vytvořit `scripts/finalize-hospoda-assets.mjs` (klon `finalize-pergamen-assets.mjs` s upravenými TASKS):

```js
import sharp from 'sharp';
import path from 'node:path';
import { stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const DECOR = path.resolve('public/themes/hospoda/decor');

const TASKS = [
  { in: 'corner-tl.webp',           out: 'corner-tl.webp',           w: 256,  h: 256 },
  { in: 'icon-uvodnik.webp',        out: 'icon-uvodnik.webp',        w: 96,   h: 96  },
  { in: 'icon-vytvorit-svet.webp',  out: 'icon-vytvorit-svet.webp',  w: 96,   h: 96  },
  { in: 'icon-diskuze.webp',        out: 'icon-diskuze.webp',        w: 96,   h: 96  },
  { in: 'icon-clanky.webp',         out: 'icon-clanky.webp',         w: 96,   h: 96  },
  { in: 'icon-galerie.webp',        out: 'icon-galerie.webp',        w: 96,   h: 96  },
  { in: 'icon-napoveda.webp',       out: 'icon-napoveda.webp',       w: 96,   h: 96  },
  { in: 'icon-hospoda.webp',        out: 'icon-hospoda.webp',        w: 96,   h: 96  },
  { in: 'decor-table-clutter.webp', out: 'decor-table-clutter.webp', w: 1200, h: 120, fit: 'cover' },
  { in: 'iron-clasp-divider.webp',  out: 'iron-clasp-divider.webp',  w: 240,  h: 32,  fit: 'contain', sharper: true },
  { in: 'brass-stamp-ikaros.webp',  out: 'brass-stamp-ikaros.webp',  w: 96,   h: 96,  sharper: true },
];

// (zbytek logiky shodný s finalize-pergamen-assets.mjs)
```

**Krok C:** `node scripts/finalize-hospoda-assets.mjs` → ověření výstupů.

### 2.3 Akcepční podmínka

`ls public/themes/hospoda/decor/` → 13 `.webp` souborů (logo, medailon, corner-tl, 7× icon-*, decor-table-clutter, iron-clasp-divider, brass-stamp-ikaros). Žádný neexistuje > 200 KB (kromě decor-table-clutter ~150 KB).

---

## 3. Krok 2 — `index.ts` přepis (detail)

Plný overwrite stávajícího `src/themes/themes/hospoda/index.ts` (51 řádků → cca 130 řádků dle pergamen vzoru).

### 3.1 Struktura tokenů

Viz spec sekce 4.11 — kompletní list. Klíčové bloky:

```ts
import type { Theme } from '@/themes/types';

const decor = '/themes/hospoda/decor';

export const hospodaTheme: Theme = {
  id: 'hospoda',
  name: 'Hospoda',
  scope: 'both',
  atmosphere:
    'Středověká krčma „U Letícího Orla" — warm hearth, dubové trámy, kovaná mosaz, vínová heraldika',
  vars: {
    /* ── Background overlay (H1 — pure darken) ── */
    '--theme-bg-overlay':
      'linear-gradient(180deg, rgba(20, 12, 4, 0.55) 0%, rgba(20, 12, 4, 0.72) 100%)',

    /* ── Surfaces (tmavé dřevo) ── */
    '--theme-surface':        'rgba(44, 26, 10, 0.92)',
    '--theme-surface-strong': 'rgba(28, 18, 8, 0.96)',
    '--theme-surface-soft':   'rgba(74, 46, 21, 0.55)',

    /* ── Hearth (warm fire) ── */
    '--theme-hearth-deep':       '#1a0f06',
    '--theme-hearth-wood':       '#2c1a0a',
    '--theme-hearth-wood-warm':  '#4a2e15',
    '--theme-hearth-bronze':     '#7a5028',
    '--theme-hearth-amber':      '#d4944a',
    '--theme-hearth-glow':       '#ffb260',
    '--theme-hearth-flame':      '#ff7028',

    /* ── Parchment ── */
    '--theme-parch-warm':    '#f0deaa',
    '--theme-parch-aged':    '#e8d4a0',
    '--theme-parch-stained': '#c8a878',

    /* ── Banner (heraldic) ── */
    '--theme-banner-burgundy':        '#8a1520',
    '--theme-banner-burgundy-bright': '#b01828',

    /* ── Ale ── */
    '--theme-ale-foam':  '#f4e8c4',
    '--theme-ale-amber': '#c0843e',
    '--theme-ale-dark':  '#6b3a14',

    /* ── Iron + brass ── */
    '--theme-iron-cold':    '#2a2620',
    '--theme-iron-warm':    '#3a3128',
    '--theme-brass-base':   '#8a6428',
    '--theme-brass-shine':  '#d4a050',

    /* ── Borders ── */
    '--theme-border':         'var(--theme-brass-base)',
    '--theme-border-soft':    'rgba(138, 100, 40, 0.30)',
    '--theme-border-strong':  'var(--theme-brass-shine)',
    '--theme-border-iron':    'var(--theme-iron-cold)',
    '--theme-border-burgundy':'rgba(138, 21, 32, 0.55)',

    /* ── Text (audit C15 — WCAG safe) ── */
    '--theme-text':            '#e8d4a0',
    '--theme-text-muted':      '#b8a070',
    '--theme-heading':         'var(--theme-brass-shine)',
    '--theme-text-on-brass':   '#1a0f06',
    '--theme-text-on-burgundy':'#f0deaa',
    '--theme-text-on-parch':   '#2a1808',

    /* ── Glows ── */
    '--theme-glow-amber':         'rgba(255, 178, 96, 0.45)',
    '--theme-glow-amber-strong':  'rgba(255, 178, 96, 0.70)',
    '--theme-glow-burgundy':      'rgba(138, 21, 32, 0.40)',
    '--theme-glow-brass':         'rgba(212, 160, 80, 0.45)',
    '--theme-shadow':             'rgba(20, 12, 4, 0.85)',

    /* ── Nav hover/active ── */
    '--theme-nav-hover-bg':   'rgba(138, 21, 32, 0.16)',
    '--theme-nav-active-bg':
      'linear-gradient(90deg, rgba(138, 21, 32, 0.45) 0%, rgba(44, 26, 10, 0.65) 100%)',

    /* ── Legacy mapping (pro shared CSS) ── */
    '--bg-primary':       '#1a0f06',
    '--bg-secondary':     '#2c1a0a',
    '--bg-card':          'var(--theme-parch-warm)',
    '--bg-card-hover':    '#f5e6b8',
    '--accent':           'var(--theme-banner-burgundy)',
    '--accent-bright':    'var(--theme-banner-burgundy-bright)',
    '--accent-dim':       '#600810',
    '--accent-soft':      'var(--theme-border-soft)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       '#806040',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    'rgba(138, 100, 40, 0.16)',
    '--border-strong':    'var(--theme-border-strong)',
    '--success':              '#3a8a4e',
    '--success-soft':         'rgba(58, 138, 78, 0.14)',
    '--success-soft-border':  'rgba(58, 138, 78, 0.4)',
    '--warning':              'var(--theme-brass-shine)',
    '--warning-soft':         'rgba(212, 160, 80, 0.14)',
    '--warning-soft-border':  'rgba(212, 160, 80, 0.4)',
    '--danger':               'var(--theme-banner-burgundy)',
    '--danger-soft':          'rgba(138, 21, 32, 0.14)',
    '--danger-soft-border':   'rgba(138, 21, 32, 0.4)',
    '--danger-focus-ring':    'rgba(138, 21, 32, 0.3)',
    '--info':                 'var(--theme-brass-shine)',
    '--text-on-accent':       'var(--theme-text-on-burgundy)',
    '--text-on-danger':       '#f0deaa',
    '--bg-overlay':           'rgba(20, 12, 4, 0.7)',

    /* ── Typography ── */
    '--font-logo':    '"Almendra", "MedievalSharp", Georgia, serif',
    '--font-display': '"Cinzel Decorative", "Cinzel", Georgia, serif',
    '--font-body':    '"Lora", "EB Garamond", Georgia, serif',
    '--font-script':  '"IM Fell English SC", "IM Fell English", "Lora", Georgia, serif',

    /* ── Layout chrome ── */
    '--header-h':            '56px',
    '--header-bg':           '#2c1a0a',
    '--frame-pad-y':         '40px',
    '--frame-pad-x':         '18px',
    '--sidebar-w':           '280px',

    '--asset-logo-w':         '240px',
    '--asset-logo-w-mobile':  '180px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    /* ── Asset URLs ── */
    '--asset-logo':              `url('${decor}/logo.webp')`,
    '--asset-medailon-banner':   `url('${decor}/medailon.webp')`,
    '--asset-corner':            `url('${decor}/corner-tl.webp')`,
    '--asset-corner-size':       '120px',
    '--asset-corner-size-mobile':'64px',
    '--frame-corner-inset':      '8px',

    '--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
    '--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
    '--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
    '--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
    '--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
    '--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,

    '--asset-table-clutter':      `url('${decor}/decor-table-clutter.webp')`,
    '--asset-iron-clasp':         `url('${decor}/iron-clasp-divider.webp')`,
    '--asset-brass-stamp':        `url('${decor}/brass-stamp-ikaros.webp')`,
  },
  fonts: {
    logo: 'Almendra',
    display: 'Cinzel Decorative',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/hospoda.webp',
  background: '/themes/backgrounds/hospoda.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

### 3.2 Akcepční podmínka

`npm run typecheck` projde, žádné chyby v `Theme` typu. `npm run lint:colors` projde (žádné hardcoded barvy v decorations.css — všechno přes `var(--theme-*)`).

---

## 4. Krok 3 — `decorations.css` přepis (detail)

Plný overwrite stávajícího `src/themes/themes/hospoda/decorations.css` (16 řádků → cca 600–700 řádků dle pergamen pattern).

### 4.1 Sekce (pořadí v souboru)

1. **Background-color fallback** — `[data-theme="hospoda"] { background-color: var(--bg-primary) }`
2. **Atmosférický overlay** — `::before` na shell, jen darken (H1)
3. **Hearth pulse** — `::after` na shell, animated radial-gradient (H2)
4. **Topbar slim 56px** — solidní těžký dub + brass hairline (H3)
5. **Logo banner** — `var(--asset-logo)` v topbaru
6. **Header buttons** — dřevěné cedulky s mosazným okrajem + amber Cinzel Decorative
7. **Glass panely** — `[data-frame-panel]` tmavé dřevo + brass border + corner ornaments
8. **Welcome card** — krčmářský papír + ohnuté rohy (CSS) + 4 brass nity (CSS) (H4)
9. **Heraldický banner medailon** — vlevo welcome, 250×340 desktop / 100×136 mobile (H6) + flutter (H7)
10. **Section title** — brass Cinzel Decorative + iron clasp gradient s 2 nity
11. **NavItem (btn3d)** — vyřezávané dřevo + brass okraj, brass shine sweep hover, candle flicker active
12. **Pravý panel** — empty hints + brass stamp na rightAddBtn (H5)
13. **PJ badge** — burgundy bg + brass border + amber glow
14. **Welcome heading + signature** — IM Fell English SC + tmavý ink + burgundy script italic
15. **Nav ikony — 7 unikátních medailonů** přes `data-nav-key`
16. **Novinky panel** — brass stamp na PŘIDAT NOVINKU (H5)
17. **Spodní pás se stolem** — `::after` na body nebo separate element, fixed bottom (krok 5)
18. **Focus visible** — brass outline 2px + amber glow
19. **Scrollbar styling** — brass thumb
20. **Tablet (≤1279px)** — menší corner, table-clutter scale
21. **Mobile (≤768px)** — corner mobile size, banner mobile, table-clutter hidden, header icon-only
22. **Reduced motion** — vypnout všechny animace
23. **Forced colors** — fallback pro corner ornaments + medailony

### 4.2 Klíčové selektory

```css
/* Atmosférický overlay (H1) */
[data-theme="hospoda"][data-shell="ikaros"]::before {
  content: '';
  position: fixed;
  inset: 0;
  background: var(--theme-bg-overlay);
  pointer-events: none;
  z-index: 0;
}

/* Topbar solidní těžký dub (H3) */
[data-theme="hospoda"][data-shell="ikaros"] > header {
  position: relative;
  background:
    linear-gradient(180deg, #2c1a0a 0%, #1a0e06 100%),
    repeating-linear-gradient(90deg, transparent 0, transparent 40px, rgba(74, 46, 21, 0.08) 40px, rgba(74, 46, 21, 0.08) 41px);
  border-bottom: 1px solid var(--theme-brass-base);
  box-shadow: 0 1px 0 rgba(212, 160, 80, 0.18), 0 4px 12px rgba(20, 12, 4, 0.6);
}

/* Brass hairline pod topbarem */
[data-theme="hospoda"][data-shell="ikaros"] > header::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: -3px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--theme-brass-shine) 25%,
    var(--theme-brass-shine) 75%,
    transparent 100%
  );
  opacity: 0.55;
  pointer-events: none;
  filter: drop-shadow(0 0 4px var(--theme-glow-brass));
}

/* Glass panely — dřevo + brass border + corner */
[data-theme="hospoda"] [data-frame-panel="sidebar"],
[data-theme="hospoda"] [data-frame-panel="right"],
[data-theme="hospoda"] [data-frame-panel="novinky"] {
  position: relative;
  background:
    linear-gradient(160deg, rgba(44, 26, 10, 0.92) 0%, rgba(28, 18, 8, 0.96) 100%);
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  border: 1px solid var(--theme-iron-cold);
  border-radius: 6px;
  isolation: isolate;
  overflow: visible;
  box-shadow:
    inset 0 0 0 1px rgba(138, 100, 40, 0.18),
    0 6px 22px rgba(20, 12, 4, 0.65);
}

/* Welcome card — krčmářský papír s ohnutými rohy + 4 brass nity (H4) */
[data-theme="hospoda"] [data-frame-panel="card"] {
  position: relative;
  background:
    radial-gradient(ellipse at 50% 35%, var(--theme-parch-warm) 0%, var(--theme-parch-aged) 60%, var(--theme-parch-stained) 100%);
  border: 1px solid #604030;
  border-radius: 4px;
  box-shadow:
    inset 0 0 0 1px rgba(96, 64, 48, 0.18),
    inset 0 0 60px rgba(96, 64, 48, 0.10),
    0 8px 28px rgba(20, 12, 4, 0.70);
  min-height: clamp(420px, 60vh, 720px);
  isolation: isolate;
}

/* Ohnuté rohy welcome cardu (CSS-only, žádný asset) */
[data-theme="hospoda"] [data-frame-panel="card"]::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  /* 4 corner gradient overlays simulující ohnutý papír */
  background:
    /* TL */ linear-gradient(135deg, rgba(96, 64, 48, 0.18) 0%, transparent 16px),
    /* TR */ linear-gradient(225deg, rgba(96, 64, 48, 0.18) 0%, transparent 16px),
    /* BL */ linear-gradient(45deg,  rgba(96, 64, 48, 0.18) 0%, transparent 16px),
    /* BR */ linear-gradient(315deg, rgba(96, 64, 48, 0.18) 0%, transparent 16px);
  background-position: top left, top right, bottom left, bottom right;
  background-size: 30px 30px;
  background-repeat: no-repeat;
  z-index: 1;
}

/* 4 brass nity v rozích welcome cardu (CSS-only) */
[data-theme="hospoda"] [data-frame-panel="card"]::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 14px 14px, var(--theme-brass-shine) 0px, var(--theme-brass-base) 4px, transparent 5px),
    radial-gradient(circle at calc(100% - 14px) 14px, var(--theme-brass-shine) 0px, var(--theme-brass-base) 4px, transparent 5px),
    radial-gradient(circle at 14px calc(100% - 14px), var(--theme-brass-shine) 0px, var(--theme-brass-base) 4px, transparent 5px),
    radial-gradient(circle at calc(100% - 14px) calc(100% - 14px), var(--theme-brass-shine) 0px, var(--theme-brass-base) 4px, transparent 5px);
  filter: drop-shadow(0 1px 2px rgba(20, 12, 4, 0.5));
  z-index: 2;
}

/* Heraldický banner medailon (H6) */
[data-theme="hospoda"] [data-andel-medallion] {
  width: 250px;
  height: 340px;
  background-image: var(--asset-medailon-banner);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  flex-shrink: 0;
  filter: drop-shadow(0 6px 14px rgba(20, 12, 4, 0.6));
  /* Banner flutter (H7) */
  animation: hospoda-banner-flutter 6s ease-in-out infinite;
  transform-origin: top center;
}

/* 7 medailonů přes data-nav-key */
[data-theme="hospoda"] [data-nav-key] [class*="navItemIcon"] {
  width: 22px;
  height: 22px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  filter: drop-shadow(0 0 3px var(--theme-glow-brass));
}
[data-theme="hospoda"] [data-nav-key] [class*="navItemIcon"] svg { display: none; }

[data-theme="hospoda"] [data-nav-key="uvodnik"]       [class*="navItemIcon"] { background-image: var(--asset-icon-uvodnik); }
[data-theme="hospoda"] [data-nav-key="vytvorit-svet"] [class*="navItemIcon"] { background-image: var(--asset-icon-vytvorit-svet); }
[data-theme="hospoda"] [data-nav-key="diskuze"]       [class*="navItemIcon"] { background-image: var(--asset-icon-diskuze); }
[data-theme="hospoda"] [data-nav-key="clanky"]        [class*="navItemIcon"] { background-image: var(--asset-icon-clanky); }
[data-theme="hospoda"] [data-nav-key="galerie"]       [class*="navItemIcon"] { background-image: var(--asset-icon-galerie); }
[data-theme="hospoda"] [data-nav-key="napoveda"]      [class*="navItemIcon"] { background-image: var(--asset-icon-napoveda); }
[data-theme="hospoda"] [data-nav-key="hospoda"]       [class*="navItemIcon"] { background-image: var(--asset-icon-hospoda); }

/* Brass stamp CTA na "+" tlačítkách (H5) */
[data-theme="hospoda"] [class*="rightAddBtn"]::before,
[data-theme="hospoda"] [data-frame-panel="novinky"] [class*="addBtn"]::before {
  content: '';
  display: inline-block;
  width: 28px;
  height: 28px;
  background-image: var(--asset-brass-stamp);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  margin-right: 8px;
  vertical-align: middle;
  filter: drop-shadow(0 0 3px var(--theme-glow-brass));
  transition: transform 150ms ease;
}
[data-theme="hospoda"] [class*="rightAddBtn"]:active::before,
[data-theme="hospoda"] [data-frame-panel="novinky"] [class*="addBtn"]:active::before {
  transform: scale(0.92);
}
/* Skrýt lucide Plus ikonu na CTA tlačítkách */
[data-theme="hospoda"] [class*="rightAddBtn"] > svg,
[data-theme="hospoda"] [data-frame-panel="novinky"] [class*="addBtn"] > svg {
  display: none;
}

/* Section title — brass Cinzel + iron clasp divider */
[data-theme="hospoda"] [class*="sectionTitle"] {
  color: var(--theme-brass-shine);
  text-transform: uppercase;
  letter-spacing: 0.20em;
  font-family: var(--font-display);
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(20, 12, 4, 0.7);
  position: relative;
  padding-bottom: 12px;
}
[data-theme="hospoda"] [class*="sectionTitle"]::after {
  content: '';
  display: block;
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 12px;
  background-image: var(--asset-iron-clasp);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.85;
}
```

> ⚠️ **DOM challenges** — pergamen měl big-book + bookmark hooks. Hospoda **není** tak komplikovaná:
> - **Žádný big-book** (vyloučeno) → žádný DOM hook potřeba
> - **Žádný bookmark** (vyloučeno) → žádný DOM hook potřeba
> - **Welcome card pseudo-elementy** ::before + ::after — používáme pro ohnuté rohy + brass nity. **Corner ornamenty** na welcome cardu používají existující `[class*="ornament"]` pattern z CornerOrnament komponenty (per pergamen).
> - **Brass stamp** přes `::before` na `[class*="rightAddBtn"]` + `[class*="addBtn"]` — funguje, lucide SVG schovaná.

### 4.3 Akcepční podmínka

- `npm run dev` → přepnout na hospoda → vizuálně srovnatelné s `assets-source/themes/references/hospoda.png`
- 7 medailonů viditelných v sidebar, každá rozlišitelná
- Welcome card má světlý parchment, ohnuté rohy (subtle gradient overlays), 4 brass nity v rozích
- Heraldický banner vlevo welcome cardu
- Brass stamp vlevo "PŘIDAT NOVINKU" + "+" tlačítek v pravém panelu

---

## 5. Krok 4 — Animace + mikrointerakce

Sekce v `decorations.css` po welcome card sekci.

### 5.1 Hearth pulse (H2)

```css
[data-theme="hospoda"][data-shell="ikaros"]::after {
  content: '';
  position: fixed;
  left: 0; right: 0; bottom: 0;
  height: 60vh;
  background: radial-gradient(
    ellipse at 50% 100%,
    rgba(255, 178, 96, 0.42) 0%,
    rgba(255, 112, 40, 0.18) 35%,
    transparent 65%
  );
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: screen;
  animation: hospoda-hearth-pulse 6s ease-in-out infinite;
}

@keyframes hospoda-hearth-pulse {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1.00; }
}
```

### 5.2 Banner flutter (H7)

```css
@keyframes hospoda-banner-flutter {
  0%, 100% { transform: scaleY(1.000); }
  50%      { transform: scaleY(0.985); }
}
```
(Applied na `[data-andel-medallion]` v 4.2 výše.)

### 5.3 Candle flicker na active NavItem

```css
[data-theme="hospoda"] [class*="btn3dActive"],
[data-theme="hospoda"] [class*="navItemActive"] {
  animation: hospoda-candle-flicker 3s ease-in-out infinite;
}

@keyframes hospoda-candle-flicker {
  0%, 100% { box-shadow: 0 0 8px var(--theme-glow-amber), inset 2px 0 0 0 var(--theme-brass-shine); }
  50%      { box-shadow: 0 0 14px var(--theme-glow-amber-strong), inset 2px 0 0 0 var(--theme-brass-shine); }
}
```

### 5.4 Brass shine sweep na CTA hover

```css
[data-theme="hospoda"] [class*="rightAddBtn"]:hover,
[data-theme="hospoda"] [data-frame-panel="novinky"] [class*="addBtn"]:hover {
  position: relative;
  overflow: hidden;
}
[data-theme="hospoda"] [class*="rightAddBtn"]:hover::after,
[data-theme="hospoda"] [data-frame-panel="novinky"] [class*="addBtn"]:hover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(212, 160, 80, 0.30) 50%,
    transparent 100%
  );
  animation: hospoda-brass-sweep 800ms ease-out;
  pointer-events: none;
}

@keyframes hospoda-brass-sweep {
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
}
```

### 5.5 Akcepční podmínka

- DevTools → Animations panel → 3 active animations při hover na CTA + active NavItem + load page
- Reduced motion: všechny animace stop, jen razidlo scale (klik) zachováno

---

## 6. Krok 5 — Spodní pás se stolem (H8)

```css
/* Spodní pás se stolem (fixed full-width) */
[data-theme="hospoda"]::after {
  /* ⚠️ Konflikt s hearth pulse ::after na shell — proto použijeme separate selektor */
}
```

> ⚠️ **Implementační challenge**: Hearth pulse používá `[data-shell="ikaros"]::after`. Table-clutter pás potřebuje vlastní layer. **Řešení**:
>
> **Možnost A** (preferovaná): Hearth pulse přesunout na `[data-theme="hospoda"][data-shell="ikaros"]::after` (jak v 5.1) a table-clutter na `body[data-theme="hospoda"]::before` (separate scope). Verifikace v krok 4: `data-theme` se aplikuje na `<body>`?
>
> **Možnost B** (fallback): Použít separate `<div>` injected via decorations.css pomocí `:has()` selektoru — `[data-theme="hospoda"]:has([data-shell="ikaros"])` a custom z-indexing.
>
> **Možnost C** (clean ale invasive): Přidat element `<div data-decor="table-clutter">` do `IkarosLayout.tsx` — porušuje "žádný shared edit". Diskutovat s userem před použitím.

### 6.1 Implementace (Možnost A)

```css
/* Hearth pulse — overlay na shell */
[data-theme="hospoda"][data-shell="ikaros"]::after {
  /* viz 5.1 */
}

/* Spodní pás se stolem — na body element */
body[data-theme="hospoda"]::before {
  content: '';
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background-image: var(--asset-table-clutter);
  background-size: cover;
  background-position: bottom center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 5; /* pod modaly (z-index 100+), nad běžným contentem */
}

/* Body padding-bottom kvůli fixed pásu (H9) */
body[data-theme="hospoda"] {
  padding-bottom: 100px;
}
```

### 6.2 Akcepční podmínka

- Spodní pás visible přes celou šířku, sticky to bottom
- Žádný content scrollbar pod pásem (body padding-bottom funguje)
- Modaly (login, register) nad pásem — z-index check
- Click přes pás funguje na elementy pod ním (pointer-events: none)

---

## 7. Krok 6 — Mobile + tablet breakpointy

Sekce 20-21 v `decorations.css`.

### 7.1 Tablet (1024–1279px)
```css
@media (max-width: 1279px) {
  [data-theme="hospoda"] [data-frame-panel] [class*="ornament"] {
    --asset-corner-size: 96px;
  }
  body[data-theme="hospoda"]::before {
    height: 80px;
  }
  body[data-theme="hospoda"] {
    padding-bottom: 80px;
  }
}
```

### 7.2 Mobile (≤768px) — H8 + H9 + C10–C13
```css
@media (max-width: 768px) {
  [data-theme="hospoda"] [data-frame-panel="sidebar"],
  [data-theme="hospoda"] [data-frame-panel="right"],
  [data-theme="hospoda"] [data-frame-panel="card"],
  [data-theme="hospoda"] [data-frame-panel="novinky"] {
    border-radius: 4px;
  }

  /* Corner zmenšen */
  [data-theme="hospoda"] [data-frame-panel] [class*="ornament"] {
    --asset-corner-size: 64px;
    opacity: 0.7;
  }
  /* Drawer mode — corner schovaný */
  [data-theme="hospoda"] [class*="drawer"] [data-frame-panel] [class*="ornament"],
  [data-theme="hospoda"] [data-drawer-open] [data-frame-panel] [class*="ornament"] {
    display: none;
  }

  /* Welcome card mobile */
  [data-theme="hospoda"] [data-frame-panel="card"] {
    min-height: clamp(360px, 50vh, 560px);
  }

  /* Heraldický banner zmenšen */
  [data-theme="hospoda"] [data-andel-medallion] {
    width: 100px;
    height: 136px;
  }

  /* Spodní pás SKRYT na mobile (H8) */
  body[data-theme="hospoda"]::before {
    display: none;
  }
  body[data-theme="hospoda"] {
    padding-bottom: 0;
  }

  /* Nav ikony — menší medailony */
  [data-theme="hospoda"] [data-nav-key] [class*="navItemIcon"] {
    width: 18px;
    height: 18px;
  }

  /* Touch target ≥48px (C11) */
  [data-theme="hospoda"] [class*="navItem"] {
    min-height: 48px;
  }

  /* Header buttony icon-only (C10) */
  [data-theme="hospoda"] [class*="headerBtn"]:not([class*="headerBtnIcon"]):not([class*="headerBtnLabel"]):not([class*="headerBtnActive"]):not([class*="headerBtnPrimary"]):not([class*="headerBtnDisabled"]) {
    padding: 0 10px;
    height: 36px;
    min-height: 36px;
    font-size: 0.7rem;
  }
  [data-theme="hospoda"] [class*="headerBtnLabel"] {
    display: none;
  }

  /* Brass stamp CTA mobile — zmenšeno */
  [data-theme="hospoda"] [class*="rightAddBtn"]::before,
  [data-theme="hospoda"] [data-frame-panel="novinky"] [class*="addBtn"]::before {
    width: 22px;
    height: 22px;
    margin-right: 6px;
  }
}
```

### 7.3 Mobile small (≤480px)
- TYKY + ODHLÁSIT do hamburger drawer (existující IkarosLayout pattern, žádný theme-specific code)

### 7.4 Akcepční podmínka

DevTools responsive mode na 320/375/768/1024/1280 → žádný overflow, žádný overlap, text čitelný, table-clutter respektuje breakpointy.

---

## 8. Krok 7 — A11y polish (C12–C15)

### 8.1 Focus visible (C14)
```css
[data-theme="hospoda"] [class*="navItem"]:focus-visible,
[data-theme="hospoda"] [class*="btn3d"]:focus-visible,
[data-theme="hospoda"] [class*="showAllLink"]:focus-visible,
[data-theme="hospoda"] [class*="rightAddBtn"]:focus-visible,
[data-theme="hospoda"] [class*="addBtn"]:focus-visible,
[data-theme="hospoda"] [class*="headerBtn"]:not([class*="headerBtnIcon"]):not([class*="headerBtnLabel"]):focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px var(--bg-primary),
    0 0 0 4px var(--theme-brass-shine),
    0 0 14px var(--theme-glow-amber-strong);
}
```

### 8.2 Reduced motion (C13)
```css
@media (prefers-reduced-motion: reduce) {
  [data-theme="hospoda"] *,
  [data-theme="hospoda"][data-shell="ikaros"]::after,
  body[data-theme="hospoda"]::before {
    animation: none !important;
    transition: none !important;
  }
  /* Razidlo scale na klik je UX feedback — ponechat krátký transition */
  [data-theme="hospoda"] [class*="rightAddBtn"]::before,
  [data-theme="hospoda"] [data-frame-panel="novinky"] [class*="addBtn"]::before {
    transition: transform 150ms ease !important;
  }
}
```

### 8.3 Forced colors (Windows high contrast)
```css
@media (forced-colors: active) {
  [data-theme="hospoda"] [data-frame-panel] [class*="ornament"],
  [data-theme="hospoda"] [data-andel-medallion],
  [data-theme="hospoda"] [data-nav-key] [class*="navItemIcon"] {
    forced-color-adjust: none;
  }
  body[data-theme="hospoda"]::before {
    display: none; /* table-clutter v high-contrast bez významu */
  }
}
```

### 8.4 Scrollbar
```css
[data-theme="hospoda"] [data-frame-panel] {
  scrollbar-color: var(--theme-brass-shine) var(--theme-surface);
  scrollbar-width: thin;
}
[data-theme="hospoda"] [data-frame-panel]::-webkit-scrollbar { width: 8px; }
[data-theme="hospoda"] [data-frame-panel]::-webkit-scrollbar-track { background: var(--theme-surface); }
[data-theme="hospoda"] [data-frame-panel]::-webkit-scrollbar-thumb { background: var(--theme-brass-shine); border-radius: 4px; }
```

### 8.5 Akcepční podmínka

- Lighthouse a11y score ≥95
- Tab navigace přes všechny interaktivní prvky → vidíme brass focus ring
- DevTools `prefers-reduced-motion: reduce` → žádné transitions/animace, jen razidlo scale
- DevTools forced-colors mode → ornamenty viditelné, table-clutter hidden
- `npm run audit:contrast` projde pro hospoda theme

---

## 9. Test plán (po commitech)

### 9.1 Manuální QA — viewport sweep
| Viewport | Co kontrolovat |
|---|---|
| 1920×1080 | Plný layout vs. reference `hospoda.png` |
| 1440×900 | Corner 120px, hearth pulse subtle, table-clutter visible |
| 1280×800 | Stejně jako 1440 |
| 1024×768 | Tablet — corner 96px, table-clutter 80px |
| 768×1024 | Mobile začátek — table-clutter hidden, banner 100×136 |
| 414×896 | Mobile L — drawer, header icon-only, nav touch ≥48px |
| 320×568 | Mobile S — hamburger menu, vše čitelné |

### 9.2 WCAG audit
Chrome DevTools → Lighthouse → Accessibility → score ≥95
`npm run audit:contrast` → hospoda passing
Manuální color picker na:
- Welcome body (tmavý ink na parchment) → ≥4.5:1
- Header button text (amber na dub) → ≥4.5:1
- Section title (brass na dub) → ≥3:1
- NavItem klid + active → ≥4.5:1

### 9.3 Regression test
Přepnout v ThemeSwitcher na 5 random skinů: pergamen → priroda → vesmirna-lod → sci-fi → modre-nebe.
Každý vizuálně identický s pre-1.0j.

### 9.4 Animation QA
- Page load: hearth pulse rozjede 6s loop
- Banner flutter: subtle scaleY pohyb
- Hover na PŘIDAT NOVINKU: brass shine sweep 800ms one-shot
- Aktivní NavItem: candle flicker glow
- Klik na razidlo: scale 0.92 → 1.0 (150ms)

### 9.5 Mobile-desktop sweep
Po dokončení implementace spustit skill `mobil-desktop` (memory rule: každá UI úprava).

### 9.6 Storybook visual check
`npm run storybook` → Themes → Gallery → All Themes → hospoda thumbnail visible, theme switching funkční.

---

## 10. Risk register (impl-specific)

| Riziko | Pravděpodobnost | Mitigace |
|---|---|---|
| **Welcome card ::before/::after konflikty** — používáme oba pseudo-elementy pro ohnuté rohy + brass nity, ale CornerOrnament komponenta může mít vlastní pseudo styles | Střední | Zkontrolovat `CornerOrnament.module.css` v krok 4. Pokud konflikt, použít multi-layer background gradients místo separate pseudo-elementů |
| **`body[data-theme]` selektor nefunguje** — `data-theme` může být na `<html>` ne `<body>` | Střední | Verifikovat v krok 0 (`document.body.dataset.theme` v DevTools). Pokud na `<html>`, změnit na `html[data-theme="hospoda"]::before` |
| **Hearth pulse + table-clutter konflikt** na shell ::after | Střední | Možnost A v krok 5 (separate scopes — shell ::after = pulse, body ::before = clutter). Test v dev. |
| **Cinzel Decorative font není loaded** | Vysoká | Krok 0.4 verifikace + add font import pokud chybí |
| **AI generated assety mají generic look** (krčmářské vs pergamen distinction unclear) | Střední | Vizuální QA krok 5 v promptech: porovnat side-by-side hospoda vs pergamen ikony. Regenerate outliers. |
| **Spodní pás zakrývá modaly nebo sticky elementy** | Nízká | z-index: 5 (modaly mají 100+), pointer-events: none |
| **Table-clutter na různých rozlišeních cropped artefakty** | Střední | sharp `fit: cover` + `bottom center` background-position; test na 320–4K |
| **Banner flutter motion sickness** | Velmi nízká | Subtle scaleY ±1.5%, vypnuto v reduced-motion |
| **Asset pipeline `themes:optimize` selže na novém masteru** | Nízká | Pergamen pipeline funguje, pattern stejný; manual fallback `node scripts/finalize-hospoda-assets.mjs` |

---

## 11. Time estimate

| Krok | Estimovaný čas |
|---|---|
| Pre-flight (font check, DOM verifikace) | 15 min |
| 1. Asset konverze (script + verify) | 25 min |
| 2. Tokens rewrite | 15 min |
| 3. Decorations rewrite (chrome, panely, NavItem, welcome, novinky) | 90 min |
| 4. Animace + mikrointerakce | 30 min |
| 5. Spodní pás + body padding | 20 min |
| 6. Mobile + tablet breakpointy | 30 min |
| 7. A11y polish | 20 min |
| Test sweep + WCAG audit + Storybook check | 40 min |
| **CELKEM** | **~4.5 hod** |

---

## 12. Out of scope (znovu připomínka)

- **Žádný edit shared komponent** (`IkarosLayout`, `IkarosCard`, `CornerOrnament`, `WelcomeHero`, `DashboardPage`, `RightPanel`, `NovinkyPanel`) bez explicitní diskuze
- **Žádný edit shared CSS modulů**
- **Žádný edit `theme.css`** (kromě možného font import pro Cinzel Decorative — krok 0.4)
- **Žádné nové stránky / komponenty**
- **Žádný edit BG image** (`hospoda.webp` zůstává)
- **Žádný plakát "DNEŠNÍ SPECIÁL"**, **žádná láhev "IKAROS ALE"**, **žádný korbel+svíčka v cardu**, **žádný drop-cap "V"**, **žádný big-book**, **žádná knižní záložka** (vyloučeno z brainstormingu)
- **Žádný BE / data dopad**

---

## 13. Po implementaci

1. ✅ `git status` — všech 7 commits clean na branch `feat/krok-1.0j-hospoda-upgrade`
2. ✅ `npm run typecheck` — 0 errors
3. ✅ `npm run lint` + `npm run lint:colors` — clean
4. ✅ `npm run build` — build clean
5. ✅ `npm run dev` → manuální QA dle sekce 9
6. ✅ `npm run audit:contrast` — hospoda passing
7. ✅ Mobile-desktop sweep (skill `mobil-desktop`)
8. ✅ Storybook gallery vizuální regression
9. ✅ Screenshoty — uložit do `docs/arch/phase-1/screenshots-1.0j/` (volitelné)
10. ✅ Označit spec status jako ✅ Implementováno
11. ✅ Update `docs/themes/hospoda.md` (krátký design doc) na nový stav
12. ✅ Push branch (po user souhlasu) → PR

---

**Po schválení tohoto plánu — Claude začne implementovat (krok 1: asset konverze, jakmile budou všechny PNG dodány).**
