import {
  PendingActionType,
  type AdminUsernameRequestListItem,
  type FriendRequestListItem,
  type WorldJoinRequestListItem,
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
  WorldJoinRequestActions,
  WorldJoinRequestLeft,
  WorldJoinRequestMid,
} from '@/features/world/components/WorldJoinRequestRenderer';

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

const worldJoinRequestRenderer: PendingActionRenderer<WorldJoinRequestListItem> =
  {
    type: PendingActionType.WorldJoinRequest,
    renderLeft: (item) => <WorldJoinRequestLeft item={item} />,
    renderMid: (item) => <WorldJoinRequestMid item={item} />,
    renderActions: (item, helpers) => (
      <WorldJoinRequestActions
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
 * 2.4: `world_join_request` (PJ schvaluje žádosti o vstup do svého světa).
 * Další fáze (3.x content review) přidají rendery sem.
 */
export const PENDING_ACTION_RENDERERS: Partial<
  Record<PendingActionType, PendingActionRenderer<unknown>>
> = {
  [PendingActionType.UsernameRequest]:
    usernameRequestRenderer as PendingActionRenderer<unknown>,
  [PendingActionType.FriendRequest]:
    friendRequestRenderer as PendingActionRenderer<unknown>,
  [PendingActionType.WorldJoinRequest]:
    worldJoinRequestRenderer as PendingActionRenderer<unknown>,
};
