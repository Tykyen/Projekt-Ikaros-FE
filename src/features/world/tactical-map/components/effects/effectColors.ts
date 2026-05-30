/**
 * 10.2g — barevné tier škály pro explosion efekty.
 *
 * Port Matrix `MapEffectOverlay.tsx` FIRE/GAS/SMOKE konstant. Jde o **herní
 * konvenci** (oheň = červená → žlutá, plyn = zelená, kouř = šedá), ne o skin
 * theming — proto fixní rgba konstanty, ne `--map-*` CSS proměnné. Theme
 * `effectFireBase/GasBase/SmokeBase` slouží jen ikonám v paletě.
 *
 * Index = `ring.radius`. Vyšší ring = světlejší + průhlednější (efekt slábne
 * od středu). PixiJS `fill({ color })` přijímá rgba string přímo (ColorSource).
 */
export type ExplosionVariant = 'fire' | 'gas' | 'smoke';

const FIRE_COLORS = [
  'rgba(180, 0, 0, 0.55)',
  'rgba(220, 30, 0, 0.45)',
  'rgba(240, 70, 0, 0.35)',
  'rgba(250, 120, 20, 0.28)',
  'rgba(255, 170, 50, 0.22)',
  'rgba(255, 210, 100, 0.16)',
];

const GAS_COLORS = [
  'rgba(0, 140, 30, 0.55)',
  'rgba(20, 180, 50, 0.45)',
  'rgba(50, 210, 70, 0.35)',
  'rgba(80, 230, 100, 0.28)',
  'rgba(120, 245, 140, 0.22)',
  'rgba(170, 255, 180, 0.16)',
];

const SMOKE_COLORS = [
  'rgba(60, 60, 60, 0.6)',
  'rgba(90, 90, 90, 0.5)',
  'rgba(120, 120, 120, 0.4)',
  'rgba(150, 150, 150, 0.32)',
  'rgba(180, 180, 180, 0.24)',
  'rgba(210, 210, 210, 0.18)',
];

/** Vrátí 6-tier rgba škálu pro variantu (fallback `fire`). */
export function getVariantColors(variant?: string): string[] {
  if (variant === 'gas') return GAS_COLORS;
  if (variant === 'smoke') return SMOKE_COLORS;
  return FIRE_COLORS;
}

/**
 * Barva ringu dle jeho `radius` — clamp na poslední tier (rings > 5 sdílí
 * nejsvětlejší barvu, ať explosion s 6+ ringy nespadne na undefined).
 */
export function getRingColor(variant: string | undefined, radius: number): string {
  const colors = getVariantColors(variant);
  return colors[Math.min(Math.max(radius, 0), colors.length - 1)];
}

/** UI metadata variant pro paletu (ikona + label + akcentová barva). */
export const VARIANT_CONFIG: {
  key: ExplosionVariant;
  icon: string;
  label: string;
  color: string;
}[] = [
  { key: 'fire', icon: '🔥', label: 'Oheň', color: '#ff4444' },
  { key: 'gas', icon: '☠️', label: 'Plyn', color: '#22cc44' },
  { key: 'smoke', icon: '💨', label: 'Kouř', color: '#aaaaaa' },
];

/** 8 přednastavených barev pro `color` zóny (rgba fill + plný dot pro UI). */
export const PALETTE_COLORS: { value: string; label: string; dot: string }[] = [
  { value: 'rgba(255, 60, 60, 0.35)', label: 'Červená', dot: '#ff3c3c' },
  { value: 'rgba(60, 130, 255, 0.35)', label: 'Modrá', dot: '#3c82ff' },
  { value: 'rgba(60, 220, 80, 0.35)', label: 'Zelená', dot: '#3cdc50' },
  { value: 'rgba(255, 220, 40, 0.35)', label: 'Žlutá', dot: '#ffdc28' },
  { value: 'rgba(180, 60, 255, 0.35)', label: 'Fialová', dot: '#b43cff' },
  { value: 'rgba(255, 140, 30, 0.35)', label: 'Oranžová', dot: '#ff8c1e' },
  { value: 'rgba(255, 255, 255, 0.25)', label: 'Bílá', dot: '#ffffff' },
  { value: 'rgba(40, 40, 40, 0.5)', label: 'Černá', dot: '#555' },
];
