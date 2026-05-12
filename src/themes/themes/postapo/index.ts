import type { Theme } from '@/themes/types';

const decor = '/themes/postapo/decor';

/**
 * Postapo — Bunkr 7 pod ruinami Zóny 7.
 *
 * Apokalyptický wasteland: korodovaný kov + matná radiace + popel.
 * Industriální stencil typografie, žádný neon glow — jen matný kov.
 * Plochý, jednoduchý, atmosférický.
 *
 * MOTIFY:
 * - Caution hazard stripes (žluto-černé úhlopříčky) pod section title +
 *   pod welcome title + jako vertikální nav-item indicator vlevo
 * - Stencil section titulky v Big Shoulders Stencil
 * - DEAD WORLD stencil watermark („ZÓNA 7") uprostřed welcome card,
 *   Black Ops One 120px+, opacity 0.08 — atmospheric centerpiece
 * - Korodovaný kovový panel s rezavou subtle bordurou (žádné nýty,
 *   žádné rivet corners — jednoduchá kovová deska)
 * - Subtle 3D button depth (mírný gradient + top highlight + bottom
 *   shadow) — žádné nýty na buttonech, žádný heavy clunk
 * - Administrator signature v Special Elite italic (bez self-draw)
 *
 * Fonty: Black Ops One (logo fallback — vojenský stencil)
 *      + Big Shoulders Stencil Display (display uppercase — industrial)
 *      + Special Elite (body — typewriter bunker reports).
 *
 * Assety: pouze 3 raster (logo + medailon + background) dodané uživatelem.
 * Pouze 3 inline SVG ornamenty: hazard stripe (horizontal + vertical),
 * 6 nav medailon ikony + 1 chat, plus glyph. Žádné AI gen WEBP.
 *
 * Scope: [data-theme="postapo"], žádný globální dopad.
 *
 * Spec: docs/arch/phase-1/spec-1.0t-postapo-upgrade.md
 * Plan: docs/arch/phase-1/plan-1.0t.md
 */

// =================== INLINE SVG ASSETS (URL-encoded data-uri) ===================

const svg = (markup: string) =>
  `url("data:image/svg+xml;utf8,${markup.replace(/#/g, '%23').replace(/\s+/g, ' ').trim()}")`;

// ─── Hazard stripes (žluto-černé úhlopříčky, 16×16 tile) ──────────────────────
const HAZARD_STRIPE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>
  <defs>
    <pattern id='p' patternUnits='userSpaceOnUse' width='16' height='16' patternTransform='rotate(-45)'>
      <rect width='8' height='16' fill='#c8a008'/>
      <rect x='8' width='8' height='16' fill='#1a1612'/>
    </pattern>
  </defs>
  <rect width='16' height='16' fill='url(%23p)'/>
</svg>
`);

const HAZARD_STRIPE_VERTICAL = svg(`
<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>
  <defs>
    <pattern id='p' patternUnits='userSpaceOnUse' width='16' height='16' patternTransform='rotate(45)'>
      <rect width='8' height='16' fill='#c8a008'/>
      <rect x='8' width='8' height='16' fill='#1a1612'/>
    </pattern>
  </defs>
  <rect width='16' height='16' fill='url(%23p)'/>
</svg>
`);

// =================== 6× NAV MEDAILON IKONY + 1× CHAT IKONA ====================

// Bunker door s nýty — Úvodník
const ICON_UVODNIK = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <rect x='5' y='3' width='22' height='27' rx='1'/>
  <line x1='5' y1='9' x2='27' y2='9'/>
  <line x1='5' y1='25' x2='27' y2='25'/>
  <circle cx='8' cy='6' r='0.8' fill='currentColor'/>
  <circle cx='24' cy='6' r='0.8' fill='currentColor'/>
  <circle cx='8' cy='28' r='0.8' fill='currentColor'/>
  <circle cx='24' cy='28' r='0.8' fill='currentColor'/>
  <circle cx='22' cy='17' r='1.4' fill='currentColor'/>
</svg>
`);

