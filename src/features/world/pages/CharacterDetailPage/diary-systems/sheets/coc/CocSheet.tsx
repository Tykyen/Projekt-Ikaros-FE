/**
 * 8.7c — Call of Cthulhu 7e deník postavy.
 *
 * Adaptováno z `c:/Matrix/Matrix/frontend/src/components/diary/CocCharacterSheet.tsx`
 * (420 ř, 1:1 layout). Hlavní odlišnosti:
 *   - Save delegujeme parentu (EditStickyBar v `DiaryTab`); `onSave` prop nemá.
 *   - `view` mód disabluje všechny inputy + tlačítka (add/del row).
 *   - Data v `diary.customData` s prefixem `coc_*` (1:1 vůči legacy).
 *
 * Mapový overlay (Sanity tracker s draft state, d100 roller) je v Matrix/Matrix
 * v `CocMapDiaryOverlay.tsx` — patří k iteraci 10.2l (mapa); nepřenášíme teď.
 */
import type { SystemSheetProps } from '../../types';
import { makeCdAccess } from '../../_shared/cdAccess';
import { SheetInitiativeButton } from '../../_shared/SheetInitiativeButton';
import {
  COC_CHARS,
  COC_HEADER_FIELDS,
  COC_STATUS_FLAGS,
  DEFAULT_SKILLS,
  type CocCustomSkill,
  type CocWeapon,
} from './constants';

