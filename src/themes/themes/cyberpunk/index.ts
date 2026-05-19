import type { Theme } from '@/themes/types';
import { buildSkinVars } from '../_skinBase';

/**
 * Krok 5.7e — skin „Cyberpunk". Corpo dystopie: korporátní megablok —
 * kyselá žlutá neonová světla, varovné šrafy nad uhelnou tmou.
 */
export const cyberpunkTheme: Theme = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  scope: 'world',
  atmosphere:
    'Korporátní megablok — kyselý žlutý neon a varovné šrafy nad uhelnou tmou',
  vars: buildSkinVars({
    bgPrimary: '#0a0a08',
    bgSecondary: '#16160f',
    bgOverlay:
      'linear-gradient(180deg, rgba(8,8,5,0.2) 0%, rgba(8,8,5,0.5) 100%)',
    surface: 'rgba(22,22,14,0.78)',
    surfaceStrong: 'rgba(10,10,7,0.92)',
    surfaceSoft: 'rgba(40,38,20,0.46)',
    border: 'rgba(240,208,32,0.5)',
    borderSoft: 'rgba(240,208,32,0.26)',
    borderSecondary: 'rgba(125,138,150,0.45)',
    text: '#e6e4d8',
    textMuted: '#9a988a',
    textDim: '#5c5a4c',
    heading: '#f4f0dc',
    accent: '#f0d020',
    accentBright: '#fff04a',
    accentSecondary: '#7d8a96',
    accentDim: '#544818',
    glow: 'rgba(240,208,32,0.4)',
    glowSecondary: 'rgba(125,138,150,0.3)',
    navHoverBg: 'rgba(240,208,32,0.1)',
    navActiveBg:
      'linear-gradient(90deg, rgba(240,208,32,0.2) 0%, rgba(240,208,32,0) 100%)',
    textOnAccent: '#0a0a08',
    fontLogo: '"Chakra Petch", "Rajdhani", sans-serif',
    fontDisplay: '"Chakra Petch", "Rajdhani", sans-serif',
    fontBody: '"Rajdhani", "Segoe UI", sans-serif',
  }),
  fonts: { logo: 'Chakra Petch', display: 'Chakra Petch', body: 'Rajdhani' },
  thumbnail: '/themes/thumbnails/cyberpunk.webp',
  background: '/themes/backgrounds/cyberpunk.webp',
  decorationsModule: () => import('./decorations.css'),
  reducedMotion: 'safe',
};
