import { useMemo } from 'react';
import { Star } from 'lucide-react';
import {
  CALENDAR_PRESETS,
  PRESET_CATEGORY_LABELS,
  PRESET_CATEGORY_ORDER,
  type CalendarPreset,
  type PresetCategory,
} from '@/shared/lib/calendarEngine/presets';
import { SectionCard } from './SectionCard';
import s from './CalendarsSection.module.css';

interface Props {
  /** Slugy aktuálně zaškrtnutých presetů. */
  selectedSlugs: ReadonlySet<string>;
  /** Slug ⭐ default (musí být v `selectedSlugs`). */
  defaultSlug: string | null;
  onToggle: (slug: string) => void;
  onSetDefault: (slug: string) => void;
}

/**
 * 9.3-F-I-Q1 — CreateWorldPage krok: výběr kalendářů světa.
 *
 * Default: jen Gregorian zaškrtnutý + jako default ⭐. PJ může:
 * - Odškrtnout Gregorian (svět vznikne bez něj, PJ vize „neplatí")
 * - Zaškrtnout víc presetů (multi-select)
 * - Změnit default kliknutím na ⭐ ikonu vedle zaškrtnutého
 */
export function CalendarsSection({
  selectedSlugs,
  defaultSlug,
  onToggle,
  onSetDefault,
}: Props) {
  const grouped = useMemo(() => {
    const map = new Map<PresetCategory, CalendarPreset[]>();
    for (const p of CALENDAR_PRESETS) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return map;
  }, []);

  return (
    <SectionCard
      index={7}
      title="Kalendáře"
      description="Vyber předpřipravené kalendáře, které tvůj svět bude používat. Můžeš upravit později v Nastavení."
    >
      <div className={s.container}>
        <p className={s.hint}>
          Default je Gregoriánský. Můžeš ho nechat, nahradit jiným, nebo
          odškrtnout úplně — svět pak vznikne bez kalendáře a vytvoříš si
          vlastní v Nastavení → Kalendáře.
        </p>

        {PRESET_CATEGORY_ORDER.map((category) => {
          const presets = grouped.get(category);
          if (!presets || presets.length === 0) return null;
          return (
            <fieldset key={category} className={s.group}>
              <legend className={s.groupLabel}>
                {PRESET_CATEGORY_LABELS[category]}
              </legend>
              <ul className={s.list}>
                {presets.map((preset) => {
                  const checked = selectedSlugs.has(preset.slug);
                  const isDefault = checked && defaultSlug === preset.slug;
                  return (
                    <li key={preset.slug} className={s.row}>
                      <label className={s.checkLabel}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggle(preset.slug)}
                        />
                        <span className={s.cellName}>{preset.name}</span>
                        <span className={s.cellDesc}>{preset.description}</span>
                      </label>
                      {checked && (
                        <button
                          type="button"
                          className={`${s.starBtn} ${isDefault ? s.starBtnActive : ''}`}
                          onClick={() => onSetDefault(preset.slug)}
                          title={
                            isDefault
                              ? 'Výchozí kalendář světa'
                              : 'Nastavit jako výchozí'
                          }
                          aria-label={
                            isDefault
                              ? `${preset.name} je výchozí`
                              : `Nastavit ${preset.name} jako výchozí`
                          }
                          aria-pressed={isDefault}
                        >
                          <Star
                            size={14}
                            aria-hidden
                            fill={isDefault ? 'currentColor' : 'none'}
                          />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          );
        })}

        <p className={s.summary}>
          {selectedSlugs.size === 0
            ? '⚠️ Svět vznikne bez kalendáře.'
            : `Vybráno: ${selectedSlugs.size}, výchozí: ${defaultSlug ?? '(žádný)'}`}
        </p>
      </div>
    </SectionCard>
  );
}
