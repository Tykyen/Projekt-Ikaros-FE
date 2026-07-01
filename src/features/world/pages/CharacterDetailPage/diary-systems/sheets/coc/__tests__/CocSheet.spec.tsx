import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CocSheet } from '../CocSheet';
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
  characterSlug: 'inv1',
};

describe('CocSheet (8.7t redesign)', () => {
  it('vyrenderuje spisovou pásku a všech 8 vlastností (SIL/ODL/OBR/INT/VEL/VŮL/VZH/VZD)', () => {
    render(
      <CocSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );

    expect(screen.getByText(/Deník vyšetřovatele/)).toBeInTheDocument();

    ['SIL', 'ODL', 'OBR', 'INT', 'VEL', 'VŮL', 'VZH', 'VZD'].forEach(
      (abbr) => {
        expect(screen.getByText(abbr)).toBeInTheDocument();
      },
    );
  });

  it('vyrenderuje 44 výchozích dovedností (kontrola první + poslední)', () => {
    render(
      <CocSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(/Účetnictví/)).toBeInTheDocument();
    expect(screen.getByText(/Stopování/)).toBeInTheDocument();
  });

  it('vyrenderuje 6 status pečetí (šílenství, zranění, …)', () => {
    render(
      <CocSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Max. příčetnost')).toBeInTheDocument();
    expect(screen.getByText('Dočasné šílenství')).toBeInTheDocument();
    expect(screen.getByText('Umírá')).toBeInTheDocument();
  });

  it('vyrenderuje sekci Souhrn postavy (Vzezření, Fóbie & mánie, Tajuplné knihy)', () => {
    render(
      <CocSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Vzezření')).toBeInTheDocument();
    expect(screen.getByLabelText('Fóbie & mánie')).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Tajuplné knihy/),
    ).toBeInTheDocument();
  });

  it('vyrenderuje Vybavení & majetek (Hotovost, Majetek)', () => {
    render(
      <CocSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Hotovost')).toBeInTheDocument();
    expect(screen.getByText('Majetek')).toBeInTheDocument();
  });

  it('view mode disabluje inputy a skryje add tlačítka', () => {
    render(<CocSheet {...commonProps} diary={makeDiary()} mode="view" />);
    const jmeno = screen.getByLabelText(/^Jméno/i);
    expect(jmeno).toBeDisabled();
    expect(
      screen.queryByText('+ Přidat dovednost'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('+ Přidat zbraň')).not.toBeInTheDocument();
  });

  it('edit mode volá onChange při změně SIL hodnoty', () => {
    const onChange = vi.fn();
    render(
      <CocSheet
        {...commonProps}
        diary={makeDiary({ coc_str_reg: '50' })}
        mode="edit"
        onChange={onChange}
      />,
    );
    const silReg = screen.getByLabelText('SIL základní');
    fireEvent.change(silReg, { target: { value: '70' } });
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ coc_str_reg: '70' }),
    });
  });

  it('edit mode: změna Vzezření volá onChange s coc_appearance', () => {
    const onChange = vi.fn();
    render(
      <CocSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Vzezření'), {
      target: { value: 'Hubená postava' },
    });
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        coc_appearance: 'Hubená postava',
      }),
    });
  });

  it('status pečeť: kliknutí přepne `coc_temp_insanity` na true', () => {
    const onChange = vi.fn();
    render(
      <CocSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    const label = screen.getByText('Dočasné šílenství').closest('label')!;
    const cb = within(label).getByRole('checkbox');
    fireEvent.click(cb);
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ coc_temp_insanity: true }),
    });
  });

  it('+ Přidat zbraň přidá prázdnou položku do coc_weapons', () => {
    const onChange = vi.fn();
    render(
      <CocSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat zbraň'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        coc_weapons: JSON.stringify([
          {
            name: '',
            skill: '',
            dmg: '',
            attacks: '1',
            range: '',
            ammo: '',
            malf: '',
          },
        ]),
      }),
    });
  });

  it('+ Přidat dovednost přidá prázdnou custom skill', () => {
    const onChange = vi.fn();
    render(
      <CocSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat dovednost'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        coc_custom_skills: JSON.stringify([
          { name: '', reg: '', half: '', fifth: '', chk: 'false' },
        ]),
      }),
    });
  });

  it('Příčetnost vital box má třídu is-sanity (indigo)', () => {
    const { container } = render(
      <CocSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    const sanityLabel = within(container).getByText('Příčetnost');
    expect(sanityLabel.parentElement).toHaveClass('is-sanity');
  });

  it('Životy vital box má třídu is-danger (krev)', () => {
    const { container } = render(
      <CocSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    const hpLabel = within(container).getByText('Životy');
    expect(hpLabel.parentElement).toHaveClass('is-danger');
  });
});
