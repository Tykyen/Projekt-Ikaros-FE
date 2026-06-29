/**
 * 8.7s — D&D 5e deník postavy = KLON JaD (`sheets/jad/JadSheet.tsx`).
 *        Jediný rozdíl proti JaD: povolání (`DND_CLASSES`, Černokněžník 2 osy
 *        patron+pakt) a zázemí (`DND_BACKGROUNDS`). Vše ostatní identické:
 *        multipovolání + obory, zázemí select, auto úroveň, přidávatelné
 *        zdatnosti/jazyky/schopnosti, poznámky dole.
 *        Viz [spec-8.7s](../../../../../../../docs/arch/phase-8/spec-8.7s-dnd5e-redesign.md).
 *
 * Data v `diary.customData` s prefixem `dnd_*` (shodné klíče s JaD, sdílí je
 * combat panel mapy/chatu). Migrace legacy polí read-only; odebraná pole
 * (jméno/přesvědčení/hráč) se z DB nemažou, jen je UI neukazuje.
 */
import { useState } from 'react';
import { usePrintMode } from '@/features/world/export/print';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  ABIL_MAP,
  SKILLS,
  DND_CLASSES,
  DND_CASTERS,
  DND_BACKGROUNDS,
  type DndClassRow,
  type DndFeat,
  type DndSpell,
  type DndWeapon,
} from './constants';
import { calcMod, calcSaveMod, calcSkillMod, fmtMod } from './formulas';

type Tab = 'main' | 'spells';

// ── Odvozená pole (read-only migrace legacy) ──────────────────────
function deriveClasses(cda: CdAccess): DndClassRow[] {
  const arr = cda.parseJsonArr<DndClassRow>('classes');
  if (arr.length) return arr;
  const c = cda.g('class');
  return c ? [{ c, l: cda.g('level') || '1', s: '', s2: '' }] : [];
}
function deriveProfs(cda: CdAccess): string[] {
  const arr = cda.parseJsonArr<string>('profs');
  if (arr.length) return arr;
  const t = cda.g('other_profs');
  return t ? [t] : [];
}
function deriveFeats(cda: CdAccess): DndFeat[] {
  const arr = cda.parseJsonArr<DndFeat>('feats');
  if (arr.length) return arr;
  const t = cda.g('features');
  return t ? [{ n: '', d: t }] : [];
}
function jadTotalLevel(rows: DndClassRow[]): number {
  return rows.reduce((s, r) => s + (parseInt(r.l || '0', 10) || 0), 0);
}

