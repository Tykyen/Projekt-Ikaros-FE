/**
 * 9.4-I — Hook vracející 3 reprezentativní měsíce pro trial preview.
 *
 * Návaznost na kalendář světa (spec §14.5):
 *  - Pokud má svět custom kalendář (`worldSettings.timelineCalendarSlug` →
 *    `useCalendarConfigs` má matching `slug`): vrátí měsíce z konfigurace —
 *    první, prostřední, „Extrém" (forced anomaly preview se středovým monthIndex).
 *  - Jinak fallback Gregorian: Leden / Červenec / Extrém.
 *
 * Žádné BE volání navíc — reuse existing `useWorldSettings` + `useCalendarConfigs`.
 */
import { useMemo } from 'react';
import { useWorldSettings } from './useWorldSettings';
import { useCalendarConfigs } from './useCalendarConfigs';

export interface TrialMonth {
  /** Český název měsíce („Leden", „Hammer", „Extrém"). */
  name: string;
  /** 0-based index v kalendářním cyklu (pro `previewWeather`). */
  index: number;
  /** UI label (default = name). */
  label: string;
  /** Total počet měsíců v kalendáři (12 default). */
  monthsTotal: number;
  /** True pro „Extrém" slot — preview vynutí anomálii (heat-wave shift). */
  extreme?: boolean;
}

const GREGORIAN_MONTHS = [
  'Leden',
  'Únor',
  'Březen',
  'Duben',
  'Květen',
  'Červen',
  'Červenec',
  'Srpen',
  'Září',
  'Říjen',
  'Listopad',
  'Prosinec',
];

const GREGORIAN_FALLBACK: TrialMonth[] = [
  { name: GREGORIAN_MONTHS[0], index: 0, label: 'Leden', monthsTotal: 12 },
  { name: GREGORIAN_MONTHS[6], index: 6, label: 'Červenec', monthsTotal: 12 },
  { name: 'Extrém', index: 6, label: 'Extrém', monthsTotal: 12, extreme: true },
];

export function useTrialMonths(worldId: string): TrialMonth[] {
  const { data: settings } = useWorldSettings(worldId);
  const { data: configs } = useCalendarConfigs(worldId);

  return useMemo(() => {
    const slug = settings?.timelineCalendarSlug ?? null;
    if (!slug || !configs || configs.length === 0) return GREGORIAN_FALLBACK;

    const calendar = configs.find((c) => c.slug === slug);
    if (!calendar || !calendar.months || calendar.months.length === 0) {
      return GREGORIAN_FALLBACK;
    }

    const total = calendar.months.length;
    const mid = Math.floor(total / 2);
    const first = calendar.months[0];
    const middle = calendar.months[mid];

    return [
      { name: first.name, index: 0, label: first.name, monthsTotal: total },
      {
        name: middle.name,
        index: mid,
        label: middle.name,
        monthsTotal: total,
      },
      {
        name: 'Extrém',
        index: mid,
        label: 'Extrém',
        monthsTotal: total,
        extreme: true,
      },
    ];
  }, [settings?.timelineCalendarSlug, configs]);
}
