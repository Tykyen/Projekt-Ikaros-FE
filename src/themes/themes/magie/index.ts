import type { Theme } from '@/themes/types';

const decor = '/themes/magie/decor';

/**
 * Magie a kouzla (spec 1.0u).
 *
 * Kouzelnická síň, kde tlačítka levitují jako enchanted artefakty.
 * Glassmorphic backdrop-blur + zlato+ametyst dual border + ametyst inner glow.
 * Lehkost přichází z polotransparence + pomalého driftu + iridescence.
 *
 * ORIGINÁLNÍ MOTIVY (žádný jiný skin):
 * - Polished glassmorphic btn3d (extension shared modulu — header+nav+admin konzistentně)
 * - Faceted amethyst corner crystal (raster — 3D fasety, NE inline SVG L-shape)
 * - Spell-book scrying disc (raster — concentric arcane circles, rotace 90s)
 * - 8× floating arcane sigils per section (inline SVG kruhové glyfy)
 * - Iridescent section underline (animated hue-shift 5 barev, 12s)
 * - Levitating navItem (individuální phase offset přes :nth-child)
 * - Sparkle orbit na active nav (3 dots, 6s)
 * - Mea Culpa signature self-draw (extra-thin éterický cursive)
 *
 * Fonty: Quintessential (display heading, flourish serif) + Macondo (accent
 * labels, magical handwriting) + Sorts Mill Goudy (body, elegant antique) +
 * Mea Culpa (signature, extra-thin cursive) + Cinzel Decorative (logo fallback).
 * Kombinace 4 unikátních fontů — žádný jiný skin nepoužívá.
 *
 * Assety: 5 raster (logo + medailon + BG + ametyst-corner + spell-disc).
 * Zbytek ornamentů (16 inline SVG vars) je data-uri v `vars`.
 *
 * Scope: [data-theme="magie"], žádný globální dopad.
 */

// =================== INLINE SVG ASSETS ===================

const svg = (markup: string) =>
  `url("data:image/svg+xml;utf8,${markup.replace(/#/g, '%23').replace(/\s+/g, ' ').trim()}")`;

// Sigil helper — concentric kompozice s vnitřním glyfem.
// Stroke=currentColor → CSS color: var(--section-color) hot-swap.
const sigil = (inner: string) => svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none' stroke='currentColor' stroke-width='1.2' stroke-linejoin='round' stroke-linecap='round'>
  <circle cx='32' cy='32' r='28' opacity='0.55'/>
  <circle cx='32' cy='32' r='22' opacity='0.35'/>
  ${inner}
</svg>
`);

// 8× unikátní arcane sigil per section (kompozitní glyf, NE jednotlivá runa)
const SIGIL_NAV = sigil(`
  <circle cx='32' cy='32' r='3' fill='currentColor' stroke='none'/>
  <circle cx='32' cy='32' r='7' opacity='0.6'/>
  <line x1='32' y1='10' x2='32' y2='16'/><line x1='32' y1='48' x2='32' y2='54'/>
  <line x1='10' y1='32' x2='16' y2='32'/><line x1='48' y1='32' x2='54' y2='32'/>
  <line x1='17' y1='17' x2='21' y2='21'/><line x1='43' y1='43' x2='47' y2='47'/>
  <line x1='43' y1='21' x2='47' y2='17'/><line x1='17' y1='47' x2='21' y2='43'/>
`);

const SIGIL_UNIVERSE = sigil(`
  <circle cx='32' cy='32' r='2.5' fill='currentColor' stroke='none'/>
  <ellipse cx='32' cy='32' rx='15' ry='6' transform='rotate(-25 32 32)'/>
  <ellipse cx='32' cy='32' rx='15' ry='6' transform='rotate(25 32 32)'/>
  <circle cx='44' cy='22' r='1.8' fill='currentColor' stroke='none'/>
  <circle cx='20' cy='42' r='1.5' fill='currentColor' stroke='none'/>
  <circle cx='48' cy='40' r='1.2' fill='currentColor' stroke='none'/>
`);

const SIGIL_CHAT = sigil(`
  <path d='M32 14 Q44 22 38 36 Q26 36 26 22 Q26 14 32 14 Z' opacity='0.85'/>
  <path d='M44 32 Q52 44 38 50 Q30 42 38 32 Q44 28 44 32 Z' opacity='0.85'/>
  <path d='M20 32 Q12 44 26 50 Q34 42 26 32 Q20 28 20 32 Z' opacity='0.85'/>
