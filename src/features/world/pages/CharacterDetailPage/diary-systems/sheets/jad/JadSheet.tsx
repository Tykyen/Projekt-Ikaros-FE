/**
 * 8.7b — JaD (Jeskyně a draci) deník postavy.
 *
 * Adaptováno z `c:/Matrix/Matrix/frontend/src/components/diary/JadCharacterSheet.tsx`
 * (280 ř, 1:1 layout). Hlavní odlišnosti:
 *   - Save delegujeme parentu (EditStickyBar v `DiaryTab`); `onSave` prop nemá.
 *   - `view` mód disabluje všechny inputy + tlačítka (cycle stavů, add/del row).
 *   - Data v `diary.customData` s prefixem `jad_*` (1:1 vůči legacy).
 */
import { useState } from 'react';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  ABIL_MAP,
  SKILLS,
  type JadSpell,
  type JadWeapon,
} from './constants';
import { calcMod, calcSaveMod, calcSkillMod, fmtMod } from './formulas';

type Tab = 'main' | 'spells';

export function JadSheet({ diary, mode, onChange }: SystemSheetProps) {
  const disabled = mode === 'view';
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'jad_', onChange);
  const { g, set, parseJsonArr } = cda;
  // Backward-compat aliases pro stávající JadSheet kód (přijaty jako props
  // do SpellLevelBlock — bez refaktoru by se editovaly desítky řádků).
  const setJson = (key: string, arr: unknown[]) =>
    set(key, JSON.stringify(arr));
  const getJson = <T,>(key: string): T[] => parseJsonArr<T>(key);
  // Suppress unused-var warning: cda je celá poskytnuta v Components níž.
  void cda;

  const [tab, setTab] = useState<Tab>('main');

  const profBonus = parseInt(g('profBonus', '2'), 10) || 2;
  const getScore = (k: string) =>
    parseInt(g(`abi_${k}`, '10'), 10) || 10;
  const getModFor = (k: string) => calcMod(getScore(k));

  const isSaveProf = (k: string) => g(`save_${k}`) === '1';
  const saveModFor = (k: string) =>
    calcSaveMod(getModFor(k), isSaveProf(k), profBonus);

  const skillProf = (n: string) => parseInt(g(`skill_${n}`, '0'), 10) || 0;
  const skillModFor = (n: string, a: string) =>
    calcSkillMod(getModFor(a), skillProf(n), profBonus);

  const spellEnabled = g('spellEnabled') === '1';
  const weapons = getJson<JadWeapon>('weapons');

  return (
    <div className="jad-diary">
      <div className="jad-tabs">
        <button
          type="button"
          className={tab === 'main' ? 'active' : ''}
          onClick={() => setTab('main')}
        >
          Hlavní zápisník postavy
        </button>
        {spellEnabled && (
          <button
            type="button"
            className={tab === 'spells' ? 'active' : ''}
            onClick={() => setTab('spells')}
          >
            Kouzla / Truhla
          </button>
        )}
        <label className="jad-tab-toggle">
          <input
            type="checkbox"
            checked={spellEnabled}
            disabled={disabled}
            onChange={(e) =>
              set('spellEnabled', e.target.checked ? '1' : '0')
            }
          />
          Sesilatel / Alchymista
        </label>
      </div>

      {tab === 'main' && (
        <>
          <div className="jad-header">
            <div className="jad-header-main">
              <label htmlFor="jad_charName">Jméno postavy</label>
              <input
                id="jad_charName"
                value={g('charName')}
                disabled={disabled}
                onChange={(e) => set('charName', e.target.value)}
              />
            </div>
            <div className="jad-header-grid">
              {[
                { key: 'race', label: 'Rasa' },
                { key: 'class', label: 'Povolání' },
                { key: 'level', label: 'Úroveň' },
                { key: 'background', label: 'Zázemí' },
                { key: 'alignment', label: 'Přesvědčení' },
                { key: 'player', label: 'Hráč' },
                { key: 'xp', label: 'Zkušenosti' },
              ].map((f) => (
                <div className="jad-field" key={f.key}>
                  <label htmlFor={`jad_${f.key}`}>{f.label}</label>
                  <input
                    id={`jad_${f.key}`}
                    value={g(f.key)}
                    disabled={disabled}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="jad-grid">
            {/* COLUMN 1 — Stats, save, passive senses */}
            <div>
              <h3>Hlavní vlastnosti</h3>
              <div className="jad-stats">
                {ABIL_MAP.map(({ k, l }) => (
                  <div key={k} className="jad-stat-box">
                    <span className="lbl">
                      {l.substring(0, 3).toUpperCase()}
                    </span>
                    <input
                      type="number"
                      value={getScore(k)}
                      disabled={disabled}
                      onChange={(e) => set(`abi_${k}`, e.target.value)}
                    />
                    <span className="mod">{fmtMod(getModFor(k))}</span>
                  </div>
                ))}
              </div>

              <h3>Osobní profily</h3>
              <div className="jad-panel" style={{ marginBottom: 24 }}>
                <div className="jad-list-row">
                  <span className="lbl">Zdatnostní bonus</span>
                  <input
                    style={{
                      width: 50,
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}
                    value={profBonus}
                    disabled={disabled}
                    onChange={(e) => set('profBonus', e.target.value)}
                  />
                </div>
                <div className="jad-list-row" style={{ border: 0 }}>
                  <span className="lbl">Inspirace</span>
                  <button
                    type="button"
                    className="prof"
                    disabled={disabled}
                    style={{
                      width: 24,
                      height: 24,
                      background:
                        g('insp') === '1' ? 'var(--jad-accent)' : '#fff',
                    }}
                    onClick={() => set('insp', g('insp') === '1' ? '0' : '1')}
                    aria-label="Přepnout inspiraci"
                  />
                </div>
              </div>

              <h3>Záchranné hody</h3>
              <div className="jad-panel" style={{ marginBottom: 24 }}>
                {ABIL_MAP.map(({ k, l }) => (
                  <div key={k} className="jad-list-row">
                    <button
                      type="button"
                      className="prof"
                      disabled={disabled}
                      onClick={() =>
                        set(`save_${k}`, isSaveProf(k) ? '0' : '1')
                      }
                      aria-label={`Záchrana ${l}: ${isSaveProf(k) ? 'zdatný' : 'nezdatný'}`}
                    >
                      {isSaveProf(k) ? '●' : '○'}
                    </button>
                    <span className="mod">{fmtMod(saveModFor(k))}</span>
                    <span className="lbl">{l}</span>
                  </div>
                ))}
              </div>

              <h3>Pasivní vnímání a smysly</h3>
              <div className="jad-panel">
                <div className="jad-list-row">
                  <span className="mod">
                    {10 + skillModFor('Vnímání', 'wis')}
                  </span>
                  <span className="lbl">Pasivní Vnímání</span>
                </div>
                <div className="jad-list-row">
                  <span className="mod">
                    {10 + skillModFor('Vhled', 'wis')}
                  </span>
                  <span className="lbl">Pasivní Vhled</span>
                </div>
                <div className="jad-list-row" style={{ border: 0 }}>
                  <span className="mod">
                    {10 + skillModFor('Pátrání', 'int')}
                  </span>
                  <span className="lbl">Pasivní Pátrání</span>
                </div>
              </div>
            </div>

            {/* COLUMN 2 — Combat meta, HP, skills */}
            <div>
              <div className="jad-top-meta">
                <div className="jad-meta-box">
                  <label>Iniciativa</label>
                  <span className="val">{fmtMod(getModFor('dex'))}</span>
                </div>
                <div className="jad-meta-box">
                  <label htmlFor="jad_ac">Obranné číslo</label>
                  <input
                    id="jad_ac"
                    value={g('ac', '10')}
                    disabled={disabled}
                    onChange={(e) => set('ac', e.target.value)}
                  />
                </div>
                <div className="jad-meta-box">
                  <label htmlFor="jad_speed">Rychlost</label>
                  <input
                    id="jad_speed"
                    value={g('speed', '9 m')}
                    disabled={disabled}
                    onChange={(e) => set('speed', e.target.value)}
                  />
                </div>
              </div>

              <div className="jad-hp-panel">
                <div className="hp-row">
                  <div className="hp-box">
                    <label htmlFor="jad_hpMax">VBD / Max Životy</label>
                    <input
                      id="jad_hpMax"
                      value={g('hpMax')}
                      disabled={disabled}
                      onChange={(e) => set('hpMax', e.target.value)}
                    />
                  </div>
                  <div className="hp-box" style={{ flex: 1.5 }}>
                    <label htmlFor="jad_hpCur">Aktuální Životy (BV)</label>
                    <input
                      id="jad_hpCur"
                      style={{
                        borderColor: 'var(--jad-accent)',
                        color: 'var(--jad-accent)',
                      }}
                      value={g('hpCur')}
                      disabled={disabled}
                      onChange={(e) => set('hpCur', e.target.value)}
                    />
                  </div>
                </div>
                <div className="hp-row" style={{ marginBottom: 0 }}>
                  <div className="hp-box">
                    <label htmlFor="jad_hd">Kostky obnovy</label>
                    <input
                      id="jad_hd"
                      style={{ fontSize: '1.2rem' }}
                      value={g('hd')}
                      disabled={disabled}
                      onChange={(e) => set('hd', e.target.value)}
                    />
                  </div>
                  <div className="hp-box">
                    <label>Záchrany proti smrti</label>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: 8,
                        fontSize: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        Záchr.{' '}
                        <input
                          value={g('ds_s')}
                          disabled={disabled}
                          onChange={(e) => set('ds_s', e.target.value)}
                          style={{ width: '100%', fontSize: '1rem' }}
                          placeholder="0/3"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        Selh.{' '}
                        <input
                          value={g('ds_f')}
                          disabled={disabled}
                          onChange={(e) => set('ds_f', e.target.value)}
                          style={{ width: '100%', fontSize: '1rem' }}
                          placeholder="0/3"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <h3>Dovednosti</h3>
              <div className="jad-panel">
                {SKILLS.map(({ n, a }) => {
                  const prof = skillProf(n);
                  return (
                    <div key={n} className="jad-list-row">
                      <button
                        type="button"
                        className="prof"
                        disabled={disabled}
                        onClick={() =>
                          set(`skill_${n}`, String((prof + 1) % 3))
                        }
                        aria-label={`Dovednost ${n}: ${prof === 0 ? 'žádná' : prof === 1 ? 'zdatnost' : 'expertíza'}`}
                      >
                        {prof === 0 ? '○' : prof === 1 ? '●' : '◉'}
                      </button>
                      <span className="mod">{fmtMod(skillModFor(n, a))}</span>
                      <span className="lbl">{n}</span>
                      <span className="sub">({a.toUpperCase()})</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 3 — Spell quick-ref, weapons, notes */}
            <div>
              <h3>Rychlý přehled kouzlení / Alchymie</h3>
              <div className="jad-panel" style={{ marginBottom: 24 }}>
                <div className="jad-list-row">
                  <span className="lbl">Sesílací / Útočná vlastnost</span>
                  <input
                    style={{ width: 80, textAlign: 'center' }}
                    value={g('qc_ss_abi')}
                    disabled={disabled}
                    onChange={(e) => set('qc_ss_abi', e.target.value)}
                  />
                </div>
                <div className="jad-list-row">
                  <span className="lbl">Útočný bonus</span>
                  <input
                    style={{ width: 60, textAlign: 'center' }}
                    value={g('qc_ss_atk')}
                    disabled={disabled}
                    onChange={(e) => set('qc_ss_atk', e.target.value)}
                  />
                </div>
                <div className="jad-list-row" style={{ border: 0 }}>
                  <span className="lbl">Stupeň obtížnosti (SO)</span>
                  <input
                    style={{ width: 60, textAlign: 'center' }}
                    value={g('qc_ss_dc')}
                    disabled={disabled}
                    onChange={(e) => set('qc_ss_dc', e.target.value)}
                  />
                </div>
              </div>

              <h3>Zbraně a Doplňky</h3>
              <div className="jad-panel" style={{ marginBottom: 24 }}>
                <table className="jad-table">
                  <thead>
                    <tr>
                      <th>Zbraň</th>
                      <th style={{ width: 40 }}>Bon</th>
                      <th style={{ width: 60 }}>Zásah</th>
                      <th style={{ width: 40 }}>OČ</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {weapons.map((w, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            value={w.n}
                            disabled={disabled}
                            onChange={(e) => {
                              const arr = [...weapons];
                              arr[i] = { ...arr[i], n: e.target.value };
                              setJson('weapons', arr);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            value={w.b}
                            disabled={disabled}
                            onChange={(e) => {
                              const arr = [...weapons];
                              arr[i] = { ...arr[i], b: e.target.value };
                              setJson('weapons', arr);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            value={w.d}
                            disabled={disabled}
                            onChange={(e) => {
                              const arr = [...weapons];
                              arr[i] = { ...arr[i], d: e.target.value };
                              setJson('weapons', arr);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            value={w.o}
                            disabled={disabled}
                            onChange={(e) => {
                              const arr = [...weapons];
                              arr[i] = { ...arr[i], o: e.target.value };
                              setJson('weapons', arr);
                            }}
                          />
                        </td>
                        <td>
                          {!disabled && (
                            <button
                              type="button"
                              className="del-btn"
                              onClick={() => {
                                const arr = [...weapons];
                                arr.splice(i, 1);
                                setJson('weapons', arr);
                              }}
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
                    className="add-link"
                    onClick={() =>
                      setJson('weapons', [
                        ...weapons,
                        { n: '', b: '', d: '', t: '', r: '', o: '' },
                      ])
                    }
                  >
                    + Přidat Zbraň
                  </button>
                )}
              </div>

              <h3>Poznámky k hraní postavy</h3>
              <div className="jad-panel" style={{ marginBottom: 24 }}>
                <textarea
                  style={{
                    width: '100%',
                    minHeight: 120,
                    border: 'none',
                    resize: 'vertical',
                  }}
                  value={g('play_notes')}
                  disabled={disabled}
                  onChange={(e) => set('play_notes', e.target.value)}
                  placeholder="Taktika, aktivní efekty, nápady do boje..."
                />
              </div>

              <h3>Ostatní zdatnosti a Pomůcky</h3>
              <div className="jad-panel" style={{ marginBottom: 24 }}>
                <textarea
                  style={{
                    width: '100%',
                    minHeight: 100,
                    border: 'none',
                    resize: 'vertical',
                  }}
                  value={g('other_profs')}
                  disabled={disabled}
                  onChange={(e) => set('other_profs', e.target.value)}
                  placeholder="Jazyky, nástroje, zbroje..."
                />
              </div>

              <h3>Záznam Schopností (Třídní / Rasové)</h3>
              <div className="jad-panel">
                <textarea
                  style={{
                    width: '100%',
                    minHeight: 200,
                    border: 'none',
                    resize: 'vertical',
                  }}
                  value={g('features')}
                  disabled={disabled}
                  onChange={(e) => set('features', e.target.value)}
                  placeholder="Výpis schopností postavy..."
                />
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'spells' && spellEnabled && (
        <div className="jad-spells">
          <div className="spell-header">
            {[
              { key: 'sp_class', label: 'Povolání' },
              { key: 'sp_abi', label: 'Sesílací Vlastnost' },
              { key: 'sp_atk', label: 'Útočný Bonus' },
              { key: 'sp_dc', label: 'S.O. Záchrany' },
            ].map((f) => (
              <div key={f.key}>
                <label htmlFor={`jad_${f.key}`}>{f.label}</label>
                <input
                  id={`jad_${f.key}`}
                  value={g(f.key)}
                  disabled={disabled}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>

          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
            <SpellLevelBlock
              key={lvl}
              lvl={lvl}
              cd={cd}
              g={g}
              set={set}
              setJson={setJson}
              getJson={getJson}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SpellLevelBlockProps {
  lvl: number;
  cd: Record<string, unknown>;
  g: CdAccess['g'];
  set: CdAccess['set'];
  setJson: (key: string, arr: unknown[]) => void;
  getJson: <T>(key: string) => T[];
  disabled: boolean;
}

function SpellLevelBlock({
  lvl,
  g,
  set,
  setJson,
  getJson,
  disabled,
}: SpellLevelBlockProps) {
  const spells = getJson<JadSpell>(`spl_${lvl}`);

  return (
    <div className="spell-level">
      <div className="sl-title">
        <h4>{lvl === 0 ? 'Triky' : `${lvl}. Stupeň`}</h4>
        {lvl > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span
              style={{ fontSize: 12, fontWeight: 'bold', color: '#7b6f5e' }}
            >
              Pozice:
            </span>
            <input
              style={{ width: 40, textAlign: 'center' }}
              value={g(`spl_slots_${lvl}`)}
              disabled={disabled}
              onChange={(e) => set(`spl_slots_${lvl}`, e.target.value)}
              placeholder="Max"
              aria-label={`Maximální pozice ${lvl}. stupně`}
            />
            <input
              style={{
                width: 40,
                textAlign: 'center',
                borderColor: 'var(--jad-accent)',
              }}
              value={g(`spl_used_${lvl}`)}
              disabled={disabled}
              onChange={(e) => set(`spl_used_${lvl}`, e.target.value)}
              placeholder="Pou."
              aria-label={`Použité pozice ${lvl}. stupně`}
            />
          </div>
        )}
      </div>
      <table className="jad-table">
        <thead>
          <tr>
            {lvl > 0 && <th style={{ width: 30 }}>P</th>}
            <th style={{ width: 30 }}>S</th>
            <th>Název</th>
            <th style={{ width: 80 }}>Úto/SO</th>
            <th>Doba</th>
            <th>Dosah</th>
            <th>Trv.</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {spells.map((sp, i) => (
            <tr key={i}>
              {lvl > 0 && (
                <td>
                  <input
                    type="checkbox"
                    checked={sp.p}
                    disabled={disabled}
                    onChange={(e) => {
                      const a = [...spells];
                      a[i] = { ...a[i], p: e.target.checked };
                      setJson(`spl_${lvl}`, a);
                    }}
                    aria-label="Připravené"
                  />
                </td>
              )}
              <td>
                <input
                  type="checkbox"
                  checked={sp.s}
                  disabled={disabled}
                  onChange={(e) => {
                    const a = [...spells];
                    a[i] = { ...a[i], s: e.target.checked };
                    setJson(`spl_${lvl}`, a);
                  }}
                  aria-label="V kouzelníkovi"
                />
              </td>
              {[
                ['n', 'Název kouzla'],
                ['u', 'Útok / SO'],
                ['d', 'Doba sesílání'],
                ['r', 'Dosah'],
                ['t', 'Trvání'],
              ].map(([field, label]) => (
                <td key={field}>
                  <input
                    value={(sp[field as keyof JadSpell] as string) ?? ''}
                    disabled={disabled}
                    aria-label={label}
                    onChange={(e) => {
                      const a = [...spells];
                      a[i] = { ...a[i], [field]: e.target.value };
                      setJson(`spl_${lvl}`, a);
                    }}
                  />
                </td>
              ))}
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="del-btn"
                    onClick={() => {
                      const a = [...spells];
                      a.splice(i, 1);
                      setJson(`spl_${lvl}`, a);
                    }}
                    aria-label="Smazat kouzlo"
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
          className="add-link"
          onClick={() =>
            setJson(`spl_${lvl}`, [
              ...spells,
              {
                p: false,
                s: false,
                n: '',
                u: '',
                d: '',
                z: '',
                r: '',
                t: '',
              },
            ])
          }
        >
          + Přidat {lvl === 0 ? 'Trik' : 'Kouzlo'}
        </button>
      )}
    </div>
  );
}
