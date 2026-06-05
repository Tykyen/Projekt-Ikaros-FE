import { Link } from 'react-router-dom';
import type { WorldMembership } from '@/shared/types';
import { UserAvatar } from '@/shared/ui';
import { WorldRoleChip } from '@/features/world/components/WorldRoleChip';
import { worldMemberAvatar } from '@/features/world/lib/worldMemberAvatar';
import s from './MemberCard.module.css';

interface Props {
  member: WorldMembership;
}

/**
 * Spec 5.6 — karta člena světa v adresáři: avatar + jméno + role.
 *
 * Klik vede na osobní kartu hráče (`/ikaros/uzivatel/:userId`) — platformový
 * veřejný profil účtu, ne stránka postavy ve světě.
 */
export function MemberCard({ member }: Props) {
  const name = member.user?.username ?? 'Neznámý hráč';

  return (
    <Link
      to={`/ikaros/uzivatel/${member.userId}`}
      className={s.card}
      data-elev="card"
      aria-label={`Otevřít osobní kartu hráče ${name}`}
    >
      <UserAvatar src={worldMemberAvatar(member)} size="lg" alt={name} />
      <span className={s.name}>{name}</span>
      <WorldRoleChip role={member.role} size="sm" />
    </Link>
  );
}