// Globe with crack lines — Vytvořit svět
const ICON_VYTVORIT_SVET = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <circle cx='16' cy='16' r='12'/>
  <ellipse cx='16' cy='16' rx='5' ry='12'/>
  <line x1='4' y1='16' x2='28' y2='16'/>
  <path d='M9 9 L13 11 L11 15 L18 17 L14 22 L23 25' stroke-width='2.5' opacity='0.7'/>
</svg>
`);

// Broken walkie talkie — Diskuze
const ICON_DISKUZE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <rect x='9' y='4' width='14' height='24' rx='1'/>
  <rect x='12' y='8' width='8' height='5'/>
  <line x1='13' y1='6' x2='15' y2='6'/>
  <circle cx='13' cy='17' r='0.8' fill='currentColor'/>
  <circle cx='16' cy='17' r='0.8' fill='currentColor'/>
  <circle cx='19' cy='17' r='0.8' fill='currentColor'/>
  <circle cx='13' cy='21' r='0.8' fill='currentColor'/>
  <circle cx='16' cy='21' r='0.8' fill='currentColor'/>
  <circle cx='19' cy='21' r='0.8' fill='currentColor'/>
  <line x1='16' y1='2' x2='16' y2='4'/>
</svg>
`);

// Stamped clipboard/dossier — Články
const ICON_CLANKY = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <rect x='6' y='3' width='20' height='26' rx='1'/>
  <line x1='10' y1='9' x2='22' y2='9'/>
  <line x1='10' y1='13' x2='22' y2='13'/>
  <line x1='10' y1='17' x2='22' y2='17'/>
  <line x1='10' y1='21' x2='18' y2='21'/>
  <rect x='17' y='23' width='8' height='5' rx='0.5' stroke-dasharray='2 1.5' opacity='0.7'/>
</svg>
`);

// Broken photo frame — Galerie
const ICON_GALERIE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <rect x='4' y='5' width='24' height='22' rx='1'/>
  <circle cx='11' cy='12' r='2'/>
  <path d='M4 22 L11 17 L17 22 L21 19 L28 25'/>
</svg>
`);

// Military Q-stamp — Nápověda
const ICON_NAPOVEDA = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <rect x='4' y='4' width='24' height='24' rx='1'/>
  <path d='M12 13 Q12 9 16 9 Q20 9 20 13 Q20 15 18 16 Q16 17 16 19 L16 21'/>
  <circle cx='16' cy='24' r='1.2' fill='currentColor'/>
</svg>
`);

// Broken beer mug stencil — Dimenzionální hospoda
const ICON_HOSPODA = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M8 6 L24 6 L22 28 L10 28 Z'/>
  <path d='M22 10 L26 10 L26 20 L24 22'/>
  <line x1='10' y1='12' x2='18' y2='14' opacity='0.5'/>
  <line x1='12' y1='18' x2='22' y2='20' opacity='0.5' stroke-dasharray='1 1'/>
</svg>
`);

// =================== PLUS GLYPH =============================================

const PLUS_STENCIL = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round'>
  <line x1='12' y1='5' x2='12' y2='19'/>
  <line x1='5' y1='12' x2='19' y2='12'/>
</svg>
`);

// =================== RIVET CORNER (L-shape korodovaný plát s 2 nýty) ========
// Master pro TL pozici, ostatní rohy přes CSS scaleX/Y mirror.
// Použito jen ve Welcome card + Novinky card jako distinguished decoration.

const RIVET_CORNER = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 56' fill='none'>
  <path d='M4 4 L52 4 L52 14 L14 14 L14 52 L4 52 Z' fill='#1a1612' stroke='#302e20' stroke-width='1.5'/>
  <path d='M4 4 L52 4 L52 6 L4 6 Z' fill='#3a3528' opacity='0.55'/>
  <path d='M4 50 L14 50 L14 52 L4 52 Z' fill='#000' opacity='0.6'/>
  <circle cx='9' cy='9' r='2.6' fill='#5a523f'/>
  <circle cx='9' cy='9' r='1.5' fill='#9a8870'/>
  <circle cx='8.4' cy='8.4' r='0.45' fill='#d4c8a8'/>
  <circle cx='47' cy='9' r='2.6' fill='#5a523f'/>
  <circle cx='47' cy='9' r='1.5' fill='#9a8870'/>
  <circle cx='46.4' cy='8.4' r='0.45' fill='#d4c8a8'/>
</svg>
`);

