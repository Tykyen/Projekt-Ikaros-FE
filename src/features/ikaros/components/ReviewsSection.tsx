import { useState } from 'react';
import type { ArticleRating } from '@/shared/types';
import { timeAgo, initials } from '../lib/discussions';
import s from './ReviewsSection.module.css';

/**
 * Spec 3.4f — sekce „Recenze" pod článkem i obrázkem. Rozšiřuje hvězdičkové
 * hodnocení 1–5★ o volitelný text. `ArticleRating` a `GalleryRating` mají
 * shodný tvar, komponenta je proto sdílená.
 */
interface Props {
  ratings: ArticleRating[];
  averageRating: number;
  /** Přihlášený a zároveň ne autor obsahu → smí recenzovat. */
  canReview: boolean;
  currentUserId?: string;
  onSubmit: (stars: number, text: string) => void;
  isPending: boolean;
}

const MAX_TEXT = 2000;

export function ReviewsSection({
  ratings,
  averageRating,
  canReview,
  currentUserId,
  onSubmit,
  isPending,
}: Props) {
  const mine = ratings.find((r) => r.userId === currentUserId);
  const [stars, setStars] = useState(mine?.stars ?? 0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState(mine?.text ?? '');

  const withText = ratings
    .filter((r) => r.text.trim().length > 0)
    .sort(
      (a, b) => +new Date(b.createdAtUtc) - +new Date(a.createdAtUtc),
    );

  function handleSubmit() {
    if (stars < 1) return;
    onSubmit(stars, text.trim());
  }

  return (
    <section className={s.section}>
      <h3 className={s.heading}>Recenze</h3>

      <div className={s.summary}>
        <span className={s.avgStars} aria-hidden>
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={n <= Math.round(averageRating) ? s.starFull : s.starEmpty}
            >
              ★
            </span>
          ))}
        </span>
        <span className={s.avgNum}>
          {averageRating > 0 ? averageRating.toFixed(1) : '—'} z 5
        </span>
        <span className={s.avgCount}>· {ratings.length} hodnocení</span>
      </div>

      <Distribution ratings={ratings} />

      {canReview && (
        <div className={s.form}>
          <span className={s.formLabel}>
            {mine ? 'Uprav svou recenzi:' : 'Napiš recenzi:'}
          </span>
          <div className={s.rateStars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setStars(n)}
                className={s.starBtn}
                aria-label={`${n} hvězd`}
              >
                <span className={n <= (hover || stars) ? s.starFull : s.starEmpty}>
                  ★
                </span>
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_TEXT}
            rows={3}
            placeholder="Napiš, co na obsahu oceňuješ (nepovinné)…"
            className={s.textarea}
          />
          <div className={s.formActions}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || stars < 1}
              className={s.btnPrimary}
            >
              {mine ? 'Uložit recenzi' : 'Odeslat recenzi'}
            </button>
          </div>
        </div>
      )}

      {withText.length > 0 && (
        <ul className={s.list}>
          {withText.map((r) => (
            <li key={r.userId} className={s.review}>
              <span className={s.avatar} aria-hidden>
                {initials(r.userName || '?')}
              </span>
              <div className={s.reviewBody}>
                <div className={s.reviewHead}>
                  <span className={s.reviewName}>
                    {r.userName || 'Uživatel'}
                  </span>
                  <span className={s.reviewStars} aria-hidden>
                    {'★'.repeat(r.stars)}
                    <span className={s.starEmpty}>
                      {'★'.repeat(5 - r.stars)}
                    </span>
                  </span>
                  {r.createdAtUtc && (
                    <span className={s.reviewTime}>
                      {timeAgo(r.createdAtUtc)}
                    </span>
                  )}
                </div>
                <p className={s.reviewText}>{r.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Distribution({ ratings }: { ratings: ArticleRating[] }) {
  if (ratings.length === 0) return null;
  const buckets = [5, 4, 3, 2, 1].map((stars) => {
    const count = ratings.filter((r) => r.stars === stars).length;
    return { stars, count, pct: (count / ratings.length) * 100 };
  });
  return (
    <div className={s.dist}>
      {buckets.map(({ stars, count, pct }) => (
        <div key={stars} className={s.distRow}>
          <span className={s.distStar}>{stars}★</span>
          <div
            className={s.distBar}
            role="progressbar"
            aria-valuenow={count}
            aria-valuemax={ratings.length}
          >
            <div className={s.distFill} style={{ width: `${pct}%` }} />
          </div>
          <span className={s.distPct}>{pct.toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}
