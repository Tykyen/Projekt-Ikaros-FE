/**
 * 8.7d — D&D 5e deník postavy.
 *
 * Adaptováno z `c:/Matrix/Matrix/frontend/src/components/diary/DndCharacterSheet.tsx`
 * (451 ř). Save delegujeme parentu; `onSave` prop nemá.
 * Data v `diary.customData` s prefixem `dnd_*` (1:1 vůči legacy).
 */
import { useState } from 'react';
import { usePrintMode } from '@/features/world/export/print';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import { SheetInitiativeButton } from '../../_shared/SheetInitiativeButton';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  DND_HEADER_FIELDS,
  DND_PERSONALITY_FIELDS,
  SKILLS,
  type AbilityKey,
  type DndAttack,
  type DndSpellLevel,
  type DndSpellEntry,
} from './constants';
import { abilityMod, calcSaveMod, calcSkillMod, fmtMod } from './formulas';

type Tab = 'main' | 'spells';

const DEFAULT_SPELL_LEVEL: DndSpellLevel = {
  totalSlots: 0,
  usedSlots: 0,
  spells: [],
};

export function DndSheet({ diary, mode, onChange, onRoll }: SystemSheetProps) {
  const disabled = mode === 'view';
  const printMode = usePrintMode();
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'dnd_', onChange);
  const { g, set, parseJsonArr } = cda;

  const [tab, setTab] = useState<Tab>('main');

  // ── Derived ─────────────────────────────────────────────────
  const profBonus = parseInt(g('profBonus', '2'), 10) || 2;

  const getScore = (k: AbilityKey) =>
    parseInt(g(`ability_${k}`, '10'), 10) || 10;
  const getAbilityModFor = (k: AbilityKey) => abilityMod(getScore(k));

  const isSaveProf = (k: AbilityKey) => g(`save_prof_${k}`) === '1';
  const saveModFor = (k: AbilityKey) =>
    calcSaveMod(getAbilityModFor(k), isSaveProf(k), profBonus);

  const skillProfFor = (name: string) =>
    parseInt(g(`skill_prof_${name}`, '0'), 10) || 0;
  const skillModFor = (name: string, ability: AbilityKey) =>
    calcSkillMod(getAbilityModFor(ability), skillProfFor(name), profBonus);

  const spellEnabled = g('spellEnabled') === '1';

  // ── Attacks ─────────────────────────────────────────────────
  const attacks = parseJsonArr<DndAttack>('attacks');
  const setAttacks = (arr: DndAttack[]) =>
    set('attacks', JSON.stringify(arr));

  // ── Spell data ──────────────────────────────────────────────
  const getSpellLevel = (lvl: number): DndSpellLevel => {
    const raw = g(`spellLevel_${lvl}`);
    if (!raw) return { ...DEFAULT_SPELL_LEVEL, spells: [] };
    try {
      const parsed = JSON.parse(raw);
      return {
        totalSlots: parsed.totalSlots ?? 0,
        usedSlots: parsed.usedSlots ?? 0,
        spells: Array.isArray(parsed.spells) ? parsed.spells : [],
      };
    } catch {
      return { ...DEFAULT_SPELL_LEVEL, spells: [] };
    }
  };
  const setSpellLevel = (lvl: number, data: DndSpellLevel) =>
    set(`spellLevel_${lvl}`, JSON.stringify(data));

  const cantrips = parseJsonArr<string>('cantrips');
  const setCantrips = (arr: string[]) =>
    set('cantrips', JSON.stringify(arr));

  // ── Death saves ─────────────────────────────────────────────
  const deathSuccess = parseInt(g('deathSuccess', '0'), 10) || 0;
  const deathFail = parseInt(g('deathFail', '0'), 10) || 0;

  // Tisk: interaktivní sheet (inputy/pips/checkboxy) je netisknutelný —
  // hodnoty jsou v `<input value>`, prof/death stav v barvě. V printMode
  // vyrenderujeme oddělený statický čitelný dokument (viz vzor MatrixPrintView).
  if (printMode) return <DndPrintView cda={cda} />;

  return (
    <div className="dnd-diary">
      {onRoll && <SheetInitiativeButton onRoll={onRoll} kind="d20" />}
      {/* ── Tabs ── */}
      <div className="dnd-tabs">
        <button
          type="button"
          className={`dnd-tab ${tab === 'main' ? 'active' : ''}`}
          onClick={() => setTab('main')}
        >
          📜 Hlavní deník
        </button>
        {spellEnabled && (
          <button
            type="button"
            className={`dnd-tab ${tab === 'spells' ? 'active' : ''}`}
            onClick={() => setTab('spells')}
          >
            ✨ Sesílání kouzel
          </button>
        )}
        <label className="dnd-tab dnd-tab--toggle">
          <input
            type="checkbox"
            checked={spellEnabled}
            disabled={disabled}
            onChange={(e) =>
              set('spellEnabled', e.target.checked ? '1' : '0')
            }
          />
          Sesilatel kouzel
        </label>
      </div>

      {tab === 'main' && (
        <div className="dnd-main">
          {/* ═══ HEADER ═══ */}
          <section className="dnd-header">
            <div className="dnd-header__name">
              <label htmlFor="dnd_charName">Jméno postavy</label>
              <input
                id="dnd_charName"
                value={g('charName')}
                disabled={disabled}
                onChange={(e) => set('charName', e.target.value)}
                placeholder="Jméno"
              />
            </div>
            <div className="dnd-header__fields">
              {DND_HEADER_FIELDS.map((f) => (
                <div key={f.key} className="dnd-hf">
                  <label htmlFor={`dnd_${f.key}`}>{f.label}</label>
                  <input
                    id={`dnd_${f.key}`}
                    value={g(f.key)}
                    disabled={disabled}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ═══ MAIN GRID ═══ */}
          <div className="dnd-grid">
            {/* ── LEFT COLUMN ── */}
            <div className="dnd-col-left">
              {/* B. Abilities */}
              <div className="dnd-abilities">
                {ABILITY_KEYS.map((k) => {
                  const score = getScore(k);
                  const mod = abilityMod(score);
                  return (
                    <div className="dnd-ability" key={k}>
                      <span className="dnd-ability__label">
                        {ABILITY_LABELS[k]}
                      </span>
                      <span className="dnd-ability__mod">{fmtMod(mod)}</span>
                      <input
                        className="dnd-ability__score"
                        type="number"
                        value={score}
                        disabled={disabled}
                        onChange={(e) =>
                          set(`ability_${k}`, e.target.value)
                        }
                        aria-label={`${ABILITY_LABELS[k]} skóre`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* C. Inspiration & Prof bonus */}
              <div className="dnd-meta-row">
                <div className="dnd-meta-item">
                  <label className="dnd-meta-item__checkbox-label">
                    <input
                      type="checkbox"
                      checked={g('inspiration') === '1'}
                      disabled={disabled}
                      onChange={(e) =>
                        set('inspiration', e.target.checked ? '1' : '0')
                      }
                    />
                    Inspirace
                  </label>
                </div>
                <div className="dnd-meta-item">
                  <span className="dnd-meta-item__label">Zdatnostní bonus</span>
                  <input
                    className="dnd-meta-item__input"
                    type="number"
                    value={profBonus}
                    disabled={disabled}
                    onChange={(e) => set('profBonus', e.target.value)}
                    aria-label="Zdatnostní bonus"
                  />
                </div>
              </div>

              {/* D. Saves */}
              <div className="dnd-panel dnd-saves">
                <h3>Záchranné hody</h3>
                {ABILITY_KEYS.map((k) => (
                  <div className="dnd-save-row" key={k}>
                    <label className="dnd-save-row__prof">
                      <input
                        type="checkbox"
                        checked={isSaveProf(k)}
                        disabled={disabled}
                        onChange={(e) =>
                          set(`save_prof_${k}`, e.target.checked ? '1' : '0')
                        }
                        aria-label={`Záchrana ${ABILITY_LABELS[k]}: zdatnost`}
                      />
                    </label>
                    <span className="dnd-save-row__mod">
                      {fmtMod(saveModFor(k))}
                    </span>
                    <span className="dnd-save-row__name">
                      {ABILITY_LABELS[k]}
                    </span>
                  </div>
                ))}
              </div>

              {/* E. Skills */}
              <div className="dnd-panel dnd-skills">
                <h3>Dovednosti</h3>
                {SKILLS.map((sk) => {
                  const prof = skillProfFor(sk.name);
                  const mod = skillModFor(sk.name, sk.ability);
                  return (
                    <div className="dnd-skill-row" key={sk.name}>
                      <button
                        type="button"
                        className={`dnd-skill-row__prof ${prof === 1 ? 'half' : ''} ${prof === 2 ? 'full' : ''}`}
                        disabled={disabled}
                        onClick={() => {
                          const next = (prof + 1) % 3;
                          set(`skill_prof_${sk.name}`, String(next));
                        }}
                        title={
                          prof === 0
                            ? 'Bez zdatnosti'
                            : prof === 1
                              ? 'Zdatnost'
                              : 'Expertíza'
                        }
                        aria-label={`Dovednost ${sk.name}: ${prof === 0 ? 'žádná' : prof === 1 ? 'zdatnost' : 'expertíza'}`}
                      >
                        {prof === 0 ? '○' : prof === 1 ? '●' : '◉'}
                      </button>
                      <span className="dnd-skill-row__mod">{fmtMod(mod)}</span>
                      <span className="dnd-skill-row__name">{sk.name}</span>
                      <span className="dnd-skill-row__ability">
                        ({ABILITY_LABELS[sk.ability].slice(0, 3)})
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* F. Passive Wisdom */}
              <div className="dnd-passive">
                <span className="dnd-passive__val">
                  {10 + skillModFor('Vnímání', 'wis')}
                </span>
                <span className="dnd-passive__label">
                  Pasivní vnímání (Moudrost)
                </span>
              </div>
            </div>

            {/* ── CENTER COLUMN ── */}
            <div className="dnd-col-center">
              {/* G. Combat */}
              <div className="dnd-combat">
                <div className="dnd-combat__stat">
                  <span className="dnd-combat__label">OČ</span>
                  <input
                    className="dnd-combat__val"
                    type="number"
                    value={g('ac', '10')}
                    disabled={disabled}
                    onChange={(e) => set('ac', e.target.value)}
                    aria-label="Obranné číslo"
                  />
                </div>
                <div className="dnd-combat__stat">
                  <span className="dnd-combat__label">Iniciativa</span>
                  <span className="dnd-combat__val dnd-combat__val--computed">
                    {fmtMod(getAbilityModFor('dex'))}
                  </span>
                </div>
                <div className="dnd-combat__stat">
                  <span className="dnd-combat__label">Rychlost</span>
                  <input
                    className="dnd-combat__val"
                    value={g('speed', '9 m')}
                    disabled={disabled}
                    onChange={(e) => set('speed', e.target.value)}
                    aria-label="Rychlost"
                  />
                </div>
              </div>

              {/* H. Hit Points */}
              <div className="dnd-hp">
                <div className="dnd-hp__row">
                  <div className="dnd-hp__block">
                    <label htmlFor="dnd_maxHP">Maximum životů</label>
                    <input
                      id="dnd_maxHP"
                      type="number"
                      value={g('maxHP', '0')}
                      disabled={disabled}
                      onChange={(e) => set('maxHP', e.target.value)}
                    />
                  </div>
                  <div className="dnd-hp__block dnd-hp__block--current">
                    <label htmlFor="dnd_currentHP">Aktuální životy</label>
                    <input
                      id="dnd_currentHP"
                      type="number"
                      value={g('currentHP', '0')}
                      disabled={disabled}
                      onChange={(e) => set('currentHP', e.target.value)}
                    />
                  </div>
                </div>
                <div className="dnd-hp__block dnd-hp__block--temp">
                  <label htmlFor="dnd_tempHP">Dočasné životy</label>
                  <input
                    id="dnd_tempHP"
                    type="number"
                    value={g('tempHP', '0')}
                    disabled={disabled}
                    onChange={(e) => set('tempHP', e.target.value)}
                  />
                </div>
              </div>

              {/* I. Hit Dice & Death Saves */}
              <div className="dnd-death-row">
                <div className="dnd-hitdice">
                  <label htmlFor="dnd_hitDice">Kostky životů</label>
                  <input
                    id="dnd_hitDice"
                    value={g('hitDice')}
                    disabled={disabled}
                    onChange={(e) => set('hitDice', e.target.value)}
                    placeholder="např. 3k10"
                  />
                </div>
                <div className="dnd-death-saves">
                  <span className="dnd-death-saves__title">
                    Záchrany proti smrti
                  </span>
                  <div className="dnd-death-saves__line">
                    <span>Úspěchy</span>
                    <div className="dnd-death-pips">
                      {[1, 2, 3].map((i) => (
                        <button
                          type="button"
                          key={`s${i}`}
                          className={`dnd-pip ${deathSuccess >= i ? 'filled' : ''}`}
                          disabled={disabled}
                          onClick={() =>
                            set(
                              'deathSuccess',
                              String(deathSuccess >= i ? i - 1 : i),
                            )
                          }
                          aria-label={`Úspěch ${i} z 3`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="dnd-death-saves__line">
                    <span>Neúspěchy</span>
                    <div className="dnd-death-pips">
                      {[1, 2, 3].map((i) => (
                        <button
                          type="button"
                          key={`f${i}`}
                          className={`dnd-pip fail ${deathFail >= i ? 'filled' : ''}`}
                          disabled={disabled}
                          onClick={() =>
                            set(
                              'deathFail',
                              String(deathFail >= i ? i - 1 : i),
                            )
                          }
                          aria-label={`Neúspěch ${i} z 3`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* J. Attacks */}
              <div className="dnd-panel dnd-attacks">
                <h3>Útoky a kouzla</h3>
                <table className="dnd-attacks__table">
                  <thead>
                    <tr>
                      <th>Jméno</th>
                      <th>Út. bonus</th>
                      <th>Zranění / typ</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {attacks.map((a, i) => (
                      <tr key={i}>
                        {(['name', 'bonus', 'damage'] as const).map(
                          (field) => (
                            <td key={field}>
                              <input
                                value={a[field]}
                                disabled={disabled}
                                onChange={(e) => {
                                  const u = [...attacks];
                                  u[i] = { ...u[i], [field]: e.target.value };
                                  setAttacks(u);
                                }}
                                aria-label={`Útok ${i + 1} — ${field}`}
                              />
                            </td>
                          ),
                        )}
                        <td>
                          {!disabled && (
                            <button
                              type="button"
                              className="dnd-x"
                              onClick={() => {
                                const u = [...attacks];
                                u.splice(i, 1);
                                setAttacks(u);
                              }}
                              aria-label="Smazat útok"
                            >
                              ×
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
                    className="dnd-add"
                    onClick={() =>
                      setAttacks([
                        ...attacks,
                        { name: '', bonus: '', damage: '' },
                      ])
                    }
                  >
                    + Přidat útok
                  </button>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="dnd-col-right">
              {/* K. Personality */}
              <div className="dnd-personality">
                {DND_PERSONALITY_FIELDS.map((f) => (
                  <div key={f.key} className="dnd-personality__block">
                    <label htmlFor={`dnd_${f.key}`}>{f.label}</label>
                    <textarea
                      id={`dnd_${f.key}`}
                      value={g(f.key)}
                      disabled={disabled}
                      onChange={(e) => set(f.key, e.target.value)}
                      rows={f.rows}
                    />
                  </div>
                ))}
              </div>

              {/* L. Other Proficiencies */}
              <div className="dnd-panel dnd-proficiencies">
                <h3>Ostatní zdatnosti a jazyky</h3>
                <textarea
                  value={g('otherProf')}
                  disabled={disabled}
                  onChange={(e) => set('otherProf', e.target.value)}
                  rows={6}
                  placeholder="Jazyky, nástroje, zbraně, zbroje..."
                  aria-label="Ostatní zdatnosti a jazyky"
                />
              </div>

              {/* M. Features */}
              <div className="dnd-panel dnd-features">
                <h3>Schopnosti a rysy</h3>
                <textarea
                  value={g('features')}
                  disabled={disabled}
                  onChange={(e) => set('features', e.target.value)}
                  rows={12}
                  placeholder="Rasové schopnosti, třídní rysy, zvláštní efekty..."
                  aria-label="Schopnosti a rysy"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SPELLS TAB ═══ */}
      {tab === 'spells' && spellEnabled && (
        <div className="dnd-spells">
          <div className="dnd-spells-header">
            <div className="dnd-sh-field">
              <label htmlFor="dnd_spellAbility">Sesílací vlastnost</label>
              <input
                id="dnd_spellAbility"
                value={g('spellAbility')}
                disabled={disabled}
                onChange={(e) => set('spellAbility', e.target.value)}
                placeholder="např. Moudrost"
              />
            </div>
            <div className="dnd-sh-field dnd-sh-field--accent">
              <label htmlFor="dnd_spellDC">SO záchrany kouzel</label>
              <input
                id="dnd_spellDC"
                type="number"
                value={g('spellDC', '0')}
                disabled={disabled}
                onChange={(e) => set('spellDC', e.target.value)}
              />
            </div>
            <div className="dnd-sh-field dnd-sh-field--accent">
              <label htmlFor="dnd_spellAttack">Útočný bonus kouzla</label>
              <input
                id="dnd_spellAttack"
                value={g('spellAttack', '0')}
                disabled={disabled}
                onChange={(e) => set('spellAttack', e.target.value)}
              />
            </div>
          </div>

          {/* Cantrips */}
          <div className="dnd-spell-level">
            <div className="dnd-spell-level__header">
              <h4>Triky</h4>
            </div>
            <div className="dnd-spell-list">
              {cantrips.map((c, i) => (
                <div className="dnd-spell-entry" key={i}>
                  <input
                    value={c}
                    disabled={disabled}
                    onChange={(e) => {
                      const u = [...cantrips];
                      u[i] = e.target.value;
                      setCantrips(u);
                    }}
                    placeholder="Název triku"
                    aria-label={`Trik ${i + 1}`}
                  />
                  {!disabled && (
                    <button
                      type="button"
                      className="dnd-x"
                      onClick={() => {
                        const u = [...cantrips];
                        u.splice(i, 1);
                        setCantrips(u);
                      }}
                      aria-label="Smazat trik"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {!disabled && (
                <button
                  type="button"
                  className="dnd-add"
                  onClick={() => setCantrips([...cantrips, ''])}
                >
                  + Přidat trik
                </button>
              )}
            </div>
          </div>

          {/* Spell levels 1-9 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
            const data = getSpellLevel(lvl);
            return (
              <div className="dnd-spell-level" key={lvl}>
                <div className="dnd-spell-level__header">
                  <h4>{lvl}. úroveň</h4>
                  <div className="dnd-slots">
                    <label>Sloty:</label>
                    <input
                      type="number"
                      className="dnd-slots__total"
                      min={0}
                      max={9}
                      value={data.totalSlots}
                      disabled={disabled}
                      onChange={(e) =>
                        setSpellLevel(lvl, {
                          ...data,
                          totalSlots: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      aria-label={`${lvl}. úroveň — celkem slotů`}
                    />
                    <div className="dnd-slots__pips">
                      {Array.from({ length: data.totalSlots }).map((_, i) => (
                        <button
                          type="button"
                          key={i}
                          className={`dnd-slot-pip ${i < data.usedSlots ? 'used' : ''}`}
                          disabled={disabled}
                          onClick={() =>
                            setSpellLevel(lvl, {
                              ...data,
                              usedSlots:
                                data.usedSlots === i + 1 ? i : i + 1,
                            })
                          }
                          aria-label={`Slot ${i + 1} ${i < data.usedSlots ? 'použit' : 'volný'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="dnd-spell-list">
                  {data.spells.map((sp, i) => (
                    <div className="dnd-spell-entry" key={i}>
                      <label className="dnd-spell-prepared">
                        <input
                          type="checkbox"
                          checked={sp.prepared}
                          disabled={disabled}
                          onChange={(e) => {
                            const u = { ...data, spells: [...data.spells] };
                            u.spells[i] = {
                              ...u.spells[i],
                              prepared: e.target.checked,
                            };
                            setSpellLevel(lvl, u);
                          }}
                          aria-label={`Kouzlo ${sp.name || i + 1} — připravené`}
                        />
                      </label>
                      <input
                        className="dnd-spell-name"
                        value={sp.name}
                        placeholder="Název kouzla"
                        disabled={disabled}
                        onChange={(e) => {
                          const u = { ...data, spells: [...data.spells] };
                          u.spells[i] = { ...u.spells[i], name: e.target.value };
                          setSpellLevel(lvl, u);
                        }}
                        aria-label={`Kouzlo ${i + 1} — název`}
                      />
                      <input
                        className="dnd-spell-note"
                        value={sp.note}
                        placeholder="Poznámka"
                        disabled={disabled}
                        onChange={(e) => {
                          const u = { ...data, spells: [...data.spells] };
                          u.spells[i] = { ...u.spells[i], note: e.target.value };
                          setSpellLevel(lvl, u);
                        }}
                        aria-label={`Kouzlo ${i + 1} — poznámka`}
                      />
                      {!disabled && (
                        <button
                          type="button"
                          className="dnd-x"
                          onClick={() => {
                            const u = { ...data, spells: [...data.spells] };
                            u.spells.splice(i, 1);
                            setSpellLevel(lvl, u);
                          }}
                          aria-label="Smazat kouzlo"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {!disabled && (
                    <button
                      type="button"
                      className="dnd-add"
                      onClick={() =>
                        setSpellLevel(lvl, {
                          ...data,
                          spells: [
                            ...data.spells,
                            { name: '', prepared: false, note: '' },
                          ],
                        })
                      }
                    >
                      + Přidat kouzlo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PRINT — statický čitelný dokument (čte stejná `dnd_*` data)
// ════════════════════════════════════════════════════════════════

/** Death save 0..3 jako ●●○ (vždy 3 znaky). */
function deathPips(val: number): string {
  const filled = Math.max(0, Math.min(3, val));
  return '●'.repeat(filled) + '○'.repeat(3 - filled);
}

/** Parsuje jednu spell level (stejně jako getSpellLevel ve sheetu). */
function parseSpellLevel(raw: string): DndSpellLevel {
  if (!raw) return { totalSlots: 0, usedSlots: 0, spells: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      totalSlots: parsed.totalSlots ?? 0,
      usedSlots: parsed.usedSlots ?? 0,
      spells: Array.isArray(parsed.spells) ? parsed.spells : [],
    };
  } catch {
    return { totalSlots: 0, usedSlots: 0, spells: [] };
  }
}

function DndPrintView({ cda }: { cda: CdAccess }) {
  const { g, parseJsonArr } = cda;

  // ── Derived (stejné formule jako interaktivní sheet) ──────────
  const profBonus = parseInt(g('profBonus', '2'), 10) || 2;
  const getScore = (k: AbilityKey) => parseInt(g(`ability_${k}`, '10'), 10) || 10;
  const getMod = (k: AbilityKey) => abilityMod(getScore(k));
  const isSaveProf = (k: AbilityKey) => g(`save_prof_${k}`) === '1';
  const skillProfFor = (name: string) =>
    parseInt(g(`skill_prof_${name}`, '0'), 10) || 0;

  const deathSuccess = parseInt(g('deathSuccess', '0'), 10) || 0;
  const deathFail = parseInt(g('deathFail', '0'), 10) || 0;

  const attacks = parseJsonArr<DndAttack>('attacks');
  const cantrips = parseJsonArr<string>('cantrips');
  const spellEnabled = g('spellEnabled') === '1';

  const passivePerception =
    10 +
    calcSkillMod(getMod('wis'), skillProfFor('Vnímání'), profBonus);

  const profWord = (lvl: number) =>
    lvl === 2 ? ' (expertíza)' : lvl === 1 ? ' (zdatnost)' : '';

  return (
    <div className="dnd-print">
      {/* ═══ Identita ═══ */}
      <dl>
        <div>
          <dt>Jméno postavy</dt>
          <dd>{g('charName') || '—'}</dd>
        </div>
        {DND_HEADER_FIELDS.map((f) => (
          <div key={f.key}>
            <dt>{f.label}</dt>
            <dd>{g(f.key) || '—'}</dd>
          </div>
        ))}
        <div>
          <dt>Inspirace</dt>
          <dd>{g('inspiration') === '1' ? '(ano)' : '(ne)'}</dd>
        </div>
        <div>
          <dt>Zdatnostní bonus</dt>
          <dd>{fmtMod(profBonus)}</dd>
        </div>
      </dl>

      {/* ═══ Vlastnosti ═══ */}
      <h3>Vlastnosti</h3>
      <ul className="matrix-print__plain">
        {ABILITY_KEYS.map((k) => (
          <li key={k} className="print-row">
            <span>{ABILITY_LABELS[k]}</span>
            <span>
              {getScore(k)} ({fmtMod(getMod(k))})
            </span>
          </li>
        ))}
      </ul>

      {/* ═══ Záchranné hody ═══ */}
      <h3>Záchranné hody</h3>
      <ul className="matrix-print__plain">
        {ABILITY_KEYS.map((k) => (
          <li key={k} className="print-row">
            <span>
              {ABILITY_LABELS[k]}
              {isSaveProf(k) ? ' (zdatnost)' : ''}
            </span>
            <span>
              {fmtMod(calcSaveMod(getMod(k), isSaveProf(k), profBonus))}
            </span>
          </li>
        ))}
      </ul>

      {/* ═══ Dovednosti ═══ */}
      <h3>Dovednosti</h3>
      <ul className="matrix-print__plain">
        {SKILLS.map((sk) => {
          const prof = skillProfFor(sk.name);
          const mod = calcSkillMod(getMod(sk.ability), prof, profBonus);
          return (
            <li key={sk.name} className="print-row">
              <span>
                {sk.name} ({ABILITY_LABELS[sk.ability].slice(0, 3)})
                {profWord(prof)}
              </span>
              <span>{fmtMod(mod)}</span>
            </li>
          );
        })}
        <li className="print-row">
          <span>Pasivní vnímání (Moudrost)</span>
          <span>{passivePerception}</span>
        </li>
      </ul>

      {/* ═══ Boj ═══ */}
      <h3>Boj</h3>
      <dl className="print-cols">
        <div>
          <dt>OČ</dt>
          <dd>{g('ac', '10')}</dd>
        </div>
        <div>
          <dt>Iniciativa</dt>
          <dd>{fmtMod(getMod('dex'))}</dd>
        </div>
        <div>
          <dt>Rychlost</dt>
          <dd>{g('speed', '9 m')}</dd>
        </div>
      </dl>

      {/* ═══ Životy ═══ */}
      <h3>Životy</h3>
      <dl className="print-cols">
        <div>
          <dt>Maximum</dt>
          <dd>{g('maxHP', '0')}</dd>
        </div>
        <div>
          <dt>Aktuální</dt>
          <dd>{g('currentHP', '0')}</dd>
        </div>
        <div>
          <dt>Dočasné</dt>
          <dd>{g('tempHP', '0')}</dd>
        </div>
        <div>
          <dt>Kostky životů</dt>
          <dd>{g('hitDice') || '—'}</dd>
        </div>
        <div>
          <dt>Záchrany — úspěchy</dt>
          <dd>{deathPips(deathSuccess)}</dd>
        </div>
        <div>
          <dt>Záchrany — neúspěchy</dt>
          <dd>{deathPips(deathFail)}</dd>
        </div>
      </dl>

      {/* ═══ Útoky ═══ */}
      {attacks.length > 0 && (
        <>
          <h3>Útoky a kouzla</h3>
          <table>
            <thead>
              <tr>
                <th>Jméno</th>
                <th>Út. bonus</th>
                <th>Zranění / typ</th>
              </tr>
            </thead>
            <tbody>
              {attacks.map((a, i) => (
                <tr key={i}>
                  <td>{a.name || '—'}</td>
                  <td>{a.bonus || '—'}</td>
                  <td>{a.damage || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ═══ Osobnost ═══ */}
      <h3>Osobnost</h3>
      <dl>
        {DND_PERSONALITY_FIELDS.map((f) => (
          <div key={f.key}>
            <dt>{f.label}</dt>
            <dd style={{ whiteSpace: 'pre-wrap' }}>{g(f.key) || '—'}</dd>
          </div>
        ))}
      </dl>

      {g('otherProf').trim() && (
        <>
          <h3>Ostatní zdatnosti a jazyky</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{g('otherProf')}</p>
        </>
      )}

      {g('features').trim() && (
        <>
          <h3>Schopnosti a rysy</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{g('features')}</p>
        </>
      )}

      {/* ═══ Sesílání kouzel (jen je-li sesilatel) ═══ */}
      {spellEnabled && (
        <>
          <h2>Sesílání kouzel</h2>
          <dl className="print-cols">
            <div>
              <dt>Sesílací vlastnost</dt>
              <dd>{g('spellAbility') || '—'}</dd>
            </div>
            <div>
              <dt>SO záchrany kouzel</dt>
              <dd>{g('spellDC', '0')}</dd>
            </div>
            <div>
              <dt>Útočný bonus kouzla</dt>
              <dd>{g('spellAttack', '0')}</dd>
            </div>
          </dl>

          {cantrips.filter((c) => c.trim()).length > 0 && (
            <>
              <h3>Triky</h3>
              <ul className="matrix-print__plain">
                {cantrips
                  .filter((c) => c.trim())
                  .map((c, i) => (
                    <li key={i} className="print-row">
                      <span>{c}</span>
                      <span />
                    </li>
                  ))}
              </ul>
            </>
          )}

          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
            const data = parseSpellLevel(g(`spellLevel_${lvl}`));
            const named = data.spells.filter(
              (sp: DndSpellEntry) => (sp.name || '').trim(),
            );
            if (data.totalSlots === 0 && named.length === 0) return null;
            return (
              <div key={lvl}>
                <h3>
                  {lvl}. úroveň — sloty:{' '}
                  {'●'.repeat(Math.min(data.usedSlots, data.totalSlots)) +
                    '○'.repeat(
                      Math.max(0, data.totalSlots - data.usedSlots),
                    ) || '—'}
                </h3>
                {named.length > 0 && (
                  <ul className="matrix-print__plain">
                    {named.map((sp: DndSpellEntry, i: number) => (
                      <li key={i} className="print-row">
                        <span>
                          {sp.prepared ? '(připraveno) ' : ''}
                          {sp.name}
                        </span>
                        <span>{sp.note || ''}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
