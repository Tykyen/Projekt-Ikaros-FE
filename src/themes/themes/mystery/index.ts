import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.7i — skin „Mystery". Detektivní noir: deštivá městská ulice,
 * žluté světlo pouliční lampy v šedomodré mlze.
 */
export const mysteryTheme: Theme = {
  id: 'mystery',
  name: 'Mystery',
  scope: 'world',
  atmosphere: 'Deštivá noirová ulice — žluté světlo lampy v šedomodré mlze',
  vars: buildSkinVars({
    bgPrimary: '#0c0f14',
    bgSecondary: '#161b24',
    bgOverlay:
      'linear-gradient(180deg, rgba(8,10,14,0.2) 0%, rgba(8,10,14,0.5) 100%)',
    surface: 'rgba(22,27,36,0.78)',
    surfaceStrong: 'rgba(9,12,17,0.92)',
    surfaceSoft: 'rgba(34,42,54,0.46)',
    border: 'rgba(216,162,74,0.46)',
    borderSoft: 'rgba(216,162,74,0.24)',
    borderSecondary: 'rgba(94,116,136,0.42)',
    text: '#d2d4d8',
    textMuted: '#8a909c',
    textDim: '#525964',
    heading: '#e4e2da',
    accent: '#d8a24a',
    accentBright: '#f0c878',
    accentSecondary: '#5e7488',
    accentDim: '#5a4420',
    glow: 'rgba(216,162,74,0.34)',
    glowSecondary: 'rgba(94,116,136,0.3)',
    navHoverBg: 'rgba(216,162,74,0.09)',
    navActiveBg:
      'linear-gradient(90deg, rgba(216,162,74,0.18) 0%, rgba(216,162,74,0) 100%)',
    textOnAccent: '#0c0f14',
    fontLogo: '"Cinzel", Georgia, serif',
    fontDisplay: '"Cinzel", Georgia, serif',
    fontBody: '"Crimson Pro", Georgia, serif',
  }),
  fonts: { logo: 'Cinzel', display: 'Cinzel', body: 'Crimson Pro' },
  thumbnail: '/themes/thumbnails/mystery.webp',
  background: '/themes/backgrounds/mystery.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
