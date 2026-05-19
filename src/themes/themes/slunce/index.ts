import type { Theme } from '@/themes/types';

const decor = '/themes/slunce/decor';

/**
 * Slunce (spec 1.0w).
 *
 * Antický sluneční kult v pouštních ruinách — egyptian sun-deity carved
 * into temple stone, hostile heat, dramatic apocalyptic energy.
 * Dědí magie 1.0u glassmorphic btn3d pattern, ale agresivnější:
 * rychlejší motion, flame flicker, heat shimmer. Black+gold+ember.
 *
 * ORIGINÁLNÍ MOTIVY (žádný jiný skin):
 * - Polished glassmorphic btn3d (gold+ember dual border)
 * - Sun corona ray corner (RASTER, 4× s mirror)
 * - Flame disc centerpiece (RASTER, 90s CW + flame flicker brightness)
 * - Cracked-earth hairline pod section title
 * - Solar flare flicker (subtle 6-8s — NE disruptive jako kyberpunk)
 * - Egyptian sun-glyph sigils per section (Ra, scarab, ankh, etc.)
 * - Ember rising particles na active nav (vertikální fade, NE orbit)
 * - Heat shimmer distortion welcome card 8s
 * - Wallpoet engraved signature (NE elegant cursive — slunce je deity ne admin)
 *
 * Fonty: Diplomata SC (logo) + Forum (display) + Wallpoet (accent+signature)
 *        + Eczar (body). Kombinace 4 unikátních fontů.
 *
 * Assety: 4 raster (logo + medailon + sun-corner + flame-disc) + BG existuje.
 * Zbytek ornamentů (14 inline SVG Egyptian glyphs) data-uri v vars.
 *
 * Scope: [data-theme="slunce"], žádný globální dopad.
 */

const svg = (markup: string) =>
  `url("data:image/svg+xml;utf8,${markup.replace(/#/g, '%23').replace(/\s+/g, ' ').trim()}")`;

const sigil = (inner: string) => svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none' stroke='currentColor' stroke-width='1.2' stroke-linejoin='round' stroke-linecap='round'>
  <circle cx='32' cy='32' r='28' opacity='0.55'/>
  <circle cx='32' cy='32' r='22' opacity='0.35'/>
  ${inner}
</svg>
`);

// 8× Egyptian sun-glyph sigils
const SIGIL_NAV = sigil(`
  <ellipse cx='32' cy='32' rx='13' ry='7'/>
  <ellipse cx='32' cy='32' rx='4' ry='3' fill='currentColor' stroke='none'/>
  <path d='M19 32 Q19 24 32 24 Q45 24 45 32 Q45 40 32 40 Q19 40 19 32 Z' opacity='0.6'/>
`); // Eye of Ra

const SIGIL_UNIVERSE = sigil(`
  <ellipse cx='32' cy='32' rx='12' ry='8'/>
  <path d='M20 32 L14 24' opacity='0.7'/>
  <path d='M44 32 L50 24' opacity='0.7'/>
  <path d='M20 32 L14 40' opacity='0.7'/>
  <path d='M44 32 L50 40' opacity='0.7'/>
  <circle cx='32' cy='32' r='3' fill='currentColor' stroke='none'/>
`); // Khepri scarab (simplified — oval + 4 legs)

const SIGIL_CHAT = sigil(`
  <path d='M16 36 Q32 28 48 36 L48 40 Q32 32 16 40 Z' fill='currentColor' opacity='0.6'/>
  <line x1='20' y1='32' x2='20' y2='22'/>
  <line x1='44' y1='32' x2='44' y2='22'/>
  <circle cx='32' cy='20' r='3' fill='currentColor' stroke='none'/>
`); // Solar boat (loď slunce)

const SIGIL_ADMIN = sigil(`
  <circle cx='32' cy='32' r='8' fill='currentColor' opacity='0.7'/>
  <line x1='32' y1='14' x2='32' y2='18'/>
  <line x1='32' y1='46' x2='32' y2='50'/>
  <line x1='14' y1='32' x2='18' y2='32'/>
  <line x1='46' y1='32' x2='50' y2='32'/>
  <line x1='19' y1='19' x2='22' y2='22'/>
  <line x1='42' y1='42' x2='45' y2='45'/>
  <line x1='42' y1='22' x2='45' y2='19'/>
  <line x1='19' y1='45' x2='22' y2='42'/>
