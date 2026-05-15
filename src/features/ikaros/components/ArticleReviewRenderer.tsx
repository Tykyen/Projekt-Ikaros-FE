import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useArticleCategories } from '../api/useArticleCategories';
import { useApproveArticle } from '../api/useArticles';
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
        <Link to={`/ikaros/uzivatel/${item.authorId}`} className={s.author}>
          {item.authorName}
        </Link>
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
  const isLoading = helpers.isLoading || approve.isPending;

  function handleApprove() {
    approve.mutate(item.articleId, {
      onSuccess: () => helpers.onResolve(),
    });
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
        onClose={() => {
          setRejectOpen(false);
          // RejectReasonModal sám invaliduje articles + pending-actions, takže
          // explicitně volat onResolve není potřeba (Zpracovat tab se obnoví).
        }}
        articleId={item.articleId}
        articleTitle={item.title}
      />
    </>
  );
}
