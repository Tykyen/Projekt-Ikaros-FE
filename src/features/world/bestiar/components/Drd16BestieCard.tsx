/**
 * 16.2b-bestie Cesta B — DrD 1.6 bestie jako řádková „naturalistova deska".
 *
 * Custom render bestie v bestiáři pro `systemId === 'drd16'` (větev z
 * `BestieCard`). Čte `bestie.systemStats` dle drd16 bestie schématu
 * (`schemas/drd16/bestie.json`): Životy/Útoky(list)/OČ + sekundární staty +
 * pečetě. Pergamen + zlato (drd16 „iluminovaný kodex"). Stejné props/akce
 * jako generická `BestieCard`.
 */
import { getImageStyle } from '@/shared/lib/imageStyle';
import type { Bestie } from '../types';
import styles from './Drd16BestieCard.module.css';

interface Props {
  bestie: Bestie;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
}

interface Drd16Attack {
  name?: string;
  value?: unknown;
}

const has = (v: unknown): boolean =>
  v !== undefined && v !== null && v !== '';

/** Numerické sekundární staty (label · key) — render jen když má hodnotu. */
const SECONDARY: ReadonlyArray<{ label: string; key: string }> = [
  { label: 'Odoln.', key: 'resilience' },
  { label: 'Bojov.', key: 'combativeness' },
  { label: 'Vytrv.', key: 'endurance' },
  { label: 'Manévr.', key: 'maneuver' },
  { label: 'Int.', key: 'intelligence' },
  { label: 'Cha.', key: 'charisma' },
  { label: 'ZSM', key: 'mindForce' },
  { label: 'Ochoč.', key: 'taming' },
];

function getInitial(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? '?';
}

export function Drd16BestieCard({
  bestie,
  canEdit,
  canDelete,
  onEdit,
  onClone,
  onDelete,
}: Props): React.ReactElement {
  const ss = (bestie.systemStats ?? {}) as Record<string, unknown>;
  const str = (k: string): string => (has(ss[k]) ? String(ss[k]) : '');
  const vital = (k: string): string => (has(ss[k]) ? String(ss[k]) : '—');
  const attacks = Array.isArray(ss.attacks)
    ? (ss.attacks as Drd16Attack[])
    : [];

  const movement = str('movement');
  const movementMode = str('movementMode');

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
        {has(ss.experience) && (
          <div className={styles.xp}>
            Zkuš. <b>{String(ss.experience)}</b>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.top}>
          <h4 className={styles.name}>{bestie.name}</h4>
          {has(ss.size) && (
            <span className={styles.tag}>
              Vel. <b>{str('size')}</b>
            </span>
          )}
          {has(ss.alignment) && (
            <span className={styles.tag}>
              Přesv. <b>{str('alignment')}</b>
            </span>
          )}
          {has(ss.vulnerability) && (
            <span className={styles.tag}>Zranit. {str('vulnerability')}</span>
          )}
        </div>

        <div className={styles.line}>
          <div className={`${styles.vital} ${styles.hp}`}>
            <span className={styles.l}>Životy</span>
            <span className={styles.n}>{vital('hp')}</span>
          </div>
          <div className={`${styles.vital} ${styles.def}`}>
            <span className={styles.l}>OČ</span>
            <span className={styles.n}>{vital('defense')}</span>
          </div>
          {attacks
            .filter((a) => has(a.name) || has(a.value))
            .map((a, i) => (
              <span key={i} className={styles.atk}>
                {a.name || 'útok'} <b>{has(a.value) ? String(a.value) : '—'}</b>
              </span>
            ))}
        </div>

        <div className={styles.stats}>
          {has(ss.movement) && (
            <span className={styles.pill}>
              <span className={styles.pk}>Pohyb</span>
              <span className={styles.pv}>{movement}</span>
              {movementMode && (
                <span className={`${styles.pv} ${styles.pvWord}`}>
                  {movementMode}
                </span>
              )}
            </span>
          )}
          {SECONDARY.filter((s) => has(ss[s.key])).map((s) => (
            <span key={s.key} className={styles.pill}>
              <span className={styles.pk}>{s.label}</span>
              <span className={styles.pv}>{String(ss[s.key])}</span>
            </span>
          ))}
          {has(ss.treasure) && (
            <span className={styles.pill}>
              <span className={styles.pk}>Poklady</span>
              <span className={`${styles.pv} ${styles.pvWord}`}>
                {str('treasure')}
              </span>
            </span>
          )}
        </div>

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
          <button
            type="button"
            className={`${styles.btn} ${styles.danger}`}
            onClick={onDelete}
          >
            Smazat
          </button>
        )}
      </div>
    </article>
  );
}
