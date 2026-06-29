/**
 * Příběhy Impéria (pi) — deník postavy. Osekaný derivát Matrixu.
 *
 * Vizuál: styles/pi.css (scoped [data-diary-system='pi']), sci-fi cyan HUD.
 * Data v `diary.customData` s prefixem `pi_*` přes `makeCdAccess`.
 * 3 režimy: view (čtení) · edit (klikací prvky + inputy) · print.
 *
 * Sekce: Hero · Fyzický stav (Životy + postih · Ochrana 1) · Body schopností ·
 *        Schopnosti (pips + stupeň) · Aspekty (Nabitý/Vybitý) · Poznámky.
 *
 * Oproti Matrixu ZÁMĚRNĚ chybí: jazyky, únava, přetlaky, runa, magie,
 * iniciativa i hod kostkou na listu (deník = záznam, ne boj).
 */
import type { CSSProperties } from 'react';
import { usePrintMode } from '@/features/world/export/print';
import { useCharacter } from '@/features/world/pages/api/useCharacter';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  PI_SKILL_MAX_PC,
  PI_SKILL_MAX_NPC,
  piLevelName,
  type PiTagValue,
} from './constants';

export function PiSheet({
  diary,
  mode,
  worldId,
  characterSlug,
  onChange,
}: SystemSheetProps) {
  const printMode = usePrintMode();
  // NPC clamp dle `Character.isNpc` (PC strop 7 pipů, NPC/entity až 10).
  const { data: character } = useCharacter(worldId, characterSlug);
  const isNpc = !!character?.isNpc;
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'pi_', onChange);

  if (printMode) return <PiPrintView cda={cda} />;

  const editing = mode === 'edit';

  return (
    <div className="pi-sheet" data-mode={mode}>
      <Hero cda={cda} editing={editing} />
      <VitalsPanel cda={cda} editing={editing} />
      <BudgetPanel cda={cda} editing={editing} />
      <SkillsPanel cda={cda} editing={editing} isNpc={isNpc} />
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
  const abilities = cda.parseJsonArr<PiTagValue>('abilities');
  const aspects = cda.parseJsonArr<PiTagValue>('aspects');
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
    .parseJsonArr<PiTagValue>('abilities')
    .reduce((m, ab) => Math.max(m, parseInt(ab.value, 10) || 0), 0);
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
    const cls = `pi-pip${on ? ' on' + (lvl >= 8 ? ' entity' : '') : ''}`;
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
  return <span className="pi-pips">{pips}</span>;
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
  kind: 'hp' | 'arm';
  mod?: string;
}) {
  const segs = [];
  for (let i = 1; i <= total; i++) {
    const on = i <= value;
    segs.push(
      <div
        key={i}
        className={`pi-seg ${kind}${on ? ' on' + (mod ? ' ' + mod : '') : ''}`}
      />,
    );
  }
  return <div className="pi-track">{segs}</div>;
}

// ── Hero ─────────────────────────────────────────────────

