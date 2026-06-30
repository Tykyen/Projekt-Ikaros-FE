/**
 * Shadowrun 6e bestie panel v chat railu — katalog (read-only) i instance
 * v souboji (editovatelná přes `onPatch`). UI = sdílené `ShadowrunBestieBody`,
 * view-model přes sdílený `shadowrunBestieView` → 1:1 s taktickou mapou (týž
 * plný panel, jen užší rail — skill `system` fáze 5).
 *
 * Self-contained (module CSS s vlastními --srb-* tokeny) → bez DiarySkinScope.
 */
import { useState } from 'react';
import { ShadowrunBestieBody } from '@/features/world/tactical-map/components/token-panel/system-panels/shadowrun/ShadowrunBestieBody';
import {
  shadowrunBestieView,
  shadowrunPhysTogglePatch,
  shadowrunStunTogglePatch,
} from '@/features/world/tactical-map/components/token-panel/system-panels/shadowrun/shadowrunBestieView';
import { useChatDiaryRoll } from './useChatDiaryRoll';

interface Props {
  worldId: string;
  channelId: string | null;
  rollerName: string;
  avatarUrl?: string;
  systemStats: Record<string, unknown>;
  notes?: string;
  canEdit: boolean;
  /** Instance v boji → persist patch do combatantu. Katalog → bez (read-only). */
  onPatch?: (patch: { systemStats: Record<string, unknown> }) => void;
}

export function ShadowrunChatBestiePanel({
  worldId,
  channelId,
  rollerName,
  avatarUrl,
  systemStats,
  notes,
  canEdit,
  onPatch,
}: Props): React.ReactElement {
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

  const view = shadowrunBestieView(stats);

  return (
    <ShadowrunBestieBody
      view={view}
      name={rollerName}
      canEdit={editable}
      notes={notes}
      onRoll={(label, pool) => onRoll({ label, kind: 'pool-d6', pool })}
      onInit={() => onRoll({ label: 'Iniciativa', modifier: view.initBase, kind: 'd6' })}
      onTogglePhys={(i) => mutate(shadowrunPhysTogglePatch(stats, i))}
      onToggleStun={(i) => mutate(shadowrunStunTogglePatch(stats, i))}
    />
  );
}

export default ShadowrunChatBestiePanel;
