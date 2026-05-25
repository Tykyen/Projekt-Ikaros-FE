import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShadowrunSheet } from '../ShadowrunSheet';
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
  characterSlug: 'runner1',
};

describe('ShadowrunSheet (8.7k)', () => {
  it('vyrenderuje 8 hlavních atributů', () => {
    render(
      <ShadowrunSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    ['Tělo', 'Obratnost', 'Reakce', 'Síla', 'Vůle', 'Logika', 'Intuice', 'Charisma'].forEach(
      (l) => {
        expect(screen.getByLabelText(l)).toBeInTheDocument();
      },
    );
  });

  it('vyrenderuje 2 condition tracky (Phys + Stun)', () => {
    render(
      <ShadowrunSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByText('Fyzický záznamník zranění'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Záznamník omráčení (Stun)'),
    ).toBeInTheDocument();
  });

  it('condition track kliknutí na box nastaví sr_cond_phys', () => {
    const onChange = vi.fn();
    render(
      <ShadowrunSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(
      screen.getByLabelText('Fyzický záznamník zranění box 1'),
    );
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ sr_cond_phys: '1' }),
    });
  });

  it('Tab přepnutí na Matrix/Magie/Boj ukáže matrix panel', () => {
    render(
      <ShadowrunSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('2. Matrix, Magie a Boj'));
    expect(
      screen.getByText(/Matrix a Zařízení/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Útok (A)')).toBeInTheDocument();
  });

  it('quick combat má 3 sekce (Pancíř / Ranged / Melee)', () => {
    render(
      <ShadowrunSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Hlavní Pancíř')).toBeInTheDocument();
    expect(
      screen.getByText('Rychlá Zbraň na dálku'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Rychlá Zbraň na blízko'),
    ).toBeInTheDocument();
  });

  it('+ Přidat dovednost vyvolá onChange s sr_skills', () => {
    const onChange = vi.fn();
    render(
      <ShadowrunSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat dovednost'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        sr_skills: JSON.stringify([
          { name: '', val: '', attr: '', type: '' },
        ]),
      }),
    });
  });

  it('view mode disabluje vše', () => {
    render(
      <ShadowrunSheet
        {...commonProps}
        diary={makeDiary()}
        mode="view"
      />,
    );
    expect(screen.getByLabelText('Tělo')).toBeDisabled();
    expect(
      screen.queryByText('+ Přidat dovednost'),
    ).not.toBeInTheDocument();
  });
});
