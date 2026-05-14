import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorldsToolbar } from '../components/WorldsToolbar';

function renderToolbar(overrides: {
  isAuthenticated?: boolean;
  filter?: 'all' | 'public' | 'mine';
  sort?: 'new' | 'abc' | 'seats';
  search?: string;
  onSearchChange?: (v: string) => void;
  onFilterChange?: (v: 'all' | 'public' | 'mine') => void;
  onSortChange?: (v: 'new' | 'abc' | 'seats') => void;
} = {}) {
  return render(
    <WorldsToolbar
      search={overrides.search ?? ''}
      onSearchChange={overrides.onSearchChange ?? (() => {})}
      filter={overrides.filter ?? 'all'}
      onFilterChange={overrides.onFilterChange ?? (() => {})}
      sort={overrides.sort ?? 'new'}
      onSortChange={overrides.onSortChange ?? (() => {})}
      isAuthenticated={overrides.isAuthenticated ?? true}
    />,
  );
}

describe('WorldsToolbar', () => {
  it('logged-in vidí filter Mé světy', () => {
    renderToolbar({ isAuthenticated: true });
    expect(screen.getByRole('button', { name: 'Mé světy' })).toBeInTheDocument();
  });

  it('anon nevidí filter Mé světy', () => {
    renderToolbar({ isAuthenticated: false });
    expect(screen.queryByRole('button', { name: 'Mé světy' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Vše' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Veřejné' })).toBeInTheDocument();
  });

  it('search input volá onSearchChange', () => {
    const onSearchChange = vi.fn();
    renderToolbar({ onSearchChange });
    const input = screen.getByLabelText(/Hledat svět/);
    fireEvent.change(input, { target: { value: 'matrix' } });
    expect(onSearchChange).toHaveBeenCalledWith('matrix');
  });

  it('filter chip klik volá onFilterChange', () => {
    const onFilterChange = vi.fn();
    renderToolbar({ onFilterChange });
    fireEvent.click(screen.getByRole('button', { name: 'Veřejné' }));
    expect(onFilterChange).toHaveBeenCalledWith('public');
  });

  it('aktivní chip má aria-pressed=true', () => {
    renderToolbar({ filter: 'public' });
    expect(screen.getByRole('button', { name: 'Veřejné' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Vše' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('sort select volá onSortChange', () => {
    const onSortChange = vi.fn();
    renderToolbar({ onSortChange });
    const select = screen.getByLabelText(/Řazení/);
    fireEvent.change(select, { target: { value: 'abc' } });
    expect(onSortChange).toHaveBeenCalledWith('abc');
  });
});