`); // Aten disk (slunce s paprsky)

const SIGIL_WORLDS = sigil(`
  <ellipse cx='32' cy='22' rx='6' ry='5'/>
  <line x1='32' y1='27' x2='32' y2='50'/>
  <line x1='22' y1='34' x2='42' y2='34'/>
`); // Ankh (kříž života)

const SIGIL_TALK = sigil(`
  <line x1='32' y1='14' x2='32' y2='50'/>
  <path d='M24 18 L32 22 L40 18' fill='none'/>
  <path d='M28 30 L32 28 L36 30' opacity='0.6'/>
  <path d='M28 42 L32 40 L36 42' opacity='0.6'/>
`); // Was scepter (žezlo)

const SIGIL_BOOK = sigil(`
  <rect x='28' y='14' width='8' height='36'/>
  <rect x='22' y='20' width='20' height='4' opacity='0.7'/>
  <rect x='22' y='28' width='20' height='4' opacity='0.7'/>
  <rect x='22' y='36' width='20' height='4' opacity='0.7'/>
`); // Djed pillar (sloup stability)

const SIGIL_IMAGE = sigil(`
  <ellipse cx='32' cy='44' rx='10' ry='3'/>
  <path d='M22 44 Q22 28 32 22 Q42 28 42 44'/>
  <path d='M26 36 Q32 30 38 36' opacity='0.6'/>
  <path d='M28 28 Q32 24 36 28' opacity='0.5'/>
  <circle cx='32' cy='22' r='2.5' fill='currentColor' stroke='none'/>
`); // Lotus

// 7× nav medailon ikony
const ICON_UVODNIK = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M4 16 L16 5 L28 16 L28 27 L20 27 L20 19 L12 19 L12 27 L4 27 Z'/>
</svg>
`);
const ICON_VYTVORIT_SVET = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <circle cx='16' cy='16' r='12'/>
  <ellipse cx='16' cy='16' rx='5' ry='12'/>
  <line x1='4' y1='16' x2='28' y2='16'/>
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
  <line x1='10' y1='13' x2='22' y2='13'/>
  <line x1='10' y1='18' x2='22' y2='18'/>
  <line x1='10' y1='23' x2='18' y2='23'/>
</svg>
`);
const ICON_GALERIE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M16 3 L26 12 L16 29 L6 12 Z'/>
  <line x1='6' y1='12' x2='26' y2='12'/>
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
</svg>
`);

// 5× pravý panel ikony
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

// Signature flourish (Wallpoet-friendly — heat-distorted underline)
const SIGNATURE_FLOURISH = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 24' fill='none' stroke='#ffb800' stroke-width='1.6' stroke-linecap='round'>
  <path d='M4 14 Q40 6 80 14 Q120 22 160 14 Q200 6 240 14 Q260 18 276 12'/>
  <circle cx='4' cy='14' r='1.8' fill='#ffb800'/>
  <circle cx='276' cy='12' r='1.8' fill='#ff4d1c'/>
  <circle cx='140' cy='15' r='1.0' fill='#fff6c2'/>
</svg>
`);

const PLUS_SOLAR = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.4' stroke-linecap='round'>
  <line x1='12' y1='5' x2='12' y2='19'/>
  <line x1='5' y1='12' x2='19' y2='12'/>
  <circle cx='12' cy='12' r='2' fill='currentColor' stroke='none' opacity='0.6'/>
</svg>
`);

// Ember dot (rising particle for active nav)
const EMBER_DOT = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' fill='none'>
  <circle cx='4' cy='4' r='2.5' fill='currentColor'/>
  <circle cx='4' cy='4' r='3.5' fill='none' stroke='currentColor' stroke-width='0.4' opacity='0.5'/>
