/**
 * Fate (fae + fate) bestie karta v bestiáři — „Karty osudu" (slonovina + sépie).
 *
 * Dedikovaná kompaktní karta (větev z `BestieCard` pro systemId fae/fate),
 * obdoba `Drd16BestieCard`. Čte `bestie.systemStats` dle fae/fate bestie
 * schématu: Hlavní koncept + aspekty · Přístupy (fae) / Dovednosti (fate) ·
 * Triky · Stres + Obnova · Následky. Stejné props/akce jako generická BestieCard.
 */
import { getImageStyle } from '@/shared/lib/imageStyle';
import type { Bestie } from '../types';
import styles from './FateBestieCard.module.css';

interface Props {
  bestie: Bestie;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
}

const APPROACHES = [
  { key: 'appr_careful', label: 'Pečlivě' },
  { key: 'appr_clever', label: 'Chytře' },
  { key: 'appr_flashy', label: 'Oslnivě' },
  { key: 'appr_forceful', label: 'Rázně' },
  { key: 'appr_quick', label: 'Rychle' },
  { key: 'appr_sneaky', label: 'Lstivě' },
] as const;

const CONSEQUENCES = [
  { key: 'cons_mild', label: 'Drobný' },
  { key: 'cons_moderate', label: 'Mírný' },
  { key: 'cons_severe', label: 'Vážný' },
] as const;

interface ListRow {
  label?: string;
  value?: string;
  rating?: unknown;
}

const has = (v: unknown): boolean => v !== undefined && v !== null && v !== '';
const fmt = (n: number): string => (n >= 0 ? `+${n}` : String(n));

function getInitial(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? '?';
}

export function FateBestieCard({
  bestie,
  canEdit,
  canDelete,
  onEdit,
  onClone,
  onDelete,
}: Props): React.ReactElement {
  const ss = (bestie.systemStats ?? {}) as Record<string, unknown>;
  const isFae = bestie.systemId === 'fae';
  const num = (k: string): number => {
    const n = parseInt(String(ss[k] ?? ''), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const highConcept = has(ss.highConcept) ? String(ss.highConcept) : '';
  const aspects = (Array.isArray(ss.aspects) ? (ss.aspects as ListRow[]) : [])
    .map((a) => a.label?.trim())
    .filter((l): l is string => !!l);
  const stunts = (Array.isArray(ss.stunts) ? (ss.stunts as ListRow[]) : []).filter((s) =>
    has(s.label),
  );
  const skills = (Array.isArray(ss.skills) ? (ss.skills as ListRow[]) : []).filter((s) =>
    has(s.label),
  );
  const consequences = CONSEQUENCES.map((c) => ({
    label: c.label,
    text: has(ss[c.key]) ? String(ss[c.key]) : '',
  })).filter((c) => c.text);

  const stress = has(ss['health.max']) ? num('health.max') : 3;
  const refresh = has(ss.refresh) ? num('refresh') : null;

  return (
    <article className={styles.card} data-print-stat>
      <div className={styles.sigil}>
        <div className={styles.initial}>
          {bestie.imageUrl ? (
            <img
              src={bestie.imageUrl}
              alt={bestie.name}
              style={getImageStyle(
                bestie.imageFocalX,
                bestie.imageFocalY,
                bestie.imageZoom,
                bestie.imageFit,
              )}
            />
          ) : (
            <span>{getInitial(bestie.name)}</span>
          )}
        </div>
        <div className={styles.fudge} aria-hidden>
          <i className={`${styles.die} ${styles.plus}`} />
          <i className={`${styles.die} ${styles.minus}`} />
          <i className={styles.die} />
          <i className={`${styles.die} ${styles.plus}`} />
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.top}>
          <h4 className={styles.name}>{bestie.name}</h4>
          <span className={styles.tag}>
            Stres <b>{stress}</b>
          </span>
          {refresh !== null && (
            <span className={styles.tag}>
              Obnova <b>{refresh}</b>
            </span>
          )}
        </div>

        {highConcept && <p className={styles.hc}>{highConcept}</p>}

        {aspects.length > 0 && (
          <div className={styles.aspects}>
            {aspects.map((a, i) => (
              <span key={i} className={styles.achip}>
                {a}
              </span>
            ))}
          </div>
        )}

        {isFae ? (
          <div className={styles.appr}>
            {APPROACHES.map(({ key, label }) => (
              <span key={key} className={styles.ap}>
                <span className={styles.apN}>{label}</span>
                <span className={styles.apB}>{fmt(num(key))}</span>
              </span>
            ))}
          </div>
        ) : (
          skills.length > 0 && (
            <div className={styles.skills}>
              {skills.map((s, i) => (
                <span key={i} className={styles.sk}>
                  {s.label} <b>{fmt(parseInt(String(s.rating ?? 0), 10) || 0)}</b>
                </span>
              ))}
            </div>
          )
        )}

        {stunts.length > 0 && (
          <ul className={styles.stunts} aria-label="Triky">
            {stunts.map((s, i) => (
              <li key={i} className={`${styles.stunt} print-stat`} title={s.value || undefined}>
                <span className={styles.stuntN}>{s.label}</span>
                {has(s.value) && <span className={styles.stuntD}>{s.value}</span>}
              </li>
            ))}
          </ul>
        )}

        {consequences.length > 0 && (
          <div className={styles.cons}>
            {consequences.map((c, i) => (
              <span key={i} className={styles.consChip}>
                <b>{c.label}:</b> {c.text}
              </span>
            ))}
          </div>
        )}

        {bestie.notes && (
          <p className={styles.notes} title={bestie.notes}>
            {bestie.notes}
          </p>
        )}
      </div>

      <div className={`${styles.actions} print-hide`}>
        {canEdit && (
          <button type="button" className={`${styles.btn} ${styles.prim}`} onClick={onEdit}>
            Upravit
          </button>
        )}
        <button type="button" className={styles.btn} onClick={onClone}>
          Klonovat
        </button>
        {canDelete && (
          <button type="button" className={`${styles.btn} ${styles.danger}`} onClick={onDelete}>
            Smazat
          </button>
        )}
      </div>
    </article>
  );
}
