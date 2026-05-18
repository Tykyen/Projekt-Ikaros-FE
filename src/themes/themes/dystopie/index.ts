import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Dystopie" (`.skin-dystopia`).
 * Totalitní beton — odbarvený svět s rudými varovnými výstupky. Pozadí `severske-runy`.
 */
export const dystopieTheme: Theme = {
  id: 'dystopie',
  name: 'Dystopie',
  scope: 'world',
  atmosphere: 'Totalitní beton — šeď represe a rudé varovné světlo',
  vars: buildSkinVars({
    bgPrimary: '#0c0c0d',
    bgSecondary: '#161617',
    bgOverlay:
      'linear-gradient(180deg, rgba(10,10,11,0.55) 0%, rgba(4,4,5,0.85) 100%)',
    surface: 'rgba(26,26,28,0.82)',
    surfaceStrong: 'rgba(14,14,15,0.92)',
    surfaceSoft: 'rgba(42,42,44,0.5)',
    border: 'rgba(213,0,0,0.46)',
    borderSoft: 'rgba(120,120,122,0.3)',
    borderSecondary: 'rgba(213,0,0,0.3)',
    text: '#e4e4e6',
    textMuted: '#9a9a9c',
    textDim: '#5c5c5e',
    heading: '#ff5252',
    accent: '#d50000',
    accentBright: '#ff5252',
    accentSecondary: '#8a8a8c',
    accentDim: '#5a0000',
    glow: 'rgba(213,0,0,0.4)',
    glowSecondary: 'rgba(120,120,122,0.3)',
    navHoverBg: 'rgba(213,0,0,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(213,0,0,0.2) 0%, rgba(213,0,0,0) 100%)',
    textOnAccent: '#f4f4f4',
    fontLogo: '"Oswald", sans-serif',
    fontDisplay: '"Oswald", sans-serif',
    fontBody: '"Exo 2", system-ui, sans-serif',
  }),
  fonts: { logo: 'Oswald', display: 'Oswald', body: 'Exo 2' },
  thumbnail: '/themes/thumbnails/severske-runy.webp',
  background: '/themes/backgrounds/severske-runy.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
