import type { Theme } from '@/themes/types';

const decor = '/themes/ctyri-zivly/decor';

export const ctyriZivlyTheme: Theme = {
  id: 'ctyri-zivly',
  name: 'Čtyři živly',
  scope: 'platform',
  atmosphere:
    'Pactum Quattuor — heraldická reliquář-mřížka, leštěné stříbro-ocel + warm bronze/vermeil + 4 cardinal cabochon gemy (rubín/safír/smaragd/topaz) + Ikaros-fénix jako pátý sjednotitel',
  vars: {
    /* ── Background overlay (5-vrstvý gradient + Quartered Aurora 4 rohy) ── */
    '--theme-bg-overlay':
      'radial-gradient(ellipse 800px 280px at 50% 0%, rgba(255, 232, 168, 0.10), transparent 70%), radial-gradient(ellipse 1200px 400px at 50% 100%, rgba(19, 20, 26, 0.65), transparent 70%), radial-gradient(ellipse 100% 100% at 50% 50%, transparent 60%, rgba(0, 0, 0, 0.55) 100%)',

    /* ── Quartered Aurora (4 elementální mlhy v rozích — passive atmosphere) ── */
    '--theme-aurora-pattern':
      'radial-gradient(ellipse 600px 600px at 0% 0%, rgba(200, 32, 42, 0.08), transparent 50%), radial-gradient(ellipse 600px 600px at 100% 0%, rgba(232, 212, 128, 0.08), transparent 50%), radial-gradient(ellipse 600px 600px at 100% 100%, rgba(32, 80, 176, 0.08), transparent 50%), radial-gradient(ellipse 600px 600px at 0% 100%, rgba(42, 128, 80, 0.08), transparent 50%)',

    /* ── Alchemical glyph subtle pattern (sidebar L hint) ── */
    '--theme-glyph-pattern':
      'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\' viewBox=\'0 0 120 120\'><g fill=\'none\' stroke=\'%23b08840\' stroke-width=\'0.7\' opacity=\'0.05\'><path d=\'M20 30l8-14 8 14h-16zM60 30l8-14 8 14h-16z\'/><path d=\'M84 22l8 14h-16zM44 66h16l-8-14z\'/><circle cx=\'30\' cy=\'90\' r=\'7\'/><circle cx=\'90\' cy=\'90\' r=\'7\'/></g></svg>")',

    /* ── Film grain SVG noise (jemnější než temna-cerven 0.55 → 0.18) ── */
    '--theme-grain-pattern':
      'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'2\' stitchTiles=\'stitch\'/><feColorMatrix values=\'0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.25 0\'/></filter><rect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.4\'/></svg>")',

    /* ── Surfaces (heraldic steel plate, no glassmorphism — solid material) ── */
    '--theme-surface':         'rgba(37, 40, 48, 0.96)',
    '--theme-surface-strong':  'rgba(26, 29, 38, 0.98)',
    '--theme-surface-soft':    'rgba(28, 34, 48, 0.65)',

    /* ── Steel (forged dark — pozadí + sidebars + cards) ── */
    '--theme-steel-deep':      '#13141a',
    '--theme-steel-mid':       '#1a1d26',
    '--theme-steel-niche':     '#1c2230',  /* match inner niche v assetech */
    '--theme-steel-card':      '#252830',
    '--theme-steel-card-hi':   '#2c2f38',

    /* ── Silver (strukturální skeleton — rámy, border outer) ── */
    '--theme-silver-bright':   '#e8ecf0',
    '--theme-silver-base':     '#c8ccd2',
    '--theme-silver-shadow':   '#5a5e66',

    /* ── Bronze/vermeil (dominantní ornamental materiál — gold-leaf engraving) ── */
    '--theme-bronze-deep':     '#5a4220',
    '--theme-bronze-warm':     '#b08840',  /* base */
    '--theme-bronze-bright':   '#d4a850',  /* highlight */
    '--theme-gold-leaf':       '#e8c860',  /* signature accent */

    /* ── Phoenix radiance (centrální sjednotitel — gold-white halo) ── */
    '--theme-phoenix-radiance':'#ffe8a8',
    '--theme-phoenix-glow':    '#ffd680',

    /* ── 4 Cardinal cabochon gems (4 živly) ── */
    '--theme-ruby':            '#c8202a',  /* OHEŇ */
    '--theme-ruby-glow':       '#f04050',
    '--theme-sapphire':        '#2050b0',  /* VODA */
    '--theme-sapphire-glow':   '#4080e0',
    '--theme-emerald':         '#2a8050',  /* ZEMĚ */
    '--theme-emerald-glow':    '#50b070',
    '--theme-topaz':           '#e8d480',  /* VZDUCH */
    '--theme-topaz-glow':      '#fff0c0',

    /* ── Text (warm parchment — porcelain pleť hrdiny) ── */
    '--theme-text-pale':       '#e8dac0',
    '--theme-text-muted':      '#98886a',
    '--theme-text-dim':        '#5a4a38',
    '--theme-heading':         '#e8dac0',

    /* ── Borders ── */
    '--theme-border':          'rgba(176, 136, 64, 0.32)',
    '--theme-border-soft':     'rgba(58, 48, 36, 0.50)',
    '--theme-border-strong':   '#b08840',
    '--theme-border-silver':   'rgba(200, 204, 210, 0.40)',
    '--theme-border-bronze':   'rgba(176, 136, 64, 0.55)',
    '--theme-border-gold':     'rgba(232, 200, 96, 0.45)',

    /* ── Glows & shadows ── */
    '--theme-glow-bronze':         'rgba(176, 136, 64, 0.45)',
    '--theme-glow-bronze-strong':  'rgba(212, 168, 80, 0.70)',
    '--theme-glow-gold':           'rgba(232, 200, 96, 0.55)',
    '--theme-glow-phoenix':        'rgba(255, 232, 168, 0.50)',
    '--theme-glow-silver':         'rgba(232, 236, 240, 0.30)',
    '--theme-shadow':              'rgba(0, 0, 0, 0.85)',
    '--theme-inner-shadow':
      'inset 0 1px 0 rgba(232, 236, 240, 0.08), inset 0 -2px 6px rgba(0, 0, 0, 0.6)',

    /* ── Nav hover/active ── */
    '--theme-nav-hover-bg':    'rgba(176, 136, 64, 0.18)',
    '--theme-nav-active-bg':
      'linear-gradient(180deg, rgba(90, 66, 32, 0.6), rgba(28, 34, 48, 0.85))',

    /* ── Legacy tokeny (mapped na ctyri-zivly paletu) ── */
    '--bg-primary':       '#13141a',
    '--bg-secondary':     '#1a1d26',
    '--bg-card':          'var(--theme-surface)',
    '--bg-card-hover':    'var(--theme-steel-card-hi)',
    '--accent':           'var(--theme-bronze-warm)',
    '--accent-bright':    'var(--theme-bronze-bright)',
    '--accent-dim':       'var(--theme-bronze-deep)',
    '--accent-soft':      'rgba(176, 136, 64, 0.16)',
    '--text-primary':     'var(--theme-text-pale)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       'var(--theme-text-dim)',
    '--border':           'var(--theme-border-bronze)',
    '--border-subtle':    'rgba(176, 136, 64, 0.16)',
    '--border-strong':    'var(--theme-bronze-warm)',
    '--success':              'var(--theme-emerald)',
    '--success-soft':         'rgba(42, 128, 80, 0.16)',
    '--success-soft-border':  'rgba(42, 128, 80, 0.40)',
    '--warning':              'var(--theme-bronze-bright)',
    '--warning-soft':         'rgba(212, 168, 80, 0.14)',
    '--warning-soft-border':  'rgba(212, 168, 80, 0.40)',
    '--danger':               'var(--theme-ruby)',
    '--danger-soft':          'rgba(200, 32, 42, 0.14)',
    '--danger-soft-border':   'rgba(200, 32, 42, 0.40)',
    '--danger-focus-ring':    'rgba(200, 32, 42, 0.30)',
    '--info':                 'var(--theme-sapphire)',
    '--text-on-accent':       '#13141a',
    '--text-on-danger':       '#ffffff',
    '--bg-overlay':           'rgba(8, 10, 16, 0.7)',

    /* ── Typography ──
       Display: MedievalSharp (heraldic gothic-fantasy)
       Body: Cardo (Renaissance roman)
       Signature: Pinyon Script (copperplate — sdíleno) */
    '--font-logo':    '"MedievalSharp", "Cinzel", Georgia, serif',
    '--font-display': '"MedievalSharp", "Cinzel", Georgia, serif',
    '--font-sub':     '"Cardo", "EB Garamond", Georgia, serif',
    '--font-body':    '"Cardo", "EB Garamond", Georgia, serif',
    '--font-script':  '"Pinyon Script", "Italianno", cursive',

    /* ── Layout chrome ── */
    '--header-h':            '64px',
    '--header-bg':           '#1a1d26',
    '--frame-pad-y':         '40px',
    '--frame-pad-x':         '18px',
    '--sidebar-w':           '280px',

    '--asset-logo-w':         '480px',
    '--asset-logo-w-mobile':  '280px',
    '--logo-img-display':     'block',
    '--logo-fallback-display':'none',

    /* ── Asset URLs ── */
    '--asset-logo':              `url('${decor}/logo.webp')`,
    '--asset-andel-medallion':   `url('${decor}/medailon.webp')`,
    '--asset-medailon':          `url('${decor}/medailon.webp')`,

    /* Corner ornament (master TL, mirror přes CSS) */
    '--asset-corner':            `url('${decor}/corner-tl.webp')`,
    '--asset-corner-size':       '96px',   /* welcome card */
    '--asset-corner-size-novinky':'72px',  /* novinky panel */
    '--asset-corner-size-side':  '56px',   /* sidebar + right panel */
    '--asset-corner-size-mobile':'48px',   /* všechny na mobile */
    '--frame-corner-inset':      '8px',

    /* 4 Cardinal gem markers (midpoints) */
    '--asset-cardinal-ruby':     `url('${decor}/cardinal-ruby.webp')`,      /* LEFT (oheň) */
    '--asset-cardinal-sapphire': `url('${decor}/cardinal-sapphire.webp')`,  /* RIGHT (voda) */
    '--asset-cardinal-emerald':  `url('${decor}/cardinal-emerald.webp')`,   /* BOTTOM (země) */
    '--asset-cardinal-topaz':    `url('${decor}/cardinal-topaz.webp')`,     /* TOP (vzduch) */
    '--asset-cardinal-size':     '60px',  /* welcome card */
    '--asset-cardinal-size-mobile':'36px',

    /* Signature mandala */
    '--asset-compass':           `url('${decor}/compass.webp')`,
    '--asset-compass-size':      '220px',  /* right panel bottom */
    '--asset-compass-size-tablet':'180px',

    /* Section divider (major sections) */
    '--asset-divider-chain':     `url('${decor}/divider-chain.webp')`,

    /* 7 unikátních heraldic-shield nav ikon */
    '--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
    '--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
    '--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
    '--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
    '--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
    '--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,
  },
  fonts: {
    logo: 'MedievalSharp',
    display: 'MedievalSharp',
    body: 'Cardo',
  },
  thumbnail: '/themes/thumbnails/ctyri-zivly.webp',
  background: '/themes/backgrounds/ctyri-zivly.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
