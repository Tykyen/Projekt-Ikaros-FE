import type { Theme } from '@/themes/types';

const decor = '/themes/arabsky-svet/decor';

/**
 * Arabský svět (spec 1.0r).
 *
 * Noční komnata sultánova paláce, 1001 nocí. Mašrabíja výhled na zlato-tyrkysovou
 * báň a minarety za soumrakem, krescentní měsíc + Plejády, hedvábné samet závěsy
 * bordó, perské koberce v popředí, mosazné lucerny + dallah + narghile v rozích.
 *
 * Materiály: tmavé ořechové dřevo + multifoil mauresque zlato s vsazenými drahokamy
 * (rubíny, smaragdy, tyrkysy) + mosaz + tyrkysové kachle + bordó samet + damaškové
 * růžové okvětní lístky + kouř + perský koberec.
 *
 * Originální motivy (žádný jiný skin nemá):
 * - Mukarnasová římsa pod topbarem (voštinová stalaktitová struktura)
 * - Mašrabíja girih hairline pod topbarem (8-cípé hvězdy)
 * - Rose petal drift 3 vrstvy parallax (damask + gold flakes, 90s/120s/150s)
 * - Kouř z narghile (vlnitá ribbon stoupá z pravého dolního rohu, 8s)
 * - Lampa génia v rohu hlavního panelu + mikro-puff 8s + caustic glow 4s breathe
 * - Welcome card jako "odhrnutý hedvábný závěs" se scattered rose petals + persian
 *   rug strip + tyrkysový multifoil border + 4× zlato-rubín-smaragd corners +
 *   Šeherezádin signature self-draw (1× per session)
 * - Active nav: arabesque vine left-border s rubínovým krystalem + Hamsa stamp
 * - Girih watermarks (Star-8, Cross, Pentagon, Decagon) v rozích sekcí
 *
 * Fonty: Pinyon Script (logo fallback) + Cinzel Decorative (display palace
 * inscription) + Cormorant Garamond (body humanist manuskript) + Tangerine
 * (signature italic). Kombinace unikátní pro arabsky-svet.
 *
 * 17 assetů: logo + medailon + background (user dodal) + 14 AI gen
 * (corner-tl + mukarnas-cornice + narghile-smoke + genie-lamp + caustic-glow +
 * carpet-strip + rose-petals-scatter + 7× nav ikony). Plus inline SVG data-uri
 * v `vars` (girih, hamsa, arabesque vine, rose stamp, rose petal drift 3 vrstvy).
 *
 * Scope: [data-theme="arabsky-svet"], žádný globální dopad.
 */

// 8-cípá hvězda (girih khatam) — dva překryté čtverce
const GIRIH_STAR_8 =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none' stroke='%23a87830' stroke-width='2' stroke-linejoin='round'><rect x='14' y='14' width='36' height='36'/><rect x='14' y='14' width='36' height='36' transform='rotate(45 32 32)'/><circle cx='32' cy='32' r='3' fill='%23a87830'/></svg>\")";

// Girih cross (4-cípý kříž s hvězdou uprostřed)
const GIRIH_CROSS =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none' stroke='%23a87830' stroke-width='2' stroke-linejoin='round'><path d='M32 6 L40 24 L58 32 L40 40 L32 58 L24 40 L6 32 L24 24 Z'/><circle cx='32' cy='32' r='4'/></svg>\")";

// Pentagon (5-úhelník s vnitřní 5-cípou hvězdou)
const GIRIH_PENTAGON =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none' stroke='%23a87830' stroke-width='2' stroke-linejoin='round'><path d='M32 6 L56 22 L48 50 L16 50 L8 22 Z'/><path d='M32 18 L40 28 L52 28 L42 36 L46 48 L32 40 L18 48 L22 36 L12 28 L24 28 Z'/></svg>\")";

// Decagon (10-úhelník — rare luxus accent)
const GIRIH_DECAGON =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none' stroke='%23a87830' stroke-width='2' stroke-linejoin='round'><path d='M32 4 L48 10 L58 24 L58 40 L48 54 L32 60 L16 54 L6 40 L6 24 L16 10 Z'/><circle cx='32' cy='32' r='6'/></svg>\")";

// Arabesque vine s rubínovým krystalem — pro active nav left-border (vertikální)
const ARABESQUE_VINE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 64' fill='none' stroke='%23e8c060' stroke-width='1.5' stroke-linecap='round'><path d='M4 4 Q1 12 4 20 Q7 28 4 36 Q1 44 4 52'/><path d='M4 14 Q7 16 6 18' fill='%23e8c060'/><path d='M4 30 Q1 32 2 34' fill='%23e8c060'/><circle cx='4' cy='58' r='2.5' fill='%23a8283c' stroke='%23d8485c' stroke-width='0.5'/></svg>\")";

