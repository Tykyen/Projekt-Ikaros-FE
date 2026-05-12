import type { Theme } from '@/themes/types';

const decor = '/themes/severske-runy/decor';

export const severskeRunyTheme: Theme = {
  id: 'severske-runy',
  name: 'Severské runy',
  scope: 'both',
  atmosphere:
    'Mead-hall síň na konci fjordu, kde se rozhoduje, kdo přežije zimu. Dark stained oak s iron banding, iron-cast vlčí hlavy, ledové rampouchy, oxidovaný bronz. Drsná, vážná, ale obyvatelná — Carved Saga.',
  vars: {
    /* ── Background overlay (chladný atmosférický gradient) ── */
    '--theme-bg-overlay':
      'radial-gradient(ellipse 800px 320px at 50% 5%, rgba(74, 176, 208, 0.12), transparent 60%), radial-gradient(ellipse 700px 400px at 50% 100%, rgba(0, 4, 8, 0.65), transparent 70%), radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(0, 0, 0, 0.55) 100%), linear-gradient(180deg, rgba(8, 12, 16, 0.32) 0%, rgba(8, 12, 16, 0.48) 100%)',

    /* ── Snow fall patterns (3 vrstvy parallax — SVG inline) ── */
    '--theme-snow-far':
      'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><circle cx=\'30\' cy=\'40\' r=\'0.8\' fill=\'%23c8d8e8\' opacity=\'0.45\'/><circle cx=\'120\' cy=\'80\' r=\'1\' fill=\'%23c8d8e8\' opacity=\'0.4\'/><circle cx=\'170\' cy=\'130\' r=\'0.7\' fill=\'%23c8d8e8\' opacity=\'0.5\'/><circle cx=\'60\' cy=\'170\' r=\'0.9\' fill=\'%23c8d8e8\' opacity=\'0.42\'/><circle cx=\'90\' cy=\'20\' r=\'0.8\' fill=\'%23c8d8e8\' opacity=\'0.38\'/></svg>")',
    '--theme-snow-mid':
      'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'180\' height=\'180\'><circle cx=\'45\' cy=\'60\' r=\'1.5\' fill=\'%23d8e4ee\' opacity=\'0.62\'/><circle cx=\'140\' cy=\'30\' r=\'1.3\' fill=\'%23d8e4ee\' opacity=\'0.58\'/><circle cx=\'80\' cy=\'120\' r=\'1.6\' fill=\'%23d8e4ee\' opacity=\'0.6\'/><circle cx=\'20\' cy=\'150\' r=\'1.2\' fill=\'%23d8e4ee\' opacity=\'0.55\'/></svg>")',
    '--theme-snow-near':
      'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'220\' height=\'220\'><circle cx=\'50\' cy=\'90\' r=\'2.2\' fill=\'%23eaf2f8\' opacity=\'0.78\'/><circle cx=\'170\' cy=\'50\' r=\'2.5\' fill=\'%23eaf2f8\' opacity=\'0.75\'/><circle cx=\'110\' cy=\'180\' r=\'2.4\' fill=\'%23eaf2f8\' opacity=\'0.7\'/></svg>")',

    /* ── Surfaces (mead-hall panely) ── */
    '--theme-surface':         'rgba(20, 14, 12, 0.96)',
    '--theme-surface-strong':  'rgba(10, 6, 4, 0.98)',
    '--theme-surface-soft':    'rgba(28, 22, 18, 0.55)',

    /* ── Material: Dark stained oak (panely + nav buttons body) ── */
    '--mat-oak':            '#1a1612',
    '--mat-oak-mid':        '#2a2218',
    '--mat-oak-deep':       '#0c0a08',
    '--mat-oak-edge':       'rgba(40, 32, 22, 0.55)',

    /* ── Material: Iron (banding + hardware) ── */
    '--mat-iron':           '#1a1c20',
    '--mat-iron-highlight': '#3a3e44',
    '--mat-iron-deep':      '#0a0c10',
    '--mat-iron-edge':      'rgba(58, 62, 68, 0.55)',

    /* ── Material: Stone (vyleštěný granit — POUZE welcome card, sacred focus) ── */
    '--mat-stone':          '#2a2e34',
    '--mat-stone-bright':   '#383c44',
    '--mat-stone-deep':     '#161a20',

    /* ── Material: Frost / Ice (transient highlights) ── */
    '--mat-frost':          '#c8d8e8',
    '--mat-rune-recess':    '#0a0c10',  /* deep cut shadow */

    /* ── Ice-blue (primární akcent — cold light) ── */
    '--theme-ice-dim':      '#205870',
    '--theme-ice':          '#4ab0d0',
    '--theme-ice-bright':   '#70d0f0',
    '--theme-ice-frost':    '#a8d8e8',

    /* ── Oxidovaný bronz (sekundární akcent — patinovaný, NE lesklý gold) ── */
    '--theme-bronze':       '#8a5a2a',
    '--theme-bronze-bright':'#a87038',
    '--theme-bronze-dim':   '#5a3818',
    '--theme-bronze-verdigris': '#5a7838',

    /* ── Text (frost pale, kontrast vůči dark oak) ── */
    '--theme-text-pale':    '#c8d8e8',
    '--theme-text-muted':   '#5888a8',
    '--theme-text-dim':     '#304050',
    '--theme-heading':      '#c8d8e8',

    /* ── Borders ── */
    '--theme-border':         'rgba(58, 62, 68, 0.55)',
    '--theme-border-soft':    'rgba(28, 22, 18, 0.5)',
    '--theme-border-strong':  '#3a4858',
    '--theme-border-ice':     'rgba(74, 176, 208, 0.55)',
    '--theme-border-bronze':  'rgba(138, 90, 42, 0.55)',
    '--theme-border-iron':    '#1a1c20',

    /* ── Glows & shadows ── */
    '--theme-glow-ice':         'rgba(74, 176, 208, 0.45)',
    '--theme-glow-ice-strong':  'rgba(112, 208, 240, 0.70)',
    '--theme-glow-bronze':      'rgba(138, 90, 42, 0.32)',
    '--theme-shadow':           'rgba(0, 4, 8, 0.85)',
    '--theme-inner-shadow':
      'inset 0 1px 0 rgba(168, 200, 220, 0.06), inset 0 -2px 6px rgba(0, 0, 0, 0.7)',

    /* ── Nav hover/active ── */
    '--theme-nav-hover-bg':   'rgba(74, 176, 208, 0.12)',
    '--theme-nav-active-bg':
      'linear-gradient(180deg, rgba(32, 88, 112, 0.55), rgba(12, 28, 40, 0.85))',

    /* ── Legacy tokeny (mapped na severske-runy paletu) ── */
    '--bg-primary':       '#080c10',
    '--bg-secondary':     '#0c1018',
    '--bg-card':          '#101520',
    '--bg-card-hover':    '#161e28',
    '--bg-card-stone':    '#2a2e34',   /* welcome card sacred surface */
    '--bg-card-stone-2':  '#383c44',
    '--accent':           '#4ab0d0',
    '--accent-bright':    '#70d0f0',
    '--accent-dim':       '#205870',
    '--accent-soft':      'rgba(74, 176, 208, 0.16)',
    '--accent-bronze':    '#8a5a2a',
    '--text-primary':     '#c8d8e8',
    '--text-secondary':   '#5888a8',
    '--text-muted':       '#304050',
    '--border':           '#3a4858',
    '--border-subtle':    '#202830',
    '--border-strong':    '#4ab0d0',
    '--success':              '#3ecf8e',
    '--success-soft':         'rgba(62, 207, 142, 0.12)',
    '--success-soft-border':  'rgba(62, 207, 142, 0.40)',
    '--warning':              '#c08030',
    '--warning-soft':         'rgba(192, 128, 48, 0.16)',
    '--warning-soft-border':  'rgba(192, 128, 48, 0.40)',
    '--danger':               '#c04040',
    '--danger-soft':          'rgba(192, 64, 64, 0.14)',
    '--danger-soft-border':   'rgba(192, 64, 64, 0.40)',
    '--danger-focus-ring':    'rgba(192, 64, 64, 0.30)',
    '--info':                 '#4ab0d0',
    '--text-on-accent':       '#04101a',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(0, 4, 8, 0.7)',

    /* ── Typography (Q-3 C: Cinzel + Sancreek woodcut + Lora) ── */
    '--font-logo':        '"Cinzel", Georgia, serif',
    '--font-display':     '"Sancreek", "MedievalSharp", "Cinzel", Georgia, serif',
    '--font-body':        '"Lora", "EB Garamond", Georgia, serif',

    /* ── Layout chrome ── */
    '--header-h':            '64px',
    '--header-bg':           '#0c0a08',
    '--frame-pad-y':         '40px',
    '--frame-pad-x':         '18px',
    '--sidebar-w':           '280px',

    '--asset-logo-w':         '420px',
    '--asset-logo-w-mobile':  '260px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    /* ── Asset URLs ── */
    '--asset-logo':                 `url('${decor}/logo.webp')`,
    '--asset-medailon':             `url('${decor}/medailon.webp')`,
    '--asset-medailon-frame':       `url('${decor}/medailon-frame.webp')`,
    '--asset-andel-medallion':      `url('${decor}/medailon.webp')`,  /* alias pro DashboardPage data-andel-medallion */

    /* Corner ornament (master TL = iron-cast vlčí hlava, mirror přes CSS) */
    '--asset-corner':            `url('${decor}/corner-tl.webp')`,
    '--asset-corner-size':       '72px',   /* desktop side panels */
    '--asset-corner-size-side':  '64px',   /* sidebar + right panel */
    '--asset-corner-size-mobile':'44px',
    '--frame-corner-inset':      '-12px',  /* mírný přesah ven z panelu */

    /* Signature ornaments */
    '--asset-welcome-arch':       `url('${decor}/welcome-arch.webp')`,
    '--asset-wolfshield-divider': `url('${decor}/wolfshield-divider.webp')`,
    '--asset-rune-circle-floor':  `url('${decor}/rune-circle-floor.webp')`,
    '--asset-rune-knot-seal':     `url('${decor}/rune-knot-seal.webp')`,

    /* 10 unikátních carved-oak medailon nav ikon */
    '--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
    '--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
    '--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
    '--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
    '--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
    '--asset-icon-matrix':        `url('${decor}/icon-matrix.webp')`,
    '--asset-icon-novy-svet':     `url('${decor}/icon-novy-svet.webp')`,
    '--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,
    '--asset-icon-chat':          `url('${decor}/icon-chat.webp')`,
  },
  fonts: {
    logo: 'Cinzel',
    display: 'Sancreek',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/severske-runy.webp',
  background: '/themes/backgrounds/severske-runy.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
