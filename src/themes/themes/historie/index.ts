import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.7j — skin „Historický" (slug `historie`). Renesance / barokní
 * dvůr: opulentní sál — vinná červeň, staré zlato a mahagon ve světle svící.
 */
export const historieTheme: Theme = {
  id: 'historie',
  name: 'Historický',
  scope: 'world',
  atmosphere:
    'Barokní dvorní sál — vinná červeň, staré zlato a mahagon ve světle svící',
  vars: buildSkinVars({
    bgPrimary: '#160d0c',
    bgSecondary: '#241612',
    bgOverlay:
      'linear-gradient(180deg, rgba(14,8,7,0.2) 0%, rgba(14,8,7,0.5) 100%)',
    surface: 'rgba(36,22,18,0.78)',
    surfaceStrong: 'rgba(16,9,8,0.92)',
    surfaceSoft: 'rgba(56,32,26,0.46)',
    border: 'rgba(189,154,78,0.48)',
    borderSoft: 'rgba(189,154,78,0.26)',
    borderSecondary: 'rgba(138,59,58,0.46)',
    text: '#e6dcc6',
    textMuted: '#ab9c80',
    textDim: '#675a44',
    heading: '#f0e6cc',
    accent: '#bd9a4e',
    accentBright: '#ddc079',
    accentSecondary: '#8a3b3a',
    accentDim: '#564222',
    glow: 'rgba(189,154,78,0.38)',
    glowSecondary: 'rgba(138,59,58,0.3)',
    navHoverBg: 'rgba(189,154,78,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(189,154,78,0.2) 0%, rgba(189,154,78,0) 100%)',
    textOnAccent: '#160d0c',
    fontLogo: '"Cormorant", Georgia, serif',
    fontDisplay: '"Cormorant", Georgia, serif',
    fontBody: '"EB Garamond", Georgia, serif',
  }),
  fonts: { logo: 'Cormorant', display: 'Cormorant', body: 'EB Garamond' },
  thumbnail: '/themes/thumbnails/historie.webp',
  background: '/themes/backgrounds/historie.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
