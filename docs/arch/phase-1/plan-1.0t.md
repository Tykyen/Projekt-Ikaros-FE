# Plán 1.0t — Postapo visual upgrade

**Datum:** 2026-05-11
**Spec:** [`spec-1.0t-postapo-upgrade.md`](spec-1.0t-postapo-upgrade.md) 🟡 ke schválení společně s tímto plánem
**Asset prompty:** ❌ **žádné** — postapo používá inline SVG, ne AI gen WEBP
**Branch:** `main` (přímý commit po dokončení, dle vzoru `1.0s`/`1.0r`/`1.0q`)
**Single PR** — kompletní skin v jednom kroku

---

## 0. Pre-flight ✅

| Item | Status | Poznámka |
|---|---|---|
| 3 PNG zdrojové assety | ✅ | `assets-source/themes/postapo/{logo,medailon}.png` (dodáno 2026-05-11) + `assets-source/themes/backgrounds/postapo.png` (existuje) |
| Vizuální audit dodaných assetů | ✅ | Logo = korodovaná železná cedule + nýty + Ikaros + drátěné popraváky; medailon = kovová deska s nýty + popraskaný beton + vybledlá Ikaros silueta; BG = toxická obloha + ruiny + havraní + varovná značka. Tier-1 kvalita, vše v industrial korodované estetice |
| `PanelCorners` injectuje `<CornerOrnament position="tl\|tr\|bl\|br" />` | ✅ | Stejný hook jako kyberpunk/arabsky-svet — používáme `[data-position]` selektor v CSS |
| Frontend-design audit | ✅ | 2026-05-11, schválen bunker terminal direction (Fallout/Metro/STALKER) |
| User odpovědi: ghost signal, AI WEBP | ✅ | Ghost signal = `"... POSLEDNÍ VYSÍLÁNÍ ..."`, žádné dodatečné assety |
| Inline SVG approach schválen | ✅ | 2026-05-11, žádné AI gen WEBP, 0 ChatGPT prompts |
| Spec schválen | 🟡 | Ke schválení s tímto plánem |

**Raster assety (3):**

| Asset | Zdroj | Cíl | Status |
|---|---|---|---|
| `logo.webp` | `assets-source/themes/postapo/logo.png` | `public/themes/postapo/decor/logo.webp` | ⏳ konvert |
| `medailon.webp` | `assets-source/themes/postapo/medailon.png` | `public/themes/postapo/decor/medailon.webp` | ⏳ konvert |
| `postapo.webp` (BG) | `assets-source/themes/backgrounds/postapo.png` | `public/themes/backgrounds/postapo.webp` | ⏳ re-konvert (kontrola aktuálnosti) |

**Inline SVG vars (~28 — všechny v `index.ts`, žádné externí soubory):**

| Var | Účel |
|---|---|
| `--asset-rivet-corner` | korodovaný L-shape s 2 nýty (master TL, 4× per panel přes scaleX/Y mirror) |
| `--asset-dust-strip` | vertikální column padajících drobných teček (popel/prach, repeat-y) |
| `--asset-crt-static` | pseudo-random noise tile 200×200px (CRT šum) |
| `--asset-hazard-stripe` | žluto-černá úhlopříčná páska 12×4px tile (horizontal) |
| `--asset-hazard-stripe-vertical` | žluto-černá úhlopříčná páska vertical variant (pro nav left stripe) |
| `--asset-geiger-pulse` | EKG waveform tile pro topbar scroll (flat line + občasný spike) |
| `--asset-stencil-noise` | sprejovaný tečky pattern (~80×24px tile) |
| `--asset-hazmat-radiation` | ☢ trefoil (NAVIGACE olive) |
| `--asset-hazmat-warning` | ⚠ triangle (VESMÍRY rust) |
| `--asset-hazmat-radio` | 📻 radio waves (CHAT yellow) |
| `--asset-hazmat-gear` | 🔧 gear with rivets (ADMINISTRACE yellow) |
| `--asset-hazmat-skull` | 💀 skull stamp (MOJE DISKUZE rust) |
| `--asset-hazmat-globe` | 🌐 cracked globe (MOJE SVĚTY olive) |
| `--asset-hazmat-clipboard` | 📋 clipboard stencil (OBLÍBENÉ ČLÁNKY amber) |
| `--asset-hazmat-biohazard` | ☣ biohazard trefoil (OBLÍBENÉ OBRÁZKY green) |
| `--asset-icon-uvodnik` | bunker door s nýty |
| `--asset-icon-vytvorit-svet` | globe with crack lines |
| `--asset-icon-diskuze` | broken walkie talkie |
| `--asset-icon-clanky` | stamped clipboard/dossier |
| `--asset-icon-galerie` | broken photo frame |
| `--asset-icon-napoveda` | military Q-stamp |
| `--asset-icon-hospoda` | broken beer mug stencil |
| `--asset-icon-administrace` | gear/admin stencil |
| `--asset-icon-moje-svety` | multi-globe glyph |
| `--asset-icon-moje-diskuze` | multi-skull glyph |
| `--asset-icon-oblibene-clanky` | pin+clipboard glyph |
| `--asset-icon-oblibene-obrazky` | pin+photo glyph |
| `--asset-signature-script` | administrator signature flourish SVG (self-draw stroke-dasharray) |
| `--asset-plus-stencil` | stencil sprejovaný „+" glyph |

