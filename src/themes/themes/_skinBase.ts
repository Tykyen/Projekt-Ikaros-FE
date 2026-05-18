/**
 * Krok 5.0g — sdílená báze pro 16 portovaných žánrových skinů.
 * Skin definuje jen barevné jádro (`SkinColors`); `buildSkinVars` z něj
 * složí plnou `vars` sadu (theme tokeny + legacy aliasy + konstanty).
 */

export interface SkinColors {
  /** Plné pozadí (legacy `--bg-primary`). */
  bgPrimary: string;
  bgSecondary: string;
  /** Atmosférický overlay nad pozadím. */
  bgOverlay: string;
  /** Glass panely. */
  surface: string;
  surfaceStrong: string;
  surfaceSoft: string;
  /** Okraje. */
  border: string;
  borderSoft: string;
  borderSecondary: string;
  /** Text. */
  text: string;
  textMuted: string;
  textDim: string;
  heading: string;
  /** Akcenty. */
  accent: string;
  accentBright: string;
  accentSecondary: string;
  accentDim: string;
  /** Glow / stín. */
  glow: string;
  glowSecondary: string;
  /** Nav stavy. */
  navHoverBg: string;
  navActiveBg: string;
  /** Barva textu na akcentu (kontrastní). */
  textOnAccent: string;
  /** Fonty. */
  fontLogo: string;
  fontDisplay: string;
  fontBody: string;
}

/** Konstantní tokeny sdílené všemi skiny (stavové barvy, layout chrome). */
const SHARED: Record<string, string> = {
  '--theme-shadow': 'rgba(0, 0, 0, 0.78)',
  '--success': '#3ecf8e',
  '--success-soft': 'rgba(62, 207, 142, 0.15)',
  '--success-soft-border': 'rgba(62, 207, 142, 0.3)',
  '--warning': '#f5a623',
  '--warning-soft': 'rgba(245, 166, 35, 0.15)',
  '--warning-soft-border': 'rgba(245, 166, 35, 0.3)',
  '--danger': '#f06060',
  '--danger-soft': 'rgba(240, 96, 96, 0.15)',
  '--danger-soft-border': 'rgba(240, 96, 96, 0.3)',
  '--danger-focus-ring': 'rgba(240, 96, 96, 0.2)',
  '--info': '#5ba4f5',
  '--text-on-danger': '#050508',
  '--bg-overlay': 'rgba(0, 0, 0, 0.6)',
  '--font-script': '"Great Vibes", "Brush Script MT", cursive',
  '--header-h': '88px',
  '--frame-pad-y': '40px',
  '--frame-pad-x': '18px',
  '--sidebar-w': '280px',
  // Skiny nemají vlastní raster logo — textový fallback.
  '--logo-img-display': 'none',
  '--logo-fallback-display': 'block',
};

export function buildSkinVars(c: SkinColors): Record<string, string> {
  return {
    ...SHARED,
    '--theme-bg-overlay': c.bgOverlay,
    '--theme-surface': c.surface,
    '--theme-surface-strong': c.surfaceStrong,
    '--theme-surface-soft': c.surfaceSoft,
    '--theme-border': c.border,
    '--theme-border-soft': c.borderSoft,
    '--theme-border-cyan': c.borderSecondary,
    '--theme-text': c.text,
    '--theme-text-muted': c.textMuted,
    '--theme-heading': c.heading,
    '--theme-accent': c.accent,
    '--theme-accent-bright': c.accentBright,
    '--theme-accent-cyan': c.accentSecondary,
    '--theme-glow-gold': c.glow,
    '--theme-glow-cyan': c.glowSecondary,
    '--theme-nav-hover-bg': c.navHoverBg,
    '--theme-nav-active-bg': c.navActiveBg,
    '--section-divider': `linear-gradient(90deg, transparent 0%, ${c.glow} 50%, transparent 100%)`,
    '--header-band-h': '5px',
    '--panel-inner-border': c.borderSoft,
    '--panel-inner-inset': '6px',
    // Legacy aliasy (btn3d, IkarosLayout aj.).
    '--bg-primary': c.bgPrimary,
    '--bg-secondary': c.bgSecondary,
    '--bg-card': c.surface,
    '--bg-card-hover': c.surfaceSoft,
    '--accent': c.accent,
    '--accent-bright': c.accentBright,
    '--accent-dim': c.accentDim,
    '--accent-soft': c.borderSoft,
    '--text-primary': c.text,
    '--text-secondary': c.textMuted,
    '--text-muted': c.textDim,
    '--border': c.borderSoft,
    '--border-subtle': c.borderSoft,
    '--border-strong': c.border,
    '--text-on-accent': c.textOnAccent,
    '--header-bg': c.bgPrimary,
    '--font-logo': c.fontLogo,
    '--font-display': c.fontDisplay,
    '--font-body': c.fontBody,
  };
}
