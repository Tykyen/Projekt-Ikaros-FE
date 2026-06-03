import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CharacterCard } from '../components/CharacterCard';

const baseEntry = {
  id: 'c1',
  slug: 'frodo',
  name: 'Frodo',
  isNpc: false,
  kind: 'persona' as const,
};

function renderCard(props: Parameters<typeof CharacterCard>[0]) {
  return render(
    <MemoryRouter>
      <CharacterCard {...props} />
    </MemoryRouter>,
  );
}

describe('CharacterCard (8.2e)', () => {
  it('PC: zobrazí jméno, badge "Hráčská postava" a jméno hráče', () => {
    renderCard({
      entry: { ...baseEntry, userId: 'u1' },
      worldSlug: 'matrix',
      playerName: 'Tyky',
    });
    expect(screen.getByText('Frodo')).toBeInTheDocument();
    expect(screen.getByText('Hráčská postava')).toBeInTheDocument();
    expect(screen.getByText('Tyky')).toBeInTheDocument();
  });

  it('NPC: badge "NPC", bez řádku hráče (i kdyby playerName přišlo)', () => {
    renderCard({
      entry: { ...baseEntry, name: 'Drak', isNpc: true },
      worldSlug: 'matrix',
      playerName: 'irrelevant',
    });
    expect(screen.getByText('NPC')).toBeInTheDocument();
    expect(screen.queryByText('irrelevant')).not.toBeInTheDocument();
  });

  // 9.1 (cleanup) — Lokace odstraněny z adresáře postav (PageType 'Lokace'
  // v /stranky); test pro lokační kartu odstraněn.

  it('karta je odkaz na detail /svet/<slug>/<slug> (9.1 sjednocení)', () => {
    renderCard({ entry: baseEntry, worldSlug: 'matrix' });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/svet/matrix/frodo');
  });
});
