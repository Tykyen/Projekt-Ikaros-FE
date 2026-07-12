import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import { CurrenciesListSection } from './CurrenciesListSection';
import type { WorldCurrencyItem } from '../types';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  parseApiError: vi.fn(() => 'err'),
  parseApiErrorCode: vi.fn(() => null),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const items: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1.0 },
  { id: 'b', code: 'ST', name: 'Stříbrňák', symbol: 'St', rate: 0.1 },
];

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const store = createStore();
  return ({ children }: PropsWithChildren) => (
    <JotaiProvider store={store}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </JotaiProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CurrenciesListSection — role gate', () => {
  it('hráč (canEdit=false, canAddOrDelete=false) → žádné akce v DOM', () => {
    render(
      <CurrenciesListSection
        worldId="w1"
        items={items}
        canEdit={false}
        canAddOrDelete={false}
      />,
      { wrapper: wrapper() },
    );
    expect(screen.queryByText(/Přidat měnu/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Akce pro/)).not.toBeInTheDocument();
  });

  it('PomocnyPJ (canEdit=true, canAddOrDelete=false) → kebab ano, „+ Přidat" ne', () => {
    render(
      <CurrenciesListSection
        worldId="w1"
        items={items}
        canEdit={true}
        canAddOrDelete={false}
      />,
      { wrapper: wrapper() },
    );
    expect(screen.queryByText(/Přidat měnu/)).not.toBeInTheDocument();
    expect(screen.getAllByLabelText(/Akce pro/)).toHaveLength(2);
  });

  it('PJ+ (canAddOrDelete=true) → „+ Přidat měnu" + kebab', () => {
    render(
      <CurrenciesListSection
        worldId="w1"
        items={items}
        canEdit={true}
        canAddOrDelete={true}
      />,
      { wrapper: wrapper() },
    );
    expect(screen.getByText(/Přidat měnu/)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Akce pro/)).toHaveLength(2);
  });

  it('zobrazí badge „základ" u prvního item', () => {
    render(
      <CurrenciesListSection
        worldId="w1"
        items={items}
        canEdit={false}
        canAddOrDelete={false}
      />,
      { wrapper: wrapper() },
    );
    expect(screen.getByText(/základ/)).toBeInTheDocument();
  });

  it('empty state (canAddOrDelete=true) → CTA „Přidat první měnu"', () => {
    render(
      <CurrenciesListSection
        worldId="w1"
        items={[]}
        canEdit={true}
        canAddOrDelete={true}
      />,
      { wrapper: wrapper() },
    );
    expect(screen.getByText(/Přidat první měnu/)).toBeInTheDocument();
  });

  it('empty state (canAddOrDelete=false) → text „Kontaktuj PJ"', () => {
    render(
      <CurrenciesListSection
        worldId="w1"
        items={[]}
        canEdit={false}
        canAddOrDelete={false}
      />,
      { wrapper: wrapper() },
    );
    expect(screen.getByText(/Kontaktuj PJ/)).toBeInTheDocument();
    expect(screen.queryByText(/Přidat/)).not.toBeInTheDocument();
  });
});
