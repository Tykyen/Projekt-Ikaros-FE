import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.7d — skin „Sci-Fi" (slug `vesmir`). Hard sci-fi: můstek hvězdné
 * lodi — ledově modré panely, cyan HUD, chladný jas dálného vesmíru.
 */
export const vesmirTheme: Theme = {
  id: 'vesmir',
  name: 'Sci-Fi',
  scope: 'world',
  atmosphere:
    'Můstek hvězdné lodi — ledově modré panely a chladný jas dálného vesmíru',
  vars: buildSkinVars({
    bgPrimary: '#070b12',
    bgSecondary: '#0f1826',
    bgOverlay:
      'linear-gradient(180deg, rgba(6,10,18,0.18) 0%, rgba(6,10,18,0.46) 100%)',
    surface: 'rgba(16,26,42,0.74)',
    surfaceStrong: 'rgba(8,13,22,0.9)',
    surfaceSoft: 'rgba(28,44,68,0.46)',
    border: 'rgba(79,212,228,0.5)',
    borderSoft: 'rgba(79,212,228,0.26)',
    borderSecondary: 'rgba(91,143,214,0.45)',
    text: '#dde6ef',
    textMuted: '#8f9eb2',
    textDim: '#52606f',
    heading: '#eaf4fb',
    accent: '#4fd4e4',
    accentBright: '#9af0fa',
    accentSecondary: '#5b8fd6',
    accentDim: '#1c4650',
    glow: 'rgba(79,212,228,0.4)',
    glowSecondary: 'rgba(91,143,214,0.32)',
    navHoverBg: 'rgba(79,212,228,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(79,212,228,0.2) 0%, rgba(79,212,228,0) 100%)',
    textOnAccent: '#06121a',
    fontLogo: '"Orbitron", "Exo 2", sans-serif',
    fontDisplay: '"Orbitron", "Exo 2", sans-serif',
    fontBody: '"Exo 2", "Segoe UI", sans-serif',
  }),
  fonts: { logo: 'Orbitron', display: 'Orbitron', body: 'Exo 2' },
  thumbnail: '/themes/thumbnails/vesmir.webp',
  background: '/themes/backgrounds/vesmir.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
