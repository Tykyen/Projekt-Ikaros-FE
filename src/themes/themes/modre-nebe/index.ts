import type { Theme } from '@/themes/types';

const decor = '/themes/modre-nebe/decor';

export const modreNebeTheme: Theme = {
  id: 'modre-nebe',
  name: 'Modré nebe',
  scope: 'both',
  atmosphere: 'Heroická fantasy říše pod hvězdnatým modrým nebem',
  vars: {
    // ──────────────────────────────────────────────
    // Luxury theme tokens (spec 1.0b-v2)
    // Glass panely, gold + cyan akcenty, atmosférický overlay.
    // ──────────────────────────────────────────────

    // Background overlay nad theme.background
    '--theme-bg-overlay':
      'linear-gradient(180deg, rgba(2, 7, 18, 0.45) 0%, rgba(2, 7, 18, 0.65) 100%)',

    // Glass surfaces
    '--theme-surface':         'rgba(3, 14, 30, 0.72)',
    '--theme-surface-strong':  'rgba(2, 8, 18, 0.88)',
    '--theme-surface-soft':    'rgba(12, 35, 65, 0.45)',

    // Borders
    '--theme-border':       'rgba(214, 170, 69, 0.72)',
    '--theme-border-soft':  'rgba(214, 170, 69, 0.35)',
    '--theme-border-cyan':  'rgba(37, 208, 230, 0.55)',

    // Text
    '--theme-text':         '#f4ead0',
    '--theme-text-muted':   '#c9b98a',
    '--theme-heading':      '#ffd36a',

    // Accents
    '--theme-accent':        '#d6aa45',
    '--theme-accent-bright': '#ffd36a',
    '--theme-accent-cyan':   '#25d0e6',

    // Glow / shadow
    '--theme-glow-gold':    'rgba(214, 170, 69, 0.42)',
    '--theme-glow-cyan':    'rgba(37, 208, 230, 0.38)',
    '--theme-shadow':       'rgba(0, 0, 0, 0.75)',

    // Nav (flat-glow) interactive states
    '--theme-nav-hover-bg':  'rgba(214, 170, 69, 0.08)',
    '--theme-nav-active-bg': 'linear-gradient(90deg, rgba(37, 208, 230, 0.15) 0%, rgba(37, 208, 230, 0) 100%)',

    // ──────────────────────────────────────────────
    // Heraldic upgrade tokens (spec 1.0f)
    // ──────────────────────────────────────────────

    // Ornament fills (documentation; SVG data-URI fills jsou inlined v CSS)
    '--ornament-gold':         '#d6aa45',
    '--ornament-gold-bright':  '#ffd36a',
    '--ornament-cyan':         '#25d0e6',

    // Header band
    '--header-band-h':         '6px',

    // Panel double-stroke inner border
    '--panel-inner-border':    'rgba(214, 170, 69, 0.30)',
    '--panel-inner-inset':     '7px',

    // Section title gradient
    '--section-divider':       'linear-gradient(90deg, transparent 0%, rgba(214,170,69,0.65) 50%, transparent 100%)',

    // ──────────────────────────────────────────────
    // Legacy color tokens — namapované na luxury tokeny
    // (zbytek apky používá tyto názvy: btn3d, IkarosLayout aj.)
    // ──────────────────────────────────────────────

    '--bg-primary':       '#0a1428',
    '--bg-secondary':     '#101e3c',
    '--bg-card':          'var(--theme-surface)',
    '--bg-card-hover':    'var(--theme-surface-soft)',
    '--accent':           'var(--theme-accent)',
    '--accent-bright':    'var(--theme-accent-bright)',
    '--accent-dim':       '#604814',
    '--accent-soft':      'var(--theme-border-soft)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       '#544830',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    'rgba(214, 170, 69, 0.20)',
    '--border-strong':    'var(--theme-border)',
    '--success':          '#3ecf8e',
    '--success-soft':     'rgba(62, 207, 142, 0.15)',
    '--success-soft-border': 'rgba(62, 207, 142, 0.30)',
    '--warning':          '#f5a623',
    '--warning-soft':     'rgba(245, 166, 35, 0.15)',
    '--warning-soft-border': 'rgba(245, 166, 35, 0.30)',
    '--danger':           '#f06060',
    '--danger-soft':      'rgba(240, 96, 96, 0.15)',
    '--danger-soft-border': 'rgba(240, 96, 96, 0.30)',
    '--danger-focus-ring': 'rgba(240, 96, 96, 0.20)',
    '--info':             '#5ba4f5',
    '--text-on-accent':   '#050508',
    '--text-on-danger':   '#050508',
    '--bg-overlay':       'rgba(0, 0, 0, 0.6)',

    // ── Typography ──
    '--font-logo':        '"Cinzel Decorative", "Cinzel", Georgia, serif',
    '--font-display':     '"Cinzel", Georgia, serif',
    '--font-body':        '"Lora", Georgia, serif',
    '--font-script':      '"Great Vibes", "Brush Script MT", cursive',

    // ── Layout chrome ──
    '--header-h':         '88px',
    /* Solid navy — match logo image bg, žádný fade aby nevznikla mezera mezi headerem a panely */
    '--header-bg':        '#0a1428',
    '--frame-pad-y':      '40px',
    '--frame-pad-x':      '18px',
    '--sidebar-w':        '280px',

    // ── Logo asset (zachováno z PNG: anděl + wordmark) ──
    '--asset-logo':           `url('${decor}/logo.webp')`,
    '--asset-logo-w':         '220px',
    '--asset-logo-w-mobile':  '180px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    // ── Welcome card medallion (zachováno z PNG) ──
    '--asset-andel-medallion': `url('${decor}/andel-medallion.webp')`,
  },
  fonts: {
    logo: 'Cinzel Decorative',
    display: 'Cinzel',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/modre-nebe.webp',
  background: '/themes/backgrounds/modre-nebe.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
