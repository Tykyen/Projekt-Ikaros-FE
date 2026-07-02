/**
 * 16.2g F2 — editor `SystemEntitySchema` (bestie/token statblok) pro „Vlastní
 * Systém". Inline: sekce → pole; každé pole má typ + `combatBehavior` (aby HP
 * bar / iniciativa na mapě fungovaly). Živý náhled přes `EntityStatbar`.
 */
import { useMemo } from 'react';
import { EntityStatbar } from '@/features/world/tactical-map/components/schema-form/EntityStatbar';
import type {
  SchemaSection,
  SchemaField,
  SchemaFieldType,
  CombatBehavior,
  SystemEntitySchema,
} from '@/features/world/tactical-map/schemas/types';
import s from './EntitySchemaEditor.module.css';

const FIELD_TYPES: { value: SchemaFieldType; label: string }[] = [
  { value: 'number', label: 'Číslo' },
  { value: 'string', label: 'Text' },
  { value: 'enum', label: 'Výběr ze seznamu' },
  { value: 'boolean', label: 'Ano / Ne' },
  { value: 'computed', label: 'Vzorec (dopočet)' },
];

const COMBAT_BEHAVIORS: { value: '' | CombatBehavior; label: string }[] = [
  { value: '', label: '— žádné —' },
  { value: 'damageable', label: 'Životy (ubývají v boji)' },
  { value: 'armor-reducer', label: 'Zbroj (tlumí zranění)' },
  { value: 'initiative', label: 'Iniciativa (řadí boj)' },
  { value: 'movement', label: 'Pohyb (dosah)' },
  { value: 'roll-target', label: 'Cíl hodu' },
  { value: 'static', label: 'Jen zobrazit' },
];

function slugKey(input: string, fallback: string): string {
  const k = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_.]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return k || fallback;
}

interface Props {
  sections: SchemaSection[];
  onChange: (next: SchemaSection[]) => void;
  systemId: string;
  entityType: SystemEntitySchema['entityType'];
}

