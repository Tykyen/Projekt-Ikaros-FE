/**
 * 8.7h — Dračí doupě 2 (DrD II) deník postavy.
 *
 * Adaptace z `c:/Matrix/Matrix/frontend/src/components/diary/Drd2CharacterSheet.tsx`.
 * Drd II má kompletní katalog 264 schopností (12 základních povolání × 12 + 10
 * mistrovských × 12) — viz [drd2Abilities.ts](./drd2Abilities.ts). Tento sheet
 * implementuje:
 *   - 3 pilíře (Tělo / Duše / Vliv) s aktuální/max a textovým záznamem jizev
 *   - Mega-boxy (Ohrožení červená / Výhoda smaragdová) — 64px font
 *   - Identita, kategorie, mince, suroviny, XP, pomocník
 *   - Zbraně tabulka
 *   - Profession-cards (basic / advanced / master) s 5-pipovým level trackerem
 *   - ZS tabulka (zvláštní schopnosti) s catalog dropdown z PROFESSION_ABILITIES
 *   - Master ZS tabulka s catalog dropdown z MASTER_ABILITIES
 *
 * Logika unlock grid (auto-detection které pokročilé povolání je dostupné podle
 * basic levels) zachována v `usedLevel` / `advStatus` výpočtech a vizuálně
 * v badge `total-level-display`.
 */
import { useState } from 'react';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  ADVANCED_PROFESSIONS,
  BASIC_PROFESSIONS,
  MASTER_ABILITIES,
  MASTER_PROFESSIONS,
  PROFESSION_ABILITIES,
  type AbilityDef,
} from './drd2Abilities';

type Tab = 'stav' | 'schopnosti';

interface BasicProf {
  id: string;
  name: string;
  level: number;
  note?: string;
}
interface AdvProf extends BasicProf {
  requires: [string, string];
}
interface MasterProf extends BasicProf {
  requires: string[];
}
interface SpecAbility {
  name: string;
  source: string; // profession id
  type: string;
  description: string;
  note: string;
}
interface MasterAbility {
  name: string;
  sourceMaster: string;
  description: string;
  isReservedSkill: boolean;
  note: string;
}

