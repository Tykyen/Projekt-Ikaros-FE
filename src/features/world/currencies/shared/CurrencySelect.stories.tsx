import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { CurrencySelect } from './CurrencySelect';
import type { WorldCurrencyItem } from '../types';

const fantasy: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1.0 },
  { id: 'b', code: 'ST', name: 'Stříbrňák', symbol: 'St', rate: 0.1 },
  { id: 'c', code: 'MD', name: 'Měďák', symbol: 'Md', rate: 0.01 },
];

const meta: Meta<typeof CurrencySelect> = {
  title: 'Currencies/CurrencySelect',
  component: CurrencySelect,
};
export default meta;

type Story = StoryObj<typeof CurrencySelect>;

function Controlled({
  initial,
  items,
  showSymbol,
  filterBy,
}: {
  initial: string;
  items: WorldCurrencyItem[];
  showSymbol?: boolean;
  filterBy?: (i: WorldCurrencyItem) => boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <CurrencySelect
      value={value}
      onChange={setValue}
      items={items}
      showSymbol={showSymbol}
      filterBy={filterBy}
    />
  );
}

export const Default: Story = {
  render: () => <Controlled initial="ZL" items={fantasy} />,
};

export const WithoutSymbol: Story = {
  render: () => <Controlled initial="ST" items={fantasy} showSymbol={false} />,
};

export const FilteredOutBase: Story = {
  render: () => (
    <Controlled
      initial="ST"
      items={fantasy}
      filterBy={(i) => i.code !== 'ZL'}
    />
  ),
};

export const EmptyState: Story = {
  render: () => <Controlled initial="" items={[]} />,
};
