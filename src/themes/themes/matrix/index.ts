import type { Theme } from '@/themes/types';

/**
 * Matrix (krok 5.0) — světový motiv.
 *
 * Port starého Matrix design systému (`--mx-*`, `matrix.tokens.scss`) do
 * theme kontraktu Ikara. Svět prolínajících se dimenzí a realit — violet
 * + cyan, tmavé ink pozadí, hmota skla.
 *
 * Vizuální směr „dimenzionální glass / multivesmírný rift" (audit 5.0):
 * KLIDNÁ, hloubková energie — vědomě opak kyberpunkové neon-chaotičnosti
 * (stejná paleta, opačná dynamika). Ornamentální jazyk:
 *  - prizmatická refrakce okrajů panelů (violet→cyan lom světla sklem)
 *  - konstelační uzly v rozích (síť propojených bodů, ne HUD brackety)
 *  - klidný diagonální rift glow v atmosférickém overlay
 *  - hmota skla — backdrop-filter blur + jemný horní highlight
 *
 * Originalita vs. `kyberpunk` (audit §2): ŽÁDNÝ digital rain, ŽÁDNÉ HUD
 * brackety, ŽÁDNÉ CJK glyphy, ŽÁDNÝ neon flicker.
 *
 * Fonty: Unbounded (logo/display — geometrický, široký, klidný)
 *      + Exo 2 (body — technický humanistický sans).
 *
 * Scope: `world` — nabízí se jen světům, ne jako platformní motiv.
 * decorations.css scoped `[data-theme="matrix"]`.
 */

const decor = '/themes/matrix/decor';

// Helper: SVG markup → URL-encoded data-uri. Atributy v single quotes.
const svg = (markup: string) =>
  `url("data:image/svg+xml;utf8,${markup.replace(/#/g, '%23').replace(/\s+/g, ' ').trim()}")`;

// Konstelační rohový ornament — uzly spojené tenkými liniemi (violet+cyan).
// Master TL roh; ostatní 3 přes CSS scaleX/Y mirror. Prizmatický, klidný.
const CONSTELLATION_CORNER = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72' fill='none'>
  <path d='M6 40 L6 12 Q6 6 12 6 L40 6' stroke='#3fe0ff' stroke-width='1' opacity='0.45'/>
  <path d='M14 30 L14 14 L30 14' stroke='#c86dff' stroke-width='1.25' opacity='0.7'/>
  <line x1='14' y1='14' x2='30' y2='30' stroke='#8ed7ff' stroke-width='0.75' opacity='0.4'/>
  <circle cx='14' cy='14' r='2.6' fill='#c86dff'/>
  <circle cx='14' cy='14' r='5' fill='none' stroke='#c86dff' stroke-width='0.6' opacity='0.4'/>
  <circle cx='30' cy='14' r='1.6' fill='#3fe0ff'/>
  <circle cx='14' cy='30' r='1.6' fill='#3fe0ff'/>
  <circle cx='30' cy='30' r='1.1' fill='#8ed7ff' opacity='0.8'/>
  <circle cx='6' cy='40' r='1.3' fill='#3fe0ff' opacity='0.6'/>
  <circle cx='40' cy='6' r='1.3' fill='#3fe0ff' opacity='0.6'/>
</svg>
`);

// Sekční divider — uzel uprostřed prizmatické linie (violet jádro, cyan okraje).
const RIFT_DIVIDER = svg(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 12' fill='none'>
  <line x1='0' y1='6' x2='104' y2='6' stroke='#3fe0ff' stroke-width='1' opacity='0.3'/>
  <line x1='136' y1='6' x2='240' y2='6' stroke='#3fe0ff' stroke-width='1' opacity='0.3'/>
  <path d='M104 6 L120 1 L136 6 L120 11 Z' fill='none' stroke='#c86dff' stroke-width='1' opacity='0.7'/>
  <circle cx='120' cy='6' r='2' fill='#c86dff'/>
  <circle cx='120' cy='6' r='4.5' fill='none' stroke='#8ed7ff' stroke-width='0.6' opacity='0.45'/>
</svg>
`);

