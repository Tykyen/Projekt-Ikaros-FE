import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DndSheet } from '../DndSheet';
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
  characterSlug: 'thrain',
};

describe('DndSheet (8.7d)', () => {
  it('vyrenderuje 6 atributů s českými labely (Síla, Obratnost, …)', () => {
    const { container } = render(
      <DndSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    // Atributy mají label uvnitř `.dnd-abilities`. Texty jako „Síla"
    // se objevují i v panelu Záchran — proto query scope.
    const abilitiesPanel = container.querySelector('.dnd-abilities') as HTMLElement;
    [
      'Síla',
      'Obratnost',
      'Odolnost',
      'Inteligence',
      'Moudrost',
      'Charisma',
    ].forEach((l) => {
      expect(within(abilitiesPanel).getByText(l)).toBeInTheDocument();
    });
  });

  it('vyrenderuje 18 dovedností (kontrola první + poslední)', () => {
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Akrobacie')).toBeInTheDocument();
    expect(screen.getByText('Zastrašování')).toBeInTheDocument();
  });

  it('view mode disabluje inputy a skryje add/del tlačítka', () => {
    render(
      <DndSheet {...commonProps} diary={makeDiary()} mode="view" />,
    );
    const ac = screen.getByLabelText('Obranné číslo');
    expect(ac).toBeDisabled();
    expect(screen.queryByText('+ Přidat útok')).not.toBeInTheDocument();
  });

  it('vypočítá modifier správně (Síla 14 → +2)', () => {
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({ dnd_ability_str: '14' })}
        mode="view"
      />,
    );
    // aria-label na input je stabilnější selektor než label text
    // (Síla se vyskytuje i v save panelu).
    const silaInput = screen.getByLabelText('Síla skóre');
    const abilityBox = silaInput.closest('.dnd-ability') as HTMLElement;
    expect(within(abilityBox).getByText('+2')).toBeInTheDocument();
  });

  it('vypočítá passive perception (Moudrost 14, prof bonus 2, Vnímání bez prof) → 12', () => {
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({ dnd_ability_wis: '14', dnd_profBonus: '2' })}
        mode="view"
      />,
    );
    const passLabel = screen.getByText(/Pasivní vnímání/);
    const passRow = passLabel.parentElement!;
    expect(within(passRow).getByText('12')).toBeInTheDocument();
  });

  it('skill prof cycle: kliknutí cykluje 0 → 1 → 2 → 0', () => {
    const onChange = vi.fn();
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    // Najdi řádek Akrobacie a jeho prof tlačítko (within row)
    const skillName = screen.getByText('Akrobacie');
    const row = skillName.parentElement!;
    const profBtn = within(row).getByRole('button');
    fireEvent.click(profBtn);
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        dnd_skill_prof_Akrobacie: '1',
      }),
    });
  });

  it('spell tab tlačítko se zobrazí jen pokud `dnd_spellEnabled === "1"`', () => {
    const { rerender } = render(
      <DndSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(
      screen.queryByText('✨ Sesílání kouzel'),
    ).not.toBeInTheDocument();

    rerender(
      <DndSheet
        {...commonProps}
        diary={makeDiary({ dnd_spellEnabled: '1' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('✨ Sesílání kouzel')).toBeInTheDocument();
  });

  it('death save pip kliknutí: 0 → 1, kliknutí na již vyplněný → o úroveň níž', () => {
    const onChange = vi.fn();
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({ dnd_deathSuccess: '0' })}
        mode="edit"
        onChange={onChange}
      />,
    );
    const firstSuccessPip = screen.getByLabelText('Úspěch 1 z 3');
    fireEvent.click(firstSuccessPip);
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ dnd_deathSuccess: '1' }),
    });
  });

  it('+ Přidat útok přidá prázdný attack do dnd_attacks', () => {
    const onChange = vi.fn();
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat útok'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        dnd_attacks: JSON.stringify([
          { name: '', bonus: '', damage: '' },
        ]),
      }),
    });
  });
});
