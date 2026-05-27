/**
 * 10.2d-prep-A C6 — TextField pro EntitySchemaForm.
 * Text input (single line). Multiline subtype defer.
 */
import type { SchemaField } from '../../../schemas/types';
import styles from './Field.module.css';

interface Props {
  field: SchemaField;
  value: unknown;
  onChange: (next: string) => void;
  error?: string;
  disabled?: boolean;
}

export function TextField({
  field,
  value,
  onChange,
  error,
  disabled,
}: Props): React.ReactElement {
  const str = typeof value === 'string' ? value : value == null ? '' : String(value);
  return (
    <div className={styles.field}>
      <label className={styles.label} title={field.description}>
        {field.label}
        {field.required && <span className={styles.required}>*</span>}
      </label>
      <input
        type="text"
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        value={str}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={!!error}
        aria-label={field.label}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
