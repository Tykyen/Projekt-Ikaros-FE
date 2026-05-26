/**
 * 9.2a — Typy pro fantasy/gregoriánský kalendářový engine.
 *
 * Sdílená vrstva pro 9.2b (multi-config + editor), 9.2c (per-entita mřížka),
 * 9.2d (PJ aggregate view), 9.2e (novinky fantasy datum).
 *
 * @see docs/arch/phase-9/spec-9.2a-fantasy-engine.md
 */

/**
 * Strukturované datum v daném kalendáři. `year` může být záporný
 * (před `referenceDate` kalendáře). `monthIndex` je 0-based.
 */
export interface FantasyDate {
  year: number;
  monthIndex: number;
  day: number;
  hour?: number;
  minute?: number;
}

export interface MonthDef {
  name: string;
  daysCount: number;
  /**
   * 9.3-F-II — Měsíc se vkládá jen v přestupných letech (lunisolar intercalary).
   * V non-leap roce engine vrátí `daysInMonth = 0` (měsíc se přeskočí,
   * monthIndex zůstane stabilní napříč roky pro storage konzistenci).
   *
   * Příklady:
   *  - Hebrew: adar I před adar II v přestupném roce.
   *  - Chinese: extra "13. měsíc" v přestupných letech Metonic cyklu.
   *  - Babylonian: druhý addaru.
   *  - Greek Attic: druhý poseideón.
   */
  isIntercalary?: boolean;
}

/**
 * Nebeské těleso s vlastním synodickým cyklem. Pro reálný Měsíc
 * `orbitalPeriodDays = 29.5306`, `epochOffset` ukazuje na den novu
 * (viz `MOON_EPOCH_REFERENCE_ABSDAY` v `gregorianDefault.ts`).
 */
export interface CelestialBody {
  id: string;
  name: string;
  orbitalPeriodDays: number;
  color: string;
  epochOffset: number;
  icon?: string;
}

/**
 * Sezóna definovaná počátkem (měsíc + den). Aktivní sezóna se určuje
 * jako poslední sezóna, jejíž start již proběhl v aktuálním roce
 * (s wraparound přes konec roku).
 */
export interface Season {
  id: string;
  name: string;
  startMonthIndex: number;
  startDay: number;
  color: string;
  icon?: string;
}

/**
 * 9.3-F-I — Pravidlo pro určení přestupného roku non-Gregorian kalendáře.
 *
 * Bez tohoto pravidla je `daysInYear` pevná (suma `months[i].daysCount`).
 * S pravidlem se v přestupném roce přidá 1 den k `leapMonthIndex` měsíci.
 *
 * Typy:
 *  - `every-4`        — Juliánský: každý 4. rok přestupný (rok % 4 === 0)
 *  - `solar-hijri-33` — Perský: 8 přestupných v 33-letém cyklu
 *  - `islamic-30`     — Islámský: 11 přestupných v 30-letém cyklu (Dhu al-Hijjah +1)
 *
 * Gregorian a Gregorian-aware (Holocene, Buddhist Thai) leap pravidlo NEPOUŽÍVÁ —
 * řešeno přes `isGregorianLike()` v `absDay.ts` (special case).
 */
export type LeapYearRuleType = 'every-4' | 'solar-hijri-33' | 'islamic-30';

export interface LeapYearRule {
  type: LeapYearRuleType;
  /** Index měsíce, kterému se v přestupném roce přičte +1 den. */
  leapMonthIndex: number;
}

/**
 * 9.3-F-II — Pravidlo pro lunisolární kalendáře (Hebrew, Chinese, Babylonian,
 * Greek Attic). V přestupných letech se vloží `MonthDef` s `isIntercalary: true`.
 *
 * Typ:
 *  - `metonic-19` — 19-letý cyklus s 7 přestupnými roky na fixních pozicích
 *    (1-based, např. Hebrew: [3, 6, 8, 11, 14, 17, 19]).
 *
 * Engine zatím podporuje **jedno** intercalary monthový index per config.
 * Pokud má kalendář víc variant (Hebrew chešvan/kislev 29/30 deficient/regular/abundant),
 * F-II to **zjednodušuje** na pevné délky — fantasy svět nepotřebuje sub-day
 * historickou přesnost.
 */
export type LunisolarRuleType = 'metonic-19';

export interface LunisolarRule {
  type: LunisolarRuleType;
  /**
   * 1-based pozice přestupných let v cyklu (např. Hebrew Metonic:
   * [3, 6, 8, 11, 14, 17, 19] — 7 z 19 let).
   */
  leapYearsInCycle: number[];
}

export interface CalendarConfig {
  id: string;
  slug: string;
  name: string;
  hoursPerDay: number;
  daysOfWeek: string[];
  months: MonthDef[];
  celestialBodies: CelestialBody[];
  seasons: Season[];
  /**
   * 9.3-F-I — opt-in přestupné pravidlo pro non-Gregorian kalendáře.
   * Bez něj zůstává `daysInYear` pevná suma (=BC s 9.2a konfigy).
   */
  leapYearRule?: LeapYearRule;
  /**
   * 9.3-F-II — opt-in lunisolární pravidlo. V přestupných letech engine
   * "aktivuje" měsíce s `MonthDef.isIntercalary: true`. Bez něj se
   * intercalary měsíce ignorují (= 0 dní každý rok).
   */
  lunisolar?: LunisolarRule;
  /**
   * Kolik `absDay` od `World.timelineEpoch` připadá na `(year:0, month:0, day:1)`
   * tohoto kalendáře. Pro Gregorian (= referenční kalendář) = 0.
   * Multi-config setup řeší 9.2b.
   */
  epochOffset: number;
}

export type LunarPhase =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

export interface LunarPhaseInfo {
  body: CelestialBody;
  phase: LunarPhase;
  icon: string;
  /** Pozice v cyklu 0..1 — pro animace v UI vrstvě. */
  cyclePosition: number;
}

export interface GridCell {
  date: FantasyDate;
  inCurrentMonth: boolean;
  weekdayIndex: number;
  absDay: number;
}
