import type { Theme } from '@/themes/types';

const decor = '/themes/kyberpunk/decor';

/**
 * Kyberpunk (spec 1.0s).
 *
 * Noční ulice Neo-Akihabary 2099. Cinematic megalopole + obří fénix/anděl
 * hologram v cyan+magenta, létající auta, mrakodrapy s neon billboardy,
 * mokré dlažby s neon odlesky, déšť.
 *
 * Materiály: tmavé HUD plakety + cyan+magenta neon outline + electric purple
 * + acid green + acid yellow + hot pink (section accents) + dark midnight-
 * indigo panely + scanline texture.
 *
 * Originální motivy (žádný jiný skin nemá):
 * - Sparse typografický rain ve 2 edge strips (50px vlevo+vpravo, padající
 *   CJK + binární znaky v 6 cyklujících neonových barvách, 80s loop)
 * - Section-color stripe 4px vlevo od každého nav itemu (6 různých neonů)
 * - Broken neon flicker (60ms blackout 1× za ~15s) na active nav
 * - RGB-split chromatic aberration na hover (nav, topbar buttons)
 * - Magenta horizontal hairline divider uprostřed welcome card
 * - Wet pavement reflection (vertical blur+gradient) pod welcome card
 * - 8× CJK watermark znaky v rozích sekcí (光宇声制界話文画), per-section barva
 * - Administrator signature self-draw (Audiowide italic cyan, 1× per session)
 * - Cyan+magenta neon HUD bracket corner ornaments (inline SVG, 4× per panel)
 *
 * Fonty: Audiowide (logo fallback — kruhové neon-tube křivky, 80s arcade)
 *      + Bebas Neue (display uppercase — condensed graffiti-poster)
 *      + Share Tech Mono (body — CRT terminal feel).
 * Kombinace 3 fontů unikátní pro kyberpunk.
 *
 * Assety: pouze 3 raster (logo + medailon + background) dodané uživatelem.
 * Všechny ornamenty (HUD bracket, rain, CJK watermarks, nav ikony, section
 * ikony, signature, plus glyph) jsou inline SVG data-uri v `vars`. Žádné
 * AI gen WEBP, žádný `_asset-prompts.md` soubor.
 *
 * Scope: [data-theme="kyberpunk"], žádný globální dopad.
 */

// =================== INLINE SVG ASSETS (URL-encoded data-uri) ===================

// Helper: zabalí SVG markup do data-uri url() s URL-encoded payloadem.
// Atributy SVG MUSÍ být v single quotes (uvnitř outer double-quote url()).
const svg = (markup: string) =>
  `url("data:image/svg+xml;utf8,${markup.replace(/#/g, '%23').replace(/\s+/g, ' ').trim()}")`;

// Cyan+magenta neon HUD bracket — master TL roh, ostatní 3 přes CSS scaleX/Y mirror.
// 2 vrstvy: cyan vnější L + magenta vnitřní L offset + accent body (circuit detail).
const HUD_CORNER_BRACKET = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'>
  <polyline points='4,28 4,4 28,4' stroke='#00f0ff' stroke-width='2.5'/>
  <polyline points='8,32 8,8 32,8' stroke='#ff0080' stroke-width='1.5' opacity='0.85'/>
  <circle cx='4' cy='4' r='2.5' fill='#00f0ff'/>
  <circle cx='4' cy='4' r='4.5' fill='none' stroke='#00f0ff' stroke-width='0.8' opacity='0.5'/>
  <line x1='14' y1='4' x2='20' y2='4' stroke='#ff0080' stroke-width='3'/>
  <line x1='4' y1='14' x2='4' y2='20' stroke='#ff0080' stroke-width='3'/>
  <rect x='22' y='2.5' width='5' height='3' fill='#00f0ff' opacity='0.6'/>
  <rect x='2.5' y='22' width='3' height='5' fill='#00f0ff' opacity='0.6'/>
