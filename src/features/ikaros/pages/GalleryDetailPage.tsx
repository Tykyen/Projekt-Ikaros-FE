import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { ArrowLeft, Check, Pencil, Trash2 } from 'lucide-react';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { Spinner } from '@/shared/ui';
import {
  useGalleryImage,
  useApproveGalleryImage,
  useRejectGalleryImage,
  useDeleteGalleryImage,
  useSubmitGalleryImage,
  useRateGalleryImage,
} from '../api/useGallery';
import { useGalleryCategories } from '../api/useGalleryCategories';
import { categoryByKey, formatDateCs, statusColor, statusLabel } from '../lib/gallery';
import { RatingStars } from '../components/RatingStars';
import { RejectReasonModal } from '../components/RejectReasonModal';
import type { IkarosGalleryItem } from '@/shared/types';
import s from './GalleryDetailPage.module.css';

const REVIEWER_ROLES: UserRole[] = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.SpravceGalerie,
];

export default function GalleryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: image, isLoading, error } = useGalleryImage(id);
  const { data: categories = [] } = useGalleryCategories();

  if (isLoading) return <Spinner center />;
  if (error || !image) {
    return (
      <div className={s.notFound}>
        <p>Obrázek nenalezen nebo přístup odepřen.</p>
        <Link to="/ikaros/galerie" className={s.back}>
          <ArrowLeft size={14} /> Zpět na galerii
        </Link>
      </div>
    );
  }

  const cat = categoryByKey(categories, image.category);

  return (
    <div className={s.page}>
      <Link to="/ikaros/galerie" className={s.back}>
        <ArrowLeft size={14} /> Zpět na galerii
      </Link>

      <div className={s.frame}>
        <img src={image.imageUrl} alt={image.title} className={s.img} />
      </div>

      <div className={s.body}>
        <h1 className={s.title}>{image.title}</h1>
        <div className={s.meta}>
          <Link to={`/ikaros/uzivatel/${image.authorId}`} className={s.author}>
            {image.authorName}
          </Link>
          <span className={s.dot}>·</span>
          <span style={{ color: 'var(--gal-cat-current)' }}>{cat.label}</span>
          <span className={s.dot}>·</span>
          <span>
            {formatDateCs(image.publishedAtUtc ?? image.createdAtUtc)}
          </span>
          {image.status !== 'Published' && (
            <>
              <span className={s.dot}>·</span>
              <span style={{ color: statusColor(image.status) }}>
                {statusLabel(image.status)}
              </span>
            </>
          )}
        </div>

        {image.description && <p className={s.desc}>{image.description}</p>}

        {image.status === 'Rejected' && image.rejectReason && (
          <div className={s.rejectInfo}>
            <strong>Důvod vrácení:</strong> {image.rejectReason}
          </div>
        )}

        {image.status === 'Published' && <Rating image={image} />}

        <OwnerActions image={image} />
        <AdminActions image={image} />
      </div>
    </div>
  );
}

// ─── Hodnocení ───────────────────────────────────────────────────────────

function Rating({ image }: { image: IkarosGalleryItem }) {
  const user = useAtomValue(currentUserAtom);
  const rate = useRateGalleryImage();
  const isAuthor = user?.id === image.authorId;
  const canRate = !!user && !isAuthor;
  const myRating =
    image.ratings.find((r) => r.userId === user?.id)?.stars ?? 0;

  function handleRate(stars: number) {
    rate.mutate(
      { id: image.id, stars },
      {
        onSuccess: () => toast.success('Hodnocení uloženo'),
        onError: () => toast.error('Nepodařilo se uložit hodnocení'),
      },
    );
  }

  return (
    <div className={s.ratingBlock}>
      <RatingStars
        average={image.averageRating}
        count={image.ratings.length}
        myRating={myRating}
        onRate={canRate ? handleRate : undefined}
        disabled={rate.isPending}
        size="lg"
      />
      {isAuthor && (
        <p className={s.ratingHint}>Vlastní obrázek nelze hodnotit.</p>
      )}
    </div>
  );
}

// ─── Akce autora ─────────────────────────────────────────────────────────

function OwnerActions({ image }: { image: IkarosGalleryItem }) {
  const user = useAtomValue(currentUserAtom);
  const navigate = useNavigate();
  const submit = useSubmitGalleryImage();
  const del = useDeleteGalleryImage();

  if (user?.id !== image.authorId) return null;
  const editable = image.status === 'Draft' || image.status === 'Rejected';
  if (!editable) return null;

  function handleDelete() {
    if (!window.confirm('Opravdu smazat tento obrázek?')) return;
    del.mutate(image.id, {
      onSuccess: () => {
        toast.success('Obrázek smazán');
        navigate('/ikaros/galerie?tab=moje');
      },
      onError: () => toast.error('Nepodařilo se smazat'),
    });
  }

  return (
    <div className={s.actions}>
      <Link to={`/ikaros/galerie/${image.id}/upravit`} className={s.btnGhost}>
        <Pencil size={14} /> Upravit
      </Link>
      <button
        type="button"
        className={s.btnGhost}
        onClick={() =>
          submit.mutate(image.id, {
            onSuccess: () => toast.success('Odesláno ke schválení'),
            onError: () => toast.error('Nepodařilo se odeslat'),
          })
        }
        disabled={submit.isPending}
      >
        <Check size={14} /> Odeslat ke schválení
      </button>
      <button
        type="button"
        className={s.btnDanger}
        onClick={handleDelete}
        disabled={del.isPending}
      >
        <Trash2 size={14} /> Smazat
      </button>
    </div>
  );
}

// ─── Akce schvalovatele ──────────────────────────────────────────────────

function AdminActions({ image }: { image: IkarosGalleryItem }) {
  const user = useAtomValue(currentUserAtom);
  const approve = useApproveGalleryImage();
  const reject = useRejectGalleryImage();
  const [rejectOpen, setRejectOpen] = useState(false);

  const isReviewer = user && REVIEWER_ROLES.includes(user.role);
  if (!isReviewer || image.status !== 'Pending') return null;

  return (
    <div className={s.actions}>
      <button
        type="button"
        className={s.btnApprove}
        onClick={() =>
          approve.mutate(image.id, {
            onSuccess: () => toast.success('Obrázek schválen a publikován'),
            onError: () => toast.error('Nepodařilo se schválit'),
          })
        }
        disabled={approve.isPending}
      >
        <Check size={14} /> Schválit a publikovat
      </button>
      <button
        type="button"
        className={s.btnGhost}
        onClick={() => setRejectOpen(true)}
        disabled={approve.isPending}
      >
        Vrátit s poznámkou
      </button>
      <RejectReasonModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={`Vrátit obrázek „${image.title}"`}
        isPending={reject.isPending}
        onConfirm={(reason) =>
          reject.mutate(
            { id: image.id, reason },
            {
              onSuccess: () => {
                toast.success('Obrázek vrácen autorovi s poznámkou');
                setRejectOpen(false);
              },
              onError: () => toast.error('Nepodařilo se vrátit obrázek'),
            },
          )
        }
      />
    </div>
  );
}