// Hamsa (Hand of Fatima) outline — talisman ochrany v rohu active nav
const HAMSA_STAMP =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none' stroke='%23e8c060' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'><path d='M20 28 Q20 20 24 16 Q26 18 26 24 L26 32 M30 24 Q30 14 32 12 Q34 14 34 24 L34 32 M38 24 Q38 16 42 14 Q44 16 44 24 L44 32 M14 32 Q14 26 16 26 Q18 28 18 32 L18 36 M48 32 Q48 26 50 26 Q52 28 52 32 L52 36 M14 36 Q14 50 32 56 Q50 50 50 36'/><circle cx='32' cy='40' r='4' fill='none' stroke='%23a8283c' stroke-width='1.5'/></svg>\")";

// Damaškové růže silueta — pro rightAddBtn ::before
const ROSE_STAMP =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='%23c8385a'><path d='M16 6 Q12 8 11 12 Q8 11 6 14 Q5 18 8 20 Q6 23 10 25 Q14 27 16 24 Q18 27 22 25 Q26 23 24 20 Q27 18 26 14 Q24 11 21 12 Q20 8 16 6 Z' opacity='0.85'/><circle cx='16' cy='16' r='3' fill='%23a8283c'/></svg>\")";

// Rose petal drift — 3 vrstvy parallax (near/mid/far)
// Near: 800×800 tile, 6 petals damask + 2 gold flakes, větší (10-14px), opacity ~0.55
const ROSE_PETAL_NEAR =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'><g><ellipse cx='80' cy='120' rx='8' ry='5' fill='%23c8385a' opacity='0.60' transform='rotate(35 80 120)'/><ellipse cx='340' cy='220' rx='9' ry='6' fill='%23d85878' opacity='0.55' transform='rotate(72 340 220)'/><ellipse cx='620' cy='380' rx='7' ry='4' fill='%23e8b040' opacity='0.50' transform='rotate(20 620 380)'/><ellipse cx='180' cy='540' rx='8' ry='5' fill='%23c8385a' opacity='0.55' transform='rotate(110 180 540)'/><ellipse cx='460' cy='680' rx='10' ry='6' fill='%23d85878' opacity='0.62' transform='rotate(45 460 680)'/><ellipse cx='700' cy='720' rx='7' ry='4' fill='%23e8c060' opacity='0.48' transform='rotate(160 700 720)'/></g></svg>\")";

// Mid: 240×240 tile, 6 petals, střední (6-9px), opacity ~0.40
const ROSE_PETAL_MID =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><g><ellipse cx='40' cy='60' rx='5' ry='3' fill='%23c8385a' opacity='0.45' transform='rotate(45 40 60)'/><ellipse cx='150' cy='30' rx='6' ry='4' fill='%23d85878' opacity='0.40' transform='rotate(20 150 30)'/><ellipse cx='200' cy='130' rx='5' ry='3' fill='%23e8b040' opacity='0.35' transform='rotate(85 200 130)'/><ellipse cx='100' cy='170' rx='6' ry='4' fill='%23c8385a' opacity='0.42' transform='rotate(130 100 170)'/><ellipse cx='180' cy='200' rx='4' ry='3' fill='%23d85878' opacity='0.38' transform='rotate(60 180 200)'/></g></svg>\")";

// Far: 180×180 tile, 4 petals, drobné (3-5px), opacity ~0.30
const ROSE_PETAL_FAR =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><g><ellipse cx='30' cy='50' rx='3' ry='2' fill='%23c8385a' opacity='0.30' transform='rotate(45 30 50)'/><ellipse cx='100' cy='30' rx='4' ry='2.5' fill='%23d85878' opacity='0.28' transform='rotate(70 100 30)'/><ellipse cx='80' cy='130' rx='3' ry='2' fill='%23e8b040' opacity='0.25' transform='rotate(120 80 130)'/><ellipse cx='150' cy='100' rx='3.5' ry='2' fill='%23c8385a' opacity='0.32' transform='rotate(30 150 100)'/></g></svg>\")";

