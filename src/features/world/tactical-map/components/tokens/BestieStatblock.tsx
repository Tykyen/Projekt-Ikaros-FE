/**
 * 10.2c-edit-9c — bestie token view (statblok + bestie.notes pro PJ).
 *
 * Bestie nemá deník (project memory [[project-npc-vs-bestie]] — bestie =
 * `Bestie` snapshot, jen statblok). Modal proto nemá tabs; vykreslí:
 *   - **PJ** — `EntitySchemaForm` (editovatelné HP/zranění/zbroj/…) + read-only
 *     `bestie.notes` field pod (statblok-level poznámky šablony, PJ-private)
 *   - **Hráč** — `EntityStatbar` read-only; bestie.notes skryté
 *
 * Bestie snapshot lookup: `bestiarQueryKey(worldId, systemId)` v query
 * cache (BestiarPalette ji už loadla). Pokud cache miss, notes se prostě
 * nezobrazí (nice-to-have, statblok ze `token.systemStats` funguje vždy).
 *
 * Plán: docs/arch/phase-10/plan-10.2c-edit-9bc.md §3.3.
 */
import { useQueryClient } from '@tanstack/react-query';
import {
  bestiarQueryKey,
} from '@/features/world/bestiar/hooks/useBestiar';
import type { BestiarResponse } from '@/features/world/bestiar/types';
import { EntitySchemaForm } from '../schema-form/EntitySchemaForm';
import { EntityStatbar } from '../schema-form/EntityStatbar';
import { systemEntitySchemaRegistry } from '../../schemas/registry';
import type { MapToken } from '../../types';
import styles from './BestieStatblock.module.css';

interface Props {
  token: MapToken;
  worldId: string;
  systemId: string;
  /** PJ may edit + see notes. Hráč read-only + bez notes. */
  canEdit: boolean;
  /** Stats jsou kontrolované rodičem (TokenStatbarModal) přes useState. */
  stats: Record<string, unknown>;
  onStatsChange: (next: Record<string, unknown>) => void;
  disabled: boolean;
  /**
   * Klik na schopnost → roll (parita se starým Matrixem). Když undefined,
   * schopnosti zůstanou read-only.
   */
  onRollAbility?: (ability: { label: string; value: string }) => void;
}

export function BestieStatblock({
  token,
  worldId,
  systemId,
  canEdit,
  stats,
  onStatsChange,
  disabled,
  onRollAbility,
}: Props): React.ReactElement {
  const qc = useQueryClient();
  const cached = qc.getQueryData<BestiarResponse>(
    bestiarQueryKey(worldId, systemId),
  );
  const bestieId = token.templateId;
  const bestie = bestieId
    ? [
        ...(cached?.user ?? []),
        ...(cached?.world ?? []),
        ...(cached?.system ?? []),
      ].find((b) => b.id === bestieId)
    : null;
  const notes = canEdit ? bestie?.notes : undefined;
  // Token schema (matrix:token) nemá abilities sekci → schopnosti dotáhneme
  // ze snapshotu bestie (cache přes templateId). Read-only, viditelné všem.
  const abilities = bestie?.abilities ?? [];

  const schema = systemEntitySchemaRegistry.get(systemId, 'token');

  if (!schema) {
    return (
      <p className={styles.empty}>
        Schema pro {systemId}:token chybí — statblok nelze zobrazit.
      </p>
    );
  }

  return (
    <div className={styles.bestieView}>
      {canEdit ? (
        <EntitySchemaForm
          schema={schema}
          value={stats}
          onChange={onStatsChange}
          disabled={disabled}
        />
      ) : (
        <EntityStatbar schema={schema} value={stats} />
      )}

      {abilities.length > 0 && (
        <section className={styles.abilitiesSection}>
          <h4 className={styles.abilitiesHeading}>Schopnosti</h4>
          <ul className={styles.abilitiesList}>
            {abilities.map((a, i) => {
              const inner = (
                <>
                  <span className={styles.abilityLabel}>{a.label}</span>
                  {a.value && (
                    <span className={styles.abilityValue}>{a.value}</span>
                  )}
                </>
              );
              return (
                <li key={`${a.label}-${i}`} className={styles.abilityItem}>
                  {onRollAbility ? (
                    <button
                      type="button"
                      className={styles.abilityRollBtn}
                      onClick={() => onRollAbility(a)}
                      disabled={disabled}
                      title={`Hodit: ${a.label} (4dF + ${a.value || 0})`}
                    >
                      {inner}
                    </button>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {notes && notes.trim() && (
        <section className={styles.notesSection}>
          <h4 className={styles.notesHeading}>📝 Poznámky k šabloně</h4>
          <p className={styles.notesBody}>{notes}</p>
          <p className={styles.notesHint}>
            (Statblok šablony, jen pro PJ. Edit v sekci Bestiář.)
          </p>
        </section>
      )}
    </div>
  );
}
