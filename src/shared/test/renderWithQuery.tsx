import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * D-067 — render pro komponenty, které (samy nebo přes vnořené sekce) volají
 * React Query. Bez providera padá celý soubor na „No QueryClient set", takže
 * testy musely ručně `vi.mock`-ovat každou embedovanou sekci s hookem — seznam
 * rostl s každou novou sekcí a nic ho nevynucovalo (viz OverviewTab, 20.6).
 *
 * `retry: false` — bez něj by neúspěšný dotaz v jsdom držel test 3 pokusy.
 * Nová `QueryClient` na každý render → žádný cache leak mezi testy.
 */

export interface RenderWithQueryOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Počáteční routa pro `MemoryRouter` (default `/`). */
  route?: string;
  /** Vypnout `MemoryRouter` — pro komponenty bez odkazů/routingu. */
  router?: boolean;
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithQuery(
  ui: ReactElement,
  { route = '/', router = true, ...options }: RenderWithQueryOptions = {},
) {
  const queryClient = createTestQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {router ? (
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      ) : (
        children
      )}
    </QueryClientProvider>
  );

  return { queryClient, ...render(ui, { wrapper, ...options }) };
}
