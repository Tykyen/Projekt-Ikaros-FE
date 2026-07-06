/**
 * FATE bestie panel (taktická mapa / chat rail-instance přes TokenSystemSheet).
 *
 * Data z `token.systemStats` (snapshot z katalogu při spawnu, fae/fate:token
 * schema = superset profilu). UI = sdílené `FateCombatBody` (Karty osudu),
 * view-model přes sdílený `fateBestieView` (0 drift s chat panelem). Autosave
 * celého `systemStats` (BE token.update REPLACE + validateForPatch strict).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { parseApiError } from '@/shared/api/client';
import { useTokenUpdate } from '../../../hooks/useTokenUpdate';
import { performSheetRoll } from '../../../utils/rollFromSheet';
import type { MapToken } from '../../../types';
import type { MapRollRequest } from '../../../hooks/useMapDiceRoll';
import { FateCombatBody } from './fate/FateCombatBody';
import {
  fateBestieView,
  fateStressTogglePatch,
  fateFatePointsPatch,
} from './fate/fateBestieView';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  systemId: string;
  canEdit: boolean;
  onMapRoll?: (req: MapRollRequest) => void;
}

const SAVE_DEBOUNCE_MS = 500;

export function FateBestiePanel({
  token,
  sceneId,
  worldId,
  systemId,
  canEdit,
  onMapRoll,
}: Props): React.ReactElement {
  const variant: 'fae' | 'core' = systemId === 'fae' ? 'fae' : 'core';
  const update = useTokenUpdate(sceneId, worldId);

  const [stats, setStats] = useState<Record<string, unknown>>(() => ({
    ...(token.systemStats ?? {}),
  }));

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const mutate = useCallback(
    (patch: Record<string, unknown>) => {
      if (!canEdit) return;
      setStats((prev) => {
        const next = { ...prev, ...patch };
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          update.mutate(
            { tokenId: token.id, patch: { systemStats: next } },
            {
              onError: (e) =>
                toast.error(`Uložení selhalo: ${parseApiError(e)}`),
            },
          );
        }, SAVE_DEBOUNCE_MS);
        return next;
      });
    },
    [canEdit, token.id, update],
  );

  const view = fateBestieView(stats, variant);

  const rollerName = token.instanceName ?? 'Bestie';
  const doRoll = (label: string, bonus: number): void => {
    const res = performSheetRoll({ label, modifier: bonus, kind: 'fate', rollerName });
    if (!res) return;
    onMapRoll?.({ category: 'skill', dicePayload: res.dicePayload, tokenId: token.id, rollerKind: 'bestie', rollerName });
  };
  const doInitiative = (): void => {
    const res = performSheetRoll({ label: 'Iniciativa', modifier: 0, kind: 'fate', rollerName });
    if (!res) return;
    onMapRoll?.({ category: 'initiative', dicePayload: res.dicePayload, tokenId: token.id, rollerKind: 'bestie', rollerName });
    update.mutate({ tokenId: token.id, patch: { initiative: res.total }, skipInvalidate: true });
  };

  return (
    <FateCombatBody
      variant={variant}
      canEdit={canEdit}
      fatePoints={view.fatePoints}
      refresh={view.refresh}
      onFatePoints={(d) => mutate(fateFatePointsPatch(stats, d))}
      boxes={view.boxes}
      onToggleBox={(i) => mutate(fateStressTogglePatch(stats, i))}
      consequences={view.consequences}
      onCons={(key, text) => mutate({ [`cons_${key}`]: text })}
      abilities={view.abilities}
      onRoll={doRoll}
      onInitiative={doInitiative}
      aspects={view.aspects}
      stunts={view.stunts}
    />
  );
}

export default FateBestiePanel;
