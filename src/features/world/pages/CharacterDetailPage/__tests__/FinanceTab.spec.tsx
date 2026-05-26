import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FinanceTab } from '../components/FinanceTab';
import type { CharacterAccount } from '../../api/characters.types';
import type { Page } from '../../api/pages.types';

let mockAccounts: CharacterAccount[] | undefined = undefined;
let mockState = {
  isLoading: false,
  isError: false,
  error: undefined as unknown,
};
const mutateUpdate = vi.fn();
const mutateAddMonthly = vi.fn();
const mutateUndo = vi.fn();
const refetchFn = vi.fn();

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ worldId: 'w1', userRole: 3 }),
}));

vi.mock('../../api/useCharacterAccounts', () => ({
  useCharacterAccounts: () => ({
    data: mockAccounts,
    isLoading: mockState.isLoading,
    isError: mockState.isError,
    error: mockState.error,
    refetch: refetchFn,
  }),
  useUpdateAccount: () => ({ mutate: mutateUpdate, isPending: false }),
  useAccountAddMonthly: () => ({ mutate: mutateAddMonthly, isPending: false }),
  useAccountUndo: () => ({ mutate: mutateUndo, isPending: false }),
  useAccountTransfer: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAccount: () => ({ mutate: vi.fn(), isPending: false }),
  useAccountAddCoOwner: () => ({ mutate: vi.fn(), isPending: false }),
  useAccountRemoveCoOwner: () => ({ mutate: vi.fn(), isPending: false }),
  useWorldCurrencies: () => ({
    data: { items: [{ code: 'ZL', name: 'Zlatý', symbol: '✦', rate: 1 }] },
  }),
  useCreateAccount: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../../api/useCharacterDirectory', () => ({
  useCharacterDirectory: () => ({ data: [] }),
}));

vi.mock('@/shared/ui/RichTextEditor', () => ({
  RichTextEditor: ({ value }: { value?: string }) => (
    <div data-testid="rte">{value}</div>
  ),
}));

// Spec 8.x-prep §4.4 — ConfirmAddMonthlyModal používá worldSettings + calendar
// pro default in-game datum; AdjustBalanceModal stejně. Mock vrací prázdné
// (test pokrývá jen otevření modalu, ne hluboké date interakce).
vi.mock('@/features/world/api/useWorldSettings', () => ({
  useWorldSettings: () => ({ data: { currentInGameDate: null } }),
}));
vi.mock('@/features/world/api/useCalendarConfigs', () => ({
  useCalendarConfigs: () => ({ data: [] }),
}));

