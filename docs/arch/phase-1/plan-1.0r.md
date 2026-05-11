# Plán 1.0r — Arabský svět visual upgrade

**Datum:** 2026-05-11
**Spec:** [`spec-1.0r-arabsky-svet-upgrade.md`](spec-1.0r-arabsky-svet-upgrade.md) 🟡 ke schválení společně s tímto plánem
**Asset prompty:** [`../../../public/themes/arabsky-svet/decor/_asset-prompts.md`](../../../public/themes/arabsky-svet/decor/_asset-prompts.md) ✅
**Branch:** `main` (přímý commit po dokončení, dle vzoru `1.0p` indián + `1.0q` africké)
**Single PR** — kompletní skin v jednom kroku

---

## 0. Pre-flight ✅

| Item | Status | Poznámka |
|---|---|---|
| 17 PNG v `assets-source/themes/arabsky-svet/` | ✅ | 14 AI gen + logo + medailon + background |
| Vizuální audit všech 14 AI gen assetů | ✅ | Tier-1 kvalita, drží brief (mauresque multifoil + drahokamy + mosaz + perská estetika) |
| Background tier-1 kvality | ✅ | Noční palácová scenérie s mašrabíja rámem, samet, koberce, lucerny, palmy |
| Layout audit (`IkarosLayout.tsx`) | ⏳ | Ověřit, že pravý panel umí 3 sekce (administrace + diskuze + světy) |
| `PanelCorners` injectuje `<CornerOrnament position="tl|tr|bl|br" />` | ⏳ | Ověřit, hook pro corner-tl asset |
| Frontend-design audit | ✅ | 2026-05-11, vybrána maximalistická harém direction (zamítnut intelektuální astronom pivot) |
| Spec schválen | 🟡 | Ke schválení s tímto plánem |

**Assety hotové (17):**

| Asset | Zdroj | Cílový rozměr | Status |
|---|---|---|---|
| `logo.webp` | user dodal | original | ⏳ konvert |
| `medailon.webp` | user dodal | original | ⏳ konvert |
| `background.webp` | user dodal → `backgrounds/` | 1920×1080 | ⏳ konvert |
| `corner-tl.webp` | AI gen | 256×256 | ⏳ konvert + resize |
| `mukarnas-cornice.webp` | AI gen | 1920×80 | ⏳ konvert + resize |
| `narghile-smoke.webp` | AI gen | 180×800 | ⏳ konvert + resize |
| `genie-lamp.webp` | AI gen | 180×320 | ⏳ konvert + resize |
| `caustic-glow.webp` | AI gen | 400×500 | ⏳ konvert + resize |
| `carpet-strip.webp` | AI gen | 1200×60 | ⏳ konvert + resize |
| `rose-petals-scatter.webp` | AI gen | 800×400 | ⏳ konvert + resize |
| 7× `icon-*.webp` | AI gen | 96×96 | ⏳ konvert + resize |

---

## 1. Kroky implementace

### Krok 1 — Konvert PNG → WEBP + resize

**1.1** Vytvořit [`scripts/finalize-arabsky-svet-assets.mjs`](../../../scripts/finalize-arabsky-svet-assets.mjs) podle vzoru `finalize-africke-assets.mjs`:

