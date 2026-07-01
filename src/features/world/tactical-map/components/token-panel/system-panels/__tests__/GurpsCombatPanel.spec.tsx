/**
 * GURPS 4E combat panel — testy.
 * Pokrývá: loading/empty, canEdit gating (steppers + privátní sekce),
 * HP ± debounced mutate, roll-under hody (atribut/dovednost/zbraň zásah),
 * škody (mixed), iniciativa (flat), modifikátor foldnutý do cíle.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import type { MapToken } from '../../../../types';
import { GurpsCombatPanel } from '../GurpsCombatPanel';

const mockDiary = vi.fn();
const mockMutate = vi.fn();

vi.mock('@/features/world/pages/api/useCharacterSubdocs', () => ({
  useCharacterDiary: (worldId: string, slug: string) => mockDiary(worldId, slug),
}));
vi.mock('@/features/world/pages/api/useCharacterMutations', () => ({
  useUpdateCharacterDiary: () => ({ mutate: mockMutate }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function makeToken(overrides: Partial<MapToken> = {}): MapToken {
  return {
    id: 't1',
    characterId: 'c1',
    characterSlug: 'kaelen',
    q: 0,
    r: 0,
    isNpc: false,
    currentHp: 10,
    maxHp: 10,
    baseHp: 10,
    armor: 0,
    baseArmor: 0,
    injury: 0,
    initiative: 0,
    initiativeBase: 0,
    inCombat: false,
    movement: 5,
    abilities: [],
    customData: {},
    ...overrides,
  } as MapToken;
}

const SAMPLE_DIARY = {
  id: 'd1',
  characterId: 'c1',
  worldId: 'w1',
  sections: [],
  customData: {
    gurps_name: 'Kaelen',
    gurps_hp: '8',
    gurps_hp_max: '12',
    gurps_fp: '10',
    gurps_fp_max: '10',
    gurps_st: '12',
    gurps_dx: '14',
    gurps_iq: '11',
    gurps_ht: '10',
    gurps_parry: '10',
    gurps_skills: JSON.stringify([
      { name: 'Krátký meč', base: 'DX/A', pts: '4', lvl: '15' },
      { name: 'Nenápadnost', base: 'DX/A', pts: '4', lvl: '14' },
    ]),
    gurps_melee: JSON.stringify([
      { name: 'Krátký meč', dmg: '1k+1', reach: '1', parry: '10' },
    ]),
  },
};

function renderPanel(props: Partial<Parameters<typeof GurpsCombatPanel>[0]> = {}) {
  return render(
    <GurpsCombatPanel
      token={makeToken()}
      sceneId="s1"
      worldId="w1"
      canEdit
      {...props}
    />,
    { wrapper: makeWrapper() },
  );
}

beforeEach(() => {
  mockDiary.mockReset();
  mockMutate.mockReset();
  vi.useRealTimers();
});

describe('GurpsCombatPanel (GURPS 4E)', () => {
  it('loading stav', () => {
    mockDiary.mockReturnValue({ data: undefined, isLoading: true });
    renderPanel();
    expect(screen.getByText(/Načítám deník/i)).toBeInTheDocument();
  });

  it('empty stav — diary null', () => {
    mockDiary.mockReturnValue({ data: null, isLoading: false });
    renderPanel();
    expect(screen.getByText(/Deník postavy nedostupný/i)).toBeInTheDocument();
  });

  it('canEdit=true — HP steppery + rychlé hody dostupné', () => {
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    renderPanel({ onRoll: vi.fn() });
    expect(screen.getByText('−5')).toBeInTheDocument();
    expect(screen.getByText('Rychlé hody')).toBeInTheDocument();
    expect(screen.getByText('8 / 12')).toBeInTheDocument();
  });

  it('canEdit=false — jen Stav (žádné steppery, žádné rychlé hody)', () => {
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    renderPanel({ canEdit: false, onRoll: vi.fn() });
    expect(screen.getByText('8 / 12')).toBeInTheDocument(); // vitals vidí
    expect(screen.queryByText('−5')).not.toBeInTheDocument();
    expect(screen.queryByText('Rychlé hody')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Hod na Síla')).not.toBeInTheDocument();
  });

  it('HP −1 → debounced mutate gurps_hp', () => {
    vi.useFakeTimers();
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    renderPanel();
    // dvě −1 tlačítka (HP a FP) — první je HP
    fireEvent.click(screen.getAllByText('−1')[0]);
    expect(mockMutate).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(500));
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate.mock.calls[0][0]).toEqual({
      customDataPatch: { gurps_hp: '7' },
    });
  });

  it('klik na atribut Síla → roll-under 3k6 vs cíl 12', () => {
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    const onRoll = vi.fn();
    renderPanel({ onRoll });
    fireEvent.click(screen.getByLabelText('Hod na Síla'));
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: '3d6', target: 12 }),
    );
  });

  it('modifikátor +4 se foldne do cíle', () => {
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    const onRoll = vi.fn();
    renderPanel({ onRoll });
    fireEvent.click(screen.getByText('Útok naplno +4'));
    fireEvent.click(screen.getByLabelText('Hod na Síla'));
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: '3d6', target: 16 }),
    );
  });

  it('klik na dovednost → roll-under vs úroveň', () => {
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    const onRoll = vi.fn();
    renderPanel({ onRoll });
    fireEvent.click(screen.getByText('Nenápadnost'));
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: '3d6', target: 14 }),
    );
  });

  it('zbraň: zásah (roll-under dle shodné dovednosti) + škody (mixed)', () => {
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    const onRoll = vi.fn();
    renderPanel({ onRoll });
    fireEvent.click(screen.getByLabelText('Krátký meč zásah'));
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: '3d6', target: 15 }),
    );
    onRoll.mockClear();
    fireEvent.click(screen.getByLabelText('Krátký meč škody'));
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'mixed', mixed: { d6: 1 }, modifier: 1 }),
    );
  });

  it('iniciativa → flat hod (= Základní rychlost)', () => {
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    const onRoll = vi.fn();
    renderPanel({ onRoll });
    fireEvent.click(screen.getByText(/Do iniciativy/i));
    // speed = (DX 14 + HT 10) / 4 = 6
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'flat', modifier: 6, initiative: true }),
    );
  });
});
