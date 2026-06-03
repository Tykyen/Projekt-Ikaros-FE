import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Spinner } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useCharacterDirectory } from '@/features/world/pages/api/useCharacterDirectory';
import { worldMemberAvatar } from '@/features/world/lib/worldMemberAvatar';
import {
  decodeGroupKey,
  membersInGroup,
  UNGROUPED_LABEL,
} from '@/features/world/lib/groupMembers';
import { GroupMemberCard } from './GroupMemberCard';
import s from './GroupMembersPage.module.css';

/**
 * 12.3 — autogenerovaná stránka skupiny (záložka „Informace"). Seznam hrajících
 * členů skupiny (postava + avatar, proklik na postavu). „Nezařazení" = členové
 * s postavou bez skupiny. Obsah se mění podle přiřazení postav a skupin.
 */
export default function GroupMembersPage() {
  const { groupKey = '' } = useParams<{ groupKey: string }>();
  const { worldId, worldSlug, loading } = useWorldContext();
  const membersQuery = useWorldMembers(worldId);
  const settingsQuery = useWorldSettings(worldId);
  const directoryQuery = useCharacterDirectory(worldId);

  const groupName = decodeGroupKey(groupKey);
  const title = groupName ?? UNGROUPED_LABEL;

  const customGroups = settingsQuery.data?.customGroups ?? [];
  const groupColors = settingsQuery.data?.groupColors ?? {};
  const color = groupName ? groupColors[groupName] : undefined;

  // characterPath (slug) → entry postavy (jméno + obrázek).
  const charBySlug = useMemo(() => {
    const map = new Map<string, { name: string; imageUrl?: string }>();
    for (const e of directoryQuery.data ?? []) {
      map.set(e.slug, { name: e.name, imageUrl: e.imageUrl });
    }
    return map;
  }, [directoryQuery.data]);

  if (loading || membersQuery.isLoading) return <Spinner center />;

  const members = membersInGroup(
    membersQuery.data ?? [],
    groupName,
    customGroups,
  );

  return (
    <article className={s.page}>
      <header className={s.head}>
        {color && (
          <span className={s.dot} style={{ background: color }} aria-hidden />
        )}
        <Users size={20} className={s.icon} aria-hidden />
        <h1 className={s.title}>{title}</h1>
        <span className={s.count}>{members.length}</span>
      </header>

      {members.length === 0 ? (
        <p className={s.empty}>Ve skupině zatím nikdo není.</p>
      ) : (
        <div className={s.grid}>
          {members.map((m) => {
            const char = m.characterPath
              ? charBySlug.get(m.characterPath)
              : undefined;
            const name = char?.name ?? m.user?.username ?? 'Neznámá postava';
            return (
              <GroupMemberCard
                key={m.id}
                characterName={name}
                avatarUrl={char?.imageUrl ?? worldMemberAvatar(m)}
                to={`/svet/${worldSlug}/${m.characterPath}`}
                role={m.role}
              />
            );
          })}
        </div>
      )}
    </article>
  );
}
