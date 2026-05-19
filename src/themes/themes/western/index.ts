import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.7l — skin „Western". Městečko na hranici: prašná dřevěná ulice
 * za soumraku — vybledlé dřevo a teplé soumrační světlo.
 */
export const westernTheme: Theme = {
  id: 'western',
  name: 'Western',
  scope: 'world',
  atmosphere:
    'Prašné pohraniční městečko — vybledlé dřevo a teplé soumrační světlo',
  vars: buildSkinVars({
    bgPrimary: '#171009',
    bgSecondary: '#241a10',
    bgOverlay:
      'linear-gradient(180deg, rgba(15,10,5,0.18) 0%, rgba(15,10,5,0.46) 100%)',
    surface: 'rgba(36,26,16,0.78)',
    surfaceStrong: 'rgba(15,10,6,0.9)',
    surfaceSoft: 'rgba(58,42,26,0.46)',
    border: 'rgba(207,138,68,0.44)',
    borderSoft: 'rgba(207,138,68,0.24)',
    borderSecondary: 'rgba(138,138,100,0.4)',
    text: '#e6d8bc',
    textMuted: '#ac9c78',
    textDim: '#6a5c42',
    heading: '#f0e4c2',
    accent: '#cf8a44',
    accentBright: '#e8ad6c',
    accentSecondary: '#8a8a64',
    accentDim: '#5e3c1c',
    glow: 'rgba(207,138,68,0.34)',
    glowSecondary: 'rgba(138,138,100,0.26)',
    navHoverBg: 'rgba(207,138,68,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(207,138,68,0.18) 0%, rgba(207,138,68,0) 100%)',
    textOnAccent: '#171009',
    fontLogo: '"Rye", Georgia, serif',
    fontDisplay: '"Rye", Georgia, serif',
    fontBody: '"Spectral", Georgia, serif',
  }),
  fonts: { logo: 'Rye', display: 'Rye', body: 'Spectral' },
  thumbnail: '/themes/thumbnails/western.webp',
  background: '/themes/backgrounds/western.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
