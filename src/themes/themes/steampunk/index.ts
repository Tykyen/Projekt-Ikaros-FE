import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.7f — skin „Steampunk". Parní metropole: měděné komíny, vzducholodě
 * a jantarový smog — leštěná mosaz a měděná patina nad tmavě hnědou.
 */
export const steampunkTheme: Theme = {
  id: 'steampunk',
  name: 'Steampunk',
  scope: 'world',
  atmosphere:
    'Parní metropole — měděné komíny, vzducholodě a jantarový smog',
  vars: buildSkinVars({
    bgPrimary: '#16100a',
    bgSecondary: '#241a10',
    bgOverlay:
      'linear-gradient(180deg, rgba(14,9,5,0.2) 0%, rgba(14,9,5,0.5) 100%)',
    surface: 'rgba(36,26,16,0.78)',
    surfaceStrong: 'rgba(16,11,6,0.92)',
    surfaceSoft: 'rgba(56,40,22,0.46)',
    border: 'rgba(200,137,58,0.5)',
    borderSoft: 'rgba(200,137,58,0.26)',
    borderSecondary: 'rgba(95,168,144,0.42)',
    text: '#e8dcc4',
    textMuted: '#ac9a78',
    textDim: '#6a5c40',
    heading: '#f0e4c8',
    accent: '#c8893a',
    accentBright: '#e6b260',
    accentSecondary: '#5fa890',
    accentDim: '#5a3e18',
    glow: 'rgba(200,137,58,0.4)',
    glowSecondary: 'rgba(95,168,144,0.3)',
    navHoverBg: 'rgba(200,137,58,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(200,137,58,0.2) 0%, rgba(200,137,58,0) 100%)',
    textOnAccent: '#16100a',
    fontLogo: '"Cinzel", Georgia, serif',
    fontDisplay: '"Cinzel", Georgia, serif',
    fontBody: '"Spectral", Georgia, serif',
  }),
  fonts: { logo: 'Cinzel', display: 'Cinzel', body: 'Spectral' },
  thumbnail: '/themes/thumbnails/steampunk.webp',
  background: '/themes/backgrounds/steampunk.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
