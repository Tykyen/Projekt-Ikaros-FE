import type { Theme } from '@/themes/types';

const decor = '/themes/zlaty-standard/decor';

export const zlatyStandardTheme: Theme = {
  id: 'zlaty-standard',
  name: 'Zlatý standard',
  scope: 'both',
  atmosphere: 'Královský luxus — pure black + rich gold + subtle cobalt accents on active states',
  vars: {
    // ──────────────────────────────────────────────
    // Luxury theme tokens (spec 1.0c)
    // Glass black panely, gold + cobalt accent na aktivních stavech.
    // ──────────────────────────────────────────────

    // Background overlay nad theme.background — lehký, ať citadela prosvítá
    '--theme-bg-overlay':
      'radial-gradient(ellipse at center, rgba(2, 4, 8, 0.30) 0%, rgba(2, 4, 8, 0.72) 100%)',

    // Glass surfaces
    '--theme-surface':         'rgba(5, 6, 10, 0.78)',
    '--theme-surface-strong':  'rgba(2, 3, 6, 0.92)',
    '--theme-surface-soft':    'rgba(15, 12, 5, 0.55)',

    // Borders
    '--theme-border':       'rgba(212, 160, 23, 0.78)',
    '--theme-border-soft':  'rgba(212, 160, 23, 0.32)',
    '--theme-border-cyan':  'rgba(25, 214, 232, 0.45)',

    // Text
    '--theme-text':         '#f0e8d0',
    '--theme-text-muted':   '#c4a960',
    '--theme-heading':      '#f0c040',

    // Accents
    '--theme-accent':        '#d4a017',
    '--theme-accent-bright': '#f0c040',
    '--theme-accent-cyan':   '#19d6e8',

    // Glow / shadow
    '--theme-glow-gold':    'rgba(240, 192, 64, 0.42)',
    '--theme-glow-cyan':    'rgba(25, 214, 232, 0.38)',
    '--theme-shadow':       'rgba(0, 0, 0, 0.85)',

    // Nav (flat-glow) interactive states
    '--theme-nav-hover-bg':  'rgba(212, 160, 23, 0.08)',
    '--theme-nav-active-bg': 'linear-gradient(90deg, rgba(25, 214, 232, 0.18) 0%, rgba(25, 214, 232, 0) 100%)',

    // ──────────────────────────────────────────────
    // Legacy tokeny — namapované na luxury tokeny
    // (zbytek apky používá tyto názvy: btn3d, IkarosLayout aj.)
    // ──────────────────────────────────────────────

    '--bg-primary':       '#050508',
    '--bg-secondary':     '#0a0a0f',
    '--bg-card':          'var(--theme-surface)',
    '--bg-card-hover':    'var(--theme-surface-soft)',
    '--accent':           'var(--theme-accent)',
    '--accent-bright':    'var(--theme-accent-bright)',
    '--accent-dim':       '#8a6510',
    '--accent-soft':      'var(--theme-border-soft)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       '#504030',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    '#0a0808',
    '--border-strong':    'var(--theme-border)',
    '--success':          '#3ecf8e',
    '--warning':          '#d4a017',
    '--danger':           '#c04040',
    '--info':             '#d4a017',
    '--text-on-accent':       '#050508',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(0, 0, 0, 0.8)',
    '--success-soft':         'rgba(62, 207, 142, 0.12)',
    '--success-soft-border':  'rgba(62, 207, 142, 0.4)',
    '--warning-soft':         'rgba(212, 160, 23, 0.16)',
    '--warning-soft-border':  'rgba(212, 160, 23, 0.4)',
    '--danger-soft':          'rgba(192, 64, 64, 0.14)',
    '--danger-soft-border':   'rgba(192, 64, 64, 0.4)',
    '--danger-focus-ring':    'rgba(192, 64, 64, 0.3)',

    // ── Typography ──
    '--font-logo':        '"Cinzel Decorative", "Cinzel", Georgia, serif',
    '--font-display':     '"Cinzel", "Playfair Display", Georgia, serif',
    '--font-body':        '"Lato", "Lora", Georgia, serif',
    '--font-script':      '"Great Vibes", "Brush Script MT", cursive',

    // ── Layout chrome ──
    '--header-h':         '88px',
    '--header-bg':        '#050508',
    '--frame-pad-y':      '40px',
    '--frame-pad-x':      '18px',
    '--sidebar-w':        '280px',

    // ── Logo asset ──
    '--asset-logo':           `url('${decor}/logo.webp')`,
    '--asset-logo-w':         '260px',
    '--asset-logo-w-mobile':  '200px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    // ── Welcome card medallion ──
    '--asset-andel-medallion': `url('${decor}/andel-medallion.webp')`,
  },
  fonts: {
    logo: 'Cinzel Decorative',
    display: 'Cinzel',
    body: 'Lato',
  },
  thumbnail: '/themes/thumbnails/zlaty-standard.webp',
  background: '/themes/backgrounds/zlaty-standard.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
