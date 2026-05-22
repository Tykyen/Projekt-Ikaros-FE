import { Save, X, Loader2 } from 'lucide-react';
import s from './EditStickyBar.module.css';

interface Props {
  /** Jsou neuložené změny? Řídí indikátor + `disabled` tlačítka Uložit. */
  dirty: boolean;
  /** Běží mutace — zamkne obě tlačítka, na Uložit ukáže spinner. */
  isPending: boolean;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * 8.1 — Sticky lišta režimu úprav detailu postavy. Vzor `EditorStickyBar`
 * (PageEditor), ale tokeny sjednoceny s vizuálem detailu postavy.
 */
export function EditStickyBar({ dirty, isPending, onSave, onCancel }: Props) {
  return (
    <footer className={s.bar}>
      <div className={s.inner}>
        <span className={s.status} aria-live="polite">
          {dirty && (
            <>
              <span className={s.dot} aria-hidden /> Neuložené změny
            </>
          )}
        </span>
        <div className={s.actions}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className={s.btnGhost}
          >
            <X size={14} aria-hidden /> Zrušit
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isPending || !dirty}
            className={s.btnPrimary}
          >
            {isPending ? (
              <Loader2 size={14} aria-hidden className={s.spinner} />
            ) : (
              <Save size={14} aria-hidden />
            )}
            Uložit změny
          </button>
        </div>
      </div>
    </footer>
  );
}
