# Plán 1.0p — Indiánské visual upgrade

**Datum:** 2026-05-11
**Spec:** [`spec-1.0p-indiane-upgrade.md`](spec-1.0p-indiane-upgrade.md) ✅ schválen
**Asset prompty:** [`../../../public/themes/indiane/decor/_asset-prompts.md`](../../../public/themes/indiane/decor/_asset-prompts.md) ✅
**Branch:** `main` (přímý commit po dokončení, dle vzoru předchozích `1.0o` / `1.0n`)
**Single PR** — kompletní skin v jednom kroku

---

## 0. Pre-flight ✅

| Item | Status | Poznámka |
|---|---|---|
| 15 assetů v `assets-source/themes/indiane/` | ✅ | 13 AI + logo + medailon |
| Slug rename `indiani` → `indiane` | ✅ | provedeno 2026-05-11 |
| Typo `rum-pictograph.png` → `drum-pictograph.png` | ✅ | provedeno 2026-05-11 |
| `optimize-theme-assets.mjs` spuštěn | ✅ | 15× webp v `public/themes/indiane/decor/` |
| `finalize-indiane-assets.mjs` vytvořen + spuštěn | ✅ | resize na cílové rozměry hotov |
| Background `public/themes/backgrounds/indiane.webp` | ✅ | prairie soumrak, neměníme |
| Thumbnail `public/themes/thumbnails/indiane.webp` | ✅ | existuje |
| Layout audit (`IkarosLayout.tsx`) | ✅ | Administrace už podporována vpravo, top bar 3-item — shoda se spec |
| `PanelCorners` injectuje `<CornerOrnament position="tl|tr|bl|br" />` | ✅ | 4 rohy ve všech panelech — hook pro corner-tl asset |
| Frontend-design audit | ✅ | 2026-05-11, 8 mikro-detailů přijato do specu |

---

## 1. Kroky implementace

### Krok 1 — Google Fonts: ověřit Cinzel Decorative + Cinzel + Spectral + Caveat v `index.html`

V [`index.html`](../../../index.html) ověřit, zda existující Google Fonts URL obsahuje:
- `Cinzel:wght@400;600;700` ✓ (předpoklad — používá `priroda` + ostatní)
- `Cinzel+Decorative:wght@400;700;900` — **přidat, pokud chybí**
- `Spectral:wght@400;500;600;700` ✓ (předpoklad — používá `hospoda` body)
- `Caveat:wght@400;600` — **přidat, pokud chybí**

**Akce:** Grep `index.html` na tyto family, doplnit chybějící do existující `<link>` URL (mergovat parametry, ne přidat nový tag).

### Krok 2 — `src/themes/themes/indiane/index.ts` — kompletní přepis

Velikost: ~180 řádků (z aktuálních ~50).

**Co zmenit:**

#### 2.1 Header komentář
Přidat brief shrnutí: koncept „Strážci horizontu", materiály (wood + iron + leather + bead + petroglyph + bone), reference na spec.

#### 2.2 Změnit base properties
- `id: 'indiane'` — zachovat
- `name: 'Indiánské'` — zachovat
- `scope: 'both'` — zachovat
- `atmosphere:` — přepsat na „Strážci horizontu — prairie soumrak, patinované dřevo + železné nail studs + tribal cik-cak carving, šamanský buben"

#### 2.3 Přepsat `vars` — všechny tokens
**Smazat staré legacy `--bg-*`, `--accent-*` přímé hex.**

**Nové tokens (skupiny):**

