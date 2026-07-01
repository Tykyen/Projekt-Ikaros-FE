/**
 * 10.2c-edit-9g — testy CoC kompaktního bojového panelu.
 *
 * Pokrývá:
 *   1. canEdit=true — render vitals, statusů, charakteristik, dovedností
 *   2. canEdit=false — vitals input je readonly, status toggles disabled
 *   3. Klik na skill se známou hodnotou volá `onRoll` s kind='d100'
 *   4. Edit HP triggeruje debounced `updateDiary.mutate`
 *   5. Toggle statusu (immediate) zavolá mutate okamžitě
 *   6. Empty state když diary chybí
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { MapToken } from '../../../../types';
import { CocCombatPanel } from '../CocCombatPanel';

// ── Mocky pro subdoc hooky ─────────────────────────────────────────

const mockDiary = vi.fn();
const mockMutate = vi.fn();

vi.mock('@/features/world/pages/api/useCharacterSubdocs', () => ({
  useCharacterDiary: (worldId: string, slug: string) =>
    mockDiary(worldId, slug),
}));

vi.mock('@/features/world/pages/api/useCharacterMutations', () => ({
  useUpdateCharacterDiary: () => ({ mutate: mockMutate }),
}));

// ── Token fixture ──────────────────────────────────────────────────

function makeToken(overrides: Partial<MapToken> = {}): MapToken {
  return {
    id: 't1',
    characterId: 'c1',
    characterSlug: 'slug-postavy',
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
    movement: 0,
    abilities: [],
    customData: {},
    ...overrides,
  };
}

function makeDiary(customData: Record<string, unknown> = {}) {
  return {
    id: 'd1',
    characterId: 'c1',
    worldId: 'w1',
    sections: [],
    customData,
  };
}

// ── Setup ──────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  mockDiary.mockReset();
  mockMutate.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CocCombatPanel — render varianty', () => {
  it('loading state — zobrazí "Načítám deník…"', () => {
    mockDiary.mockReturnValue({ data: undefined, isLoading: true });
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
    );
    expect(screen.getByText(/Načítám deník/i)).toBeInTheDocument();
  });

  it('empty state — když diary chybí', () => {
    mockDiary.mockReturnValue({ data: null, isLoading: false });
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
    );
    expect(screen.getByText(/Deník není k dispozici/i)).toBeInTheDocument();
  });

  it('canEdit=true — render vitals, statusů, charakteristik, dovedností', () => {
    mockDiary.mockReturnValue({
      data: makeDiary({
        coc_hp_cur: '8',
        coc_hp_max: '10',
        coc_san_cur: '55',
        coc_san_start: '70',
        coc_str_reg: '60',
        coc_sk_spot_hidden_reg: '45',
      }),
      isLoading: false,
    });
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
    );
    // Vitals labels
    expect(screen.getByText('Životy')).toBeInTheDocument();
    expect(screen.getByText('Příčetnost')).toBeInTheDocument();
    expect(screen.getByText('Magie')).toBeInTheDocument();
    expect(screen.getByText('Štěstí')).toBeInTheDocument();
    // Char label
    expect(screen.getByText('SIL')).toBeInTheDocument();
    // Skill label
    expect(screen.getByText('Postřeh')).toBeInTheDocument();
    // Status badge — enabled tlačítko
    const statusBtn = screen.getByRole('button', { name: 'Doč. šílenství' });
    expect(statusBtn).not.toBeDisabled();
  });

  it('canEdit=false — vitals input je readonly, status badge disabled', () => {
    mockDiary.mockReturnValue({
      data: makeDiary({ coc_hp_cur: '5' }),
      isLoading: false,
    });
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={false}
      />,
    );
    const hpInput = screen.getByLabelText(
      'Aktuální životy',
    ) as HTMLInputElement;
    expect(hpInput).toHaveAttribute('readonly');
    const statusBtn = screen.getByRole('button', { name: 'Doč. šílenství' });
    expect(statusBtn).toBeDisabled();
  });
});

describe('CocCombatPanel — interakce', () => {
  it('klik na skill se známou hodnotou volá onRoll s kind=d100', () => {
    mockDiary.mockReturnValue({
      data: makeDiary({ coc_sk_spot_hidden_reg: '60' }),
      isLoading: false,
    });
    const onRoll = vi.fn();
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
    );
    const btn = screen.getByRole('button', { name: /Hod Postřeh/i });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Postřeh',
      target: 60,
      kind: 'd100',
    });
  });

  it('klik na vlastnost volá onRoll s kind=d100 a target', () => {
    mockDiary.mockReturnValue({
      data: makeDiary({ coc_str_reg: '55' }),
      isLoading: false,
    });
    const onRoll = vi.fn();
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Hod SIL' }));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'SIL',
      target: 55,
      kind: 'd100',
    });
  });

  it('iniciativa (OBR) volá onRoll s kind=flat, initiative', () => {
    mockDiary.mockReturnValue({
      data: makeDiary({ coc_dex_reg: '65' }),
      isLoading: false,
    });
    const onRoll = vi.fn();
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Iniciativa' }));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Iniciativa',
      modifier: 65,
      kind: 'flat',
      initiative: true,
    });
  });

  it('skill bez hodnoty (—) má disabled button a onRoll se nezavolá', () => {
    mockDiary.mockReturnValue({
      data: makeDiary({}),
      isLoading: false,
    });
    const onRoll = vi.fn();
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
    );
    // První dovednost (Postřeh) — bez hodnoty
    const btn = screen.getByRole('button', { name: /Hod Postřeh/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onRoll).not.toHaveBeenCalled();
  });

  it('edit HP triggeruje debounced mutate (500ms)', () => {
    mockDiary.mockReturnValue({
      data: makeDiary({ coc_hp_cur: '10' }),
      isLoading: false,
    });
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
    );
    const hpInput = screen.getByLabelText(
      'Aktuální životy',
    ) as HTMLInputElement;
    fireEvent.focus(hpInput);
    fireEvent.change(hpInput, { target: { value: '7' } });
    // Před uplynutím debounce — nic
    expect(mockMutate).not.toHaveBeenCalled();
    // Po 500ms — patch
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate.mock.calls[0][0]).toEqual({
      customDataPatch: { coc_hp_cur: '7' },
    });
  });

  it('rapid typing debounce — jen poslední hodnota se uloží', () => {
    mockDiary.mockReturnValue({
      data: makeDiary({ coc_hp_cur: '10' }),
      isLoading: false,
    });
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
    );
    const hpInput = screen.getByLabelText(
      'Aktuální životy',
    ) as HTMLInputElement;
    fireEvent.focus(hpInput);
    fireEvent.change(hpInput, { target: { value: '8' } });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.change(hpInput, { target: { value: '5' } });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate.mock.calls[0][0]).toEqual({
      customDataPatch: { coc_hp_cur: '5' },
    });
  });

  it('toggle status (immediate) zavolá mutate okamžitě', () => {
    mockDiary.mockReturnValue({
      data: makeDiary({ coc_major_wound: 'false' }),
      isLoading: false,
    });
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
    );
    const btn = screen.getByRole('button', { name: 'Těžké zranění' });
    fireEvent.click(btn);
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate.mock.calls[0][0]).toEqual({
      customDataPatch: { coc_major_wound: 'true' },
    });
  });

  it('canEdit=false — edit HP nezavolá mutate', () => {
    mockDiary.mockReturnValue({
      data: makeDiary({ coc_hp_cur: '10' }),
      isLoading: false,
    });
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={false}
      />,
    );
    const hpInput = screen.getByLabelText(
      'Aktuální životy',
    ) as HTMLInputElement;
    fireEvent.change(hpInput, { target: { value: '7' } });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('skill klik bez onRoll nevyhodí error', () => {
    mockDiary.mockReturnValue({
      data: makeDiary({ coc_sk_spot_hidden_reg: '60' }),
      isLoading: false,
    });
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
    );
    const btn = screen.getByRole('button', { name: /Hod Postřeh/i });
    // bez onRoll je button disabled
    expect(btn).toBeDisabled();
  });
});

describe('CocCombatPanel — weapons', () => {
  it('vyrenderuje zbraně z coc_weapons JSON pole', () => {
    mockDiary.mockReturnValue({
      data: makeDiary({
        coc_weapons: JSON.stringify([
          { name: 'Revolver', skill: '40', dmg: '1K10' },
          { name: 'Nůž', skill: '25', dmg: '1K4+BZ' },
        ]),
      }),
      isLoading: false,
    });
    const onRoll = vi.fn();
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
    );
    expect(screen.getByText('Revolver')).toBeInTheDocument();
    expect(screen.getByText('Nůž')).toBeInTheDocument();
    expect(screen.getByText('1K10')).toBeInTheDocument();

    const revolverBtn = screen.getByRole('button', {
      name: /Hod útok Revolver/i,
    });
    fireEvent.click(revolverBtn);
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Revolver',
      target: 40,
      kind: 'd100',
    });
  });

  it('bez coc_weapons — sekce Zbraně se neukáže', () => {
    mockDiary.mockReturnValue({
      data: makeDiary({}),
      isLoading: false,
    });
    render(
      <CocCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
    );
    expect(screen.queryByText('Zbraně')).not.toBeInTheDocument();
  });
});
