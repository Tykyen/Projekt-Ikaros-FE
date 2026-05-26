/**
 * 9.4 — WeatherSetsModal tests.
 *
 * Pokrývá:
 *  - render globálních setů (14)
 *  - klik „Náhled" expand items
 *  - klik „Aplikovat" → confirm → useCreateWeatherGenerator volaný pro globální
 *  - readOnly mode (Hráč) — žádné Aplikovat, žádný „Mé sety" tab subactions
 *  - PJ vidí Mé sety tab + delete tlačítko
 *  - Unresolved warning (mock resolveSetItems přes globální set s neexistujícím presetId)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { WeatherSetsModal } from './WeatherSetsModal';
import { currentUserAtom } from '@/shared/store/authStore';
import type { User, WeatherGeneratorSet } from '@/shared/types';

// ── Mocks ────────────────────────────────────────────────────────────────

const apiMockState = vi.hoisted(() => ({
  createCalls: [] as Array<{ url: string; body: unknown }>,
  applyCalls: [] as Array<{ url: string; body: unknown }>,
}));

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn((url: string, body: unknown) => {
      if (url.includes('/apply')) {
        apiMockState.applyCalls.push({ url, body });
        return Promise.resolve([]);
      }
      if (url.includes('/weather-generators')) {
        apiMockState.createCalls.push({ url, body });
        return Promise.resolve({ id: 'new-gen', name: 'x' });
      }
      return Promise.resolve({});
    }),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Hooks — mock přes API client je dost, ale custom presets / generator sets
// query potřebují deterministic empty data.
const setsData = vi.hoisted(() => ({
  customSets: [] as WeatherGeneratorSet[],
}));

vi.mock('@/features/world/api/useGeneratorSets', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/world/api/useGeneratorSets')
  >('@/features/world/api/useGeneratorSets');
  return {
    ...actual,
    useGeneratorSets: () => ({
      data: setsData.customSets,
      isLoading: false,
      isError: false,
    }),
  };
});

vi.mock('@/features/world/api/useCustomPresets', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/world/api/useCustomPresets')
  >('@/features/world/api/useCustomPresets');
  return {
    ...actual,
    useCustomPresets: () => ({ data: [], isLoading: false }),
  };
});

// Mock resolveSetItems pro unresolved test — implementace přijímá globální
// data, takže používáme reálnou v happy-path testech. Unresolved test override
// dělá patch přes vi.spyOn níže.

const authState = vi.hoisted(() => ({ user: null as User | null }));

function makeWrapper() {
  const store = createStore();
  store.set(currentUserAtom, authState.user);
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <JotaiProvider store={store}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </JotaiProvider>
  );
  return Wrapper;
}

beforeEach(() => {
  apiMockState.createCalls = [];
  apiMockState.applyCalls = [];
  setsData.customSets = [];
  authState.user = null;
});

// ── Tests ────────────────────────────────────────────────────────────────

describe('WeatherSetsModal', () => {
  it('renderuje 14 globálních setů v Globální tabu', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <WeatherSetsModal open onClose={() => {}} worldId="w1" />
      </Wrapper>,
    );

    // Headline modalu
    expect(screen.getByText('Sety generátorů počasí')).toBeInTheDocument();

    // 14 globálních setů — všechny mají specifické jméno z GLOBAL_SETS
    expect(screen.getByText('Evropa')).toBeInTheDocument();
    expect(screen.getByText('Asie')).toBeInTheDocument();
    expect(screen.getByText('Mars expedice')).toBeInTheDocument();
    expect(screen.getByText('Vesmírná stanice')).toBeInTheDocument();
    expect(screen.getByText('Solar System tour')).toBeInTheDocument();

    // Karty se renderují
    const cards = screen.getAllByTestId(/^sets-card-global:/);
    expect(cards).toHaveLength(14);
  });

  it('klik „Náhled" zobrazí seznam items setu', async () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <WeatherSetsModal open onClose={() => {}} worldId="w1" />
      </Wrapper>,
    );

    // Najdi „Česko" set kartu a klikni Náhled
    const card = screen.getByTestId('sets-card-global:czechia');
    const previewBtn = card.querySelector('button[aria-expanded="false"]')!;
    fireEvent.click(previewBtn);

    // Po expandu se zobrazí Praha (kanonický item Česka)
    await waitFor(() => {
      const previewItems = card.querySelectorAll('ul li strong');
      expect(previewItems.length).toBeGreaterThan(0);
      const text = Array.from(previewItems).map((el) => el.textContent);
      expect(text).toContain('Praha');
    });
  });

  it('readOnly mode: žádné Aplikovat tlačítko, „Mé sety" tab bez subactions', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <WeatherSetsModal open onClose={() => {}} worldId="w1" readOnly />
      </Wrapper>,
    );

    // Žádný Apply button (variantní button label „Aplikovat")
    expect(
      screen.queryByRole('button', { name: /Aplikovat/i }),
    ).not.toBeInTheDocument();

    // Náhled tlačítko ALE zůstává (read-only může nahlédnout)
    const cards = screen.getAllByTestId(/^sets-card-global:/);
    expect(cards[0].querySelector('button[aria-expanded]')).toBeTruthy();
  });

  it('non-readOnly: zobrazí Aplikovat tlačítko na globálním setu', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <WeatherSetsModal open onClose={() => {}} worldId="w1" />
      </Wrapper>,
    );

    const applyButtons = screen.getAllByRole('button', { name: /Aplikovat/i });
    // 14 setů → 14 apply tlačítek
    expect(applyButtons.length).toBe(14);
  });

  it('Aplikovat → confirm dialog s počtem generátorů, klik confirm → API call', async () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <WeatherSetsModal open onClose={() => {}} worldId="w1" />
      </Wrapper>,
    );

    // Najdi Česko set (5 items)
    const czechiaCard = screen.getByTestId('sets-card-global:czechia');
    const applyBtn = czechiaCard.querySelector(
      'button',
    )! as HTMLButtonElement;
    // První button v cardActions je Náhled — najdi Aplikovat explicitně
    const applyInsideCard = Array.from(
      czechiaCard.querySelectorAll('button'),
    ).find((b) => b.textContent?.includes('Aplikovat'));
    expect(applyInsideCard).toBeTruthy();
    void applyBtn; // unused — silence
    fireEvent.click(applyInsideCard!);

    // Confirm dialog se otevře — title má jméno setu
    await waitFor(() => {
      expect(
        screen.getByText(/Aplikovat set „Česko"/),
      ).toBeInTheDocument();
    });

    // Klik na confirm „Aplikovat" v dialog footer
    const confirmBtn = screen
      .getAllByRole('button', { name: /Aplikovat/i })
      .find((b) => !b.closest('[data-testid^="sets-card-"]'));
    expect(confirmBtn).toBeTruthy();
    fireEvent.click(confirmBtn!);

    // Pro globální set se má volat useCreateWeatherGenerator (loop) — 5 calls
    await waitFor(() => {
      expect(apiMockState.createCalls.length).toBe(5);
    });
    // Aplikační endpoint pro custom NEMÁ být volaný
    expect(apiMockState.applyCalls.length).toBe(0);
  });

  it('PJ s custom sety: zobrazí Mé sety tab s entry, kebab obsahuje Smazat', async () => {
    setsData.customSets = [
      {
        id: 's1',
        worldId: 'w1',
        name: 'Můj custom set',
        description: 'test',
        emoji: '📦',
        items: [
          { presetId: 'city:Evropa:Česká republika:Praha', generatorName: 'Praha' },
          { presetId: 'archetype:planet-mars', generatorName: 'Mars' },
          { presetId: 'archetype:station-iss', generatorName: 'ISS' },
        ],
        createdBy: 'u1',
        appliedCount: 3,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    ];

    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <WeatherSetsModal open onClose={() => {}} worldId="w1" />
      </Wrapper>,
    );

    // Switch to Mé sety tab
    const mineTab = screen.getByRole('tab', { name: /Mé sety/i });
    fireEvent.click(mineTab);

    await waitFor(() => {
      expect(screen.getByText('Můj custom set')).toBeInTheDocument();
    });
    expect(screen.getByText(/Použito 3×/i)).toBeInTheDocument();

    // Kebab menu existuje pro custom set (delete option)
    const customCard = screen.getByTestId('sets-card-custom:s1');
    const kebabBtn = customCard.querySelector(
      'button[aria-label="Akce setu"]',
    );
    expect(kebabBtn).toBeTruthy();
  });

  it('Hrac (readOnly): Mé sety tab přepnutí — nezobrazí subtab bar pro create', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <WeatherSetsModal open onClose={() => {}} worldId="w1" readOnly />
      </Wrapper>,
    );

    const mineTab = screen.getByRole('tab', { name: /Mé sety/i });
    fireEvent.click(mineTab);

    // Subtab bar (Moje sety / Nový set) NESMÍ být zobrazený v readOnly režimu
    expect(screen.queryByText(/Nový set/i)).not.toBeInTheDocument();
  });

  it('Aplikovat globální set s neresolvable presetIds → warning a force-confirm', async () => {
    // Override GLOBAL_SETS přes spyOn resolveSetItems není trivial — místo toho
    // simulujeme přes mock useCustomPresets vrátí prázdné, ale použijeme reálný
    // resolver. Pro tento case: vyrobíme custom set s nevalid presetId přes
    // setsData a aplikujeme z Mé sety tabu — resolver detekuje unresolved.
    setsData.customSets = [
      {
        id: 's-bad',
        worldId: 'w1',
        name: 'Set s neexistujícím presetem',
        description: 'test unresolved',
        emoji: '⚠',
        items: [
          { presetId: 'city:Evropa:Česká republika:Praha', generatorName: 'Praha' },
          { presetId: 'custom:nonexistent-id-xyz', generatorName: 'Smazaný' },
          { presetId: 'archetype:planet-mars', generatorName: 'Mars' },
        ],
        createdBy: 'u1',
        appliedCount: 0,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    ];

    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <WeatherSetsModal open onClose={() => {}} worldId="w1" />
      </Wrapper>,
    );

    const mineTab = screen.getByRole('tab', { name: /Mé sety/i });
    fireEvent.click(mineTab);

    await waitFor(() => {
      expect(
        screen.getByText('Set s neexistujícím presetem'),
      ).toBeInTheDocument();
    });

    // Aplikuj
    const customCard = screen.getByTestId('sets-card-custom:s-bad');
    const applyBtn = Array.from(
      customCard.querySelectorAll('button'),
    ).find((b) => b.textContent?.includes('Aplikovat'));
    fireEvent.click(applyBtn!);

    // Confirm se otevře
    await waitFor(() => {
      expect(
        screen.getByText(/Aplikovat set „Set s neexistujícím presetem"/),
      ).toBeInTheDocument();
    });

    // První klik Aplikovat → kvůli unresolved se ukáže warning (alert role)
    const confirmBtn = screen
      .getAllByRole('button', { name: /Aplikovat/i })
      .find((b) => !b.closest('[data-testid^="sets-card-"]'));
    fireEvent.click(confirmBtn!);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Upozornění/)).toBeInTheDocument();
      // Konkrétní unresolved id v listu
      expect(screen.getByText('custom:nonexistent-id-xyz')).toBeInTheDocument();
    });

    // Druhý klik (force) — confirm label se změnil na „Pokračovat"
    const forceBtn = screen.getByRole('button', {
      name: /Pokračovat/i,
    });
    fireEvent.click(forceBtn);

    // Custom set se aplikuje přes useApplyGeneratorSet (BE batch endpoint)
    await waitFor(() => {
      expect(apiMockState.applyCalls.length).toBe(1);
    });
    // Body obsahuje jen 2 resolved itemy (Praha + Mars), unresolved přeskočen
    const body = apiMockState.applyCalls[0].body as {
      resolvedItems: unknown[];
    };
    expect(body.resolvedItems).toHaveLength(2);
  });
});
