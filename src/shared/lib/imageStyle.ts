import type { CSSProperties } from 'react';

export type ImageFit = 'cover' | 'contain';

/**
 * 9.5+ — sdílený CSS style helper pro hero obrázek u IkarosEvent / GameEvent /
 * WorldNews kartu. Dvě ortogonální nastavení:
 *
 * - `fit` (`cover` default, `contain` = vidět celý obrázek bez oříznutí)
 * - `zoom` 100–400 % nad daný fit (cover/contain je base, scale přidává zoom-in)
 *
 * Legacy data s `zoom < 100` clamp na 100 (cover je default, zoom-out odebrán
 * po user UX feedbacku — letterbox vypadal špatně).
 */
export function getImageStyle(
  focalX: number | null | undefined,
  focalY: number | null | undefined,
  zoom: number | null | undefined,
  fit: ImageFit | null | undefined,
): CSSProperties {
  const fx = focalX ?? 50;
  const fy = focalY ?? 50;
  const effectiveFit = fit ?? 'cover';
  // Legacy: zoom 25–99 z předchozí impl → clamp na 100 (žádné letterbox).
  const z = Math.max(100, zoom ?? 100);

  const base: CSSProperties = {
    objectFit: effectiveFit,
    objectPosition: `${fx}% ${fy}%`,
  };

  if (z === 100) return base;

  return {
    ...base,
    transform: `scale(${z / 100})`,
    transformOrigin: `${fx}% ${fy}%`,
  };
}
