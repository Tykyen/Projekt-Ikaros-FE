/**
 * 10.2c-edit-9b — wrapper kolem `NotesTab` pro embedding v `TokenStatbarModal`.
 *
 * NotesTab má inline autosave (800ms debounce) a auth gating řeší BE
 * (vlastník / PJ vidí; ostatní 403). Wrapper jen omezuje výšku a propaguje
 * `onDirtyChange`.
 *
 * Plán: docs/arch/phase-10/plan-10.2c-edit-9bc.md §3.5 (Poznámky tab).
 */
import { NotesTab } from '@/features/world/pages/CharacterDetailPage/components/NotesTab';
import styles from './TokenDiaryTab.module.css';

interface Props {
  characterSlug: string;
  onDirtyChange: (dirty: boolean) => void;
}

export function TokenNotesTab({
  characterSlug,
  onDirtyChange,
}: Props): React.ReactElement {
  return (
    <div className={styles.embed}>
      <NotesTab
        slug={characterSlug}
        mode="edit"
        onDirtyChange={onDirtyChange}
      />
    </div>
  );
}
