/**
 * Shadowrun 6e (Sixth World) — deník postavy. Sci-fi HUD (styles/shadowrun.css,
 * scoped [data-diary-system='shadowrun'], token rodina --mx-*).
 *
 * Výpočetní jádro (krok B): atributy → odvozené hodnoty (iniciativa, HO,
 * Composure/Judge/Memory/Lift) + velikosti záznamníků (8+⌈atr/2⌉) se počítají;
 * zranění v záznamníku dává −1 za každé 3 boxy do VŠECH dice poolů; pool
 * dovednosti/zbraně = atribut + hodnocení (+2 specializace) − penalizace.
 *
 * Hody (klikací pool d6 → úspěchy 5–6 + glitch) se NEzobrazují v klasickém
 * deníku — patří do TM combat panelu + chatu (pozdější fáze + rozšíření
 * roll-enginu o počítání úspěchů). Deník ukazuje pool jako informaci.
 *
 * Data v `diary.customData` s prefixem `sr_` (reuse legacy klíčů → bez migrace).
 * 3 režimy: view · edit · print (oddělený `ShadowrunPrintView`).
 */
import type { ReactNode } from 'react';
import { usePrintMode } from '@/features/world/export/print';
import { useCharacter } from '@/features/world/pages/api/useCharacter';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  SR_CORE_ATTRS,
  SR_ATTR_BY_KEY,
  SR_ATTR_KEYS,
  SR_MATRIX_STATS,
  SR_MATRIX_TRACK,
  SR_WOUND_STEP,
  ceilHalf,
} from './constants';
import {
  type SrSkill,
  type SrWeapon,
  type SrSpell,
  type SrRow3,
  type Attrs,
  int,
  readAttrs,
  poolOf,
  HERO_META,
} from './shared';

// ════════════════════════════════════════════════════════════════
export function ShadowrunSheet({
  diary,
  mode,
  worldId,
  characterSlug,
  onChange,
}: SystemSheetProps) {
  const printMode = usePrintMode();
  const { data: character } = useCharacter(worldId, characterSlug);
  const isNpc = !!character?.isNpc;
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'sr_', onChange);

  if (printMode) return <ShadowrunPrintView cda={cda} />;

  const editing = mode === 'edit';
  const attrs = readAttrs(cda);
  const physFilled = int(cda.g('cond_phys', '0'));
  const stunFilled = int(cda.g('cond_stun', '0'));
  const woundPen =
    Math.floor(physFilled / SR_WOUND_STEP) + Math.floor(stunFilled / SR_WOUND_STEP);
  const armorTotal = cda
    .parseJsonArr<SrRow3>('armor')
    .reduce((sum, a) => sum + int(a.a), 0);

  return (
    <div className="sr-sheet" data-mode={mode}>
      <Hero cda={cda} editing={editing} isNpc={isNpc} />

      <div className="sr-grid2">
        <AttributesPanel cda={cda} editing={editing} attrs={attrs} />
        <DerivedPanel
          cda={cda}
          editing={editing}
          attrs={attrs}
          armorTotal={armorTotal}
          physFilled={physFilled}
          stunFilled={stunFilled}
          woundPen={woundPen}
        />
      </div>

      <SkillsPanel cda={cda} editing={editing} attrs={attrs} woundPen={woundPen} />

      <div className="sr-grid2">
        <WeaponsPanel cda={cda} editing={editing} attrs={attrs} woundPen={woundPen} />
        <ArmorPanel cda={cda} editing={editing} attrs={attrs} armorTotal={armorTotal} />
      </div>

      <div className="sr-grid2">
        <MagicPanel cda={cda} editing={editing} />
        <MatrixPanel cda={cda} editing={editing} />
      </div>

      <div className="sr-grid2">
        <AugPanel cda={cda} editing={editing} />
        <QualitiesPanel cda={cda} editing={editing} />
      </div>

      <div className="sr-grid2">
        <ContactsPanel cda={cda} editing={editing} />
        <IdentityPanel cda={cda} editing={editing} />
      </div>

      <NotesPanel cda={cda} editing={editing} />
    </div>
  );
}

// ── shared types ───────────────────────────────────────────────
export interface PanelProps {
  cda: CdAccess;
  editing: boolean;
}

