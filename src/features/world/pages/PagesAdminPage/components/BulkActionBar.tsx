import { Trash2, X } from 'lucide-react';
import s from './BulkActionBar.module.css';

interface Props {
  selectedCount: number;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
}

/**
 * 7.4 — Lišta hromadných akcí. Zobrazí se, když je vybrán aspoň jeden
 * řádek tabulky správy stránek.
 */
export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onDeleteSelected,
}: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className={s.bar} role="region" aria-label="Hromadné akce">
      <span className={s.count}>
        Vybráno: <strong>{selectedCount}</strong>
      </span>
      <div className={s.actions}>
        <button
          type="button"
          className={s.deleteBtn}
          onClick={onDeleteSelected}
        >
          <Trash2 size={14} aria-hidden /> Smazat vybrané
        </button>
        <button
          type="button"
          className={s.clearBtn}
          onClick={onClearSelection}
          aria-label="Zrušit výběr"
        >
          <X size={14} aria-hidden />
        </button>
      </div>
    </div>
  );
}
