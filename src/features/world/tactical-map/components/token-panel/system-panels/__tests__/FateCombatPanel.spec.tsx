/**
 * Testy FATE PC combat panelu (přepsáno na model „Karty osudu":
 * přístupy/dovednosti + stres boxy + následky + body osudu).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FaeCombatPanel, FateCombatPanel } from '../FateCombatPanel';
import type { CharacterDiary } from '@/features/world/pages/api/characters.types';
import type { MapToken } from '../../../../types';

let mockDiary: CharacterDiary | undefined;
let mockLoading = false;
const mockMutate = vi.fn();

vi.mock('@/features/world/pages/api/useCharacterSubdocs', () => ({
  useCharacterDiary: () => ({ data: mockDiary, isLoading: mockLoading }),
}));
vi.mock('@/features/world/pages/api/useCharacterMutations', () => ({
  useUpdateCharacterDiary: () => ({ mutate: mockMutate, isPending: false }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function makeToken(): MapToken {
  return {
    id: 't1', characterId: 'c1', characterSlug: 'shayra', q: 0, r: 0, isNpc: false,
    currentHp: 0, maxHp: 0, baseHp: 0, armor: 0, baseArmor: 0, injury: 0,
    initiative: 0, initiativeBase: 0, inCombat: false, movement: 6, abilities: [], customData: {},
  };
}
function makeDiary(customData: Record<string, unknown> = {}): CharacterDiary {
  return { id: 'd1', characterId: 'c1', worldId: 'w1', sections: [], customData };
}

describe('FaeCombatPanel (Přístupy)', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockLoading = false;
    mockDiary = makeDiary({
      fae_appr_careful: '2',
      fae_appr_forceful: '3',
      fae_highConcept: 'Princezna s dračí krví',
      fae_refresh: '3',
    });
  });

  it('loading state', () => {
    mockLoading = true;
    mockDiary = undefined;
    render(<FaeCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />);
    expect(screen.getByText(/načítám statblok/i)).toBeInTheDocument();
  });

  it('vykreslí 6 přístupů + sekce Stres/Následky + Body osudu', () => {
    render(<FaeCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />);
    ['Pečlivě', 'Chytře', 'Oslnivě', 'Rázně', 'Rychle', 'Lstivě'].forEach((l) =>
      expect(screen.getByText(l)).toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { name: 'Stres' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Následky' })).toBeInTheDocument();
    expect(screen.getByText('Body osudu')).toBeInTheDocument();
  });

  it('roll přístupu → onRoll(label, modifier z appr, kind fate)', () => {
    const onRoll = vi.fn();
    render(<FaeCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit onRoll={onRoll} />);
    fireEvent.click(screen.getByLabelText('Hodit Rázně'));
    expect(onRoll).toHaveBeenCalledWith({ label: 'Rázně', modifier: 3, kind: 'fate' });
  });

  it('Iniciativa → onRoll Iniciativa modifier 0', () => {
    const onRoll = vi.fn();
    render(<FaeCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit onRoll={onRoll} />);
    fireEvent.click(screen.getByTitle(/hodit iniciativu/i));
    expect(onRoll).toHaveBeenCalledWith({ label: 'Iniciativa', modifier: 0, kind: 'fate' });
  });

  it('toggle stres → mutate fae_stress (po debounce)', async () => {
    vi.useFakeTimers();
    try {
      render(<FaeCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />);
      fireEvent.click(screen.getByLabelText('Stres 1 volný'));
      await act(async () => { await vi.advanceTimersByTimeAsync(600); });
      const args = mockMutate.mock.calls[0]?.[0] as { customDataPatch: Record<string, string> };
      const stress = JSON.parse(args.customDataPatch.fae_stress) as { on: boolean }[];
      expect(stress[0].on).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('Body osudu + → mutate fae_fatePoints', async () => {
    vi.useFakeTimers();
    try {
      render(<FaeCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />);
      fireEvent.click(screen.getByLabelText('Body osudu +'));
      await act(async () => { await vi.advanceTimersByTimeAsync(600); });
      const args = mockMutate.mock.calls[0]?.[0] as { customDataPatch: Record<string, string> };
      expect(args.customDataPatch.fae_fatePoints).toBe('4');
    } finally {
      vi.useRealTimers();
    }
  });

  it('canEdit=false → stres box disabled, žádné +/− body osudu', () => {
    render(<FaeCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit={false} />);
    expect(screen.getByLabelText('Stres 1 volný')).toBeDisabled();
    expect(screen.queryByLabelText('Body osudu +')).not.toBeInTheDocument();
  });
});

describe('FateCombatPanel (Dovednosti)', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockLoading = false;
    mockDiary = makeDiary({
      fate_skills: JSON.stringify([{ name: 'Boj', val: '3' }, { name: 'Klam', val: '1' }]),
    });
  });

  it('vykreslí Dovednosti z fate_skills (ne přístupy)', () => {
    render(<FateCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />);
    expect(screen.getByRole('heading', { name: 'Dovednosti' })).toBeInTheDocument();
    expect(screen.getByText('Boj')).toBeInTheDocument();
    expect(screen.queryByText('Pečlivě')).not.toBeInTheDocument();
  });

  it('roll dovednosti → onRoll s val modifierem', () => {
    const onRoll = vi.fn();
    render(<FateCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit onRoll={onRoll} />);
    fireEvent.click(screen.getByLabelText('Hodit Boj'));
    expect(onRoll).toHaveBeenCalledWith({ label: 'Boj', modifier: 3, kind: 'fate' });
  });
});
