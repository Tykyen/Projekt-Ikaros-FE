import { Link } from 'react-router-dom';
import {
  aspectRatio,
  categoryByKey,
  categoryStyle,
  cloudinaryThumb,
  statusColor,
  statusLabel,
} from '../lib/gallery';
import type { GalleryCategory, IkarosGalleryItem } from '@/shared/types';
import s from './GalleryCard.module.css';

interface Props {
  image: IkarosGalleryItem;
  categories: GalleryCategory[];
  isMine?: boolean;
  /** Klik na obraz — otevře lightbox (3.3d). Bez něj = Link na detail. */
  onOpen?: (image: IkarosGalleryItem) => void;
}

/**
 * 3.3 — karta galerie ve vizuálním směru „Salon": obraz v tichém rámu,
 * pod ním muzejní cedulka (wall label). Hover zvedne obraz ze stěny.
 */
export function GalleryCard({ image, categories, isMine, onOpen }: Props) {
  const cat = categoryByKey(categories, image.category);
  const ratio = aspectRatio(image);

  // Vlastní Draft/Rejected → rovnou editor; jinak detail.
  const editLink =
    isMine && (image.status === 'Draft' || image.status === 'Rejected')
      ? `/ikaros/galerie/${image.id}/upravit`
      : `/ikaros/galerie/${image.id}`;

  const figure = (
    <figure className={s.figure} style={categoryStyle(cat)}>
      <div className={s.frame} style={{ aspectRatio: String(ratio) }}>
        <img
          src={cloudinaryThumb(image.imageUrl, 600)}
          alt={image.title}
          className={s.img}
          loading="lazy"
        />
      </div>
      <figcaption className={s.label}>
        <span className={s.title}>{image.title}</span>
        <span className={s.sub}>
          <span className={s.author}>{image.authorName}</span>
          <span className={s.dot}>·</span>
          <span className={s.category}>{cat.label}</span>
          {isMine && image.status !== 'Published' && (
            <>
              <span className={s.dot}>·</span>
              <span style={{ color: statusColor(image.status) }}>
                {statusLabel(image.status)}
              </span>
            </>
          )}
        </span>
      </figcaption>
    </figure>
  );

  // onOpen → lightbox (button); jinak navigace na detail/editor.
  if (onOpen && image.status === 'Published') {
    return (
      <button
        type="button"
        className={s.card}
        onClick={() => onOpen(image)}
        aria-label={`Otevřít obrázek ${image.title}`}
      >
        {figure}
      </button>
    );
  }

  return (
    <Link to={editLink} className={s.card}>
      {figure}
    </Link>
  );
}
