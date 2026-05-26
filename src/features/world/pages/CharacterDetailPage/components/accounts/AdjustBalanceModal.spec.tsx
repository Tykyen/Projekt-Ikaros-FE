import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { AdjustBalanceModal } from './AdjustBalanceModal';
import type {
  CharacterAccount,
  FantasyDateLike,
} from '../../../api/characters.types';

const mockAdjust = vi.fn();

vi.mock('../../../api/useCharacterAccounts', () => ({
  useAccountAdjust: () => ({ mutate: mockAdjust, isPending: false }),
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
  toast: { success: vi.fn(), error: vi.fn() },
}));

const ACCOUNT: CharacterAccount = {
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
};

const CURRENCIES = [
  { id: 'a', code: 'ZL', name: 'Zlatý', symbol: 'Zl', rate: 1 },
];

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  mockAdjust.mockClear();
});

describe('AdjustBalanceModal', () => {
  it('renderuje Vklad / Výběr toggle + InGameDateField', () => {
    render(
      <AdjustBalanceModal
        worldId="w1"
        account={ACCOUNT}
        currencies={CURRENCIES}
        onClose={() => {}}
      />,
      { wrapper: wrapper() },
    );
    expect(screen.getByText('Vklad')).toBeInTheDocument();
    expect(screen.getByText('Výběr')).toBeInTheDocument();
    expect(screen.getByText(/Herní datum/)).toBeInTheDocument();
  });

  it('validuje že amount > 0', () => {
    render(
      <AdjustBalanceModal
        worldId="w1"
        account={ACCOUNT}
        currencies={CURRENCIES}
        onClose={() => {}}
      />,
      { wrapper: wrapper() },
    );
    fireEvent.change(screen.getByTestId('adjust-reason'), {
      target: { value: 'Test' },
    });
    fireEvent.click(screen.getByText('Potvrdit'));
    expect(screen.getByText(/Zadej kladné číslo/)).toBeInTheDocument();
    expect(mockAdjust).not.toHaveBeenCalled();
  });

  it('validuje že reason je povinný', () => {
    render(
      <AdjustBalanceModal
        worldId="w1"
        account={ACCOUNT}
        currencies={CURRENCIES}
        onClose={() => {}}
      />,
      { wrapper: wrapper() },
    );
    fireEvent.change(screen.getByTestId('adjust-amount'), {
      target: { value: '100' },
    });
    fireEvent.click(screen.getByText('Potvrdit'));
    expect(screen.getByText(/Důvod je povinný/)).toBeInTheDocument();
    expect(mockAdjust).not.toHaveBeenCalled();
  });

  it('Vklad → posílá kladnou částku', () => {
    render(
      <AdjustBalanceModal
        worldId="w1"
        account={ACCOUNT}
        currencies={CURRENCIES}
        onClose={() => {}}
      />,
      { wrapper: wrapper() },
    );
    fireEvent.change(screen.getByTestId('adjust-amount'), {
      target: { value: '500' },
    });
    fireEvent.change(screen.getByTestId('adjust-reason'), {
      target: { value: 'Odměna' },
    });
    fireEvent.click(screen.getByText('Potvrdit'));
    expect(mockAdjust).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 500,
        reason: 'Odměna',
        inGameDate: expect.objectContaining({ year: 2039 }) as FantasyDateLike,
      }),
      expect.anything(),
    );
  });

  it('Výběr → posílá zápornou částku', () => {
    render(
      <AdjustBalanceModal
        worldId="w1"
        account={ACCOUNT}
        currencies={CURRENCIES}
        onClose={() => {}}
      />,
      { wrapper: wrapper() },
    );
    fireEvent.click(screen.getByText('Výběr'));
    fireEvent.change(screen.getByTestId('adjust-amount'), {
      target: { value: '300' },
    });
    fireEvent.change(screen.getByTestId('adjust-reason'), {
      target: { value: 'Pokuta' },
    });
    fireEvent.click(screen.getByText('Potvrdit'));
    expect(mockAdjust).toHaveBeenCalledWith(
      expect.objectContaining({ amount: -300, reason: 'Pokuta' }),
      expect.anything(),
    );
  });
});
