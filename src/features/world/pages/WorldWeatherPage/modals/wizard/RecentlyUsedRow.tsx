/**
 * 9.4-I — Recently used preset chips nad rozcestím (Stage 1).
 *
 * Klik na chip → skip rest of wizard, pošle „use" event s konfigem do
 * parent modálu. Render-noop pokud žádné recents.
 */
import s from './RecentlyUsedRow.module.css';
import type { PresetItem } from './types';

interface Props {
  items: PresetItem[];
  onPick: (item: PresetItem) => void;
}

export function RecentlyUsedRow({ items, onPick }: Props) {
  if (items.length === 0) return null;
  return (
    <div className={s.row}>
      <div className={s.label}>▸ Naposledy použité</div>
      <div className={s.chips}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={s.chip}
            onClick={() => onPick(item)}
            aria-label={`Použít preset ${item.displayName}`}
          >
            <span className={s.glyph} aria-hidden>
              {item.glyph}
            </span>
            <span className={s.name}>{item.displayName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
