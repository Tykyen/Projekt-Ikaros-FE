import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { getDefaultStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import { api } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';
import CalendarConfigsPage from '../CalendarConfigsPage';
import { GREGORIAN_DEFAULT_CONFIG } from '@/shared/lib/calendarEngine';

vi.mock('@/shared/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/shared/api/client')>(
    '@/shared/api/client',
  );
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({
    worldId: 'W1',
    worldSlug: 'test-svet',
    world: {
      id: 'W1',
      slug: 'test-svet',
      defaultCalendarConfigSlug: 'gregorian',
      timelineEpoch: 0,
    },
    userRole: 5,
    loading: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

const gregorianConfig = {
  ...GREGORIAN_DEFAULT_CONFIG,
  id: 'c1',
  worldId: 'W1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('CalendarConfigsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Token musí být set, jinak useCalendarConfigs query je disabled.
    getDefaultStore().set(accessTokenAtom, 'test-token');
  });

  it('renderuje seznam configů + auto-vybere default', async () => {
    vi.mocked(api.get).mockResolvedValue([gregorianConfig]);
    render(<CalendarConfigsPage />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Gregoriánský kalendář')).toBeInTheDocument();
    });
    // Default je vybrán → editor zobrazen (sekce "Identita")
    expect(screen.getByText('Identita')).toBeInTheDocument();
  });

  it('default config má ⭐ ikonu', async () => {
    vi.mocked(api.get).mockResolvedValue([gregorianConfig]);
    render(<CalendarConfigsPage />, { wrapper: makeWrapper() });

    await waitFor(() => {
      const starIcon = screen.getByLabelText('Výchozí');
      expect(starIcon).toBeInTheDocument();
    });
  });

  it('„Přidat kalendář" otevře 2-step wizard: picker → identity (9.3-F-I)', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue([gregorianConfig]);
    render(<CalendarConfigsPage />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Gregoriánský kalendář')).toBeInTheDocument();
    });

    // Step 1 — preset picker.
    await user.click(screen.getByRole('button', { name: /Přidat kalendář/i }));
    expect(
      screen.getByText(/Přidat kalendář — vyber šablonu/i),
    ).toBeInTheDocument();
    // „Prázdný" je první volba (Q5-A).
    expect(screen.getByText(/Prázdný kalendář/i)).toBeInTheDocument();
    // 10 presetů jako karty.
    expect(screen.getByText(/Juliánský/i)).toBeInTheDocument();
    expect(screen.getByText(/Perský/i)).toBeInTheDocument();

    // Step 2 — klik na „Prázdný" → identity modal.
    await user.click(screen.getByRole('button', { name: /Prázdný kalendář/i }));
    expect(screen.getByLabelText(/Název/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Slug/i)).toBeInTheDocument();
  });

  it('preset pre-fillne name + auto-suffix slug při konfliktu (9.3-F-I)', async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValue([gregorianConfig]); // gregorian už existuje
    render(<CalendarConfigsPage />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Gregoriánský kalendář')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Přidat kalendář/i }));
    // Klik na Gregoriánský preset card — uvnitř picker modalu (sidebar
    // má taky button „Gregoriánský kalendář"; target přes dialog scope).
    const dialog = screen.getByRole('dialog', {
      name: /Přidat kalendář — vyber šablonu/i,
    });
    await user.click(
      within(dialog).getByRole('button', { name: /^Gregoriánský/i }),
    );
    // Identity step pre-fillne name + auto-suffix slug na `gregorian-2`.
    const nameInput = screen.getByLabelText(/Název/i) as HTMLInputElement;
    const slugInput = screen.getByLabelText(/Slug/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Gregoriánský');
    expect(slugInput.value).toBe('gregorian-2');
  });

  it('prázdný state když svět nemá žádné configs', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    render(<CalendarConfigsPage />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText(/Vyber kalendář ze seznamu, nebo přidej nový/i),
      ).toBeInTheDocument();
    });
  });
});
