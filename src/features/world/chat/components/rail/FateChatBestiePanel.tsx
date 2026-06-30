/**
 * FATE (fae + fate) bestie panel v chat railu — katalog (read-only) i instance
 * v souboji (editovatelná přes `onPatch`). UI = sdílené `FateCombatBody`
 * (Karty osudu), view-model přes sdílený `fateBestieView` → 1:1 s mapou.
 *
 * Self-contained (module CSS s vlastními --fate-* tokeny) → bez DiarySkinScope.
 */
import { useState } from 'react';
import { FateCombatBody } from '@/features/world/tactical-map/components/token-panel/system-panels/fate/FateCombatBody';
import {
  fateBestieView,
  fateStressTogglePatch,
  fateFatePointsPatch,
} from '@/features/world/tactical-map/components/token-panel/system-panels/fate/fateBestieView';
import { useChatDiaryRoll } from './useChatDiaryRoll';

interface Props {
  worldId: string;
  channelId: string | null;
  systemId: string;
  rollerName: string;
  avatarUrl?: string;
  systemStats: Record<string, unknown>;
  canEdit: boolean;
  /** Instance v boji → persist patch do combatantu. Katalog → bez (read-only). */
  onPatch?: (patch: { systemStats: Record<string, unknown> }) => void;
}

export function FateChatBestiePanel({
  worldId,
  channelId,
  systemId,
  rollerName,
  avatarUrl,
  systemStats,
  canEdit,
  onPatch,
}: Props): React.ReactElement {
  const variant: 'fae' | 'core' = systemId === 'fae' ? 'fae' : 'core';
  const [stats, setStats] = useState<Record<string, unknown>>(() => ({ ...systemStats }));

  const makeOnRoll = useChatDiaryRoll(worldId, channelId);
  const onRoll = makeOnRoll({ kind: 'bestie', rollerName, avatarUrl });

  const editable = canEdit && !!onPatch;
  const mutate = (patch: Record<string, unknown>): void => {
    if (!editable) return;
    setStats((prev) => {
      const next = { ...prev, ...patch };
      onPatch?.({ systemStats: next });
      return next;
    });
  };

  const view = fateBestieView(stats, variant);

  return (
    <FateCombatBody
      variant={variant}
      canEdit={editable}
      fatePoints={view.fatePoints}
      refresh={view.refresh}
      onFatePoints={(d) => mutate(fateFatePointsPatch(stats, d))}
      boxes={view.boxes}
      onToggleBox={(i) => mutate(fateStressTogglePatch(stats, i))}
      consequences={view.consequences}
      onCons={(key, text) => mutate({ [`cons_${key}`]: text })}
      abilities={view.abilities}
      onRoll={(label, bonus) => onRoll({ label, modifier: bonus, kind: 'fate' })}
      onInitiative={() => onRoll({ label: 'Iniciativa', modifier: 0, kind: 'fate' })}
      aspects={view.aspects}
      stunts={view.stunts}
    />
  );
}