`);

const SIGIL_ADMIN = sigil(`
  <polygon points='32,12 49,42 15,42' opacity='0.9'/>
  <polygon points='32,52 15,22 49,22' opacity='0.9'/>
  <circle cx='32' cy='32' r='4'/>
`);

const SIGIL_WORLDS = sigil(`
  <circle cx='32' cy='32' r='14'/>
  <ellipse cx='32' cy='32' rx='5' ry='14'/>
  <line x1='18' y1='32' x2='46' y2='32'/>
  <path d='M32 18 Q40 24 40 32 Q40 40 32 46' opacity='0.7'/>
  <path d='M32 18 Q24 24 24 32 Q24 40 32 46' opacity='0.7'/>
`);

const SIGIL_TALK = sigil(`
  <polygon points='32,12 38,28 54,28 41,38 46,54 32,44 18,54 23,38 10,28 26,28'/>
  <circle cx='32' cy='32' r='5' opacity='0.6'/>
`);

const SIGIL_BOOK = sigil(`
  <path d='M16 18 L32 14 L48 18 L48 46 L32 42 L16 46 Z'/>
  <line x1='32' y1='14' x2='32' y2='42'/>
  <path d='M20 22 L28 24'/><path d='M36 24 L44 22'/>
  <path d='M20 28 L28 30'/><path d='M36 30 L44 28'/>
`);

const SIGIL_EYE = sigil(`
  <polygon points='32,14 50,46 14,46'/>
  <ellipse cx='32' cy='34' rx='10' ry='5'/>
  <circle cx='32' cy='34' r='2.5' fill='currentColor' stroke='none'/>
  <line x1='32' y1='14' x2='32' y2='24' opacity='0.5'/>
`);

// =================== 7× NAV MEDAILON IKONY ===================
// Line-art glyph 32×32 viewbox, stroke=currentColor → nav-color hot-swap.

const ICON_UVODNIK = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M4 16 L16 5 L28 16 L28 27 L20 27 L20 19 L12 19 L12 27 L4 27 Z'/>
  <path d='M16 5 L16 2' opacity='0.5'/>
</svg>
`);

const ICON_VYTVORIT_SVET = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <circle cx='16' cy='16' r='12'/>
  <ellipse cx='16' cy='16' rx='5' ry='12'/>
  <line x1='4' y1='16' x2='28' y2='16'/>
  <path d='M16 4 Q22 10 22 16 Q22 22 16 28' opacity='0.6'/>
  <path d='M16 4 Q10 10 10 16 Q10 22 16 28' opacity='0.6'/>
</svg>
`);

const ICON_DISKUZE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M4 8 Q4 4 8 4 L24 4 Q28 4 28 8 L28 20 Q28 24 24 24 L14 24 L8 30 L8 24 Q4 24 4 20 Z'/>
  <circle cx='11' cy='14' r='1.5' fill='currentColor' stroke='none'/>
  <circle cx='16' cy='14' r='1.5' fill='currentColor' stroke='none'/>
  <circle cx='21' cy='14' r='1.5' fill='currentColor' stroke='none'/>
</svg>
`);

const ICON_CLANKY = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M6 4 L22 4 L26 8 L26 28 L6 28 Z'/>
  <path d='M22 4 L22 8 L26 8' opacity='0.5'/>
  <line x1='10' y1='13' x2='22' y2='13'/>
  <line x1='10' y1='18' x2='22' y2='18'/>
  <line x1='10' y1='23' x2='18' y2='23'/>
</svg>
`);

const ICON_GALERIE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M16 3 L26 12 L16 29 L6 12 Z'/>
  <line x1='6' y1='12' x2='26' y2='12'/>
  <line x1='16' y1='3' x2='16' y2='12' opacity='0.5'/>
  <line x1='11' y1='12' x2='16' y2='29' opacity='0.5'/>
  <line x1='21' y1='12' x2='16' y2='29' opacity='0.5'/>
</svg>
`);

const ICON_NAPOVEDA = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <circle cx='16' cy='16' r='12'/>
  <path d='M12 12 Q12 8 16 8 Q20 8 20 12 Q20 14 18 15 Q16 16 16 18 L16 20'/>
  <circle cx='16' cy='24' r='1.2' fill='currentColor' stroke='none'/>
