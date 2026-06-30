import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShadowrunSheet } from '../ShadowrunSheet';
import { useCharacter } from '@/features/world/pages/api/useCharacter';
import type { CharacterDiary } from '../../../../../api/characters.types';

// useCharacter řídí NPC fallback. Mockujeme ho (jako MatrixSheet).
vi.mock('@/features/world/pages/api/useCharacter');
const mockedUseCharacter = vi.mocked(useCharacter);
beforeEach(() => {
  mockedUseCharacter.mockReturnValue({
    data: undefined,
  } as unknown as ReturnType<typeof useCharacter>);
});

function makeDiary(customData: Record<string, unknown> = {}): CharacterDiary {
  return { id: 'd1', characterId: 'c1', worldId: 'w1', sections: [], customData };
}

const commonProps = {
  worldId: 'w1',
  worldSlug: 'testw',
  characterSlug: 'runner1',
} as const;

function renderSheet(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ShadowrunSheet (6e HUD)', () => {
  it('vyrenderuje 8 hlavních atributů (edit inputy)', () => {
    renderSheet(<ShadowrunSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    ['Tělo', 'Obratnost', 'Reakce', 'Síla', 'Vůle', 'Logika', 'Intuice', 'Charisma'].forEach((l) => {
      expect(screen.getByLabelText(l)).toBeInTheDocument();
    });
  });

  it('vyrenderuje fyzický + omračovací záznamník', () => {
    renderSheet(<ShadowrunSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    expect(screen.getByText(/Fyzický záznamník/)).toBeInTheDocument();
    expect(screen.getByText(/Záznamník omráčení/)).toBeInTheDocument();
  });

  it('klik na box fyzického záznamníku nastaví sr_cond_phys', () => {
    const onChange = vi.fn();
    renderSheet(<ShadowrunSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/Fyzický záznamník box 1/));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({ sr_cond_phys: '1' }),
    });
  });

  it('Matrix panel: editovatelné A/M/Z/F', () => {
    renderSheet(<ShadowrunSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    expect(screen.getByLabelText('Útok')).toBeInTheDocument();
    expect(screen.getByLabelText('Firewall')).toBeInTheDocument();
  });

  it('+ Přidat dovednost vyvolá onChange s sr_skills (nová struktura)', () => {
    const onChange = vi.fn();
    renderSheet(<ShadowrunSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Přidat dovednost'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: expect.objectContaining({
        sr_skills: JSON.stringify([{ name: '', attr: 'agi', val: '0', spec: '' }]),
      }),
    });
  });

  it('počítá dice pool = atribut + dovednost + 2 (specializace)', () => {
    renderSheet(
      <ShadowrunSheet
        {...commonProps}
        diary={makeDiary({
          sr_attr_agi: '6',
          sr_skills: JSON.stringify([{ name: 'Střelba', attr: 'agi', val: '5', spec: 'Pistole' }]),
        })}
        mode="view"
      />,
    );
    // 6 (Obratnost) + 5 (dovednost) + 2 (specializace) = 13
    expect(screen.getByText('13')).toBeInTheDocument();
  });

  it('zranění snižuje pool (−1 za 3 boxy)', () => {
    renderSheet(
      <ShadowrunSheet
        {...commonProps}
        diary={makeDiary({
          sr_attr_agi: '6',
          sr_cond_phys: '3', // −1 postih
          sr_skills: JSON.stringify([{ name: 'Střelba', attr: 'agi', val: '5', spec: '' }]),
        })}
        mode="view"
      />,
    );
    // 6 + 5 − 1 = 10
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('view mode: atributy jako text, žádné edit tlačítko', () => {
    renderSheet(<ShadowrunSheet {...commonProps} diary={makeDiary({ sr_attr_bod: '4' })} mode="view" />);
    expect(screen.queryByLabelText('Tělo')).toBeNull();
    expect(screen.queryByText('+ Přidat dovednost')).not.toBeInTheDocument();
  });

  it('NPC bez aliasu zobrazí „NPC“', () => {
    mockedUseCharacter.mockReturnValue({
      data: { isNpc: true },
    } as unknown as ReturnType<typeof useCharacter>);
    renderSheet(<ShadowrunSheet {...commonProps} diary={makeDiary()} mode="view" />);
    expect(screen.getByText('NPC')).toBeInTheDocument();
  });
});