```ts
/* ── Background overlay ── */
'--theme-bg-overlay':
  'linear-gradient(180deg, rgba(26, 12, 4, 0.45) 0%, rgba(26, 12, 4, 0.65) 100%)',

/* ── Surfaces (patinované dřevo) ── */
'--theme-surface':        'rgba(58, 30, 8, 0.92)',
'--theme-surface-strong': 'rgba(42, 18, 8, 0.96)',
'--theme-surface-soft':   'rgba(90, 51, 24, 0.55)',

/* ── Wood materials ── */
'--theme-wood-deep':       '#1a0c04',
'--theme-wood-dark':       '#3a1e08',
'--theme-wood-mid':        '#5a3318',
'--theme-wood-highlight':  '#8a5828',

/* ── Iron studs ── */
'--theme-iron-dark':       '#1a1410',
'--theme-iron-highlight':  '#4a4238',

/* ── Leather (drum skin, kožené elementy) ── */
'--theme-leather-cream':   '#f0e0c0',
'--theme-leather-bone':    '#e8d8b8',

/* ── Buffalo-blood + flame ── */
'--theme-buffalo-blood':   '#c8501c',
'--theme-buffalo-bright':  '#e86028',
'--theme-flame':           '#ff8030',

/* ── Prairie gold ── */
'--theme-prairie-gold':         '#d4a050',
'--theme-prairie-gold-bright':  '#f0c870',

/* ── Sage turquoise (decorative accent) ── */
'--theme-sage-turquoise':       '#5fc8d0',
'--theme-sage-turquoise-deep':  '#3a8088',

/* ── Bead palette (left-border korálky) ── */
'--theme-bead-red':        '#c8501c',
'--theme-bead-turquoise':  '#5fc8d0',
'--theme-bead-gold':       '#d4a050',
'--theme-bead-cream':      '#f0e0c0',

/* ── Borders ── */
'--theme-border':         'rgba(90, 51, 24, 0.62)',
'--theme-border-soft':    'rgba(90, 51, 24, 0.30)',
'--theme-border-strong':  'rgba(212, 160, 80, 0.72)',
'--theme-border-iron':    'var(--theme-iron-dark)',

/* ── Text ── */
'--theme-text':            '#f0e0c0',
'--theme-text-muted':      '#b08868',
'--theme-heading':         'var(--theme-prairie-gold)',
'--theme-text-on-leather': '#2a1208',
'--theme-text-on-gold':    '#2a1208',

/* ── Accents legacy aliasy ── */
'--theme-accent':                 'var(--theme-buffalo-blood)',
'--theme-accent-bright':          'var(--theme-buffalo-bright)',
'--theme-accent-gold':            'var(--theme-prairie-gold)',
'--theme-accent-gold-bright':     'var(--theme-prairie-gold-bright)',
'--theme-accent-sage':            'var(--theme-sage-turquoise)',

/* ── Glows ── */
'--theme-glow-buffalo':        'rgba(200, 80, 28, 0.45)',
'--theme-glow-buffalo-strong': 'rgba(200, 80, 28, 0.70)',
'--theme-glow-gold':            'rgba(212, 160, 80, 0.45)',
'--theme-glow-gold-strong':     'rgba(212, 160, 80, 0.70)',
'--theme-glow-flame':           'rgba(255, 128, 48, 0.50)',
'--theme-glow-sage':            'rgba(95, 200, 208, 0.40)',
'--theme-shadow':               'rgba(26, 12, 4, 0.85)',

/* ── Nav hover/active ── */
'--theme-nav-hover-bg':   'rgba(200, 80, 28, 0.16)',
'--theme-nav-active-bg':  'linear-gradient(90deg, rgba(200, 80, 28, 0.45) 0%, rgba(58, 30, 8, 0.85) 100%)',

/* ── Legacy tokeny (mapped na indián paletu) ── */
'--bg-primary':       '#2a1208',
'--bg-secondary':     '#3a1e08',
'--bg-card':          'var(--theme-leather-cream)',
'--bg-card-hover':    '#f5e8c8',
'--accent':           'var(--theme-buffalo-blood)',
'--accent-bright':    'var(--theme-buffalo-bright)',
'--accent-dim':       '#80300c',
'--accent-soft':      'rgba(200, 80, 28, 0.18)',
'--text-primary':     'var(--theme-text)',
'--text-secondary':   'var(--theme-text-muted)',
'--text-muted':       '#806040',
'--border':           'var(--theme-border-soft)',
'--border-subtle':    'rgba(90, 51, 24, 0.16)',
'--border-strong':    'var(--theme-border-strong)',
'--success':              '#3a8a4e',
'--success-soft':         'rgba(58, 138, 78, 0.14)',
'--success-soft-border':  'rgba(58, 138, 78, 0.4)',
'--warning':              'var(--theme-prairie-gold)',
'--warning-soft':         'rgba(212, 160, 80, 0.14)',
'--warning-soft-border':  'rgba(212, 160, 80, 0.4)',
'--danger':               'var(--theme-buffalo-blood)',
'--danger-soft':          'rgba(200, 80, 28, 0.14)',
'--danger-soft-border':   'rgba(200, 80, 28, 0.4)',
'--danger-focus-ring':    'rgba(200, 80, 28, 0.3)',
'--info':                 'var(--theme-sage-turquoise)',
'--text-on-accent':       'var(--theme-leather-cream)',
'--text-on-danger':       '#f0e0c0',
'--bg-overlay':           'rgba(26, 12, 4, 0.7)',

/* ── Typography (Carved & Spoken) ── */
'--font-logo':           '"Cinzel Decorative", "Cinzel", Georgia, serif',
'--font-display':        '"Cinzel", "Almendra", Georgia, serif',
'--font-tribal-accent':  '"Cinzel Decorative", "Cinzel", Georgia, serif',
'--font-body':           '"Spectral", "Lora", Georgia, serif',
'--font-script':         '"Caveat", "Henny Penny", Georgia, serif',

/* ── Layout chrome ── */
'--header-h':              '56px',
'--header-bg':             '#3a1e08',
'--frame-pad-y':           '40px',
'--frame-pad-x':           '18px',
'--sidebar-w':             '280px',
'--asset-logo-w':          '360px',
'--asset-logo-w-mobile':   '220px',
'--logo-img-display':      'block',
'--logo-fallback-display': 'none',

/* ── Asset URLs ── */
'--asset-logo':              `url('${decor}/logo.webp')`,
'--asset-andel-medallion':   `url('${decor}/medailon.webp')`,
'--asset-medailon-frame':    `url('${decor}/medailon-frame.webp')`,
'--asset-drum-pictograph':   `url('${decor}/drum-pictograph.webp')`,
'--asset-corner':            `url('${decor}/corner-tl.webp')`,
'--asset-corner-size':       '80px',
'--asset-corner-size-mobile':'40px',
'--frame-corner-inset':      '6px',
'--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
'--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
'--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
'--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
'--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
'--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
'--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,
'--asset-feather-stamp':      `url('${decor}/feather-stamp.webp')`,
'--asset-fire-stones':        `url('${decor}/decor-fire-stones.webp')`,
'--asset-petroglyph-divider': `url('${decor}/petroglyph-divider.webp')`,
```

