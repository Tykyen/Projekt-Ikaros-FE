import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NotesTab } from '../components/NotesTab';
import type { CharacterNotes } from '../../api/characters.types';

let mockData: CharacterNotes | undefined;
let mockState = {
  isLoading: false,
  isError: false,
  error: undefined as unknown,
};
const mutate = vi.fn();
const refetchFn = vi.fn();

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ worldId: 'w1' }),
}));
vi.mock('../../api/useCharacterSubdocs', () => ({
  useCharacterNotes: () => ({
    data: mockData,
    isLoading: mockState.isLoading,
    isError: mockState.isError,
    error: mockState.error,
    refetch: refetchFn,
  }),
}));
vi.mock('../../api/useCharacterMutations', () => ({
  useUpdateCharacterNotes: () => ({ mutate, isPending: false }),
}));
vi.mock('@/shared/ui/RichTextEditor', () => ({
  RichTextEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange?: (v: string) => void;
  }) => (
    <textarea
      data-testid="rte"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

const noop = () => {};

describe('NotesTab (8.1e + D-NEW-notes-inline)', () => {
  beforeEach(() => {
    mockData = { id: 'n1', characterId: 'c1', content: '<p>Tajná zpráva.</p>' };
    mockState = { isLoading: false, isError: false, error: undefined };
    mutate.mockClear();
    refetchFn.mockClear();
    vi.useFakeTimers();
  });

  it('zobrazí obsah poznámek (inline edit, žádný edit toggle)', () => {
    render(
      <NotesTab
        slug="aragorn"
        mode="view"
        onExitEdit={noop}
        onDirtyChange={noop}
      />,
    );
    expect(screen.getByTestId('rte')).toHaveValue('<p>Tajná zpráva.</p>');
    expect(screen.getByText('Poznámky')).toBeInTheDocument();
  });

  it('prázdné poznámky — zobrazí prázdný editor, žádná hláška „prázdné"', () => {
    mockData = { id: 'n1', characterId: 'c1', content: '' };
    render(
      <NotesTab
        slug="aragorn"
        mode="view"
        onExitEdit={noop}
        onDirtyChange={noop}
      />,
    );
    // Inline = textarea pořád viditelná, prázdná
    expect(screen.getByTestId('rte')).toHaveValue('');
  });

  it('inline edit — změna nahlásí dirty + po debounce vyvolá mutate', () => {
    const onDirtyChange = vi.fn();
    render(
      <NotesTab
        slug="aragorn"
        mode="view"
        onExitEdit={noop}
        onDirtyChange={onDirtyChange}
      />,
    );
    fireEvent.change(screen.getByTestId('rte'), {
      target: { value: '<p>Nová zpráva.</p>' },
    });
    expect(onDirtyChange).toHaveBeenCalledWith(true);
    // Status indicator „Nezapsáno…"
    expect(screen.getByText('Nezapsáno…')).toBeInTheDocument();
    // Po 800ms debounce mutate vyvolán
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(mutate).toHaveBeenCalledWith(
      { content: '<p>Nová zpráva.</p>' },
      expect.anything(),
    );
  });

  it('error state → SubdocErrorState s retry', () => {
    mockData = undefined;
    mockState = {
      isLoading: false,
      isError: true,
      error: new Error('boom'),
    };
    render(
      <NotesTab
        slug="aragorn"
        mode="view"
        onExitEdit={noop}
        onDirtyChange={noop}
      />,
    );
    expect(screen.getByText('Načtení se nepodařilo.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Zkusit znovu'));
    expect(refetchFn).toHaveBeenCalled();
  });
});
