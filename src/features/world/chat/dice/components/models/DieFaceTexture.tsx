import React from 'react';
import { cdnSized } from '../../lib/cdnImage';

interface DieFaceTextureProps {
  /** URL textury tváře. Když chybí, nevykreslí se nic (vidět zůstane CSS číslo). */
  src?: string;
  /** Volitelné zaoblení (Fate kostka). */
  borderRadius?: string;
}

/**
 * Krok 6.3-fix (nález 1) — textura tváře jako overlay `<img>` nad CSS číslem.
 *
 * Číslo/symbol kostky je v modelu vykreslen VŽDY; tahle textura ho překryje.
 * Když se textura nenačte (výpadek/CORS/404 cizího cloudinary), `onError` ji
 * DOM-skryje (`display:none`) a pod ní se odkryje CSS číslo — kostka tak nikdy
 * není prázdná. Bez React state → nulový re-render.
 *
 * Vizuál při úspěchu = shodný s původním `background:url() cover` (img je
 * `object-fit:cover` přes celou tvář).
 */
export const DieFaceTexture: React.FC<DieFaceTextureProps> = ({
  src,
  borderRadius,
}) => {
  if (!src) return null;
  return (
    <img
      src={cdnSized(src)}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className="die-face-tex"
      style={borderRadius ? { borderRadius } : undefined}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};
