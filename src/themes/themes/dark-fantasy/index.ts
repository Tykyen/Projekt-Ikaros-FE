import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.7c — skin „Dark Fantasy". Gotická katedrála pod krvavým měsícem —
 * krkavci, zlomené koruny, černá noc, krvavě rudá a studené stříbro.
 */
export const darkFantasyTheme: Theme = {
  id: 'dark-fantasy',
  name: 'Dark Fantasy',
  scope: 'world',
  atmosphere:
    'Gotická katedrála pod krvavým měsícem — krkavci, zlomené koruny, studené stříbro',
  vars: buildSkinVars({
    bgPrimary: '#0c0608',
    bgSecondary: '#1a0e12',
    bgOverlay:
      'linear-gradient(180deg, rgba(8,4,6,0.2) 0%, rgba(8,4,6,0.5) 100%)',
    surface: 'rgba(22,12,16,0.76)',
    surfaceStrong: 'rgba(10,5,7,0.92)',
    surfaceSoft: 'rgba(40,20,26,0.46)',
    border: 'rgba(181,30,46,0.5)',
    borderSoft: 'rgba(181,30,46,0.26)',
    borderSecondary: 'rgba(200,204,214,0.42)',
    text: '#ddd6d2',
    textMuted: '#9a8e8e',
    textDim: '#5e5054',
    heading: '#e8dcd6',
    accent: '#b51e2e',
    accentBright: '#e0433f',
    accentSecondary: '#c8ccd6',
    accentDim: '#4a1218',
    glow: 'rgba(181,30,46,0.4)',
    glowSecondary: 'rgba(200,204,214,0.3)',
    navHoverBg: 'rgba(181,30,46,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(181,30,46,0.2) 0%, rgba(181,30,46,0) 100%)',
    textOnAccent: '#f4ece8',
    fontLogo: '"Grenze Gotisch", Georgia, serif',
    fontDisplay: '"Grenze Gotisch", Georgia, serif',
    fontBody: '"EB Garamond", Georgia, serif',
  }),
  fonts: {
    logo: 'Grenze Gotisch',
    display: 'Grenze Gotisch',
    body: 'EB Garamond',
  },
  thumbnail: '/themes/thumbnails/dark-fantasy.webp',
  background: '/themes/backgrounds/dark-fantasy.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
