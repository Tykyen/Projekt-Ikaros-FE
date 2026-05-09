import type { Theme } from '@/themes/types';

const decor = '/themes/bila/decor';

export const bilaTheme: Theme = {
  id: 'bila',
  name: 'Bílá',
  scope: 'both',
  atmosphere: 'Éterická mramorová síň — ivory surface + light blue accent + crystal ornaments, light mode (jediné světlé téma kolekce)',
  vars: {
    // ──────────────────────────────────────────────
    // Luxury tokens (spec 1.0e) — light mode, ivory + light blue
    // Synthéza ChatGPT (warm ivory) + Gemini (light blue + crystal corners)
    // ──────────────────────────────────────────────

    // Background overlay — světlý warm white, nepřebíjí cathedral tapetu
    '--theme-bg-overlay':
      'radial-gradient(circle at 50% 8%, rgba(255, 255, 255, 0.45) 0%, transparent 38%), ' +
      'radial-gradient(circle at 14% 82%, rgba(180, 220, 235, 0.18) 0%, transparent 30%), ' +
      'radial-gradient(circle at 88% 80%, rgba(170, 210, 180, 0.14) 0%, transparent 30%), ' +
      'linear-gradient(180deg, rgba(255, 252, 245, 0.18) 0%, rgba(248, 244, 235, 0.30) 100%)',

    // Glass surfaces — ivory frosted (warm white)
    '--theme-surface':         'rgba(255, 252, 245, 0.82)',
    '--theme-surface-strong':  'rgba(255, 252, 245, 0.94)',
    '--theme-surface-soft':    'rgba(246, 241, 230, 0.65)',

    // Borders — gold-ivory (primary) + light blue accent
    '--theme-border':          'rgba(199, 176, 122, 0.55)',
    '--theme-border-soft':     'rgba(150, 125, 75, 0.28)',
    '--theme-border-blue':     'rgba(79, 136, 168, 0.55)',
    '--theme-border-cyan':     'rgba(79, 136, 168, 0.55)',  // alias pro btn3d active

    // Text — warm dark slate (full inverze)
    '--theme-text':         '#2f2a22',
    '--theme-text-muted':   '#6f6555',
    '--theme-heading':      '#2f2a22',  // dark warm pro headings

    // Accents — light blue + warm gold subtle
    '--theme-accent':          '#4f88a8',
    '--theme-accent-bright':   '#8eb6cc',
    '--theme-accent-cyan':     '#9ed4ef',
    '--theme-accent-magenta':  '#a890c8',
    '--theme-accent-gold':     '#c7b07a',  // warm gold detail (line accents)

    // Glow — světlejší (intenzita 0.20-0.32 vs 0.42 dark themes)
    '--theme-glow-cyan':         'rgba(120, 180, 210, 0.32)',
    '--theme-glow-cyan-strong':  'rgba(120, 180, 210, 0.50)',
    '--theme-glow-magenta':      'rgba(168, 144, 200, 0.20)',
    '--theme-glow-gold':         'rgba(180, 155, 105, 0.22)',
    '--theme-shadow':            'rgba(96, 76, 42, 0.16)',  // warm light shadow

    // Nav interactive — světlo modrý gradient
    '--theme-nav-hover-bg':   'linear-gradient(180deg, rgba(255,255,255,0.90) 0%, rgba(236,246,250,0.75) 100%)',
    '--theme-nav-active-bg':  'linear-gradient(180deg, rgba(232,244,250,0.95) 0%, rgba(210,229,239,0.90) 100%)',

    // ──────────────────────────────────────────────
    // Legacy tokeny — namapované na luxury
    // ──────────────────────────────────────────────

    '--bg-primary':       '#f7f2e8',
    '--bg-secondary':     '#fbf8f1',
    '--bg-card':          'var(--theme-surface)',
    '--bg-card-hover':    'var(--theme-surface-soft)',
    '--accent':           'var(--theme-accent)',
    '--accent-bright':    'var(--theme-accent-bright)',
    '--accent-dim':       '#8c7443',
    '--accent-soft':      'var(--theme-border-soft)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       '#8b806d',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    'rgba(199, 176, 122, 0.20)',
    '--border-strong':    'var(--theme-border)',
    '--success':          '#3a8a4e',
    '--success-soft':     'rgba(58, 138, 78, 0.15)',
    '--success-soft-border': 'rgba(58, 138, 78, 0.30)',
    '--warning':          '#c87820',
    '--warning-soft':     'rgba(200, 120, 32, 0.15)',
    '--warning-soft-border': 'rgba(200, 120, 32, 0.30)',
    '--danger':           '#a83838',
    '--danger-soft':      'rgba(168, 56, 56, 0.15)',
    '--danger-soft-border': 'rgba(168, 56, 56, 0.30)',
    '--danger-focus-ring': 'rgba(168, 56, 56, 0.20)',
    '--info':             'var(--theme-accent)',
    '--text-on-accent':   '#ffffff',
    '--text-on-danger':   '#ffffff',
    '--bg-overlay':       'rgba(255, 252, 245, 0.45)',

    // ── Typography (Cinzel + Lora už loadované) ──
    '--font-logo':        '"Cinzel", "Cormorant Garamond", Georgia, serif',
    '--font-display':     '"Cinzel", Georgia, serif',
    '--font-body':        '"Lora", Georgia, serif',
    '--font-script':      '"Great Vibes", "Cormorant Garamond", cursive',

    // ── Layout chrome ──
    '--header-h':         '88px',
    '--header-bg':        '#fbf8f1',
    '--frame-pad-y':      '40px',
    '--frame-pad-x':      '18px',
    '--sidebar-w':        '280px',

    // ── Logo asset (4.27:1 thin wide banner) ──
    '--asset-logo':           `url('${decor}/logo.webp')`,
    '--asset-logo-w':         '320px',
    '--asset-logo-w-mobile':  '240px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    // ── Welcome andel medallion (0.75:1 portrétový PNG) ──
    '--asset-andel-medallion': `url('${decor}/andel-medallion.webp')`,
  },
  fonts: {
    logo: 'Cinzel',
    display: 'Cinzel',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/bila.webp',
  background: '/themes/backgrounds/bila.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
