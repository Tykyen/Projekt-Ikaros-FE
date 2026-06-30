import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FateSheet } from '../FateSheet';
import type { CharacterDiary } from '../../../../../api/characters.types';

// FateLikeSheet volá useCharacter (jméno) + usePrintMode — v unit testu mock.
vi.mock('@/features/world/export/print', () => ({ usePrintMode: () => false }));
vi.mock('@/features/world/pages/api/useCharacter', () => ({
  useCharacter: () => ({ data: { name: 'T-8' } }),
}));

function makeDiary(customData: Record<string, unknown> = {}): CharacterDiary {
  return { id: 'd1', characterId: 'c1', worldId: 'w1', sections: [], customData };
}

const commonProps = { worldId: 'w1', worldSlug: 'testw', characterSlug: 'fate1' };

describe('FateSheet (Fate Core)', () => {
  it('vyrenderuje sekce Aspekty, Dovednosti, Triky, Stres, Následky, Deník', () => {
    render(<FateSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Aspekty' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dovednosti' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Triky' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Stres' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Následky' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Deník / Poznámky' })).toBeInTheDocument();
  });

  it('má Hlavní koncept + Problém a NEMÁ Přístupy (to je FAE)', () => {
    render(<FateSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    expect(screen.getByLabelText('Hlavní koncept')).toBeInTheDocument();
    expect(screen.getByLabelText('Problém')).toBeInTheDocument();
    expect(screen.queryByText('Pečlivě')).not.toBeInTheDocument();
  });

  it('Následky mají 3 sloty (Drobný 2 / Mírný 4 / Vážný 6)', () => {
    render(<FateSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    expect(screen.getByText('Drobný')).toBeInTheDocument();
    expect(screen.getByText('Mírný')).toBeInTheDocument();
    expect(screen.getByText('Vážný')).toBeInTheDocument();
  });

  it('+ Nová dovednost zapíše fate_skills (prefix fate_)', () => {
    const onChange = vi.fn();
    render(<FateSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Nová dovednost'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: { fate_skills: JSON.stringify([{ name: '', val: '0' }]) },
    });
  });

  it('view mode disabluje inputy a skryje + tlačítka', () => {
    render(<FateSheet {...commonProps} diary={makeDiary()} mode="view" />);
    expect(screen.getByLabelText('Hlavní koncept')).toBeDisabled();
    expect(screen.queryByText('+ Nová dovednost')).not.toBeInTheDocument();
  });
});