export const matrixTheme: Theme = {
  id: 'matrix',
  name: 'Matrix',
  scope: 'world',
  atmosphere:
    'Matrix — svět prolínajících se dimenzí, glass panely a klidný multivesmírný rift v cyan + violet',
  vars: {
    // ── Atmosférický overlay nad theme.background (klidný darken, žádné blikání) ──
    '--theme-bg-overlay':
      'radial-gradient(ellipse 120% 90% at 70% 25%, rgba(120, 90, 255, 0.14) 0%, transparent 55%), linear-gradient(180deg, rgba(7, 8, 18, 0.42) 0%, rgba(7, 8, 18, 0.68) 100%)',

    // ── Glass surfaces (port --mx-surface-*) ──
    '--theme-surface': 'rgba(18, 12, 52, 0.62)',
    '--theme-surface-strong': 'rgba(12, 10, 34, 0.9)',
    '--theme-surface-soft': 'rgba(14, 9, 40, 0.4)',

    // ── Borders (port --mx-bd-*) ──
    '--theme-border': 'rgba(185, 120, 255, 0.5)',
    '--theme-border-soft': 'rgba(165, 125, 255, 0.24)',
    '--theme-border-cyan': 'rgba(80, 220, 255, 0.55)',

    // ── Text (port --mx-text-*) ──
    '--theme-text': '#d2d6e8',
    '--theme-text-muted': '#9aa0c2',
    '--theme-heading': '#e8d9ff',

    // ── Accents (violet brand + cyan sekundár) ──
    '--theme-accent': '#c86dff',
    '--theme-accent-bright': '#e0a8ff',
    '--theme-accent-cyan': '#3fe0ff',

    // ── Glow / shadow ──
    '--theme-glow-violet': 'rgba(200, 109, 255, 0.42)',
    '--theme-glow-gold': 'rgba(200, 109, 255, 0.42)',
    '--theme-glow-cyan': 'rgba(63, 224, 255, 0.4)',
    '--theme-shadow': 'rgba(2, 4, 16, 0.78)',

    // ── Nav (flat-glow) interactive states ──
    '--theme-nav-hover-bg': 'rgba(200, 109, 255, 0.1)',
    '--theme-nav-active-bg':
      'linear-gradient(90deg, rgba(200, 109, 255, 0.2) 0%, rgba(63, 224, 255, 0.06) 100%)',

    // ── Prizmatická refrakce + konstelace (dimenzionální glass) ──
    '--mx-prism-edge':
      'linear-gradient(135deg, rgba(200, 109, 255, 0.55) 0%, rgba(63, 224, 255, 0.45) 100%)',
    '--mx-glass-highlight': 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    '--mx-glass-blur': '14px',
    '--asset-corner': CONSTELLATION_CORNER,
    '--asset-corner-size': '64px',
    '--asset-corner-size-mobile': '36px',
    '--section-divider-asset': RIFT_DIVIDER,
    '--section-divider':
      'linear-gradient(90deg, transparent 0%, rgba(200,109,255,0.55) 50%, transparent 100%)',
    '--header-band-h': '5px',
    '--panel-inner-border': 'rgba(165, 125, 255, 0.2)',
    '--panel-inner-inset': '7px',

    // ── Legacy color tokeny — namapované na Matrix paletu ──
    '--bg-primary': '#070812',
    '--bg-secondary': '#0c0a22',
    '--bg-card': 'var(--theme-surface)',
    '--bg-card-hover': 'var(--theme-surface-soft)',
    '--accent': 'var(--theme-accent)',
    '--accent-bright': 'var(--theme-accent-bright)',
    '--accent-dim': '#5a3a99',
    '--accent-soft': 'var(--theme-border-soft)',
    '--text-primary': 'var(--theme-text)',
    '--text-secondary': 'var(--theme-text-muted)',
    '--text-muted': '#5e6488',
    '--border': 'var(--theme-border-soft)',
    '--border-subtle': 'rgba(165, 125, 255, 0.14)',
    '--border-strong': 'var(--theme-border)',
    '--success': '#3cffa0',
    '--success-soft': 'rgba(60, 255, 160, 0.14)',
    '--success-soft-border': 'rgba(60, 255, 160, 0.32)',
    '--warning': '#f3d26b',
    '--warning-soft': 'rgba(243, 210, 107, 0.14)',
    '--warning-soft-border': 'rgba(243, 210, 107, 0.32)',
    '--danger': '#ff5064',
    '--danger-soft': 'rgba(255, 80, 100, 0.16)',
    '--danger-soft-border': 'rgba(255, 80, 100, 0.34)',
    '--danger-focus-ring': 'rgba(255, 80, 100, 0.24)',
    '--info': '#3fe0ff',
    '--text-on-accent': '#0a0618',
    '--text-on-danger': '#fff5f6',
    '--bg-overlay': 'rgba(7, 8, 18, 0.72)',

    // ── Typography (Unbounded + Exo 2 — audit §3) ──
    '--font-logo': '"Unbounded", "Sora", sans-serif',
    '--font-display': '"Unbounded", "Sora", sans-serif',
    '--font-script': '"Unbounded", "Sora", sans-serif',
    '--font-body': '"Exo 2", "Segoe UI", sans-serif',

    // ── Layout chrome ──
    '--header-h': '64px',
    '--header-bg':
      'linear-gradient(90deg, rgba(18,12,52,0.94) 0%, rgba(12,10,34,0.92) 100%)',
    '--frame-pad-y': '40px',
    '--frame-pad-x': '18px',
    '--sidebar-w': '280px',

    // ── Logo asset (port matrix-logo.png) ──
    '--asset-logo': `url('${decor}/logo.webp')`,
    '--asset-logo-w': '300px',
    '--asset-logo-w-mobile': '190px',
    '--logo-img-display': 'block',
    '--logo-fallback-display': 'none',
  },
  fonts: {
    logo: 'Unbounded',
    display: 'Unbounded',
    body: 'Exo 2',
  },
  thumbnail: '/themes/thumbnails/matrix.webp',
  background: '/themes/backgrounds/matrix.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
