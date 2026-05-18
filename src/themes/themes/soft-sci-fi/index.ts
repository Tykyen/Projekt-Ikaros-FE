import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Soft sci-fi" (`.skin-softscifi`).
 * Měkké explorativní sci-fi — cyan svit bez tvrdého punku. Pozadí `sci-fi`.
 */
export const softSciFiTheme: Theme = {
  id: 'soft-sci-fi',
  name: 'Soft sci-fi',
  scope: 'world',
  atmosphere: 'Měkké explorativní sci-fi — modrý svit klidných dálek',
  vars: buildSkinVars({
    bgPrimary: '#061520',
    bgSecondary: '#0c2738',
    bgOverlay:
      'linear-gradient(165deg, rgba(4,14,22,0.48) 0%, rgba(3,10,18,0.76) 100%)',
    surface: 'rgba(10,30,44,0.74)',
    surfaceStrong: 'rgba(5,18,28,0.9)',
    surfaceSoft: 'rgba(18,52,72,0.46)',
    border: 'rgba(0,229,255,0.46)',
    borderSoft: 'rgba(0,229,255,0.24)',
    borderSecondary: 'rgba(132,255,255,0.42)',
    text: '#e0f7fa',
    textMuted: '#a2c4cc',
    textDim: '#5a767e',
    heading: '#84ffff',
    accent: '#00e5ff',
    accentBright: '#84ffff',
    accentSecondary: '#18ffff',
    accentDim: '#0a5a66',
    glow: 'rgba(0,229,255,0.4)',
    glowSecondary: 'rgba(132,255,255,0.38)',
    navHoverBg: 'rgba(0,229,255,0.09)',
    navActiveBg:
      'linear-gradient(90deg, rgba(0,229,255,0.18) 0%, rgba(0,229,255,0) 100%)',
    textOnAccent: '#04141a',
    fontLogo: '"Exo 2", "Oswald", sans-serif',
    fontDisplay: '"Exo 2", "Oswald", sans-serif',
    fontBody: '"Exo 2", system-ui, sans-serif',
  }),
  fonts: { logo: 'Exo 2', display: 'Exo 2', body: 'Exo 2' },
  thumbnail: '/themes/thumbnails/sci-fi.webp',
  background: '/themes/backgrounds/sci-fi.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
