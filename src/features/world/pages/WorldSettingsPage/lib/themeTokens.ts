/**
 * 5.3f — katalog editovatelných theme tokenů. BE sanituje `themeOverrides`
 * na klíče s prefixem `--theme-`. Gradienty (`--theme-bg-overlay` ap.)
 * jsou mimo editor — na color picker příliš složité.
 */
export interface ThemeTokenDef {
  key: string;
  label: string;
  /** `color` = plná barva (hex); `alpha` = barva + průhlednost (rgba). */
  kind: 'color' | 'alpha';
}

export const THEME_TOKENS: ThemeTokenDef[] = [
  { key: '--theme-text', label: 'Text', kind: 'color' },
  { key: '--theme-text-muted', label: 'Tlumený text', kind: 'color' },
  { key: '--theme-heading', label: 'Nadpisy', kind: 'color' },
  { key: '--theme-accent', label: 'Akcent', kind: 'color' },
  { key: '--theme-accent-bright', label: 'Akcent — jasný', kind: 'color' },
  { key: '--theme-accent-cyan', label: 'Akcent — druhý', kind: 'color' },
  { key: '--theme-surface', label: 'Panel', kind: 'alpha' },
  { key: '--theme-surface-strong', label: 'Panel — sytý', kind: 'alpha' },
  { key: '--theme-border', label: 'Okraje', kind: 'alpha' },
  { key: '--theme-shadow', label: 'Stín', kind: 'alpha' },
  { key: '--theme-glow-gold', label: 'Záře', kind: 'alpha' },
];

/** Klíče textových barev — pro kontrast guard vůči panelu. */
export const TOKEN_TEXT = '--theme-text';
export const TOKEN_SURFACE = '--theme-surface';

function clamp(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((c) => clamp(c).toString(16).padStart(2, '0'))
      .join('')
  );
}

/** Rozloží hodnotu tokenu (hex / rgb / rgba) na hex + alpha (0–1). */
export function parseColor(value: string | undefined): {
  hex: string;
  alpha: number;
} {
  if (!value) return { hex: '#888888', alpha: 1 }; // lint-colors-ignore
  const v = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return { hex: v.toLowerCase(), alpha: 1 };
  const m = v.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
    const [r, g, b, a] = parts;
    if ([r, g, b].every((n) => Number.isFinite(n))) {
      return {
        hex: rgbToHex(r, g, b),
        alpha: Number.isFinite(a) ? a : 1,
      };
    }
  }
  return { hex: '#888888', alpha: 1 }; // lint-colors-ignore — fallback dat
}

/** Sestaví CSS hodnotu tokenu zpět z hex + alpha. */
export function toCssColor(
  hex: string,
  alpha: number,
  kind: 'color' | 'alpha',
): string {
  if (kind === 'color' || alpha >= 1) return hex;
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Number(alpha.toFixed(2))})`; // lint-colors-ignore
}
