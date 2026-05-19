import type { Theme } from '@/themes/types';

const decor = '/themes/africke/decor';

/**
 * Africké — „Země předků" (spec 1.0q).
 *
 * Velký horizont s vetkanou pamětí. Savana za úsvitem, monolithy, baobaby
 * a akácie na obzoru. Sandstone panely + carved bronze diamond corners
 * (převzato z medailonu uživatele) + kente weave hairline pod topbarem +
 * mudcloth band na dolní hraně welcome stély + adinkra watermarks
 * (Sankofa/Gye Nyame/Adinkrahene/Akoma) kontextové v rozích panelů.
 * Welcome card = vyrytá pískovcová stéla (statická, signaturní klid —
 * kámen předků nepulsuje). Heat shimmer + diagonal dust drift + acacia
 * shadow sway + sun ascending one-shot.
 *
 * Fonty: Allura (logo script, souznění s baked-in script v logo.webp) +
 * Yeseva One (display carved-into-stone slab serif) + Gentium Plus (body
 * humanistický klid) + Italianno (signature italic v aged-gold).
 *
 * 15 assetů (13 AI + logo + medailon): logo, medailon, corner-tl
 * (carved bronze diamond), stele-frame, mudcloth-band, baobab-corner,
 * acacia-canopy, monolith-watermark, 7× nav ikony (sandstone tablets
 * s carved relief: vycházející slunce / baobab / Akoma srdce / papyrus /
 * africké oko / Sankofa pták / ohniště). Adinkra watermarks = inline SVG
 * data-uri (Sankofa / Gye Nyame / Adinkrahene / Akoma).
 *
 * Scope: [data-theme="africke"], žádný globální dopad.
 */

// Adinkra symboly jako inline SVG data-uri (aged-gold #c8881a):
// Sankofa — stylizovaný pták s hlavou otočenou zpět (vrať se a vezmi)
const ADINKRA_SANKOFA =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none' stroke='%23c8881a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M14 50 Q18 32 30 34 Q42 36 44 24 Q44 16 38 18 Q34 19 35 24 Q36 28 41 28 L48 24 L45 30 L49 32'/><circle cx='39' cy='22' r='1.5' fill='%23c8881a'/></svg>\")";

// Gye Nyame — „kromě Boha" (zjednodušená spirála s paprsky)
const ADINKRA_GYE_NYAME =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none' stroke='%23c8881a' stroke-width='3' stroke-linecap='round'><path d='M32 14 Q44 22 32 32 Q20 42 32 50'/><path d='M14 32 L50 32'/><path d='M20 22 L44 42'/><path d='M20 42 L44 22'/></svg>\")";

// Adinkrahene — „náčelník adinkry, vůdcovství" (3 soustředné kruhy)
const ADINKRA_ADINKRAHENE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='28' fill='none' stroke='%23c8881a' stroke-width='3'/><circle cx='32' cy='32' r='18' fill='none' stroke='%23c8881a' stroke-width='3'/><circle cx='32' cy='32' r='8' fill='%23c8881a'/></svg>\")";

// Akoma — „srdce, trpělivost a vytrvalost" (adinkra srdce s vnitřní linkou)
const ADINKRA_AKOMA =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none' stroke='%23c8881a' stroke-width='2.5' stroke-linejoin='round'><path d='M32 54 C 8 36 8 14 20 14 C 27 14 32 20 32 25 C 32 20 37 14 44 14 C 56 14 56 36 32 54 Z'/><path d='M32 46 C 14 32 14 20 22 20 C 27 20 32 24 32 28 C 32 24 37 20 42 20 C 50 20 50 32 32 46 Z'/></svg>\")";

