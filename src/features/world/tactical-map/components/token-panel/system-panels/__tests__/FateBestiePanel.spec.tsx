/**
 * Testy FATE bestie panelu na mapě (data z token.systemStats, sdílené jádro
 * s PC combat panelem).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FateBestiePanel } from '../FateBestiePanel';
import type { MapToken } from '../../../../types';

const mockTokenMutate = vi.fn();
vi.mock('../../../../hooks/useTokenUpdate', () => ({
  useTokenUpdate: () => ({ mutate: mockTokenMutate, isPending: false }),
}));
vi.mock('../../../../utils/rollFromSheet', () => ({
  performSheetRoll: vi.fn(() => ({ total: 2, dicePayload: { kind: 'fate' } })),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function makeToken(systemStats: Record<string, unknown>): MapToken {
  return {
    id: 't1', characterId: 'bestie:x', characterSlug: '', q: 0, r: 0, isNpc: true,
    currentHp: 3, maxHp: 3, baseHp: 3, armor: 0, baseArmor: 0, injury: 0,
    initiative: 0, initiativeBase: 0, inCombat: false, movement: 6, abilities: [],
    customData: {}, instanceName: 'Agent', templateId: 'tmpl1', systemStats,
  } as unknown as MapToken;
}

describe('FateBestiePanel (fae)', () => {
  beforeEach(() => mockTokenMutate.mockClear());

  it('vykreslí 6 přístupů + stres boxy (z health.max) + Hlavní koncept', () => {
    render(
      <FateBestiePanel
        token={makeToken({ 'health.max': 3, 'health.current': 3, appr_forceful: 2, highConcept: 'Zabiják v mlze' })}
        sceneId="s1" worldId="w1" systemId="fae" canEdit
      />,
    );
    expect(screen.getByText('Rázně')).toBeInTheDocument();
    expect(screen.getByText('Zabiják v mlze')).toBeInTheDocument();
    expect(screen.getByLabelText('Stres 1 volný')).toBeInTheDocument();
    expect(screen.getByLabelText('Stres 3 volný')).toBeInTheDocument();
  });

  it('roll přístupu → onMapRoll(category skill)', () => {
    const onMapRoll = vi.fn();
    render(
      <FateBestiePanel
        token={makeToken({ 'health.max': 3, appr_quick: 3 })}
        sceneId="s1" worldId="w1" systemId="fae" canEdit onMapRoll={onMapRoll}
      />,
    );
    fireEvent.click(screen.getByLabelText('Hodit Rychle'));
    expect(onMapRoll).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'skill', rollerKind: 'bestie' }),
    );
  });

  it('toggle stres → mutate systemStats health.current (po debounce)', async () => {
    vi.useFakeTimers();
    try {
      render(
        <FateBestiePanel
          token={makeToken({ 'health.max': 3, 'health.current': 3 })}
          sceneId="s1" worldId="w1" systemId="fae" canEdit
        />,
      );
      // klik na box 2 (size 2) → used=2 → current = 3-2 = 1
      fireEvent.click(screen.getByLabelText('Stres 2 volný'));
      await act(async () => { await vi.advanceTimersByTimeAsync(600); });
      const arg = mockTokenMutate.mock.calls[0]?.[0] as {
        patch: { systemStats: Record<string, unknown> };
      };
      expect(arg.patch.systemStats['health.current']).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('FateBestiePanel (fate/core)', () => {
  it('vykreslí dovednosti místo přístupů', () => {
    render(
      <FateBestiePanel
        token={makeToken({ 'health.max': 4, skills: [{ label: 'Boj', rating: 3 }] })}
        sceneId="s1" worldId="w1" systemId="fate" canEdit
      />,
    );
    expect(screen.getByText('Boj')).toBeInTheDocument();
    expect(screen.queryByText('Pečlivě')).not.toBeInTheDocument();
  });
});
