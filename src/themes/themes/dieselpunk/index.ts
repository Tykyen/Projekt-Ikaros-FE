import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Dieselpunk" (`.skin-dieselpunk`).
 * Studený válečný průmysl — ocel a olej. Pozadí sdílené s `postapo`.
 */
export const dieselpunkTheme: Theme = {
  id: 'dieselpunk',
  name: 'Dieselpunk',
  scope: 'world',
  atmosphere: 'Studený válečný průmysl — kartáčovaná ocel a olej',
  vars: buildSkinVars({
    bgPrimary: '#0e0e0e',
    bgSecondary: '#1a1a1a',
    bgOverlay:
      'linear-gradient(180deg, rgba(10,10,10,0.5) 0%, rgba(4,4,4,0.82) 100%)',
    surface: 'rgba(28,28,28,0.84)',
    surfaceStrong: 'rgba(16,16,16,0.94)',
    surfaceSoft: 'rgba(46,46,46,0.5)',
    border: 'rgba(158,158,158,0.42)',
    borderSoft: 'rgba(158,158,158,0.22)',
    borderSecondary: 'rgba(255,183,77,0.34)',
    text: '#ececec',
    textMuted: '#aaaaaa',
    textDim: '#646464',
    heading: '#e0e0e0',
    accent: '#9e9e9e',
    accentBright: '#e0e0e0',
    accentSecondary: '#ffb74d',
    accentDim: '#4a4a4a',
    glow: 'rgba(158,158,158,0.3)',
    glowSecondary: 'rgba(255,183,77,0.32)',
    navHoverBg: 'rgba(255,183,77,0.08)',
    navActiveBg:
      'linear-gradient(90deg, rgba(255,183,77,0.18) 0%, rgba(255,183,77,0) 100%)',
    textOnAccent: '#101010',
    fontLogo: '"Oswald", sans-serif',
    fontDisplay: '"Oswald", sans-serif',
    fontBody: '"Exo 2", system-ui, sans-serif',
  }),
  fonts: { logo: 'Oswald', display: 'Oswald', body: 'Exo 2' },
  thumbnail: '/themes/thumbnails/postapo.webp',
  background: '/themes/backgrounds/postapo.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
