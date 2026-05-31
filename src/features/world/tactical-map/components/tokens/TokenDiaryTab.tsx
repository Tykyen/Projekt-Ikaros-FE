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
import { DiaryTab } from "@/features/world/pages/CharacterDetailPage/components/DiaryTab";
import type { SystemSheetProps } from "@/features/world/pages/CharacterDetailPage/diary-systems/types";
import styles from "./TokenDiaryTab.module.css";

interface Props {
  characterSlug: string;
  canEdit: boolean;
  onDirtyChange: (dirty: boolean) => void;
  /**
   * 10.2j Task H — forward sheet roll handler do embedded DiaryTab, ať klik
   * na dovednost/iniciativu v deníku zamíří do map dice systému. Bez něj
   * deníkové rolly na mapě no-opovaly (bug fix).
   */
  onRoll?: SystemSheetProps["onRoll"];
}

export function TokenDiaryTab({
  characterSlug,
  canEdit,
  onDirtyChange,
  onRoll,
}: Props): React.ReactElement {
  return (
    <div className={styles.embed}>
      <DiaryTab
        slug={characterSlug}
        mode={canEdit ? "edit" : "view"}
        onExitEdit={() => {
          /* Modal close = exit; in-tab toggle disabled */
        }}
        onDirtyChange={onDirtyChange}
        onRoll={onRoll}
      />
    </div>
  );
}
