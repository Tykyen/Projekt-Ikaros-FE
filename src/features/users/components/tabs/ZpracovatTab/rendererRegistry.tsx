import {
  PendingActionType,
  type AdminUsernameRequestListItem,
  type FriendRequestListItem,
  type WorldAccessRequestListItem,
  type ArticleReviewListItem,
  type GalleryReviewListItem,
  type DiscussionReviewListItem,
  type DiscussionJoinRequestListItem,
  type ContentReportListItem,
  type AppealReviewListItem,
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
import {
  ArticleReviewActions,
  ArticleReviewLeft,
  ArticleReviewMid,
} from '@/features/ikaros/components/ArticleReviewRenderer';
import {
  GalleryReviewActions,
  GalleryReviewLeft,
  GalleryReviewMid,
} from '@/features/ikaros/components/GalleryReviewRenderer';
import {
  DiscussionReviewActions,
  DiscussionReviewLeft,
  DiscussionReviewMid,
} from '@/features/ikaros/components/DiscussionReviewRenderer';
import {
  DiscussionJoinRequestActions,
  DiscussionJoinRequestLeft,
  DiscussionJoinRequestMid,
} from '@/features/ikaros/components/DiscussionJoinRequestRenderer';
import {
  ContentReportActions,
  ContentReportLeft,
  ContentReportMid,
} from '@/features/moderation/components/ContentReportRenderer';
import {
  AppealReviewActions,
  AppealReviewLeft,
  AppealReviewMid,
} from '@/features/moderation/components/AppealReviewRenderer';

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

// 3.2d — article_pending_review (SpravceClanku/Admin/Superadmin schvalují pending články).
const articleReviewRenderer: PendingActionRenderer<ArticleReviewListItem> = {
  type: PendingActionType.ArticlePendingReview,
  renderLeft: (item) => <ArticleReviewLeft item={item} />,
  renderMid: (item) => <ArticleReviewMid item={item} />,
  renderActions: (item, helpers) => (
    <ArticleReviewActions item={item} helpers={helpers} />
  ),
};

// 3.3b — gallery_pending_review (SpravceGalerie/Admin/Superadmin schvalují pending obrázky).
const galleryReviewRenderer: PendingActionRenderer<GalleryReviewListItem> = {
  type: PendingActionType.GalleryPendingReview,
  renderLeft: (item) => <GalleryReviewLeft item={item} />,
  renderMid: (item) => <GalleryReviewMid item={item} />,
  renderActions: (item, helpers) => (
    <GalleryReviewActions item={item} helpers={helpers} />
  ),
};

// 3.4b — discussion_pending_review (SpravceDiskuzi/Admin/Superadmin schvalují diskuze).
const discussionReviewRenderer: PendingActionRenderer<DiscussionReviewListItem> =
  {
    type: PendingActionType.DiscussionPendingReview,
    renderLeft: () => <DiscussionReviewLeft />,
    renderMid: (item) => <DiscussionReviewMid item={item} />,
    renderActions: (item, helpers) => (
      <DiscussionReviewActions item={item} helpers={helpers} />
    ),
  };

// B4d — discussion_report sjednocen do generického content_report (níže);
// vlastní renderer odstraněn.

// 3.4b — discussion_join_request (manažer diskuze řeší žádosti o přidání).
const discussionJoinRequestRenderer: PendingActionRenderer<DiscussionJoinRequestListItem> =
  {
    type: PendingActionType.DiscussionJoinRequest,
    renderLeft: (item) => <DiscussionJoinRequestLeft item={item} />,
    renderMid: (item) => <DiscussionJoinRequestMid item={item} />,
    renderActions: (item, helpers) => (
      <DiscussionJoinRequestActions item={item} helpers={helpers} />
    ),
  };

// 20B — content_report (generická moderační fronta napříč plochami).
const contentReportRenderer: PendingActionRenderer<ContentReportListItem> = {
  type: PendingActionType.ContentReport,
  renderLeft: () => <ContentReportLeft />,
  renderMid: (item) => <ContentReportMid item={item} />,
  renderActions: (item, helpers) => (
    <ContentReportActions item={item} helpers={helpers} />
  ),
};

// 20B B4 — moderation_appeal (odvolání proti rozhodnutí; přezkum jiným moderátorem).
const appealReviewRenderer: PendingActionRenderer<AppealReviewListItem> = {
  type: PendingActionType.ModerationAppeal,
  renderLeft: () => <AppealReviewLeft />,
  renderMid: (item) => <AppealReviewMid item={item} />,
  renderActions: (item, helpers) => (
    <AppealReviewActions item={item} helpers={helpers} />
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
  [PendingActionType.ArticlePendingReview]:
    articleReviewRenderer as PendingActionRenderer<unknown>,
  [PendingActionType.GalleryPendingReview]:
    galleryReviewRenderer as PendingActionRenderer<unknown>,
  [PendingActionType.DiscussionPendingReview]:
    discussionReviewRenderer as PendingActionRenderer<unknown>,
  [PendingActionType.DiscussionJoinRequest]:
    discussionJoinRequestRenderer as PendingActionRenderer<unknown>,
  [PendingActionType.ContentReport]:
    contentReportRenderer as PendingActionRenderer<unknown>,
  [PendingActionType.ModerationAppeal]:
    appealReviewRenderer as PendingActionRenderer<unknown>,
};
