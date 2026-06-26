/**
 * 16.2b-chat — editace Matrix bestie INSTANCE v rosteru konverzace (per combatant).
 *
 * Reuse stávajícího editoru `BestieStatblock` (canEdit) — staty (generic
 * `EntitySchemaForm` z `matrix:token` schématu) + schopnosti + poznámky — uvnitř
 * modalu, + pole Jméno. Save patchne combatanta přes `onSave` (rodič =
 * `useCombatantMutation`). Staty sanitizované na klíče `matrix:token` schématu
 * (BE strict). Žádný 🎲 v editoru (onRollAbility vynechán → čistý edit).
 */
import { useState } from 'react';
import { Modal, Button } from '@/shared/ui';
import {
  BestieStatblock,
  type AbilityDraft,
} from '@/features/world/tactical-map/components/tokens/BestieStatblock';
import { systemEntitySchemaRegistry } from '@/features/world/tactical-map/schemas/registry';
import type { MapToken } from '@/features/world/tactical-map/types';
import styles from '@/features/world/tactical-map/components/token-panel/system-panels/Drd16BestieTokenEditModal.module.css';

/** Patch nad Matrix bestie instancí (combatant). `type` — přiřaditelný k
 *  `Record<string, unknown>` (CombatantOp patch). */
export type MatrixChatBestiePatch = {
  systemStats?: Record<string, unknown>;
  abilities?: { name: string; description: string }[];
  notes?: string;
  name?: string;
  /** Výsledek hodu iniciativy → řazení souboj lišty. */
  initiative?: number;
};

interface Props {
  worldId: string;
  systemId: string;
  name: string;
  systemStats: Record<string, unknown>;
  abilities: { name: string; description: string }[];
  notes: string;
  onSave: (patch: MatrixChatBestiePatch) => void;
  onClose: () => void;
}

export function MatrixChatBestieEditModal({
  worldId,
  systemId,
  name,
  systemStats,
  abilities,
  notes,
  onSave,
  onClose,
}: Props): React.ReactElement {
  const [nm, setNm] = useState<string>(name);
  const [stats, setStats] = useState<Record<string, unknown>>({
    ...systemStats,
  });
  const [abil, setAbil] = useState<AbilityDraft[]>(
    abilities.map((a) => ({ label: a.name, value: a.description })),
  );
  const [nt, setNt] = useState<string>(notes);

  // BestieStatblock čte z `token` jen `templateId` (katalogový lore) — bez něj
  // se lore sekce neukáže, což v chat editu nevadí.
  const token = { templateId: undefined } as unknown as MapToken;

  const save = (): void => {
    // Sanitizace na klíče `matrix:token` schématu (BE validateForPatch je STRICT).
    const schema = systemEntitySchemaRegistry.get(systemId, 'token');
    const known = new Set(
      schema?.sections.flatMap((s) => s.fields.map((f) => f.key)) ?? [],
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
      abilities: abil
        .filter((a) => a.label.trim())
        .map((a) => ({ name: a.label.trim(), description: a.value })),
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

        <BestieStatblock
          token={token}
          worldId={worldId}
          systemId={systemId}
          canEdit
          stats={stats}
          onStatsChange={setStats}
          abilities={abil}
          onAbilitiesChange={setAbil}
          notes={nt}
          onNotesChange={setNt}
          disabled={false}
        />
      </div>
    </Modal>
  );
}

export default MatrixChatBestieEditModal;
