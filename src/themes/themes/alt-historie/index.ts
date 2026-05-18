import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Alternativní historie" (`.skin-althistory`).
 * Historické archivy — pergamen a hnědý inkoust. Pozadí sdílené s `pergamen`.
 */
export const altHistorieTheme: Theme = {
  id: 'alt-historie',
  name: 'Alternativní historie',
  scope: 'world',
  atmosphere: 'Historické archivy — zažloutlý pergamen a hnědý inkoust',
  vars: buildSkinVars({
    bgPrimary: '#1a120b',
    bgSecondary: '#281c10',
    bgOverlay:
      'linear-gradient(170deg, rgba(20,14,8,0.45) 0%, rgba(12,8,4,0.72) 100%)',
    surface: 'rgba(40,28,18,0.78)',
    surfaceStrong: 'rgba(26,18,11,0.9)',
    surfaceSoft: 'rgba(64,46,30,0.46)',
    border: 'rgba(141,110,99,0.5)',
    borderSoft: 'rgba(141,110,99,0.28)',
    borderSecondary: 'rgba(215,204,200,0.32)',
    text: '#efebe9',
    textMuted: '#c2b4a6',
    textDim: '#7a6a58',
    heading: '#d7ccc8',
    accent: '#a98a6a',
    accentBright: '#d7ccc8',
    accentSecondary: '#8d6e63',
    accentDim: '#5d4037',
    glow: 'rgba(141,110,99,0.38)',
    glowSecondary: 'rgba(215,204,200,0.3)',
    navHoverBg: 'rgba(169,138,106,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(141,110,99,0.22) 0%, rgba(141,110,99,0) 100%)',
    textOnAccent: '#1a120b',
    fontLogo: '"Cormorant Garamond", Georgia, serif',
    fontDisplay: '"Cormorant Garamond", Georgia, serif',
    fontBody: '"Lora", Georgia, serif',
  }),
  fonts: {
    logo: 'Cormorant Garamond',
    display: 'Cormorant Garamond',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/pergamen.webp',
  background: '/themes/backgrounds/pergamen.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
