import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameEventCommentsFooter } from '../GameEventCommentsFooter';

describe('GameEventCommentsFooter', () => {
  it('count=0 → label „Komentovat"', () => {
    render(
      <GameEventCommentsFooter
        commentCount={0}
        expanded={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('Komentovat')).toBeInTheDocument();
  });

  it('count=1 → singulár „komentář"', () => {
    render(
      <GameEventCommentsFooter
        commentCount={1}
        expanded={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('1 komentář')).toBeInTheDocument();
  });

  it('count=3 → paukal „komentáře"', () => {
    render(
      <GameEventCommentsFooter
        commentCount={3}
        expanded={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('3 komentáře')).toBeInTheDocument();
  });

  it('count=10 → plurál „komentářů"', () => {
    render(
      <GameEventCommentsFooter
        commentCount={10}
        expanded={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('10 komentářů')).toBeInTheDocument();
  });

  it('commentCount undefined → label „Komentáře" (list query nedává count)', () => {
    render(
      <GameEventCommentsFooter expanded={false} onToggle={vi.fn()} />,
    );
    expect(screen.getByText('Komentáře')).toBeInTheDocument();
  });

  it('expanded=true → aria-expanded=true', () => {
    render(
      <GameEventCommentsFooter
        commentCount={0}
        expanded
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe(
      'true',
    );
  });

  it('klik footer volá onToggle', () => {
    const onToggle = vi.fn();
    render(
      <GameEventCommentsFooter
        commentCount={0}
        expanded={false}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