(Reálně 29 vars; jednotlivé glyphy mohou sdílet helper template literal v index.ts.)

---

## 1. Kroky implementace

### Krok 1 — Konvert PNG → WEBP (jen 3 raster assety)

**1.1** Spustit existující pipeline:
```bash
npm run themes:optimize
```

To zpracuje:
- `assets-source/themes/postapo/logo.png` → `public/themes/postapo/decor/logo.webp`
- `assets-source/themes/postapo/medailon.png` → `public/themes/postapo/decor/medailon.webp`
- `assets-source/themes/backgrounds/postapo.png` → `public/themes/backgrounds/postapo.webp` (1920×1080 cover, případně re-konvert pokud existuje starší)

**Žádný `finalize-postapo-assets.mjs` skript NETVOŘÍME** — pro postapo není potřeba (nemáme AI gen ornamenty/ikony k resize).

**Verify:**
```bash
ls public/themes/postapo/decor/        # → logo.webp, medailon.webp
ls public/themes/backgrounds/postapo.webp   # → existuje, ~200–400 KB
```

---

### Krok 2 — Google Fonts: doplnit v `index.html`

V [`index.html`](../../../index.html) ověřit, zda existující Google Fonts URL obsahuje 3 nové fonty pro Postapo:

- `Black+Ops+One` (logo fallback — vojenský stencil)
- `Big+Shoulders+Stencil+Display` (display headings)
- `Special+Elite` (body — typewriter)

**Akce:** Grep `index.html` na tyto family, doplnit chybějící do existující `<link>` URL (mergovat parametry do jednoho linku, ne přidat nový tag).

Pozn.: původní postapo skin importoval `Oswald`, `Roboto Condensed`, `Roboto` — pokud nejsou potřeba pro jiné skiny, lze ponechat (decline-deletes only). Změnou stávajícího `index.ts` přepneme defaulty na nové fonty, staré zůstanou pro případné použití jinde.

---

### Krok 3 — `src/themes/themes/postapo/index.ts` — kompletní přepis

Velikost: ~280–320 řádků (z ~50). Většina objemu = inline SVG data-uri vars.

#### 3.1 Header komentář
```ts
/**
 * Postapo — Bunkr 7 pod ruinami Zóny 7. Poslední vysílání.
 *
 * Apokalyptický wasteland: korodovaný kov + radioaktivní puls + popel.
 * Industriální stencil typografie, žádný neon glow — jen matný kov.
 * Section-color-coded sekce (5 různě obarvených stencilů), geiger pulse,
 * caution hazard stripes, HAZMAT watermarks, CRT static drift, dust drift,
 * radio call sign, ghost signal flicker, DEAD WORLD stencil watermark.
 *
 * Spec: docs/arch/phase-1/spec-1.0t-postapo-upgrade.md
 * Plan: docs/arch/phase-1/plan-1.0t.md
 *
 * Žádné AI gen WEBP — všechny ornamenty inline SVG data-uri.
 */
```