</svg>
`);

const ICON_HOSPODA = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M8 6 L24 6 L22 28 L10 28 Z'/>
  <path d='M22 10 L26 10 L26 20 L24 22'/>
  <path d='M10 11 Q12 9 14 11 Q16 9 18 11 Q20 9 22 11' opacity='0.7'/>
</svg>
`);

// =================== 5× PRAVÝ PANEL SECTION IKONY ===================

const ICON_ADMINISTRACE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <circle cx='16' cy='16' r='4'/>
  <path d='M16 4 L18 8 L22 7 L22 11 L26 13 L24 16 L26 19 L22 21 L22 25 L18 24 L16 28 L14 24 L10 25 L10 21 L6 19 L8 16 L6 13 L10 11 L10 7 L14 8 Z'/>
</svg>
`);

const ICON_MOJE_SVETY = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linejoin='round' stroke-linecap='round'>
  <circle cx='11' cy='12' r='8'/>
  <ellipse cx='11' cy='12' rx='3.5' ry='8'/>
  <line x1='3' y1='12' x2='19' y2='12'/>
  <circle cx='22' cy='22' r='6' opacity='0.7'/>
  <ellipse cx='22' cy='22' rx='2.5' ry='6' opacity='0.7'/>
  <line x1='16' y1='22' x2='28' y2='22' opacity='0.7'/>
</svg>
`);

const ICON_MOJE_DISKUZE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M3 6 Q3 3 6 3 L18 3 Q21 3 21 6 L21 13 Q21 16 18 16 L11 16 L7 20 L7 16 Q3 16 3 13 Z'/>
  <path d='M14 17 Q14 15 16 15 L26 15 Q29 15 29 18 L29 24 Q29 27 26 27 L21 27 L25 30 L25 27 Q14 27 14 24 Z' opacity='0.7'/>
</svg>
`);

const ICON_OBLIBENE_CLANKY = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M7 4 L23 4 L26 7 L26 28 L7 28 Z'/>
  <path d='M23 4 L23 7 L26 7' opacity='0.5'/>
  <path d='M11 11 L18 11'/><path d='M11 16 L20 16'/><path d='M11 21 L16 21'/>
  <path d='M22 2 L26 2 L26 9 L24 7 L22 9 Z' fill='currentColor' stroke='none'/>
</svg>
`);

const ICON_OBLIBENE_OBRAZKY = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M14 6 L22 12 L14 28 L6 12 Z'/>
  <line x1='6' y1='12' x2='22' y2='12'/>
  <path d='M22 2 L26 2 L26 9 L24 7 L22 9 Z' fill='currentColor' stroke='none'/>
</svg>
`);

// =================== SIGNATURE FLOURISH + PLUS + SPARKLE ===================

// Administrator signature flourish — ametyst stroke, jemný zákmit pod textem
const SIGNATURE_FLOURISH = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 24' fill='none' stroke='#c77dff' stroke-width='1.2' stroke-linecap='round'>
  <path d='M4 16 Q40 4 80 16 Q120 28 160 16 Q200 4 240 16 Q260 22 276 12'/>
  <circle cx='4' cy='16' r='1.5' fill='#c77dff'/>
  <circle cx='276' cy='12' r='1.5' fill='#d4a017'/>
  <circle cx='140' cy='17' r='1.0' fill='#d4d8ff'/>
</svg>
`);

// Plus glyph s ametyst sparkle pro „přidat" tlačítka
const PLUS_MAGIC = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round'>
  <line x1='12' y1='5' x2='12' y2='19'/>
  <line x1='5' y1='12' x2='19' y2='12'/>
  <circle cx='12' cy='5' r='1' fill='currentColor' stroke='none' opacity='0.7'/>
  <circle cx='19' cy='12' r='1' fill='currentColor' stroke='none' opacity='0.7'/>
</svg>
`);

// Sparkle dot pro orbit na active nav
const SPARKLE_DOT = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' fill='none'>
  <circle cx='4' cy='4' r='2' fill='currentColor'/>
  <circle cx='4' cy='4' r='3.5' fill='none' stroke='currentColor' stroke-width='0.4' opacity='0.5'/>
</svg>
`);

// =================== THEME OBJECT ===================

