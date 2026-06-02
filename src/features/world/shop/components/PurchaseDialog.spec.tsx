import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PurchaseDialog } from './PurchaseDialog';
import type { ShopItem } from '../types';
import type { WorldCurrencyItem } from '@/features/world/currencies/types';

const account = {
  id: 'acc1',
  worldId: 'w1',
  label: 'Osobní',
  currency: 'ZL',
  balance: 200,
  allowPlayerSelfAdjust: true,
  ownerCharacterIds: ['char1'],
  primaryOwnerId: 'char1',
};

let accountOverride = { ...account };

vi.mock('@/features/world/pages/api/useCharacterAccounts', () => ({
  useCharacterAccounts: () => ({
    data: [accountOverride],
    isLoading: false,
  }),
}));

const mutate = vi.fn();
vi.mock('../api', () => ({
  usePurchase: () => ({ mutate, isPending: false }),
}));

const currencyItems: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1 },
];

function makeItem(over: Partial<ShopItem> = {}): ShopItem {
  return {
    id: 'i1',
    worldId: 'w1',
    ownerId: 'u1',
    isShared: false,
    name: 'Meč',
    groupId: '',
    price: 100,
    currencyCode: 'ZL',
    discountPercent: 0,
    linkedItemIds: [],
    isRecommended: false,
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

function renderDialog(item: ShopItem, isStaff = true) {
  return render(
    <PurchaseDialog
      worldId="w1"
      item={item}
      character={{ id: 'char1', slug: 'aragorn', name: 'Aragorn' }}
      currencyItems={currencyItems}
      isStaff={isStaff}
      onClose={vi.fn()}
    />,
  );
}

describe('PurchaseDialog', () => {
  beforeEach(() => {
    accountOverride = { ...account };
    mutate.mockClear();
  });

  it('ukáže zůstatek před → po nákupu', () => {
    renderDialog(makeItem());
    // 200 ZL − 100 ZL = 100 ZL (Modal jde přes portál → čteme document.body)
    expect(document.body.textContent).toContain('200 Zl');
    expect(document.body.textContent).toContain('100 Zl');
  });

  it('Koupit je dostupné při dostatku prostředků', () => {
    renderDialog(makeItem());
    expect(screen.getByRole('button', { name: 'Koupit' })).toBeEnabled();
  });

  it('blokuje nákup při nedostatku prostředků', () => {
    accountOverride = { ...account, balance: 50 };
    renderDialog(makeItem({ price: 100 }));
    expect(screen.getByRole('button', { name: 'Koupit' })).toBeDisabled();
  });

  it('hráč bez self-adjust nemůže koupit a vidí hlášku', () => {
    accountOverride = { ...account, allowPlayerSelfAdjust: false };
    renderDialog(makeItem(), false);
    expect(screen.getByRole('button', { name: 'Koupit' })).toBeDisabled();
    expect(screen.getByText(/požádej PJ/)).toBeInTheDocument();
  });
});
