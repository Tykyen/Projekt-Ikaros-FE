import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: 'Klikni mě', variant: 'primary' },
};

export const Secondary: Story = {
  args: { children: 'Sekundární', variant: 'secondary' },
};

export const Ghost: Story = {
  args: { children: 'Ghost', variant: 'ghost' },
};

export const Danger: Story = {
  args: { children: 'Smazat', variant: 'danger' },
};

export const Loading: Story = {
  args: { children: 'Načítám…', loading: true },
};

export const Disabled: Story = {
  args: { children: 'Vypnuto', disabled: true },
};
