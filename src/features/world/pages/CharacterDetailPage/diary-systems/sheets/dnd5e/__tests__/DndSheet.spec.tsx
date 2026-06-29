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

describe('DndSheet (8.7s)', () => {
  it('vyrenderuje 6 atributů s českými labely', () => {
    const { container } = render(
      <DndSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    const abilitiesPanel = container.querySelector(
      '.dnd-abilities',
    ) as HTMLElement;
    ['Síla', 'Obratnost', 'Odolnost', 'Inteligence', 'Moudrost', 'Charisma'].forEach(
      (l) => {
        expect(within(abilitiesPanel).getByText(l)).toBeInTheDocument();
      },
    );
  });

  it('vyrenderuje 18 dovedností (první + poslední)', () => {
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
    render(<DndSheet {...commonProps} diary={makeDiary()} mode="view" />);
    expect(screen.getByLabelText('Obranné číslo')).toBeDisabled();
    expect(screen.queryByText('+ Přidat povolání')).not.toBeInTheDocument();
    expect(screen.queryByText('+ Přidat útok')).not.toBeInTheDocument();
  });

  it('vypočítá modifier (Síla 14 → +2)', () => {
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({ dnd_ability_str: '14' })}
        mode="view"
      />,
    );
    const silaInput = screen.getByLabelText('Síla skóre');
    const abilityBox = silaInput.closest('.dnd-ability') as HTMLElement;
    expect(within(abilityBox).getByText('+2')).toBeInTheDocument();
  });

  it('pasivní vnímání (Moudrost 14, prof 2, bez zdatnosti) → 12', () => {
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({ dnd_ability_wis: '14', dnd_profBonus: '2' })}
        mode="view"
      />,
    );
    const passLabel = screen.getByText('Pasivní vnímání');
    const passRow = passLabel.parentElement!;
    expect(within(passRow).getByText('12')).toBeInTheDocument();
  });

  it('skill prof cycle: 0 → 1', () => {
    const onChange = vi.fn();
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    const row = screen.getByText('Akrobacie').parentElement!;
    fireEvent.click(within(row).getByRole('button'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        dnd_skill_prof_Akrobacie: '1',
      }),
    });
  });

  it('death save pip: 0 → 1', () => {
    const onChange = vi.fn();
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({ dnd_deathSuccess: '0' })}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Úspěch 1 z 3'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ dnd_deathSuccess: '1' }),
    });
  });

  it('+ Přidat útok přidá prázdný attack', () => {
    const onChange = vi.fn();
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({ dnd_spellEnabled: '0' })}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat útok'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        dnd_attacks: JSON.stringify([{ name: '', bonus: '', damage: '' }]),
      }),
    });
  });

  // ── Multipovolání ──────────────────────────────────────────
  it('+ Přidat povolání založí prázdný řádek se 4 poli', () => {
    const onChange = vi.fn();
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat povolání'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: {
        dnd_classes: JSON.stringify([{ c: '', l: '', s: '', s2: '' }]),
      },
    });
  });

  it('úroveň postavy = součet úrovní povolání (badge)', () => {
    const { container } = render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({
          dnd_classes: JSON.stringify([
            { c: 'Bojovník', l: '3', s: '', s2: '' },
            { c: 'Tulák', l: '2', s: '', s2: '' },
          ]),
        })}
        mode="view"
      />,
    );
    expect(
      container.querySelector('.dnd-level-badge .num')?.textContent,
    ).toBe('5');
  });

  it('obor je zamčený pod prahovou úrovní (Barbar Stezka od 3.)', () => {
    const { rerender } = render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({
          dnd_classes: JSON.stringify([
            { c: 'Barbar', l: '1', s: '', s2: '' },
          ]),
        })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Stezka')).toBeDisabled();
    expect(screen.getByText(/stezka od 3\. úrovně/)).toBeInTheDocument();

    rerender(
      <DndSheet
        {...commonProps}
        diary={makeDiary({
          dnd_classes: JSON.stringify([
            { c: 'Barbar', l: '3', s: '', s2: '' },
          ]),
        })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Stezka')).not.toBeDisabled();
  });

  it('Černokněžník má 2 osy (Patron + Pakt)', () => {
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({
          dnd_classes: JSON.stringify([
            { c: 'Černokněžník', l: '3', s: '', s2: '' },
          ]),
        })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Patron')).toBeInTheDocument();
    expect(screen.getByLabelText('Pakt')).toBeInTheDocument();
    // Patron od 1. úr → odemčen; Pakt od 3. úr → odemčen
    expect(screen.getByLabelText('Patron')).not.toBeDisabled();
    expect(screen.getByLabelText('Pakt')).not.toBeDisabled();
  });

  // ── Zázemí ─────────────────────────────────────────────────
  it('zázemí ze seznamu = select s danou hodnotou, bez vlastního inputu', () => {
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({ dnd_background: 'Akolyta' })}
        mode="view"
      />,
    );
    expect((screen.getByLabelText('Zázemí') as HTMLSelectElement).value).toBe(
      'Akolyta',
    );
    expect(screen.queryByLabelText('Vlastní zázemí')).not.toBeInTheDocument();
  });

  it('zázemí mimo seznam zobrazí text input „Vlastní zázemí"', () => {
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({ dnd_background: 'Pirátský kapitán' })}
        mode="view"
      />,
    );
    expect(
      (screen.getByLabelText('Vlastní zázemí') as HTMLInputElement).value,
    ).toBe('Pirátský kapitán');
  });

  // ── Přidávatelné sekce ─────────────────────────────────────
  it('+ Přidat jazyk zapíše dnd_langs', () => {
    const onChange = vi.fn();
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({ dnd_spellEnabled: '0' })}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat jazyk'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: { dnd_langs: JSON.stringify(['']) },
    });
  });

  // ── Migrace legacy (read-only) ─────────────────────────────
  it('legacy dnd_otherProf se zobrazí jako jeden řádek zdatnosti', () => {
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({ dnd_otherProf: 'Štíty, dýky' })}
        mode="view"
      />,
    );
    expect(screen.getByDisplayValue('Štíty, dýky')).toBeInTheDocument();
  });

  it('legacy dnd_features se zobrazí jako jedna schopnost', () => {
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({ dnd_features: 'Temné vidění 18 m' })}
        mode="view"
      />,
    );
    expect(screen.getByDisplayValue('Temné vidění 18 m')).toBeInTheDocument();
  });

  it('legacy dnd_classLevel ukáže read-only hint, dokud nejsou povolání', () => {
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({ dnd_classLevel: 'Bojovník 5' })}
        mode="view"
      />,
    );
    expect(screen.getByText(/Dřívější zápis:/)).toBeInTheDocument();
    expect(screen.getByText('Bojovník 5')).toBeInTheDocument();
  });

  // ── Auto-tab kouzel ────────────────────────────────────────
  it('caster povolání (Klerik) auto-zapne tab kouzel bez explicitního flagu', () => {
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({
          dnd_classes: JSON.stringify([
            { c: 'Klerik', l: '1', s: '', s2: '' },
          ]),
        })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('✨ Sesílání kouzel')).toBeInTheDocument();
  });

  it('ruční dnd_spellEnabled="0" přebije caster auto-zapnutí', () => {
    render(
      <DndSheet
        {...commonProps}
        diary={makeDiary({
          dnd_spellEnabled: '0',
          dnd_classes: JSON.stringify([
            { c: 'Klerik', l: '1', s: '', s2: '' },
          ]),
        })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.queryByText('✨ Sesílání kouzel')).not.toBeInTheDocument();
  });
});
