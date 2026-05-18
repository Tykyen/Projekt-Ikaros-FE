import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Military" (`.skin-military`).
 * Tvrdá vojenská přesnost — olivový maskáč. Pozadí sdílené s `severske-runy`.
 */
export const militaryTheme: Theme = {
  id: 'military',
  name: 'Military',
  scope: 'world',
  atmosphere: 'Tvrdá vojenská přesnost — olivový maskáč a stroze velené řády',
  vars: buildSkinVars({
    bgPrimary: '#10140c',
    bgSecondary: '#1c2214',
    bgOverlay:
      'linear-gradient(180deg, rgba(12,16,8,0.5) 0%, rgba(6,8,4,0.8) 100%)',
    surface: 'rgba(28,34,20,0.82)',
    surfaceStrong: 'rgba(16,20,12,0.92)',
    surfaceSoft: 'rgba(46,54,32,0.5)',
    border: 'rgba(143,188,143,0.42)',
    borderSoft: 'rgba(143,188,143,0.22)',
    borderSecondary: 'rgba(85,107,47,0.5)',
    text: '#e8f0e0',
    textMuted: '#b0bca0',
    textDim: '#6a7458',
    heading: '#a8c890',
    accent: '#8fbc8f',
    accentBright: '#bcd6ac',
    accentSecondary: '#556b2f',
    accentDim: '#3a4a20',
    glow: 'rgba(143,188,143,0.36)',
    glowSecondary: 'rgba(85,107,47,0.34)',
    navHoverBg: 'rgba(143,188,143,0.08)',
    navActiveBg:
      'linear-gradient(90deg, rgba(85,107,47,0.22) 0%, rgba(85,107,47,0) 100%)',
    textOnAccent: '#0e1408',
    fontLogo: '"Oswald", sans-serif',
    fontDisplay: '"Oswald", sans-serif',
    fontBody: '"Exo 2", system-ui, sans-serif',
  }),
  fonts: { logo: 'Oswald', display: 'Oswald', body: 'Exo 2' },
  thumbnail: '/themes/thumbnails/severske-runy.webp',
  background: '/themes/backgrounds/severske-runy.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
