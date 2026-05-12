import { MapPin, Globe2, MoreVertical } from 'lucide-react';
import clsx from 'clsx';
import { UserAvatar } from '@/shared/ui';
import { OnlineDot } from '@/shared/presence/OnlineDot';
import { RoleChip } from '../../shared/RoleChip';
import type { PublicUserListItem } from '@/shared/types';
import s from './UserCard.module.css';

interface UserCardProps {
  user: PublicUserListItem;
  onOpen: (id: string) => void;
  onKebab?: (user: PublicUserListItem, anchor: HTMLElement) => void;
}

/**
 * Spec 1.4 — design-1.4 §1.1. Portrétní karta s rohovými cornerstones,
 * avatar 80px (mobil 64px), role chipem, worldsCount + createdAt meta.
 * Klik na kartu (mimo kebab) → public profil. Kebab vždy viditelný
 * (rozhodnutí §5.4 / §10.4 — mobile parity).
 */
export function UserCard({ user, onOpen, onKebab }: UserCardProps) {
  const isPending = !!user.pendingDeletion;
  const isDeleted = !!user.deleted;
  const isFlagged = isPending || isDeleted;

  function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
    // Ignoruj kliknutí, která pocházejí z kebab tlačítka
    if ((e.target as HTMLElement).closest('[data-kebab]')) return;
    onOpen(user.id);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(user.id);
    }
  }

  return (
    <div
      className={clsx(s.card, isFlagged && s.deletedCard)}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      aria-label={`Otevřít profil uživatele ${user.username}`}
    >
      <span className={clsx(s.corner, s.cornerTl)} aria-hidden="true" />
      <span className={clsx(s.corner, s.cornerTr)} aria-hidden="true" />
      <span className={clsx(s.corner, s.cornerBl)} aria-hidden="true" />
      <span className={clsx(s.corner, s.cornerBr)} aria-hidden="true" />

      {onKebab && (
        <button
          type="button"
          data-kebab
          className={s.kebab}
          aria-label={`Akce pro uživatele ${user.username}`}
          aria-haspopup="menu"
          onClick={(e) => {
            e.stopPropagation();
            onKebab(user, e.currentTarget);
          }}
        >
          <MoreVertical size={18} />
        </button>
      )}

      <span className={s.avatarWrapper}>
        <UserAvatar
          src={user.avatarUrl}
          defaultType={user.defaultAvatarType}
          size="lg"
          alt={`Avatar ${user.username}`}
          className={s.avatar}
          deleted={isDeleted}
        />
        {!isFlagged && <OnlineDot userId={user.id} size="md" />}
      </span>

      <h3 className={s.username}>{user.username}</h3>
      {user.displayName && (
        <p className={s.displayName}>{user.displayName}</p>
      )}

      <RoleChip role={user.role} size="sm" />

      <div className={s.meta}>
        {user.city && (
          <span className={s.metaItem}>
            <MapPin size={12} aria-hidden="true" />
            {user.city}
          </span>
        )}
        <span className={s.metaItem}>
          <Globe2 size={12} aria-hidden="true" />
          {user.worldsCount === 1 ? '1 svět' : `${user.worldsCount} světů`}
        </span>
      </div>

      {isDeleted && (
        <div className={clsx(s.statusBand, s.statusBandDeleted)}>
          Účet smazán
        </div>
      )}
      {isPending && !isDeleted && (
        <div className={clsx(s.statusBand, s.statusBandPending)}>
          Pending deletion
        </div>
      )}
    </div>
  );
}
