/**
 * 10.2c — per-člen dropdown pro PJ orchestrátora.
 *
 * Pro každého membera světa: select s aktivními scénami (+ option „nikde").
 * Změna → POST `member.assignToScene` (nebo `.unassign` pokud "nikde").
 *
 * Spec: docs/arch/phase-10/spec-10.2c.md §2 (PJ orchestrator).
 */
import type { MapScene } from '../../types';
import type { WorldMembership } from '@/shared/types';
import { WorldRole } from '@/shared/types';
import styles from './MemberAssignmentTable.module.css';

interface Props {
  members: WorldMembership[];
  activeScenes: MapScene[];
  onAssign: (userId: string, sceneId: string) => void;
  onUnassign: (userId: string) => void;
}

const UNASSIGNED_VALUE = '__unassigned__';

export function MemberAssignmentTable({
  members,
  activeScenes,
  onAssign,
  onUnassign,
}: Props): React.ReactElement {
  // Filtrujeme: PJ a Sa-úrovně se v orchestrátoru neřeší (mají vlastní switch).
  // V MVP zobrazíme všechny role kromě Zadatel/Ctenar (kteří mapu nehrají).
  const playable = members.filter(
    (m) => m.role >= WorldRole.Hrac && m.role <= WorldRole.PomocnyPJ,
  );

  if (playable.length === 0) {
    return (
      <p className={styles.empty}>Žádní hratelní členové ve světě.</p>
    );
  }

  return (
    <div className={styles.table}>
      {playable.map((m) => {
        const value = m.currentSceneId ?? UNASSIGNED_VALUE;
        return (
          <div key={m.id} className={styles.row}>
            <span className={styles.name}>
              {m.user?.username ?? m.userId}
            </span>
            <select
              className={styles.select}
              value={value}
              onChange={(e) => {
                const next = e.target.value;
                if (next === UNASSIGNED_VALUE) {
                  onUnassign(m.userId);
                } else {
                  onAssign(m.userId, next);
                }
              }}
              aria-label={`Přiřadit ${m.user?.username ?? 'člena'} na scénu`}
            >
              <option value={UNASSIGNED_VALUE}>— Nikde —</option>
              {activeScenes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || 'Nepojmenovaná'}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
