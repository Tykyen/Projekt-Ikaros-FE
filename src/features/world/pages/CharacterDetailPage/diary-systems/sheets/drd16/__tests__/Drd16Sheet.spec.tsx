import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drd16Sheet } from '../Drd16Sheet';
import { getDrdBonus, DRD16_EMPTY_SPELL } from '../constants';
import type { CharacterDiary } from '../../../../../api/characters.types';
import { useCharacter } from '@/features/world/pages/api/useCharacter';

// useCharacter řídí NPC (soft-cap 21 jen pro PC). Mockujeme ho.
vi.mock('@/features/world/pages/api/useCharacter');
const mockedUseCharacter = vi.mocked(useCharacter);

function setNpc(isNpc: boolean) {
  mockedUseCharacter.mockReturnValue({
    data: { isNpc },
  } as unknown as ReturnType<typeof useCharacter>);
}

beforeEach(() => setNpc(false));

function makeDiary(customData: Record<string, unknown> = {}): CharacterDiary {
  return {
    id: 'd1',
    characterId: 'c1',
    worldId: 'w1',
    sections: [],
    customData,
  };
}

const commonProps = {
  worldId: 'w1',
  worldSlug: 'testw',
  characterSlug: 'hero1',
};

describe('Drd16 — DrdBonus formule', () => {
  it('val <= 0 → -5', () => {
    expect(getDrdBonus(0)).toBe(-5);
    expect(getDrdBonus(-3)).toBe(-5);
  });
  it('val 1-9 → floor((val-10)/2)', () => {
    expect(getDrdBonus(9)).toBe(-1);
    expect(getDrdBonus(5)).toBe(-3);
  });
  it('val 10-12 → 0', () => {
    expect(getDrdBonus(10)).toBe(0);
    expect(getDrdBonus(12)).toBe(0);
  });
  it('val >= 13 → krok po 2 (potvrzená tabulka)', () => {
    expect(getDrdBonus(13)).toBe(1);
    expect(getDrdBonus(14)).toBe(1);
    expect(getDrdBonus(15)).toBe(2);
    expect(getDrdBonus(20)).toBe(4);
    expect(getDrdBonus(22)).toBe(5); // extrapolace NPC > 21
  });
});