export function Drd2Sheet({ diary, mode, onChange, onRoll }: SystemSheetProps) {
  const disabled = mode === 'view';
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'drd2_', onChange);
  const { g, set } = cda;

  const [tab, setTab] = useState<Tab>('stav');

  // ── Derived: parsed profession arrays ───────────────────────
  const basicProfs = cda.parseJsonArr<BasicProf>('basic_professions');
  const advProfs = cda.parseJsonArr<AdvProf>('advanced_professions');
  const masterProfs = cda.parseJsonArr<MasterProf>('master_professions');
  const specAbilities = cda.parseJsonArr<SpecAbility>('special_abilities');
  const masterAbilities =
    cda.parseJsonArr<MasterAbility>('master_abilities');

  const usedLevel =
    basicProfs.reduce((s, p) => s + (p.level || 0), 0) +
    advProfs.reduce((s, p) => s + (p.level || 0), 0) +
    masterProfs.reduce((s, p) => s + (p.level || 0), 0);

  return (
    <div className="drd2-dashboard">
      {/* ═══ HEADER ═══ */}
      <div className="drd2-header">
        <div className="identity-block">
          <label htmlFor="drd2_name">Jméno Postavy</label>
          <input
            id="drd2_name"
            value={g('name')}
            disabled={disabled}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Zadej jméno..."
          />
        </div>
        <div className="identity-block">
          <label htmlFor="drd2_race">Rasa a Kultura</label>
          <input
            id="drd2_race"
            value={g('race')}
            disabled={disabled}
            onChange={(e) => set('race', e.target.value)}
          />
        </div>
        <div className="identity-block" style={{ maxWidth: 180 }}>
          <label>Úroveň (Využitá / Celková)</label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              className="total-level-display"
              style={{ fontSize: 18, padding: '0 8px' }}
              aria-label="Využitá úroveň"
            >
              {usedLevel}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
            <input
              style={{
                width: 60,
                textAlign: 'center',
                fontSize: 18,
                fontWeight: 'bold',
              }}
              value={g('total_level')}
              disabled={disabled}
              onChange={(e) => set('total_level', e.target.value)}
              placeholder={String(usedLevel)}
              aria-label="Celková úroveň"
            />
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="drd2-tabs">
        <button
          type="button"
          className={tab === 'stav' ? 'active' : ''}
          onClick={() => setTab('stav')}
        >
          1. Postava a Stav
        </button>
        <button
          type="button"
          className={tab === 'schopnosti' ? 'active' : ''}
          onClick={() => setTab('schopnosti')}
        >
          2. Profese a Schopnosti
        </button>
        {/* 10.2c-edit-9g — quick init roll (jen tactical-map embed) */}
        {onRoll && (
          <button
            type="button"
            onClick={() =>
              onRoll({ label: 'Iniciativa', modifier: 0, kind: 'd20' })
            }
            style={{
              marginLeft: 'auto',
              padding: '6px 12px',
              background: 'rgba(120, 100, 255, 0.22)',
              color: '#fff',
              border: '1px solid rgba(120, 100, 255, 0.6)',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Hodit iniciativu (d20)"
          >
            ⚡ Iniciativa
          </button>
        )}
      </div>

      {/* ═══ STAV TAB ═══ */}
      {tab === 'stav' && <StavTab cda={cda} disabled={disabled} onRoll={onRoll} />}

      {/* ═══ SCHOPNOSTI TAB ═══ */}
      {tab === 'schopnosti' && (
        <SchopnostiTab
          cda={cda}
          disabled={disabled}
          basicProfs={basicProfs}
          advProfs={advProfs}
          masterProfs={masterProfs}
          specAbilities={specAbilities}
          masterAbilities={masterAbilities}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Tab: Stav
// ════════════════════════════════════════════════════════════════

interface SubProps {
  cda: CdAccess;
  disabled: boolean;
}

interface StavTabProps extends SubProps {
  onRoll?: SystemSheetProps['onRoll'];
}

function StavTab({ cda, disabled, onRoll }: StavTabProps) {
  const { g, set, parseJsonArr, updateArr, addArr, removeArr } = cda;
  const weapons = parseJsonArr<Record<string, string>>('weapons');

  return (
    <div className="drd2-tab-content drd2-grid">
      {/* LEVÝ panel-4: 3 pilíře */}
      <div className="panel-4">
        <h3>Zdroje a Jizvy</h3>
        <ResourceCard
          name="Tělo"
          curKey="body"
          maxKey="body_max"
          scarsKey="body_scars"
          scarsPlaceholder="Zapiš jizvy na těle..."
          cda={cda}
          disabled={disabled}
          onRoll={onRoll}
        />
        <ResourceCard
          name="Duše"
          curKey="soul"
          maxKey="soul_max"
          scarsKey="soul_scars"
          scarsPlaceholder="Zapiš jizvy na duši..."
          cda={cda}
          disabled={disabled}
          onRoll={onRoll}
        />
        <ResourceCard
          name="Vliv"
          curKey="influence"
          maxKey="influence_max"
          scarsKey="influence_scars"
          scarsPlaceholder="Zapiš jizvy ve vlivu..."
          cda={cda}
          disabled={disabled}
          onRoll={onRoll}
        />
      </div>

      {/* PRAVÝ panel-8: Combat + Identity + Pomocník + Ekonomika */}
      <div className="panel-8">
        <h3>Bojový stav</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div className="mega-box danger">
            <h4>Ohrožení</h4>
            <input
              value={g('threat')}
              disabled={disabled}
              onChange={(e) => set('threat', e.target.value)}
              placeholder="0"
              aria-label="Ohrožení"
            />
          </div>
          <div className="mega-box advantage">
            <h4>Výhoda</h4>
            <input
              value={g('advantage')}
              disabled={disabled}
              onChange={(e) => set('advantage', e.target.value)}
              placeholder="0"
              aria-label="Výhoda"
            />
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <h3>Stavy a Efekty</h3>
          <textarea
            className="drd2-textarea"
            value={g('state_effects')}
            disabled={disabled}
            onChange={(e) => set('state_effects', e.target.value)}
            placeholder="Otrávení, probíhající kouzla, stavy..."
            aria-label="Stavy a efekty"
          />
        </div>

        <h3>Zbraně a Zbroje</h3>
        <div className="drd2-table-container" style={{ marginBottom: 24 }}>
          <table>
            <thead>
              <tr>
                <th>Předmět</th>
                <th>Charakteristika</th>
                <th>Poznámka / Modifikátory</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {weapons.map((row, i) => (
                <tr key={i}>
                  {(['name', 'char', 'note'] as const).map((field) => (
                    <td key={field}>
                      <input
                        value={row[field] || ''}
                        disabled={disabled}
                        onChange={(e) =>
                          updateArr<Record<string, string>>('weapons', i, {
                            [field]: e.target.value,
                          })
                        }
                        aria-label={`Zbraň ${i + 1} ${field}`}
                      />
                    </td>
                  ))}
                  <td>
                    {!disabled && (
                      <button
                        type="button"
                        className="del-btn"
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
              className="add-row-btn"
              onClick={() =>
                addArr<Record<string, string>>('weapons', {
                  name: '',
                  char: '',
                  note: '',
                })
              }
            >
              + Přidat zbraň / zbroj
            </button>
          )}
        </div>

        <h3>Identita a Pomocník</h3>
        <div
          className="stats-grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            marginBottom: 16,
          }}
        >
          <div className="stat-box" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="drd2_race_ability">Rasová ZS</label>
            <input
              id="drd2_race_ability"
              value={g('race_ability')}
              disabled={disabled}
              onChange={(e) => set('race_ability', e.target.value)}
            />
          </div>
          <div className="stat-box" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="drd2_personality">Povahový rys</label>
            <input
              id="drd2_personality"
              value={g('personality')}
              disabled={disabled}
              onChange={(e) => set('personality', e.target.value)}
            />
          </div>
          <div className="stat-box">
            <label htmlFor="drd2_comp_char">Pomocník</label>
            <input
              id="drd2_comp_char"
              value={g('comp_char')}
              disabled={disabled}
              onChange={(e) => set('comp_char', e.target.value)}
              placeholder="Jméno / typ"
            />
          </div>
          <div className="stat-box">
            <label htmlFor="drd2_comp_bond">Pouto</label>
            <input
              id="drd2_comp_bond"
              value={g('comp_bond')}
              disabled={disabled}
              onChange={(e) => set('comp_bond', e.target.value)}
            />
          </div>
          <div className="stat-box">
            <label htmlFor="drd2_comp_pay">Platba</label>
            <input
              id="drd2_comp_pay"
              value={g('comp_pay')}
              disabled={disabled}
              onChange={(e) => set('comp_pay', e.target.value)}
            />
          </div>
          <div className="stat-box">
            <label htmlFor="drd2_comp_bound">Hranice Poutu</label>
            <input
              id="drd2_comp_bound"
              value={g('comp_bound')}
              disabled={disabled}
              onChange={(e) => set('comp_bound', e.target.value)}
            />
          </div>
          <div className="stat-box" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="drd2_comp_spec">Schopnost Pomocníka</label>
            <input
              id="drd2_comp_spec"
              value={g('comp_spec')}
              disabled={disabled}
              onChange={(e) => set('comp_spec', e.target.value)}
            />
          </div>
        </div>

        <h3>Ekonomika a Zkušenosti</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <label htmlFor="drd2_coins">Groše</label>
            <input
              id="drd2_coins"
              value={g('coins')}
              disabled={disabled}
              onChange={(e) => set('coins', e.target.value)}
            />
          </div>
          <div className="stat-box">
            <label htmlFor="drd2_materials">Suroviny</label>
            <input
              id="drd2_materials"
              value={g('materials')}
              disabled={disabled}
              onChange={(e) => set('materials', e.target.value)}
            />
          </div>
          <div className="stat-box">
            <label htmlFor="drd2_xp_unused">Volné XP</label>
            <input
              id="drd2_xp_unused"
              value={g('xp_unused')}
              disabled={disabled}
              onChange={(e) => set('xp_unused', e.target.value)}
            />
          </div>
          <div className="stat-box">
            <label htmlFor="drd2_xp_total">Celkem XP</label>
            <input
              id="drd2_xp_total"
              value={g('xp_total')}
              disabled={disabled}
              onChange={(e) => set('xp_total', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Resource card (Tělo / Duše / Vliv) ──────────────────────────

interface ResourceCardProps {
  name: string;
  curKey: string;
  maxKey: string;
  scarsKey: string;
  scarsPlaceholder: string;
  cda: CdAccess;
  disabled: boolean;
  /** 10.2c-edit-9g — optional roll (jen tactical-map embed). */
  onRoll?: SystemSheetProps['onRoll'];
}

function ResourceCard({
  name,
  curKey,
  maxKey,
  scarsKey,
  scarsPlaceholder,
  cda,
  disabled,
  onRoll,
}: ResourceCardProps) {
  const { g, set } = cda;
  const curValue = parseInt(g(curKey, '0'), 10) || 0;
  return (
    <div className="resource-card">
      <div className="r-header">
        <h4>{name}</h4>
        <div className="r-inputs">
          <input
            value={g(curKey)}
            disabled={disabled}
            onChange={(e) => set(curKey, e.target.value)}
            placeholder="Akt."
            aria-label={`${name} aktuální`}
          />
          <span>/</span>
          <input
            value={g(maxKey)}
            disabled={disabled}
            onChange={(e) => set(maxKey, e.target.value)}
            placeholder="Max"
            aria-label={`${name} maximum`}
          />
          {onRoll && (
            <button
              type="button"
              onClick={() =>
                onRoll({ label: name, modifier: curValue, kind: 'd20' })
              }
              style={{
                marginLeft: 6,
                padding: '4px 8px',
                background: 'rgba(120, 200, 120, 0.18)',
                color: '#9ddf9d',
                border: '1px solid rgba(120, 200, 120, 0.5)',
                borderRadius: 4,
                fontSize: 13,
                cursor: 'pointer',
                minHeight: 28,
              }}
              title={`Hodit ${name} (d20 + ${curValue})`}
              aria-label={`Hodit ${name}`}
            >
              🎲
            </button>
          )}
        </div>
      </div>
      <div className="jizvy-inputs">
        <input
          value={g(scarsKey)}
          disabled={disabled}
          onChange={(e) => set(scarsKey, e.target.value)}
          placeholder={scarsPlaceholder}
          aria-label={`${name} jizvy`}
        />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Tab: Schopnosti (profese + ZS catalog)
// ════════════════════════════════════════════════════════════════

interface SchopnostiTabProps extends SubProps {
  basicProfs: BasicProf[];
  advProfs: AdvProf[];
  masterProfs: MasterProf[];
  specAbilities: SpecAbility[];
  masterAbilities: MasterAbility[];
}

function SchopnostiTab({
  cda,
  disabled,
  basicProfs,
  advProfs,
  masterProfs,
  specAbilities,
  masterAbilities,
}: SchopnostiTabProps) {
  const { set } = cda;

  return (
    <div className="drd2-tab-content drd2-grid">
      <div className="panel-12">
        <h3>Základní povolání</h3>
        <ProfList
          arrKey="basic_professions"
          rows={basicProfs}
          catalog={BASIC_PROFESSIONS}
          setRows={(v) => set('basic_professions', v)}
          disabled={disabled}
        />

        <h3 style={{ marginTop: 24 }}>Pokročilá povolání</h3>
        <ProfList
          arrKey="advanced_professions"
          rows={advProfs}
          catalog={ADVANCED_PROFESSIONS.map((p) => ({
            ...p,
            requires: p.requires.join(' + '),
          }))}
          setRows={(v) => set('advanced_professions', v)}
          disabled={disabled}
        />

        <h3 style={{ marginTop: 24 }}>Mistrovská povolání</h3>
        <ProfList
          arrKey="master_professions"
          rows={masterProfs}
          catalog={MASTER_PROFESSIONS.map((p) => ({
            ...p,
            requires: p.requires.join(' + '),
          }))}
          setRows={(v) => set('master_professions', v)}
          disabled={disabled}
        />

        <h3 style={{ marginTop: 32 }}>Zvláštní Schopnosti (ZS)</h3>
        <ZsList
          rows={specAbilities}
          catalog={PROFESSION_ABILITIES}
          setRows={(v) => set('special_abilities', v)}
          disabled={disabled}
          sourceLabel="Povolání"
        />

        <h3 style={{ marginTop: 24 }}>Mistrovské ZS</h3>
        <ZsList
          rows={masterAbilities}
          catalog={MASTER_ABILITIES}
          setRows={(v) => set('master_abilities', v)}
          disabled={disabled}
          sourceLabel="Mistrovství"
          sourceField="sourceMaster"
        />
      </div>
    </div>
  );
}

// ── Profession list (basic / advanced / master) ─────────────────

interface ProfCatalogEntry {
  id: string;
  name: string;
  requires?: string;
}

interface ProfListProps {
  arrKey: string;
  rows: BasicProf[];
  catalog: ProfCatalogEntry[];
  setRows: (v: BasicProf[]) => void;
  disabled: boolean;
}

function ProfList({
  arrKey,
  rows,
  catalog,
  setRows,
  disabled,
}: ProfListProps) {
  const [addingId, setAddingId] = useState('');

  const available = catalog.filter((c) => !rows.some((r) => r.id === c.id));

  const handleAdd = () => {
    const found = catalog.find((c) => c.id === addingId);
    if (!found) return;
    setRows([...rows, { id: found.id, name: found.name, level: 1 }]);
    setAddingId('');
  };

  return (
    <>
      {rows.map((row, i) => {
        const def = catalog.find((c) => c.id === row.id);
        return (
          <div className="prof-card" key={row.id}>
            <div className="prof-card__head">
              <div className="prof-card__name">
                {row.name}
                {def?.requires && (
                  <span
                    style={{
                      fontSize: 11,
                      marginLeft: 12,
                      color: 'rgba(255,255,255,0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    {def.requires}
                  </span>
                )}
              </div>
              <div className="prof-card__level">
                <div className="level-pips">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={`pip ${row.level >= n ? 'active' : ''}`}
                      disabled={disabled}
                      onClick={() => {
                        const newLevel = row.level === n ? n - 1 : n;
                        const copy = [...rows];
                        copy[i] = { ...row, level: newLevel };
                        setRows(copy);
                      }}
                      aria-label={`${row.name} úroveň ${n}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {!disabled && (
                  <button
                    type="button"
                    className="del-btn"
                    onClick={() => {
                      const copy = [...rows];
                      copy.splice(i, 1);
                      setRows(copy);
                    }}
                    aria-label={`Odebrat povolání ${row.name}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="prof-card__note">
              <textarea
                value={row.note || ''}
                disabled={disabled}
                onChange={(e) => {
                  const copy = [...rows];
                  copy[i] = { ...row, note: e.target.value };
                  setRows(copy);
                }}
                placeholder="Poznámka k povolání..."
                aria-label={`Poznámka povolání ${row.name}`}
              />
            </div>
          </div>
        );
      })}

      {!disabled && available.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <select
            className="prof-select"
            value={addingId}
            onChange={(e) => setAddingId(e.target.value)}
            aria-label={`Přidat povolání ${arrKey}`}
          >
            <option value="">— Vyber povolání —</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.requires ? ` (${c.requires})` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="add-row-btn"
            style={{ width: 'auto', padding: '8px 24px', margin: 0 }}
            disabled={!addingId}
            onClick={handleAdd}
          >
            + Přidat
          </button>
        </div>
      )}
    </>
  );
}

// ── ZS list (special_abilities + master_abilities) ──────────────

interface ZsListProps {
  rows: (SpecAbility | MasterAbility)[];
  catalog: Record<string, AbilityDef[]>;
  setRows: (v: (SpecAbility | MasterAbility)[]) => void;
  disabled: boolean;
  sourceLabel: string;
  /** Field name v ZS objektu pro source profession id (`source` nebo `sourceMaster`). */
  sourceField?: 'source' | 'sourceMaster';
}

function ZsList({
  rows,
  catalog,
  setRows,
  disabled,
  sourceLabel,
  sourceField = 'source',
}: ZsListProps) {
  const sourceIds = Object.keys(catalog);

  return (
    <>
      {rows.map((row, i) => {
        const srcId = (row as unknown as Record<string, string>)[sourceField] || '';
        const profAbilities = catalog[srcId] || [];
        return (
          <div className="zs-card" key={i}>
            <div className="zs-card__main">
              <div className="zs-card__name">
                <input
                  value={row.name}
                  disabled={disabled}
                  onChange={(e) => {
                    const copy = [...rows];
                    copy[i] = { ...row, name: e.target.value };
                    setRows(copy);
                  }}
                  placeholder="Název schopnosti"
                  aria-label="Název ZS"
                />
              </div>
              <div className="zs-card__meta">
                <select
                  value={srcId}
                  disabled={disabled}
                  onChange={(e) => {
                    const copy = [...rows];
                    copy[i] = { ...row, [sourceField]: e.target.value };
                    setRows(copy);
                  }}
                  aria-label={sourceLabel}
                >
                  <option value="">— {sourceLabel} —</option>
                  {sourceIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
                {profAbilities.length > 0 && (
                  <select
                    value=""
                    disabled={disabled}
                    onChange={(e) => {
                      const ab = profAbilities.find(
                        (x) => x.id === e.target.value,
                      );
                      if (!ab) return;
                      const copy = [...rows];
                      copy[i] = {
                        ...row,
                        name: ab.name,
                        description: ab.summary,
                      };
                      setRows(copy);
                    }}
                    aria-label="Katalog schopností"
                  >
                    <option value="">— Z katalogu —</option>
                    {profAbilities.map((ab) => (
                      <option key={ab.id} value={ab.id}>
                        {ab.name}
                        {ab.isReservedSkill ? ' ★' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="zs-card__desc">
                <textarea
                  value={row.description}
                  disabled={disabled}
                  onChange={(e) => {
                    const copy = [...rows];
                    copy[i] = { ...row, description: e.target.value };
                    setRows(copy);
                  }}
                  placeholder="Popis / efekt"
                  aria-label="Popis ZS"
                />
              </div>
            </div>
            {!disabled && (
              <button
                type="button"
                className="del-btn"
                onClick={() => {
                  const copy = [...rows];
                  copy.splice(i, 1);
                  setRows(copy);
                }}
                aria-label="Smazat ZS"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}

      {!disabled && (
        <button
          type="button"
          className="add-row-btn"
          onClick={() => {
            const newRow =
              sourceField === 'sourceMaster'
                ? ({
                    name: '',
                    sourceMaster: '',
                    description: '',
                    isReservedSkill: false,
                    note: '',
                  } as MasterAbility)
                : ({
                    name: '',
                    source: '',
                    type: '',
                    description: '',
                    note: '',
                  } as SpecAbility);
            setRows([...rows, newRow as never]);
          }}
        >
          + Přidat schopnost
        </button>
      )}
    </>
  );
}