export function EntitySchemaEditor({
  sections,
  onChange,
  systemId,
  entityType,
}: Props) {
  const previewSchema = useMemo<SystemEntitySchema>(
    () => ({ systemId, entityType, version: 1, sections }),
    [systemId, entityType, sections],
  );
  // Dummy hodnoty pro náhled — default ?? min ?? 0/prázdno.
  const previewValue = useMemo<Record<string, unknown>>(() => {
    const v: Record<string, unknown> = {};
    for (const sec of sections) {
      for (const f of sec.fields) {
        if (f.type === 'number')
          v[f.key] = f.default ?? f.min ?? 0;
        else if (f.type === 'boolean') v[f.key] = f.default ?? false;
        else v[f.key] = f.default ?? '';
      }
    }
    return v;
  }, [sections]);

  const setSection = (i: number, patch: Partial<SchemaSection>) =>
    onChange(sections.map((sec, idx) => (idx === i ? { ...sec, ...patch } : sec)));

  const removeSection = (i: number) =>
    onChange(sections.filter((_, idx) => idx !== i));

  const addSection = () =>
    onChange([
      ...sections,
      { key: `sekce_${sections.length + 1}`, label: 'Nová sekce', fields: [] },
    ]);

  const setField = (si: number, fi: number, patch: Partial<SchemaField>) =>
    setSection(si, {
      fields: sections[si].fields.map((f, idx) =>
        idx === fi ? { ...f, ...patch } : f,
      ),
    });

  const removeField = (si: number, fi: number) =>
    setSection(si, {
      fields: sections[si].fields.filter((_, idx) => idx !== fi),
    });

  const addField = (si: number) =>
    setSection(si, {
      fields: [
        ...sections[si].fields,
        {
          key: `pole_${sections[si].fields.length + 1}`,
          label: 'Nové pole',
          type: 'number',
        },
      ],
    });

  return (
    <div className={s.editor}>
      <div className={s.columns}>
        <div className={s.sectionsCol}>
          {sections.map((sec, si) => (
            <div key={si} className={s.sectionCard}>
              <div className={s.sectionHead}>
                <input
                  className={s.sectionLabel}
                  value={sec.label}
                  placeholder="Název sekce"
                  onChange={(e) =>
                    setSection(si, {
                      label: e.target.value,
                      key: slugKey(e.target.value, sec.key),
                    })
                  }
                />
                <button
                  type="button"
                  className={s.iconBtn}
                  onClick={() => removeSection(si)}
                  title="Smazat sekci"
                >
                  🗑
                </button>
              </div>

              {sec.fields.map((f, fi) => (
                <div key={fi} className={s.fieldRow}>
                  <div className={s.fieldGrid}>
                    <label className={s.fieldCell}>
                      <span className={s.cellLabel}>Název</span>
                      <input
                        className={s.input}
                        value={f.label}
                        onChange={(e) =>
                          setField(si, fi, {
                            label: e.target.value,
                            key: slugKey(e.target.value, f.key),
                          })
                        }
                      />
                    </label>
                    <label className={s.fieldCell}>
                      <span className={s.cellLabel}>Klíč</span>
                      <input
                        className={s.input}
                        value={f.key}
                        onChange={(e) =>
                          setField(si, fi, {
                            key: slugKey(e.target.value, f.key),
                          })
                        }
                      />
                    </label>
                    <label className={s.fieldCell}>
                      <span className={s.cellLabel}>Typ</span>
                      <select
                        className={s.input}
                        value={f.type}
                        onChange={(e) =>
                          setField(si, fi, {
                            type: e.target.value as SchemaFieldType,
                          })
                        }
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    {f.type === 'number' && (
                      <>
                        <label className={s.fieldCell}>
                          <span className={s.cellLabel}>Chování v boji</span>
                          <select
                            className={s.input}
                            value={f.combatBehavior ?? ''}
                            onChange={(e) =>
                              setField(si, fi, {
                                combatBehavior:
                                  (e.target.value as CombatBehavior) ||
                                  undefined,
                              })
                            }
                          >
                            {COMBAT_BEHAVIORS.map((b) => (
                              <option key={b.value} value={b.value}>
                                {b.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className={s.fieldCellSm}>
                          <span className={s.cellLabel}>Min</span>
                          <input
                            className={s.input}
                            type="number"
                            value={f.min ?? ''}
                            onChange={(e) =>
                              setField(si, fi, {
                                min:
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value),
                              })
                            }
                          />
                        </label>
                        <label className={s.fieldCellSm}>
                          <span className={s.cellLabel}>Max</span>
                          <input
                            className={s.input}
                            type="number"
                            value={f.max ?? ''}
                            onChange={(e) =>
                              setField(si, fi, {
                                max:
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value),
                              })
                            }
                          />
                        </label>
                      </>
                    )}

                    {f.type === 'enum' && (
                      <label className={s.fieldCellWide}>
                        <span className={s.cellLabel}>
                          Možnosti (oddělené čárkou)
                        </span>
                        <input
                          className={s.input}
                          value={(f.enumValues ?? []).join(', ')}
                          onChange={(e) =>
                            setField(si, fi, {
                              enumValues: e.target.value
                                .split(',')
                                .map((x) => x.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </label>
                    )}

                    {f.type === 'computed' && (
                      <label className={s.fieldCellWide}>
                        <span className={s.cellLabel}>
                          Vzorec (např. health.max - injury)
                        </span>
                        <input
                          className={s.input}
                          value={f.formula ?? ''}
                          onChange={(e) =>
                            setField(si, fi, { formula: e.target.value })
                          }
                        />
                      </label>
                    )}

                    <label className={s.fieldCellChk}>
                      <input
                        type="checkbox"
                        checked={f.required ?? false}
                        onChange={(e) =>
                          setField(si, fi, { required: e.target.checked })
                        }
                      />
                      <span>Povinné</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    className={s.iconBtn}
                    onClick={() => removeField(si, fi)}
                    title="Smazat pole"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                className={s.addBtn}
                onClick={() => addField(si)}
              >
                + Přidat pole
              </button>
            </div>
          ))}

          <button type="button" className={s.addSectionBtn} onClick={addSection}>
            + Přidat sekci
          </button>
        </div>

        <div className={s.previewCol}>
          <div className={s.previewHead}>Náhled statbloku</div>
          {sections.some((sec) => sec.fields.length > 0) ? (
            <EntityStatbar schema={previewSchema} value={previewValue} />
          ) : (
            <p className={s.previewEmpty}>Přidej pole pro náhled.</p>
          )}
        </div>
      </div>
    </div>
  );
}
