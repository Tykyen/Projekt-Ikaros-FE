/**
 * 8.7l — Dračí doupě 1.6 (Drd16) deník postavy.
 *
 * Adaptace z `c:/Matrix/Matrix/frontend/src/components/diary/Drd16CharacterSheet.tsx`
 * (589 ř base sheet). Warm medieval amber téma.
 *
 * SCOPE CUT: Matrix/Matrix má 13 class-specific modulů (Warrior /
 * Ranger / Thief / Wizard / Alchemy / Theurg / NonMagicItems / AlchemyItems
 * / SwordsmanFints / RangerSpells / WizardData / ThiefData / ThiefConstants)
 * dohromady ~17k řádků kódu + 100KB data files se spell databází + thief skill
 * tabulkami. Tato iterace 8.7l implementuje **base sheet** (atributy, HP/mana,
 * weapons tables, skills, defense, encumbrance, povolání select, textarea
 * pro spells & special abilities). Class-specific moduly = budoucí 8.7n+
 * iterace (každý modul samostatný sub-spec).
 *
 * PJ může v Ikarosu vyplnit specializace ručně v `special_abilities`/`spells`
 * textareách. Datové klíče `wizard_known_spells`, `thief_skill_*`, atd.
 * z Matrix/Matrix jsou v customData zachovány (BE je přijímá), jen Ikaros
 * je teď zobrazuje pouze v base textareách.
 */
import { usePrintMode } from '@/features/world/export/print';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  DRD16_CLASSES,
  DRD16_PRIMARY_STATS,
  DRD16_SECONDARY_STATS,
  getDrdBonus,
  type Drd16RangedWeapon,
  type Drd16Skill,
  type Drd16Weapon,
} from './constants';
import { SheetInitiativeButton } from '../../_shared/SheetInitiativeButton';

