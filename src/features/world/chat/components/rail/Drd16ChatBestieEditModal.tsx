/**
 * 16.2b-chat — editace drd16 bestie INSTANCE v rosteru konverzace (per combatant).
 *
 * Analog mapového `Drd16BestieTokenEditModal`, ale cílí na **combatanta**
 * (rodič patchne přes `useCombatantMutation` v `onSave`), ne na mapový token.
 * Reuse bestiářového editoru `Drd16BestieForm` (všechna pole) + mapový modal CSS
 * (parita vzhledu s mapovým edit modalem). Staty sanitizované na klíče
 * `drd16:bestie` schématu (žádné smetí navíc do combatanta).
 */
import { useState } from 'react';
import { Modal, Button } from '@/shared/ui';
import { Drd16BestieForm } from '@/features/world/bestiar/components/Drd16BestieForm';
import { drd16BestieSchema } from '@/features/world/tactical-map/schemas/drd16/bestie';
import styles from '@/features/world/tactical-map/components/token-panel/system-panels/Drd16BestieTokenEditModal.module.css';
import type { Drd16ChatBestiePatch } from './Drd16ChatBestiePanel';

interface Props {
  name: string;
  systemStats: Record<string, unknown>;
  notes: string;
  onSave: (patch: Drd16ChatBestiePatch) => void;
  onClose: () => void;
}

export function Drd16ChatBestieEditModal({
  name,
  systemStats,
  notes,
  onSave,
  onClose,
}: Props): React.ReactElement {
  const [nm, setNm] = useState<string>(name);
  const [stats, setStats] = useState<Record<string, unknown>>({
    ...systemStats,
  });
  const [nt, setNt] = useState<string>(notes);

  const save = (): void => {
    // Sanitizace na klíče `drd16:bestie` schématu (combatant nemá držet smetí).
    const known = new Set(
      drd16BestieSchema.sections.flatMap((s) => s.fields.map((f) => f.key)),
    );
    const cleanStats =
      known.size > 0
        ? Object.fromEntries(
            Object.entries(stats).filter(([k]) => known.has(k)),
          )
        : stats;
    onSave({
      name: nm.trim() || name,
      systemStats: cleanStats,
      notes: nt,
    });
  };

  const footer = (
    <div className={styles.footer}>
      <Button variant="ghost" onClick={onClose}>
        Zrušit
      </Button>
      <Button variant="primary" onClick={save}>
        Uložit
      </Button>
    </div>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={`Upravit: ${name || 'bestie'}`}
      size="lg"
      footer={footer}
    >
      <div className={styles.body}>
        <label className={styles.field}>
          <span className={styles.label}>Jméno</span>
          <input
            className={styles.input}
            value={nm}
            onChange={(e) => setNm(e.target.value)}
            maxLength={100}
          />
        </label>

        <Drd16BestieForm
          schema={drd16BestieSchema}
          value={stats}
          onChange={setStats}
        />

        <label className={styles.field}>
          <span className={styles.label}>Popis</span>
          <textarea
            className={styles.textarea}
            value={nt}
            onChange={(e) => setNt(e.target.value)}
            rows={4}
            maxLength={2000}
          />
        </label>
      </div>
    </Modal>
  );
}

export default Drd16ChatBestieEditModal;
