/* eslint-disable react-refresh/only-export-components -- komponenta + EMPTY_FILTERS konstanta záměrně pohromadě; jen DX/HMR */
/**
 * 13.3 — Filtr bar. Search vždy viditelný; 7 dimenzí pod sbalitelným „Filtry".
 *
 * Default sbaleno (jen search), ať bohatá metadata nezahltí. Filtrace probíhá
 * client-side v SoundsPage nad načteným listem.
 */
import { useState } from 'react';
import type {
  SoundMediaType,
  SoundEnvironment,
  SoundEmotionalTone,
  SoundFactionStyle,
  SoundTechLevel,
  SoundMagicLevel,
} from '../types';
import {
  MEDIA_TYPE_LABELS,
  ENVIRONMENT_LABELS,
  EMOTIONAL_TONE_LABELS,
  FACTION_STYLE_LABELS,
  TECH_LEVEL_LABELS,
  MAGIC_LEVEL_LABELS,
  toOptions,
} from '../lib/soundEnums';
import styles from './SoundFiltersBar.module.css';

export interface SoundFilters {
  search: string;
  mediaType: SoundMediaType | '';
  environment: SoundEnvironment | '';
  emotionalTone: SoundEmotionalTone | '';
  factionStyle: SoundFactionStyle | '';
  techLevel: SoundTechLevel | '';
  magicLevel: SoundMagicLevel | '';
  intensity: number | 0; // 0 = vše
}

export const EMPTY_FILTERS: SoundFilters = {
  search: '',
  mediaType: '',
  environment: '',
  emotionalTone: '',
  factionStyle: '',
  techLevel: '',
  magicLevel: '',
  intensity: 0,
};

interface Props {
  value: SoundFilters;
  onChange: (next: SoundFilters) => void;
}

export function SoundFiltersBar({ value, onChange }: Props): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  const set = <K extends keyof SoundFilters>(key: K, v: SoundFilters[K]) =>
    onChange({ ...value, [key]: v });

  const activeCount = countActive(value);

  return (
    <div className={styles.bar}>
      <div className={styles.topRow}>
        <input
          type="search"
          className={styles.search}
          placeholder="Hledat podle názvu / poznámky / štítku…"
          value={value.search}
          onChange={(e) => set('search', e.target.value)}
        />
        <button
          type="button"
          className={`${styles.toggle} ${expanded ? styles.toggleActive : ''}`}
          onClick={() => setExpanded((v) => !v)}
        >
          Filtry {activeCount > 0 ? `(${activeCount})` : ''}{' '}
          <span className={expanded ? styles.chevronOpen : styles.chevron}>
            ▾
          </span>
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            className={styles.clear}
            onClick={() => onChange({ ...EMPTY_FILTERS, search: value.search })}
          >
            Zrušit
          </button>
        )}
      </div>

      {expanded && (
        <div className={styles.grid}>
          <Select
            label="Druh"
            value={value.mediaType}
            onChange={(v) => set('mediaType', v as SoundMediaType | '')}
            options={toOptions(MEDIA_TYPE_LABELS)}
          />
          <Select
            label="Prostředí"
            value={value.environment}
            onChange={(v) => set('environment', v as SoundEnvironment | '')}
            options={toOptions(ENVIRONMENT_LABELS)}
          />
          <Select
            label="Tón"
            value={value.emotionalTone}
            onChange={(v) => set('emotionalTone', v as SoundEmotionalTone | '')}
            options={toOptions(EMOTIONAL_TONE_LABELS)}
          />
          <Select
            label="Frakce"
            value={value.factionStyle}
            onChange={(v) => set('factionStyle', v as SoundFactionStyle | '')}
            options={toOptions(FACTION_STYLE_LABELS)}
          />
          <Select
            label="Technologie"
            value={value.techLevel}
            onChange={(v) => set('techLevel', v as SoundTechLevel | '')}
            options={toOptions(TECH_LEVEL_LABELS)}
          />
          <Select
            label="Magie"
            value={value.magicLevel}
            onChange={(v) => set('magicLevel', v as SoundMagicLevel | '')}
            options={toOptions(MAGIC_LEVEL_LABELS)}
          />
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Intenzita</span>
            <select
              className={styles.select}
              value={value.intensity}
              onChange={(e) => set('intensity', Number(e.target.value))}
            >
              <option value={0}>Vše</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}): React.ReactElement {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Vše</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function countActive(f: SoundFilters): number {
  let n = 0;
  if (f.mediaType) n++;
  if (f.environment) n++;
  if (f.emotionalTone) n++;
  if (f.factionStyle) n++;
  if (f.techLevel) n++;
  if (f.magicLevel) n++;
  if (f.intensity > 0) n++;
  return n;
}
