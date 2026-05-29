/**
 * 10.2c-edit-9g Fáze 9c — bestie statblok view pro TokenInfoPanel.
 *
 * Wrapper kolem `BestieStatblock` který drží vlastní state (stats z
 * token.systemStats nebo BC fallback) + save handler přes `useTokenUpdate`.
 *
 * Bestie nemá Character record / deník — jen statblok (per-system schema)
 * + `bestie.notes` z bestiarQueryKey cache (PJ-only).
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { BestieStatblock } from '../tokens/BestieStatblock';
import { useTokenUpdate } from '../../hooks/useTokenUpdate';
import { performSheetRoll } from '../../utils/rollFromSheet';
import type { MapToken } from '../../types';
import styles from './TokenSystemSheet.module.css';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  systemId: string;
  canEdit: boolean;
}

export function BestiePanelView({
  token,
  sceneId,
  worldId,
  systemId,
  canEdit,
}: Props): React.ReactElement {
  // BC fallback: pokud systemStats prázdné, mapuj z fixed pole.
  const initialStats =
    token.systemStats && Object.keys(token.systemStats).length > 0
      ? token.systemStats
      : {
          'health.current': token.currentHp,
          'health.max': token.maxHp,
          armor: token.armor,
          injury: token.injury,
          movement: token.movement,
          'initiative.current': token.initiative,
          'initiative.base': token.initiativeBase,
        };

  const [stats, setStats] = useState<Record<string, unknown>>(initialStats);
  const update = useTokenUpdate(sceneId, worldId);

  const handleSave = (): void => {
    update.mutate(
      { tokenId: token.id, patch: { systemStats: stats } },
      {
        onSuccess: () => toast.success('Statblok uložen'),
        onError: (e) =>
          toast.error(
            `Save selhal: ${e instanceof Error ? e.message : 'neznámá chyba'}`,
          ),
      },
    );
  };

  const handleInitiativeRoll = (): void => {
    const initBase =
      Number(stats['initiative.base'] ?? token.initiativeBase ?? 0) || 0;
    performSheetRoll({
      label: 'Iniciativa',
      modifier: initBase,
      kind: 'fate',
      rollerName: token.instanceName ?? 'Bestie',
    });
  };

  // Klik na schopnost → roll (parita se starým Matrixem). Hodnota schopnosti
  // = modifikátor, 4dF (Matrix). Stejný flow jako iniciativa.
  const handleAbilityRoll = (ability: {
    label: string;
    value: string;
  }): void => {
    performSheetRoll({
      label: ability.label,
      modifier: parseInt(ability.value, 10) || 0,
      kind: 'fate',
      rollerName: token.instanceName ?? 'Bestie',
    });
  };

  return (
    <div className={styles.bestieWrap}>
      <BestieStatblock
        token={token}
        worldId={worldId}
        systemId={systemId}
        canEdit={canEdit}
        stats={stats}
        onStatsChange={setStats}
        disabled={update.isPending}
        onRollAbility={handleAbilityRoll}
      />

      {canEdit && (
        <div className={styles.bestieActions}>
          <button
            type="button"
            className={styles.bestieRollBtn}
            onClick={handleInitiativeRoll}
            disabled={update.isPending}
            title="Hodit iniciativu (4dF + base)"
          >
            ⚡ + Iniciativa
          </button>
          <button
            type="button"
            className={styles.bestieSaveBtn}
            onClick={handleSave}
            disabled={update.isPending}
          >
            {update.isPending ? 'Ukládám…' : '💾 Uložit statblok'}
          </button>
        </div>
      )}
    </div>
  );
}