#### 2.4 Změnit `fonts`
```ts
fonts: {
  logo: 'Cinzel Decorative',
  display: 'Cinzel',
  body: 'Spectral',
}
```

#### 2.5 Změnit `reducedMotion`
`'safe' → 'gentle'` (5 animací, vše vypnutelné v reduced-motion)

#### 2.6 Přidat `const decor` deklaraci nahoře
```ts
const decor = '/themes/indiane/decor';
```
(stejně jako hospoda + severske)

### Krok 3 — `src/themes/themes/indiane/decorations.css` — kompletní přepis

Velikost cíl: ~900 řádků (z aktuálních 15).

**Struktura sekcí (po vzoru `hospoda` + `severske-runy`):**

| # | Sekce | Obsah | ~řádků |
|---|-------|-------|--------|
| 1 | Atmosférický overlay | `[data-theme="indiane"][data-shell="ikaros"]::before` — pure darken overlay z `--theme-bg-overlay` | ~15 |
| 2 | Hearth glow zdola (signature) | `::after` — radial-gradient ellipse 50% 100%, breath 8s, mix-blend-mode screen | ~30 |
| 3 | Constellation overlay | 5–7 fixed prairie-gold dots (jedna radial-gradient layer), opacity 0.4, žádná animace, hide mobile | ~20 |
| 4 | Topbar — patinované dřevo | `> header` background gradient + wood-grain repeating-linear-gradient + prairie-gold hairline `::after` | ~50 |
| 5 | Bead-string sway | `> header::before` — vertikální CSS-only inline SVG (12 korálků v cyklu R/T/G/C), 8s sway, hide mobile | ~50 |
| 6 | Logo banner | `header [class*="logoImg"]` — background-image, šíře 360px desktop / 280 tablet / 220 mobile | ~15 |
| 7 | Header buttons | dřevěné cedule s prairie-gold border, hover gold glow, icon-only mobile | ~70 |
| 8 | Glass panely (sidebar + right) | dark wood gradient + 1px border + inner rim glow + deep shadow | ~30 |
| 9 | Welcome card — Šamanský buben | OVAL aspect 1.4/1, leather-cream BG + drum-pictograph 0.45 opacity, medailon-frame outer, drum-beat 10s | ~80 |
| 10 | Welcome content typography | welcomeTitle (Cinzel, dark), titleAccent (Cinzel Decorative, sage-turquoise), paragraph (Spectral), signature (Caveat italic, sage), prairie-gold hairline pod nadpisem | ~50 |
| 11 | Corner ornaments | `[data-frame-panel] [class*="ornament"]` — corner-tl asset, 4 positions (tl/tr/bl/br) s mirror transforms, drop-shadow | ~40 |
| 12 | Section titles + petroglyph-divider | sectionTitle (Cinzel UPPERCASE prairie-gold), `::after` pseudo s petroglyph-divider.webp | ~30 |
| 13 | NavItem (btn3d) — idle/hover/active | dark wood gradient + iron border, hover gold glow + translateY, active = bead-string left-border + spirit-smoke | ~120 |
| 14 | Spirit smoke + click feedback | `::after` smoke pseudo (6s loop) + `:active::before` 1s fade out feedback | ~40 |
| 15 | Nav ikony per data-nav-key | `[data-nav-key="X"] [class*="navItemIcon"]` mapping na `--asset-icon-X` | ~35 |
| 16 | Pravý panel — ADMINISTRACE order | `[data-frame-panel="right"]` — ThemeSwitcher styling + Uživatelé button (jako headerBtn ale uvnitř panelu) | ~70 |
| 17 | "+" tlačítka (feather-stamp) | rightAddBtn + addBtn — buffalo-blood gradient + `::before` feather-stamp.webp, hover rotate +8deg | ~70 |
| 18 | Novinky panel | dark wood + cream-leather text, Cinzel title buffalo-blood, Caveat italic empty hint | ~50 |
| 19 | Decor — Fire stones | `[data-decor="bottom"]` nebo equivalent — decor-fire-stones.webp pruh dole, 1200×300, opacity 0.85, height-down mobile | ~30 |
| 20 | PJ badge | leather štítek prairie-gold gradient + dark text + buffalo-blood inset | ~20 |
| 21 | Empty hints | Caveat italic sage-turquoise opacity 0.7, font-size 13 | ~15 |
| 22 | Showmore link | prairie-gold color + border, hover gold glow | ~15 |
| 23 | Focus visible (a11y) | box-shadow ring buffalo-bright outer + glow | ~30 |
| 24 | Scrollbar | dark wood track + prairie-gold thumb 8px width | ~15 |
| 25 | Tablet breakpoint (1024-1279) | logo width 280px, corner-tl 56px, smaller hairlines | ~25 |
| 26 | Mobile (≤768) | welcome card → obdélník 24px radius (no drum-beat), corner-tl 40px, bead-string hide, constellation hide, hearth height 30vh, decor fire-stones 180px height, header buttons icon-only, logo 220px | ~80 |
| 27 | Reduced motion | všech 5 animací `animation: none !important` + welcome card transform scale 1.0 fixed | ~25 |
| 28 | Forced colors | `forced-color-adjust: none` na ornaments, medailon-frame, drum-pictograph, nav ikony, bead-string, petroglyph-divider, decor-fire-stones | ~15 |

