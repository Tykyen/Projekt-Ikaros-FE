import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import WorldWeatherPage from './WorldWeatherPage';
import { currentUserAtom } from '@/shared/store/authStore';
import { __resetFavoritesCache } from './hooks/useFavorites';
import type { User, WeatherGenerator } from '@/shared/types';

// ── World context mock (mutable role) ────────────────────────────────────
const ctx = vi.hoisted(() => ({ role: 2 as number })); // default Hrac

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({
    worldId: 'w1',
    worldSlug: 'svet',
    world: { id: 'w1', name: 'Krynnská říše' },
    isPJ: false,
    userRole: ctx.role,
    character: null,
    loading: false,
  }),
}));

// ── Hooks mock (data driven) ─────────────────────────────────────────────
const hookData = vi.hoisted(() => ({
  generators: [] as WeatherGenerator[],
  isLoading: false,
  isError: false,
}));

vi.mock('@/features/world/api/useWeatherGenerators', () => ({
  weatherGeneratorsKey: (worldId: string) => ['weather-generators', worldId],
  weatherHistoryKey: (worldId: string, generatorId: string) => [
    'weather-history',
    worldId,
    generatorId,
  ],
  useWeatherGenerators: () => ({
    data: hookData.generators,
    isLoading: hookData.isLoading,
    isError: hookData.isError,
  }),
  useGenerateWeather: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    variables: undefined,
  }),
  useDeleteWeatherGenerator: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
  useReorderGenerators: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  // 9.4 dluh #1
  useAdvanceDay: () => ({
    mutateAsync: vi.fn().mockResolvedValue({
      newInGameDate: '2026-05-27T00:00:00.000Z',
      monthIndex: 4,
      monthName: 'Květen',
      day: 27,
      year: 2026,
      updatedGenerators: [],
    }),
    isPending: false,
  }),
  // 9.4 dluh #2
  useWeatherHistory: () => ({
    data: { items: [], total: 0 },
    isLoading: false,
    isError: false,
    isFetching: false,
  }),
}));

vi.mock('@/features/world/api/useWeatherWsSubscribe', () => ({
  useWeatherWsSubscribe: () => undefined,
}));

// 9.4 dluh #1 — useWorldSettings mock
vi.mock('@/features/world/api/useWorldSettings', () => ({
  useWorldSettings: () => ({
    data: null,
    isLoading: false,
    isError: false,
  }),
}));

// sonner toast — no-op
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Test fixtures ────────────────────────────────────────────────────────
function makeGenerator(
  id: string,
  name: string,
  weatherType = 'clear',
): WeatherGenerator {
  return {
    id,
    worldId: 'w1',
    name,
    description: 'Test lokace',
    displayOrder: 0,
    createdAt: '2026-05-26T10:00:00.000Z',
    updatedAt: '2026-05-26T10:00:00.000Z',
    config: {
      tempMin: -5,
      tempMax: 30,
      tempUnit: 'C',
      weatherTypes: [],
      windMin: 0,
      windMax: 40,
      windGustMultiplier: 1.6,
      pressureMin: 990,
      pressureMax: 1030,
      humidityMin: 30,
      humidityMax: 95,
      customFields: [],
    },
    currentWeather: {
      generatedAt: '2026-05-26T10:00:00.000Z',
      isManual: false,
      temperature: 22,
      tempUnit: 'C',
      weatherType,
      weatherIcon: '☀',
      cloudiness: { value: '2', description: 'Slunečno' },
      precipitation: { value: '0', description: 'Sucho' },
      wind: { speed: 8, gusts: 12, unit: 'kmh' },
      pressure: { value: 1018, trend: 'stoupá' },
      humidity: 45,
      extras: [],
    },
  };
}

// 9.4 dluh #4 — favorites testy vyžadují přihlášeného usera (jinak star button
// se nerenderuje, viz `currentUser?.id ?? null` v WorldWeatherPage).
const authState = vi.hoisted(() => ({ user: null as User | null }));

function wrapper({ children }: PropsWithChildren) {
  const store = createStore();
  store.set(currentUserAtom, authState.user);
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <JotaiProvider store={store}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </JotaiProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  hookData.generators = [];
  hookData.isLoading = false;
  hookData.isError = false;
  ctx.role = 2;
  authState.user = null;
  window.localStorage.clear();
  __resetFavoritesCache();
});

