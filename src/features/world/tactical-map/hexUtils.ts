/**
 * 10.2b — hex math helpery pro taktickou mapu.
 *
 * Port z Matrix `frontend/src/components/Map/HexUtils.ts` 1:1 + bonus
 * `hexDistance` (pro 10.2m measure tool) a `getHexPolyPoints` (number[]
 * formát pro PixiJS Graphics.poly()).
 *
 * Hex orientace: **flat-top**. Plochá strana nahoře/dole, vrcholy
 * vlevo/vpravo. Úhel rohu = `60·i − 30°`.
 *
 * Souřadnice: **axial (q, r)** s implicit `s = -q - r`. Sousedi přes
 * `AXIAL_DIRECTIONS` (6 vektorů).
 *
 * Spec: docs/arch/phase-10/spec-10.2b.md §3.1, §3.2.
 */
import type { HexCoord, Point } from './types';

/**
 * 6 axiálních směrových vektorů (sousedi v pořadí 0..5).
 * Index 0 = (1,0); 1 = (1,-1); 2 = (0,-1); 3 = (-1,0); 4 = (-1,1); 5 = (0,1).
 */
export const AXIAL_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

const SQRT3 = Math.sqrt(3);

/**
 * Axial → pixel. Flat-top orientace.
 *
 * `x = size · (√3·q + √3/2·r)`
 * `y = size · (3/2·r)`
 */
export function axialToPixel(q: number, r: number, size: number): Point {
  return {
    x: size * (SQRT3 * q + (SQRT3 / 2) * r),
    y: size * (3 / 2) * r,
  };
}

/**
 * Pixel → axial (inverse) s cube-round pro best-fit. Pro nepřesný hit
 * vrátí nejbližší integer hex.
 */
export function pixelToAxial(x: number, y: number, size: number): HexCoord {
  const q = ((SQRT3 / 3) * x - (1 / 3) * y) / size;
  const r = ((2 / 3) * y) / size;
  return roundToHex(q, r);
}

/**
 * Cube-round trick: zaokrouhli q, r, s a opravit tu komponentu s největší
 * rounding diff (jinak by se mohlo stát `q + r + s ≠ 0`).
 */
function roundToHex(fractQ: number, fractR: number): HexCoord {
  const fractS = -fractQ - fractR;
  let q = Math.round(fractQ);
  let r = Math.round(fractR);
  const s = Math.round(fractS);
  const qDiff = Math.abs(q - fractQ);
  const rDiff = Math.abs(r - fractR);
  const sDiff = Math.abs(s - fractS);
  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }
  return { q, r };
}

/**
 * Vrátí i-tý roh hexu (0..5) s flat-top orientací (úhel `60·i − 30°`).
 */
export function getHexCorner(center: Point, size: number, i: number): Point {
  const angleDeg = 60 * i - 30;
  const angleRad = (Math.PI / 180) * angleDeg;
  return {
    x: center.x + size * Math.cos(angleRad),
    y: center.y + size * Math.sin(angleRad),
  };
}

/**
 * SVG `points` attribute formát: `"x0,y0 x1,y1 ... x5,y5"`. Použito v Matrix
 * SVG `<polygon>` rendereru.
 */
export function getHexPoints(center: Point, size: number): string {
  const parts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const p = getHexCorner(center, size, i);
    parts.push(`${p.x},${p.y}`);
  }
  return parts.join(' ');
}

/**
 * 10.2b — flat number array `[x0, y0, x1, y1, ..., x5, y5]` pro PixiJS
 * `Graphics.poly()`. Vrací 12 čísel (6 corners × 2).
 */
export function getHexPolyPoints(center: Point, size: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 6; i++) {
    const p = getHexCorner(center, size, i);
    out.push(p.x, p.y);
  }
  return out;
}

/**
 * Vrátí souseda hexu v daném směru (0..5). Mimo rozsah → wrap modulo 6.
 */
export function getHexNeighbor(q: number, r: number, dir: number): HexCoord {
  const d = AXIAL_DIRECTIONS[((dir % 6) + 6) % 6];
  return { q: q + d.q, r: r + d.r };
}

/**
 * Vrátí všechny hexy přesně v daném prstenci (vzdálenost = radius).
 *
 * radius 0 → 1 hex (střed);
 * radius 1 → 6 hexů;
 * radius N → 6·N hexů (pro N > 0).
 */
export function getHexRing(
  centerQ: number,
  centerR: number,
  radius: number,
): HexCoord[] {
  if (radius === 0) return [{ q: centerQ, r: centerR }];
  const results: HexCoord[] = [];
  // Start v dir 4 (-1, 1) · radius — Matrix konvence
  let q = centerQ + AXIAL_DIRECTIONS[4].q * radius;
  let r = centerR + AXIAL_DIRECTIONS[4].r * radius;
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < radius; j++) {
      results.push({ q, r });
      const next = getHexNeighbor(q, r, i);
      q = next.q;
      r = next.r;
    }
  }
  return results;
}

/**
 * Vyplněný disk — všechny hexy v vzdálenosti 0..radius od středu.
 *
 * Počet hexů: `1 + 3·radius·(radius+1)` (centrované hex number).
 */
export function getHexesInRadius(
  centerQ: number,
  centerR: number,
  radius: number,
): HexCoord[] {
  const results: HexCoord[] = [];
  for (let rad = 0; rad <= radius; rad++) {
    results.push(...getHexRing(centerQ, centerR, rad));
  }
  return results;
}

/**
 * 10.2b — axial distance mezi dvěma hexy. Pro 10.2m measure tool a
 * combat range checks.
 *
 * Vzorec: `(|Δq| + |Δq + Δr| + |Δr|) / 2`.
 */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}