export function DndSheet({ diary, mode, onChange }: SystemSheetProps) {
  const disabled = mode === 'view';
  const printMode = usePrintMode();
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'dnd_', onChange);
  const { g, set, parseJsonArr } = cda;
  const setJson = (key: string, arr: unknown[]) => set(key, JSON.stringify(arr));
  const getJson = <T,>(key: string): T[] => parseJsonArr<T>(key);

  const [tab, setTab] = useState<Tab>('main');

  // Zázemí: select, nebo „Vlastní…" text input pokud hodnota není v seznamu.
  const bgVal = g('background');
  const [bgCustom, setBgCustom] = useState(
    bgVal !== '' && !DND_BACKGROUNDS.includes(bgVal),
  );

  const profBonus = parseInt(g('profBonus', '2'), 10) || 2;
  const getScore = (k: string) => parseInt(g(`abi_${k}`, '10'), 10) || 10;
  const getModFor = (k: string) => calcMod(getScore(k));

  const isSaveProf = (k: string) => g(`save_${k}`) === '1';
  const saveModFor = (k: string) =>
    calcSaveMod(getModFor(k), isSaveProf(k), profBonus);

  const skillProf = (n: string) => parseInt(g(`skill_${n}`, '0'), 10) || 0;
  const skillModFor = (n: string, a: string) =>
    calcSkillMod(getModFor(a), skillProf(n), profBonus);

  // Multipovolání
  const classRows = deriveClasses(cda);
  const totalLevel = jadTotalLevel(classRows);
  const writeClasses = (arr: DndClassRow[]) => setJson('classes', arr);
  const updateClass = (i: number, patch: Partial<DndClassRow>) => {
    const a = [...classRows];
    a[i] = { ...a[i], ...patch };
    // změna povolání → starý obor/pakt už neplatí
    if ('c' in patch) {
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

  const weapons = getJson<DndWeapon>('weapons');
  const profList = deriveProfs(cda);
  const langList = getJson<string>('langs');
  const featList = deriveFeats(cda);

  if (printMode) return <DndPrintView cda={cda} />;

  return (
    <div className="dnd-diary">
      <div className="dnd-tabs">
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
            Kouzla
          </button>
        )}
        <label className="dnd-tab-toggle">
          <input
            type="checkbox"
            checked={spellEnabled}
            disabled={disabled}
            onChange={(e) => set('spellEnabled', e.target.checked ? '1' : '0')}
          />
          Sesilatel / Alchymista
        </label>
      </div>

      {tab === 'main' && (
        <>
          {/* ── HLAVIČKA (identita) ───────────────────────────── */}
          <div className="dnd-header">
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
                <label htmlFor="dnd_xp">Zkušenosti</label>
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
          </div>

          {/* ── MULTIPOVOLÁNÍ ─────────────────────────────────── */}
          <h3>Povolání a obory</h3>
          <div className="dnd-panel" style={{ marginBottom: 24 }}>
            <div className="dnd-prof-list">
              {classRows.map((row, i) => {
                const meta = DND_CLASSES[row.c];
                const lvl = parseInt(row.l || '0', 10) || 0;
                const locked = !meta || lvl < meta.sub;
                // 2. osa (jen Černokněžník — pakt): vlastní práh `sub2`.
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
                      <span className="pcap">Obor / specializace</span>
                      <select
                        value={row.s}
                        disabled={disabled || locked}
                        aria-label="Obor"
                        onChange={(e) => updateClass(i, { s: e.target.value })}
                      >
                        <option value="">{meta ? '— vyber obor —' : '—'}</option>
                        {meta?.list.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {meta && locked && (
                        <div className="dnd-sub-hint">
                          obor od {meta.sub}. úrovně
                        </div>
                      )}
                    </div>
                    {meta?.list2 && (
                      <div className="pcol pcol-sub">
                        <span className="pcap">{meta.label2 ?? 'Pakt'}</span>
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
                  writeClasses([...classRows, { c: '', l: '', s: '', s2: '' }])
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

          <div className="dnd-grid">
            {/* COLUMN 1 — Stats, save, passive senses */}
            <div>
              <h3>Hlavní vlastnosti</h3>
              <div className="dnd-stats">
                {ABIL_MAP.map(({ k, l }) => (
                  <div key={k} className="dnd-stat-box">
                    <span className="lbl">{l.substring(0, 3).toUpperCase()}</span>
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
              <div className="dnd-panel" style={{ marginBottom: 24 }}>
                <div className="dnd-list-row">
                  <span className="lbl">Zdatnostní bonus</span>
                  <input
                    style={{ width: 50, textAlign: 'center', fontWeight: 'bold' }}
                    value={profBonus}
                    disabled={disabled}
                    onChange={(e) => set('profBonus', e.target.value)}
                  />
                </div>
                <div className="dnd-list-row" style={{ border: 0 }}>
                  <span className="lbl">Inspirace</span>
                  <button
                    type="button"
                    className="prof"
                    disabled={disabled}
                    style={{
                      width: 24,
                      height: 24,
                      background:
                        g('insp') === '1'
                          ? 'var(--dnd-insp, var(--dnd-accent))'
                          : '#fff',
                    }}
                    onClick={() => set('insp', g('insp') === '1' ? '0' : '1')}
                    aria-label="Přepnout inspiraci"
                  />
                </div>
              </div>

              <h3>Záchranné hody</h3>
              <div className="dnd-panel" style={{ marginBottom: 24 }}>
                {ABIL_MAP.map(({ k, l }) => (
                  <div key={k} className="dnd-list-row">
                    <button
                      type="button"
                      className="prof"
                      disabled={disabled}
                      onClick={() => set(`save_${k}`, isSaveProf(k) ? '0' : '1')}
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
              <div className="dnd-panel">
                <div className="dnd-list-row">
                  <span className="mod">{10 + skillModFor('Vnímání', 'wis')}</span>
                  <span className="lbl">Pasivní Vnímání</span>
                </div>
                <div className="dnd-list-row">
                  <span className="mod">{10 + skillModFor('Vhled', 'wis')}</span>
                  <span className="lbl">Pasivní Vhled</span>
                </div>
                <div className="dnd-list-row" style={{ border: 0 }}>
                  <span className="mod">{10 + skillModFor('Pátrání', 'int')}</span>
                  <span className="lbl">Pasivní Pátrání</span>
                </div>
              </div>
            </div>

            {/* COLUMN 2 — Combat meta, HP, skills */}
            <div>
              <div className="dnd-top-meta">
                <div className="dnd-meta-box">
                  <label>Iniciativa</label>
                  <span className="val">{fmtMod(getModFor('dex'))}</span>
                </div>
                <div className="dnd-meta-box">
                  <label htmlFor="dnd_ac">Obranné číslo</label>
                  <input
                    id="dnd_ac"
                    value={g('ac', '10')}
                    disabled={disabled}
                    onChange={(e) => set('ac', e.target.value)}
                  />
                </div>
                <div className="dnd-meta-box">
                  <label htmlFor="dnd_speed">Rychlost</label>
                  <input
                    id="dnd_speed"
                    value={g('speed', '9 m')}
                    disabled={disabled}
                    onChange={(e) => set('speed', e.target.value)}
                  />
                </div>
              </div>

              <div className="dnd-hp-panel">
                <div className="hp-row">
                  <div className="hp-box">
                    <label htmlFor="dnd_hpMax">VBD / Max Životy</label>
                    <input
                      id="dnd_hpMax"
                      value={g('hpMax')}
                      disabled={disabled}
                      onChange={(e) => set('hpMax', e.target.value)}
                    />
                  </div>
                  <div className="hp-box" style={{ flex: 1.5 }}>
                    <label htmlFor="dnd_hpCur">Aktuální Životy (BV)</label>
                    <input
                      id="dnd_hpCur"
                      style={{
                        borderColor: 'var(--dnd-hp, var(--dnd-accent))',
                        color: 'var(--dnd-hp, var(--dnd-accent))',
                      }}
                      value={g('hpCur')}
                      disabled={disabled}
                      onChange={(e) => set('hpCur', e.target.value)}
                    />
                  </div>
                </div>
                <div className="hp-row" style={{ marginBottom: 0 }}>
                  <div className="hp-box">
                    <label htmlFor="dnd_hd">Kostky obnovy</label>
                    <input
                      id="dnd_hd"
                      style={{ fontSize: '1.2rem' }}
                      value={g('hd')}
                      disabled={disabled}
                      onChange={(e) => set('hd', e.target.value)}
                    />
                  </div>
                  <div className="hp-box">
                    <label>Záchrany proti smrti</label>
                    <div
                      style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 12 }}
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
              <div className="dnd-panel">
                {SKILLS.map(({ n, a }) => {
                  const prof = skillProf(n);
                  return (
                    <div key={n} className="dnd-list-row">
                      <button
                        type="button"
                        className="prof"
                        disabled={disabled}
                        onClick={() => set(`skill_${n}`, String((prof + 1) % 3))}
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

            {/* COLUMN 3 — Spell quick-ref, weapons, profs/langs/feats */}
            <div>
              {spellEnabled && (
                <>
                  <h3>Rychlý přehled kouzlení / Alchymie</h3>
                  <div className="dnd-panel" style={{ marginBottom: 24 }}>
                    <div className="dnd-list-row">
                      <span className="lbl">Sesílací / Útočná vlastnost</span>
                      <input
                        style={{ width: 80, textAlign: 'center' }}
                        value={g('qc_ss_abi')}
                        disabled={disabled}
                        onChange={(e) => set('qc_ss_abi', e.target.value)}
                      />
                    </div>
                    <div className="dnd-list-row">
                      <span className="lbl">Útočný bonus</span>
                      <input
                        style={{ width: 60, textAlign: 'center' }}
                        value={g('qc_ss_atk')}
                        disabled={disabled}
                        onChange={(e) => set('qc_ss_atk', e.target.value)}
                      />
                    </div>
                    <div className="dnd-list-row" style={{ border: 0 }}>
                      <span className="lbl">Stupeň obtížnosti (SO)</span>
                      <input
                        style={{ width: 60, textAlign: 'center' }}
                        value={g('qc_ss_dc')}
                        disabled={disabled}
                        onChange={(e) => set('qc_ss_dc', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <h3>Zbraně a Doplňky</h3>
              <div className="dnd-panel" style={{ marginBottom: 24 }}>
                <table className="dnd-table">
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
                        {(['n', 'b', 'd', 'o'] as const).map((field) => (
                          <td key={field}>
                            <input
                              value={w[field]}
                              disabled={disabled}
                              onChange={(e) => {
                                const arr = [...weapons];
                                arr[i] = { ...arr[i], [field]: e.target.value };
                                setJson('weapons', arr);
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

              <h3>Zdatnosti (zbroje, zbraně, nástroje)</h3>
              <div className="dnd-panel" style={{ marginBottom: 24 }}>
                <StringListRows
                  items={profList}
                  disabled={disabled}
                  placeholder="Lehké zbroje, dýky, zlodějské náčiní…"
                  addLabel="+ Přidat zdatnost"
                  onWrite={(a) => setJson('profs', a)}
                />
              </div>

              <h3>Jazyky</h3>
              <div className="dnd-panel" style={{ marginBottom: 24 }}>
                <StringListRows
                  items={langList}
                  disabled={disabled}
                  placeholder="Obecná řeč, elfština…"
                  addLabel="+ Přidat jazyk"
                  onWrite={(a) => setJson('langs', a)}
                />
              </div>

              <h3>Schopnosti</h3>
              <div className="dnd-panel">
                <FeatRows
                  items={featList}
                  disabled={disabled}
                  onWrite={(a) => setJson('feats', a)}
                />
              </div>
            </div>
          </div>

          {/* ── POZNÁMKY (plná šířka, úplně dole) ─────────────── */}
          <h3 style={{ marginTop: 24 }}>Poznámky k hraní postavy</h3>
          <div className="dnd-panel dnd-notes-full">
            <textarea
              style={{
                width: '100%',
                minHeight: 140,
                border: 'none',
                resize: 'vertical',
              }}
              value={g('play_notes')}
              disabled={disabled}
              onChange={(e) => set('play_notes', e.target.value)}
              placeholder="Taktika, aktivní efekty, vztahy, příběhové poznámky…"
            />
          </div>
        </>
      )}

      {tab === 'spells' && spellEnabled && (
        <div className="dnd-spells">
          <div className="spell-header">
            {[
              { key: 'sp_class', label: 'Povolání' },
              { key: 'sp_abi', label: 'Sesílací Vlastnost' },
              { key: 'sp_atk', label: 'Útočný Bonus' },
              { key: 'sp_dc', label: 'S.O. Záchrany' },
            ].map((f) => (
              <div key={f.key}>
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

          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
            <SpellLevelBlock
              key={lvl}
              lvl={lvl}
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

interface SpellLevelBlockProps {
  lvl: number;
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
  const spells = getJson<DndSpell>(`spl_${lvl}`);

  return (
    <div className="spell-level">
      <div className="sl-title">
        <h4>{lvl === 0 ? 'Triky' : `${lvl}. Stupeň`}</h4>
        {lvl > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 'bold', color: '#7b6f5e' }}>
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
                borderColor: 'var(--dnd-spell, var(--dnd-accent))',
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
      <table className="dnd-table">
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
                    value={(sp[field as keyof DndSpell] as string) ?? ''}
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
              { p: false, s: false, n: '', u: '', d: '', z: '', r: '', t: '' },
            ])
          }
        >
          + Přidat {lvl === 0 ? 'Trik' : 'Kouzlo'}
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PRINT — statický čitelný dokument (čte stejná `dnd_*` data)
// ════════════════════════════════════════════════════════════════

/** Zdatnost dovednosti: 0 = žádná, 1 = zdatnost, 2 = expertíza. */
const DND_PROF_LABEL = ['', 'zdatnost', 'expertíza'];

function DndPrintView({ cda }: { cda: CdAccess }) {
  const { g } = cda;
  const profBonus = parseInt(g('profBonus', '2'), 10) || 2;
  const getScore = (k: string) => parseInt(g(`abi_${k}`, '10'), 10) || 10;
  const getModFor = (k: string) => calcMod(getScore(k));
  const isSaveProf = (k: string) => g(`save_${k}`) === '1';
  const saveModFor = (k: string) =>
    calcSaveMod(getModFor(k), isSaveProf(k), profBonus);
  const skillProf = (n: string) => parseInt(g(`skill_${n}`, '0'), 10) || 0;
  const skillModFor = (n: string, a: string) =>
    calcSkillMod(getModFor(a), skillProf(n), profBonus);

  const classRows = deriveClasses(cda);
  const totalLevel = jadTotalLevel(classRows);
  const profList = deriveProfs(cda);
  const langList = cda.parseJsonArr<string>('langs');
  const featList = deriveFeats(cda).filter((f) => f.n.trim() || f.d.trim());

  const hasCasterClass = classRows.some((r) => DND_CASTERS.includes(r.c));
  const spRaw = g('spellEnabled');
  const spellEnabled = spRaw === '1' || (spRaw === '' && hasCasterClass);
  const weapons = cda.parseJsonArr<DndWeapon>('weapons');

  const playNotes = g('play_notes').trim();

  return (
    <div className="dnd-print">
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
          <dt>Zkušenosti</dt>
          <dd>{g('xp') || '—'}</dd>
        </div>
        <div>
          <dt>Zdatnostní bonus</dt>
          <dd>{fmtMod(profBonus)}</dd>
        </div>
        <div>
          <dt>Inspirace</dt>
          <dd>{g('insp') === '1' ? 'ano' : 'ne'}</dd>
        </div>
      </dl>

      <h2>Povolání a obory</h2>
      {classRows.length > 0 ? (
        <ul className="matrix-print__plain">
          {classRows.map((r, i) => (
            <li key={i} className="print-row">
              <span>
                {r.c || '—'}
                {r.s ? ` — ${r.s}` : ''}
              </span>
              <span>{r.l ? `${r.l}. úr.` : '—'}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>—</p>
      )}

      <h2>Hlavní vlastnosti</h2>
      <dl className="print-cols">
        {ABIL_MAP.map(({ k, l }) => (
          <div key={k}>
            <dt>{l}</dt>
            <dd>
              {getScore(k)} ({fmtMod(getModFor(k))})
            </dd>
          </div>
        ))}
      </dl>

      <h2>Bojové údaje</h2>
      <dl className="print-cols">
        <div>
          <dt>Iniciativa</dt>
          <dd>{fmtMod(getModFor('dex'))}</dd>
        </div>
        <div>
          <dt>Obranné číslo</dt>
          <dd>{g('ac', '10') || '—'}</dd>
        </div>
        <div>
          <dt>Rychlost</dt>
          <dd>{g('speed', '9 m') || '—'}</dd>
        </div>
        <div>
          <dt>Max Životy (VBD)</dt>
          <dd>{g('hpMax') || '—'}</dd>
        </div>
        <div>
          <dt>Aktuální Životy</dt>
          <dd>{g('hpCur') || '—'}</dd>
        </div>
        <div>
          <dt>Kostky obnovy</dt>
          <dd>{g('hd') || '—'}</dd>
        </div>
        <div>
          <dt>Záchr. proti smrti (úspěch)</dt>
          <dd>{g('ds_s') || '—'}</dd>
        </div>
        <div>
          <dt>Záchr. proti smrti (selhání)</dt>
          <dd>{g('ds_f') || '—'}</dd>
        </div>
      </dl>

      <h2>Záchranné hody</h2>
      <ul className="matrix-print__plain">
        {ABIL_MAP.map(({ k, l }) => (
          <li key={k} className="print-row">
            <span>
              {l}
              {isSaveProf(k) ? ' (zdatný)' : ''}
            </span>
            <span>{fmtMod(saveModFor(k))}</span>
          </li>
        ))}
      </ul>

      <h2>Dovednosti</h2>
      <ul className="matrix-print__plain">
        {SKILLS.map(({ n, a }) => {
          const prof = skillProf(n);
          const profText = DND_PROF_LABEL[prof] ?? '';
          return (
            <li key={n} className="print-row">
              <span>
                {n} ({a.toUpperCase()})
                {profText ? ` — ${profText}` : ''}
              </span>
              <span>{fmtMod(skillModFor(n, a))}</span>
            </li>
          );
        })}
      </ul>

      <h2>Pasivní vnímání a smysly</h2>
      <ul className="matrix-print__plain">
        <li className="print-row">
          <span>Pasivní Vnímání</span>
          <span>{10 + skillModFor('Vnímání', 'wis')}</span>
        </li>
        <li className="print-row">
          <span>Pasivní Vhled</span>
          <span>{10 + skillModFor('Vhled', 'wis')}</span>
        </li>
        <li className="print-row">
          <span>Pasivní Pátrání</span>
          <span>{10 + skillModFor('Pátrání', 'int')}</span>
        </li>
      </ul>

      {spellEnabled && (
        <>
          <h2>Rychlý přehled kouzlení / Alchymie</h2>
          <dl>
            <div>
              <dt>Sesílací / Útočná vlastnost</dt>
              <dd>{g('qc_ss_abi') || '—'}</dd>
            </div>
            <div>
              <dt>Útočný bonus</dt>
              <dd>{g('qc_ss_atk') || '—'}</dd>
            </div>
            <div>
              <dt>Stupeň obtížnosti (SO)</dt>
              <dd>{g('qc_ss_dc') || '—'}</dd>
            </div>
          </dl>
        </>
      )}

      {weapons.length > 0 && (
        <>
          <h2>Zbraně a doplňky</h2>
          <table>
            <thead>
              <tr>
                <th>Zbraň</th>
                <th>Bon</th>
                <th>Zásah</th>
                <th>OČ</th>
              </tr>
            </thead>
            <tbody>
              {weapons.map((w, i) => (
                <tr key={i}>
                  <td>{w.n || '—'}</td>
                  <td>{w.b || '—'}</td>
                  <td>{w.d || '—'}</td>
                  <td>{w.o || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

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
          <h2>Schopnosti</h2>
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

      {spellEnabled && <DndSpellsPrint cda={cda} />}
    </div>
  );
}

/** Kouzla (tab „Kouzla") — vytištěno jen je-li sesilatel zapnut. */
function DndSpellsPrint({ cda }: { cda: CdAccess }) {
  const { g } = cda;
  const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <>
      <h2>Kouzla</h2>
      <dl>
        <div>
          <dt>Povolání</dt>
          <dd>{g('sp_class') || '—'}</dd>
        </div>
        <div>
          <dt>Sesílací vlastnost</dt>
          <dd>{g('sp_abi') || '—'}</dd>
        </div>
        <div>
          <dt>Útočný bonus</dt>
          <dd>{g('sp_atk') || '—'}</dd>
        </div>
        <div>
          <dt>S.O. záchrany</dt>
          <dd>{g('sp_dc') || '—'}</dd>
        </div>
      </dl>

      {levels.map((lvl) => {
        const spells = cda.parseJsonArr<DndSpell>(`spl_${lvl}`);
        if (spells.length === 0) return null;
        const slotsMax = g(`spl_slots_${lvl}`);
        const slotsUsed = g(`spl_used_${lvl}`);
        const title = lvl === 0 ? 'Triky' : `${lvl}. Stupeň`;
        const slotInfo =
          lvl > 0 && (slotsMax || slotsUsed)
            ? ` (pozice: ${slotsUsed || '0'} / ${slotsMax || '0'})`
            : '';
        return (
          <div key={lvl}>
            <h3>
              {title}
              {slotInfo}
            </h3>
            <table>
              <thead>
                <tr>
                  {lvl > 0 && <th>Přip.</th>}
                  <th>Název</th>
                  <th>Úto/SO</th>
                  <th>Doba</th>
                  <th>Dosah</th>
                  <th>Trvání</th>
                </tr>
              </thead>
              <tbody>
                {spells.map((sp, i) => (
                  <tr key={i}>
                    {lvl > 0 && <td>{sp.p ? 'ano' : '—'}</td>}
                    <td>{sp.n || '—'}</td>
                    <td>{sp.u || '—'}</td>
                    <td>{sp.d || '—'}</td>
                    <td>{sp.r || '—'}</td>
                    <td>{sp.t || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}
