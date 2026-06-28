/**
 * 16.2e-mapa — Drd2CombatPanel testy (redesign).
 *
 * Pokrývá:
 *   - loading / empty stavy
 *   - canEdit true/false (segmenty enabled/disabled, žádná iniciativa bez onRoll)
 *   - klik na povolání → onRoll({ kind: '2d6+', modifier: úroveň })
 *   - klik na segment Tělo → debounced mutate s customDataPatch
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { Drd2CombatPanel } from '../Drd2CombatPanel';
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
    currentHp: 5,
    maxHp: 5,
    baseHp: 5,
    armor: 0,
    baseArmor: 0,
    injury: 0,
    initiative: 0,
    initiativeBase: 0,
    inCombat: false,
    movement: 6,
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

beforeEach(() => {
  mockDiary.mockReset();
  mockMutate.mockReset();
  vi.useFakeTimers();
});

describe('Drd2CombatPanel (16.2e)', () => {
  it('loading state se vyrenderuje, dokud data nedorazí', () => {
    mockDiary.mockReturnValue({ data: undefined, isLoading: true });
    render(
      <Drd2CombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/NAČÍTÁM DATA/)).toBeInTheDocument();
  });

  it('empty diary → fallback message', () => {
    mockDiary.mockReturnValue({ data: null, isLoading: false });
    render(
      <Drd2CombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText(/Deník postavy nedostupný/)).toBeInTheDocument();
  });

  it('canEdit=true → segmenty enabled, hodnota odpovídá datům', () => {
    mockDiary.mockReturnValue({
      data: {
        id: 'd1',
        characterId: 'c1',
        worldId: 'w1',
        sections: [],
        customData: { drd2_body: '4', drd2_body_max: '5' },
      },
      isLoading: false,
    });
    render(
      <Drd2CombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByLabelText('Tělo 1')).not.toBeDisabled();
    expect(screen.getByLabelText('Tělo stav')).toHaveTextContent('4 / 5');
  });

  it('canEdit=false → segmenty disabled, bez iniciativy', () => {
    mockDiary.mockReturnValue({
      data: {
        id: 'd1',
        characterId: 'c1',
        worldId: 'w1',
        sections: [],
        customData: { drd2_body: '3', drd2_body_max: '5' },
      },
      isLoading: false,
    });
    render(
      <Drd2CombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={false}
      />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByLabelText('Tělo 1')).toBeDisabled();
    expect(screen.getByLabelText('Ohrožení 1')).toBeDisabled();
    expect(screen.queryByText(/Iniciativa/)).not.toBeInTheDocument();
  });

  it('klik na povolání → onRoll s úrovní jako modifier (kind=2d6+)', () => {
    mockDiary.mockReturnValue({
      data: {
        id: 'd1',
        characterId: 'c1',
        worldId: 'w1',
        sections: [],
        customData: {
          drd2_basic_professions: JSON.stringify([
            { id: 'bojovnik', name: 'Bojovník', level: 3 },
          ]),
        },
      },
      isLoading: false,
    });
    const onRoll = vi.fn();
    render(
      <Drd2CombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByLabelText('Hodit povolání Bojovník'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Bojovník',
      modifier: 3,
      kind: '2d6+',
    });
  });

  it('iniciativa → onRoll 2d6+ bez modifikátoru s initiative flag', () => {
    mockDiary.mockReturnValue({
      data: {
        id: 'd1',
        characterId: 'c1',
        worldId: 'w1',
        sections: [],
        customData: {},
      },
      isLoading: false,
    });
    const onRoll = vi.fn();
    render(
      <Drd2CombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByText(/Iniciativa/));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Iniciativa',
      modifier: 0,
      kind: '2d6+',
      initiative: true,
    });
  });

  it('klik na segment Tělo → debounced mutate s customDataPatch', () => {
    mockDiary.mockReturnValue({
      data: {
        id: 'd1',
        characterId: 'c1',
        worldId: 'w1',
        sections: [],
        customData: { drd2_body: '5', drd2_body_max: '5' },
      },
      isLoading: false,
    });
    render(
      <Drd2CombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />,
      { wrapper: makeWrapper() },
    );
    fireEvent.click(screen.getByLabelText('Tělo 2'));
    expect(mockMutate).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate.mock.calls[0][0]).toEqual({
      customDataPatch: { drd2_body: '2' },
    });
  });
});
