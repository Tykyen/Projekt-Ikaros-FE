import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FaeSheet } from '../FaeSheet';
import type { CharacterDiary } from '../../../../../api/characters.types';

vi.mock('@/features/world/export/print', () => ({ usePrintMode: () => false }));
vi.mock('@/features/world/pages/api/useCharacter', () => ({
  useCharacter: () => ({ data: { name: 'Shayra' } }),
}));

function makeDiary(customData: Record<string, unknown> = {}): CharacterDiary {
  return { id: 'd1', characterId: 'c1', worldId: 'w1', sections: [], customData };
}

const commonProps = { worldId: 'w1', worldSlug: 'testw', characterSlug: 'fae1' };

describe('FaeSheet (Fate Accelerated)', () => {
  it('vyrenderuje 6 fixních Přístupů (Pečlivě…Lstivě), ne Dovednosti', () => {
    render(<FaeSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Přístupy' })).toBeInTheDocument();
    ['Pečlivě', 'Chytře', 'Oslnivě', 'Rázně', 'Rychle', 'Lstivě'].forEach((l) =>
      expect(screen.getByText(l)).toBeInTheDocument(),
    );
    expect(screen.queryByRole('heading', { name: 'Dovednosti' })).not.toBeInTheDocument();
  });

  it('stres má defaultně 3 čtverečky', () => {
    render(<FaeSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={() => {}} />);
    expect(screen.getByLabelText('Stres 1 volný')).toBeInTheDocument();
    expect(screen.getByLabelText('Stres 2 volný')).toBeInTheDocument();
    expect(screen.getByLabelText('Stres 3 volný')).toBeInTheDocument();
  });

  it('zvýšení přístupu zapíše fae_appr_careful (prefix fae_)', () => {
    const onChange = vi.fn();
    render(<FaeSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Pečlivě +'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: { fae_appr_careful: '1' },
    });
  });

  it('+ Další aspekt zapíše fae_aspects', () => {
    const onChange = vi.fn();
    render(<FaeSheet {...commonProps} diary={makeDiary()} mode="edit" onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Další aspekt'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: { fae_aspects: JSON.stringify([{ name: '' }]) },
    });
  });

  it('view mode disabluje a skryje + tlačítka', () => {
    render(<FaeSheet {...commonProps} diary={makeDiary()} mode="view" />);
    expect(screen.getByLabelText('Hlavní koncept')).toBeDisabled();
    expect(screen.queryByText('+ Další aspekt')).not.toBeInTheDocument();
  });
});
