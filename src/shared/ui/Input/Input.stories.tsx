import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Empty: Story = {
  args: { placeholder: 'Zadej text…' },
};

export const WithLabel: Story = {
  args: { label: 'Jméno', placeholder: 'Zadej jméno' },
};

export const Filled: Story = {
  args: { defaultValue: 'Vyplněná hodnota', label: 'Email' },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    defaultValue: 'spatny-email',
    error: 'Neplatný formát e-mailu',
  },
};
