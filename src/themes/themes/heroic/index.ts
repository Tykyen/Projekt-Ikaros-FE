import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Heroic fantasy" (`.skin-heroic`).
 * Věk hrdinů: zlatý heroismus nad temným ledem. Pozadí sdílené s `modre-nebe`.
 */
export const heroicTheme: Theme = {
  id: 'heroic',
  name: 'Heroic fantasy',
  scope: 'world',
  atmosphere: 'Věk hrdinů — zlatá legie a epické světlo nad temným ledem',
  vars: buildSkinVars({
    bgPrimary: '#0a1424',
    bgSecondary: '#13233e',
    bgOverlay:
      'linear-gradient(165deg, rgba(6,14,28,0.5) 0%, rgba(4,10,22,0.78) 100%)',
    surface: 'rgba(14,28,52,0.74)',
    surfaceStrong: 'rgba(8,18,36,0.9)',
    surfaceSoft: 'rgba(28,50,86,0.46)',
    border: 'rgba(255,193,7,0.5)',
    borderSoft: 'rgba(255,193,7,0.26)',
    borderSecondary: 'rgba(255,236,179,0.45)',
    text: '#fff8e1',
    textMuted: '#cfc7a8',
    textDim: '#6c6748',
    heading: '#ffd54f',
    accent: '#ffc107',
    accentBright: '#ffe082',
    accentSecondary: '#ffecb3',
    accentDim: '#7a5a08',
    glow: 'rgba(255,193,7,0.42)',
    glowSecondary: 'rgba(255,202,40,0.4)',
    navHoverBg: 'rgba(255,193,7,0.09)',
    navActiveBg:
      'linear-gradient(90deg, rgba(255,193,7,0.18) 0%, rgba(255,193,7,0) 100%)',
    textOnAccent: '#1a1200',
    fontLogo: '"Cinzel Decorative", "Cinzel", Georgia, serif',
    fontDisplay: '"Cinzel", Georgia, serif',
    fontBody: '"Lora", Georgia, serif',
  }),
  fonts: { logo: 'Cinzel Decorative', display: 'Cinzel', body: 'Lora' },
  thumbnail: '/themes/thumbnails/modre-nebe.webp',
  background: '/themes/backgrounds/modre-nebe.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