#### 3.2 Base properties
- `id: 'postapo'` — zachovat
- `name: 'Postapo'` — zachovat
- `scope: 'both'` — zachovat
- `atmosphere:` — přepsat na `'Postapo — Bunkr 7 pod ruinami Zóny 7, korodovaný kov + radioaktivní puls + popel + CRT static + ghost signal + caution hazard stripes'`
- `reducedMotion: 'safe'` (6 animací mají reduced-motion fallback — dust drift, CRT static, geiger pulse, geiger scroll, ghost signal, signature self-draw)
- `thumbnail: '/themes/thumbnails/postapo.webp'` — zachovat (existuje, regenerace post-1.0t)
- `background: '/themes/backgrounds/postapo.webp'` — zachovat (kontrola aktuálnosti, případně re-konvert v Kroku 1)

#### 3.3 Přepsat `vars` — všechny tokens

**Skupiny tokens:**

```ts
vars: {
  // Background vrstvy (popel + zrezivělé železo)
  '--bg-primary':       '#0a0905',  // deep ash black
  '--bg-secondary':     '#14110a',  // rusted iron panel base
  '--bg-card':          '#1a1612',  // rusted iron card
  '--bg-card-hover':    '#221d15',  // dirty bronze lift
  '--bg-overlay':       'rgba(10, 9, 5, 0.80)',

  // Primary brand (toxic olive — matná radiace)
  '--accent':           '#8a8810',  // toxic olive — primary
  '--accent-bright':    '#a8a818',  // sotva svítí
  '--accent-dim':       '#484808',
  '--accent-soft':      'rgba(138, 136, 16, 0.15)',

  // Secondary primary (rust — korozivní)
  '--rust':             '#7a3810',  // deep rust orange — secondary
  '--rust-bright':      '#9a5020',  // rust amber
  '--rust-dim':         '#4a2010',
  '--rust-soft':        'rgba(122, 56, 16, 0.18)',

  // Section accents (5 sekcí + 6 nav items)
  '--caution-yellow':   '#c8a008',  // warning yellow — hazard stripes
  '--hazard-amber':     '#d68a20',  // hazard amber
  '--radioactive-green':'#6a8a30',  // geiger glow — sotva svítí
  '--concrete-grey':    '#484840',  // concrete neutral

  // Text (matný, bez glow)
  '--text-primary':     '#b0a888',  // bone ash — sotva čitelný ivory
  '--text-secondary':   '#857b66',  // dust beige
  '--text-muted':       '#5a523f',  // deep dust shadow
  '--text-on-accent':   '#0a0905',
  '--text-on-danger':   '#ffffff',

  // Borders
  '--border':           '#302e20',  // matný metal border
  '--border-subtle':    '#1c1a14',  // deep metal shadow
  '--border-strong':    '#7a3810',  // rust border accent

  // Status (postapo paleta)
  '--success':              '#6a8830',  // radioactive green
  '--success-soft':         'rgba(106, 136, 48, 0.14)',
  '--success-soft-border':  'rgba(106, 136, 48, 0.40)',
  '--warning':              '#c8a008',  // caution yellow
  '--warning-soft':         'rgba(200, 160, 8, 0.14)',
  '--warning-soft-border':  'rgba(200, 160, 8, 0.40)',
  '--danger':               '#9a4020',  // deep rust alert
  '--danger-soft':          'rgba(154, 64, 32, 0.16)',
  '--danger-soft-border':   'rgba(154, 64, 32, 0.40)',
  '--danger-focus-ring':    'rgba(154, 64, 32, 0.30)',
  '--info':                 '#5a7080',  // cold concrete blue-grey

  // Atmosférický overlay (BG je toxická obloha — potřebujeme darken pro čitelnost)
  '--theme-bg-overlay':
    'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(10, 9, 5, 0.65) 100%), linear-gradient(180deg, rgba(10, 9, 5, 0.25) 0%, rgba(10, 9, 5, 0.55) 100%)',

  // Fonts
  '--font-logo':        '"Black Ops One", "Stardos Stencil", sans-serif',
  '--font-display':     '"Big Shoulders Stencil Display", "Oswald", sans-serif',
  '--font-body':        '"Special Elite", "Courier Prime", monospace',
  '--font-script':      '"Special Elite", "Courier Prime", monospace',  // italic varianta

  // Layout chrome
  '--header-h':         '56px',
  '--header-bg':        '#14110a',
  '--frame-pad-y':      '40px',
  '--frame-pad-x':      '18px',
  '--sidebar-w':        '280px',
  '--asset-logo-w':         '360px',
  '--asset-logo-w-mobile':  '220px',
  '--logo-img-display':     'block',
  '--logo-fallback-display':'none',

  // Section per-section watermark accent (default; CSS přepisuje per data-section-key)
  '--section-color':    '#8a8810',

  // ===== INLINE SVG ASSET VARS (~28) =====
  // Generated v helper funkci svg() v top of file, viz krok 3.4
  '--asset-logo':              `url('${decor}/logo.webp')`,
  '--asset-andel-medallion':   `url('${decor}/medailon.webp')`,

  // Rivet corner (master TL, mirror přes CSS scaleX/Y)
  '--asset-rivet-corner':      RIVET_CORNER,
  '--asset-corner-size':       '56px',
  '--asset-corner-size-mobile':'32px',
  '--frame-corner-inset':      '6px',

  // Dust strip (vertikální drift)
  '--asset-dust-strip':        DUST_STRIP,

  // CRT static (full-screen tile)
  '--asset-crt-static':        CRT_STATIC,

  // Hazard stripes (žluto-černé úhlopříčky)
  '--asset-hazard-stripe':     HAZARD_STRIPE,
  '--asset-hazard-stripe-vertical': HAZARD_STRIPE_VERTICAL,

  // Geiger pulse (EKG waveform)
  '--asset-geiger-pulse':      GEIGER_PULSE,

  // Stencil noise overlay (pro section titles)
  '--asset-stencil-noise':     STENCIL_NOISE,

  // 8× HAZMAT watermarks (fill currentColor)
  '--asset-hazmat-radiation':  HAZMAT_RADIATION,
  '--asset-hazmat-warning':    HAZMAT_WARNING,
  '--asset-hazmat-radio':      HAZMAT_RADIO,
  '--asset-hazmat-gear':       HAZMAT_GEAR,
  '--asset-hazmat-skull':      HAZMAT_SKULL,
  '--asset-hazmat-globe':      HAZMAT_GLOBE,
  '--asset-hazmat-clipboard':  HAZMAT_CLIPBOARD,
  '--asset-hazmat-biohazard':  HAZMAT_BIOHAZARD,

  // 6× nav medailon ikony (stroke currentColor)
  '--asset-icon-uvodnik':         ICON_UVODNIK,
  '--asset-icon-vytvorit-svet':   ICON_VYTVORIT_SVET,
  '--asset-icon-diskuze':         ICON_DISKUZE,
  '--asset-icon-clanky':          ICON_CLANKY,
  '--asset-icon-galerie':         ICON_GALERIE,
  '--asset-icon-napoveda':        ICON_NAPOVEDA,
  '--asset-icon-hospoda':         ICON_HOSPODA,

  // 5× section icons (pravý panel)
  '--asset-icon-administrace':    ICON_ADMINISTRACE,
  '--asset-icon-moje-svety':      ICON_MOJE_SVETY,
  '--asset-icon-moje-diskuze':    ICON_MOJE_DISKUZE,
  '--asset-icon-oblibene-clanky': ICON_OBLIBENE_CLANKY,
  '--asset-icon-oblibene-obrazky':ICON_OBLIBENE_OBRAZKY,

  // Signature self-draw + plus glyph
  '--asset-signature-script':  SIGNATURE_FLOURISH,
  '--asset-plus-stencil':      PLUS_STENCIL,
},
```

