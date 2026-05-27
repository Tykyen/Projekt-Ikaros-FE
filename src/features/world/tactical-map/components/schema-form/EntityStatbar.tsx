/**
 * 10.2d-prep-A C8 — EntityStatbar view komponenta.
 *
 * Read-only render entity přes schema. Pole s `combatBehavior='damageable'`
 * dostanou HP-bar styled progress; ostatní jen label + value.
 *
 * `editable=true` → přepíná do `<EntitySchemaForm>` (inline edit).
 *
 * Plán: docs/arch/phase-10/plan-10.2d-prep-A.md C8.
 */
import type { SchemaField, SystemEntitySchema } from '../../schemas/types';
import { evaluateFormula } from './formula';
import { EntitySchemaForm } from './EntitySchemaForm';
import styles from './EntityStatbar.module.css';

interface Props {
  schema: SystemEntitySchema;
  value: Record<string, unknown>;
  editable?: boolean;
  onChange?: (next: Record<string, unknown>) => void;
  /** Pokud true, omezí na pole s combatBehavior (kompaktní karta). */
  compact?: boolean;
}

export function EntityStatbar({
  schema,
  value,
  editable,
  onChange,
  compact,
}: Props): React.ReactElement {
  if (editable && onChange) {
    return (
      <EntitySchemaForm
        schema={schema}
        value={value}
        onChange={onChange}
      />
    );
  }

  return (
    <div className={styles.statbar}>
      {schema.sections.map((section) => {
        const visibleFields = compact
          ? section.fields.filter((f) => f.combatBehavior)
          : section.fields;
        if (visibleFields.length === 0) return null;

        return (
          <section key={section.key} className={styles.section}>
            {!compact && section.label && (
              <h5 className={styles.sectionTitle}>{section.label}</h5>
            )}
            <div className={styles.fieldsList}>
              {visibleFields.map((field) => (
                <StatField key={field.key} field={field} value={value} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

interface StatFieldProps {
  field: SchemaField;
  value: Record<string, unknown>;
}

function StatField({ field, value }: StatFieldProps): React.ReactElement {
  const raw = value[field.key];

  if (field.type === 'computed' && field.formula) {
    const computed = evaluateFormula(field.formula, value);
    return (
      <div className={styles.statRow}>
        <span className={styles.statLabel}>{field.label}</span>
        <span className={styles.statValue}>{computed === null ? '—' : computed}</span>
      </div>
    );
  }

  // Damageable → progress bar (current/max).
  if (field.combatBehavior === 'damageable') {
    const current = typeof raw === 'number' ? raw : 0;
    // Hledáme matching `*.max` field (např. health.current → health.max).
    const maxKey = field.key.replace(/\.current$/, '.max');
    const maxValue =
      typeof value[maxKey] === 'number' ? (value[maxKey] as number) : current;
    const percent = maxValue > 0 ? Math.max(0, Math.min(100, (current / maxValue) * 100)) : 0;
    const colorClass =
      percent > 60 ? styles.barFull : percent > 30 ? styles.barMid : styles.barLow;
    return (
      <div className={styles.statBar}>
        <div className={styles.statBarHeader}>
          <span className={styles.statLabel}>{field.label}</span>
          <span className={styles.statValue}>
            {current} / {maxValue}
          </span>
        </div>
        <div className={styles.barTrack}>
          <div
            className={`${styles.barFill} ${colorClass}`}
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={current}
            aria-valuemin={0}
            aria-valuemax={maxValue}
            aria-label={field.label}
          />
        </div>
      </div>
    );
  }

  // Default: label + value
  const display =
    raw === null || raw === undefined
      ? '—'
      : typeof raw === 'object'
        ? JSON.stringify(raw)
        : String(raw);
  return (
    <div className={styles.statRow}>
      <span className={styles.statLabel}>{field.label}</span>
      <span className={styles.statValue}>{display}</span>
    </div>
  );
}
