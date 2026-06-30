/**
 * Shadowrun 6e bestie panel (taktická mapa, přes `TokenSystemSheet`).
 *
 * Data z `token.systemStats` (snapshot z bestiáře při spawnu; shadowrun:token
 * schema = superset profilu). UI = sdílené `ShadowrunBestieBody`, view-model
 * přes sdílený `shadowrunBestieView` (0 drift s chat panelem). Autosave celého
 * `systemStats` (BE token.update = REPLACE + strict validace).
 *
 * Klik na atribut/útok/dovednost = SR6 pool hod (`kind:'pool-d6'` → úspěchy
 * 5–6 + glitch). Iniciativa = základ (REA+INT) + 1k6 (součet, `kind:'d6'`).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTokenUpdate } from '../../../hooks/useTokenUpdate';
import { performSheetRoll } from '../../../utils/rollFromSheet';
import type { MapToken } from '../../../types';
import type { MapRollRequest } from '../../../hooks/useMapDiceRoll';
import { ShadowrunBestieBody } from './shadowrun/ShadowrunBestieBody';
import {
  shadowrunBestieView,
  shadowrunPhysTogglePatch,
  shadowrunStunTogglePatch,
} from './shadowrun/shadowrunBestieView';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  canEdit: boolean;
  onMapRoll?: (req: MapRollRequest) => void;
}

const SAVE_DEBOUNCE_MS = 500;

export function ShadowrunBestiePanel({
  token,
  sceneId,
  worldId,
  canEdit,
  onMapRoll,
}: Props): React.ReactElement {
  const update = useTokenUpdate(sceneId, worldId);

  const [stats, setStats] = useState<Record<string, unknown>>(() => ({
    ...(token.systemStats ?? {}),
  }));

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

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
                toast.error(
                  `Uložení selhalo: ${e instanceof Error ? e.message : 'chyba'}`,
                ),
            },
          );
        }, SAVE_DEBOUNCE_MS);
        return next;
      });
    },
    [canEdit, token.id, update],
  );

  const view = shadowrunBestieView(stats);
  const rollerName = token.instanceName ?? 'Bestie';

  const doRoll = (label: string, pool: number): void => {
    const res = performSheetRoll({ label, kind: 'pool-d6', pool });
    if (!res) return;
    onMapRoll?.({
      category: 'skill',
      dicePayload: res.dicePayload,
      tokenId: token.id,
      rollerKind: 'bestie',
      rollerName,
    });
  };

  const doInit = (): void => {
    const res = performSheetRoll({
      label: 'Iniciativa',
      modifier: view.initBase,
      kind: 'd6',
    });
    if (!res) return;
    onMapRoll?.({
      category: 'initiative',
      dicePayload: res.dicePayload,
      tokenId: token.id,
      rollerKind: 'bestie',
      rollerName,
    });
    update.mutate({ tokenId: token.id, patch: { initiative: res.total }, skipInvalidate: true });
  };

  return (
    <ShadowrunBestieBody
      view={view}
      name={rollerName}
      canEdit={canEdit}
      onRoll={doRoll}
      onInit={doInit}
      onTogglePhys={(i) => mutate(shadowrunPhysTogglePatch(stats, i))}
      onToggleStun={(i) => mutate(shadowrunStunTogglePatch(stats, i))}
    />
  );
}

export default ShadowrunBestiePanel;
