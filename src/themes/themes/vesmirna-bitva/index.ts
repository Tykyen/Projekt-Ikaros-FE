import type { Theme } from '@/themes/types';

const decor = '/themes/vesmirna-bitva/decor';

export const vesmirnaBitvaTheme: Theme = {
  id: 'vesmirna-bitva',
  name: 'Vesmírná bitva',
  scope: 'platform',
  atmosphere:
    'Můstek poškozeného bitevního křižníku v akutním boji — klaxon, červené nouzové LED, pancéřové ocelové desky s nýty a podpálenými hranami, jiskry z rohů. Brutální, nebezpečný, beznadějný.',
  vars: {
    /* ── Background overlay (4-vrstvý gradient — battle ambient) ── */
    '--theme-bg-overlay':
      'radial-gradient(ellipse 700px 280px at 78% 22%, rgba(255, 80, 64, 0.18), transparent 60%), radial-gradient(ellipse 800px 400px at 18% 85%, rgba(0, 0, 0, 0.7), transparent 70%), radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0, 0, 0, 0.65) 100%), linear-gradient(180deg, rgba(6, 3, 10, 0.40) 0%, rgba(6, 3, 10, 0.55) 100%)',

    /* ── Scanline overlay (subtle HUD layer) ── */
    '--theme-scanline-pattern':
      'repeating-linear-gradient(180deg, transparent 0, transparent 3px, rgba(255, 80, 64, 0.025) 3px, rgba(255, 80, 64, 0.025) 4px)',

    /* ── Film grain SVG noise (heavy combat atmosphere) ── */
    '--theme-grain-pattern':
      'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/><feColorMatrix values=\'0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0\'/></filter><rect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.6\'/></svg>")',

    /* ── Surfaces (battle-plate panely) ── */
    '--theme-surface':         'rgba(22, 14, 18, 0.95)',
    '--theme-surface-strong':  'rgba(8, 4, 6, 0.97)',
    '--theme-surface-soft':    'rgba(28, 18, 22, 0.55)',

    /* ── Bulkhead steel (warm undertone — vs vesmirna-lod cool) ── */
    '--theme-bulkhead-deep':   '#06030a',
    '--theme-bulkhead-mid':    '#0e0408',
    '--theme-bulkhead-card':   '#160a10',
    '--theme-bulkhead-card-hi':'#1c0e14',

    /* ── Hellfire (primární akcent, warm red) ── */
    '--theme-hellfire-deep':   '#5a0810',
    '--theme-hellfire':        '#b8101c',
    '--theme-hellfire-bright': '#d4111c',
    '--theme-hellfire-incand': '#e8202a',

    /* ── Plasma (sekundární highlight, žhnoucí) ── */
    '--theme-plasma':          '#ff5040',
    '--theme-plasma-bright':   '#ff7050',
    '--theme-ember-burn':      '#ff5028',

    /* ── Gunmetal (kovová neutrální) ── */
    '--theme-gunmetal':        '#3a3e44',
    '--theme-gunmetal-bright': '#a4acb4',
    '--theme-gunmetal-edge':   'rgba(124, 132, 140, 0.32)',
    '--theme-gunmetal-shadow': '#1a1c20',

    /* ── Text (popelavá ocel, kontrast) ── */
    '--theme-text-pale':       '#d8d2d0',
    '--theme-text-muted':      '#988a86',
    '--theme-text-dim':        '#5a4e4a',
    '--theme-heading':         '#d8d2d0',

    /* ── Borders ── */
    '--theme-border':          'rgba(124, 132, 140, 0.32)',
    '--theme-border-soft':     'rgba(30, 14, 18, 0.5)',
    '--theme-border-strong':   '#a4acb4',
    '--theme-border-hellfire': 'rgba(184, 16, 28, 0.55)',
    '--theme-border-iron':     '#2a0c12',

    /* ── Glows & shadows ── */
    '--theme-glow-hellfire':        'rgba(184, 16, 28, 0.45)',
    '--theme-glow-hellfire-strong': 'rgba(212, 17, 28, 0.70)',
    '--theme-glow-plasma':          'rgba(255, 80, 64, 0.55)',
    '--theme-shadow':               'rgba(0, 0, 0, 0.85)',
    '--theme-inner-shadow':
      'inset 0 1px 0 rgba(180, 190, 200, 0.06), inset 0 -2px 6px rgba(0, 0, 0, 0.7)',

    /* ── Nav hover/active ── */
    '--theme-nav-hover-bg':    'rgba(184, 16, 28, 0.18)',
    '--theme-nav-active-bg':
      'linear-gradient(180deg, rgba(70, 10, 16, 0.7), rgba(28, 8, 12, 0.85))',

    /* ── Legacy tokeny (mapped na vesmirna-bitva paletu) ── */
    '--bg-primary':       '#06030a',
    '--bg-secondary':     '#0e0408',
    '--bg-card':          'rgba(22, 14, 18, 0.95)',
    '--bg-card-hover':    '#1c0e14',
    '--accent':           '#b8101c',
    '--accent-bright':    '#d4111c',
    '--accent-dim':       '#5a0810',
    '--accent-soft':      'rgba(184, 16, 28, 0.18)',
    '--text-primary':     '#d8d2d0',
    '--text-secondary':   '#988a86',
    '--text-muted':       '#5a4e4a',
    '--border':           'rgba(124, 132, 140, 0.32)',
    '--border-subtle':    'rgba(124, 132, 140, 0.18)',
    '--border-strong':    '#a4acb4',
    '--success':              '#3ecf8e',
    '--success-soft':         'rgba(62, 207, 142, 0.15)',
    '--success-soft-border':  'rgba(62, 207, 142, 0.30)',
    '--warning':              '#f5a623',
    '--warning-soft':         'rgba(245, 166, 35, 0.15)',
    '--warning-soft-border':  'rgba(245, 166, 35, 0.30)',
    '--danger':               '#d4111c',
    '--danger-soft':          'rgba(212, 17, 28, 0.18)',
    '--danger-soft-border':   'rgba(212, 17, 28, 0.40)',
    '--danger-focus-ring':    'rgba(212, 17, 28, 0.30)',
    '--info':                 '#a4acb4',
    '--text-on-accent':       '#ffffff',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(6, 3, 10, 0.75)',

    /* ── Typography (Q-2 A) ── */
    '--font-logo':        'inherit',
    '--font-display':     '"Saira Stencil One", "Black Ops One", sans-serif',
    '--font-sub':         '"Chakra Petch", "Saira", sans-serif',
    '--font-body':        '"Inter Tight", "Inter", system-ui, sans-serif',
    '--font-script':      '"Special Elite", "Courier Prime", monospace',

    /* ── Layout chrome ── */
    '--header-h':            '64px',
    '--header-bg':           '#0e0408',
    '--frame-pad-y':         '40px',
    '--frame-pad-x':         '18px',
    '--sidebar-w':           '280px',

    '--asset-logo-w':         '560px',
    '--asset-logo-w-mobile':  '320px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    /* ── Asset URLs ── */
    '--asset-logo':                 `url('${decor}/logo.webp')`,
    '--asset-medailon':             `url('${decor}/medailon.webp')`,        /* rectangular self-framed tactical display */
    '--asset-medailon-frame':       `url('${decor}/medailon-frame.webp')`,  /* REPURPOSED → ALERT panel hazard wrapper (R1) */
    '--asset-andel-medallion':      `url('${decor}/medailon.webp')`,        /* alias pro layout */

    /* Corner ornament (master TL, mirror přes CSS) */
    '--asset-corner':            `url('${decor}/corner-tl.webp')`,
    '--asset-corner-size':       '44px',   /* welcome card */
    '--asset-corner-size-novinky':'32px',  /* novinky panel */
    '--asset-corner-size-side':  '40px',   /* sidebar + right panel */
    '--asset-corner-size-mobile':'28px',   /* všechny na mobile */
    '--frame-corner-inset':      '6px',

    /* Signature ornaments */
    '--asset-destroyer-schematic':  `url('${decor}/destroyer-schematic.webp')`,
    '--asset-targeting-reticle':    `url('${decor}/targeting-reticle.webp')`,

    /* 7 unikátních console-panel button nav ikon */
    '--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
    '--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
    '--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
    '--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
    '--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
    '--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,
  },
  fonts: {
    logo: 'Saira Stencil One',
    display: 'Saira Stencil One',
    body: 'Inter Tight',
  },
  thumbnail: '/themes/thumbnails/vesmirna-bitva.webp',
  background: '/themes/backgrounds/vesmirna-bitva.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
