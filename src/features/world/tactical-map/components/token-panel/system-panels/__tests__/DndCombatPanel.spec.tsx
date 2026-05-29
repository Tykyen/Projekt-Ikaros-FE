/**
 * 10.2c-edit-9h — testy pro D&D 5e kompaktní bojový panel.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DndCombatPanel } from '../DndCombatPanel';
import type { MapToken } from '../../../../types';

// ── Mocks ──────────────────────────────────────────────────────────────
const mockDiaryHook = vi.fn();
const mockMutate = vi.fn();

vi.mock('@/features/world/pages/api/useCharacterSubdocs', () => ({
  useCharacterDiary: (worldId: string, slug: string) =>
    mockDiaryHook(worldId, slug),
}));

vi.mock('@/features/world/pages/api/useCharacterMutations', () => ({
  useUpdateCharacterDiary: () => ({ mutate: mockMutate }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Helpers ────────────────────────────────────────────────────────────
function makeToken(overrides: Partial<MapToken> = {}): MapToken {
  return {
    id: 't1',
    characterId: 'c1',
    characterSlug: 'aragorn',
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
    movement: 6,
    abilities: [],
    customData: {},
    ...overrides,
  };
}

function makeDiary(customData: Record<string, string> = {}) {
  return {
    data: {
      id: 'd1',
      characterId: 'c1',
      worldId: 'w1',
      sections: [],
      customData: {
        dnd_currentHP: '12',
        dnd_maxHP: '20',
        dnd_tempHP: '3',
        dnd_ac: '15',
        dnd_speed: '9 m',
        dnd_ability_str: '14',
        dnd_ability_dex: '16',
        dnd_ability_con: '12',
        dnd_ability_int: '10',
        dnd_ability_wis: '13',
        dnd_ability_cha: '8',
        dnd_save_prof_dex: '1',
        dnd_profBonus: '2',
        dnd_skill_prof_Atletika: '1',
        dnd_attacks: JSON.stringify([
          { name: 'Dlouhý meč', bonus: '+5', damage: '1d8+3' },
        ]),
        ...customData,
      },
    },
    isLoading: false,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  mockDiaryHook.mockReset();
  mockMutate.mockReset();
  mockDiaryHook.mockReturnValue(makeDiary());
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Tests ──────────────────────────────────────────────────────────────
describe('DndCombatPanel', () => {
  it('canEdit=true → render init button + interaktivní save/skill buttony', () => {
    const onRoll = vi.fn();
    render(
      <DndCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
    );
    // DEX 16 → mod +3 (button label obsahuje ⚡)
    expect(screen.getByText(/⚡ Iniciativa \+3/i)).toBeInTheDocument();
    // HP input editovatelný
    const hpInput = screen.getByLabelText('Aktuální životy') as HTMLInputElement;
    expect(hpInput).not.toHaveAttribute('readonly');
    expect(hpInput.value).toBe('12');
    // Save card pro DEX = +3 + prof 2 = +5
    expect(screen.getByLabelText(/Záchrana Obratnost \+5/)).toBeInTheDocument();
  });

  it('canEdit=false → readonly view, žádné roll buttony aktivní', () => {
    render(
      <DndCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit={false}
        onRoll={vi.fn()}
      />,
    );
    // Init button se vůbec nerendruje (gated `canEdit && onRoll`)
    expect(screen.queryByText(/⚡ Iniciativa/i)).not.toBeInTheDocument();
    // HP input je readonly
    const hpInput = screen.getByLabelText('Aktuální životy') as HTMLInputElement;
    expect(hpInput).toHaveAttribute('readonly');
    // Death saves sekce skryta
    expect(
      screen.queryByText(/Záchrany proti smrti/i),
    ).not.toBeInTheDocument();
    // Save card disabled
    const saveBtn = screen.getByLabelText(/Záchrana Obratnost/);
    expect(saveBtn).toBeDisabled();
  });

  it('klik na save throw → onRoll volaný s d20 + správným modifikátorem', () => {
    const onRoll = vi.fn();
    render(
      <DndCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
    );
    // DEX save je proficient → mod = +3 (dex) + 2 (prof) = +5
    fireEvent.click(screen.getByLabelText(/Záchrana Obratnost \+5/));
    expect(onRoll).toHaveBeenCalledTimes(1);
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Záchrana Obratnost',
      modifier: 5,
      kind: 'd20',
    });
  });

  it('klik na INICIATIVA tlačítko triggers onRoll s DEX modifikátorem', () => {
    const onRoll = vi.fn();
    render(
      <DndCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
    );
    fireEvent.click(screen.getByText(/⚡ Iniciativa \+3/));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Iniciativa',
      modifier: 3,
      kind: 'd20',
    });
  });

  it('HP edit (blur) → immediate mutate s customDataPatch', () => {
    render(
      <DndCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={vi.fn()}
      />,
    );
    const hpInput = screen.getByLabelText('Aktuální životy') as HTMLInputElement;
    fireEvent.focus(hpInput);
    fireEvent.change(hpInput, { target: { value: '7' } });
    fireEvent.blur(hpInput);

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const arg = mockMutate.mock.calls[0]?.[0] as {
      customDataPatch?: Record<string, unknown>;
    };
    expect(arg.customDataPatch).toEqual({ dnd_currentHP: '7' });
  });

  it('klik na skill row → onRoll s d20', () => {
    const onRoll = vi.fn();
    render(
      <DndCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
    );
    // Atletika (STR=14 → +2) prof=1 → +2 + 2 = +4
    fireEvent.click(screen.getByText('Atletika'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Atletika',
      modifier: 4,
      kind: 'd20',
    });
  });

  it('klik na attack row → onRoll s parsed bonusem', () => {
    const onRoll = vi.fn();
    render(
      <DndCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={onRoll}
      />,
    );
    fireEvent.click(screen.getByText('Dlouhý meč'));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Útok: Dlouhý meč',
      modifier: 5,
      kind: 'd20',
    });
  });

  it('isLoading=true → loading placeholder', () => {
    mockDiaryHook.mockReturnValue({ data: undefined, isLoading: true });
    render(
      <DndCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
      />,
    );
    expect(screen.getByText(/Načítání deníku/)).toBeInTheDocument();
  });

  it('debounce timer se vyčistí při unmount (žádný mutate po unmount)', () => {
    const { unmount } = render(
      <DndCombatPanel
        token={makeToken()}
        sceneId="s1"
        worldId="w1"
        canEdit
        onRoll={vi.fn()}
      />,
    );
    unmount();
    // Posuneme timery; pokud by existoval pending callback, něco se rozbije.
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
