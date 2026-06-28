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

describe('Drd2Sheet (16.2e — sloučený list)', () => {
  it('vyrenderuje 3 zdroje (Tělo, Duše, Vliv)', () => {
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

  it('vyrenderuje stupnice Ohrožení (threat) + Výhoda (adv)', () => {
    const { container } = render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(container.querySelector('.drd2-gauge.threat')).not.toBeNull();
    expect(container.querySelector('.drd2-gauge.adv')).not.toBeNull();
  });

  it('zobrazí všechny sekce povolání + ZS rovnou (bez tabů)', () => {
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Základní povolání')).toBeInTheDocument();
    expect(screen.getByText('Pokročilá povolání')).toBeInTheDocument();
    expect(screen.getByText('Mistrovská povolání')).toBeInTheDocument();
    expect(screen.getByText('Zvláštní schopnosti (ZS)')).toBeInTheDocument();
  });

  it('využitá úroveň = součet levelů ze všech kategorií povolání', () => {
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
    expect(screen.getByLabelText('Využitá úroveň')).toHaveTextContent('5');
  });

  it('segmentová stupnice Tělo nastaví aktuální hodnotu (klik na 4. segment)', () => {
    const onChange = vi.fn();
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Tělo 4'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: { drd2_body: '4' },
    });
  });

  it('stupnice Ohrožení nastaví hodnotu (klik na stupínek 3)', () => {
    const onChange = vi.fn();
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Ohrožení 3'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: { drd2_threat: '3' },
    });
  });

  it('view mode disabluje segmenty i hranici', () => {
    render(<Drd2Sheet {...commonProps} diary={makeDiary()} mode="view" />);
    expect(screen.getByLabelText('Tělo 1')).toBeDisabled();
    expect(screen.getByLabelText('Tělo hranice')).toBeDisabled();
  });

  it('+ přidat zbraň vytvoří prázdnou položku v drd2_weapons', () => {
    const onChange = vi.fn();
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ přidat zbraň / zbroj'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: {
        drd2_weapons: JSON.stringify([{ name: '', char: '', note: '' }]),
      },
    });
  });

  it('+ přidat pomocníka vytvoří prázdného companiona', () => {
    const onChange = vi.fn();
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ přidat pomocníka'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: {
        drd2_companions: JSON.stringify([
          { char: '', ability: '', bound: '', pay: '', bond: 0 },
        ]),
      },
    });
  });

  it('+ přidat rituální předmět vytvoří prázdný rituál', () => {
    const onChange = vi.fn();
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ přidat rituální předmět'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: {
        drd2_rituals: JSON.stringify([{ name: '', charge: 0 }]),
      },
    });
  });

  it('select základních povolání obsahuje 5 povolání', () => {
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    const select = screen.getByLabelText('Přidat povolání basic_professions');
    const labels = Array.from(select.querySelectorAll('option')).map(
      (o) => o.textContent,
    );
    // 1 placeholder + 5 základních
    expect(labels.length).toBe(6);
    expect(labels).toContain('Bojovník');
    expect(labels).toContain('Lovec');
    expect(labels).toContain('Zaříkávač');
  });

  it('přidání povolání přes select + tlačítko vyvolá onChange', () => {
    const onChange = vi.fn();
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    const select = screen.getByLabelText('Přidat povolání basic_professions');
    fireEvent.change(select, { target: { value: 'bojovnik' } });
    fireEvent.click(screen.getAllByText('+ přidat')[0]);
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        drd2_basic_professions: expect.anything(),
      }),
    });
  });

  it('ZS se zadávají ručně — žádný katalogový dropdown „z katalogu"', () => {
    render(
      <Drd2Sheet
        {...commonProps}
        diary={makeDiary({
          drd2_special_abilities: JSON.stringify([
            { name: 'Pádný úder', source: 'Bojovník', type: 'aktivní', description: '' },
          ]),
        })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.queryByText(/z katalogu/i)).toBeNull();
    expect(screen.getByText('+ přidat ZS')).toBeInTheDocument();
  });
});
