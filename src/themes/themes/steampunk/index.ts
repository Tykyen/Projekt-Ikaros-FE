import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Steampunk" (`.skin-steampunk`).
 * Viktoriánská pára a mosaz — ozubená kola. Pozadí sdílené s `hospoda`.
 */
export const steampunkTheme: Theme = {
  id: 'steampunk',
  name: 'Steampunk',
  scope: 'world',
  atmosphere: 'Viktoriánská pára a mosaz — ozubená kola a mechanická krása',
  vars: buildSkinVars({
    bgPrimary: '#160d04',
    bgSecondary: '#241608',
    bgOverlay:
      'linear-gradient(170deg, rgba(18,10,4,0.5) 0%, rgba(10,6,2,0.78) 100%)',
    surface: 'rgba(38,24,10,0.8)',
    surfaceStrong: 'rgba(22,14,6,0.92)',
    surfaceSoft: 'rgba(60,40,16,0.46)',
    border: 'rgba(255,179,0,0.46)',
    borderSoft: 'rgba(255,179,0,0.24)',
    borderSecondary: 'rgba(255,224,130,0.34)',
    text: '#fff3e0',
    textMuted: '#cbb594',
    textDim: '#7a6644',
    heading: '#ffb300',
    accent: '#ffb300',
    accentBright: '#ffe082',
    accentSecondary: '#c87f0a',
    accentDim: '#6a4a08',
    glow: 'rgba(255,179,0,0.4)',
    glowSecondary: 'rgba(200,127,10,0.36)',
    navHoverBg: 'rgba(255,179,0,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(255,179,0,0.2) 0%, rgba(255,179,0,0) 100%)',
    textOnAccent: '#1a1000',
    fontLogo: '"Cinzel", Georgia, serif',
    fontDisplay: '"Cinzel", Georgia, serif',
    fontBody: '"Lora", Georgia, serif',
  }),
  fonts: { logo: 'Cinzel', display: 'Cinzel', body: 'Lora' },
  thumbnail: '/themes/thumbnails/hospoda.webp',
  background: '/themes/backgrounds/hospoda.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
