import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { MessagesSquare } from 'lucide-react';
import { useApproveDiscussion, useRejectDiscussion } from '../api/useDiscussions';
import { timeAgo } from '../lib/gallery';
import { RejectReasonModal } from './RejectReasonModal';
import type { DiscussionReviewListItem } from '@/shared/types';
import s from './DiscussionRenderers.module.css';

interface ActionsHelpers {
  onResolve: () => void;
  isLoading: boolean;
}

// ─── Left slot — ikona + štítek ─────────────────────────────────────────

export function DiscussionReviewLeft() {
  return (
    <div className={s.left}>
      <MessagesSquare size={28} aria-hidden />
      <span className={s.leftLabel}>Diskuze</span>
    </div>
  );
}

// ─── Mid slot — název + úryvek + autor + čas ────────────────────────────

export function DiscussionReviewMid({
  item,
}: {
  item: DiscussionReviewListItem;
}) {
  return (
    <div className={s.mid}>
      <span className={s.title}>{item.title}</span>
      {item.descriptionExcerpt && (
        <p className={s.excerpt}>{item.descriptionExcerpt}…</p>
      )}
      <div className={s.meta}>
        <Link to={`/ikaros/uzivatel/${item.creatorId}`} className={s.author}>
          {item.creatorName}
        </Link>
        <span className={s.dot}>·</span>
        <span>{timeAgo(item.submittedAt)}</span>
      </div>
    </div>
  );
}

// ─── Actions slot — Schválit / Vrátit s poznámkou ───────────────────────

export function DiscussionReviewActions({
  item,
  helpers,
}: {
  item: DiscussionReviewListItem;
  helpers: ActionsHelpers;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const approve = useApproveDiscussion();
  const reject = useRejectDiscussion();
  const isLoading = helpers.isLoading || approve.isPending;

  function handleApprove() {
    approve.mutate(item.discussionId, {
      onSuccess: () => helpers.onResolve(),
      onError: () => toast.error('Nepodařilo se schválit diskuzi'),
    });
  }

  function handleReject(reason: string) {
    reject.mutate(
      { id: item.discussionId, reason },
      {
        onSuccess: () => {
          toast.success('Diskuze zamítnuta s poznámkou');
          setRejectOpen(false);
          helpers.onResolve();
        },
        onError: () => toast.error('Nepodařilo se zamítnout diskuzi'),
      },
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleApprove}
        disabled={isLoading}
        className={s.btnApprove}
      >
        Schválit
      </button>
      <button
        type="button"
        onClick={() => setRejectOpen(true)}
        disabled={isLoading}
        className={s.btnReject}
      >
        Vrátit s poznámkou
      </button>
      <RejectReasonModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={`Zamítnout diskuzi „${item.title}"`}
        isPending={reject.isPending}
        onConfirm={handleReject}
      />
    </>
  );
}
