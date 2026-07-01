/**
 * 8.7e / 16b — Dračí Hlídka (DrdH) deník postavy.
 *
 * Vizuál i datový model = schválený prototyp `c:/tmp/drdh-denik-audit.html`
 * („Pergamenový rozkaz Hlídky"). Data v `diary.customData` (prefix `drdh_*`).
 *
 * Klíčové prvky proti dřívějšku:
 *  - HERO: interaktivní erb (klik → popover s 6 povoláními) místo selectu;
 *    jméno na crimson stuze (ribbon); Specializace (select, zamčená < 6. úr.).
 *  - HUD: Životy (Hranice smrti auto = −(10 + oprava ODO)) + sekundární zdroj
 *    per povolání (adrenalin track / duševní síla / mana+suroviny / mana /
 *    kostýmy seznam / přízeň + denní checkboxy).
 *  - Atributy: stupeň (edit) + oprava (auto = ⌊st/2⌋−5, read-only).
 *  - Boj: zbraně + zbroj/štít. Dovednosti: globální body + tabulka s auto
 *    součtem (oprava atributu + stupeň). Full-width blok povolání.
 *  - Spodní zóna: zvláštní schopnosti / magické předměty / poznámky.
 *  - ŽÁDNÉ peníze, vybavení ani bojové vzorce (vynecháno dle prototypu).
 */
import { useState } from 'react';
import { usePrintMode } from '@/features/world/export/print';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import { SheetInitiativeButton } from '../../_shared/SheetInitiativeButton';
import {
  DRDH_ABBR_TO_ID,
  DRDH_ATTR_ABBRS,
  DRDH_ATTRS,
  normDrdhAttr,
  DRDH_PROF_BY_ID,
  DRDH_PROF_TABLE,
  DRDH_PROFESSIONS,
  DRDH_RESOURCE_BY_PROF,
  drdhAttrMod,
  fmtMod,
  type DrdhAbility,
  type DrdhArmor,
  type DrdhProfessionId,
  type DrdhSkill,
  type DrdhWeapon,
} from './constants';

