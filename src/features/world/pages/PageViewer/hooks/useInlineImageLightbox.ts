import { useEffect, useState, type RefObject } from 'react';
import type { LightboxImage } from '../components/GalleryLightbox';

interface InlineLightboxState {
  images: LightboxImage[];
  index: number | null;
  open: (idx: number) => void;
  close: () => void;
  setIndex: (idx: number) => void;
}

/**
 * 7.1f — Inline image lightbox. Po renderu projde všechny `<img>` v containeru,
 * obalí každý do click-handleru, který otevře GalleryLightbox s konkrétním
 * indexem.
 *
 * Edge case: pokud `<img>` je už uvnitř `<a>` (link) nebo `[data-no-lightbox]`
 * (např. `ZoomableImage` rodokmenu — má vlastní pan/zoom), inline lightbox se
 * nezapne (jinak by klik otevíral lightbox místo posunu obrázku).
 */
export function useInlineImageLightbox(
  containerRef: RefObject<HTMLElement | null>,
  revision: unknown,
): InlineLightboxState {
  const [images, setImages] = useState<LightboxImage[]>([]);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const imgs = Array.from(
      containerRef.current.querySelectorAll<HTMLImageElement>('img'),
    ).filter((img) => !img.closest('a') && !img.closest('[data-no-lightbox]'));

    if (imgs.length === 0) {
      setImages([]);
      return;
    }

    const collected: LightboxImage[] = imgs.map((img) => ({
      src: img.currentSrc || img.src,
      alt: img.alt || '',
      caption: img.getAttribute('data-caption') || undefined,
    }));
    setImages(collected);

    const cleanups: Array<() => void> = [];
    imgs.forEach((img, idx) => {
      img.style.cursor = 'zoom-in';
      const handler = (e: Event) => {
        e.preventDefault();
        setIndex(idx);
      };
      img.addEventListener('click', handler);
      img.setAttribute('role', 'button');
      img.setAttribute('tabindex', '0');
      img.setAttribute('aria-label', `Zvětšit obrázek: ${img.alt || 'bez popisku'}`);

      cleanups.push(() => {
        img.removeEventListener('click', handler);
        img.style.cursor = '';
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [containerRef, revision]);

  return {
    images,
    index,
    open: (idx) => setIndex(idx),
    close: () => setIndex(null),
    setIndex,
  };
}
