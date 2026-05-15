import { GalleryCard } from './GalleryCard';
import type { GalleryCategory, IkarosGalleryItem } from '@/shared/types';
import s from './GalleryGrid.module.css';

interface Props {
  images: IkarosGalleryItem[];
  categories: GalleryCategory[];
  isMine?: boolean;
  onOpen?: (image: IkarosGalleryItem) => void;
}

/**
 * 3.3 — masonry mřížka přes CSS `columns` (2 mobil / 3 tablet / 4–5 desktop).
 * Žádná JS knihovna; karty si drží poměr stran (vizuál „Salon").
 */
export function GalleryGrid({ images, categories, isMine, onOpen }: Props) {
  return (
    <div className={s.grid}>
      {images.map((img) => (
        <GalleryCard
          key={img.id}
          image={img}
          categories={categories}
          isMine={isMine}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
