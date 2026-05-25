import { useAtomValue } from 'jotai';
import type { WorldRole } from '@/shared/types';
import { currentUserAtom } from '@/shared/store/authStore';
import { useGameEventDetail } from '@/features/world/api/useGameEvents';
import { CommentThread } from './CommentThread';
import { CommentComposer } from './CommentComposer';
import s from './GameEventComments.module.css';

interface Props {
  eventId: string;
  worldRole: WorldRole;
}

/**
 * 9.1-II — orchestrátor komentářové sekce. Lazy fetch detailu eventu (s
 * comments) přes `useGameEventDetail`, render thread + composer pro nový root.
 */
export function GameEventComments({ eventId, worldRole }: Props) {
  const currentUser = useAtomValue(currentUserAtom);
  const detailQ = useGameEventDetail(eventId, /* enabled */ true);

  const comments = detailQ.data?.comments ?? [];

  if (detailQ.isLoading) {
    return (
      <div className={s.wrap} aria-busy="true" aria-label="Načítání komentářů">
        {[0, 1, 2].map((i) => (
          <div key={i} className={s.skeleton} aria-hidden="true" />
        ))}
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      {comments.length === 0 ? (
        <p className={s.empty}>Žádné komentáře. Buď první!</p>
      ) : (
        <CommentThread
          comments={comments}
          eventId={eventId}
          worldRole={worldRole}
          currentUserId={currentUser?.id ?? null}
        />
      )}
      <div className={s.composerWrap}>
        <CommentComposer eventId={eventId} parentId={null} />
      </div>
    </div>
  );
}
