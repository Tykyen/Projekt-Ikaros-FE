import type { Theme } from '@/themes/types';

const decor = '/themes/hospoda/decor';

export const hospodaTheme: Theme = {
  id: 'hospoda',
  name: 'Hospoda',
  scope: 'both',
  atmosphere:
    'Středověká krčma „U Letícího Orla" — warm hearth, dubové trámy, kovaná mosaz, vínová heraldika, krčmářský papír',
  vars: {
    /* ── Background overlay (audit H1 — pure darken, žádné radial color tints,
       BG hospoda.webp je už teplý/oranžový z krčmy) ── */
    '--theme-bg-overlay':
      'linear-gradient(180deg, rgba(20, 12, 4, 0.55) 0%, rgba(20, 12, 4, 0.72) 100%)',

    /* ── Surfaces (tmavé dřevo) ── */
    '--theme-surface':        'rgba(44, 26, 10, 0.92)',
    '--theme-surface-strong': 'rgba(28, 18, 8, 0.96)',
    '--theme-surface-soft':   'rgba(74, 46, 21, 0.55)',

    /* ── Hearth (warm fire palette) ── */
    '--theme-hearth-deep':       '#1a0f06',
    '--theme-hearth-wood':       '#2c1a0a',
    '--theme-hearth-wood-warm':  '#4a2e15',
    '--theme-hearth-bronze':     '#7a5028',
    '--theme-hearth-amber':      '#d4944a',
    '--theme-hearth-glow':       '#ffb260',
    '--theme-hearth-flame':      '#ff7028',

    /* ── Parchment (krčmářský papír) ── */
    '--theme-parch-warm':    '#f0deaa',
    '--theme-parch-aged':    '#e8d4a0',
    '--theme-parch-stained': '#c8a878',

    /* ── Banner (heraldic burgundy) ── */
    '--theme-banner-burgundy':        '#8a1520',
    '--theme-banner-burgundy-bright': '#b01828',

    /* ── Ale ── */
    '--theme-ale-foam':  '#f4e8c4',
    '--theme-ale-amber': '#c0843e',
    '--theme-ale-dark':  '#6b3a14',

    /* ── Iron + brass (krčmářské kování) ── */
    '--theme-iron-cold':    '#2a2620',
    '--theme-iron-warm':    '#3a3128',
    '--theme-brass-base':   '#8a6428',
    '--theme-brass-shine':  '#d4a050',

    /* ── Borders ── */
    '--theme-border':         'rgba(138, 100, 40, 0.62)',
    '--theme-border-soft':    'rgba(138, 100, 40, 0.30)',
    '--theme-border-strong':  'rgba(212, 160, 80, 0.72)',
    '--theme-border-iron':    'var(--theme-iron-cold)',
    '--theme-border-burgundy':'rgba(138, 21, 32, 0.55)',

    /* ── Text (audit C15 — WCAG safe contrast) ── */
    '--theme-text':            '#e8d4a0',
    '--theme-text-muted':      '#b8a070',
    '--theme-heading':         'var(--theme-brass-shine)',
    '--theme-text-on-brass':   '#1a0f06',
    '--theme-text-on-burgundy':'#f0deaa',
    '--theme-text-on-parch':   '#2a1808',

    /* ── Accents (legacy aliasy) ── */
    '--theme-accent':                 '#8a1520',
    '--theme-accent-bright':          '#b01828',
    '--theme-accent-burgundy':        '#8a1520',
    '--theme-accent-burgundy-bright': '#b01828',
    '--theme-accent-brass':           '#8a6428',
    '--theme-accent-brass-shine':     '#d4a050',
    '--theme-accent-amber':           '#d4944a',

    /* ── Glows ── */
    '--theme-glow-amber':         'rgba(255, 178, 96, 0.45)',
    '--theme-glow-amber-strong':  'rgba(255, 178, 96, 0.70)',
    '--theme-glow-burgundy':      'rgba(138, 21, 32, 0.40)',
    '--theme-glow-brass':         'rgba(212, 160, 80, 0.45)',
    '--theme-glow-brass-strong':  'rgba(212, 160, 80, 0.70)',
    '--theme-shadow':             'rgba(20, 12, 4, 0.85)',

    /* ── Nav hover/active ── */
    '--theme-nav-hover-bg':   'rgba(138, 21, 32, 0.16)',
    '--theme-nav-active-bg':
      'linear-gradient(90deg, rgba(138, 21, 32, 0.45) 0%, rgba(44, 26, 10, 0.65) 100%)',

    /* ── Legacy tokeny (mapped na hospoda paletu) ── */
    '--bg-primary':       '#1a0f06',
    '--bg-secondary':     '#2c1a0a',
    '--bg-card':          'var(--theme-parch-warm)',
    '--bg-card-hover':    '#f5e6b8',
    '--accent':           'var(--theme-banner-burgundy)',
    '--accent-bright':    'var(--theme-banner-burgundy-bright)',
    '--accent-dim':       '#600810',
    '--accent-soft':      'var(--theme-border-soft)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       '#806040',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    'rgba(138, 100, 40, 0.16)',
    '--border-strong':    'var(--theme-border-strong)',
    '--success':              '#3a8a4e',
    '--success-soft':         'rgba(58, 138, 78, 0.14)',
    '--success-soft-border':  'rgba(58, 138, 78, 0.4)',
    '--warning':              'var(--theme-brass-shine)',
    '--warning-soft':         'rgba(212, 160, 80, 0.14)',
    '--warning-soft-border':  'rgba(212, 160, 80, 0.4)',
    '--danger':               'var(--theme-banner-burgundy)',
    '--danger-soft':          'rgba(138, 21, 32, 0.14)',
    '--danger-soft-border':   'rgba(138, 21, 32, 0.4)',
    '--danger-focus-ring':    'rgba(138, 21, 32, 0.3)',
    '--info':                 'var(--theme-brass-shine)',
    '--text-on-accent':       'var(--theme-text-on-burgundy)',
    '--text-on-danger':       '#f0deaa',
    '--bg-overlay':           'rgba(20, 12, 4, 0.7)',

    /* ── Typography (krčmářské cedule — Pirata One pro velké nadpisy, Almendra pro UI) ──
       --font-tavern-sign = Pirata One pro section titles + welcome heading (drama).
       --font-display = Almendra pro NavItem buttons (čitelný folk medieval serif). */
    '--font-logo':    '"Pirata One", "Almendra", Georgia, serif',
    '--font-tavern-sign': '"Pirata One", "Almendra", Georgia, serif',
    '--font-display': '"Almendra", "Spectral", Georgia, serif',
    '--font-body':    '"Spectral", "Lora", Georgia, serif',
    '--font-script':  '"Henny Penny", "Almendra", "Lora", Georgia, serif',

    /* ── Layout chrome ── */
    '--header-h':            '56px',
    '--header-bg':           '#2c1a0a',
    '--frame-pad-y':         '40px',
    '--frame-pad-x':         '18px',
    '--sidebar-w':           '280px',

    '--asset-logo-w':         '240px',
    '--asset-logo-w-mobile':  '180px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    /* ── Asset URLs ── */
    '--asset-logo':              `url('${decor}/logo.webp')`,
    '--asset-andel-medallion':   `url('${decor}/medailon.webp')`,
    '--asset-medailon-banner':   `url('${decor}/medailon.webp')`,

    /* Corner ornament (master TL, mirror přes CSS) */
    '--asset-corner':            `url('${decor}/corner-tl.webp')`,
    '--asset-corner-size':       '120px',
    '--asset-corner-size-mobile':'64px',
    '--frame-corner-inset':      '8px',

    /* 7 unikátních dřevěných medailonů */
    '--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
    '--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
    '--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
    '--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
    '--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
    '--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,

    /* Decorative assets */
    '--asset-table-clutter':      `url('${decor}/decor-table-clutter.webp')`,
    '--asset-iron-clasp':         `url('${decor}/iron-clasp-divider.webp')`,
    '--asset-brass-stamp':        `url('${decor}/brass-stamp-ikaros.webp')`,
  },
  fonts: {
    logo: 'Pirata One',
    display: 'Pirata One',
    body: 'Spectral',
  },
  thumbnail: '/themes/thumbnails/hospoda.webp',
  background: '/themes/backgrounds/hospoda.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