```js
import sharp from 'sharp';
import path from 'node:path';
import { stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const DECOR = path.resolve('public/themes/arabsky-svet/decor');

const TASKS = [
  { in: 'corner-tl.webp',           out: 'corner-tl.webp',           w: 256,  h: 256  },
  { in: 'mukarnas-cornice.webp',    out: 'mukarnas-cornice.webp',    w: 1920, h: 80,   fit: 'contain', sharper: true },
  { in: 'narghile-smoke.webp',      out: 'narghile-smoke.webp',      w: 180,  h: 800,  fit: 'contain' },
  { in: 'genie-lamp.webp',          out: 'genie-lamp.webp',          w: 180,  h: 320,  fit: 'contain' },
  { in: 'caustic-glow.webp',        out: 'caustic-glow.webp',        w: 400,  h: 500,  fit: 'contain' },
  { in: 'carpet-strip.webp',        out: 'carpet-strip.webp',        w: 1200, h: 60,   fit: 'contain', sharper: true },
  { in: 'rose-petals-scatter.webp', out: 'rose-petals-scatter.webp', w: 800,  h: 400,  fit: 'contain' },
  { in: 'icon-uvodnik.webp',        out: 'icon-uvodnik.webp',        w: 96,   h: 96   },
  { in: 'icon-vytvorit-svet.webp',  out: 'icon-vytvorit-svet.webp',  w: 96,   h: 96   },
  { in: 'icon-diskuze.webp',        out: 'icon-diskuze.webp',        w: 96,   h: 96   },
  { in: 'icon-clanky.webp',         out: 'icon-clanky.webp',         w: 96,   h: 96   },
  { in: 'icon-galerie.webp',        out: 'icon-galerie.webp',        w: 96,   h: 96   },
  { in: 'icon-napoveda.webp',       out: 'icon-napoveda.webp',       w: 96,   h: 96   },
  { in: 'icon-hospoda.webp',        out: 'icon-hospoda.webp',        w: 96,   h: 96   },
];
// ... (struktura stejná jako finalize-africke-assets.mjs)
```

**1.2** Spustit pipeline:
```bash
npm run themes:optimize        # PNG → WEBP do public/themes/arabsky-svet/decor/ + backgrounds/arabsky-svet.webp
node scripts/finalize-arabsky-svet-assets.mjs   # resize na cílové rozměry
```

**Verify:** `ls public/themes/arabsky-svet/decor/` → 17 souborů (logo, medailon, corner-tl, mukarnas-cornice, narghile-smoke, genie-lamp, caustic-glow, carpet-strip, rose-petals-scatter, 7× icon-*).
**Verify:** `ls public/themes/backgrounds/arabsky-svet.webp` → existuje, ~200–400 KB.

---

### Krok 2 — Google Fonts: doplnit v `index.html`

V [`index.html`](../../../index.html) ověřit, zda existující Google Fonts URL obsahuje 4 nové fonty pro Arabský svět:

- `Pinyon+Script` (logo fallback)
- `Cinzel+Decorative:wght@400;700;900` (display headings — má 3 weights)
- `Cormorant+Garamond:ital,wght@0,400;0,500;0,700;1,400;1,600` (body + italics)
- `Tangerine:wght@400;700` (signature italic)

**Akce:** Grep `index.html` na tyto family, doplnit chybějící do existující `<link>` URL (mergovat parametry, ne přidat nový tag).

---

### Krok 3 — `src/themes/themes/arabsky-svet/index.ts` — kompletní přepis

Velikost: ~220 řádků (z ~50).

#### 3.1 Header komentář
Brief shrnutí: koncept „Arabský svět" (noční komnata sultánova paláce, 1001 nocí), materiály (multifoil zlato s drahokamy + mukarnas + perská mosaika + samet + růže + narghile), reference na spec.

#### 3.2 Base properties
- `id: 'arabsky-svet'` — zachovat
- `name: 'Arabský svět'` — **zachovat** (dle preference uživatele 2026-05-11)
- `scope: 'both'` — zachovat
- `atmosphere:` — přepsat na „Arabský svět — noční komnata sultánova paláce, mašrabíja výhled na zlato-tyrkysovou báň, hedvábí + zlato + kouř + káva + růžové okvětní lístky"
- `reducedMotion: 'safe'` (5 animací má reduced-motion fallback)
- `thumbnail: '/themes/thumbnails/arabsky-svet.webp'` — zachovat (pokud existuje, jinak vygenerovat post-impl)
- `background: '/themes/backgrounds/arabsky-svet.webp'` — zachovat (přepíše se novým z user dodal)

#### 3.3 Přepsat `vars` — všechny tokens

**Smazat staré legacy `--bg-*`, `--accent-*` přímé hex hodnoty.**

**Nové tokens (skupiny):**

