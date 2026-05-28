/**
 * 10.2c-edit-9g — token info panel mode state machine.
 *
 * 3 módy (mirror Matrix `CharacterDiary.tsx:60-70`):
 *   - `dock` — fixed right side panel (default desktop)
 *   - `drag` — absolute, draggable přes header, position v localStorage
 *   - `overlay` — centered modal (mobile force)
 *
 * Mobile (window.innerWidth < 768) vždy `overlay` (drag/dock by se nevešly).
 * Persisted v localStorage `ikr-token-panel-mode`.
 *
 * Plán: docs/arch/phase-10/plan-10.2c-edit-9g.md §A.
 */
import { useCallback, useEffect, useState } from 'react';

export type PanelMode = 'dock' | 'drag' | 'overlay';

// 10.2c-edit-9g — bumped klíč (v2) — old `ikr-token-panel-mode` mohl mít
// `drag` z testů, což way uživatele schovávalo panel header pod world nav.
// Reset na default `dock` (= panel ukotvený vpravo, header viditelný).
const LS_KEY = 'ikr-token-panel-mode-v2';
const MOBILE_BREAKPOINT = 768;

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function loadStored(): PanelMode {
  if (typeof window === 'undefined') return 'dock';
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === 'dock' || raw === 'drag' || raw === 'overlay') return raw;
  } catch {
    // ignore
  }
  return 'dock';
}

export function usePanelMode(): {
  /** Effective mode (mobile force = overlay). */
  mode: PanelMode;
  /** Set mode (persist; mobile ignore drag/dock). */
  setMode: (m: PanelMode) => void;
} {
  const [stored, setStored] = useState<PanelMode>(loadStored);
  const [mobile, setMobile] = useState<boolean>(isMobile);

  useEffect(() => {
    const onResize = (): void => setMobile(isMobile());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const setMode = useCallback((m: PanelMode): void => {
    setStored(m);
    try {
      localStorage.setItem(LS_KEY, m);
    } catch {
      // ignore
    }
  }, []);

  const mode: PanelMode = mobile ? 'overlay' : stored;

  return { mode, setMode };
}
