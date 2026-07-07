import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import React from 'react';
import { MapPanel } from '../MapPanel';
import { setPanelStateAtom } from '../workspaceStore';

function renderPanel(
  extra: Partial<React.ComponentProps<typeof MapPanel>> = {},
): ReturnType<typeof render> {
  const store = createStore();
  store.set(setPanelStateAtom, 'dice-log', 'open');
  return render(
    <Provider store={store}>
      <MapPanel id="dice-log" title="Hody" icon="🎲" {...extra}>
        <div>OBSAH PANELU</div>
      </MapPanel>
    </Provider>,
  );
}

describe('MapPanel', () => {
  it('renderuje titul, ikonu a obsah', () => {
    renderPanel();
    expect(screen.getByText('Hody')).toBeInTheDocument();
    expect(screen.getByText('OBSAH PANELU')).toBeInTheDocument();
  });

  it('klik na hlavičku sbalí obsah (hlavička zůstane)', () => {
    renderPanel();
    fireEvent.click(screen.getByText('Hody'));
    expect(screen.queryByText('OBSAH PANELU')).not.toBeInTheDocument();
    expect(screen.getByText('Hody')).toBeInTheDocument();
  });

  it('„—" minimalizuje panel (zmizí celý → řeší <MapDock>)', () => {
    const { container } = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Zmenšit do lišty' }));
    expect(container).toBeEmptyDOMElement();
  });

  it('„?" se zobrazí jen s onHelp a volá callback', () => {
    const onHelp = vi.fn();
    renderPanel({ onHelp });
    fireEvent.click(screen.getByRole('button', { name: /Nápověda/ }));
    expect(onHelp).toHaveBeenCalledTimes(1);
  });

  it('bez onClose/onDock se ✕ a 📌 nezobrazí', () => {
    renderPanel();
    expect(screen.queryByRole('button', { name: 'Zavřít' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ukotvit k okraji' })).not.toBeInTheDocument();
  });

  it('onClose/onDock se zobrazí a volají callbacky', () => {
    const onClose = vi.fn();
    const onDock = vi.fn();
    renderPanel({ onClose, onDock });
    fireEvent.click(screen.getByRole('button', { name: 'Ukotvit k okraji' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zavřít' }));
    expect(onDock).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('minimalizovaný panel nevykreslí nic (řeší <MapDock> v A2)', () => {
    const store = createStore();
    store.set(setPanelStateAtom, 'dice-log', 'minimized');
    const { container } = render(
      <Provider store={store}>
        <MapPanel id="dice-log" title="Hody">
          <div>OBSAH PANELU</div>
        </MapPanel>
      </Provider>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
