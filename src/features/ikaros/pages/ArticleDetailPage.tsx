import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { ArrowLeft, Edit3, Send, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { currentUserAtom } from '@/shared/store/authStore';
import { Spinner, ConfirmDialog } from '@/shared/ui';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { UserRole } from '@/shared/types';
import { useArticle, useApproveArticle, useRejectArticle, useDeleteArticle, useSubmitArticle, useRateArticle, useMarkRead, useArticleReadStatus, useArticles, useToggleFavoriteArticle } from '../api/useArticles';
import { useArticleCategories } from '../api/useArticleCategories';
import { RejectReasonModal } from '../components/RejectReasonModal';
import { FavoriteToggle } from '../components/FavoriteToggle';
import { ReviewsSection } from '../components/ReviewsSection';
import { AutoTOC } from '../components/AutoTOC';
import {
  articleNumber,
  categoryByKey,
  categoryStyle,
  formatDateCs,
  glyphFor,
  readingTime,
  statusLabel,
  statusColor,
} from '../lib/articles';
import type { IkarosArticle } from '@/shared/types';
import s from './ArticleDetailPage.module.css';

// N-14 — sjednoceno s BE `ADMIN_ROLES` (ikaros-articles.service): globální
// `UserRole.PJ` (=3) je platformová role a smí schvalovat články. FE ho dřív
// v reviewerech vynechával → PJ schválil přes API, ale tlačítko neviděl.
const REVIEWER_ROLES: UserRole[] = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.PJ,
  UserRole.SpravceClanku,
];

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: article, isLoading, error } = useArticle(id);
  const { data: categories = [] } = useArticleCategories();

  if (isLoading) return <Spinner center />;
  if (error || !article) {
    return (
      <div className={s.notFound}>
        <p>Článek nenalezen nebo přístup odepřen.</p>
        <Link to="/ikaros/clanky" className={s.back}>
          <ArrowLeft size={14} /> Zpět na přehled
        </Link>
      </div>
    );
  }

  const cat = categoryByKey(categories, article.category);
  const glyph = glyphFor(article.id);

  return (
    <article
      className={s.page}
      style={{
        ...categoryStyle(cat),
        ['--article-glyph' as never]: `'${glyph}'`,
      }}
    >
      <ReadingProgressBar />

      <div className={s.headerWrap}>
        <Link to="/ikaros/clanky" className={s.back}>
          <ArrowLeft size={14} /> Zpět
        </Link>
        <header className={s.header}>
          <div className={s.meta}>
            <span className={s.number}>N° {articleNumber(article.id)}</span>
            <span className={s.catWrap}>
              <span className={s.waxSeal} />
              <span className={s.catLabel}>{cat.label}</span>
            </span>
            <span className={s.metaSep}>·</span>
            <span>
              {formatDateCs(article.publishedAtUtc ?? article.createdAtUtc)}
            </span>
            {article.status !== 'Published' && (
              <span className={s.statusBadge} style={{ color: statusColor(article.status) }}>
                {statusLabel(article.status)}
              </span>
            )}
          </div>
          <h1 className={s.title}>{article.title}</h1>
          <div className={s.sub}>
            {/* D-040 — smazaný účet má disabled link + náhradní label. */}
            {article.authorIsDeleted ? (
              <span
                className={s.authorLink}
                style={{ fontStyle: 'italic', opacity: 0.7 }}
                title="Tento účet byl smazán"
              >
                Smazaný účet
              </span>
            ) : (
              <Link
                to={`/ikaros/uzivatel/${article.authorId}`}
                className={s.authorLink}
              >
                {article.authorName}
              </Link>
            )}
            <span className={s.subSep}>·</span>
            <span>{readingTime(article.content)} min čtení</span>
          </div>
        </header>
        <ArticleFavorite article={article} />
      </div>

      <div className={s.body}>
        <AuthorSidebar article={article} />

        <div className={s.content} data-article-content>
          <RichTextEditor
            value={article.content}
            readOnly
            withDropCap
            className={s.proseWrapper}
          />
          <div data-article-end aria-hidden style={{ height: 1 }} />
          <MarkAsReadObserver article={article} />
        </div>

        <div className={s.tocColumn}>
          <AutoTOC html={article.content} />
        </div>
      </div>

      {article.status === 'Published' && (
        <RatingPanel article={article} />
      )}

      <AdminActions article={article} />
      <AuthorActions article={article} onDelete={() => navigate('/ikaros/clanky')} />

      <MoreFromAuthor
        authorId={article.authorId}
        authorName={article.authorName}
        excludeArticleId={article.id}
      />
    </article>
  );
}

// ─── 3.7 — Oblíbené (záložka) ────────────────────────────────────────────

