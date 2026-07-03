import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import type { PropsWithChildren } from 'react';

// Spec 15.7 — anon nevidí slepé odkazy (Vytvořit svět / Diskuze / Camp),
// ale vidí veřejné položky + Hospodu. Mockujeme jen hooky, které SidebarContent
// volá při renderu (data nejsou předmětem testu, jen gating položek).
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

describe('SidebarContent — anon gating (15.7)', () => {
  it('anon nevidí Vytvořit svět / Diskuze / Camp, vidí veřejné + Hospodu', () => {
    renderSidebar(false);
    expect(screen.queryByText('Vytvořit svět')).toBeNull();
    expect(screen.queryByText('Diskuze')).toBeNull();
    expect(screen.queryByText('Camp I.')).toBeNull();
    expect(screen.getByText('Úvodník')).toBeInTheDocument();
    expect(screen.getByText('Články')).toBeInTheDocument();
    expect(screen.getByText('Galerie')).toBeInTheDocument();
    expect(screen.getByText('Hospoda')).toBeInTheDocument();
  });

  it('přihlášený vidí Vytvořit svět, Diskuze i Camp I.', () => {
    renderSidebar(true);
    expect(screen.getByText('Vytvořit svět')).toBeInTheDocument();
    expect(screen.getByText('Diskuze')).toBeInTheDocument();
    expect(screen.getByText('Camp I.')).toBeInTheDocument();
  });
});
