/**
 * 21.5c — editační pole statbloku kouzla dle šablony systému
 * (`spellTemplates.ts`). Jedna komponenta pro editor i návrh statbloku.
 * Volná šablona (`freeform`) navíc renderuje dynamické páry popisek:hodnota
 * (klíč `extra`).
 */
import { useId } from 'react';
import {
  SPELL_EXTRA_KEY,
  spellExtras,
  type SpellFieldDef,
  type SpellSystemTemplate,
  type SpellExtraPair,
} from '../systems/spellTemplates';
import s from './KouzlaForms.module.css';

interface Props {
  template: SpellSystemTemplate;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  errors?: Record<string, string>;
}

export function SpellStatsFields({ template, value, onChange, errors }: Props) {
  const uid = useId();
  const set = (key: string, v: unknown) => onChange({ ...value, [key]: v });

  const extras = spellExtras(value);
  const setExtras = (pairs: SpellExtraPair[]) =>
    set(SPELL_EXTRA_KEY, pairs);

  return (
    <>
      {template.fields.map((f) => (
        <Field
          key={f.key}
          def={f}
          id={`${uid}-${f.key}`}
          value={value[f.key]}
          error={errors?.[f.key]}
          onChange={(v) => set(f.key, v)}
        />
      ))}

      {template.freeform ? (
        <div className={s.field}>
          <span className={s.label}>Další parametry</span>
          <span className={s.fieldHint}>
            Volné páry popisek : hodnota (např. „Cena — 1 bod osudu").
          </span>
          {extras.map((p, i) => (
            <div className={s.extraRow} key={i}>
              <input
                className={s.input}
                value={p.label}
                placeholder="Popisek (např. Dosah)"
                aria-label={`Popisek parametru ${i + 1}`}
                onChange={(e) =>
                  setExtras(
                    extras.map((x, j) =>
                      j === i ? { ...x, label: e.target.value } : x,
                    ),
                  )
                }
              />
              <input
                className={s.input}
                value={p.value}
                placeholder="Hodnota"
                aria-label={`Hodnota parametru ${i + 1}`}
                onChange={(e) =>
                  setExtras(
                    extras.map((x, j) =>
                      j === i ? { ...x, value: e.target.value } : x,
                    ),
                  )
                }
              />
              <button
                type="button"
                className={s.extraRemove}
                aria-label="Odebrat parametr"
                onClick={() => setExtras(extras.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <div>
            <button
              type="button"
              className={s.extraAdd}
              onClick={() => setExtras([...extras, { label: '', value: '' }])}
            >
              ＋ Přidat parametr
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  def,
  id,
  value,
  error,
  onChange,
}: {
  def: SpellFieldDef;
  id: string;
  value: unknown;
  error?: string;
  onChange: (v: unknown) => void;
}) {
  const label = (
    <label className={s.label} htmlFor={id}>
      {def.label}
      {def.required ? <span className={s.req}> *</span> : null}
    </label>
  );
  const hint = def.hint ? <span className={s.fieldHint}>{def.hint}</span> : null;
  const err = error ? <span className={s.fieldErr}>{error}</span> : null;

  switch (def.type) {
    case 'textarea':
      return (
        <div className={s.field}>
          {label}
          <textarea
            id={id}
            className={s.textarea}
            value={(value as string) ?? ''}
            placeholder={def.placeholder}
            onChange={(e) => onChange(e.target.value)}
            maxLength={2000}
          />
          {hint}
          {err}
        </div>
      );
    case 'select':
      return (
        <div className={s.field}>
          {label}
          <select
            id={id}
            className={s.select}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">— vyber —</option>
            {(def.options ?? []).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {hint}
          {err}
        </div>
      );
    case 'combo':
      return (
        <div className={s.field}>
          {label}
          <input
            id={id}
            className={s.input}
            value={(value as string) ?? ''}
            placeholder={def.placeholder ?? 'vyber, nebo napiš vlastní'}
            list={def.options?.length ? `${id}-list` : undefined}
            onChange={(e) => onChange(e.target.value)}
            maxLength={200}
          />
          {def.options?.length ? (
            <datalist id={`${id}-list`}>
              {def.options.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          ) : null}
          {hint}
          {err}
        </div>
      );
    case 'checkbox':
      return (
        <div className={s.field}>
          <label className={s.checkRow} htmlFor={id}>
            <input
              id={id}
              type="checkbox"
              checked={value === true}
              onChange={(e) => onChange(e.target.checked)}
            />
            {def.label}
          </label>
          {hint}
          {err}
        </div>
      );
    case 'multicheck': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (o: string) =>
        onChange(
          selected.includes(o)
            ? selected.filter((x) => x !== o)
            : [...selected, o],
        );
      return (
        <div className={s.field}>
          <span className={s.label}>
            {def.label}
            {def.required ? <span className={s.req}> *</span> : null}
          </span>
          <div className={s.checkGroup} role="group" aria-label={def.label}>
            {(def.options ?? []).map((o) => (
              <label key={o} className={s.checkRow}>
                <input
                  type="checkbox"
                  checked={selected.includes(o)}
                  onChange={() => toggle(o)}
                />
                {o}
              </label>
            ))}
          </div>
          {hint}
          {err}
        </div>
      );
    }
    default:
      return (
        <div className={s.field}>
          {label}
          <input
            id={id}
            className={s.input}
            value={(value as string) ?? ''}
            placeholder={def.placeholder}
            onChange={(e) => onChange(e.target.value)}
            maxLength={400}
          />
          {hint}
          {err}
        </div>
      );
  }
}
