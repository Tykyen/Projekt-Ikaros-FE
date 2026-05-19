import type { Theme } from '@/themes/types';

const decor = '/themes/temna-cerven/decor';

export const temnaCervenTheme: Theme = {
  id: 'temna-cerven',
  name: 'Temná červeň',
  scope: 'platform',
  atmosphere:
    'Salón nesmrtelného šlechtice — křižácké železo, baroque tarnishované stříbro, viktoriánský granát a jet-bead smutek, krev jako klenot',
  vars: {
    /* ── Background overlay (5-vrstvý gradient + damask wallpaper) ── */
    '--theme-bg-overlay':
      'radial-gradient(ellipse 600px 220px at 50% 0%, rgba(191, 31, 58, 0.16), transparent 70%), radial-gradient(ellipse 1200px 500px at 50% 100%, rgba(74, 6, 18, 0.55), transparent 70%), radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(0, 0, 0, 0.7) 100%)',

    /* ── Damask wallpaper SVG inline (signature pattern) ── */
    '--theme-damask-pattern':
      'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'120\' viewBox=\'0 0 80 120\'><g fill=\'none\' stroke=\'%237e0a1e\' stroke-width=\'0.6\' opacity=\'0.32\'><path d=\'M40 4c-8 8-8 22 0 30 8-8 8-22 0-30zM40 86c-8 8-8 22 0 30 8-8 8-22 0-30z\'/><path d=\'M40 18c-12 0-22 10-22 22s10 22 22 22 22-10 22-22-10-22-22-22zm0 6a16 16 0 1 1 0 32 16 16 0 0 1 0-32z\'/><path d=\'M22 40c-4-4-12-4-16 0M58 40c4-4 12-4 16 0\'/></g></svg>")',

    /* ── Film grain SVG noise (signature) ── */
    '--theme-grain-pattern':
      'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'2\' stitchTiles=\'stitch\'/><feColorMatrix values=\'0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0\'/></filter><rect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.6\'/></svg>")',

    /* ── Surfaces (čalouněné panely s glassmorphism) ── */
    '--theme-surface':         'rgba(28, 9, 15, 0.94)',
    '--theme-surface-strong':  'rgba(14, 5, 9, 0.96)',
    '--theme-surface-soft':    'rgba(35, 12, 18, 0.55)',

    /* ── Bordeaux-čerň (warm undertone — vs. nemrtvi cool-green) ── */
    '--theme-bordeaux-deep':   '#0a0307',
    '--theme-bordeaux-mid':    '#110509',
    '--theme-bordeaux-card':   '#16070c',
    '--theme-bordeaux-card-hi':'#1d0a11',

    /* ── Granát (jewel-cut blood gem, jediný chromatický akcent) ── */
    '--theme-garnet-deep':     '#4a0612',  /* hluboký stín v krvi */
    '--theme-garnet':          '#7e0a1e',  /* primární cabochon */
    '--theme-garnet-bright':   '#a8132e',  /* hover */
    '--theme-garnet-incand':   '#bf1f3a',  /* heartbeat pulse, halo */
    '--theme-rose-blush':      '#c2596f',  /* teplý highlight */

    /* ── Patinované baroque stříbro (NE zlato, NE železo) ── */
    '--theme-silver-tarnish':  '#a89890',  /* base — 200 let nečištěné */
    '--theme-silver-bright':   '#d4c8be',  /* highlight */
    '--theme-silver-shadow':   '#463a36',  /* tarnish v drážkách */

    /* ── Jet & velvet (viktoriánský smutek + sametové polstrování) ── */
    '--theme-jet':             '#08020a',  /* faceted lacquered black */
    '--theme-velvet-crimson':  '#3a0810',  /* sametová látka */

    /* ── Krev (čerstvá, kape pomalu) ── */
    '--theme-blood-fresh':     '#a8132e',
    '--theme-blood-deep':      '#5a0a14',
    '--theme-ink-blood':       '#9b1226',  /* signatura krví */

    /* ── Text (porcelánová pleť šlechtice nikdy nevystavená slunci) ── */
    '--theme-text-pale':       '#e8d6cc',
    '--theme-text-muted':      '#a08070',
    '--theme-text-dim':        '#5a3838',
    '--theme-heading':         '#e8d6cc',

    /* ── Borders ── */
    '--theme-border':          'rgba(168, 152, 144, 0.28)',
    '--theme-border-soft':     'rgba(42, 12, 18, 0.50)',
    '--theme-border-strong':   '#a89890',
    '--theme-border-silver':   'rgba(168, 152, 144, 0.28)',
    '--theme-border-garnet':   'rgba(126, 10, 30, 0.55)',
    '--theme-border-iron':     '#2a0c12',

    /* ── Glows & shadows ── */
    '--theme-glow-garnet':         'rgba(168, 19, 46, 0.45)',
    '--theme-glow-garnet-strong':  'rgba(191, 31, 58, 0.70)',
    '--theme-glow-silver':         'rgba(212, 200, 190, 0.30)',
    '--theme-shadow':              'rgba(0, 0, 0, 0.85)',
    '--theme-inner-shadow':
      'inset 0 1px 0 rgba(212, 200, 190, 0.08), inset 0 -2px 6px rgba(0, 0, 0, 0.6)',

    /* ── Nav hover/active ── */
    '--theme-nav-hover-bg':    'rgba(126, 10, 30, 0.20)',
    '--theme-nav-active-bg':
      'linear-gradient(180deg, rgba(74, 6, 18, 0.7), rgba(30, 6, 12, 0.85))',

    /* ── Legacy tokeny (mapped na temna-cerven paletu) ── */
    '--bg-primary':       '#0a0307',
    '--bg-secondary':     '#110509',
    '--bg-card':          'var(--theme-surface)',
    '--bg-card-hover':    'var(--theme-bordeaux-card-hi)',
    '--accent':           'var(--theme-garnet)',
    '--accent-bright':    'var(--theme-garnet-bright)',
    '--accent-dim':       'var(--theme-garnet-deep)',
    '--accent-soft':      'rgba(126, 10, 30, 0.20)',
    '--text-primary':     'var(--theme-text-pale)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       'var(--theme-text-dim)',
    '--border':           'var(--theme-border-silver)',
    '--border-subtle':    'rgba(168, 152, 144, 0.16)',
    '--border-strong':    'var(--theme-silver-tarnish)',
    '--success':              '#3ecf8e',
    '--success-soft':         'rgba(62, 207, 142, 0.15)',
    '--success-soft-border':  'rgba(62, 207, 142, 0.30)',
    '--warning':              '#f5a623',
    '--warning-soft':         'rgba(245, 166, 35, 0.15)',
    '--warning-soft-border':  'rgba(245, 166, 35, 0.30)',
    '--danger':               'var(--theme-garnet-bright)',
    '--danger-soft':          'rgba(168, 19, 46, 0.18)',
    '--danger-soft-border':   'rgba(168, 19, 46, 0.40)',
    '--danger-focus-ring':    'rgba(168, 19, 46, 0.30)',
    '--info':                 'var(--theme-silver-tarnish)',
    '--text-on-accent':       '#ffffff',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(10, 3, 7, 0.7)',

    /* ── Typography (Q-3 A — akceptován overlap s hospoda + příroda) ──
       Display: Pirata One (drippy blackletter, sjednocuje s logem)
       Sub-display: Marcellus SC (vyryté roman small caps, name plates)
       Body: Cormorant Garamond italic-prone (didone elegance)
       Signature: Italianno (copperplate cursive, jako podpis krví) */
    '--font-logo':    '"Pirata One", "UnifrakturCook", Georgia, serif',
    '--font-display': '"Pirata One", "UnifrakturCook", Georgia, serif',
    '--font-sub':     '"Marcellus SC", Georgia, serif',
    '--font-body':    '"Cormorant Garamond", Georgia, serif',
    '--font-script':  '"Italianno", "Pinyon Script", cursive',

    /* ── Layout chrome ── */
    '--header-h':            '64px',
    '--header-bg':           '#110509',
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

    /* Corner ornament (master TL, mirror přes CSS) */
    '--asset-corner':            `url('${decor}/corner-tl.webp')`,
    '--asset-corner-size':       '96px',  /* welcome card */
    '--asset-corner-size-novinky':'80px', /* novinky panel */
    '--asset-corner-size-side':  '64px',  /* sidebar + right panel */
    '--asset-corner-size-mobile':'48px',  /* všechny na mobile */
    '--frame-corner-inset':      '8px',

    /* Signature ornaments */
    '--asset-bat-arch':          `url('${decor}/bat-arch.webp')`,
    '--asset-divider-rose':      `url('${decor}/divider-rose.webp')`,
    '--asset-wax-seal':          `url('${decor}/wax-seal.webp')`,
    '--asset-jet-bead-frame':    `url('${decor}/jet-bead-frame.webp')`,

    /* 7 unikátních vampire-collector nav ikon */
    '--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
    '--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
    '--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
    '--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
    '--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
    '--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,
  },
  fonts: {
    logo: 'Pirata One',
    display: 'Pirata One',
    body: 'Cormorant Garamond',
  },
  thumbnail: '/themes/thumbnails/temna-cerven.webp',
  background: '/themes/backgrounds/temna-cerven.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
