import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { api } from '@/shared/api/client';
import {
  FriendRequestActions,
  FriendRequestLeft,
  FriendRequestMid,
} from '../FriendRequestRenderer';
import { UserRole, type FriendRequestListItem } from '@/shared/types';

vi.mock('@/shared/api/client', async () => {
  const actual =
    await vi.importActual<typeof import('@/shared/api/client')>(
      '@/shared/api/client',
    );
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  };
});
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const apiPost = vi.mocked(api.post);
const apiDelete = vi.mocked(api.delete);

const sampleItem: FriendRequestListItem = {
  friendshipId: 'f1',
  requestedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  direction: 'incoming',
  counterpart: {
    id: 'u2',
    username: 'alice',
    displayName: null,
    avatarUrl: null,
    defaultAvatarType: 'female',
    role: UserRole.Ikarus,
  },
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('FriendRequestRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderMid zobrazí username + text žádosti', () => {
    render(<FriendRequestMid item={sampleItem} />, { wrapper: makeWrapper() });
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(
      screen.getByText(/posílá žádost o\s+přátelství/i),
    ).toBeInTheDocument();
  });

  it('renderLeft vykreslí avatar element', () => {
    const { container } = render(<FriendRequestLeft item={sampleItem} />);
    // UserAvatar je obrázek/element s alt textem
    expect(container.querySelector('img, span, div')).toBeTruthy();
  });

  it('klik na Přijmout volá accept mutation + onResolve', async () => {
    apiPost.mockResolvedValue({ friendship: { id: 'f1' } });
    const onResolve = vi.fn();
    render(
      <FriendRequestActions
        item={sampleItem}
        onResolve={onResolve}
        isLoading={false}
      />,
      { wrapper: makeWrapper() },
    );
    await userEvent.click(screen.getByRole('button', { name: /Přijmout/ }));
    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/friends/f1/accept'),
    );
    expect(onResolve).toHaveBeenCalled();
  });

  it('klik na Odmítnout volá remove mutation + onResolve', async () => {
    apiDelete.mockResolvedValue(undefined);
    const onResolve = vi.fn();
    render(
      <FriendRequestActions
        item={sampleItem}
        onResolve={onResolve}
        isLoading={false}
      />,
      { wrapper: makeWrapper() },
    );
    await userEvent.click(screen.getByRole('button', { name: /Odmítnout/ }));
    await waitFor(() =>
      expect(apiDelete).toHaveBeenCalledWith('/friends/f1'),
    );
    expect(onResolve).toHaveBeenCalled();
  });

  it('isLoading disabluje obě tlačítka', () => {
    render(
      <FriendRequestActions
        item={sampleItem}
        onResolve={() => {}}
        isLoading
      />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getByRole('button', { name: /Odmítnout/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Přijmout/ })).toBeDisabled();
  });
});
