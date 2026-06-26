/**
 * 16.2b-chat (D-NEW-CHAT-BESTIE-MATRIX-UNIFY) — MatrixChatBestiePanel tests.
 * Klik na schopnost = hod 4dF + stupeň (žádná ikona kostky). Iniciativa = 4dF +
 * bonus → onPatch initiative (souboj lišta). HP klik ± → onPatch health.current.
 * Katalog (bez onPatch) = read-only (žádné HP kroky, žádný edit), hody jedou.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatrixChatBestiePanel } from '../MatrixChatBestiePanel';

const mockOnRoll = vi.fn();
vi.mock('../useChatDiaryRoll', () => ({
  useChatDiaryRoll:
    () => () => (req: unknown, onResult?: (t: number) => void) => {
      mockOnRoll(req);
      onResult?.(99);
    },
}));

const systemStats = {
  'health.max': 10,
  'health.current': 8,
  'initiative.base': 2,
};
const abilities = [
  { name: 'Úder', description: '3' },
  { name: 'Skok', description: '1' },
];

const base = {
  worldId: 'w1',
  channelId: 'c1',
  systemId: 'matrix',
  rollerName: 'Stín',
  systemStats,
  abilities,
  notes: 'Mlha v ulicích.',
};

beforeEach(() => mockOnRoll.mockReset());

describe('MatrixChatBestiePanel', () => {
  it('klik na schopnost → onRoll 4dF + stupeň', () => {
    render(<MatrixChatBestiePanel {...base} canEdit onPatch={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Hodit Úder'));
    expect(mockOnRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'fate', modifier: 3 }),
    );
  });

  it('iniciativa → onRoll 4dF + bonus', () => {
    render(<MatrixChatBestiePanel {...base} canEdit onPatch={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Hodit iniciativu (4dF + 2)'));
    expect(mockOnRoll).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'fate', modifier: 2 }),
    );
  });

  it('iniciativa → onPatch initiative s výsledkem hodu', () => {
    const onPatch = vi.fn();
    render(<MatrixChatBestiePanel {...base} canEdit onPatch={onPatch} />);
    fireEvent.click(screen.getByTitle('Hodit iniciativu (4dF + 2)'));
    expect(onPatch).toHaveBeenCalledWith({ initiative: 99 });
  });

  it('HP −1 → onPatch upraví health.current', () => {
    const onPatch = vi.fn();
    render(<MatrixChatBestiePanel {...base} canEdit onPatch={onPatch} />);
    fireEvent.click(screen.getByLabelText('Životy -1'));
    expect(onPatch).toHaveBeenCalledWith(
      expect.objectContaining({
        systemStats: expect.objectContaining({ 'health.current': 7 }),
      }),
    );
  });

  it('popis se zobrazí', () => {
    render(<MatrixChatBestiePanel {...base} canEdit onPatch={vi.fn()} />);
    expect(screen.getByText('Mlha v ulicích.')).toBeInTheDocument();
  });

  it('katalog (bez onPatch) → read-only: žádné HP kroky ani Upravit, hody jedou', () => {
    render(<MatrixChatBestiePanel {...base} canEdit={false} />);
    expect(screen.queryByLabelText('Životy -1')).not.toBeInTheDocument();
    expect(screen.queryByText('✏ Upravit bestii')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Hodit Úder'));
    expect(mockOnRoll).toHaveBeenCalled();
  });

  it('bez aktivní konverzace → schopnosti zamčené', () => {
    render(
      <MatrixChatBestiePanel {...base} channelId={null} canEdit onPatch={vi.fn()} />,
    );
    fireEvent.click(screen.getByLabelText('Hodit Úder'));
    expect(mockOnRoll).not.toHaveBeenCalled();
  });
});