export const africkeTheme: Theme = {
  id: 'africke',
  name: 'Země předků',
  scope: 'platform',
  atmosphere:
    'Země předků — savana za úsvitem, sandstone + carved bronze + kente weave bandy + mudcloth band, monolithy a baobaby na horizontu',
  vars: {
    /* ── Background overlay (radial vignette + linear darken — BG je už warm) ── */
    '--theme-bg-overlay':
      'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(16, 8, 4, 0.45) 100%), linear-gradient(180deg, rgba(16, 8, 4, 0.30) 0%, rgba(16, 8, 4, 0.55) 100%)',

    /* ── Surfaces (sandstone panely) ── */
    '--theme-surface':        'rgba(58, 30, 8, 0.90)',
    '--theme-surface-strong': 'rgba(42, 20, 8, 0.95)',
    '--theme-surface-soft':   'rgba(90, 51, 24, 0.55)',

    /* ── Earth materials ── */
    '--theme-earth-deep':       '#100804',
    '--theme-earth-shadow':     '#2a1408',
    '--theme-earth-laterite':   '#6a2810',
    '--theme-earth-ochre':      '#8a5028',
    '--theme-earth-dust':       '#c89878',
    '--theme-sand-pale':        '#d4a060',

    /* ── Wood (patinated, z medailonu) ── */
    '--theme-wood-dark':        '#3a1e08',
    '--theme-wood-mid':         '#5a3018',
    '--theme-wood-highlight':   '#8a5028',
    '--theme-acacia-bark':      '#5a3018',

    /* ── Bronze materials (corner-tl, ornaments) ── */
    '--theme-bronze-deep':      '#5a3210',
    '--theme-bronze-warm':      '#b87830',
    '--theme-bronze-bright':    '#d49850',

    /* ── Aged gold (ornamenty, ryté detaily) ── */
    '--theme-aged-gold':        '#c8881a',
    '--theme-aged-gold-bright': '#e8b840',

    /* ── Horizon (úsvit accent) ── */
    '--theme-horizon-dawn':     '#f4a050',
    '--theme-horizon-sun':      '#ffd078',

    /* ── Sky cobalt (rare, success states) ── */
    '--theme-sky-cobalt':       '#1a3858',

    /* ── Cream (text na tmavém pozadí) ── */
    '--theme-cream':            '#f0e0c0',

    /* ── Borders ── */
    '--theme-border':           'rgba(138, 80, 40, 0.55)',
    '--theme-border-soft':      'rgba(138, 80, 40, 0.28)',
    '--theme-border-strong':    'rgba(200, 136, 26, 0.72)',
    '--theme-border-bronze':    'var(--theme-bronze-warm)',

    /* ── Text (WCAG safe) ── */
    '--theme-text':              '#f0e0c0',
    '--theme-text-muted':        '#b08868',
    '--theme-heading':           'var(--theme-aged-gold)',
    '--theme-text-on-sandstone': '#2a1408',  /* dark text na welcome stéle */
    '--theme-text-on-gold':      '#2a1408',

    /* ── Accents legacy aliasy ── */
    '--theme-accent':            'var(--theme-horizon-dawn)',
    '--theme-accent-bright':     'var(--theme-horizon-sun)',
    '--theme-accent-gold':       'var(--theme-aged-gold)',
    '--theme-accent-gold-bright':'var(--theme-aged-gold-bright)',
    '--theme-accent-bronze':     'var(--theme-bronze-warm)',

    /* ── Glows ── */
    '--theme-glow-gold':         'rgba(200, 136, 26, 0.45)',
    '--theme-glow-gold-strong':  'rgba(232, 184, 64, 0.70)',
    '--theme-glow-horizon':      'rgba(244, 160, 80, 0.50)',
    '--theme-glow-bronze':       'rgba(184, 120, 48, 0.40)',
    '--theme-shadow':            'rgba(16, 8, 4, 0.85)',

    /* ── Nav hover/active ── */
    '--theme-nav-hover-bg':      'rgba(244, 160, 80, 0.14)',
    '--theme-nav-active-bg':
      'linear-gradient(90deg, rgba(244, 160, 80, 0.40) 0%, rgba(42, 20, 8, 0.85) 100%)',

    /* ── Legacy tokeny (mapped na africkou paletu) ── */
    '--bg-primary':       '#100804',
    '--bg-secondary':     '#2a1408',
    '--bg-card':          'var(--theme-earth-dust)',   /* sandstone — welcome stéla */
    '--bg-card-hover':    '#d8a888',
    '--accent':           'var(--theme-horizon-dawn)',
    '--accent-bright':    'var(--theme-horizon-sun)',
    '--accent-dim':       '#a86028',
    '--accent-soft':      'rgba(244, 160, 80, 0.16)',
    '--text-primary':     'var(--theme-text)',
    '--text-secondary':   'var(--theme-text-muted)',
    '--text-muted':       '#806040',
    '--border':           'var(--theme-border-soft)',
    '--border-subtle':    'rgba(138, 80, 40, 0.16)',
    '--border-strong':    'var(--theme-border-strong)',
    '--success':              '#5a8848',
    '--success-soft':         'rgba(90, 136, 72, 0.14)',
    '--success-soft-border':  'rgba(90, 136, 72, 0.4)',
    '--warning':              'var(--theme-aged-gold)',
    '--warning-soft':         'rgba(200, 136, 26, 0.14)',
    '--warning-soft-border':  'rgba(200, 136, 26, 0.4)',
    '--danger':               '#a83828',
    '--danger-soft':          'rgba(168, 56, 40, 0.16)',
    '--danger-soft-border':   'rgba(168, 56, 40, 0.4)',
    '--danger-focus-ring':    'rgba(168, 56, 40, 0.3)',
    '--info':                 'var(--theme-sky-cobalt)',
    '--text-on-accent':       'var(--theme-cream)',
    '--text-on-danger':       '#f0e0c0',
    '--bg-overlay':           'rgba(16, 8, 4, 0.72)',

    /* ── Typography (Vetkaná paměť) ── */
    '--font-logo':           '"Allura", "Pinyon Script", "Italianno", Georgia, cursive',
    '--font-display':        '"Yeseva One", "Marcellus", Georgia, serif',
    '--font-tribal-accent':  '"Yeseva One", "Marcellus", Georgia, serif',
    '--font-body':           '"Gentium Plus", "Lora", Georgia, serif',
    '--font-script':         '"Italianno", "Allura", Georgia, cursive',

    /* ── Layout chrome ── */
    '--header-h':              '56px',
    '--header-bg':             '#2a1408',
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

    /* Corner ornament — carved bronze diamond (master TL, mirror přes CSS) */
    '--asset-corner':            `url('${decor}/corner-tl.webp')`,
    '--asset-corner-size':       '72px',
    '--asset-corner-size-mobile':'38px',
    '--frame-corner-inset':      '6px',

    /* Decorative scene assets */
    '--asset-stele-frame':        `url('${decor}/stele-frame.webp')`,
    '--asset-mudcloth-band':      `url('${decor}/mudcloth-band.webp')`,
    '--asset-baobab-corner':      `url('${decor}/baobab-corner.webp')`,
    '--asset-acacia-canopy':      `url('${decor}/acacia-canopy.webp')`,
    '--asset-monolith-watermark': `url('${decor}/monolith-watermark.webp')`,

    /* 7 sandstone-tablet nav medailonů */
    '--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
    '--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
    '--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
    '--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
    '--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
    '--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,

    /* Adinkra watermarks (inline SVG data-uri, aged-gold #c8881a) */
    '--asset-adinkra-sankofa':      ADINKRA_SANKOFA,
    '--asset-adinkra-gye-nyame':    ADINKRA_GYE_NYAME,
    '--asset-adinkra-adinkrahene':  ADINKRA_ADINKRAHENE,
    '--asset-adinkra-akoma':        ADINKRA_AKOMA,
    '--asset-adinkra-active-stamp': ADINKRA_SANKOFA,
  },
  fonts: {
    logo: 'Allura',
    display: 'Yeseva One',
    body: 'Gentium Plus',
  },
  thumbnail: '/themes/thumbnails/africke.webp',
  background: '/themes/backgrounds/africke.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