export const magieTheme: Theme = {
  id: 'magie',
  name: 'Magie a kouzla',
  scope: 'both',
  atmosphere:
    'Magie a kouzla — kouzelnická síň + glassmorphic levitující tlačítka + ametyst+zlato glow + spell-book scrying disc + arcane sigils',
  vars: {
    /* ── Background atmosférický overlay (radial vignette) ── */
    '--theme-bg-overlay':
      'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(10, 4, 24, 0.55) 100%), linear-gradient(180deg, rgba(10, 4, 24, 0.18) 0%, rgba(10, 4, 24, 0.50) 100%)',

    /* ── Magie paleta ── */
    '--magie-night-violet':    '#0a0418',
    '--magie-velvet':          '#160a2e',
    '--magie-royal':           '#241048',
    '--magie-gold-antique':    '#d4a017',
    '--magie-gold-bright':     '#f5c853',
    '--magie-gold-deep':       '#7a5a08',
    '--magie-amethyst':        '#9d4edd',
    '--magie-amethyst-bright': '#c77dff',
    '--magie-amethyst-deep':   '#5a189a',
    '--magie-silver-moon':     '#d4d8ff',
    '--magie-aurora-teal':     '#2dd4bf',
    '--magie-rose-mist':       '#ff8fc7',
    '--magie-pearl':           '#f4f0ff',

    /* ── Surfaces (glassmorphic) ── */
    '--theme-surface':         'rgba(36, 16, 72, 0.55)',
    '--theme-surface-strong':  'rgba(22, 10, 46, 0.78)',
    '--theme-surface-soft':    'rgba(60, 24, 110, 0.35)',

    /* ── Borders ── */
    '--theme-border':          'rgba(212, 160, 23, 0.55)',
    '--theme-border-soft':     'rgba(212, 160, 23, 0.32)',
    '--theme-border-strong':   'rgba(212, 160, 23, 0.75)',
    '--theme-border-amethyst': 'rgba(157, 78, 221, 0.50)',

    /* ── Text (WCAG safe na glass surface) ── */
    '--theme-text':            '#f4f0ff',
    '--theme-text-muted':      '#a89db8',
    '--theme-heading':         '#f5c853',
    '--theme-text-on-gold':    '#1a0a30',
    '--theme-text-on-amethyst':'#fff5fa',

    /* ── Accents legacy aliasy ── */
    '--theme-accent':              '#d4a017',
    '--theme-accent-bright':       '#f5c853',
    '--theme-accent-amethyst':     '#9d4edd',
    '--theme-accent-amethyst-bright':'#c77dff',

    /* ── Glows ── */
    '--theme-glow-gold':           'rgba(212, 160, 23, 0.55)',
    '--theme-glow-gold-strong':    'rgba(245, 200, 83, 0.80)',
    '--theme-glow-amethyst':       'rgba(157, 78, 221, 0.55)',
    '--theme-glow-amethyst-strong':'rgba(199, 125, 255, 0.80)',
    '--theme-shadow':              'rgba(10, 4, 24, 0.85)',

    /* ── Section accents (4-color harmony) ── */
    '--theme-section-gold':    '#d4a017',
    '--theme-section-amethyst':'#9d4edd',
    '--theme-section-silver':  '#d4d8ff',
    '--theme-section-teal':    '#2dd4bf',
    '--theme-section-rose':    '#ff8fc7',

    /* ── Legacy tokeny (mapped na magie paletu) ── */
    '--bg-primary':       '#0a0418',
    '--bg-secondary':     '#160a2e',
    '--bg-card':          '#241048',
    '--bg-card-hover':    '#321560',
    '--accent':           '#d4a017',
    '--accent-bright':    '#f5c853',
    '--accent-dim':       '#7a5a08',
    '--accent-soft':      'rgba(212, 160, 23, 0.32)',
    '--text-primary':     '#f4f0ff',
    '--text-secondary':   '#d4d8ff',
    '--text-muted':       '#6a5d80',
    '--border':           'rgba(212, 160, 23, 0.32)',
    '--border-subtle':    'rgba(212, 160, 23, 0.18)',
    '--border-strong':    'rgba(212, 160, 23, 0.75)',
    '--success':              '#2dd4bf',
    '--success-soft':         'rgba(45, 212, 191, 0.14)',
    '--success-soft-border':  'rgba(45, 212, 191, 0.40)',
    '--warning':              '#f5c853',
    '--warning-soft':         'rgba(245, 200, 83, 0.14)',
    '--warning-soft-border':  'rgba(245, 200, 83, 0.40)',
    '--danger':               '#ff5577',
    '--danger-soft':          'rgba(255, 85, 119, 0.16)',
    '--danger-soft-border':   'rgba(255, 85, 119, 0.40)',
    '--danger-focus-ring':    'rgba(255, 85, 119, 0.30)',
    '--info':                 '#c77dff',
    '--text-on-accent':       '#1a0a30',
    '--text-on-danger':       '#fff5fa',
    '--bg-overlay':           'rgba(10, 4, 24, 0.80)',

    /* ── Typography ── */
    '--font-logo':           '"Cinzel Decorative", "Cinzel", Georgia, serif',
    '--font-display':        '"Quintessential", "Cinzel", Georgia, serif',
    '--font-tribal-accent':  '"Macondo", "Almendra", Georgia, serif',
    '--font-body':           '"Sorts Mill Goudy", "EB Garamond", Georgia, serif',
    '--font-script':         '"Mea Culpa", "Italianno", Georgia, cursive',

    /* ── Layout chrome ── */
    '--header-h':              '56px',
    '--header-bg':             'rgba(10, 4, 24, 0.92)',
    '--frame-pad-y':           '40px',
    '--frame-pad-x':           '18px',
    '--sidebar-w':             '280px',
    '--asset-logo-w':          '360px',
    '--asset-logo-w-mobile':   '220px',
    '--logo-img-display':      'block',
    '--logo-fallback-display': 'none',

    /* ── Asset URLs (raster) ── */
    '--asset-logo':              `url('${decor}/logo.webp')`,
    '--asset-andel-medallion':   `url('${decor}/medailon.webp')`,
    '--asset-ametyst-corner':    `url('${decor}/ametyst-corner.webp')`,
    '--asset-spell-disc':        `url('${decor}/spell-disc.webp')`,

    /* ── Corner sizing ── */
    '--asset-corner-size':       '76px',
    '--asset-corner-size-mobile':'40px',
    '--frame-corner-inset':      '6px',

    /* ── 8× arcane sigil watermarks per section ── */
    '--asset-sigil-nav':         SIGIL_NAV,
    '--asset-sigil-universe':    SIGIL_UNIVERSE,
    '--asset-sigil-chat':        SIGIL_CHAT,
    '--asset-sigil-admin':       SIGIL_ADMIN,
    '--asset-sigil-worlds':      SIGIL_WORLDS,
    '--asset-sigil-talk':        SIGIL_TALK,
    '--asset-sigil-book':        SIGIL_BOOK,
    '--asset-sigil-eye':         SIGIL_EYE,

    /* ── 7× nav medailon ikony ── */
    '--asset-icon-uvodnik':         ICON_UVODNIK,
    '--asset-icon-vytvorit-svet':   ICON_VYTVORIT_SVET,
    '--asset-icon-diskuze':         ICON_DISKUZE,
    '--asset-icon-clanky':          ICON_CLANKY,
    '--asset-icon-galerie':         ICON_GALERIE,
    '--asset-icon-napoveda':        ICON_NAPOVEDA,
    '--asset-icon-hospoda':         ICON_HOSPODA,

    /* ── 5× pravý panel section ikony ── */
    '--asset-icon-administrace':    ICON_ADMINISTRACE,
    '--asset-icon-moje-svety':      ICON_MOJE_SVETY,
    '--asset-icon-moje-diskuze':    ICON_MOJE_DISKUZE,
    '--asset-icon-oblibene-clanky': ICON_OBLIBENE_CLANKY,
    '--asset-icon-oblibene-obrazky':ICON_OBLIBENE_OBRAZKY,

    /* ── Signature + plus + sparkle ── */
    '--asset-signature-flourish':  SIGNATURE_FLOURISH,
    '--asset-plus-magic':          PLUS_MAGIC,
    '--asset-sparkle-dot':         SPARKLE_DOT,
  },
  fonts: {
    logo: 'Cinzel Decorative',
    display: 'Quintessential',
    body: 'Sorts Mill Goudy',
  },
  thumbnail: '/themes/thumbnails/magie.webp',
  background: '/themes/backgrounds/magie.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
