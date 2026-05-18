import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Psychologický horor" (`.skin-psycho`).
 * Fialové delirium — zkreslená mysl. Pozadí sdílené s `nemrtvi`.
 */
export const psychoTheme: Theme = {
  id: 'psycho',
  name: 'Psychologický horor',
  scope: 'world',
  atmosphere: 'Fialové delirium — zkreslené perspektivy a tichý strach',
  vars: buildSkinVars({
    bgPrimary: '#0c0010',
    bgSecondary: '#1a0028',
    bgOverlay:
      'linear-gradient(160deg, rgba(10,0,14,0.55) 0%, rgba(4,0,6,0.85) 100%)',
    surface: 'rgba(26,2,38,0.8)',
    surfaceStrong: 'rgba(14,0,20,0.92)',
    surfaceSoft: 'rgba(44,8,62,0.5)',
    border: 'rgba(206,147,216,0.44)',
    borderSoft: 'rgba(123,31,162,0.32)',
    borderSecondary: 'rgba(74,20,140,0.5)',
    text: '#f3e5f5',
    textMuted: '#bca0c6',
    textDim: '#6e5878',
    heading: '#ce93d8',
    accent: '#7b1fa2',
    accentBright: '#ce93d8',
    accentSecondary: '#4a148c',
    accentDim: '#3a0a52',
    glow: 'rgba(123,31,162,0.5)',
    glowSecondary: 'rgba(206,147,216,0.4)',
    navHoverBg: 'rgba(123,31,162,0.14)',
    navActiveBg:
      'linear-gradient(90deg, rgba(123,31,162,0.26) 0%, rgba(123,31,162,0) 100%)',
    textOnAccent: '#f3e5f5',
    fontLogo: '"Cormorant Garamond", Georgia, serif',
    fontDisplay: '"Cormorant Garamond", Georgia, serif',
    fontBody: '"Lora", Georgia, serif',
  }),
  fonts: {
    logo: 'Cormorant Garamond',
    display: 'Cormorant Garamond',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/nemrtvi.webp',
  background: '/themes/backgrounds/nemrtvi.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
