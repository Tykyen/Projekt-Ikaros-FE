import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Weird fiction" (`.skin-weird`).
 * Surreální chromatický chaos — nepochopitelné barvy. Pozadí sdílené s `magie`.
 */
export const weirdTheme: Theme = {
  id: 'weird',
  name: 'Weird fiction',
  scope: 'world',
  atmosphere: 'Surreální chromatický chaos — barvy bez logiky a řádu',
  vars: buildSkinVars({
    bgPrimary: '#0e0418',
    bgSecondary: '#1c0a2e',
    bgOverlay:
      'linear-gradient(150deg, rgba(40,0,30,0.5) 0%, rgba(0,10,30,0.8) 100%)',
    surface: 'rgba(30,8,42,0.78)',
    surfaceStrong: 'rgba(16,4,26,0.9)',
    surfaceSoft: 'rgba(52,16,68,0.46)',
    border: 'rgba(255,64,129,0.46)',
    borderSoft: 'rgba(255,64,129,0.24)',
    borderSecondary: 'rgba(0,150,200,0.4)',
    text: '#fce4ec',
    textMuted: '#d0a8bc',
    textDim: '#7e5e70',
    heading: '#ff80ab',
    accent: '#ff4081',
    accentBright: '#ff80ab',
    accentSecondary: '#f50057',
    accentDim: '#7a0033',
    glow: 'rgba(245,0,87,0.46)',
    glowSecondary: 'rgba(0,150,200,0.4)',
    navHoverBg: 'rgba(255,64,129,0.12)',
    navActiveBg:
      'linear-gradient(90deg, rgba(245,0,87,0.24) 0%, rgba(0,150,200,0.1) 100%)',
    textOnAccent: '#1a0010',
    fontLogo: '"Audiowide", "Oswald", sans-serif',
    fontDisplay: '"Audiowide", "Oswald", sans-serif',
    fontBody: '"Lora", Georgia, serif',
  }),
  fonts: { logo: 'Audiowide', display: 'Audiowide', body: 'Lora' },
  thumbnail: '/themes/thumbnails/magie.webp',
  background: '/themes/backgrounds/magie.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'heavy',
};
