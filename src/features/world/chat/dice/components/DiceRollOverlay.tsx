import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { DicePayload } from '../lib/dicePayload';
import { payloadToNotation } from '../lib/diceNotation';
import { getDice3dTheme, isWebGLAvailable } from '../lib/dice3dThemes';
import styles from './DiceRollOverlay.module.css';

/**
 * Krok 6.3-fix4 — Fullscreen overlay hodu kostkou.
 *
 * Reálná fyzikální 3D kostka (`@drdreo/dice-box-threejs`) se realisticky
 * zakutálí a dopadne na PŘEDURČENÝ výsledek z payloadu (WS shoda). Po
 * dosednutí se ukáže readout (faces, total, jméno).
 *
 * Fallback (Fate kostka — engine nemá Fudge; nebo chybí WebGL): bez 3D,
 * jen readout po krátké pauze. Kostka tak nikdy neselže naprázdno.
 *
 * 3D engine je lazy (`React.lazy`) — načte se až při prvním 3D hodu a pak
 * žije dál (knihovna nemá destroy(); persistentní instance, viz DiceBox3D).
 */

const LazyDiceBox3D = lazy(() => import('./DiceBox3D'));

export interface DiceRollEvent {
  /** Strukturovaná data hodu (z `dicePayload` v `ChatMessage`). */
  payload: DicePayload;
  /** Skin použitý odesílatelem (z `ChatMessage.diceSkin`). */
  skinId: string | null;
  /** Jméno hráče, který hodil (zobrazí se v readout). */
  rollerName: string;
  /** Timestamp — slouží jako key/nonce hodu. */
  timestamp: number;
}

interface DiceRollOverlayProps {
  /** Aktivní hod k animaci, `null` = overlay schovaný. */
  roll: DiceRollEvent | null;
  /** Volá se po doběhnutí (readout odzobrazen) — kontext nastaví `roll = null`. */
  onDone: () => void;
}

type Phase = 'idle' | 'rolling' | 'result';

/** Jak dlouho po dosednutí držet readout, než overlay zmizí (ms). */
const RESULT_HOLD_MS = 2400;
/** Pauza fallbacku (fate / no-WebGL) než ukáže výsledek (ms). */
const FALLBACK_DELAY_MS = 650;

export function DiceRollOverlay({ roll, onDone }: DiceRollOverlayProps) {
  const [webgl] = useState(isWebGLAvailable);
  const [phase, setPhase] = useState<Phase>('idle');
  // Jednou nasazený 3D host žije dál (lazy instance se nereinicializuje).
  const [mount3d, setMount3d] = useState(false);
  const [use3dThisRoll, setUse3dThisRoll] = useState(false);

  const notation = roll ? payloadToNotation(roll.payload) : null;
  const can3d = !!roll && webgl && notation !== null;

  // Nový hod.
  useEffect(() => {
    if (!roll) {
      setPhase('idle');
      return;
    }
    if (can3d) {
      setMount3d(true);
      setUse3dThisRoll(true);
      setPhase('rolling');
      // 'result' nastaví onComplete z DiceBox3D.
      return;
    }
    // Fallback (fate / no-WebGL) — krátká pauza, pak výsledek.
    setUse3dThisRoll(false);
    setPhase('rolling');
    const t = window.setTimeout(() => setPhase('result'), FALLBACK_DELAY_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roll?.timestamp]);

  // Po zobrazení výsledku držet a dokončit.
  useEffect(() => {
    if (phase !== 'result') return;
    const t = window.setTimeout(() => onDone(), RESULT_HOLD_MS);
    return () => window.clearTimeout(t);
  }, [phase, onDone]);

  const handle3dComplete = useCallback(() => setPhase('result'), []);
  const handle3dError = useCallback(() => setPhase('result'), []);

  if (!roll && !mount3d) return null;

  return (
    <>
      {mount3d && webgl && (
        <Suspense fallback={null}>
          <LazyDiceBox3D
            notation={notation ?? '1d6@1'}
            theme={getDice3dTheme(roll?.skinId ?? null)}
            nonce={roll?.timestamp ?? 0}
            active={use3dThisRoll && phase !== 'idle'}
            onComplete={handle3dComplete}
            onError={handle3dError}
          />
        </Suspense>
      )}

      {phase !== 'idle' && roll && <Readout roll={roll} show={phase === 'result'} />}
    </>
  );
}

// ─── Readout (faces + total + jméno) ─────────────────────────────────────

function Readout({ roll, show }: { roll: DiceRollEvent; show: boolean }) {
  if (!show) return null;

  const total = roll.payload.total;
  const totalColorClass =
    total > 0
      ? styles.totalPositive
      : total < 0
        ? styles.totalNegative
        : styles.totalNeutral;
  const isFate = roll.payload.type === 'fate';
  const faces = roll.payload.faces;

  return (
    <div className={styles.overlay}>
      <div className={styles.readout}>
        <div className={styles.facesRow}>
          {faces.map((f, j) => {
            if (isFate) {
              const cls =
                f === '+' || f === 1
                  ? styles.facePlus
                  : f === '-' || f === -1
                    ? styles.faceMinus
                    : styles.faceZero;
              const glyph =
                f === '+' || f === 1 ? '+' : f === '-' || f === -1 ? '−' : '0';
              return (
                <span key={j} className={`${styles.faceBadge} ${cls}`}>
                  {glyph}
                </span>
              );
            }
            return (
              <span
                key={j}
                className={`${styles.faceBadge} ${styles.faceGeneric}`}
              >
                {f}
              </span>
            );
          })}
        </div>

        <div className={styles.equation}>
          {roll.payload.label && (
            <>
              <span className={styles.skillName}>{roll.payload.label}</span>
              {roll.payload.modifier !== undefined &&
                roll.payload.modifier !== 0 && (
                  <span className={styles.skillMod}>
                    ({roll.payload.modifier > 0 ? '+' : ''}
                    {roll.payload.modifier})
                  </span>
                )}
            </>
          )}
          <span className={styles.eqSign}>=</span>
          <span className={`${styles.totalValue} ${totalColorClass}`}>
            {total > 0 ? `+${total}` : total === 0 ? '0' : total}
          </span>
        </div>

        <div className={styles.rollerName}>{roll.rollerName}</div>
      </div>
    </div>
  );
}
