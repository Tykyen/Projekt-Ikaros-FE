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

describe('JadSheet (8.7b / 8.7p)', () => {
  it('vyrenderuje 6 atributů (SÍL/OBR/ODO/INT/MOU/CHA) a všech 18 dovedností', () => {
    render(
      <JadSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );

    ['SÍL', 'OBR', 'ODO', 'INT', 'MOU', 'CHA'].forEach((abbr) => {
      expect(screen.getByText(abbr)).toBeInTheDocument();
    });

    expect(screen.getByText('Akrobacie')).toBeInTheDocument();
    expect(screen.getByText('Zastrašování')).toBeInTheDocument();
  });

  it('view mode disabluje inputy i tlačítka', () => {
    render(<JadSheet {...commonProps} diary={makeDiary()} mode="view" />);
    expect(screen.getByLabelText('Rasa')).toBeDisabled();
    expect(screen.getByLabelText('Přepnout inspiraci')).toBeDisabled();
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

    // Bez povolání není žádný number input pro úroveň → první spinbutton = Síla.
    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs.length).toBeGreaterThanOrEqual(6);
    fireEvent.change(numberInputs[0], { target: { value: '15' } });

    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ jad_abi_str: '15' }),
    });
  });

  it('vypočítá modifier správně (Síla 14 → +2)', () => {
    render(
      <JadSheet
        {...commonProps}
        diary={makeDiary({ jad_abi_str: '14' })}
        mode="view"
      />,
    );
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
    expect(screen.queryByText('Kouzla')).not.toBeInTheDocument();

    rerender(
      <JadSheet
        {...commonProps}
        diary={makeDiary({ jad_spellEnabled: '1' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Kouzla')).toBeInTheDocument();
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

  // ── 8.7p: hlavička bez jména / přesvědčení / hráče ──────────────
  it('8.7p: hlavička neobsahuje jméno postavy, přesvědčení ani hráče', () => {
    render(<JadSheet {...commonProps} diary={makeDiary()} mode="view" />);
    expect(screen.queryByLabelText('Jméno postavy')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Přesvědčení')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Hráč')).not.toBeInTheDocument();
  });

  // ── 8.7p: zázemí jako select ────────────────────────────────────
  it('8.7p: zázemí je select s 16 osobními zázemími', () => {
    render(<JadSheet {...commonProps} diary={makeDiary()} mode="view" />);
    const bg = screen.getByLabelText('Zázemí');
    expect(bg.tagName).toBe('SELECT');
    expect(screen.getByRole('option', { name: 'Akolyta' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Zbojník' })).toBeInTheDocument();
  });

  // ── 8.7p: multipovolání ─────────────────────────────────────────
  it('8.7p: + Přidat povolání zapíše prázdný řádek do jad_classes', () => {
    const onChange = vi.fn();
    render(
      <JadSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat povolání'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        jad_classes: JSON.stringify([{ c: '', l: '', s: '' }]),
      }),
    });
  });

  it('8.7p: úroveň postavy = součet úrovní povolání', () => {
    render(
      <JadSheet
        {...commonProps}
        diary={makeDiary({
          jad_classes: JSON.stringify([
            { c: 'Bojovník', l: '3', s: '' },
            { c: 'Tulák', l: '2', s: '' },
          ]),
        })}
        mode="view"
      />,
    );
    const badge = screen.getByText('Úroveň', { selector: '.cap' })
      .parentElement!;
    expect(within(badge).getByText('5')).toBeInTheDocument();
  });

  it('8.7p: obor je zamčený pod prahovou úrovní (Bojovník L1) a volný od L3', () => {
    const { rerender } = render(
      <JadSheet
        {...commonProps}
        diary={makeDiary({
          jad_classes: JSON.stringify([{ c: 'Bojovník', l: '1', s: '' }]),
        })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Obor')).toBeDisabled();
    expect(screen.getByText('obor od 3. úrovně')).toBeInTheDocument();

    rerender(
      <JadSheet
        {...commonProps}
        diary={makeDiary({
          jad_classes: JSON.stringify([{ c: 'Bojovník', l: '3', s: '' }]),
        })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Obor')).not.toBeDisabled();
    expect(
      screen.getByRole('option', { name: 'Šampion' }),
    ).toBeInTheDocument();
  });

  it('8.7p: migrace legacy jad_class → první řádek povolání + úroveň', () => {
    render(
      <JadSheet
        {...commonProps}
        diary={makeDiary({ jad_class: 'Bojovník', jad_level: '5' })}
        mode="view"
      />,
    );
    expect((screen.getByLabelText('Povolání') as HTMLSelectElement).value).toBe(
      'Bojovník',
    );
    const badge = screen.getByText('Úroveň', { selector: '.cap' })
      .parentElement!;
    expect(within(badge).getByText('5')).toBeInTheDocument();
  });

  // ── 8.7p: přidávatelné sekce ────────────────────────────────────
  it('8.7p: + Přidat zdatnost / jazyk / schopnost zapisují svá pole', () => {
    const onChange = vi.fn();
    render(
      <JadSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByText('+ Přidat zdatnost'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ jad_profs: JSON.stringify(['']) }),
    });

    fireEvent.click(screen.getByText('+ Přidat jazyk'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ jad_langs: JSON.stringify(['']) }),
    });

    fireEvent.click(screen.getByText('+ Přidat schopnost'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        jad_feats: JSON.stringify([{ n: '', d: '' }]),
      }),
    });
  });

  it('8.7p: migrace legacy jad_features → jedna schopnost s popisem', () => {
    render(
      <JadSheet
        {...commonProps}
        diary={makeDiary({ jad_features: 'Temný zrak 18 m' })}
        mode="view"
      />,
    );
    expect(screen.getByDisplayValue('Temný zrak 18 m')).toBeInTheDocument();
  });
});
