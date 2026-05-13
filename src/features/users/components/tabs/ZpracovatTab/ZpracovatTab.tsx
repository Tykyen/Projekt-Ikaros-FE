import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Inbox } from 'lucide-react';
import { PendingActionType } from '@/shared/types';
import {
  usePendingActions,
  usePendingActionsCount,
} from '../../../api/usePendingActions';
import { PendingActionCard } from './PendingActionCard';
import { PENDING_ACTION_RENDERERS } from './rendererRegistry';
import s from './ZpracovatTab.module.css';

const GROUP_TITLES: Record<PendingActionType, string> = {
  [PendingActionType.UsernameRequest]: 'Žádosti o změnu přezdívky',
  [PendingActionType.FriendRequest]: 'Žádosti o přátelství',
  [PendingActionType.WorldJoinRequest]: 'Žádosti o vstup do světa',
  [PendingActionType.ArticlePendingReview]: 'Články ke schválení',
  [PendingActionType.GalleryPendingReview]: 'Obrázky ke schválení',
  [PendingActionType.DiscussionReport]: 'Hlášené příspěvky',
  [PendingActionType.DiscussionJoinRequest]: 'Žádosti o vstup do diskuze',
};

/**
 * Spec 1.4 + 1.8 (Q3) — univerzální action queue jako **agregátor** přes
 * všechny registrované `PendingActionType` rendery.
 *
 * Implementace: každý typ má vlastní `<PendingGroup>` komponent, který volá
 * `usePendingActions` hook v top-level pozici (vyhovuje rules-of-hooks).
 * Group se sám skryje pokud má 0 items. Globální empty state závisí na
 * `usePendingActionsCount` (jeden BE call agreguje napříč všemi providery).
 */
export function ZpracovatTab() {
  const registeredTypes = Object.keys(
    PENDING_ACTION_RENDERERS,
  ) as PendingActionType[];

  const { data: countData, isLoading: countLoading } = usePendingActionsCount();
  const total = countData?.total ?? 0;

  if (countLoading && total === 0) {
    return (
      <div className={s.tab} aria-busy="true">
        <div className={s.skeleton} />
        <div className={s.skeleton} />
        <div className={s.skeleton} />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className={s.tab}>
        <div className={s.empty}>
          <span className={s.emptyIcon} aria-hidden="true">
            <Inbox size={48} />
          </span>
          <h2 className={s.emptyTitle}>Nic ke zpracování</h2>
          <p className={s.emptyText}>
            Až přijde nová žádost, ukáže se zde. Tab agreguje všechny pending
            akce napříč moduly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.tab}>
      {registeredTypes.map((type) => (
        <PendingGroup key={type} type={type} />
      ))}
    </div>
  );
}

interface PendingGroupProps {
  type: PendingActionType;
}

function PendingGroup({ type }: PendingGroupProps) {
  const qc = useQueryClient();
  const [resolvingKey, setResolvingKey] = useState<string | null>(null);
  const { data } = usePendingActions<{ id?: string; friendshipId?: string }>(
    type,
  );
  const renderer = PENDING_ACTION_RENDERERS[type];
  const items = data?.items ?? [];

  if (!renderer || items.length === 0) return null;

  return (
    <section className={s.group} aria-label={GROUP_TITLES[type]}>
      <h3 className={s.groupTitle}>
        {GROUP_TITLES[type]}{' '}
        <span className={s.groupCount}>({data?.total ?? items.length})</span>
      </h3>
      {items.map((item, idx) => {
        const key = item.friendshipId ?? item.id ?? `${type}-${idx}`;
        return (
          <PendingActionCard
            key={key}
            item={item as never}
            renderer={renderer}
            isResolving={resolvingKey === key}
            onResolve={() => {
              setResolvingKey(key);
              setTimeout(() => {
                qc.invalidateQueries({ queryKey: ['pending-actions'] });
                setResolvingKey(null);
              }, 320);
            }}
          />
        );
      })}
    </section>
  );
}
