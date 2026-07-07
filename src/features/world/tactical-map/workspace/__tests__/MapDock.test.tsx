import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { MapDock } from '../MapDock';
import { setPanelStateAtom, workspaceAtom } from '../workspaceStore';

const PANELS = [
  { id: 'dice-log' as const, title: 'Hody', icon: '🎲' },
  { id: 'pj' as const, title: 'Orchestrace', icon: '⚙' },
];

describe('MapDock', () => {
  it('nic nevykreslí, když není nic minimalizované', () => {
    const store = createStore();
    const { container } = render(
      <Provider store={store}>
        <MapDock panels={PANELS} />
      </Provider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('vykreslí čip jen za minimalizované panely', () => {
    const store = createStore();
    store.set(setPanelStateAtom, 'dice-log', 'minimized');
    render(
      <Provider store={store}>
        <MapDock panels={PANELS} />
      </Provider>,
    );
    expect(screen.getByRole('button', { name: /Hody/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Orchestrace/ })).not.toBeInTheDocument();
  });

  it('klik na čip nahodí panel (minimized → collapsed)', () => {
    const store = createStore();
    store.set(setPanelStateAtom, 'dice-log', 'minimized');
    render(
      <Provider store={store}>
        <MapDock panels={PANELS} />
      </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Hody/ }));
    expect(store.get(workspaceAtom)['dice-log'].state).toBe('collapsed');
  });
});
