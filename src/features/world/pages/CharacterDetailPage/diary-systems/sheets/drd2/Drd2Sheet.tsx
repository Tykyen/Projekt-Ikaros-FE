/**
 * 16.2e — Dračí doupě II (DrD II) deník postavy — fantasy pergamenový list.
 *
 * Jeden sloučený list (bez tabů). Předělané z generického HUD (8.7h) na vzhled
 * věrný papírovému deníku ALTAR, s interaktivními prvky:
 *   - 3 zdroje (Tělo / Duše / Vliv) — klikací segmentová stupnice 0..max + jizvy
 *   - Ohrožení / Výhoda — svislá stupnice 1–9
 *   - Zbraně a zbroje (tabulka, add/remove)
 *   - Pomocníci (seznam add/remove; každý Pouto 0–11)
 *   - Rituální předměty (seznam add/remove; každý Náboj 0–5)
 *   - Zkušenosti (Volné / Celkem)
 *   - Povolání basic/advanced/master s 5-pip trackerem + odebrání
 *   - Zvláštní schopnosti — zadávané RUČNĚ (katalog ALTARu je z UI odpojen)
 *   - Manévry (statická nápověda)
 *
 * Pozn.: katalog 264 ZS [drd2Abilities.ts](./drd2Abilities.ts) NENÍ importován
 * (čeká na licenci ALTAR). Seznamy povolání viz [drd2Professions.ts](./drd2Professions.ts).
 */
import { useState } from 'react';
import { usePrintMode } from '@/features/world/export/print';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  ALL_PROF_NAMES,
  ADVANCED_PROFS,
  BASIC_PROFS,
  MASTER_PROFS,
  type ProfDef,
} from './drd2Professions';

const MANEUVERS = ['Rychle', 'Přesně', 'Mocně', 'Lstivě', 'Rozsáhle', 'Obrana'];

interface Weapon {
  name: string;
  char: string;
  note: string;
}
interface Companion {
  char: string;
  ability: string;
  bound: string;
  pay: string;
  bond: number;
}
interface Ritual {
  name: string;
  charge: number;
}
interface Prof {
  id: string;
  name: string;
  level: number;
  note?: string;
}
interface Zs {
  name: string;
  source: string;
  type: string;
  description: string;
}

const num = (s: string, d = 0): number => {
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? d : n;
};

