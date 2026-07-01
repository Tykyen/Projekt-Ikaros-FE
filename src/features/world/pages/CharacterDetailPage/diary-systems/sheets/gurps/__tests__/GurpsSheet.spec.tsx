import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GurpsSheet } from '../GurpsSheet';
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
  characterSlug: 'kaelen',
};

describe('GurpsSheet (GURPS 4E)', () => {
  it('vyrenderuje 4 hlavní atributy (ST/DX/IQ/HT) + Vůle/Vnímání', () => {
    render(
      <GurpsSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />,
    );
    ['Síla (ST)', 'Obratnost (DX)', 'Inteligence (IQ)', 'Zdraví (HT)'].forEach((l) => {
      expect(screen.getByLabelText(l)).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Vůle (Will)')).toBeInTheDocument();
    expect(screen.getByLabelText('Vnímání (Per)')).toBeInTheDocument();
  });

  it('vyrenderuje HP a FP boxy s aktuální + max inputem', () => {
    render(
      <GurpsSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />,
    );
    expect(screen.getByLabelText('HP (=ST) aktuální')).toBeInTheDocument();
    expect(screen.getByLabelText('HP (=ST) max')).toBeInTheDocument();
    expect(screen.getByLabelText('FP (=HT) aktuální')).toBeInTheDocument();
    expect(screen.getByLabelText('FP (=HT) max')).toBeInTheDocument();
  });

  it('vyrenderuje tabulku naložení s 5 úrovněmi', () => {
    render(<GurpsSheet {...commonProps} diary={makeDiary()} mode="view" />);
    ['Žádné (0)', 'Lehké (1)', 'Střední (2)', 'Těžké (3)', 'V. těžké (4)'].forEach((l) => {
      expect(screen.getByText(l)).toBeInTheDocument();
    });
  });

  it('vyrenderuje zbroj DR po částech těla (edit inputy)', () => {
    render(
      <GurpsSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />,
    );
    expect(screen.getByLabelText('DR Trup')).toBeInTheDocument();
    expect(screen.getByLabelText('DR Hlava')).toBeInTheDocument();
  });

  it('auto-výpočet: Úhyb default z rychlosti (placeholder)', () => {
    // default vše 10 → speed 5 → dodge 8
    render(
      <GurpsSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />,
    );
    expect(screen.getByLabelText('Úhyb (Dodge)')).toHaveAttribute('placeholder', '8');
  });

  it('auto-výpočet: Úder z tabulky škod (ST 10 → 1k-2)', () => {
    render(
      <GurpsSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />,
    );
    expect(screen.getByLabelText('Úder (thrust)')).toHaveAttribute('placeholder', '1k-2');
  });

  it('bodový účet: cena atributů se počítá (DX 14 → 80)', () => {
    render(<GurpsSheet {...commonProps} diary={makeDiary({ gurps_dx: '14' })} mode="view" />);
    const row = screen.getByText('Atributy + sekundární').closest('.row');
    expect(row).toHaveTextContent('80');
  });

  it('view mode: žádné atr. inputy, žádná add tlačítka', () => {
    render(<GurpsSheet {...commonProps} diary={makeDiary()} mode="view" />);
    expect(screen.queryByLabelText('Síla (ST)')).not.toBeInTheDocument();
    expect(screen.queryByText('+ Přidat dovednost')).not.toBeInTheDocument();
    expect(screen.queryByText('+ Přidat výhodu')).not.toBeInTheDocument();
  });

  it('změna Síly volá onChange s gurps_st klíčem', () => {
    const onChange = vi.fn();
    render(
      <GurpsSheet
        {...commonProps}
        diary={makeDiary({ gurps_st: '10' })}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Síla (ST)'), { target: { value: '14' } });
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ gurps_st: '14' }),
    });
  });

  it('+ Přidat dovednost přidá prázdný řádek do gurps_skills', () => {
    const onChange = vi.fn();
    render(
      <GurpsSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={onChange} />,
    );
    fireEvent.click(screen.getByText('+ Přidat dovednost'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        gurps_skills: JSON.stringify([{ name: '', base: '', pts: '', lvl: '' }]),
      }),
    });
  });

  it('výhody / nevýhody / zvláštnosti mají samostatná add tlačítka', () => {
    render(
      <GurpsSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />,
    );
    expect(screen.getByText('+ Přidat výhodu')).toBeInTheDocument();
    expect(screen.getByText('+ Přidat nevýhodu')).toBeInTheDocument();
    expect(screen.getByText('+ Přidat zvláštnost')).toBeInTheDocument();
  });

  it('vyrenderuje obě tabulky zbraní (melee + ranged)', () => {
    render(
      <GurpsSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />,
    );
    expect(screen.getByText('Zbraně na blízko')).toBeInTheDocument();
    expect(screen.getByText('Střelné / vrhací zbraně')).toBeInTheDocument();
    // ranged má unikátní sloupec „Náboje"
    expect(screen.getByText('Náboje')).toBeInTheDocument();
  });
});
