import type { Theme } from '@/themes/types';

const decor = '/themes/indiane/decor';

/**
 * Indiánské — „Strážci horizontu" (spec 1.0p).
 * Prairie soumrak, svět před západem. Patinované dřevo + železné nail studs +
 * tribal cik-cak diamond carving + napnutá kůže šamanského bubnu + korálkové
 * left-bordery + spirit smoke z aktivní nav položky + drum-beat pulse welcome
 * card (tlukoucí srdce kmene) + bead-string visící z topbaru + constellation
 * overlay nad horizontem + hearth glow zdola (země dýchá oheň).
 *
 * Fonty: Cinzel Decorative (logo ornamentální) + Cinzel (display carved
 * UPPERCASE) + Spectral (body) + Caveat (signature italic, sage-turquoise).
 *
 * 15 assetů (13 AI + logo + medailon): logo, medailon, corner-tl,
 * medailon-frame (oval pro welcome buben), drum-pictograph (4 Medicine Wheel
 * pictogramy + sun spiral), 7× nav ikony, feather-stamp, decor-fire-stones,
 * petroglyph-divider. Scope: [data-theme="indiane"], žádný globální dopad.
 */
export const indianeTheme: Theme = {
  id: 'indiane',
  name: 'Indiánské',
  scope: 'platform',
  atmosphere:
    'Strážci horizontu — prairie soumrak, patinované dřevo + železné nail studs + tribal cik-cak carving, šamanský buben jako welcome card',
  vars: {
    /* ── Background overlay (pure darken — BG je už warm/oranžový) ── */
    '--theme-bg-overlay':
      'linear-gradient(180deg, rgba(26, 12, 4, 0.45) 0%, rgba(26, 12, 4, 0.65) 100%)',

    /* ── Surfaces (patinované dřevo) ── */
    '--theme-surface':        'rgba(58, 30, 8, 0.92)',
    '--theme-surface-strong': 'rgba(42, 18, 8, 0.96)',
    '--theme-surface-soft':   'rgba(90, 51, 24, 0.55)',

    /* ── Wood materials ── */
    '--theme-wood-deep':       '#1a0c04',
    '--theme-wood-dark':       '#3a1e08',
    '--theme-wood-mid':        '#5a3318',
    '--theme-wood-highlight':  '#8a5828',

    /* ── Iron studs ── */
    '--theme-iron-dark':       '#1a1410',
    '--theme-iron-highlight':  '#4a4238',

    /* ── Leather (drum skin, kožené elementy) ── */
    '--theme-leather-cream':   '#f0e0c0',
    '--theme-leather-bone':    '#e8d8b8',

    /* ── Buffalo-blood + flame (primary accent) ── */
    '--theme-buffalo-blood':   '#c8501c',
    '--theme-buffalo-bright':  '#e86028',
    '--theme-flame':           '#ff8030',

    /* ── Prairie gold (secondary accent — text na dřevě, ornamenty) ── */
    '--theme-prairie-gold':         '#d4a050',
    '--theme-prairie-gold-bright':  '#f0c870',

    /* ── Sage turquoise (decorative accent — VZÁCNĚ, jen titleAccent + signature + empty hints) ── */
    '--theme-sage-turquoise':       '#5fc8d0',
    '--theme-sage-turquoise-deep':  '#3a8088',

    /* ── Bead palette (left-border korálky cyklus + bead-string SVG) ── */
    '--theme-bead-red':        '#c8501c',
    '--theme-bead-turquoise':  '#5fc8d0',
    '--theme-bead-gold':       '#d4a050',
    '--theme-bead-cream':      '#f0e0c0',

    /* ── Borders ── */
    '--theme-border':         'rgba(90, 51, 24, 0.62)',
    '--theme-border-soft':    'rgba(90, 51, 24, 0.30)',
    '--theme-border-strong':  'rgba(212, 160, 80, 0.72)',
    '--theme-border-iron':    'var(--theme-iron-dark)',

    /* ── Text (WCAG safe) ── */
    '--theme-text':            '#f0e0c0',
    '--theme-text-muted':      '#b08868',
    '--theme-heading':         'var(--theme-prairie-gold)',
    '--theme-text-on-leather': '#2a1208',
    '--theme-text-on-gold':    '#2a1208',

    /* ── Accents legacy aliasy ── */
    '--theme-accent':                 'var(--theme-buffalo-blood)',
    '--theme-accent-bright':          'var(--theme-buffalo-bright)',
    '--theme-accent-gold':            'var(--theme-prairie-gold)',
    '--theme-accent-gold-bright':     'var(--theme-prairie-gold-bright)',
    '--theme-accent-sage':            'var(--theme-sage-turquoise)',

    /* ── Glows ── */
    '--theme-glow-buffalo':        'rgba(200, 80, 28, 0.45)',
    '--theme-glow-buffalo-strong': 'rgba(200, 80, 28, 0.70)',
    '--theme-glow-gold':            'rgba(212, 160, 80, 0.45)',
    '--theme-glow-gold-strong':     'rgba(212, 160, 80, 0.70)',
    '--theme-glow-flame':           'rgba(255, 128, 48, 0.50)',
    '--theme-glow-sage':            'rgba(95, 200, 208, 0.40)',
    '--theme-shadow':               'rgba(26, 12, 4, 0.85)',

    /* ── Nav hover/active ── */
    '--theme-nav-hover-bg':   'rgba(200, 80, 28, 0.16)',
    '--theme-nav-active-bg':
      'linear-gradient(90deg, rgba(200, 80, 28, 0.45) 0%, rgba(58, 30, 8, 0.85) 100%)',

    /* ── Legacy tokeny (mapped na indián paletu) ── */
    '--bg-primary':       '#2a1208',
    '--bg-secondary':     '#3a1e08',
    '--bg-card':          'var(--theme-leather-cream)',
    '--bg-card-hover':    '#f5e8c8',
    '--accent':           'var(--theme-buffalo-blood)',
    '--accent-bright':    'var(--theme-buffalo-bright)',
    '--accent-dim':       '#80300c',
    '--accent-soft':      'rgba(200, 80, 28, 0.18)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       '#806040',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    'rgba(90, 51, 24, 0.16)',
    '--border-strong':    'var(--theme-border-strong)',
    '--success':              '#3a8a4e',
    '--success-soft':         'rgba(58, 138, 78, 0.14)',
    '--success-soft-border':  'rgba(58, 138, 78, 0.4)',
    '--warning':              'var(--theme-prairie-gold)',
    '--warning-soft':         'rgba(212, 160, 80, 0.14)',
    '--warning-soft-border':  'rgba(212, 160, 80, 0.4)',
    '--danger':               'var(--theme-buffalo-blood)',
    '--danger-soft':          'rgba(200, 80, 28, 0.14)',
    '--danger-soft-border':   'rgba(200, 80, 28, 0.4)',
    '--danger-focus-ring':    'rgba(200, 80, 28, 0.3)',
    '--info':                 'var(--theme-sage-turquoise)',
    '--text-on-accent':       'var(--theme-leather-cream)',
    '--text-on-danger':       '#f0e0c0',
    '--bg-overlay':           'rgba(26, 12, 4, 0.7)',

    /* ── Typography (Carved & Spoken) ── */
    '--font-logo':           '"Cinzel Decorative", "Cinzel", Georgia, serif',
    '--font-display':        '"Cinzel", "Almendra", Georgia, serif',
    '--font-tribal-accent':  '"Cinzel Decorative", "Cinzel", Georgia, serif',
    '--font-body':           '"Spectral", "Lora", Georgia, serif',
    '--font-script':         '"Caveat", "Henny Penny", Georgia, serif',

    /* ── Layout chrome ── */
    '--header-h':              '56px',
    '--header-bg':             '#3a1e08',
    '--frame-pad-y':           '40px',
    '--frame-pad-x':           '18px',
    '--sidebar-w':             '280px',
    '--asset-logo-w':          '360px',
    '--asset-logo-w-mobile':   '220px',
    '--logo-img-display':      'block',
    '--logo-fallback-display': 'none',

    /* ── Asset URLs ── */
    '--asset-logo':              `url('${decor}/logo.webp')`,
    '--asset-andel-medallion':   `url('${decor}/medailon.webp')`,
    '--asset-medailon-frame':    `url('${decor}/medailon-frame.webp')`,
    '--asset-drum-pictograph':   `url('${decor}/drum-pictograph.webp')`,

    /* Corner ornament (master TL, mirror přes CSS) */
    '--asset-corner':            `url('${decor}/corner-tl.webp')`,
    '--asset-corner-size':       '80px',
    '--asset-corner-size-mobile':'40px',
    '--frame-corner-inset':      '6px',

    /* 7 carved-oak nav medailonů */
    '--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
    '--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
    '--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
    '--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
    '--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
    '--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,

    /* Decorative assets */
    '--asset-feather-stamp':      `url('${decor}/feather-stamp.webp')`,
    '--asset-fire-stones':        `url('${decor}/decor-fire-stones.webp')`,
    '--asset-petroglyph-divider': `url('${decor}/petroglyph-divider.webp')`,
  },
  fonts: {
    logo: 'Cinzel Decorative',
    display: 'Cinzel',
    body: 'Spectral',
  },
  thumbnail: '/themes/thumbnails/indiane.webp',
  background: '/themes/backgrounds/indiane.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
