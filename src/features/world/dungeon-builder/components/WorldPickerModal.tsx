/**
 * 21.3c — výběr cílového světa pro kopii podzemí. Nabízí jen světy, kde
 * uživatel smí tvořit (PJ+ vždy; jinak Hrac+ s Podporovatelem — BE stejně
 * vynucuje, tohle je UX filtr).
 */
import { useMemo, useState } from 'react';
import { Button, Modal, Spinner } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import styles from './WorldPickerModal.module.css';

export interface WorldPickerModalProps {
  open: boolean;
  title: string;
  confirmLabel: string;
  /** Efektivní Podporovatel (odemyká i ne-PJ světy s rolí Hrac+). */
  supporter: boolean;
  /** Vyloučit svět (např. aktuální — kopie „sem" má vlastní tlačítko). */
  excludeWorldId?: string | null;
  isPending?: boolean;
  onConfirm: (worldId: string) => void;
  onClose: () => void;
}

export function WorldPickerModal({
  open,
  title,
  confirmLabel,
  supporter,
  excludeWorldId,
  isPending,
  onConfirm,
  onClose,
}: WorldPickerModalProps): React.ReactElement {
  const { data: myWorlds, isLoading } = useMyWorlds();
  const [selected, setSelected] = useState<string | null>(null);

  const eligible = useMemo(
    () =>
      (myWorlds ?? []).filter((entry) => {
        if (entry.world.id === excludeWorldId) return false;
        const role = entry.membership.role;
        return role >= WorldRole.PJ || (supporter && role >= WorldRole.Hrac);
      }),
    [myWorlds, excludeWorldId, supporter],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button
            type="button"
            disabled={!selected}
            loading={isPending}
            onClick={() => selected && onConfirm(selected)}
          >
            {confirmLabel}
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
          Žádný svět, kde bys mohl stavět. Kopírovat jde do světů, kde jsi PJ,
          nebo (jako Podporovatel) kde hraješ.
        </p>
      ) : (
        <ul className={styles.list}>
          {eligible.map((entry) => (
            <li key={entry.world.id}>
              <label className={styles.option}>
                <input
                  type="radio"
                  name="dungeon-target-world"
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
