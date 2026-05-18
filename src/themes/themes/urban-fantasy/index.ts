import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Urban fantasy" (`.skin-urbanfantasy`).
 * Purpurové noční město s magií. Pozadí sdílené s `kyberpunk`.
 */
export const urbanFantasyTheme: Theme = {
  id: 'urban-fantasy',
  name: 'Urban fantasy',
  scope: 'world',
  atmosphere: 'Purpurové noční město — magie v neonu pouličních světel',
  vars: buildSkinVars({
    bgPrimary: '#140a1e',
    bgSecondary: '#231432',
    bgOverlay:
      'linear-gradient(165deg, rgba(14,8,22,0.5) 0%, rgba(8,6,16,0.8) 100%)',
    surface: 'rgba(34,16,46,0.76)',
    surfaceStrong: 'rgba(20,10,30,0.9)',
    surfaceSoft: 'rgba(56,26,76,0.46)',
    border: 'rgba(206,147,216,0.5)',
    borderSoft: 'rgba(206,147,216,0.26)',
    borderSecondary: 'rgba(156,39,176,0.5)',
    text: '#f3e5f5',
    textMuted: '#c5a8cf',
    textDim: '#76607e',
    heading: '#e1bee7',
    accent: '#ce93d8',
    accentBright: '#f3c8f8',
    accentSecondary: '#9c27b0',
    accentDim: '#5a2768',
    glow: 'rgba(206,147,216,0.44)',
    glowSecondary: 'rgba(156,39,176,0.4)',
    navHoverBg: 'rgba(206,147,216,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(156,39,176,0.22) 0%, rgba(156,39,176,0) 100%)',
    textOnAccent: '#160a1c',
    fontLogo: '"Rajdhani", "Oswald", sans-serif',
    fontDisplay: '"Rajdhani", "Oswald", sans-serif',
    fontBody: '"Lora", Georgia, serif',
  }),
  fonts: { logo: 'Rajdhani', display: 'Rajdhani', body: 'Lora' },
  thumbnail: '/themes/thumbnails/kyberpunk.webp',
  background: '/themes/backgrounds/kyberpunk.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
