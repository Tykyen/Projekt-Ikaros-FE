/**
 * 16.2b — Dračí doupě 1.6 (Drd16) deník postavy: grafický redesign.
 *
 * Fantasy „Iluminovaný kodex kováře" — pergamenový list na kovárně, věrný
 * reálnému papíru „Osobní deník" (univerzální napříč povoláními; class-
 * specifický obsah jde do volných textarey). Viz spec-16.2b.
 *
 * Self-contained, scoped `[data-diary-system='drd16']` (vlastní `--dd-*`
 * tokeny, NE sdílené `--mx-*` skin tokeny — pergamen se musí ukázat i pod
 * default fantasy skinem; sjednocení se skin-enginem = 16.2c).
 *
 * Data v `diary.customData` BEZ prefixu (`str_val`, `hp_current`, …) přes
 * `makeCdAccess(cd, '', onChange)` — BC s původním 8.7l sheetem; drd16 je
 * jediný neprefixovaný systém, kolize nehrozí.
 *
 * Mechaniky (potvrzené uživatelem, NErekonstruovat z paměti — CH-023):
 * - 5 háznových vlastností (Síla/Obr/Odl/Int/Cha) → auto-bonus `getDrdBonus`.
 *   PC soft-cap 21 (varování, neblokuje); NPC bez stropu (bonus extrapoluje).
 * - Velikost = písmeno (A/B/C), Pohyblivost = čísla bez bonusu.
 * - Povolání 2-stupňové: specializace odemčená od 6. úrovně.
 * - Životy/Magy = žebřík 50 příček; ≤50 bodů „1 příčka = 1 bod", >50 poměr.
 */
import { usePrintMode } from '@/features/world/export/print';
import { useCharacter } from '@/features/world/pages/api/useCharacter';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  DRD16_CLASS_FAMILIES,
  DRD16_EMPTY_SPELL,
  DRD16_SPELL_FIELDS,
  DRD16_HAZ_STATS,
  DRD16_LOAD_ROWS,
  DRD16_PC_STAT_CAP,
  DRD16_SPECIALIZATIONS,
  DRD16_SPEC_UNLOCK_LEVEL,
  getDrdBonus,
  type Drd16Armor,
  type Drd16RangedWeapon,
  type Drd16Skill,
  type Drd16Spell,
  type Drd16Weapon,
} from './constants';
import { Drd16SpellCard } from './Drd16SpellCard';
import { SheetInitiativeButton } from '../../_shared/SheetInitiativeButton';
import { activateOnKey } from '@/shared/lib/a11y';

const DRD16_RUNGS = 50;

const fmtBonus = (b: number): string => (b > 0 ? `+${b}` : String(b));

