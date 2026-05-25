import type { CalendarConfig } from '@/shared/lib/calendarEngine';

/**
 * 9.3 — vybere aktivní calendar config pro timeline.
 *
 * Mirror BE `WorldCalendarConfigService.getTimelineConfig` (followup-FIX
 * 2026-05-25). Fallback hierarchie:
 *  1. `timelineSlug` z worldSettings (explicit volba)
 *  2. `worldDefaultSlug` z world.defaultCalendarConfigSlug (⭐ default svět)
 *  3. `configs[0]` (pojistka pokud i default chybí)
 *  4. `null` (žádné configs)
 */
export function getActiveCalendarConfig(
  configs: CalendarConfig[] | undefined,
  timelineSlug: string | null | undefined,
  worldDefaultSlug?: string | null,
): CalendarConfig | null {
  if (!configs || configs.length === 0) return null;
  if (timelineSlug) {
    const match = configs.find((c) => c.slug === timelineSlug);
    if (match) return match;
  }
  if (worldDefaultSlug) {
    const match = configs.find((c) => c.slug === worldDefaultSlug);
    if (match) return match;
  }
  return configs[0];
}
