import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drd16BestieCard } from '../Drd16BestieCard';
import type { Bestie } from '../../types';

function makeBestie(systemStats: Record<string, unknown>): Bestie {
  return {
    id: 'b1',
    scope: 'world',
    systemId: 'drd16',
    name: 'Brouk ostnatec',
    notes: 'Tvrdý pancíř.',
    systemStats,
    createdAt: '',
    updatedAt: '',
  } as Bestie;
}

const baseProps = {
  canEdit: true,
  canDelete: true,
  onEdit: vi.fn(),
  onClone: vi.fn(),
  onDelete: vi.fn(),
};

describe('Drd16BestieCard', () => {
  it('vykreslí jméno, Životy, OČ a útoky (list)', () => {
    render(
      <Drd16BestieCard
        {...baseProps}
        bestie={makeBestie({
          hp: 3,
          defense: 7,
          resilience: 16,
          movement: 15,
          movementMode: 'hmyz',
          attacks: [{ name: 'ostny', value: 3 }],
          experience: 20,
          size: 'A',
          alignment: 'N',
        })}
      />,
    );
    expect(screen.getByText('Brouk ostnatec')).toBeInTheDocument();
    expect(screen.getByText('Životy')).toBeInTheDocument();
    expect(screen.getByText('OČ')).toBeInTheDocument();
    expect(screen.getByText('ostny')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument(); // Odolnost pill
    expect(screen.getByText('15')).toBeInTheDocument(); // Pohyblivost
    expect(screen.getByText('hmyz')).toBeInTheDocument(); // způsob pohybu
  });

  it('víc útoků se vykreslí všechny', () => {
    render(
      <Drd16BestieCard
        {...baseProps}
        bestie={makeBestie({
          hp: 1,
          defense: 3,
          attacks: [
            { name: 'kusadla', value: 1 },
            { name: 'ochromení', value: '' },
          ],
        })}
      />,
    );
    expect(screen.getByText('kusadla')).toBeInTheDocument();
    expect(screen.getByText('ochromení')).toBeInTheDocument();
  });

  it('chybějící Životy → „—" (ne crash)', () => {
    render(<Drd16BestieCard {...baseProps} bestie={makeBestie({})} />);
    expect(screen.getByText('Brouk ostnatec')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('akce volají handlery + skryté dle práv', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const { rerender } = render(
      <Drd16BestieCard
        {...baseProps}
        onEdit={onEdit}
        onDelete={onDelete}
        bestie={makeBestie({ hp: 3 })}
      />,
    );
    fireEvent.click(screen.getByText('Upravit'));
    expect(onEdit).toHaveBeenCalledOnce();

    rerender(
      <Drd16BestieCard
        {...baseProps}
        canEdit={false}
        canDelete={false}
        bestie={makeBestie({ hp: 3 })}
      />,
    );
    expect(screen.queryByText('Upravit')).not.toBeInTheDocument();
    expect(screen.queryByText('Smazat')).not.toBeInTheDocument();
    expect(screen.getByText('Klonovat')).toBeInTheDocument();
  });
});
