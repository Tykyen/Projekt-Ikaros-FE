/**
 * 16.2b-chat — sdílené prezentační jádro drd16 bestie boje (mapa + chat).
 *
 * Útoky (klik = ÚČ + d6+) · Obrana (klik = OČ + d6+) · read-only statline
 * (PJ reference) · popis. **Bez HP / iniciativy / editu / persistence** — to
 * řeší rodič dle povrchu (mapa: `token` + `onMapRoll` + `useTokenUpdate`;
 * chat: `combatant` + `useChatDiaryRoll` + `useCombatantMutation`). Rodič dodá
 * `onRoll(label, modifier)` = jeden d6+ hod s daným modifikátorem.
 *
 * Extrakce z `Drd16BestiePanel` (mapa) → eliminace duplicity mezi mapou a
 * chatem. Labely zachované 1:1 (kryje `Drd16BestiePanel.spec`).
 */
import styles from './Drd16BestiePanel.module.css';

interface Drd16Attack {
  name?: string;
  value?: unknown;
}

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

const has = (v: unknown): boolean => v !== undefined && v !== null && v !== '';

/** Read-only staty pro PJ referenci (label · key · slovo?). */
const SECONDARY: ReadonlyArray<{ label: string; key: string; word?: boolean }> = [
  { label: 'Velikost', key: 'size', word: true },
  { label: 'Zranit.', key: 'vulnerability', word: true },
  { label: 'Odoln.', key: 'resilience' },
  { label: 'Bojov.', key: 'combativeness' },
  { label: 'Vytrv.', key: 'endurance' },
  { label: 'Manévr.', key: 'maneuver' },
  { label: 'Int.', key: 'intelligence' },
  { label: 'Cha.', key: 'charisma' },
  { label: 'ZSM', key: 'mindForce' },
  { label: 'Přesv.', key: 'alignment', word: true },
  { label: 'Poklady', key: 'treasure', word: true },
  { label: 'Zkuš.', key: 'experience' },
  { label: 'Ochoč.', key: 'taming' },
];

interface Props {
  /** Bestie staty (drd16 schéma, flat). */
  systemStats: Record<string, unknown>;
  /** Slovní popis (read-only). */
  notes?: string;
  /** Klik na útok/obranu povolen (aktivní hod k dispozici). */
  interactive: boolean;
  /** Jeden d6+ hod: útok (ÚČ) / obrana (OČ). */
  onRoll: (label: string, modifier: number) => void;
}

export function Drd16BestieCombatActions({
  systemStats: ss,
  notes,
  interactive,
  onRoll,
}: Props): React.ReactElement {
  const attacks = Array.isArray(ss.attacks) ? (ss.attacks as Drd16Attack[]) : [];
  const defense = toNum(ss.defense);
  const lockStyle = interactive
    ? undefined
    : ({ cursor: 'default', pointerEvents: 'none' } as const);

  return (
    <>
      <section>
        <h3 className={styles.title}>
          Útoky <small>klik = ÚČ + k6+</small>
        </h3>
        {attacks.length === 0 && <p className={styles.noAtk}>Žádné útoky.</p>}
        {attacks.map((a, i) => {
          const val = toNum(a.value);
          return (
            <button
              key={i}
              type="button"
              className={styles.atk}
              disabled={!interactive}
              style={lockStyle}
              onClick={() => onRoll(`Útok: ${a.name || 'útok'}`, val)}
              aria-label={`Útok ${a.name || ''}`.trim()}
            >
              <span className={styles.atkName}>{a.name || '(bez názvu)'}</span>
              <span className={styles.atkVal}>
                {val >= 0 ? '+' : ''}
                {val}
              </span>
            </button>
          );
        })}
      </section>

      <section>
        <h3 className={styles.title}>
          Obrana <small>klik = OČ + k6+</small>
        </h3>
        <button
          type="button"
          className={styles.def}
          disabled={!interactive}
          style={lockStyle}
          onClick={() => onRoll('Obrana', defense)}
          aria-label="Hodit obranu"
        >
          <span className={styles.defLab}>Obranné číslo</span>
          <span className={styles.defVal}>{defense}</span>
        </button>
      </section>

      {/* Read-only staty + popis — PJ s nimi pracuje (nehází se, jen reference). */}
      <section>
        <h3 className={styles.title}>Vlastnosti &amp; chování</h3>
        <div className={styles.stats}>
          {has(ss.movement) && (
            <span className={styles.pill}>
              <span className={styles.pk}>Pohyb</span>
              <span className={styles.pv}>{String(ss.movement)}</span>
              {has(ss.movementMode) && (
                <span className={`${styles.pv} ${styles.pvWord}`}>
                  {String(ss.movementMode)}
                </span>
              )}
            </span>
          )}
          {SECONDARY.filter((s) => has(ss[s.key])).map((s) => (
            <span key={s.key} className={styles.pill}>
              <span className={styles.pk}>{s.label}</span>
              <span
                className={`${styles.pv} ${s.word ? styles.pvWord : ''}`.trim()}
              >
                {String(ss[s.key])}
              </span>
            </span>
          ))}
        </div>
      </section>

      {notes && notes.trim() && (
        <section>
          <h3 className={styles.title}>Popis</h3>
          <div className={styles.desc}>{notes}</div>
        </section>
      )}
    </>
  );
}

export default Drd16BestieCombatActions;