</svg>
`);

export const slunceTheme: Theme = {
  id: 'slunce',
  name: 'Slunce',
  scope: 'platform',
  atmosphere:
    'Slunce — antický sluneční kult v pouštních ruinách + glassmorphic levitující tlačítka + gold+ember glow + sun corona corner + flame disc s flicker',
  vars: {
    /* ── Atmosférický overlay ── */
    '--theme-bg-overlay':
      'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(12, 10, 8, 0.55) 100%), linear-gradient(180deg, rgba(12, 10, 8, 0.18) 0%, rgba(12, 10, 8, 0.50) 100%)',

    /* ── Slunce paleta ── */
    '--slunce-obsidian':       '#0c0a08',
    '--slunce-charcoal':       '#1a1410',
    '--slunce-burnt-umber':    '#2a1e14',
    '--slunce-gold':           '#ffb800',
    '--slunce-gold-bright':    '#ffd440',
    '--slunce-gold-deep':      '#8a5a08',
    '--slunce-ember':          '#ff4d1c',
    '--slunce-ember-bright':   '#ff7040',
    '--slunce-ember-deep':     '#a02a08',
    '--slunce-sun-white':      '#fff6c2',
    '--slunce-copper':         '#b8741a',
    '--slunce-ruby':           '#c81818',

    /* ── Surfaces ── */
    '--theme-surface':         'rgba(42, 30, 20, 0.65)',
    '--theme-surface-strong':  'rgba(26, 20, 16, 0.85)',
    '--theme-surface-soft':    'rgba(60, 40, 24, 0.45)',

    /* ── Borders ── */
    '--theme-border':          'rgba(255, 184, 0, 0.55)',
    '--theme-border-soft':     'rgba(255, 184, 0, 0.32)',
    '--theme-border-strong':   'rgba(255, 184, 0, 0.78)',
    '--theme-border-ember':    'rgba(255, 77, 28, 0.55)',

    /* ── Text ── */
    '--theme-text':            '#fff6c2',
    '--theme-text-muted':      '#a8825a',
    '--theme-heading':         '#ffd440',
    '--theme-text-on-gold':    '#0c0a08',
    '--theme-text-on-ember':   '#fff6c2',

    /* ── Accents ── */
    '--theme-accent':              '#ffb800',
    '--theme-accent-bright':       '#ffd440',
    '--theme-accent-ember':        '#ff4d1c',
    '--theme-accent-ember-bright': '#ff7040',

    /* ── Glows ── */
    '--theme-glow-gold':           'rgba(255, 184, 0, 0.55)',
    '--theme-glow-gold-strong':    'rgba(255, 212, 64, 0.80)',
    '--theme-glow-ember':          'rgba(255, 77, 28, 0.55)',
    '--theme-glow-ember-strong':   'rgba(255, 112, 64, 0.80)',
    '--theme-shadow':              'rgba(12, 10, 8, 0.85)',

    /* ── Section accents ── */
    '--theme-section-gold':    '#ffb800',
    '--theme-section-ember':   '#ff4d1c',
    '--theme-section-copper':  '#b8741a',
    '--theme-section-ruby':    '#c81818',

    /* ── Legacy tokeny ── */
    '--bg-primary':       '#0c0a08',
    '--bg-secondary':     '#1a1410',
    '--bg-card':          '#2a1e14',
    '--bg-card-hover':    '#3a2a18',
    '--accent':           '#ffb800',
    '--accent-bright':    '#ffd440',
    '--accent-dim':       '#8a5a08',
    '--accent-soft':      'rgba(255, 184, 0, 0.32)',
    '--text-primary':     '#fff6c2',
    '--text-secondary':   '#d4a060',
    '--text-muted':       '#7a5028',
    '--border':           'rgba(255, 184, 0, 0.32)',
    '--border-subtle':    'rgba(255, 184, 0, 0.18)',
    '--border-strong':    'rgba(255, 184, 0, 0.78)',
    '--success':              '#a8d020',
    '--success-soft':         'rgba(168, 208, 32, 0.14)',
    '--success-soft-border':  'rgba(168, 208, 32, 0.40)',
    '--warning':              '#ffb800',
    '--warning-soft':         'rgba(255, 184, 0, 0.14)',
    '--warning-soft-border':  'rgba(255, 184, 0, 0.40)',
    '--danger':               '#c81818',
    '--danger-soft':          'rgba(200, 24, 24, 0.16)',
    '--danger-soft-border':   'rgba(200, 24, 24, 0.40)',
    '--danger-focus-ring':    'rgba(200, 24, 24, 0.30)',
    '--info':                 '#ff4d1c',
    '--text-on-accent':       '#0c0a08',
    '--text-on-danger':       '#fff6c2',
    '--bg-overlay':           'rgba(12, 10, 8, 0.80)',

    /* ── Typography ── */
    '--font-logo':           '"Diplomata SC", "Cinzel", Georgia, serif',
    '--font-display':        '"Forum", "Cinzel", Georgia, serif',
    '--font-tribal-accent':  '"Wallpoet", "Special Elite", monospace',
    '--font-body':           '"Eczar", "Cardo", Georgia, serif',
    '--font-script':         '"Wallpoet", "Special Elite", monospace',

    /* ── Layout chrome ── */
    '--header-h':              '56px',
    '--header-bg':             'rgba(12, 10, 8, 0.92)',
    '--frame-pad-y':           '40px',
    '--frame-pad-x':           '18px',
    '--sidebar-w':             '280px',
    '--asset-logo-w':          '360px',
    '--asset-logo-w-mobile':   '220px',
    '--logo-img-display':      'block',
    '--logo-fallback-display': 'none',

    /* ── Raster assets ── */
    '--asset-logo':             `url('${decor}/logo.webp')`,
    '--asset-andel-medallion':  `url('${decor}/medailon.webp')`,
    '--asset-sun-corner':       `url('${decor}/sun-corner.webp')`,
    '--asset-flame-disc':       `url('${decor}/flame-disc.webp')`,

    /* ── Corner sizing ── */
    '--asset-corner-size':       '80px',
    '--asset-corner-size-mobile':'42px',
    '--frame-corner-inset':      '6px',

    /* ── Sigily + ikony ── */
    '--asset-sigil-nav':       SIGIL_NAV,
    '--asset-sigil-universe':  SIGIL_UNIVERSE,
    '--asset-sigil-chat':      SIGIL_CHAT,
    '--asset-sigil-admin':     SIGIL_ADMIN,
    '--asset-sigil-worlds':    SIGIL_WORLDS,
    '--asset-sigil-talk':      SIGIL_TALK,
    '--asset-sigil-book':      SIGIL_BOOK,
    '--asset-sigil-image':     SIGIL_IMAGE,

    '--asset-icon-uvodnik':         ICON_UVODNIK,
    '--asset-icon-vytvorit-svet':   ICON_VYTVORIT_SVET,
    '--asset-icon-diskuze':         ICON_DISKUZE,
    '--asset-icon-clanky':          ICON_CLANKY,
    '--asset-icon-galerie':         ICON_GALERIE,
    '--asset-icon-napoveda':        ICON_NAPOVEDA,
    '--asset-icon-hospoda':         ICON_HOSPODA,

    '--asset-icon-administrace':    ICON_ADMINISTRACE,
    '--asset-icon-moje-svety':      ICON_MOJE_SVETY,
    '--asset-icon-oblibene-diskuze':    ICON_MOJE_DISKUZE,
    '--asset-icon-oblibene-clanky': ICON_OBLIBENE_CLANKY,
    '--asset-icon-oblibene-obrazky':ICON_OBLIBENE_OBRAZKY,

    '--asset-signature-flourish':   SIGNATURE_FLOURISH,
    '--asset-plus-solar':           PLUS_SOLAR,
    '--asset-ember-dot':            EMBER_DOT,
  },
  fonts: {
    logo: 'Diplomata SC',
    display: 'Forum',
    body: 'Eczar',
  },
  thumbnail: '/themes/thumbnails/slunce.webp',
  background: '/themes/backgrounds/slunce.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
