import type { Theme } from '@/themes/types';

const decor = '/themes/sci-fi/decor';

export const sciFiTheme: Theme = {
  id: 'sci-fi',
  name: 'Sci-fi',
  scope: 'both',
  atmosphere: 'Futuristic command HUD — cyan + magenta neon, holographic glass panely, sci-fi typografie',
  vars: {
    // ──────────────────────────────────────────────
    // Luxury tokens (spec 1.0d) — cyan + magenta dual-tone
    // ──────────────────────────────────────────────

    // Background overlay — radial cyan + magenta ambient + linear darken
    '--theme-bg-overlay':
      'radial-gradient(circle at 22% 18%, rgba(22, 217, 255, 0.20) 0%, transparent 38%), ' +
      'radial-gradient(circle at 82% 76%, rgba(176, 38, 255, 0.16) 0%, transparent 32%), ' +
      'linear-gradient(180deg, rgba(2, 7, 17, 0.42) 0%, rgba(2, 7, 17, 0.62) 100%)',

    // Glass surfaces
    '--theme-surface':         'rgba(3, 12, 22, 0.78)',
    '--theme-surface-strong':  'rgba(2, 8, 16, 0.92)',
    '--theme-surface-soft':    'rgba(8, 28, 48, 0.55)',

    // Borders
    '--theme-border':          'rgba(22, 217, 255, 0.72)',
    '--theme-border-soft':     'rgba(22, 217, 255, 0.32)',
    '--theme-border-magenta':  'rgba(176, 38, 255, 0.55)',
    '--theme-border-cyan':     'rgba(22, 217, 255, 0.55)',

    // Text
    '--theme-text':         '#e8f6ff',
    '--theme-text-muted':   '#93aebe',
    '--theme-heading':      '#7eeaff',

    // Accents
    '--theme-accent':          '#16d9ff',
    '--theme-accent-bright':   '#7eeaff',
    '--theme-accent-cyan':     '#16d9ff',
    '--theme-accent-magenta':  '#b026ff',

    // Glow
    '--theme-glow-cyan':         'rgba(22, 217, 255, 0.42)',
    '--theme-glow-cyan-strong':  'rgba(22, 217, 255, 0.65)',
    '--theme-glow-magenta':      'rgba(176, 38, 255, 0.38)',
    '--theme-glow-gold':         'rgba(22, 217, 255, 0.42)',
    '--theme-shadow':            'rgba(0, 0, 0, 0.85)',

    // Nav interactive
    '--theme-nav-hover-bg':   'rgba(22, 217, 255, 0.10)',
    '--theme-nav-active-bg':  'linear-gradient(90deg, rgba(22, 217, 255, 0.28) 0%, rgba(5, 18, 32, 0.55) 100%)',

    // ──────────────────────────────────────────────
    // Legacy tokeny — namapované na luxury
    // ──────────────────────────────────────────────

    '--bg-primary':       '#020711',
    '--bg-secondary':     '#04101e',
    '--bg-card':          'var(--theme-surface)',
    '--bg-card-hover':    'var(--theme-surface-soft)',
    '--accent':           'var(--theme-accent)',
    '--accent-bright':    'var(--theme-accent-bright)',
    '--accent-dim':       '#076b8f',
    '--accent-soft':      'var(--theme-border-soft)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       '#607888',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    'rgba(22, 217, 255, 0.16)',
    '--border-strong':    'var(--theme-border)',
    '--success':          '#3ecf8e',
    '--success-soft':     'rgba(62, 207, 142, 0.12)',
    '--success-soft-border': 'rgba(62, 207, 142, 0.4)',
    '--warning':          '#f5a623',
    '--warning-soft':     'rgba(245, 166, 35, 0.12)',
    '--warning-soft-border': 'rgba(245, 166, 35, 0.4)',
    '--danger':           '#f06060',
    '--danger-soft':      'rgba(240, 96, 96, 0.12)',
    '--danger-soft-border': 'rgba(240, 96, 96, 0.4)',
    '--danger-focus-ring': 'rgba(240, 96, 96, 0.3)',
    '--info':             'var(--theme-accent)',
    '--text-on-accent':   '#04101a',
    '--text-on-danger':   '#050508',
    '--bg-overlay':       'rgba(0, 8, 16, 0.7)',

    // ── Typography ──
    // Pozn: Orbitron nemá Latin Extended (chybí ščřžýáí…), Rajdhani ano.
    // Logo je v sci-fi PNG banner (--asset-logo), Orbitron v --font-logo je jen fallback bez efektu.
    '--font-logo':        '"Orbitron", "Rajdhani", system-ui, sans-serif',
    '--font-display':     '"Rajdhani", "Orbitron", system-ui, sans-serif',
    '--font-body':        '"Rajdhani", "Inter", system-ui, sans-serif',
    '--font-script':      '"Rajdhani", system-ui, sans-serif',

    // ── Layout chrome ──
    '--header-h':         '70px',
    '--header-bg':        '#020711',
    '--frame-pad-y':      '40px',
    '--frame-pad-x':      '18px',
    '--sidebar-w':        '280px',

    // ── Logo asset (aspect 4:1 — thin wide banner) ──
    '--asset-logo':           `url('${decor}/logo.webp')`,
    '--asset-logo-w':         '280px',
    '--asset-logo-w-mobile':  '210px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    // ── Welcome andel medallion (PNG sci-fi anděl) ──
    '--asset-andel-medallion': `url('${decor}/andel-medallion.webp')`,
  },
  fonts: {
    logo: 'Orbitron',
    display: 'Rajdhani',
    body: 'Inter',
  },
  thumbnail: '/themes/thumbnails/sci-fi.webp',
  background: '/themes/backgrounds/sci-fi.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
