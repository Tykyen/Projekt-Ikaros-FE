/**
 * 10.2d-prep-B — Clone bestie modal.
 */
import { useState } from 'react';
import { Modal, Button } from '@/shared/ui';
import { useBestieMutations } from '../hooks/useBestieMutations';
import type { Bestie } from '../types';
import styles from './BestieEditorModal.module.css';

interface Props {
  source: Bestie;
  worldId: string;
  systemId: string;
  onClose: () => void;
  onCloned: (bestie: Bestie) => void;
}

export function CloneBestieModal({
  source,
  worldId,
  systemId,
  onClose,
  onCloned,
}: Props): React.ReactElement {
  const { clone } = useBestieMutations(worldId, systemId);
  const [scope, setScope] = useState<'user' | 'world'>('user');
  const [newName, setNewName] = useState(`${source.name} (kopie)`);
  const [error, setError] = useState<string | null>(null);

  const handleClone = (): void => {
    setError(null);
    clone.mutate(
      {
        id: source.id,
        payload: {
          scope,
          worldId: scope === 'world' ? worldId : undefined,
          newName: newName.trim() || undefined,
        },
      },
      {
        onSuccess: (b) => onCloned(b),
        onError: (e) =>
          setError(e instanceof Error ? e.message : 'Klonování selhalo'),
      },
    );
  };

  const footer = (
    <div className={styles.footer}>
      <Button variant="ghost" onClick={onClose} disabled={clone.isPending}>
        Zrušit
      </Button>
      <Button
        variant="primary"
        onClick={handleClone}
        disabled={clone.isPending}
        loading={clone.isPending}
      >
        Klonovat
      </Button>
    </div>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={`Klonovat: ${source.name}`}
      size="sm"
      footer={footer}
    >
      <div className={styles.body}>
        <div className={styles.row}>
          <label className={styles.label}>
            Kam zkopírovat
            <select
              className={styles.input}
              value={scope}
              onChange={(e) => setScope(e.target.value as 'user' | 'world')}
            >
              <option value="user">Můj bestiář</option>
              <option value="world">Bestiář tohoto světa</option>
            </select>
          </label>
        </div>
        <div className={styles.row}>
          <label className={styles.label}>
            Nové jméno
            <input
              type="text"
              className={styles.input}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={100}
            />
          </label>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
