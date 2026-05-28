/**
 * 10.2c-edit-9b — wrapper kolem `DiaryTab` pro embedding v `TokenStatbarModal`.
 *
 * Reuse existing DiaryTab (8.1b + 8.5 + 8.7) — žádný copy-paste. Token modal
 * je v TacticalMapView uvnitř WorldLayout, takže `useWorldContext` v DiaryTab
 * funguje.
 *
 * Sticky bar (EditStickyBar) z DiaryTab zůstává — uvnitř modal scroll area
 * to vypadá jako sticky bottom modal body. Akceptovatelné.
 *
 * Plán: docs/arch/phase-10/plan-10.2c-edit-9bc.md §3.2.
 */
import { DiaryTab } from '@/features/world/pages/CharacterDetailPage/components/DiaryTab';
import styles from './TokenDiaryTab.module.css';

interface Props {
  characterSlug: string;
  canEdit: boolean;
  onDirtyChange: (dirty: boolean) => void;
}

export function TokenDiaryTab({
  characterSlug,
  canEdit,
  onDirtyChange,
}: Props): React.ReactElement {
  return (
    <div className={styles.embed}>
      <DiaryTab
        slug={characterSlug}
        mode={canEdit ? 'edit' : 'view'}
        onExitEdit={() => {
          /* Modal close = exit; in-tab toggle disabled */
        }}
        onDirtyChange={onDirtyChange}
      />
    </div>
  );
}
