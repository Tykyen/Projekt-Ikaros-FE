import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.0g — skin „Post-postapo" (`.skin-postpostapo`).
 * Obnova po apokalypse — zeleň přebírá zbytky civilizace. Pozadí `priroda`.
 */
export const postPostapoTheme: Theme = {
  id: 'post-postapo',
  name: 'Post-postapo',
  scope: 'world',
  atmosphere: 'Obnova po apokalypse — kvetoucí zeleň nad ruinami',
  vars: buildSkinVars({
    bgPrimary: '#101404',
    bgSecondary: '#1e260f',
    bgOverlay:
      'linear-gradient(165deg, rgba(12,16,6,0.5) 0%, rgba(8,10,4,0.78) 100%)',
    surface: 'rgba(28,36,16,0.76)',
    surfaceStrong: 'rgba(16,22,8,0.9)',
    surfaceSoft: 'rgba(48,58,28,0.46)',
    border: 'rgba(156,204,101,0.46)',
    borderSoft: 'rgba(156,204,101,0.24)',
    borderSecondary: 'rgba(197,225,165,0.42)',
    text: '#f1f8e9',
    textMuted: '#bcc4a4',
    textDim: '#6e7654',
    heading: '#c5e1a5',
    accent: '#9ccc65',
    accentBright: '#c5e1a5',
    accentSecondary: '#8bc34a',
    accentDim: '#4a5a28',
    glow: 'rgba(156,204,101,0.4)',
    glowSecondary: 'rgba(139,195,74,0.36)',
    navHoverBg: 'rgba(156,204,101,0.09)',
    navActiveBg:
      'linear-gradient(90deg, rgba(139,195,74,0.18) 0%, rgba(139,195,74,0) 100%)',
    textOnAccent: '#121800',
    fontLogo: '"Oswald", sans-serif',
    fontDisplay: '"Oswald", sans-serif',
    fontBody: '"Lora", Georgia, serif',
  }),
  fonts: { logo: 'Oswald', display: 'Oswald', body: 'Lora' },
  thumbnail: '/themes/thumbnails/priroda.webp',
  background: '/themes/backgrounds/priroda.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
