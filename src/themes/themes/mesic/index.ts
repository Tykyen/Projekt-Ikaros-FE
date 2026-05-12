import type { Theme } from '@/themes/types';

const decor = '/themes/mesic/decor';

/**
 * Měsíc (spec 1.0v).
 *
 * Lunární pohádková zahrada — refined wedding-under-moonlight elegance.
 * Dědí magie 1.0u glassmorphic btn3d pattern, ale klidnější:
 * žádné rotace na max, žádný iridescent, žádné comety.
 * Silver+cobalt+pearl, NE ametyst.
 *
 * ORIGINÁLNÍ MOTIVY (žádný jiný skin):
 * - Polished glassmorphic btn3d (silver+cobalt dual border)
 * - 4 různé měsíční fáze v rozích (RASTER — TL waxing, TR full, BL waning, BR new)
 * - Lunar disc centerpiece (RASTER, 180s CCW — 2× pomalejší než magie)
 * - Constellation-dot hairline (connected dots, NE iridescent)
 * - Single twinkle star pulse (NE orbit)
 * - Lantern glow vlevo welcome card (cream warm soft pulse 8s)
 * - Moon-phase + zodiac sigils per section (8× inline SVG)
 * - Sail signature self-draw (medium Latin cursive)
 *
 * Fonty: Eagle Lake (display) + Imperial Script (accent) +
 *        Cormorant Infant (body) + Sail (signature) +
 *        Great Vibes (logo fallback, baked do raster).
 * Kombinace 4 unikátních fontů — žádný jiný skin.
 *
 * Assety: 7 raster (logo + medailon + 4 moon phases + lunar disc + BG).
 * Zbytek ornamentů (14 inline SVG) data-uri v vars.
 *
 * Scope: [data-theme="mesic"], žádný globální dopad.
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

// 8× celestial astronomy + zodiac sigils
const SIGIL_NAV = sigil(`
  <path d='M22 32 A10 10 0 0 1 32 22 A8 8 0 0 0 32 42 A10 10 0 0 1 22 32 Z' fill='currentColor' opacity='0.5'/>
  <line x1='32' y1='12' x2='32' y2='17'/>
  <polygon points='32,10 34,14 30,14' fill='currentColor' stroke='none'/>
`);

const SIGIL_UNIVERSE = sigil(`
  <ellipse cx='32' cy='32' rx='18' ry='6' transform='rotate(-20 32 32)' opacity='0.7'/>
  <circle cx='32' cy='32' r='2.5' fill='currentColor' stroke='none'/>
  <circle cx='44' cy='24' r='1.6' fill='currentColor' stroke='none'/>
  <circle cx='20' cy='38' r='1.4' fill='currentColor' stroke='none'/>
`);

const SIGIL_CHAT = sigil(`
  <path d='M18 28 A6 6 0 0 1 24 22 A4 4 0 0 0 24 36 A6 6 0 0 1 18 28 Z' fill='currentColor' opacity='0.6'/>
  <path d='M46 36 A6 6 0 0 1 40 42 A4 4 0 0 0 40 28 A6 6 0 0 1 46 36 Z' fill='currentColor' opacity='0.6'/>
  <line x1='26' y1='30' x2='38' y2='34' opacity='0.7'/>
`);

const SIGIL_ADMIN = sigil(`
  <circle cx='32' cy='32' r='10' fill='currentColor' opacity='0.4'/>
  <circle cx='28' cy='28' r='1.5' fill='currentColor' stroke='none' opacity='0.7'/>
  <circle cx='35' cy='30' r='1' fill='currentColor' stroke='none' opacity='0.7'/>
  <circle cx='30' cy='35' r='1.2' fill='currentColor' stroke='none' opacity='0.7'/>
  <circle cx='36' cy='36' r='0.8' fill='currentColor' stroke='none' opacity='0.6'/>
`);

const SIGIL_WORLDS = sigil(`
  <circle cx='32' cy='32' r='14'/>
  <ellipse cx='32' cy='32' rx='5' ry='14'/>
  <line x1='18' y1='32' x2='46' y2='32'/>
  <path d='M32 18 Q40 24 40 32 Q40 40 32 46' opacity='0.7'/>
`);

const SIGIL_TALK = sigil(`
  <path d='M20 26 A5 5 0 0 1 25 21 A4 4 0 0 0 25 31 A5 5 0 0 1 20 26 Z' fill='currentColor' opacity='0.5'/>
  <path d='M44 38 A5 5 0 0 1 39 43 A4 4 0 0 0 39 33 A5 5 0 0 1 44 38 Z' fill='currentColor' opacity='0.5'/>
  <line x1='26' y1='27' x2='38' y2='37' opacity='0.6'/>
  <line x1='26' y1='31' x2='38' y2='33' opacity='0.4'/>
`);

const SIGIL_BOOK = sigil(`
  <polygon points='32,16 35,24 43,24 37,29 39,38 32,33 25,38 27,29 21,24 29,24' fill='currentColor' opacity='0.4'/>
  <path d='M20 44 L44 44 L44 48 L20 48 Z'/>
  <line x1='24' y1='46' x2='40' y2='46' opacity='0.6'/>
`);

const SIGIL_IMAGE = sigil(`
  <circle cx='32' cy='20' r='3' fill='currentColor' stroke='none'/>
  <path d='M40 32 A8 8 0 0 1 48 40' opacity='0.7'/>
  <circle cx='48' cy='32' r='3' fill='currentColor' opacity='0.5'/>
  <path d='M40 44 A8 8 0 0 1 32 52' opacity='0.7'/>
  <circle cx='32' cy='44' r='3' fill='currentColor' stroke='none'/>
  <path d='M24 32 A8 8 0 0 1 16 40' opacity='0.7'/>
  <circle cx='16' cy='32' r='3' fill='currentColor' opacity='0.5'/>
  <path d='M24 20 A8 8 0 0 1 32 12' opacity='0.7'/>
`);

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

// Signature flourish (Sail-style medium Latin cursive underline)
const SIGNATURE_FLOURISH = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 24' fill='none' stroke='#d4d8ff' stroke-width='1.4' stroke-linecap='round'>
  <path d='M4 14 Q40 6 80 14 Q120 22 160 14 Q200 6 240 14 Q260 18 276 12'/>
  <circle cx='4' cy='14' r='1.5' fill='#d4d8ff'/>
  <circle cx='276' cy='12' r='1.5' fill='#3d6cfa'/>
  <circle cx='140' cy='15' r='0.9' fill='#f4f8ff'/>
</svg>
`);

const PLUS_LUNAR = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round'>
  <line x1='12' y1='5' x2='12' y2='19'/>
  <line x1='5' y1='12' x2='19' y2='12'/>
  <circle cx='12' cy='5' r='1' fill='currentColor' stroke='none' opacity='0.7'/>
</svg>
`);

// 4-pointed twinkle star (single sparkle for active nav, NE orbit jako magie)
const TWINKLE_STAR = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'>
  <path d='M8 0 L9 7 L16 8 L9 9 L8 16 L7 9 L0 8 L7 7 Z' fill='currentColor'/>
  <circle cx='8' cy='8' r='2' fill='currentColor' opacity='0.6'/>
</svg>
`);

export const mesicTheme: Theme = {
  id: 'mesic',
  name: 'Měsíc',
  scope: 'both',
  atmosphere:
    'Měsíc — lunární pohádková zahrada + glassmorphic levitující tlačítka + silver+cobalt glow + 4 měsíční fáze v rozích + lunar disc centerpiece',
  vars: {
    /* ── Atmosférický overlay ── */
    '--theme-bg-overlay':
      'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(10, 20, 48, 0.55) 100%), linear-gradient(180deg, rgba(10, 20, 48, 0.18) 0%, rgba(10, 20, 48, 0.50) 100%)',

    /* ── Mesic paleta ── */
    '--mesic-night-cobalt':    '#0a1430',
    '--mesic-velvet-night':    '#13183a',
    '--mesic-royal-night':     '#1d2552',
    '--mesic-silver-moon':     '#d4d8ff',
    '--mesic-silver-bright':   '#f4f8ff',
    '--mesic-silver-deep':     '#7a82a8',
    '--mesic-pearl':           '#f4f8ff',
    '--mesic-cobalt':          '#3d6cfa',
    '--mesic-cobalt-bright':   '#6a90ff',
    '--mesic-cobalt-deep':     '#1a3a8a',
    '--mesic-cream':           '#f5efd6',

    /* ── Surfaces (glassmorphic) ── */
    '--theme-surface':         'rgba(29, 37, 82, 0.50)',
    '--theme-surface-strong':  'rgba(19, 24, 58, 0.78)',
    '--theme-surface-soft':    'rgba(50, 62, 130, 0.35)',

    /* ── Borders ── */
    '--theme-border':          'rgba(212, 216, 255, 0.55)',
    '--theme-border-soft':     'rgba(212, 216, 255, 0.32)',
    '--theme-border-strong':   'rgba(212, 216, 255, 0.75)',
    '--theme-border-cobalt':   'rgba(61, 108, 250, 0.55)',

    /* ── Text ── */
    '--theme-text':            '#f4f8ff',
    '--theme-text-muted':      '#8895c8',
    '--theme-heading':         '#f4f8ff',
    '--theme-text-on-silver':  '#0a1430',
    '--theme-text-on-cobalt':  '#f4f8ff',

    /* ── Accents aliasy ── */
    '--theme-accent':              '#d4d8ff',
    '--theme-accent-bright':       '#f4f8ff',
    '--theme-accent-cobalt':       '#3d6cfa',
    '--theme-accent-cobalt-bright':'#6a90ff',

    /* ── Glows ── */
    '--theme-glow-silver':         'rgba(212, 216, 255, 0.55)',
    '--theme-glow-silver-strong':  'rgba(244, 248, 255, 0.80)',
    '--theme-glow-cobalt':         'rgba(61, 108, 250, 0.55)',
    '--theme-glow-cobalt-strong':  'rgba(106, 144, 255, 0.80)',
    '--theme-shadow':              'rgba(10, 20, 48, 0.85)',

    /* ── Section accents ── */
    '--theme-section-silver':  '#d4d8ff',
    '--theme-section-cobalt':  '#3d6cfa',
    '--theme-section-pearl':   '#f4f8ff',
    '--theme-section-cream':   '#f5efd6',

    /* ── Legacy tokeny ── */
    '--bg-primary':       '#0a1430',
    '--bg-secondary':     '#13183a',
    '--bg-card':          '#1d2552',
    '--bg-card-hover':    '#2a3470',
    '--accent':           '#d4d8ff',
    '--accent-bright':    '#f4f8ff',
    '--accent-dim':       '#7a82a8',
    '--accent-soft':      'rgba(212, 216, 255, 0.32)',
    '--text-primary':     '#f4f8ff',
    '--text-secondary':   '#a8b0d8',
    '--text-muted':       '#6a72a0',
    '--border':           'rgba(212, 216, 255, 0.32)',
    '--border-subtle':    'rgba(212, 216, 255, 0.18)',
    '--border-strong':    'rgba(212, 216, 255, 0.75)',
    '--success':              '#5dffb0',
    '--success-soft':         'rgba(93, 255, 176, 0.14)',
    '--success-soft-border':  'rgba(93, 255, 176, 0.40)',
    '--warning':              '#f5efd6',
    '--warning-soft':         'rgba(245, 239, 214, 0.14)',
    '--warning-soft-border':  'rgba(245, 239, 214, 0.40)',
    '--danger':               '#ff5577',
    '--danger-soft':          'rgba(255, 85, 119, 0.16)',
    '--danger-soft-border':   'rgba(255, 85, 119, 0.40)',
    '--danger-focus-ring':    'rgba(255, 85, 119, 0.30)',
    '--info':                 '#3d6cfa',
    '--text-on-accent':       '#0a1430',
    '--text-on-danger':       '#f4f8ff',
    '--bg-overlay':           'rgba(10, 20, 48, 0.80)',

    /* ── Typography ── */
    '--font-logo':           '"Great Vibes", "Cinzel Decorative", Georgia, serif',
    '--font-display':        '"Eagle Lake", "Cinzel", Georgia, serif',
    '--font-tribal-accent':  '"Imperial Script", "Italianno", Georgia, cursive',
    '--font-body':           '"Cormorant Infant", "Cormorant Garamond", Georgia, serif',
    '--font-script':         '"Sail", "Imperial Script", Georgia, cursive',

    /* ── Layout chrome ── */
    '--header-h':              '56px',
    '--header-bg':             'rgba(10, 20, 48, 0.92)',
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
    '--asset-moon-phase-tl':    `url('${decor}/moon-phase-tl.webp')`,
    '--asset-moon-phase-tr':    `url('${decor}/moon-phase-tr.webp')`,
    '--asset-moon-phase-bl':    `url('${decor}/moon-phase-bl.webp')`,
    '--asset-moon-phase-br':    `url('${decor}/moon-phase-br.webp')`,
    '--asset-moon-disc':        `url('${decor}/moon-disc.webp')`,

    /* ── Corner sizing — kompaktní (nepřekrývá section labels) ── */
    '--asset-corner-size':       '70px',
    '--asset-corner-size-mobile':'40px',
    '--frame-corner-inset':      '-12px',

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
    '--asset-icon-moje-diskuze':    ICON_MOJE_DISKUZE,
    '--asset-icon-oblibene-clanky': ICON_OBLIBENE_CLANKY,
    '--asset-icon-oblibene-obrazky':ICON_OBLIBENE_OBRAZKY,

    '--asset-signature-flourish':   SIGNATURE_FLOURISH,
    '--asset-plus-lunar':           PLUS_LUNAR,
    '--asset-twinkle-star':         TWINKLE_STAR,
  },
  fonts: {
    logo: 'Great Vibes',
    display: 'Eagle Lake',
    body: 'Cormorant Infant',
  },
  thumbnail: '/themes/thumbnails/mesic.webp',
  background: '/themes/backgrounds/mesic.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
