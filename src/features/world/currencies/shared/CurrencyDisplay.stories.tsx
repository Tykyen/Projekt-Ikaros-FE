import type { Meta, StoryObj } from '@storybook/react-vite';
import { CurrencyDisplay } from './CurrencyDisplay';
import type { WorldCurrencyItem } from '../types';

const items: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1.0 },
  { id: 'b', code: 'ST', name: 'Stříbrňák', symbol: 'St', rate: 0.1 },
  { id: 'c', code: 'MD', name: 'Měďák', symbol: 'Md', rate: 0.01 },
];

const meta: Meta<typeof CurrencyDisplay> = {
  title: 'Currencies/CurrencyDisplay',
  component: CurrencyDisplay,
};
export default meta;

type Story = StoryObj<typeof CurrencyDisplay>;

export const Default: Story = {
  args: { amount: 1234.5, currencyCode: 'ZL', items },
};

export const Converted: Story = {
  args: { amount: 100, currencyCode: 'ZL', items, convertTo: 'ST' },
};

export const ConvertedToBase: Story = {
  args: { amount: 1000, currencyCode: 'ST', items, convertTo: 'ZL' },
};

export const TooltipDisabled: Story = {
  args: {
    amount: 100,
    currencyCode: 'ZL',
    items,
    convertTo: 'ST',
    showTooltip: false,
  },
};
