import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import s from './GalleryLightbox.module.css';

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

interface Props {
  images: LightboxImage[];
  /** Index aktuálního obrázku; null = zavřený. */
  index: number | null;
  onClose: () => void;
  /** Volitelný callback při změně indexu (parent může synchronizovat URL). */
  onIndexChange?: (next: number) => void;
}

/**
 * 7.1f — Reusable fullscreen lightbox modal. Použito v:
 *  • GalerieLayout (klik na grid kartu)
 *  • Inline image lightbox (klik na <img> v TipTap obsahu, Fáze 3)
 *
 * Klávesy: ESC = zavřít, Šipky = prev/next. Klik mimo obrázek = zavřít.
 * Mobile swipe — Fáze 6 polish (zatím tlačítka).
 *
 * Portál do `document.body`, aby focus trap fungoval mimo PageViewer.
 */
export function GalleryLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: Props) {
  const [current, setCurrent] = useState(index ?? 0);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync prop index → current (R19 adjustment-during-render místo useEffect).
  const [prevIndex, setPrevIndex] = useState(index);
  if (index !== prevIndex) {
    setPrevIndex(index);
    if (index !== null) setCurrent(index);
  }

  const goTo = useCallback(
    (next: number) => {
      if (images.length === 0) return;
      const wrapped = ((next % images.length) + images.length) % images.length;
      setCurrent(wrapped);
      onIndexChange?.(wrapped);
    },
    [images.length, onIndexChange],
  );

  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);
  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);

  useEffect(() => {
    if (index === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, onClose, goPrev, goNext]);

  if (index === null || images.length === 0) return null;

  const img = images[current];

  return createPortal(
    // Backdrop klik = myší zkratka pro zavření; klávesová cesta existuje
    // (Esc handler + zavírací křížek), overlay tak nemusí být fokusovatelný.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={overlayRef}
      className={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Galerie — fullscreen prohlížeč"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <button
        type="button"
        className={s.closeBtn}
        onClick={onClose}
        aria-label="Zavřít (Esc)"
      >
        <X size={22} aria-hidden />
      </button>

      {images.length > 1 && (
        <button
          type="button"
          className={`${s.navBtn} ${s.navPrev}`}
          onClick={goPrev}
          aria-label="Předchozí obrázek"
        >
          <ChevronLeft size={28} aria-hidden />
        </button>
      )}

      <figure className={s.figure}>
        <img src={img.src} alt={img.alt} className={s.image} />
        {img.caption && <figcaption className={s.caption}>{img.caption}</figcaption>}
        {images.length > 1 && (
          <div className={s.counter} aria-live="polite">
            {current + 1} / {images.length}
          </div>
        )}
      </figure>

      {images.length > 1 && (
        <button
          type="button"
          className={`${s.navBtn} ${s.navNext}`}
          onClick={goNext}
          aria-label="Další obrázek"
        >
          <ChevronRight size={28} aria-hidden />
        </button>
      )}
    </div>,
    document.body,
  );
}