#### 3.4 Inline SVG markup (top of file, před `export const postapoTheme`)

```ts
const decor = '/themes/postapo/decor';

// Helper: SVG markup → data-uri URL with URL-encoded payload
const svg = (markup: string) =>
  `url("data:image/svg+xml;utf8,${markup.replace(/#/g, '%23').replace(/\s+/g, ' ').trim()}")`;

// === Rivet corner (matný metal L-shape s 2 nýty)
const RIVET_CORNER = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 56' fill='none'>
  <!-- L-shape metal plate -->
  <path d='M4 4 L52 4 L52 14 L14 14 L14 52 L4 52 Z'
        fill='#1a1612' stroke='#302e20' stroke-width='1.5'/>
  <!-- Top highlight (1px metal raised) -->
  <path d='M4 4 L52 4 L52 6 L4 6 Z' fill='#3a3528' opacity='0.5'/>
  <!-- Bottom shadow -->
  <path d='M4 50 L14 50 L14 52 L4 52 Z' fill='#000' opacity='0.6'/>
  <!-- Nýt 1 (TL) -->
  <circle cx='9' cy='9' r='2.5' fill='#5a523f'/>
  <circle cx='9' cy='9' r='1.4' fill='#9a8870'/>
  <circle cx='8.4' cy='8.4' r='0.4' fill='#d4c8a8'/>
  <!-- Nýt 2 (TR) -->
  <circle cx='47' cy='9' r='2.5' fill='#5a523f'/>
  <circle cx='47' cy='9' r='1.4' fill='#9a8870'/>
  <circle cx='46.4' cy='8.4' r='0.4' fill='#d4c8a8'/>
</svg>
`);

