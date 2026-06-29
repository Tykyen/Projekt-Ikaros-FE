/**
 * 8.7d — D&D 5e deník postavy.
 * 8.7s — redesign: multipovolání + obory, zázemí select, auto úroveň,
 *        přidávatelné zdatnosti/jazyky/schopnosti, poznámky dole.
 *        Viz [spec-8.7s](../../../../../../../docs/arch/phase-8/spec-8.7s-dnd5e-redesign.md).
 *
 * Data v `diary.customData` s prefixem `dnd_*`. Migrace legacy polí
 * (`dnd_classLevel`, `dnd_otherProf`, `dnd_features`) je read-only — odvodí
 * se pro zobrazení, do DB se zapíše až prvním editem nového pole. Odebraná
 * pole (jméno/hráč/přesvědčení) se z DB nemažou, jen je UI neukazuje.
 */
import { useState } from 'react';
import { usePrintMode } from '@/features/world/export/print';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import { SheetInitiativeButton } from '../../_shared/SheetInitiativeButton';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  DND_CLASSES,
  DND_CASTERS,
  DND_BACKGROUNDS,
  SKILLS,
  type AbilityKey,
  type DndAttack,
  type DndClassRow,
  type DndFeat,
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

// ── Odvozená pole (read-only migrace legacy) ──────────────────────
function deriveClasses(cda: CdAccess): DndClassRow[] {
  return cda.parseJsonArr<DndClassRow>('classes');
}
function deriveProfs(cda: CdAccess): string[] {
  const arr = cda.parseJsonArr<string>('profs');
  if (arr.length) return arr;
  const t = cda.g('otherProf');
  return t ? [t] : [];
}
function deriveFeats(cda: CdAccess): DndFeat[] {
  const arr = cda.parseJsonArr<DndFeat>('feats');
  if (arr.length) return arr;
  const t = cda.g('features');
  return t ? [{ n: '', d: t }] : [];
}
function dndTotalLevel(rows: DndClassRow[]): number {
  return rows.reduce((s, r) => s + (parseInt(r.l || '0', 10) || 0), 0);
}

