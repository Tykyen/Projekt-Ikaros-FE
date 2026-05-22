import { Save, Trash2, Loader2 } from 'lucide-react';
import s from './EditorStickyBar.module.css';

interface Props {
  isEdit: boolean;
  isPending: boolean;
  canSave: boolean;
  onSave: () => void;
  onDelete?: () => void;
  /** Override textu tlačítka (např. „Uložit do <stránka>" při slug-kolizi). */
  saveLabel?: string;
}

/**
 * 7.2 — Sticky bottom bar — Save + Delete (jen edit mode). Tlačítko Save je
 * disabled pokud `!canSave` (validace selhala nebo žádné změny).
 */
export function EditorStickyBar({
  isEdit,
  isPending,
  canSave,
  onSave,
  onDelete,
  saveLabel,
}: Props) {
  return (
    <footer className={s.bar}>
      <div className={s.actions}>
        {isEdit && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className={s.btnDanger}
            title="Smazat stránku"
          >
            <Trash2 size={14} aria-hidden /> Smazat
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={isPending || !canSave}
          className={s.btnPrimary}
        >
          {isPending ? (
            <Loader2 size={14} aria-hidden className={s.spinner} />
          ) : (
            <Save size={14} aria-hidden />
          )}
          {saveLabel ?? (isEdit ? 'Uložit změny' : 'Vytvořit stránku')}
        </button>
      </div>
    </footer>
  );
}
