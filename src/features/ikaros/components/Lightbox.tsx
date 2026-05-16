import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { currentUserAtom } from '@/shared/store/authStore';
import { useRateGalleryImage } from '../api/useGallery';
import { categoryByKey } from '../lib/gallery';
import { RatingStars } from './RatingStars';
import type { GalleryCategory, IkarosGalleryItem } from '@/shared/types';
import s from './Lightbox.module.css';

interface Props {
  images: IkarosGalleryItem[];
  index: number;
  categories: GalleryCategory[];
  onClose: () => void;
  onIndexChange: (next: number) => void;
}

/**
 * 3.3d — fullscreen prohlížeč galerie ve vizuálním směru „Salon".
 * Tmavé plátno (passepartout), klávesy ←/→/Esc, swipe na mobilu.
 */
export function Lightbox({
  images,
  index,
  categories,
  onClose,
  onIndexChange,
}: Props) {
  const image = images[index];
  const user = useAtomValue(currentUserAtom);
  const rate = useRateGalleryImage();
  const [myRating, setMyRating] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Reset „mého hodnocení" při přepnutí obrázku — render-time pattern
  // (set state během renderu se stráží přes prev id; React doporučený postup
  // místo useEffect, žádný extra render).
  const [ratedImageId, setRatedImageId] = useState(image?.id);
  if (image?.id !== ratedImageId) {
    setRatedImageId(image?.id);
    setMyRating(0);
  }

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange]);

  // Klávesová navigace.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, goPrev, goNext]);

  // Zamknout scroll pozadí.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!image) return null;

  const cat = categoryByKey(categories, image.category);
  const isAuthor = user?.id === image.authorId;
  const canRate = !!user && !isAuthor;

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

  function handleRate(stars: number) {
    rate.mutate(
      { id: image.id, stars },
      {
        onSuccess: () => {
          setMyRating(stars);
          toast.success('Hodnocení uloženo');
        },
        onError: () => toast.error('Nepodařilo se uložit hodnocení'),
      },
    );
  }

  return (
    <div
      className={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`Obrázek: ${image.title}`}
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

      <div
        className={s.stage}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img src={image.imageUrl} alt={image.title} className={s.img} />

        <div className={s.label}>
          <div className={s.labelMain}>
            <h2 className={s.title}>{image.title}</h2>
            <Link to={`/ikaros/galerie/${image.id}`} className={s.detailLink}>
              <ExternalLink size={13} /> Detail
            </Link>
          </div>
          <div className={s.meta}>
            <span className={s.author}>{image.authorName}</span>
            <span className={s.dot}>·</span>
            <span style={{ color: 'var(--gal-cat-current)' }}>
              {cat.label}
            </span>
          </div>
          {image.description && (
            <p className={s.desc}>{image.description}</p>
          )}
          <div className={s.rating}>
            <RatingStars
              average={image.averageRating}
              count={image.ratings.length}
              myRating={myRating}
              onRate={canRate ? handleRate : undefined}
              disabled={rate.isPending}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
