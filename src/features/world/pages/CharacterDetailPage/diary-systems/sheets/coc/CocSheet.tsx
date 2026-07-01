/**
 * 8.7t — Call of Cthulhu 7e deník vyšetřovatele (redesign).
 *
 * „Důvěrný spis · Miskatonická univerzita · 20. léta" — art deco dossier +
 * pergamen + kosmický dread. Nahrazuje legacy 8.7c layout (plochý formulář).
 *
 * Kontrakt:
 *   - Data v `diary.customData`, prefix `coc_*` (1:1 se starými postavami —
 *     žádná migrace; nová investigation pole jsou aditivní).
 *   - `view` mód disabluje inputy + skryje add/del.
 *   - Žádné hody v deníku (uživatel 8.7t): iniciativa i skill roll patří na
 *     taktickou mapu a do chatu, ne sem. `onRoll` se proto nepoužívá.
 *   - Tisk: statický čitelný dokument (interaktivní inputy nejsou tisknutelné).
 */
import type { ReactNode } from 'react';
import { usePrintMode } from '@/features/world/export/print';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  COC_CHARS,
  COC_META_FIELDS,
  COC_MONEY_FIELDS,
  COC_STATUS_FLAGS,
  COC_SUMMARY_FIELDS,
  DEFAULT_SKILLS,
  type CocCustomSkill,
  type CocNoteField,
  type CocWeapon,
} from './constants';

/* ── ikony sekcí / poznámek (viewBox 0 0 24 24) ─────────────────── */
const G = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {children}
  </svg>
);
const SECTION_ICON: Record<string, ReactNode> = {
  chars: G(
    <>
      <path d="M12 3 L21 12 L12 21 L3 12 Z" />
      <circle cx="12" cy="12" r="3" />
    </>,
  ),
  vitals: G(
    <path d="M12 21 C6 16 3 12 3 8 A4 4 0 0 1 12 6 A4 4 0 0 1 21 8 C21 12 18 16 12 21Z" />,
  ),
  skills: G(
    <>
      <path d="M4 4 h13 l3 3 v13 h-16 Z" />
      <path d="M7 9 h9 M7 12 h9 M7 15 h6" />
    </>,
  ),
  combat: G(
    <>
      <path d="M12 2 v14 M9 16 h6 M12 16 v6 M7 22 h10" />
      <path d="M12 2 L15 6 M12 2 L9 6" />
    </>,
  ),
  summary: G(
    <>
      <path d="M6 3 h9 l3 3 v15 h-12 Z" />
      <path d="M9 8 h6 M9 12 h6 M9 16 h4" />
    </>,
  ),
  gear: G(
    <>
      <path d="M4 8 h16 v12 h-16Z" />
      <path d="M9 8 V5 h6 v3" />
    </>,
  ),
};
const NOTE_ICON: Record<string, ReactNode> = {
  appearance: G(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21 C4 16 8 14 12 14 C16 14 20 16 20 21" />
    </>,
  ),
  traits: G(<path d="M12 3 v18 M6 7 h12 M6 17 h12" />),
  ideology: G(
    <>
      <path d="M12 4 L20 20 H4 Z" />
      <path d="M12 10 v5 M12 17 v.5" />
    </>,
  ),
  important_people: G(
    <>
      <circle cx="8" cy="9" r="3" />
      <circle cx="16" cy="9" r="3" />
      <path d="M3 20 C3 15 13 15 13 20 M11 20 C11 15 21 15 21 20" />
    </>,
  ),
  phobias_manias: G(
    <>
      <path d="M12 3 C7 8 5 11 5 15 A7 7 0 0 0 19 15 C19 11 17 8 12 3Z" />
      <circle cx="12" cy="14" r="2" />
    </>,
  ),
  injuries_scars: G(
    <>
      <path d="M4 12 C7 8 17 8 20 12 C17 16 7 16 4 12Z" />
      <path d="M9 12 h6" />
    </>,
  ),
  forbidden_lore: G(
    <>
      <path d="M5 4 h11 l3 3 v13 h-14Z" />
      <path d="M9 4 v16" />
      <path d="M12 9 c2 0 2 3 0 3 c-2 0 -2 3 0 3" />
    </>,
  ),
  significant_places: G(<path d="M3 20 L9 4 L15 14 L18 8 L21 20Z" />),
  treasured_possessions: G(
    <>
      <rect x="5" y="4" width="14" height="16" />
      <path d="M9 8 h6 M9 12 h6" />
    </>,
  ),
  encounters: G(
    <>
      <path d="M12 3 C9 7 5 8 5 13 C5 18 9 21 12 21 C15 21 19 18 19 13 C19 8 15 7 12 3Z" />
      <circle cx="9.5" cy="12" r="1.2" />
      <circle cx="14.5" cy="12" r="1.2" />
    </>,
  ),
};

