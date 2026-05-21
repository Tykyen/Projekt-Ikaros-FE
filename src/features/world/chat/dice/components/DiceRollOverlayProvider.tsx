import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { DicePayload } from '../lib/dicePayload';
import { DiceRollOverlay, type DiceRollEvent } from './DiceRollOverlay';

/**
 * Krok 6.3 — Globální stav fullscreen dice roll overlay.
 *
 * `useDiceRollOverlay().trigger(payload, skinId, rollerName)` spustí
 * animaci kostek nad celou stránkou. Overlay sám zmizí po SHOW_TIME
 * sekundách (currently 4.9 s celkem).
 *
 * Provider mount jednou v `WorldChatPage` (nebo výš). Trigger lze
 * volat z libovolného deepu pod ním (ChannelComposer, retry, atd.).
 */

interface DiceRollOverlayCtx {
  /**
   * Spustí fullscreen overlay. `onComplete` se zavolá po doběhnutí
   * animace (4.9 s celkem) — typicky tam volající provede reálný send
   * zprávy do chatu, aby se 2D snapshot v MessageList objevil až po
   * skončení 3D overlay (jinak by uživatel viděl obojí najednou).
   */
  trigger: (
    payload: DicePayload,
    skinId: string | null,
    rollerName: string,
    onComplete?: () => void,
  ) => void;
}

const Ctx = createContext<DiceRollOverlayCtx | null>(null);

export function useDiceRollOverlay(): DiceRollOverlayCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Defensive — když provider chybí, no-op + onComplete běží hned
    // (chat funguje bez overlay, zpráva se vloží okamžitě).
    return {
      trigger: (_p, _s, _r, onComplete) => {
        if (onComplete) onComplete();
      },
    };
  }
  return ctx;
}

export function DiceRollOverlayProvider({ children }: PropsWithChildren) {
  const [roll, setRoll] = useState<DiceRollEvent | null>(null);
  const counter = useRef(0);
  const onCompleteRef = useRef<(() => void) | null>(null);

  const trigger = useCallback(
    (
      payload: DicePayload,
      skinId: string | null,
      rollerName: string,
      onComplete?: () => void,
    ) => {
      counter.current += 1;
      // Pokud byl rozjetý jiný hod (race), starý callback zahodit a
      // spustit nový. Bezpečnější by bylo queue, ale overlay je
      // single-instance — kdo hodí, ten zaplní obrazovku.
      onCompleteRef.current = onComplete ?? null;
      setRoll({
        payload,
        skinId,
        rollerName,
        timestamp: Date.now() + counter.current,
      });
    },
    [],
  );

  const handleDone = useCallback(() => {
    setRoll(null);
    const cb = onCompleteRef.current;
    onCompleteRef.current = null;
    if (cb) cb();
  }, []);

  return (
    <Ctx.Provider value={{ trigger }}>
      {children}
      <DiceRollOverlay roll={roll} onDone={handleDone} />
    </Ctx.Provider>
  );
}
