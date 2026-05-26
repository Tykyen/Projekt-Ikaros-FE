/**
 * 9.4-I — Component test pro WeatherPresetWizard.
 *
 * Pokrývá:
 *  - Stage 1 (rozcestí): fantasy/scifi locked, real-world clickable
 *  - Stage 2 (kategorie) po výběru reálného světa
 *  - Stage 3 (preset list + detail) po výběru kategorie
 *  - Search jumps z stage 1 rovnou do stage 3 (filtered)
 *  - „Použít" → onApply zavolán s `PresetItem`
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WeatherPresetWizard } from './WeatherPresetWizard';

// Mock React Query hooks které dělají BE calls (useTrialMonths → useWorldSettings)
vi.mock('@/features/world/api/useWorldSettings', () => ({
  useWorldSettings: () => ({ data: undefined }),
}));

vi.mock('@/features/world/api/useCalendarConfigs', () => ({
  useCalendarConfigs: () => ({ data: [] }),
}));

// 9.4-dluh — mock custom presets hooks
vi.mock('@/features/world/api/useCustomPresets', () => ({
  useCustomPresets: () => ({ data: [] }),
  useUseCustomPreset: () => ({ mutate: vi.fn(), isPending: false }),
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('WeatherPresetWizard', () => {
  it('Stage 1 — zobrazí 3 realm karty, fantasy a scifi jsou locked', () => {
    const onApply = vi.fn();
    render(
      <WeatherPresetWizard
        worldId="w1"
        userId="u1"
        onApplyPreset={onApply}
      />,
      { wrapper: makeWrapper() },
    );

    // Realm karty — všechny aktivní po 9.4-II + 9.4-III
    expect(screen.getByText('Reálný svět')).toBeInTheDocument();
    expect(screen.getByText('Fantasy & mytologie')).toBeInTheDocument();
    expect(screen.getByText('Sci-fi & vesmír')).toBeInTheDocument();

    const fantasy = screen.getByText('Fantasy & mytologie').closest('button');
    const scifi = screen.getByText('Sci-fi & vesmír').closest('button');
    expect(fantasy?.getAttribute('aria-disabled')).toBe('false');
    expect(scifi?.getAttribute('aria-disabled')).toBe('false');
  });

  it('Navigace stage 1 → 2: klik na „Reálný svět" zobrazí 4 kategorie', async () => {
    const onApply = vi.fn();
    render(
      <WeatherPresetWizard
        worldId="w1"
        userId="u1"
        onApplyPreset={onApply}
      />,
      { wrapper: makeWrapper() },
    );

    await userEvent.click(screen.getByText('Reálný svět'));

    // Stage 2 dlaždice
    expect(screen.getByText('Země & města')).toBeInTheDocument();
    expect(screen.getByText('Klimatické zóny')).toBeInTheDocument();
    expect(screen.getByText('Mořská prostředí')).toBeInTheDocument();
    expect(screen.getByText('Reálné extrémy')).toBeInTheDocument();
  });

  it('Navigace stage 2 → 3: klik na kategorii zobrazí preset list', async () => {
    const onApply = vi.fn();
    render(
      <WeatherPresetWizard
        worldId="w1"
        userId="u1"
        onApplyPreset={onApply}
      />,
      { wrapper: makeWrapper() },
    );

    await userEvent.click(screen.getByText('Reálný svět'));
    await userEvent.click(screen.getByText('Reálné extrémy'));

    // Stage 3 - extrémy mají Vostok atd.
    await waitFor(() => {
      expect(screen.getByText(/Vostok/)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Použít/ })).toBeInTheDocument();
  });

  it('Tlačítko „Použít" → onApply zavoláno s preset item', async () => {
    const onApply = vi.fn();
    render(
      <WeatherPresetWizard
        worldId="w1"
        userId="u1"
        onApplyPreset={onApply}
      />,
      { wrapper: makeWrapper() },
    );

    await userEvent.click(screen.getByText('Reálný svět'));
    await userEvent.click(screen.getByText('Reálné extrémy'));

    const applyBtn = await screen.findByRole('button', { name: /Použít/ });
    await userEvent.click(applyBtn);

    expect(onApply).toHaveBeenCalledTimes(1);
    const arg = onApply.mock.calls[0][0];
    expect(arg).toHaveProperty('id');
    expect(arg).toHaveProperty('toConfig');
    expect(typeof arg.toConfig).toBe('function');
  });

  it('Tlačítko „Zpět" v stage 3 → stage 2', async () => {
    const onApply = vi.fn();
    render(
      <WeatherPresetWizard
        worldId="w1"
        userId="u1"
        onApplyPreset={onApply}
      />,
      { wrapper: makeWrapper() },
    );

    await userEvent.click(screen.getByText('Reálný svět'));
    await userEvent.click(screen.getByText('Reálné extrémy'));

    await userEvent.click(screen.getByRole('button', { name: /Zpět/ }));

    // Zpět → kategorie
    expect(screen.getByText('Země & města')).toBeInTheDocument();
  });

  it('Search query >= 2 znaky → skip stages, ukáže filtered preset list', async () => {
    const onApply = vi.fn();
    render(
      <WeatherPresetWizard
        worldId="w1"
        userId="u1"
        onApplyPreset={onApply}
      />,
      { wrapper: makeWrapper() },
    );

    const search = screen.getByLabelText(/Hledat preset počasí/i);
    await userEvent.type(search, 'praha');

    // Debounce 150ms → wait
    await waitFor(
      () => {
        expect(screen.getByText(/výsledků pro „praha"/)).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('Recently used — po prvním apply preset chip se zobrazí při re-mount', async () => {
    const onApply = vi.fn();
    const { unmount } = render(
      <WeatherPresetWizard
        worldId="w1"
        userId="u1"
        onApplyPreset={onApply}
      />,
      { wrapper: makeWrapper() },
    );

    await userEvent.click(screen.getByText('Reálný svět'));
    await userEvent.click(screen.getByText('Reálné extrémy'));
    const applyBtn = await screen.findByRole('button', { name: /Použít/ });
    await userEvent.click(applyBtn);

    expect(onApply).toHaveBeenCalled();
    unmount();

    // Re-mount → recently used row je vidět
    render(
      <WeatherPresetWizard
        worldId="w1"
        userId="u1"
        onApplyPreset={onApply}
      />,
      { wrapper: makeWrapper() },
    );

    expect(screen.getByText(/Naposledy použité/)).toBeInTheDocument();
  });

  // 9.4-dluh — Custom realm: 4. karta + empty state v Stage 3
  it('9.4-dluh — zobrazí 4. kartu „Mé presety" (Custom realm)', () => {
    const onApply = vi.fn();
    render(
      <WeatherPresetWizard
        worldId="w1"
        userId="u1"
        onApplyPreset={onApply}
      />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByText('Mé presety')).toBeInTheDocument();
  });

  it('9.4-dluh — klik na „Mé presety" s 0 presety → empty state + návod', async () => {
    const onApply = vi.fn();
    render(
      <WeatherPresetWizard
        worldId="w1"
        userId="u1"
        onApplyPreset={onApply}
      />,
      { wrapper: makeWrapper() },
    );
    await userEvent.click(screen.getByText('Mé presety'));
    // Stage 2 SKIP → rovnou Stage 3 (preset-detail) s custom empty state
    await waitFor(() => {
      expect(
        screen.getByText(/Zatím nemáš žádný vlastní preset/i),
      ).toBeInTheDocument();
    });
    // Návod zmiňuje „Uložit jako preset" button v modalu
    expect(
      screen.getByText(/Uložit jako preset/i),
    ).toBeInTheDocument();
  });
});
