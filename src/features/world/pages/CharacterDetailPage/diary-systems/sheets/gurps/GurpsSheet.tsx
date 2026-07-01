/**
 * GURPS 4E — deník postavy (Ikaros).
 *
 * Data v `diary.customData` s prefixem `gurps_*`. Layout kopíruje klasický
 * character sheet (atributy / škody / obrana / naložení / zbroj / dovednosti /
 * výhody-nevýhody-zvláštnosti / shrnutí bodů) v tmavém „cold-steel" tématu.
 *
 * Odvozené hodnoty (rychlost, pohyb, úhyb, škody, naložení, bodový účet) jsou
 * "hybrid": počítají se z atributů (viz `formulas.ts`), ale hráč je smí přepsat
 * (prázdný override → auto). Škody Úder/Mách se berou z 4E tabulky ST→kostky.
 */
import type { ReactNode } from 'react';
import { usePrintMode } from '@/features/world/export/print';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  GURPS_ARMOR_LOCS,
  GURPS_CHIP_FIELDS,
  GURPS_CORE_ATTRS,
  GURPS_META_FIELDS,
  GURPS_SECONDARY,
  type GurpsMelee,
  type GurpsRanged,
  type GurpsSkill,
  type GurpsTrait,
} from './constants';
import {
  attributeCost,
  basicLift,
  basicMove,
  basicSpeed,
  dodge,
  encTable,
  int,
  num,
  pointSummary,
  signed,
  swing,
  thrust,
} from './formulas';

/** Číslo s desetinnou čárkou (6.25 → „6,25"). */
const fmt = (n: number) => String(n).replace('.', ',');

