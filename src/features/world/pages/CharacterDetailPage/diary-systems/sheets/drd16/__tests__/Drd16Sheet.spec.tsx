import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drd16Sheet } from '../Drd16Sheet';
import { getDrdBonus } from '../constants';
import type { CharacterDiary } from '../../../../../api/characters.types';

function makeDiary(
  customData: Record<string, unknown> = {},
): CharacterDiary {
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
    expect(getDrdBonus(9)).toBe(-1); // floor(-1/2) = -1
    expect(getDrdBonus(5)).toBe(-3); // floor(-5/2) = -3
  });
  it('val 10-12 → 0', () => {
    expect(getDrdBonus(10)).toBe(0);
    expect(getDrdBonus(11)).toBe(0);
    expect(getDrdBonus(12)).toBe(0);
  });
  it('val >= 13 → floor((val-11)/2)', () => {
    expect(getDrdBonus(13)).toBe(1);
    expect(getDrdBonus(14)).toBe(1);
    expect(getDrdBonus(15)).toBe(2);
    expect(getDrdBonus(20)).toBe(4);
  });
});

describe('Drd16Sheet (8.7l)', () => {
  it('vyrenderuje quick PJ bar s HP/Mana/Obrana', () => {
    const { container } = render(
      <Drd16Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    // Quick PJ bar má 3 labely (HP / Mana / Obrana) — scope na .drd16-quick-pj-bar
    // ("Mana" je i v resource tracker title pravého panelu).
    const pjBar = container.querySelector('.drd16-quick-pj-bar')!;
    expect(pjBar).not.toBeNull();
    const labels = Array.from(pjBar.querySelectorAll('.qs-label')).map(
      (e) => e.textContent,
    );
    expect(labels).toEqual(['HP', 'Mana', 'Obrana']);
  });

  it('vyrenderuje 7 primárních vlastností', () => {
    render(
      <Drd16Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    [
      'Síla',
      'Obratnost',
      'Odolnost',
      'Inteligence',
      'Charisma',
      'Velikost',
      'Pohyb',
    ].forEach((l) => {
      expect(screen.getByText(l)).toBeInTheDocument();
    });
  });

  it('Povolání select má 15 voleb', () => {
    render(
      <Drd16Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    const select = screen.getByLabelText('Povolání');
    const opts = Array.from(select.querySelectorAll('option'));
    // První option je "— Povolání —", pak 15 povolání
    expect(opts.length).toBe(16);
    expect(opts.some((o) => o.textContent === 'Bojovník')).toBe(true);
    expect(opts.some((o) => o.textContent === 'Theurg')).toBe(true);
  });

  it('+ Přidat zbraň na blízko vyvolá onChange s meleeWeapons', () => {
    const onChange = vi.fn();
    render(
      <Drd16Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
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

  it('HP tracker -1 tlačítko sníží hp_current', () => {
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

  it('view mode disabluje vše', () => {
    render(
      <Drd16Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="view"
      />,
    );
    expect(screen.getByLabelText('Jméno postavy')).toBeDisabled();
    expect(
      screen.queryByText('+ Přidat zbraň na blízko'),
    ).not.toBeInTheDocument();
  });
});
