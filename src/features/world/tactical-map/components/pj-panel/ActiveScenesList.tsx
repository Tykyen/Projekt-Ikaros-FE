/**
 * 10.2c — list aktivních scén ve světě (PJ orchestrator).
 *
 * PJ kliká na scénu → `member.assignToScene { userId: self, sceneId }` →
 * server cascade token.remove na staré scéně + update membership → emit
 * `map:reassigned` na self → useReassignmentListener invaliduje → autoload.
 *
 * Spec: docs/arch/phase-10/spec-10.2c.md §2 (PJ orchestrator).
 */
import type { MapScene } from '../../types';
import styles from './ActiveScenesList.module.css';

interface Props {
  scenes: MapScene[];
  /** ID aktuálně focused scény (highlight v listu). */
  currentSceneId: string | null;
  onSwitch: (sceneId: string) => void;
  /** FIX-3 — true během probíhajícího `member.assignToScene` (switch mutation). */
  switchDisabled?: boolean;
  /** PJ-only — pokud poskytnuto, ukáže ⚙ tlačítko vedle každé scény. */
  onEdit?: (scene: MapScene) => void;
  /**
   * 10.2c-edit-1 — pokud poskytnuto, ukáže ✕ tlačítko vedle každé scény pro
   * `scene.deactivate` (PJ-only). Cascade unassign všech přiřazených hráčů
   * řeší BE, klient zobrazí confirm dialog před voláním.
   */
  onDeactivate?: (sceneId: string) => void;
  /**
   * 10.2c-edit-7 — PJ-only akce „Vyčistit scénu od tokenů" (🧹).
   * Otevírá confirm dialog v parentu, ne přímý API call.
   */
  onClear?: (scene: MapScene) => void;
}

export function ActiveScenesList({
  scenes,
  currentSceneId,
  onSwitch,
  switchDisabled,
  onEdit,
  onDeactivate,
  onClear,
}: Props): React.ReactElement {
  if (scenes.length === 0) {
    return (
      <p className={styles.empty}>
        Žádná aktivní scéna. Vytvoř scénu v knihovně map a aktivuj ji.
      </p>
    );
  }
  return (
    <ul className={styles.list}>
      {scenes.map((scene) => {
        const isCurrent = scene.id === currentSceneId;
        return (
          <li key={scene.id} className={styles.row}>
            <button
              type="button"
              className={`${styles.item} ${isCurrent ? styles.current : ''}`}
              onClick={() => onSwitch(scene.id)}
              disabled={switchDisabled}
              aria-current={isCurrent ? 'true' : undefined}
            >
              <span className={styles.name}>
                {scene.name || 'Nepojmenovaná scéna'}
              </span>
              {scene.isHidden && (
                <span className={styles.badge} title="Skrytá pro hráče">
                  🚫
                </span>
              )}
              {scene.isLocked && (
                <span className={styles.badge} title="Pohyby uzamčené">
                  🔒
                </span>
              )}
            </button>
            {onEdit && (
              <button
                type="button"
                className={styles.editBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(scene);
                }}
                title="Upravit scénu (jméno, mapa, hex config)"
                aria-label="Upravit scénu"
              >
                ⚙
              </button>
            )}
            {onClear && (
              <button
                type="button"
                className={styles.editBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onClear(scene);
                }}
                title="Vyčistit scénu od všech tokenů (PC + NPC + bestie). Boj se ukončí."
                aria-label="Vyčistit scénu od tokenů"
              >
                🧹
              </button>
            )}
            {onDeactivate && (
              <button
                type="button"
                className={styles.deactivateBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeactivate(scene.id);
                }}
                title="Deaktivovat scénu (přiřazení hráči ji ztratí)"
                aria-label="Deaktivovat scénu"
              >
                ✕
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
