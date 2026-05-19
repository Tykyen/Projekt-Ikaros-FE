import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.7k — skin „Současnost" (slug `moderni`). Každodenní útulno:
 * teplý večerní obytný interiér — světlo lampy, dřevo a měkký textil.
 */
export const moderniTheme: Theme = {
  id: 'moderni',
  name: 'Současnost',
  scope: 'world',
  atmosphere:
    'Útulný večerní interiér — teplé světlo lampy, dřevo a měkký textil',
  vars: buildSkinVars({
    bgPrimary: '#15110d',
    bgSecondary: '#221c15',
    bgOverlay:
      'linear-gradient(180deg, rgba(13,10,7,0.16) 0%, rgba(13,10,7,0.42) 100%)',
    surface: 'rgba(34,28,21,0.78)',
    surfaceStrong: 'rgba(14,11,8,0.9)',
    surfaceSoft: 'rgba(52,42,32,0.46)',
    border: 'rgba(200,126,84,0.44)',
    borderSoft: 'rgba(200,126,84,0.24)',
    borderSecondary: 'rgba(125,148,120,0.4)',
    text: '#e6ddcd',
    textMuted: '#ab9f8a',
    textDim: '#675c4a',
    heading: '#f0e8d6',
    accent: '#c87e54',
    accentBright: '#e3a378',
    accentSecondary: '#7d9478',
    accentDim: '#5a3a24',
    glow: 'rgba(200,126,84,0.32)',
    glowSecondary: 'rgba(125,148,120,0.26)',
    navHoverBg: 'rgba(200,126,84,0.09)',
    navActiveBg:
      'linear-gradient(90deg, rgba(200,126,84,0.18) 0%, rgba(200,126,84,0) 100%)',
    textOnAccent: '#15110d',
    fontLogo: '"Fraunces", Georgia, serif',
    fontDisplay: '"Fraunces", Georgia, serif',
    fontBody: '"Newsreader", Georgia, serif',
  }),
  fonts: { logo: 'Fraunces', display: 'Fraunces', body: 'Newsreader' },
  thumbnail: '/themes/thumbnails/moderni.webp',
  background: '/themes/backgrounds/moderni.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
