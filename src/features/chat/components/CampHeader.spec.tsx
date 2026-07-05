import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CampHeader } from './CampHeader';
import type { RoomEnvironment } from '../lib/types';

const env: RoomEnvironment = { style: 'fantasy', placeId: '5' };

function setup(over: Partial<Parameters<typeof CampHeader>[0]> = {}) {
  const onChange = vi.fn();
  const onToggleDesc = vi.fn();
  const onSaveGame = vi.fn();
  const onLoadGame = vi.fn();
  render(
    <CampHeader
      environment={env}
      canEdit
      onChange={onChange}
      descOpen={false}
      onToggleDesc={onToggleDesc}
      defaultStyle="fantasy"
      onSaveGame={onSaveGame}
      onLoadGame={onLoadGame}
      canSaveGame
      hasSavedGame
      {...over}
    />,
  );
  return { onChange, onToggleDesc, onSaveGame, onLoadGame };
}

describe('CampHeader', () => {
  it('staff: žánr je select (labely Fantasy/Mystery/Sci-fi) + lokace select', () => {
    setup();
    // Žánr select — hodnota fantasy → label „Fantasy".
    expect(screen.getByDisplayValue('Fantasy')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mlžné hřbitovní návrší')).toBeInTheDocument();
    // Mystery label (ne „Mystika") ze žánrového kontraktu.
    expect(
      screen.getByRole('option', { name: 'Mystery' }),
    ).toBeInTheDocument();
  });

  it('staff: změna žánru resetuje lokaci na 1', () => {
    const { onChange } = setup();
    fireEvent.change(screen.getByDisplayValue('Fantasy'), {
      target: { value: 'scifi' },
    });
    expect(onChange).toHaveBeenCalledWith({ style: 'scifi', placeId: '1' });
  });

  it('staff: změna lokace zachová žánr', () => {
    const { onChange } = setup();
    fireEvent.change(screen.getByDisplayValue('Mlžné hřbitovní návrší'), {
      target: { value: '12' },
    });
    expect(onChange).toHaveBeenCalledWith({ style: 'fantasy', placeId: '12' });
  });

  it('staff: odznáček „dočasně" jen když se žánr liší od domovského', () => {
    const { rerender } = renderStaff({ defaultStyle: 'fantasy' });
    expect(screen.queryByText(/dočasně/)).not.toBeInTheDocument();
    // Override — aktuální žánr ≠ domovský.
    rerender('scifi', 'fantasy');
    expect(screen.getByText(/dočasně/)).toBeInTheDocument();
  });

  it('hráč: žánr je štítek (read-only), lokace statický název + hint', () => {
    setup({ canEdit: false });
    // Žádný žánr select — jen štítek.
    expect(screen.queryByDisplayValue('Fantasy')).not.toBeInTheDocument();
    expect(screen.getByText('Fantasy')).toBeInTheDocument();
    expect(screen.getByText('Camp')).toBeInTheDocument();
    // Lokace jako statický text (ne select).
    expect(screen.getByText('Mlžné hřbitovní návrší')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Mlžné hřbitovní návrší')).not.toBeInTheDocument();
    expect(screen.getByText('Scénu řídí správci')).toBeInTheDocument();
  });

  it('tlačítko Uložit hru je disabled u prázdného logu', () => {
    setup({ canSaveGame: false });
    expect(screen.getByRole('button', { name: /Uložit hru/ })).toBeDisabled();
  });

  it('tlačítko Načíst hru je disabled bez uloženého slotu', () => {
    setup({ hasSavedGame: false });
    expect(screen.getByRole('button', { name: /Načíst hru/ })).toBeDisabled();
  });

  it('kliky na Uložit/Načíst volají handlery', () => {
    const { onSaveGame, onLoadGame } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Uložit hru/ }));
    fireEvent.click(screen.getByRole('button', { name: /Načíst hru/ }));
    expect(onSaveGame).toHaveBeenCalledTimes(1);
    expect(onLoadGame).toHaveBeenCalledTimes(1);
  });

  it('tlačítko popisu přepíná panel', () => {
    const { onToggleDesc } = setup();
    fireEvent.click(screen.getByLabelText('Popis místa'));
    expect(onToggleDesc).toHaveBeenCalled();
  });
});

// Pomocník pro override test — přerenderuje s jinými žánry.
function renderStaff(over: { defaultStyle: 'fantasy' | 'scifi' | 'mystic' }) {
  const props = {
    environment: { style: 'fantasy', placeId: '5' } as RoomEnvironment,
    canEdit: true,
    onChange: vi.fn(),
    descOpen: false,
    onToggleDesc: vi.fn(),
    onSaveGame: vi.fn(),
    onLoadGame: vi.fn(),
    canSaveGame: true,
    hasSavedGame: true,
    ...over,
  };
  const utils = render(<CampHeader {...props} />);
  return {
    rerender: (style: 'fantasy' | 'scifi' | 'mystic', def: typeof over.defaultStyle) =>
      utils.rerender(
        <CampHeader
          {...props}
          environment={{ style, placeId: '5' }}
          defaultStyle={def}
        />,
      ),
  };
}
