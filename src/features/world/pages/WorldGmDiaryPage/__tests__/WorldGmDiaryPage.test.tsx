/**
 * 10.2l — smoke test stránky deníku PJ (loading → render papíru + titulek).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorldGmDiaryPage } from '../WorldGmDiaryPage';

const mockUseGmNotes = vi.fn();
const mockUseUpdateGmNotes = vi.fn(() => ({ mutateAsync: vi.fn() }));

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ worldId: 'w1', world: { name: 'Aerie' } }),
}));
vi.mock('@/features/world/tactical-map/api/useGmNotes', () => ({
  useGmNotes: (...a: unknown[]) => mockUseGmNotes(...a),
  useUpdateGmNotes: (...a: unknown[]) => mockUseUpdateGmNotes(...a),
}));
vi.mock('@/shared/ui/RichTextEditor', () => ({
  RichTextEditor: ({ value }: { value: string }) => (
    <textarea aria-label="editor" defaultValue={value} />
  ),
}));

beforeEach(() => {
  mockUseGmNotes.mockReset();
  mockUseUpdateGmNotes.mockClear();
});

describe('WorldGmDiaryPage', () => {
  it('loading → spinner, žádný papír', () => {
    mockUseGmNotes.mockReturnValue({ data: undefined, isLoading: true });
    render(<WorldGmDiaryPage />);
    expect(screen.queryByLabelText('editor')).not.toBeInTheDocument();
  });

  it('data → titulek, název světa a papír s obsahem', () => {
    mockUseGmNotes.mockReturnValue({
      data: { content: 'tajné poznámky' },
      isLoading: false,
    });
    render(<WorldGmDiaryPage />);
    expect(screen.getByRole('heading', { name: 'Deník PJ' })).toBeInTheDocument();
    expect(screen.getByText('Aerie')).toBeInTheDocument();
    expect(screen.getByLabelText('editor')).toHaveValue('tajné poznámky');
  });

  it('useGmNotes voláno s worldId a enabled=true', () => {
    mockUseGmNotes.mockReturnValue({ data: { content: '' }, isLoading: false });
    render(<WorldGmDiaryPage />);
    expect(mockUseGmNotes).toHaveBeenCalledWith('w1', true);
  });
});