</svg>
`);

// Sparse rain strip — vertikální sloupec 50×600 s 13 padajícími CJK + binárními
// znaky v 6 cyklujících neonových barvách (cyan/magenta/green/yellow/purple/pink).
// background-repeat: repeat-y, animace background-position 0 → 0 600px za 80s.
const RAIN_STRIP = svg(`
<svg xmlns='http://www.w3.org/2000/svg' width='50' height='600' viewBox='0 0 50 600' font-family='monospace' font-size='16' font-weight='700'>
  <text x='25' y='30' fill='#00f0ff' opacity='0.85' text-anchor='middle'>電</text>
  <text x='25' y='75' fill='#ff0080' opacity='0.75' text-anchor='middle'>0</text>
  <text x='25' y='115' fill='#00ff80' opacity='0.80' text-anchor='middle'>脳</text>
  <text x='25' y='160' fill='#c8ff00' opacity='0.70' text-anchor='middle'>1</text>
  <text x='25' y='205' fill='#b400ff' opacity='0.82' text-anchor='middle'>夜</text>
  <text x='25' y='245' fill='#ff60d0' opacity='0.75' text-anchor='middle'>サ</text>
  <text x='25' y='290' fill='#00f0ff' opacity='0.78' text-anchor='middle'>0</text>
  <text x='25' y='335' fill='#ff0080' opacity='0.80' text-anchor='middle'>光</text>
  <text x='25' y='375' fill='#00ff80' opacity='0.65' text-anchor='middle'>1</text>
  <text x='25' y='420' fill='#c8ff00' opacity='0.78' text-anchor='middle'>イ</text>
  <text x='25' y='465' fill='#b400ff' opacity='0.72' text-anchor='middle'>影</text>
  <text x='25' y='510' fill='#00f0ff' opacity='0.80' text-anchor='middle'>夢</text>
  <text x='25' y='555' fill='#ff60d0' opacity='0.68' text-anchor='middle'>0</text>
</svg>
`);

// 8× CJK watermark glyph (fill=currentColor → CSS color: var(--section-color)).
// Velký znak vyplňující viewbox; opacity nastavuje CSS na 0.04 (subtle stamp).
const cjkGlyph = (char: string) => svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
  <text x='32' y='54' font-family='serif' font-size='62' font-weight='900' fill='currentColor' text-anchor='middle'>${char}</text>
</svg>
`);

const CJK_LIGHT    = cjkGlyph('光'); // NAVIGACE — světlo
const CJK_UNIVERSE = cjkGlyph('宇'); // VESMÍRY — vesmír
const CJK_VOICE    = cjkGlyph('声'); // CHAT — hlas
const CJK_ORDER    = cjkGlyph('制'); // ADMINISTRACE — řád
const CJK_WORLD    = cjkGlyph('界'); // MOJE SVĚTY — svět
const CJK_TALK     = cjkGlyph('話'); // MOJE DISKUZE — rozhovor
const CJK_TEXT_GLYPH = cjkGlyph('文'); // OBLÍBENÉ ČLÁNKY — text
const CJK_IMAGE    = cjkGlyph('画'); // OBLÍBENÉ OBRÁZKY — obraz

// =================== 6× NAV MEDAILON IKONY + 1× CHAT IKONA ===================
// Line-art glyph 32×32 viewbox, stroke=currentColor → section-color hot-swap přes CSS.

// Domeček — Úvodník
const ICON_UVODNIK = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M4 16 L16 5 L28 16 L28 27 L20 27 L20 19 L12 19 L12 27 L4 27 Z'/>
  <line x1='2' y1='18' x2='30' y2='18' opacity='0.4'/>
</svg>
`);

// Globus s meridiany — Vytvořit svět
const ICON_VYTVORIT_SVET = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <circle cx='16' cy='16' r='12'/>
  <ellipse cx='16' cy='16' rx='5' ry='12'/>
  <line x1='4' y1='16' x2='28' y2='16'/>
  <path d='M16 4 Q22 10 22 16 Q22 22 16 28' opacity='0.6'/>
  <path d='M16 4 Q10 10 10 16 Q10 22 16 28' opacity='0.6'/>
</svg>
`);

