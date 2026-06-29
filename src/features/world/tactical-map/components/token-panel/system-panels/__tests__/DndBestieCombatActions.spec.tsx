import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndBestieCombatActions } from '../DndBestieCombatActions';

describe('DndBestieCombatActions (8.7r)', () => {
  it('klik na vlastnost hodí k20 + mod (Síla 16 → +3) s fatální detekcí', () => {
    const onRoll = vi.fn();
    render(
      <DndBestieCombatActions
        ss={{ 'attributes.str': 16 }}
        interactive
        onRoll={onRoll}
      />,
    );
    fireEvent.click(screen.getByText('SÍL').closest('button')!);
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Síla',
        modifier: 3,
        kind: 'd20',
        critOnD20: true,
      }),
    );
  });

  it('klik na zásah útoku hodí skládaný mixed dle formule', () => {
    const onRoll = vi.fn();
    render(
      <DndBestieCombatActions
        ss={{ utoky: [{ nazev: 'Dráp', bonus: '+7', zasah: '2k6+4' }] }}
        interactive
        onRoll={onRoll}
      />,
    );
    fireEvent.click(screen.getByTitle('Hodit zranění 2k6+4'));
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'mixed', mixed: { d6: 2 }, modifier: 4 }),
    );
  });

  it('klik na záchranný hod hodí k20 + bonus', () => {
    const onRoll = vi.fn();
    render(
      <DndBestieCombatActions
        ss={{ zachrany: [{ vlastnost: 'Odolnost', bonus: 5 }] }}
        interactive
        onRoll={onRoll}
      />,
    );
    fireEvent.click(screen.getByText(/ZH Odolnost/));
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'ZH Odolnost', modifier: 5, kind: 'd20' }),
    );
  });

  it('schopnosti se seskupují dle typu (Legendární akce má vlastní nadpis)', () => {
    render(
      <DndBestieCombatActions
        ss={{ abilities: [{ nazev: 'Drtivý úder', typ: 'Legendární akce', popis: 'x' }] }}
        interactive={false}
        onRoll={vi.fn()}
      />,
    );
    expect(screen.getByText('Legendární akce')).toBeInTheDocument();
    expect(screen.getByText(/Drtivý úder/)).toBeInTheDocument();
  });

  it('interactive=false → hody disabled', () => {
    render(
      <DndBestieCombatActions
        ss={{ 'attributes.str': 16 }}
        interactive={false}
        onRoll={vi.fn()}
      />,
    );
    expect(screen.getByText('SÍL').closest('button')).toBeDisabled();
  });
});
