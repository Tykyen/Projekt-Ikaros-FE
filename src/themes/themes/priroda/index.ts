import type { Theme } from '@/themes/types';

const decor = '/themes/priroda/decor';

export const prirodaTheme: Theme = {
  id: 'priroda',
  name: 'Příroda',
  scope: 'both',
  atmosphere:
    'Zakletý prastarý les při západu slunce — dřevo + břečťan + smaragdové krystaly + zlato kaligrafie',
  vars: {
    // ── Luxury tokens (spec 1.0h) — emerald primary + gold accent ──

    '--theme-bg-overlay':
      'radial-gradient(ellipse at 50% 0%, rgba(212, 169, 70, 0.20) 0%, transparent 55%), ' +
      'radial-gradient(ellipse at 50% 100%, rgba(31, 106, 58, 0.22) 0%, transparent 60%), ' +
      'linear-gradient(180deg, rgba(8, 16, 10, 0.40) 0%, rgba(8, 16, 10, 0.62) 100%)',

    '--theme-surface':        'rgba(20, 32, 22, 0.82)',
    '--theme-surface-strong': 'rgba(12, 22, 14, 0.94)',
    '--theme-surface-soft':   'rgba(28, 44, 30, 0.55)',

    '--theme-border':         'rgba(31, 106, 58, 0.72)',
    '--theme-border-soft':    'rgba(31, 106, 58, 0.30)',
    '--theme-border-gold':    'rgba(212, 169, 70, 0.62)',
    '--theme-border-emerald': 'rgba(31, 106, 58, 0.55)',

    // Text (audit M1: muted #a09060 → #b8a070 pro WCAG AA pass)
    '--theme-text':            '#e8d8a0',
    '--theme-text-muted':      '#b8a070',
    '--theme-heading':         '#d4a946',
    '--theme-text-on-emerald': '#fff8e0',  // NavItem aktivní (audit H1)
    '--theme-text-on-gold':    '#3d2914',  // topbar zlaté cedulky (audit H8)

    '--theme-accent':             '#1f6a3a',
    '--theme-accent-bright':      '#3d9a4a',
    '--theme-accent-emerald':     '#1f6a3a',
    '--theme-accent-gold':        '#d4a946',
    '--theme-accent-gold-bright': '#f0c860',

    '--theme-glow-emerald':         'rgba(31, 106, 58, 0.45)',
    '--theme-glow-emerald-strong':  'rgba(31, 106, 58, 0.70)',
    '--theme-glow-gold':            'rgba(212, 169, 70, 0.42)',
    '--theme-glow-gold-strong':     'rgba(212, 169, 70, 0.65)',
    '--theme-shadow':               'rgba(4, 8, 6, 0.88)',

    '--theme-nav-hover-bg':   'rgba(31, 106, 58, 0.14)',
    '--theme-nav-active-bg':
      'linear-gradient(90deg, rgba(31, 106, 58, 0.45) 0%, rgba(20, 32, 22, 0.55) 100%)',

    // ── Legacy tokeny (mapped na luxury) ──
    '--bg-primary':       '#081610',
    '--bg-secondary':     '#0d2818',
    '--bg-card':          'var(--theme-surface)',
    '--bg-card-hover':    'var(--theme-surface-soft)',
    '--accent':           'var(--theme-accent)',
    '--accent-bright':    'var(--theme-accent-bright)',
    '--accent-dim':       '#0e3a20',
    '--accent-soft':      'var(--theme-border-soft)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       '#605030',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    'rgba(31, 106, 58, 0.16)',
    '--border-strong':    'var(--theme-border)',
    '--success':              '#3d9a4a',
    '--success-soft':         'rgba(61, 154, 74, 0.14)',
    '--success-soft-border':  'rgba(61, 154, 74, 0.4)',
    '--warning':              '#d4a946',
    '--warning-soft':         'rgba(212, 169, 70, 0.14)',
    '--warning-soft-border':  'rgba(212, 169, 70, 0.4)',
    '--danger':               '#c04030',
    '--danger-soft':          'rgba(192, 64, 48, 0.14)',
    '--danger-soft-border':   'rgba(192, 64, 48, 0.4)',
    '--danger-focus-ring':    'rgba(192, 64, 48, 0.3)',
    '--info':                 'var(--theme-accent)',
    '--text-on-accent':       'var(--theme-text-on-emerald)',
    '--text-on-danger':       '#fff8e0',
    '--bg-overlay':           'rgba(8, 16, 10, 0.7)',

    // ── Typography ──
    '--font-logo':    '"Cinzel", "Uncial Antiqua", Georgia, serif',
    '--font-display': '"Cinzel", "IM Fell English", Georgia, serif',
    '--font-body':    '"Lora", Georgia, serif',
    '--font-script':  '"IM Fell English", "Lora", Georgia, serif',

    // ── Layout chrome ──
    '--header-h':            '56px',
    '--header-bg':            '#0d2818',
    '--frame-pad-y':         '40px',
    '--frame-pad-x':         '18px',
    '--sidebar-w':           '280px',

    '--asset-logo-w':         '220px',
    '--asset-logo-w-mobile':  '170px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    // ── Asset URLs ──
    '--asset-logo':            `url('${decor}/logo.webp')`,
    '--asset-andel-medallion': `url('${decor}/medailon.webp')`,

    // Corner ornament — master TL (audit H1)
    '--asset-corner':            `url('${decor}/corner-tl.webp')`,
    '--asset-corner-size':       '120px',
    '--asset-corner-size-mobile':'64px',
    '--frame-corner-inset':      '8px',

    // Default leaf — 2 výstupní velikosti (audit M3)
    '--asset-icon-leaf':        `url('${decor}/icon-leaf-64.webp')`,
    '--asset-icon-leaf-mobile': `url('${decor}/icon-leaf-32.webp')`,

    // 3 speciální nav ikony (Hospoda + Úvodník + Nápověda)
    '--asset-icon-hospoda':  `url('${decor}/icon-hospoda.webp')`,
    '--asset-icon-uvodnik':  `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-napoveda': `url('${decor}/icon-napoveda.webp')`,
  },
  fonts: {
    logo: 'Cinzel',
    display: 'Cinzel',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/priroda.webp',
  background: '/themes/backgrounds/priroda.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