const PAGE: Page = {
  id: 'p1',
  slug: 'aragorn',
  worldId: 'w1',
  title: 'Aragorn',
  type: 'Postava hráče',
  category: 'Postavy',
  content: '',
  publicInfoBlocks: [],
  privateInfoBlocks: [],
  imageUrl: '',
  accessRequirements: [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const ACCOUNT_1: CharacterAccount = {
  id: 'acc1',
  worldId: 'w1',
  label: 'Hlavní účet',
  ownerCharacterIds: ['char1'],
  primaryOwnerId: 'char1',
  accountType: 'Osobní',
  accessLocation: null,
  currency: 'ZL',
  balance: 1250,
  incomeEntries: [{ id: 'i1', label: 'Plat', amount: 300 }],
  expenseEntries: [{ id: 'e1', label: 'Bydlení', amount: 100 }],
  transactions: [
    {
      id: 't1',
      date: '2026-05-01T00:00:00.000Z',
      delta: -50,
      description: 'Nákup',
    },
  ],
  notes: '',
};

const ACCOUNT_2: CharacterAccount = {
  ...ACCOUNT_1,
  id: 'acc2',
  label: 'Tajný fond',
  balance: 800,
  ownerCharacterIds: ['char1', 'char2'],
  incomeEntries: [],
  expenseEntries: [],
  transactions: [],
};

describe('FinanceTab (8.6 multi-account)', () => {
  beforeEach(() => {
    mockAccounts = [ACCOUNT_1];
    mockState = { isLoading: false, isError: false, error: undefined };
    mutateUpdate.mockClear();
    mutateAddMonthly.mockClear();
    mutateUndo.mockClear();
    refetchFn.mockClear();
  });

  it('zobrazí hero zůstatek + příjmy + výdaje pro aktivní účet', () => {
    render(
      <FinanceTab
        page={PAGE}
        mode="view"
        onExitEdit={() => {}}
        onDirtyChange={() => {}}
        onBackToProfil={() => {}}
      />,
    );
    expect(screen.getByText('Aktuální zůstatek')).toBeInTheDocument();
    expect(screen.getByText(/1\s?250/)).toBeInTheDocument();
    // Spec 8.x-prep §4.1 — symbol z world-currencies (mock: '✦') místo code.
    expect(screen.getByText('+300 ✦')).toBeInTheDocument();
    expect(screen.getByText('−100 ✦')).toBeInTheDocument();
    expect(screen.getByText(/Nákup/)).toBeInTheDocument();
  });

  it('summary banner se zobrazí jen pro multi-account', () => {
    const { rerender } = render(
      <FinanceTab
        page={PAGE}
        mode="view"
        onExitEdit={() => {}}
        onDirtyChange={() => {}}
        onBackToProfil={() => {}}
      />,
    );
    // 1 účet — summary banner skryt
    expect(screen.queryByText(/Účty v ZL/)).not.toBeInTheDocument();

    mockAccounts = [ACCOUNT_1, ACCOUNT_2];
    rerender(
      <FinanceTab
        page={PAGE}
        mode="view"
        onExitEdit={() => {}}
        onDirtyChange={() => {}}
        onBackToProfil={() => {}}
      />,
    );
    // Spec 8.x-prep §4.1 — summary má hlavní "Celkem (v ZL)" + rozpad per měně.
    expect(screen.getByText(/Celkem \(v ZL\)/)).toBeInTheDocument();
    // 1250 + 800 = 2050 — render je v "Celkem" i v "Účty v ZL" (per-currency rozpad)
    expect(screen.getAllByText(/2\s?050/).length).toBeGreaterThan(0);
  });

  it('switcher zobrazí všechny účty a přepíná mezi nimi', () => {
    mockAccounts = [ACCOUNT_1, ACCOUNT_2];
    render(
      <FinanceTab
        page={PAGE}
        mode="view"
        onExitEdit={() => {}}
        onDirtyChange={() => {}}
        onBackToProfil={() => {}}
      />,
    );
    expect(screen.getByRole('tab', { name: /Hlavní účet/ })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /Tajný fond/ }),
    ).toBeInTheDocument();

    // První je aktivní (1250)
    expect(screen.getByText(/1\s?250/)).toBeInTheDocument();

    // Klik na druhý
    fireEvent.click(screen.getByRole('tab', { name: /Tajný fond/ }));
    expect(screen.getByText(/800/)).toBeInTheDocument();
  });

  it('shared účet má badge ⚭ v switcheru', () => {
    mockAccounts = [ACCOUNT_1, ACCOUNT_2];
    render(
      <FinanceTab
        page={PAGE}
        mode="view"
        onExitEdit={() => {}}
        onDirtyChange={() => {}}
        onBackToProfil={() => {}}
      />,
    );
    // ACCOUNT_2 je sdílený (2 owners) — má badge
    const sharedTab = screen.getByRole('tab', { name: /Tajný fond/ });
    expect(sharedTab.textContent).toContain('⚭');
  });

  it('error stav → SubdocErrorState s retry', () => {
    mockAccounts = undefined;
    mockState = {
      isLoading: false,
      isError: true,
      error: new Error('boom'),
    };
    render(
      <FinanceTab
        page={PAGE}
        mode="view"
        onExitEdit={() => {}}
        onDirtyChange={() => {}}
        onBackToProfil={() => {}}
      />,
    );
    expect(screen.getByText('Načtení se nepodařilo.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Zkusit znovu'));
    expect(refetchFn).toHaveBeenCalled();
  });

  it('edit mode — uloží update s entries + notes', () => {
    render(
      <FinanceTab
        page={PAGE}
        mode="edit"
        onExitEdit={() => {}}
        onDirtyChange={() => {}}
        onBackToProfil={() => {}}
      />,
    );
    fireEvent.change(screen.getByDisplayValue('Plat'), {
      target: { value: 'Mzda' },
    });
    fireEvent.click(screen.getByText('Uložit změny'));
    expect(mutateUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        incomeEntries: expect.arrayContaining([
          expect.objectContaining({ label: 'Mzda' }),
        ]),
        expenseEntries: expect.any(Array),
        notes: '',
      }),
      expect.anything(),
    );
  });

  // Spec 8.x-prep §4.4 (B4) — tlačítko „Zaúčtovat měsíc" otevírá
  // ConfirmAddMonthlyModal s in-game datem. Mutate se zavolá až confirm uvnitř.
  it('edit mode — „Zaúčtovat měsíc" otevře ConfirmAddMonthlyModal', () => {
    render(
      <FinanceTab
        page={PAGE}
        mode="edit"
        onExitEdit={() => {}}
        onDirtyChange={() => {}}
        onBackToProfil={() => {}}
      />,
    );
    // 2 tlačítka: jedno v sekci „Účtování" (form), spotřebuji první
    const buttons = screen.getAllByText('Zaúčtovat měsíc');
    fireEvent.click(buttons[0]);
    // Modal otevřen — má header „Přehled změn" + InGameDateField label.
    expect(screen.getByText(/Přehled změn/)).toBeInTheDocument();
    expect(screen.getByText(/Herní datum zaúčtování/)).toBeInTheDocument();
    // Mutate se nezavolá hned — až po confirm uvnitř modalu (testováno v
    // ConfirmAddMonthlyModal.spec.tsx).
    expect(mutateAddMonthly).not.toHaveBeenCalled();
  });

  it('empty state — žádné účty → hláška', () => {
    mockAccounts = [];
    render(
      <FinanceTab
        page={PAGE}
        mode="view"
        onExitEdit={() => {}}
        onDirtyChange={() => {}}
        onBackToProfil={() => {}}
      />,
    );
    expect(
      screen.getByText('Žádné účty zatím nejsou.'),
    ).toBeInTheDocument();
  });
});
