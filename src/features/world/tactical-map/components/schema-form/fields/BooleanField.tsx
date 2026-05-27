/**
 * 10.2d-prep-A C6 — BooleanField pro EntitySchemaForm.
 * Checkbox.
 */
import type { SchemaField } from '../../../schemas/types';
import styles from './Field.module.css';

interface Props {
  field: SchemaField;
  value: unknown;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

export function BooleanField({
  field,
  value,
  onChange,
  disabled,
}: Props): React.ReactElement {
  const bool = Boolean(value);
  return (
    <div className={`${styles.field} ${styles.fieldInline}`}>
      <label className={styles.checkboxLabel} title={field.description}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={bool}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-label={field.label}
        />
        <span>{field.label}</span>
      </label>
    </div>
  );
}
