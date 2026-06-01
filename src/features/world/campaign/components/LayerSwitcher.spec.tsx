import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayerSwitcher } from './LayerSwitcher';

describe('LayerSwitcher', () => {
  const players = [
    { userId: 'p1', characterPath: '/aragorn', role: 2 },
    { userId: 'p2', characterPath: undefined, role: 2 },
  ];

  it('nabízí Moji vrstvu + hráče (label z characterPath, fallback id)', () => {
    render(<LayerSwitcher layer="mine" onChange={() => {}} players={players} />);
    expect(screen.getByRole('option', { name: 'Moje vrstva' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'aragorn' })).toBeTruthy();
    expect(screen.getByRole('option', { name: /Hráč/ })).toBeTruthy();
  });

  it('přepnutí volá onChange s userId', () => {
    const onChange = vi.fn();
    render(<LayerSwitcher layer="mine" onChange={onChange} players={players} />);
    fireEvent.change(screen.getByLabelText('Přepnout vrstvu Pavučiny'), {
      target: { value: 'p1' },
    });
    expect(onChange).toHaveBeenCalledWith('p1');
  });
});