function SectionDivider({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="coc-divider">
      <span className="coc-divider-glyph">{SECTION_ICON[icon]}</span>
      <h2>{title}</h2>
    </div>
  );
}

export function CocSheet({ diary, mode, onChange }: SystemSheetProps) {
  const disabled = mode === 'view';
  const printMode = usePrintMode();
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'coc_', onChange);
  const { g, bool, set, parseJsonArr, updateArr, addArr, removeArr } = cda;

  if (printMode) return <CocPrintView cda={cda} />;

  return (
    <div className="coc-sheet">
      {/* ═══ SPISOVÁ PÁSKA ═══ */}
      <div className="coc-filestrip">
        <span>Deník vyšetřovatele · 20. léta</span>
        <span className="coc-dossier">Miskatonic · Důvěrné</span>
      </div>

      {/* ═══ HERO ═══ */}
      <div className="coc-hero">
        <div className="coc-portrait">
          <span>Portrét</span>
        </div>
        <div className="coc-identity">
          <input
            className="coc-name"
            value={g('name')}
            disabled={disabled}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Jméno vyšetřovatele"
            aria-label="Jméno"
          />
          <input
            className="coc-occ"
            value={g('occupation')}
            disabled={disabled}
            onChange={(e) => set('occupation', e.target.value)}
            placeholder="Povolání"
            aria-label="Povolání"
          />
          <div className="coc-meta">
            {COC_META_FIELDS.map((f) => (
              <div key={f.key} className="coc-meta-field">
                <label htmlFor={`coc-${f.key}`}>{f.label}</label>
                <input
                  id={`coc-${f.key}`}
                  value={g(f.key)}
                  disabled={disabled}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="coc-stamp" aria-hidden="true">
          Miskatonic
          <b>Důvěrné</b>
          Univ. archiv
        </div>
      </div>

      {/* ═══ VLASTNOSTI ═══ */}
      <SectionDivider icon="chars" title="Vlastnosti" />
      <div className="coc-section">
        <div className="coc-chars">
          {COC_CHARS.map((c) => (
            <div key={c.key} className="coc-char">
              <div className="coc-char-label">{c.label}</div>
              <input
                className="coc-char-main"
                value={g(`${c.key}_reg`)}
                disabled={disabled}
                onChange={(e) => set(`${c.key}_reg`, e.target.value)}
                aria-label={`${c.label} základní`}
              />
              <div className="coc-char-sub">
                <div>
                  <input
                    value={g(`${c.key}_half`)}
                    disabled={disabled}
                    onChange={(e) => set(`${c.key}_half`, e.target.value)}
                    aria-label={`${c.label} polovina`}
                  />
                  <span>Pol.</span>
                </div>
                <div>
                  <input
                    value={g(`${c.key}_fifth`)}
                    disabled={disabled}
                    onChange={(e) => set(`${c.key}_fifth`, e.target.value)}
                    aria-label={`${c.label} pětina`}
                  />
                  <span>Pět.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="coc-derived">
          <div className="coc-char is-derived">
            <div className="coc-char-label">Nápad · INT×5</div>
            <input
              className="coc-char-main"
              value={g('idea')}
              disabled={disabled}
              onChange={(e) => set('idea', e.target.value)}
              aria-label="Nápad"
            />
          </div>
          <div className="coc-char is-derived">
            <div className="coc-char-label">Znalosti · VZD×5</div>
            <input
              className="coc-char-main"
              value={g('know')}
              disabled={disabled}
              onChange={(e) => set('know', e.target.value)}
              aria-label="Znalosti"
            />
          </div>
        </div>
      </div>

      {/* ═══ STAV ═══ */}
      <SectionDivider icon="vitals" title="Stav" />
      <div className="coc-section">
        <div className="coc-vitals">
          <VitalBox
            variant="danger"
            label="Životy"
            curKey="hp_cur"
            maxKey="hp_max"
            maxLabel="Max"
            g={g}
            set={set}
            disabled={disabled}
          />
          <VitalBox
            variant="mp"
            label="Body magie"
            curKey="mp_cur"
            maxKey="mp_max"
            maxLabel="Max"
            g={g}
            set={set}
            disabled={disabled}
          />
          <VitalBox
            variant="luck"
            label="Štěstí"
            curKey="luck_cur"
            maxKey="luck_start"
            maxLabel="Počáteční"
            g={g}
            set={set}
            disabled={disabled}
          />
          <VitalBox
            variant="sanity"
            label="Příčetnost"
            curKey="san_cur"
            maxKey="san_start"
            maxLabel="Počáteční"
            g={g}
            set={set}
            disabled={disabled}
          />
        </div>
        <div className="coc-seals">
          {COC_STATUS_FLAGS.map((flag) => {
            const k = flag.key.replace(/^coc_/, '');
            return (
              <label key={flag.key} className="coc-seal">
                <input
                  type="checkbox"
                  checked={bool(k)}
                  disabled={disabled}
                  onChange={(e) => set(k, e.target.checked)}
                />
                <span className="coc-seal-dot" />
                {flag.label}
              </label>
            );
          })}
        </div>
      </div>

      {/* ═══ DOVEDNOSTI ═══ */}
      <SectionDivider icon="skills" title="Dovednosti" />
      <div className="coc-section">
        <div className="coc-skills">
          {DEFAULT_SKILLS.map((skill) => (
            <div
              key={skill.key}
              className={`coc-skill${skill.key === 'cthulhu_mythos' ? ' is-mythos' : ''}`}
            >
              <input
                type="checkbox"
                className="coc-skill-chk"
                checked={bool(`sk_${skill.key}_chk`)}
                disabled={disabled}
                onChange={(e) => set(`sk_${skill.key}_chk`, e.target.checked)}
                title="Označit jako vylepšenou (zkušenost)"
                aria-label={`${skill.name} vylepšená`}
              />
              <span className="coc-skill-name" title={`Základ: ${skill.base}`}>
                {skill.name} <b>({skill.base})</b>
              </span>
              <div className="coc-skill-vals">
                <input
                  className="reg"
                  value={g(`sk_${skill.key}_reg`)}
                  disabled={disabled}
                  onChange={(e) => set(`sk_${skill.key}_reg`, e.target.value)}
                  aria-label={`${skill.name} základní hodnota`}
                />
                <input
                  value={g(`sk_${skill.key}_half`)}
                  disabled={disabled}
                  onChange={(e) => set(`sk_${skill.key}_half`, e.target.value)}
                  aria-label={`${skill.name} polovina`}
                />
                <input
                  value={g(`sk_${skill.key}_fifth`)}
                  disabled={disabled}
                  onChange={(e) => set(`sk_${skill.key}_fifth`, e.target.value)}
                  aria-label={`${skill.name} pětina`}
                />
              </div>
            </div>
          ))}

          {/* vlastní dovednosti */}
          {parseJsonArr<CocCustomSkill>('custom_skills').map((row, i) => (
            <div key={`cs-${i}`} className="coc-skill is-custom">
              <input
                type="checkbox"
                className="coc-skill-chk"
                checked={row.chk === 'true'}
                disabled={disabled}
                onChange={(e) =>
                  updateArr<CocCustomSkill>('custom_skills', i, {
                    chk: String(e.target.checked),
                  })
                }
                aria-label="Vlastní dovednost vylepšená"
              />
              <input
                className="coc-skill-name coc-skill-name-input"
                value={row.name || ''}
                disabled={disabled}
                onChange={(e) =>
                  updateArr<CocCustomSkill>('custom_skills', i, {
                    name: e.target.value,
                  })
                }
                placeholder="Název dovednosti"
                aria-label="Název vlastní dovednosti"
              />
              <div className="coc-skill-vals">
                <input
                  className="reg"
                  value={row.reg || ''}
                  disabled={disabled}
                  onChange={(e) =>
                    updateArr<CocCustomSkill>('custom_skills', i, {
                      reg: e.target.value,
                    })
                  }
                  aria-label="Základní hodnota"
                />
                <input
                  value={row.half || ''}
                  disabled={disabled}
                  onChange={(e) =>
                    updateArr<CocCustomSkill>('custom_skills', i, {
                      half: e.target.value,
                    })
                  }
                  aria-label="Polovina"
                />
                <input
                  value={row.fifth || ''}
                  disabled={disabled}
                  onChange={(e) =>
                    updateArr<CocCustomSkill>('custom_skills', i, {
                      fifth: e.target.value,
                    })
                  }
                  aria-label="Pětina"
                />
              </div>
              {!disabled && (
                <button
                  type="button"
                  className="coc-del"
                  onClick={() => removeArr('custom_skills', i)}
                  aria-label="Smazat dovednost"
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
            className="coc-add"
            onClick={() =>
              addArr<CocCustomSkill>('custom_skills', {
                name: '',
                reg: '',
                half: '',
                fifth: '',
                chk: 'false',
              })
            }
          >
            + Přidat dovednost
          </button>
        )}
      </div>

      {/* ═══ BOJ ═══ */}
      <SectionDivider icon="combat" title="Boj" />
      <div className="coc-section coc-combat">
        <table>
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Zbraň</th>
              <th>Dovednost</th>
              <th>Zranění</th>
              <th>Útoků</th>
              <th>Dostřel</th>
              <th>Munice</th>
              <th>Selhání</th>
              <th style={{ width: 28 }}></th>
            </tr>
          </thead>
          <tbody>
            {/* default Rvačka (coc_wpn0_*) */}
            <tr>
              {(
                [
                  ['name', 'Rvačka'],
                  ['skill', ''],
                  ['dmg', '1K3 + BZ'],
                  ['attacks', '1'],
                  ['range', '–'],
                  ['ammo', '–'],
                  ['malf', '–'],
                ] as const
              ).map(([field, fallback]) => (
                <td key={field}>
                  <input
                    value={g(`wpn0_${field}`) || fallback}
                    disabled={disabled}
                    onChange={(e) => set(`wpn0_${field}`, e.target.value)}
                    aria-label={`Rvačka — ${field}`}
                  />
                </td>
              ))}
              <td></td>
            </tr>
            {parseJsonArr<CocWeapon>('weapons').map((row, i) => (
              <tr key={i}>
                {(
                  [
                    'name',
                    'skill',
                    'dmg',
                    'attacks',
                    'range',
                    'ammo',
                    'malf',
                  ] as const
                ).map((field) => (
                  <td key={field}>
                    <input
                      value={row[field] || ''}
                      disabled={disabled}
                      onChange={(e) =>
                        updateArr<CocWeapon>('weapons', i, {
                          [field]: e.target.value,
                        } as Partial<CocWeapon>)
                      }
                      aria-label={`Zbraň ${i + 1} — ${field}`}
                    />
                  </td>
                ))}
                <td>
                  {!disabled && (
                    <button
                      type="button"
                      className="coc-del"
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
            className="coc-add"
            onClick={() =>
              addArr<CocWeapon>('weapons', {
                name: '',
                skill: '',
                dmg: '',
                attacks: '1',
                range: '',
                ammo: '',
                malf: '',
              })
            }
          >
            + Přidat zbraň
          </button>
        )}

        <div className="coc-combat-derived">
          <div className="coc-cd-item">
            <span>Pohyb</span>
            <input
              value={g('move')}
              disabled={disabled}
              onChange={(e) => set('move', e.target.value)}
              aria-label="Pohyb"
            />
          </div>
          <div className="coc-cd-item">
            <span>Stavba</span>
            <input
              value={g('build')}
              disabled={disabled}
              onChange={(e) => set('build', e.target.value)}
              aria-label="Stavba"
            />
          </div>
          <div className="coc-cd-item">
            <span>Bonus zranění</span>
            <input
              value={g('damage_bonus')}
              disabled={disabled}
              onChange={(e) => set('damage_bonus', e.target.value)}
              aria-label="Bonus ke zranění"
            />
          </div>
          <div className="coc-cd-item">
            <span>Úhyb</span>
            <div className="coc-cd-triple">
              <input
                value={g('dodge_reg')}
                disabled={disabled}
                onChange={(e) => set('dodge_reg', e.target.value)}
                aria-label="Úhyb základní"
              />
              <input
                value={g('dodge_half')}
                disabled={disabled}
                onChange={(e) => set('dodge_half', e.target.value)}
                aria-label="Úhyb polovina"
              />
              <input
                value={g('dodge_fifth')}
                disabled={disabled}
                onChange={(e) => set('dodge_fifth', e.target.value)}
                aria-label="Úhyb pětina"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SOUHRN POSTAVY ═══ */}
      <SectionDivider icon="summary" title="Souhrn postavy" />
      <div className="coc-section">
        <div className="coc-summary">
          {COC_SUMMARY_FIELDS.map((f) => (
            <NoteField
              key={f.key}
              field={f}
              value={g(f.key)}
              disabled={disabled}
              onChange={(v) => set(f.key, v)}
            />
          ))}
        </div>
      </div>

      {/* ═══ VYBAVENÍ & MAJETEK ═══ */}
      <SectionDivider icon="gear" title="Vybavení & majetek" />
      <div className="coc-section">
        <div className="coc-gear">
          <div className="coc-note">
            <div className="coc-note-title">Vybavení & osobní věci</div>
            <textarea
              className="coc-note-area is-tall"
              value={g('gear')}
              disabled={disabled}
              onChange={(e) => set('gear', e.target.value)}
              aria-label="Vybavení a osobní věci"
            />
          </div>
          <div className="coc-note coc-money">
            <div className="coc-note-title">Hotovost & majetek</div>
            {COC_MONEY_FIELDS.map((f) => (
              <div key={f.key} className="coc-money-row">
                <label htmlFor={`coc-money-${f.key}`}>{f.label}</label>
                <input
                  id={`coc-money-${f.key}`}
                  value={g(f.key)}
                  disabled={disabled}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Vital box (Životy / Body magie / Štěstí / Příčetnost) ──────── */

interface VitalBoxProps {
  variant: 'danger' | 'sanity' | 'mp' | 'luck';
  label: string;
  curKey: string;
  maxKey: string;
  maxLabel: string;
  g: CdAccess['g'];
  set: CdAccess['set'];
  disabled: boolean;
}

function VitalBox({
  variant,
  label,
  curKey,
  maxKey,
  maxLabel,
  g,
  set,
  disabled,
}: VitalBoxProps) {
  const cur = parseFloat(g(curKey));
  const max = parseFloat(g(maxKey));
  const pct =
    Number.isFinite(cur) && Number.isFinite(max) && max > 0
      ? Math.max(0, Math.min(100, (cur / max) * 100))
      : 0;
  return (
    <div className={`coc-vital is-${variant}`}>
      <div className="coc-vital-label">{label}</div>
      <div className="coc-vital-nums">
        <input
          className="cur"
          value={g(curKey)}
          disabled={disabled}
          onChange={(e) => set(curKey, e.target.value)}
          aria-label={`${label} aktuální`}
        />
        <span className="slash">/</span>
        <input
          className="max"
          value={g(maxKey)}
          disabled={disabled}
          onChange={(e) => set(maxKey, e.target.value)}
          aria-label={`${label} ${maxLabel.toLowerCase()}`}
        />
      </div>
      <div className="coc-vital-sub">
        Aktuální / {maxLabel}
      </div>
      <div className="coc-vital-track">
        <i style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── Poznámkové pole souhrnu ────────────────────────────────────── */

interface NoteFieldProps {
  field: CocNoteField;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

function NoteField({ field, value, disabled, onChange }: NoteFieldProps) {
  const cls = [
    'coc-note',
    field.wide ? 'is-wide' : '',
    field.forbidden ? 'is-forbidden' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      <div className="coc-note-title">
        {NOTE_ICON[field.key]}
        {field.label}
      </div>
      <textarea
        className="coc-note-area"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={field.label}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
 * PRINT — statický čitelný dokument (čte stejná `coc_*` data)
 * ════════════════════════════════════════════════════════════════ */

function charLine(cda: CdAccess, key: string): string {
  const reg = cda.g(`${key}_reg`).trim();
  const half = cda.g(`${key}_half`).trim();
  const fifth = cda.g(`${key}_fifth`).trim();
  if (!reg && !half && !fifth) return '—';
  return `${reg || '—'} / ${half || '—'} / ${fifth || '—'}`;
}

function CocPrintView({ cda }: { cda: CdAccess }) {
  const { g, bool, parseJsonArr } = cda;

  const customSkills = parseJsonArr<CocCustomSkill>('custom_skills');
  const weapons = parseJsonArr<CocWeapon>('weapons');
  const activeFlags = COC_STATUS_FLAGS.filter((f) =>
    bool(f.key.replace(/^coc_/, '')),
  );
  const summary = COC_SUMMARY_FIELDS.map((f) => ({
    label: f.label,
    val: g(f.key).trim(),
  })).filter((r) => r.val);
  const money = COC_MONEY_FIELDS.map((f) => ({
    label: f.label,
    val: g(f.key).trim(),
  })).filter((r) => r.val);
  const gear = g('gear').trim();

  return (
    <div className="coc-print">
      <h2>{g('name') || 'Vyšetřovatel'} — 20. léta</h2>

      {/* Identita */}
      <dl>
        <div>
          <dt>Povolání</dt>
          <dd>{g('occupation') || '—'}</dd>
        </div>
        {COC_META_FIELDS.map((f) => (
          <div key={f.key}>
            <dt>{f.label}</dt>
            <dd>{g(f.key) || '—'}</dd>
          </div>
        ))}
      </dl>

      {/* Vlastnosti */}
      <h3>Vlastnosti</h3>
      <ul className="matrix-print__plain">
        {COC_CHARS.map((c) => (
          <li key={c.key} className="print-row">
            <span>{c.label}</span>
            <span>{charLine(cda, c.key)}</span>
          </li>
        ))}
        <li className="print-row">
          <span>Nápad (INT×5)</span>
          <span>{g('idea') || '—'}</span>
        </li>
        <li className="print-row">
          <span>Znalosti (VZD×5)</span>
          <span>{g('know') || '—'}</span>
        </li>
      </ul>

      {/* Stav */}
      <h3>Stav</h3>
      <ul className="matrix-print__plain">
        <li className="print-row">
          <span>Životy (akt. / max.)</span>
          <span>
            {g('hp_cur') || '—'} / {g('hp_max') || '—'}
          </span>
        </li>
        <li className="print-row">
          <span>Body magie (akt. / max.)</span>
          <span>
            {g('mp_cur') || '—'} / {g('mp_max') || '—'}
          </span>
        </li>
        <li className="print-row">
          <span>Štěstí (akt. / poč.)</span>
          <span>
            {g('luck_cur') || '—'} / {g('luck_start') || '—'}
          </span>
        </li>
        <li className="print-row">
          <span>Příčetnost (akt. / poč.)</span>
          <span>
            {g('san_cur') || '—'} / {g('san_start') || '—'}
          </span>
        </li>
      </ul>

      {activeFlags.length > 0 && (
        <>
          <h3>Stavové příznaky</h3>
          <ul className="matrix-print__plain">
            {activeFlags.map((f) => (
              <li key={f.key} className="print-row">
                <span>{f.label}</span>
                <span>(ano)</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Dovednosti */}
      <h3>Dovednosti</h3>
      <ul className="matrix-print__plain">
        {DEFAULT_SKILLS.map((sk) => {
          const reg = g(`sk_${sk.key}_reg`).trim();
          const half = g(`sk_${sk.key}_half`).trim();
          const fifth = g(`sk_${sk.key}_fifth`).trim();
          const improved = bool(`sk_${sk.key}_chk`);
          const val =
            reg || half || fifth
              ? `${reg || '—'} / ${half || '—'} / ${fifth || '—'}`
              : sk.base;
          return (
            <li key={sk.key} className="print-row">
              <span>
                {improved ? '(vylepšená) ' : ''}
                {sk.name}
              </span>
              <span>{val}</span>
            </li>
          );
        })}
      </ul>

      {customSkills.length > 0 && (
        <>
          <h3>Další dovednosti</h3>
          <ul className="matrix-print__plain">
            {customSkills.map((row, i) => {
              const improved = row.chk === 'true';
              const reg = (row.reg || '').trim();
              const half = (row.half || '').trim();
              const fifth = (row.fifth || '').trim();
              return (
                <li key={i} className="print-row">
                  <span>
                    {improved ? '(vylepšená) ' : ''}
                    {row.name || '—'}
                  </span>
                  <span>
                    {reg || half || fifth
                      ? `${reg || '—'} / ${half || '—'} / ${fifth || '—'}`
                      : '—'}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Boj */}
      <h3>Boj</h3>
      <table>
        <thead>
          <tr>
            <th>Zbraň</th>
            <th>Dovednost</th>
            <th>Zranění</th>
            <th>Útoků</th>
            <th>Dostřel</th>
            <th>Munice</th>
            <th>Selhání</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{g('wpn0_name') || 'Rvačka'}</td>
            <td>{g('wpn0_skill') || '—'}</td>
            <td>{g('wpn0_dmg') || '1K3 + BZ'}</td>
            <td>{g('wpn0_attacks') || '1'}</td>
            <td>{g('wpn0_range') || '–'}</td>
            <td>{g('wpn0_ammo') || '–'}</td>
            <td>{g('wpn0_malf') || '–'}</td>
          </tr>
          {weapons.map((w, i) => (
            <tr key={i}>
              <td>{w.name || '—'}</td>
              <td>{w.skill || '—'}</td>
              <td>{w.dmg || '—'}</td>
              <td>{w.attacks || '—'}</td>
              <td>{w.range || '—'}</td>
              <td>{w.ammo || '—'}</td>
              <td>{w.malf || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Bojové statistiky</h3>
      <ul className="matrix-print__plain">
        <li className="print-row">
          <span>Pohyb</span>
          <span>{g('move') || '—'}</span>
        </li>
        <li className="print-row">
          <span>Stavba</span>
          <span>{g('build') || '—'}</span>
        </li>
        <li className="print-row">
          <span>Úhyb (zákl / pol / pět)</span>
          <span>{charLine(cda, 'dodge')}</span>
        </li>
        <li className="print-row">
          <span>Bonus ke zranění (BZ)</span>
          <span>{g('damage_bonus') || '—'}</span>
        </li>
      </ul>

      {/* Souhrn postavy */}
      {summary.length > 0 && (
        <>
          <h3>Souhrn postavy</h3>
          <ul className="matrix-print__plain">
            {summary.map((r) => (
              <li key={r.label} className="print-row">
                <span>{r.label}</span>
                <span>{r.val}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Vybavení & majetek */}
      {(gear || money.length > 0) && (
        <>
          <h3>Vybavení & majetek</h3>
          <ul className="matrix-print__plain">
            {gear && (
              <li className="print-row">
                <span>Vybavení & osobní věci</span>
                <span>{gear}</span>
              </li>
            )}
            {money.map((r) => (
              <li key={r.label} className="print-row">
                <span>{r.label}</span>
                <span>{r.val}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
