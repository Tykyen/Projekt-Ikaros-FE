import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ShopItemCard } from './ShopItemCard';
import type { ShopItem, ShopGroup } from '../types';
import type { WorldCurrencyItem } from '@/features/world/currencies/types';

const currencyItems: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1 },
];

function makeItem(over: Partial<ShopItem> = {}): ShopItem {
  return {
    id: 'i1',
    worldId: 'w1',
    ownerId: 'u1',
    isShared: false,
    name: 'Dlouhý meč',
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

function renderCard(item: ShopItem, group?: ShopGroup | null) {
  return render(
    <MemoryRouter>
      <ShopItemCard
        item={item}
        group={group}
        currencyItems={currencyItems}
        preferredCode="ZL"
        worldSlug="muj-svet"
        canManage={false}
        onDetail={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe('ShopItemCard', () => {
  it('zobrazí název a plnou cenu bez slevy', () => {
    renderCard(makeItem());
    expect(screen.getByText('Dlouhý meč')).toBeInTheDocument();
    expect(screen.getByText('100 Zl')).toBeInTheDocument();
  });

  it('při slevě položky ukáže přeškrtnutou cenu + badge', () => {
    renderCard(makeItem({ discountPercent: 20 }));
    // 100 −20 % = 80
    expect(screen.getByText('80 Zl')).toBeInTheDocument();
    expect(screen.getByText('100 Zl')).toBeInTheDocument();
    expect(screen.getByText('−20 %')).toBeInTheDocument();
  });

  it('zdědí slevu ze skupiny, když položka nemá vlastní', () => {
    const group: ShopGroup = {
      id: 'g1',
      worldId: 'w1',
      ownerId: 'u1',
      isShared: false,
      name: 'Zbraně',
      order: 0,
      discountPercent: 10,
      createdAt: '',
      updatedAt: '',
    };
    renderCard(makeItem({ groupId: 'g1' }), group);
    expect(screen.getByText('90 Zl')).toBeInTheDocument();
    expect(screen.getByText('−10 %')).toBeInTheDocument();
  });

  it('doporučenou položku označí hvězdou', () => {
    renderCard(makeItem({ isRecommended: true }));
    expect(screen.getByTitle('Doporučeno')).toBeInTheDocument();
  });

  it('referenceLink renderuje překlik na stránku světa', () => {
    renderCard(makeItem({ referenceLink: 'dlouhy-mec' }));
    const link = screen.getByRole('link', { name: /Info/ });
    expect(link).toHaveAttribute('href', '/svet/muj-svet/dlouhy-mec');
  });
});
