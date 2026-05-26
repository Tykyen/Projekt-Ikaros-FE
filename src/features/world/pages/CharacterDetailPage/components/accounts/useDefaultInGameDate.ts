/**
 * Spec 8.x-prep §4.4 — helper hook pro výpočet default FantasyDate
 * z `worldSettings.currentInGameDate`.
 *
 * Vyčleněno z `InGameDateField.tsx` aby React Fast Refresh fungoval
 * (file `*.tsx` co exportuje i hook + komponentu spadne na refresh chybě).
 */
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useCalendarConfigs } from '@/features/world/api/useCalendarConfigs';
import type { FantasyDateLike } from '@/features/world/pages/api/characters.types';

interface MonthDescriptor {
  name: string;
  daysCount: number;
}

const GREGORIAN_MONTHS: MonthDescriptor[] = [
  { name: 'Leden', daysCount: 31 },
  { name: 'Únor', daysCount: 29 },
  { name: 'Březen', daysCount: 31 },
  { name: 'Duben', daysCount: 30 },
  { name: 'Květen', daysCount: 31 },
  { name: 'Červen', daysCount: 30 },
  { name: 'Červenec', daysCount: 31 },
  { name: 'Srpen', daysCount: 31 },
  { name: 'Září', daysCount: 30 },
  { name: 'Říjen', daysCount: 31 },
  { name: 'Listopad', daysCount: 30 },
  { name: 'Prosinec', daysCount: 31 },
];

export function useDefaultInGameDate(worldId: string): FantasyDateLike {
  const { data: settings } = useWorldSettings(worldId);
  const { data: calendars = [] } = useCalendarConfigs(worldId);
  const activeCalendar = settings?.timelineCalendarSlug
    ? calendars.find((c) => c.slug === settings.timelineCalendarSlug)
    : undefined;

  const monthsList: MonthDescriptor[] =
    activeCalendar && activeCalendar.months.length > 0
      ? activeCalendar.months.map((m, idx) => ({
          name: m.name || `${idx + 1}. měsíc`,
          daysCount: m.daysCount,
        }))
      : GREGORIAN_MONTHS;
  const monthsTotal = monthsList.length;
  const persisted = settings?.currentInGameDate
    ? new Date(settings.currentInGameDate)
    : null;
  const base =
    persisted && !Number.isNaN(persisted.getTime()) ? persisted : new Date();
  const m = base.getUTCMonth() % monthsTotal;
  return {
    year: base.getUTCFullYear(),
    monthIndex: m,
    day: Math.max(
      1,
      Math.min(base.getUTCDate(), monthsList[m]?.daysCount ?? 31),
    ),
    hour: persisted ? base.getUTCHours() : 12,
    minute: persisted ? base.getUTCMinutes() : 0,
  };
}