// =================== THEME OBJECT ===========================================

export const postapoTheme: Theme = {
  id: 'postapo',
  name: 'Postapo',
  scope: 'both',
  atmosphere:
    'Postapo — Bunkr 7 pod ruinami Zóny 7, korodovaný kov + matná radiace + popel. Jednoduchý, plochý, atmosférický.',
  vars: {
    /* ── Atmosférický overlay (BG je toxická obloha — darken pro čitelnost) ── */
    '--theme-bg-overlay':
      'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(10, 9, 5, 0.65) 100%), linear-gradient(180deg, rgba(10, 9, 5, 0.25) 0%, rgba(10, 9, 5, 0.55) 100%)',

    /* ── Surfaces (korodovaný kov panely) ── */
    '--theme-surface':        'rgba(26, 22, 18, 0.92)',
    '--theme-surface-strong': 'rgba(14, 12, 8, 0.96)',
    '--theme-surface-soft':   'rgba(34, 29, 21, 0.55)',

    /* ── Ash/iron paleta ── */
    '--theme-ash-deep':       '#0a0905',
    '--theme-iron-base':      '#14110a',
    '--theme-iron-card':      '#1a1612',
    '--theme-iron-lift':      '#221d15',

    /* ── Primary brand (toxic olive — matná radiace) ── */
    '--theme-olive':          '#8a8810',
    '--theme-olive-bright':   '#a8a818',
    '--theme-olive-dim':      '#484808',

    /* ── Secondary primary (rust — korozivní) ── */
    '--theme-rust':           '#7a3810',
    '--theme-rust-bright':    '#9a5020',
    '--theme-rust-dim':       '#4a2010',

    /* ── Section accents ── */
    '--theme-section-olive':  '#8a8810',
    '--theme-section-rust':   '#7a3810',
    '--theme-section-yellow': '#c8a008',
    '--theme-section-amber':  '#d68a20',
    '--theme-section-green':  '#6a8a30',
    '--theme-section-concrete': '#686050',

    /* ── Caution / hazard / radioactive ── */
    '--theme-caution-yellow': '#c8a008',
    '--theme-hazard-amber':   '#d68a20',
    '--theme-radioactive':    '#6a8a30',
    '--theme-concrete':       '#484840',

    /* ── Borders ── */
    '--theme-border':         '#302e20',
    '--theme-border-soft':    '#1c1a14',
    '--theme-border-strong':  '#7a3810',

    /* ── Text (matný bone-ash, žádný glow) ── */
    '--theme-text':           '#b0a888',
    '--theme-text-muted':     '#857b66',
    '--theme-heading':        '#a8a818',
    '--theme-text-on-olive':  '#0a0905',
    '--theme-text-on-rust':   '#fff5e8',

    /* ── Slabé halos (jen velmi subtle) ── */
    '--theme-glow-olive':     'rgba(138, 136, 16, 0.20)',
    '--theme-glow-rust':      'rgba(122, 56, 16, 0.25)',
    '--theme-shadow':         'rgba(10, 9, 5, 0.85)',

    /* ── Nav hover/active ── */
    '--theme-nav-hover-bg':   'rgba(138, 136, 16, 0.08)',
    '--theme-nav-active-bg':
      'linear-gradient(90deg, rgba(122, 56, 16, 0.28) 0%, rgba(138, 136, 16, 0.16) 100%)',

    /* ── Legacy tokeny (mapped na postapo paletu) ── */
    '--bg-primary':       '#0a0905',
    '--bg-secondary':     '#14110a',
    '--bg-card':          '#1a1612',
    '--bg-card-hover':    '#221d15',
    '--accent':           '#8a8810',
    '--accent-bright':    '#a8a818',
    '--accent-dim':       '#484808',
    '--accent-soft':      'rgba(138, 136, 16, 0.18)',
    '--text-primary':     '#b0a888',
    '--text-secondary':   '#857b66',
    '--text-muted':       '#5a523f',
    '--border':           '#302e20',
    '--border-subtle':    '#1c1a14',
    '--border-strong':    '#7a3810',
    '--success':              '#6a8830',
    '--success-soft':         'rgba(106, 136, 48, 0.14)',
    '--success-soft-border':  'rgba(106, 136, 48, 0.40)',
    '--warning':              '#c8a008',
    '--warning-soft':         'rgba(200, 160, 8, 0.14)',
    '--warning-soft-border':  'rgba(200, 160, 8, 0.40)',
    '--danger':               '#9a4020',
    '--danger-soft':          'rgba(154, 64, 32, 0.16)',
    '--danger-soft-border':   'rgba(154, 64, 32, 0.40)',
    '--danger-focus-ring':    'rgba(154, 64, 32, 0.30)',
    '--info':                 '#5a7080',
    '--text-on-accent':       '#0a0905',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(10, 9, 5, 0.80)',

    /* ── Typography ── */
    '--font-logo':           '"Black Ops One", "Stardos Stencil", sans-serif',
    '--font-display':        '"Big Shoulders Stencil Display", "Oswald", sans-serif',
    '--font-tribal-accent':  '"Big Shoulders Stencil Display", "Oswald", sans-serif',
    '--font-body':           '"Special Elite", "Courier Prime", monospace',
    '--font-script':         '"Special Elite", "Courier Prime", monospace',

    /* ── Layout chrome ── */
    '--header-h':              '56px',
    '--header-bg':             '#14110a',
    '--frame-pad-y':           '40px',
    '--frame-pad-x':           '18px',
    '--sidebar-w':             '280px',
    '--asset-logo-w':          '360px',
    '--asset-logo-w-mobile':   '220px',
    '--logo-img-display':      'block',
    '--logo-fallback-display': 'none',

    /* ── Asset URLs (raster — dodané uživatelem) ── */
    '--asset-logo':              `url('${decor}/logo.webp')`,
    '--asset-andel-medallion':   `url('${decor}/medailon.webp')`,

    /* ── Hazard stripes (žluto-černé úhlopříčky) ── */
    '--asset-hazard-stripe':           HAZARD_STRIPE,
    '--asset-hazard-stripe-vertical':  HAZARD_STRIPE_VERTICAL,

    /* ── 6× nav medailon ikony + 1× chat ikona (stroke currentColor) ── */
    '--asset-icon-uvodnik':         ICON_UVODNIK,
    '--asset-icon-vytvorit-svet':   ICON_VYTVORIT_SVET,
    '--asset-icon-diskuze':         ICON_DISKUZE,
    '--asset-icon-clanky':          ICON_CLANKY,
    '--asset-icon-galerie':         ICON_GALERIE,
    '--asset-icon-napoveda':        ICON_NAPOVEDA,
    '--asset-icon-hospoda':         ICON_HOSPODA,

    /* ── Plus glyph pro „+" tlačítka ── */
    '--asset-plus-stencil':      PLUS_STENCIL,

    /* ── Rivet corner ornament (scoped na Welcome + Novinky card, mirror přes scaleX/Y) ── */
    '--asset-rivet-corner':       RIVET_CORNER,
    '--asset-corner-size':        '48px',
    '--asset-corner-size-novinky':'32px',
    '--asset-corner-size-mobile': '32px',
    '--frame-corner-inset':       '8px',
  },
  fonts: {
    logo: 'Black Ops One',
    display: 'Big Shoulders Stencil Display',
    body: 'Special Elite',
  },
  thumbnail: '/themes/thumbnails/postapo.webp',
  background: '/themes/backgrounds/postapo.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
