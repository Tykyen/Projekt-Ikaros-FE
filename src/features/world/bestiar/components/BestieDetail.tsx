/**
 * 16.2h — Read-only rozbalovací detail bestie.
 *
 * Generuje plný list ze schématu systému (systém = pole), vzhled řídí motiv
 * (`data-theme`) přes tokeny + skiny (`bestieSkins.css`). Struktura je společná
 * napříč motivy: Popis → sekce schématu (Boj/Vlastnosti/…) → Poznámky (jen PJ).
 *
 * Spec: docs/arch/phase-16/spec-16.2h-bestie-motiv-vzhledy.md.
 */
import type {
  SchemaField,
  SchemaSection,
  SystemEntitySchema,
} from '@/features/world/tactical-map/schemas/types';
import styles from './BestieDetail.module.css';

interface Props {
  schema: SystemEntitySchema;
  systemStats: Record<string, unknown>;
  /** Veřejný popis (vidí i hráč). */
  description: string;
  /** GM poznámky — renderují se jen když `canSeeNotes`. */
  notes: string;
  canSeeNotes: boolean;
}

/** Hodnota pole — flat klíč, s fallbackem na nested dot-path (`attributes.str`). */
function getValue(stats: Record<string, unknown>, key: string): unknown {
  if (key in stats) return stats[key];
  const parts = key.split('.');
  let cur: unknown = stats;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

/** Prázdné = null/undefined/''. Number 0 je validní hodnota (Ochrana 0). */
function hasValue(v: unknown): boolean {
  return v !== null && v !== undefined && v !== '';
}

function formatScalar(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

export function BestieDetail({
  schema,
  systemStats,
  description,
  notes,
  canSeeNotes,
}: Props): React.ReactElement {
  const desc = description.trim();
  const dropcap = desc.charAt(0);
  const rest = desc.slice(1);

  return (
    <div className={styles.detail} data-bestie-detail>
      {desc && (
        <section className={styles.sec}>
          <h5 className={styles.secTitle}>Popis</h5>
          <p className={styles.lore}>
            <span className={styles.dropcap}>{dropcap}</span>
            {rest}
          </p>
        </section>
      )}

      {schema.sections.map((section) => (
        <DetailSection
          key={section.key}
          section={section}
          systemStats={systemStats}
        />
      ))}

      {canSeeNotes && notes.trim() && (
        <section className={styles.sec}>
          <h5 className={styles.secTitle}>
            Poznámky <span className={styles.pjOnly}>(jen PJ)</span>
          </h5>
          <p className={styles.notes}>{notes}</p>
        </section>
      )}
    </div>
  );
}

interface SectionProps {
  section: SchemaSection;
  systemStats: Record<string, unknown>;
}

function DetailSection({
  section,
  systemStats,
}: SectionProps): React.ReactElement | null {
  const damageable = section.fields.filter(
    (f) => f.combatBehavior === 'damageable' && hasValue(getValue(systemStats, f.key)),
  );
  const lists = section.fields.filter((f) => {
    if (f.type !== 'list') return false;
    const v = getValue(systemStats, f.key);
    return Array.isArray(v) && v.length > 0;
  });
  const scalars = section.fields.filter(
    (f) =>
      f.type !== 'list' &&
      f.combatBehavior !== 'damageable' &&
      hasValue(getValue(systemStats, f.key)),
  );

  if (damageable.length === 0 && lists.length === 0 && scalars.length === 0) {
    return null;
  }

  return (
    <section className={styles.sec}>
      <h5 className={styles.secTitle}>{section.label}</h5>

      {damageable.map((f) => (
        <HpBar key={f.key} field={f} systemStats={systemStats} />
      ))}

      {scalars.length > 0 && (
        <div className={styles.statGrid}>
          {scalars.map((f) => (
            <div key={f.key} className={styles.cell}>
              <span className={styles.cellKey}>{f.label}</span>
              <span className={styles.cellVal}>
                {formatScalar(getValue(systemStats, f.key))}
              </span>
            </div>
          ))}
        </div>
      )}

      {lists.map((f) => (
        <ListField
          key={f.key}
          field={f}
          items={getValue(systemStats, f.key) as Record<string, unknown>[]}
        />
      ))}
    </section>
  );
}

function HpBar({
  field,
  systemStats,
}: {
  field: SchemaField;
  systemStats: Record<string, unknown>;
}): React.ReactElement {
  const raw = getValue(systemStats, field.key);
  const current = typeof raw === 'number' ? raw : Number(raw) || 0;
  const maxKey = field.key.replace(/\.current$/, '.max');
  const maxRaw = getValue(systemStats, maxKey);
  const maxValue = typeof maxRaw === 'number' ? maxRaw : current;
  const percent =
    maxValue > 0 ? Math.max(0, Math.min(100, (current / maxValue) * 100)) : 100;
  return (
    <div className={styles.hpBlock}>
      <div className={styles.hpMeta}>
        <span>{field.label}</span>
        <span className={styles.hpVal}>
          {current} / {maxValue}
        </span>
      </div>
      <div className={styles.hpBar}>
        <i style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ListField({
  field,
  items,
}: {
  field: SchemaField;
  items: Record<string, unknown>[];
}): React.ReactElement {
  const cols = field.listItemFields ?? [];
  // Schopnosti-styl: položky {label,value} → seznam. Jinak (útoky …) → tabulka.
  const isLabelValue = cols.some((c) => c.key === 'label');

  if (isLabelValue || cols.length === 0) {
    return (
      <ul className={styles.abilList}>
        {items.map((it, i) => {
          const label = String(it.label ?? it.name ?? '');
          const value = String(it.value ?? it.description ?? '');
          return (
            <li key={i}>
              {label && <b>{label}</b>}
              {value && <span> {value}</span>}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c.key}>{formatScalar(it[c.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
