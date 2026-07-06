import { beforeEach, describe, expect, it } from 'vitest';
import { createStore } from 'jotai';
import {
  focusPanelAtom,
  mergeWorkspace,
  minimizeAllAtom,
  PANEL_IDS,
  restoreAllAtom,
  setPanelStateAtom,
  workspaceAtom,
} from '../workspaceStore';

describe('workspaceStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('výchozí stav = všechny panely collapsed', () => {
    const store = createStore();
    const ws = store.get(workspaceAtom);
    PANEL_IDS.forEach((id) => {
      expect(ws[id].state).toBe('collapsed');
    });
  });

  it('setPanelState změní stav jen daného panelu', () => {
    const store = createStore();
    store.set(setPanelStateAtom, 'dice-log', 'open');
    const ws = store.get(workspaceAtom);
    expect(ws['dice-log'].state).toBe('open');
    expect(ws['pj'].state).toBe('collapsed');
  });

  it('focusPanel zvedne order nad všechny ostatní', () => {
    const store = createStore();
    store.set(focusPanelAtom, 'weather');
    const ws = store.get(workspaceAtom);
    const others = PANEL_IDS.filter((id) => id !== 'weather').map((id) => ws[id].order);
    expect(ws['weather'].order).toBeGreaterThan(Math.max(...others));
  });

  it('minimizeAll s výjimkou nechá výjimku beze změny', () => {
    const store = createStore();
    store.set(minimizeAllAtom, ['token-card']);
    const ws = store.get(workspaceAtom);
    expect(ws['dice-log'].state).toBe('minimized');
    expect(ws['token-card'].state).toBe('collapsed');
  });

  it('restoreAll vrátí minimalizované na collapsed', () => {
    const store = createStore();
    store.set(minimizeAllAtom, []);
    store.set(restoreAllAtom);
    const ws = store.get(workspaceAtom);
    PANEL_IDS.forEach((id) => {
      expect(ws[id].state).toBe('collapsed');
    });
  });

  it('mergeWorkspace: neúplný stav se doplní defaultem', () => {
    const merged = mergeWorkspace({ 'dice-log': { state: 'open', order: 99 } });
    expect(merged['dice-log'].state).toBe('open'); // z uloženého
    expect(merged['dice-log'].order).toBe(99);
    expect(merged['pj'].state).toBe('collapsed'); // doplněno defaultem
  });

  it('zápis panelu se propíše do localStorage (persistence)', () => {
    const store = createStore();
    store.set(setPanelStateAtom, 'pj', 'open');
    const raw = JSON.parse(localStorage.getItem('ikr-map-workspace-v1') ?? '{}');
    expect(raw['pj'].state).toBe('open');
  });
});
