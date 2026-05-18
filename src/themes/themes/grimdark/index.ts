import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Grimdark" (`.skin-grimdark`).
 * Beznaděj bez východu — hlubinné stíny a rudé rány. Pozadí `temna-cerven`.
 */
export const grimdarkTheme: Theme = {
  id: 'grimdark',
  name: 'Grimdark',
  scope: 'world',
  atmosphere: 'Beznaděj bez východu — hlubinné stíny a slabé rudé světlo',
  vars: buildSkinVars({
    bgPrimary: '#080809',
    bgSecondary: '#120c0e',
    bgOverlay:
      'linear-gradient(180deg, rgba(6,6,7,0.62) 0%, rgba(0,0,1,0.92) 100%)',
    surface: 'rgba(22,18,20,0.86)',
    surfaceStrong: 'rgba(12,8,10,0.94)',
    surfaceSoft: 'rgba(38,30,32,0.5)',
    border: 'rgba(183,28,28,0.42)',
    borderSoft: 'rgba(120,90,92,0.28)',
    borderSecondary: 'rgba(239,83,80,0.3)',
    text: '#d8d4d4',
    textMuted: '#9a9092',
    textDim: '#5a5052',
    heading: '#ef5350',
    accent: '#b71c1c',
    accentBright: '#ef5350',
    accentSecondary: '#7a1416',
    accentDim: '#4a0c0c',
    glow: 'rgba(183,28,28,0.4)',
    glowSecondary: 'rgba(239,83,80,0.3)',
    navHoverBg: 'rgba(183,28,28,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(183,28,28,0.2) 0%, rgba(183,28,28,0) 100%)',
    textOnAccent: '#f0e8e8',
    fontLogo: '"Cormorant Garamond", Georgia, serif',
    fontDisplay: '"Cormorant Garamond", Georgia, serif',
    fontBody: '"Lora", Georgia, serif',
  }),
  fonts: {
    logo: 'Cormorant Garamond',
    display: 'Cormorant Garamond',
    body: 'Lora',
  },
  thumbnail: '/themes/thumbnails/temna-cerven.webp',
  background: '/themes/backgrounds/temna-cerven.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
