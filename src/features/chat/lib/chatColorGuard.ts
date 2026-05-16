/**
 * Kontrast guard pro chatColor.
 *
 * Text zprávy se renderuje v uživatelově `chatColor`, ale na některých tématech
 * (tmavý pergamen hospody, světlá témata, kyberpunk) by libovolný hex mohl být
 * nečitelný. Util spočítá WCAG kontrast vůči pozadí (`--theme-surface`) a barvy
 * s nedostatečným kontrastem posune ve světlosti do čitelného pásma; krajně
 * vrátí fallback `var(--theme-text)`.
 */

const MIN_CONTRAST = 4.5;
const FALLBACK = 'var(--theme-text)';

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Parsuje hex (`#rgb` i `#rrggbb`) i funkční CSS zápis barvy. `null` při neúspěchu. */
export function parseColor(input: string): Rgb | null {
  const s = input.trim();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  const rgb = s.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
  return null;
}

/** WCAG relativní luminance (0–1). */
function luminance({ r, g, b }: Rgb): number {
  const ch = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** WCAG kontrastní poměr dvou barev (1–21). */
function contrast(a: Rgb, b: Rgb): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

function toHex({ r, g, b }: Rgb): string {
  const h = (v: number) =>
    Math.round(clamp(v, 0, 255))
      .toString(16)
      .padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Posune barvu k bílé (`amount > 0`) nebo k černé (`amount < 0`). */
function shift(c: Rgb, amount: number): Rgb {
  if (amount >= 0) {
    return {
      r: c.r + (255 - c.r) * amount,
      g: c.g + (255 - c.g) * amount,
      b: c.b + (255 - c.b) * amount,
    };
  }
  const k = 1 + amount; // amount záporné → k < 1 (ztmavení)
  return { r: c.r * k, g: c.g * k, b: c.b * k };
}

/**
 * Vrátí barvu textu zprávy čitelnou na daném pozadí.
 *
 * @param color   chatColor odesílatele (hex). Prázdné/`null` → fallback.
 * @param surface barva pozadí panelu (computed `--theme-surface`).
 */
export function guardChatColor(
  color: string | null | undefined,
  surface: string,
): string {
  if (!color) return FALLBACK;
  const fg = parseColor(color);
  if (!fg) return FALLBACK;
  const bg = parseColor(surface);
  if (!bg) return color; // pozadí neznáme — barvu necháme být
  if (contrast(fg, bg) >= MIN_CONTRAST) return color;

  // posun směrem od pozadí: tmavé pozadí → zesvětlit, světlé → ztmavit
  const dir = luminance(bg) < 0.5 ? 1 : -1;
  for (let step = 1; step <= 20; step++) {
    const shifted = shift(fg, dir * step * 0.05);
    if (contrast(shifted, bg) >= MIN_CONTRAST) return toHex(shifted);
  }
  return FALLBACK;
}
