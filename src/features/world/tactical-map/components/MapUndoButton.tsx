/**
 * D-DROBNE-UNDO — „Zpět" tlačítko PJ toolbaru mapy.
 *
 * Volá `POST /maps/:id/operations/undo` — BE vezme poslední PJ-ovu operaci
 * s uloženou inverse a aplikuje ji standardní ops pipeline (nový záznam +
 * WS `map:operation` broadcast → scéna se dorovná patcherem jako u běžné
 * op). Invalidace queries je belt-and-suspenders refetch (vzor
 * `deactivateMutation` v MapPjPanel) — undo může vrátit i
 * scene.activate/deactivate, což mění list aktivních scén.
 *
 * Viditelnost řídí parent (`TacticalMapView`): jen PJ / PomocnyPJ (`isPJ`),
 * stejný gating jako ostatní PJ nástroje. Klávesová zkratka záměrně není
 * (konzervativní MVP — žádný globální keydown handler na mapě navíc).
 *
 * `NOTHING_TO_UNDO` (404) = prázdný undo stack → nenápadný info toast.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { parseApiError, parseApiErrorCode } from '@/shared/api';
import { postMapUndo } from '../api/mapApi';
import { mapSceneQueryKey } from '../hooks/useMapScene';
import { activeScenesQueryKey } from '../hooks/useActiveScenes';
import styles from './MapUndoButton.module.css';

interface Props {
  sceneId: string;
  worldId: string;
}

export function MapUndoButton({
  sceneId,
  worldId,
}: Props): React.ReactElement {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => postMapUndo(sceneId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mapSceneQueryKey(worldId),
      });
      void queryClient.invalidateQueries({
        queryKey: activeScenesQueryKey(worldId),
      });
    },
    onError: (err) => {
      if (parseApiErrorCode(err) === 'NOTHING_TO_UNDO') {
        toast.info('Není co vrátit');
        return;
      }
      toast.error(`Vrácení akce selhalo: ${parseApiError(err)}`);
    },
  });

  return (
    <button
      type="button"
      className={styles.undo}
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      aria-label="Vrátit poslední akci"
      title="Vrátit poslední akci — undo tvé poslední operace na scéně"
    >
      <Undo2 size={14} aria-hidden="true" />
      Zpět
    </button>
  );
}
