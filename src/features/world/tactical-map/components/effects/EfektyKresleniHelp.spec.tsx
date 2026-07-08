import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EfektyKresleniHelp } from './EfektyKresleniHelp';

describe('EfektyKresleniHelp', () => {
  it('PJ vidí sekci Efekty i Kreslení + „Smazat vše"', () => {
    render(<EfektyKresleniHelp audience="pj" />);
    expect(screen.getByText(/Efekty \(jen PJ\)/i)).toBeInTheDocument();
    expect(screen.getByText('🗑 Koš')).toBeInTheDocument();
    expect(screen.getByText('Smazat vše')).toBeInTheDocument();
  });

  it('hráč nevidí efekty ani „Smazat vše" — jen kreslení', () => {
    render(<EfektyKresleniHelp audience="hrac" />);
    expect(screen.queryByText(/Efekty \(jen PJ\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText('🗑 Koš')).not.toBeInTheDocument();
    expect(screen.queryByText('Smazat vše')).not.toBeInTheDocument();
    // Kreslení má vždy.
    expect(screen.getByText('Smazat moje')).toBeInTheDocument();
  });
});
