/**
 * 10.2d-prep-A C6 — ListField pro EntitySchemaForm.
 * Array of objects renderer. Sub-fields per `field.listItemFields`.
 * Inline add/remove řádky.
 */
import type { SchemaField } from '../../../schemas/types';
import styles from './Field.module.css';

interface Props {
  field: SchemaField;
  value: unknown;
  onChange: (next: Array<Record<string, unknown>>) => void;
  disabled?: boolean;
}

export function ListField({
  field,
  value,
  onChange,
  disabled,
}: Props): React.ReactElement {
  const items: Array<Record<string, unknown>> = Array.isArray(value)
    ? (value as Array<Record<string, unknown>>)
    : [];
  const subFields = field.listItemFields ?? [];

  const handleAdd = (): void => {
    const empty: Record<string, unknown> = {};
    for (const sub of subFields) {
      if (sub.default !== undefined) empty[sub.key] = sub.default;
    }
    onChange([...items, empty]);
  };

  const handleRemove = (idx: number): void => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const handleUpdateItem = (idx: number, key: string, val: unknown): void => {
    onChange(items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));
  };

  // FIX-4 — clamp number sub-fields na jejich min/max (mirror NumberField).
  function clampNumber(raw: string, min?: number, max?: number): number {
    const n = Number(raw);
    const v = Number.isFinite(n) ? n : 0;
    return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));
  }

  return (
    <div className={styles.listField}>
      <div className={styles.listHeader}>
        <span className={styles.label}>{field.label}</span>
        <button
          type="button"
          className={styles.listAddBtn}
          onClick={handleAdd}
          disabled={disabled}
          aria-label={`Přidat ${field.label}`}
        >
          + Přidat
        </button>
      </div>
      {items.length === 0 && (
        <p className={styles.listEmpty}>Žádné položky.</p>
      )}
      {items.map((item, idx) => (
        <div key={idx} className={styles.listItem}>
          {subFields.map((sub) => (
            <div key={sub.key} className={styles.listItemField}>
              <label className={styles.listItemLabel}>{sub.label}</label>
              {sub.type === 'enum' ? (
                <select
                  className={styles.input}
                  value={
                    (item[sub.key] as string | undefined) ??
                    (sub.default as string | undefined) ??
                    ''
                  }
                  onChange={(e) => handleUpdateItem(idx, sub.key, e.target.value)}
                  disabled={disabled}
                >
                  {(sub.enumValues ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={sub.type === 'number' ? 'number' : 'text'}
                  className={styles.input}
                  value={(item[sub.key] as string | number | undefined) ?? ''}
                  min={sub.type === 'number' ? sub.min : undefined}
                  max={sub.type === 'number' ? sub.max : undefined}
                  onChange={(e) =>
                    handleUpdateItem(
                      idx,
                      sub.key,
                      sub.type === 'number'
                        ? clampNumber(e.target.value, sub.min, sub.max)
                        : e.target.value,
                    )
                  }
                  disabled={disabled}
                />
              )}
            </div>
          ))}
          <button
            type="button"
            className={styles.listRemoveBtn}
            onClick={() => handleRemove(idx)}
            disabled={disabled}
            aria-label="Smazat položku"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
