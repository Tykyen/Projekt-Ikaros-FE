import { useMemo } from 'react';
import { FilePlus2 } from 'lucide-react';
import { Modal, Button } from '@/shared/ui';
import {
  CALENDAR_PRESETS,
  PRESET_CATEGORY_LABELS,
  PRESET_CATEGORY_ORDER,
  type CalendarPreset,
  type PresetCategory,
} from '@/shared/lib/calendarEngine/presets';
import s from './CalendarPresetPicker.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Klik na preset karta nebo „Prázdný". `null` = prázdný kalendář. */
  onPick: (preset: CalendarPreset | null) => void;
  /** Slugy už existujících configů ve světě — pro disable / „už existuje". */
  existingSlugs: ReadonlySet<string>;
}

/**
 * 9.3-F-I — Step 1 wizardu „+ Přidat kalendář": výběr šablony.
 *
 * Layout: „Prázdný" nahoře (Q5-A), pak presety grouped by category.
 * Klik na kartu → zavře modal a vrátí preset (nebo null pro prázdný) →
 * orchestrátor otevře step 2 (identita s pre-fill).
 */
export function CalendarPresetPicker({
  open,
  onClose,
  onPick,
  existingSlugs,
}: Props) {
  const groupedPresets = useMemo(() => {
    const map = new Map<PresetCategory, CalendarPreset[]>();
    for (const p of CALENDAR_PRESETS) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return map;
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Přidat kalendář — vyber šablonu"
      size="lg"
    >
      <div className={s.container}>
        {/* Q5-A — „Prázdný" nahoře jako první volba. */}
        <button
          type="button"
          className={`${s.card} ${s.cardEmpty}`}
          onClick={() => onPick(null)}
        >
          <div className={s.cardIcon}>
            <FilePlus2 size={28} aria-hidden />
          </div>
          <div className={s.cardBody}>
            <div className={s.cardName}>Prázdný kalendář</div>
            <div className={s.cardDescription}>
              Začni od nuly — sám definuj měsíce, dny a sezóny.
            </div>
          </div>
        </button>

        {PRESET_CATEGORY_ORDER.map((category) => {
          const presets = groupedPresets.get(category);
          if (!presets || presets.length === 0) return null;
          return (
            <section key={category} className={s.group}>
              <h3 className={s.groupTitle}>
                {PRESET_CATEGORY_LABELS[category]}
              </h3>
              <div className={s.grid}>
                {presets.map((preset) => {
                  const alreadyExists = existingSlugs.has(preset.slug);
                  return (
                    <button
                      key={preset.slug}
                      type="button"
                      className={s.card}
                      onClick={() => onPick(preset)}
                      title={
                        alreadyExists
                          ? `Slug "${preset.slug}" už existuje — bude přejmenován na ${preset.slug}-2.`
                          : undefined
                      }
                    >
                      <div className={s.cardBody}>
                        <div className={s.cardHeader}>
                          <span className={s.cardName}>{preset.name}</span>
                          {alreadyExists && (
                            <span className={s.cardBadge}>existuje</span>
                          )}
                        </div>
                        <div className={s.cardDescription}>
                          {preset.description}
                        </div>
                        <div className={s.cardMeta}>
                          {preset.template.months.length} měsíců ·{' '}
                          {preset.template.daysOfWeek.length} dní v týdnu
                          {preset.template.leapYearRule
                            ? ` · ${preset.template.leapYearRule.type} leap`
                            : ''}
                        </div>
                        {preset.note && (
                          <div className={s.cardNote}>⚠️ {preset.note}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className={s.actions}>
          <Button variant="ghost" onClick={onClose}>
            Zavřít
          </Button>
        </div>
      </div>
    </Modal>
  );
}
