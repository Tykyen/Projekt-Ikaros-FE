import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DrdPlusSheet } from '../DrdPlusSheet';
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
  characterSlug: 'mage1',
};

describe('DrdPlusSheet (8.7f)', () => {
  it('vyrenderuje 4 taby + výchozí Postava obsah', () => {
    render(
      <DrdPlusSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('1. Postava')).toBeInTheDocument();
    expect(screen.getByText('2. Boj')).toBeInTheDocument();
    expect(screen.getByText('3. Na Cesty')).toBeInTheDocument();
    expect(screen.getByText('4. Profese')).toBeInTheDocument();
    // Postava tab obsah
    expect(screen.getByText('Hlavní Vlastnosti')).toBeInTheDocument();
  });

  it('všech 6 hlavních vlastností v Postava tabu', () => {
    render(
      <DrdPlusSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    ['Síla', 'Obratnost', 'Zručnost', 'Vůle', 'Inteligence', 'Charisma'].forEach(
      (s) => {
        expect(screen.getByLabelText(s)).toBeInTheDocument();
      },
    );
  });

  it('všech 9 odvozených vlastností', () => {
    render(
      <DrdPlusSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    [
      'Odolnost',
      'Výdrž',
      'Rychlost',
      'Smysly',
      'Velikost',
      'Hmotnost',
      'Krása',
      'Nebezpečnost',
      'Důstojnost',
    ].forEach((s) => {
      expect(screen.getByLabelText(s)).toBeInTheDocument();
    });
  });

  it('přepnutí na Boj tab ukáže 4 combat cards', () => {
    render(
      <DrdPlusSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('2. Boj'));
    expect(screen.getByLabelText('Boj')).toBeInTheDocument();
    expect(screen.getByLabelText('Útok')).toBeInTheDocument();
    expect(screen.getByLabelText('Střelba')).toBeInTheDocument();
    expect(screen.getByLabelText('Obrana')).toBeInTheDocument();
  });

  it('Profese tab + default bojovnik → Archetypy + Bojové Finty', () => {
    render(
      <DrdPlusSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('4. Profese'));
    expect(screen.getByText('Archetypy')).toBeInTheDocument();
    expect(screen.getByText('Bojové Finty')).toBeInTheDocument();
  });

  it('Profese tab + carodej → Magenergie + Kouzla', () => {
    render(
      <DrdPlusSheet
        {...commonProps}
        diary={makeDiary({ drdp_profession: 'carodej' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('4. Profese'));
    expect(screen.getByText('Magenergie')).toBeInTheDocument();
    expect(screen.getByText('Kouzla')).toBeInTheDocument();
  });

  it('Profese tab + zlodej → Zlodějský Cech + Schopnosti', () => {
    render(
      <DrdPlusSheet
        {...commonProps}
        diary={makeDiary({ drdp_profession: 'zlodej' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('4. Profese'));
    expect(screen.getByText('Zlodějský Cech')).toBeInTheDocument();
    expect(screen.getByText('Schopnosti a Finty')).toBeInTheDocument();
  });

  it('všech 6 povolání v select dropdownu', () => {
    render(
      <DrdPlusSheet
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
      'Bojovník',
      'Čaroděj',
      'Hraničář',
      'Kněz',
      'Theurg',
      'Zloděj',
    ]);
  });

  it('view mode disabluje inputy a skryje add tlačítka', () => {
    render(
      <DrdPlusSheet
        {...commonProps}
        diary={makeDiary()}
        mode="view"
      />,
    );
    expect(screen.getByLabelText('Jméno')).toBeDisabled();
    fireEvent.click(screen.getByText('2. Boj'));
    expect(
      screen.queryByText('+ Přidat kombinaci'),
    ).not.toBeInTheDocument();
  });

  it('změna jména volá onChange s drdp_name', () => {
    const onChange = vi.fn();
    render(
      <DrdPlusSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Jméno'), {
      target: { value: 'Gandalf' },
    });
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ drdp_name: 'Gandalf' }),
    });
  });
});
