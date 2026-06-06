import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactionsRow, REACTION_EMOJIS } from '../ReactionsRow';

describe('ReactionsRow', () => {
  it('vykreslí 6 chipů (sada emoji)', () => {
    render(
      <ReactionsRow
        reactions={{}}
        currentUserId="u1"
        onToggle={vi.fn()}
      />,
    );
    const chips = screen.getAllByRole('button');
    expect(chips).toHaveLength(REACTION_EMOJIS.length);
  });

  it('zobrazí count u reakce s ≥1 userem', () => {
    render(
      <ReactionsRow
        reactions={{ '👍': ['u1', 'u2', 'u3'] }}
        currentUserId="u1"
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('chip s aktivní reakcí (currentUser ji dal) má aria-pressed=true', () => {
    render(
      <ReactionsRow
        reactions={{ '❤️': ['u1', 'u2'] }}
        currentUserId="u1"
        onToggle={vi.fn()}
      />,
    );
    const heart = screen.getByLabelText(/❤️/);
    expect(heart.getAttribute('aria-pressed')).toBe('true');
  });

  it('klik chip volá onToggle s daným emoji', () => {
    const onToggle = vi.fn();
    render(
      <ReactionsRow
        reactions={{}}
        currentUserId="u1"
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByLabelText(/😂/));
    expect(onToggle).toHaveBeenCalledWith('😂');
  });

  it('reactions undefined (legacy komentář) → nespadne, 6 ghost chipů', () => {
    // Regrese: legacy komentář bez pole `reactions` shazoval celou stránku akce
    // (`Cannot read properties of undefined (reading '👍')`).
    render(
      <ReactionsRow reactions={undefined} currentUserId="u1" onToggle={vi.fn()} />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(REACTION_EMOJIS.length);
  });

  it('hidden=true → render null', () => {
    const { container } = render(
      <ReactionsRow
        reactions={{}}
        currentUserId="u1"
        onToggle={vi.fn()}
        hidden
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('pending=true → všechny chipy disabled', () => {
    render(
      <ReactionsRow
        reactions={{}}
        currentUserId="u1"
        onToggle={vi.fn()}
        pending
      />,
    );
    for (const chip of screen.getAllByRole('button')) {
      expect(chip).toBeDisabled();
    }
  });

  it('bez currentUserId → chipy disabled (anon nemůže reagovat)', () => {
    render(
      <ReactionsRow reactions={{}} currentUserId={null} onToggle={vi.fn()} />,
    );
    for (const chip of screen.getAllByRole('button')) {
      expect(chip).toBeDisabled();
    }
  });
});
