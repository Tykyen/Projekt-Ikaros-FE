import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorldStubPage } from './WorldStubPage';
import { worldStubMap } from '../worldStubMap';

describe('WorldStubPage', () => {
  it('renderuje název sekce a krok z worldStubMap', () => {
    render(<WorldStubPage area="weather" />);
    expect(screen.getByText(worldStubMap.weather.title)).toBeInTheDocument();
    // krok je v odstavci „... s krokem 9.4."
    expect(screen.getByText(/krokem/)).toHaveTextContent(
      worldStubMap.weather.step,
    );
  });

  it('renderuje poznámku, když ji sekce má', () => {
    render(<WorldStubPage area="chat" />);
    expect(screen.getByText(worldStubMap.chat.note!)).toBeInTheDocument();
  });

  it('nerenderuje poznámku, když sekce note nemá', () => {
    const { container } = render(<WorldStubPage area="page-viewer" />);
    // page-viewer nemá note → jen icon + title + lead = 3 přímé děti karty
    expect(worldStubMap['page-viewer'].note).toBeUndefined();
    expect(container.querySelector('section')?.childElementCount).toBe(3);
  });
});
