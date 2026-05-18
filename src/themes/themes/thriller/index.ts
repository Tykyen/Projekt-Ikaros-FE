import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Thriller" (`.skin-thriller`).
 * Napětí bez odpočinku — černé stíny a žluté varování. Pozadí `temna-cerven`.
 */
export const thrillerTheme: Theme = {
  id: 'thriller',
  name: 'Thriller',
  scope: 'world',
  atmosphere: 'Napětí bez odpočinku — černé stíny a žluté varovné světlo',
  vars: buildSkinVars({
    bgPrimary: '#0a0a0a',
    bgSecondary: '#161616',
    bgOverlay:
      'linear-gradient(180deg, rgba(6,6,6,0.6) 0%, rgba(0,0,0,0.88) 100%)',
    surface: 'rgba(20,20,20,0.86)',
    surfaceStrong: 'rgba(10,10,10,0.94)',
    surfaceSoft: 'rgba(36,36,36,0.5)',
    border: 'rgba(255,235,59,0.42)',
    borderSoft: 'rgba(255,235,59,0.22)',
    borderSecondary: 'rgba(255,245,157,0.32)',
    text: '#f4f4f0',
    textMuted: '#b4b4a8',
    textDim: '#6a6a60',
    heading: '#ffeb3b',
    accent: '#ffeb3b',
    accentBright: '#fff59d',
    accentSecondary: '#ffd600',
    accentDim: '#7a7000',
    glow: 'rgba(255,235,59,0.38)',
    glowSecondary: 'rgba(255,214,0,0.34)',
    navHoverBg: 'rgba(255,235,59,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(255,235,59,0.2) 0%, rgba(255,235,59,0) 100%)',
    textOnAccent: '#141200',
    fontLogo: '"Oswald", sans-serif',
    fontDisplay: '"Oswald", sans-serif',
    fontBody: '"Exo 2", system-ui, sans-serif',
  }),
  fonts: { logo: 'Oswald', display: 'Oswald', body: 'Exo 2' },
  thumbnail: '/themes/thumbnails/temna-cerven.webp',
  background: '/themes/backgrounds/temna-cerven.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
