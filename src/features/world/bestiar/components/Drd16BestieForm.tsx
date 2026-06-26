/**
 * 16.2b-bestie Cesta B — custom DrD 1.6 bestie editor (explicitní layout).
 *
 * Náhrada generického `EntitySchemaForm` pro `systemId === 'drd16'` (větev v
 * `BestieEditorModal`). Stejné props (value=systemStats, onChange, errors).
 * Řízené rozložení dle přání: Útoky vlastní řádek, Pohyblivost+způsob na jedné
 * řádce, čísla úzká (3-cif.) kromě Zkušenosti (širší), čísla i do záporu.
 * Útoky (list) reuse generického `ListField`.
 */
import type { ReactNode } from 'react';
import type {
  SystemEntitySchema,
  SchemaField,
} from '@/features/world/tactical-map/schemas/types';
import { ListField } from '@/features/world/tactical-map/components/schema-form/fields/ListField';
import styles from './Drd16BestieForm.module.css';

interface Props {
  schema: SystemEntitySchema;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

type NumVariant = 'num' | 'numWide' | 'tiny';

export function Drd16BestieForm({
  schema,
  value,
  onChange,
  errors,
  disabled,
}: Props): React.ReactElement {
  const fields = new Map<string, SchemaField>();
  for (const s of schema.sections) {
    for (const f of s.fields) fields.set(f.key, f);
  }

  const set = (k: string, v: unknown): void => onChange({ ...value, [k]: v });

  const num = (k: string, label: string, variant: NumVariant = 'num'): ReactNode => {
    const err = errors?.[k];
    const v = value[k];
    return (
      <label className={`${styles.field} ${styles[variant]}`} key={k}>
        <span className={styles.label}>
          {label}
          {fields.get(k)?.required && <span className={styles.required}>*</span>}
        </span>
        <input
          type="number"
          className={`${styles.input} ${err ? styles.inputError : ''}`}
          value={v === undefined || v === null ? '' : String(v)}
          onChange={(e) =>
            set(k, e.target.value === '' ? undefined : Number(e.target.value))
          }
          disabled={disabled}
          aria-label={label}
        />
        {err && <p className={styles.error}>{err}</p>}
      </label>
    );
  };

  const txt = (
    k: string,
    label: string,
    variant: 'grow' | 'tiny' = 'grow',
  ): ReactNode => {
    const err = errors?.[k];
    const v = value[k];
    return (
      <label className={`${styles.field} ${styles[variant]}`} key={k}>
        <span className={styles.label}>{label}</span>
        <input
          type="text"
          className={`${styles.input} ${err ? styles.inputError : ''}`}
          value={v === undefined || v === null ? '' : String(v)}
          onChange={(e) => set(k, e.target.value)}
          disabled={disabled}
          aria-label={label}
        />
        {err && <p className={styles.error}>{err}</p>}
      </label>
    );
  };

  const enumSel = (k: string, label: string): ReactNode => {
    const options = fields.get(k)?.enumValues ?? [];
    const v = typeof value[k] === 'string' ? (value[k] as string) : '';
    return (
      <label className={`${styles.field} ${styles.enum}`} key={k}>
        <span className={styles.label}>{label}</span>
        <select
          className={styles.input}
          value={v}
          onChange={(e) => set(k, e.target.value)}
          disabled={disabled}
          aria-label={label}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  };

  const attacksField = fields.get('attacks');

  return (
    <div className={styles.form}>
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Boj</h4>
        <div className={styles.row}>
          {num('hp', 'Životy')}
          {num('defense', 'Obr. číslo')}
          {num('resilience', 'Odolnost')}
        </div>
        {attacksField && (
          <div className={styles.full}>
            <ListField
              field={attacksField}
              value={value.attacks}
              onChange={(arr) => set('attacks', arr)}
              disabled={disabled}
            />
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Tělo a pohyb</h4>
        <div className={styles.row}>
          {txt('size', 'Velikost', 'tiny')}
          {txt('vulnerability', 'Zranitelnost')}
          {num('combativeness', 'Bojovnost')}
        </div>
        <div className={styles.row}>
          {num('movement', 'Pohyblivost')}
          {txt('movementMode', 'Způsob pohybu')}
        </div>
        <div className={styles.row}>
          {num('endurance', 'Vytrvalost')}
          {num('maneuver', 'Manévrovatelnost')}
        </div>
      </section>

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Mysl</h4>
        <div className={styles.row}>
          {num('intelligence', 'Inteligence')}
          {num('charisma', 'Charisma')}
          {num('mindForce', 'ZSM')}
          {enumSel('alignment', 'Přesvědčení')}
        </div>
      </section>

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Odměna</h4>
        <div className={styles.row}>
          {txt('treasure', 'Poklady')}
          {num('experience', 'Zkušenost', 'numWide')}
          {num('taming', 'Ochočení')}
        </div>
      </section>
    </div>
  );
}
