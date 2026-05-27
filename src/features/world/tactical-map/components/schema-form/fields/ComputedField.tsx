/**
 * 10.2d-prep-A C6 — ComputedField pro EntitySchemaForm.
 * Read-only display vypočítané hodnoty z field.formula.
 */
import type { SchemaField } from '../../../schemas/types';
import { evaluateFormula } from '../formula';
import styles from './Field.module.css';

interface Props {
  field: SchemaField;
  /** Flat dot-path context (whole entity state) pro formula eval. */
  context: Record<string, unknown>;
}

export function ComputedField({ field, context }: Props): React.ReactElement {
  const value = field.formula
    ? evaluateFormula(field.formula, context)
    : null;
  return (
    <div className={styles.field}>
      <label className={styles.label} title={field.description}>
        {field.label}
      </label>
      <div className={styles.computedDisplay} aria-readonly="true">
        {value === null ? '—' : value}
      </div>
    </div>
  );
}