// Speech bubble + 3 tečky — Diskuze
const ICON_DISKUZE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M4 8 Q4 4 8 4 L24 4 Q28 4 28 8 L28 20 Q28 24 24 24 L14 24 L8 30 L8 24 Q4 24 4 20 Z'/>
  <circle cx='11' cy='14' r='1.5' fill='currentColor' stroke='none'/>
  <circle cx='16' cy='14' r='1.5' fill='currentColor' stroke='none'/>
  <circle cx='21' cy='14' r='1.5' fill='currentColor' stroke='none'/>
</svg>
`);

// Datapad / scroll — Články
const ICON_CLANKY = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <rect x='6' y='3' width='20' height='26' rx='1'/>
  <line x1='10' y1='9' x2='22' y2='9'/>
  <line x1='10' y1='14' x2='22' y2='14'/>
  <line x1='10' y1='19' x2='22' y2='19'/>
  <line x1='10' y1='24' x2='18' y2='24'/>
</svg>
`);

// Hologram krystal / diamond — Galerie
const ICON_GALERIE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M16 3 L26 12 L16 29 L6 12 Z'/>
  <line x1='6' y1='12' x2='26' y2='12'/>
  <line x1='16' y1='3' x2='16' y2='12' opacity='0.5'/>
  <line x1='11' y1='12' x2='16' y2='29' opacity='0.5'/>
  <line x1='21' y1='12' x2='16' y2='29' opacity='0.5'/>
</svg>
`);

// Query mark v kruhu — Nápověda
const ICON_NAPOVEDA = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <circle cx='16' cy='16' r='12'/>
  <path d='M12 12 Q12 8 16 8 Q20 8 20 12 Q20 14 18 15 Q16 16 16 18 L16 20'/>
  <circle cx='16' cy='24' r='1' fill='currentColor' stroke='none'/>
</svg>
`);

// Neon beer glass — Dimenzionální hospoda (chat)
const ICON_HOSPODA = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M8 6 L24 6 L22 28 L10 28 Z'/>
  <path d='M22 10 L26 10 L26 20 L24 22'/>
  <path d='M10 11 Q12 9 14 11 Q16 9 18 11 Q20 9 22 11' opacity='0.7'/>
  <line x1='11' y1='16' x2='13' y2='16' opacity='0.4'/>
  <line x1='19' y1='20' x2='21' y2='20' opacity='0.4'/>
</svg>
`);

// =================== 5× PRAVÝ PANEL SECTION IKONY ===================

// Gear / admin glyph — Administrace
const ICON_ADMINISTRACE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'>
  <circle cx='16' cy='16' r='4'/>
  <path d='M16 4 L18 8 L22 7 L22 11 L26 13 L24 16 L26 19 L22 21 L22 25 L18 24 L16 28 L14 24 L10 25 L10 21 L6 19 L8 16 L6 13 L10 11 L10 7 L14 8 Z'/>
</svg>
`);

// Multi-globe — Moje světy
const ICON_MOJE_SVETY = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <circle cx='11' cy='12' r='8'/>
  <ellipse cx='11' cy='12' rx='3.5' ry='8'/>
  <line x1='3' y1='12' x2='19' y2='12'/>
  <circle cx='22' cy='22' r='6' opacity='0.7'/>
  <ellipse cx='22' cy='22' rx='2.5' ry='6' opacity='0.7'/>
  <line x1='16' y1='22' x2='28' y2='22' opacity='0.7'/>
</svg>
`);

// Multi-bubble — Moje diskuze
const ICON_MOJE_DISKUZE = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M3 6 Q3 3 6 3 L18 3 Q21 3 21 6 L21 13 Q21 16 18 16 L11 16 L7 20 L7 16 Q3 16 3 13 Z'/>
  <path d='M14 17 Q14 15 16 15 L26 15 Q29 15 29 18 L29 24 Q29 27 26 27 L21 27 L25 30 L25 27 Q14 27 14 24 Z' opacity='0.7'/>
</svg>
`);