function ArticleFavorite({ article }: { article: IkarosArticle }) {
  const user = useAtomValue(currentUserAtom);
  const toggle = useToggleFavoriteArticle();
  if (!user || article.status !== 'Published') return null;
  const isFavorite = (user.favoriteArticleIds ?? []).includes(article.id);
  return (
    <div className={s.favoriteBar}>
      <FavoriteToggle
        variant="button"
        isFavorite={isFavorite}
        pending={toggle.isPending}
        onToggle={() =>
          toggle.mutate(article.id, {
            onSuccess: (res) =>
              toast.success(
                res.isFavorite
                  ? 'Přidáno do oblíbených'
                  : 'Odebráno z oblíbených',
              ),
          })
        }
      />
    </div>
  );
}

// ─── Reading progress ────────────────────────────────────────────────────

function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handler = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return (
    <div className={s.progressTrack} aria-hidden>
      <div
        className={s.progressFill}
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}

// ─── Sticky author sidebar ───────────────────────────────────────────────

function AuthorSidebar({ article }: { article: IkarosArticle }) {
  const { data: articles = [] } = useArticles();
  const authorPublished = articles.filter(
    (a) => a.authorId === article.authorId && a.status === 'Published',
  );
  const ratings = authorPublished.reduce(
    (sum, a) => sum + a.ratings.length,
    0,
  );
  const avgRating = ratings > 0
    ? authorPublished.reduce((sum, a) => sum + a.averageRating * a.ratings.length, 0) / ratings
    : 0;

  // D-040 — tombstone autora v sidebaru = disabled card, žádný proklik.
  const isDeleted = article.authorIsDeleted;
  // Obsah sdílený oběma variantami obalu (R19: žádná inline komponenta v renderu).
  const cardInner = (
    <>
      <div className={s.authorName} style={isDeleted ? { fontStyle: 'italic' } : undefined}>
        {isDeleted ? 'Smazaný účet' : article.authorName}
      </div>
      <div className={s.authorStats}>
        <span>{authorPublished.length} článků</span>
        {avgRating > 0 && <span>· ★ {avgRating.toFixed(1)}</span>}
      </div>
      {!isDeleted && <span className={s.authorMore}>Profil →</span>}
    </>
  );

  return (
    <aside className={s.authorSidebar}>
      {isDeleted ? (
        <div className={s.authorCard} style={{ opacity: 0.6, cursor: 'default' }}>
          {cardInner}
        </div>
      ) : (
        <Link to={`/ikaros/uzivatel/${article.authorId}`} className={s.authorCard}>
          {cardInner}
        </Link>
      )}
    </aside>
  );
}

// ─── Recenze (3.4f) ──────────────────────────────────────────────────────

function RatingPanel({ article }: { article: IkarosArticle }) {
  const user = useAtomValue(currentUserAtom);
  const rate = useRateArticle();

  return (
    <ReviewsSection
      ratings={article.ratings}
      averageRating={article.averageRating}
      canReview={!!user && user.id !== article.authorId}
      currentUserId={user?.id}
      isPending={rate.isPending}
      onSubmit={(stars, text) =>
        rate.mutate(
          { id: article.id, stars, text },
          {
            onSuccess: () => toast.success('Recenze uložena'),
            onError: () => toast.error('Nepodařilo se uložit recenzi'),
          },
        )
      }
    />
  );
}

// ─── Admin actions (Pending → Approve / Reject) ──────────────────────────

function AdminActions({ article }: { article: IkarosArticle }) {
  const user = useAtomValue(currentUserAtom);
  const approve = useApproveArticle();
  const reject = useRejectArticle();
  const [rejectOpen, setRejectOpen] = useState(false);

  const isAdmin = user && REVIEWER_ROLES.includes(user.role);
  if (!isAdmin || article.status !== 'Pending') return null;

  return (
    <section className={s.adminActions}>
      <h3 className={s.sectionHeading}>Admin akce</h3>
      <div className={s.adminBtns}>
        <button
          type="button"
          className={s.btnApprove}
          onClick={() =>
            approve.mutate(article.id, {
              onSuccess: () => toast.success('Článek schválen a publikován'),
              onError: () => toast.error('Nepodařilo se schválit'),
            })
          }
          disabled={approve.isPending}
        >
          <Check size={14} /> Schválit a publikovat
        </button>
        <button
          type="button"
          className={s.btnReject}
          onClick={() => setRejectOpen(true)}
          disabled={approve.isPending}
        >
          Vrátit s poznámkou
        </button>
      </div>
      <RejectReasonModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={`Vrátit článek „${article.title}"`}
        isPending={reject.isPending}
        onConfirm={(reason) =>
          reject.mutate(
            { id: article.id, reason },
            {
              onSuccess: () => {
                toast.success('Článek vrácen autorovi s poznámkou');
                setRejectOpen(false);
              },
              onError: () => toast.error('Nepodařilo se vrátit článek'),
            },
          )
        }
      />
    </section>
  );
}

// ─── Author actions (Draft/Rejected → Submit/Edit/Delete) ────────────────