// === Dust strip (vertikální column padajících teček)
const DUST_STRIP = svg(`
<svg xmlns='http://www.w3.org/2000/svg' width='40' height='800' viewBox='0 0 40 800'>
  <!-- 25 random teček popela v rezavé/olivové/kostní barvě -->
  <circle cx='8'  cy='30'  r='1.5' fill='#7a3810' opacity='0.6'/>
  <circle cx='22' cy='70'  r='2.2' fill='#8a8810' opacity='0.55'/>
  <circle cx='14' cy='130' r='1'   fill='#b0a888' opacity='0.50'/>
  <circle cx='30' cy='180' r='1.8' fill='#7a3810' opacity='0.65'/>
  <circle cx='6'  cy='235' r='1.2' fill='#8a8810' opacity='0.45'/>
  <circle cx='25' cy='290' r='2'   fill='#9a5020' opacity='0.50'/>
  <circle cx='12' cy='340' r='1.5' fill='#b0a888' opacity='0.55'/>
  <circle cx='28' cy='400' r='1'   fill='#8a8810' opacity='0.60'/>
  <circle cx='10' cy='450' r='2'   fill='#7a3810' opacity='0.45'/>
  <circle cx='24' cy='510' r='1.4' fill='#b0a888' opacity='0.50'/>
  <circle cx='16' cy='565' r='1.8' fill='#9a5020' opacity='0.55'/>
  <circle cx='4'  cy='620' r='1.2' fill='#8a8810' opacity='0.60'/>
  <circle cx='32' cy='680' r='2.2' fill='#7a3810' opacity='0.50'/>
  <circle cx='18' cy='740' r='1.6' fill='#b0a888' opacity='0.55'/>
  <!-- ...více teček doplníme při impl pro hustší distribuci -->
</svg>
`);

// === CRT static (pseudo-random noise tile)
const CRT_STATIC = svg(`
<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
  <filter id='noise'>
    <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='3'/>
    <feColorMatrix values='0 0 0 0 0.7  0 0 0 0 0.65  0 0 0 0 0.4  0 0 0 0.5 0'/>
  </filter>
  <rect width='200' height='200' filter='url(#noise)' opacity='0.6'/>
</svg>
`);

// === Hazard stripe (žluto-černé úhlopříčky)
const HAZARD_STRIPE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' width='12' height='4'>
  <pattern id='p' patternUnits='userSpaceOnUse' width='12' height='4' patternTransform='rotate(45)'>
    <rect width='6' height='4' fill='#c8a008'/>
    <rect x='6' width='6' height='4' fill='#1a1612'/>
  </pattern>
  <rect width='12' height='4' fill='url(%23p)'/>
</svg>
`);

const HAZARD_STRIPE_VERTICAL = svg(`
<svg xmlns='http://www.w3.org/2000/svg' width='4' height='12'>
  <pattern id='p' patternUnits='userSpaceOnUse' width='4' height='12' patternTransform='rotate(45)'>
    <rect width='4' height='6' fill='#c8a008'/>
    <rect y='6' width='4' height='6' fill='#1a1612'/>
  </pattern>
  <rect width='4' height='12' fill='url(%23p)'/>
</svg>
`);

// === Geiger pulse (EKG waveform tile, flat line + 2 spikes per tile)
const GEIGER_PULSE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' width='800' height='24' viewBox='0 0 800 24' fill='none'>
  <path d='M0 12 L120 12 L130 4 L140 18 L150 12 L380 12 L390 6 L395 20 L400 8 L405 14 L410 12 L640 12 L650 4 L660 18 L670 12 L800 12'
        stroke='#6a8a30' stroke-width='1' opacity='0.6'/>
</svg>
`);

