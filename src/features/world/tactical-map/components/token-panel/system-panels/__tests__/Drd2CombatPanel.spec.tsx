/**
 * 10.2c-edit-9g — Drd2CombatPanel tests.
 *
 * Pokrývá:
 *   - render canEdit=true / false varianty (inputy disabled / enabled)
 *   - klik na profesi triggers `onRoll({ kind: 'd6' })` s úrovní jako modifier
 *   - HP / FP (Tělo / Duše) edit triggers debounced mutate
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { Drd2CombatPanel } from '../Drd2CombatPanel';
import type { MapToken } from '../../../../types';

// ── Mocks ───────────────────────────────────────────────────────
const mockDiary = vi.fn();
vi.mock('@/features/world/pages/api/useCharacterSubdocs', () => ({
  useCharacterDiary: (worldId: string, slug: string) =>
    mockDiary(worldId, slug),
}));

const mockMutate = vi.fn();
vi.mock('@/features/world/pages/api/useCharacterMutations', () => ({
  useUpdateCharacterDiary: () => ({
    mutate: mockMutate,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// ── Helpers ─────────────────────────────────────────────────────
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
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  mockDiary.mockReset();
  mockMutate.mockReset();
  vi.useFakeTimers();
});

describe('Drd2CombatPanel', () => {
  it('loading state se vyrenderuje, dokud data nedorazí', () => {
    mockDiary.mockReturnValue({ data: undefined, isLoading: true });
    const Wrapper = makeWrapper();
    render(
      <Drd2CombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText(/NAČÍTÁM DATA/)).toBeInTheDocument();
  });

  it('canEdit=true → inputy enabled', () => {
    mockDiary.mockReturnValue({
      data: {
        id: 'd1',
        characterId: 'c1',
        worldId: 'w1',
        sections: [],
        customData: {
          drd2_body: '4',
          drd2_body_max: '5',
        },
      },
      isLoading: false,
    });
    const Wrapper = makeWrapper();
    render(
      <Drd2CombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
      { wrapper: Wrapper },
    );
    const teloCur = screen.getByLabelText('Tělo aktuální') as HTMLInputElement;
    expect(teloCur).not.toBeDisabled();
    expect(teloCur.value).toBe('4');
  });

  it('canEdit=false → inputy disabled, žádné iniciativy', () => {
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
    const Wrapper = makeWrapper();
    render(
      <Drd2CombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={false}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByLabelText('Tělo aktuální')).toBeDisabled();
    expect(screen.getByLabelText('Ohrožení')).toBeDisabled();
    // bez onRoll = bez Iniciativa buttonu
    expect(screen.queryByText(/Iniciativa/)).not.toBeInTheDocument();
  });

  it('klik na základní povolání triggers onRoll s úrovní jako modifier (kind=d6)', () => {
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
    const Wrapper = makeWrapper();
    render(
      <Drd2CombatPanel
        token={makeToken({ instanceName: 'Kovář' })}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByLabelText('Povolání Bojovník úroveň 3'));
    expect(onRoll).toHaveBeenCalledTimes(1);
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Kovář — Povolání: Bojovník',
      modifier: 3,
      kind: 'd6',
    });
  });

  it('edit Tělo (HP) triggers debounced mutate s customDataPatch', () => {
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
    const Wrapper = makeWrapper();
    render(
      <Drd2CombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
      { wrapper: Wrapper },
    );
    const teloCur = screen.getByLabelText('Tělo aktuální');
    fireEvent.change(teloCur, { target: { value: '2' } });

    // Debounce není dosud uplynul → mutate ještě nevolán
    expect(mockMutate).not.toHaveBeenCalled();

    // Posuň čas přes debounce window
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const call = mockMutate.mock.calls[0][0];
    expect(call).toEqual({
      customDataPatch: { drd2_body: '2' },
    });
  });

  it('empty diary → fallback message', () => {
    mockDiary.mockReturnValue({ data: null, isLoading: false });
    const Wrapper = makeWrapper();
    render(
      <Drd2CombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
      { wrapper: Wrapper },
    );
    expect(
      screen.getByText(/Deník postavy nedostupný/),
    ).toBeInTheDocument();
  });
});
