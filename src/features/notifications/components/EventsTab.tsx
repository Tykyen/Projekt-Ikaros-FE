import { useEvents } from '../api/useEvents';
import { formatWhen } from '../lib/feedFormat';
import s from './NotificationCenter.module.css';

/**
 * Spec 13.2b — záložka „Události": systémová oznámení (co mi schválili,
 * přiřazení postavy). Data = systémové zprávy z Pošty (`senderId='system'`).
 */
export function EventsTab() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEvents();

  const items = data?.pages.flat() ?? [];

  if (isLoading) return <p className={s.muted}>Načítám události…</p>;
  if (isError) return <p className={s.muted}>Události se nepodařilo načíst.</p>;
  if (items.length === 0)
    return <p className={s.empty}>Zatím žádné události.</p>;

  return (
    <ul className={s.feed}>
      {items.map((m) => (
        <li key={m.id} className={s.item}>
          <div className={s.itemBody}>
            <div className={s.itemHead}>
              <span className={s.sender}>
                {!m.isRead && <span className={s.dot} aria-label="nepřečteno" />}
                {m.subject}
              </span>
              <span className={s.when}>{formatWhen(m.sentAtUtc)}</span>
            </div>
            <div className={s.content}>{m.body}</div>
          </div>
        </li>
      ))}
      {hasNextPage && (
        <li className={s.moreRow}>
          <button
            type="button"
            className={s.more}
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Načítám…' : 'Starší události'}
          </button>
        </li>
      )}
    </ul>
  );
}
