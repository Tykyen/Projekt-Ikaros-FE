import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import axios from 'axios';
import {
  ArrowLeft,
  Lock,
  Heart,
  MessageCircle,
  Check,
  Trash2,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { currentUserAtom } from '@/shared/store/authStore';
import { Spinner, ConfirmDialog, EmptyState, ErrorState } from '@/shared/ui';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { ReportButton } from '@/shared/moderation';
import { UserRole, type IkarosDiscussion, type IkarosDiscussionPost } from '@/shared/types';
import {
  useDiscussion,
  useDiscussionPosts,
  useAddPost,
  useDeletePost,
  useToggleLikeDiscussion,
  useToggleFavoriteDiscussion,
  useApproveDiscussion,
  useRejectDiscussion,
  useRequestJoin,
} from '../api/useDiscussions';
import { DiscussionManagePanel } from '../components/DiscussionManagePanel';
import { RejectReasonModal } from '../components/RejectReasonModal';
import { FavoriteToggle } from '../components/FavoriteToggle';
import { timeAgo, initials } from '../lib/discussions';
import s from './DiscussionDetailPage.module.css';

const REVIEWER_ROLES: UserRole[] = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.SpravceDiskuzi,
];
const MAX_POST = 20000;

export default function DiscussionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: discussion, isLoading, error } = useDiscussion(id);

  if (isLoading) return <Spinner center />;
  if (error || !discussion) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    return <UnavailableNotice id={id} status={status} />;
  }

  return <DiscussionDetail discussion={discussion} />;
}

// ─── Diskuze není dostupná (403 nemáš přístup / 404 neexistuje) ────────────

function UnavailableNotice({
  id,
  status,
}: {
  id: string | undefined;
  status: number | undefined;
}) {
  const requestJoin = useRequestJoin();
  const isForbidden = status === 403;
  return (
    <div className={s.notice}>
      <h1 className={s.noticeTitle}>
        {isForbidden ? 'Nemáš přístup k diskuzi' : 'Diskuze nenalezena'}
      </h1>
      <p className={s.noticeText}>
        {isForbidden
          ? 'Diskuze je uzamčená a nemáš do ní přístup. Můžeš požádat správce o přidání.'
          : 'Diskuze neexistuje nebo byla smazána.'}
      </p>
      {isForbidden && id && (
        <button
          type="button"
          className={s.btnPrimary}
          disabled={requestJoin.isPending}
          onClick={() =>
            requestJoin.mutate(id, {
              onSuccess: () =>
                toast.success('Žádost o přidání odeslána správci'),
              onError: () =>
                toast.error('Žádost se nepodařilo odeslat'),
            })
          }
        >
          Požádat o přidání
        </button>
      )}
      <div style={{ marginTop: 'var(--sp-3)' }}>
        <Link to="/ikaros/diskuze" className={s.back}>
          <ArrowLeft size={14} /> Zpět na diskuze
        </Link>
      </div>
    </div>
  );
}

// ─── Detail ────────────────────────────────────────────────────────────────