// ── Tests ────────────────────────────────────────────────────────────────
describe('WorldWeatherPage', () => {
  it('vykreslí titulek Počasí', () => {
    render(<WorldWeatherPage />, { wrapper });
    expect(
      screen.getByRole('heading', { name: 'Počasí', level: 1 }),
    ).toBeInTheDocument();
  });

  it('Hrac neuvidí tlačítko Nový generátor ani add-tile', () => {
    ctx.role = 2; // Hrac
    hookData.generators = [makeGenerator('g1', 'Praha')];
    render(<WorldWeatherPage />, { wrapper });
    expect(
      screen.queryByRole('button', { name: /Nový generátor/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /Vytvořit nový generátor počasí/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('PomocnyPJ vidí akce + add-tile', () => {
    ctx.role = 4; // PomocnyPJ
    hookData.generators = [makeGenerator('g1', 'Praha')];
    render(<WorldWeatherPage />, { wrapper });
    // Header button ("Nový generátor") + add-tile (label "Nový generátor"
    // uvnitř button[aria-label="Vytvořit nový generátor počasí"]) — celkem 2 matches.
    expect(
      screen.getAllByRole('button', { name: /Nový generátor/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole('button', {
        name: /Vytvořit nový generátor počasí/i,
      }),
    ).toBeInTheDocument();
    // Card actions (Vygenerovat) visible
    expect(
      screen.getByRole('button', { name: /Vygenerovat/i }),
    ).toBeInTheDocument();
  });

  it('vykreslí multi-generator grid (3 karty)', () => {
    ctx.role = 5; // PJ
    hookData.generators = [
      makeGenerator('g1', 'Hlavní město', 'clear'),
      makeGenerator('g2', 'Severní pobřeží', 'rain'),
      makeGenerator('g3', 'Vrcholy hor', 'storm'),
    ];
    render(<WorldWeatherPage />, { wrapper });
    expect(screen.getByText('Hlavní město')).toBeInTheDocument();
    expect(screen.getByText('Severní pobřeží')).toBeInTheDocument();
    expect(screen.getByText('Vrcholy hor')).toBeInTheDocument();
  });

  it('empty state — PJ vidí velké CTA tlačítko', () => {
    ctx.role = 5;
    hookData.generators = [];
    render(<WorldWeatherPage />, { wrapper });
    expect(
      screen.getByRole('heading', { name: /Zatím žádný generátor/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Vytvořit první generátor/i }),
    ).toBeInTheDocument();
  });

  it('empty state — Hrac vidí info text, ne CTA', () => {
    ctx.role = 2;
    hookData.generators = [];
    render(<WorldWeatherPage />, { wrapper });
    expect(
      screen.getByRole('heading', { name: /Počasí ještě není nastaveno/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Vytvořit první generátor/i }),
    ).not.toBeInTheDocument();
  });

  it('loading stav nezobrazí ani empty state ani grid', () => {
    ctx.role = 5;
    hookData.isLoading = true;
    render(<WorldWeatherPage />, { wrapper });
    // Spinner se render. Empty state ani grid se nezobrazí.
    expect(
      screen.queryByRole('heading', { name: /Zatím žádný generátor/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Nepodařilo se načíst počasí/i),
    ).not.toBeInTheDocument();
  });

  it('error stav zobrazí hlášku', () => {
    ctx.role = 5;
    hookData.isError = true;
    render(<WorldWeatherPage />, { wrapper });
    expect(
      screen.getByText(/Nepodařilo se načíst počasí/i),
    ).toBeInTheDocument();
  });

  // ── 9.4 dluh #4 — Favorites ─────────────────────────────────────────────
  describe('Favorites (localStorage)', () => {
    function mockUser(id: string): User {
      // Minimální cast — page čte pouze `currentUser?.id`.
      return { id } as unknown as User;
    }

    it('favorited karty se sortí v gridu nahoru (před non-favorited)', () => {
      ctx.role = 5;
      authState.user = mockUser('u1');
      // Pre-seed favorites — `g3` je favorited.
      window.localStorage.setItem(
        'weather-favorites:u1:w1',
        JSON.stringify(['g3']),
      );
      hookData.generators = [
        makeGenerator('g1', 'První'),
        makeGenerator('g2', 'Druhý'),
        makeGenerator('g3', 'Třetí oblíbený', 'rain'),
      ];

      render(<WorldWeatherPage />, { wrapper });

      // V DOM by mělo být pořadí: g3, g1, g2 — najdeme všechny `h2.name`
      // a ověříme order.
      const headings = screen
        .getAllByRole('heading', { level: 2 })
        .map((h) => h.textContent);
      expect(headings[0]).toBe('Třetí oblíbený');
      expect(headings[1]).toBe('První');
      expect(headings[2]).toBe('Druhý');
    });

    it('klik na star button přepíše favorites v localStorage', () => {
      ctx.role = 5;
      authState.user = mockUser('u1');
      hookData.generators = [makeGenerator('g1', 'Praha')];

      render(<WorldWeatherPage />, { wrapper });

      const star = screen.getByRole('button', {
        name: /Přidat do oblíbených/i,
      });
      fireEvent.click(star);

      const raw = window.localStorage.getItem('weather-favorites:u1:w1');
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw!)).toEqual(['g1']);
    });

    it('bez přihlášeného usera se star button nerenderuje', () => {
      ctx.role = 5;
      authState.user = null;
      hookData.generators = [makeGenerator('g1', 'Praha')];

      render(<WorldWeatherPage />, { wrapper });

      expect(
        screen.queryByRole('button', { name: /oblíbených/i }),
      ).not.toBeInTheDocument();
    });

    it('smazaný generátor (mizí z generators) — favorite ID v localStorage zůstává ale nepůsobí', () => {
      ctx.role = 5;
      authState.user = mockUser('u1');
      // Edge case: PJ smaže favorited generátor. ID v localStorage zůstává
      // (lazy cleanup), ale sort se vůbec nezavolá protože matching ID není
      // v `rawGenerators`. UI nespadne, jen ten orphan favorite je benign.
      window.localStorage.setItem(
        'weather-favorites:u1:w1',
        JSON.stringify(['g-deleted', 'g2']),
      );
      hookData.generators = [
        makeGenerator('g1', 'První'),
        makeGenerator('g2', 'Druhý'),
      ];

      render(<WorldWeatherPage />, { wrapper });

      // g2 je stále favorited → sort nahoru, g1 zůstává druhý.
      const headings = screen
        .getAllByRole('heading', { level: 2 })
        .map((h) => h.textContent);
      expect(headings[0]).toBe('Druhý');
      expect(headings[1]).toBe('První');
    });
  });
});
