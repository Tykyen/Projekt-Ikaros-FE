import { Link } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { usePendingActionsCount } from '@/features/users/api/usePendingActions';
import { PendingActionType } from '@/shared/types';
import { centerOpenAtom } from '../model/centerStore';
import s from './NotificationCenter.module.css';

const LABELS: Partial<Record<PendingActionType, string>> = {
  [PendingActionType.ArticlePendingReview]: 'Články ke schválení',
  [PendingActionType.GalleryPendingReview]: 'Obrázky ke schválení',
  [PendingActionType.DiscussionPendingReview]: 'Diskuze ke schválení',
  [PendingActionType.DiscussionReport]: 'Nahlášené příspěvky',
  [PendingActionType.DiscussionJoinRequest]: 'Žádosti do diskuze',
  [PendingActionType.WorldAccessRequest]: 'Žádosti o vstup do světa',
  [PendingActionType.FriendRequest]: 'Žádosti o přátelství',
  [PendingActionType.UsernameRequest]: 'Žádosti o přezdívku',
};

/**
 * Spec 13.2b — záložka „Ke zpracování": souhrn schvalovacích front (reuse
 * `pending-actions`). Plné vyřízení je v adresáři uživatelů (tab Zpracovat) —
 * tady jen rychlý přehled + proklik. Záložka se zobrazuje jen rolím, které
 * mají co schvalovat (řídí `NotificationCenter` dle `total > 0`).
 */
export function PendingTab() {
  const { data } = usePendingActionsCount();
  const setOpen = useSetAtom(centerOpenAtom);

  const byType = data?.byType ?? {};
  const entries = (Object.entries(byType) as [PendingActionType, number][])
    .filter(([, n]) => (n ?? 0) > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0)
    return <p className={s.empty}>Nic nečeká na tvé zpracování.</p>;

  return (
    <div className={s.pendingWrap}>
      <ul className={s.feed}>
        {entries.map(([type, n]) => (
          <li key={type} className={s.pendingRow}>
            <span className={s.pendingLabel}>{LABELS[type] ?? type}</span>
            <span className={s.pendingCount}>{n}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/ikaros/uzivatele"
        className={s.more}
        onClick={() => setOpen(false)}
      >
        Otevřít zpracování
      </Link>
    </div>
  );
}
