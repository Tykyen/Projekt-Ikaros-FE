import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Lovecraftovský horor" (`.skin-lovecraft`).
 * Kosmický horor hlubin — teal tma a neznámé bytosti. Pozadí `nemrtvi`.
 */
export const lovecraftTheme: Theme = {
  id: 'lovecraft',
  name: 'Lovecraftovský horor',
  scope: 'world',
  atmosphere: 'Kosmický horor hlubin — bezsvětelný oceán a neznámé bytosti',
  vars: buildSkinVars({
    bgPrimary: '#03100e',
    bgSecondary: '#0a1f1c',
    bgOverlay:
      'linear-gradient(180deg, rgba(2,12,11,0.6) 0%, rgba(0,6,6,0.9) 100%)',
    surface: 'rgba(8,28,25,0.82)',
    surfaceStrong: 'rgba(4,16,14,0.92)',
    surfaceSoft: 'rgba(14,44,40,0.5)',
    border: 'rgba(77,182,172,0.42)',
    borderSoft: 'rgba(0,77,64,0.4)',
    borderSecondary: 'rgba(77,182,172,0.3)',
    text: '#e0f2f1',
    textMuted: '#9ab8b4',
    textDim: '#566c68',
    heading: '#4db6ac',
    accent: '#4db6ac',
    accentBright: '#8fd6cf',
    accentSecondary: '#004d40',
    accentDim: '#06342c',
    glow: 'rgba(0,77,64,0.5)',
    glowSecondary: 'rgba(77,182,172,0.36)',
    navHoverBg: 'rgba(77,182,172,0.08)',
    navActiveBg:
      'linear-gradient(90deg, rgba(0,77,64,0.3) 0%, rgba(0,77,64,0) 100%)',
    textOnAccent: '#04130f',
    fontLogo: '"IM Fell English", "Cormorant Garamond", serif',
    fontDisplay: '"IM Fell English", "Cormorant Garamond", serif',
    fontBody: '"Cormorant Garamond", Georgia, serif',
  }),
  fonts: {
    logo: 'IM Fell English',
    display: 'IM Fell English',
    body: 'Cormorant Garamond',
  },
  thumbnail: '/themes/thumbnails/nemrtvi.webp',
  background: '/themes/backgrounds/nemrtvi.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
