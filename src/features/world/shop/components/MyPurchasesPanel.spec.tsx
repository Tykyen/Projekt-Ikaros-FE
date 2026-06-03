import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyPurchasesPanel } from './MyPurchasesPanel';
import type { Purchase } from '../types';
import type { WorldCurrencyItem } from '@/features/world/currencies/types';

// N-23 — gating tlačítka „Vrátit" dle role + allowPlayerSelfAdjust.

const account = {
  id: 'acc1',
  worldId: 'w1',
  label: 'Osobní',
  currency: 'ZL',
  balance: 200,
  allowPlayerSelfAdjust: false,
  ownerCharacterIds: ['char1'],
  primaryOwnerId: 'char1',
};
let accountOverride = { ...account };

vi.mock('@/features/world/pages/api/useCharacterAccounts', () => ({
  useCharacterAccounts: () => ({ data: [accountOverride], isLoading: false }),
}));

let purchasesData: Purchase[] = [];
vi.mock('../api', () => ({
  usePurchases: () => ({ data: purchasesData, isLoading: false }),
  useRefund: () => ({ mutate: vi.fn(), isPending: false }),
}));

const currencyItems: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1 },
];

function makePurchase(over: Partial<Purchase> = {}): Purchase {
  return {
    id: 'p1',
    worldId: 'w1',
    characterId: 'char1',
    buyerUserId: 'u1',
    shopItemId: 'i1',
    itemSnapshot: {
      name: 'Meč',
      unitPrice: 100,
      currencyCode: 'ZL',
      discountPercent: 0,
    },
    quantity: 1,
    unitPriceOriginal: 100,
    discountPercent: 0,
    accountId: 'acc1',
    accountTransactionId: 't1',
    paidAmount: 100,
    paidCurrency: 'ZL',
    inventorySectionId: 's1',
    inventoryItemId: 'inv1',
    status: 'active',
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

function renderPanel(isStaff: boolean) {
  return render(
    <MyPurchasesPanel
      worldId="w1"
      characterId="char1"
      characterSlug="aragorn"
      characterName="Aragorn"
      currencyItems={currencyItems}
      isStaff={isStaff}
      onClose={() => {}}
    />,
  );
}

describe('MyPurchasesPanel — N-23 storno gating', () => {
  beforeEach(() => {
    accountOverride = { ...account, allowPlayerSelfAdjust: false };
    purchasesData = [makePurchase()];
  });

  it('staff vidí „Vrátit" i bez allowPlayerSelfAdjust', () => {
    renderPanel(true);
    expect(screen.getByTitle('Vrátit nákup')).toBeInTheDocument();
    expect(screen.queryByText('storno u PJ')).not.toBeInTheDocument();
  });

  it('hráč bez allowPlayerSelfAdjust nevidí „Vrátit" (místo toho hint)', () => {
    renderPanel(false);
    expect(screen.queryByTitle('Vrátit nákup')).not.toBeInTheDocument();
    expect(screen.getByText('storno u PJ')).toBeInTheDocument();
  });

  it('hráč s allowPlayerSelfAdjust vidí „Vrátit"', () => {
    accountOverride = { ...account, allowPlayerSelfAdjust: true };
    renderPanel(false);
    expect(screen.getByTitle('Vrátit nákup')).toBeInTheDocument();
  });

  it('refundovaný nákup ukazuje „vráceno" bez tlačítka', () => {
    purchasesData = [makePurchase({ status: 'refunded' })];
    renderPanel(true);
    expect(screen.getByText('vráceno')).toBeInTheDocument();
    expect(screen.queryByTitle('Vrátit nákup')).not.toBeInTheDocument();
  });
});