```ts
/* ── Background overlay ── */
'--theme-bg-overlay':
  'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(10, 14, 44, 0.45) 100%), linear-gradient(180deg, rgba(10, 14, 44, 0.20) 0%, rgba(10, 14, 44, 0.45) 100%)',

/* ── Surfaces (midnight indigo panely) ── */
'--theme-surface':        'rgba(14, 26, 58, 0.88)',
'--theme-surface-strong': 'rgba(10, 14, 44, 0.94)',
'--theme-surface-soft':   'rgba(14, 26, 58, 0.55)',

/* ── Midnight night palette ── */
'--theme-midnight-night':   '#0a0e2c',
'--theme-midnight-indigo':  '#0e1a3a',
'--theme-midnight-deep':    '#080614',

/* ── Velvet bordo (z BG samet závěsy) ── */
'--theme-velvet-deep':      '#5a1828',
'--theme-velvet-warm':      '#7a1828',

/* ── Damask rose (love + petals) ── */
'--theme-damask-rose':      '#c8385a',
'--theme-rose-light':       '#d85878',

/* ── Gold (multifoil + ornamenty) ── */
'--theme-saffron-gold':     '#e8b040',
'--theme-polished-gold':    '#e8c060',
'--theme-patinated-gold':   '#a87830',

/* ── Dark walnut wood (logo + medailon + icon frames) ── */
'--theme-walnut-deep':      '#1a0a08',
'--theme-walnut-warm':      '#2a1408',
'--theme-walnut-highlight': '#4a2818',

/* ── Brass (lucerny + dallah) ── */
'--theme-brass-deep':       '#5a3210',
'--theme-brass-warm':       '#b87830',
'--theme-brass-bright':     '#d49850',

/* ── Turquoise (báň + headlines) ── */
'--theme-turquoise-deep':   '#1a8a8a',
'--theme-turquoise-bright': '#2ac4c4',

/* ── Royal purple (rare luxus) ── */
'--theme-royal-purple':     '#4a1850',

/* ── Crystals (drahokamy v ornamentech) ── */
'--theme-ruby-crystal':     '#a8283c',
'--theme-emerald-jewel':    '#1a6a4a',

/* ── Smoke (z narghile) ── */
'--theme-smoke-gray':       '#3a3548',

/* ── Pearl ivory (text na tmavém) ── */
'--theme-pearl-ivory':      '#f0e4c8',

/* ── Borders ── */
'--theme-border':           'rgba(168, 120, 48, 0.55)',
'--theme-border-soft':      'rgba(168, 120, 48, 0.28)',
'--theme-border-strong':    'rgba(232, 192, 96, 0.72)',
'--theme-border-turquoise': 'var(--theme-turquoise-deep)',

/* ── Text (WCAG safe) ── */
'--theme-text':              '#f0e4c8',
'--theme-text-muted':        '#b08868',
'--theme-heading':           'var(--theme-turquoise-deep)',
'--theme-text-on-gold':      '#1a0a08',

/* ── Accents legacy aliasy ── */
'--theme-accent':            'var(--theme-turquoise-deep)',
'--theme-accent-bright':     'var(--theme-turquoise-bright)',
'--theme-accent-gold':       'var(--theme-saffron-gold)',
'--theme-accent-gold-bright':'var(--theme-polished-gold)',
'--theme-accent-rose':       'var(--theme-damask-rose)',

/* ── Glows ── */
'--theme-glow-saffron':         'rgba(232, 176, 64, 0.45)',
'--theme-glow-saffron-strong':  'rgba(232, 192, 96, 0.70)',
'--theme-glow-turquoise':       'rgba(26, 138, 138, 0.50)',
'--theme-glow-rose':            'rgba(200, 56, 90, 0.40)',
'--theme-shadow':               'rgba(10, 14, 44, 0.85)',

/* ── Nav hover/active ── */
'--theme-nav-hover-bg':      'rgba(232, 176, 64, 0.14)',
'--theme-nav-active-bg':
  'linear-gradient(90deg, rgba(232, 176, 64, 0.32) 0%, rgba(10, 14, 44, 0.85) 100%)',

/* ── Legacy tokeny (mapped na arabskou paletu) ── */
'--bg-primary':       '#0a0e2c',
'--bg-secondary':     '#0e1a3a',
'--bg-card':          'var(--theme-midnight-indigo)',
'--bg-card-hover':    '#16224a',
'--accent':           'var(--theme-turquoise-deep)',
'--accent-bright':    'var(--theme-turquoise-bright)',
'--accent-dim':       '#0a4a4a',
'--accent-soft':      'rgba(26, 138, 138, 0.16)',
'--text-primary':     'var(--theme-text)',
'--text-secondary':   'var(--theme-text-muted)',
'--text-muted':       '#806840',
'--border':           'var(--theme-border-soft)',
'--border-subtle':    'rgba(168, 120, 48, 0.16)',
'--border-strong':    'var(--theme-border-strong)',
'--success':              '#4a8848',
'--success-soft':         'rgba(74, 136, 72, 0.14)',
'--success-soft-border':  'rgba(74, 136, 72, 0.4)',
'--warning':              'var(--theme-saffron-gold)',
'--warning-soft':         'rgba(232, 176, 64, 0.14)',
'--warning-soft-border':  'rgba(232, 176, 64, 0.4)',
'--danger':               'var(--theme-ruby-crystal)',
'--danger-soft':          'rgba(168, 40, 60, 0.16)',
'--danger-soft-border':   'rgba(168, 40, 60, 0.4)',
'--danger-focus-ring':    'rgba(168, 40, 60, 0.3)',
'--info':                 'var(--theme-turquoise-deep)',
'--text-on-accent':       'var(--theme-pearl-ivory)',
'--text-on-danger':       '#f0e4c8',
'--bg-overlay':           'rgba(10, 14, 44, 0.72)',
```