**Klíčové motivy (originální):**

**(M1) Welcome buben — Šamanský oval:**
```css
[data-theme="indiane"] [data-frame-panel="card"] {
  position: relative;
  aspect-ratio: 1.4 / 1;
  border-radius: 50%; /* s aspect-ratio dává oval */
  min-height: clamp(420px, 60vh, 720px);
  padding: 40px 80px;
  background-color: var(--theme-leather-cream);
  background-image:
    var(--asset-drum-pictograph);
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  /* Pictograph opacity přes mask */
  isolation: isolate;
  overflow: visible;
  border: 0; /* outer rám tvoří medailon-frame přes ::after */
  box-shadow:
    inset 0 0 0 1px rgba(90, 51, 24, 0.30),
    inset 0 0 60px rgba(90, 51, 24, 0.10),
    0 16px 40px -8px rgba(26, 12, 4, 0.85),
    0 24px 60px -12px rgba(26, 12, 4, 0.55);
  animation: indiane-drum-beat 10s ease-in-out infinite;
  transform-origin: center;
}

/* Outer wooden frame přes ::after */
[data-theme="indiane"] [data-frame-panel="card"]::after {
  content: '';
  position: absolute;
  inset: -20px;
  background-image: var(--asset-medailon-frame);
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 3;
}

/* Pictograph s opacity přes ::before */
[data-theme="indiane"] [data-frame-panel="card"]::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--asset-drum-pictograph);
  background-size: 100% 100%;
  opacity: 0.45;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
}

@keyframes indiane-drum-beat {
  0%, 100% { transform: scale(1.000); }
  50%      { transform: scale(1.005); }
}
```

