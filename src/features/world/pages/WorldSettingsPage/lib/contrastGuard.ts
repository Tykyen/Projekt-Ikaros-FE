/**
 * 5.3f — WCAG kontrastní poměr. Hlídá čitelnost textu na pozadí panelu
 * v theme editoru. Pracuje s hex barvami (#rrggbb).
 */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Kontrastní poměr dvou hex barev (1–21). Vrací 1 pro nevalidní vstup. */
export function contrastRatio(fgHex: string, bgHex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(fgHex) || !/^#[0-9a-f]{6}$/i.test(bgHex)) {
    return 1;
  }
  const l1 = luminance(hexToRgb(fgHex));
  const l2 = luminance(hexToRgb(bgHex));
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG AA pro běžný text = poměr ≥ 4.5:1. */
export const AA_THRESHOLD = 4.5;
