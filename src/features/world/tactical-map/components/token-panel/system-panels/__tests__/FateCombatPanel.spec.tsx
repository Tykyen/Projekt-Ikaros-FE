/**
 * 10.2c-edit-9h — testy `FateCombatPanel`.
 *
 * Pokrytí: render canEdit=true/false, skill roll trigger, stress toggle,
 * iniciativa roll, loading/empty state, BC s prázdnými customData.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FateCombatPanel } from '../FateCombatPanel';
import type { CharacterDiary } from '@/features/world/pages/api/characters.types';
import type { MapToken } from '../../../../types';

// ──────────────────────────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────────────────────────

let mockDiary: CharacterDiary | undefined;
let mockLoading = false;
const mockMutate = vi.fn();

vi.mock('@/features/world/pages/api/useCharacterSubdocs', () => ({
  useCharacterDiary: () => ({
    data: mockDiary,
    isLoading: mockLoading,
  }),
}));

vi.mock('@/features/world/pages/api/useCharacterMutations', () => ({
  useUpdateCharacterDiary: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// ──────────────────────────────────────────────────────────────────
// Helpery
// ──────────────────────────────────────────────────────────────────

function makeToken(): MapToken {
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
  };
}

function makeDiary(customData: Record<string, unknown> = {}): CharacterDiary {
  return {
    id: 'd1',
    characterId: 'c1',
    worldId: 'w1',
    sections: [],
    customData,
  };
}

function renderPanel(
  overrides: Partial<{
    canEdit: boolean;
    onRoll: (req: {
      label: string;
      modifier: number;
      kind: 'fate' | 'd20' | 'd6' | 'd10';
    }) => void;
  }> = {},
) {
  return render(
    <FateCombatPanel
      token={makeToken()}
      sceneId="s1"
      worldId="w1"
      canEdit={overrides.canEdit ?? true}
      onRoll={overrides.onRoll}
    />,
  );
}

// ──────────────────────────────────────────────────────────────────
// Testy
// ──────────────────────────────────────────────────────────────────

describe('FateCombatPanel (10.2c-edit-9h)', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockLoading = false;
    mockDiary = makeDiary({
      fate_aspects: JSON.stringify([{ name: 'Hrdina z lepší rodiny' }]),
      fate_skills: JSON.stringify([
        { name: 'Boj', val: '3', note: '' },
        { name: 'Stealth', val: '2', note: 'mečem' },
      ]),
      fate_conflict: '1',
    });
  });

  it('loading state', () => {
    mockLoading = true;
    mockDiary = undefined;
    renderPanel();
    expect(screen.getByText(/načítám statblok/i)).toBeInTheDocument();
  });

  it('empty state když diary chybí', () => {
    mockDiary = undefined;
    mockLoading = false;
    renderPanel();
    expect(screen.getByText(/bez deníku/i)).toBeInTheDocument();
  });

  it('canEdit=true: vykreslí aspekty, dovednosti, stres', () => {
    renderPanel({ canEdit: true });
    expect(screen.getByText('Aspekty')).toBeInTheDocument();
    expect(screen.getByText('Dovednosti')).toBeInTheDocument();
    expect(screen.getByText('Staty')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hrdina z lepší rodiny')).toBeInTheDocument();
    expect(screen.getByText('Boj')).toBeInTheDocument();
    expect(screen.getByText('+ Nový aspekt')).toBeInTheDocument();
  });

  it('canEdit=false: skryje editovací tlačítka a disabluje inputy', () => {
    renderPanel({ canEdit: false });
    expect(screen.queryByText('+ Nový aspekt')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Hrdina z lepší rodiny')).toBeDisabled();
    // Stres tlačítka jsou disabled
    expect(screen.getByLabelText('Stav: V pořádku')).toBeDisabled();
  });

  it('klik na skill roll triggers onRoll s kind="fate" a skill modifier', () => {
    const onRoll = vi.fn();
    renderPanel({ canEdit: true, onRoll });
    const btn = screen.getByLabelText('Hodit Boj');
    fireEvent.click(btn);
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Boj',
      modifier: 3,
      kind: 'fate',
    });
  });

  it('klik na INICIATIVA triggers onRoll s label="Iniciativa", modifier=0', () => {
    const onRoll = vi.fn();
    renderPanel({ canEdit: true, onRoll });
    fireEvent.click(screen.getByTitle(/hodit iniciativu/i));
    expect(onRoll).toHaveBeenCalledWith({
      label: 'Iniciativa',
      modifier: 0,
      kind: 'fate',
    });
  });

  it('klik na stres stav nastaví fate_conflict (po debounce)', async () => {
    vi.useFakeTimers();
    try {
      renderPanel({ canEdit: true });
      fireEvent.click(screen.getByLabelText('Stav: Těžší zranění'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      expect(mockMutate).toHaveBeenCalled();
      const args = mockMutate.mock.calls[0]?.[0] as {
        customDataPatch: Record<string, string>;
      };
      expect(args.customDataPatch.fate_conflict).toBe('2');
    } finally {
      vi.useRealTimers();
    }
  });

  it('klik na skill pip toggle vyvolá mutate s aktualizovaným val', async () => {
    vi.useFakeTimers();
    try {
      renderPanel({ canEdit: true });
      // Boj má val=3, klik na pip 5 → val=5
      fireEvent.click(screen.getByLabelText('Boj pip 5 z 6'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      expect(mockMutate).toHaveBeenCalled();
      const args = mockMutate.mock.calls[0]?.[0] as {
        customDataPatch: Record<string, string>;
      };
      const skillsPatched = JSON.parse(args.customDataPatch.fate_skills) as {
        name: string;
        val: string;
        note: string;
      }[];
      expect(skillsPatched[0]).toEqual({ name: 'Boj', val: '5', note: '' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('+ Nový aspekt přidá prázdný aspekt do pole', async () => {
    vi.useFakeTimers();
    try {
      renderPanel({ canEdit: true });
      fireEvent.click(screen.getByText('+ Nový aspekt'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      expect(mockMutate).toHaveBeenCalled();
      const args = mockMutate.mock.calls[0]?.[0] as {
        customDataPatch: Record<string, string>;
      };
      const aspectsPatched = JSON.parse(
        args.customDataPatch.fate_aspects,
      ) as { name: string }[];
      expect(aspectsPatched).toHaveLength(2);
      expect(aspectsPatched[1]).toEqual({ name: '' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('canEdit=false: klik na stres neuložil nic', async () => {
    vi.useFakeTimers();
    try {
      renderPanel({ canEdit: false });
      fireEvent.click(screen.getByLabelText('Stav: Vyřazen'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      expect(mockMutate).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('prázdný customData → 0 aspektů, 0 dovedností, stres=0', () => {
    mockDiary = makeDiary();
    renderPanel({ canEdit: true });
    expect(screen.getByText(/žádné dovednosti/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Stav: V pořádku')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