export function CocSheet({ diary, mode, onChange, onRoll }: SystemSheetProps) {
  const disabled = mode === 'view';
  const cd = diary.customData ?? {};
  const { g, bool, set, parseJsonArr, updateArr, addArr, removeArr } =
    makeCdAccess(cd, 'coc_', onChange);

  // `g` použijeme s logickými klíči (např. `name`, `hp_cur`), helper auto-prefix.
  // Pro klíče typu `wpn0_name` (default Brawl row) i `sk_<skill>_reg` (dovednosti)
  // bereme suffix přímo.

  return (
    <div className="coc-sheet">
      {onRoll && <SheetInitiativeButton onRoll={onRoll} kind="d100" />}
      {/* ═══ TITLE ═══ */}
      <div className="coc-title">Vyšetřovatel – 20. léta</div>

      {/* ═══ HEADER ═══ */}
      <div className="coc-header">
        {COC_HEADER_FIELDS.map((f) => {
          // Klíče v constants jsou už full (`coc_name`, …) — strip prefixu.
          const k = f.key.replace(/^coc_/, '');
          return (
            <div key={f.key} className="coc-header-field">
              <label htmlFor={f.key}>{f.label}</label>
              <input
                id={f.key}
                value={g(k)}
                disabled={disabled}
                onChange={(e) => set(k, e.target.value)}
              />
            </div>
          );
        })}
      </div>

      {/* ═══ CHARACTERISTICS ═══ */}
      <div className="coc-section-title">Vlastnosti</div>
      <div className="coc-chars-grid">
        {COC_CHARS.map((c) => (
          <div key={c.key} className="coc-char-box">
            <div className="coc-char-label">{c.label}</div>
            <div className="coc-char-values">
              <div>
                <input
                  value={g(`${c.key}_reg`)}
                  disabled={disabled}
                  onChange={(e) => set(`${c.key}_reg`, e.target.value)}
                  aria-label={`${c.label} základní`}
                />
                <span className="coc-char-sub">Zákl.</span>
              </div>
              <div>
                <input
                  value={g(`${c.key}_half`)}
                  disabled={disabled}
                  onChange={(e) => set(`${c.key}_half`, e.target.value)}
                  aria-label={`${c.label} polovina`}
                />
                <span className="coc-char-sub">Pol.</span>
              </div>
              <div>
                <input
                  value={g(`${c.key}_fifth`)}
                  disabled={disabled}
                  onChange={(e) => set(`${c.key}_fifth`, e.target.value)}
                  aria-label={`${c.label} pětina`}
                />
                <span className="coc-char-sub">Pět.</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Derived: Nápad, Znalosti */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          className="coc-char-box"
          style={{ flex: 1, minWidth: 120 }}
        >
          <div className="coc-char-label">NÁPAD</div>
          <div className="coc-char-values">
            <input
              value={g('idea')}
              disabled={disabled}
              onChange={(e) => set('idea', e.target.value)}
              aria-label="Nápad (INT×3)"
            />
          </div>
        </div>
        <div
          className="coc-char-box"
          style={{ flex: 1, minWidth: 120 }}
        >
          <div className="coc-char-label">ZNALOSTI</div>
          <div className="coc-char-values">
            <input
              value={g('know')}
              disabled={disabled}
              onChange={(e) => set('know', e.target.value)}
              aria-label="Znalosti (VZD×5)"
            />
          </div>
        </div>
      </div>

      {/* ═══ VITALS ═══ */}
      <div className="coc-vitals-row">
        <VitalBox
          variant="danger"
          label="Životy"
          maxKey="hp_max"
          curKey="hp_cur"
          g={g}
          set={set}
          disabled={disabled}
        />
        <VitalBox
          label="Body magie"
          maxKey="mp_max"
          curKey="mp_cur"
          g={g}
          set={set}
          disabled={disabled}
        />
        <VitalBox
          label="Štěstí"
          maxKey="luck_start"
          maxLabel="Počáteční"
          curKey="luck_cur"
          g={g}
          set={set}
          disabled={disabled}
        />
        <VitalBox
          variant="sanity"
          label="Příčetnost"
          maxKey="san_start"
          maxLabel="Počáteční"
          curKey="san_cur"
          g={g}
          set={set}
          disabled={disabled}
        />
      </div>

      {/* ═══ STATUS CHECKBOXES ═══ */}
      <div className="coc-status-row">
        {COC_STATUS_FLAGS.map((flag) => {
          const k = flag.key.replace(/^coc_/, '');
          return (
            <label key={flag.key}>
              <input
                type="checkbox"
                checked={bool(k)}
                disabled={disabled}
                onChange={(e) => set(k, e.target.checked)}
              />
              {flag.label}
            </label>
          );
        })}
      </div>

      {/* ═══ SKILLS (44 default) ═══ */}
      <div className="coc-section-title">Dovednosti</div>
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 4,
          paddingLeft: 24,
        }}
      >
        <span
          style={{
            fontSize: 8,
            color: 'rgba(212,201,168,0.35)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            flex: 1,
          }}
        >
          Dovednost (základ)
        </span>
        <span
          style={{
            fontSize: 8,
            color: 'rgba(212,201,168,0.35)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            width: 100,
            textAlign: 'center',
          }}
        >
          Zákl. / Pol. / Pět.
        </span>
      </div>
      <div className="coc-skills-grid">
        {DEFAULT_SKILLS.map((skill) => (
          <div key={skill.key} className="coc-skill-row">
            <input
              type="checkbox"
              className="coc-skill-check"
              checked={bool(`sk_${skill.key}_chk`)}
              disabled={disabled}
              onChange={(e) =>
                set(`sk_${skill.key}_chk`, e.target.checked)
              }
              title="Označit jako vylepšenou"
              aria-label={`${skill.name} vylepšená`}
            />
            <span
              className="coc-skill-name"
              title={`Základ: ${skill.base}`}
            >
              {skill.name}{' '}
              <span style={{ opacity: 0.4, fontSize: 10 }}>
                ({skill.base})
              </span>
            </span>
            <div className="coc-skill-inputs">
              <input
                value={g(`sk_${skill.key}_reg`)}
                disabled={disabled}
                onChange={(e) =>
                  set(`sk_${skill.key}_reg`, e.target.value)
                }
                title="Základní"
                aria-label={`${skill.name} základní hodnota`}
              />
              <input
                value={g(`sk_${skill.key}_half`)}
                disabled={disabled}
                onChange={(e) =>
                  set(`sk_${skill.key}_half`, e.target.value)
                }
                title="Polovina"
                aria-label={`${skill.name} polovina`}
              />
              <input
                value={g(`sk_${skill.key}_fifth`)}
                disabled={disabled}
                onChange={(e) =>
                  set(`sk_${skill.key}_fifth`, e.target.value)
                }
                title="Pětina"
                aria-label={`${skill.name} pětina`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Custom additional skills ── */}
      <div
        className="coc-section-title"
        style={{ fontSize: 11, marginTop: 8 }}
      >
        Další dovednosti
      </div>
      {parseJsonArr<CocCustomSkill>('custom_skills').map((row, i) => (
        <div key={i} className="coc-skill-row">
          <input
            type="checkbox"
            className="coc-skill-check"
            checked={row.chk === 'true'}
            disabled={disabled}
            onChange={(e) =>
              updateArr<CocCustomSkill>('custom_skills', i, {
                chk: String(e.target.checked),
              })
            }
          />
          <input
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              borderBottom: '1px dotted rgba(180,150,100,0.15)',
              color: '#e8dcc4',
              padding: '2px 4px',
              fontSize: 12,
              fontFamily: 'inherit',
              outline: 'none',
            }}
            value={row.name || ''}
            disabled={disabled}
            onChange={(e) =>
              updateArr<CocCustomSkill>('custom_skills', i, {
                name: e.target.value,
              })
            }
            placeholder="Název dovednosti"
            aria-label="Název vlastní dovednosti"
          />
          <div className="coc-skill-inputs">
            <input
              value={row.reg || ''}
              disabled={disabled}
              onChange={(e) =>
                updateArr<CocCustomSkill>('custom_skills', i, {
                  reg: e.target.value,
                })
              }
              aria-label="Základní hodnota"
            />
            <input
              value={row.half || ''}
              disabled={disabled}
              onChange={(e) =>
                updateArr<CocCustomSkill>('custom_skills', i, {
                  half: e.target.value,
                })
              }
              aria-label="Polovina"
            />
            <input
              value={row.fifth || ''}
              disabled={disabled}
              onChange={(e) =>
                updateArr<CocCustomSkill>('custom_skills', i, {
                  fifth: e.target.value,
                })
              }
              aria-label="Pětina"
            />
          </div>
          {!disabled && (
            <button
              type="button"
              className="coc-del-btn"
              onClick={() => removeArr('custom_skills', i)}
              aria-label="Smazat dovednost"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          className="coc-add-btn"
          onClick={() =>
            addArr<CocCustomSkill>('custom_skills', {
              name: '',
              reg: '',
              half: '',
              fifth: '',
              chk: 'false',
            })
          }
        >
          + Přidat dovednost
        </button>
      )}

      {/* ═══ COMBAT ═══ */}
      <div className="coc-section-title">Boj</div>
      <table className="coc-combat-table">
        <thead>
          <tr>
            <th style={{ width: '22%' }}>Zbraň</th>
            <th style={{ width: '12%' }}>Dovednost</th>
            <th style={{ width: '12%' }}>Zranění</th>
            <th style={{ width: '12%' }}>Počet útoků</th>
            <th style={{ width: '12%' }}>Dostřel</th>
            <th style={{ width: '10%' }}>Munice</th>
            <th style={{ width: '10%' }}>Selhání</th>
            <th style={{ width: 30 }}></th>
          </tr>
        </thead>
        <tbody>
          {/* Default Brawl row — uložená do `coc_wpn0_*` klíčů */}
          {(
            [
              ['name', 'Rvačka', 'Název zbraně'],
              ['skill', '', 'Dovednost'],
              ['dmg', '1K3 + BZ', 'Zranění'],
              ['attacks', '1', 'Počet útoků'],
              ['range', '–', 'Dostřel'],
              ['ammo', '–', 'Munice'],
              ['malf', '–', 'Selhání'],
            ] as const
          ).reduce<React.ReactNode[][]>(
            (acc, [field, fallback, ariaLabel]) => {
              acc[0].push(
                <td key={field}>
                  <input
                    value={g(`wpn0_${field}`) || fallback}
                    disabled={disabled}
                    onChange={(e) =>
                      set(`wpn0_${field}`, e.target.value)
                    }
                    aria-label={`Rvačka — ${ariaLabel}`}
                  />
                </td>,
              );
              return acc;
            },
            [[]],
          ).map((cells, i) => (
            <tr key={i}>
              {cells}
              <td></td>
            </tr>
          ))}
          {/* Dynamic weapons */}
          {parseJsonArr<CocWeapon>('weapons').map((row, i) => (
            <tr key={i}>
              {(
                ['name', 'skill', 'dmg', 'attacks', 'range', 'ammo', 'malf'] as const
              ).map((field) => (
                <td key={field}>
                  <input
                    value={row[field] || ''}
                    disabled={disabled}
                    onChange={(e) =>
                      updateArr<CocWeapon>('weapons', i, {
                        [field]: e.target.value,
                      } as Partial<CocWeapon>)
                    }
                    aria-label={`Zbraň ${i + 1} — ${field}`}
                  />
                </td>
              ))}
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="coc-del-btn"
                    onClick={() => removeArr('weapons', i)}
                    aria-label="Smazat zbraň"
                  >
                    ✕
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!disabled && (
        <button
          type="button"
          className="coc-add-btn"
          onClick={() =>
            addArr<CocWeapon>('weapons', {
              name: '',
              skill: '',
              dmg: '',
              attacks: '1',
              range: '',
              ammo: '',
              malf: '',
            })
          }
        >
          + Přidat zbraň
        </button>
      )}

      {/* ── Combat derived stats ── */}
      <div
        className="coc-combat-derived"
        style={{ marginTop: 16 }}
      >
        <div className="coc-derived-item">
          <span>Pohyb</span>
          <input
            value={g('move')}
            disabled={disabled}
            onChange={(e) => set('move', e.target.value)}
            aria-label="Pohyb"
          />
        </div>
        <div className="coc-derived-item">
          <span>Stavba</span>
          <input
            value={g('build')}
            disabled={disabled}
            onChange={(e) => set('build', e.target.value)}
            aria-label="Stavba"
          />
        </div>
        <div className="coc-derived-item">
          <span>Úhyb</span>
          <div style={{ display: 'flex', gap: 3 }}>
            <input
              value={g('dodge_reg')}
              disabled={disabled}
              onChange={(e) => set('dodge_reg', e.target.value)}
              style={{ width: 40 }}
              aria-label="Úhyb základní"
            />
            <input
              value={g('dodge_half')}
              disabled={disabled}
              onChange={(e) => set('dodge_half', e.target.value)}
              style={{ width: 40 }}
              aria-label="Úhyb polovina"
            />
            <input
              value={g('dodge_fifth')}
              disabled={disabled}
              onChange={(e) => set('dodge_fifth', e.target.value)}
              style={{ width: 40 }}
              aria-label="Úhyb pětina"
            />
          </div>
        </div>
        <div className="coc-derived-item">
          <span>Bonus ke zranění (BZ)</span>
          <input
            value={g('damage_bonus')}
            disabled={disabled}
            onChange={(e) => set('damage_bonus', e.target.value)}
            aria-label="Bonus ke zranění"
          />
        </div>
      </div>
    </div>
  );
}

// ── Vital box (HP / MP / Luck / Sanity) ─────────────────────────

interface VitalBoxProps {
  variant?: 'danger' | 'sanity';
  label: string;
  maxKey: string;
  maxLabel?: string;
  curKey: string;
  g: (key: string, fallback?: string) => string;
  set: (key: string, value: unknown) => void;
  disabled: boolean;
}

function VitalBox({
  variant,
  label,
  maxKey,
  maxLabel = 'Maximum',
  curKey,
  g,
  set,
  disabled,
}: VitalBoxProps) {
  const cls = variant
    ? `coc-vital-box is-${variant}`
    : 'coc-vital-box';
  return (
    <div className={cls}>
      <div className="coc-vital-label">{label}</div>
      <div className="coc-vital-pair">
        <div className="coc-vital-col">
          <span>{maxLabel}</span>
          <input
            value={g(maxKey)}
            disabled={disabled}
            onChange={(e) => set(maxKey, e.target.value)}
            aria-label={`${label} ${maxLabel.toLowerCase()}`}
          />
        </div>
        <div className="coc-vital-col">
          <span>Aktuální</span>
          <input
            value={g(curKey)}
            disabled={disabled}
            onChange={(e) => set(curKey, e.target.value)}
            aria-label={`${label} aktuální`}
          />
        </div>
      </div>
    </div>
  );
}