**(M2) Aktivní nav — Korálkový left-border + spirit smoke:**
```css
[data-theme="indiane"] [class*="btn3dActive"]::before,
[data-theme="indiane"] [class*="navItemActive"]::before {
  content: '';
  position: absolute;
  left: 0; top: 4px; bottom: 4px;
  width: 4px;
  background:
    radial-gradient(circle at 50%  4%, var(--theme-bead-red)       1.5px, transparent 2px),
    radial-gradient(circle at 50% 12%, var(--theme-bead-turquoise) 1.5px, transparent 2px),
    radial-gradient(circle at 50% 20%, var(--theme-bead-gold)      1.5px, transparent 2px),
    radial-gradient(circle at 50% 28%, var(--theme-bead-cream)     1.5px, transparent 2px),
    radial-gradient(circle at 50% 36%, var(--theme-bead-red)       1.5px, transparent 2px),
    radial-gradient(circle at 50% 44%, var(--theme-bead-turquoise) 1.5px, transparent 2px),
    radial-gradient(circle at 50% 52%, var(--theme-bead-gold)      1.5px, transparent 2px),
    radial-gradient(circle at 50% 60%, var(--theme-bead-cream)     1.5px, transparent 2px),
    radial-gradient(circle at 50% 68%, var(--theme-bead-red)       1.5px, transparent 2px),
    radial-gradient(circle at 50% 76%, var(--theme-bead-turquoise) 1.5px, transparent 2px),
    radial-gradient(circle at 50% 84%, var(--theme-bead-gold)      1.5px, transparent 2px),
    radial-gradient(circle at 50% 92%, var(--theme-bead-cream)     1.5px, transparent 2px);
  pointer-events: none;
  z-index: 2;
}

[data-theme="indiane"] [class*="btn3dActive"]::after,
[data-theme="indiane"] [class*="navItemActive"]::after {
  content: '';
  position: absolute;
  left: 50%; bottom: 100%;
  width: 40px; height: 30px;
  background: linear-gradient(180deg, rgba(240, 224, 192, 0.18) 0%, transparent 100%);
  filter: blur(8px);
  transform: translateX(-50%) translateY(0);
  animation: indiane-spirit-smoke 6s ease-out infinite;
  pointer-events: none;
}

@keyframes indiane-spirit-smoke {
  0%   { transform: translateX(-50%) translateY(0)     scale(1);   opacity: 0.7; }
  70%  { transform: translateX(-50%) translateY(-20px) scale(1.4); opacity: 0.2; }
  100% { transform: translateX(-50%) translateY(-30px) scale(1.6); opacity: 0;   }
}
```

