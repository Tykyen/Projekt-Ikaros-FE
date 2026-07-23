import { vypravecEmit } from '@/shared/vypravec/engine/events';
/**
 * 22.5 — výběr cílového světa pro naklonování scény z katalogu. Nabízí jen
 * světy, kde je uživatel PJ+ (BE `POST /maps` vyžaduje `assertCanManage` = PJ;
 * nabídnout PomocnyPJ by skončilo 403). Po klonu toast s odkazem na taktickou mapu.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, Modal, Spinner } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { api, parseApiError, parseApiErrorCode } from '@/shared/api/client';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import styles from './CloneToWorldModal.module.css';

interface Props {
  templateId: string;
  sceneName: string;
  onClose: () => void;
}

export function CloneToWorldModal({
  templateId,
  sceneName,
  onClose,
}: Props): React.ReactElement {
  const { data: myWorlds, isLoading } = useMyWorlds();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const eligible = useMemo(
    () =>
      (myWorlds ?? []).filter(
        (entry) => entry.membership.role >= WorldRole.PJ,
      ),
    [myWorlds],
  );

  const clone = useMutation({
    mutationFn: async (worldId: string) => {
      const scene = await api.post<{ id: string }>('/maps', {
        worldId,
        templateId,
        name: sceneName,
      });
      vypravecEmit('scene.created', { worldId }); // Vypravěč (tm-vycvik)
      return scene;
    },
    onSuccess: (_scene, worldId) => {
      const entry = eligible.find((e) => e.world.id === worldId);
      const slug = entry?.world.slug;
      onClose();
      toast.success('Scéna naklonována do světa.', {
        action: slug
          ? {
              label: 'Otevřít mapu',
              onClick: () => navigate(`/svet/${slug}/takticka-mapa`),
            }
          : undefined,
      });
    },
    onError: (e) => {
      // Licence „jen ke čtení" → autor klon nepovolil.
      const code = parseApiErrorCode(e);
      toast.error(
        code === 'TEMPLATE_CLONE_FORBIDDEN'
          ? 'Autor u téhle scény nepovolil kopírování.'
          : parseApiError(e),
      );
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Naklonovat scénu do světa"
      size="sm"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button
            type="button"
            disabled={!selected}
            loading={clone.isPending}
            onClick={() => selected && clone.mutate(selected)}
          >
            Naklonovat
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className={styles.stateWrap}>
          <Spinner />
        </div>
      ) : eligible.length === 0 ? (
        <p className={styles.empty}>
          Žádný svět, kde jsi Pán jeskyně. Scénu lze naklonovat jen do světa,
          který vedeš.
        </p>
      ) : (
        <ul className={styles.list}>
          {eligible.map((entry) => (
            <li key={entry.world.id}>
              <label className={styles.option}>
                <input
                  type="radio"
                  name="scene-target-world"
                  checked={selected === entry.world.id}
                  onChange={() => setSelected(entry.world.id)}
                />
                <span className={styles.worldName}>{entry.world.name}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
