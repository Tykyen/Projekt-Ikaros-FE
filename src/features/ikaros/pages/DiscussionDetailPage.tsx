import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import {
  ArrowLeft,
  Lock,
  Heart,
  Star,
  MessageCircle,
  Check,
  Trash2,
  Flag,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { currentUserAtom } from '@/shared/store/authStore';
import { Spinner, ConfirmDialog } from '@/shared/ui';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { UserRole, type IkarosDiscussion, type IkarosDiscussionPost } from '@/shared/types';
import {
  useDiscussion,
  useDiscussionPosts,
  useAddPost,
  useDeletePost,
  useReportPost,
  useToggleLikeDiscussion,
  useToggleFavoriteDiscussion,
  useApproveDiscussion,
  useRejectDiscussion,
  useRequestJoin,
} from '../api/useDiscussions';
import { DiscussionManagePanel } from '../components/DiscussionManagePanel';
import { RejectReasonModal } from '../components/RejectReasonModal';
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
  if (error || !discussion) return <UnavailableNotice id={id} />;

  return <DiscussionDetail discussion={discussion} />;
}

// ─── Diskuze není dostupná (404 / uzamčená) ────────────────────────────────

function UnavailableNotice({ id }: { id: string | undefined }) {
  const requestJoin = useRequestJoin();
  return (
    <div className={s.notice}>
      <h1 className={s.noticeTitle}>Diskuze není dostupná</h1>
      <p className={s.noticeText}>
        Diskuze neexistuje, nebo je uzamčená a nemáš do ní přístup. Pokud je
        uzamčená, můžeš požádat správce o přidání.
      </p>
      {id && (
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
  const { data: posts = [], isLoading: postsLoading } = useDiscussionPosts(d.id);
  const toggleLike = useToggleLikeDiscussion();
  const toggleFav = useToggleFavoriteDiscussion();

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
          <Link to={`/ikaros/uzivatel/${d.creatorId}`} className={s.author}>
            {d.creatorName}
          </Link>
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
        <button
          type="button"
          className={s.toggleBtn}
          disabled={toggleFav.isPending}
          onClick={() =>
            toggleFav.mutate(d.id, {
              onSuccess: (res) =>
                toast.success(
                  res.isFavorite
                    ? 'Přidáno do oblíbených'
                    : 'Odebráno z oblíbených',
                ),
            })
          }
        >
          <Star size={14} /> Oblíbené
        </button>
      </div>

      {isReviewer && !d.isApproved && <AdminApproval discussion={d} />}

      {canManage && <DiscussionManagePanel discussion={d} />}

      <section className={s.thread}>
        <h2 className={s.threadTitle}>Vlákno příspěvků</h2>
        {postsLoading ? (
          <Spinner center />
        ) : posts.length === 0 ? (
          <p className={s.emptyThread}>
            Zatím žádné příspěvky. Začni diskuzi prvním příspěvkem.
          </p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              discussionId={d.id}
              canDelete={
                post.authorId === user?.id || isManager || isReviewer
              }
              canReport={post.authorId !== user?.id}
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
  const report = useReportPost();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <article className={s.post}>
      <span className={s.postAvatar} aria-hidden>
        {initials(post.authorName)}
      </span>
      <div className={s.postBody}>
        <div className={s.postHead}>
          <Link
            to={`/ikaros/uzivatel/${post.authorId}`}
            className={s.postAuthor}
          >
            {post.authorName}
          </Link>
          <span className={s.postTime}>{timeAgo(post.createdAtUtc)}</span>
        </div>
        <div className={s.postContent}>
          <RichTextEditor value={post.content} readOnly />
        </div>
        {(canDelete || canReport) && (
          <div className={s.postActions}>
            {canReport && (
              <button
                type="button"
                className={s.postBtn}
                onClick={() => setReportOpen(true)}
              >
                <Flag size={12} /> Nahlásit
              </button>
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
      <RejectReasonModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Nahlásit příspěvek"
        isPending={report.isPending}
        confirmLabel="Nahlásit"
        helpText="Popiš, co je s příspěvkem v nepořádku. Hlášení uvidí správce diskuzí."
        onConfirm={(reason) =>
          report.mutate(
            { id: discussionId, postId: post.id, reason },
            {
              onSuccess: () => {
                toast.success('Příspěvek nahlášen správci');
                setReportOpen(false);
              },
              onError: () => toast.error('Nepodařilo se nahlásit'),
            },
          )
        }
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