export function GurpsSheet({ diary, mode, onChange }: SystemSheetProps) {
  const printMode = usePrintMode();
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'gurps_', onChange);
  const { g } = cda;

  if (printMode) return <GurpsPrintView cda={cda} />;

  const editing = mode === 'edit';

  // ── efektivní hodnoty (override || auto) ──
  const st = int(g('st', '10'), 10);
  const dx = int(g('dx', '10'), 10);
  const iq = int(g('iq', '10'), 10);
  const ht = int(g('ht', '10'), 10);
  const willEff = g('will') ? int(g('will'), iq) : iq;
  const perEff = g('per') ? int(g('per'), iq) : iq;
  const hpMaxEff = g('hp_max') ? int(g('hp_max'), st) : st;
  const fpMaxEff = g('fp_max') ? int(g('fp_max'), ht) : ht;

  const speedComputed = basicSpeed(dx, ht);
  const speedEff = g('basic_speed') ? num(g('basic_speed'), speedComputed) : speedComputed;
  const moveComputed = basicMove(speedEff);
  const moveEff = g('basic_move') ? int(g('basic_move'), moveComputed) : moveComputed;
  const dodgeComputed = dodge(speedEff);
  const dodgeEff = g('dodge') ? int(g('dodge'), dodgeComputed) : dodgeComputed;
  const bl = basicLift(st);
  const enc = encTable(st, moveEff, dodgeEff);

  // ── bodový účet ──
  const skills = cda.parseJsonArr<GurpsSkill>('skills');
  const advs = cda.parseJsonArr<GurpsTrait>('advs');
  const disadvs = cda.parseJsonArr<GurpsTrait>('disadvs');
  const quirks = cda.parseJsonArr<GurpsTrait>('quirks');
  const attrCost = attributeCost({
    st, dx, iq, ht,
    will: willEff, per: perEff,
    hp: hpMaxEff, fp: fpMaxEff,
    speed: speedEff, move: moveEff,
  });
  const summary = pointSummary({
    attrCost,
    advantages: advs,
    disadvantages: disadvs,
    quirks,
    skills,
  });
  const budget = int(g('points_budget'), 0);
  const unspent = budget - summary.total;

  const attrPointCost: Record<string, number> = {
    st: (st - 10) * 10,
    dx: (dx - 10) * 20,
    iq: (iq - 10) * 20,
    ht: (ht - 10) * 10,
  };

  return (
    <div className="gurps-dashboard">
      {/* ═══ HEADER ═══ */}
      <div className="g-head">
        <div className="g-brand">
          <span className="gg">GURPS</span>
          <span className="sub">Deník postavy</span>
          <span className="ed">4. edice</span>
        </div>

        <div className="g-idfields">
          <Field cda={cda} k="name" label="Jméno postavy" editing={editing} wide />
          <Field cda={cda} k="player" label="Hráč" editing={editing} />
          {GURPS_META_FIELDS.map((f) => (
            <Field
              key={f.key}
              cda={cda}
              k={f.key}
              label={f.label}
              editing={editing}
              wide={f.wide}
            />
          ))}
        </div>

        <div className="g-chips">
          {GURPS_CHIP_FIELDS.map((f) => (
            <div className="chip" key={f.key}>
              <div className="k">{f.label}</div>
              {editing ? (
                <input
                  className="chip-in"
                  value={g(f.key)}
                  onChange={(e) => cda.set(f.key, e.target.value)}
                  aria-label={f.label}
                />
              ) : (
                <div className="n sm">{g(f.key) || '—'}</div>
              )}
            </div>
          ))}
          <div className="chip unspent">
            <div className="k">Nevyužité</div>
            <div className="n">{unspent}</div>
          </div>
          <div className="chip total">
            <div className="k">Bodů celkem</div>
            {editing ? (
              <input
                className="chip-in"
                value={g('points_budget')}
                placeholder="0"
                onChange={(e) => cda.set('points_budget', e.target.value)}
                aria-label="Bodů celkem (rozpočet)"
              />
            ) : (
              <div className="n">{budget || '—'}</div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div className="g-main">
        {/* LEFT — stat spine */}
        <div className="g-stack">
          <div className="g-card">
            <h3>Atributy</h3>
            <div className="g-attrs">
              {GURPS_CORE_ATTRS.map((a) => (
                <div className="g-attr" key={a.key}>
                  <div className="lab">
                    {a.label}
                    <small>{a.abbr}</small>
                  </div>
                  {editing ? (
                    <input
                      className="num"
                      value={g(a.key, '10')}
                      onChange={(e) => cda.set(a.key, e.target.value)}
                      aria-label={`${a.label} (${a.abbr})`}
                    />
                  ) : (
                    <div className="num">{g(a.key, '10')}</div>
                  )}
                  <div className="pt">{signed(attrPointCost[a.key])}</div>
                </div>
              ))}
            </div>

            <div className="g-sec2">
              {GURPS_SECONDARY.map((s) => (
                <Override
                  key={s.key}
                  cda={cda}
                  k={s.key}
                  computed={s.key === 'will' ? willEff : perEff}
                  editing={editing}
                  boxLabel={`${s.label} (${s.abbr})`}
                  box
                />
              ))}
            </div>

            <div className="g-mini">
              <Vital
                cda={cda}
                curK="hp"
                maxK="hp_max"
                maxComputed={hpMaxEff}
                editing={editing}
                label="HP (=ST)"
                variant="hp"
              />
              <Vital
                cda={cda}
                curK="fp"
                maxK="fp_max"
                maxComputed={fpMaxEff}
                editing={editing}
                label="FP (=HT)"
                variant="fp"
              />
            </div>
          </div>

          <div className="g-card">
            <h3>Škody</h3>
            <div className="g-kv damage">
              <Row label="Úder" sub="thrust">
                <Override cda={cda} k="dmg_thr" computed={thrust(st)} editing={editing} boxLabel="Úder (thrust)" />
              </Row>
              <Row label="Mách" sub="swing">
                <Override cda={cda} k="dmg_sw" computed={swing(st)} editing={editing} boxLabel="Mách (swing)" />
              </Row>
            </div>
          </div>

          <div className="g-card">
            <h3>Pohyb</h3>
            <div className="g-kv">
              <Row label="Zákl. rychlost" sub="(HT+DX)/4">
                <Override cda={cda} k="basic_speed" computed={fmt(speedComputed)} editing={editing} boxLabel="Základní rychlost" />
              </Row>
              <Row label="Pohyb" sub="Move">
                <Override cda={cda} k="basic_move" computed={moveComputed} editing={editing} boxLabel="Pohyb (Move)" />
              </Row>
              <Row label="Nosnost (BL)" sub="ST²/5">
                <span className="v">{fmt(bl)} lb</span>
              </Row>
            </div>
          </div>

          <div className="g-card">
            <h3>Aktivní obrana</h3>
            <div className="g-adef">
              <div className="d">
                <div className="n">
                  <Override cda={cda} k="dodge" computed={dodgeComputed} editing={editing} boxLabel="Úhyb (Dodge)" />
                </div>
                <div className="k">Úhyb</div>
                <div className="frm">rychlost+3</div>
              </div>
              <div className="d">
                <div className="n">
                  <Edit cda={cda} k="parry" label="Kryt zbraní (Parry)" editing={editing} className="ov" />
                </div>
                <div className="k">Kryt zbraní</div>
                <div className="frm">dov./2+3</div>
              </div>
              <div className="d">
                <div className="n">
                  <Edit cda={cda} k="block" label="Kryt štítem (Block)" editing={editing} className="ov" />
                </div>
                <div className="k">Kryt štítem</div>
                <div className="frm">dov./2+3</div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER — naložení + zbroj + zbraně */}
        <div className="g-stack">
          <div className="g-card">
            <h3>Naložení a Úhyb</h3>
            <table className="g-tbl">
              <thead>
                <tr>
                  <th>Úroveň</th>
                  <th>Váha</th>
                  <th className="num">Limit</th>
                  <th className="num">Pohyb</th>
                  <th className="num">Úhyb</th>
                </tr>
              </thead>
              <tbody>
                {enc.map((e) => (
                  <tr key={e.key}>
                    <td>{e.label}</td>
                    <td className="dim">{e.mult}</td>
                    <td className="num">{e.limit} lb</td>
                    <td className="num">{e.move}</td>
                    <td className="num dodge">{e.dodge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="g-card">
            <h3>
              Zbroj <span className="tag">DR po částech těla</span>
            </h3>
            <table className="g-tbl armor">
              <thead>
                <tr>
                  <th></th>
                  {GURPS_ARMOR_LOCS.map((l) => (
                    <th key={l.key} className="num">
                      {l.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="dr">DR</td>
                  {GURPS_ARMOR_LOCS.map((l) => (
                    <td key={l.key} className="num dr-cell">
                      {editing ? (
                        <input
                          value={g(`dr_${l.key}`)}
                          placeholder="0"
                          onChange={(e) => cda.set(`dr_${l.key}`, e.target.value)}
                          aria-label={`DR ${l.label}`}
                        />
                      ) : (
                        g(`dr_${l.key}`, '0')
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <div className="g-kv" style={{ marginTop: 8 }}>
              <Row label="Štít — bonus obrany (DB)">
                <Edit cda={cda} k="shield_db" label="Štít (DB)" editing={editing} className="ov" />
              </Row>
            </div>
          </div>

          <div className="g-card">
            <h3>Zbraně na blízko</h3>
            <RowsTable
              cda={cda}
              editing={editing}
              arrKey="melee"
              cols={[
                { key: 'name', label: 'Zbraň' },
                { key: 'dmg', label: 'Škody' },
                { key: 'reach', label: 'Dosah', num: true },
                { key: 'parry', label: 'Kryt', num: true },
              ]}
              addLabel="+ Přidat zbraň"
              template={{ name: '', dmg: '', reach: '', parry: '' }}
            />
          </div>

          <div className="g-card">
            <h3>Střelné / vrhací zbraně</h3>
            <RowsTable
              cda={cda}
              editing={editing}
              arrKey="ranged"
              cols={[
                { key: 'name', label: 'Zbraň' },
                { key: 'dmg', label: 'Škody' },
                { key: 'acc', label: 'Přs', num: true },
                { key: 'range', label: 'Dostřel', num: true },
                { key: 'shots', label: 'Náboje', num: true },
              ]}
              addLabel="+ Přidat střelnou zbraň"
              template={{ name: '', dmg: '', acc: '', range: '', shots: '' }}
            />
          </div>
        </div>

        {/* RIGHT — dovednosti */}
        <div className="g-col-skills">
          <div className="g-card">
            <h3>
              Dovednosti <span className="hint">body · úroveň</span>
            </h3>
            <RowsTable
              cda={cda}
              editing={editing}
              arrKey="skills"
              cols={[
                { key: 'name', label: 'Dovednost' },
                { key: 'base', label: 'Zákl.' },
                { key: 'pts', label: 'Body', num: true },
                { key: 'lvl', label: 'Úroveň', num: true, accent: true },
              ]}
              addLabel="+ Přidat dovednost"
              template={{ name: '', base: '', pts: '', lvl: '' }}
            />
          </div>
        </div>
      </div>

      {/* ═══ TRAITS ═══ */}
      <div className="g-card g-full">
        <h3>Výhody · Nevýhody · Zvláštnosti</h3>
        <div className="g-traits">
          <TraitCol
            cda={cda}
            editing={editing}
            arrKey="advs"
            title="Výhody"
            tone="accent"
            sum={summary.advantages}
            addLabel="+ Přidat výhodu"
          />
          <TraitCol
            cda={cda}
            editing={editing}
            arrKey="disadvs"
            title="Nevýhody"
            tone="hp"
            sum={summary.disadvantages}
            addLabel="+ Přidat nevýhodu"
            defaultPts="-5"
          />
          <TraitCol
            cda={cda}
            editing={editing}
            arrKey="quirks"
            title="Zvláštnosti"
            tone="fp"
            sum={summary.quirks}
            addLabel="+ Přidat zvláštnost"
            defaultPts="-1"
          />
        </div>
      </div>

      {/* ═══ BOTTOM ═══ */}
      <div className="g-bottom">
        <div className="g-card">
          <h3>Poznámky k postavě</h3>
          {editing ? (
            <textarea
              className="g-textarea"
              value={g('notes')}
              onChange={(e) => cda.set('notes', e.target.value)}
              placeholder="Poznámky, historie, motivace…"
              aria-label="Poznámky"
            />
          ) : (
            <div className="g-notes-ro">{g('notes') || '—'}</div>
          )}
        </div>

        <div className="g-card g-summary">
          <h3>Shrnutí bodů</h3>
          <div className="row">
            <span>Atributy + sekundární</span>
            <span className="v">{summary.attributes}</span>
          </div>
          <div className="row">
            <span>Výhody</span>
            <span className="v">{summary.advantages}</span>
          </div>
          <div className="row">
            <span>Nevýhody</span>
            <span className="v neg">{summary.disadvantages}</span>
          </div>
          <div className="row">
            <span>Zvláštnosti</span>
            <span className="v neg">{summary.quirks}</span>
          </div>
          <div className="row">
            <span>Dovednosti</span>
            <span className="v">{summary.skills}</span>
          </div>
          <div className="row tot">
            <span>Celkem</span>
            <span className="v">{summary.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpery ───────────────────────────────────────────────────────

/** Textové editovatelné pole (input v editu, text ve view). */
function Field({
  cda,
  k,
  label,
  editing,
  wide,
  center,
}: {
  cda: CdAccess;
  k: string;
  label: string;
  editing: boolean;
  wide?: boolean;
  center?: boolean;
}) {
  const v = cda.g(k);
  return (
    <div className={`g-field${wide ? ' wide' : ''}`}>
      <label htmlFor={`gurps_${k}`}>{label}</label>
      {editing ? (
        <input
          id={`gurps_${k}`}
          className={center ? 'center' : ''}
          value={v}
          onChange={(e) => cda.set(k, e.target.value)}
          aria-label={label}
        />
      ) : (
        <div className={`v${center ? ' center' : ''}`}>{v || '—'}</div>
      )}
    </div>
  );
}

/** Bezlabelové editovatelné pole (input v editu, text ve view). */
function Edit({
  cda,
  k,
  label,
  editing,
  placeholder = '—',
  className = '',
}: {
  cda: CdAccess;
  k: string;
  label: string;
  editing: boolean;
  placeholder?: string;
  className?: string;
}) {
  const v = cda.g(k);
  return editing ? (
    <input
      className={className}
      value={v}
      placeholder={placeholder}
      onChange={(e) => cda.set(k, e.target.value)}
      aria-label={label}
    />
  ) : (
    <span className="v">{v || placeholder}</span>
  );
}

/** Odvozená hodnota s override (prázdný input = auto = `computed`). */
function Override({
  cda,
  k,
  computed,
  editing,
  boxLabel,
  box,
}: {
  cda: CdAccess;
  k: string;
  computed: string | number;
  editing: boolean;
  boxLabel: string;
  box?: boolean;
}) {
  const stored = cda.g(k);
  const inner = editing ? (
    <input
      className="ov"
      value={stored}
      placeholder={String(computed)}
      onChange={(e) => cda.set(k, e.target.value)}
      aria-label={boxLabel}
    />
  ) : (
    <span className="v">{stored || String(computed)}</span>
  );
  if (!box) return inner;
  return (
    <div className="g-box">
      <div className="k">{boxLabel}</div>
      <div className="val">{inner}</div>
    </div>
  );
}

/** Životy / únava (aktuální / max), max default = computed. */
function Vital({
  cda,
  curK,
  maxK,
  maxComputed,
  editing,
  label,
  variant,
}: {
  cda: CdAccess;
  curK: string;
  maxK: string;
  maxComputed: number;
  editing: boolean;
  label: string;
  variant: 'hp' | 'fp';
}) {
  const maxStored = cda.g(maxK);
  const maxShown = maxStored || String(maxComputed);
  const curStored = cda.g(curK);
  const curShown = curStored || maxShown;
  return (
    <div className={`g-box ${variant}`}>
      <div className="k">{label}</div>
      {editing ? (
        <div className="vital-in">
          <input
            value={curStored}
            placeholder={maxShown}
            onChange={(e) => cda.set(curK, e.target.value)}
            aria-label={`${label} aktuální`}
          />
          <span>/</span>
          <input
            value={maxStored}
            placeholder={String(maxComputed)}
            onChange={(e) => cda.set(maxK, e.target.value)}
            aria-label={`${label} max`}
          />
        </div>
      ) : (
        <div className="val">
          {curShown} / {maxShown}
        </div>
      )}
    </div>
  );
}

/** Řádek štítek → hodnota. */
function Row({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <div className="row">
      <span className="k">
        {label}
        {sub && <small> {sub}</small>}
      </span>
      {children}
    </div>
  );
}

interface Col {
  key: string;
  label: string;
  num?: boolean;
  accent?: boolean;
}

/** Editovatelná tabulka řádků (input v editu, text ve view). */
function RowsTable({
  cda,
  editing,
  arrKey,
  cols,
  addLabel,
  template,
}: {
  cda: CdAccess;
  editing: boolean;
  arrKey: string;
  cols: Col[];
  addLabel: string;
  template: Record<string, string>;
}) {
  const rows = cda.parseJsonArr<Record<string, string>>(arrKey);
  return (
    <div className="g-table">
      <table className="g-tbl">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} className={c.num ? 'num' : ''}>
                {c.label}
              </th>
            ))}
            {editing && <th className="del-col" />}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && !editing && (
            <tr>
              <td colSpan={cols.length} className="empty">
                —
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td
                  key={c.key}
                  className={`${c.num ? 'num' : ''}${c.accent ? ' accent' : ''}`}
                >
                  {editing ? (
                    <input
                      value={row[c.key] || ''}
                      onChange={(e) =>
                        cda.updateArr<Record<string, string>>(arrKey, i, {
                          [c.key]: e.target.value,
                        })
                      }
                      aria-label={`${c.label} ${i + 1}`}
                    />
                  ) : (
                    row[c.key] || '—'
                  )}
                </td>
              ))}
              {editing && (
                <td className="del-col">
                  <button
                    type="button"
                    className="del"
                    onClick={() => cda.removeArr(arrKey, i)}
                    aria-label="Smazat řádek"
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {editing && (
        <button
          type="button"
          className="add"
          onClick={() => cda.addArr(arrKey, template)}
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}

/** Sloupec traitů (výhody/nevýhody/zvláštnosti) s bodovým součtem. */
function TraitCol({
  cda,
  editing,
  arrKey,
  title,
  tone,
  sum,
  addLabel,
  defaultPts = '',
}: {
  cda: CdAccess;
  editing: boolean;
  arrKey: string;
  title: string;
  tone: 'accent' | 'hp' | 'fp';
  sum: number;
  addLabel: string;
  defaultPts?: string;
}) {
  const rows = cda.parseJsonArr<GurpsTrait>(arrKey);
  return (
    <div className={`g-trait-col tone-${tone}`}>
      <h4>
        {title} <span className="badge">{signed(sum)}</span>
      </h4>
      <ul>
        {rows.length === 0 && !editing && <li className="empty">—</li>}
        {rows.map((row, i) => (
          <li key={i}>
            {editing ? (
              <>
                <input
                  className="t-name"
                  value={row.name || ''}
                  onChange={(e) =>
                    cda.updateArr<GurpsTrait>(arrKey, i, { name: e.target.value })
                  }
                  aria-label={`${title} ${i + 1}`}
                />
                <input
                  className="t-pts"
                  value={row.pts || ''}
                  onChange={(e) =>
                    cda.updateArr<GurpsTrait>(arrKey, i, { pts: e.target.value })
                  }
                  aria-label={`${title} body ${i + 1}`}
                />
                <button
                  type="button"
                  className="del"
                  onClick={() => cda.removeArr(arrKey, i)}
                  aria-label="Smazat řádek"
                >
                  ✕
                </button>
              </>
            ) : (
              <>
                <span>{row.name || '—'}</span>
                <span className="p">{row.pts || ''}</span>
              </>
            )}
          </li>
        ))}
      </ul>
      {editing && (
        <button
          type="button"
          className="add"
          onClick={() => cda.addArr(arrKey, { name: '', pts: defaultPts })}
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PRINT — statický čitelný dokument (čte stejná `gurps_*` data)
// ════════════════════════════════════════════════════════════════

function PrintTable({
  cda,
  arrKey,
  cols,
}: {
  cda: CdAccess;
  arrKey: string;
  cols: [string, string][];
}) {
  const rows = cda.parseJsonArr<Record<string, string>>(arrKey);
  if (rows.length === 0) return null;
  return (
    <table>
      <thead>
        <tr>
          {cols.map(([k, label]) => (
            <th key={k}>{label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {cols.map(([k]) => (
              <td key={k}>{row[k] || '—'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GurpsPrintView({ cda }: { cda: CdAccess }) {
  const { g } = cda;
  const st = int(g('st', '10'), 10);
  const dx = int(g('dx', '10'), 10);
  const ht = int(g('ht', '10'), 10);
  const iq = int(g('iq', '10'), 10);
  const willEff = g('will') ? int(g('will'), iq) : iq;
  const perEff = g('per') ? int(g('per'), iq) : iq;
  const hpMaxEff = g('hp_max') ? int(g('hp_max'), st) : st;
  const fpMaxEff = g('fp_max') ? int(g('fp_max'), ht) : ht;
  const speedEff = g('basic_speed') ? num(g('basic_speed'), basicSpeed(dx, ht)) : basicSpeed(dx, ht);
  const moveEff = g('basic_move') ? int(g('basic_move'), basicMove(speedEff)) : basicMove(speedEff);
  const dodgeEff = g('dodge') ? int(g('dodge'), dodge(speedEff)) : dodge(speedEff);
  const attrCost = attributeCost({
    st, dx, iq, ht, will: willEff, per: perEff,
    hp: hpMaxEff, fp: fpMaxEff, speed: speedEff, move: moveEff,
  });
  const summary = pointSummary({
    attrCost,
    advantages: cda.parseJsonArr<GurpsTrait>('advs'),
    disadvantages: cda.parseJsonArr<GurpsTrait>('disadvs'),
    quirks: cda.parseJsonArr<GurpsTrait>('quirks'),
    skills: cda.parseJsonArr<GurpsSkill>('skills'),
  });
  const notes = g('notes').trim();

  return (
    <div className="gurps-print">
      <dl>
        <div>
          <dt>Jméno</dt>
          <dd>{g('name') || '—'}</dd>
        </div>
        <div>
          <dt>Hráč</dt>
          <dd>{g('player') || '—'}</dd>
        </div>
        {GURPS_META_FIELDS.map((f) => (
          <div key={f.key}>
            <dt>{f.label}</dt>
            <dd>{g(f.key) || '—'}</dd>
          </div>
        ))}
        <div>
          <dt>Bodů celkem</dt>
          <dd>{g('points_budget') || summary.total}</dd>
        </div>
      </dl>

      <h2>Atributy</h2>
      <dl className="print-cols">
        {GURPS_CORE_ATTRS.map((a) => (
          <div key={a.key}>
            <dt>
              {a.label} ({a.abbr})
            </dt>
            <dd>{g(a.key, '10')}</dd>
          </div>
        ))}
        <div>
          <dt>Vůle (Will)</dt>
          <dd>{willEff}</dd>
        </div>
        <div>
          <dt>Vnímání (Per)</dt>
          <dd>{perEff}</dd>
        </div>
        <div>
          <dt>HP</dt>
          <dd>
            {g('hp') || hpMaxEff} / {hpMaxEff}
          </dd>
        </div>
        <div>
          <dt>FP</dt>
          <dd>
            {g('fp') || fpMaxEff} / {fpMaxEff}
          </dd>
        </div>
        <div>
          <dt>Úder / Mách</dt>
          <dd>
            {g('dmg_thr') || thrust(st)} / {g('dmg_sw') || swing(st)}
          </dd>
        </div>
        <div>
          <dt>Rychlost / Pohyb / Úhyb</dt>
          <dd>
            {fmt(speedEff)} / {moveEff} / {dodgeEff}
          </dd>
        </div>
        <div>
          <dt>Nosnost (BL)</dt>
          <dd>{fmt(basicLift(st))} lb</dd>
        </div>
      </dl>

      <h2>Zbroj (DR)</h2>
      <dl className="print-cols">
        {GURPS_ARMOR_LOCS.map((l) => (
          <div key={l.key}>
            <dt>{l.label}</dt>
            <dd>{g(`dr_${l.key}`, '0')}</dd>
          </div>
        ))}
      </dl>

      <h2>Dovednosti</h2>
      <PrintTable
        cda={cda}
        arrKey="skills"
        cols={[
          ['name', 'Dovednost'],
          ['base', 'Zákl.'],
          ['pts', 'Body'],
          ['lvl', 'Úroveň'],
        ]}
      />

      <h2>Výhody</h2>
      <PrintTable cda={cda} arrKey="advs" cols={[['name', 'Výhoda'], ['pts', 'Body']]} />
      <h2>Nevýhody</h2>
      <PrintTable cda={cda} arrKey="disadvs" cols={[['name', 'Nevýhoda'], ['pts', 'Body']]} />
      <h2>Zvláštnosti</h2>
      <PrintTable cda={cda} arrKey="quirks" cols={[['name', 'Zvláštnost'], ['pts', 'Body']]} />

      <h2>Zbraně na blízko</h2>
      <PrintTable
        cda={cda}
        arrKey="melee"
        cols={[
          ['name', 'Zbraň'],
          ['dmg', 'Škody'],
          ['reach', 'Dosah'],
          ['parry', 'Kryt'],
        ]}
      />
      <h2>Střelné / vrhací zbraně</h2>
      <PrintTable
        cda={cda}
        arrKey="ranged"
        cols={[
          ['name', 'Zbraň'],
          ['dmg', 'Škody'],
          ['acc', 'Přs'],
          ['range', 'Dostřel'],
          ['shots', 'Náboje'],
        ]}
      />

      <h2>Shrnutí bodů</h2>
      <dl className="print-cols">
        <div>
          <dt>Atributy + sekundární</dt>
          <dd>{summary.attributes}</dd>
        </div>
        <div>
          <dt>Výhody</dt>
          <dd>{summary.advantages}</dd>
        </div>
        <div>
          <dt>Nevýhody</dt>
          <dd>{summary.disadvantages}</dd>
        </div>
        <div>
          <dt>Zvláštnosti</dt>
          <dd>{summary.quirks}</dd>
        </div>
        <div>
          <dt>Dovednosti</dt>
          <dd>{summary.skills}</dd>
        </div>
        <div>
          <dt>Celkem</dt>
          <dd>{summary.total}</dd>
        </div>
      </dl>

      {notes && (
        <>
          <h2>Poznámky k postavě</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{notes}</p>
        </>
      )}
    </div>
  );
}

export type { GurpsMelee, GurpsRanged, GurpsSkill, GurpsTrait };
