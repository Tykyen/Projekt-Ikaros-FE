import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  argTypes: {
    padding: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <>
        <h3>Nadpis karty</h3>
        <p>Toto je tělo karty s textem který by měl být čitelný ve všech tématech.</p>
      </>
    ),
  },
};

export const Clickable: Story = {
  args: {
    clickable: true,
    children: (
      <>
        <h3>Klikací karta</h3>
        <p>Najeď myší — kurzor a hover efekt.</p>
      </>
    ),
  },
};
