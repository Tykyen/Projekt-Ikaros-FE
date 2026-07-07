/**
 * 17.10 A1 — `useMapWorkspace`: registr stavu overlay panelů taktické mapy.
 *
 * Jeden zdroj pravdy pro to, který panel je otevřený / sbalený / minimalizovaný
 * / plovoucí, plus pořadí fokusu (naposledy aktivní = navrch). Vzor kopíruje
 * `shared/store/authStore.ts` a `themes/state.ts` — modul s exportovanými
 * jotai atomy, konzumace přes `useAtom*` (žádný nový Context/Provider).
 *
 * A1 = jen registr + akce. Napojení konkrétních panelů (minimalizace do
 * `<MapDock>`, „Uklidit vše" s výjimkou kostek) je A2 — staví na tomto API.
 */
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type PanelId =
  | 'tools-effects'
  | 'tools-fog'
  | 'tools-view'
  | 'tools-ambient'
  | 'dice-log'
  | 'pj'
  | 'weather'
  | 'notebook'
  | 'token-card';

export type PanelUiState = 'open' | 'collapsed' | 'minimized' | 'floating';

export interface PanelState {
  state: PanelUiState;
  /** Pořadí fokusu — vyšší = navrch (naposledy aktivní panel). */
  order: number;
}

export const PANEL_IDS: readonly PanelId[] = [
  'tools-effects',
  'tools-fog',
  'tools-view',
  'tools-ambient',
  'dice-log',
  'pj',
  'weather',
  'notebook',
  'token-card',
];

/**
 * Výchozí stav: vše `collapsed` (odpovídá dnešnímu `defaultCollapsed` v panelech
 * i schválenému náhledu). `order` = pořadí definice, aby byl deterministický.
 */
function defaultWorkspace(): Record<PanelId, PanelState> {
  const out = {} as Record<PanelId, PanelState>;
  PANEL_IDS.forEach((id, i) => {
    out[id] = { state: 'collapsed', order: i };
  });
  return out;
}

/**
 * Perzistovaný raw registr (localStorage). Může být neúplný (schema drift při
 * přidání panelu ve vyšší verzi) → čtení jde přes `workspaceAtom`, který
 * defensivně doplní default. `getOnInit` = synchronní hydratace z localStorage
 * (jinak by první render viděl default a přepsal uložený stav).
 */
const workspaceRawAtom = atomWithStorage<Partial<Record<PanelId, PanelState>>>(
  'ikr-map-workspace-v1',
  {},
  undefined,
  { getOnInit: true },
);

/** Defensivní merge: raw (může být neúplný) + default pro chybějící panely. */
export function mergeWorkspace(
  raw: Partial<Record<PanelId, PanelState>>,
): Record<PanelId, PanelState> {
  const merged = defaultWorkspace();
  PANEL_IDS.forEach((id) => {
    const stored = raw[id];
    if (stored) merged[id] = stored;
  });
  return merged;
}

/** Čtený/zapisovaný registr s defensivním merge (chybějící klíč → default). */
export const workspaceAtom = atom(
  (get): Record<PanelId, PanelState> => mergeWorkspace(get(workspaceRawAtom)),
  (_get, set, next: Record<PanelId, PanelState>) => {
    set(workspaceRawAtom, next);
  },
);

/** Nastaví UI stav jednoho panelu. */
export const setPanelStateAtom = atom(
  null,
  (get, set, id: PanelId, state: PanelUiState) => {
    const ws = get(workspaceAtom);
    set(workspaceAtom, { ...ws, [id]: { ...ws[id], state } });
  },
);

/** Fokusne panel — zvedne jeho `order` nad všechny ostatní. */
export const focusPanelAtom = atom(null, (get, set, id: PanelId) => {
  const ws = get(workspaceAtom);
  const maxOrder = Math.max(...PANEL_IDS.map((p) => ws[p].order));
  set(workspaceAtom, { ...ws, [id]: { ...ws[id], order: maxOrder + 1 } });
});

/** Minimalizuje všechny panely kromě `except` (A2 „Uklidit vše"; kostky = výjimka). */
export const minimizeAllAtom = atom(
  null,
  (get, set, except: readonly PanelId[] = []) => {
    const ws = get(workspaceAtom);
    const next = { ...ws };
    PANEL_IDS.forEach((id) => {
      if (!except.includes(id)) next[id] = { ...ws[id], state: 'minimized' };
    });
    set(workspaceAtom, next);
  },
);

/** Vrátí minimalizované panely zpět na `collapsed` (A2 „Vrátit panely"). */
export const restoreAllAtom = atom(null, (get, set) => {
  const ws = get(workspaceAtom);
  const next = { ...ws };
  PANEL_IDS.forEach((id) => {
    if (ws[id].state === 'minimized') next[id] = { ...ws[id], state: 'collapsed' };
  });
  set(workspaceAtom, next);
});

/** Hook — celý registr + akce. */
export function useMapWorkspace(): {
  workspace: Record<PanelId, PanelState>;
  setPanelState: (id: PanelId, state: PanelUiState) => void;
  focusPanel: (id: PanelId) => void;
  minimizeAll: (except?: readonly PanelId[]) => void;
  restoreAll: () => void;
} {
  return {
    workspace: useAtomValue(workspaceAtom),
    setPanelState: useSetAtom(setPanelStateAtom),
    focusPanel: useSetAtom(focusPanelAtom),
    minimizeAll: useSetAtom(minimizeAllAtom),
    restoreAll: useSetAtom(restoreAllAtom),
  };
}

/** Hook — stav jednoho panelu. */
export function usePanelState(id: PanelId): PanelState {
  return useAtomValue(workspaceAtom)[id];
}
