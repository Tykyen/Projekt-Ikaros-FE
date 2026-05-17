import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WorldRole } from '@/shared/types';
import WorldSettingsPage from '../WorldSettingsPage';

const mockCtx = vi.hoisted(() => ({
  current: {
    world: { id: 'w1', name: 'Testovací svět' },
    worldId: 'w1',
    worldSlug: 'test',
    // WorldRole.PJ = 5; enum nelze v hoisted bloku referencovat.
    userRole: 5 as number,
    isPJ: true,
    character: null,
    loading: false,
  },
}));

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => mockCtx.current,
}));

function renderWithRole(role: WorldRole) {
  mockCtx.current = { ...mockCtx.current, userRole: role };
  return render(
    <MemoryRouter>
      <WorldSettingsPage />
    </MemoryRouter>,
  );
}

describe('WorldSettingsPage — gating tabů dle role', () => {
  it('Čtenář vidí jen tab Členství', () => {
    renderWithRole(WorldRole.Ctenar);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent('Členství');
  });

  it('Korektor vidí Základní info, Přístup, Vzhled, Členství', () => {
    renderWithRole(WorldRole.Korektor);
    const labels = screen.getAllByRole('tab').map((t) => t.textContent);
    expect(labels).toEqual([
      'Základní info',
      'Přístup',
      'Vzhled',
      'Členství',
    ]);
  });

  it('PomocnyPJ vidí navíc Členy a AKJ úrovně (6 tabů)', () => {
    renderWithRole(WorldRole.PomocnyPJ);
    expect(screen.getAllByRole('tab')).toHaveLength(6);
    expect(screen.getByRole('tab', { name: /Členové/ })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /AKJ úrovně/ }),
    ).toBeInTheDocument();
  });

  it('Hráč (pod Korektorem) vidí jen Členství', () => {
    renderWithRole(WorldRole.Hrac);
    expect(screen.getAllByRole('tab')).toHaveLength(1);
  });
});
