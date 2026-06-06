import { Link } from 'react-router-dom';
import { Drama } from 'lucide-react';
import type { WorldMembership } from '@/shared/types';
import { UserAvatar } from '@/shared/ui';
import { WorldRoleChip } from '@/features/world/components/WorldRoleChip';
import { worldMemberAvatar } from '@/features/world/lib/worldMemberAvatar';
import s from './MemberCard.module.css';

interface Props {
  member: WorldMembership;
  /** Slug světa — cíl odkazu na postavu (`/svet/:slug/<characterPath>`). */
  worldSlug?: string;
  /** Postava, za kterou hráč v TOMTO světě hraje (z `useCharacterDirectory`). */
  character?: { name: string; imageUrl?: string };
}

/**
 * Spec 5.6 — karta člena světa v adresáři: avatar + jméno + role.
 *
 * Klik na hlavní část vede na osobní kartu hráče (`/ikaros/uzivatel/:userId`) —
 * platformový profil účtu. Pokud hráč v tomto světě hraje za postavu, pod tím je
 * druhý (samostatný) odkaz „Hraje za <postava>" → stránka postavy ve světě.
 * Dva sourozenecké odkazy, NE vnořené (`<a>` v `<a>` je nevalidní HTML).
 */
export function MemberCard({ member, worldSlug, character }: Props) {
  const name = member.user?.username ?? 'Neznámý hráč';
  const showCharacter = !!member.characterPath && !!character && !!worldSlug;

  return (
    <div className={s.card} data-elev="card">
      <Link
        to={`/ikaros/uzivatel/${member.userId}`}
        className={s.main}
        aria-label={`Otevřít osobní kartu hráče ${name}`}
      >
        <UserAvatar src={worldMemberAvatar(member)} size="lg" alt={name} />
        <span className={s.name}>{name}</span>
        <WorldRoleChip role={member.role} size="sm" />
      </Link>

      {showCharacter && (
        <Link
          to={`/svet/${worldSlug}/${member.characterPath}`}
          className={s.charRow}
          aria-label={`Otevřít postavu ${character.name}`}
        >
          <UserAvatar src={character.imageUrl} size="sm" alt="" />
          <span className={s.charText}>
            <span className={s.charLabel}>
              <Drama size={11} aria-hidden="true" /> Hraje za
            </span>
            <span className={s.charName}>{character.name}</span>
          </span>
        </Link>
      )}
    </div>
  );
}
