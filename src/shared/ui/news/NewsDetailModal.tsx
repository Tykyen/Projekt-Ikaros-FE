import type { ReactNode } from 'react';
import { Modal } from '@/shared/ui/Modal/Modal';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { getImageStyle } from '@/shared/lib/imageStyle';
import { NewsTypeChip } from './NewsTypeChip';
import type { NewsCardVM } from './newsVm';
import s from './NewsDetailModal.module.css';

interface Props {
  vm: NewsCardVM;
  open: boolean;
  onClose: () => void;
  /**
   * 20B (Fáze B5) — volitelný akční slot (typicky „Nahlásit"). Doménový adaptér
   * (WorldNewsCard) sem vloží `ReportButton` s worldId/autorem; sdílený modal
   * o moderaci nic neví. Global novinky slot nepředají → nic se nevykreslí.
   */
  reportSlot?: ReactNode;
}

/**
 * Detail-okno novinky — vystředěný overlay nad ztmavenou stránkou (sdílený
 * `Modal`: backdrop, ×, Escape, klik do pozadí, focus-trap). Velký hero
 * obrázek nahoře, štítek + plné datum, plný obsah, doménová patička.
 */
export function NewsDetailModal({ vm, open, onClose, reportSlot }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={vm.title} size="lg">
      <div className={s.detail}>
        {vm.image && (
          <div className={s.hero}>
            <img
              src={vm.image.url}
              alt=""
              className={s.heroImg}
              style={getImageStyle(
                vm.image.focalX,
                vm.image.focalY,
                vm.image.zoom,
                vm.image.fit,
              )}
            />
          </div>
        )}

        <div className={s.meta}>
          <NewsTypeChip tone={vm.tone} label={vm.typeLabel} />
          {vm.fullDateLabel && <span className={s.date}>{vm.fullDateLabel}</span>}
          {vm.archived && (
            <span className={s.archivedChip} aria-label="Archivováno">
              archivováno
            </span>
          )}
          {reportSlot && <span className={s.reportSlot}>{reportSlot}</span>}
        </div>

        <RichTextEditor
          value={vm.contentHtml}
          readOnly
          className={s.content}
          ariaLabel={`Obsah novinky ${vm.title}`}
        />

        {vm.footer && <div className={s.footer}>{vm.footer}</div>}
      </div>
    </Modal>
  );
}
