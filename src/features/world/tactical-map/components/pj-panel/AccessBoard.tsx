/**
 * 10.2n — Přístup a viditelnost (nahrazuje `MemberAssignmentTable`).
 *
 * Per aktivní scéna karta:
 *   - hlavička: název + „👁 vše" / „🔒 vše" = per-scéna default (`scene.state`).
 *     „na všechny" navíc **vynuluje per-hráč overrides** daného pole (sweep
 *     `scene.playerState{…:null}`) → fakticky platí všem.
 *   - řádek hráče (přiřazený na scénu): per-hráč 👁/🔒 override toggle + × odebrat.
 *     Override se ukládá jen když se liší od defaultu (toggle zpět na default = clear).
 *   - „+ přiřadit hráče": hratelní členové mimo scénu → `member.assignToScene`.
 *
 * BE je autoritativní; tohle je PJ ovládání. Spec: phase-10/spec-10.2n.md.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postMapOperation } from '../../api/mapApi';
import { mapSceneQueryKey } from '../../hooks/useMapScene';
import { activeScenesQueryKey } from '../../hooks/useActiveScenes';
import { effectiveHidden, effectiveLocked } from '../../utils/sceneAccess';
import type { MapScene, MapOperation } from '../../types';
import type { WorldMembership } from '@/shared/types';
import { WorldRole } from '@/shared/types';
import styles from './AccessBoard.module.css';

interface Props {
  worldId: string;
  members: WorldMembership[];
  activeScenes: MapScene[];
  onAssign: (userId: string, sceneId: string) => void;
  onUnassign: (userId: string) => void;
}

type AccessField = 'isHidden' | 'isLocked';

export function AccessBoard({
  worldId,
  members,
  activeScenes,
  onAssign,
  onUnassign,
}: Props): React.ReactElement {
  const queryClient = useQueryClient();

  const opMutation = useMutation({
    mutationFn: ({ sceneId, op }: { sceneId: string; op: MapOperation }) =>
      postMapOperation(sceneId, op),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) });
      void queryClient.invalidateQueries({
        queryKey: activeScenesQueryKey(worldId),
      });
    },
  });

  // Hratelní členové (stejný filtr jako bývalá tabulka).
  const playable = members.filter(
    (m) => m.role >= WorldRole.Hrac && m.role <= WorldRole.PomocnyPJ,
  );

  const name = (m: WorldMembership): string => m.user?.username ?? m.userId;

  /** Per-scéna default toggle („na všechny") — set default + sweep clear overrides. */
  const toggleSceneDefault = (scene: MapScene, field: AccessField): void => {
    const next = !scene[field];
    opMutation.mutate({
      sceneId: scene.id,
      op: { type: 'scene.state', [field]: next } as MapOperation,
    });
    // sweep: každý override daného pole zruš (fallback na nový default)
    for (const ps of scene.playerStates ?? []) {
      if (ps[field] !== undefined) {
        opMutation.mutate({
          sceneId: scene.id,
          op: {
            type: 'scene.playerState',
            userId: ps.userId,
            [field]: null,
          } as MapOperation,
        });
      }
    }
  };

  /** Per-hráč override toggle. Toggle zpět na default = clear (null). */
  const togglePlayer = (
    scene: MapScene,
    userId: string,
    field: AccessField,
  ): void => {
    const eff =
      field === 'isHidden'
        ? effectiveHidden(scene, userId)
        : effectiveLocked(scene, userId);
    const nextVal = !eff;
    const sceneDefault = scene[field];
    opMutation.mutate({
      sceneId: scene.id,
      op: {
        type: 'scene.playerState',
        userId,
        [field]: nextVal === sceneDefault ? null : nextVal,
      } as MapOperation,
    });
  };

  if (activeScenes.length === 0) {
    return <p className={styles.empty}>Žádná aktivní scéna.</p>;
  }

  return (
    <div className={styles.board}>
      {activeScenes.map((scene) => {
        const assigned = playable.filter((m) => m.currentSceneId === scene.id);
        const unassignedToThis = playable.filter(
          (m) => m.currentSceneId !== scene.id,
        );
        return (
          <div key={scene.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.sceneName}>
                {scene.name || 'Nepojmenovaná'}
              </span>
              <div className={styles.allToggles}>
                <button
                  type="button"
                  className={`${styles.allBtn} ${scene.isHidden ? styles.allBtnHidden : ''}`}
                  onClick={() => toggleSceneDefault(scene, 'isHidden')}
                  disabled={opMutation.isPending}
                  title={
                    scene.isHidden
                      ? 'Scéna skrytá všem — klikni pro odkrytí'
                      : 'Skrýt mapu všem hráčům na scéně'
                  }
                >
                  {scene.isHidden ? '🚫' : '👁'} vše
                </button>
                <button
                  type="button"
                  className={`${styles.allBtn} ${scene.isLocked ? styles.allBtnLocked : ''}`}
                  onClick={() => toggleSceneDefault(scene, 'isLocked')}
                  disabled={opMutation.isPending}
                  title={
                    scene.isLocked
                      ? 'Pohyb zamčen všem — klikni pro odemčení'
                      : 'Zamknout pohyb všem hráčům na scéně'
                  }
                >
                  {scene.isLocked ? '🔒' : '🔓'} vše
                </button>
              </div>
            </div>

            {assigned.length === 0 ? (
              <p className={styles.noPlayers}>Žádný hráč na scéně.</p>
            ) : (
              <ul className={styles.players}>
                {assigned.map((m) => {
                  const hidden = effectiveHidden(scene, m.userId);
                  const locked = effectiveLocked(scene, m.userId);
                  const override = scene.playerStates?.find(
                    (p) => p.userId === m.userId,
                  );
                  const hasOverride =
                    override?.isHidden !== undefined ||
                    override?.isLocked !== undefined;
                  return (
                    <li key={m.userId} className={styles.playerRow}>
                      <span className={styles.playerName} title={name(m)}>
                        {name(m)}
                        {hasOverride && (
                          <span className={styles.overrideDot} title="Vlastní nastavení (override)">
                            •
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        className={`${styles.toggle} ${hidden ? styles.toggleOn : ''}`}
                        onClick={() => togglePlayer(scene, m.userId, 'isHidden')}
                        disabled={opMutation.isPending}
                        title={hidden ? 'Skrytá mapa — odkrýt' : 'Skrýt mapu hráči'}
                        aria-label={`Skrýt mapu hráči ${name(m)}`}
                      >
                        {hidden ? '🚫' : '👁'}
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggle} ${locked ? styles.toggleOn : ''}`}
                        onClick={() => togglePlayer(scene, m.userId, 'isLocked')}
                        disabled={opMutation.isPending}
                        title={locked ? 'Pohyb zamčen — odemknout' : 'Zamknout pohyb hráči'}
                        aria-label={`Zamknout pohyb hráči ${name(m)}`}
                      >
                        {locked ? '🔒' : '🔓'}
                      </button>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => onUnassign(m.userId)}
                        title={`Odebrat ${name(m)} ze scény`}
                        aria-label={`Odebrat ${name(m)} ze scény`}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {unassignedToThis.length > 0 && (
              <select
                className={styles.assignSelect}
                value=""
                onChange={(e) => {
                  if (e.target.value) onAssign(e.target.value, scene.id);
                }}
                aria-label="Přiřadit hráče na scénu"
              >
                <option value="">+ přiřadit hráče…</option>
                {unassignedToThis.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {name(m)}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
