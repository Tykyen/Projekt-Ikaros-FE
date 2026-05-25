import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { JadSheet } from '../JadSheet';
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

describe('JadSheet (8.7b)', () => {
  it('vyrenderuje 6 atributů (SÍL/OBR/ODO/INT/MOU/CHA) a všech 18 dovedností', () => {
    render(
      <JadSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );

    // 6 atributů (zkráceno na 3 písmena upper)
    ['SÍL', 'OBR', 'ODO', 'INT', 'MOU', 'CHA'].forEach((abbr) => {
      expect(screen.getByText(abbr)).toBeInTheDocument();
    });

    // První a poslední dovednost ze seznamu
    expect(screen.getByText('Akrobacie')).toBeInTheDocument();
    expect(screen.getByText('Zastrašování')).toBeInTheDocument();
  });

  it('view mode disabluje inputy i tlačítka', () => {
    render(
      <JadSheet {...commonProps} diary={makeDiary()} mode="view" />,
    );
    expect(screen.getByLabelText('Jméno postavy')).toBeDisabled();
    // Tlačítka pro cycle dovednosti / save proficience musí být disabled
    expect(
      screen.getByLabelText('Přepnout inspiraci'),
    ).toBeDisabled();
  });

  it('edit mode volá onChange při změně Síly', () => {
    const onChange = vi.fn();
    render(
      <JadSheet
        {...commonProps}
        diary={makeDiary({ jad_abi_str: '10' })}
        mode="edit"
        onChange={onChange}
      />,
    );

    // Najdi všechny number inputy — první šestice jsou atributy v pořadí ABIL_MAP.
    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs.length).toBeGreaterThanOrEqual(6);
    fireEvent.change(numberInputs[0], { target: { value: '15' } });

    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ jad_abi_str: '15' }),
    });
  });

  it('vypočítá modifier správně (Síla 14 → +2 v boxu vlevo od inputu)', () => {
    render(
      <JadSheet
        {...commonProps}
        diary={makeDiary({ jad_abi_str: '14' })}
        mode="view"
      />,
    );
    // První `.jad-stat-box` je SÍL — najdi v něm mod span s "+2"
    const silLabel = screen.getByText('SÍL');
    const statBox = silLabel.parentElement!;
    expect(within(statBox).getByText('+2')).toBeInTheDocument();
  });

  it('vypočítá pasivní vnímání (10 + Vnímání mod) — wis 14 → 12', () => {
    render(
      <JadSheet
        {...commonProps}
        diary={makeDiary({ jad_abi_wis: '14' })}
        mode="view"
      />,
    );
    const label = screen.getByText('Pasivní Vnímání');
    const row = label.parentElement!;
    expect(within(row).getByText('12')).toBeInTheDocument();
  });

  it('spell tab tlačítko se zobrazí jen pokud `jad_spellEnabled === "1"`', () => {
    const { rerender } = render(
      <JadSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(
      screen.queryByText('Kouzla / Truhla'),
    ).not.toBeInTheDocument();

    rerender(
      <JadSheet
        {...commonProps}
        diary={makeDiary({ jad_spellEnabled: '1' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Kouzla / Truhla')).toBeInTheDocument();
  });

  it('kliknutí na cycle tlačítko dovednosti zvýší prof level (0 → 1)', () => {
    const onChange = vi.fn();
    render(
      <JadSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );

    // Najdi Akrobacie a jeho prof button (v same row)
    const akr = screen.getByText('Akrobacie');
    const row = akr.parentElement!;
    const profBtn = within(row).getByRole('button');
    fireEvent.click(profBtn);

    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ jad_skill_Akrobacie: '1' }),
    });
  });

  it('zbraně: + Přidat Zbraň vytvoří prázdnou položku v jad_weapons', () => {
    const onChange = vi.fn();
    render(
      <JadSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat Zbraň'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        jad_weapons: JSON.stringify([
          { n: '', b: '', d: '', t: '', r: '', o: '' },
        ]),
      }),
    });
  });
});
