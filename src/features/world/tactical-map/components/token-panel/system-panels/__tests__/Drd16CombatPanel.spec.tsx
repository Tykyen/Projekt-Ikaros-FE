/**
 * 16.2b-mapa — Drd16CombatPanel tests.
 *
 * Pokrývá:
 *   - loading / empty fallback
 *   - klik na vlastnost → onRoll({ kind: 'd10' }) s getDrdBonus jako modifier
 *   - klik na zbraň / obranu / iniciativu → onRoll({ kind: 'd6+' })
 *   - canEdit=false → bez iniciativy a bez ± kroků
 *   - okno Kouzla: „+ Přidat kouzlo" zapíše strukturovaný spells (debounced)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { Drd16CombatPanel } from '../Drd16CombatPanel';
import type { MapToken } from '../../../../types';

const mockDiary = vi.fn();
vi.mock('@/features/world/pages/api/useCharacterSubdocs', () => ({
  useCharacterDiary: (worldId: string, slug: string) => mockDiary(worldId, slug),
}));

const mockMutate = vi.fn();
vi.mock('@/features/world/pages/api/useCharacterMutations', () => ({
  useUpdateCharacterDiary: () => ({ mutate: mockMutate }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function makeToken(overrides: Partial<MapToken> = {}): MapToken {
  return {
    id: 't1',
    characterId: 'c1',
    characterSlug: 'hero',
    q: 0,
    r: 0,
    isNpc: false,
    currentHp: 21,
    maxHp: 34,
    baseHp: 34,
    armor: 0,
    baseArmor: 0,
    injury: 0,
    initiative: 0,
    initiativeBase: 0,
    inCombat: false,
    movement: 13,
    abilities: [],
    customData: {},
    ...overrides,
  };
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function diaryWith(customData: Record<string, unknown>) {
  return {
    data: {
      id: 'd1',
      characterId: 'c1',
      worldId: 'w1',
      sections: [],
      customData,
    },
    isLoading: false,
  };
}

beforeEach(() => {
  mockDiary.mockReset();
  mockMutate.mockReset();
  vi.useFakeTimers();
});

describe('Drd16CombatPanel', () => {
  it('loading state, dokud data nedorazí', () => {
    mockDiary.mockReturnValue({ data: undefined, isLoading: true });
    render(
      <Drd16CombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/Načítám deník/)).toBeInTheDocument();
  });

  it('empty diary → fallback', () => {
    mockDiary.mockReturnValue({ data: null, isLoading: false });
    render(
      <Drd16CombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/Deník postavy nedostupný/)).toBeInTheDocument();
  });

  it('klik na vlastnost → onRoll k10 + getDrdBonus (Síla 16 → +2)', () => {
    mockDiary.mockReturnValue(diaryWith({ str_val: '16' }));
    const onRoll = vi.fn();
    render(
      <Drd16CombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByLabelText('Hodit Síla'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Síla',
      modifier: 2,
      kind: 'd10',
    });
  });

  it('klik na zbraň → onRoll ÚČ + d6+', () => {
    mockDiary.mockReturnValue(
      diaryWith({
        meleeWeapons: JSON.stringify([
          { weapon: 'Dlouhý meč', where: '', uc: '7', utoc: '+3', oz: '2' },
        ]),
      }),
    );
    const onRoll = vi.fn();
    render(
      <Drd16CombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByLabelText('Útok Dlouhý meč'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Útok: Dlouhý meč',
      modifier: 7,
      kind: 'd6+',
    });
  });

  it('klik na obranu → onRoll OČ + d6+', () => {
    mockDiary.mockReturnValue(diaryWith({ defense: '3' }));
    const onRoll = vi.fn();
    render(
      <Drd16CombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByLabelText('Hodit obranu'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Obrana',
      modifier: 3,
      kind: 'd6+',
    });
  });

  it('iniciativa → onRoll d6+ bez bonusu', () => {
    mockDiary.mockReturnValue(diaryWith({}));
    const onRoll = vi.fn();
    render(
      <Drd16CombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByTitle('Hodit iniciativu (d6+)'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Iniciativa',
      modifier: 0,
      kind: 'd6+',
    });
  });

  it('canEdit=false → bez iniciativy a bez ± kroků', () => {
    mockDiary.mockReturnValue(diaryWith({ hp_current: '21', hp_max: '34' }));
    render(
      <Drd16CombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={false}
      />,
      { wrapper: makeWrapper() },
    );
    expect(screen.queryByTitle('Hodit iniciativu (d6+)')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Životy +1')).not.toBeInTheDocument();
  });

  it('± krok upraví hp_current (debounced mutate)', () => {
    mockDiary.mockReturnValue(diaryWith({ hp_current: '21', hp_max: '34' }));
    render(
      <Drd16CombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByLabelText('Životy -5'));
    expect(mockMutate).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(600));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ customDataPatch: { hp_current: '16' } }),
      expect.anything(),
    );
  });

  it('okno Kouzla: + Přidat kouzlo zapíše strukturovaný spells', () => {
    mockDiary.mockReturnValue(diaryWith({}));
    render(
      <Drd16CombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByText('📖 Kouzla'));
    fireEvent.click(screen.getByText('+ Přidat kouzlo'));
    act(() => vi.advanceTimersByTime(600));
    const call = mockMutate.mock.calls[0][0];
    const spells = JSON.parse(call.customDataPatch.spells);
    expect(spells).toHaveLength(1);
    expect(spells[0]).toHaveProperty('name', '');
  });
});