#### 3.4 Typography vars

```ts
'--font-logo':           '"Pinyon Script", "Allura", Georgia, cursive',
'--font-display':        '"Cinzel Decorative", "Cormorant SC", Georgia, serif',
'--font-tribal-accent':  '"Cinzel Decorative", "Cormorant SC", Georgia, serif',
'--font-body':           '"Cormorant Garamond", "Cormorant", Georgia, serif',
'--font-script':         '"Tangerine", "Italianno", Georgia, cursive',
```

#### 3.5 Layout chrome vars

```ts
'--header-h':              '56px',
'--header-bg':             '#0a0508',
'--frame-pad-y':           '40px',
'--frame-pad-x':           '18px',
'--sidebar-w':             '280px',
'--asset-logo-w':          '360px',
'--asset-logo-w-mobile':   '220px',
'--logo-img-display':      'block',
'--logo-fallback-display': 'none',
```

#### 3.6 Asset URL vars

```ts
const decor = '/themes/arabsky-svet/decor';

'--asset-logo':              `url('${decor}/logo.webp')`,
'--asset-andel-medallion':   `url('${decor}/medailon.webp')`,

/* Corner ornament — multifoil zlato s drahokamy (master TL, mirror přes CSS) */
'--asset-corner':            `url('${decor}/corner-tl.webp')`,
'--asset-corner-size':       '72px',
'--asset-corner-size-mobile':'38px',
'--frame-corner-inset':      '6px',

/* Decorative scene assets */
'--asset-mukarnas-cornice':  `url('${decor}/mukarnas-cornice.webp')`,
'--asset-narghile':          `url('${decor}/narghile-smoke.webp')`,
'--asset-genie-lamp':        `url('${decor}/genie-lamp.webp')`,
'--asset-caustic-glow':      `url('${decor}/caustic-glow.webp')`,
'--asset-carpet-strip':      `url('${decor}/carpet-strip.webp')`,
'--asset-rose-petals-scatter': `url('${decor}/rose-petals-scatter.webp')`,

/* 7 ornament nav medailonů */
'--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
'--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
'--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
'--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
'--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
'--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
'--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,

/* Girih watermarks (inline SVG data-uri) */
'--asset-girih-star-8':     GIRIH_STAR_8,
'--asset-girih-cross':      GIRIH_CROSS,
'--asset-girih-pentagon':   GIRIH_PENTAGON,
'--asset-girih-decagon':    GIRIH_DECAGON,

/* Active nav SVG (inline data-uri) */
'--asset-arabesque-vine':   ARABESQUE_VINE_WITH_RUBY,
'--asset-hamsa-stamp':      HAMSA_OUTLINE,

/* Add-button stamp (inline SVG) */
'--asset-rose-stamp':       DAMASK_ROSE_SILHOUETTE,

/* Rose petal drift 3 vrstvy (inline SVG data-uri, mix růžová + zlatá) */
'--asset-rose-petal-near':  ROSE_PETAL_NEAR_LAYER,
'--asset-rose-petal-mid':   ROSE_PETAL_MID_LAYER,
'--asset-rose-petal-far':   ROSE_PETAL_FAR_LAYER,

/* Šeherezádin signature SVG path (pro self-draw animaci) */
'--asset-signature-path':   SIGNATURE_SVG_PATH,
```

