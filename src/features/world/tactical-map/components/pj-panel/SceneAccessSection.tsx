/**
 * 10.2o — sekce „Přístup hráčů" pro nastavení scény (EditSceneModal).
 *
 * Obaluje `AccessBoard` pro **jednu** scénu: drží živou scénu (z `useActiveScenes`,
 * aby se po toggle/assign promítl nový stav), členy světa a member-operace
 * (assign/unassign). Toggly skrytí/zámku řeší `AccessBoard` sám (okamžitě).
 *
 * Pozn.: na rozdíl od zbytku modalu (save tlačítkem) jsou změny zde **okamžité**.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useActiveScenes,
  activeScenesQueryKey,
} from '../../hooks/useActiveScenes';
import { mapSceneQueryKey } from '../../hooks/useMapScene';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { postWorldOperation } from '../../api/worldOpsApi';
import { AccessBoard } from './AccessBoard';
import type { WorldOperation } from '../../types';

interface Props {
  worldId: string;
  sceneId: string;
}

export function SceneAccessSection({
  worldId,
  sceneId,
}: Props): React.ReactElement {
  const queryClient = useQueryClient();
  const { scenes } = useActiveScenes(worldId, true);
  const membersQuery = useWorldMembers(worldId);
  const scene = scenes.find((s) => s.id === sceneId) ?? null;

  const mutation = useMutation({
    mutationFn: (op: WorldOperation) => postWorldOperation(worldId, op),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['worlds', worldId, 'members'],
      });
      void queryClient.invalidateQueries({
        queryKey: mapSceneQueryKey(worldId),
      });
      void queryClient.invalidateQueries({
        queryKey: activeScenesQueryKey(worldId),
      });
    },
  });

  const handleAssign = (userId: string, targetSceneId: string): void => {
    mutation.mutate({
      type: 'member.assignToScene',
      userId,
      sceneId: targetSceneId,
    });
  };
  const handleUnassign = (userId: string): void => {
    mutation.mutate({ type: 'member.unassign', userId });
  };

  if (!scene) {
    return (
      <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>
        Scéna musí být aktivní, aby šel nastavit přístup hráčů.
      </p>
    );
  }

  return (
    <AccessBoard
      worldId={worldId}
      members={membersQuery.data ?? []}
      activeScenes={[scene]}
      onAssign={handleAssign}
      onUnassign={handleUnassign}
    />
  );
}
