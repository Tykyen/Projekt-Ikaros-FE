import type { Theme } from '@/themes/types';

const decor = '/themes/nemrtvi/decor';

export const nemrtviTheme: Theme = {
  id: 'nemrtvi',
  name: 'Nemrtví',
  scope: 'both',
  atmosphere:
    'Sedlec Kostnice o půlnoci — opuštěná nekromantická kapitula, blackened iron, kosti, ghost-green záře, end-of-world dread',
  vars: {
    /* ── Background overlay (audit N1 — pure linear darken,
       BG nemrtvi.webp je už dark, jen jemné dodání kontrastu) ── */
    '--theme-bg-overlay':
      'linear-gradient(180deg, rgba(8, 10, 8, 0.45) 0%, rgba(8, 10, 8, 0.65) 100%)',

    /* ── Surfaces (kamenné desky s glassmorphism) ── */
    '--theme-surface':        'rgba(20, 22, 18, 0.86)',
    '--theme-surface-strong': 'rgba(12, 14, 12, 0.92)',
    '--theme-surface-soft':   'rgba(28, 30, 24, 0.55)',

    /* ── Stone (cracked black stone) ── */
    '--theme-stone-deep':       '#0c0d0a',
    '--theme-stone-mid':        '#13140f',
    '--theme-stone-tablet':     '#15140e',
    '--theme-stone-tablet-hi':  '#1c1b14',

    /* ── Iron (blackened, slight green oxidation) ── */
    '--theme-iron-cold':    '#2a2520',
    '--theme-iron-warm':    '#3a3128',
    '--theme-iron-deep':    '#1a1b16',

    /* ── Bone (weathered ivory — yellowed, not white) ── */
    '--theme-bone-ivory':         '#cdc098',
    '--theme-bone-ivory-bright':  '#e8d8a8',
    '--theme-bone-ash':           '#807968',

    /* ── Ghost (phosphorescent teal-green) ── */
    '--theme-ghost-teal':    '#5fc8a8',  /* klid */
    '--theme-ghost-radium':  '#7cffae',  /* hover/active emise */
    '--theme-ghost-dim':     '#2a6856',  /* lichen-verdigris */
    '--theme-ghost-soft':    'rgba(95, 200, 168, 0.22)',
    '--theme-ghost-strong':  'rgba(95, 200, 168, 0.45)',
    '--theme-ghost-radium-soft':   'rgba(124, 255, 174, 0.30)',
    '--theme-ghost-radium-strong': 'rgba(124, 255, 174, 0.55)',

    /* ── Blood (oxidovaná stará krev — rare accent, vosková pečeť) ── */
    '--theme-blood-rust':    '#7a1814',

    /* ── Borders ── */
    '--theme-border':        'rgba(42, 37, 32, 0.85)',
    '--theme-border-soft':   'rgba(42, 37, 32, 0.50)',
    '--theme-border-strong': 'rgba(95, 200, 168, 0.72)',
    '--theme-border-iron':   'var(--theme-iron-cold)',
    '--theme-border-ghost':  'var(--theme-ghost-teal)',

    /* ── Text (weathered ivory na obsidián, AAA contrast) ── */
    '--theme-text':          '#cdc098',
    '--theme-text-muted':    '#807968',
    '--theme-text-dim':      '#3a3528',
    '--theme-heading':       'var(--theme-bone-ivory-bright)',
    '--theme-text-on-iron':  '#cdc098',
    '--theme-text-on-ghost': '#0a0c08',

    /* ── Accents (legacy aliasy → ghost-teal jako primární) ── */
    '--theme-accent':         'var(--theme-ghost-teal)',
    '--theme-accent-bright':  'var(--theme-ghost-radium)',
    '--theme-accent-dim':     'var(--theme-ghost-dim)',

    /* ── Glows ── */
    '--theme-glow-ghost':         'rgba(95, 200, 168, 0.45)',
    '--theme-glow-ghost-strong':  'rgba(95, 200, 168, 0.70)',
    '--theme-glow-radium':        'rgba(124, 255, 174, 0.45)',
    '--theme-glow-radium-strong': 'rgba(124, 255, 174, 0.70)',
    '--theme-shadow':             'rgba(0, 0, 0, 0.85)',

    /* ── Nav hover/active ── */
    '--theme-nav-hover-bg':   'rgba(95, 200, 168, 0.10)',
    '--theme-nav-active-bg':
      'linear-gradient(180deg, rgba(8, 10, 8, 0.95) 0%, rgba(4, 6, 4, 0.98) 100%)',

    /* ── Legacy tokeny (mapped na nemrtví paletu) ── */
    '--bg-primary':       '#0c0d0a',
    '--bg-secondary':     '#13140f',
    '--bg-card':          'var(--theme-surface)',
    '--bg-card-hover':    'var(--theme-stone-tablet-hi)',
    '--accent':           'var(--theme-ghost-teal)',
    '--accent-bright':    'var(--theme-ghost-radium)',
    '--accent-dim':       'var(--theme-ghost-dim)',
    '--accent-soft':      'var(--theme-ghost-soft)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       'var(--theme-text-dim)',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    'rgba(42, 37, 32, 0.30)',
    '--border-strong':    'var(--theme-border-strong)',
    '--success':              'var(--theme-ghost-radium)',
    '--success-soft':         'rgba(124, 255, 174, 0.14)',
    '--success-soft-border':  'rgba(124, 255, 174, 0.4)',
    '--warning':              'var(--theme-bone-ivory)',
    '--warning-soft':         'rgba(205, 192, 152, 0.14)',
    '--warning-soft-border':  'rgba(205, 192, 152, 0.4)',
    '--danger':               'var(--theme-blood-rust)',
    '--danger-soft':          'rgba(122, 24, 20, 0.18)',
    '--danger-soft-border':   'rgba(122, 24, 20, 0.4)',
    '--danger-focus-ring':    'rgba(122, 24, 20, 0.3)',
    '--info':                 'var(--theme-ghost-teal)',
    '--text-on-accent':       'var(--theme-text-on-ghost)',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(0, 0, 0, 0.7)',

    /* ── Typography (Q&A 2 + 4 lock-in) ──
       Logo: UnifrakturCook (blackletter, baked-in v logo asset)
       Display: New Rocker (Dark Souls / Bloodborne UI font)
       Body: IM Fell DW Pica (old letterpress with ink-bleed) */
    '--font-logo':    '"UnifrakturCook", "UnifrakturMaguntia", Georgia, serif',
    '--font-display': '"New Rocker", "MedievalSharp", Georgia, serif',
    '--font-body':    '"IM Fell DW Pica", "IM Fell English", Georgia, serif',
    '--font-script':  '"IM Fell DW Pica", "IM Fell English", Georgia, serif',

    /* ── Layout chrome ── */
    '--header-h':            '56px',
    '--header-bg':           '#0c0d0a',
    '--frame-pad-y':         '40px',
    '--frame-pad-x':         '18px',
    '--sidebar-w':           '280px',

    '--asset-logo-w':         '460px',
    '--asset-logo-w-mobile':  '260px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    /* ── Asset URLs ── */
    '--asset-logo':              `url('${decor}/logo.webp')`,
    '--asset-andel-medallion':   `url('${decor}/medailon.webp')`,
    '--asset-medailon':          `url('${decor}/medailon.webp')`,

    /* Corner ornament (master TL, mirror přes CSS) — všechny panely */
    '--asset-corner':            `url('${decor}/corner-tl.webp')`,
    '--asset-corner-size':       '96px', /* welcome card */
    '--asset-corner-size-novinky':'80px', /* novinky panel */
    '--asset-corner-size-side':  '64px', /* sidebar + right panel */
    '--asset-corner-size-mobile':'48px', /* všechny na mobile */
    '--frame-corner-inset':      '8px',

    /* Section divider (femur + lebka) */
    '--asset-divider-skull':     `url('${decor}/divider-skull.webp')`,

    /* Skull-arch crown nad welcome card (signature element) */
    '--asset-skull-arch':        `url('${decor}/skull-arch.webp')`,

    /* 7 unikátních ossuary nav medailonů */
    '--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
    '--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
    '--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
    '--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
    '--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
    '--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,
  },
  fonts: {
    logo: 'UnifrakturCook',
    display: 'New Rocker',
    body: 'IM Fell DW Pica',
  },
  thumbnail: '/themes/thumbnails/nemrtvi.webp',
  background: '/themes/backgrounds/nemrtvi.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
