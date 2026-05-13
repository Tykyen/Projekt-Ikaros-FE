import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserRole } from '@/shared/types';
import { RoleChip } from './RoleChip';

const meta: Meta<typeof RoleChip> = {
  title: 'Users 1.4/RoleChip',
  component: RoleChip,
  argTypes: {
    size: {
      control: 'radio',
      options: ['sm', 'md'],
    },
    tooltip: {
      control: 'boolean',
    },
    role: {
      control: 'select',
      options: [
        UserRole.Superadmin,
        UserRole.Admin,
        UserRole.SpravceClanku,
        UserRole.SpravceGalerie,
        UserRole.SpravceDiskuzi,
        UserRole.Ikarus,
      ],
    },
  },
};
export default meta;

type Story = StoryObj<typeof RoleChip>;

export const Superadmin: Story = {
  args: { role: UserRole.Superadmin, size: 'md', tooltip: true },
};

export const Admin: Story = {
  args: { role: UserRole.Admin, size: 'md', tooltip: true },
};

export const SpravceClanku: Story = {
  args: { role: UserRole.SpravceClanku, size: 'md', tooltip: true },
};

export const SpravceGalerie: Story = {
  args: { role: UserRole.SpravceGalerie, size: 'md', tooltip: true },
};

export const SpravceDiskuzi: Story = {
  args: { role: UserRole.SpravceDiskuzi, size: 'md', tooltip: true },
};

/** Ikarus (base user) nevykreslí žádný chip — chip stories nezobrazí nic. */
export const Ikarus_None: Story = {
  args: { role: UserRole.Ikarus },
};

export const SmallSize: Story = {
  args: { role: UserRole.Superadmin, size: 'sm' },
};

/** Gallery — všechny chipy vedle sebe pro vizuální audit barev a kontrastu. */
export const Gallery: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        padding: 24,
      }}
    >
      <RoleChip role={UserRole.Superadmin} />
      <RoleChip role={UserRole.Admin} />
      <RoleChip role={UserRole.SpravceClanku} />
      <RoleChip role={UserRole.SpravceGalerie} />
      <RoleChip role={UserRole.SpravceDiskuzi} />
    </div>
  ),
};
