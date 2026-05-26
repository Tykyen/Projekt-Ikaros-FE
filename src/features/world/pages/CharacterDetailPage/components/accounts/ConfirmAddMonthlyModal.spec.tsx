import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { ConfirmAddMonthlyModal } from './ConfirmAddMonthlyModal';
import type { CharacterAccount } from '../../../api/characters.types';

const mockAddMonthly = vi.fn();

vi.mock('../../../api/useCharacterAccounts', () => ({
  useAccountAddMonthly: () => ({ mutate: mockAddMonthly, isPending: false }),
}));

vi.mock('@/features/world/api/useWorldSettings', () => ({
  useWorldSettings: () => ({
    data: { currentInGameDate: '2039-06-14T12:30:00.000Z' },
  }),
}));

vi.mock('@/features/world/api/useCalendarConfigs', () => ({
  useCalendarConfigs: () => ({ data: [] }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const CURRENCIES = [
  { id: 'a', code: 'ZL', name: 'Zlatý', symbol: 'Zl', rate: 1 },
];

function makeAccount(
  overrides: Partial<CharacterAccount> = {},
): CharacterAccount {
  return {
    id: 'acc1',
    worldId: 'w1',
    label: 'Hlavní',
    ownerCharacterIds: ['c1'],
    primaryOwnerId: 'c1',
    accountType: 'Osobní',
    accessLocation: null,
    currency: 'ZL',
    balance: 1000,
    incomeEntries: [],
    expenseEntries: [],
    transactions: [],
    notes: '',
    ...overrides,
  };
}

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  mockAddMonthly.mockClear();
});

describe('ConfirmAddMonthlyModal', () => {
  it('renderuje preview deltу + InGameDateField', () => {
    render(
      <ConfirmAddMonthlyModal
        worldId="w1"
        account={makeAccount({
          incomeEntries: [{ id: 'i1', label: 'Plat', amount: 500 }],
          expenseEntries: [{ id: 'e1', label: 'Nájem', amount: 200 }],
        })}
        currencies={CURRENCIES}
        onClose={() => {}}
      />,
      { wrapper: wrapper() },
    );
    expect(screen.getByText(/Přehled změn/)).toBeInTheDocument();
    expect(screen.getByText(/\+500 Zl/)).toBeInTheDocument();
    expect(screen.getByText(/−200 Zl/)).toBeInTheDocument();
    expect(screen.getByText(/\+300 Zl/)).toBeInTheDocument(); // total
    expect(screen.getByText(/Herní datum zaúčtování/)).toBeInTheDocument();
  });

  it('zobrazí varování když delta === 0', () => {
    render(
      <ConfirmAddMonthlyModal
        worldId="w1"
        account={makeAccount()}
        currencies={CURRENCIES}
        onClose={() => {}}
      />,
      { wrapper: wrapper() },
    );
    expect(
      screen.getByText(/Příjmy i výdaje jsou nulové/),
    ).toBeInTheDocument();
  });

  it('confirm volá addMonthly s inGameDate', () => {
    render(
      <ConfirmAddMonthlyModal
        worldId="w1"
        account={makeAccount({
          incomeEntries: [{ id: 'i1', label: 'X', amount: 100 }],
        })}
        currencies={CURRENCIES}
        onClose={() => {}}
      />,
      { wrapper: wrapper() },
    );
    fireEvent.click(screen.getByText('Zaúčtovat'));
    expect(mockAddMonthly).toHaveBeenCalledWith(
      expect.objectContaining({
        inGameDate: expect.objectContaining({ year: 2039 }) as object,
      }),
      expect.anything(),
    );
  });

  it('cancel zavře bez mutate', () => {
    const onClose = vi.fn();
    render(
      <ConfirmAddMonthlyModal
        worldId="w1"
        account={makeAccount()}
        currencies={CURRENCIES}
        onClose={onClose}
      />,
      { wrapper: wrapper() },
    );
    fireEvent.click(screen.getByText('Zrušit'));
    expect(onClose).toHaveBeenCalled();
    expect(mockAddMonthly).not.toHaveBeenCalled();
  });
});
