import { useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, AlertTriangle, Settings } from 'lucide-react';
import clsx from 'clsx';
import { getImageStyle } from '@/shared/lib/imageStyle';
import { NewsTypeChip } from './NewsTypeChip';
import { stripHtml, type NewsCardVM, type NewsTone } from './newsVm';
import s from './NewsPreviewCard.module.css';

interface Props {
  vm: NewsCardVM;
  /** Otevře detail-modal — celá karta je klikací. */
  onOpen: () => void;
  /** Admin akce (kebab / tlačítka). Render nad médiem, mimo klik na detail. */
  adminSlot?: ReactNode;
}

const FALLBACK_ICON: Record<NewsTone, typeof Bell> = {
  info: Bell,
  warning: AlertTriangle,
  system: Settings,
};

/**
 * Sdílená preview-karta novinky (globální i světové). 16:9 médium / fallback
 * ikona + štítek + datum + titulek + úryvek. Celá karta je klikací (stretched
 * hit-area) → `onOpen`. Admin akce sedí nad hit-areou, takže klik na ně
 * neotevře detail (sourozenci s vyšším z-indexem, žádné nested-interactive).
 */
export function NewsPreviewCard({ vm, onOpen, adminSlot }: Props) {
  const [imageError, setImageError] = useState(false);
  const FallbackIcon = FALLBACK_ICON[vm.tone];
  const showImage = vm.image && !imageError;
  const excerpt = stripHtml(vm.contentHtml);

  return (
    <article
      className={clsx(s.card, vm.archived && s.cardArchived)}
      data-elev="card"
      data-archived={vm.archived ? 'true' : 'false'}
    >
      <button
        type="button"
        className={s.hitArea}
        aria-label={`Otevřít novinku: ${vm.title}`}
        onClick={onOpen}
      />

      <div className={s.media}>
        {showImage ? (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onError = fallback při selhání načtení obrázku, ne uživatelská interakce
          <img
            src={vm.image!.url}
            alt=""
            className={s.image}
            style={getImageStyle(
              vm.image!.focalX,
              vm.image!.focalY,
              vm.image!.zoom,
              vm.image!.fit,
            )}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={s.imageFallback} aria-hidden="true">
            <FallbackIcon size={36} />
          </div>
        )}

        {adminSlot && <div className={s.adminSlot}>{adminSlot}</div>}
      </div>

      <div className={s.body}>
        <div className={s.meta}>
          <NewsTypeChip tone={vm.tone} label={vm.typeLabel} size="sm" />
          {vm.dateChipLabel && (
            <span className={s.dateChip} title={vm.dateChipTitle}>
              {vm.dateChipLabel}
            </span>
          )}
          {vm.archived && (
            <span className={s.archivedChip} aria-label="Archivováno">
              archivováno
            </span>
          )}
        </div>

        <h3 className={s.title}>{vm.title}</h3>
        <p className={s.excerpt}>{excerpt}</p>
      </div>
    </article>
  );
}