function Hero({ cda, editing }: SubProps) {
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
    <header className="pi-hero">
      <div className="pi-portrait">
        <span>{initials}</span>
      </div>
      <div className="pi-id">
        <h1 className="pi-name">{name || 'Bez jména'}</h1>
        <div className="pi-meta">
          <MetaRow label="Stát" value={g('bornWhere')} editing={editing} onChange={(v) => set('bornWhere', v)} />
          <MetaRow label="Povolání" value={g('profession')} editing={editing} onChange={(v) => set('profession', v)} />
        </div>
      </div>
      <div className="pi-fate">
        <span className="lab">Body osudu</span>
        {editing ? (
          <input
            className="pi-input pi-num"
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
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="line">
      <span className="k">{label}</span>
      {editing ? (
        <input
          className="pi-input hero-in"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
      ) : (
        <span className="v">{value || '—'}</span>
      )}
    </div>
  );
}

// ── Fyzický stav ─────────────────────────────────────────

function VitalsPanel({ cda, editing }: SubProps) {
  const { g, set } = cda;
  const health = parseInt(g('health', '5'), 10) || 0;
  const armor = parseInt(g('armor', '0'), 10) || 0;

  const hpMod = health >= 4 ? '' : health >= 2 ? 'warn' : 'crit';
  const hpPen =
    health >= 4 ? ['0', ''] : health >= 2 ? ['−1', 'warn'] : health >= 1 ? ['−2', 'warn'] : ['SMRT', 'crit'];

  return (
    <section className="pi-panel pi-panel--accent">
      <h2 className="pi-title">Fyzický stav</h2>
      <div className="pi-vit-group">
        <VitalCell
          label="❤ Životy"
          name="Životy"
          valueKey="health"
          value={health}
          max={5}
          kind="hp"
          mod={hpMod}
          cda={cda}
          editing={editing}
        />
        <div className="pi-vit">
          <div className="pi-vit__head">
            <span className="pi-vit__label">🛡 Ochrana</span>
            {editing ? (
              <input
                className="pi-input pi-num"
                type="number"
                min={0}
                max={1}
                value={armor}
                onChange={(e) =>
                  set('armor', String(Math.max(0, Math.min(1, parseInt(e.target.value, 10) || 0))))
                }
                aria-label="Ochrana"
              />
            ) : (
              <span className="pi-vit__num">{armor ? 'aktivní' : '—'}</span>
            )}
          </div>
          <VitalTrack value={armor} total={1} kind="arm" />
        </div>
      </div>
      <div className="pi-status">
        <span>Postih za zranění:</span>
        <span className={`badge ${hpPen[1]}`}>{hpPen[0]}</span>
        <span className="scale">
          <b>4–5 ▸ 0</b> · <b>2–3 ▸ −1</b> · <b>1 ▸ −2</b> · <b>0 ▸ SMRT</b>
        </span>
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
  kind: 'hp' | 'arm';
  mod?: string;
}) {
  const { set } = cda;
  return (
    <div className="pi-vit">
      <div className="pi-vit__head">
        <span className="pi-vit__label">{label}</span>
        {editing ? (
          <input
            className="pi-input pi-num"
            type="number"
            min={0}
            max={max}
            value={value}
            onChange={(e) =>
              set(valueKey, String(Math.max(0, Math.min(max, parseInt(e.target.value, 10) || 0))))
            }
            aria-label={name}
          />
        ) : (
          <span className="pi-vit__num">
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
    <section className="pi-panel">
      <div className="pi-budget">
        <div className="blk">
          <div className="pi-budget__head">
            <span className="pi-budget__lab">▸ Body schopností</span>
            <span className={`pi-budget__val ${over ? 'over' : ''}`}>
              <span className={over ? 'over' : ''}>{used}</span> /{' '}
              {editing ? (
                <input
                  className="pi-input pi-num"
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
          <div className="pi-budget__bar">
            <div className={`pi-budget__fill ${over ? 'over' : ''}`} style={{ width: `${pct}%` }} />
          </div>
          {over && <span className="pi-budget__warn">⚠ Přečerpáno o {used - max} b.</span>}
        </div>
        <span className="upd">
          Poslední úprava: <b>{lastUpd || '—'}</b>
        </span>
      </div>
    </section>
  );
}

// ── Schopnosti ───────────────────────────────────────────

function SkillsPanel({ cda, editing, isNpc }: SubProps & { isNpc: boolean }) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const skills = parseJsonArr<PiTagValue>('abilities');
  const aspectCount = parseJsonArr<PiTagValue>('aspects').length;
  const skillMax = isNpc ? PI_SKILL_MAX_NPC : PI_SKILL_MAX_PC;

  return (
    <section className="pi-panel">
      <h2 className="pi-title">Schopnosti</h2>
      <div className="pi-list">
        {skills.map((s, i) => {
          const lvl = parseInt(s.value, 10) || 0;
          const total = Math.max(skillMax, lvl);
          const lvlc = `var(--lvl-${Math.min(Math.max(lvl, 1), 10)})`;
          const tooHigh = lvl > aspectCount;
          const rank = lvl > 0 ? `${lvl} — ${piLevelName(lvl)}` : 'bez stupně';

          return (
            <div
              className={`pi-skill${editing ? ' edit' : ''}${tooHigh ? ' toohigh' : ''}`}
              key={i}
              style={{ ['--lvlc' as string]: lvlc } as CSSProperties}
              data-rank={rank}
              title={tooHigh ? `Úroveň ${lvl} vyžaduje aspoň ${lvl} aspektů (máš ${aspectCount})` : undefined}
            >
              {editing ? (
                <>
                  <input
                    className="pi-input name"
                    value={s.label}
                    onChange={(e) => updateArr<PiTagValue>('abilities', i, { label: e.target.value })}
                    placeholder="Název schopnosti"
                  />
                  <Pips lvl={lvl} total={total} editable onPick={(n) => updateArr<PiTagValue>('abilities', i, { value: String(n) })} />
                  <span className="pi-skill__lvl">{lvl}</span>
                  <span className="pi-del" onClick={() => removeArr('abilities', i)} role="button" aria-label="Smazat schopnost">
                    ✕
                  </span>
                </>
              ) : (
                <>
                  <span className="pi-skill__name">{s.label || '—'}</span>
                  <Pips lvl={lvl} total={total} />
                  <span className="pi-skill__lvl">{lvl}</span>
                </>
              )}
            </div>
          );
        })}
      </div>
      {editing && (
        <button
          type="button"
          className="pi-add"
          onClick={() => addArr<PiTagValue>('abilities', { label: '', value: '1' })}
        >
          + Přidat schopnost
        </button>
      )}
    </section>
  );
}

// ── Aspekty ──────────────────────────────────────────────

function AspectsPanel({ cda, editing }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const aspects = parseJsonArr<PiTagValue>('aspects');
  const maxLvl = maxSkillLevel(cda);
  const deficit = maxLvl > aspects.length;

  return (
    <section className="pi-panel">
      <h2 className="pi-title">Aspekty</h2>
      <div className="pi-list">
        {aspects.map((a, i) => {
          const charged = a.value === 'Nabitý';
          return editing ? (
            <div className="pi-aspect edit" key={i}>
              <input
                className="pi-input name"
                value={a.label}
                onChange={(e) => updateArr<PiTagValue>('aspects', i, { label: e.target.value })}
                placeholder="Aspekt / perk"
              />
              <span
                className={`pi-chip ${charged ? 'charged' : 'depleted'}`}
                style={{ cursor: 'pointer' }}
                onClick={() => updateArr<PiTagValue>('aspects', i, { value: charged ? 'Vybitý' : 'Nabitý' })}
                role="button"
                aria-pressed={charged}
              >
                {charged ? 'Nabitý' : 'Vybitý'}
              </span>
              <span className="pi-del" onClick={() => removeArr('aspects', i)} role="button" aria-label="Smazat aspekt">
                ✕
              </span>
            </div>
          ) : (
            <div className="pi-aspect" key={i}>
              <span className="pi-aspect__name">{a.label || '—'}</span>
              <span className={`pi-chip ${charged ? 'charged' : 'depleted'}`}>{charged ? 'Nabitý' : 'Vybitý'}</span>
            </div>
          );
        })}
      </div>
      {deficit && (
        <div className="pi-warn">
          ⚠ Málo aspektů — nejvyšší schopnost má úroveň {maxLvl}, potřebuješ aspoň {maxLvl} aspektů (máš {aspects.length}).
        </div>
      )}
      {editing && (
        <button
          type="button"
          className="pi-add"
          onClick={() => addArr<PiTagValue>('aspects', { label: '', value: 'Vybitý' })}
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
    <section className="pi-panel">
      <h2 className="pi-title">Poznámky</h2>
      <textarea
        className="pi-gear"
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
// PRINT — statický čitelný dokument (čte stejná `pi_*` data)
// ════════════════════════════════════════════════════════

function PiPrintView({ cda }: { cda: CdAccess }) {
  const { g } = cda;
  const abilities = cda.parseJsonArr<PiTagValue>('abilities');
  const aspects = cda.parseJsonArr<PiTagValue>('aspects');
  const { used, max } = computeUsedPoints(cda);
  const inventory = g('inventory').trim();

  return (
    <div className="pi-print">
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
          <dt>Ochrana</dt>
          <dd>{parseInt(g('armor', '0'), 10) ? 'aktivní' : '—'}</dd>
        </div>
      </dl>

      {abilities.length > 0 && (
        <>
          <h3>Schopnosti</h3>
          <ul className="pi-print__plain">
            {abilities.map((a, i) => (
              <li key={i} className="print-row">
                <span>{a.label || '—'}</span>
                <span>
                  {a.value} — {piLevelName(parseInt(a.value, 10) || 0)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {aspects.length > 0 && (
        <>
          <h3>Aspekty</h3>
          <ul className="pi-print__plain">
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
