import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, createStore } from 'jotai';
import type { PropsWithChildren } from 'react';
import { ConverterSection } from './ConverterSection';
import type { WorldCurrencyItem } from '../types';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

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
  localStorage.clear();
});

describe('ConverterSection', () => {
  it('renderuje 2 amount inputy + swap tlačítko', () => {
    render(<ConverterSection worldId="w1" items={items} />, {
      wrapper: wrapper(),
    });
    expect(screen.getByLabelText('Částka ke konverzi')).toBeInTheDocument();
    expect(screen.getByLabelText('Výsledek')).toBeInTheDocument();
    expect(screen.getByLabelText('Prohodit měny')).toBeInTheDocument();
  });

  it('default from = base (ZL), to = první ne-base (ST)', () => {
    render(<ConverterSection worldId="w1" items={items} />, {
      wrapper: wrapper(),
    });
    expect((screen.getByLabelText('Z měny') as HTMLSelectElement).value).toBe(
      'ZL',
    );
    expect((screen.getByLabelText('Do měny') as HTMLSelectElement).value).toBe(
      'ST',
    );
  });

  it('0 měn → nic se nerenderuje', () => {
    const { container } = render(
      <ConverterSection worldId="w1" items={[]} />,
      { wrapper: wrapper() },
    );
    expect(container.firstChild).toBeNull();
  });

  it('1 měna → zobrazí informativní hlášku', () => {
    render(
      <ConverterSection
        worldId="w1"
        items={[
          { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1 },
        ]}
      />,
      { wrapper: wrapper() },
    );
    expect(
      screen.getByText(/jen jednu měnu — převodník není potřeba/),
    ).toBeInTheDocument();
  });

  it('default to z localStorage preferred (per-world)', () => {
    localStorage.setItem('ikaros.currency.preferred.w1', '"ST"');
    render(<ConverterSection worldId="w1" items={items} />, {
      wrapper: wrapper(),
    });
    expect((screen.getByLabelText('Do měny') as HTMLSelectElement).value).toBe(
      'ST',
    );
  });
});
