import type { Theme } from '@/themes/types';

const decor = '/themes/vesmirna-lod/decor';

export const vesmirnaLodTheme: Theme = {
  id: 'vesmirna-lod',
  name: 'Vesmírná loď',
  scope: 'both',
  atmosphere:
    'Vojenský hangár vesmírné lodi — cyan + amber dual-tone, plate-metal panely, industrial corner plates, rivety, 7 nav ikon',
  vars: {
    // ── Luxury tokens (spec 1.0g) — cyan primary + amber accent ──

    '--theme-bg-overlay':
      'radial-gradient(circle at 18% 22%, rgba(0, 184, 232, 0.18) 0%, transparent 40%), ' +
      'radial-gradient(circle at 85% 80%, rgba(232, 160, 32, 0.14) 0%, transparent 35%), ' +
      'linear-gradient(180deg, rgba(4, 8, 14, 0.45) 0%, rgba(4, 8, 14, 0.65) 100%)',

    '--theme-surface':         'rgba(8, 16, 26, 0.82)',
    '--theme-surface-strong':  'rgba(4, 10, 18, 0.94)',
    '--theme-surface-soft':    'rgba(14, 28, 44, 0.55)',

    '--theme-border':          'rgba(0, 184, 232, 0.72)',
    '--theme-border-soft':     'rgba(0, 184, 232, 0.30)',
    '--theme-border-amber':    'rgba(232, 160, 32, 0.62)',
    '--theme-border-cyan':     'rgba(0, 184, 232, 0.55)',

    '--theme-text':         '#d6e6f2',
    '--theme-text-muted':   '#7a98ad',
    '--theme-heading':      '#5dd5ff',

    '--theme-accent':              '#00b8e8',
    '--theme-accent-bright':       '#5dd5ff',
    '--theme-accent-cyan':         '#00b8e8',
    '--theme-accent-amber':        '#e8a020',
    '--theme-accent-amber-bright': '#ffc24a',

    '--theme-glow-cyan':         'rgba(0, 184, 232, 0.45)',
    '--theme-glow-cyan-strong':  'rgba(0, 184, 232, 0.70)',
    '--theme-glow-amber':        'rgba(232, 160, 32, 0.42)',
    '--theme-glow-amber-strong': 'rgba(232, 160, 32, 0.65)',
    '--theme-glow-magenta':      'rgba(232, 160, 32, 0.42)',
    '--theme-glow-gold':         'rgba(232, 160, 32, 0.42)',
    '--theme-shadow':            'rgba(0, 4, 8, 0.88)',

    '--theme-nav-hover-bg':   'rgba(0, 184, 232, 0.12)',
    '--theme-nav-active-bg':
      'linear-gradient(90deg, rgba(0, 184, 232, 0.32) 0%, rgba(8, 22, 36, 0.55) 100%)',

    // ── Legacy tokeny (mapped na luxury) ──
    '--bg-primary':       '#040810',
    '--bg-secondary':     '#0a141e',
    '--bg-card':          'var(--theme-surface)',
    '--bg-card-hover':    'var(--theme-surface-soft)',
    '--accent':           'var(--theme-accent)',
    '--accent-bright':    'var(--theme-accent-bright)',
    '--accent-dim':       '#005878',
    '--accent-soft':      'var(--theme-border-soft)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       '#4d6878',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    'rgba(0, 184, 232, 0.16)',
    '--border-strong':    'var(--theme-border)',
    '--success':              '#3ecf8e',
    '--success-soft':         'rgba(62, 207, 142, 0.12)',
    '--success-soft-border':  'rgba(62, 207, 142, 0.4)',
    '--warning':              '#e8a020',
    '--warning-soft':         'rgba(232, 160, 32, 0.12)',
    '--warning-soft-border':  'rgba(232, 160, 32, 0.4)',
    '--danger':               '#f06060',
    '--danger-soft':          'rgba(240, 96, 96, 0.12)',
    '--danger-soft-border':   'rgba(240, 96, 96, 0.4)',
    '--danger-focus-ring':    'rgba(240, 96, 96, 0.3)',
    '--info':                 'var(--theme-accent)',
    '--text-on-accent':       '#04101a',
    '--text-on-danger':       '#050508',
    '--bg-overlay':           'rgba(4, 8, 14, 0.7)',

    // ── Typography ──
    '--font-logo':    '"Orbitron", "Russo One", sans-serif',
    '--font-display': '"Rajdhani", "Exo 2", sans-serif',
    '--font-body':    '"Roboto Condensed", "Roboto", sans-serif',
    '--font-script':  '"Rajdhani", system-ui, sans-serif',

    // ── Layout chrome (slim header pattern) ──
    '--header-h':            '56px',
    '--header-bg':           '#040810',
    '--frame-pad-y':         '40px',
    '--frame-pad-x':         '18px',
    '--sidebar-w':           '280px',

    '--asset-logo-w':         '180px',
    '--asset-logo-w-mobile':  '150px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    // ── Existující assety (zachovány) ──
    '--asset-logo':            `url('${decor}/logo.webp')`,
    '--asset-andel-medallion': `url('${decor}/andel-medallion.webp')`,

    // ── 7 nav ikon ──
    '--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
    '--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
    '--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
    '--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
    '--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
    '--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,
  },
  fonts: {
    logo: 'Orbitron',
    display: 'Rajdhani',
    body: 'Roboto Condensed',
  },
  thumbnail: '/themes/thumbnails/vesmirna-lod.webp',
  background: '/themes/backgrounds/vesmirna-lod.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
