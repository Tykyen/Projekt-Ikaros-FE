/**
 * Krok 6.3-fix2 — cloudinary on-the-fly transformace textur kostek.
 *
 * Plné textury jsou 1024×1024 (~259 KB webp), kostka se zobrazuje ~80–140 px.
 * Vložením `w_320,f_auto,q_auto/` za `/image/upload/` se přenos zmenší ~20×
 * (ověřeno: 74 KB → 4,4 KB při w_160), on-the-fly, bez re-uploadu.
 *
 * `f_auto` = webp/avif dle prohlížeče, `q_auto` = automatická komprese.
 */

const UPLOAD_MARKER = '/image/upload/';

/**
 * Vloží transformační segment do cloudinary `/image/upload/` URL.
 * - Ne-cloudinary URL (lokální `/textures/`, externí, `undefined`) projdou beze změny.
 * - Idempotentní: segment se vloží jen před cloudinary verzi (`v<číslice>`);
 *   pokud už transformace je, nevkládá podruhé.
 */
export function cdnSized(
  url: string | undefined,
  width = 320,
): string | undefined {
  if (!url) return url;
  const i = url.indexOf(UPLOAD_MARKER);
  if (i === -1) return url;
  const head = url.slice(0, i + UPLOAD_MARKER.length);
  const tail = url.slice(i + UPLOAD_MARKER.length);
  // Cloudinary verze začíná `v` + číslicí. Cokoli jiného (např. `w_320,...`)
  // = už existující transformace → nevkládat znovu.
  if (!/^v\d/.test(tail)) return url;
  return `${head}w_${width},f_auto,q_auto/${tail}`;
}
