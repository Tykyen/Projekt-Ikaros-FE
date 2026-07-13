/**
 * 21.5c — read-only render statbloku kouzla dle šablony systému. Škola jako
 * badge nahoře, ostatní pole jako řádky popisek : hodnota (vzor karet kouzel
 * z příruček). Neznámé klíče mimo šablonu vypíše taky (forward-kompat, když
 * se šablona časem změní).
 */
import {
  SPELL_EXTRA_KEY,
  formatSpellValue,
  getSpellTemplate,
  spellExtras,
  spellSchool,
} from '../systems/spellTemplates';
import s from './SpellStatblockView.module.css';

interface Props {
  systemId: string;
  systemStats: Record<string, unknown>;
}

export function SpellStatblockView({ systemId, systemStats }: Props) {
  const template = getSpellTemplate(systemId);
  const school = spellSchool(systemStats);
  const known = new Set([
    'school',
    SPELL_EXTRA_KEY,
    ...template.fields.map((f) => f.key),
  ]);
  const rows: { label: string; value: string }[] = [];

  for (const f of template.fields) {
    if (f.key === 'school') continue;
    const v = formatSpellValue(f, systemStats[f.key]);
    if (v) rows.push({ label: f.label, value: v });
  }
  for (const p of spellExtras(systemStats)) {
    if (p.label.trim() || p.value.trim())
      rows.push({ label: p.label.trim() || '—', value: p.value });
  }
  // Neznámé klíče (stará/cizí data) — nezahodit, zobrazit.
  for (const [k, v] of Object.entries(systemStats)) {
    if (known.has(k) || v === undefined || v === null) continue;
    const str = Array.isArray(v) ? v.join(', ') : String(v);
    if (str.trim()) rows.push({ label: k, value: str });
  }

  return (
    <div className={s.block} data-spell-statblock="">
      {school ? (
        <div className={s.school} data-spell-school="">
          <span className={s.schoolLabel}>Škola magie</span>
          <span className={s.schoolValue}>{school}</span>
        </div>
      ) : null}
      {rows.length ? (
        <dl className={s.grid}>
          {rows.map((r, i) => (
            <div className={s.row} key={`${r.label}-${i}`}>
              <dt className={s.k}>{r.label}</dt>
              <dd className={s.v}>{r.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={s.empty}>Statblok zatím nemá vyplněná pole.</p>
      )}
    </div>
  );
}
