/**
 * 16.2b Fáze 2 — editace drd16 bestie TOKENU na mapě (per instance).
 *
 * „Každé číslo i jednotlivé pole upravitelné na mapě" — reuse bestiářového
 * editoru `Drd16BestieForm` (všechna pole) bound na `token.systemStats` +
 * jméno (instanceName) + popis (notes). Save patchne TENTO token (nezávislá
 * instance, neovlivní katalog ani jiné bestie). Staty sanitizované na
 * `drd16:token` schéma (BE validateForPatch je STRICT).
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Modal, Button } from '@/shared/ui';
import { Drd16BestieForm } from '@/features/world/bestiar/components/Drd16BestieForm';
import { systemEntitySchemaRegistry } from '../../../schemas/registry';
import { drd16BestieSchema } from '../../../schemas/drd16/bestie';
import { useTokenUpdate } from '../../../hooks/useTokenUpdate';
import type { MapToken } from '../../../types';
import styles from './Drd16BestieTokenEditModal.module.css';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  onClose: () => void;
}

export function Drd16BestieTokenEditModal({
  token,
  sceneId,
  worldId,
  onClose,
}: Props): React.ReactElement {
  const update = useTokenUpdate(sceneId, worldId);
  const [name, setName] = useState<string>(token.instanceName ?? '');
  const [systemStats, setSystemStats] = useState<Record<string, unknown>>({
    ...(token.systemStats ?? {}),
  });
  const [notes, setNotes] = useState<string>(token.notes ?? '');

  const save = (): void => {
    // Sanitizace na klíče `drd16:token` schématu — BE validateForPatch je STRICT.
    const tokenSchema = systemEntitySchemaRegistry.get('drd16', 'token');
    const known = new Set(
      tokenSchema?.sections.flatMap((s) => s.fields.map((f) => f.key)) ?? [],
    );
    const cleanStats =
      known.size > 0
        ? Object.fromEntries(
            Object.entries(systemStats).filter(([k]) => known.has(k)),
          )
        : systemStats;
    update.mutate(
      {
        tokenId: token.id,
        patch: {
          instanceName: name.trim() || token.instanceName,
          systemStats: cleanStats,
          notes,
        },
      },
      {
        onSuccess: () => onClose(),
        onError: (e) =>
          toast.error(
            `Uložení selhalo: ${e instanceof Error ? e.message : 'chyba'}`,
          ),
      },
    );
  };

  const footer = (
    <div className={styles.footer}>
      <Button variant="ghost" onClick={onClose} disabled={update.isPending}>
        Zrušit
      </Button>
      <Button
        variant="primary"
        onClick={save}
        loading={update.isPending}
        disabled={update.isPending}
      >
        Uložit
      </Button>
    </div>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={`Upravit: ${token.instanceName ?? 'bestie'}`}
      size="lg"
      footer={footer}
    >
      <div className={styles.body}>
        <label className={styles.field}>
          <span className={styles.label}>Jméno</span>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </label>

        <Drd16BestieForm
          schema={drd16BestieSchema}
          value={systemStats}
          onChange={setSystemStats}
          disabled={update.isPending}
        />

        <label className={styles.field}>
          <span className={styles.label}>Popis</span>
          <textarea
            className={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={2000}
          />
        </label>
      </div>
    </Modal>
  );
}