// === Stencil noise (sprejovaný tečky)
const STENCIL_NOISE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' width='80' height='24'>
  <!-- 12 random teček spreyového pattern -->
  <circle cx='8'  cy='6'  r='0.8' fill='currentColor' opacity='0.5'/>
  <circle cx='22' cy='14' r='0.6' fill='currentColor' opacity='0.4'/>
  <circle cx='35' cy='4'  r='1.0' fill='currentColor' opacity='0.6'/>
  <circle cx='48' cy='18' r='0.5' fill='currentColor' opacity='0.45'/>
  <circle cx='60' cy='10' r='0.8' fill='currentColor' opacity='0.5'/>
  <circle cx='72' cy='20' r='0.6' fill='currentColor' opacity='0.4'/>
  <circle cx='12' cy='20' r='0.5' fill='currentColor' opacity='0.35'/>
  <circle cx='28' cy='8'  r='0.7' fill='currentColor' opacity='0.5'/>
  <circle cx='42' cy='12' r='0.6' fill='currentColor' opacity='0.45'/>
  <circle cx='55' cy='2'  r='0.5' fill='currentColor' opacity='0.4'/>
  <circle cx='66' cy='16' r='0.8' fill='currentColor' opacity='0.5'/>
  <circle cx='76' cy='8'  r='0.4' fill='currentColor' opacity='0.35'/>
</svg>
`);

// === HAZMAT watermarks (fill=currentColor)
const HAZMAT_RADIATION = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='currentColor'>
  <circle cx='32' cy='32' r='5'/>
  <path d='M32 8 A24 24 0 0 1 52.78 20 L43.71 25.24 A14 14 0 0 0 32 18 Z'/>
  <path d='M52.78 44 A24 24 0 0 1 11.22 44 L20.29 38.76 A14 14 0 0 0 43.71 38.76 Z'/>
  <path d='M11.22 20 A24 24 0 0 1 32 8 L32 18 A14 14 0 0 0 20.29 25.24 Z'/>
</svg>
`);

const HAZMAT_BIOHAZARD = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='currentColor'>
  <!-- biohazard trefoil: 3 circles overlapping + center dot -->
  <circle cx='32' cy='32' r='5'/>
  <path d='M16 18 a12 12 0 0 1 16 0' stroke='currentColor' stroke-width='4' fill='none'/>
  <path d='M48 18 a12 12 0 0 0 -16 0' stroke='currentColor' stroke-width='4' fill='none'/>
  <path d='M32 56 a12 12 0 0 1 -10 -16' stroke='currentColor' stroke-width='4' fill='none'/>
  <path d='M32 56 a12 12 0 0 0 10 -16' stroke='currentColor' stroke-width='4' fill='none'/>
  <!-- 3 outer circles -->
  <circle cx='20' cy='20' r='6'/>
  <circle cx='44' cy='20' r='6'/>
  <circle cx='32' cy='48' r='6'/>
</svg>
`);

// (... další HAZMAT symboly podobně, total 8 — definice v impl kroku 3 ...)

// === 6× nav medailon ikony (stroke=currentColor)
const ICON_UVODNIK = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <!-- bunker door s nýty -->
  <rect x='6' y='4' width='20' height='26' rx='1'/>
  <line x1='6' y1='10' x2='26' y2='10'/>
  <line x1='6' y1='26' x2='26' y2='26'/>
  <circle cx='10' cy='7' r='0.8' fill='currentColor'/>
  <circle cx='22' cy='7' r='0.8' fill='currentColor'/>
  <circle cx='10' cy='28' r='0.8' fill='currentColor'/>
  <circle cx='22' cy='28' r='0.8' fill='currentColor'/>
  <circle cx='20' cy='18' r='1.2' fill='currentColor'/>
</svg>
`);

// (... další ikony podobně ...)

// === Signature flourish (poslední vzkaz mrtvého)
const SIGNATURE_FLOURISH = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 24' fill='none' stroke='#9a5020' stroke-width='1.5' stroke-linecap='round'>
  <path d='M4 16 Q40 6 80 14 Q120 22 160 14 Q200 6 240 14 Q260 18 276 12'/>
  <line x1='4' y1='20' x2='12' y2='20' opacity='0.5'/>
  <line x1='268' y1='20' x2='276' y2='20' opacity='0.5'/>