export function Drd16Sheet({
  diary,
  mode,
  onChange,
  onRoll,
  worldId,
  characterSlug,
}: SystemSheetProps) {
  const disabled = mode === 'view';
  const printMode = usePrintMode();
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, '', onChange);
  const { g, set } = cda;

  // NPC clamp — `Character.isNpc` (jako Matrix 16.2a). Bez portrétu (erb dekorativní).
  const { data: character } = useCharacter(worldId, characterSlug);
  const isNpc = !!character?.isNpc;

  if (printMode) return <Drd16PrintView cda={cda} />;

  const level = parseInt(g('level', ''), 10);
  const classBase = g('class');
  const specs = DRD16_SPECIALIZATIONS[classBase] ?? [];
  const specUnlocked =
    !Number.isNaN(level) && level >= DRD16_SPEC_UNLOCK_LEVEL && specs.length > 0;

  return (
    <div className={`drd16-sheet${disabled ? ' is-view' : ''}`}>
      {onRoll && <SheetInitiativeButton onRoll={onRoll} kind="d20" />}

      {/* ═══ HERO ═══ */}
      <header className="drd16-hero">
        <Erb />
        <div className="drd16-ident">
          <p className="drd16-eyebrow">Dračí doupě 1.6</p>
          <input
            className="drd16-name"
            value={g('name')}
            disabled={disabled}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Jméno postavy…"
            aria-label="Jméno postavy"
          />
          <div className="drd16-ident-line">
            <div className="drd16-field">
              <label htmlFor="drd16-race">Rasa</label>
              <input
                id="drd16-race"
                value={g('race')}
                disabled={disabled}
                onChange={(e) => set('race', e.target.value)}
                placeholder="Rasa…"
              />
            </div>
            <div className="drd16-field">
              <label htmlFor="drd16-class">Povolání</label>
              <select
                id="drd16-class"
                value={g('class')}
                disabled={disabled}
                onChange={(e) => set('class', e.target.value)}
                aria-label="Povolání"
              >
                <option value="">— Povolání —</option>
                {DRD16_CLASS_FAMILIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className={`drd16-field drd16-spec${specUnlocked ? '' : ' locked'}`}>
              <label htmlFor="drd16-spec">Specializace (od 6. úrovně)</label>
              <select
                id="drd16-spec"
                value={g('class_spec')}
                disabled={disabled || !specUnlocked}
                onChange={(e) => set('class_spec', e.target.value)}
                aria-label="Specializace"
              >
                <option value="">—</option>
                {specs.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {!specUnlocked && (
                <span className="drd16-spec-lock">🔒 odemkne se na 6. úrovni</span>
              )}
            </div>
            <div className="drd16-field drd16-field-level">
              <label htmlFor="drd16-level">Úroveň</label>
              <input
                id="drd16-level"
                inputMode="numeric"
                value={g('level')}
                disabled={disabled}
                onChange={(e) => set('level', e.target.value)}
                aria-label="Úroveň"
              />
            </div>
          </div>
        </div>
        <div className="drd16-vitals">
          <PlaqueInput
            variant="life"
            label="Max. životů"
            statKey="hp_max"
            cda={cda}
            disabled={disabled}
          />
          <PlaqueInput
            variant="magy"
            label="Max. magů"
            statKey="mana_max"
            cda={cda}
            disabled={disabled}
          />
        </div>
      </header>

      {/* ═══ HUD ═══ */}
      <div className="drd16-hud">
        <div className="drd16-hud-cell hp">
          <span className="drd16-hud-emblem">❤</span>
          <span className="drd16-hud-lab">Životy</span>
          <span className="drd16-hud-val">
            {g('hp_current', '0')} / {g('hp_max', '0')}
          </span>
        </div>
        <div className="drd16-hud-cell ma">
          <span className="drd16-hud-emblem">✦</span>
          <span className="drd16-hud-lab">Magy</span>
          <span className="drd16-hud-val">
            {g('mana_current', '0')} / {g('mana_max', '0')}
          </span>
        </div>
        <div className="drd16-hud-cell oc">
          <span className="drd16-hud-emblem">⛨</span>
          <span className="drd16-hud-lab">Obranné číslo</span>
          <span className="drd16-hud-val">{g('defense', '0')}</span>
        </div>
      </div>

      {/* ═══ GRID 3 sloupce ═══ */}
      <div className="drd16-grid">
        {/* SLOUPEC 1 */}
        <div className="drd16-col">
          <section className="drd16-panel">
            <h3 className="drd16-panel-h">Vlastnosti</h3>
            {DRD16_HAZ_STATS.map((s) => (
              <PrimaryStatRow
                key={s.key}
                label={s.label}
                statKey={s.key}
                isNpc={isNpc}
                cda={cda}
                disabled={disabled}
              />
            ))}
            <div className="drd16-stat-row siz">
              <span className="st-name">Velikost</span>
              <input
                className="st-letter"
                value={g('size_letter')}
                maxLength={2}
                disabled={disabled}
                onChange={(e) => set('size_letter', e.target.value)}
                aria-label="Velikost (písmeno)"
              />
              <span className="siz-note">písmeno (A/B/C…)</span>
            </div>
          </section>

          <section className="drd16-panel">
            <h3 className="drd16-panel-h">Pohyblivost</h3>
            <div className="drd16-enc-row base">
              <span className="st-name">Základní</span>
              <input
                value={g('mov_val')}
                disabled={disabled}
                onChange={(e) => set('mov_val', e.target.value)}
                aria-label="Pohyblivost základní"
              />
            </div>
            {DRD16_LOAD_ROWS.map((r) => (
              <div key={r.key} className="drd16-enc-row">
                <span className="st-name">{r.label}</span>
                <input
                  value={g(r.key)}
                  disabled={disabled}
                  onChange={(e) => set(r.key, e.target.value)}
                  aria-label={`Pohyblivost — ${r.label}`}
                />
              </div>
            ))}
            <p className="drd16-hint">
              Čísla bez bonusu — kolik dílků postava ujde při daném naložení.
            </p>
          </section>

          <section className="drd16-panel">
            <h3 className="drd16-panel-h">Postřeh</h3>
            <PostrehTable cda={cda} disabled={disabled} />
          </section>
        </div>

        {/* SLOUPEC 2 */}
        <div className="drd16-col">
          <section className="drd16-panel">
            <h3 className="drd16-panel-h">Boj — tváří v tvář</h3>
            <MeleeWeaponsTable cda={cda} disabled={disabled} />
          </section>
          <section className="drd16-panel">
            <h3 className="drd16-panel-h">Boj — střelecký</h3>
            <RangedWeaponsTable cda={cda} disabled={disabled} />
          </section>
          <section className="drd16-panel">
            <h3 className="drd16-panel-h">Obrana</h3>
            <div className="drd16-oc-seal">
              <span className="oc-lab">Obranné číslo</span>
              <input
                value={g('defense')}
                disabled={disabled}
                onChange={(e) => set('defense', e.target.value)}
                placeholder="0"
                aria-label="Obranné číslo"
              />
            </div>
            <ArmorTable cda={cda} disabled={disabled} />
          </section>
          <section className="drd16-panel">
            <h3 className="drd16-panel-h">Dovednosti</h3>
            <SkillsTable cda={cda} disabled={disabled} />
          </section>
        </div>

        {/* SLOUPEC 3 */}
        <div className="drd16-col">
          <section className="drd16-panel">
            <h3 className="drd16-panel-h">Životy a magy</h3>
            <div className="drd16-ladders">
              <DrdLadder
                variant="life"
                title="Životy"
                curKey="hp_current"
                maxKey="hp_max"
                cda={cda}
                disabled={disabled}
              />
              <DrdLadder
                variant="magy"
                title="Magy"
                curKey="mana_current"
                maxKey="mana_max"
                cda={cda}
                disabled={disabled}
              />
            </div>
          </section>
        </div>
      </div>

      {/* ═══ SPODNÍ ZÓNA ═══ */}
      <div className="drd16-bottom">
        <div className="drd16-scroll-panel">
          <h3 className="drd16-panel-h">Zvláštní schopnosti</h3>
          <textarea
            value={g('special_abilities')}
            disabled={disabled}
            onChange={(e) => set('special_abilities', e.target.value)}
            placeholder="Schopnosti povolání, finty, bojové triky, alchymistické recepty, zlodějské cviky…"
            aria-label="Zvláštní schopnosti"
          />
        </div>
        <div className="drd16-scroll-panel">
          <h3 className="drd16-panel-h">Kouzla / Spellbook</h3>
          <Drd16Spellbook cda={cda} disabled={disabled} />
        </div>
        <div className="drd16-scroll-panel notes">
          <h3 className="drd16-panel-h">Poznámky</h3>
          <textarea
            value={g('notes')}
            disabled={disabled}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Deník dobrodružství, sliby, dluhy, kontakty…"
            aria-label="Poznámky"
          />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Sub-komponenty
// ════════════════════════════════════════════════════════════════

interface SubProps {
  cda: CdAccess;
  disabled: boolean;
}

/**
 * 16.2b-mapa — spellbook editor (sdílená `Drd16SpellCard`). Jediný zdroj =
 * `customData.spells` (JSON pole), reuse i v okně „Kouzla" combat panelu na
 * taktické mapě. Změna typu textarea→JSON; v drd16 denících zatím žádná
 * kouzla → bez migrace (starý prázdný/text klíč → `parseJsonArr` vrátí []).
 */
function Drd16Spellbook({ cda, disabled }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const spells = parseJsonArr<Drd16Spell>('spells');
  return (
    <>
      {spells.map((spell, i) => (
        <Drd16SpellCard
          key={i}
          spell={{ ...DRD16_EMPTY_SPELL, ...spell }}
          editable={!disabled}
          onChange={(patch) => updateArr<Drd16Spell>('spells', i, patch)}
          onRemove={() => removeArr('spells', i)}
        />
      ))}
      {!disabled && (
        <button
          type="button"
          className="drd16-add"
          onClick={() => addArr<Drd16Spell>('spells', DRD16_EMPTY_SPELL)}
        >
          + Přidat kouzlo
        </button>
      )}
    </>
  );
}

/** Dekorativní heraldický štít (erb). Upload vlastního = navazující sub-krok. */
function Erb() {
  return (
    <div className="drd16-erb" aria-hidden="true">
      <svg viewBox="0 0 100 118">
        <defs>
          <linearGradient id="drd16-shield" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9c2a23" />
            <stop offset="1" stopColor="#5c1612" />
          </linearGradient>
          <linearGradient id="drd16-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3dd97" />
            <stop offset="1" stopColor="#8a6a26" />
          </linearGradient>
        </defs>
        <path
          d="M50 6 L92 18 V58 C92 86 72 104 50 114 C28 104 8 86 8 58 V18 Z"
          fill="url(#drd16-shield)"
          stroke="url(#drd16-gold)"
          strokeWidth="3.5"
        />
        <path
          d="M50 14 L85 24 V57 C85 80 68 95 50 104 C32 95 15 80 15 57 V24 Z"
          fill="none"
          stroke="rgba(243,221,151,.45)"
          strokeWidth="1"
        />
        <path
          d="M50 34 C44 40 40 44 42 52 C44 58 52 56 52 50 C52 46 48 46 48 49 M50 34 C56 40 60 44 58 52 C56 58 50 60 48 66 C46 74 54 78 60 72 M50 60 C46 68 44 76 50 84 C56 76 54 68 50 60Z"
          fill="url(#drd16-gold)"
          opacity=".92"
        />
        <circle cx="50" cy="33" r="3" fill="url(#drd16-gold)" />
      </svg>
      <span className="drd16-erb-banner">Erb</span>
    </div>
  );
}

interface PrimaryStatRowProps extends SubProps {
  label: string;
  statKey: string;
  isNpc: boolean;
}

function PrimaryStatRow({
  label,
  statKey,
  isNpc,
  cda,
  disabled,
}: PrimaryStatRowProps) {
  const { g, set } = cda;
  const raw = g(`${statKey}_val`);
  const v = parseInt(raw, 10);
  const bonus = Number.isNaN(v) ? 0 : getDrdBonus(v);
  const over = !isNpc && !Number.isNaN(v) && v > DRD16_PC_STAT_CAP;
  const bcls = bonus > 0 ? 'pos' : bonus < 0 ? 'neg' : 'zero';
  return (
    <div className={`drd16-stat-row${over ? ' over' : ''}`}>
      <span className="st-name">{label}</span>
      <input
        className="st-val"
        inputMode="numeric"
        value={raw}
        disabled={disabled}
        onChange={(e) => set(`${statKey}_val`, e.target.value)}
        aria-label={`${label} hodnota`}
      />
      <span className={`drd16-bonus ${bcls}`} aria-label={`${label} bonus`}>
        {fmtBonus(bonus)}
      </span>
      {over && (
        <span className="st-warn">
          Hráčova trvalá vlastnost nepřekročí {DRD16_PC_STAT_CAP} (přechodný buff
          je v pořádku).
        </span>
      )}
    </div>
  );
}

interface PlaqueInputProps extends SubProps {
  variant: 'life' | 'magy';
  label: string;
  statKey: string;
}

function PlaqueInput({ variant, label, statKey, cda, disabled }: PlaqueInputProps) {
  const { g, set } = cda;
  return (
    <div className={`drd16-plaque ${variant}`}>
      <span className="pl-lab">{label}</span>
      <span className="pl-val">
        <input
          inputMode="numeric"
          value={g(statKey)}
          disabled={disabled}
          onChange={(e) => set(statKey, e.target.value)}
          aria-label={label}
        />
      </span>
    </div>
  );
}

function PostrehTable({ cda, disabled }: SubProps) {
  const { g, set } = cda;
  const cell = (key: string, aria: string) => (
    <td>
      <input
        value={g(key)}
        disabled={disabled}
        onChange={(e) => set(key, e.target.value)}
        aria-label={aria}
      />
    </td>
  );
  return (
    <table className="drd16-combat per">
      <thead>
        <tr>
          <th />
          <th>Náhodný</th>
          <th>Hledaný</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th className="rh">Objevení objektů</th>
          {cell('per_obj_rand', 'Objevení objektů náhodný')}
          {cell('per_obj_seek', 'Objevení objektů hledaný')}
        </tr>
        <tr>
          <th className="rh">Objevení mechanismů</th>
          {cell('per_mec_rand', 'Objevení mechanismů náhodný')}
          {cell('per_mec_seek', 'Objevení mechanismů hledaný')}
        </tr>
      </tbody>
    </table>
  );
}

// ── Weapons / Skills / Armor tabulky ────────────────────────────

function MeleeWeaponsTable({ cda, disabled }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<Drd16Weapon>('meleeWeapons');
  return (
    <>
      <table className="drd16-combat">
        <thead>
          <tr>
            <th>Zbraň</th>
            <th>Kde</th>
            <th>ÚČ</th>
            <th>Útoč.</th>
            <th>OZ</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {(['weapon', 'where', 'uc', 'utoc', 'oz'] as const).map(
                (field, idx) => (
                  <td key={field}>
                    <input
                      className={idx === 0 ? 'left-align' : ''}
                      value={row[field] || ''}
                      disabled={disabled}
                      onChange={(e) =>
                        updateArr<Drd16Weapon>('meleeWeapons', i, {
                          [field]: e.target.value,
                        } as Partial<Drd16Weapon>)
                      }
                      aria-label={`Melee ${i + 1} ${field}`}
                    />
                  </td>
                ),
              )}
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="drd16-del"
                    onClick={() => removeArr('meleeWeapons', i)}
                    aria-label="Smazat zbraň na blízko"
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
          className="drd16-add"
          onClick={() =>
            addArr<Drd16Weapon>('meleeWeapons', {
              weapon: '',
              where: '',
              uc: '',
              utoc: '',
              oz: '',
            })
          }
        >
          + Přidat zbraň na blízko
        </button>
      )}
    </>
  );
}

function RangedWeaponsTable({ cda, disabled }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<Drd16RangedWeapon>('rangedWeapons');
  return (
    <>
      <table className="drd16-combat">
        <thead>
          <tr>
            <th>Zbraň</th>
            <th>ÚČ</th>
            <th>Útoč.</th>
            <th>Malý</th>
            <th>Stř.</th>
            <th>Velký</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {(
                ['weapon', 'uc', 'utoc', 'small', 'medium', 'large'] as const
              ).map((field, idx) => (
                <td key={field}>
                  <input
                    className={idx === 0 ? 'left-align' : ''}
                    value={row[field] || ''}
                    disabled={disabled}
                    onChange={(e) =>
                      updateArr<Drd16RangedWeapon>('rangedWeapons', i, {
                        [field]: e.target.value,
                      } as Partial<Drd16RangedWeapon>)
                    }
                    aria-label={`Ranged ${i + 1} ${field}`}
                  />
                </td>
              ))}
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="drd16-del"
                    onClick={() => removeArr('rangedWeapons', i)}
                    aria-label="Smazat střelnou zbraň"
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
          className="drd16-add"
          onClick={() =>
            addArr<Drd16RangedWeapon>('rangedWeapons', {
              weapon: '',
              uc: '',
              utoc: '',
              small: '',
              medium: '',
              large: '',
            })
          }
        >
          + Přidat střelnou zbraň
        </button>
      )}
    </>
  );
}

