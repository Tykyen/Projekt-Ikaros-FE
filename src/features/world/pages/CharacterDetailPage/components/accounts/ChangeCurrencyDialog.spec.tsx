import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { ChangeCurrencyDialog } from './ChangeCurrencyDialog';
import type { CharacterAccount } from '../../../api/characters.types';
import type { WorldCurrencyItem } from '@/features/world/currencies/shared';

const mockChange = vi.fn();

vi.mock('../../../api/useCharacterAccounts', () => ({
  useChangeAccountCurrency: () => ({ mutate: mockChange, isPending: false }),
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
  currency: 'EUR',
  balance: 100000,
  incomeEntries: [],
  expenseEntries: [],
  transactions: [],
  notes: '',
};

// EUR rate 1, GBP rate 1.25 → EUR→GBP = ×(1/1.25) = 0.8
const ITEMS: WorldCurrencyItem[] = [
  { id: '1', code: 'EUR', name: 'Euro', symbol: '€', rate: 1 },
  { id: '2', code: 'GBP', name: 'Libra', symbol: '£', rate: 1.25 },
];

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => mockChange.mockClear());

describe('ChangeCurrencyDialog', () => {
  it('kurz dostupný → ukáže obě akce (přepočítat i přeznačit)', () => {
    render(
      <ChangeCurrencyDialog
        worldId="w1"
        account={ACCOUNT}
        targetCurrency="GBP"
        items={ITEMS}
        onClose={() => {}}
        onDone={() => {}}
      />,
      { wrapper: wrapper() },
    );
    expect(screen.getByText('Přepočítat kurzem')).toBeInTheDocument();
    expect(screen.getByText('Jen přeznačit')).toBeInTheDocument();
  });

  it('„Přepočítat kurzem" → mutate s convert:true', () => {
    render(
      <ChangeCurrencyDialog
        worldId="w1"
        account={ACCOUNT}
        targetCurrency="GBP"
        items={ITEMS}
        onClose={() => {}}
        onDone={() => {}}
      />,
      { wrapper: wrapper() },
    );
    fireEvent.click(screen.getByText('Přepočítat kurzem'));
    expect(mockChange).toHaveBeenCalledWith(
      { currency: 'GBP', convert: true },
      expect.anything(),
    );
  });

  it('„Jen přeznačit" → mutate s convert:false', () => {
    render(
      <ChangeCurrencyDialog
        worldId="w1"
        account={ACCOUNT}
        targetCurrency="GBP"
        items={ITEMS}
        onClose={() => {}}
        onDone={() => {}}
      />,
      { wrapper: wrapper() },
    );
    fireEvent.click(screen.getByText('Jen přeznačit'));
    expect(mockChange).toHaveBeenCalledWith(
      { currency: 'GBP', convert: false },
      expect.anything(),
    );
  });

  it('bez kurzu cílové měny → skryje „Přepočítat kurzem"', () => {
    render(
      <ChangeCurrencyDialog
        worldId="w1"
        account={ACCOUNT}
        targetCurrency="USD"
        items={ITEMS}
        onClose={() => {}}
        onDone={() => {}}
      />,
      { wrapper: wrapper() },
    );
    expect(screen.queryByText('Přepočítat kurzem')).not.toBeInTheDocument();
    expect(screen.getByText('Jen přeznačit')).toBeInTheDocument();
  });
});
