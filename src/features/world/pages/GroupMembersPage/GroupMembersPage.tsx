import { useMemo, useState, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { Users, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner, EmptyState } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { useUploadImage } from '@/shared/api';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useUpdateWorldSettings } from '@/features/world/api/useUpdateWorldSettings';
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
  const { worldId, worldSlug, userRole, world, loading } = useWorldContext();
  const membersQuery = useWorldMembers(worldId);
  const settingsQuery = useWorldSettings(worldId);
  const directoryQuery = useCharacterDirectory(worldId);
  const updateSettings = useUpdateWorldSettings(worldId);
  const uploadImage = useUploadImage();
  const [uploading, setUploading] = useState(false);

  const groupName = decodeGroupKey(groupKey);
  const title = groupName ?? UNGROUPED_LABEL;

  const customGroups = settingsQuery.data?.customGroups ?? [];
  const groupColors = settingsQuery.data?.groupColors ?? {};
  const groupImages = settingsQuery.data?.groupImages ?? {};
  const color = groupName ? groupColors[groupName] : undefined;
  const emblem = groupName ? groupImages[groupName] : undefined;
  // Znak může nahrát jen PJ (BE `updateSettings` = canAdminWorld ≥ PJ) a jen
  // pro reálnou skupinu (ne „Nezařazení", které kanál ani znak nemá). Var. B.
  // Elevation — admin má world bypass jen když je v tomto světě „nahozený".
  const canEditEmblem =
    groupName !== null &&
    (world?.elevated === true || (userRole ?? -1) >= WorldRole.PJ);

  async function pickEmblem(file: File | undefined) {
    if (!file || !groupName) return;
    setUploading(true);
    try {
      const { url } = await uploadImage.mutateAsync(file);
      await updateSettings.mutateAsync({
        groupImages: { ...groupImages, [groupName]: url },
      });
      toast.success('Znak skupiny uložen.');
    } catch {
      toast.error('Uložení znaku selhalo.');
    } finally {
      setUploading(false);
    }
  }

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
        {canEditEmblem ? (
          <label
            className={`${s.emblem} ${s.emblemEdit}`}
            style={{ '--g-ring': color } as CSSProperties}
            title={emblem ? 'Změnit znak skupiny' : 'Nahrát znak skupiny'}
            aria-label={emblem ? 'Změnit znak skupiny' : 'Nahrát znak skupiny'}
          >
            {emblem ? (
              <img className={s.emblemImg} src={emblem} alt="" />
            ) : (
              <Users size={22} aria-hidden />
            )}
            <span className={s.emblemOverlay} aria-hidden>
              <ImagePlus size={18} />
            </span>
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={uploading}
              onChange={(e) => pickEmblem(e.target.files?.[0])}
            />
          </label>
        ) : (
          <span
            className={s.emblem}
            style={{ '--g-ring': color } as CSSProperties}
            aria-hidden
          >
            {emblem ? (
              <img className={s.emblemImg} src={emblem} alt="" />
            ) : (
              <Users size={22} />
            )}
          </span>
        )}
        <h1 className={s.title}>{title}</h1>
        <span className={s.count}>{members.length}</span>
      </header>

      {members.length === 0 ? (
        <EmptyState
          size="panel"
          illustration="characters"
          title="Ve skupině zatím nikdo není"
          description="Jakmile bude mít nějaká postava přiřazenou tuhle skupinu, objeví se tady."
        />
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
