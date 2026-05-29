/**
 * 8.7i — Sdílený Fate-like sheet (postavový sheet pro Fate + PI).
 *
 * 1:1 z `c:/Matrix/Matrix/frontend/src/components/diary/PiCharacterSheet.tsx`.
 * Liší se prefix v customData (`pi_*` / `fate_*`) a vizuál (data-diary-system).
 * Layout: 2 sloupce — levý (Aspekty / Konflikt / Cíle), pravý (Dovednosti / Deník).
 */
import type { SystemSheetProps } from '../types';
import { makeCdAccess } from './cdAccess';
import { SkillPips } from './SkillPips';
import { ConflictTrack } from './ConflictTrack';

interface AspectRow {
  name: string;
}

interface GoalRow {
  name: string;
  done: string; // 'true' / 'false'
}

interface SkillRow {
  name: string;
  val: string; // 0..6
  note: string;
}

interface Props extends SystemSheetProps {
  /** Per-systémový prefix (`pi_` pro Příběhy Impéria, `fate_` pro Fate). */
  prefix: string;
}

export function FateLikeSheet({
  prefix,
  diary,
  mode,
  onChange,
  onRoll,
}: Props) {
  const disabled = mode === 'view';
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, prefix, onChange);
  const { g, set, parseJsonArr, updateArr, addArr, removeArr } = cda;

  const aspects = parseJsonArr<AspectRow>('aspects');
  const skills = parseJsonArr<SkillRow>('skills');
  const goalsLong = parseJsonArr<GoalRow>('goals_long');
  const goalsShort = parseJsonArr<GoalRow>('goals_short');
  const conflictVal = parseInt(g('conflict'), 10) || 0;

  return (
    <div className="pi-dashboard">
      {/* IDENTITY */}
      <div className="pi-identity">
        <input
          className="name-input"
          value={g('name')}
          disabled={disabled}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Jméno vaší postavy..."
          aria-label="Jméno postavy"
        />
        {onRoll && (
          <button
            type="button"
            onClick={() =>
              onRoll({ label: 'Iniciativa', modifier: 0, kind: 'fate' })
            }
            style={{
              marginLeft: 12,
              padding: '6px 14px',
              background: 'rgba(120, 100, 255, 0.22)',
              color: '#fff',
              border: '1px solid rgba(120, 100, 255, 0.6)',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            title="Hodit iniciativu (4dF)"
          >
            ⚡ Iniciativa
          </button>
        )}
      </div>

      <div className="pi-grid">
        {/* LEVÝ SLOUPEC: Aspekty + Konflikt + Cíle */}
        <div className="pi-column">
          <div>
            <h3>Aspekty</h3>
            <div className="pi-list-block">
              {aspects.map((row, i) => (
                <div key={i} className="p-item">
                  <input
                    className="text-item"
                    value={row.name || ''}
                    disabled={disabled}
                    onChange={(e) =>
                      updateArr<AspectRow>('aspects', i, {
                        name: e.target.value,
                      })
                    }
                    placeholder="Zapiš aspekt (např. Dandy z lepší rodiny)..."
                    aria-label={`Aspekt ${i + 1}`}
                  />
                  {!disabled && (
                    <button
                      type="button"
                      className="del-btn"
                      onClick={() => removeArr('aspects', i)}
                      aria-label="Smazat aspekt"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {!disabled && (
                <button
                  type="button"
                  className="add-btn"
                  onClick={() => addArr<AspectRow>('aspects', { name: '' })}
                >
                  + Nový aspekt
                </button>
              )}
            </div>
          </div>

          <div>
            <h3>Sekvenční konflikty (Stav)</h3>
            <ConflictTrack
              value={conflictVal}
              onChange={(v) => set('conflict', String(v))}
              disabled={disabled}
            />
          </div>

          <div>
            <h3>Cíle</h3>

            <GoalsBlock
              title="Dlouhodobé Cíle"
              arrKey="goals_long"
              rows={goalsLong}
              placeholder="Např. Očistit jméno rodiny..."
              addLabel="+ Nový dlouhodobý cíl"
              updateArr={(i, patch) =>
                updateArr<GoalRow>('goals_long', i, patch)
              }
              addArr={() =>
                addArr<GoalRow>('goals_long', { name: '', done: 'false' })
              }
              removeArr={(i) => removeArr('goals_long', i)}
              disabled={disabled}
            />

            <GoalsBlock
              title="Krátkodobé Cíle (Sezení)"
              arrKey="goals_short"
              rows={goalsShort}
              placeholder="Zapsat aktuální úkol..."
              addLabel="+ Nový krátkodobý cíl"
              updateArr={(i, patch) =>
                updateArr<GoalRow>('goals_short', i, patch)
              }
              addArr={() =>
                addArr<GoalRow>('goals_short', { name: '', done: 'false' })
              }
              removeArr={(i) => removeArr('goals_short', i)}
              disabled={disabled}
            />
          </div>
        </div>

        {/* PRAVÝ SLOUPEC: Dovednosti + Deník */}
        <div className="pi-column">
          <div>
            <h3>Dovednosti</h3>
            <div className="skills-list">
              {skills.map((row, i) => (
                <div key={i} className="skill-row">
                  <input
                    className="s-name"
                    value={row.name || ''}
                    disabled={disabled}
                    onChange={(e) =>
                      updateArr<SkillRow>('skills', i, {
                        name: e.target.value,
                      })
                    }
                    placeholder="Název dovednosti..."
                    aria-label={`Dovednost ${i + 1} název`}
                  />
                  <SkillPips
                    value={parseInt(row.val, 10) || 0}
                    onChange={(v) =>
                      updateArr<SkillRow>('skills', i, { val: String(v) })
                    }
                    disabled={disabled}
                    ariaLabelPrefix={`${row.name || `Dovednost ${i + 1}`} pip`}
                  />
                  {/* 10.2c-edit-9g — Fate-like = roll 4dF + skill value (tactical-map embed) */}
                  {onRoll && row.name && (
                    <button
                      type="button"
                      onClick={() =>
                        onRoll({
                          label: row.name,
                          modifier: parseInt(row.val, 10) || 0,
                          kind: 'fate',
                        })
                      }
                      style={{
                        padding: '2px 8px',
                        background: 'rgba(120, 200, 120, 0.18)',
                        color: '#9ddf9d',
                        border: '1px solid rgba(120, 200, 120, 0.5)',
                        borderRadius: 4,
                        fontSize: 13,
                        cursor: 'pointer',
                        minHeight: 26,
                      }}
                      title={`Hodit ${row.name} (4dF + ${row.val})`}
                      aria-label={`Hodit ${row.name}`}
                    >
                      🎲
                    </button>
                  )}
                  <input
                    value={row.note || ''}
                    disabled={disabled}
                    onChange={(e) =>
                      updateArr<SkillRow>('skills', i, {
                        note: e.target.value,
                      })
                    }
                    placeholder="Specifikace..."
                    style={{
                      width: 80,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: 11,
                      outline: 'none',
                    }}
                    aria-label={`Dovednost ${i + 1} specifikace`}
                  />
                  {!disabled && (
                    <button
                      type="button"
                      className="del-btn"
                      style={{ padding: '0 4px', fontSize: 12 }}
                      onClick={() => removeArr('skills', i)}
                      aria-label="Smazat dovednost"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!disabled && (
              <button
                type="button"
                className="add-btn"
                onClick={() =>
                  addArr<SkillRow>('skills', { name: '', val: '0', note: '' })
                }
                style={{ marginTop: 8 }}
              >
                + Přidat dovednost
              </button>
            )}
          </div>

          <div>
            <h3>Deník / Poznámky</h3>
            <textarea
              className="pi-textarea"
              value={g('notes')}
              disabled={disabled}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Vztahy k ostatním postavám, tajnosti, magické artefakty nebo dějové stopy..."
              aria-label="Deník / poznámky"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Goals block (DRY pro dlouhodobé + krátkodobé) ───────────────

interface GoalsBlockProps {
  title: string;
  arrKey: string;
  rows: GoalRow[];
  placeholder: string;
  addLabel: string;
  updateArr: (index: number, patch: Partial<GoalRow>) => void;
  addArr: () => void;
  removeArr: (index: number) => void;
  disabled: boolean;
}

function GoalsBlock({
  title,
  arrKey,
  rows,
  placeholder,
  addLabel,
  updateArr,
  addArr,
  removeArr,
  disabled,
}: GoalsBlockProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h4
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        {title}
      </h4>
      <div className="pi-list-block">
        {rows.map((row, i) => (
          <div key={i} className="p-item">
            <input
              type="checkbox"
              checked={row.done === 'true'}
              disabled={disabled}
              onChange={(e) =>
                updateArr(i, { done: e.target.checked ? 'true' : 'false' })
              }
              style={{ marginTop: 12 }}
              aria-label={`${title} ${i + 1} hotovo`}
            />
            <input
              className="text-item"
              style={{
                textDecoration:
                  row.done === 'true' ? 'line-through' : 'none',
                opacity: row.done === 'true' ? 0.5 : 1,
              }}
              value={row.name || ''}
              disabled={disabled}
              onChange={(e) => updateArr(i, { name: e.target.value })}
              placeholder={placeholder}
              aria-label={`${title} ${i + 1}`}
            />
            {!disabled && (
              <button
                type="button"
                className="del-btn"
                onClick={() => removeArr(i)}
                aria-label={`Smazat ${title.toLowerCase()}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {!disabled && (
          <button
            type="button"
            className="add-btn"
            onClick={addArr}
            aria-label={`Přidat ${arrKey}`}
          >
            {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}