**(M3) Bead-string visící z topbaru:**
```css
[data-theme="indiane"][data-shell="ikaros"] > header::before {
  content: '';
  position: absolute;
  top: 100%; left: 24px;
  width: 6px; height: 120px;
  background-image: url("data:image/svg+xml;utf8,<svg ...>");
  /* SVG: 12 korálků v cyklu R/T/G/C navlečených na šedé šňůrce */
  background-size: contain;
  background-repeat: no-repeat;
  background-position: top center;
  pointer-events: none;
  z-index: 5;
  transform-origin: top center;
  animation: indiane-bead-sway 8s ease-in-out infinite;
}

@keyframes indiane-bead-sway {
  0%, 100% { transform: rotate(-2deg); }
  50%      { transform: rotate(2deg); }
}
```

**(M4) Hearth glow zdola:**
```css
[data-theme="indiane"][data-shell="ikaros"]::after {
  content: '';
  position: fixed;
  left: 0; right: 0; bottom: 0;
  height: 60vh;
  background: radial-gradient(
    ellipse at 50% 100%,
    rgba(255, 128, 48, 0.30) 0%,
    rgba(200, 80, 28, 0.14) 35%,
    transparent 65%
  );
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: screen;
  animation: indiane-hearth-breathe 8s ease-in-out infinite;
}

@keyframes indiane-hearth-breathe {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1.00; }
}
```

**(M5) Constellation overlay:**
```css
[data-theme="indiane"][data-shell="ikaros"] body::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    radial-gradient(circle at 18% 12%, rgba(212, 160, 80, 0.6) 0, transparent 1.5px),
    radial-gradient(circle at 28% 18%, rgba(212, 160, 80, 0.5) 0, transparent 1.2px),
    radial-gradient(circle at 42% 8%,  rgba(212, 160, 80, 0.4) 0, transparent 1.0px),
    radial-gradient(circle at 58% 14%, rgba(212, 160, 80, 0.5) 0, transparent 1.2px),
    radial-gradient(circle at 72% 9%,  rgba(212, 160, 80, 0.4) 0, transparent 1.0px),
    radial-gradient(circle at 82% 16%, rgba(212, 160, 80, 0.6) 0, transparent 1.5px),
    radial-gradient(circle at 90% 11%, rgba(212, 160, 80, 0.4) 0, transparent 1.0px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.4;
}
```

### Krok 4 — Verifikace v dev serveru (TEST)

1. `npm run dev` → otevřít browser http://localhost:5173
2. Přepnout na skin **"Indiánské"** přes ThemeSwitcher
3. **Desktop test (1920×1080):**
   - Hearth glow zdola dýchá 8s ✓
   - Topbar má patinované dřevo + prairie-gold hairline + bead-string visící vlevo (sway) ✓
   - Logo cedule čitelná, šíře ~360px ✓
   - Sidebar levý/pravý mají corner-tl ornamenty ve všech 4 rozích ✓
   - Section titles "NAVIGACE" / "VESMÍRY" / "CHAT" / "ADMINISTRACE" / "MOJE DISKUZE" / "MOJE SVĚTY" mají Cinzel UPPERCASE + petroglyph-divider pod sebou ✓
   - Welcome card je OVAL šamanský buben s drum-pictograph pictogramy (4 Medicine Wheel + sun spiral) + medailon-frame outer rám ✓
   - Welcome text: Cinzel title + Cinzel Decorative sage „Projektu Ikaros." + Spectral paragraphs + Caveat italic sage signature ✓
   - Drum-beat pulse 10s (sotva znatelný scale) ✓
   - 7 nav ikon viditelných ve sidebar (rising sun / tipi / council / scroll / petroglyph / owl / campfire) ✓
   - Active nav má bead-string left-border + spirit smoke stoupá ✓
   - "+" tlačítka mají feather-stamp ikonu, hover rotuje ✓
   - Decor fire-stones pruh dole ✓
   - Constellation tečky v top třetině ✓
   - Pravý panel: ADMINISTRACE nahoře, pak Moje diskuze + Moje světy ✓
