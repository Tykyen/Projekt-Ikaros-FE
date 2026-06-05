import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { ThemeProvider } from '../ThemeProvider';
import {
  themeAtom,
  platformThemePreviewAtom,
  worldThemeActiveAtom,
} from '../state';
import { applyTheme } from '../applyTheme';

vi.mock('../applyTheme', () => ({
  applyTheme: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/shared/api/client', () => ({
  api: { patch: vi.fn(() => Promise.resolve({})) },
  apiClient: {},
  parseApiError: vi.fn(() => 'err'),
}));

const applyThemeMock = vi.mocked(applyTheme);

function makeWrapper(store = createStore()) {
  const qc = new QueryClient();
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>
      <JotaiProvider store={store}>{children}</JotaiProvider>
    </QueryClientProvider>
  );
}

describe('ThemeProvider — vlastnictví :root', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aplikuje globální motiv při mountu, když svět není aktivní', async () => {
    const store = createStore();
    store.set(themeAtom, 'mesic');
    render(<ThemeProvider />, { wrapper: makeWrapper(store) });
    await waitFor(() =>
      expect(applyThemeMock).toHaveBeenCalledWith('mesic', undefined),
    );
  });

  it('NEpřepíše world skin při vynulování platform preview (odchod z profilu do světa)', async () => {
    const store = createStore();
    store.set(themeAtom, 'mesic');
    // Svět už vlastní :root (WorldLayout je mountnutý).
    store.set(worldThemeActiveAtom, true);
    // Profil měl aktivní náhled doladění vzhledu.
    store.set(platformThemePreviewAtom, { overrides: {}, adjust: {} });

    render(<ThemeProvider />, { wrapper: makeWrapper(store) });
    // Při aktivním světě se globální motiv neaplikuje ani při mountu.
    await waitFor(() => expect(applyThemeMock).not.toHaveBeenCalled());

    // Odchod z profilu → AppearanceSection cleanup vynuluje preview.
    // To dřív znovu spustilo applyTheme(globální) a přepsalo world skin.
    act(() => store.set(platformThemePreviewAtom, null));
    expect(applyThemeMock).not.toHaveBeenCalled();
  });

  it('po opuštění světa (flag false) globální motiv znovu aplikuje', async () => {
    const store = createStore();
    store.set(themeAtom, 'mesic');
    store.set(worldThemeActiveAtom, true);
    render(<ThemeProvider />, { wrapper: makeWrapper(store) });
    await waitFor(() => expect(applyThemeMock).not.toHaveBeenCalled());

    act(() => store.set(worldThemeActiveAtom, false));
    await waitFor(() =>
      expect(applyThemeMock).toHaveBeenCalledWith('mesic', undefined),
    );
  });
});
