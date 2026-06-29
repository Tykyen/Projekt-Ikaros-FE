import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock data hooks (vi.hoisted → dostupné v hoisted vi.mock factory).
const h = vi.hoisted(() => ({
  diary: null as unknown,
  mutate: vi.fn(),
}));
vi.mock('@/features/world/pages/api/useCharacterSubdocs', () => ({
  useCharacterDiary: () => ({ data: h.diary, isLoading: false }),
}));
vi.mock('@/features/world/pages/api/useCharacterMutations', () => ({
  useUpdateCharacterDiary: () => ({ mutate: h.mutate }),
}));

import { DndCombatPanel } from '../DndCombatPanel';

const token = {
  id: 't1',
  characterSlug: 'aragorn',
  isNpc: false,
} as never;

function setDiary(customData: Record<string, unknown> = {}): void {
  h.diary = {
    id: 'd1',
    characterId: 'c1',
    worldId: 'w1',
    sections: [],
    customData,
  };
}

const common = { sceneId: 's1', worldId: 'w1', canEdit: true } as const;

describe('DndCombatPanel (8.7q fáze A)', () => {
  beforeEach(() => {
    h.mutate.mockClear();
  });

  it('klik na vlastnost hodí k20 + modifikátor (Síla 16 → +3)', () => {
    setDiary({
      dnd_abi_str: '16',
      dnd_classes: JSON.stringify([{ c: 'Bojovník', l: '3', s: '' }]),
    });
    const onRoll = vi.fn();
    render(<DndCombatPanel token={token} {...common} onRoll={onRoll} />);

    fireEvent.click(screen.getByText('SÍL').closest('button')!);
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Síla',
        modifier: 3,
        kind: 'd20',
        critOnD20: true,
      }),
    );
  });

  it('ZH u vlastnosti hodí k20 + záchranný bonus (zdatný CON 14, pb 2 → +4)', () => {
    setDiary({ dnd_abi_con: '14', dnd_save_con: '1', dnd_profBonus: '2' });
    const onRoll = vi.fn();
    render(<DndCombatPanel token={token} {...common} onRoll={onRoll} />);

    fireEvent.click(screen.getByTitle(/Záchranný hod Odolnost/));
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'ZH Odolnost', modifier: 4, kind: 'd20' }),
    );
  });

  it('iniciativa volá onRoll s initiative:true', () => {
    setDiary({ dnd_abi_dex: '14' });
    const onRoll = vi.fn();
    render(<DndCombatPanel token={token} {...common} onRoll={onRoll} />);

    fireEvent.click(screen.getByTitle(/^Iniciativa/));
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ initiative: true, kind: 'd20', modifier: 2 }),
    );
  });

  it('ukáže jen aktivní dovednosti (se zdatností)', () => {
    setDiary({ dnd_skill_Akrobacie: '1' });
    render(<DndCombatPanel token={token} {...common} onRoll={vi.fn()} />);

    expect(screen.getByText('Akrobacie')).toBeInTheDocument();
    expect(screen.queryByText('Atletika')).not.toBeInTheDocument();
  });

  it('bez onRoll / view mode nejsou hody aktivní (disabled)', () => {
    setDiary({ dnd_abi_str: '16' });
    render(
      <DndCombatPanel token={token} {...common} canEdit={false} onRoll={vi.fn()} />,
    );
    expect(screen.getByText('SÍL').closest('button')).toBeDisabled();
  });

  it('8.7q: klik na zásah zbraně hodí skládaný mixed dle formule', () => {
    setDiary({
      dnd_weapons: JSON.stringify([
        { n: 'Luk', b: '+5', d: '2k10+2k6+2k4+5', t: '', r: '', o: '' },
      ]),
    });
    const onRoll = vi.fn();
    render(<DndCombatPanel token={token} {...common} onRoll={onRoll} />);

    fireEvent.click(screen.getByTitle('Hodit zranění 2k10+2k6+2k4+5'));
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'mixed',
        mixed: { d10: 2, d6: 2, d4: 2 },
        modifier: 5,
      }),
    );
  });
});