#### 3.7 Inline SVG konstanty

Definované jako TS const v hlavičce souboru (před `export const arabskySvetTheme`):

- `GIRIH_STAR_8` — 8-cípá hvězda outline v patinated-gold `#a87830`
- `GIRIH_CROSS` — kříž z 8 čtverců (girih classic), patinated-gold
- `GIRIH_PENTAGON` — 5-úhelník s vnitřní hvězdou, patinated-gold
- `GIRIH_DECAGON` — 10-úhelník (rare), patinated-gold
- `ARABESQUE_VINE_WITH_RUBY` — zlatý šlahoun se 2 listy + rubínová tečka na konci (`#a8283c`)
- `HAMSA_OUTLINE` — Hand of Fatima silhouette outline
- `DAMASK_ROSE_SILHOUETTE` — damask rose silhouette pro rightAddBtn `::before`
- `ROSE_PETAL_NEAR_LAYER` — viewport tile 800×800 s 6 petals damask + gold, opacity 0.55 base
- `ROSE_PETAL_MID_LAYER` — 240×240 tile s 6 petals střední
- `ROSE_PETAL_FAR_LAYER` — 180×180 tile s 4 petals drobné
- `SIGNATURE_SVG_PATH` — vector path pro „Příjemnou zábavu přeji administrátoři" v Tangerine style flow

#### 3.8 Export theme objekt

```ts
export const arabskySvetTheme: Theme = {
  id: 'arabsky-svet',
  name: 'Arabský svět',
  scope: 'both',
  atmosphere: '...',
  vars: { /* ... */ },
  fonts: {
    logo: 'Pinyon Script',
    display: 'Cinzel Decorative',
    body: 'Cormorant Garamond',
  },
  thumbnail: '/themes/thumbnails/arabsky-svet.webp',
  background: '/themes/backgrounds/arabsky-svet.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
```

---

### Krok 4 — `src/themes/themes/arabsky-svet/decorations.css` — kompletní přepis

Velikost: ~950 řádků (z aktuálního stubu).

**Struktura (27 sekcí dle vzoru africke 1.0q):**

| # | Sekce | Klíčové prvky |
|---|---|---|
| 1 | Atmospheric overlay | `::before` shell s `var(--theme-bg-overlay)` |
| 2 | Rose petal drift | `body::after` 3 vrstvy parallax, 90s/120s/150s |
| 3 | Narghile smoke | fixed `[data-decor="narghile"]` v dolním-pravém, 8s morph |
| 4 | Topbar — dark walnut + mukarnasová římsa + mašrabíja hairline | `> header::before` mukarnas, `::after` hairline |
| 5 | Logo banner | width responsive, drop-shadow |
| 6 | Header buttons | dark wood plaque + saffron border, hover saffron glow |
| 7 | Sidebar levý — midnight indigo + multifoil border | sandstone equivalent |
| 8 | Corner ornaments | `[data-position="tl/tr/bl/br"]` přes CSS mirror |
| 9 | Section titles + horizon-mihrab divider | Cinzel Decorative + turquoise→gold→turquoise gradient |
| 10 | NavItem idle/hover/active + arabesque vine + Hamsa stamp | active `::before` vine, `::after` stamp |
| 11 | Genie lamp v rohu hlavního panelu | absolute top-right, sway 14s, puff 8s, caustic 4s |
| 12 | Welcome card — „odhrnutý hedvábný závěs" | rose petals BG layer + carpet strip + 4 corners + signature self-draw |
| 13 | Welcome card text styling | Cinzel Decorative title + Cormorant body + Tangerine signature |
| 14 | Welcome card hairline pod titulkem | turquoise gradient |
| 15 | Nav ikony — 7 ornament medailonů přes data-nav-key | mapping |
| 16 | Girih watermarks per section (Star-8 / Cross / Pentagon / Decagon) | opacity 0.07 |
| 17 | „+" tlačítka s rose-stamp `::before` | rightAddBtn |
| 18 | Novinky panel | midnight indigo + lampová ikona u nadpisu |
| 19 | Empty hints | Tangerine italic turquoise |
| 20 | PJ badge | gold gradient + ruby-crystal border |
| 21 | Show-all links | turquoise hover saffron |
| 22 | Šeherezádin signature self-draw | SVG path stroke-dasharray + dashoffset 2s ease-out 1× |
| 23 | Scrollbar styling | midnight + patinated gold thumb |
| 24 | Focus visible (a11y) | turquoise outer + saffron glow |
| 25 | Tablet adjustments (769–1024px) | corner 52px, logo 280px |
| 26 | Mobile degradace (≤768px) | rose petals 1 vrstva, narghile skryto, genie lamp 60×100, mukarnas opacity 0.70 |
| 27 | Reduced-motion fallback + forced colors | 5 animací `animation: none !important` |

