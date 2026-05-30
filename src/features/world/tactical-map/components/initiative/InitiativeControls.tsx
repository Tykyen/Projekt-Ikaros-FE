/**
 * 10.2f — PJ ovládání iniciativy (levá část lišty).
 *
 * Stav A (boj neaktivní): „Zahájit boj".
 * Stav B (boj aktivní): počítadlo kola + „Další tah" + „Ukončit".
 *
 * Iniciativa se zadává ručně (InitiativeInput) nebo si ji každý hodí ze své
 * postavy (hod se propíše do token.initiative). Lišta sortuje živě dle čísla,
 * takže manuální „Přeřadit" netřeba (user feedback 2026-05-30).
 */
import styles from './InitiativeControls.module.css';

interface Props {
  isActive: boolean;
  round: number;
  hasCombatants: boolean;
  isPending: boolean;
  onStart: () => void;
  onNextTurn: () => void;
  onEnd: () => void;
}

export function InitiativeControls({
  isActive,
  round,
  hasCombatants,
  isPending,
  onStart,
  onNextTurn,
  onEnd,
}: Props): React.ReactElement {
  if (!isActive) {
    return (
      <div className={styles.controls}>
        <button
          type="button"
          className={`${styles.btn} ${styles.primary}`}
          disabled={!hasCombatants || isPending}
          onClick={onStart}
        >
          ▶ Zahájit boj
        </button>
      </div>
    );
  }

  return (
    <div className={styles.controls}>
      <span className={styles.roundBadge} title={`Kolo ${round}`}>
        {round}
      </span>
      <div className={styles.actionStack}>
        <button
          type="button"
          className={`${styles.btn} ${styles.primary}`}
          disabled={isPending}
          onClick={onNextTurn}
        >
          ⏭ Další tah
        </button>
        <button
          type="button"
          className={styles.btn}
          disabled={isPending}
          onClick={onEnd}
          title="Ukončit boj"
        >
          ✕ Ukončit
        </button>
      </div>
    </div>
  );
}