function SkillsTable({ cda, disabled }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<Drd16Skill>('drdSkills');
  return (
    <>
      <table className="drd16-combat">
        <thead>
          <tr>
            <th>Dovednost</th>
            <th>Stupeň</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>
                <input
                  className="left-align"
                  value={row.name || ''}
                  disabled={disabled}
                  onChange={(e) =>
                    updateArr<Drd16Skill>('drdSkills', i, {
                      name: e.target.value,
                    })
                  }
                  aria-label={`Dovednost ${i + 1} název`}
                />
              </td>
              <td>
                <input
                  value={row.level || ''}
                  disabled={disabled}
                  onChange={(e) =>
                    updateArr<Drd16Skill>('drdSkills', i, {
                      level: e.target.value,
                    })
                  }
                  placeholder="Průměrně"
                  aria-label={`Dovednost ${i + 1} stupeň`}
                />
              </td>
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="drd16-del"
                    onClick={() => removeArr('drdSkills', i)}
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
          className="drd16-add"
          onClick={() => addArr<Drd16Skill>('drdSkills', { name: '', level: '' })}
        >
          + Přidat dovednost
        </button>
      )}
    </>
  );
}

function ArmorTable({ cda, disabled }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<Drd16Armor>('armor');
  return (
    <>
      <table className="drd16-combat armor">
        <thead>
          <tr>
            <th>Zbroj / štít</th>
            <th>OČ</th>
            <th>Pozn.</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>
                <input
                  className="left-align"
                  value={row.name || ''}
                  disabled={disabled}
                  onChange={(e) =>
                    updateArr<Drd16Armor>('armor', i, { name: e.target.value })
                  }
                  aria-label={`Zbroj ${i + 1} název`}
                />
              </td>
              <td>
                <input
                  value={row.oc || ''}
                  disabled={disabled}
                  onChange={(e) =>
                    updateArr<Drd16Armor>('armor', i, { oc: e.target.value })
                  }
                  aria-label={`Zbroj ${i + 1} OČ`}
                />
              </td>
              <td>
                <input
                  value={row.note || ''}
                  disabled={disabled}
                  onChange={(e) =>
                    updateArr<Drd16Armor>('armor', i, { note: e.target.value })
                  }
                  aria-label={`Zbroj ${i + 1} poznámka`}
                />
              </td>
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="drd16-del"
                    onClick={() => removeArr('armor', i)}
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
          className="drd16-add"
          onClick={() =>
            addArr<Drd16Armor>('armor', { name: '', oc: '', note: '' })
          }
        >
          + Přidat zbroj / štít
        </button>
      )}
    </>
  );
}