export function DndSheet({ diary, mode, onChange, onRoll }: SystemSheetProps) {
  const disabled = mode === 'view';
  const printMode = usePrintMode();
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'dnd_', onChange);
  const { g, set, parseJsonArr } = cda;
  const setJson = (key: string, arr: unknown[]) => set(key, JSON.stringify(arr));

  const [tab, setTab] = useState<Tab>('main');

  // Zázemí: select, nebo „Vlastní…" text input pokud hodnota není v seznamu.
  const bgVal = g('background');
  const [bgCustom, setBgCustom] = useState(
    bgVal !== '' && !DND_BACKGROUNDS.includes(bgVal),
  );

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

  // ── Multipovolání ───────────────────────────────────────────
  const classRows = deriveClasses(cda);
  const totalLevel = dndTotalLevel(classRows);
  // Legacy volný text „Povolání a úroveň" — nelze mapovat na select; zobraz
  // jako jednorázový read-only hint, dokud nejsou zadána nová povolání.
  const legacyClassLevel =
    classRows.length === 0 ? g('classLevel').trim() : '';
  const writeClasses = (arr: DndClassRow[]) => setJson('classes', arr);
  const updateClass = (i: number, patch: Partial<DndClassRow>) => {
    const a = [...classRows];
    a[i] = { ...a[i], ...patch };
    if ('c' in patch) {
      // změna povolání → starý obor/pakt už neplatí
      a[i].s = '';
      a[i].s2 = '';
    }
    writeClasses(a);
  };

  // Kouzla: odvozený default — zapnuto, je-li mezi povoláními kouzlící a
  // uživatel na checkbox nikdy nesáhl. Ruční volba ('1'/'0') má přednost.
  const hasCasterClass = classRows.some((r) => DND_CASTERS.includes(r.c));
  const spRaw = g('spellEnabled');
  const spellEnabled = spRaw === '1' || (spRaw === '' && hasCasterClass);

  // ── Attacks ─────────────────────────────────────────────────
  const attacks = parseJsonArr<DndAttack>('attacks');
  const setAttacks = (arr: DndAttack[]) => set('attacks', JSON.stringify(arr));

  // ── Přidávatelné sekce ──────────────────────────────────────
  const profList = deriveProfs(cda);
  const langList = parseJsonArr<string>('langs');
  const featList = deriveFeats(cda);

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
  const setCantrips = (arr: string[]) => set('cantrips', JSON.stringify(arr));

  // ── Death saves ─────────────────────────────────────────────
  const deathSuccess = parseInt(g('deathSuccess', '0'), 10) || 0;
  const deathFail = parseInt(g('deathFail', '0'), 10) || 0;

  // Tisk: interaktivní sheet je netisknutelný — render statického dokumentu.
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
            onChange={(e) => set('spellEnabled', e.target.checked ? '1' : '0')}
          />
          Sesilatel kouzel
        </label>
      </div>

      {tab === 'main' && (
        <div className="dnd-main">
          {/* ═══ IDENTITA ═══ */}
          <section className="dnd-header">
            <div className="dnd-identity">
              <div className="dnd-field">
                <label htmlFor="dnd_race">Rasa</label>
                <input
                  id="dnd_race"
                  value={g('race')}
                  disabled={disabled}
                  onChange={(e) => set('race', e.target.value)}
                />
              </div>
              <div className="dnd-field">
                <label htmlFor="dnd_background">Zázemí</label>
                <select
                  id="dnd_background"
                  value={bgCustom ? '__custom__' : bgVal}
                  disabled={disabled}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setBgCustom(true);
                    } else {
                      setBgCustom(false);
                      set('background', e.target.value);
                    }
                  }}
                >
                  <option value="">— vyber —</option>
                  {DND_BACKGROUNDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="__custom__">Vlastní…</option>
                </select>
                {bgCustom && (
                  <input
                    style={{ marginTop: 6 }}
                    value={bgVal}
                    disabled={disabled}
                    placeholder="Vlastní zázemí"
                    aria-label="Vlastní zázemí"
                    onChange={(e) => set('background', e.target.value)}
                  />
                )}
              </div>
              <div className="dnd-field">
                <label htmlFor="dnd_xp">Body zkušeností</label>
                <input
                  id="dnd_xp"
                  value={g('xp')}
                  disabled={disabled}
                  onChange={(e) => set('xp', e.target.value)}
                />
              </div>
              <div className="dnd-level-badge">
                <div className="num">{totalLevel}</div>
                <div className="cap">Úroveň</div>
              </div>
            </div>
          </section>

          {/* ═══ MULTIPOVOLÁNÍ ═══ */}
          <h3 className="dnd-section-h">Povolání a obory</h3>
          <div className="dnd-panel dnd-classes-panel">
            {legacyClassLevel && (
              <div className="dnd-legacy-hint">
                Dřívější zápis: <strong>{legacyClassLevel}</strong> — přepiš ho
                do polí níže.
              </div>
            )}
            <div className="dnd-prof-list">
              {classRows.map((row, i) => {
                const meta = DND_CLASSES[row.c];
                const lvl = parseInt(row.l || '0', 10) || 0;
                const locked = !meta || lvl < meta.sub;
                const locked2 =
                  !meta?.list2 || lvl < (meta.sub2 ?? Number.MAX_SAFE_INTEGER);
                return (
                  <div className="dnd-prof-row" key={i}>
                    <div className="pcol">
                      <span className="pcap">Povolání</span>
                      <select
                        value={row.c}
                        disabled={disabled}
                        aria-label="Povolání"
                        onChange={(e) => updateClass(i, { c: e.target.value })}
                      >
                        <option value="">— vyber —</option>
                        {Object.keys(DND_CLASSES).map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="pcol pcol-lvl">
                      <span className="pcap">Úroveň</span>
                      <input
                        type="number"
                        min={1}
                        value={row.l}
                        disabled={disabled}
                        aria-label="Úroveň povolání"
                        onChange={(e) => updateClass(i, { l: e.target.value })}
                      />
                    </div>
                    <div className="pcol pcol-sub">
                      <span className="pcap">{meta?.label ?? 'Obor'}</span>
                      <select
                        value={row.s}
                        disabled={disabled || locked}
                        aria-label={meta?.label ?? 'Obor'}
                        onChange={(e) => updateClass(i, { s: e.target.value })}
                      >
                        <option value="">{meta ? '— vyber —' : '—'}</option>
                        {meta?.list.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {meta && locked && (
                        <div className="dnd-sub-hint">
                          {(meta.label ?? 'obor').toLowerCase()} od {meta.sub}.
                          úrovně
                        </div>
                      )}
                    </div>
                    {meta?.list2 && (
                      <div className="pcol pcol-sub">
                        <span className="pcap">{meta.label2}</span>
                        <select
                          value={row.s2 ?? ''}
                          disabled={disabled || locked2}
                          aria-label={meta.label2 ?? 'Pakt'}
                          onChange={(e) =>
                            updateClass(i, { s2: e.target.value })
                          }
                        >
                          <option value="">— vyber —</option>
                          {meta.list2.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        {locked2 && (
                          <div className="dnd-sub-hint">
                            {(meta.label2 ?? 'pakt').toLowerCase()} od{' '}
                            {meta.sub2}. úrovně
                          </div>
                        )}
                      </div>
                    )}
                    {!disabled && (
                      <button
                        type="button"
                        className="del-btn"
                        onClick={() => {
                          const a = [...classRows];
                          a.splice(i, 1);
                          writeClasses(a);
                        }}
                        aria-label="Odebrat povolání"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {!disabled && (
              <button
                type="button"
                className="add-link"
                onClick={() =>
                  writeClasses([
                    ...classRows,
                    { c: '', l: '', s: '', s2: '' },
                  ])
                }
              >
                + Přidat povolání
              </button>
            )}
            <div className="dnd-foot-hint">
              Úroveň postavy = součet úrovní povolání. Obor se odemkne na
              prahové úrovni povolání.
            </div>
          </div>

          {/* ═══ MAIN GRID ═══ */}
          <div className="dnd-grid">
            {/* ── LEFT COLUMN ── */}
            <div className="dnd-col-left">
              {/* Abilities */}
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
                        onChange={(e) => set(`ability_${k}`, e.target.value)}
                        aria-label={`${ABILITY_LABELS[k]} skóre`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Inspiration & Prof bonus */}
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

              {/* Saves */}
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

              {/* Skills */}
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

              {/* Passive senses */}
              <div className="dnd-passive">
                <span className="dnd-passive__val">
                  {10 + skillModFor('Vnímání', 'wis')}
                </span>
                <span className="dnd-passive__label">Pasivní vnímání</span>
              </div>
              <div className="dnd-passive">
                <span className="dnd-passive__val">
                  {10 + skillModFor('Vhled', 'wis')}
                </span>
                <span className="dnd-passive__label">Pasivní vhled</span>
              </div>
              <div className="dnd-passive">
                <span className="dnd-passive__val">
                  {10 + skillModFor('Pátrání', 'int')}
                </span>
                <span className="dnd-passive__label">Pasivní pátrání</span>
              </div>
            </div>

            {/* ── CENTER COLUMN ── */}
            <div className="dnd-col-center">
              {/* Combat */}
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

              {/* Hit Points */}
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

              {/* Hit Dice & Death Saves */}
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
                            set('deathFail', String(deathFail >= i ? i - 1 : i))
                          }
                          aria-label={`Neúspěch ${i} z 3`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Attacks */}
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
                        {(['name', 'bonus', 'damage'] as const).map((field) => (
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
                        ))}
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
              {/* Spell quick-ref (jen caster) */}
              {spellEnabled && (
                <div className="dnd-panel dnd-spell-quick">
                  <h3>Rychlý přehled kouzlení</h3>
                  <div className="dnd-quick-row">
                    <span className="lbl">Sesílací vlastnost</span>
                    <input
                      value={g('spellAbility')}
                      disabled={disabled}
                      onChange={(e) => set('spellAbility', e.target.value)}
                      placeholder="např. Moudrost"
                      aria-label="Sesílací vlastnost"
                    />
                  </div>
                  <div className="dnd-quick-row">
                    <span className="lbl">SO záchrany kouzel</span>
                    <input
                      type="number"
                      value={g('spellDC', '0')}
                      disabled={disabled}
                      onChange={(e) => set('spellDC', e.target.value)}
                      aria-label="SO záchrany kouzel"
                    />
                  </div>
                  <div className="dnd-quick-row">
                    <span className="lbl">Útočný bonus kouzla</span>
                    <input
                      value={g('spellAttack', '0')}
                      disabled={disabled}
                      onChange={(e) => set('spellAttack', e.target.value)}
                      aria-label="Útočný bonus kouzla"
                    />
                  </div>
                </div>
              )}

              {/* Zdatnosti */}
              <div className="dnd-panel">
                <h3>Zdatnosti (zbroje, zbraně, nástroje)</h3>
                <StringListRows
                  items={profList}
                  disabled={disabled}
                  placeholder="Lehké zbroje, dýky, zlodějské náčiní…"
                  addLabel="+ Přidat zdatnost"
                  onWrite={(a) => setJson('profs', a)}
                />
              </div>

              {/* Jazyky */}
              <div className="dnd-panel">
                <h3>Jazyky</h3>
                <StringListRows
                  items={langList}
                  disabled={disabled}
                  placeholder="Obecná řeč, elfština…"
                  addLabel="+ Přidat jazyk"
                  onWrite={(a) => setJson('langs', a)}
                />
              </div>

              {/* Schopnosti a rysy */}
              <div className="dnd-panel">
                <h3>Schopnosti a rysy</h3>
                <FeatRows
                  items={featList}
                  disabled={disabled}
                  onWrite={(a) => setJson('feats', a)}
                />
              </div>
            </div>
          </div>

          {/* ── POZNÁMKY (plná šířka, úplně dole) ── */}
          <h3 className="dnd-section-h" style={{ marginTop: 24 }}>
            Poznámky k hraní postavy
          </h3>
          <div className="dnd-panel dnd-notes-full">
            <textarea
              value={g('play_notes')}
              disabled={disabled}
              onChange={(e) => set('play_notes', e.target.value)}
              placeholder="Taktika, aktivní efekty, vztahy, příběhové poznámky…"
              aria-label="Poznámky k hraní postavy"
            />
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
                              usedSlots: data.usedSlots === i + 1 ? i : i + 1,
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
// Přidávatelné sekce (zdatnosti / jazyky / schopnosti)
// ════════════════════════════════════════════════════════════════

interface StringListProps {
  items: string[];
  disabled: boolean;
  placeholder: string;
  addLabel: string;
  onWrite: (arr: string[]) => void;
}

function StringListRows({
  items,
  disabled,
  placeholder,
  addLabel,
  onWrite,
}: StringListProps) {
  return (
    <>
      {items.map((v, i) => (
        <div className="dnd-tag-row" key={i}>
          <span className="bullet">◦</span>
          <input
            value={v}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => {
              const a = [...items];
              a[i] = e.target.value;
              onWrite(a);
            }}
          />
          {!disabled && (
            <button
              type="button"
              className="del-btn"
              onClick={() => {
                const a = [...items];
                a.splice(i, 1);
                onWrite(a);
              }}
              aria-label="Smazat položku"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          className="add-link"
          onClick={() => onWrite([...items, ''])}
        >
          {addLabel}
        </button>
      )}
    </>
  );
}

interface FeatRowsProps {
  items: DndFeat[];
  disabled: boolean;
  onWrite: (arr: DndFeat[]) => void;
}

function FeatRows({ items, disabled, onWrite }: FeatRowsProps) {
  return (
    <>
      {items.map((f, i) => (
        <div className="dnd-feat" key={i}>
          <div className="dnd-feat-head">
            <input
              value={f.n}
              disabled={disabled}
              placeholder="Název schopnosti (např. Zuřivost, Akční vlna)"
              aria-label="Název schopnosti"
              onChange={(e) => {
                const a = [...items];
                a[i] = { ...a[i], n: e.target.value };
                onWrite(a);
              }}
            />
            {!disabled && (
              <button
                type="button"
                className="del-btn"
                onClick={() => {
                  const a = [...items];
                  a.splice(i, 1);
                  onWrite(a);
                }}
                aria-label="Smazat schopnost"
              >
                ✕
              </button>
            )}
          </div>
          <textarea
            value={f.d}
            disabled={disabled}
            placeholder="Popis / účinek…"
            aria-label="Popis schopnosti"
            onChange={(e) => {
              const a = [...items];
              a[i] = { ...a[i], d: e.target.value };
              onWrite(a);
            }}
          />
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          className="add-link"
          onClick={() => onWrite([...items, { n: '', d: '' }])}
        >
          + Přidat schopnost
        </button>
      )}
    </>
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

/** Zdatnost dovednosti: 0 = žádná, 1 = zdatnost, 2 = expertíza. */
const DND_PROF_LABEL = ['', 'zdatnost', 'expertíza'];

function DndPrintView({ cda }: { cda: CdAccess }) {
  const { g, parseJsonArr } = cda;

  const profBonus = parseInt(g('profBonus', '2'), 10) || 2;
  const getScore = (k: AbilityKey) =>
    parseInt(g(`ability_${k}`, '10'), 10) || 10;
  const getMod = (k: AbilityKey) => abilityMod(getScore(k));
  const isSaveProf = (k: AbilityKey) => g(`save_prof_${k}`) === '1';
  const skillProfFor = (name: string) =>
    parseInt(g(`skill_prof_${name}`, '0'), 10) || 0;

  const classRows = deriveClasses(cda);
  const totalLevel = dndTotalLevel(classRows);
  const profList = deriveProfs(cda);
  const langList = parseJsonArr<string>('langs');
  const featList = deriveFeats(cda).filter((f) => f.n.trim() || f.d.trim());

  const deathSuccess = parseInt(g('deathSuccess', '0'), 10) || 0;
  const deathFail = parseInt(g('deathFail', '0'), 10) || 0;

  const attacks = parseJsonArr<DndAttack>('attacks');
  const cantrips = parseJsonArr<string>('cantrips');

  const hasCasterClass = classRows.some((r) => DND_CASTERS.includes(r.c));
  const spRaw = g('spellEnabled');
  const spellEnabled = spRaw === '1' || (spRaw === '' && hasCasterClass);

  const passivePerception =
    10 + calcSkillMod(getMod('wis'), skillProfFor('Vnímání'), profBonus);
  const passiveInsight =
    10 + calcSkillMod(getMod('wis'), skillProfFor('Vhled'), profBonus);
  const passiveInvestigation =
    10 + calcSkillMod(getMod('int'), skillProfFor('Pátrání'), profBonus);

  const playNotes = g('play_notes').trim();

  return (
    <div className="dnd-print">
      {/* ═══ Identita ═══ */}
      <dl>
        <div>
          <dt>Rasa</dt>
          <dd>{g('race') || '—'}</dd>
        </div>
        <div>
          <dt>Zázemí</dt>
          <dd>{g('background') || '—'}</dd>
        </div>
        <div>
          <dt>Úroveň</dt>
          <dd>{totalLevel}</dd>
        </div>
        <div>
          <dt>Body zkušeností</dt>
          <dd>{g('xp') || '—'}</dd>
        </div>
        <div>
          <dt>Inspirace</dt>
          <dd>{g('inspiration') === '1' ? 'ano' : 'ne'}</dd>
        </div>
        <div>
          <dt>Zdatnostní bonus</dt>
          <dd>{fmtMod(profBonus)}</dd>
        </div>
      </dl>

      {/* ═══ Povolání ═══ */}
      <h2>Povolání a obory</h2>
      {classRows.length > 0 ? (
        <ul className="matrix-print__plain">
          {classRows.map((r, i) => {
            const sub = [r.s, r.s2].filter(Boolean).join(' · ');
            return (
              <li key={i} className="print-row">
                <span>
                  {r.c || '—'}
                  {sub ? ` — ${sub}` : ''}
                </span>
                <span>{r.l ? `${r.l}. úr.` : '—'}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>{g('classLevel') || '—'}</p>
      )}

      {/* ═══ Vlastnosti ═══ */}
      <h2>Vlastnosti</h2>
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
      <h2>Záchranné hody</h2>
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
      <h2>Dovednosti</h2>
      <ul className="matrix-print__plain">
        {SKILLS.map((sk) => {
          const prof = skillProfFor(sk.name);
          const mod = calcSkillMod(getMod(sk.ability), prof, profBonus);
          const profText = DND_PROF_LABEL[prof] ?? '';
          return (
            <li key={sk.name} className="print-row">
              <span>
                {sk.name} ({ABILITY_LABELS[sk.ability].slice(0, 3)})
                {profText ? ` — ${profText}` : ''}
              </span>
              <span>{fmtMod(mod)}</span>
            </li>
          );
        })}
      </ul>

      {/* ═══ Pasivní smysly ═══ */}
      <h2>Pasivní smysly</h2>
      <ul className="matrix-print__plain">
        <li className="print-row">
          <span>Pasivní vnímání</span>
          <span>{passivePerception}</span>
        </li>
        <li className="print-row">
          <span>Pasivní vhled</span>
          <span>{passiveInsight}</span>
        </li>
        <li className="print-row">
          <span>Pasivní pátrání</span>
          <span>{passiveInvestigation}</span>
        </li>
      </ul>

      {/* ═══ Boj ═══ */}
      <h2>Boj</h2>
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
        <div>
          <dt>Maximum životů</dt>
          <dd>{g('maxHP', '0')}</dd>
        </div>
        <div>
          <dt>Aktuální životy</dt>
          <dd>{g('currentHP', '0')}</dd>
        </div>
        <div>
          <dt>Dočasné životy</dt>
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
          <h2>Útoky a kouzla</h2>
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

      {/* ═══ Zdatnosti / jazyky / schopnosti ═══ */}
      {profList.length > 0 && (
        <>
          <h2>Zdatnosti</h2>
          <ul>
            {profList.map((p, i) => (
              <li key={i}>{p || '—'}</li>
            ))}
          </ul>
        </>
      )}

      {langList.length > 0 && (
        <>
          <h2>Jazyky</h2>
          <ul>
            {langList.map((p, i) => (
              <li key={i}>{p || '—'}</li>
            ))}
          </ul>
        </>
      )}

      {featList.length > 0 && (
        <>
          <h2>Schopnosti a rysy</h2>
          {featList.map((f, i) => (
            <div key={i}>
              {f.n.trim() && <h3>{f.n}</h3>}
              {f.d.trim() && <p style={{ whiteSpace: 'pre-wrap' }}>{f.d}</p>}
            </div>
          ))}
        </>
      )}

      {playNotes && (
        <>
          <h2>Poznámky k hraní postavy</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{playNotes}</p>
        </>
      )}

      {/* ═══ Sesílání kouzel ═══ */}
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
                    '○'.repeat(Math.max(0, data.totalSlots - data.usedSlots)) ||
                    '—'}
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
