import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Biopunk" (`.skin-biopunk`).
 * Bioluminiscentní mutace — toxická živá příroda. Pozadí sdílené s `priroda`.
 */
export const biopunkTheme: Theme = {
  id: 'biopunk',
  name: 'Biopunk',
  scope: 'world',
  atmosphere: 'Bioluminiscentní mutace — toxická záře živé tkáně',
  vars: buildSkinVars({
    bgPrimary: '#0a1605',
    bgSecondary: '#16280c',
    bgOverlay:
      'linear-gradient(165deg, rgba(8,18,4,0.5) 0%, rgba(4,10,2,0.8) 100%)',
    surface: 'rgba(18,36,10,0.76)',
    surfaceStrong: 'rgba(10,22,6,0.9)',
    surfaceSoft: 'rgba(34,62,18,0.46)',
    border: 'rgba(118,255,3,0.46)',
    borderSoft: 'rgba(118,255,3,0.24)',
    borderSecondary: 'rgba(178,255,89,0.42)',
    text: '#f1f8e9',
    textMuted: '#bcc8a4',
    textDim: '#6e7a52',
    heading: '#b2ff59',
    accent: '#76ff03',
    accentBright: '#b2ff59',
    accentSecondary: '#64dd17',
    accentDim: '#3a6608',
    glow: 'rgba(118,255,3,0.44)',
    glowSecondary: 'rgba(100,221,23,0.4)',
    navHoverBg: 'rgba(118,255,3,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(100,221,23,0.2) 0%, rgba(100,221,23,0) 100%)',
    textOnAccent: '#0a1600',
    fontLogo: '"Audiowide", "Oswald", sans-serif',
    fontDisplay: '"Audiowide", "Oswald", sans-serif',
    fontBody: '"Exo 2", system-ui, sans-serif',
  }),
  fonts: { logo: 'Audiowide', display: 'Audiowide', body: 'Exo 2' },
  thumbnail: '/themes/thumbnails/priroda.webp',
  background: '/themes/backgrounds/priroda.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