// Pin + scroll — Oblíbené články
const ICON_OBLIBENE_CLANKY = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <rect x='7' y='4' width='18' height='22' rx='1'/>
  <line x1='11' y1='9' x2='21' y2='9'/>
  <line x1='11' y1='14' x2='21' y2='14'/>
  <line x1='11' y1='19' x2='17' y2='19'/>
  <path d='M22 2 L26 2 L26 9 L24 7 L22 9 Z' fill='currentColor' stroke='none'/>
</svg>
`);

// Pin + hologram krystal — Oblíbené obrázky
const ICON_OBLIBENE_OBRAZKY = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round' stroke-linecap='round'>
  <path d='M14 6 L22 12 L14 28 L6 12 Z'/>
  <line x1='6' y1='12' x2='22' y2='12'/>
  <path d='M22 2 L26 2 L26 9 L24 7 L22 9 Z' fill='currentColor' stroke='none'/>
</svg>
`);

// =================== SIGNATURE SELF-DRAW + PLUS GLYPH ===================

// Administrator signature — script kaligrafie "Příjemnou zábavu přeje administrátor."
// Cyan stroke + zjednodušená script-like path (na inline SVG úrovni; čtený text se
// generuje typograficky v decorations.css přes ::after content, tahle SVG path je
// dekorativní podtrží/flourish s self-draw stroke-dasharray animací).
const SIGNATURE_SCRIPT = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 24' fill='none' stroke='#00f0ff' stroke-width='1.5' stroke-linecap='round'>
  <path d='M4 16 Q40 4 80 16 Q120 28 160 16 Q200 4 240 16 Q260 22 276 14'/>
  <circle cx='4' cy='16' r='1.5' fill='#00f0ff'/>
  <circle cx='276' cy='14' r='1.5' fill='#00f0ff'/>
</svg>
`);

// Neon "+" glyph pro "přidat" tlačítka
const PLUS_NEON = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round'>
  <line x1='12' y1='5' x2='12' y2='19'/>
  <line x1='5' y1='12' x2='19' y2='12'/>
</svg>
`);

// =================== THEME OBJECT ===================