**Tříjavné principy:**
- Vše scoped přes `[data-theme="arabsky-svet"]` + `[data-shell="ikaros"]` selektor pro shell-only pravidla
- Žádné globální edity
- `pointer-events: none` na všech overlay vrstvách (rose petals, narghile, mašrabíja hairline, caustic glow)
- `z-index: 0` pro background overlays, `z-index: 1–5` pro decorative overlays (lamp, mukarnas), `z-index: 5+` pro corner ornaments

---

### Krok 5 — Vývojový server: visual test

**5.1** Spustit dev server:
```bash
npm run dev
```

**5.2** V prohlížeči (Chrome / Firefox / Edge):
- Otevřít app, přepnout na skin **Arabský svět** v skin selectoru
- Ověřit zobrazení welcome card (medailon vlevo, text vpravo, signature self-draw při loadu)
- Ověřit rose petal drift v BG (3 vrstvy)
- Ověřit narghile smoke v pravém dolním rohu (vlnitá ribbon stoupá)
- Ověřit genie lamp v pravém horním rohu hlavního panelu (sway + caustic glow + mikro-puff)
- Ověřit mukarnas pod topbarem
- Ověřit corner ornaments ve 4 rozích každého panelu
- Ověřit pravý panel — 3 sekce (Administrace + Diskuze + Světy)
- Ověřit nav active state — arabesque vine left + Hamsa stamp right
- Ověřit hover stavy na nav items + add buttons + showAll linkách
- Ověřit girih watermarks v rozích sekcí (decentní, opacity 0.07)

**5.3** Skill `mobil-desktop` — povinný po grafických úpravách:
- Desktop 1920×1080
- Tablet 1024×768
- Mobile 375×667
- iPhone SE / Galaxy S20 narrow widths

**Verify:** žádné CSS regressions, žádné překryvy textu, touch targets ≥ 48px na mobile, narghile smoke skryto na mobile, rose petals 1 vrstva na mobile.

---

### Krok 6 — Lint & contrast audit

```bash
npm run lint:colors        # žádné hardcoded barvy mimo CSS var
npm run audit:contrast     # WCAG kontrast check
npm run typecheck          # TS check
npm run lint               # ESLint
```

**Verify:** Vše projde bez errors. Pokud někde damask-rose chybně použito jako text → fix (drahokamy + decoration only).

---

### Krok 7 — Screenshots na 3 viewportech

Uložit do `docs/arch/phase-1/_screenshots/`:
- `arabsky-svet-desktop-1440.png`
- `arabsky-svet-tablet-1024.png`
- `arabsky-svet-mobile-375.png`
- `arabsky-svet-sidebar-zoom.png` (zoom na sidebar s ornaments)
- `arabsky-svet-welcome-zoom.png` (zoom na welcome card)

---

### Krok 8 — Roadmap & dluhy update

- [`docs/roadmap-fe.md`](../../../docs/roadmap-fe.md) — zaškrtnout Arabský svět tier-1 položku
- [`docs/dluhy.md`](../../../docs/dluhy.md) — review, uzavřít dluhy které tento upgrade vyřešil (theme stub, missing assets, atmosphere string)

