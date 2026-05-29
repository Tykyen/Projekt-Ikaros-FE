/**
 * 8.7g — GURPS deník postavy.
 *
 * Adaptováno z `c:/Matrix/Matrix/frontend/src/components/Map/GurpsMapDiaryOverlay.tsx`
 * (405 ř — Matrix/Matrix měl jen overlay, žádný full sheet; Ikaros si z něj
 * staví full editovatelný sheet s vlastním stylem `.gurps-dashboard`).
 *
 * Data v `diary.customData` s prefixem `gurps_*` (1:1 vůči legacy).
 */
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  GURPS_CORE_ATTRS,
  GURPS_DEFENSES,
  GURPS_DERIVED,
  GURPS_ENC_LEVELS,
  GURPS_META_FIELDS,
  type GurpsArmor,
  type GurpsLanguage,
  type GurpsMelee,
  type GurpsRanged,
  type GurpsReactionMod,
  type GurpsSkill,
  type GurpsTrait,
} from './constants';
import { SheetInitiativeButton } from '../../_shared/SheetInitiativeButton';

export function GurpsSheet({ diary, mode, onChange, onRoll }: SystemSheetProps) {
  const disabled = mode === 'view';
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'gurps_', onChange);
  const { g, set } = cda;

  return (
    <div className="gurps-dashboard">
      {/* ═══ HEADER ═══ */}
      <div className="gurps-header">
        <div className="identity-column">
          <div className="name-row">
            <div style={{ flex: 2 }}>
              <label htmlFor="gurps_name">Jméno postavy (Name)</label>
              <input
                id="gurps_name"
                value={g('name')}
                disabled={disabled}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Zadej jméno..."
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="gurps_player">Hráč (Player)</label>
              <input
                id="gurps_player"
                value={g('player')}
                disabled={disabled}
                onChange={(e) => set('player', e.target.value)}
              />
            </div>
          </div>
          <div className="meta-column">
            {GURPS_META_FIELDS.map((f) => (
              <div key={f.key}>
                <label htmlFor={`gurps_${f.key}`}>{f.label}</label>
                <input
                  id={`gurps_${f.key}`}
                  value={g(f.key)}
                  disabled={disabled}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="points-column">
          <div className="points-row">
            <label htmlFor="gurps_points_total">Celkem Bodů (Total)</label>
            <input
              id="gurps_points_total"
              value={g('points_total')}
              disabled={disabled}
              onChange={(e) => set('points_total', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="points-row">
            <label htmlFor="gurps_points_unspent">Neutracené (Unspent)</label>
            <input
              id="gurps_points_unspent"
              value={g('points_unspent')}
              disabled={disabled}
              onChange={(e) => set('points_unspent', e.target.value)}
              placeholder="0"
              style={{ color: '#38bdf8' }}
            />
          </div>
        </div>
      </div>

      {/* ═══ MAIN GRID ═══ */}
      <div className="gurps-grid">
        {/* Core attributes (left, panel-4) */}
        <div className="panel-4">
          <h3>Hlavní atributy</h3>
          <div className="core-attrs">
            {GURPS_CORE_ATTRS.map((a) => (
              <div className="attr-box" key={a.key}>
                <label htmlFor={`gurps_${a.key}`}>{a.label}</label>
                <input
                  id={`gurps_${a.key}`}
                  type="text"
                  value={g(a.key, '10')}
                  disabled={disabled}
                  onChange={(e) => set(a.key, e.target.value)}
                  aria-label={a.label}
                />
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: 20 }}>HP / FP</h3>
          <div className="sec-attrs">
            <VitalBox
              variant="vital"
              label="HP (Životy)"
              curKey="hp"
              maxKey="hp_max"
              cda={cda}
              disabled={disabled}
            />
            <VitalBox
              variant="fatigue"
              label="FP (Únava)"
              curKey="fp"
              maxKey="fp_max"
              cda={cda}
              disabled={disabled}
            />
          </div>

          <h3 style={{ marginTop: 20 }}>Obrana &amp; TL</h3>
          <div className="sm-grid">
            {GURPS_DEFENSES.map((d) => (
              <div className="lbl-input" key={d.key}>
                <label htmlFor={`gurps_${d.key}`}>{d.label}</label>
                <input
                  id={`gurps_${d.key}`}
                  value={g(d.key, d.fallback)}
                  disabled={disabled}
                  onChange={(e) => set(d.key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: 20 }}>Derived</h3>
          <div className="sm-grid">
            <div className="lbl-input">
              <label htmlFor="gurps_basic_speed">Rychlost</label>
              <input
                id="gurps_basic_speed"
                value={g('basic_speed', '5.0')}
                disabled={disabled}
                onChange={(e) => set('basic_speed', e.target.value)}
              />
            </div>
            <div className="lbl-input">
              <label htmlFor="gurps_basic_move">Pohyb</label>
              <input
                id="gurps_basic_move"
                value={g('basic_move', '5')}
                disabled={disabled}
                onChange={(e) => set('basic_move', e.target.value)}
              />
            </div>
            {GURPS_DERIVED.map((d) => (
              <div className="lbl-input" key={d.key}>
                <label htmlFor={`gurps_${d.key}`}>{d.label}</label>
                <input
                  id={`gurps_${d.key}`}
                  value={g(d.key, d.fallback)}
                  disabled={disabled}
                  onChange={(e) => set(d.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Encumbrance + tabulky (right, panel-8) */}
        <div className="panel-8">
          <h3>Zatížení a Úhyb</h3>
          <div className="encumb-table">
            <div className="e-row e-head">
              <div className="e-cell e-fixed">Úroveň</div>
              <div className="e-cell">Move</div>
              <div className="e-cell">Dodge</div>
            </div>
            {GURPS_ENC_LEVELS.map((enc) => (
              <div className="e-row" key={enc.label}>
                <div className="e-cell e-fixed">{enc.label}</div>
                <div className="e-cell">
                  <input
                    value={g(enc.m, '-')}
                    disabled={disabled}
                    onChange={(e) => set(enc.m, e.target.value)}
                    aria-label={`${enc.label} Move`}
                  />
                </div>
                <div className="e-cell">
                  <input
                    value={g(enc.d, '-')}
                    disabled={disabled}
                    onChange={(e) => set(enc.d, e.target.value)}
                    style={{ color: '#00e5ff', fontWeight: 'bold' }}
                    aria-label={`${enc.label} Dodge`}
                  />
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: 24 }}>Dovednosti (Skills)</h3>
          <GurpsTable
            cda={cda}
            disabled={disabled}
            arrKey="skills"
            cols={[
              ['name', 'Dovednost'],
              ['lvl', 'Úroveň'],
              ['base', 'Základ'],
            ]}
            addLabel="+ Přidat dovednost"
            template={{ name: '', lvl: '', base: '' } as Record<string, string>}
          />
        </div>

        {/* Advantages & Disadvantages (panel-6) */}
        <div className="panel-6">
          <h3>Výhody</h3>
          <GurpsTable
            cda={cda}
            disabled={disabled}
            arrKey="advs"
            cols={[
              ['name', 'Výhoda'],
              ['note', 'Poznámka / Body'],
            ]}
            addLabel="+ Přidat výhodu"
            template={{ name: '', note: '' } as Record<string, string>}
          />
        </div>
        <div className="panel-6">
          <h3>Nevýhody</h3>
          <GurpsTable
            cda={cda}
            disabled={disabled}
            arrKey="disadvs"
            cols={[
              ['name', 'Nevýhoda'],
              ['note', 'Poznámka / Body'],
            ]}
            addLabel="+ Přidat nevýhodu"
            template={{ name: '', note: '' } as Record<string, string>}
          />
        </div>

        {/* Reaction mods + languages (panel-6 + panel-6) */}
        <div className="panel-6">
          <h3>Reakční modifikátory</h3>
          <GurpsTable
            cda={cda}
            disabled={disabled}
            arrKey="react_mods"
            cols={[
              ['name', 'Situace / Skupina'],
              ['val', 'Modifikátor'],
            ]}
            addLabel="+ Přidat modifikátor"
            template={{ name: '', val: '' } as Record<string, string>}
          />
        </div>
        <div className="panel-6">
          <h3>Jazyky</h3>
          <GurpsTable
            cda={cda}
            disabled={disabled}
            arrKey="langs"
            cols={[
              ['name', 'Jazyk'],
              ['spk', 'Mluvený'],
              ['wrt', 'Psaný'],
            ]}
            addLabel="+ Přidat jazyk"
            template={
              { name: '', spk: '', wrt: '' } as Record<string, string>
            }
          />
        </div>

        {/* Melee + Ranged (panel-6 + panel-6) */}
        <div className="panel-6">
          <h3>Zbraně na blízko</h3>
          <GurpsTable
            cda={cda}
            disabled={disabled}
            arrKey="melee"
            cols={[
              ['name', 'Zbraň'],
              ['dmg', 'DMG'],
              ['reach', 'Dosah'],
              ['parry', 'Parry'],
            ]}
            addLabel="+ Přidat zbraň"
            template={
              { name: '', dmg: '', reach: '', parry: '' } as Record<
                string,
                string
              >
            }
          />
        </div>
        <div className="panel-6">
          <h3>Střelné zbraně</h3>
          <GurpsTable
            cda={cda}
            disabled={disabled}
            arrKey="ranged"
            cols={[
              ['name', 'Zbraň'],
              ['dmg', 'DMG'],
              ['acc', 'Acc'],
              ['rng', 'Rng'],
              ['rof', 'RoF'],
              ['shots', 'Shots'],
            ]}
            addLabel="+ Přidat zbraň"
            template={
              {
                name: '',
                dmg: '',
                acc: '',
                rng: '',
                rof: '',
                shots: '',
              } as Record<string, string>
            }
          />
        </div>

        {/* Armor + inventory totals (panel-12) */}
        <div className="panel-12">
          <h3>Zbroj a majetek</h3>
          <GurpsTable
            cda={cda}
            disabled={disabled}
            arrKey="armor"
            cols={[
              ['name', 'Předmět'],
              ['loc', 'Lokace'],
              ['wgt', 'Váha (lb)'],
              ['cost', 'Cena ($)'],
            ]}
            addLabel="+ Přidat předmět"
            template={
              { name: '', loc: '', wgt: '', cost: '' } as Record<
                string,
                string
              >
            }
          />
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
              gap: 16,
              justifyContent: 'flex-end',
            }}
          >
            <div>
              Celková váha:{' '}
              <input
                value={g('inv_wgt')}
                disabled={disabled}
                onChange={(e) => set('inv_wgt', e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: 4,
                  width: 80,
                }}
                aria-label="Celková váha inventáře"
              />
            </div>
            <div>
              Celková cena:{' '}
              <input
                value={g('inv_cost')}
                disabled={disabled}
                onChange={(e) => set('inv_cost', e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fbbf24',
                  padding: '4px 8px',
                  borderRadius: 4,
                  width: 80,
                }}
                aria-label="Celková cena inventáře"
              />
              $
            </div>
          </div>
        </div>

        {/* Notes (panel-12) */}
        <div className="panel-12">
          <h3>Poznámky k postavě</h3>
          <textarea
            className="gurps-textarea"
            value={g('notes')}
            disabled={disabled}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Poznámky, historie, motivace..."
            aria-label="Poznámky"
          />
        </div>
      </div>
    </div>
  );
}

// ── Vital box (HP / FP) ─────────────────────────────────────────

interface VitalBoxProps {
  variant: 'vital' | 'fatigue';
  label: string;
  curKey: string;
  maxKey: string;
  cda: CdAccess;
  disabled: boolean;
}

function VitalBox({
  variant,
  label,
  curKey,
  maxKey,
  cda,
  disabled,
}: VitalBoxProps) {
  const { g, set } = cda;
  return (
    <div className={`sec-box ${variant}`}>
      <label htmlFor={`gurps_${curKey}`}>{label}</label>
      <div className="h-row">
        <input
          id={`gurps_${curKey}`}
          value={g(curKey, '10')}
          disabled={disabled}
          onChange={(e) => set(curKey, e.target.value)}
          aria-label={`${label} aktuální`}
        />
        <span>/</span>
        <input
          value={g(maxKey, '10')}
          disabled={disabled}
          onChange={(e) => set(maxKey, e.target.value)}
          aria-label={`${label} max`}
        />
      </div>
    </div>
  );
}

// ── Generic table helper ────────────────────────────────────────

interface GurpsTableProps {
  cda: CdAccess;
  disabled: boolean;
  arrKey: string;
  cols: [string, string][];
  addLabel: string;
  template: Record<string, string>;
}

function GurpsTable({
  cda,
  disabled,
  arrKey,
  cols,
  addLabel,
  template,
}: GurpsTableProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<Record<string, string>>(arrKey);

  return (
    <div className="gurps-table-container">
      <table>
        <thead>
          <tr>
            {cols.map(([k, label]) => (
              <th key={k}>{label}</th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {cols.map(([k, label]) => (
                <td key={k}>
                  <input
                    value={row[k] || ''}
                    disabled={disabled}
                    onChange={(e) =>
                      updateArr<Record<string, string>>(arrKey, i, {
                        [k]: e.target.value,
                      })
                    }
                    aria-label={`${label} ${i + 1}`}
                  />
                </td>
              ))}
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="del-btn"
                    onClick={() => removeArr(arrKey, i)}
                    aria-label="Smazat řádek"
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
          className="add-row-btn"
          onClick={() => addArr(arrKey, template)}
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}

// Re-export typů, aby caller mohl typovat customData (TS not used aktivně,
// ale součást veřejného API constants.ts.)
export type {
  GurpsArmor,
  GurpsLanguage,
  GurpsMelee,
  GurpsRanged,
  GurpsReactionMod,
  GurpsSkill,
  GurpsTrait,
};
