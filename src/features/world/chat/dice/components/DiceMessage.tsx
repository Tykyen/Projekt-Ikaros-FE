import { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { DiceMessageScene } from './DiceMessageScene';
import { DiceMessageFallback } from './DiceMessageFallback';
import { parseDicePayload } from '../lib/dicePayload';
import type { DicePayload } from '../lib/dicePayload';
import styles from './DiceMessage.module.css';

interface DiceMessageProps {
  /** `ChatMessage.dicePayload` z BE — raw objekt (parsujeme defensivně). */
  rawPayload: unknown;
  /** `ChatMessage.diceSkin` — zafixovaný skin použitý odesílatelem. */
  skinId: string | null;
  /** `ChatMessage.createdAt` — určuje rolling vs settled phase. */
  createdAt: string | Date;
  /** Fallback obsah pokud payload nevalidní — zobrazí monospace text. */
  fallbackContent: string | null;
}

/**
 * Krok 6.3d — Wrapper kolem 3D scény hodu kostkou v MessageItem.
 *
 * Architektura:
 * 1. `DiceMessageScene` (3D CSS scéna) je hlavní render.
 * 2. `DiceMessageFallback` (statický 2D) se zobrazí pokud:
 *    - payload nevalidní (parseDicePayload vrátí null),
 *    - prohlížeč nepodporuje CSS 3D (graceful degradation).
 * 3. Pokud i fallback nelze (žádný payload), zobrazí `fallbackContent`
 *    jako monospace text (legacy zprávy z období před krokem 6.3).
 *
 * Rolling se přehraje jen pro čerstvé hody (isFreshRoll). Po refreshi
 * nebo scrollu historie → settled state bez animace.
 */
export function DiceMessage({
  rawPayload,
  skinId,
  createdAt: _createdAt,
  fallbackContent,
}: DiceMessageProps) {
  const payload = useMemo<DicePayload | null>(
    () => parseDicePayload(rawPayload),
    [rawPayload],
  );

  if (!payload) {
    // Legacy zpráva s `isDiceRoll: true` ale bez payloadu (před P1 BE
    // změnou). Render content jako preformátovaný text — žádný crash.
    return (
      <pre className={styles.legacyContent}>
        {fallbackContent ?? '[hod kostkou]'}
      </pre>
    );
  }

  // Krok 6.3 — fullscreen `DiceRollOverlay` (port Matrix) zastoupí 3D
  // moment hodu pro celou obrazovku. V `MessageItem` v chatu drží
  // `DiceMessage` jen 2D snapshot (perf, čistá historie). Live moment
  // se odehrává v overlay nad chatem.
  const rolling = false;

  const totalSign = payload.total > 0 ? '+' : payload.total < 0 ? '' : '';
  const totalClass =
    payload.total >= 3
      ? styles.totalPositive
      : payload.total <= -3
        ? styles.totalNegative
        : payload.total === 0
          ? styles.totalZero
          : styles.totalNeutral;

  return (
    <div className={styles.container} data-dice-msg>
      {(payload.label || payload.modifier !== undefined) && (
        <div className={styles.labelChip}>
          {payload.label && <span>{payload.label}</span>}
          {payload.modifier !== undefined && payload.modifier !== 0 && (
            <span className={styles.modifierTag}>
              {payload.modifier > 0 ? '+' : ''}
              {payload.modifier}
            </span>
          )}
        </div>
      )}

      <div className={styles.row}>
        <div className={styles.sceneWrap}>
          {/* Pokud renderingu zabrání chyba, vyřeší ji ErrorBoundary výš.
              Lokálně přepínáme jen statickou cestu. */}
          <DiceMessageScene
            payload={payload}
            skinId={skinId}
            rolling={rolling}
          />
        </div>

        <div className={`${styles.totalBox} ${totalClass}`}>
          <span className={styles.totalValue}>
            {totalSign}
            {payload.total}
          </span>
        </div>
      </div>

      <div className={styles.subtitle}>
        <span className={styles.subtleSum}>
          součet hodu: {payload.sum >= 0 ? '+' : ''}
          {payload.sum}
        </span>
        {payload.type === 'fate' &&
          payload.overpressure !== null &&
          payload.overpressure !== undefined && (
            <span className={styles.overpressure}>
              <Zap size={12} aria-hidden="true" /> Přetlak +{payload.overpressure}
            </span>
          )}
      </div>
    </div>
  );
}

/**
 * Krok 6.3d — alternativní render bez 3D scény (pro debug / reduced motion
 * sandboxes). Po stranách DiceMessage, ne v MessageItem.
 */
export function DiceMessageStatic({
  rawPayload,
  skinId: _skinId,
}: Pick<DiceMessageProps, 'rawPayload' | 'skinId'>) {
  const payload = parseDicePayload(rawPayload);
  if (!payload) return null;
  return <DiceMessageFallback payload={payload} />;
}