// ── Hero ───────────────────────────────────────────────────────
function Hero({ cda, editing, isNpc }: PanelProps & { isNpc: boolean }) {
  const { g, set } = cda;
  const alias = g('name');
  const initials =
    alias
      .split(/\s+/)
      .map((w) => w[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';
  const edgeMax = int(g('attr_edg', '0'));
  const edgeCur = Math.min(int(g('edge_cur', '0')), edgeMax || 99);

  return (
    <header className="sr-hero">
      <div className="sr-portrait">
        <span>{initials}</span>
      </div>
      <div className="sr-hero-id">
        {editing ? (
          <input
            className="sr-name"
            value={alias}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Alias / přezdívka"
            aria-label="Alias"
          />
        ) : (
          <h1 className="sr-name">{alias || (isNpc ? 'NPC' : 'Bez aliasu')}</h1>
        )}
        <div className="sr-meta">
          {HERO_META.map((m) => (
            <div className="cell" key={m.key}>
              <span className="k">{m.label}</span>
              {editing ? (
                <input
                  className="v"
                  value={g(m.key)}
                  onChange={(e) => set(m.key, e.target.value)}
                  aria-label={m.label}
                />
              ) : (
                <span className="v">{g(m.key) || '—'}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="sr-hero-stats">
        <div className="sr-bigstat edge">
          <span className="lab">Hrana</span>
          <span className="sr-edge-pips" role="group" aria-label="Hrana">
            {Array.from({ length: Math.max(edgeMax, 1) }, (_, i) =>
              editing ? (
                <button
                  type="button"
                  key={i}
                  className={i < edgeCur ? 'on' : ''}
                  onClick={() => set('edge_cur', String(i + 1 === edgeCur ? i : i + 1))}
                  aria-label={`Hrana ${i + 1}`}
                />
              ) : (
                <i key={i} className={i < edgeCur ? 'on' : ''} />
              ),
            )}
          </span>
          <span className="num">
            {editing ? (
              <input
                value={g('attr_edg')}
                onChange={(e) => set('attr_edg', e.target.value)}
                aria-label="Hrana max"
              />
            ) : (
              edgeCur
            )}
            <small>/{edgeMax || '—'}</small>
          </span>
        </div>
        <HeroStat cda={cda} editing={editing} cls="ess" label="Esence" field="attr_ess" />
        <HeroStat cda={cda} editing={editing} cls="mag" label="Magie / Rez." field="attr_mag" />
        <div className="sr-bigstat">
          <span className="lab">Karma</span>
          <span className="num">
            {editing ? (
              <input
                value={g('karma')}
                onChange={(e) => set('karma', e.target.value)}
                aria-label="Karma"
              />
            ) : (
              g('karma') || '0'
            )}
            <small>/{g('karma_total') || '—'}</small>
          </span>
        </div>
      </div>
    </header>
  );
}

function HeroStat({
  cda,
  editing,
  cls,
  label,
  field,
}: PanelProps & { cls: string; label: string; field: string }) {
  const { g, set } = cda;
  return (
    <div className={`sr-bigstat ${cls}`}>
      <span className="lab">{label}</span>
      <span className="num">
        {editing ? (
          <input value={g(field)} onChange={(e) => set(field, e.target.value)} aria-label={label} />
        ) : (
          g(field) || '0'
        )}
      </span>
    </div>
  );
}

// ── Atributy ───────────────────────────────────────────────────
function AttributesPanel({ cda, editing, attrs }: PanelProps & { attrs: Attrs }) {
  const { set } = cda;
  return (
    <section className="sr-panel sr-panel--accent">
      <h2 className="sr-title">
        Atributy <span className="sr-hint">(1–6 norm, 7+ augment)</span>
      </h2>
      <div className="sr-attr-grid">
        {SR_CORE_ATTRS.map((a) => {
          const v = attrs[a.key] ?? 0;
          return (
            <div className={`sr-attr ${a.group}`} key={a.key}>
              <div className="ahead">
                <span className="alab">{a.label}</span>
                <span className="acode">{a.code}</span>
              </div>
              {editing ? (
                <input
                  className="aval"
                  type="number"
                  min={0}
                  value={v}
                  onChange={(e) => set(`attr_${a.key}`, String(Math.max(0, int(e.target.value))))}
                  aria-label={a.label}
                />
              ) : (
                <div className="aval">{v}</div>
              )}
              <Bar value={v} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <div className="sr-bar">
      {Array.from({ length: 6 }, (_, i) => (
        <i key={i} className={i < value ? 'on' : ''} />
      ))}
    </div>
  );
}

// ── Odvozené + záznamníky ──────────────────────────────────────
function DerivedPanel({
  cda,
  editing,
  attrs,
  armorTotal,
  physFilled,
  stunFilled,
  woundPen,
}: PanelProps & {
  attrs: Attrs;
  armorTotal: number;
  physFilled: number;
  stunFilled: number;
  woundPen: number;
}) {
  const init = (attrs.rea ?? 0) + (attrs.int ?? 0);
  const dr = (attrs.bod ?? 0) + armorTotal;
  const physMax = 8 + ceilHalf(attrs.bod ?? 0);
  const stunMax = 8 + ceilHalf(attrs.wil ?? 0);
  const physPen = Math.floor(physFilled / SR_WOUND_STEP);
  const stunPen = Math.floor(stunFilled / SR_WOUND_STEP);

  const derived: [string, ReactNode][] = [
    ['Iniciativa', <>{init} <small>+ 1k6</small></>],
    ['Hodnocení obrany', dr],
    ['Composure', (attrs.wil ?? 0) + (attrs.cha ?? 0)],
    ['Odhad lidí', (attrs.wil ?? 0) + (attrs.int ?? 0)],
    ['Paměť', (attrs.log ?? 0) + (attrs.wil ?? 0)],
    ['Zvedání/nošení', (attrs.str ?? 0) + (attrs.bod ?? 0)],
  ];

  return (
    <section className="sr-panel">
      <h2 className="sr-title">
        Odvozené hodnoty <span className="sr-hint">počítá se z atributů</span>
      </h2>
      <div className="sr-derv">
        {derived.map(([lab, val]) => (
          <div className="d" key={lab}>
            <span className="lab">{lab}</span>
            <span className="val">{val}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <ConditionTrack
          cda={cda}
          editing={editing}
          kind="phys"
          field="cond_phys"
          label="⬡ Fyzický záznamník"
          filled={physFilled}
          size={physMax}
          penalty={physPen}
        />
        <ConditionTrack
          cda={cda}
          editing={editing}
          kind="stun"
          field="cond_stun"
          label="◐ Záznamník omráčení (Stun)"
          filled={stunFilled}
          size={stunMax}
          penalty={stunPen}
        />
        <div className="sr-pen-total">
          Celková penalizace do všech poolů: <b className="pen">−{woundPen}</b>
          {' · '}Overflow: <b className="over">0/{attrs.bod ?? 0}</b>
        </div>
      </div>
    </section>
  );
}

function ConditionTrack({
  cda,
  editing,
  kind,
  field,
  label,
  filled,
  size,
  penalty,
}: PanelProps & {
  kind: 'phys' | 'stun' | 'matrix';
  field: string;
  label: string;
  filled: number;
  size: number;
  penalty: number;
}) {
  const { set } = cda;
  const click = (i: number) => {
    if (!editing) return;
    set(field, String(i + 1 === filled ? i : i + 1));
  };
  return (
    <div className={`sr-cond ${kind}`} style={kind === 'stun' ? { marginTop: 18 } : undefined}>
      <div className="chead">
        <span className="clab">{label}</span>
        <span className="cpen">−{penalty}</span>
      </div>
      <div className="sr-track">
        {Array.from({ length: Math.max(size, filled) }, (_, i) => {
          const isMark = (i + 1) % SR_WOUND_STEP === 0;
          return (
            <button
              type="button"
              key={i}
              className={`sr-box ${i < filled ? 'on' : ''}`}
              onClick={() => click(i)}
              disabled={!editing}
              aria-label={`${label} box ${i + 1}`}
              aria-pressed={i < filled}
            >
              {i < filled ? '✕' : ''}
              {isMark && <span className="mk">−{(i + 1) / SR_WOUND_STEP}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Dovednosti ─────────────────────────────────────────────────
function SkillsPanel({
  cda,
  editing,
  attrs,
  woundPen,
}: PanelProps & { attrs: Attrs; woundPen: number }) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const skills = parseJsonArr<SrSkill>('skills');
  return (
    <section className="sr-panel">
      <h2 className="sr-title">
        Dovednosti{' '}
        <span className="sr-hint">pool = atribut + dovednost (+2 specializace) − penalizace</span>
      </h2>
      {skills.length === 0 && !editing && (
        <div className="sr-empty">Žádné dovednosti.</div>
      )}
      {skills.map((s, i) => {
        const pool = poolOf(attrs, s.attr, s.val, s.spec, woundPen);
        if (editing) {
          return (
            <div className="sr-row skill edit" key={i}>
              <input
                className="sr-input nm"
                value={s.name}
                onChange={(e) => updateArr<SrSkill>('skills', i, { name: e.target.value })}
                placeholder="Dovednost"
              />
              <select
                className="sr-input sm"
                style={{ width: 'auto' }}
                value={SR_ATTR_KEYS.includes(s.attr) ? s.attr : 'agi'}
                onChange={(e) => updateArr<SrSkill>('skills', i, { attr: e.target.value })}
                aria-label="Atribut"
              >
                {SR_CORE_ATTRS.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.code}
                  </option>
                ))}
              </select>
              <input
                className="sr-input sm"
                type="number"
                value={s.val}
                onChange={(e) => updateArr<SrSkill>('skills', i, { val: e.target.value })}
                aria-label="Hodnocení"
              />
              <input
                className="sr-input"
                style={{ width: 140 }}
                value={s.spec}
                onChange={(e) => updateArr<SrSkill>('skills', i, { spec: e.target.value })}
                placeholder="specializace"
              />
              <span className="sr-del" role="button" aria-label="Smazat" onClick={() => removeArr('skills', i)}>
                ✕
              </span>
            </div>
          );
        }
        return (
          <div className="sr-row skill" key={i}>
            <div className="nm">
              {s.name || '—'}
              {s.spec && <small>specializace: {s.spec} (+2)</small>}
            </div>
            <span className="sr-chip">{SR_ATTR_BY_KEY[s.attr]?.code ?? '?'}</span>
            <span className="sr-rate">{int(s.val)}</span>
            <span className="sr-pool">
              = <b>{pool}</b> <small>k6</small>
            </span>
          </div>
        );
      })}
      {editing && (
        <button
          type="button"
          className="sr-add"
          onClick={() => addArr<SrSkill>('skills', { name: '', attr: 'agi', val: '0', spec: '' })}
        >
          + Přidat dovednost
        </button>
      )}
    </section>
  );
}

// ── Zbraně ─────────────────────────────────────────────────────
function WeaponsPanel({
  cda,
  editing,
  attrs,
  woundPen,
}: PanelProps & { attrs: Attrs; woundPen: number }) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const weapons = parseJsonArr<SrWeapon>('weapons');
  return (
    <section className="sr-panel">
      <h2 className="sr-title sr-title--phys">
        Zbraně <span className="sr-hint">HÚ = hodnocení útoku · HP = poškození</span>
      </h2>
      {weapons.length === 0 && !editing && <div className="sr-empty">Žádné zbraně.</div>}
      {weapons.map((w, i) => {
        const pool = poolOf(attrs, w.attr, w.val, w.spec, woundPen);
        if (editing) {
          return (
            <div className="sr-row weapon edit" key={i}>
              <input
                className="sr-input nm"
                value={w.name}
                onChange={(e) => updateArr<SrWeapon>('weapons', i, { name: e.target.value })}
                placeholder="Zbraň"
              />
              <input
                className="sr-input sm"
                style={{ width: 90 }}
                value={w.type}
                onChange={(e) => updateArr<SrWeapon>('weapons', i, { type: e.target.value })}
                placeholder="typ"
              />
              <input
                className="sr-input sm"
                style={{ width: 110 }}
                value={w.ar}
                onChange={(e) => updateArr<SrWeapon>('weapons', i, { ar: e.target.value })}
                placeholder="HÚ"
              />
              <input
                className="sr-input sm"
                style={{ width: 60 }}
                value={w.dmg}
                onChange={(e) => updateArr<SrWeapon>('weapons', i, { dmg: e.target.value })}
                placeholder="HP"
              />
              <select
                className="sr-input sm"
                style={{ width: 'auto' }}
                value={SR_ATTR_KEYS.includes(w.attr) ? w.attr : 'agi'}
                onChange={(e) => updateArr<SrWeapon>('weapons', i, { attr: e.target.value })}
                aria-label="Atribut"
              >
                {SR_CORE_ATTRS.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.code}
                  </option>
                ))}
              </select>
              <input
                className="sr-input sm"
                type="number"
                value={w.val}
                onChange={(e) => updateArr<SrWeapon>('weapons', i, { val: e.target.value })}
                aria-label="Dovednost"
              />
              <span className="sr-del" role="button" aria-label="Smazat" onClick={() => removeArr('weapons', i)}>
                ✕
              </span>
            </div>
          );
        }
        return (
          <div className="sr-row weapon" key={i}>
            <div className="nm">
              {w.name || '—'}
              <small>
                {[w.type, w.ar && `HÚ ${w.ar}`].filter(Boolean).join(' · ')}
              </small>
            </div>
            <span className="sr-chip dmg">{w.dmg || '—'}</span>
            <span className="sr-pool">
              = <b>{pool}</b> <small>k6</small>
            </span>
          </div>
        );
      })}
      {editing && (
        <button
          type="button"
          className="sr-add"
          onClick={() =>
            addArr<SrWeapon>('weapons', {
              name: '',
              type: '',
              ar: '',
              dmg: '',
              attr: 'agi',
              val: '0',
              spec: '',
            })
          }
        >
          + Přidat zbraň
        </button>
      )}
    </section>
  );
}

// ── Zbroj + obrana ─────────────────────────────────────────────
function ArmorPanel({
  cda,
  editing,
  attrs,
  armorTotal,
}: PanelProps & { attrs: Attrs; armorTotal: number }) {
  return (
    <section className="sr-panel">
      <h2 className="sr-title">Zbroj &amp; obrana</h2>
      <ArrTable
        cda={cda}
        editing={editing}
        arrKey="armor"
        cols={[
          { k: 'name', label: 'Pancíř / kus' },
          { k: 'a', label: 'Hodn.' },
          { k: 'b', label: 'Pozn.' },
        ]}
        addLabel="+ Přidat zbroj"
      />
      <div className="sr-pen-total" style={{ marginTop: 12 }}>
        Hodnocení obrany (HO) = Tělo + zbroj ={' '}
        <b style={{ color: 'var(--mx-accent)', fontSize: 15 }}>{(attrs.bod ?? 0) + armorTotal}</b>
        <div className="sr-note-line">Když HÚ útočníka ≥ HO + 4 → útočník získá Hranu.</div>
      </div>
    </section>
  );
}

// ── Magie ──────────────────────────────────────────────────────
export function MagicPanel({ cda, editing }: PanelProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const spells = parseJsonArr<SrSpell>('spells');
  const powers = parseJsonArr<SrRow3>('powers');
  return (
    <section className="sr-panel">
      <h2 className="sr-title sr-title--magic">
        Magie <span className="sr-hint">odpor odlivu = Vůle + Charisma · DV = síla odlivu</span>
      </h2>
      {spells.length === 0 && !editing && (
        <div className="sr-empty">Žádná kouzla / rituály (postava nemusí být mág).</div>
      )}
      {spells.map((sp, i) =>
        editing ? (
          <div className="sr-row spell edit" key={i}>
            <input
              className="sr-input nm"
              value={sp.name}
              onChange={(e) => updateArr<SrSpell>('spells', i, { name: e.target.value })}
              placeholder="Kouzlo / rituál / KF"
            />
            <input
              className="sr-input sm"
              style={{ width: 90 }}
              value={sp.type}
              onChange={(e) => updateArr<SrSpell>('spells', i, { type: e.target.value })}
              placeholder="typ/cíl"
            />
            <input
              className="sr-input sm"
              style={{ width: 80 }}
              value={sp.dur}
              onChange={(e) => updateArr<SrSpell>('spells', i, { dur: e.target.value })}
              placeholder="trvání"
            />
            <input
              className="sr-input sm"
              style={{ width: 70 }}
              value={sp.drain}
              onChange={(e) => updateArr<SrSpell>('spells', i, { drain: e.target.value })}
              placeholder="odliv"
            />
            <span className="sr-del" role="button" aria-label="Smazat" onClick={() => removeArr('spells', i)}>
              ✕
            </span>
          </div>
        ) : (
          <div className="sr-row spell" key={i}>
            <div className="nm">
              {sp.name || '—'}
              <small>{[sp.type, sp.dur].filter(Boolean).join(' · ')}</small>
            </div>
            <span className="sr-rate">{sp.rng || ''}</span>
            <span className="sr-chip">{sp.dur || '—'}</span>
            <span className="sr-pool">
              <small>odliv</small> <b>{sp.drain || '—'}</b>
            </span>
          </div>
        ),
      )}
      {editing && (
        <button
          type="button"
          className="sr-add"
          onClick={() =>
            addArr<SrSpell>('spells', { name: '', type: '', rng: '', dur: '', drain: '' })
          }
        >
          + Přidat kouzlo / rituál / KF
        </button>
      )}

      <h3 className="sr-title" style={{ marginTop: 16, fontSize: 12 }}>
        Adeptské síly
      </h3>
      {powers.length === 0 && !editing && <div className="sr-empty">Žádné síly.</div>}
      {powers.map((p, i) =>
        editing ? (
          <div className="sr-row power edit" key={i}>
            <input
              className="sr-input nm"
              value={p.name}
              onChange={(e) => updateArr<SrRow3>('powers', i, { name: e.target.value })}
              placeholder="Síla / schopnost"
            />
            <input
              className="sr-input sm"
              value={p.a}
              onChange={(e) => updateArr<SrRow3>('powers', i, { a: e.target.value })}
              placeholder="úroveň"
            />
            <span className="sr-del" role="button" aria-label="Smazat" onClick={() => removeArr('powers', i)}>
              ✕
            </span>
          </div>
        ) : (
          <div className="sr-row power" key={i}>
            <div className="nm">
              {p.name || '—'}
              {p.b && <small>{p.b}</small>}
            </div>
            <span className="sr-rate">{p.a || ''}</span>
          </div>
        ),
      )}
      {editing && (
        <button
          type="button"
          className="sr-add"
          onClick={() => addArr<SrRow3>('powers', { name: '', a: '', b: '' })}
        >
          + Přidat sílu
        </button>
      )}
    </section>
  );
}

// ── Matrix ─────────────────────────────────────────────────────
export function MatrixPanel({ cda, editing }: PanelProps) {
  const { g, set } = cda;
  const dmg = int(g('mat_dmg', '0'));
  return (
    <section className="sr-panel sr-panel--accent">
      <h2 className="sr-title">
        Matrix <span className="sr-hint">A/M/Z/F · vlastní záznamník</span>
      </h2>
      <div className="sr-mtx-device">
        Zařízení:{' '}
        {editing ? (
          <>
            <input
              value={g('mat_device')}
              onChange={(e) => set('mat_device', e.target.value)}
              placeholder="Komlink / cyberdeck"
              aria-label="Zařízení"
            />
            <input
              style={{ width: 60 }}
              value={g('mat_dev_rating')}
              onChange={(e) => set('mat_dev_rating', e.target.value)}
              placeholder="hodn."
              aria-label="Hodnocení zařízení"
            />
          </>
        ) : (
          <>
            <b>{g('mat_device') || '—'}</b>
            {g('mat_dev_rating') && <span>· Hodn. {g('mat_dev_rating')}</span>}
          </>
        )}
      </div>
      <div className="sr-mtxgrid">
        {SR_MATRIX_STATS.map((m) => (
          <div className="m" key={m.key}>
            <div className="l">
              {m.label} ({m.code})
            </div>
            {editing ? (
              <input
                value={g(m.key)}
                onChange={(e) => set(m.key, e.target.value)}
                aria-label={m.label}
              />
            ) : (
              <div className="n">{g(m.key) || '0'}</div>
            )}
          </div>
        ))}
      </div>
      <div className="sr-cond matrix">
        <div className="chead">
          <span className="clab">▣ Matrix záznamník</span>
          <span className="cmeta">
            {dmg} / {SR_MATRIX_TRACK}
          </span>
        </div>
        <div className="sr-track">
          {Array.from({ length: SR_MATRIX_TRACK }, (_, i) => (
            <button
              type="button"
              key={i}
              className={`sr-box ${i < dmg ? 'on' : ''}`}
              onClick={() => editing && set('mat_dmg', String(i + 1 === dmg ? i : i + 1))}
              disabled={!editing}
              aria-label={`Matrix box ${i + 1}`}
              aria-pressed={i < dmg}
            >
              {i < dmg ? '✕' : ''}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <ArrTable
          cda={cda}
          editing={editing}
          arrKey="mat_progs"
          cols={[{ k: 'name', label: 'Nainstalované programy' }]}
          addLabel="+ Program"
        />
      </div>
    </section>
  );
}

// ── Augmentace ─────────────────────────────────────────────────
export function AugPanel({ cda, editing }: PanelProps) {
  return (
    <section className="sr-panel">
      <h2 className="sr-title">
        Augmentace <span className="sr-hint">esence klesá → ovlivní Magii</span>
      </h2>
      <ArrTable
        cda={cda}
        editing={editing}
        arrKey="aug"
        cols={[
          { k: 'name', label: 'Cyber / Bioware' },
          { k: 'a', label: 'Hodn.' },
          {
            k: 'b',
            label: 'Esence',
            render: (v) => <span className="sr-ess-cost">−{v || '0'}</span>,
          },
        ]}
        addLabel="+ Přidat augmentaci"
      />
    </section>
  );
}

// ── Kvality ────────────────────────────────────────────────────
export function QualitiesPanel({ cda, editing }: PanelProps) {
  return (
    <section className="sr-panel">
      <h2 className="sr-title">Kvality</h2>
      <ArrTable
        cda={cda}
        editing={editing}
        arrKey="qualities"
        cols={[
          { k: 'name', label: 'Kvalita' },
          {
            k: 'a',
            label: 'Typ',
            render: (v) => (
              <span className={v === '−' || v === '-' ? 'sr-neg' : 'sr-pos'}>{v || '+'}</span>
            ),
          },
        ]}
        addLabel="+ Přidat kvalitu"
      />
    </section>
  );
}

// ── Kontakty ───────────────────────────────────────────────────
export function ContactsPanel({ cda, editing }: PanelProps) {
  return (
    <section className="sr-panel">
      <h2 className="sr-title">Kontakty</h2>
      <ArrTable
        cda={cda}
        editing={editing}
        arrKey="contacts"
        cols={[
          { k: 'name', label: 'Spojka' },
          { k: 'a', label: 'Loaj.' },
          { k: 'b', label: 'Konx.' },
        ]}
        addLabel="+ Přidat kontakt"
      />
    </section>
  );
}

// ── Identita ───────────────────────────────────────────────────
export function IdentityPanel({ cda, editing }: PanelProps) {
  const { g, set } = cda;
  if (editing) {
    return (
      <section className="sr-panel">
        <h2 className="sr-title">Identita &amp; styl</h2>
        <div className="sr-ident-edit">
          <input
            className="sr-input"
            value={g('eco_lifestyle')}
            onChange={(e) => set('eco_lifestyle', e.target.value)}
            placeholder="Životní styl"
          />
          <input
            className="sr-input"
            value={g('eco_sins')}
            onChange={(e) => set('eco_sins', e.target.value)}
            placeholder="Falešné SIN"
          />
          <input
            className="sr-input"
            value={g('licenses')}
            onChange={(e) => set('licenses', e.target.value)}
            placeholder="Licence"
          />
        </div>
      </section>
    );
  }
  return (
    <section className="sr-panel">
      <h2 className="sr-title">Identita &amp; styl</h2>
      <div className="sr-ident">
        Životní styl: <b>{g('eco_lifestyle') || '—'}</b>
        <br />
        Falešné SIN: <b>{g('eco_sins') || '—'}</b>
        <br />
        Licence: <b>{g('licenses') || '—'}</b>
      </div>
    </section>
  );
}

// ── Poznámky ───────────────────────────────────────────────────
function NotesPanel({ cda, editing }: PanelProps) {
  const { g, set } = cda;
  return (
    <section className="sr-panel">
      <h2 className="sr-title">Poznámky</h2>
      <textarea
        className="sr-textarea"
        value={g('notes')}
        readOnly={!editing}
        onChange={(e) => set('notes', e.target.value)}
        placeholder="Životopis, tajemství, mise, RP detaily..."
        aria-label="Poznámky"
      />
    </section>
  );
}

// ── Generic editovatelná tabulka ───────────────────────────────
interface ArrCol {
  k: string;
  label: string;
  render?: (v: string) => ReactNode;
}
function ArrTable({
  cda,
  editing,
  arrKey,
  cols,
  addLabel,
}: PanelProps & { arrKey: string; cols: ArrCol[]; addLabel: string }) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<Record<string, string>>(arrKey);
  const template: Record<string, string> = Object.fromEntries(cols.map((c) => [c.k, '']));

  return (
    <>
      <table className="sr-table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.k}>{c.label}</th>
            ))}
            {editing && <th className="td-del" aria-label="akce" />}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && !editing && (
            <tr>
              <td colSpan={cols.length} style={{ color: 'var(--mx-dim)' }}>
                —
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c.k}>
                  {editing ? (
                    <input
                      className="sr-input"
                      value={row[c.k] ?? ''}
                      onChange={(e) =>
                        updateArr<Record<string, string>>(arrKey, i, { [c.k]: e.target.value })
                      }
                      aria-label={`${c.label} ${i + 1}`}
                    />
                  ) : c.render ? (
                    c.render(row[c.k] ?? '')
                  ) : (
                    row[c.k] || '—'
                  )}
                </td>
              ))}
              {editing && (
                <td className="td-del">
                  <span className="sr-del" role="button" aria-label="Smazat" onClick={() => removeArr(arrKey, i)}>
                    ✕
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {editing && (
        <button type="button" className="sr-add" onClick={() => addArr(arrKey, template)}>
          {addLabel}
        </button>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// PRINT — statický čitelný dokument (čte stejná `sr_` data)
// ════════════════════════════════════════════════════════════════
function ShadowrunPrintView({ cda }: { cda: CdAccess }) {
  const { g } = cda;
  const attrs = readAttrs(cda);
  const physFilled = int(g('cond_phys', '0'));
  const stunFilled = int(g('cond_stun', '0'));
  const physMax = 8 + ceilHalf(attrs.bod ?? 0);
  const stunMax = 8 + ceilHalf(attrs.wil ?? 0);
  const armorTotal = cda.parseJsonArr<SrRow3>('armor').reduce((s, a) => s + int(a.a), 0);
  const notes = g('notes').trim();

  return (
    <div className="sr-print">
      <dl>
        <div>
          <dt>Alias</dt>
          <dd>{g('name') || '—'}</dd>
        </div>
        {HERO_META.map((m) => (
          <div key={m.key}>
            <dt>{m.label}</dt>
            <dd>{g(m.key) || '—'}</dd>
          </div>
        ))}
        <div>
          <dt>Esence</dt>
          <dd>{g('attr_ess') || '—'}</dd>
        </div>
        <div>
          <dt>Magie / Rez.</dt>
          <dd>{g('attr_mag') || '—'}</dd>
        </div>
        <div>
          <dt>Hrana</dt>
          <dd>
            {g('edge_cur') || '0'} / {g('attr_edg') || '—'}
          </dd>
        </div>
        <div>
          <dt>Karma</dt>
          <dd>
            {g('karma') || '0'} / {g('karma_total') || '—'}
          </dd>
        </div>
      </dl>

      <h2>Atributy</h2>
      <dl className="print-cols">
        {SR_CORE_ATTRS.map((a) => (
          <div key={a.key}>
            <dt>{a.label}</dt>
            <dd>{attrs[a.key] ?? 0}</dd>
          </div>
        ))}
      </dl>

      <h2>Odvozené hodnoty</h2>
      <dl className="print-cols">
        <div>
          <dt>Iniciativa</dt>
          <dd>{(attrs.rea ?? 0) + (attrs.int ?? 0)} + 1k6</dd>
        </div>
        <div>
          <dt>HO</dt>
          <dd>{(attrs.bod ?? 0) + armorTotal}</dd>
        </div>
        <div>
          <dt>Composure</dt>
          <dd>{(attrs.wil ?? 0) + (attrs.cha ?? 0)}</dd>
        </div>
        <div>
          <dt>Odhad lidí</dt>
          <dd>{(attrs.wil ?? 0) + (attrs.int ?? 0)}</dd>
        </div>
        <div>
          <dt>Paměť</dt>
          <dd>{(attrs.log ?? 0) + (attrs.wil ?? 0)}</dd>
        </div>
        <div>
          <dt>Zvedání</dt>
          <dd>{(attrs.str ?? 0) + (attrs.bod ?? 0)}</dd>
        </div>
      </dl>

      <h2>Záznamník zranění</h2>
      <dl>
        <div>
          <dt>Fyzický</dt>
          <dd>
            {physFilled} / {physMax} (postih −{Math.floor(physFilled / SR_WOUND_STEP)})
          </dd>
        </div>
        <div>
          <dt>Omráčení</dt>
          <dd>
            {stunFilled} / {stunMax} (postih −{Math.floor(stunFilled / SR_WOUND_STEP)})
          </dd>
        </div>
      </dl>

      <PrintTable cda={cda} title="Dovednosti" arrKey="skills" cols={[['name', 'Dovednost'], ['attr', 'Atr'], ['val', 'Hodn.'], ['spec', 'Specializace']]} />
      <PrintTable cda={cda} title="Zbraně" arrKey="weapons" cols={[['name', 'Zbraň'], ['type', 'Typ'], ['ar', 'HÚ'], ['dmg', 'HP']]} />
      <PrintTable cda={cda} title="Zbroj" arrKey="armor" cols={[['name', 'Pancíř'], ['a', 'Hodn.'], ['b', 'Pozn.']]} />
      <PrintTable cda={cda} title="Kouzla / rituály" arrKey="spells" cols={[['name', 'Název'], ['type', 'Typ'], ['dur', 'Trvání'], ['drain', 'Odliv']]} />
      <PrintTable cda={cda} title="Adeptské síly" arrKey="powers" cols={[['name', 'Síla'], ['a', 'Úroveň']]} />

      <h2>Matrix</h2>
      <dl className="print-cols">
        <div>
          <dt>Zařízení</dt>
          <dd>{g('mat_device') || '—'}</dd>
        </div>
        {SR_MATRIX_STATS.map((m) => (
          <div key={m.key}>
            <dt>
              {m.label} ({m.code})
            </dt>
            <dd>{g(m.key) || '0'}</dd>
          </div>
        ))}
      </dl>
      <PrintTable cda={cda} title="Programy" arrKey="mat_progs" cols={[['name', 'Program']]} />
      <PrintTable cda={cda} title="Augmentace" arrKey="aug" cols={[['name', 'Cyber/Bioware'], ['a', 'Hodn.'], ['b', 'Esence']]} />
      <PrintTable cda={cda} title="Kvality" arrKey="qualities" cols={[['name', 'Kvalita'], ['a', 'Typ']]} />
      <PrintTable cda={cda} title="Kontakty" arrKey="contacts" cols={[['name', 'Spojka'], ['a', 'Loaj.'], ['b', 'Konx.']]} />

      <h2>Identita &amp; styl</h2>
      <dl>
        <div>
          <dt>Životní styl</dt>
          <dd>{g('eco_lifestyle') || '—'}</dd>
        </div>
        <div>
          <dt>Falešné SIN</dt>
          <dd>{g('eco_sins') || '—'}</dd>
        </div>
        <div>
          <dt>Licence</dt>
          <dd>{g('licenses') || '—'}</dd>
        </div>
      </dl>

      {notes && (
        <>
          <h2>Poznámky</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{notes}</p>
        </>
      )}
    </div>
  );
}

function PrintTable({
  cda,
  title,
  arrKey,
  cols,
}: {
  cda: CdAccess;
  title: string;
  arrKey: string;
  cols: [string, string][];
}) {
  const rows = cda.parseJsonArr<Record<string, string>>(arrKey);
  if (rows.length === 0) return null;
  return (
    <>
      <h3>{title}</h3>
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
    </>
  );
}