</svg>
`);

// === Plus stencil (sprejovaný „+")
const PLUS_STENCIL = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round'>
  <line x1='12' y1='5' x2='12' y2='19'/>
  <line x1='5' y1='12' x2='19' y2='12'/>
</svg>
`);
```

---

### Krok 4 — `src/themes/themes/postapo/decorations.css` — kompletní přepis

Velikost: ~900–1000 řádků (z ~14). Struktura jako kyberpunk decorations.css, 28 sekcí.

**Sekce v decorations.css:**

| # | Sekce | Obsah |
|---|---|---|
| 1 | Atmosférický overlay | `::before` radial+linear darken nad BG |
| 2 | CRT static drift | `::after` fullscreen tile + animation |
| 3 | Dust strip drift | `body::before`/`body::after` levý+pravý 40px strip + animation |
| 4 | Topbar | dark metal gradient + geiger pulse bar `header::after` |
| 5 | Logo | dimensioning + matný drop-shadow |
| 6 | Header buttons | heavy metal plate s 2 nýty top + olive border + rust hover + clunk active |
| 7 | ZLATÝ STANDARD speciální | matná caution-yellow rim accent |
| 8 | Sidebar frame (oba) | dark rusted iron + 4× rivet corner brackets |
| 9 | Rivet corner positioning | `[data-position]` 4× pozice + scaleX/Y mirror |
| 10 | Section titles | Big Shoulders Stencil + stencil noise overlay `::after` + hazard stripe divider |
| 11 | Per-section barva mapping | `[data-section-key]` → `--section-color` (8 sekcí) |
| 12 | HAZMAT watermarks v rozích sekcí | `[data-section-key]::before` per-section glyph |
| 13 | Per-nav-key barva | 6 nav items → `--nav-color` |
| 14 | NavItem idle | heavy metal plate + 4 rivets + caution stripe vertical left |
| 15 | NavItem hover | text → olive bright + slabý radiation glow + lift translateY(-2px) |
| 16 | NavItem active | rust+olive gradient bg + expand stripe + geiger pulse animation |
| 17 | NavItem icons | mask-image with currentColor → section-color hot-swap |
| 18 | „+" tlačítka | rust gradient + stencil plus glyph + hover yellow rim |
| 19 | Welcome card | metal panel + 4 rivet corners + DEAD WORLD watermark `::before` + radio call sign + ghost signal |
| 20 | Welcome card text | Big Shoulders Stencil title + hard shadow + caution hazard stripe pod title |
| 21 | Administrator signature | Special Elite italic + flourish self-draw `::after` |
| 22 | Medailon | dimensioning + matný drop-shadow |
| 23 | Novinky card | stejný material, bez DEAD WORLD/signature/radio |
| 24 | Form controls | dark metal input + olive border + caution yellow focus |
| 25 | Buttons (primary/danger) | olive primary + rust danger |
| 26 | Skin selector dropdown | metal plate + caret + hover rust glow |
| 27 | Tooltips, badges, scrollbars | dark metal + rust accent |
| 28 | Mobile responsive | ≤768px + ≤480px breakpoints, dust drift hidden, rivet corners scaled |

Konec souboru: `@media (prefers-reduced-motion: reduce)` — všechny animace vypnuty.

**Klíčové styling principy:**
- **Žádný neon glow box-shadow** (postapo = matný kov)
- **Hard text-shadow** `1px 1px 0 #000` místo blur shadows
- **Multi-vrstvý 3D gradient** na všech buttonech (top highlight + bottom shadow)
- **4 nýty v rozích** všech buttonů jako `::before` + `::after` pseudo nebo inline border-image
- **translateY(3px)** na :active (heavy clunk), ne translateY(-1px) (lift up)
- **Border-radius: 0–4px** (téměř pravoúhlé, jako těžká kovová deska)
- **letter-spacing: 0.08–0.14em** na všech display fontech (stencil look)

---

### Krok 5 — `mobil-desktop` skill (post-impl, dle CLAUDE.md)

Po dokončení implementace spustit `mobil-desktop` skill pro test responsive layoutu:
- Mobile (≤480px): hamburger drawer, single column, rivet corners scaled to 32×32px
- Tablet (≤768px): full-width drawer, dust drift hidden, rivet corners 40×40px
- Desktop (>1024px): full layout, dust drift visible, rivet corners 56×56px

