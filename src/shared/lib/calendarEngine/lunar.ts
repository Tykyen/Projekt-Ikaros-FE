import type { CelestialBody, LunarPhase, LunarPhaseInfo } from './types';

/**
 * 9.2a — Výpočet lunárních fází (8-fázový cyklus).
 *
 * Synodický cyklus tělesa je rozdělen na 8 stejných segmentů.
 * Pro reálný Měsíc (29.5306 dní) = ~3.69 dne na segment.
 *
 * Pro porovnávání eventů napříč kalendáři používáme `globalAbsDay`
 * (= `toAbsDay(date, calendarConfig) + calendarConfig.epochOffset`).
 */

const PHASES_ORDERED: readonly LunarPhase[] = [
  'new',
  'waxing-crescent',
  'first-quarter',
  'waxing-gibbous',
  'full',
  'waning-gibbous',
  'last-quarter',
  'waning-crescent',
];

const PHASE_ICONS: Record<LunarPhase, string> = {
  'new': '🌑',
  'waxing-crescent': '🌒',
  'first-quarter': '🌓',
  'waxing-gibbous': '🌔',
  'full': '🌕',
  'waning-gibbous': '🌖',
  'last-quarter': '🌗',
  'waning-crescent': '🌘',
};

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function getLunarPhase(globalAbsDay: number, body: CelestialBody): LunarPhase {
  const cyclePos = mod(globalAbsDay - body.epochOffset, body.orbitalPeriodDays);
  const segment = Math.floor((cyclePos / body.orbitalPeriodDays) * PHASES_ORDERED.length);
  return PHASES_ORDERED[Math.min(segment, PHASES_ORDERED.length - 1)];
}

export function getLunarPhasesForDay(
  globalAbsDay: number,
  bodies: CelestialBody[],
): LunarPhaseInfo[] {
  return bodies.map((body) => {
    const cyclePos = mod(globalAbsDay - body.epochOffset, body.orbitalPeriodDays);
    const phase = getLunarPhase(globalAbsDay, body);
    return {
      body,
      phase,
      icon: body.icon ?? PHASE_ICONS[phase],
      cyclePosition: cyclePos / body.orbitalPeriodDays,
    };
  });
}
