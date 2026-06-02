import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShopItemForm } from './ShopItemForm';
import type { ShopGroup } from '../types';
import type { WorldCurrencyItem } from '@/features/world/currencies/types';

const currencyItems: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1 },
];

const groups: ShopGroup[] = [
  {
    id: 'g1',
    worldId: 'w1',
    ownerId: 'u1',
    isShared: false,
    name: 'Zbraně',
    order: 0,
    discountPercent: 0,
    createdAt: '',
    updatedAt: '',
  },
];

function renderForm() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ShopItemForm
          worldId="w1"
          mode="add"
          groups={groups}
          allItems={[]}
          currencyItems={currencyItems}
          canShare
          onClose={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ShopItemForm', () => {
  it('vyrenderuje formulář nové položky se skupinami', () => {
    renderForm();
    expect(screen.getByText('Nová položka')).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Zbraně' }),
    ).toBeInTheDocument();
  });

  it('hlásí prázdný název jako chybu a po vyplnění chyba zmizí', () => {
    renderForm();
    expect(screen.getByText('Název je povinný.')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Název');
    fireEvent.change(nameInput, { target: { value: 'Meč' } });
    expect(screen.queryByText('Název je povinný.')).not.toBeInTheDocument();
  });

  it('nabízí přepínač sdílení jen s oprávněním', () => {
    renderForm();
    expect(
      screen.getByText(/Sdílet s ostatními/),
    ).toBeInTheDocument();
  });
});
