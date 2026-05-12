import { Calendar, Globe2, MapPin, Clock } from 'lucide-react';
import { UserAvatar } from '@/shared/ui';
import { OnlineDot } from '@/shared/presence/OnlineDot';
import { useIsOnline } from '@/shared/presence/usePresence';
import { relativeTimeCs } from '@/shared/lib/relativeTime';
import type { PublicUserProfile } from '@/shared/types';
import { RoleChip } from '../shared/RoleChip';
import s from './PublicProfile.module.css';

const DATE_FMT = new Intl.DateTimeFormat('cs-CZ', {
  month: 'long',
  year: 'numeric',
});

interface Props {
  profile: PublicUserProfile;
}

export function PublicProfileHeader({ profile }: Props) {
  const since = profile.createdAt
    ? DATE_FMT.format(new Date(profile.createdAt))
    : null;
  const isFlagged = !!profile.deleted || !!profile.pendingDeletion;
  const isOnline = useIsOnline(profile.id);
  // 1.5 D-050 — tooltip "naposledy před X" jen pro offline + známý lastSeenAt
  const lastSeenLabel =
    !isOnline && !isFlagged && profile.lastSeenAt
      ? relativeTimeCs(profile.lastSeenAt)
      : null;

  return (
    <section className={s.header} aria-label="Hlavička profilu">
      <span className={s.headerAvatarWrapper}>
        <UserAvatar
          src={profile.avatarUrl}
          defaultType={profile.defaultAvatarType}
          size="xl"
          alt={`Avatar ${profile.username}`}
          className={s.headerAvatar}
          deleted={!!profile.deleted}
        />
        {!isFlagged && <OnlineDot userId={profile.id} size="md" />}
      </span>
      <div className={s.headerMain}>
        <div className={s.headerTitleRow}>
          <h2 className={s.headerUsername}>{profile.username}</h2>
          <RoleChip role={profile.role} />
        </div>
        {profile.displayName && (
          <p className={s.headerDisplayName}>{profile.displayName}</p>
        )}
        <div className={s.headerMeta}>
          {profile.city && (
            <span className={s.headerMetaItem}>
              <MapPin size={14} aria-hidden="true" />
              {profile.city}
            </span>
          )}
          <span className={s.headerMetaItem}>
            <Globe2 size={14} aria-hidden="true" />
            {profile.worldsCount === 1
              ? '1 svět'
              : `${profile.worldsCount} světů`}
          </span>
          {since && (
            <span className={s.headerMetaItem}>
              <Calendar size={14} aria-hidden="true" />
              člen od {since}
            </span>
          )}
          {lastSeenLabel && (
            <span
              className={s.headerMetaItem}
              title={`Naposledy aktivní ${lastSeenLabel}`}
            >
              <Clock size={14} aria-hidden="true" />
              naposledy {lastSeenLabel}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
