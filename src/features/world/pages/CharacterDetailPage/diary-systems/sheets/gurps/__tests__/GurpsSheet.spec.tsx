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
  characterSlug: 'agent1',
};

describe('GurpsSheet (8.7g)', () => {
  it('vyrenderuje 6 hlavních atributů (ST/DX/IQ/HT/Will/Per)', () => {
    render(
      <GurpsSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    ['Síla (ST)', 'Obratnost (DX)', 'Inteligence (IQ)', 'Zdraví (HT)', 'Vůle (Will)', 'Vnímání (Per)'].forEach(
      (l) => {
        expect(screen.getByLabelText(l)).toBeInTheDocument();
      },
    );
  });

  it('vyrenderuje HP a FP boxy s aktuální + max input', () => {
    render(
      <GurpsSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('HP (Životy) aktuální')).toBeInTheDocument();
    expect(screen.getByLabelText('HP (Životy) max')).toBeInTheDocument();
    expect(screen.getByLabelText('FP (Únava) aktuální')).toBeInTheDocument();
    expect(screen.getByLabelText('FP (Únava) max')).toBeInTheDocument();
  });

  it('vyrenderuje encumbrance tabulku s 5 úrovněmi (Žádné až Velmi těžké)', () => {
    render(
      <GurpsSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    ['Žádné (0)', 'Lehké (1)', 'Střední (2)', 'Těžké (3)', 'Velmi těžké (4)'].forEach(
      (l) => {
        expect(screen.getByText(l)).toBeInTheDocument();
      },
    );
  });

  it('view mode disabluje inputy a skryje add tlačítka', () => {
    render(
      <GurpsSheet {...commonProps} diary={makeDiary()} mode="view" />,
    );
    expect(screen.getByLabelText('Jméno postavy (Name)')).toBeDisabled();
    expect(
      screen.queryByText('+ Přidat dovednost'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('+ Přidat výhodu'),
    ).not.toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText('Síla (ST)'), {
      target: { value: '14' },
    });
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ gurps_st: '14' }),
    });
  });

  it('+ Přidat dovednost přidá prázdný řádek do gurps_skills', () => {
    const onChange = vi.fn();
    render(
      <GurpsSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat dovednost'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        gurps_skills: JSON.stringify([{ name: '', lvl: '', base: '' }]),
      }),
    });
  });

  it('+ Přidat výhodu / nevýhodu / modifikátor jsou separate (4 tabulky)', () => {
    render(
      <GurpsSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('+ Přidat výhodu')).toBeInTheDocument();
    expect(screen.getByText('+ Přidat nevýhodu')).toBeInTheDocument();
    expect(screen.getByText('+ Přidat modifikátor')).toBeInTheDocument();
    expect(screen.getByText('+ Přidat jazyk')).toBeInTheDocument();
  });

  it('vyrenderuje obě tabulky zbraní (melee + ranged)', () => {
    render(
      <GurpsSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Zbraně na blízko')).toBeInTheDocument();
    expect(screen.getByText('Střelné zbraně')).toBeInTheDocument();
    // Ranged tabulka má sloupec „RoF" — unique
    expect(screen.getByText('RoF')).toBeInTheDocument();
  });

  it('inventory totals — celková váha + cena jsou editovatelné', () => {
    const onChange = vi.fn();
    render(
      <GurpsSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Celková váha inventáře'), {
      target: { value: '42' },
    });
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ gurps_inv_wgt: '42' }),
    });
  });
});
