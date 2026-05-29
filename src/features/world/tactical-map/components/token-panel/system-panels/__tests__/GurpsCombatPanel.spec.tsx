/**
 * 10.2c-edit-9h — testy GurpsCombatPanel.
 *
 * Pokrývá:
 *   - render canEdit=true / canEdit=false (read-only HP/FP, vypnuté roll buttons)
 *   - klik na attribute card → onRoll triggered s 3d6 kind='d6' a modifier = target
 *   - klik na skill row → onRoll s parsed lvl
 *   - HP input edit s debounce → useUpdateCharacterDiary mutate s customDataPatch
 *   - empty state když diary chybí
 *   - loading state
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import type { MapToken } from '../../../../types';
import { GurpsCombatPanel } from '../GurpsCombatPanel';

// ── Mocks subdoc query a mutace ──────────────────────────────────
const mockDiary = vi.fn();
const mockMutate = vi.fn();

vi.mock('@/features/world/pages/api/useCharacterSubdocs', () => ({
  useCharacterDiary: (worldId: string, slug: string) =>
    mockDiary(worldId, slug),
}));

vi.mock('@/features/world/pages/api/useCharacterMutations', () => ({
  useUpdateCharacterDiary: (_worldId: string, _slug: string) => ({
    mutate: mockMutate,
  }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
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
    characterSlug: 'gurps-hero',
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
    gurps_hp: '8',
    gurps_hp_max: '12',
    gurps_fp: '10',
    gurps_fp_max: '10',
    gurps_st: '12',
    gurps_dx: '14',
    gurps_iq: '11',
    gurps_ht: '10',
    gurps_will: '10',
    gurps_per: '10',
    gurps_basic_speed: '6.0',
    gurps_basic_move: '6',
    gurps_dr: '2',
    gurps_parry: '9',
    gurps_block: '8',
    gurps_tl: '8',
    gurps_skills: JSON.stringify([
      { name: 'Šerm', lvl: '14', base: 'DX+0' },
      { name: 'Stealth', lvl: '13', base: 'DX-1' },
    ]),
    gurps_melee: JSON.stringify([
      { name: 'Meč', dmg: 'sw+2', reach: '1', parry: '9' },
    ]),
  },
};

beforeEach(() => {
  mockDiary.mockReset();
  mockMutate.mockReset();
  vi.useRealTimers();
});

describe('GurpsCombatPanel', () => {
  it('loading stav', () => {
    mockDiary.mockReturnValue({ data: undefined, isLoading: true });
    const Wrapper = makeWrapper();
    render(
      <GurpsCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText(/Načítám deník/i)).toBeInTheDocument();
  });

  it('empty stav — diary null', () => {
    mockDiary.mockReturnValue({ data: null, isLoading: false });
    const Wrapper = makeWrapper();
    render(
      <GurpsCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
      { wrapper: Wrapper },
    );
    expect(
      screen.getByText(/Deník postavy nebyl nalezen/i),
    ).toBeInTheDocument();
  });

  it('canEdit=true — HP input je editovatelný, attribute roll buttons enabled', () => {
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    const onRoll = vi.fn();
    const Wrapper = makeWrapper();
    render(
      <GurpsCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: Wrapper },
    );
    const hpInput = screen.getByLabelText(/HP aktuální/i) as HTMLInputElement;
    expect(hpInput.readOnly).toBe(false);
    expect(hpInput.value).toBe('8');

    // Attribute button (ST) enabled
    const stBtn = screen.getByLabelText(/Hod na ST/i);
    expect(stBtn).not.toBeDisabled();
  });

  it('canEdit=false — HP input read-only, attribute roll buttons stále enabled (onRoll provided)', () => {
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    const onRoll = vi.fn();
    const Wrapper = makeWrapper();
    render(
      <GurpsCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={false}
        onRoll={onRoll}
      />,
      { wrapper: Wrapper },
    );
    const hpInput = screen.getByLabelText(/HP aktuální/i) as HTMLInputElement;
    expect(hpInput.readOnly).toBe(true);

    // Read-only mód: HP změna nesmí volat mutate
    fireEvent.change(hpInput, { target: { value: '5' } });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('bez onRoll — attribute karty disabled', () => {
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    const Wrapper = makeWrapper();
    render(
      <GurpsCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
      { wrapper: Wrapper },
    );
    const stBtn = screen.getByLabelText(/Hod na ST/i) as HTMLButtonElement;
    expect(stBtn).toBeDisabled();
  });

  it('klik na ST attribute → onRoll s d6 kind a modifier = ST value', () => {
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    const onRoll = vi.fn();
    const Wrapper = makeWrapper();
    render(
      <GurpsCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: Wrapper },
    );

    fireEvent.click(screen.getByLabelText(/Hod na ST/i));
    expect(onRoll).toHaveBeenCalledTimes(1);
    const call = onRoll.mock.calls[0][0];
    expect(call.kind).toBe('d6');
    expect(call.modifier).toBe(12); // gurps_st = '12'
    expect(call.label).toMatch(/ST/);
    expect(call.label).toMatch(/cíl 12/);
  });

  it('klik na skill row → onRoll s parsed lvl', () => {
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    const onRoll = vi.fn();
    const Wrapper = makeWrapper();
    render(
      <GurpsCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: Wrapper },
    );

    fireEvent.click(screen.getByText('Šerm'));
    expect(onRoll).toHaveBeenCalledTimes(1);
    const call = onRoll.mock.calls[0][0];
    expect(call.kind).toBe('d6');
    expect(call.modifier).toBe(14);
    expect(call.label).toMatch(/Šerm/);
  });

  it('iniciativa button → onRoll', () => {
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    const onRoll = vi.fn();
    const Wrapper = makeWrapper();
    render(
      <GurpsCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByText(/Iniciativa/i));
    expect(onRoll).toHaveBeenCalledTimes(1);
    expect(onRoll.mock.calls[0][0].kind).toBe('d6');
  });

  it('HP edit s debounce → po 500 ms mutate s customDataPatch', () => {
    vi.useFakeTimers();
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    const Wrapper = makeWrapper();
    render(
      <GurpsCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
      { wrapper: Wrapper },
    );
    const hpInput = screen.getByLabelText(/HP aktuální/i) as HTMLInputElement;
    fireEvent.change(hpInput, { target: { value: '5' } });
    // Před uplynutím debounce ještě nic
    expect(mockMutate).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(mockMutate).toHaveBeenCalledTimes(1);
    const arg = mockMutate.mock.calls[0][0];
    expect(arg).toEqual({ customDataPatch: { gurps_hp: '5' } });
  });

  it('melee tabulka rendruje weapon row', () => {
    mockDiary.mockReturnValue({ data: SAMPLE_DIARY, isLoading: false });
    const Wrapper = makeWrapper();
    render(
      <GurpsCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Meč')).toBeInTheDocument();
    expect(screen.getByText('sw+2')).toBeInTheDocument();
  });
});
