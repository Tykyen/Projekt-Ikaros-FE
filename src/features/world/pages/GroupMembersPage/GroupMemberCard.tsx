import { Link } from 'react-router-dom';
import { UserAvatar } from '@/shared/ui';
import { WorldRoleChip } from '@/features/world/components/WorldRoleChip';
import type { WorldRole } from '@/shared/types';
import s from './GroupMemberCard.module.css';

interface Props {
  characterName: string;
  avatarUrl?: string;
  to: string;
  role: WorldRole;
}

/**
 * 12.3 — karta člena na stránce skupiny. Postava-oriented (jméno + avatar
 * postavy), proklik na veřejnou stránku postavy. Role chip jen pro kontext.
 */
export function GroupMemberCard({ characterName, avatarUrl, to, role }: Props) {
  return (
    <Link to={to} className={s.card} data-elev="card">
      <UserAvatar src={avatarUrl} size="lg" alt={characterName} />
      <span className={s.name}>{characterName}</span>
      <WorldRoleChip role={role} size="sm" />
    </Link>
  );
}
