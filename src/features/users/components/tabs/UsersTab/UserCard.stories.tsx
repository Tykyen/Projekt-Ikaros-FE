import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { UserRole, type PublicUserListItem } from '@/shared/types';
import { UserCard } from './UserCard';

const baseUser: PublicUserListItem = {
  id: 'u1',
  username: 'tyky_tan_junior',
  displayName: 'Tyky Tan Junior',
  city: 'Praha',
  avatarUrl: null,
  defaultAvatarType: 'male',
  role: UserRole.Superadmin,
  worldsCount: 4,
  createdAt: '2025-03-01T00:00:00Z',
};

const meta: Meta<typeof UserCard> = {
  title: 'Users 1.4/UserCard',
  component: UserCard,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ maxWidth: 280, padding: 24 }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof UserCard>;

export const SuperadminCard: Story = {
  args: { user: baseUser, onOpen: () => {} },
};

export const AdminCard: Story = {
  args: { user: { ...baseUser, role: UserRole.Admin }, onOpen: () => {} },
};

export const SpravceClankuCard: Story = {
  args: {
    user: { ...baseUser, role: UserRole.SpravceClanku },
    onOpen: () => {},
  },
};

export const SpravceGalerieCard: Story = {
  args: {
    user: { ...baseUser, role: UserRole.SpravceGalerie },
    onOpen: () => {},
  },
};

export const SpravceDiskuziCard: Story = {
  args: {
    user: { ...baseUser, role: UserRole.SpravceDiskuzi },
    onOpen: () => {},
  },
};

export const HracCard: Story = {
  args: {
    user: { ...baseUser, role: UserRole.Ikarus, username: 'alice' },
    onOpen: () => {},
  },
};

export const NoCity: Story = {
  args: { user: { ...baseUser, city: null }, onOpen: () => {} },
};

export const NoDisplayName: Story = {
  args: { user: { ...baseUser, displayName: null }, onOpen: () => {} },
};

export const SingleWorld: Story = {
  args: { user: { ...baseUser, worldsCount: 1 }, onOpen: () => {} },
};

export const ZeroWorlds: Story = {
  args: { user: { ...baseUser, worldsCount: 0 }, onOpen: () => {} },
};

export const WithKebab: Story = {
  args: { user: baseUser, onOpen: () => {}, onKebab: () => {} },
};

/** Admin includeDeleted=1 view — pending deletion overlay. */
export const PendingDeletion: Story = {
  args: {
    user: { ...baseUser, pendingDeletion: true },
    onOpen: () => {},
    onKebab: () => {},
  },
};

/** Admin includeDeleted=1 view — tombstone deleted overlay. */
export const TombstoneDeleted: Story = {
  args: {
    user: { ...baseUser, deleted: true },
    onOpen: () => {},
    onKebab: () => {},
  },
};
