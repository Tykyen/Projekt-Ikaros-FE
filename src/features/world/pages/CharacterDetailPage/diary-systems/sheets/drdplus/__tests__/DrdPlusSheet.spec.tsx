import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DrdPlusSheet } from '../DrdPlusSheet';
import type { CharacterDiary } from '../../../../../api/characters.types';

function makeDiary(customData: Record<string, unknown> = {}): CharacterDiary {
  return { id: 'd1', characterId: 'c1', worldId: 'w1', sections: [], customData };
}

const commonProps = {
  worldId: 'w1',
  worldSlug: 'testw',
  characterSlug: 'mage1',
};

describe('DrdPlusSheet (16.2d — jednotný list)', () => {
  it('vyrenderuje 4 strany pod sebou (bez tabů)', () => {
    render(<DrdPlusSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    ['Postava', 'Boj', 'Na cesty', 'Profese'].forEach((t) => {
      expect(screen.getByRole('heading', { name: t })).toBeInTheDocument();
    });
    expect(screen.getByText('Hlavní vlastnosti')).toBeInTheDocument();
  });

  it('všech 6 hlavních vlastností', () => {
    render(<DrdPlusSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    ['Síla', 'Obratnost', 'Zručnost', 'Vůle', 'Inteligence', 'Charisma'].forEach((s) => {
      expect(screen.getByLabelText(s)).toBeInTheDocument();
    });
  });

  it('všech 9 odvozených vlastností', () => {
    render(<DrdPlusSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    ['Odolnost', 'Výdrž', 'Rychlost', 'Smysly', 'Velikost', 'Hmotnost', 'Krása', 'Nebezpečnost', 'Důstojnost'].forEach(
      (s) => {
        expect(screen.getByLabelText(s)).toBeInTheDocument();
      },
    );
  });

  it('Boj — 4 bojové hodnoty jsou na listu (bez přepínání)', () => {
    render(<DrdPlusSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    ['Boj', 'Útok', 'Střelba', 'Obrana'].forEach((l) => {
      expect(screen.getByLabelText(l)).toBeInTheDocument();
    });
  });

  it('Profese — default bojovník ukáže Archetyp + Bojové finty', () => {
    render(<DrdPlusSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    expect(screen.getByText('Archetyp')).toBeInTheDocument();
    expect(screen.getByText('Bojové finty')).toBeInTheDocument();
  });

  it('Profese — čaroděj ukáže Magenergie + Kouzla', () => {
    render(
      <DrdPlusSheet {...commonProps} diary={makeDiary({ drdp_profession: 'carodej' })} mode="edit" onChange={() => {}} />,
    );
    expect(screen.getByText('Magenergie')).toBeInTheDocument();
    expect(screen.getByText('Kouzla')).toBeInTheDocument();
  });

  it('Profese — zloděj ukáže Schopnosti + Zlodějské pomůcky', () => {
    render(
      <DrdPlusSheet {...commonProps} diary={makeDiary({ drdp_profession: 'zlodej' })} mode="edit" onChange={() => {}} />,
    );
    expect(screen.getByText('Zlodějské pomůcky')).toBeInTheDocument();
  });

  it('výběr povolání erbem nabízí všech 6 povolání', () => {
    render(<DrdPlusSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    ['Bojovník', 'Čaroděj', 'Hraničář', 'Kněz', 'Theurg', 'Zloděj'].forEach((l) => {
      expect(screen.getByTitle(l)).toBeInTheDocument();
    });
  });

  it('view mode disabluje inputy a skryje add tlačítka', () => {
    render(<DrdPlusSheet {...commonProps} diary={makeDiary()} mode="view" />);
    expect(screen.getByLabelText('Jméno')).toBeDisabled();
    expect(screen.queryByText('+ Přidat kombinaci')).not.toBeInTheDocument();
  });

  it('změna jména volá onChange s drdp_name', () => {
    const onChange = vi.fn();
    render(<DrdPlusSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Jméno'), { target: { value: 'Gandalf' } });
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ drdp_name: 'Gandalf' }),
    });
  });
});