---

### Krok 9 — Post-impl: doc cleanup

- Aktualizovat memory `MEMORY.md` index pokud bylo přidáno nové memory (admin panel decision už doplněno 2026-05-11)
- Volitelné: vygenerovat nový `thumbnail` z final desktop screenshotu (320×180 webp) → `public/themes/thumbnails/arabsky-svet.webp`

---

### Krok 10 — Commit & PR

**Commit message (Conventional Commits):**

```
feat(themes/arabsky-svet): krok 1.0r — Arabský svět skin upgrade

Kompletní visual upgrade tématu arabsky-svet ("Arabský svět"):
- index.ts: ~220 řádků (z 50) — nová paleta (midnight indigo + multifoil
  gold + ruby/emerald/turquoise crystals + velvet bordo + damask rose),
  fonty (Pinyon Script + Cinzel Decorative + Cormorant Garamond + Tangerine),
  17 asset URLs, inline SVG girih + hamsa + arabesque vine + rose stamp +
  signature path
- decorations.css: ~950 řádků (z stub) — 27 sekcí (panely, welcome card,
  nav, mukarnas římsa, mašrabíja hairline, rose petal drift, narghile smoke,
  genie lamp s caustic glow, Šeherezádin signature self-draw)
- 17 nových assetů: logo + medailon + background (user dodal) + 14 AI gen
  (corner-tl, mukarnas-cornice, narghile-smoke, genie-lamp, caustic-glow,
  carpet-strip, rose-petals-scatter, 7× icon-*)
- scripts/finalize-arabsky-svet-assets.mjs: PNG → WEBP + resize pipeline
- index.html: 4 nové Google Fonts (Pinyon Script, Cinzel Decorative,
  Cormorant Garamond, Tangerine)
- Memory: project_admin_panel_decision.md rozšířeno o mix layout pro
  arabsky-svet (admin + diskuze + světy)

Scoped přes [data-theme="arabsky-svet"], žádný globální dopad.
Spec: docs/arch/phase-1/spec-1.0r-arabsky-svet-upgrade.md
Plán: docs/arch/phase-1/plan-1.0r.md
```

**Akce:**
- `git add` (zahrnout všechny změny + nové assety)
- `git commit` s výše uvedeným message
- `git push` (po souhlasu uživatele s commit)
- Žádný PR (přímý commit na main, dle vzoru 1.0p, 1.0q)

---

## 2. Risk mitigace dle spec sekce 12

