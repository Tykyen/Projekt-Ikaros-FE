import { useCallback, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import s from './ImageLightbox.module.css';

/** Jeden obrázek v prohlížeči. */
export interface LightboxImage {
  url: string;
  /** Popisek / alt — zobrazí se ve spodní liště. */
  alt?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}

/**
 * Generický fullscreen prohlížeč obrázků — klávesy ←/→/Esc, swipe na mobilu,
 * zámek scrollu pozadí. Bez vazby na konkrétní feature (4.3b — chat přílohy;
 * galerie má vlastní `Lightbox` s hodnocením a metadaty).
 */
export function ImageLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const image = images[index];
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, goPrev, goNext]);

  // Zamknout scroll pozadí po dobu otevření.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!image) return null;

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) goPrev();
    else if (delta < -50) goNext();
    touchStartX.current = null;
  }

  return (
    // Backdrop klik = myší zkratka pro zavření; klávesová cesta existuje
    // (Esc handler + zavírací křížek), overlay tak nemusí být fokusovatelný.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      className={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Prohlížeč obrázků"
      onClick={onClose}
    >
      <button
        type="button"
        className={s.close}
        onClick={onClose}
        aria-label="Zavřít"
      >
        <X size={22} />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            className={`${s.nav} ${s.navPrev}`}
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Předchozí obrázek"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            type="button"
            className={`${s.nav} ${s.navNext}`}
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Další obrázek"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Obsahový obal: onClick jen stopPropagation (klik na obrázek nezavře),
          touch = swipe navigace; není ovládací prvek. Zavření přes Esc/křížek. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={s.stage}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img src={image.url} alt={image.alt ?? ''} className={s.img} />
        {(image.alt || images.length > 1) && (
          <div className={s.caption}>
            {image.alt && <span className={s.captionText}>{image.alt}</span>}
            {images.length > 1 && (
              <span className={s.counter}>
                {index + 1} / {images.length}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