export const kyberpunkTheme: Theme = {
  id: 'kyberpunk',
  name: 'Kyberpunk',
  scope: 'both',
  atmosphere:
    'Kyberpunk — noční ulice Neo-Akihabary 2099, megalopole + fénix hologram + sparse digital rain + multibarevné neon ceduly + broken neon flicker',
  vars: {
    /* ── Background atmosférický overlay (radial vignette + linear darken; BG je cinematic) ── */
    '--theme-bg-overlay':
      'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(8, 5, 26, 0.50) 100%), linear-gradient(180deg, rgba(8, 5, 26, 0.20) 0%, rgba(8, 5, 26, 0.55) 100%)',

    /* ── Surfaces (midnight indigo panely) ── */
    '--theme-surface':        'rgba(13, 10, 37, 0.88)',
    '--theme-surface-strong': 'rgba(8, 5, 26, 0.94)',
    '--theme-surface-soft':   'rgba(17, 12, 46, 0.55)',

    /* ── Midnight indigo paleta (BG vrstvy) ── */
    '--theme-midnight-deep':    '#08051a',
    '--theme-midnight-night':   '#0d0a25',
    '--theme-midnight-indigo':  '#110c2e',
    '--theme-midnight-lift':    '#1a1140',

    /* ── Primary brand (logo-konzistentní — cyan+magenta neon) ── */
    '--theme-cyan':             '#00f0ff',
    '--theme-cyan-bright':      '#5cffff',
    '--theme-cyan-dim':         '#008090',
    '--theme-magenta':          '#ff0080',
    '--theme-magenta-bright':   '#ff5cb0',
    '--theme-magenta-dim':      '#800040',

    /* ── Section accents (8 sekcí + 6 nav items, dle spec 4.0) ── */
    '--theme-section-cyan':     '#00f0ff',
    '--theme-section-magenta':  '#ff0080',
    '--theme-section-green':    '#00ff80',
    '--theme-section-yellow':   '#c8ff00',
    '--theme-section-purple':   '#b400ff',
    '--theme-section-pink':     '#ff60d0',

    /* ── Pearl ivory (text na tmavém pozadí) ── */
    '--theme-pearl-ivory':      '#e4f7ff',

    /* ── Borders ── */
    '--theme-border':           'rgba(0, 240, 255, 0.55)',
    '--theme-border-soft':      'rgba(0, 240, 255, 0.28)',
    '--theme-border-strong':    'rgba(255, 0, 128, 0.72)',
    '--theme-border-magenta':   'rgba(255, 0, 128, 0.55)',

    /* ── Text (WCAG safe) ── */
    '--theme-text':              '#e4f7ff',
    '--theme-text-muted':        '#7a90b8',
    '--theme-heading':           '#00f0ff',
    '--theme-text-on-cyan':      '#04101a',
    '--theme-text-on-magenta':   '#fff5fa',

    /* ── Accents legacy aliasy ── */
    '--theme-accent':              '#00f0ff',
    '--theme-accent-bright':       '#5cffff',
    '--theme-accent-magenta':      '#ff0080',
    '--theme-accent-magenta-bright':'#ff5cb0',

    /* ── Glows (neon halos) ── */
    '--theme-glow-cyan':            'rgba(0, 240, 255, 0.55)',
    '--theme-glow-cyan-strong':     'rgba(0, 240, 255, 0.85)',
    '--theme-glow-magenta':         'rgba(255, 0, 128, 0.55)',
    '--theme-glow-magenta-strong':  'rgba(255, 0, 128, 0.85)',
    '--theme-shadow':               'rgba(8, 5, 26, 0.85)',

    /* ── Nav hover/active ── */
    '--theme-nav-hover-bg':      'rgba(0, 240, 255, 0.10)',
    '--theme-nav-active-bg':
      'linear-gradient(90deg, rgba(0, 240, 255, 0.22) 0%, rgba(255, 0, 128, 0.18) 100%)',

    /* ── Legacy tokeny (mapped na kyberpunk paletu) ── */
    '--bg-primary':       '#08051a',
    '--bg-secondary':     '#0d0a25',
    '--bg-card':          '#110c2e',
    '--bg-card-hover':    '#1a1140',
    '--accent':           '#00f0ff',
    '--accent-bright':    '#5cffff',
    '--accent-dim':       '#008090',
    '--accent-soft':      'rgba(0, 240, 255, 0.15)',
    '--text-primary':     '#e4f7ff',
    '--text-secondary':   '#7a90b8',
    '--text-muted':       '#3a4060',
    '--border':           'rgba(0, 240, 255, 0.28)',
    '--border-subtle':    'rgba(0, 240, 255, 0.14)',
    '--border-strong':    'rgba(255, 0, 128, 0.72)',
    '--success':              '#00ff80',
    '--success-soft':         'rgba(0, 255, 128, 0.12)',
    '--success-soft-border':  'rgba(0, 255, 128, 0.40)',
    '--warning':              '#c8ff00',
    '--warning-soft':         'rgba(200, 255, 0, 0.12)',
    '--warning-soft-border':  'rgba(200, 255, 0, 0.40)',
    '--danger':               '#ff2050',
    '--danger-soft':          'rgba(255, 32, 80, 0.16)',
    '--danger-soft-border':   'rgba(255, 32, 80, 0.40)',
    '--danger-focus-ring':    'rgba(255, 32, 80, 0.30)',
    '--info':                 '#00f0ff',
    '--text-on-accent':       '#04101a',
    '--text-on-danger':       '#fff5fa',
    '--bg-overlay':           'rgba(8, 5, 26, 0.80)',

    /* ── Typography ── */
    '--font-logo':           '"Audiowide", "Orbitron", sans-serif',
    '--font-display':        '"Bebas Neue", "Russo One", sans-serif',
    '--font-tribal-accent':  '"Bebas Neue", "Russo One", sans-serif',
    '--font-body':           '"Share Tech Mono", "JetBrains Mono", monospace',
    '--font-script':         '"Audiowide", "Orbitron", sans-serif',

    /* ── Layout chrome ── */
    '--header-h':              '56px',
    '--header-bg':             '#0a0510',
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

    /* ── Inline SVG ornament — cyan+magenta HUD bracket (master TL, scaleX/Y mirror) ── */
    '--asset-corner':            HUD_CORNER_BRACKET,
    '--asset-corner-size':       '72px',
    '--asset-corner-size-mobile':'38px',
    '--frame-corner-inset':      '4px',

    /* ── Sparse rain strip (inline SVG, tile 50×600, repeat-y, animace) ── */
    '--asset-rain-strip':        RAIN_STRIP,

    /* ── 8× CJK watermark znaky (fill currentColor → CSS color: var(--section-color)) ── */
    '--asset-cjk-light':         CJK_LIGHT,
    '--asset-cjk-universe':      CJK_UNIVERSE,
    '--asset-cjk-voice':         CJK_VOICE,
    '--asset-cjk-order':         CJK_ORDER,
    '--asset-cjk-world':         CJK_WORLD,
    '--asset-cjk-talk':          CJK_TALK,
    '--asset-cjk-text':          CJK_TEXT_GLYPH,
    '--asset-cjk-image':         CJK_IMAGE,

    /* ── 6× nav medailon ikony (stroke currentColor → section-color hot-swap) ── */
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
    '--asset-icon-oblibene-diskuze':    ICON_MOJE_DISKUZE,
    '--asset-icon-oblibene-clanky': ICON_OBLIBENE_CLANKY,
    '--asset-icon-oblibene-obrazky':ICON_OBLIBENE_OBRAZKY,

    /* ── Signature self-draw + plus glyph ── */
    '--asset-signature-script':  SIGNATURE_SCRIPT,
    '--asset-plus-neon':         PLUS_NEON,

    /* ── 1.4 — Role chip overrides (D-046)
       Kyberpunk: neonové varianty stejných sémantických hue jako default.
       Pevný tmavý text na neon BG (kontrast > 4.5:1, ověřeno na #04101a fg). */
    '--role-superadmin-bg':       '#fff200',          /* electric yellow (Superadmin = nejvyšší power) */
    '--role-superadmin-fg':       '#04101a',
    '--role-superadmin-ring':     'rgba(255, 242, 0, 0.55)',

    '--role-admin-bg':            '#00f0ff',          /* cyan (kyberpunk brand accent) */
    '--role-admin-fg':            '#04101a',
    '--role-admin-ring':          'rgba(0, 240, 255, 0.55)',

    '--role-spravce-clanku-bg':   '#ffa20a',          /* hot amber neon */
    '--role-spravce-clanku-fg':   '#04101a',
    '--role-spravce-clanku-ring': 'rgba(255, 162, 10, 0.55)',

    '--role-spravce-galerie-bg':  '#ff0080',          /* hot magenta neon */
    '--role-spravce-galerie-fg':  '#fff5fa',
    '--role-spravce-galerie-ring':'rgba(255, 0, 128, 0.55)',

    '--role-spravce-diskuzi-bg':  '#39ff14',          /* acid green neon */
    '--role-spravce-diskuzi-fg':  '#04101a',
    '--role-spravce-diskuzi-ring':'rgba(57, 255, 20, 0.55)',
  },
  fonts: {
    logo: 'Audiowide',
    display: 'Bebas Neue',
    body: 'Share Tech Mono',
  },
  thumbnail: '/themes/thumbnails/kyberpunk.webp',
  background: '/themes/backgrounds/kyberpunk.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