| Riziko | Akce v plánu |
|---|---|
| BG je dramatický → UI rám přerazí krásu | Midnight-indigo panely v tónu BG, border 1px, multifoil jen v rozích |
| Mašrabíja overlay redundantní (BG má baked-in) | ✅ Odstraněno ze specu, žádný fullscreen mašrabíja overlay |
| Animační chaos (5 animací) | Striktně 5 typů s reduced-motion fallback, narghile skryto na mobile, rose petals 1 vrstva na mobile |
| Damask-rose nízký kontrast | Vyhrazen pouze pro decorative (petals, ruby crystals), NIKDY pro body text |
| Rose petal drift performance (3 vrstvy parallax) | Mobile 1 vrstva, CSS-only background-position (GPU accelerated) |
| Narghile smoke SVG morph performance | Jednoduchý path + `feTurbulence` cached, opacity max 0.45, reduced-motion vypíná |
| Konflikt s `africke` (oba „warm exotic") | Africké = sandstone + savana + adinkra; arabský = indigo + multifoil zlato + drahokamy + narghile — jasné oddělení |
| Konflikt s `hospoda` (oba „warm cozy interior") | Hospoda = oak + mosaz + heraldika; arabský = walnut + multifoil zlato + drahokamy + hedvábí — odlišný kulturní jazyk |
| BG soubor velký (~3 MB PNG) | Konvert PNG → WEBP quality 80 přes themes:optimize, target ~300 KB |

---

## 3. Akceptační kritéria checkpoint

Před commit ověřit všech **28 AC** ze [spec sekce 10](spec-1.0r-arabsky-svet-upgrade.md#10-akceptační-kritéria):

- [ ] AC-1: Po themeId='arabsky-svet' midnight pozadí + dodaný BG, žádný globální dopad
- [ ] AC-2: Logo width 360/280/220 desktop/tablet/mobile
- [ ] AC-3: Sidebary midnight-indigo + 4× corner ornament + patinated-gold border
- [ ] AC-4: Welcome card aspect 16:7 + rose petals BG + multifoil border + 4 corners + carpet strip
- [ ] AC-5: Text Cinzel Decorative + Cormorant Garamond + Tangerine
- [ ] AC-6: 7 nav ikon přes data-nav-key, 22×22px desktop
- [ ] AC-7: Active nav arabesque vine + Hamsa stamp
- [ ] AC-8: Pravý panel ADMINISTRACE + MOJE DISKUZE + MOJE SVĚTY (mix layout)
- [ ] AC-9: „+" tlačítka rose stamp ::before, hover scale 1.08
- [ ] AC-10: Section titles + horizon-mihrab divider
- [ ] AC-11: Mukarnasová římsa pod topbarem
- [ ] AC-12: Mašrabíja girih hairline
- [ ] AC-13: Rose petal drift 3/1 vrstvy desktop/mobile
- [ ] AC-14: Narghile smoke 8s ease-in-out
- [ ] AC-15: Genie lamp sway + caustic + puff
- [ ] AC-16: Šeherezádin signature self-draw 1× per session
- [ ] AC-17: Girih watermarks opacity 0.07
- [ ] AC-18: PJ badge gold + ruby-crystal border
- [ ] AC-19: Mobile degradace všech prvků
- [ ] AC-20: Reduced-motion fallback (5 animací)
- [ ] AC-21: Forced colors `forced-color-adjust: none`
- [ ] AC-22: Focus visible box-shadow ring
- [ ] AC-23: WCAG contrast AA/AAA
- [ ] AC-24: Animace inventář (5 typů, welcome NEPULSUJE)
- [ ] AC-25: 14 originálních motivů (žádné sdílení)
- [ ] AC-26: `npm run lint:colors` projde
- [ ] AC-27: `npm run audit:contrast` projde
- [ ] AC-28: Screenshots 3 viewporty

---

## 4. Post-implementační check-list

- [ ] 17 WEBP assetů v `public/themes/arabsky-svet/decor/` + `backgrounds/arabsky-svet.webp`
- [ ] `scripts/finalize-arabsky-svet-assets.mjs` existuje a běží
- [ ] `index.html` má 4 nové Google Fonts URL
- [ ] `src/themes/themes/arabsky-svet/index.ts` ~220 řádků, kompletní paleta + tokens + asset URLs + inline SVG konstanty
- [ ] `src/themes/themes/arabsky-svet/decorations.css` ~950 řádků, 27 sekcí
- [ ] Dev server běží, skin přepíná, žádné console errors
- [ ] Visual audit 3 viewporty hotov
- [ ] Lint + contrast + typecheck + lint:colors → ALL PASS
- [ ] Screenshots uloženy do `_screenshots/`
- [ ] Roadmap zaškrtnut, dluhy uzavřeny relevantní
- [ ] Memory aktualizovaný (admin panel decision rozšíření už hotovo)
- [ ] Commit message dle Conventional Commits + push

---

## 5. Mimo scope (explicitně)

- Globální CSS edity (žádné)
- Shell layout komponenty (`IkarosLayout.tsx`, `Sidebar.tsx`, `WelcomeCard.tsx`) — žádné edity (pouze pokud audit v Pre-flight najde mezeru → tehdy zastavit a konzultovat)
- Ostatní 21 skinů (nulová regrese)
- Backend / API změny
- Theme registry [`src/themes/themes/index.ts`](../../../src/themes/themes/index.ts) (arabsky-svet už registrován)
- TypeScript typy
- Změna textu „Příjemnou zábavu přeji administrátoři" → „Šeherezáda" v komponentě (mimo skin scope; pokud chce uživatel, samostatný úkol mimo 1.0r)
- Thumbnail regenerace (volitelné post-impl, neblokuje commit)
- `docs/themes/arabsky-svet.md` přepis (volitelné post-impl)
- Backend i18n
