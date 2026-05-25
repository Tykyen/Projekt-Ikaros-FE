import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { WorldRole, type EventComment } from '@/shared/types';
import { CommentThread } from '../CommentThread';

vi.mock('@/features/world/api/useGameEvents', () => ({
  useEditComment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteComment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReactToComment: () => ({ mutate: vi.fn(), isPending: false }),
  useAddComment: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function makeComment(over: Partial<EventComment>): EventComment {
  return {
    id: 'c1',
    parentId: null,
    authorId: 'u1',
    authorName: 'Tester',
    content: 'Hello',
    createdAt: '2026-05-25T10:00:00Z',
    editedAt: null,
    reactions: {},
    isDeleted: false,
    ...over,
  };
}

function renderThread(comments: EventComment[]) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createStore();
  return render(
    <JotaiProvider store={store}>
      <QueryClientProvider client={qc}>
        <CommentThread
          comments={comments}
          eventId="e1"
          worldRole={WorldRole.Hrac}
          currentUserId="u1"
        />
      </QueryClientProvider>
    </JotaiProvider>,
  );
}

describe('CommentThread', () => {
  it('root comments DESC (newest nahoře), reply ASC pod root', () => {
    const c = [
      makeComment({
        id: 'r1',
        content: 'První root',
        createdAt: '2026-05-25T10:00:00Z',
      }),
      makeComment({
        id: 'r2',
        content: 'Druhý root',
        createdAt: '2026-05-25T11:00:00Z',
      }),
      makeComment({
        id: 'rep1',
        parentId: 'r1',
        content: 'Reply pozdější',
        createdAt: '2026-05-25T12:00:00Z',
      }),
      makeComment({
        id: 'rep2',
        parentId: 'r1',
        content: 'Reply dřív',
        createdAt: '2026-05-25T10:30:00Z',
      }),
    ];
    renderThread(c);

    const texts = screen.getAllByText(/root|Reply/i).map((el) => el.textContent);
    // Pořadí: Druhý root (newest), První root + jeho reply ASC (dřív, pozdější)
    expect(texts).toEqual([
      'Druhý root',
      'První root',
      'Reply dřív',
      'Reply pozdější',
    ]);
  });

  it('prázdné comments → render null', () => {
    const { container } = renderThread([]);
    expect(container.querySelector('ul')).toBeNull();
  });

  it('smazaný root s reply zobrazí placeholder + reply zůstanou', () => {
    const c = [
      makeComment({
        id: 'r1',
        content: '',
        isDeleted: true,
        createdAt: '2026-05-25T10:00:00Z',
      }),
      makeComment({
        id: 'rep1',
        parentId: 'r1',
        content: 'Reply na smazaný root',
        createdAt: '2026-05-25T10:30:00Z',
      }),
    ];
    renderThread(c);
    expect(screen.getByText(/Komentář byl smazán/)).toBeInTheDocument();
    expect(screen.getByText('Reply na smazaný root')).toBeInTheDocument();
  });
});