export const arabskySvetTheme: Theme = {
  id: 'arabsky-svet',
  name: 'Arabský svět',
  scope: 'both',
  atmosphere:
    'Arabský svět — noční komnata sultánova paláce, mašrabíja výhled na zlato-tyrkysovou báň, hedvábí + zlato + kouř + káva + růžové okvětní lístky',
  vars: {
    /* ── Background overlay (radial vignette + linear darken — BG je už dramatic) ── */
    '--theme-bg-overlay':
      'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(10, 14, 44, 0.45) 100%), linear-gradient(180deg, rgba(10, 14, 44, 0.20) 0%, rgba(10, 14, 44, 0.45) 100%)',

    /* ── Surfaces (midnight indigo panely) ── */
    '--theme-surface':        'rgba(14, 26, 58, 0.88)',
    '--theme-surface-strong': 'rgba(10, 14, 44, 0.94)',
    '--theme-surface-soft':   'rgba(14, 26, 58, 0.55)',

    /* ── Midnight night palette ── */
    '--theme-midnight-night':   '#0a0e2c',
    '--theme-midnight-indigo':  '#0e1a3a',
    '--theme-midnight-deep':    '#080614',

    /* ── Velvet bordo (z BG samet závěsy) ── */
    '--theme-velvet-deep':      '#5a1828',
    '--theme-velvet-warm':      '#7a1828',

    /* ── Damask rose (love + petals) ── */
    '--theme-damask-rose':      '#c8385a',
    '--theme-rose-light':       '#d85878',

    /* ── Gold (multifoil + ornamenty) ── */
    '--theme-saffron-gold':     '#e8b040',
    '--theme-polished-gold':    '#e8c060',
    '--theme-patinated-gold':   '#a87830',

    /* ── Dark walnut wood (logo + medailon + icon frames) ── */
    '--theme-walnut-deep':      '#1a0a08',
    '--theme-walnut-warm':      '#2a1408',
    '--theme-walnut-highlight': '#4a2818',

    /* ── Brass (lucerny + dallah + narghile) ── */
    '--theme-brass-deep':       '#5a3210',
    '--theme-brass-warm':       '#b87830',
    '--theme-brass-bright':     '#d49850',

    /* ── Turquoise (báň + headlines) ── */
    '--theme-turquoise-deep':   '#1a8a8a',
    '--theme-turquoise-bright': '#2ac4c4',

    /* ── Royal purple (rare luxus) ── */
    '--theme-royal-purple':     '#4a1850',

    /* ── Crystals (drahokamy v ornamentech) ── */
    '--theme-ruby-crystal':     '#a8283c',
    '--theme-emerald-jewel':    '#1a6a4a',

    /* ── Smoke (z narghile) ── */
    '--theme-smoke-gray':       '#3a3548',

    /* ── Pearl ivory (text na tmavém pozadí) ── */
    '--theme-pearl-ivory':      '#f0e4c8',

    /* ── Borders ── */
    '--theme-border':           'rgba(168, 120, 48, 0.55)',
    '--theme-border-soft':      'rgba(168, 120, 48, 0.28)',
    '--theme-border-strong':    'rgba(232, 192, 96, 0.72)',
    '--theme-border-turquoise': 'rgba(26, 138, 138, 0.55)',

    /* ── Text (WCAG safe) ── */
    '--theme-text':              '#f0e4c8',
    '--theme-text-muted':        '#b08868',
    '--theme-heading':           '#2ac4c4',
    '--theme-text-on-gold':      '#1a0a08',

    /* ── Accents legacy aliasy ── */
    '--theme-accent':            '#1a8a8a',
    '--theme-accent-bright':     '#2ac4c4',
    '--theme-accent-gold':       '#e8b040',
    '--theme-accent-gold-bright':'#e8c060',
    '--theme-accent-rose':       '#c8385a',

    /* ── Glows ── */
    '--theme-glow-saffron':         'rgba(232, 176, 64, 0.45)',
    '--theme-glow-saffron-strong':  'rgba(232, 192, 96, 0.70)',
    '--theme-glow-turquoise':       'rgba(26, 138, 138, 0.50)',
    '--theme-glow-rose':            'rgba(200, 56, 90, 0.40)',
    '--theme-shadow':               'rgba(10, 14, 44, 0.85)',

    /* ── Nav hover/active ── */
    '--theme-nav-hover-bg':      'rgba(232, 176, 64, 0.14)',
    '--theme-nav-active-bg':
      'linear-gradient(90deg, rgba(232, 176, 64, 0.32) 0%, rgba(10, 14, 44, 0.85) 100%)',

    /* ── Legacy tokeny (mapped na arabskou paletu) ── */
    '--bg-primary':       '#0a0e2c',
    '--bg-secondary':     '#0e1a3a',
    '--bg-card':          '#0e1a3a',
    '--bg-card-hover':    '#16224a',
    '--accent':           '#1a8a8a',
    '--accent-bright':    '#2ac4c4',
    '--accent-dim':       '#0a4a4a',
    '--accent-soft':      'rgba(26, 138, 138, 0.16)',
    '--text-primary':     '#f0e4c8',
    '--text-secondary':   '#b08868',
    '--text-muted':       '#806840',
    '--border':           'rgba(168, 120, 48, 0.28)',
    '--border-subtle':    'rgba(168, 120, 48, 0.16)',
    '--border-strong':    'rgba(232, 192, 96, 0.72)',
    '--success':              '#4a8848',
    '--success-soft':         'rgba(74, 136, 72, 0.14)',
    '--success-soft-border':  'rgba(74, 136, 72, 0.4)',
    '--warning':              '#e8b040',
    '--warning-soft':         'rgba(232, 176, 64, 0.14)',
    '--warning-soft-border':  'rgba(232, 176, 64, 0.4)',
    '--danger':               '#a8283c',
    '--danger-soft':          'rgba(168, 40, 60, 0.16)',
    '--danger-soft-border':   'rgba(168, 40, 60, 0.4)',
    '--danger-focus-ring':    'rgba(168, 40, 60, 0.3)',
    '--info':                 '#1a8a8a',
    '--text-on-accent':       '#1a0a08',
    '--text-on-danger':       '#f0e4c8',
    '--bg-overlay':           'rgba(10, 14, 44, 0.72)',

    /* ── Typography ── */
    '--font-logo':           '"Pinyon Script", "Allura", Georgia, cursive',
    '--font-display':        '"Cinzel Decorative", "Cormorant SC", Georgia, serif',
    '--font-tribal-accent':  '"Cinzel Decorative", "Cormorant SC", Georgia, serif',
    '--font-body':           '"Cormorant Garamond", "Cormorant", Georgia, serif',
    '--font-script':         '"Tangerine", "Italianno", Georgia, cursive',

    /* ── Layout chrome ── */
    '--header-h':              '56px',
    '--header-bg':             '#0a0508',
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

    /* Corner ornament — multifoil zlato s drahokamy (master TL, mirror přes CSS) */
    '--asset-corner':            `url('${decor}/corner-tl.webp')`,
    '--asset-corner-size':       '72px',
    '--asset-corner-size-mobile':'38px',
    '--frame-corner-inset':      '6px',

    /* Decorative scene assets */
    '--asset-mukarnas-cornice':    `url('${decor}/mukarnas-cornice.webp')`,
    '--asset-narghile':            `url('${decor}/narghile-smoke.webp')`,
    '--asset-genie-lamp':          `url('${decor}/genie-lamp.webp')`,
    '--asset-caustic-glow':        `url('${decor}/caustic-glow.webp')`,
    '--asset-carpet-strip':        `url('${decor}/carpet-strip.webp')`,
    '--asset-rose-petals-scatter': `url('${decor}/rose-petals-scatter.webp')`,

    /* 7 ornament nav medailonů */
    '--asset-icon-uvodnik':       `url('${decor}/icon-uvodnik.webp')`,
    '--asset-icon-vytvorit-svet': `url('${decor}/icon-vytvorit-svet.webp')`,
    '--asset-icon-diskuze':       `url('${decor}/icon-diskuze.webp')`,
    '--asset-icon-clanky':        `url('${decor}/icon-clanky.webp')`,
    '--asset-icon-galerie':       `url('${decor}/icon-galerie.webp')`,
    '--asset-icon-napoveda':      `url('${decor}/icon-napoveda.webp')`,
    '--asset-icon-hospoda':       `url('${decor}/icon-hospoda.webp')`,

    /* Girih watermarks (inline SVG data-uri, patinated gold #a87830) */
    '--asset-girih-star-8':     GIRIH_STAR_8,
    '--asset-girih-cross':      GIRIH_CROSS,
    '--asset-girih-pentagon':   GIRIH_PENTAGON,
    '--asset-girih-decagon':    GIRIH_DECAGON,

    /* Active nav SVG (inline) */
    '--asset-arabesque-vine':   ARABESQUE_VINE,
    '--asset-hamsa-stamp':      HAMSA_STAMP,

    /* Add-button stamp (inline SVG) */
    '--asset-rose-stamp':       ROSE_STAMP,

    /* Rose petal drift 3 vrstvy (inline SVG data-uri tile patterns) */
    '--asset-rose-petal-near':  ROSE_PETAL_NEAR,
    '--asset-rose-petal-mid':   ROSE_PETAL_MID,
    '--asset-rose-petal-far':   ROSE_PETAL_FAR,
  },
  fonts: {
    logo: 'Pinyon Script',
    display: 'Cinzel Decorative',
    body: 'Cormorant Garamond',
  },
  thumbnail: '/themes/thumbnails/arabsky-svet.webp',
  background: '/themes/backgrounds/arabsky-svet.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
