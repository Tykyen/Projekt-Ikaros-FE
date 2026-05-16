import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypingIndicator } from './TypingIndicator';
import { typingLabel } from '../lib/typing';

describe('typingLabel', () => {
  it('1 píšící — „píše"', () => {
    expect(typingLabel(['Alice'])).toBe('Alice píše…');
  });

  it('2 píšící — „píšou"', () => {
    expect(typingLabel(['Alice', 'Bob'])).toBe('Alice a Bob píšou…');
  });

  it('3 píšící — „1 další"', () => {
    expect(typingLabel(['Alice', 'Bob', 'Cyril'])).toBe(
      'Alice, Bob a 1 další píšou…',
    );
  });

  it('5+ dalších — skloňování „dalších"', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G']; // 5 dalších
    expect(typingLabel(names)).toBe('A, B a 5 dalších píšou…');
  });
});

describe('TypingIndicator', () => {
  it('prázdný seznam → nic nevykreslí', () => {
    const { container } = render(<TypingIndicator names={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('vykreslí popisek píšícího', () => {
    render(<TypingIndicator names={['Tyky']} />);
    expect(screen.getByText('Tyky píše…')).toBeInTheDocument();
  });
});
