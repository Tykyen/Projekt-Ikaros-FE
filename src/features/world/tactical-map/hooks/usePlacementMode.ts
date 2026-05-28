/**
 * 10.2c-edit-9a — placement mode state machine pro 2-step spawn (klik v
 * paletě → klik na hex).
 *
 * Alternativa / fallback k HTML5 drag&drop. Old Matrix vzor — pro touch
 * device a uživatele, co nepoužívají drag.
 *
 * - PC: `multi: false` — po spawn se mód automaticky vypne
 * - NPC / Bestie: `multi: true` — banner zůstává po každém spawn, ESC ruší
 *
 * Plán: docs/arch/phase-10/plan-10.2c-edit-9a.md §3.4.
 */
import { useCallback, useEffect, useState } from 'react';
import type { SpawnPayload } from '../utils/spawnPayload';

export type PlacementState =
  | { active: false }
  | { active: true; payload: SpawnPayload; multi: boolean };

export interface PlacementController {
  state: PlacementState;
  start: (payload: SpawnPayload, multi: boolean) => void;
  cancel: () => void;
  /**
   * Po úspěšném spawnu volá konzument. V single mode → cancel.
   * V multi mode → banner zůstává, vrací stejný payload na další spawn.
   */
  consume: () => void;
}

export function usePlacementMode(): PlacementController {
  const [state, setState] = useState<PlacementState>({ active: false });

  const start = useCallback(
    (payload: SpawnPayload, multi: boolean): void => {
      setState({ active: true, payload, multi });
    },
    [],
  );

  const cancel = useCallback((): void => {
    setState({ active: false });
  }, []);

  const consume = useCallback((): void => {
    setState((cur) => (cur.active && !cur.multi ? { active: false } : cur));
  }, []);

  // ESC = cancel (jen když je placement aktivní — listener se odregistruje sám)
  useEffect(() => {
    if (!state.active) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setState({ active: false });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.active]);

  return { state, start, cancel, consume };
}
