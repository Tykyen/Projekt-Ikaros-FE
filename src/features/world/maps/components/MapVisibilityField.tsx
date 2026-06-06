import { WorldRole } from '@/shared/types';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { UserAvatar } from '@/shared/ui';
import s from './MapVisibilityField.module.css';

interface Props {
  worldId: string;
  isPublic: boolean;
  visibleToPlayerIds: string[];
  onChange: (next: { isPublic: boolean; visibleToPlayerIds: string[] }) => void;
}

/**
 * 13.4 — výběr viditelnosti mapy: veřejná (všichni) / jen vybraní hráči.
 * Seznam = členové světa kromě žadatelů. Vzor viditelnosti = Mapa vesmíru.
 */
export function MapVisibilityField({
  worldId,
  isPublic,
  visibleToPlayerIds,
  onChange,
}: Props) {
  const { data: members = [] } = useWorldMembers(worldId);
  const selectable = members.filter((m) => m.role !== WorldRole.Zadatel);
  const selected = new Set(visibleToPlayerIds);

  function toggle(userId: string) {
    const next = new Set(selected);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    onChange({ isPublic: false, visibleToPlayerIds: [...next] });
  }

  return (
    <div className={s.wrap}>
      <span className={s.label}>Viditelnost</span>
      <label className={s.radio}>
        <input
          type="radio"
          name="map-visibility"
          checked={isPublic}
          onChange={() => onChange({ isPublic: true, visibleToPlayerIds: [] })}
        />
        <span>Veřejná (všichni členové)</span>
      </label>
      <label className={s.radio}>
        <input
          type="radio"
          name="map-visibility"
          checked={!isPublic}
          onChange={() => onChange({ isPublic: false, visibleToPlayerIds })}
        />
        <span>Jen vybraní hráči</span>
      </label>

      {!isPublic && (
        <div className={s.list}>
          {selectable.length === 0 ? (
            <p className={s.empty}>Žádní členové k výběru.</p>
          ) : (
            selectable.map((m) => (
              <label key={m.id} className={s.item}>
                <input
                  type="checkbox"
                  checked={selected.has(m.userId)}
                  onChange={() => toggle(m.userId)}
                />
                <UserAvatar
                  src={m.avatarUrl ?? m.user?.avatarUrl}
                  size="xs"
                  alt={m.user?.username}
                />
                <span className={s.name}>{m.user?.username ?? 'Hráč'}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