---

### Krok 6 — `dluh` skill (post-impl, dle CLAUDE.md)

Zapsat případné nedořešené body:
- Thumbnail regenerace pro `public/themes/thumbnails/postapo.webp` (post-1.0t)
- Pokud nějaký nav-item icon nesedí, lze iterovat v 1.0t-followup

---

### Krok 7 — Update docs

- `docs/roadmap-fe.md` — zaškrtnout 1.0t
- `docs/dluhy.md` — uzavřít dluhy které 1.0t vyřešil (postapo skin upgrade)

---

### Krok 8 — Commit

```bash
git add src/themes/themes/postapo/index.ts \
        src/themes/themes/postapo/decorations.css \
        public/themes/postapo/decor/logo.webp \
        public/themes/postapo/decor/medailon.webp \
        public/themes/backgrounds/postapo.webp \
        assets-source/themes/postapo/logo.png \
        assets-source/themes/postapo/medailon.png \
        docs/arch/phase-1/spec-1.0t-postapo-upgrade.md \
        docs/arch/phase-1/plan-1.0t.md \
        docs/roadmap-fe.md \
        docs/dluhy.md \
        index.html

git commit -m "feat(themes/postapo): krok 1.0t — Postapo skin upgrade"
```

---

## 2. Změny mimo `themes/postapo/` (mimo izolaci)

| Soubor | Důvod změny | Akce |
|---|---|---|
| `index.html` | Doplnit Google Fonts (Black Ops One, Big Shoulders Stencil Display, Special Elite) | Merge do existující Google Fonts URL |
| `docs/roadmap-fe.md` | Zaškrtnout 1.0t | Update |
| `docs/dluhy.md` | Uzavřít dluhy 1.0t | Update |

**Žádné jiné soubory mimo `themes/postapo/` se nemění.** Theme isolation zaručena.

---

## 3. Estimovaná velikost změn

| Soubor | Před | Po | Delta |
|---|---|---|---|
| `src/themes/themes/postapo/index.ts` | ~50 řádků | ~300 řádků | +250 |
| `src/themes/themes/postapo/decorations.css` | ~14 řádků | ~950 řádků | +936 |
| `index.html` | ~existující | ~existující + 3 fonty | +0–1 řádek (merge) |
| `docs/arch/phase-1/spec-1.0t-postapo-upgrade.md` | 0 | ~580 řádků | +580 (nový) |
| `docs/arch/phase-1/plan-1.0t.md` | 0 | ~400 řádků | +400 (nový) |
| `public/themes/postapo/decor/logo.webp` | 0 | ~30–80 KB | nový |
| `public/themes/postapo/decor/medailon.webp` | 0 | ~30–80 KB | nový |
| `public/themes/backgrounds/postapo.webp` | existuje | re-konvert | možná update |

**Celkem ~2200 nových řádků kódu + 3 raster assety + 0 AI gen WEBP.**

---

## 4. Risk mitigace

- **Inline SVG markup omyly** — všechny SVG markupy testuju na sandbox HTML před commitem (renderování v Chrome DevTools)
- **Performance dust drift + CRT static** — 3 vrstvy CSS background-position animation, GPU-friendly. Mobile dust drift hidden, CRT zachován (lehký 4s steps animation).
- **Reduced-motion fallback** — explicitně testovat `prefers-reduced-motion: reduce` mediální query disabled animace
- **Theme isolation** — git diff sanity check, zaručit že žádný globální CSS / non-themed file není dotčen
- **Ghost signal 1× per session** — implementuje se přes animation s `forwards` + `animation-iteration-count: 1` (přirozený 1× behavior; pokud uživatel reloadne stránku, ghost signal se spustí znovu — což je zamýšlené)

---

## 5. Schvalovací check pro PJ (pre-impl)

- [ ] Spec 1.0t schválen
- [ ] Plan 1.0t schválen
- [ ] Ghost signal text potvrzen: `"... POSLEDNÍ VYSÍLÁNÍ ..."` ✅ (schváleno 2026-05-11)
- [ ] Žádné dodatečné assety nepotřebujeme ✅ (schváleno 2026-05-11)

Po schválení → impl (krok 1–8).
