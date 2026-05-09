import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'accent', 'success', 'warning', 'danger'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: '5' },
};

export const Accent: Story = {
  args: { children: 'Nové', variant: 'accent' },
};

export const Success: Story = {
  args: { children: 'OK', variant: 'success' },
};

export const Warning: Story = {
  args: { children: 'Pozor', variant: 'warning' },
};

export const Danger: Story = {
  args: { children: 'Chyba', variant: 'danger' },
};
