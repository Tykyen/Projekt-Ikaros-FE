import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FateBestieCard } from '../FateBestieCard';
import type { Bestie } from '../../types';

function makeBestie(over: Partial<Bestie>): Bestie {
  return {
    id: 'b1',
    scope: 'world',
    systemId: 'fae',
    name: 'Agent Mlžné trojice',
    notes: '',
    systemStats: {},
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

const noop = vi.fn();
const actions = { canEdit: true, canDelete: true, onEdit: noop, onClone: noop, onDelete: noop };

describe('FateBestieCard', () => {
  it('FAE: vyrenderuje jméno, Hlavní koncept, 6 přístupů s hodnotou', () => {
    render(
      <FateBestieCard
        bestie={makeBestie({
          systemId: 'fae',
          systemStats: {
            highConcept: 'Neúprosný zabiják v mlze',
            'health.max': 3,
            appr_forceful: 2,
            appr_quick: 3,
            aspects: [{ label: 'Splývá se stínem' }],
          },
        })}
        {...actions}
      />,
    );
    expect(screen.getByText('Agent Mlžné trojice')).toBeInTheDocument();
    expect(screen.getByText('Neúprosný zabiják v mlze')).toBeInTheDocument();
    expect(screen.getByText('Rázně')).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument(); // quick
    expect(screen.getByText('Splývá se stínem')).toBeInTheDocument();
  });

  it('Core: vyrenderuje dovednosti místo přístupů', () => {
    render(
      <FateBestieCard
        bestie={makeBestie({
          systemId: 'fate',
          systemStats: {
            'health.max': 4,
            skills: [{ label: 'Boj', rating: 3 }],
          },
        })}
        {...actions}
      />,
    );
    expect(screen.getByText('Boj')).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.queryByText('Pečlivě')).not.toBeInTheDocument();
  });
});
