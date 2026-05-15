import { toast } from 'sonner';
import { Flag } from 'lucide-react';
import { useResolveReport } from '../api/useDiscussions';
import { timeAgo } from '../lib/gallery';
import type { DiscussionReportListItem } from '@/shared/types';
import s from './DiscussionRenderers.module.css';

interface ActionsHelpers {
  onResolve: () => void;
  isLoading: boolean;
}

/** Naivní strip HTML — snapshot je TipTap HTML, pro náhled stačí prostý text. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Left slot — ikona vlajky ───────────────────────────────────────────

export function DiscussionReportLeft() {
  return (
    <div className={s.left}>
      <Flag size={28} aria-hidden />
      <span className={s.leftLabel}>Hlášení</span>
    </div>
  );
}

// ─── Mid slot — diskuze + nahlášený obsah + důvod ───────────────────────

export function DiscussionReportMid({
  item,
}: {
  item: DiscussionReportListItem;
}) {
  return (
    <div className={s.mid}>
      <span className={s.title}>{item.discussionTitle}</span>
      <p className={s.snapshot}>{stripHtml(item.postContentSnapshot)}</p>
      <p className={s.reason}>
        <span className={s.reasonLabel}>Důvod: </span>
        {item.reason}
      </p>
      <div className={s.meta}>
        <span>příspěvek od {item.postAuthorName}</span>
        <span className={s.dot}>·</span>
        <span>nahlásil {item.reporterName}</span>
        <span className={s.dot}>·</span>
        <span>{timeAgo(item.createdAt)}</span>
      </div>
    </div>
  );
}

// ─── Actions slot — Smazat příspěvek / Ponechat ─────────────────────────

export function DiscussionReportActions({
  item,
  helpers,
}: {
  item: DiscussionReportListItem;
  helpers: ActionsHelpers;
}) {
  const resolve = useResolveReport();
  const isLoading = helpers.isLoading || resolve.isPending;

  function handle(deletePost: boolean) {
    resolve.mutate(
      { reportId: item.reportId, deletePost },
      {
        onSuccess: () => {
          toast.success(
            deletePost ? 'Příspěvek smazán' : 'Hlášení uzavřeno',
          );
          helpers.onResolve();
        },
        onError: () => toast.error('Nepodařilo se vyřídit hlášení'),
      },
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => handle(true)}
        disabled={isLoading}
        className={s.btnDanger}
      >
        Smazat příspěvek
      </button>
      <button
        type="button"
        onClick={() => handle(false)}
        disabled={isLoading}
        className={s.btnReject}
      >
        Ponechat
      </button>
    </>
  );
}