4. **Tablet test (1024×768):**
   - Logo 280px ✓
   - Corner-tl 56px ✓
   - Layout zachován ✓
5. **Mobile test (375×667):**
   - Drawer sidebar opens
   - Welcome card → obdélník border-radius 24px (drum-beat vypnuto)
   - Bead-string skryté
   - Constellation skryté
   - Hearth glow 30vh
   - Header buttons icon-only
   - Logo 220px
   - Touch targets ≥48px
6. **Reduced-motion test:** `prefers-reduced-motion: reduce` v DevTools → všech 5 animací zastaveno
7. **Forced colors test:** Windows high-contrast simulace → ornamenty + drum + medailon-frame zachovány
8. **Smoke test:** přepnout na 3 jiné skiny (hospoda / severske-runy / nemrtvi) → žádná regrese
9. **Lighthouse a11y audit** na indiánském skinu → ≥95 score

### Krok 5 — Lint & contrast audit

1. `npm run lint:colors` — žádné hardcoded barvy mimo CSS vars (audit specu sekce 4.13–4.16)
2. `npm run audit:contrast` — všechny WCAG kombinace ≥ AA (predikováno AC-20 dle spec sekce 6)

### Krok 6 — Screenshots na 3 viewportech

Spustit `npm run screenshot:3viewports` (pokud existuje) NEBO ručně přes Playwright:
- `docs/arch/phase-1/_screenshots/indiane-mobile-375.png`
- `docs/arch/phase-1/_screenshots/indiane-tablet-1024.png`
- `docs/arch/phase-1/_screenshots/indiane-desktop-1920.png`
- `docs/arch/phase-1/_screenshots/indiane-welcome-zoom.png` (close-up welcome bubnu)
- `docs/arch/phase-1/_screenshots/indiane-sidebar-zoom.png` (close-up nav s active state — bead + smoke)

### Krok 7 — Roadmap & dluhy update

1. Zaškrtnout 1.0p v [`docs/roadmap-fe.md`](../../roadmap-fe.md) (pokud existuje + obsahuje 1.0p entry — jinak přidat)
2. Review [`docs/dluhy.md`](../../dluhy.md) — pokud existuje záznam typu „indián skin slabý" / „rye font off-brand", uzavřít

### Krok 8 — Post-impl: doc cleanup

[`docs/themes/indiane.md`](../../themes/indiane.md) (staré frontier hybrid Wild West vize) — **přepsat** na nové „Strážci horizontu", s odkazem na spec-1.0p.

### Krok 9 — Commit & PR

1. `git status` — verify changed files match plan (jen `index.ts`, `decorations.css`, doc updates, screenshots)
2. `git add` (specifické soubory, ne `-A`)
3. Commit message:
   ```
   feat(themes/indiane): krok 1.0p — Strážci horizontu skin upgrade

   - Kompletní přepis index.ts (paleta wood + iron + leather + bead, fonty Cinzel Decorative + Cinzel + Spectral + Caveat, 14 asset URLs)
   - Kompletní přepis decorations.css (~900 řádků, 28 sekcí dle hospoda/severske vzoru)
   - Welcome card jako oválný šamanský buben s drum-beat pulse + drum-pictograph Medicine Wheel
   - Originální motivy: bead-string left-border na active nav, spirit smoke, drum-beat, constellation, bead-string sway
   - 15 assetů v public/themes/indiane/decor/ (13 AI + logo + medailon)
   - ADMINISTRACE pravý panel order (skin + uživatelé nahoře)
   - Mobile fallback: oval → obdélník, bead-string + constellation hide, drum-beat off
   - Reduced-motion fallback pro všech 5 animací
   - Forced colors a11y respektováno
   - Žádný globální dopad — vše scoped [data-theme="indiane"]
   ```
