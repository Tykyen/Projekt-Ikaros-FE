/**
 * 8.7e — Dračí Hlídka (DrdH) deník postavy.
 *
 * Adaptováno z `c:/Matrix/Matrix/frontend/src/components/diary/DrdhCharacterSheet.tsx`
 * (459 ř). Save delegujeme parentu; `onSave` prop nemá.
 * Data v `diary.customData` s prefixem `drdh_*` (1:1 vůči legacy).
 *
 * 6 povolání (Válečník, Hraničář, Alchymista, Kouzelník, Zloděj, Klerik),
 * každé má vlastní sekundární zdroj (mega-box vpravo od HP) a vlastní
 * profession-tabulku (vlevo).
 */
import { usePrintMode } from '@/features/world/export/print';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  DRDH_ATTRS,
  DRDH_PROF_TABLE,
  DRDH_PROFESSIONS,
  DRDH_RESOURCE_BY_PROF,
  type DrdhArmor,
  type DrdhProfessionId,
  type DrdhSkill,
  type DrdhWeapon,
} from './constants';
import { SheetInitiativeButton } from '../../_shared/SheetInitiativeButton';

export function DrdhSheet({ diary, mode, onChange, onRoll }: SystemSheetProps) {
  const disabled = mode === 'view';
  const printMode = usePrintMode();
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'drdh_', onChange);
  const { g, set } = cda;

  const prof = (g('profession_id') || 'valecnik') as DrdhProfessionId;

  // Tisk: interaktivní inputy/tabulky jsou netisknutelné (hodnota v
  // `<input value>`). V printMode renderujeme oddělený statický čitelný
  // dokument se stejnými `drdh_*` daty.
  if (printMode) return <DrdhPrintView cda={cda} prof={prof} />;

  return (
    <div className="drdh-dashboard">
      {onRoll && <SheetInitiativeButton onRoll={onRoll} kind="d20" />}
      <div className="drdh-grid-layout">
        {/* ═══ CENTER ZONE ═══ */}
        <div className="center-zone">
          {/* Identita */}
          <div className="drdh-panel">
            <h3>Identita Postavy</h3>
            <div className="form-group">
              <label htmlFor="drdh_name">Jméno</label>
              <input
                id="drdh_name"
                value={g('name')}
                disabled={disabled}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Zadej jméno..."
                style={{ fontSize: 18, fontWeight: 'bold', padding: 12 }}
              />
            </div>
            <div className="flex-row">
              <div className="form-group">
                <label htmlFor="drdh_profession_id">Povolání</label>
                <select
                  id="drdh_profession_id"
                  value={prof}
                  disabled={disabled}
                  onChange={(e) => set('profession_id', e.target.value)}
                >
                  {DRDH_PROFESSIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="drdh_race">Rasa</label>
                <input
                  id="drdh_race"
                  value={g('race')}
                  disabled={disabled}
                  onChange={(e) => set('race', e.target.value)}
                  placeholder="..."
                />
              </div>
            </div>
            <div className="flex-row">
              <div className="form-group">
                <label htmlFor="drdh_lvl">Úroveň</label>
                <input
                  id="drdh_lvl"
                  value={g('lvl')}
                  disabled={disabled}
                  onChange={(e) => set('lvl', e.target.value)}
                  style={{ textAlign: 'center' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="drdh_xp">Zkušenosti</label>
                <input
                  id="drdh_xp"
                  value={g('xp')}
                  disabled={disabled}
                  onChange={(e) => set('xp', e.target.value)}
                  style={{ textAlign: 'center' }}
                />
              </div>
            </div>
            <div className="flex-row">
              <div className="form-group">
                <label htmlFor="drdh_encumbrance">Naložení</label>
                <input
                  id="drdh_encumbrance"
                  value={g('encumbrance')}
                  disabled={disabled}
                  onChange={(e) => set('encumbrance', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="drdh_fatigue">Únava</label>
                <input
                  id="drdh_fatigue"
                  value={g('fatigue')}
                  disabled={disabled}
                  onChange={(e) => set('fatigue', e.target.value)}
                />
              </div>
            </div>
            <div className="flex-row">
              <div className="form-group">
                <label htmlFor="drdh_size">Velikost</label>
                <input
                  id="drdh_size"
                  value={g('size')}
                  disabled={disabled}
                  onChange={(e) => set('size', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="drdh_mobility">Pohyblivost</label>
                <input
                  id="drdh_mobility"
                  value={g('mobility')}
                  disabled={disabled}
                  onChange={(e) => set('mobility', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Atributy + mince */}
          <div className="drdh-panel">
            <h3>Atributy</h3>
            <div className="attrs-box">
              {DRDH_ATTRS.map((a) => (
                <div key={a.id} className="attr-row">
                  <div className="attr-name">{a.label}</div>
                  <div className="attr-vals">
                    <input
                      value={g(`attr_${a.id}`)}
                      disabled={disabled}
                      onChange={(e) => set(`attr_${a.id}`, e.target.value)}
                      placeholder="St."
                      aria-label={`${a.label} stupeň`}
                    />
                    <input
                      className="attr-mod"
                      value={g(`attr_${a.id}_mod`)}
                      disabled={disabled}
                      onChange={(e) =>
                        set(`attr_${a.id}_mod`, e.target.value)
                      }
                      placeholder="Opr."
                      aria-label={`${a.label} oprava`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: 32 }}>Mince</h3>
            <div className="coins-panel">
              <div className="coin z">
                <label htmlFor="drdh_coin_z">Zlaťáky</label>
                <input
                  id="drdh_coin_z"
                  value={g('coin_z')}
                  disabled={disabled}
                  onChange={(e) => set('coin_z', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="coin s">
                <label htmlFor="drdh_coin_s">Stříbrňáky</label>
                <input
                  id="drdh_coin_s"
                  value={g('coin_s')}
                  disabled={disabled}
                  onChange={(e) => set('coin_s', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="coin m">
                <label htmlFor="drdh_coin_m">Měďáky</label>
                <input
                  id="drdh_coin_m"
                  value={g('coin_m')}
                  disabled={disabled}
                  onChange={(e) => set('coin_m', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT ZONE ═══ */}
        <div className="right-zone">
          {/* HP + sekundární zdroj */}
          <div className="combat-header">
            <div className="mega-box health">
              <h4>Životy</h4>
              <div className="hp-row">
                <input
                  className="hp-main"
                  value={g('hp')}
                  disabled={disabled}
                  onChange={(e) => set('hp', e.target.value)}
                  placeholder="0"
                  aria-label="Aktuální životy"
                />
                <span>/</span>
                <input
                  className="hp-max"
                  value={g('hp_max')}
                  disabled={disabled}
                  onChange={(e) => set('hp_max', e.target.value)}
                  placeholder="Max"
                  aria-label="Maximum životů"
                />
              </div>
              <div className="hp-death">
                Hranice smrti{' '}
                <input
                  value={g('hp_death')}
                  disabled={disabled}
                  onChange={(e) => set('hp_death', e.target.value)}
                  placeholder="0"
                  aria-label="Hranice smrti"
                />
              </div>
            </div>

            <SecondaryResource prof={prof} cda={cda} disabled={disabled} />
          </div>

          {/* Souboj + zbraně */}
          <div className="drdh-panel" style={{ padding: 16 }}>
            <h3>Souboj a zbraně</h3>
            <div className="flex-row" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label htmlFor="drdh_combat_melee">Tváří v tvář</label>
                <input
                  id="drdh_combat_melee"
                  value={g('combat_melee')}
                  disabled={disabled}
                  onChange={(e) => set('combat_melee', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="drdh_combat_ranged">Střelba</label>
                <input
                  id="drdh_combat_ranged"
                  value={g('combat_ranged')}
                  disabled={disabled}
                  onChange={(e) => set('combat_ranged', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="drdh_combat_init">Iniciativa</label>
                <input
                  id="drdh_combat_init"
                  value={g('combat_init')}
                  disabled={disabled}
                  onChange={(e) => set('combat_init', e.target.value)}
                />
              </div>
            </div>

            <WeaponsTable cda={cda} disabled={disabled} />

            <h3 style={{ marginTop: 24, fontSize: 11 }}>Zbroj a Štít</h3>
            <ArmorsTable cda={cda} disabled={disabled} />
          </div>

          {/* Dovednosti */}
          <div className="drdh-panel" style={{ padding: 16 }}>
            <h3>Dovednosti</h3>
            <SkillsTable cda={cda} disabled={disabled} />
          </div>
        </div>

        {/* ═══ LEFT ZONE ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <ProfessionTable prof={prof} cda={cda} disabled={disabled} />

          <div className="drdh-panel left-zone" style={{ flex: 1 }}>
            <h3>Poznámky hlídkaře</h3>
            <textarea
              className="notes-area"
              value={g('notes')}
              disabled={disabled}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Rychlé poznámky o misích, stavech, nebo lidech..."
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

function SecondaryResource({
  prof,
  cda,
  disabled,
}: SubProps & { prof: DrdhProfessionId }) {
  const { g, set } = cda;

  // Alchymista má dva (Mana + Suroviny)
  if (prof === 'alchymista') {
    return (
      <div style={{ display: 'flex', gap: 8, flex: 1 }}>
        <div className="mega-box resource" style={{ padding: 8 }}>
          <h4 style={{ fontSize: 10 }}>Mana</h4>
          <div className="res-inputs">
            <input
              className="res-main"
              style={{ fontSize: 24 }}
              value={g('res_mana')}
              disabled={disabled}
              onChange={(e) => set('res_mana', e.target.value)}
              aria-label="Mana aktuální"
            />
            <input
              className="res-max"
              value={g('res_mana_max')}
              disabled={disabled}
              onChange={(e) => set('res_mana_max', e.target.value)}
              aria-label="Mana max"
            />
          </div>
        </div>
        <div
          className="mega-box resource"
          style={{
            padding: 8,
            borderColor: 'rgba(255,150,50,0.3)',
            borderTopColor: '#ff9632',
          }}
        >
          <h4 style={{ fontSize: 10, color: '#ff9632' }}>Suroviny</h4>
          <div className="res-inputs">
            <input
              className="res-main"
              style={{ fontSize: 24, color: '#ff9632' }}
              value={g('res_sur')}
              disabled={disabled}
              onChange={(e) => set('res_sur', e.target.value)}
              aria-label="Suroviny aktuální"
            />
            <input
              className="res-max"
              value={g('res_sur_max')}
              disabled={disabled}
              onChange={(e) => set('res_sur_max', e.target.value)}
              aria-label="Suroviny max"
            />
          </div>
        </div>
      </div>
    );
  }

  const cfg = DRDH_RESOURCE_BY_PROF[prof];
  if (!cfg) return null;
  return (
    <div className="mega-box resource">
      <h4>{cfg.title}</h4>
      <div className="res-inputs">
        <input
          className="res-main"
          value={g(cfg.valueKey)}
          disabled={disabled}
          onChange={(e) => set(cfg.valueKey, e.target.value)}
          placeholder="0"
          aria-label={`${cfg.title} aktuální`}
        />
        <input
          className="res-max"
          value={g(cfg.maxKey)}
          disabled={disabled}
          onChange={(e) => set(cfg.maxKey, e.target.value)}
          placeholder="Max"
          aria-label={`${cfg.title} max`}
        />
      </div>
      <div className="res-sub">
        <input
          value={g(cfg.noteKey)}
          disabled={disabled}
          onChange={(e) => set(cfg.noteKey, e.target.value)}
          placeholder={cfg.notePlaceholder}
          aria-label={`${cfg.title} poznámka`}
        />
      </div>
    </div>
  );
}

// ── Weapons / Armors / Skills (tabulky) ────────────────────────

function WeaponsTable({ cda, disabled }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<DrdhWeapon>('weapons');
  return (
    <div className="drdh-table">
      <table>
        <thead>
          <tr>
            <th>Zbraň</th>
            <th className="td-slim">Útoč</th>
            <th className="td-slim">Zran</th>
            <th className="td-slim">Obrana</th>
            <th className="td-slim">ÚČ</th>
            <th className="td-slim">OČ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {(['name', 'atk', 'dmg', 'def', 'uc', 'oc'] as const).map(
                (field) => (
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
                ),
              )}
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="del-btn"
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
              atk: '',
              dmg: '',
              def: '',
              uc: '',
              oc: '',
            })
          }
        >
          + Přidat Zbraň
        </button>
      )}
    </div>
  );
}

function ArmorsTable({ cda, disabled }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<DrdhArmor>('armors');
  return (
    <div className="drdh-table">
      <table>
        <thead>
          <tr>
            <th>Zbroj / Štít</th>
            <th>Kvalita</th>
            <th>Základ obrany</th>
            <th className="td-mid">Pozn</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {(['name', 'quality', 'def', 'note'] as const).map((field) => (
                <td key={field}>
                  <input
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
                    className="del-btn"
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
              def: '',
              note: '',
            })
          }
        >
          + Přidat Zbroj
        </button>
      )}
    </div>
  );
}

function SkillsTable({ cda, disabled }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<DrdhSkill>('skills');
  return (
    <div className="drdh-table">
      <table>
        <thead>
          <tr>
            <th>Název dovednosti</th>
            <th className="td-slim">Stupeň</th>
            <th className="td-slim">Součet</th>
            <th className="td-slim">Body</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {(['name', 'lvl', 'sum', 'pts'] as const).map((field) => (
                <td key={field}>
                  <input
                    value={row[field] || ''}
                    disabled={disabled}
                    onChange={(e) =>
                      updateArr<DrdhSkill>('skills', i, {
                        [field]: e.target.value,
                      } as Partial<DrdhSkill>)
                    }
                    aria-label={`Dovednost ${i + 1} — ${field}`}
                  />
                </td>
              ))}
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="del-btn"
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
            addArr<DrdhSkill>('skills', {
              name: '',
              lvl: '',
              sum: '',
              pts: '',
            })
          }
        >
          + Přidat Dovednost
        </button>
      )}
    </div>
  );
}

// ── Profession-specific table (left zone) ──────────────────────

function ProfessionTable({
  prof,
  cda,
  disabled,
}: SubProps & { prof: DrdhProfessionId }) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const def = DRDH_PROF_TABLE[prof];
  if (!def) return null;

  const rows = parseJsonArr<Record<string, string>>(def.arrKey);
  // Template = pole klíčů sloupců, vše prázdné string
  const template: Record<string, string> = def.cols.reduce(
    (acc, c) => ({ ...acc, [c.key]: '' }),
    {},
  );

  return (
    <div className="drdh-panel left-zone">
      <h3>{def.title}</h3>
      <div className="drdh-table">
        <table>
          <thead>
            <tr>
              {def.cols.map((c) => (
                <th
                  key={c.key}
                  className={c.width === 'td-slim' ? 'td-slim' : c.width === 'td-mid' ? 'td-mid' : undefined}
                >
                  {c.header}
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {def.cols.map((c) => (
                  <td
                    key={c.key}
                    className={c.width === 'td-slim' ? 'td-slim' : c.width === 'td-mid' ? 'td-mid' : undefined}
                  >
                    <input
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
                      className="del-btn"
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
      </div>
    </div>
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
  const { g } = cda;
  const profLabel =
    DRDH_PROFESSIONS.find((p) => p.id === prof)?.label || prof;

  const weapons = cda.parseJsonArr<DrdhWeapon>('weapons');
  const armors = cda.parseJsonArr<DrdhArmor>('armors');
  const skills = cda.parseJsonArr<DrdhSkill>('skills');

  // Sekundární zdroj per povolání (alchymista má dva).
  const resourceLines: { label: string; value: string }[] = [];
  if (prof === 'alchymista') {
    resourceLines.push({
      label: 'Mana',
      value: `${g('res_mana', '0')} / ${g('res_mana_max', '0')}`,
    });
    resourceLines.push({
      label: 'Suroviny',
      value: `${g('res_sur', '0')} / ${g('res_sur_max', '0')}`,
    });
  } else {
    const cfg = DRDH_RESOURCE_BY_PROF[prof];
    if (cfg) {
      const note = g(cfg.noteKey).trim();
      resourceLines.push({
        label: cfg.title,
        value:
          `${g(cfg.valueKey, '0')} / ${g(cfg.maxKey, '0')}` +
          (note ? ` — ${note}` : ''),
      });
    }
  }

  // Profession-specific tabulka.
  const profTable = DRDH_PROF_TABLE[prof];
  const profRows = profTable
    ? cda.parseJsonArr<Record<string, string>>(profTable.arrKey)
    : [];

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
          <dd>{profLabel}</dd>
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
          <dt>Naložení</dt>
          <dd>{g('encumbrance') || '—'}</dd>
        </div>
        <div>
          <dt>Únava</dt>
          <dd>{g('fatigue') || '—'}</dd>
        </div>
        <div>
          <dt>Velikost</dt>
          <dd>{g('size') || '—'}</dd>
        </div>
        <div>
          <dt>Pohyblivost</dt>
          <dd>{g('mobility') || '—'}</dd>
        </div>
      </dl>

      <h2>Atributy</h2>
      <ul className="matrix-print__plain">
        {DRDH_ATTRS.map((a) => (
          <li key={a.id} className="print-row">
            <span>{a.label}</span>
            <span>
              {g(`attr_${a.id}`) || '—'} ({g(`attr_${a.id}_mod`) || '—'})
            </span>
          </li>
        ))}
      </ul>

      <h2>Mince</h2>
      <dl className="print-cols">
        <div>
          <dt>Zlaťáky</dt>
          <dd>{g('coin_z', '0')}</dd>
        </div>
        <div>
          <dt>Stříbrňáky</dt>
          <dd>{g('coin_s', '0')}</dd>
        </div>
        <div>
          <dt>Měďáky</dt>
          <dd>{g('coin_m', '0')}</dd>
        </div>
      </dl>

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
          <dd>{g('hp_death', '0')}</dd>
        </div>
        {resourceLines.map((r) => (
          <div key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
        <div>
          <dt>Tváří v tvář</dt>
          <dd>{g('combat_melee') || '—'}</dd>
        </div>
        <div>
          <dt>Střelba</dt>
          <dd>{g('combat_ranged') || '—'}</dd>
        </div>
        <div>
          <dt>Iniciativa</dt>
          <dd>{g('combat_init') || '—'}</dd>
        </div>
      </dl>

      {weapons.length > 0 && (
        <>
          <h2>Zbraně</h2>
          <table>
            <thead>
              <tr>
                <th>Zbraň</th>
                <th>Útoč</th>
                <th>Zran</th>
                <th>Obrana</th>
                <th>ÚČ</th>
                <th>OČ</th>
              </tr>
            </thead>
            <tbody>
              {weapons.map((w, i) => (
                <tr key={i}>
                  <td>{w.name || '—'}</td>
                  <td>{w.atk || '—'}</td>
                  <td>{w.dmg || '—'}</td>
                  <td>{w.def || '—'}</td>
                  <td>{w.uc || '—'}</td>
                  <td>{w.oc || '—'}</td>
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
                <th>Zbroj / Štít</th>
                <th>Kvalita</th>
                <th>Základ obrany</th>
                <th>Pozn.</th>
              </tr>
            </thead>
            <tbody>
              {armors.map((a, i) => (
                <tr key={i}>
                  <td>{a.name || '—'}</td>
                  <td>{a.quality || '—'}</td>
                  <td>{a.def || '—'}</td>
                  <td>{a.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {skills.length > 0 && (
        <>
          <h2>Dovednosti</h2>
          <table>
            <thead>
              <tr>
                <th>Název dovednosti</th>
                <th>Stupeň</th>
                <th>Součet</th>
                <th>Body</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((s, i) => (
                <tr key={i}>
                  <td>{s.name || '—'}</td>
                  <td>{s.lvl || '—'}</td>
                  <td>{s.sum || '—'}</td>
                  <td>{s.pts || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {profTable && profRows.length > 0 && (
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

      {notes && (
        <>
          <h2>Poznámky hlídkaře</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{notes}</p>
        </>
      )}
    </div>
  );
}
