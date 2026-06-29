/**
 * 10.2c-edit-9c (rozšíření) — bestie token view jako **nezávislá instance**.
 *
 * Původní 9bc design držel statblok read-only a schopnosti/poznámky četl
 * živě z katalogu Bestie přes `templateId` → dvě instance téže bestie sdílely
 * data (vypadalo jako „propisování"). Tady je obracíme na per-instance:
 *   - **staty** (HP/MAX/zranění/…) — `EntitySchemaForm` z `token.systemStats`
 *   - **schopnosti** — editor (název+hodnota, roll, smazat, přidat) z
 *     `token.abilities` snapshotu, NE z katalogu
 *   - **poznámky instance** — textarea (PJ), `token.notes`
 *   - **poznámky k šabloně** — read-only z katalogu `bestie.notes` (PJ),
 *     společný lore vedle instančních poznámek
 *
 * Hráč (canEdit=false): read-only `EntityStatbar` + roll chipy schopností,
 * bez poznámek.
 *
 * Spec: plan-10.2c-edit-9bc.md §3.3 (out-of-scope bod 7 vědomě zrušen —
 * instance je nezávislá na šabloně).
 */
import { useQueryClient } from '@tanstack/react-query';
import { bestiarQueryKey } from '@/features/world/bestiar/hooks/useBestiar';
import type { BestiarResponse } from '@/features/world/bestiar/types';
import { EntitySchemaForm } from '../schema-form/EntitySchemaForm';
import { EntityStatbar } from '../schema-form/EntityStatbar';
import { systemEntitySchemaRegistry } from '../../schemas/registry';
import type { MapToken } from '../../types';
import styles from './BestieStatblock.module.css';

/** Schopnost v UI tvaru (label/value) — paritní s bestie schématem + rollem. */
export interface AbilityDraft {
  label: string;
  value: string;
}

interface Props {
  token: MapToken;
  worldId: string;
  systemId: string;
  /** PJ může editovat staty/schopnosti/poznámky; hráč read-only bez poznámek. */
  canEdit: boolean;
  /** Staty (kontrolované rodičem). */
  stats: Record<string, unknown>;
  onStatsChange: (next: Record<string, unknown>) => void;
  /** Schopnosti instance (kontrolované rodičem). */
  abilities: AbilityDraft[];
  onAbilitiesChange: (next: AbilityDraft[]) => void;
  /** Poznámky instance (kontrolované rodičem). */
  notes: string;
  onNotesChange: (next: string) => void;
  disabled: boolean;
  /** Klik na schopnost → roll. Bez něj jen read-only. */
  onRollAbility?: (ability: AbilityDraft) => void;
}

export function BestieStatblock({
  token,
  worldId,
  systemId,
  canEdit,
  stats,
  onStatsChange,
  abilities,
  onAbilitiesChange,
  notes,
  onNotesChange,
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
  // Šablonové poznámky — read-only společný lore, jen PJ.
  const templateNotes = canEdit ? bestie?.notes : undefined;

  const schema = systemEntitySchemaRegistry.get(systemId, 'token');

  if (!schema) {
    return (
      <p className={styles.empty}>
        Schema pro {systemId}:token chybí — statblok nelze zobrazit.
      </p>
    );
  }

  const updateAbility = (i: number, patch: Partial<AbilityDraft>): void => {
    onAbilitiesChange(
      abilities.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    );
  };
  const removeAbility = (i: number): void => {
    onAbilitiesChange(abilities.filter((_, idx) => idx !== i));
  };
  const addAbility = (): void => {
    onAbilitiesChange([...abilities, { label: '', value: '' }]);
  };

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

      <section className={styles.abilitiesSection}>
        <h4 className={styles.abilitiesHeading}>Schopnosti</h4>

        {canEdit ? (
          <>
            {abilities.length === 0 && (
              <p className={styles.emptyAbilities}>
                Zatím žádné schopnosti.
              </p>
            )}
            <ul className={styles.abilitiesList}>
              {abilities.map((a, i) => (
                <li key={i} className={styles.abilityEditRow}>
                  <input
                    type="text"
                    className={styles.abilityInput}
                    value={a.label}
                    placeholder="Název"
                    onChange={(e) => updateAbility(i, { label: e.target.value })}
                    disabled={disabled}
                    aria-label="Název schopnosti"
                  />
                  <input
                    type="text"
                    className={styles.abilityValueInput}
                    value={a.value}
                    placeholder="Hodnota"
                    onChange={(e) => updateAbility(i, { value: e.target.value })}
                    disabled={disabled}
                    aria-label="Hodnota schopnosti"
                  />
                  {onRollAbility && (
                    <button
                      type="button"
                      className={styles.abilityIconBtn}
                      onClick={() => onRollAbility(a)}
                      disabled={disabled || !(a.label ?? '').trim()}
                      title={`Hodit: ${a.label || '?'} (4dF + ${a.value || 0})`}
                    >
                      🎲
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles.abilityIconBtn} ${styles.abilityRemoveBtn}`}
                    onClick={() => removeAbility(i)}
                    disabled={disabled}
                    title="Smazat schopnost"
                    aria-label="Smazat schopnost"
                  >
                    🗑
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={styles.addAbilityBtn}
              onClick={addAbility}
              disabled={disabled}
            >
              + Přidat schopnost
            </button>
          </>
        ) : (
          abilities.length > 0 && (
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
                  <li key={i} className={styles.abilityItem}>
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
          )
        )}
      </section>

      {canEdit && (
        <section className={styles.notesSection}>
          <h4 className={styles.notesHeading}>📝 Poznámky (tato instance)</h4>
          <textarea
            className={styles.notesTextarea}
            value={notes}
            placeholder="Poznámky jen k tomuhle tokenu (např. zraněný, naštvaný…)"
            onChange={(e) => onNotesChange(e.target.value)}
            disabled={disabled}
            rows={3}
            aria-label="Poznámky instance"
          />
        </section>
      )}

      {templateNotes && templateNotes.trim() && (
        <section className={styles.notesSection}>
          <h4 className={styles.notesHeading}>📜 Poznámky k šabloně</h4>
          <p className={styles.notesBody}>{templateNotes}</p>
          <p className={styles.notesHint}>
            (Statblok šablony, jen pro PJ. Edit v sekci Bestiář.)
          </p>
        </section>
      )}
    </div>
  );
}
