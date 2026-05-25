/**
 * 9.2a — Public API kalendářového enginu.
 *
 * Konzumenti:
 *  - 9.2b — multi-config CRUD + config editor (PJ)
 *  - 9.2c — per-entita mřížka (Postava / NPC / Lokace)
 *  - 9.2d — PJ aggregate view (sjednocení postavy + NPC + Lokace + game events)
 *  - 9.2e — fantasy datum na novinkách (`WorldNews`)
 *
 * @see docs/arch/phase-9/spec-9.2a-fantasy-engine.md
 */

export type {
  FantasyDate,
  MonthDef,
  CelestialBody,
  Season,
  CalendarConfig,
  LunarPhase,
  LunarPhaseInfo,
  GridCell,
} from './types';

export {
  toAbsDay,
  fromAbsDay,
  daysInYear,
  daysInMonth,
  isGregorianLike,
} from './absDay';

export { generateMonthGrid } from './monthGrid';
export { getLunarPhase, getLunarPhasesForDay } from './lunar';
export { getSeasonForDay } from './seasons';
export {
  GREGORIAN_DEFAULT_CONFIG,
  MOON_EPOCH_REFERENCE_ABSDAY,
} from './gregorianDefault';
export {
  formatFantasyDate,
  fantasyDayKey,
  isSameFantasyDay,
} from './formatDate';
export { expandEventDays } from './expandEvent';