4. Push & PR (pokud workflow vyžaduje PR), jinak direct merge do `main`

---

## 2. Risk mitigace dle spec sekce 12

| Risk | Akce v implementaci |
|---|---|
| UI rám "přerazí" BG | Border 2px, corner-tl 80px jen v rozích, žádné nail studs podél stran |
| Text v ovalu se nevejde | aspect-ratio: 1.4/1, padding 40px/80px, min-height clamp(420px, 60vh, 720px), test 3 viewport |
| Animační chaos | 5 typů, 5 různých period (8s/10s/8s/6s/1s), žádné překrývající se animace na stejném elementu |
| Sage-turquoise nízký kontrast | Pouze titleAccent (32px+ Cinzel Decorative) + signature (22px+ Caveat italic) + empty hints (na dark BG) |
| Mobile oval ořezává text | `@media (max-width: 768px)` přepnutí na `border-radius: 24px`, `aspect-ratio: auto`, drum-beat off |
| Spirit smoke vyrušuje při scrollu | Smoke je `position: absolute` v rámci active nav buttonu, ne fixed — scrolluje s navigací |
| Drum-beat 10s pulse pozorný | Scale 1.000→1.005 sotva znatelné, podvědomé |
| Asset balík nekonzistentní | ✅ audit hotov, balík sjednocený (tribal cik-cak rim na všech medailonech) |
| Konflikt s `priroda` paletou | Buffalo-blood warm vs. emerald cold — jasná separace |
| Konflikt s `nemrtvi` ghost-pulse | Hearth glow zdola warm vs. ghost shora teal — opposite |

---

## 3. Akceptační kritéria checkpoint

Při dokončení každého kroku ověř proti AC-1 až AC-25 z [`spec-1.0p-indiane-upgrade.md`](spec-1.0p-indiane-upgrade.md) sekce 10. Pokud AC fails → stop, prokomunikuj uživateli, ne pokračovat.

---

## 4. Post-implementační check-list

- [ ] AC-1 .. AC-25 vše zelené
- [ ] Screenshots × 5 (mobile / tablet / desktop / welcome-zoom / sidebar-zoom) uloženy
- [ ] `npm run lint:colors` projde
- [ ] `npm run audit:contrast` projde
- [ ] Smoke test 3 jiné skiny (hospoda / severske / nemrtvi) → žádná regrese
- [ ] Reduced-motion test projde
- [ ] Forced colors test projde
- [ ] [`docs/roadmap-fe.md`](../../roadmap-fe.md) update
- [ ] [`docs/themes/indiane.md`](../../themes/indiane.md) přepis (post-impl)
- [ ] Commit + push

---

## 5. Mimo scope (explicitně)

- Globální CSS (žádné edity)
- Shell layout komponenty (žádné edity)
- Ostatní 21 skinů (nulová regrese)
- Theme registry [`src/themes/themes/index.ts`](../../../src/themes/themes/index.ts) (indián už registrován)
- TypeScript typy (žádný edit)
- Backend / API změny
- Nové komponenty
- i18n překlady
- Cleanup `docs/themes/indiane.md` (volitelné, post-impl, ne v rámci 1.0p PR)

---

**Status:** 🟡 **Plán ke schválení**. Po souhlasu pokračuji s implementací — pořadí: Krok 1 (fonts) → Krok 2 (index.ts) → Krok 3 (decorations.css) → Krok 4 (dev test) → Krok 5 (lint) → Krok 6 (screenshots) → Krok 7 (roadmap) → Krok 8 (doc cleanup) → Krok 9 (commit).