// ── Iluminovaný žebřík životů/magů ──────────────────────────────
// 50 příček = konstantní výška. ≤50 bodů → „1 příčka = 1 bod" (papír);
// >50 → poměr (1 příčka = max/50), popisky se přečíslují. Mobilní proužek
// (.drd16-hpbar) je v DOM vždy, CSS ho ukáže místo žebříku ≤900px.

interface DrdLadderProps extends SubProps {
  variant: 'life' | 'magy';
  title: string;
  curKey: string;
  maxKey: string;
}

function DrdLadder({
  variant,
  title,
  curKey,
  maxKey,
  cda,
  disabled,
}: DrdLadderProps) {
  const { g, set } = cda;
  const max = Math.max(0, parseInt(g(maxKey, '0'), 10) || 0);
  const cur = Math.max(0, Math.min(max, parseInt(g(curKey, '0'), 10) || 0));
  const perPoint = max <= DRD16_RUNGS;
  const step = max > 0 ? max / DRD16_RUNGS : 0;
  const lit =
    max > 0 ? (perPoint ? cur : Math.round((cur / max) * DRD16_RUNGS)) : 0;
  const maxRung = perPoint ? max : DRD16_RUNGS;
  const pct = max > 0 ? Math.min(100, (cur / max) * 100) : 0;

  const setCur = (val: number) => {
    if (disabled) return;
    set(curKey, String(Math.max(0, Math.min(max, val))));
  };

  const rungs = [];
  for (let i = 1; i <= DRD16_RUNGS; i++) {
    const val = perPoint ? i : Math.round(i * step);
    const on = i <= lit;
    const mark = max > 0 && i === maxRung;
    const setRung = () => setCur(val);
    rungs.push(
      <div
        key={i}
        className={`drd16-rung${on ? ' on' : ''}${mark ? ' maxmark' : ''}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Nastavit ${val}`}
        aria-pressed={on}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : setRung}
        onKeyDown={disabled ? undefined : activateOnKey(setRung)}
      >
        <span className="rn">{val}</span>
        <span className="rbar" />
      </div>,
    );
  }

  return (
    <div className={`drd16-ladder ${variant}`}>
      <div className="drd16-ladder-h">{title}</div>
      <div className="drd16-rungs">{rungs}</div>
      <div className="drd16-hpbar">
        <div className="drd16-hpbar-fill" style={{ width: `${pct}%` }} />
      </div>
      {!disabled && (
        <div className="drd16-ladder-ctl">
          {[-5, -1, 1, 5].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setCur(cur + d)}
              aria-label={`${title} ${d > 0 ? `+${d}` : d}`}
            >
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>
      )}
      <div className="drd16-ladder-cur">
        <input
          className="c"
          inputMode="numeric"
          value={g(curKey, '0')}
          disabled={disabled}
          onChange={(e) => set(curKey, e.target.value)}
          aria-label={`${title} aktuální`}
        />
        <small>
          {' / '}
          <span className="m">{g(maxKey, '0')}</span>
        </small>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PRINT — statický čitelný dokument (čte stejná data, prefix '')
// ════════════════════════════════════════════════════════════════

function Drd16PrintView({ cda }: { cda: CdAccess }) {
  const { g } = cda;
  const meleeWeapons = cda.parseJsonArr<Drd16Weapon>('meleeWeapons');
  const rangedWeapons = cda.parseJsonArr<Drd16RangedWeapon>('rangedWeapons');
  const drdSkills = cda.parseJsonArr<Drd16Skill>('drdSkills');
  const armor = cda.parseJsonArr<Drd16Armor>('armor');
  const spells = cda.parseJsonArr<Drd16Spell>('spells');

  const primaryBonus = (key: string): string => {
    const v = parseInt(g(`${key}_val`, ''), 10);
    return Number.isNaN(v) ? '—' : fmtBonus(getDrdBonus(v));
  };

  const classLine = [g('class'), g('class_spec')].filter(Boolean).join(' → ');
  const specialAbilities = g('special_abilities').trim();
  const notes = g('notes').trim();

  return (
    <div className="drd16-print">
      <h2>Identita</h2>
      <dl>
        <div>
          <dt>Jméno</dt>
          <dd>{g('name') || '—'}</dd>
        </div>
        <div>
          <dt>Rasa</dt>
          <dd>{g('race') || '—'}</dd>
        </div>
        <div>
          <dt>Povolání</dt>
          <dd>{classLine || '—'}</dd>
        </div>
        <div>
          <dt>Úroveň</dt>
          <dd>{g('level') || '—'}</dd>
        </div>
      </dl>

      <h2>Zdroje</h2>
      <dl className="print-cols">
        <div>
          <dt>Životy</dt>
          <dd>
            {g('hp_current', '0')} / {g('hp_max', '0')}
          </dd>
        </div>
        <div>
          <dt>Magy</dt>
          <dd>
            {g('mana_current', '0')} / {g('mana_max', '0')}
          </dd>
        </div>
        <div>
          <dt>Obrana (OČ)</dt>
          <dd>{g('defense', '0')}</dd>
        </div>
      </dl>

      <h2>Vlastnosti</h2>
      <ul className="matrix-print__plain">
        {DRD16_HAZ_STATS.map((s) => (
          <li key={s.key} className="print-row">
            <span>{s.label}</span>
            <span>
              {g(`${s.key}_val`, '—') || '—'} ({primaryBonus(s.key)})
            </span>
          </li>
        ))}
        <li className="print-row">
          <span>Velikost</span>
          <span>{g('size_letter') || '—'}</span>
        </li>
      </ul>

      <h2>Pohyblivost</h2>
      <dl className="print-cols">
        <div>
          <dt>Základní</dt>
          <dd>{g('mov_val') || '—'}</dd>
        </div>
        {DRD16_LOAD_ROWS.map((r) => (
          <div key={r.key}>
            <dt>{r.label}</dt>
            <dd>{g(r.key) || '—'}</dd>
          </div>
        ))}
      </dl>

      <h2>Postřeh</h2>
      <table>
        <thead>
          <tr>
            <th />
            <th>Náhodný</th>
            <th>Hledaný</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Objevení objektů</td>
            <td>{g('per_obj_rand') || '—'}</td>
            <td>{g('per_obj_seek') || '—'}</td>
          </tr>
          <tr>
            <td>Objevení mechanismů</td>
            <td>{g('per_mec_rand') || '—'}</td>
            <td>{g('per_mec_seek') || '—'}</td>
          </tr>
        </tbody>
      </table>

      {armor.length > 0 && (
        <>
          <h2>Zbroj</h2>
          <ul className="matrix-print__plain">
            {armor.map((a, i) => (
              <li key={i} className="print-row">
                <span>{a.name || '—'}</span>
                <span>
                  OČ {a.oc || '—'}
                  {a.note ? ` · ${a.note}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {meleeWeapons.length > 0 && (
        <>
          <h2>Zbraně na blízko</h2>
          <table>
            <thead>
              <tr>
                <th>Zbraň</th>
                <th>Kde</th>
                <th>ÚČ</th>
                <th>Útoč</th>
                <th>OZ</th>
              </tr>
            </thead>
            <tbody>
              {meleeWeapons.map((w, i) => (
                <tr key={i}>
                  <td>{w.weapon || '—'}</td>
                  <td>{w.where || '—'}</td>
                  <td>{w.uc || '—'}</td>
                  <td>{w.utoc || '—'}</td>
                  <td>{w.oz || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {rangedWeapons.length > 0 && (
        <>
          <h2>Zbraně střelné</h2>
          <table>
            <thead>
              <tr>
                <th>Zbraň</th>
                <th>ÚČ</th>
                <th>Útoč</th>
                <th>Malý</th>
                <th>Stř.</th>
                <th>Velký</th>
              </tr>
            </thead>
            <tbody>
              {rangedWeapons.map((w, i) => (
                <tr key={i}>
                  <td>{w.weapon || '—'}</td>
                  <td>{w.uc || '—'}</td>
                  <td>{w.utoc || '—'}</td>
                  <td>{w.small || '—'}</td>
                  <td>{w.medium || '—'}</td>
                  <td>{w.large || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {drdSkills.length > 0 && (
        <>
          <h2>Dovednosti</h2>
          <ul className="matrix-print__plain">
            {drdSkills.map((s, i) => (
              <li key={i} className="print-row">
                <span>{s.name || '—'}</span>
                <span>{s.level || '—'}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {specialAbilities && (
        <>
          <h2>Zvláštní schopnosti</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{specialAbilities}</p>
        </>
      )}

      {spells.length > 0 && (
        <>
          <h2>Kouzla / Spellbook</h2>
          {spells.map((s, i) => (
            <div key={i} className="print-spell">
              <strong>{s.name || '(bez názvu)'}</strong>
              {s.incantation && <em> — {s.incantation}</em>}
              {s.domain && <span> [{s.domain}]</span>}
              <dl className="print-cols">
                {DRD16_SPELL_FIELDS.filter((f) => s[f.key]).map((f) => (
                  <div key={f.key}>
                    <dt>{f.label}</dt>
                    <dd>{s[f.key]}</dd>
                  </div>
                ))}
              </dl>
              {s.description && (
                <p style={{ whiteSpace: 'pre-wrap' }}>{s.description}</p>
              )}
            </div>
          ))}
        </>
      )}

      {notes && (
        <>
          <h2>Poznámky</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{notes}</p>
        </>
      )}
    </div>
  );
}
