/**
 * 10.2d-prep-A C6 — NumberField pro EntitySchemaForm.
 * Generic number input s min/max validation.
 */
import type { SchemaField } from '../../../schemas/types';
import styles from './Field.module.css';

interface Props {
  field: SchemaField;
  value: unknown;
  onChange: (next: number) => void;
  error?: string;
  disabled?: boolean;
}

export function NumberField({
  field,
  value,
  onChange,
  error,
  disabled,
}: Props): React.ReactElement {
  const num = typeof value === 'number' ? value : Number(value) || 0;
  return (
    <div className={styles.field}>
      <label className={styles.label} title={field.description}>
        {field.label}
        {field.required && <span className={styles.required}>*</span>}
      </label>
      <input
        type="number"
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        value={Number.isFinite(num) ? num : 0}
        min={field.min}
        max={field.max}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        aria-invalid={!!error}
        aria-label={field.label}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
