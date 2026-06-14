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
  // Krok 5.9 — tab „Můj vzhled" (Ctenar+) přidán mezi „Vzhled" a „Členství".
  it('Čtenář vidí Můj vzhled + Členství', () => {
    renderWithRole(WorldRole.Ctenar);
    const labels = screen.getAllByRole('tab').map((t) => t.textContent);
    expect(labels).toEqual(['Můj vzhled', 'Členství']);
  });

  it('Korektor vidí Základní info, Přístup, Šablony, Vzhled, Můj vzhled, Členství', () => {
    renderWithRole(WorldRole.Korektor);
    const labels = screen.getAllByRole('tab').map((t) => t.textContent);
    expect(labels).toEqual([
      'Základní info',
      'Přístup',
      'Šablony',
      'Vzhled',
      'Můj vzhled',
      'Členství',
    ]);
  });

  it('PomocnyPJ vidí navíc Členy, AKJ úrovně a PJ v chatu (11 tabů)', () => {
    renderWithRole(WorldRole.PomocnyPJ);
    expect(screen.getAllByRole('tab')).toHaveLength(11);
    expect(screen.getByRole('tab', { name: /Členové/ })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /AKJ úrovně/ }),
    ).toBeInTheDocument();
    // 6.8-followup — „PJ v chatu" snížen na PomocnyPJ (self „Můj obrázek vedení").
    expect(
      screen.getByRole('tab', { name: /PJ v chatu/ }),
    ).toBeInTheDocument();
  });

  it('Hráč (pod Korektorem) vidí Můj vzhled + Členství', () => {
    renderWithRole(WorldRole.Hrac);
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });
});