export function DrdhSheet({ diary, mode, onChange, onRoll }: SystemSheetProps) {
  const disabled = mode === 'view';
  const printMode = usePrintMode();
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'drdh_', onChange);
  const { g, set } = cda;

  const [profOpen, setProfOpen] = useState(false);

  const prof = (g('profession_id') || 'valecnik') as DrdhProfessionId;
  const profDef = DRDH_PROF_BY_ID[prof] ?? DRDH_PROF_BY_ID.valecnik;

  // Oprava Odl → hranice smrti = −(10 + oprava Odl).
  const odoMod = drdhAttrMod(g('attr_con'));
  const autoDeath = -(10 + odoMod);

  // Tisk: interaktivní inputy/tabulky jsou netisknutelné — renderujeme
  // oddělený statický čitelný dokument se stejnými `drdh_*` daty.
  if (printMode) return <DrdhPrintView cda={cda} prof={prof} />;

  const lvl = parseInt(g('lvl'), 10) || 0;
  const specLocked = lvl < 6;

  function pickProf(id: DrdhProfessionId) {
    set('profession_id', id);
    setProfOpen(false);
  }

  return (
    <div className="drdh-sheet" data-mode={mode}>
      {onRoll && <SheetInitiativeButton onRoll={onRoll} kind="d6" />}

      <div className="sheet">
        {/* ════ HERO ════ */}
        <div className="hero">
          <div
            className="erb"
            role={disabled ? undefined : 'button'}
            tabIndex={disabled ? undefined : 0}
            title={disabled ? undefined : 'Klikni pro výběr povolání'}
            onClick={(e) => {
              if (disabled) return;
              e.stopPropagation();
              setProfOpen((o) => !o);
            }}
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setProfOpen((o) => !o);
              }
            }}
          >
            <svg viewBox="0 0 100 120" aria-hidden="true">
              <defs>
                <linearGradient id="drdhShield" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#1f3a6b" />
                  <stop offset="1" stopColor="#12233f" />
                </linearGradient>
                <linearGradient id="drdhGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#f4dd92" />
                  <stop offset="1" stopColor="#8a6a26" />
                </linearGradient>
              </defs>
              <path
                d="M50 5 L92 17 V56 C92 86 72 105 50 115 C28 105 8 86 8 56 V17 Z"
                fill="url(#drdhShield)"
                stroke="url(#drdhGold)"
                strokeWidth="3.5"
              />
              <path
                d="M50 13 L85 23 V55 C85 80 68 96 50 105 C32 96 15 80 15 55 V23 Z"
                fill="none"
                stroke="rgba(244,221,146,.4)"
                strokeWidth="1"
              />
              <text
                x="50"
                y="101"
                textAnchor="middle"
                fontFamily="'Cinzel Decorative',serif"
                fontWeight="700"
                fontSize="8.5"
                fill="rgba(244,221,146,.72)"
              >
                DH
              </text>
            </svg>
            <div className="erb-glyph" aria-hidden="true">
              {profDef.glyph}
            </div>
            <span className="erb-banner">
              {profDef.label} {disabled ? '' : '▾'}
            </span>
            {profOpen && !disabled && (
              <div
                className="erb-pop open"
                role="listbox"
                aria-label="Výběr povolání"
                onClick={(e) => e.stopPropagation()}
              >
                {DRDH_PROFESSIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={p.id === prof}
                    className={`erb-item${p.id === prof ? ' sel' : ''}`}
                    onClick={() => pickProf(p.id)}
                  >
                    <span className="g">{p.glyph}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hero-ident">
            <div className="ribbon">
              <input
                value={g('name')}
                disabled={disabled}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Jméno postavy…"
                aria-label="Jméno"
              />
            </div>
            <div className="ident-line">
              <div className={`field spec-field${specLocked ? ' locked' : ''}`}>
                <label htmlFor="drdh_specialization">Specializace</label>
                <select
                  id="drdh_specialization"
                  value={g('specialization')}
                  disabled={disabled || specLocked}
                  onChange={(e) => set('specialization', e.target.value)}
                  aria-label="Specializace"
                >
                  <option value="">—</option>
                  {profDef.spec.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <span className="spec-lock">🔒 od 6. úrovně</span>
              </div>
              <div className="field">
                <label htmlFor="drdh_race">Rasa</label>
                <input
                  id="drdh_race"
                  value={g('race')}
                  disabled={disabled}
                  onChange={(e) => set('race', e.target.value)}
                  placeholder="Rasa…"
                />
              </div>
              <div className="field num">
                <label htmlFor="drdh_lvl">Úroveň</label>
                <input
                  id="drdh_lvl"
                  inputMode="numeric"
                  value={g('lvl')}
                  disabled={disabled}
                  onChange={(e) => set('lvl', e.target.value)}
                />
              </div>
              <div className="field num">
                <label htmlFor="drdh_xp">Zkušenosti</label>
                <input
                  id="drdh_xp"
                  inputMode="numeric"
                  value={g('xp')}
                  disabled={disabled}
                  onChange={(e) => set('xp', e.target.value)}
                />
              </div>
              <div className="field num">
                <label htmlFor="drdh_size">Velikost</label>
                <input
                  id="drdh_size"
                  value={g('size')}
                  disabled={disabled}
                  onChange={(e) => set('size', e.target.value)}
                />
              </div>
              <div className="field num">
                <label htmlFor="drdh_mobility">Pohyblivost</label>
                <input
                  id="drdh_mobility"
                  value={g('mobility')}
                  disabled={disabled}
                  onChange={(e) => set('mobility', e.target.value)}
                />
              </div>
              <div className="field num">
                <label htmlFor="drdh_encumbrance">Naložení</label>
                <input
                  id="drdh_encumbrance"
                  value={g('encumbrance')}
                  disabled={disabled}
                  onChange={(e) => set('encumbrance', e.target.value)}
                />
              </div>
              <div className="field num">
                <label htmlFor="drdh_fatigue">Únava</label>
                <input
                  id="drdh_fatigue"
                  value={g('fatigue')}
                  disabled={disabled}
                  onChange={(e) => set('fatigue', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ════ HUD — Životy + zdroj povolání ════ */}
        <div className="hud">
          <div className="mega life">
            <div className="mega-h">
              <span className="seal crimson">✚</span>Životy
            </div>
            <div className="hp-row">
              <input
                className="hp-cur"
                inputMode="numeric"
                value={g('hp')}
                disabled={disabled}
                onChange={(e) => set('hp', e.target.value)}
                aria-label="Aktuální životy"
              />
              <span className="hp-sep">/</span>
              <input
                className="hp-max"
                inputMode="numeric"
                value={g('hp_max')}
                disabled={disabled}
                onChange={(e) => set('hp_max', e.target.value)}
                aria-label="Maximum životů"
              />
            </div>
            <div className="hp-death">
              Hranice smrti
              <input
                inputMode="numeric"
                value={g('hp_death') || String(autoDeath)}
                disabled={disabled}
                onChange={(e) => set('hp_death', e.target.value)}
                aria-label="Hranice smrti"
              />
              <span
                className="calc"
                title="Hranice smrti = −(10 + oprava ODO). 0 životů = bezvědomí."
              >
                ⓘ
              </span>
            </div>
          </div>

          <ResourceBox prof={prof} cda={cda} disabled={disabled} />
        </div>

        {/* ════ MŘÍŽKA 3 sloupce ════ */}
        <div className="grid">
          {/* SLOUPEC 1 — atributy */}
          <div>
            <section className="panel">
              <h3 className="panel-h">
                <span className="seal">★</span>Atributy
              </h3>
              <div className="attr-head">
                <span>Vlastnost</span>
                <span>Stup.</span>
                <span>Opr.</span>
              </div>
              <div className="attrs">
                {DRDH_ATTRS.map((a) => {
                  const mod = drdhAttrMod(g(`attr_${a.id}`));
                  return (
                    <div key={a.id} className="attr-row">
                      <span className="a-name">
                        {a.label}
                        <small>{a.abbr}</small>
                      </span>
                      <input
                        className="a-deg"
                        value={g(`attr_${a.id}`)}
                        disabled={disabled}
                        onChange={(e) => set(`attr_${a.id}`, e.target.value)}
                        aria-label={`${a.label} stupeň`}
                      />
                      <input
                        className="a-mod"
                        readOnly
                        tabIndex={-1}
                        value={fmtMod(mod)}
                        aria-label={`${a.label} oprava`}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* SLOUPEC 2 — boj */}
          <div>
            <section className="panel">
              <h3 className="panel-h">
                <span className="seal crimson">⚔</span>Zbraně
              </h3>
              <WeaponsTable cda={cda} disabled={disabled} />
            </section>
            <section className="panel">
              <h3 className="panel-h">
                <span className="seal">⛨</span>Zbroj a štít
              </h3>
              <ArmorsTable cda={cda} disabled={disabled} />
            </section>
          </div>

          {/* SLOUPEC 3 — dovednosti */}
          <div>
            <section className="panel">
              <h3 className="panel-h">
                <span className="seal">🗡</span>Dovednosti
              </h3>
              <div className="skill-pts">
                <label htmlFor="drdh_skill_points">Dovednostní body</label>
                <input
                  id="drdh_skill_points"
                  value={g('skill_points')}
                  disabled={disabled}
                  onChange={(e) => set('skill_points', e.target.value)}
                  aria-label="Dovednostní body"
                />
              </div>
              <SkillsTable cda={cda} disabled={disabled} />
            </section>
          </div>
        </div>

        {/* ════ PER-POVOLÁNÍ hlavní blok ════ */}
        <ProfessionTable prof={prof} cda={cda} disabled={disabled} />

        {/* ════ SPODNÍ ZÓNA ════ */}
        <div className="bottom">
          <div className="scroll-panel">
            <h3 className="panel-h">
              <span className="seal">✦</span>Zvláštní schopnosti
            </h3>
            <AbilitiesTable cda={cda} disabled={disabled} />
          </div>
          <div className="scroll-panel">
            <h3 className="panel-h">
              <span className="seal">💍</span>Magické předměty
            </h3>
            <textarea
              value={g('magic_items')}
              disabled={disabled}
              onChange={(e) => set('magic_items', e.target.value)}
              placeholder="Magické předměty, jejich účinky a nabití…"
              aria-label="Magické předměty"
            />
          </div>
          <div className="scroll-panel notes">
            <h3 className="panel-h">
              <span className="seal crimson">✒</span>Poznámky hlídkaře
            </h3>
            <textarea
              value={g('notes')}
              disabled={disabled}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Mise, kontakty, sliby, dluhy, tajemství…"
              aria-label="Poznámky hlídkaře"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Secondary resource (per profession) ─────────────────────────

interface SubProps {
  cda: CdAccess;
  disabled: boolean;
}

function ResourcePair({
  cda,
  disabled,
  curKey,
  maxKey,
  curStyle,
  curLabel,
  maxLabel,
}: SubProps & {
  curKey: string;
  maxKey: string;
  curStyle?: React.CSSProperties;
  curLabel: string;
  maxLabel: string;
}) {
  const { g, set } = cda;
  return (
    <div className="res-pair">
      <input
        className="r-cur"
        style={curStyle}
        value={g(curKey)}
        disabled={disabled}
        onChange={(e) => set(curKey, e.target.value)}
        aria-label={curLabel}
      />
      <span className="r-sep">/</span>
      <input
        className="r-max"
        value={g(maxKey)}
        disabled={disabled}
        onChange={(e) => set(maxKey, e.target.value)}
        aria-label={maxLabel}
      />
    </div>
  );
}

function ResourceBox({
  prof,
  cda,
  disabled,
}: SubProps & { prof: DrdhProfessionId }) {
  const { g, set, bool } = cda;
  const cfg = DRDH_RESOURCE_BY_PROF[prof];
  const sealGlyph = DRDH_PROF_BY_ID[prof]?.glyph ?? '⚡';

  let body: React.ReactNode = null;

  switch (cfg.kind) {
    case 'adrenalin': {
      const cur = parseInt(g('res_adr'), 10) || 0;
      body = (
        <>
          <div className="adr-track">
            {Array.from({ length: 20 }, (_, idx) => {
              const n = idx + 1;
              return (
                <div
                  key={n}
                  className={`adr-cell${n <= cur ? ' on' : ''}`}
                  role="button"
                  tabIndex={disabled ? undefined : 0}
                  aria-pressed={n <= cur}
                  aria-label={`Adrenalin ${n}`}
                  onClick={() => {
                    if (disabled) return;
                    set('res_adr', String(cur === n ? n - 1 : n));
                  }}
                  onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      set('res_adr', String(cur === n ? n - 1 : n));
                    }
                  }}
                >
                  {n}
                </div>
              );
            })}
          </div>
          <div className="adr-foot">
            <span>+1 za každé kolo boje · max 20</span>
            <span>
              Aktuální: <b>{cur}</b>
            </span>
          </div>
        </>
      );
      break;
    }
    case 'dusevni':
      body = (
        <>
          <ResourcePair
            cda={cda}
            disabled={disabled}
            curKey="res_ds"
            maxKey="res_ds_max"
            curLabel="Duševní síla aktuální"
            maxLabel="Duševní síla max"
          />
          <div className="res-note">Plné doplnění spánkem</div>
        </>
      );
      break;
    case 'mana_sur':
      body = (
        <div className="res-wrap">
          <div className="res-box">
            <div className="res-note" style={{ margin: '0 0 4px' }}>
              Mana
            </div>
            <ResourcePair
              cda={cda}
              disabled={disabled}
              curKey="res_mana"
              maxKey="res_mana_max"
              curLabel="Mana aktuální"
              maxLabel="Mana max"
            />
          </div>
          <div className="res-box">
            <div className="res-note" style={{ margin: '0 0 4px' }}>
              Suroviny
            </div>
            <ResourcePair
              cda={cda}
              disabled={disabled}
              curKey="res_sur"
              maxKey="res_sur_max"
              curStyle={{ color: 'var(--drdh-res-alt, #5fae73)' }}
              curLabel="Suroviny aktuální"
              maxLabel="Suroviny max"
            />
          </div>
        </div>
      );
      break;
    case 'mana':
      body = (
        <>
          <ResourcePair
            cda={cda}
            disabled={disabled}
            curKey="res_mana"
            maxKey="res_mana_max"
            curLabel="Mana aktuální"
            maxLabel="Mana max"
          />
          <div className="res-mini">
            <label>
              Úroveň
              <input
                value={g('res_mana_lvl')}
                disabled={disabled}
                onChange={(e) => set('res_mana_lvl', e.target.value)}
                aria-label="Úroveň many"
              />
            </label>
            <label>
              Nasátí
              <input
                value={g('res_mana_nasati')}
                disabled={disabled}
                onChange={(e) => set('res_mana_nasati', e.target.value)}
                aria-label="Nasátí many"
              />
            </label>
          </div>
          <div className="res-note">
            Nasávání 1k6 denně · plné doplnění meditací
          </div>
        </>
      );
      break;
    case 'kostymy': {
      const costumes = cda.parseJsonArr<string>('costumes');
      body = (
        <>
          <div className="costume-list">
            {costumes.map((c, i) => (
              <div key={i} className="crow">
                <input
                  value={c}
                  disabled={disabled}
                  onChange={(e) => {
                    const next = [...costumes];
                    next[i] = e.target.value;
                    set('costumes', JSON.stringify(next));
                  }}
                  placeholder="Kostým / přestrojení…"
                  aria-label={`Kostým ${i + 1}`}
                />
                {!disabled && (
                  <button
                    type="button"
                    className="del"
                    onClick={() => {
                      const next = costumes.filter((_, j) => j !== i);
                      set('costumes', JSON.stringify(next));
                    }}
                    aria-label="Smazat kostým"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {!disabled && (
            <button
              type="button"
              className="add-btn"
              style={{ marginTop: 6 }}
              onClick={() => set('costumes', JSON.stringify([...costumes, '']))}
            >
              + Přidat kostým
            </button>
          )}
          <div className="res-note">
            Zloděj nemá magický zdroj — kostýmy jsou seznam přestrojení
          </div>
        </>
      );
      break;
    }
    case 'prizen':
      body = (
        <>
          <ResourcePair
            cda={cda}
            disabled={disabled}
            curKey="res_favor"
            maxKey="res_favor_max"
            curLabel="Přízeň aktuální"
            maxLabel="Přízeň max"
          />
          <div className="prizen-times">
            {(
              [
                ['prizen_rano', '☀', 'Ráno'],
                ['prizen_odpoledne', '⛅', 'Odpoledne'],
                ['prizen_vecer', '☾', 'Večer'],
              ] as const
            ).map(([key, icon, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={bool(key)}
                  disabled={disabled}
                  onChange={(e) => set(key, e.target.checked)}
                  aria-label={label}
                />
                <span className="box">{icon}</span>
                {label}
              </label>
            ))}
          </div>
          <div className="res-note">3× denně lze obnovit 1/3 přízně</div>
        </>
      );
      break;
  }

  return (
    <div className="mega resource">
      <div className="mega-h">
        <span className="seal" aria-hidden="true">
          {sealGlyph}
        </span>
        <span>{cfg.title}</span>
      </div>
      <div className="res-body">{body}</div>
    </div>
  );
}

// ── Weapons / Armors / Skills (tabulky) ────────────────────────

function WeaponsTable({ cda, disabled }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<DrdhWeapon>('weapons');
  return (
    <>
      <table className="tbl selcol">
        <thead>
          <tr>
            <th>Název</th>
            <th>Typ</th>
            <th>Útočnost</th>
            <th>Zranění</th>
            <th>Obrana</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>
                <input
                  className="l"
                  value={row.name || ''}
                  disabled={disabled}
                  onChange={(e) =>
                    updateArr<DrdhWeapon>('weapons', i, { name: e.target.value })
                  }
                  aria-label={`Zbraň ${i + 1} — název`}
                />
              </td>
              <td>
                <select
                  value={row.kind === 'ranged' ? 'ranged' : 'melee'}
                  disabled={disabled}
                  onChange={(e) =>
                    updateArr<DrdhWeapon>('weapons', i, { kind: e.target.value })
                  }
                  aria-label={`Zbraň ${i + 1} — typ`}
                >
                  <option value="melee">blízko</option>
                  <option value="ranged">dálka</option>
                </select>
              </td>
              {(['atk', 'dmg', 'def'] as const).map((field) => (
                <td key={field}>
                  <input
                    value={row[field] || ''}
                    disabled={disabled}
                    onChange={(e) =>
                      updateArr<DrdhWeapon>('weapons', i, {
                        [field]: e.target.value,
                      } as Partial<DrdhWeapon>)
                    }
                    aria-label={`Zbraň ${i + 1} — ${field}`}
                  />
                </td>
              ))}
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="del"
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
          className="add-btn"
          onClick={() =>
            addArr<DrdhWeapon>('weapons', {
              name: '',
              kind: 'melee',
              atk: '',
              dmg: '',
              def: '',
            })
          }
        >
          + Přidat zbraň
        </button>
      )}
    </>
  );
}

function ArmorsTable({ cda, disabled }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<DrdhArmor>('armors');
  return (
    <>
      <table className="tbl">
        <thead>
          <tr>
            <th>Zbroj / štít</th>
            <th>Kvalita</th>
            <th>ZO</th>
            <th>Pozn.</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {(['name', 'quality', 'zo', 'note'] as const).map((field) => (
                <td key={field}>
                  <input
                    className={field === 'name' ? 'l' : undefined}
                    value={row[field] || ''}
                    disabled={disabled}
                    onChange={(e) =>
                      updateArr<DrdhArmor>('armors', i, {
                        [field]: e.target.value,
                      } as Partial<DrdhArmor>)
                    }
                    aria-label={`Zbroj ${i + 1} — ${field}`}
                  />
                </td>
              ))}
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="del"
                    onClick={() => removeArr('armors', i)}
                    aria-label="Smazat zbroj"
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
          className="add-btn"
          onClick={() =>
            addArr<DrdhArmor>('armors', {
              name: '',
              quality: '',
              zo: '',
              note: '',
            })
          }
        >
          + Přidat zbroj / štít
        </button>
      )}
    </>
  );
}

function SkillsTable({ cda, disabled }: SubProps) {
  const { g, parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<DrdhSkill>('skills');
  // Součet = oprava zvoleného atributu + stupeň (auto, neukládá se).
  const sumOf = (s: DrdhSkill): string => {
    const id = DRDH_ABBR_TO_ID[s.attr as keyof typeof DRDH_ABBR_TO_ID];
    const mod = id ? drdhAttrMod(g(`attr_${id}`)) : 0;
    const deg = parseInt(s.deg, 10) || 0;
    return fmtMod(mod + deg);
  };
  return (
    <>
      <table className="tbl">
        <thead>
          <tr>
            <th>Dovednost</th>
            <th>Atr.</th>
            <th>Stup.</th>
            <th>Souč.</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>
                <input
                  className="l"
                  value={row.name || ''}
                  disabled={disabled}
                  onChange={(e) =>
                    updateArr<DrdhSkill>('skills', i, { name: e.target.value })
                  }
                  aria-label={`Dovednost ${i + 1} — název`}
                />
              </td>
              <td>
                <select
                  value={normDrdhAttr(row.attr) || 'Obr'}
                  disabled={disabled}
                  onChange={(e) =>
                    updateArr<DrdhSkill>('skills', i, { attr: e.target.value })
                  }
                  aria-label={`Dovednost ${i + 1} — atribut`}
                >
                  {DRDH_ATTR_ABBRS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  value={row.deg || ''}
                  disabled={disabled}
                  onChange={(e) =>
                    updateArr<DrdhSkill>('skills', i, { deg: e.target.value })
                  }
                  aria-label={`Dovednost ${i + 1} — stupeň`}
                />
              </td>
              <td>
                <input
                  readOnly
                  tabIndex={-1}
                  value={sumOf(row)}
                  aria-label={`Dovednost ${i + 1} — součet`}
                />
              </td>
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="del"
                    onClick={() => removeArr('skills', i)}
                    aria-label="Smazat dovednost"
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
          className="add-btn"
          onClick={() =>
            addArr<DrdhSkill>('skills', { name: '', attr: 'Obr', deg: '' })
          }
        >
          + Přidat dovednost
        </button>
      )}
    </>
  );
}

function AbilitiesTable({ cda, disabled }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<DrdhAbility>('abilities');
  return (
    <div className="ability-list">
      {rows.map((row, i) => (
        <div className="ability-card" key={i}>
          <div className="ability-head">
            <input
              className="ability-name"
              value={row.name || ''}
              disabled={disabled}
              onChange={(e) =>
                updateArr<DrdhAbility>('abilities', i, { name: e.target.value })
              }
              placeholder="Název schopnosti"
              aria-label={`Schopnost ${i + 1} — název`}
            />
            {!disabled && (
              <button
                type="button"
                className="del"
                onClick={() => removeArr('abilities', i)}
                aria-label="Smazat schopnost"
              >
                ✕
              </button>
            )}
          </div>
          <textarea
            className="ability-desc"
            value={row.desc || ''}
            disabled={disabled}
            onChange={(e) =>
              updateArr<DrdhAbility>('abilities', i, { desc: e.target.value })
            }
            placeholder="Účinek… (zalomí se, vidíš celý text)"
            aria-label={`Schopnost ${i + 1} — účinek`}
            rows={2}
          />
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          className="add-btn"
          onClick={() =>
            addArr<DrdhAbility>('abilities', { name: '', desc: '' })
          }
        >
          + Přidat schopnost
        </button>
      )}
    </div>
  );
}

// ── Profession-specific table (full-width blok) ────────────────

function ProfessionTable({
  prof,
  cda,
  disabled,
}: SubProps & { prof: DrdhProfessionId }) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const def = DRDH_PROF_TABLE[prof];
  if (!def) return null;

  const rows = parseJsonArr<Record<string, string>>(def.arrKey);
  const template: Record<string, string> = def.cols.reduce(
    (acc, c) => ({ ...acc, [c.key]: '' }),
    {},
  );
  const profGlyph = DRDH_PROF_BY_ID[prof]?.glyph ?? '⚡';

  return (
    <section className="panel prof-block">
      <h3 className="panel-h">
        <span className="seal" aria-hidden="true">
          {profGlyph}
        </span>
        <span>{def.title}</span>
      </h3>
      <table className="tbl">
        <thead>
          <tr>
            {def.cols.map((c) => (
              <th key={c.key}>{c.header}</th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {def.cols.map((c) => (
                <td key={c.key}>
                  <input
                    className={c.key === 'name' ? 'l' : undefined}
                    value={row[c.key] || ''}
                    disabled={disabled}
                    onChange={(e) =>
                      updateArr<Record<string, string>>(def.arrKey, i, {
                        [c.key]: e.target.value,
                      })
                    }
                    aria-label={`${def.title} ${i + 1} — ${c.header}`}
                  />
                </td>
              ))}
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="del"
                    onClick={() => removeArr(def.arrKey, i)}
                    aria-label={`Smazat ${def.title.toLowerCase()}`}
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
          className="add-btn"
          onClick={() => addArr(def.arrKey, template)}
        >
          {def.addLabel}
        </button>
      )}
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// PRINT — statický čitelný dokument (čte stejná `drdh_*` data)
// ════════════════════════════════════════════════════════════════

function DrdhPrintView({
  cda,
  prof,
}: {
  cda: CdAccess;
  prof: DrdhProfessionId;
}) {
  const { g, bool } = cda;
  const profDef = DRDH_PROF_BY_ID[prof] ?? DRDH_PROF_BY_ID.valecnik;

  const weapons = cda.parseJsonArr<DrdhWeapon>('weapons');
  const armors = cda.parseJsonArr<DrdhArmor>('armors');
  const skills = cda.parseJsonArr<DrdhSkill>('skills');
  const abilities = cda.parseJsonArr<DrdhAbility>('abilities');
  const costumes = cda.parseJsonArr<string>('costumes');

  const odoMod = drdhAttrMod(g('attr_con'));
  const death = g('hp_death') || String(-(10 + odoMod));

  // Sekundární zdroj per povolání → čitelné řádky.
  const cfg = DRDH_RESOURCE_BY_PROF[prof];
  const resourceLines: { label: string; value: string }[] = [];
  switch (cfg.kind) {
    case 'adrenalin':
      resourceLines.push({ label: 'Adrenalin', value: `${g('res_adr', '0')} / 20` });
      break;
    case 'dusevni':
      resourceLines.push({
        label: 'Duševní síla',
        value: `${g('res_ds', '0')} / ${g('res_ds_max', '0')}`,
      });
      break;
    case 'mana_sur':
      resourceLines.push({
        label: 'Mana',
        value: `${g('res_mana', '0')} / ${g('res_mana_max', '0')}`,
      });
      resourceLines.push({
        label: 'Suroviny',
        value: `${g('res_sur', '0')} / ${g('res_sur_max', '0')}`,
      });
      break;
    case 'mana':
      resourceLines.push({
        label: 'Mana',
        value:
          `${g('res_mana', '0')} / ${g('res_mana_max', '0')}` +
          ` · Úroveň ${g('res_mana_lvl', '0')} · Nasátí ${g('res_mana_nasati', '0')}`,
      });
      break;
    case 'kostymy':
      resourceLines.push({
        label: 'Kostýmy',
        value: costumes.filter((c) => c.trim()).join(', ') || '—',
      });
      break;
    case 'prizen': {
      const times = [
        bool('prizen_rano') ? 'Ráno' : '',
        bool('prizen_odpoledne') ? 'Odpoledne' : '',
        bool('prizen_vecer') ? 'Večer' : '',
      ].filter(Boolean);
      resourceLines.push({
        label: 'Přízeň',
        value:
          `${g('res_favor', '0')} / ${g('res_favor_max', '0')}` +
          (times.length ? ` · ${times.join(', ')}` : ''),
      });
      break;
    }
  }

  const profTable = DRDH_PROF_TABLE[prof];
  const profRows = cda.parseJsonArr<Record<string, string>>(profTable.arrKey);

  const magicItems = g('magic_items').trim();
  const notes = g('notes').trim();

  return (
    <div className="drdh-print">
      <h2>Identita postavy</h2>
      <dl>
        <div>
          <dt>Jméno</dt>
          <dd>{g('name') || '—'}</dd>
        </div>
        <div>
          <dt>Povolání</dt>
          <dd>{profDef.label}</dd>
        </div>
        <div>
          <dt>Specializace</dt>
          <dd>{g('specialization') || '—'}</dd>
        </div>
        <div>
          <dt>Rasa</dt>
          <dd>{g('race') || '—'}</dd>
        </div>
        <div>
          <dt>Úroveň</dt>
          <dd>{g('lvl') || '—'}</dd>
        </div>
        <div>
          <dt>Zkušenosti</dt>
          <dd>{g('xp') || '—'}</dd>
        </div>
        <div>
          <dt>Velikost</dt>
          <dd>{g('size') || '—'}</dd>
        </div>
        <div>
          <dt>Pohyblivost</dt>
          <dd>{g('mobility') || '—'}</dd>
        </div>
        <div>
          <dt>Naložení</dt>
          <dd>{g('encumbrance') || '—'}</dd>
        </div>
        <div>
          <dt>Únava</dt>
          <dd>{g('fatigue') || '—'}</dd>
        </div>
      </dl>

      <h2>Atributy</h2>
      <ul className="matrix-print__plain">
        {DRDH_ATTRS.map((a) => (
          <li key={a.id} className="print-row">
            <span>
              {a.label} ({a.abbr})
            </span>
            <span>
              {g(`attr_${a.id}`) || '—'} ({fmtMod(drdhAttrMod(g(`attr_${a.id}`)))})
            </span>
          </li>
        ))}
      </ul>

      <h2>Bojový stav</h2>
      <dl>
        <div>
          <dt>Životy</dt>
          <dd>
            {g('hp', '0')} / {g('hp_max', '0')}
          </dd>
        </div>
        <div>
          <dt>Hranice smrti</dt>
          <dd>{death}</dd>
        </div>
        {resourceLines.map((r) => (
          <div key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>

      {weapons.length > 0 && (
        <>
          <h2>Zbraně</h2>
          <table>
            <thead>
              <tr>
                <th>Název</th>
                <th>Typ</th>
                <th>Útočnost</th>
                <th>Zranění</th>
                <th>Obrana</th>
              </tr>
            </thead>
            <tbody>
              {weapons.map((w, i) => (
                <tr key={i}>
                  <td>{w.name || '—'}</td>
                  <td>{w.kind === 'ranged' ? 'dálka' : 'blízko'}</td>
                  <td>{w.atk || '—'}</td>
                  <td>{w.dmg || '—'}</td>
                  <td>{w.def || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {armors.length > 0 && (
        <>
          <h2>Zbroj a štít</h2>
          <table>
            <thead>
              <tr>
                <th>Zbroj / štít</th>
                <th>Kvalita</th>
                <th>ZO</th>
                <th>Pozn.</th>
              </tr>
            </thead>
            <tbody>
              {armors.map((a, i) => (
                <tr key={i}>
                  <td>{a.name || '—'}</td>
                  <td>{a.quality || '—'}</td>
                  <td>{a.zo || '—'}</td>
                  <td>{a.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Dovednosti</h2>
      <div>
        <strong>Dovednostní body:</strong> {g('skill_points') || '—'}
      </div>
      {skills.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Dovednost</th>
              <th>Atr.</th>
              <th>Stupeň</th>
              <th>Součet</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((s, i) => {
              const id = DRDH_ABBR_TO_ID[s.attr as keyof typeof DRDH_ABBR_TO_ID];
              const mod = id ? drdhAttrMod(g(`attr_${id}`)) : 0;
              const deg = parseInt(s.deg, 10) || 0;
              return (
                <tr key={i}>
                  <td>{s.name || '—'}</td>
                  <td>{normDrdhAttr(s.attr) || '—'}</td>
                  <td>{s.deg || '—'}</td>
                  <td>{fmtMod(mod + deg)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {profRows.length > 0 && (
        <>
          <h2>{profTable.title}</h2>
          <table>
            <thead>
              <tr>
                {profTable.cols.map((c) => (
                  <th key={c.key}>{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profRows.map((row, i) => (
                <tr key={i}>
                  {profTable.cols.map((c) => (
                    <td key={c.key}>{row[c.key] || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {abilities.length > 0 && (
        <>
          <h2>Zvláštní schopnosti</h2>
          <table>
            <thead>
              <tr>
                <th>Název</th>
                <th>Popis / účinek</th>
              </tr>
            </thead>
            <tbody>
              {abilities.map((a, i) => (
                <tr key={i}>
                  <td>{a.name || '—'}</td>
                  <td>{a.desc || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {magicItems && (
        <>
          <h2>Magické předměty</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{magicItems}</p>
        </>
      )}

      {notes && (
        <>
          <h2>Poznámky hlídkaře</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{notes}</p>
        </>
      )}
    </div>
  );
}
