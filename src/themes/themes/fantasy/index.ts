import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Fantasy" ze starého Matrixu (`.skin-fantasy`).
 * Temná lesní magie: zelený akcent + fialová nadpisová kouzla.
 * Pozadí sdílené s motivem `magie` (věrný port `$skins-bg`).
 */
export const fantasyTheme: Theme = {
  id: 'fantasy',
  name: 'Fantasy',
  scope: 'world',
  atmosphere:
    'Temná lesní magie — zelený svit a fialové kouzlo pod klenbou hvozdu',
  vars: buildSkinVars({
    bgPrimary: '#06140d',
    bgSecondary: '#0c2419',
    bgOverlay:
      'linear-gradient(160deg, rgba(4,16,10,0.55) 0%, rgba(14,8,26,0.78) 100%)',
    surface: 'rgba(9,26,18,0.74)',
    surfaceStrong: 'rgba(5,16,12,0.9)',
    surfaceSoft: 'rgba(18,44,32,0.46)',
    border: 'rgba(105,240,174,0.5)',
    borderSoft: 'rgba(105,240,174,0.26)',
    borderSecondary: 'rgba(179,136,255,0.5)',
    text: '#e8f5e9',
    textMuted: '#a6c8b4',
    textDim: '#5e7a68',
    heading: '#c8a8ff',
    accent: '#69f0ae',
    accentBright: '#9bffc9',
    accentSecondary: '#b388ff',
    accentDim: '#1f5a3c',
    glow: 'rgba(105,240,174,0.42)',
    glowSecondary: 'rgba(179,136,255,0.4)',
    navHoverBg: 'rgba(105,240,174,0.09)',
    navActiveBg:
      'linear-gradient(90deg, rgba(179,136,255,0.18) 0%, rgba(179,136,255,0) 100%)',
    textOnAccent: '#04130b',
    fontLogo: '"Cinzel Decorative", "Cinzel", Georgia, serif',
    fontDisplay: '"Cinzel", Georgia, serif',
    fontBody: '"Lora", Georgia, serif',
  }),
  fonts: { logo: 'Cinzel Decorative', display: 'Cinzel', body: 'Lora' },
  thumbnail: '/themes/thumbnails/magie.webp',
  background: '/themes/backgrounds/magie.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
