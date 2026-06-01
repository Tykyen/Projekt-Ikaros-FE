import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UniverseDetail } from './UniverseDetail';
import type { UniverseNode, UniverseLink } from '../types';

function n(id: string, extra: Partial<UniverseNode> = {}): UniverseNode {
  return {
    id,
    name: id,
    color: '#fff',
    size: 5,
    isPublic: true,
    visibleToPlayerIds: [],
    ...extra,
  };
}

const nodes = [
  n('a', { name: 'Alfa', alliance: 'Aliance', pageSlug: 'alfa' }),
  n('b', { name: 'Beta' }),
];
const links: UniverseLink[] = [{ source: 'a', target: 'b', isOrbit: true }];

function renderDetail(props: Partial<Parameters<typeof UniverseDetail>[0]> = {}) {
  return render(
    <MemoryRouter>
      <UniverseDetail
        node={nodes[0]}
        nodes={nodes}
        links={links}
        worldSlug="svet1"
        isPJ={false}
        onSelectNode={() => {}}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('UniverseDetail', () => {
  it('zobrazí jméno, frakci a wiki odkaz na pageSlug', () => {
    renderDetail();
    expect(screen.getByText('Alfa')).toBeInTheDocument();
    expect(screen.getByText('Aliance')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /wiki/i });
    expect(link).toHaveAttribute('href', '/svet/svet1/alfa');
  });

  it('listuje spojení a proklik volá onSelectNode', () => {
    const onSelect = vi.fn();
    renderDetail({ onSelectNode: onSelect });
    const btn = screen.getByRole('button', { name: /Beta/ });
    fireEvent.click(btn);
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('PJ quick-toggle viditelnosti se zobrazí jen s callbackem', () => {
    const onToggle = vi.fn();
    renderDetail({ isPJ: true, onToggleVisibility: onToggle });
    const btn = screen.getByRole('button', { name: /Skrýt/ });
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledWith(nodes[0]);
  });

  it('hráč (isPJ false) toggle nevidí', () => {
    renderDetail({ isPJ: false, onToggleVisibility: vi.fn() });
    expect(screen.queryByRole('button', { name: /Skrýt|Zveřejnit/ })).toBeNull();
  });
});
