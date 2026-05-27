/**
 * 10.2d-prep-A C6 — EnumField pro EntitySchemaForm.
 * Select s field.enumValues.
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

export function EnumField({
  field,
  value,
  onChange,
  error,
  disabled,
}: Props): React.ReactElement {
  const str = typeof value === 'string' ? value : '';
  const options = field.enumValues ?? [];
  return (
    <div className={styles.field}>
      <label className={styles.label} title={field.description}>
        {field.label}
        {field.required && <span className={styles.required}>*</span>}
      </label>
      <select
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        value={str}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={!!error}
        aria-label={field.label}
      >
        {!field.required && <option value="">—</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
