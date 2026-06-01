import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { UniverseMapView } from './UniverseMapView';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import type { UniverseMap } from './types';

// --- mocky externích závislostí ---
let fgProps: Record<string, unknown> | null = null;
vi.mock('react-force-graph-3d', () => ({
  default: (props: Record<string, unknown>) => {
    fgProps = props;
    return <div data-testid="fg" />;
  },
}));

vi.mock('@/features/chat/api/socket', () => ({
  getSocket: () => ({ emit: vi.fn(), on: vi.fn(), off: vi.fn() }),
}));

const ctx = { worldId: 'w1', worldSlug: 'svet1', isPJ: true };
vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ctx,
}));

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), put: vi.fn(), patch: vi.fn() },
}));

const map: UniverseMap = {
  id: 'm',
  worldId: 'w1',
  nodes: [
    {
      id: 'a',
      name: 'Alfa',
      type: 'planet',
      color: '#fff',
      size: 5,
      isPublic: true,
      visibleToPlayerIds: [],
    },
  ],
  links: [],
};

beforeEach(() => {
  fgProps = null;
  ctx.isPJ = true;
  vi.clearAllMocks();
  vi.mocked(api.get).mockImplementation((url: string) =>
    Promise.resolve(url.startsWith('/universe') ? map : []),
  );
  // jsdom: ResizeObserver + nenulové rozměry
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    value: 800,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    value: 600,
  });
});

function renderView() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const store = createStore();
  store.set(accessTokenAtom, 'tok');
  const wrapper = ({ children }: PropsWithChildren) => (
    <JotaiProvider store={store}>
      <MemoryRouter>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </MemoryRouter>
    </JotaiProvider>
  );
  return render(<UniverseMapView />, { wrapper });
}

describe('UniverseMapView', () => {
  it('view mód: zobrazí panel se searchem a načte data do grafu', async () => {
    renderView();
    expect(screen.getByText('Mapa vesmíru')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Vyhledat/)).toBeInTheDocument();
    await waitFor(() =>
      expect((fgProps?.graphData as UniverseMap)?.nodes).toHaveLength(1),
    );
  });

  it('PJ přepne do edit módu → ukáže editor + zapne node drag', async () => {
    renderView();
    await waitFor(() => expect(fgProps?.enableNodeDrag).toBe(false));
    fireEvent.click(screen.getByTitle('Editační režim'));
    expect(screen.getByText('Nové těleso')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Uložit mapu/ })).toBeInTheDocument();
    await waitFor(() => expect(fgProps?.enableNodeDrag).toBe(true));
  });

  it('hráč (isPJ false) nevidí přepínač editace', () => {
    ctx.isPJ = false;
    renderView();
    expect(screen.queryByTitle('Editační režim')).toBeNull();
  });
});
