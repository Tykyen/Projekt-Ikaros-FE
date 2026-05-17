/**
 * Cloudinary URL helper. Sdílený napříč galerií (3.3) i chatem (4.3b) —
 * proto v `shared/lib`, ne v gallery featuře.
 */

/**
 * Vloží Cloudinary transformace do URL (thumbnaily nestahují full-res).
 * `mode` `fill` ořízne na rozměr, `fit` zachová celý obraz. URL bez
 * `/upload/` (ne-Cloudinary) vrací beze změny.
 */
export function cloudinaryThumb(
  url: string,
  width: number,
  height?: number,
  mode: 'fill' | 'fit' = 'fill',
): string {
  if (!url || !url.includes('/upload/')) return url;
  const parts = [
    `w_${width}`,
    height ? `h_${height}` : '',
    `c_${mode}`,
    'q_auto',
    'f_auto',
  ].filter(Boolean);
  return url.replace('/upload/', `/upload/${parts.join(',')}/`);
}
