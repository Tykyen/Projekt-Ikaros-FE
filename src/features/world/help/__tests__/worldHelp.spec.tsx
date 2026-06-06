import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { WorldRole } from '@/shared/types';

// Mock world kontextu — řídíme roli pro WorldToolboxPanel.
const mockCtx = vi.fn();
vi.mock('../../context/WorldContext', () => ({
  useWorldContext: () => mockCtx(),
}));

import { toolboxItemsFor } from '../toolboxItems';
import { TacticalMapHelp } from '../content/TacticalMapHelp';
import { ChatHelp } from '../content/ChatHelp';
import { WorldToolboxPanel } from '../WorldToolboxPanel';

describe('toolboxItemsFor', () => {
  it('PJ vidí nadmnožinu oproti hráči', () => {
    const pj = toolboxItemsFor(true);
    const hrac = toolboxItemsFor(false);
    expect(pj.length).toBeGreaterThan(hrac.length);
    // hráč nevidí PJ-only nástroje
    const hracKeys = hrac.map((i) => i.key);
    expect(hracKeys).not.toContain('scenare');
    expect(hracKeys).not.toContain('denik-pj');
    expect(hracKeys).not.toContain('nastaveni');
    // sdílené vidí oba
    expect(hracKeys).toContain('chat');
    expect(hracKeys).toContain('takticka-mapa');
  });
});

describe('TacticalMapHelp', () => {
  it("audience='pj' ukáže PJ sekci, 'hrac' ne", () => {
    const { rerender } = render(<TacticalMapHelp audience="hrac" />);
    expect(screen.getByText('Základní ovládání')).toBeInTheDocument();
    expect(screen.queryByText('Pro Pána jeskyně')).toBeNull();

    rerender(<TacticalMapHelp audience="pj" />);
    expect(screen.getByText('Pro Pána jeskyně')).toBeInTheDocument();
    expect(screen.getByText('Mlha války')).toBeInTheDocument();
  });
});

describe('ChatHelp', () => {
  it("audience='pj' ukáže PJ sekci, 'hrac' ne", () => {
    const { rerender } = render(<ChatHelp audience="hrac" />);
    expect(screen.getByText('Psaní a zprávy')).toBeInTheDocument();
    expect(screen.queryByText('Pro Pána jeskyně')).toBeNull();

    rerender(<ChatHelp audience="pj" />);
    expect(screen.getByText('Pro Pána jeskyně')).toBeInTheDocument();
    expect(screen.getByText('NPC mód (🎭)')).toBeInTheDocument();
  });
});

describe('WorldToolboxPanel', () => {
  function renderPanel(userRole: WorldRole) {
    mockCtx.mockReturnValue({ worldSlug: 'matrix', userRole });
    return render(
      <MemoryRouter>
        <WorldToolboxPanel />
      </MemoryRouter>,
    );
  }

  it('PJ vidí PJ nástroje i titulek „Co máš jako PJ po ruce"', () => {
    renderPanel(WorldRole.PJ);
    expect(screen.getByText('Co máš jako PJ po ruce')).toBeInTheDocument();
    expect(screen.getByText('Storyboard')).toBeInTheDocument();
    expect(screen.getByText('Nastavení světa')).toBeInTheDocument();
  });

  it('hráč vidí jen svou podmnožinu a titulek „Co můžeš ve světě dělat"', () => {
    renderPanel(WorldRole.Hrac);
    expect(screen.getByText('Co můžeš ve světě dělat')).toBeInTheDocument();
    expect(screen.getByText('Moje postava')).toBeInTheDocument();
    expect(screen.queryByText('Storyboard')).toBeNull();
    expect(screen.queryByText('Nastavení světa')).toBeNull();
  });

  it('dlaždice s odkazem míří do světa', () => {
    renderPanel(WorldRole.Hrac);
    const link = screen.getByText('Chat světa').closest('a');
    expect(link).toHaveAttribute('href', '/svet/matrix/chat');
  });
});