function DiscussionDetail({ discussion: d }: { discussion: IkarosDiscussion }) {
  const user = useAtomValue(currentUserAtom);
  const {
    data: posts = [],
    isLoading: postsLoading,
    isError: postsError,
    refetch: refetchPosts,
  } = useDiscussionPosts(d.id);
  const toggleLike = useToggleLikeDiscussion();
  const toggleFav = useToggleFavoriteDiscussion();

  const isFavorite = !!user && (user.favoriteDiscussionIds ?? []).includes(d.id);

  const isCreator = user?.id === d.creatorId;
  const isManager = !!user && d.managerIds.includes(user.id);
  const isReviewer = !!user && REVIEWER_ROLES.includes(user.role);
  const canManage = isCreator || isManager || isReviewer;

  return (
    <div className={s.page}>
      <Link to="/ikaros/diskuze" className={s.back}>
        <ArrowLeft size={14} /> Zpět na diskuze
      </Link>

      <header className={s.header}>
        <div className={s.titleRow}>
          {!d.isOpen && (
            <span className={s.lockBadge}>
              <Lock size={11} /> Uzamčená
            </span>
          )}
          {!d.isApproved && (
            <span className={s.pendingBadge}>Čeká na schválení</span>
          )}
          <h1 className={s.title}>{d.title}</h1>
        </div>
        {d.description && <p className={s.description}>{d.description}</p>}
        {d.bulletin && (
          <div className={s.bulletin}>
            <span className={s.bulletinLabel}>Vývěska</span>
            {d.bulletin}
          </div>
        )}
        <div className={s.meta}>
          {/* D-040 — tombstone label u smazaného creatora. */}
          {d.creatorIsDeleted ? (
            <span className={s.author} style={{ fontStyle: 'italic', opacity: 0.7 }}>
              Smazaný účet
            </span>
          ) : (
            <Link to={`/ikaros/uzivatel/${d.creatorId}`} className={s.author}>
              {d.creatorName}
            </Link>
          )}
          <span className={s.metaSep}>·</span>
          <span className={s.metaItem}>
            <MessageCircle size={12} aria-hidden /> {d.postCount} příspěvků
          </span>
          <span className={s.metaSep}>·</span>
          <span>aktivita {timeAgo(d.lastActivityUtc)}</span>
        </div>
      </header>

      <div className={s.actionsBar}>
        <button
          type="button"
          className={s.toggleBtn}
          disabled={toggleLike.isPending}
          onClick={() => toggleLike.mutate(d.id)}
        >
          <Heart size={14} /> {d.likeCount}
        </button>
        <FavoriteToggle
          variant="button"
          isFavorite={isFavorite}
          pending={toggleFav.isPending}
          onToggle={() =>
            toggleFav.mutate(d.id, {
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

      {isReviewer && !d.isApproved && <AdminApproval discussion={d} />}

      {canManage && <DiscussionManagePanel discussion={d} />}

      <section className={s.thread}>
        <h2 className={s.threadTitle}>Vlákno příspěvků</h2>
        {postsLoading ? (
          <Spinner center />
        ) : postsError ? (
          <ErrorState
            size="panel"
            title="Příspěvky se nepodařilo načíst"
            description="Neznamená to, že je vlákno prázdné. Zkus to prosím znovu."
            onRetry={() => void refetchPosts()}
          />
        ) : posts.length === 0 ? (
          <EmptyState
            size="panel"
            illustration="messages"
            title="Vlákno je zatím prázdné"
            description="Začni diskuzi prvním příspěvkem."
          />
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              discussionId={d.id}
              canDelete={
                post.authorId === user?.id || isManager || isReviewer
              }
              canReport={!!user && post.authorId !== user.id}
            />
          ))
        )}
      </section>

      {d.isApproved ? (
        <Composer discussionId={d.id} />
      ) : (
        <p className={s.composerLocked}>
          Diskuze čeká na schválení — přispívat půjde po schválení správcem.
        </p>
      )}
    </div>
  );
}

// ─── Admin schvalování ─────────────────────────────────────────────────────

function AdminApproval({ discussion: d }: { discussion: IkarosDiscussion }) {
  const approve = useApproveDiscussion();
  const reject = useRejectDiscussion();
  const navigate = useNavigate();
  const [rejectOpen, setRejectOpen] = useState(false);

  return (
    <div className={s.adminBox}>
      <h3 className={s.adminTitle}>Schválení diskuze</h3>
      <div className={s.adminBtns}>
        <button
          type="button"
          className={s.btnApprove}
          disabled={approve.isPending}
          onClick={() =>
            approve.mutate(d.id, {
              onSuccess: () => toast.success('Diskuze schválena'),
              onError: () => toast.error('Nepodařilo se schválit'),
            })
          }
        >
          <Check size={14} /> Schválit
        </button>
        <button
          type="button"
          className={s.btnReject}
          onClick={() => setRejectOpen(true)}
        >
          Zamítnout
        </button>
      </div>
      <RejectReasonModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={`Zamítnout diskuzi „${d.title}"`}
        isPending={reject.isPending}
        confirmLabel="Zamítnout"
        helpText="Napiš tvůrci, proč diskuzi zamítáš. Diskuze bude smazána."
        onConfirm={(reason) =>
          reject.mutate(
            { id: d.id, reason },
            {
              onSuccess: () => {
                toast.success('Diskuze zamítnuta');
                navigate('/ikaros/diskuze');
              },
              onError: () => toast.error('Nepodařilo se zamítnout'),
            },
          )
        }
      />
    </div>
  );
}

// ─── Karta příspěvku ───────────────────────────────────────────────────────

/** Naivní strip HTML — post.content je TipTap HTML, pro snapshot stačí text. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function PostCard({
  post,
  discussionId,
  canDelete,
  canReport,
}: {
  post: IkarosDiscussionPost;
  discussionId: string;
  canDelete: boolean;
  canReport: boolean;
}) {
  const del = useDeletePost();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <article className={s.post}>
      {/* D-040 — tombstone avatar + label pro smazaného autora postu. */}
      <span
        className={s.postAvatar}
        aria-hidden
        style={post.authorIsDeleted ? { filter: 'grayscale(1) brightness(0.6)' } : undefined}
      >
        {post.authorIsDeleted ? '?' : initials(post.authorName)}
      </span>
      <div className={s.postBody}>
        <div className={s.postHead}>
          {post.authorIsDeleted ? (
            <span className={s.postAuthor} style={{ fontStyle: 'italic', opacity: 0.7 }}>
              Smazaný účet
            </span>
          ) : (
            <Link
              to={`/ikaros/uzivatel/${post.authorId}`}
              className={s.postAuthor}
            >
              {post.authorName}
            </Link>
          )}
          <span className={s.postTime}>{timeAgo(post.createdAtUtc)}</span>
        </div>
        <div className={s.postContent}>
          <RichTextEditor value={post.content} readOnly />
        </div>
        {(canDelete || canReport) && (
          <div className={s.postActions}>
            {canReport && (
              <ReportButton
                variant="text"
                targetType="discussion_post"
                targetId={post.id}
                targetUrl={`/ikaros/diskuze/${discussionId}`}
                targetSnapshot={stripHtml(post.content).slice(0, 500)}
                targetAuthorName={post.authorName}
                targetAuthorId={post.authorId}
              />
            )}
            {canDelete && (
              <button
                type="button"
                className={s.postBtn}
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 size={12} /> Smazat
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await del.mutateAsync({ id: discussionId, postId: post.id });
          toast.success('Příspěvek smazán');
        }}
        title="Smazat příspěvek?"
        message="Tato akce je nevratná."
        confirmLabel="Smazat"
        confirmVariant="danger"
      />
    </article>
  );
}

// ─── Composer ──────────────────────────────────────────────────────────────

function Composer({ discussionId }: { discussionId: string }) {
  const [content, setContent] = useState('');
  const addPost = useAddPost();
  const isEmpty = !content.replace(/<[^>]*>/g, '').trim();

  function handleSend() {
    if (isEmpty) {
      toast.error('Napiš nejdřív příspěvek');
      return;
    }
    addPost.mutate(
      { id: discussionId, content },
      {
        onSuccess: () => {
          setContent('');
          toast.success('Příspěvek přidán');
        },
        onError: () => toast.error('Nepodařilo se přidat příspěvek'),
      },
    );
  }

  return (
    <section className={s.composer}>
      <h3 className={s.composerTitle}>Přidat příspěvek</h3>
      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Napiš svůj příspěvek…"
        maxLength={MAX_POST}
      />
      <div className={s.composeActions}>
        <button
          type="button"
          className={s.btnPrimary}
          disabled={addPost.isPending || isEmpty}
          onClick={handleSend}
        >
          <Send size={14} /> Odeslat
        </button>
      </div>
    </section>
  );
}
