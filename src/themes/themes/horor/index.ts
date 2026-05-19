import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.7h — skin „Horor". Strašidelný dům: opuštěné sídlo, jediná
 * slábnoucí svíčka a prach v hluboké tmě.
 */
export const hororTheme: Theme = {
  id: 'horor',
  name: 'Horor',
  scope: 'world',
  atmosphere:
    'Opuštěné sídlo — slábnoucí svíčka, prach a tma za každými dveřmi',
  vars: buildSkinVars({
    bgPrimary: '#090807',
    bgSecondary: '#14110d',
    bgOverlay:
      'linear-gradient(180deg, rgba(5,4,3,0.25) 0%, rgba(5,4,3,0.6) 100%)',
    surface: 'rgba(20,17,13,0.8)',
    surfaceStrong: 'rgba(7,6,5,0.94)',
    surfaceSoft: 'rgba(34,28,20,0.46)',
    border: 'rgba(200,154,82,0.44)',
    borderSoft: 'rgba(200,154,82,0.22)',
    borderSecondary: 'rgba(138,132,120,0.4)',
    text: '#ccc6ba',
    textMuted: '#8a8276',
    textDim: '#544e44',
    heading: '#ddd4c2',
    accent: '#c89a52',
    accentBright: '#e8c884',
    accentSecondary: '#8a8478',
    accentDim: '#4e3c1c',
    glow: 'rgba(200,154,82,0.34)',
    glowSecondary: 'rgba(138,132,120,0.26)',
    navHoverBg: 'rgba(200,154,82,0.08)',
    navActiveBg:
      'linear-gradient(90deg, rgba(200,154,82,0.16) 0%, rgba(200,154,82,0) 100%)',
    textOnAccent: '#090807',
    fontLogo: '"IM Fell English", Georgia, serif',
    fontDisplay: '"IM Fell English", Georgia, serif',
    fontBody: '"Cormorant Garamond", Georgia, serif',
  }),
  fonts: {
    logo: 'IM Fell English',
    display: 'IM Fell English',
    body: 'Cormorant Garamond',
  },
  thumbnail: '/themes/thumbnails/horor.webp',
  background: '/themes/backgrounds/horor.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
