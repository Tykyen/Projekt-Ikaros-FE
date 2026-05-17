import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useGalleryCategories } from '../api/useGalleryCategories';
import {
  useApproveGalleryImage,
  useRejectGalleryImage,
} from '../api/useGallery';
import { categoryByKey, categoryStyle, timeAgo } from '../lib/gallery';
import { cloudinaryThumb } from '@/shared/lib/cloudinary';
import { RejectReasonModal } from './RejectReasonModal';
import type { GalleryReviewListItem } from '@/shared/types';
import s from './GalleryReviewRenderer.module.css';

interface ActionsHelpers {
  onResolve: () => void;
  isLoading: boolean;
}

// ─── Left slot — thumbnail + kategorie ──────────────────────────────────

export function GalleryReviewLeft({ item }: { item: GalleryReviewListItem }) {
  const { data: categories = [] } = useGalleryCategories();
  const cat = categoryByKey(categories, item.category);
  return (
    <div className={s.left} style={categoryStyle(cat)}>
      <img
        src={cloudinaryThumb(item.imageUrl, 120, 120)}
        alt=""
        className={s.thumb}
        loading="lazy"
      />
      <span className={s.category}>{cat.label}</span>
    </div>
  );
}

// ─── Mid slot — title + autor + time ────────────────────────────────────

export function GalleryReviewMid({ item }: { item: GalleryReviewListItem }) {
  return (
    <div className={s.mid}>
      <Link to={`/ikaros/galerie/${item.imageId}`} className={s.title}>
        {item.title}
      </Link>
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

export function GalleryReviewActions({
  item,
  helpers,
}: {
  item: GalleryReviewListItem;
  helpers: ActionsHelpers;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const approve = useApproveGalleryImage();
  const reject = useRejectGalleryImage();
  const isLoading = helpers.isLoading || approve.isPending;

  function handleApprove() {
    approve.mutate(item.imageId, {
      onSuccess: () => helpers.onResolve(),
    });
  }

  function handleReject(reason: string) {
    reject.mutate(
      { id: item.imageId, reason },
      {
        onSuccess: () => {
          toast.success('Obrázek vrácen autorovi s poznámkou');
          setRejectOpen(false);
        },
        onError: () => toast.error('Nepodařilo se vrátit obrázek'),
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
        title={`Vrátit obrázek „${item.title}"`}
        isPending={reject.isPending}
        onConfirm={handleReject}
      />
    </>
  );
}
