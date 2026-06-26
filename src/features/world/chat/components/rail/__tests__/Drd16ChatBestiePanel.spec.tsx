/**
 * 16.2b-chat — Drd16ChatBestiePanel tests.
 * Útoky/OČ/Iniciativa = d6+ (modifier 0 / číslo útoku / OČ) přes useChatDiaryRoll.
 * HP ± patchne combatanta (onPatch). Katalog (canEdit=false, bez onPatch) =
 * read-only (žádné HP kroky, žádný edit), hody fungují.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drd16ChatBestiePanel } from '../Drd16ChatBestiePanel';

const mockOnRoll = vi.fn();
// Mock: onRoll(req, onResult?) — zaznamená req a simuluje rolled total 99
// (pro test init persistence přes onResult → onPatch).
vi.mock('../useChatDiaryRoll', () => ({
  useChatDiaryRoll:
    () => () => (req: unknown, onResult?: (t: number) => void) => {
      mockOnRoll(req);
      onResult?.(99);
    },
}));

const systemStats = {
  hp: 5,
  defense: 7,
  attacks: [
    { name: 'ostny', value: 3 },
    { name: 'kousnutí', value: 1 },
  ],
  resilience: 16,
  movement: 15,
  movementMode: 'hmyz',
  alignment: 'N',
  experience: 20,
  mindForce: 0,
};

const base = {
  worldId: 'w1',
  channelId: 'c1',
  rollerName: 'Brouk ostnatec',
  systemStats,
  notes: 'Tvrdý pancíř.',
};

beforeEach(() => mockOnRoll.mockReset());

describe('Drd16ChatBestiePanel', () => {
  it('útok → onRoll d6+ + číslo útoku', () => {
    render(<Drd16ChatBestiePanel {...base} canEdit onPatch={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Útok ostny'));
    expect(mockOnRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'd6+', modifier: 3 }),
    );
  });

  it('OČ → onRoll d6+ + OČ', () => {
    render(<Drd16ChatBestiePanel {...base} canEdit onPatch={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Hodit obranu'));
    expect(mockOnRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'd6+', modifier: 7 }),
    );
  });

  it('iniciativa → onRoll d6+ bez bonusu (modifier 0)', () => {
    render(<Drd16ChatBestiePanel {...base} canEdit onPatch={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Hodit iniciativu (d6+)'));
    expect(mockOnRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'd6+', modifier: 0 }),
    );
  });

  it('iniciativa → onPatch initiative s výsledkem hodu (souboj lišta)', () => {
    const onPatch = vi.fn();
    render(<Drd16ChatBestiePanel {...base} canEdit onPatch={onPatch} />);
    fireEvent.click(screen.getByTitle('Hodit iniciativu (d6+)'));
    expect(onPatch).toHaveBeenCalledWith({ initiative: 99 });
  });

  it('HP −1 → onPatch upraví systemStats.hp', () => {
    const onPatch = vi.fn();
    render(<Drd16ChatBestiePanel {...base} canEdit onPatch={onPatch} />);
    fireEvent.click(screen.getByLabelText('Životy -1'));
    expect(onPatch).toHaveBeenCalledWith(
      expect.objectContaining({
        systemStats: expect.objectContaining({ hp: 4 }),
      }),
    );
  });

  it('read-only staty + popis se zobrazí', () => {
    render(<Drd16ChatBestiePanel {...base} canEdit onPatch={vi.fn()} />);
    expect(screen.getByText('Vlastnosti & chování')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument(); // Odolnost
    expect(screen.getByText('hmyz')).toBeInTheDocument(); // způsob pohybu
    expect(screen.getByText('Popis')).toBeInTheDocument();
    expect(screen.getByText('Tvrdý pancíř.')).toBeInTheDocument();
  });

  it('katalog (bez onPatch) → read-only: žádné HP kroky ani Upravit, hody jedou', () => {
    render(<Drd16ChatBestiePanel {...base} canEdit={false} />);
    expect(screen.queryByLabelText('Životy -1')).not.toBeInTheDocument();
    expect(screen.queryByText('✏ Upravit bestii')).not.toBeInTheDocument();
    // hod stále funkční (PJ katalog)
    fireEvent.click(screen.getByLabelText('Útok ostny'));
    expect(mockOnRoll).toHaveBeenCalled();
  });

  it('bez aktivní konverzace (channelId null) → bez iniciativy, útoky zamčené', () => {
    render(
      <Drd16ChatBestiePanel {...base} channelId={null} canEdit onPatch={vi.fn()} />,
    );
    expect(
      screen.queryByTitle('Hodit iniciativu (d6+)'),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Útok ostny'));
    expect(mockOnRoll).not.toHaveBeenCalled();
  });
});
