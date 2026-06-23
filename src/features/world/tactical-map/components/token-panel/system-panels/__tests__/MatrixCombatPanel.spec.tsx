/**
 * 10.2c-edit-9h — testy MatrixCombatPanel.
 *
 * Pokrytí:
 *  - render všech 4 sekcí když canEdit=true
 *  - render jen STATY (readonly) když canEdit=false
 *  - klik na skill value → onRoll
 *  - klik na INICIATIVA → onRoll s modifier = ⌊nabitých aspektů/2⌋
 *  - klik na aspect chip → toggle (přes mutace useUpdateCharacterDiary)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { MatrixCombatPanel } from '../MatrixCombatPanel';
import type { MapToken } from '../../../../types';

// ── Mocks ────────────────────────────────────────────────────────
const mockDiaryQuery = vi.fn();
const mockMutate = vi.fn();
const mockMutationReturn = {
  mutate: mockMutate,
  isSuccess: false,
  reset: vi.fn(),
};

vi.mock(
  '@/features/world/pages/api/useCharacterSubdocs',
  () => ({
    useCharacterDiary: (worldId: string, slug: string) =>
      mockDiaryQuery(worldId, slug),
  }),
);

vi.mock(
  '@/features/world/pages/api/useCharacterMutations',
  () => ({
    useUpdateCharacterDiary: () => mockMutationReturn,
  }),
);

// useCharacter → isNpc (pips clamp). Default PC (data undefined).
vi.mock('@/features/world/pages/api/useCharacter', () => ({
  useCharacter: () => ({ data: undefined }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeToken(overrides: Partial<MapToken> = {}): MapToken {
  return {
    id: 't1',
    characterId: 'c1',
    characterSlug: 'aragorn',
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

function makeDiary(customData: Record<string, unknown>) {
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
  mockDiaryQuery.mockReset();
  mockMutate.mockReset();
  mockMutationReturn.isSuccess = false;
  mockMutationReturn.reset.mockReset();
});

describe('MatrixCombatPanel', () => {
  it('canEdit=true → render všech 4 sekcí (STATY / DOVEDNOSTI / PŘETLAKY / ASPEKTY)', () => {
    mockDiaryQuery.mockReturnValue(
      makeDiary({
        matrix_health: '4',
        matrix_tiredness: '0',
        matrix_armor: '2',
        matrix_magicHealth: '1',
        matrix_abilities: JSON.stringify([
          { label: 'Boj zblízka', value: '3' },
        ]),
        matrix_aspects: JSON.stringify([
          { label: 'Hrdina', value: 'Nabitý' },
        ]),
      }),
    );
    const Wrapper = makeWrapper();
    render(
      <MatrixCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={true}
        onRoll={vi.fn()}
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('Staty')).toBeInTheDocument();
    expect(screen.getByText('Schopnosti')).toBeInTheDocument();
    expect(screen.getByText('Přetlaky')).toBeInTheDocument();
    expect(screen.getByText('Aspekty')).toBeInTheDocument();
    expect(screen.getByText('Boj zblízka')).toBeInTheDocument();
    expect(screen.getByText('Hrdina')).toBeInTheDocument();
  });

  it('canEdit=false → jen STATY (readonly), ostatní sekce skryté', () => {
    mockDiaryQuery.mockReturnValue(
      makeDiary({
        matrix_health: '3',
        matrix_tiredness: '8',
        matrix_armor: '2',
        matrix_magicHealth: '1',
        matrix_abilities: JSON.stringify([
          { label: 'Boj zblízka', value: '3' },
        ]),
        matrix_aspects: JSON.stringify([
          { label: 'Hrdina', value: 'Nabitý' },
        ]),
      }),
    );
    const Wrapper = makeWrapper();
    render(
      <MatrixCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={false}
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('Staty')).toBeInTheDocument();
    expect(screen.queryByText('Dovednosti')).not.toBeInTheDocument();
    expect(screen.queryByText('Přetlaky')).not.toBeInTheDocument();
    expect(screen.queryByText('Aspekty')).not.toBeInTheDocument();

    // STATY hodnoty viditelné, ale jako span (ne input)
    expect(screen.getByText('3')).toBeInTheDocument(); // health
    expect(screen.getByText('8')).toBeInTheDocument(); // tiredness
    expect(
      screen.queryByRole('spinbutton', { name: /životy/i }),
    ).not.toBeInTheDocument();
    // INICIATIVA tlačítko taky skryto (no onRoll + no canEdit)
    expect(
      screen.queryByRole('button', { name: /Iniciativa/i }),
    ).not.toBeInTheDocument();
  });

  it('klik na skill value triggers onRoll s `fate` kind a modifier dle úrovně', () => {
    mockDiaryQuery.mockReturnValue(
      makeDiary({
        matrix_health: '5',
        matrix_abilities: JSON.stringify([
          { label: 'Boj zblízka', value: '4' },
        ]),
        matrix_aspects: JSON.stringify([]),
      }),
    );
    const onRoll = vi.fn();
    const Wrapper = makeWrapper();
    render(
      <MatrixCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={true}
        onRoll={onRoll}
      />,
      { wrapper: Wrapper },
    );

    const skillBtn = screen.getByRole('button', { name: /Hodit Boj zblízka/i });
    fireEvent.click(skillBtn);
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Boj zblízka',
      modifier: 4,
      kind: 'fate',
    });
  });

  it('klik na INICIATIVA → onRoll s modifier = ⌊nabitých aspektů / 2⌋', () => {
    mockDiaryQuery.mockReturnValue(
      makeDiary({
        matrix_health: '5',
        matrix_abilities: JSON.stringify([]),
        matrix_aspects: JSON.stringify([
          { label: 'A1', value: 'Nabitý' },
          { label: 'A2', value: 'Nabitý' },
          { label: 'A3', value: 'Nabitý' },
          { label: 'A4', value: 'Vybitý' },
          { label: 'A5', value: 'Nabitý' },
        ]),
      }),
    );
    const onRoll = vi.fn();
    const Wrapper = makeWrapper();
    render(
      <MatrixCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={true}
        onRoll={onRoll}
      />,
      { wrapper: Wrapper },
    );

    // 4 nabité aspekty → modifier = 2
    const initBtn = screen.getByRole('button', { name: /Iniciativa/i });
    fireEvent.click(initBtn);
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Iniciativa',
      modifier: 2,
      kind: 'fate',
    });
  });

  it('klik na aspect chip nabitý→vybitý → mutate customDataPatch s aspects JSON', async () => {
    mockDiaryQuery.mockReturnValue(
      makeDiary({
        matrix_health: '5',
        matrix_abilities: JSON.stringify([]),
        matrix_aspects: JSON.stringify([
          { label: 'Hrdina', value: 'Nabitý' },
        ]),
      }),
    );
    const Wrapper = makeWrapper();
    render(
      <MatrixCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={true}
        onRoll={vi.fn()}
      />,
      { wrapper: Wrapper },
    );

    // aspekt chip = button s textem stavu (Nabitý)
    const chip = screen.getByRole('button', { name: 'Nabitý' });
    fireEvent.click(chip);

    // Debounce 500 ms — počkáme než se mutate vyvolá
    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const call = mockMutate.mock.calls[0][0];
    expect(call.customDataPatch).toBeDefined();
    const patched = JSON.parse(call.customDataPatch.matrix_aspects);
    expect(patched[0].value).toBe('Vybitý');
  });

  it('isLoading → spinner / placeholder text', () => {
    mockDiaryQuery.mockReturnValue({ data: undefined, isLoading: true });
    const Wrapper = makeWrapper();
    render(
      <MatrixCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={true}
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText(/Načítám/i)).toBeInTheDocument();
  });

  it('!diary (load failed) → error placeholder', () => {
    mockDiaryQuery.mockReturnValue({ data: undefined, isLoading: false });
    const Wrapper = makeWrapper();
    render(
      <MatrixCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={true}
      />,
      { wrapper: Wrapper },
    );
    expect(
      screen.getByText(/Deník se nepodařilo načíst/i),
    ).toBeInTheDocument();
  });
});
