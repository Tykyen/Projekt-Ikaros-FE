import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { CurrencyAmountInput } from './CurrencyAmountInput';
import type { WorldCurrencyItem } from '../types';

const items: WorldCurrencyItem[] = [
  { id: 'a', code: 'ZL', name: 'Zlaťák', symbol: 'Zl', rate: 1.0 },
  { id: 'b', code: 'ST', name: 'Stříbrňák', symbol: 'St', rate: 0.1 },
  { id: 'c', code: 'MD', name: 'Měďák', symbol: 'Md', rate: 0.01 },
];

const meta: Meta<typeof CurrencyAmountInput> = {
  title: 'Currencies/CurrencyAmountInput',
  component: CurrencyAmountInput,
};
export default meta;

type Story = StoryObj<typeof CurrencyAmountInput>;

function Controlled(props: {
  initial: number | '';
  initialCode: string;
  readOnly?: boolean;
}) {
  const [amount, setAmount] = useState<number | ''>(props.initial);
  const [code, setCode] = useState(props.initialCode);
  return (
    <CurrencyAmountInput
      amount={amount}
      currencyCode={code}
      onAmountChange={setAmount}
      onCurrencyChange={setCode}
      items={items}
      readOnlyAmount={props.readOnly}
    />
  );
}

export const Default: Story = {
  render: () => <Controlled initial={100} initialCode="ZL" />,
};

export const LargeAmount: Story = {
  render: () => <Controlled initial={1234567.89} initialCode="ZL" />,
};

export const ReadOnlyResult: Story = {
  render: () => <Controlled initial={1000} initialCode="ST" readOnly />,
};

export const Empty: Story = {
  render: () => <Controlled initial="" initialCode="ZL" />,
};
