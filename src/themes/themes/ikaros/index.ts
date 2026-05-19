import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.7a — skin „Ikaros", výchozí vzhled světa a vizuální identita
 * platformy. Fialové synthwave: hvězdná obloha, neonové noční město,
 * perspektivní mřížka, světelný bod na horizontu. Signature efekt =
 * fialový Matrix rain (JS canvas, `effect: 'matrix-rain'`).
 */
export const ikarosTheme: Theme = {
  id: 'ikaros',
  name: 'Ikaros',
  scope: 'world',
  atmosphere:
    'Fialové synthwave — neonové město pod hvězdnou oblohou a déšť kódu',
  vars: buildSkinVars({
    bgPrimary: '#0c0820',
    bgSecondary: '#1a0f3a',
    bgOverlay:
      'linear-gradient(180deg, rgba(10,6,26,0.12) 0%, rgba(10,6,26,0.4) 100%)',
    surface: 'rgba(20,12,44,0.74)',
    surfaceStrong: 'rgba(10,6,26,0.9)',
    surfaceSoft: 'rgba(38,24,72,0.48)',
    border: 'rgba(169,108,255,0.5)',
    borderSoft: 'rgba(169,108,255,0.26)',
    borderSecondary: 'rgba(216,204,255,0.5)',
    text: '#ece4ff',
    textMuted: '#b3a6d4',
    textDim: '#6e6394',
    heading: '#ffffff',
    accent: '#a96cff',
    accentBright: '#c9a4ff',
    accentSecondary: '#d8ccff',
    accentDim: '#3a2470',
    glow: 'rgba(169,108,255,0.42)',
    glowSecondary: 'rgba(216,204,255,0.36)',
    navHoverBg: 'rgba(169,108,255,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(169,108,255,0.2) 0%, rgba(169,108,255,0) 100%)',
    textOnAccent: '#0c0820',
    fontLogo: '"Orbitron", "Rajdhani", sans-serif',
    fontDisplay: '"Orbitron", "Rajdhani", sans-serif',
    fontBody: '"Rajdhani", "Segoe UI", sans-serif',
  }),
  fonts: { logo: 'Orbitron', display: 'Orbitron', body: 'Rajdhani' },
  thumbnail: '/themes/thumbnails/ikaros.webp',
  background: '/themes/backgrounds/ikaros.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
  effect: 'matrix-rain',
};
