import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  PendingActionType,
  type AdminUsernameRequestListItem,
} from '@/shared/types';
import { PendingActionCard, type PendingActionRenderer } from './PendingActionCard';
import {
  UsernameRequestActions,
  UsernameRequestLeft,
  UsernameRequestMid,
} from './UsernameRequestRenderer';

const qc = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

const mockUsernameRequest: AdminUsernameRequestListItem = {
  id: 'r1',
  requestedUsername: 'NovaPrezdivka',
  status: 'pending',
  requestedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
  decidedAt: null,
  decisionReason: null,
  user: {
    id: 'u1',
    username: 'tyky_tan_junior',
    avatarUrl: null,
    defaultAvatarType: 'male',
  },
  decidedBy: null,
};

const meta: Meta<typeof PendingActionCard> = {
  title: 'Users 1.4/PendingActionCard',
  component: PendingActionCard,
  decorators: [
    (Story) => (
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <div style={{ maxWidth: 720, padding: 24 }}>
            <Story />
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof PendingActionCard>;

const usernameRendererTyped: PendingActionRenderer<AdminUsernameRequestListItem> = {
  type: PendingActionType.UsernameRequest,
  renderLeft: (item) => <UsernameRequestLeft item={item} />,
  renderMid: (item) => <UsernameRequestMid item={item} />,
  renderActions: (item, helpers) => (
    <UsernameRequestActions
      item={item}
      onResolve={helpers.onResolve}
      isLoading={helpers.isLoading}
    />
  ),
};

// Storybook `Meta<typeof PendingActionCard>` collapses generics to unknown;
// cast je pouze pro Storybook args typing — runtime je typesafe přes renderer.
const usernameRenderer =
  usernameRendererTyped as unknown as PendingActionRenderer<unknown>;

export const UsernameRequest: Story = {
  args: {
    item: mockUsernameRequest,
    renderer: usernameRenderer,
    isResolving: false,
    onResolve: () => {},
  },
};

export const UsernameRequest_Resolving: Story = {
  args: {
    item: mockUsernameRequest,
    renderer: usernameRenderer,
    isResolving: true,
    onResolve: () => {},
  },
};

export const UsernameRequest_FreshlyCreated: Story = {
  args: {
    item: { ...mockUsernameRequest, requestedAt: new Date().toISOString() },
    renderer: usernameRenderer,
    isResolving: false,
    onResolve: () => {},
  },
};

export const UsernameRequest_OldRequest: Story = {
  args: {
    item: {
      ...mockUsernameRequest,
      requestedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    },
    renderer: usernameRenderer,
    isResolving: false,
    onResolve: () => {},
  },
};

/** Gallery — multiple cards stacked (jak vypadají v Zpracovat tabu). */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <PendingActionCard
        item={mockUsernameRequest}
        renderer={usernameRenderer}
        isResolving={false}
        onResolve={() => {}}
      />
      <PendingActionCard
        item={{
          ...mockUsernameRequest,
          id: 'r2',
          requestedUsername: 'JinyNick',
          user: {
            ...mockUsernameRequest.user!,
            id: 'u2',
            username: 'alice_wonder',
            defaultAvatarType: 'female',
          },
        }}
        renderer={usernameRenderer}
        isResolving={false}
        onResolve={() => {}}
      />
    </div>
  ),
};
