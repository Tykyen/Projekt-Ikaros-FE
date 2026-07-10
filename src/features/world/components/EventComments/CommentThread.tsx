import { useMemo, useState } from 'react';
import type { EventComment, WorldRole } from '@/shared/types';
import { CommentItem } from './CommentItem';
import { CommentComposer } from './CommentComposer';
import s from './CommentThread.module.css';

interface Props {
  comments: EventComment[];
  eventId: string;
  worldRole: WorldRole;
  currentUserId: string | null;
}

/**
 * 9.1-II — render thread:
 * - root DESC by createdAt (Q5-A nejnovější nahoře)
 * - reply ASC by createdAt (Q5-A chronologicky pod root)
 * - reply na smazaný root zůstanou pod placeholderem
 */
export function CommentThread({
  comments,
  eventId,
  worldRole,
  currentUserId,
}: Props) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { roots, repliesByParent } = useMemo(() => {
    const roots: EventComment[] = [];
    const repliesByParent = new Map<string, EventComment[]>();
    for (const c of comments) {
      if (c.parentId === null) {
        roots.push(c);
      } else {
        const arr = repliesByParent.get(c.parentId) ?? [];
        arr.push(c);
        repliesByParent.set(c.parentId, arr);
      }
    }
    roots.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    for (const arr of repliesByParent.values()) {
      arr.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }
    return { roots, repliesByParent };
  }, [comments]);

  if (roots.length === 0 && repliesByParent.size === 0) {
    return null;
  }

  return (
    <ul className={s.list} aria-label="Komentáře">
      {roots.map((root) => {
        const replies = repliesByParent.get(root.id) ?? [];
        const isReplying = replyingTo === root.id;
        return (
          <li key={root.id} className={s.thread}>
            <CommentItem
              comment={root}
              eventId={eventId}
              worldRole={worldRole}
              currentUserId={currentUserId}
              onReplyClick={() => setReplyingTo(root.id)}
            />
            {replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                eventId={eventId}
                worldRole={worldRole}
                currentUserId={currentUserId}
                isReply
              />
            ))}
            {isReplying && (
              <div className={s.replyComposer}>
                {/* eslint-disable jsx-a11y/no-autofocus -- autofocus do reply editoru při otevření odpovědi je záměr */}
                <CommentComposer
                  eventId={eventId}
                  parentId={root.id}
                  autoFocus
                  isReply
                  onSubmit={() => setReplyingTo(null)}
                  onCancel={() => setReplyingTo(null)}
                />
                {/* eslint-enable jsx-a11y/no-autofocus */}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
