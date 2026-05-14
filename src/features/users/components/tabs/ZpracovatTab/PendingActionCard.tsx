import { type ReactNode } from 'react';
import clsx from 'clsx';
import { PendingActionType } from '@/shared/types';
import s from './PendingActionCard.module.css';

/**
 * Spec 1.4 — univerzální shell pro card ve Zpracovat tabu. Tři kolony
 * (L = avatar/thumb, Mid = popis akce, R = akční tlačítka).
 *
 * Konkrétní rendery (renderer registry) skládají L/Mid/R sloty pro daný
 * typ akce. 1.4 implementuje jen `UsernameRequestRenderer`. Další fáze
 * (1.8 friend_request, 2.4 world_access_request, 3.x content review)
 * přidají vlastní rendery.
 */
export interface PendingActionRenderer<T> {
  type: PendingActionType;
  renderLeft: (item: T) => ReactNode;
  renderMid: (item: T) => ReactNode;
  renderActions: (
    item: T,
    helpers: { onResolve: () => void; isLoading: boolean },
  ) => ReactNode;
}

interface PendingActionCardProps<T> {
  item: T;
  renderer: PendingActionRenderer<T>;
  isResolving: boolean;
  onResolve: () => void;
}

export function PendingActionCard<T>({
  item,
  renderer,
  isResolving,
  onResolve,
}: PendingActionCardProps<T>) {
  return (
    <article className={clsx(s.card, isResolving && s.cardResolving)}>
      <div className={s.left}>{renderer.renderLeft(item)}</div>
      <div className={s.mid}>{renderer.renderMid(item)}</div>
      <div className={s.right}>
        {renderer.renderActions(item, { onResolve, isLoading: isResolving })}
      </div>
    </article>
  );
}
