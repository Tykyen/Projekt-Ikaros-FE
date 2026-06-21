import { Link } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { UserAvatar, EmptyState, ErrorState } from '@/shared/ui';
import { useChatFeed } from '../api/useChatFeed';
import { centerOpenAtom } from '../model/centerStore';
import { preview, formatWhen } from '../lib/feedFormat';
import s from './NotificationCenter.module.css';

/**
 * Spec 13.2a — záložka „Chaty": chronologický feed (nejnovější nahoře) zpráv
 * ze všech mých světů. Server vrací jen kanály, kam mám přístup.
 */
export function ChatFeedTab() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatFeed();
  const setOpen = useSetAtom(centerOpenAtom);

  const items = data?.pages.flat() ?? [];

  if (isLoading) return <p className={s.muted}>Načítám zprávy…</p>;
  if (isError)
    return (
      <ErrorState
        size="panel"
        title="Zprávy se nepodařilo načíst"
        onRetry={() => void refetch()}
      />
    );
  if (items.length === 0)
    return (
      <EmptyState
        size="panel"
        illustration="messages"
        title="Zatím žádné zprávy z tvých světů"
        description="Jakmile se v některém světě rozproudí konverzace, uvidíš ji tady."
      />
    );

  return (
    <ul className={s.feed}>
      {items.map((m) => {
        const name = m.senderIsDeleted
          ? 'Smazaný účet'
          : (m.overrideName ?? m.senderName);
        const inner = (
          <>
            <UserAvatar
              src={m.overrideAvatarUrl ?? m.senderAvatarUrl}
              size="sm"
              alt={name}
              deleted={m.senderIsDeleted}
            />
            <div className={s.itemBody}>
              <div className={s.itemHead}>
                <span className={s.sender}>{name}</span>
                <span className={s.when}>{formatWhen(m.createdAt)}</span>
              </div>
              <div className={s.loc}>
                <span className={s.world}>{m.worldName}</span>
                <span className={s.sep}>·</span>
                <span className={s.channel}>{m.channelName}</span>
              </div>
              <div className={s.content}>{preview(m)}</div>
            </div>
          </>
        );
        return (
          <li key={m.id}>
            {m.worldSlug ? (
              // Klik → otevři konverzaci a skoč na tuto zprávu; zavři centrum.
              <Link
                to={`/svet/${m.worldSlug}/chat?konverzace=${m.channelId}&zprava=${m.id}`}
                className={s.item}
                onClick={() => setOpen(false)}
              >
                {inner}
              </Link>
            ) : (
              <div className={s.item}>{inner}</div>
            )}
          </li>
        );
      })}
      {hasNextPage && (
        <li className={s.moreRow}>
          <button
            type="button"
            className={s.more}
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Načítám…' : 'Starší zprávy'}
          </button>
        </li>
      )}
    </ul>
  );
}
