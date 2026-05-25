import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drd2Sheet } from '../Drd2Sheet';
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

describe('Drd2Sheet (8.7h)', () => {
  it('vyrenderuje 3 pilíře (Tělo, Duše, Vliv) v tabu Stav', () => {
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Tělo')).toBeInTheDocument();
    expect(screen.getByText('Duše')).toBeInTheDocument();
    expect(screen.getByText('Vliv')).toBeInTheDocument();
  });

  it('vyrenderuje mega-boxy Ohrožení (danger) + Výhoda (advantage)', () => {
    const { container } = render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(container.querySelector('.mega-box.danger')).not.toBeNull();
    expect(container.querySelector('.mega-box.advantage')).not.toBeNull();
  });

  it('přepnutí na Schopnosti tab ukáže 3 sekce povolání + 2 ZS sekce', () => {
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('2. Profese a Schopnosti'));
    expect(screen.getByText('Základní povolání')).toBeInTheDocument();
    expect(screen.getByText('Pokročilá povolání')).toBeInTheDocument();
    expect(screen.getByText('Mistrovská povolání')).toBeInTheDocument();
    expect(screen.getByText('Zvláštní Schopnosti (ZS)')).toBeInTheDocument();
    expect(screen.getByText('Mistrovské ZS')).toBeInTheDocument();
  });

  it('used level badge počítá součet levelů ze všech profession kategorií', () => {
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary({
          drd2_basic_professions: JSON.stringify([
            { id: 'bojovnik', name: 'Bojovník', level: 3 },
          ]),
          drd2_advanced_professions: JSON.stringify([
            { id: 'valecnik', name: 'Válečník', level: 2 },
          ]),
        })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByLabelText('Využitá úroveň'),
    ).toHaveTextContent('5');
  });

  it('view mode disabluje inputy', () => {
    render(
      <Drd2Sheet {...commonProps} diary={makeDiary()} mode="view" />,
    );
    expect(screen.getByLabelText('Tělo aktuální')).toBeDisabled();
    expect(screen.getByLabelText('Ohrožení')).toBeDisabled();
  });

  it('+ Přidat zbraň vytvoří prázdnou položku v drd2_weapons', () => {
    const onChange = vi.fn();
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat zbraň / zbroj'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        drd2_weapons: JSON.stringify([
          { name: '', char: '', note: '' },
        ]),
      }),
    });
  });

  it('profession select dropdown obsahuje 5 základních povolání', () => {
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('2. Profese a Schopnosti'));
    const select = screen.getByLabelText(
      'Přidat povolání basic_professions',
    );
    const labels = Array.from(select.querySelectorAll('option')).map(
      (o) => o.textContent,
    );
    // První option je "— Vyber povolání —", pak 5 základních
    expect(labels.length).toBe(6);
    expect(labels).toContain('Bojovník');
    expect(labels).toContain('Lovec');
    expect(labels).toContain('Zaříkávač');
  });

  it('přidání povolání skrz select + tlačítko vyvolá onChange', () => {
    const onChange = vi.fn();
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('2. Profese a Schopnosti'));
    const select = screen.getByLabelText(
      'Přidat povolání basic_professions',
    );
    fireEvent.change(select, { target: { value: 'bojovnik' } });
    // Klik na první „+ Přidat" v tabu Schopnosti (jeden je near select)
    const addBtns = screen.getAllByText('+ Přidat');
    fireEvent.click(addBtns[0]);
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        drd2_basic_professions: expect.anything(),
      }),
    });
  });
});
