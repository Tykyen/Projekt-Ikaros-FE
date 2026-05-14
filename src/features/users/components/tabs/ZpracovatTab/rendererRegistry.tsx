import {
  PendingActionType,
  type AdminUsernameRequestListItem,
  type FriendRequestListItem,
  type WorldAccessRequestListItem,
} from '@/shared/types';
import type { PendingActionRenderer } from './PendingActionCard';
import {
  UsernameRequestActions,
  UsernameRequestLeft,
  UsernameRequestMid,
} from './UsernameRequestRenderer';
import {
  FriendRequestActions,
  FriendRequestLeft,
  FriendRequestMid,
} from '@/features/friendships/components/FriendRequestRenderer';
import {
  WorldAccessRequestActions,
  WorldAccessRequestLeft,
  WorldAccessRequestMid,
} from '@/features/world/components/WorldAccessRequestRenderer';

const usernameRequestRenderer: PendingActionRenderer<AdminUsernameRequestListItem> =
  {
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

const friendRequestRenderer: PendingActionRenderer<FriendRequestListItem> = {
  type: PendingActionType.FriendRequest,
  renderLeft: (item) => <FriendRequestLeft item={item} />,
  renderMid: (item) => <FriendRequestMid item={item} />,
  renderActions: (item, helpers) => (
    <FriendRequestActions
      item={item}
      onResolve={helpers.onResolve}
      isLoading={helpers.isLoading}
    />
  ),
};

const worldAccessRequestRenderer: PendingActionRenderer<WorldAccessRequestListItem> =
  {
    type: PendingActionType.WorldAccessRequest,
    renderLeft: (item) => <WorldAccessRequestLeft item={item} />,
    renderMid: (item) => <WorldAccessRequestMid item={item} />,
    renderActions: (item, helpers) => (
      <WorldAccessRequestActions
        item={item}
        onResolve={helpers.onResolve}
        isLoading={helpers.isLoading}
      />
    ),
  };

/**
 * Spec 1.4 — registry rendererů pro Zpracovat tab. Klíč = `PendingActionType`,
 * hodnota = konkrétní renderer.
 *
 * 1.4: `username_request` (přesun z 1.3b).
 * 1.8: `friend_request` (nový — viz spec-1.8 §4.5).
 * 2.4: `world_access_request` (nový — viz spec-2.4 §4.6).
 * Další fáze (3.x content review) přidají rendery sem.
 */
export const PENDING_ACTION_RENDERERS: Partial<
  Record<PendingActionType, PendingActionRenderer<unknown>>
> = {
  [PendingActionType.UsernameRequest]:
    usernameRequestRenderer as PendingActionRenderer<unknown>,
  [PendingActionType.FriendRequest]:
    friendRequestRenderer as PendingActionRenderer<unknown>,
  [PendingActionType.WorldAccessRequest]:
    worldAccessRequestRenderer as PendingActionRenderer<unknown>,
};
