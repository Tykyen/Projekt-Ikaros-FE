import type { Theme } from '@/themes/types';

const decor = '/themes/pergamen/decor';

export const pergamenTheme: Theme = {
  id: 'pergamen',
  name: 'Pergamen',
  scope: 'both',
  atmosphere:
    'Klášterní skriptórium 13. století okem Tolkienova kronikáře — pergamen + dřevo + zlatá iluminace + burgundy pečetě',
  vars: {
    // ── Luxury tokens (spec 1.0i) — burgundy + gold + dark wood ──

    // Atmosférický overlay (audit H2 — pure darken, žádné radial color tints,
    // BG je už teplý/oranžový z pergamen.webp)
    '--theme-bg-overlay':
      'linear-gradient(180deg, rgba(20, 14, 4, 0.55) 0%, rgba(20, 14, 4, 0.72) 100%)',

    // Surfaces (tmavé dřevo)
    '--theme-surface':        'rgba(40, 26, 12, 0.84)',
    '--theme-surface-strong': 'rgba(28, 18, 8, 0.94)',
    '--theme-surface-soft':   'rgba(58, 38, 18, 0.55)',

    // Borders + accents (zlato + burgundy)
    '--theme-border':         'rgba(212, 169, 70, 0.62)',
    '--theme-border-soft':    'rgba(212, 169, 70, 0.30)',
    '--theme-border-gold':    'rgba(212, 169, 70, 0.62)',
    '--theme-border-burgundy':'rgba(138, 26, 16, 0.55)',

    // Text (audit C15 — muted #b8a070, ne #a09060, WCAG)
    '--theme-text':            '#e8d8a0',
    '--theme-text-muted':      '#b8a070',
    '--theme-heading':         '#d4a946',
    '--theme-text-on-gold':    '#3d2914',
    '--theme-text-on-burgundy':'#f0e0b8',

    // Accents
    '--theme-accent':                 '#8a1a10',
    '--theme-accent-bright':          '#a83020',
    '--theme-accent-gold':            '#d4a946',
    '--theme-accent-gold-bright':     '#f0c860',
    '--theme-accent-burgundy':        '#8a1a10',
    '--theme-accent-burgundy-bright': '#a83020',

    // Glows
    '--theme-glow-gold':        'rgba(212, 169, 70, 0.45)',
    '--theme-glow-gold-strong': 'rgba(212, 169, 70, 0.70)',
    '--theme-glow-burgundy':    'rgba(138, 26, 16, 0.40)',
    '--theme-shadow':           'rgba(20, 14, 4, 0.88)',

    // Nav hover/active
    '--theme-nav-hover-bg':   'rgba(138, 26, 16, 0.14)',
    '--theme-nav-active-bg':
      'linear-gradient(90deg, rgba(138, 26, 16, 0.45) 0%, rgba(40, 26, 12, 0.55) 100%)',

    // ── Legacy tokeny (mapped na luxury) ──
    '--bg-primary':       '#1a0e04',
    '--bg-secondary':     '#28190a',
    '--bg-card':          'var(--theme-surface)',
    '--bg-card-hover':    'var(--theme-surface-soft)',
    '--accent':           'var(--theme-accent-burgundy)',
    '--accent-bright':    'var(--theme-accent-burgundy-bright)',
    '--accent-dim':       '#601008',
    '--accent-soft':      'var(--theme-border-soft)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       '#806040',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    'rgba(212, 169, 70, 0.16)',
    '--border-strong':    'var(--theme-border)',
    '--success':              '#3a8a4e',
    '--success-soft':         'rgba(58, 138, 78, 0.14)',
    '--success-soft-border':  'rgba(58, 138, 78, 0.4)',
    '--warning':              '#d4a946',
    '--warning-soft':         'rgba(212, 169, 70, 0.14)',
    '--warning-soft-border':  'rgba(212, 169, 70, 0.4)',
    '--danger':               '#8a1a10',
    '--danger-soft':          'rgba(138, 26, 16, 0.14)',
    '--danger-soft-border':   'rgba(138, 26, 16, 0.4)',
    '--danger-focus-ring':    'rgba(138, 26, 16, 0.3)',
    '--info':                 'var(--theme-accent-gold)',
    '--text-on-accent':       'var(--theme-text-on-burgundy)',
    '--text-on-danger':       '#f0e0b8',
    '--bg-overlay':           'rgba(20, 14, 4, 0.7)',

    // ── Typography (klášterní iluminace — barokní psací + manuscript pro UI) ──
    // --font-baroque = Petit Formal Script (francouzský 18. století copperplate) — section titles, signature
    // --font-display = IM Fell English SC (čitelný manuscript hand) — NavItemy, UI buttons
    // --font-body    = EB Garamond (renaissance/barokní serif) — body text
    '--font-logo':    '"Petit Formal Script", "Pinyon Script", "IM Fell English", Georgia, serif',
    '--font-display': '"IM Fell English SC", "IM Fell English", "EB Garamond", Georgia, serif',
    '--font-baroque': '"Petit Formal Script", "Pinyon Script", "Italianno", "IM Fell English", Georgia, serif',
    '--font-gothic':  '"Petit Formal Script", "Pinyon Script", "IM Fell English", Georgia, serif',
    '--font-body':    '"EB Garamond", "Lora", Georgia, serif',
    '--font-script':  '"Petit Formal Script", "Italianno", "IM Fell English", "EB Garamond", Georgia, serif',

    // ── Layout chrome ──
    '--header-h':            '56px',
    '--header-bg':            '#28190a',
    '--frame-pad-y':         '40px',
    '--frame-pad-x':         '18px',
    '--sidebar-w':           '280px',

    '--asset-logo-w':         '240px',
    '--asset-logo-w-mobile':  '180px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    // ── Asset URLs ──
    '--asset-logo':              `url('${decor}/logo.webp')`,
    '--asset-andel-medallion':   `url('${decor}/medailon.webp')`,
    '--asset-bigbook':           `url('${decor}/big-book.webp')`,
    '--asset-bookmark':          `url('${decor}/bookmark.webp')`,
    '--asset-wax-seal':          `url('${decor}/wax-seal.webp')`,
    '--asset-divider-seal':      `url('${decor}/divider-seal.webp')`,

    // Corner ornament (master TL, mirror přes CSS)
    '--asset-corner':            `url('${decor}/corner-tl.webp')`,
    '--asset-corner-size':       '120px',
    '--asset-corner-size-mobile':'64px',
    '--frame-corner-inset':      '8px',

    // 7 unikátních pergamenových pečetí
    '--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
    '--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
    '--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
    '--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
    '--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
    '--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,
  },
  fonts: {
    logo: 'Petit Formal Script',
    display: 'Petit Formal Script',
    body: 'EB Garamond',
  },
  thumbnail: '/themes/thumbnails/pergamen.webp',
  background: '/themes/backgrounds/pergamen.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