function AuthorActions({
  article,
  onDelete,
}: {
  article: IkarosArticle;
  onDelete: () => void;
}) {
  const user = useAtomValue(currentUserAtom);
  const navigate = useNavigate();
  const submit = useSubmitArticle();
  const del = useDeleteArticle();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isAuthor = user?.id === article.authorId;
  if (!isAuthor) return null;
  if (article.status !== 'Draft' && article.status !== 'Rejected') return null;

  return (
    <section className={s.authorActions}>
      <h3 className={s.sectionHeading}>Tvoje akce</h3>
      {article.status === 'Rejected' && article.rejectReason && (
        <div className={s.rejectInfo}>
          <strong>Důvod vrácení:</strong> {article.rejectReason}
        </div>
      )}
      <div className={s.authorBtns}>
        <button
          type="button"
          className={s.btnSecondary}
          onClick={() => navigate(`/ikaros/clanky/${article.id}/upravit`)}
        >
          <Edit3 size={14} /> Upravit
        </button>
        <button
          type="button"
          className={s.btnPrimary}
          onClick={() =>
            submit.mutate(article.id, {
              onSuccess: () => toast.success('Odesláno ke schválení'),
              onError: () => toast.error('Nepodařilo se odeslat'),
            })
          }
          disabled={submit.isPending}
        >
          <Send size={14} /> Odeslat ke schválení
        </button>
        <button
          type="button"
          className={s.btnDanger}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 size={14} /> Smazat
        </button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await del.mutateAsync(article.id);
          toast.success('Článek smazán');
          onDelete();
        }}
        title="Smazat článek?"
        message="Tato akce je nevratná."
        confirmLabel="Smazat"
        confirmVariant="danger"
      />
    </section>
  );
}

// ─── Mark-as-read trigger ────────────────────────────────────────────────

function MarkAsReadObserver({ article }: { article: IkarosArticle }) {
  const user = useAtomValue(currentUserAtom);
  const { data: readStatus } = useArticleReadStatus(article.id, {
    enabled: !!user && article.status === 'Published',
  });
  const markRead = useMarkRead();
  const triggeredRef = useRef(false);
  const [mountTime] = useState(() => Date.now());

  useEffect(() => {
    if (!user || article.status !== 'Published' || readStatus?.read) return;
    if (triggeredRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (triggeredRef.current) break;
          if (!entry.isIntersecting) continue;
          const elapsed = Date.now() - mountTime;
          if (elapsed >= 30_000) {
            triggeredRef.current = true;
            markRead.mutate(article.id);
          }
        }
      },
      { threshold: 0.5 },
    );

    const target = document.querySelector('[data-article-end]');
    if (target) observer.observe(target);

    // Re-check po 30s pokud target je už visible
    const retryTimer = setTimeout(() => {
      if (triggeredRef.current) return;
      const target = document.querySelector('[data-article-end]');
      if (!target) return;
      const rect = (target as HTMLElement).getBoundingClientRect();
      const inView =
        rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        triggeredRef.current = true;
        markRead.mutate(article.id);
      }
    }, 30_500);

    return () => {
      observer.disconnect();
      clearTimeout(retryTimer);
    };
  }, [user, article, readStatus?.read, markRead, mountTime]);

  return null;
}

// ─── „Více od autora" ────────────────────────────────────────────────────

function MoreFromAuthor({
  authorId,
  authorName,
  excludeArticleId,
}: {
  authorId: string;
  authorName: string;
  excludeArticleId: string;
}) {
  const { data: articles = [] } = useArticles();

  const fromAuthor = useMemo(() => {
    const others = articles.filter(
      (a) =>
        a.authorId === authorId &&
        a.id !== excludeArticleId &&
        a.status === 'Published',
    );
    const seed = excludeArticleId.charCodeAt(0) || 0;
    const shuffled = [...others].sort((a, b) => {
      const ah = (a.id.charCodeAt(0) + seed) % 100;
      const bh = (b.id.charCodeAt(0) + seed) % 100;
      return ah - bh;
    });
    return shuffled.slice(0, 3);
  }, [articles, authorId, excludeArticleId]);

  if (fromAuthor.length === 0) return null;

  return (
    <section className={s.moreFromAuthor}>
      <h3 className={s.moreHeading}>❧ Více od {authorName}</h3>
      <ul className={s.moreList}>
        {fromAuthor.map((a) => (
          <li key={a.id} className={s.moreItem}>
            <span className={s.moreGlyph}>{glyphFor(a.id)}</span>
            <Link to={`/ikaros/clanky/${a.id}`} className={s.moreLink}>
              <span className={s.moreTitle}>{a.title}</span>
              <span className={s.moreMeta}>
                {a.averageRating > 0 ? `★ ${a.averageRating.toFixed(1)}` : '—'} (
                {a.ratings.length})
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
