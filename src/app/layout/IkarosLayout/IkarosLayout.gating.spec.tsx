import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import type { PropsWithChildren } from 'react';

// Spec 15.7 + 21.5 — anon nevidí slepé odkazy (Vytvořit svět / Camp), ale vidí
// veřejné položky (Úvodník, RPG systémy, Společná tvorba) + Hospodu. Diskuze/
// Články/Galerie už nejsou samostatné nav položky — sloučeny do „Společná
// tvorba" (21.5). Mockujeme jen hooky, které SidebarContent volá při renderu.
vi.mock('@/features/world/api/useWorlds', () => ({
  usePublicWorlds: () => ({ data: [] }),
  useMyWorlds: () => ({ data: [], isLoading: false, isError: false }),
}));
vi.mock('@/features/chat/api/useGlobalChat', () => ({
  useRoomPresenceCounts: () => ({}),
}));
vi.mock('@/features/users/api/usePendingActions', () => ({
  usePendingActionsCount: () => ({ data: undefined }),
}));

import { SidebarContent } from './IkarosLayout';

function renderSidebar(isAuthenticated: boolean) {
  const store = createStore();
  const Wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter>
      <JotaiProvider store={store}>{children}</JotaiProvider>
    </MemoryRouter>
  );
  return render(<SidebarContent isAuthenticated={isAuthenticated} />, {
    wrapper: Wrapper,
  });
}

describe('SidebarContent — anon gating (15.7 / 21.5)', () => {
  it('anon nevidí Vytvořit svět / Camp, vidí veřejné položky + Putyku', () => {
    renderSidebar(false);
    expect(screen.queryByText('Vytvořit svět')).toBeNull();
    expect(screen.queryByText('Fantasy camp')).toBeNull();
    expect(screen.getByText('Úvodník')).toBeInTheDocument();
    expect(screen.getByText('RPG systémy')).toBeInTheDocument();
    expect(screen.getByText('Společná tvorba')).toBeInTheDocument();
    expect(screen.getByText('Putyka')).toBeInTheDocument();
  });

  it('přihlášený vidí Vytvořit svět, Společnou tvorbu i Fantasy camp', () => {
    renderSidebar(true);
    expect(screen.getByText('Vytvořit svět')).toBeInTheDocument();
    expect(screen.getByText('Společná tvorba')).toBeInTheDocument();
    expect(screen.getByText('Fantasy camp')).toBeInTheDocument();
  });
});
