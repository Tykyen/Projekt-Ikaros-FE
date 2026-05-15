import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useResolveJoinRequest } from '../api/useDiscussions';
import type { DiscussionJoinRequestListItem } from '@/shared/types';
import s from './DiscussionRenderers.module.css';

interface ActionsHelpers {
  onResolve: () => void;
  isLoading: boolean;
}

// ─── Left slot — avatar žadatele ────────────────────────────────────────

export function DiscussionJoinRequestLeft({
  item,
}: {
  item: DiscussionJoinRequestListItem;
}) {
  return (
    <div className={s.left}>
      <span className={s.avatar} aria-hidden>
        {item.username.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
}

// ─── Mid slot — žadatel + diskuze ───────────────────────────────────────

export function DiscussionJoinRequestMid({
  item,
}: {
  item: DiscussionJoinRequestListItem;
}) {
  return (
    <div className={s.mid}>
      <Link to={`/ikaros/uzivatel/${item.userId}`} className={s.title}>
        {item.username}
      </Link>
      <p className={s.excerpt}>
        žádá o přidání do diskuze „{item.discussionTitle}"
      </p>
    </div>
  );
}

// ─── Actions slot — Přijmout / Odmítnout ────────────────────────────────

export function DiscussionJoinRequestActions({
  item,
  helpers,
}: {
  item: DiscussionJoinRequestListItem;
  helpers: ActionsHelpers;
}) {
  const resolve = useResolveJoinRequest();
  const isLoading = helpers.isLoading || resolve.isPending;

  function handle(accept: boolean) {
    resolve.mutate(
      { discussionId: item.discussionId, userId: item.userId, accept },
      {
        onSuccess: () => {
          toast.success(accept ? 'Žadatel přidán' : 'Žádost odmítnuta');
          helpers.onResolve();
        },
        onError: () => toast.error('Nepodařilo se vyřídit žádost'),
      },
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => handle(true)}
        disabled={isLoading}
        className={s.btnApprove}
      >
        Přijmout
      </button>
      <button
        type="button"
        onClick={() => handle(false)}
        disabled={isLoading}
        className={s.btnReject}
      >
        Odmítnout
      </button>
    </>
  );
}