describe('Drd16Sheet (16.2b)', () => {
  it('HUD má 3 buňky (Životy / Magy / Obranné číslo)', () => {
    const { container } = render(
      <Drd16Sheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />,
    );
    const hud = container.querySelector('.drd16-hud')!;
    expect(hud).not.toBeNull();
    const labels = Array.from(hud.querySelectorAll('.drd16-hud-lab')).map(
      (e) => e.textContent,
    );
    expect(labels).toEqual(['Životy', 'Magy', 'Obranné číslo']);
  });

  it('vyrenderuje 5 háznových vlastností + Velikost (ne Pohyb jako stat)', () => {
    render(
      <Drd16Sheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />,
    );
    ['Síla', 'Obratnost', 'Odolnost', 'Inteligence', 'Charisma', 'Velikost'].forEach(
      (l) => expect(screen.getByText(l)).toBeInTheDocument(),
    );
    // „Pohyb" jako řádek vlastnosti zmizel; je z něj panel „Pohyblivost".
    expect(screen.getByText('Pohyblivost')).toBeInTheDocument();
    expect(screen.queryByText('Pohyb')).not.toBeInTheDocument();
  });

  it('Povolání select má 5 rodin', () => {
    render(
      <Drd16Sheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />,
    );
    const select = screen.getByLabelText('Povolání');
    const opts = Array.from(select.querySelectorAll('option'));
    expect(opts.length).toBe(6); // placeholder + 5
    expect(opts.some((o) => o.textContent === 'Válečník')).toBe(true);
    expect(opts.some((o) => o.textContent === 'Kouzelník')).toBe(true);
  });

  it('auto-bonus: Síla 16 → +2', () => {
    render(
      <Drd16Sheet
        {...commonProps}
        diary={makeDiary({ str_val: '16' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    const row = screen.getByLabelText('Síla hodnota').closest('.drd16-stat-row')!;
    expect(row.querySelector('.drd16-bonus')!.textContent).toBe('+2');
  });

  it('PC soft-cap 21: hodnota > 21 ukáže varování, NPC ne', () => {
    const { rerender } = render(
      <Drd16Sheet
        {...commonProps}
        diary={makeDiary({ str_val: '25' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(/nepřekročí 21/)).toBeInTheDocument();

    setNpc(true);
    rerender(
      <Drd16Sheet
        {...commonProps}
        diary={makeDiary({ str_val: '25' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.queryByText(/nepřekročí 21/)).not.toBeInTheDocument();
  });

  it('specializace je zamčená pod 6. úrovní a odemčená od 6.', () => {
    const { rerender } = render(
      <Drd16Sheet
        {...commonProps}
        diary={makeDiary({ class: 'Kouzelník', level: '3' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Specializace')).toBeDisabled();
    expect(screen.getByText('🔒 odemkne se na 6. úrovni')).toBeInTheDocument();

    rerender(
      <Drd16Sheet
        {...commonProps}
        diary={makeDiary({ class: 'Kouzelník', level: '6' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    const spec = screen.getByLabelText('Specializace');
    expect(spec).not.toBeDisabled();
    const opts = Array.from(spec.querySelectorAll('option')).map((o) => o.textContent);
    expect(opts).toEqual(['—', 'Čaroděj', 'Mág']);
  });

  it('+ Přidat zbroj / štít vyvolá onChange s armor', () => {
    const onChange = vi.fn();
    render(
      <Drd16Sheet {...commonProps} diary={makeDiary()} mode="edit" onChange={onChange} />,
    );
    fireEvent.click(screen.getByText('+ Přidat zbroj / štít'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        armor: JSON.stringify([{ name: '', oc: '', note: '' }]),
      }),
    });
  });

  it('+ Přidat zbraň na blízko vyvolá onChange s meleeWeapons', () => {
    const onChange = vi.fn();
    render(
      <Drd16Sheet {...commonProps} diary={makeDiary()} mode="edit" onChange={onChange} />,
    );
    fireEvent.click(screen.getByText('+ Přidat zbraň na blízko'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        meleeWeapons: JSON.stringify([
          { weapon: '', where: '', uc: '', utoc: '', oz: '' },
        ]),
      }),
    });
  });

  it('+ Přidat kouzlo vyvolá onChange se strukturovaným spells', () => {
    const onChange = vi.fn();
    render(
      <Drd16Sheet {...commonProps} diary={makeDiary()} mode="edit" onChange={onChange} />,
    );
    fireEvent.click(screen.getByText('+ Přidat kouzlo'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        spells: JSON.stringify([DRD16_EMPTY_SPELL]),
      }),
    });
  });

  it('editace názvu kouzla zapíše delta do spells (persistence)', () => {
    const onChange = vi.fn();
    render(
      <Drd16Sheet
        {...commonProps}
        diary={makeDiary({
          spells: JSON.stringify([{ ...DRD16_EMPTY_SPELL, name: 'Blesk' }]),
        })}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByDisplayValue('Blesk'), {
      target: { value: 'Ohnivá koule' },
    });
    const last = onChange.mock.calls.at(-1)![0] as {
      customDataPatch: { spells: string };
    };
    const spells = JSON.parse(last.customDataPatch.spells);
    expect(spells[0].name).toBe('Ohnivá koule');
  });

  it('žebřík -1 sníží hp_current', () => {
    const onChange = vi.fn();
    render(
      <Drd16Sheet
        {...commonProps}
        diary={makeDiary({ hp_current: '10', hp_max: '20' })}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Životy -1'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ hp_current: '9' }),
    });
  });

  it('žebřík > 50 přečísluje popisky podle poměru (340 ŽT)', () => {
    const { container } = render(
      <Drd16Sheet
        {...commonProps}
        diary={makeDiary({ hp_current: '285', hp_max: '340' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    const rungs = container.querySelector('.drd16-ladder.life .drd16-rungs')!;
    // vrcholová příčka nese maximum (poměrové přečíslování)
    expect(rungs.textContent).toContain('340');
  });

  it('view mode disabluje vstupy a schová „+ Přidat"', () => {
    render(<Drd16Sheet {...commonProps} diary={makeDiary()} mode="view" />);
    expect(screen.getByLabelText('Jméno postavy')).toBeDisabled();
    expect(screen.queryByText('+ Přidat zbraň na blízko')).not.toBeInTheDocument();
  });
});
