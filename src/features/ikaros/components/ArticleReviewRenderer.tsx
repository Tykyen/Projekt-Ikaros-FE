import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useArticleCategories } from '../api/useArticleCategories';
import { useApproveArticle, useRejectArticle } from '../api/useArticles';
import {
  articleNumber,
  categoryByKey,
  categoryStyle,
  timeAgo,
} from '../lib/articles';
import { RejectReasonModal } from './RejectReasonModal';
import type { ArticleReviewListItem } from '@/shared/types';
import s from './ArticleReviewRenderer.module.css';

interface ActionsHelpers {
  onResolve: () => void;
  isLoading: boolean;
}

// ─── Left slot — N° ID + kategorie ──────────────────────────────────────

export function ArticleReviewLeft({ item }: { item: ArticleReviewListItem }) {
  const { data: categories = [] } = useArticleCategories();
  const cat = categoryByKey(categories, item.category);
  return (
    <div className={s.left} style={categoryStyle(cat)}>
      <span className={s.number}>N° {articleNumber(item.articleId)}</span>
      <span className={s.category}>
        <span className={s.waxSeal} />
        {cat.label}
      </span>
    </div>
  );
}

// ─── Mid slot — title + preview + autor + time ──────────────────────────

export function ArticleReviewMid({ item }: { item: ArticleReviewListItem }) {
  return (
    <div className={s.mid}>
      <Link to={`/ikaros/clanky/${item.articleId}`} className={s.title}>
        {item.title}
      </Link>
      <p className={s.preview}>{item.preview}…</p>
      <div className={s.meta}>
        {/* D-040 — disabled link + náhradní label pro smazaného autora. */}
        {item.authorIsDeleted ? (
          <span className={s.author} style={{ fontStyle: 'italic', opacity: 0.7 }}>
            Smazaný účet
          </span>
        ) : (
          <Link to={`/ikaros/uzivatel/${item.authorId}`} className={s.author}>
            {item.authorName}
          </Link>
        )}
        <span className={s.dot}>·</span>
        <span>{timeAgo(item.submittedAt)}</span>
      </div>
    </div>
  );
}

// ─── Actions slot — Schválit / Vrátit s poznámkou ───────────────────────

export function ArticleReviewActions({
  item,
  helpers,
}: {
  item: ArticleReviewListItem;
  helpers: ActionsHelpers;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const approve = useApproveArticle();
  const reject = useRejectArticle();
  const isLoading = helpers.isLoading || approve.isPending;

  function handleApprove() {
    approve.mutate(item.articleId, {
      onSuccess: () => helpers.onResolve(),
    });
  }

  function handleReject(reason: string) {
    reject.mutate(
      { id: item.articleId, reason },
      {
        onSuccess: () => {
          toast.success('Článek vrácen autorovi s poznámkou');
          setRejectOpen(false);
        },
        onError: () => toast.error('Nepodařilo se vrátit článek'),
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
        title={`Vrátit článek „${item.title}"`}
        isPending={reject.isPending}
        onConfirm={handleReject}
      />
    </>
  );
}
