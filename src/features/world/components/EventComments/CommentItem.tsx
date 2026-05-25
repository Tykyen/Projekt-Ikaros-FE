import { useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import axios from 'axios';
import { MessageSquare, Pencil, Trash2, X } from 'lucide-react';
import type { EventComment } from '@/shared/types';
import { WorldRole } from '@/shared/types';
import { Button, ConfirmDialog } from '@/shared/ui';
import { relativeTimeCs } from '@/shared/lib/relativeTime';
import {
  useDeleteComment,
  useEditComment,
  useReactToComment,
} from '@/features/world/api/useGameEvents';
import { ReactionsRow } from './ReactionsRow';
import s from './CommentItem.module.css';

interface Props {
  comment: EventComment;
  eventId: string;
  worldRole: WorldRole;
  currentUserId: string | null;
  isReply?: boolean;
  onReplyClick?: (commentId: string) => void;
}

const MAX = 2000;

/** Monogram avatar fallback — barva z hashe userId. */
function monogramColor(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h * 31 + userId.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 45%, 35%)`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0][0]!.toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function CommentItem({
  comment,
  eventId,
  worldRole,
  currentUserId,
  isReply = false,
  onReplyClick,
}: Props) {
  const editMut = useEditComment(eventId);
  const deleteMut = useDeleteComment(eventId);
  const reactMut = useReactToComment(eventId);

  const isOwn = !!currentUserId && comment.authorId === currentUserId;
  const canModerate = worldRole >= WorldRole.PomocnyPJ;
  const canDelete = isOwn || canModerate;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleEditSubmit() {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed.length > MAX) return;
    try {
      await editMut.mutateAsync({ commentId: comment.id, content: trimmed });
      setIsEditing(false);
      toast.success('Komentář upraven.');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        toast.error('Nemůžeš upravit cizí komentář.');
        setIsEditing(false);
        return;
      }
      toast.error('Nepodařilo se upravit komentář.');
    }
  }

  function handleEditCancel() {
    setEditContent(comment.content);
    setIsEditing(false);
  }

  async function handleDelete() {
    try {
      await deleteMut.mutateAsync(comment.id);
      toast.success('Komentář smazán.');
      setDeleteOpen(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 403) {
          toast.error('Nemáš oprávnění.');
          setDeleteOpen(false);
          return;
        }
      }
      toast.error('Nepodařilo se smazat komentář.');
    }
  }

  function handleReactionToggle(emoji: string) {
    reactMut.mutate(
      { commentId: comment.id, emoji },
      {
        onError: () => toast.error('Nepodařilo se přidat reakci.'),
      },
    );
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleEditSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEditCancel();
    }
  }

  // ── Smazaný komentář — placeholder ────────────────────────────────────
  if (comment.isDeleted) {
    return (
      <div
        className={clsx(s.item, isReply && s.itemReply, s.itemDeleted)}
        aria-label="Smazaný komentář"
      >
        <span
          className={s.avatar}
          style={{ background: 'var(--surface-3, var(--surface-2))' }}
          aria-hidden="true"
        >
          —
        </span>
        <div className={s.body}>
          <p className={s.deletedText}>
            <em>Komentář byl smazán</em>
          </p>
        </div>
      </div>
    );
  }

  const editTooLong = editContent.length > MAX;
  const editEmpty = editContent.trim().length === 0;

  return (
    <div className={clsx(s.item, isReply && s.itemReply)}>
      <span
        className={s.avatar}
        style={{ background: monogramColor(comment.authorId) }}
        aria-hidden="true"
      >
        {initials(comment.authorName)}
      </span>

      <div className={s.body}>
        <header className={s.header}>
          <span className={s.author}>{comment.authorName}</span>
          <span className={s.time} title={new Date(comment.createdAt).toLocaleString('cs-CZ')}>
            {relativeTimeCs(comment.createdAt)}
          </span>
          {comment.editedAt && (
            <span
              className={s.editedPill}
              title={`Upraveno ${new Date(comment.editedAt).toLocaleString('cs-CZ')}`}
            >
              upraveno
            </span>
          )}
        </header>

        {isEditing ? (
          <>
            <textarea
              className={s.editTextarea}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={3}
              autoFocus
              aria-invalid={editTooLong ? 'true' : 'false'}
            />
            <div className={s.editActions}>
              {editContent.length > 1800 && (
                <span className={editTooLong ? s.counterError : s.counter}>
                  {editContent.length} / {MAX}
                </span>
              )}
              <div className={s.spacer} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleEditCancel}
                disabled={editMut.isPending}
              >
                <X size={14} /> Zrušit
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => void handleEditSubmit()}
                disabled={editMut.isPending || editEmpty || editTooLong}
                loading={editMut.isPending}
              >
                Uložit
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className={s.content}>{comment.content}</p>

            <ReactionsRow
              reactions={comment.reactions}
              currentUserId={currentUserId}
              onToggle={handleReactionToggle}
              pending={reactMut.isPending}
            />

            <div className={s.actions}>
              {!isReply && onReplyClick && (
                <button
                  type="button"
                  className={s.actionBtn}
                  onClick={() => onReplyClick(comment.id)}
                >
                  <MessageSquare size={13} aria-hidden="true" />
                  Odpovědět
                </button>
              )}
              {isOwn && (
                <button
                  type="button"
                  className={s.actionBtn}
                  onClick={() => {
                    setEditContent(comment.content);
                    setIsEditing(true);
                  }}
                >
                  <Pencil size={13} aria-hidden="true" />
                  Upravit
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className={clsx(s.actionBtn, s.actionDanger)}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 size={13} aria-hidden="true" />
                  Smazat
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Smazat komentář"
        message={
          isOwn ? (
            <>Smazat svůj komentář? Akce je nevratná.</>
          ) : (
            <>
              Smazat komentář od <strong>{comment.authorName}</strong>?
              Akce je nevratná.
            </>
          )
        }
        confirmLabel="Smazat"
        confirmVariant="danger"
        onConfirm={handleDelete}
        isPending={deleteMut.isPending}
      />
    </div>
  );
}
