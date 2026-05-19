import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.7b — skin „Fantasy". Vznešená high fantasy: elfí síň za hvězdné
 * noci — zlatý filigrán a smaragdové světlo na noční smaragdové černi.
 */
export const fantasyTheme: Theme = {
  id: 'fantasy',
  name: 'Fantasy',
  scope: 'world',
  atmosphere:
    'Vznešená elfí síň — zlatý filigrán a smaragdové světlo pod hvězdnou klenbou',
  vars: buildSkinVars({
    bgPrimary: '#0b1510',
    bgSecondary: '#13251c',
    bgOverlay:
      'linear-gradient(180deg, rgba(8,18,13,0.15) 0%, rgba(8,18,13,0.45) 100%)',
    surface: 'rgba(16,32,24,0.74)',
    surfaceStrong: 'rgba(8,18,13,0.9)',
    surfaceSoft: 'rgba(28,52,40,0.46)',
    border: 'rgba(227,198,107,0.5)',
    borderSoft: 'rgba(227,198,107,0.26)',
    borderSecondary: 'rgba(111,211,168,0.45)',
    text: '#f0e8d4',
    textMuted: '#aebfa8',
    textDim: '#6a7a68',
    heading: '#f4dd92',
    accent: '#e3c66b',
    accentBright: '#f6e4a0',
    accentSecondary: '#6fd3a8',
    accentDim: '#5a4a1e',
    glow: 'rgba(227,198,107,0.4)',
    glowSecondary: 'rgba(111,211,168,0.36)',
    navHoverBg: 'rgba(227,198,107,0.08)',
    navActiveBg:
      'linear-gradient(90deg, rgba(111,211,168,0.16) 0%, rgba(111,211,168,0) 100%)',
    textOnAccent: '#0b1510',
    fontLogo: '"Marcellus", Georgia, serif',
    fontDisplay: '"Marcellus", Georgia, serif',
    fontBody: '"Cormorant Garamond", Georgia, serif',
  }),
  fonts: { logo: 'Marcellus', display: 'Marcellus', body: 'Cormorant Garamond' },
  thumbnail: '/themes/thumbnails/fantasy.webp',
  background: '/themes/backgrounds/fantasy.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
