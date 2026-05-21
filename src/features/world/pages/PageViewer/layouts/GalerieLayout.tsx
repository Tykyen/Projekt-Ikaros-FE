import { useMemo, useState } from 'react';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { AkjBanner } from '../components/AkjBanner';
import { GalleryLightbox, type LightboxImage } from '../components/GalleryLightbox';
import { PageSections } from '../components/PageSections';
import type { Page } from '../../api/pages.types';
import s from './GalerieLayout.module.css';

interface Props {
  page: Page;
}

/**
 * 7.1b — Layout pro typ Galerie. Grid `auto-fill, minmax(280px, 1fr)`,
 * karty 3:2 aspect-ratio. Klik = lightbox modal s prev/next navigací.
 *
 * Pokud galerie je prázdná (`galleryImages` = []), zobrazíme placeholder
 * + (pokud PomocnyPJ+) shortcut do editoru.
 */
export function GalerieLayout({ page }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const sorted = useMemo(
    () => [...page.galleryImages].sort((a, b) => a.order - b.order),
    [page.galleryImages],
  );

  const lightboxImages: LightboxImage[] = sorted.map((g) => ({
    src: g.url,
    alt: g.caption ?? page.title,
    caption: g.caption,
  }));

  return (
    <div className={s.layout}>
      <AkjBanner accessRequirements={page.accessRequirements} />

      {page.content.trim().length > 0 && (
        <div className={s.proseWrap} data-article-content>
          <RichTextEditor value={page.content} readOnly className={s.prose} />
        </div>
      )}

      {sorted.length === 0 ? (
        <div className={s.empty}>
          <p>V této galerii ještě nejsou žádné obrázky.</p>
        </div>
      ) : (
        <ul className={s.grid}>
          {sorted.map((g, idx) => (
            <li key={g.id} className={s.card}>
              <button
                type="button"
                className={s.cardBtn}
                onClick={() => setOpenIndex(idx)}
                aria-label={`Otevřít obrázek: ${g.caption ?? page.title}`}
              >
                <img
                  src={g.url}
                  alt={g.caption ?? ''}
                  loading="lazy"
                  className={s.cardImg}
                />
              </button>
              {g.caption && <p className={s.cardCaption}>{g.caption}</p>}
            </li>
          ))}
        </ul>
      )}

      <PageSections sections={page.sections} />

      <GalleryLightbox
        images={lightboxImages}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </div>
  );
}
