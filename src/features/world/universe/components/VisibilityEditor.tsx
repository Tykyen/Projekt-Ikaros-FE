// 10.1b — editor viditelnosti uzlu: veřejné / per-hráč whitelist.
// Sdílené editorem uzlu (draft) i quick-toggle z detailu (PATCH).
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import styles from './UniversePanel.module.css';

export interface VisibilityValue {
  isPublic: boolean;
  visibleToPlayerIds: string[];
}

interface Props {
  worldId: string;
  value: VisibilityValue;
  onChange: (next: VisibilityValue) => void;
}

export function VisibilityEditor({ worldId, value, onChange }: Props) {
  const { data: members = [] } = useWorldMembers(worldId);

  const toggleMember = (userId: string, checked: boolean) => {
    const set = new Set(value.visibleToPlayerIds);
    if (checked) set.add(userId);
    else set.delete(userId);
    onChange({ ...value, visibleToPlayerIds: [...set] });
  };

  return (
    <div className={styles.visibility}>
      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={value.isPublic}
          onChange={(e) =>
            onChange({ ...value, isPublic: e.target.checked })
          }
        />
        <span>Veřejně viditelné</span>
      </label>

      {!value.isPublic && (
        <div className={styles.memberList}>
          <span className={styles.memberHint}>Povolit přístup hráčům:</span>
          {members.map((m) => {
            const uid = m.userId;
            return (
              <label key={uid} className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={value.visibleToPlayerIds.includes(uid)}
                  onChange={(e) => toggleMember(uid, e.target.checked)}
                />
                <span>{m.user?.username ?? uid}</span>
              </label>
            );
          })}
          {members.length === 0 && (
            <span className={styles.memberHint}>Svět nemá žádné členy.</span>
          )}
        </div>
      )}
    </div>
  );
}