export function Drd16Sheet({
  diary,
  mode,
  onChange,
  onRoll,
}: SystemSheetProps) {
  const disabled = mode === 'view';
  const printMode = usePrintMode();
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, '', onChange);
  // Note: Drd16 v Matrix/Matrix nepoužíval prefix (žádný `drd16_` ani `drd_`),
  // klíče byly přímé: `str_val`, `hp_current`, atd. Pro Ikaros zachováváme
  // stejný tvar — jiné systémy mají vlastní prefix, takže kolize nehrozí.
  const { g, set } = cda;

  // Tisk: interaktivní inputy/tracky jsou netisknutelné (hodnota v
  // `<input value>`, stav v barvě/výšce). V printMode renderujeme oddělený
  // statický čitelný dokument se stejnými daty.
  if (printMode) return <Drd16PrintView cda={cda} />;

  const strVal = parseInt(g('str_val', '10'), 10) || 10;
  const dexVal = parseInt(g('dex_val', '10'), 10) || 10;
  const conVal = parseInt(g('con_val', '10'), 10) || 10;
  const intVal = parseInt(g('int_val', '10'), 10) || 10;
  const chaVal = parseInt(g('cha_val', '10'), 10) || 10;
  const sizVal = parseInt(g('siz_val', '10'), 10) || 10;
  const movVal = parseInt(g('mov_val', '10'), 10) || 10;

  // Auto-compute bonus pole pro vizualizaci (originál je manuální input)
  const autoBonus: Record<string, number> = {
    str: getDrdBonus(strVal),
    dex: getDrdBonus(dexVal),
    con: getDrdBonus(conVal),
    int: getDrdBonus(intVal),
    cha: getDrdBonus(chaVal),
    siz: getDrdBonus(sizVal),
    mov: getDrdBonus(movVal),
  };

  return (
    <div className="drd16-dashboard">
      {onRoll && <SheetInitiativeButton onRoll={onRoll} kind="d20" />}
      {/* ═══ QUICK PJ BAR ═══ */}
      <div className="drd16-quick-pj-bar">
        <div className="quick-stat health">
          <span className="qs-label">HP</span>
          <span className="qs-value">
            {g('hp_current', '0')} / {g('hp_max', '0')}
          </span>
        </div>
        <div className="quick-stat mana">
          <span className="qs-label">Mana</span>
          <span className="qs-value">
            {g('mana_current', '0')} / {g('mana_max', '0')}
          </span>
        </div>
        <div className="quick-stat defense">
          <span className="qs-label">Obrana</span>
          <span className="qs-value">{g('defense', '0')}</span>
        </div>
      </div>

      {/* ═══ MAIN GRID 3 sloupce ═══ */}
      <div className="drd16-grid">
        {/* LEVÝ SLOUPEC: Identita + Atributy */}
        <div className="drd16-panel">
          <h3 className="panel-title">Identita</h3>
          <div className="identity-card">
            <input
              className="identity-name"
              value={g('name')}
              disabled={disabled}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Jméno..."
              aria-label="Jméno postavy"
            />
            <input
              value={g('race')}
              disabled={disabled}
              onChange={(e) => set('race', e.target.value)}
              placeholder="Rasa..."
              aria-label="Rasa"
            />
            <select
              value={g('class')}
              disabled={disabled}
              onChange={(e) => set('class', e.target.value)}
              aria-label="Povolání"
            >
              <option value="">— Povolání —</option>
              {DRD16_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              value={g('level')}
              disabled={disabled}
              onChange={(e) => set('level', e.target.value)}
              placeholder="Úroveň..."
              aria-label="Úroveň"
            />
          </div>

          <h3 className="panel-title">Primární vlastnosti</h3>
          <div className="stats-list">
            {DRD16_PRIMARY_STATS.map((s) => (
              <StatRow
                key={s.key}
                label={s.label}
                statKey={s.key}
                autoBonus={autoBonus[s.key]}
                cda={cda}
                disabled={disabled}
              />
            ))}
          </div>

          <h3 className="panel-title">Sekundární vlastnosti</h3>
          <div className="stats-list">
            {DRD16_SECONDARY_STATS.map((s) => (
              <SimpleStatRow
                key={s.key}
                label={s.label}
                statKey={s.key}
                cda={cda}
                disabled={disabled}
              />
            ))}
          </div>

          <h3 className="panel-title">Naložení</h3>
          <div className="stats-list">
            {(
              [
                ['enc_light', 'Lehké'],
                ['enc_med', 'Střední'],
                ['enc_heavy', 'Těžké'],
              ] as const
            ).map(([key, label]) => (
              <SimpleStatRow
                key={key}
                label={label}
                statKey={key}
                cda={cda}
                disabled={disabled}
                wide
              />
            ))}
          </div>
        </div>

        {/* STŘEDNÍ SLOUPEC: Zbraně + Defense */}
        <div className="drd16-panel">
          <h3 className="panel-title">Boj — Zbraně na blízko</h3>
          <MeleeWeaponsTable cda={cda} disabled={disabled} />

          <h3 className="panel-title">Boj — Zbraně střelné</h3>
          <RangedWeaponsTable cda={cda} disabled={disabled} />

          <h3 className="panel-title">Dovednosti DrD</h3>
          <SkillsTable cda={cda} disabled={disabled} />

          <div className="defense-box">
            <span className="def-label">OČ</span>
            <input
              value={g('defense')}
              disabled={disabled}
              onChange={(e) => set('defense', e.target.value)}
              placeholder="0"
              aria-label="Obranné číslo"
            />
          </div>
        </div>

        {/* PRAVÝ SLOUPEC: HP + Mana trackers */}
        <div className="drd16-panel">
          <h3 className="panel-title">Zdroje</h3>
          <div className="resource-trackers">
            <ResourceTracker
              variant="health"
              title="Životy"
              curKey="hp_current"
              maxKey="hp_max"
              cda={cda}
              disabled={disabled}
            />
            <ResourceTracker
              variant="mana"
              title="Mana"
              curKey="mana_current"
              maxKey="mana_max"
              cda={cda}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM ZONE: textareas ═══ */}
      <div className="drd16-bottom-zone">
        <div>
          <h3 className="panel-title">Zvláštní schopnosti</h3>
          <textarea
            value={g('special_abilities')}
            disabled={disabled}
            onChange={(e) => set('special_abilities', e.target.value)}
            placeholder="Zde zapiš class-specific schopnosti (povolání, finty, bojové triky, alchymistické recepty, zlodějské cviky…). Pro plné rozšíření per povolání je v plánu iterace 8.7n+."
            aria-label="Zvláštní schopnosti"
          />
        </div>
        <div>
          <h3 className="panel-title">Kouzla / Spellbook</h3>
          <textarea
            value={g('spells')}
            disabled={disabled}
            onChange={(e) => set('spells', e.target.value)}
            placeholder="Známá kouzla, poznámky o spellbooku, PPZ tabulka, mág projevy…"
            aria-label="Kouzla a spellbook"
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

interface StatRowProps extends SubProps {
  label: string;
  statKey: string;
  autoBonus: number;
}

function StatRow({
  label,
  statKey,
  autoBonus,
  cda,
  disabled,
}: StatRowProps) {
  const { g, set } = cda;
  return (
    <div className="stat-row">
      <p>{label}</p>
      <div className="stat-inputs">
        <input
          value={g(`${statKey}_val`)}
          disabled={disabled}
          onChange={(e) => set(`${statKey}_val`, e.target.value)}
          placeholder="Val"
          aria-label={`${label} hodnota`}
        />
        <input
          className="stat-mod"
          value={g(`${statKey}_mod`, String(autoBonus))}
          disabled={disabled}
          onChange={(e) => set(`${statKey}_mod`, e.target.value)}
          placeholder="Mod"
          aria-label={`${label} bonus`}
        />
      </div>
    </div>
  );
}

interface SimpleStatRowProps extends SubProps {
  label: string;
  statKey: string;
  wide?: boolean;
}

function SimpleStatRow({
  label,
  statKey,
  cda,
  disabled,
  wide,
}: SimpleStatRowProps) {
  const { g, set } = cda;
  return (
    <div className="stat-row">
      <p>{label}</p>
      <div className="stat-inputs">
        <input
          value={g(statKey)}
          disabled={disabled}
          onChange={(e) => set(statKey, e.target.value)}
          style={wide ? { width: 96 } : undefined}
          aria-label={label}
        />
      </div>
    </div>
  );
}

// ── Weapons tables ──────────────────────────────────────────────

function MeleeWeaponsTable({ cda, disabled }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<Drd16Weapon>('meleeWeapons');
  return (
    <>
      <table className="combat-table">
        <thead>
          <tr>
            <th>Zbraň</th>
            <th>Kde</th>
            <th>ÚČ</th>
            <th>Útoč</th>
            <th>Ozvl.</th>
            <th></th>
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
                    className="delete-btn"
                    onClick={() => removeArr('meleeWeapons', i)}
                    aria-label="Smazat melee zbraň"
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
          className="add-weapon-btn"
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
      <table className="combat-table">
        <thead>
          <tr>
            <th>Zbraň</th>
            <th>ÚČ</th>
            <th>Útoč</th>
            <th>Malá</th>
            <th>Stř.</th>
            <th>Velká</th>
            <th></th>
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
                    className="delete-btn"
                    onClick={() => removeArr('rangedWeapons', i)}
                    aria-label="Smazat ranged zbraň"
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
          className="add-weapon-btn"
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
      <table className="combat-table">
        <thead>
          <tr>
            <th>Dovednost</th>
            <th>Stupeň</th>
            <th></th>
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
                    className="delete-btn"
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
          className="add-weapon-btn"
          onClick={() =>
            addArr<Drd16Skill>('drdSkills', { name: '', level: '' })
          }
        >
          + Přidat dovednost
        </button>
      )}
    </>
  );
}

