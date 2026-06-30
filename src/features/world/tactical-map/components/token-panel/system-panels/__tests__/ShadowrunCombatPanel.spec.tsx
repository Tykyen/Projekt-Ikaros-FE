/**
 * Shadowrun combat panel (fáze 3) — testy.
 *
 * Pokrývá: loading · Stav vždy · canEdit gating (atributy/dovednosti jen edit) ·
 * klik na dovednost/atribut → onRoll SR6 pool (`kind:'pool-d6'` + `pool`) ·
 * iniciativa (`kind:'d6'`).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { ShadowrunCombatPanel } from '../ShadowrunCombatPanel';
import type { MapToken } from '../../../../types';

const mockDiary = vi.fn();
vi.mock('@/features/world/pages/api/useCharacterSubdocs', () => ({
  useCharacterDiary: (worldId: string, slug: string) => mockDiary(worldId, slug),
}));
const mockMutate = vi.fn();
vi.mock('@/features/world/pages/api/useCharacterMutations', () => ({
  useUpdateCharacterDiary: () => ({ mutate: mockMutate }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function makeToken(overrides: Partial<MapToken> = {}): MapToken {
  return {
    id: 't1',
    characterId: 'c1',
    characterSlug: 'vex',
    q: 0,
    r: 0,
    isNpc: false,
    currentHp: 0,
    maxHp: 0,
    baseHp: 0,
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

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

const SAMPLE = {
  sr_attr_bod: '4',
  sr_attr_agi: '6',
  sr_attr_rea: '5',
  sr_attr_int: '5',
  sr_cond_phys: '0',
  sr_skills: JSON.stringify([
    { name: 'Střelba', attr: 'agi', val: '5', spec: 'Pistole' },
  ]),
};

beforeEach(() => {
  mockDiary.mockReset();
  mockMutate.mockReset();
});

describe('ShadowrunCombatPanel (fáze 3)', () => {
  it('loading state, dokud data nedorazí', () => {
    mockDiary.mockReturnValue({ data: undefined, isLoading: true });
    render(<ShadowrunCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit />, {
      wrapper: wrapper(),
    });
    expect(screen.getByText(/Načítám deník/)).toBeInTheDocument();
  });

  it('Stav se zobrazí vždy (i bez canEdit), atributy/dovednosti jen v editu', () => {
    mockDiary.mockReturnValue({ data: { customData: SAMPLE }, isLoading: false });
    const onRoll = vi.fn();
    const { rerender } = render(
      <ShadowrunCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={false}
        onRoll={onRoll}
      />,
      { wrapper: wrapper() },
    );
    expect(screen.getByText('Stav')).toBeInTheDocument();
    // cizí hráč nevidí dovednosti/atributy
    expect(screen.queryByText('Atributy')).toBeNull();
    expect(screen.queryByText('Střelba')).toBeNull();

    rerender(
      <ShadowrunCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
    );
    expect(screen.getByText('Atributy')).toBeInTheDocument();
    expect(screen.getByText('Střelba')).toBeInTheDocument();
  });

  it('klik na dovednost → onRoll SR6 pool (atribut+dovednost+spec)', () => {
    mockDiary.mockReturnValue({ data: { customData: SAMPLE }, isLoading: false });
    const onRoll = vi.fn();
    render(
      <ShadowrunCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit onRoll={onRoll} />,
      { wrapper: wrapper() },
    );
    fireEvent.click(screen.getByText('Střelba'));
    // OBR 6 + dovednost 5 + spec 2 − postih 0 = 13
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'pool-d6', pool: 13 }),
    );
  });

  it('klik na atribut → onRoll pool = hodnota atributu', () => {
    mockDiary.mockReturnValue({ data: { customData: SAMPLE }, isLoading: false });
    const onRoll = vi.fn();
    render(
      <ShadowrunCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit onRoll={onRoll} />,
      { wrapper: wrapper() },
    );
    fireEvent.click(screen.getByTitle(/Test Obratnost/));
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'pool-d6', pool: 6 }),
    );
  });

  it('iniciativa = Reakce+Intuice + 1k6 (kind d6, součet)', () => {
    mockDiary.mockReturnValue({ data: { customData: SAMPLE }, isLoading: false });
    const onRoll = vi.fn();
    render(
      <ShadowrunCombatPanel token={makeToken()} sceneId="s1" worldId="w1" canEdit onRoll={onRoll} />,
      { wrapper: wrapper() },
    );
    fireEvent.click(screen.getByTitle(/Iniciativa/));
    // REA 5 + INT 5 = 10
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'd6', modifier: 10, initiative: true }),
    );
  });
});