export function Drd2Sheet({ diary, mode, onChange, onRoll }: SystemSheetProps) {
  const disabled = mode === 'view';
  const printMode = usePrintMode();
  const cda = makeCdAccess(diary.customData ?? {}, 'drd2_', onChange);
  const { g, set } = cda;

  const basicProfs = cda.parseJsonArr<Prof>('basic_professions');
  const advProfs = cda.parseJsonArr<Prof>('advanced_professions');
  const masterProfs = cda.parseJsonArr<Prof>('master_professions');

  const usedLevel =
    basicProfs.reduce((s, p) => s + (p.level || 0), 0) +
    advProfs.reduce((s, p) => s + (p.level || 0), 0) +
    masterProfs.reduce((s, p) => s + (p.level || 0), 0);

  if (printMode)
    return (
      <Drd2PrintView
        cda={cda}
        basicProfs={basicProfs}
        advProfs={advProfs}
        masterProfs={masterProfs}
        usedLevel={usedLevel}
      />
    );

  return (
    <div className="drd2-sheet">
      {/* ═══ HLAVIČKA ═══ */}
      <header className="drd2-head">
        <div className="drd2-head__title">
          <h1>Deník postavy</h1>
          <span className="sub">Dračí doupě II</span>
        </div>
        <div className="drd2-head__fields">
          <div className="field">
            <label htmlFor="drd2_name">Jméno</label>
            <input
              id="drd2_name"
              className="hw"
              value={g('name')}
              disabled={disabled}
              onChange={(e) => set('name', e.target.value)}
              placeholder="zadej jméno…"
            />
          </div>
          <div className="field">
            <label htmlFor="drd2_race">Rasa (kultura)</label>
            <input
              id="drd2_race"
              className="hw"
              value={g('race')}
              disabled={disabled}
              onChange={(e) => set('race', e.target.value)}
            />
          </div>
          <div className="field field--lvl">
            <label>Úroveň · využitá / celková</label>
            <div className="drd2-lvl">
              <span className="used" aria-label="Využitá úroveň">
                {usedLevel}
              </span>
              <span className="slash">/</span>
              <input
                className="hw"
                value={g('total_level')}
                disabled={disabled}
                onChange={(e) => set('total_level', e.target.value)}
                placeholder={String(usedLevel)}
                aria-label="Celková úroveň"
              />
            </div>
          </div>
        </div>
        <div className="drd2-crest" aria-hidden>
          <div className="dd">DRAČÍ DOUPĚ</div>
          <div className="two">II</div>
        </div>
      </header>

      {/* ═══ POSTAVA & STAV ═══ */}
      <div className="drd2-divider">
        <span>Postava &amp; stav</span>
      </div>
      <div className="drd2-grid">
        {/* Zdroje */}
        <section className="drd2-card col-4">
          <h3 className="legend">
            <span className="glyph">❖</span>Zdroje a jizvy
          </h3>
          <SegTrack
            label="Tělo"
            curKey="body"
            maxKey="body_max"
            scarKey="body_scars"
            variant="body"
            cda={cda}
            disabled={disabled}
            onRoll={onRoll}
          />
          <SegTrack
            label="Duše"
            curKey="soul"
            maxKey="soul_max"
            scarKey="soul_scars"
            variant="soul"
            cda={cda}
            disabled={disabled}
            onRoll={onRoll}
          />
          <SegTrack
            label="Vliv"
            curKey="influence"
            maxKey="influence_max"
            scarKey="influence_scars"
            variant="infl"
            cda={cda}
            disabled={disabled}
            onRoll={onRoll}
          />
        </section>

        {/* Boj */}
        <section className="drd2-card col-8">
          <h3 className="legend">
            <span className="glyph">⚔</span>Bojový stav
            {onRoll && (
              <button
                type="button"
                className="drd2-init"
                onClick={() =>
                  onRoll({
                    label: 'Iniciativa',
                    modifier: 0,
                    kind: 'd20',
                    initiative: true,
                  })
                }
                title="Hodit iniciativu (d20)"
              >
                ⚡ Iniciativa
              </button>
            )}
          </h3>
          <div className="drd2-combat">
            <Gauge label="Ohrožení" valKey="threat" variant="threat" cda={cda} disabled={disabled} />
            <div className="drd2-combat__mid">
              <label htmlFor="drd2_state">Stavy a efekty</label>
              <textarea
                id="drd2_state"
                className="drd2-textarea"
                value={g('state_effects')}
                disabled={disabled}
                onChange={(e) => set('state_effects', e.target.value)}
                placeholder="otrávení, probíhající kouzla, postižení…"
              />
              <p className="hint">
                Ohrožení &amp; Výhoda určují náklon boje — klikni na stupínek.
              </p>
            </div>
            <Gauge label="Výhoda" valKey="advantage" variant="adv" cda={cda} disabled={disabled} />
          </div>

          <h3 className="legend" style={{ marginTop: 18 }}>
            <span className="glyph">⚔</span>Zbraně a zbroje
          </h3>
          <WeaponsTable cda={cda} disabled={disabled} />
        </section>

        {/* Pomocníci */}
        <section className="drd2-card col-7">
          <h3 className="legend">
            <span className="glyph">❖</span>Pomocníci
          </h3>
          <CompanionList cda={cda} disabled={disabled} />
        </section>

        {/* Rituály + Zkušenosti */}
        <div className="col-5 drd2-stack">
          <section className="drd2-card">
            <h3 className="legend">
              <span className="glyph">✦</span>Rituální předměty{' '}
              <em className="legend__sub">(zaříkávač)</em>
            </h3>
            <RitualList cda={cda} disabled={disabled} />
          </section>
          <section className="drd2-card">
            <h3 className="legend">
              <span className="glyph">❖</span>Zkušenosti
            </h3>
            <div className="drd2-coins">
              <label className="coin">
                <span>Volné XP</span>
                <input
                  value={g('xp_unused')}
                  disabled={disabled}
                  onChange={(e) => set('xp_unused', e.target.value)}
                  aria-label="Volné XP"
                />
              </label>
              <label className="coin">
                <span>XP celkem</span>
                <input
                  value={g('xp_total')}
                  disabled={disabled}
                  onChange={(e) => set('xp_total', e.target.value)}
                  aria-label="XP celkem"
                />
              </label>
            </div>
          </section>
        </div>
      </div>

      {/* ═══ PROFESE & SCHOPNOSTI ═══ */}
      <div className="drd2-divider">
        <span>Profese &amp; schopnosti</span>
      </div>
      <div className="drd2-profgrid">
        <section className="drd2-card">
          <h3 className="legend">
            <span className="glyph">❖</span>Základní povolání{' '}
            <em className="legend__sub">(úroveň 0–5)</em>
          </h3>
          <ProfList
            arrKey="basic_professions"
            rows={basicProfs}
            catalog={BASIC_PROFS}
            cda={cda}
            disabled={disabled}
          />
        </section>

        <section className="drd2-card">
          <h3 className="legend">
            <span className="glyph">⚜</span>Pokročilá povolání
          </h3>
          <p className="hint">
            Otevře se při součtu ≥ 6 úrovní ve dvou základech (každý min. 1).
          </p>
          <ProfList
            arrKey="advanced_professions"
            rows={advProfs}
            catalog={ADVANCED_PROFS}
            cda={cda}
            disabled={disabled}
          />
        </section>

        <section className="drd2-card">
          <h3 className="legend">
            <span className="glyph">♛</span>Mistrovská povolání
          </h3>
          <p className="hint">
            Otevře se při součtu ≥ 6 úrovní v podmiňujících pokročilých povoláních.
          </p>
          <ProfList
            arrKey="master_professions"
            rows={masterProfs}
            catalog={MASTER_PROFS}
            cda={cda}
            disabled={disabled}
          />
        </section>

        <section className="drd2-card">
          <h3 className="legend">
            <span className="glyph">✦</span>Zvláštní schopnosti (ZS)
          </h3>
          <p className="hint">
            Schopnosti zadej ručně — název, povolání, typ a popis.
          </p>
          <ZsList cda={cda} disabled={disabled} />
        </section>

        <section className="drd2-card">
          <h3 className="legend">
            <span className="glyph">⚔</span>Manévry{' '}
            <em className="legend__sub">(nápověda)</em>
          </h3>
          <div className="drd2-maneuvers">
            {MANEUVERS.map((m) => (
              <span className="man" key={m}>
                {m}
              </span>
            ))}
          </div>
        </section>
      </div>

      <SwordOrnament />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Segmentová stupnice zdroje (Tělo / Duše / Vliv)
// ════════════════════════════════════════════════════════════════

interface SegTrackProps {
  label: string;
  curKey: string;
  maxKey: string;
  scarKey: string;
  variant: 'body' | 'soul' | 'infl';
  cda: CdAccess;
  disabled: boolean;
  onRoll?: SystemSheetProps['onRoll'];
}

function SegTrack({
  label,
  curKey,
  maxKey,
  scarKey,
  variant,
  cda,
  disabled,
  onRoll,
}: SegTrackProps) {
  const { g, set } = cda;
  const max = Math.max(1, Math.min(20, num(g(maxKey, '10'), 10)));
  const cur = Math.max(0, Math.min(max, num(g(curKey, '0'), 0)));

  return (
    <div className={`drd2-pillar ${variant}`}>
      <div className="drd2-pillar__top">
        <span className="name">{label}</span>
        <span className="val">
          <b>{cur}</b> /{' '}
          <input
            className="maxin"
            value={g(maxKey, '10')}
            disabled={disabled}
            onChange={(e) => set(maxKey, e.target.value)}
            aria-label={`${label} hranice`}
          />
        </span>
        {onRoll && (
          <button
            type="button"
            className="drd2-roll"
            onClick={() => onRoll({ label, modifier: cur, kind: 'd20' })}
            title={`Hodit ${label} (d20 + ${cur})`}
            aria-label={`Hodit ${label}`}
          >
            🎲
          </button>
        )}
      </div>
      <div className="drd2-track" role="group" aria-label={`${label} stav`}>
        {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
          <button
            type="button"
            key={i}
            className={`seg ${i <= cur ? 'on' : ''}`}
            disabled={disabled}
            onClick={() => set(curKey, String(cur === i ? i - 1 : i))}
            aria-label={`${label} ${i}`}
            aria-pressed={i <= cur}
          />
        ))}
      </div>
      <input
        className="drd2-scar"
        value={g(scarKey)}
        disabled={disabled}
        onChange={(e) => set(scarKey, e.target.value)}
        placeholder={`jizvy — ${label.toLowerCase()}…`}
        aria-label={`${label} jizvy`}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Stupnice Ohrožení / Výhoda (1–9)
// ════════════════════════════════════════════════════════════════

interface GaugeProps {
  label: string;
  valKey: string;
  variant: 'threat' | 'adv';
  cda: CdAccess;
  disabled: boolean;
}

function Gauge({ label, valKey, variant, cda, disabled }: GaugeProps) {
  const { g, set } = cda;
  const cur = Math.max(0, Math.min(9, num(g(valKey, '0'), 0)));
  return (
    <div className={`drd2-gauge ${variant}`}>
      <h4>{label}</h4>
      <div className="big" aria-label={label}>
        {cur}
      </div>
      <div className="ladder" role="group" aria-label={`${label} stupnice`}>
        {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((i) => (
          <button
            type="button"
            key={i}
            className={`rung ${i <= cur ? 'on' : ''}`}
            disabled={disabled}
            onClick={() => set(valKey, String(cur === i ? i - 1 : i))}
            aria-label={`${label} ${i}`}
            aria-pressed={i <= cur}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Zbraně a zbroje
// ════════════════════════════════════════════════════════════════

function WeaponsTable({ cda, disabled }: { cda: CdAccess; disabled: boolean }) {
  const rows = cda.parseJsonArr<Weapon>('weapons');
  return (
    <div className="drd2-table">
      <table>
        <thead>
          <tr>
            <th>Předmět</th>
            <th>Charakteristika</th>
            <th>Poznámka / modifikátory</th>
            <th aria-hidden />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {(['name', 'char', 'note'] as const).map((f) => (
                <td key={f}>
                  <input
                    className="line"
                    value={row[f] || ''}
                    disabled={disabled}
                    onChange={(e) =>
                      cda.updateArr<Weapon>('weapons', i, { [f]: e.target.value })
                    }
                    aria-label={`Zbraň ${i + 1} ${f}`}
                  />
                </td>
              ))}
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="drd2-del"
                    onClick={() => cda.removeArr('weapons', i)}
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
          className="drd2-addrow"
          onClick={() =>
            cda.addArr<Weapon>('weapons', { name: '', char: '', note: '' })
          }
        >
          + přidat zbraň / zbroj
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Pomocníci (seznam)
// ════════════════════════════════════════════════════════════════

function CompanionList({ cda, disabled }: { cda: CdAccess; disabled: boolean }) {
  const rows = cda.parseJsonArr<Companion>('companions');
  return (
    <>
      {rows.map((row, i) => {
        const bond = Math.max(0, Math.min(11, row.bond || 0));
        return (
          <div className="drd2-companion" key={i}>
            {!disabled && (
              <button
                type="button"
                className="drd2-del"
                onClick={() => cda.removeArr('companions', i)}
                aria-label="Smazat pomocníka"
              >
                ✕
              </button>
            )}
            <div className="drd2-twocol">
              {(
                [
                  ['char', 'Charakter.'],
                  ['ability', 'Schopnost'],
                  ['bound', 'Hranice'],
                  ['pay', 'Platba'],
                ] as const
              ).map(([f, lbl]) => (
                <div className="fieldrow" key={f}>
                  <label>{lbl}</label>
                  <input
                    className="line"
                    value={(row[f] as string) || ''}
                    disabled={disabled}
                    onChange={(e) =>
                      cda.updateArr<Companion>('companions', i, {
                        [f]: e.target.value,
                      })
                    }
                    aria-label={`Pomocník ${i + 1} ${lbl}`}
                  />
                </div>
              ))}
            </div>
            <div className="drd2-bond">
              <label>Pouto</label>
              <div className="drd2-pips" role="group" aria-label={`Pomocník ${i + 1} pouto`}>
                {Array.from({ length: 11 }, (_, k) => k + 1).map((k) => (
                  <button
                    type="button"
                    key={k}
                    className={`pip-sq ${k <= bond ? 'on' : ''}`}
                    disabled={disabled}
                    onClick={() =>
                      cda.updateArr<Companion>('companions', i, {
                        bond: bond === k ? k - 1 : k,
                      })
                    }
                    aria-label={`Pouto ${k}`}
                    aria-pressed={k <= bond}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
      {!disabled && (
        <button
          type="button"
          className="drd2-addrow"
          onClick={() =>
            cda.addArr<Companion>('companions', {
              char: '',
              ability: '',
              bound: '',
              pay: '',
              bond: 0,
            })
          }
        >
          + přidat pomocníka
        </button>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// Rituální předměty (seznam)
// ════════════════════════════════════════════════════════════════

function RitualList({ cda, disabled }: { cda: CdAccess; disabled: boolean }) {
  const rows = cda.parseJsonArr<Ritual>('rituals');
  return (
    <>
      {rows.map((row, i) => {
        const charge = Math.max(0, Math.min(5, row.charge || 0));
        return (
          <div className="drd2-ritual" key={i}>
            <input
              className="line"
              value={row.name || ''}
              disabled={disabled}
              onChange={(e) =>
                cda.updateArr<Ritual>('rituals', i, { name: e.target.value })
              }
              placeholder="rituální předmět…"
              aria-label={`Rituální předmět ${i + 1}`}
            />
            <div className="drd2-pips" role="group" aria-label={`Rituál ${i + 1} náboj`}>
              {[1, 2, 3, 4, 5].map((k) => (
                <button
                  type="button"
                  key={k}
                  className={`pip-sq charge ${k <= charge ? 'on' : ''}`}
                  disabled={disabled}
                  onClick={() =>
                    cda.updateArr<Ritual>('rituals', i, {
                      charge: charge === k ? k - 1 : k,
                    })
                  }
                  aria-label={`Náboj ${k}`}
                  aria-pressed={k <= charge}
                />
              ))}
            </div>
            {!disabled && (
              <button
                type="button"
                className="drd2-del"
                onClick={() => cda.removeArr('rituals', i)}
                aria-label="Smazat rituální předmět"
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
          className="drd2-addrow"
          onClick={() => cda.addArr<Ritual>('rituals', { name: '', charge: 0 })}
        >
          + přidat rituální předmět
        </button>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// Povolání (basic / advanced / master)
// ════════════════════════════════════════════════════════════════

interface ProfListProps {
  arrKey: string;
  rows: Prof[];
  catalog: ProfDef[];
  cda: CdAccess;
  disabled: boolean;
}

function ProfList({ arrKey, rows, catalog, cda, disabled }: ProfListProps) {
  const [addingId, setAddingId] = useState('');
  const setRows = (v: Prof[]) => cda.set(arrKey, JSON.stringify(v));
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
          <div className="drd2-prof" key={row.id}>
            <div className="drd2-prof__seal" aria-hidden>
              {row.name.charAt(0)}
            </div>
            <div className="drd2-prof__body">
              <div className="drd2-prof__name">
                {row.name}
                {def?.requires && (
                  <span className="req"> — {def.requires.join(' + ')}</span>
                )}
              </div>
              <input
                className="drd2-prof__note"
                value={row.note || ''}
                disabled={disabled}
                onChange={(e) => {
                  const copy = [...rows];
                  copy[i] = { ...row, note: e.target.value };
                  setRows(copy);
                }}
                placeholder="poznámka…"
                aria-label={`Poznámka ${row.name}`}
              />
            </div>
            <div className="drd2-pips5" role="group" aria-label={`${row.name} úroveň`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  className={`dot ${row.level >= n ? 'on' : ''}`}
                  disabled={disabled}
                  onClick={() => {
                    const copy = [...rows];
                    copy[i] = { ...row, level: row.level === n ? n - 1 : n };
                    setRows(copy);
                  }}
                  aria-label={`${row.name} úroveň ${n}`}
                  aria-pressed={row.level >= n}
                >
                  {n}
                </button>
              ))}
            </div>
            {!disabled && (
              <button
                type="button"
                className="drd2-del"
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
        );
      })}

      {!disabled && available.length > 0 && (
        <div className="drd2-adder">
          <select
            value={addingId}
            onChange={(e) => setAddingId(e.target.value)}
            aria-label={`Přidat povolání ${arrKey}`}
          >
            <option value="">— vyber povolání —</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.requires ? ` (${c.requires.join(' + ')})` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="drd2-addrow inline"
            disabled={!addingId}
            onClick={handleAdd}
          >
            + přidat
          </button>
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// Zvláštní schopnosti — ruční zadávání
// ════════════════════════════════════════════════════════════════

function ZsList({ cda, disabled }: { cda: CdAccess; disabled: boolean }) {
  const rows = cda.parseJsonArr<Zs>('special_abilities');
  return (
    <>
      {rows.map((row, i) => (
        <div className="drd2-zs" key={i}>
          <input
            className="zs__name"
            value={row.name || ''}
            disabled={disabled}
            onChange={(e) =>
              cda.updateArr<Zs>('special_abilities', i, { name: e.target.value })
            }
            placeholder="název schopnosti"
            aria-label={`ZS ${i + 1} název`}
          />
          {!disabled && (
            <button
              type="button"
              className="drd2-del"
              onClick={() => cda.removeArr('special_abilities', i)}
              aria-label="Smazat schopnost"
            >
              ✕
            </button>
          )}
          <div className="zs__top">
            <select
              className="zs__prof"
              value={row.source || ''}
              disabled={disabled}
              onChange={(e) =>
                cda.updateArr<Zs>('special_abilities', i, {
                  source: e.target.value,
                })
              }
              aria-label={`ZS ${i + 1} povolání`}
            >
              <option value="">— povolání —</option>
              {ALL_PROF_NAMES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              className="zs__type"
              value={row.type || ''}
              disabled={disabled}
              onChange={(e) =>
                cda.updateArr<Zs>('special_abilities', i, { type: e.target.value })
              }
              placeholder="typ (aktivní / pasivní…)"
              aria-label={`ZS ${i + 1} typ`}
            />
          </div>
          <textarea
            className="zs__desc"
            value={row.description || ''}
            disabled={disabled}
            onChange={(e) =>
              cda.updateArr<Zs>('special_abilities', i, {
                description: e.target.value,
              })
            }
            placeholder="popis / efekt"
            aria-label={`ZS ${i + 1} popis`}
          />
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          className="drd2-addrow"
          onClick={() =>
            cda.addArr<Zs>('special_abilities', {
              name: '',
              source: '',
              type: '',
              description: '',
            })
          }
        >
          + přidat ZS
        </button>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// Meč ornament
// ════════════════════════════════════════════════════════════════

function SwordOrnament() {
  return (
    <div className="drd2-sword" aria-hidden>
      <span className="ln" />
      <svg width="150" height="22" viewBox="0 0 150 22" fill="none">
        <path d="M2 11 H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="44" y="6" width="6" height="10" rx="1.5" className="hilt" />
        <path d="M50 11 L132 8 L140 11 L132 14 Z" className="blade" stroke="currentColor" strokeWidth="1.4" />
        <path d="M140 11 L148 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="47" cy="11" r="3.4" className="hilt" stroke="currentColor" strokeWidth="1" />
      </svg>
      <span className="ln" />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PRINT — statický čitelný dokument (čte stejná `drd2_*` data)
// ════════════════════════════════════════════════════════════════

function levelPips(level: number): string {
  const filled = Math.max(0, Math.min(5, level || 0));
  return '●'.repeat(filled) + '○'.repeat(5 - filled);
}

interface Drd2PrintViewProps {
  cda: CdAccess;
  basicProfs: Prof[];
  advProfs: Prof[];
  masterProfs: Prof[];
  usedLevel: number;
}

function Drd2PrintView({
  cda,
  basicProfs,
  advProfs,
  masterProfs,
  usedLevel,
}: Drd2PrintViewProps) {
  const { g } = cda;
  const weapons = cda.parseJsonArr<Weapon>('weapons');
  const companions = cda.parseJsonArr<Companion>('companions');
  const rituals = cda.parseJsonArr<Ritual>('rituals');
  const abilities = cda.parseJsonArr<Zs>('special_abilities');
  const allProfs = [...basicProfs, ...advProfs, ...masterProfs];
  const stateEffects = g('state_effects').trim();

  return (
    <div className="drd2-print">
      <h2>Identita</h2>
      <dl>
        <div>
          <dt>Jméno postavy</dt>
          <dd>{g('name') || '—'}</dd>
        </div>
        <div>
          <dt>Rasa (kultura)</dt>
          <dd>{g('race') || '—'}</dd>
        </div>
        <div>
          <dt>Úroveň (využitá / celková)</dt>
          <dd>
            {usedLevel} / {g('total_level') || String(usedLevel)}
          </dd>
        </div>
      </dl>

      <h2>Zdroje a jizvy</h2>
      <dl>
        {(
          [
            ['Tělo', 'body', 'body_max', 'body_scars'],
            ['Duše', 'soul', 'soul_max', 'soul_scars'],
            ['Vliv', 'influence', 'influence_max', 'influence_scars'],
          ] as const
        ).map(([lbl, cur, mx, sc]) => (
          <div key={cur}>
            <dt>{lbl}</dt>
            <dd>
              {g(cur, '0')} / {g(mx, '10')}
              {g(sc).trim() ? ` — ${g(sc).trim()}` : ''}
            </dd>
          </div>
        ))}
      </dl>

      <h2>Bojový stav</h2>
      <dl className="print-cols">
        <div>
          <dt>Ohrožení</dt>
          <dd>{g('threat') || '0'}</dd>
        </div>
        <div>
          <dt>Výhoda</dt>
          <dd>{g('advantage') || '0'}</dd>
        </div>
      </dl>
      {stateEffects && (
        <>
          <h3>Stavy a efekty</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{stateEffects}</p>
        </>
      )}

      {weapons.length > 0 && (
        <>
          <h2>Zbraně a zbroje</h2>
          <table>
            <thead>
              <tr>
                <th>Předmět</th>
                <th>Charakteristika</th>
                <th>Poznámka / modifikátory</th>
              </tr>
            </thead>
            <tbody>
              {weapons.map((w, i) => (
                <tr key={i}>
                  <td>{w.name || '—'}</td>
                  <td>{w.char || '—'}</td>
                  <td>{w.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {companions.length > 0 && (
        <>
          <h2>Pomocníci</h2>
          <table>
            <thead>
              <tr>
                <th>Charakteristika</th>
                <th>Schopnost</th>
                <th>Hranice</th>
                <th>Platba</th>
                <th>Pouto</th>
              </tr>
            </thead>
            <tbody>
              {companions.map((c, i) => (
                <tr key={i}>
                  <td>{c.char || '—'}</td>
                  <td>{c.ability || '—'}</td>
                  <td>{c.bound || '—'}</td>
                  <td>{c.pay || '—'}</td>
                  <td>{c.bond || 0} / 11</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {rituals.length > 0 && (
        <>
          <h2>Rituální předměty</h2>
          <ul className="matrix-print__plain">
            {rituals.map((r, i) => (
              <li key={i} className="print-row">
                <span>{r.name || '—'}</span>
                <span>náboj {r.charge || 0} / 5</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>Zkušenosti</h2>
      <dl className="print-cols">
        <div>
          <dt>Volné XP</dt>
          <dd>{g('xp_unused') || '—'}</dd>
        </div>
        <div>
          <dt>XP celkem</dt>
          <dd>{g('xp_total') || '—'}</dd>
        </div>
      </dl>

      {allProfs.length > 0 && (
        <>
          <h2>Povolání</h2>
          {(
            [
              ['Základní povolání', basicProfs],
              ['Pokročilá povolání', advProfs],
              ['Mistrovská povolání', masterProfs],
            ] as const
          ).map(([title, list]) =>
            list.length > 0 ? (
              <div key={title}>
                <h3>{title}</h3>
                <ul className="matrix-print__plain">
                  {list.map((p, i) => (
                    <li key={i} className="print-row">
                      <span>{p.name || '—'}</span>
                      <span>{levelPips(p.level)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </>
      )}

      {abilities.length > 0 && (
        <>
          <h2>Zvláštní schopnosti (ZS)</h2>
          <table>
            <thead>
              <tr>
                <th>Název</th>
                <th>Povolání</th>
                <th>Typ</th>
                <th>Popis</th>
              </tr>
            </thead>
            <tbody>
              {abilities.map((a, i) => (
                <tr key={i}>
                  <td>{a.name || '—'}</td>
                  <td>{a.source || '—'}</td>
                  <td>{a.type || '—'}</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{a.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Manévry</h2>
      <p>{MANEUVERS.join(' · ')}</p>
    </div>
  );
}