// ── Resource tracker (HP / Mana) ────────────────────────────────

interface ResourceTrackerProps extends SubProps {
  variant: 'health' | 'mana';
  title: string;
  curKey: string;
  maxKey: string;
}

function ResourceTracker({
  variant,
  title,
  curKey,
  maxKey,
  cda,
  disabled,
}: ResourceTrackerProps) {
  const { g, set } = cda;
  const cur = parseInt(g(curKey, '0'), 10) || 0;
  const max = parseInt(g(maxKey, '0'), 10) || 0;
  const pct = max > 0 ? Math.min(100, (cur / max) * 100) : 0;

  const adjust = (delta: number) => {
    if (disabled) return;
    const next = Math.max(0, Math.min(max, cur + delta));
    set(curKey, String(next));
  };

  return (
    <div className={`tracker-column ${variant}`}>
      <div className="tracker-title">{title}</div>
      <div className="tracker-visual">
        <div
          className="tracker-fill"
          style={{ height: `${pct}%` }}
          aria-label={`${title} fill ${pct.toFixed(0)}%`}
        />
      </div>
      <div className="tracker-controls">
        <input
          value={g(curKey, '0')}
          disabled={disabled}
          onChange={(e) => set(curKey, e.target.value)}
          aria-label={`${title} aktuální`}
        />
        <input
          value={g(maxKey, '0')}
          disabled={disabled}
          onChange={(e) => set(maxKey, e.target.value)}
          style={{ fontSize: '0.9rem', opacity: 0.7 }}
          aria-label={`${title} maximum`}
        />
        <div className="controls-row">
          <button
            type="button"
            onClick={() => adjust(-5)}
            disabled={disabled}
            aria-label={`${title} -5`}
          >
            -5
          </button>
          <button
            type="button"
            onClick={() => adjust(-1)}
            disabled={disabled}
            aria-label={`${title} -1`}
          >
            -1
          </button>
          <button
            type="button"
            onClick={() => adjust(1)}
            disabled={disabled}
            aria-label={`${title} +1`}
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => adjust(5)}
            disabled={disabled}
            aria-label={`${title} +5`}
          >
            +5
          </button>
        </div>
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

  // Auto-bonus (stejný výpočet jako interaktivní sheet) — pokud hráč
  // nezadal vlastní `_mod`, ukážeme dopočítaný.
  const primaryBonus = (key: string): string => {
    const val = parseInt(g(`${key}_val`, '10'), 10) || 10;
    return g(`${key}_mod`, String(getDrdBonus(val)));
  };

  const specialAbilities = g('special_abilities').trim();
  const spells = g('spells').trim();

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
          <dd>{g('class') || '—'}</dd>
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
          <dt>Mana</dt>
          <dd>
            {g('mana_current', '0')} / {g('mana_max', '0')}
          </dd>
        </div>
        <div>
          <dt>Obrana (OČ)</dt>
          <dd>{g('defense', '0')}</dd>
        </div>
      </dl>

      <h2>Primární vlastnosti</h2>
      <ul className="matrix-print__plain">
        {DRD16_PRIMARY_STATS.map((s) => (
          <li key={s.key} className="print-row">
            <span>{s.label}</span>
            <span>
              {g(`${s.key}_val`, '—') || '—'} ({primaryBonus(s.key)})
            </span>
          </li>
        ))}
      </ul>

      <h2>Sekundární vlastnosti</h2>
      <ul className="matrix-print__plain">
        {DRD16_SECONDARY_STATS.map((s) => (
          <li key={s.key} className="print-row">
            <span>{s.label}</span>
            <span>{g(s.key) || '—'}</span>
          </li>
        ))}
      </ul>

      <h2>Naložení</h2>
      <dl className="print-cols">
        <div>
          <dt>Lehké</dt>
          <dd>{g('enc_light') || '—'}</dd>
        </div>
        <div>
          <dt>Střední</dt>
          <dd>{g('enc_med') || '—'}</dd>
        </div>
        <div>
          <dt>Těžké</dt>
          <dd>{g('enc_heavy') || '—'}</dd>
        </div>
      </dl>

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
                <th>Ozvl.</th>
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
                <th>Malá</th>
                <th>Stř.</th>
                <th>Velká</th>
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
          <h2>Dovednosti DrD</h2>
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

      {spells && (
        <>
          <h2>Kouzla / Spellbook</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{spells}</p>
        </>
      )}
    </div>
  );
}
