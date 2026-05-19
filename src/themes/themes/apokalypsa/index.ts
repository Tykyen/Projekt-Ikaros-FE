import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.7g — skin „Post-apokalypsa" (slug `apokalypsa`). Zarůstající
 * ruiny: město pohlcené přírodou — mechová zeleň na rezavém betonu,
 * tlumené šedozelené ticho.
 */
export const apokalypsaTheme: Theme = {
  id: 'apokalypsa',
  name: 'Post-apokalypsa',
  scope: 'world',
  atmosphere:
    'Město pohlcené přírodou — mech na betonu a tlumené šedozelené ticho',
  vars: buildSkinVars({
    bgPrimary: '#10130e',
    bgSecondary: '#1b211a',
    bgOverlay:
      'linear-gradient(180deg, rgba(12,15,11,0.18) 0%, rgba(12,15,11,0.46) 100%)',
    surface: 'rgba(26,32,24,0.76)',
    surfaceStrong: 'rgba(12,15,11,0.9)',
    surfaceSoft: 'rgba(42,50,38,0.46)',
    border: 'rgba(126,156,92,0.5)',
    borderSoft: 'rgba(126,156,92,0.26)',
    borderSecondary: 'rgba(160,104,64,0.42)',
    text: '#d4d4c6',
    textMuted: '#909a84',
    textDim: '#586050',
    heading: '#e2e4d4',
    accent: '#7e9c5c',
    accentBright: '#a8c47e',
    accentSecondary: '#a06840',
    accentDim: '#3a4a28',
    glow: 'rgba(126,156,92,0.36)',
    glowSecondary: 'rgba(160,104,64,0.3)',
    navHoverBg: 'rgba(126,156,92,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(126,156,92,0.18) 0%, rgba(126,156,92,0) 100%)',
    textOnAccent: '#10130e',
    fontLogo: '"Oswald", "Segoe UI", sans-serif',
    fontDisplay: '"Oswald", "Segoe UI", sans-serif',
    fontBody: '"Spectral", Georgia, serif',
  }),
  fonts: { logo: 'Oswald', display: 'Oswald', body: 'Spectral' },
  thumbnail: '/themes/thumbnails/apokalypsa.webp',
  background: '/themes/backgrounds/apokalypsa.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
