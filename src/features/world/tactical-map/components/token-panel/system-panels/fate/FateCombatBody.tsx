/**
 * FATE — sdílené UI jádro bojového panelu (Karty osudu).
 *
 * Čistě prezentační, props-driven — sdílí ho PC combat panel (`FateCombatPanel`,
 * data z deníku) i bestie panel na mapě (`FateBestiePanel`, data z
 * `token.systemStats`). Jeden vzhled, dva datové adaptéry → 0 drift.
 *
 * Bojové minimum: Body osudu (−/+) + Obnova + ⚡Iniciativa · Stres (klik) ·
 * Následky (text) · Přístupy/Dovednosti s 🎲 (4dF+bonus) · Aspekty (invoke
 * ref, read-only) · Triky (ref). Hod = `onRoll(label, bonus)`.
 */
import styles from './FateCombatBody.module.css';

export interface FateBox {
  size: number;
  on: boolean;
}
export interface FateConsequence {
  key: string;
  label: string;
  value: number;
  text: string;
}
export interface FateAbility {
  label: string;
  bonus: number;
}
export interface FateAspect {
  text: string;
  kind: 'hc' | 'trouble' | 'other';
}
export interface FateStunt {
  name: string;
  desc: string;
}

export interface FateCombatBodyProps {
  variant: 'fae' | 'core';
  canEdit: boolean;
  fatePoints: number;
  refresh: number;
  onFatePoints?: (delta: number) => void;
  boxes: FateBox[];
  onToggleBox?: (index: number) => void;
  consequences: FateConsequence[];
  onCons?: (key: string, text: string) => void;
  abilities: FateAbility[];
  onRoll?: (label: string, bonus: number) => void;
  onInitiative?: () => void;
  aspects: FateAspect[];
  stunts: FateStunt[];
}

const fmt = (n: number): string => (n >= 0 ? `+${n}` : String(n));

export function FateCombatBody({
  variant,
  canEdit,
  fatePoints,
  refresh,
  onFatePoints,
  boxes,
  onToggleBox,
  consequences,
  onCons,
  abilities,
  onRoll,
  onInitiative,
  aspects,
  stunts,
}: FateCombatBodyProps): React.ReactElement {
  return (
    <div className={styles.panel} data-variant={variant}>
      {/* HLAVIČKA — Body osudu + Obnova + Iniciativa */}
      <div className={styles.head}>
        <div className={styles.fp}>
          {canEdit && onFatePoints && (
            <button
              type="button"
              className={styles.step}
              onClick={() => onFatePoints(-1)}
              aria-label="Body osudu −"
            >
              −
            </button>
          )}
          <span className={styles.fpLab}>Body osudu</span>
          <span className={styles.fpVal}>{fatePoints}</span>
          {canEdit && onFatePoints && (
            <button
              type="button"
              className={styles.step}
              onClick={() => onFatePoints(1)}
              aria-label="Body osudu +"
            >
              +
            </button>
          )}
        </div>
        <div className={styles.obn}>
          Obnova<b>{refresh}</b>
        </div>
        {onInitiative && (
          <button
            type="button"
            className={styles.init}
            onClick={onInitiative}
            title="Hodit iniciativu (4dF)"
          >
            ⚡ Iniciativa
          </button>
        )}
      </div>

      {/* STRES */}
      <section className={styles.sec}>
        <SecHead title="Stres" />
        <div className={styles.stress}>
          {boxes.map((b, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.sbox} ${b.on ? styles.sboxOn : ''}`}
              disabled={!canEdit || !onToggleBox}
              onClick={() => onToggleBox?.(i)}
              aria-label={`Stres ${b.size} ${b.on ? 'zaškrtnutý' : 'volný'}`}
              aria-pressed={b.on}
            >
              {b.size}
            </button>
          ))}
        </div>
      </section>

      {/* NÁSLEDKY */}
      <section className={styles.sec}>
        <SecHead title="Následky" />
        <div className={styles.cons}>
          {consequences.map((c) => (
            <div key={c.key} className={styles.crow}>
              <span className={styles.cl}>
                {c.label} <b>{c.value}</b>
              </span>
              <input
                className={styles.cinput}
                value={c.text}
                disabled={!canEdit || !onCons}
                onChange={(e) => onCons?.(c.key, e.target.value)}
                placeholder="— volný —"
                aria-label={`Následek ${c.label}`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* PŘÍSTUPY / DOVEDNOSTI s rollem */}
      <section className={styles.sec}>
        <SecHead title={variant === 'fae' ? 'Přístupy' : 'Dovednosti'} />
        <div className={styles.rolls}>
          {abilities.map((a, i) => (
            <div key={i} className={styles.rr}>
              <span className={styles.rn}>{a.label}</span>
              <span className={styles.rb}>{fmt(a.bonus)}</span>
              {onRoll && (
                <button
                  type="button"
                  className={styles.roll}
                  onClick={() => onRoll(a.label, a.bonus)}
                  title={`Hodit ${a.label} (4dF ${fmt(a.bonus)})`}
                  aria-label={`Hodit ${a.label}`}
                >
                  🎲
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ASPEKTY (read-only, invoke ref) */}
      {aspects.length > 0 && (
        <section className={styles.sec}>
          <SecHead title="Aspekty" />
          <div className={styles.aspects}>
            {aspects.map((a, i) => (
              <span key={i} className={`${styles.achip} ${styles[a.kind]}`}>
                {a.text}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* TRIKY (read-only ref) */}
      {stunts.length > 0 && (
        <section className={styles.sec}>
          <SecHead title="Triky" />
          <div className={styles.stunts}>
            {stunts.map((s, i) => (
              <div key={i} className={styles.st}>
                <b>{s.name}</b>
                {s.desc && <span>{s.desc}</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SecHead({ title }: { title: string }): React.ReactElement {
  return (
    <div className={styles.sh}>
      <h3>{title}</h3>
      <span className={styles.rule} />
    </div>
  );
}
