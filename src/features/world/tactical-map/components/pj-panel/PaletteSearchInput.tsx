/**
 * 10.2c-edit-6 — sdílený search input pro PC / NPC / Bestiář palety.
 *
 * Plně řízený (controlled) input. Filtrování probíhá v konzumentech přes
 * `value.toLowerCase().includes(...)`. Komponenta zde drží jen UI a debounce
 * není potřeba (filtrace běží na FE in-memory).
 */
import styles from './PaletteSearchInput.module.css';

interface Props {
  value: string;
  onChange: (next: string) => void;
  /** Placeholder text — default "Hledat…". */
  placeholder?: string;
  /** Pokud `true`, zobrazí se křížek pro rychlé vymazání. */
  showClear?: boolean;
}

export function PaletteSearchInput({
  value,
  onChange,
  placeholder = 'Hledat…',
  showClear = true,
}: Props): React.ReactElement {
  return (
    <div className={styles.wrapper}>
      <input
        type="search"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {showClear && value.length > 0 && (
        <button
          type="button"
          className={styles.clear}
          onClick={() => onChange('')}
          aria-label="Vymazat vyhledávání"
          title="Vymazat"
        >
          ×
        </button>
      )}
    </div>
  );
}
