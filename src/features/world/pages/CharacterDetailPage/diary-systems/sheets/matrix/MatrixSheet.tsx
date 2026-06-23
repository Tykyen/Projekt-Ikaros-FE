/**
 * 16.2a — Matrix / Ikaros deník postavy. Redesign „operátorský HUD".
 *
 * Vizuál: styles/matrix.css (scoped [data-diary-system='matrix']).
 * Data v `diary.customData` s prefixem `matrix_*` přes `makeCdAccess`.
 * 3 režimy: view (čtení) · edit (klikací prvky + inputy) · print
 * (oddělený statický `MatrixPrintView`).
 *
 * Sekce: Hero · Jazyky · Fyzický stav · Body schopností · Přetlaky ·
 *        Schopnosti · Aspekty · Poznámky.
 */
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { usePrintMode } from '@/features/world/export/print';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  MATRIX_PRESSURE_TYPES,
  MATRIX_SKILL_MAX_PC,
  matrixLevelName,
  isMatrixMagic,
  matrixMagicSlug,
  type MatrixTagValue,
} from './constants';

type OnRoll = NonNullable<SystemSheetProps['onRoll']>;

export function MatrixSheet({
  diary,
  mode,
  worldSlug,
  onChange,
  onRoll,
}: SystemSheetProps) {
  const printMode = usePrintMode();
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'matrix_', onChange);

  if (printMode) return <MatrixPrintView cda={cda} />;

  const editing = mode === 'edit';

  return (
    <div className="matrix-sheet" data-mode={mode}>
      <Hero cda={cda} editing={editing} onRoll={onRoll} />
      <LanguagesPanel cda={cda} editing={editing} />
      <VitalsPanel cda={cda} editing={editing} />
      <BudgetPanel cda={cda} editing={editing} />
      <PressurePanel cda={cda} editing={editing} />
      <SkillsPanel cda={cda} editing={editing} worldSlug={worldSlug} onRoll={onRoll} />
      <AspectsPanel cda={cda} editing={editing} />
      <NotesPanel cda={cda} editing={editing} />
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────

interface SubProps {
  cda: CdAccess;
  editing: boolean;
}

/** Body schopností: trojúhelník per schopnost + každý aspekt nad 3 ×6. */
function computeUsedPoints(cda: CdAccess): {
  used: number;
  max: number;
  over: boolean;
} {
  const abilities = cda.parseJsonArr<MatrixTagValue>('abilities');
  const aspects = cda.parseJsonArr<MatrixTagValue>('aspects');
  const skillsCost = abilities.reduce((sum, ab) => {
    const v = parseInt(ab.value, 10) || 0;
    let tri = 0;
    for (let i = 1; i <= v; i++) tri += i;
    return sum + tri;
  }, 0);
  const aspectsCost = Math.max(0, aspects.length - 3) * 6;
  const used = skillsCost + aspectsCost;
  const max = parseInt(cda.g('abilityPoints', '0'), 10) || 0;
  return { used, max, over: used > max };
}

/** Nejvyšší úroveň schopnosti (pro validaci aspektů). */
function maxSkillLevel(cda: CdAccess): number {
  return cda
    .parseJsonArr<MatrixTagValue>('abilities')
    .reduce((m, ab) => Math.max(m, parseInt(ab.value, 10) || 0), 0);
}

function langClass(level: string): string {
  const c = (level || '').trim()[0]?.toUpperCase();
  return c === 'A' ? 'lvl-a' : c === 'B' ? 'lvl-b' : c === 'C' ? 'lvl-c' : '';
}

/** Pips 1..total, barva dle dosaženého stupně. */
function Pips({
  lvl,
  total,
  editable,
  onPick,
}: {
  lvl: number;
  total: number;
  editable?: boolean;
  onPick?: (n: number) => void;
}) {
  const pips = [];
  for (let i = 1; i <= total; i++) {
    const on = i <= lvl;
    const cls = `mx-pip${on ? ' on' + (lvl >= 8 ? ' entity' : '') : ''}`;
    const style = on
      ? ({ ['--lvlc' as string]: `var(--lvl-${Math.min(lvl, 10)})` } as CSSProperties)
      : undefined;
    pips.push(
      editable ? (
        <button
          key={i}
          type="button"
          className={cls}
          style={style}
          onClick={() => onPick?.(i)}
          aria-label={`Stupeň ${i}`}
        />
      ) : (
        <span key={i} className={cls} style={style} />
      ),
    );
  }
  return <span className="mx-pips">{pips}</span>;
}

/** Segmentový vitals track. */
function VitalTrack({
  value,
  total,
  kind,
  mod,
}: {
  value: number;
  total: number;
  kind: 'hp' | 'rune' | 'arm';
  mod?: string;
}) {
  const segs = [];
  for (let i = 1; i <= total; i++) {
    const on = i <= value;
    segs.push(
      <div
        key={i}
        className={`mx-seg ${kind}${on ? ' on' + (mod ? ' ' + mod : '') : ''}`}
      />,
    );
  }
  return <div className="mx-track">{segs}</div>;
}

// ── Hero ─────────────────────────────────────────────────

function Hero({
  cda,
  editing,
  onRoll,
}: SubProps & { onRoll?: OnRoll }) {
  const { g, set } = cda;
  const name = g('name');
  const initials =
    name
      .split(/\s+/)
      .map((w) => w[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';
  const fate = parseInt(g('fatePoints', '0'), 10) || 0;
  const stars = Array.from({ length: 3 }, (_, i) => (i < fate ? '✦' : '✧')).join(' ');

  return (
    <header className="mx-hero">
      <div className="mx-portrait">
        <span>{initials}</span>
      </div>
      <div className="mx-id">
        <h1 className="mx-name">{name || 'Bez jména'}</h1>
        <div className="mx-meta">
          <MetaRow label="Stát" value={g('bornWhere')} editing={editing} onChange={(v) => set('bornWhere', v)} />
          <MetaRow label="Povolání" value={g('profession')} editing={editing} onChange={(v) => set('profession', v)} />
          <MetaRow label="Magický genom" value={g('magicGene')} editing={editing} onChange={(v) => set('magicGene', v)} muted />
        </div>
        {onRoll && (
          <button
            type="button"
            className="mx-add"
            style={{ marginTop: 4, maxWidth: 200 }}
            onClick={() => onRoll({ label: 'Iniciativa', modifier: 0, kind: 'fate' })}
          >
            ⚡ Iniciativa
          </button>
        )}
      </div>
      <div className="mx-fate">
        <span className="lab">Body osudu</span>
        {editing ? (
          <input
            className="mx-input mx-num"
            type="number"
            min={0}
            max={3}
            value={fate}
            onChange={(e) =>
              set('fatePoints', String(Math.max(0, Math.min(3, parseInt(e.target.value, 10) || 0))))
            }
            aria-label="Body osudu"
          />
        ) : (
          <span className="num">{fate}</span>
        )}
        <span className="star">{stars}</span>
      </div>
    </header>
  );
}

function MetaRow({
  label,
  value,
  editing,
  onChange,
  muted,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  muted?: boolean;
}) {
  return (
    <div className="line">
      <span className="k">{label}</span>
      {editing ? (
        <input
          className="mx-input hero-in"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
      ) : (
        <span className="v" style={muted && !value ? { color: '#5b6585' } : undefined}>
          {value || '—'}
        </span>
      )}
    </div>
  );
}

// ── Jazyky ───────────────────────────────────────────────

function LanguagesPanel({ cda, editing }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const langs = parseJsonArr<MatrixTagValue>('languages');
  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  return (
    <section className="mx-panel">
      <h2 className="mx-title">Jazyky</h2>
      <div className="mx-row2">
        {langs.map((l, i) =>
          editing ? (
            <div className="mx-lang edit" key={i}>
              <select
                className="mx-input"
                value={LEVELS.includes(l.value) ? l.value : 'A1'}
                onChange={(e) => updateArr<MatrixTagValue>('languages', i, { value: e.target.value })}
                aria-label="Úroveň jazyka"
              >
                {LEVELS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <input
                className="mx-input name"
                value={l.label}
                onChange={(e) => updateArr<MatrixTagValue>('languages', i, { label: e.target.value })}
                placeholder="Jazyk"
              />
              <span className="mx-del" onClick={() => removeArr('languages', i)} role="button" aria-label="Smazat jazyk">
                ✕
              </span>
            </div>
          ) : (
            <div className="mx-lang" key={i}>
              <span className={`mx-lang__lvl ${langClass(l.value)}`}>{l.value || '—'}</span>
              <span className="mx-lang__name">{l.label || '—'}</span>
            </div>
          ),
        )}
      </div>
      {editing && (
        <button
          type="button"
          className="mx-add"
          onClick={() => addArr<MatrixTagValue>('languages', { label: '', value: 'A1' })}
        >
          + Přidat jazyk
        </button>
      )}
    </section>
  );
}

// ── Fyzický stav ─────────────────────────────────────────

function VitalsPanel({ cda, editing }: SubProps) {
  const { g, set } = cda;
  const health = parseInt(g('health', '5'), 10) || 0;
  const rune = parseInt(g('magicHealth', '0'), 10) || 0;
  const armor = parseInt(g('armor', '0'), 10) || 0;
  const tiredness = parseInt(g('tiredness', '0'), 10) || 0;

  const hpMod = health >= 4 ? '' : health >= 2 ? 'warn' : 'crit';
  const hpPen =
    health >= 4 ? ['0', ''] : health >= 2 ? ['−1', 'warn'] : health >= 1 ? ['−2', 'warn'] : ['SMRT', 'crit'];
  const tPen =
    tiredness <= 5
      ? ['0', '']
      : tiredness <= 10
        ? ['−1', 'warn']
        : tiredness <= 15
          ? ['−2', 'warn']
          : tiredness <= 20
            ? ['BEZ', 'warn']
            : ['SMRT', 'crit'];

  return (
    <section className="mx-panel mx-panel--accent">
      <h2 className="mx-title">Fyzický stav</h2>
      <div className="mx-vitals-grid">
        <div>
          <div className="mx-vit-group">
            <VitalCell label="❤ Životy" name="Životy" valueKey="health" value={health} max={5} kind="hp" mod={hpMod} cda={cda} editing={editing} />
            <VitalCell label="◇ Runa" name="Runa" valueKey="magicHealth" value={rune} max={Math.max(rune, 2)} kind="rune" cda={cda} editing={editing} />
            <VitalCell label="🛡 Ochrana" name="Ochrana" valueKey="armor" value={armor} max={Math.max(armor, 3)} kind="arm" cda={cda} editing={editing} />
          </div>
          <div className="mx-status">
            <span>Postih:</span>
            <span className={`badge ${hpPen[1]}`}>{hpPen[0]}</span>
            <span className="scale">
              <b>4–5 ▸ 0</b> · <b>2–3 ▸ −1</b> · <b>1 ▸ −2</b> · <b>0 ▸ SMRT</b>
            </span>
          </div>
        </div>
        <div>
          <div className="mx-vit">
            <div className="mx-vit__head">
              <span className="mx-vit__label">⚡ Únava</span>
              {editing ? (
                <input
                  className="mx-input mx-num"
                  type="number"
                  min={0}
                  value={tiredness}
                  onChange={(e) => set('tiredness', String(Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  aria-label="Únava"
                />
              ) : (
                <span className="mx-vit__num">
                  {tiredness}
                  <small>/25</small>
                </span>
              )}
            </div>
          </div>
          <div className="mx-status">
            <span>Postih:</span>
            <span className={`badge ${tPen[1]}`}>{tPen[0]}</span>
            <span className="scale">0–5 ▸ 0 · 6–10 ▸ −1 · 11–15 ▸ −2 · 16–20 ▸ BEZ · 21+ ▸ SMRT</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function VitalCell({
  label,
  name,
  valueKey,
  value,
  max,
  kind,
  mod,
  cda,
  editing,
}: SubProps & {
  label: string;
  name: string;
  valueKey: string;
  value: number;
  max: number;
  kind: 'hp' | 'rune' | 'arm';
  mod?: string;
}) {
  const { set } = cda;
  return (
    <div className="mx-vit">
      <div className="mx-vit__head">
        <span className="mx-vit__label">{label}</span>
        {editing ? (
          <input
            className="mx-input mx-num"
            type="number"
            min={0}
            value={value}
            onChange={(e) => set(valueKey, String(Math.max(0, parseInt(e.target.value, 10) || 0)))}
            aria-label={name}
          />
        ) : (
          <span className="mx-vit__num">
            {value}
            <small>/{max}</small>
          </span>
        )}
      </div>
      <VitalTrack value={value} total={max} kind={kind} mod={mod} />
    </div>
  );
}

// ── Body schopností ──────────────────────────────────────

function BudgetPanel({ cda, editing }: SubProps) {
  const { g, set } = cda;
  const { used, max, over } = computeUsedPoints(cda);
  const pct = over ? 100 : max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const lastUpd = g('lastFatePointModification');

  return (
    <section className="mx-panel">
      <div className="mx-budget">
        <div className="blk">
          <div className="mx-budget__head">
            <span className="mx-budget__lab">▸ Body schopností</span>
            <span className={`mx-budget__val ${over ? 'over' : ''}`}>
              <span className={over ? 'over' : ''}>{used}</span> /{' '}
              {editing ? (
                <input
                  className="mx-input mx-num"
                  type="number"
                  min={0}
                  value={max}
                  onChange={(e) => set('abilityPoints', String(Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  aria-label="Strop bodů schopností"
                />
              ) : (
                max
              )}
            </span>
          </div>
          <div className="mx-budget__bar">
            <div className={`mx-budget__fill ${over ? 'over' : ''}`} style={{ width: `${pct}%` }} />
          </div>
          {over && <span className="mx-budget__warn">⚠ Přečerpáno o {used - max} b.</span>}
        </div>
        <span className="upd">
          Poslední úprava: <b>{lastUpd || '—'}</b>
        </span>
      </div>
    </section>
  );
}

// ── Přetlaky ─────────────────────────────────────────────

function PressurePanel({ cda, editing }: SubProps) {
  const { g, set } = cda;
  return (
    <section className="mx-panel">
      <h2 className="mx-title">Přetlaky</h2>
      <div className="mx-pressure">
        {MATRIX_PRESSURE_TYPES.map((p) => {
          const current = parseInt(g(`pressure_${p.key}`, '-1'), 10);
          return (
            <div className="mx-pr-row" key={p.key}>
              <span className="lab">{p.label}</span>
              <div className="mx-pr-rail" role="group" aria-label={`Přetlak ${p.label}`}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const on = current >= i; // current = nejvyšší aktivní index (0..4)
                  const cls = `mx-pr-seg ${on ? 'on' + (i + 1) : ''}`;
                  return editing ? (
                    <button
                      key={i}
                      type="button"
                      className={cls}
                      onClick={() => set(`pressure_${p.key}`, String(current === i ? i - 1 : i))}
                      aria-label={`${p.label} ${i + 1} z 5`}
                      aria-pressed={on}
                    />
                  ) : (
                    <i key={i} className={cls} />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Schopnosti ───────────────────────────────────────────

function SkillsPanel({
  cda,
  editing,
  worldSlug,
  onRoll,
}: SubProps & { worldSlug: string; onRoll?: OnRoll }) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const skills = parseJsonArr<MatrixTagValue>('abilities');
  const aspectCount = parseJsonArr<MatrixTagValue>('aspects').length;

  return (
    <section className="mx-panel">
      <h2 className="mx-title">Schopnosti</h2>
      <div className="mx-list">
        {skills.map((s, i) => {
          const lvl = parseInt(s.value, 10) || 0;
          const total = Math.max(MATRIX_SKILL_MAX_PC, lvl);
          const lvlc = `var(--lvl-${Math.min(Math.max(lvl, 1), 10)})`;
          const tooHigh = lvl > aspectCount;
          const magic = isMatrixMagic(s.label);
          const tip = `${lvl} — ${matrixLevelName(lvl)}`;

          return (
            <div
              className={`mx-skill${editing ? ' edit' : ''}${tooHigh ? ' toohigh' : ''}`}
              key={i}
              style={{ ['--lvlc' as string]: lvlc } as CSSProperties}
              title={tooHigh ? `Úroveň ${lvl} vyžaduje aspoň ${lvl} aspektů (máš ${aspectCount})` : undefined}
            >
              {editing ? (
                <>
                  <input
                    className="mx-input name"
                    value={s.label}
                    onChange={(e) => updateArr<MatrixTagValue>('abilities', i, { label: e.target.value })}
                    placeholder="Název schopnosti"
                  />
                  <MagicMark magic={magic} name={s.label} worldSlug={worldSlug} />
                  <Pips lvl={lvl} total={total} editable onPick={(n) => updateArr<MatrixTagValue>('abilities', i, { value: String(n) })} />
                  <span className="mx-skill__lvl" data-tip={tip}>
                    {lvl}
                    <small>/{MATRIX_SKILL_MAX_PC}</small>
                  </span>
                  <span className="mx-del" onClick={() => removeArr('abilities', i)} role="button" aria-label="Smazat schopnost">
                    ✕
                  </span>
                </>
              ) : (
                <>
                  <span className="mx-skill__name">
                    {s.label || '—'}
                    <MagicMark magic={magic} name={s.label} worldSlug={worldSlug} />
                  </span>
                  {onRoll && s.label && (
                    <button
                      type="button"
                      className="mx-del"
                      style={{ background: 'rgba(120,200,120,0.12)', color: '#9ddf9d', borderColor: 'rgba(120,200,120,0.4)' }}
                      onClick={() => onRoll({ label: s.label, modifier: lvl, kind: 'fate' })}
                      aria-label={`Hodit ${s.label}`}
                      title={`Hodit ${s.label}`}
                    >
                      🎲
                    </button>
                  )}
                  <Pips lvl={lvl} total={total} />
                  <span className="mx-skill__lvl" data-tip={tip}>
                    {lvl}
                    <small>/{MATRIX_SKILL_MAX_PC}</small>
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
      {editing && (
        <button
          type="button"
          className="mx-add"
          onClick={() => addArr<MatrixTagValue>('abilities', { label: '', value: '1' })}
        >
          + Přidat schopnost
        </button>
      )}
    </section>
  );
}

/** 📘 auto-match: pokud název = magie v pravidlech → odkaz na stránku magie. */
function MagicMark({ magic, name, worldSlug }: { magic: boolean; name: string; worldSlug: string }) {
  if (!magic) return null;
  return (
    <Link
      className="mx-skill__mag"
      to={`/svet/${worldSlug}/${matrixMagicSlug(name)}`}
      title={`Otevřít pravidlo magie: ${name}`}
    >
      📘
    </Link>
  );
}

// ── Aspekty ──────────────────────────────────────────────

function AspectsPanel({ cda, editing }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const aspects = parseJsonArr<MatrixTagValue>('aspects');
  const maxLvl = maxSkillLevel(cda);
  const deficit = maxLvl > aspects.length;

  return (
    <section className="mx-panel">
      <h2 className="mx-title">Aspekty</h2>
      <div className="mx-list">
        {aspects.map((a, i) => {
          const charged = a.value === 'Nabitý';
          return editing ? (
            <div className="mx-aspect edit" key={i}>
              <input
                className="mx-input name"
                value={a.label}
                onChange={(e) => updateArr<MatrixTagValue>('aspects', i, { label: e.target.value })}
                placeholder="Aspekt / perk"
              />
              <span
                className={`mx-chip ${charged ? 'charged' : 'depleted'}`}
                style={{ cursor: 'pointer' }}
                onClick={() => updateArr<MatrixTagValue>('aspects', i, { value: charged ? 'Vybitý' : 'Nabitý' })}
                role="button"
                aria-pressed={charged}
              >
                {charged ? 'Nabitý' : 'Vybitý'}
              </span>
              <span className="mx-del" onClick={() => removeArr('aspects', i)} role="button" aria-label="Smazat aspekt">
                ✕
              </span>
            </div>
          ) : (
            <div className="mx-aspect" key={i}>
              <span className="mx-aspect__name">{a.label || '—'}</span>
              <span className={`mx-chip ${charged ? 'charged' : 'depleted'}`}>{charged ? 'Nabitý' : 'Vybitý'}</span>
            </div>
          );
        })}
      </div>
      {deficit && (
        <div className="mx-warn">
          ⚠ Málo aspektů — nejvyšší schopnost má úroveň {maxLvl}, potřebuješ aspoň {maxLvl} aspektů (máš {aspects.length}).
        </div>
      )}
      {editing && (
        <button
          type="button"
          className="mx-add"
          onClick={() => addArr<MatrixTagValue>('aspects', { label: '', value: 'Vybitý' })}
        >
          + Přidat aspekt
        </button>
      )}
    </section>
  );
}

// ── Poznámky ─────────────────────────────────────────────

function NotesPanel({ cda, editing }: SubProps) {
  const { g, set } = cda;
  return (
    <section className="mx-panel">
      <h2 className="mx-title">Poznámky</h2>
      <textarea
        className="mx-gear"
        value={g('inventory')}
        readOnly={!editing}
        onChange={(e) => set('inventory', e.target.value)}
        placeholder="Výbava postavy, poznámky, vztahy, RP detaily..."
        aria-label="Poznámky"
      />
    </section>
  );
}

// ════════════════════════════════════════════════════════
// PRINT — statický čitelný dokument (čte stejná `matrix_*` data)
// ════════════════════════════════════════════════════════

/** Přetlak -1..4 jako ●●●○○ (vždy 5 znaků). */
function pressurePips(cur: number): string {
  const filled = Math.max(0, cur + 1);
  return '●'.repeat(filled) + '○'.repeat(5 - filled);
}

function MatrixPrintView({ cda }: { cda: CdAccess }) {
  const { g } = cda;
  const abilities = cda.parseJsonArr<MatrixTagValue>('abilities');
  const languages = cda.parseJsonArr<MatrixTagValue>('languages');
  const aspects = cda.parseJsonArr<MatrixTagValue>('aspects');
  const { used, max } = computeUsedPoints(cda);
  const inventory = g('inventory').trim();

  return (
    <div className="matrix-print">
      <dl>
        <div>
          <dt>Jméno</dt>
          <dd>{g('name') || '—'}</dd>
        </div>
        <div>
          <dt>Stát</dt>
          <dd>{g('bornWhere') || '—'}</dd>
        </div>
        <div>
          <dt>Povolání</dt>
          <dd>{g('profession') || '—'}</dd>
        </div>
        <div>
          <dt>Magický genom</dt>
          <dd>{g('magicGene') || '—'}</dd>
        </div>
        <div>
          <dt>Poslední úprava</dt>
          <dd>{g('lastFatePointModification') || '—'}</dd>
        </div>
        <div>
          <dt>Body schopností</dt>
          <dd>
            {used} / {max}
          </dd>
        </div>
        <div>
          <dt>Body osudu</dt>
          <dd>{g('fatePoints', '0')}</dd>
        </div>
      </dl>

      <h2>Fyzický stav</h2>
      <dl className="print-cols">
        <div>
          <dt>Životy</dt>
          <dd>{g('health', '0')}</dd>
        </div>
        <div>
          <dt>Runa</dt>
          <dd>{g('magicHealth', '0')}</dd>
        </div>
        <div>
          <dt>Ochrana</dt>
          <dd>{g('armor', '0')}</dd>
        </div>
        <div>
          <dt>Únava</dt>
          <dd>{g('tiredness', '0')}</dd>
        </div>
      </dl>

      <h2>Přetlaky</h2>
      <ul className="matrix-print__plain">
        {MATRIX_PRESSURE_TYPES.map((p) => (
          <li key={p.key} className="print-row">
            <span>{p.label}</span>
            <span>{pressurePips(parseInt(g(`pressure_${p.key}`, '-1'), 10))}</span>
          </li>
        ))}
      </ul>

      {languages.length > 0 && (
        <>
          <h3>Jazyky</h3>
          <ul className="matrix-print__plain">
            {languages.map((l, i) => (
              <li key={i} className="print-row">
                <span>{l.label || '—'}</span>
                <span>{l.value}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {abilities.length > 0 && (
        <>
          <h3>Schopnosti</h3>
          <ul className="matrix-print__plain">
            {abilities.map((a, i) => (
              <li key={i} className="print-row">
                <span>
                  {a.label || '—'}
                  {isMatrixMagic(a.label) ? ' (magická)' : ''}
                </span>
                <span>
                  {a.value} — {matrixLevelName(parseInt(a.value, 10) || 0)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {aspects.length > 0 && (
        <>
          <h3>Aspekty</h3>
          <ul className="matrix-print__plain">
            {aspects.map((a, i) => (
              <li key={i} className="print-row">
                <span>{a.label || '—'}</span>
                <span>{a.value}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {inventory && (
        <>
          <h2>Poznámky</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{inventory}</p>
        </>
      )}
    </div>
  );
}
