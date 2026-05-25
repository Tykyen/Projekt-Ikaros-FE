import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DrdhSheet } from '../DrdhSheet';
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
  characterSlug: 'aragorn',
};

describe('DrdhSheet (8.7e)', () => {
  it('vyrenderuje 5 atributů (Síla, Obratnost, Odolnost, Inteligence, Charisma)', () => {
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    ['Síla', 'Obratnost', 'Odolnost', 'Inteligence', 'Charisma'].forEach(
      (l) => {
        expect(screen.getByText(l)).toBeInTheDocument();
      },
    );
  });

  it('default profession je Válečník + ukáže Válečníkovy triky', () => {
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Válečníkovy triky')).toBeInTheDocument();
  });

  it('změna profession na Hraničář aktualizuje sekundární zdroj na Duševní Sílu a tabulku na Kouzla', () => {
    const { container, rerender } = render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    // Default = válečník → mega-box header říká „Adrenalin" (h4 + sloupec
    // tabulky stejnojmenný; ověřuju přímo přes mega-box.resource h4).
    const resourceBox = container.querySelector('.mega-box.resource');
    expect(resourceBox).not.toBeNull();
    expect(resourceBox!.querySelector('h4')!.textContent).toBe('Adrenalin');

    // Přepnutí na hraničáře
    rerender(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary({ drdh_profession_id: 'hranicar' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    const resBox2 = container.querySelector('.mega-box.resource');
    expect(resBox2!.querySelector('h4')!.textContent).toBe('Duševní Síla');
    expect(screen.getByText('Hraničářova kouzla')).toBeInTheDocument();
  });

  it('alchymista má dva sekundární zdroje (Mana + Suroviny)', () => {
    const { container } = render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary({ drdh_profession_id: 'alchymista' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    // alchymista renderuje 2 mega-boxy resource (Mana + Suroviny)
    expect(container.querySelectorAll('.mega-box.resource')).toHaveLength(2);
    // „Suroviny" se v UI vyskytuje jen v header alchymisty, „Mana" je i
    // ve sloupci tabulky → ověřuju Suroviny + recept název.
    expect(screen.getByText('Suroviny')).toBeInTheDocument();
    expect(screen.getByText('Alchymistovy recepty')).toBeInTheDocument();
  });

  it('view mode disabluje inputy, select a skryje add/del tlačítka', () => {
    render(
      <DrdhSheet {...commonProps} diary={makeDiary()} mode="view" />,
    );
    expect(screen.getByLabelText('Maximum životů')).toBeDisabled();
    // Select povolání disabled
    expect(screen.getByRole('combobox')).toBeDisabled();
    // Add button schovaný
    expect(screen.queryByText('+ Přidat Zbraň')).not.toBeInTheDocument();
    expect(screen.queryByText('+ Přidat Trik')).not.toBeInTheDocument();
  });

  it('+ Přidat Zbraň přidá prázdnou položku do drdh_weapons', () => {
    const onChange = vi.fn();
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat Zbraň'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        drdh_weapons: JSON.stringify([
          { name: '', atk: '', dmg: '', def: '', uc: '', oc: '' },
        ]),
      }),
    });
  });

  it('+ Přidat Trik (válečník) přidá row s name/adr/use/check/note polem', () => {
    const onChange = vi.fn();
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat Trik'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        drdh_w_triky: JSON.stringify([
          { name: '', adr: '', use: '', check: '', note: '' },
        ]),
      }),
    });
  });

  it('coins panel obsahuje 3 mince (Zlaťáky, Stříbrňáky, Měďáky)', () => {
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Zlaťáky')).toBeInTheDocument();
    expect(screen.getByText('Stříbrňáky')).toBeInTheDocument();
    expect(screen.getByText('Měďáky')).toBeInTheDocument();
  });

  it('změna jména volá onChange s drdh_name klíčem', () => {
    const onChange = vi.fn();
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    const nameInput = screen.getByLabelText('Jméno');
    fireEvent.change(nameInput, { target: { value: 'Aragorn' } });
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ drdh_name: 'Aragorn' }),
    });
  });

  it('všech 6 povolání je v select dropdownu', () => {
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    const select = screen.getByLabelText('Povolání');
    const labels = within(select)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(labels).toEqual([
      'Válečník',
      'Hraničář',
      'Alchymista',
      'Kouzelník',
      'Zloděj',
      'Klerik',
    ]);
  });
});
