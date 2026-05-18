import type { WorldMembership } from '@/shared/types';
import { UserAvatar } from '@/shared/ui';
import { WorldRoleChip } from '@/features/world/components/WorldRoleChip';
import s from './MemberCard.module.css';

interface Props {
  member: WorldMembership;
}

/**
 * Spec 5.6 — karta člena světa v adresáři: avatar + jméno + role.
 *
 * Fáze 8 (character flow): `member.characterPath` doplní odkaz na veřejnou
 * stránku postavy a deník. Do té doby je karta neklikací.
 */
export function MemberCard({ member }: Props) {
  const name = member.user?.username ?? 'Neznámý hráč';

  return (
    <article className={s.card}>
      <UserAvatar src={member.user?.avatarUrl} size="lg" alt={name} />
      <span className={s.name}>{name}</span>
      <WorldRoleChip role={member.role} size="sm" />
    </article>
  );
}
