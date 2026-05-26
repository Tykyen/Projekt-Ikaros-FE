import type {
  CalendarConfig,
  FantasyDate,
  LeapYearRule,
  LunisolarRule,
} from './types';

/**
 * 9.2a — Převody mezi `FantasyDate` a `absDay` (kanonický epoch).
 *
 * `(year:0, monthIndex:0, day:1)` = `absDay 0`. Pro porovnávání eventů
 * napříč kalendáři jednoho světa se přičítá `config.epochOffset`
 * (řeší 9.2b s `World.timelineEpoch`).
 *
 * Gregorian má speciální case s leap years (4/100/400 pravidlo).
 * Detekce přes shape match `isGregorianLike`.
 *
 * 9.3-F-I — non-Gregorian podporuje opt-in `config.leapYearRule`
 * (every-4 / solar-hijri-33 / islamic-30). Bez něj fast-path pevná
 * `daysInYear` (BC s 9.2a konfigy).
 */

/** Matematický modulo (JS `%` má znaménko dividenda). */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

const GREGORIAN_MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * 9.3-F-I — Solar Hijri 33-letý cyklus.
 * Přestupné roky v cyklu: positions {1, 5, 9, 13, 17, 22, 26, 30}
 * (after Omar Khayyám reform ~1079 CE, moderní íránský kalendář).
 */
const SOLAR_HIJRI_LEAP_POSITIONS = new Set([1, 5, 9, 13, 17, 22, 26, 30]);

function isSolarHijriLeapYear(year: number): boolean {
  return SOLAR_HIJRI_LEAP_POSITIONS.has(mod(year, 33));
}

/**
 * 9.3-F-I — Islamic 30-letý tabular cyklus (Kuwaiti / Microsoft variant).
 * Přestupné roky v cyklu: positions {2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29}.
 * V přestupném roce má 12. měsíc Dhu al-Hijjah 30 dní místo 29.
 */
const ISLAMIC_LEAP_POSITIONS = new Set([
  2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29,
]);

function isIslamicLeapYear(year: number): boolean {
  return ISLAMIC_LEAP_POSITIONS.has(mod(year, 30));
}

function isLeapYearByRule(year: number, rule: LeapYearRule): boolean {
  switch (rule.type) {
    case 'every-4':
      return mod(year, 4) === 0;
    case 'solar-hijri-33':
      return isSolarHijriLeapYear(year);
    case 'islamic-30':
      return isIslamicLeapYear(year);
  }
}

/**
 * 9.3-F-II — Lunisolar leap year check (Metonic 19-letý cyklus).
 *
 * `year` 1-based v cyklu → match proti `leapYearsInCycle`.
 * Použito pro Hebrew, Chinese, Babylonian, Greek Attic (všechny Metonic).
 */
function isLunisolarLeapYear(year: number, rule: LunisolarRule): boolean {
  if (rule.type === 'metonic-19') {
    // Pozice v 19-letém cyklu (1..19). `((year-1) % 19) + 1` pro 1-based mapping.
    const pos = mod(year - 1, 19) + 1;
    return rule.leapYearsInCycle.includes(pos);
  }
  return false;
}

/**
 * True pokud config má strukturu Gregorian kalendáře:
 * 12 měsíců s pevně danými délkami (31/28/31/30/…) + 7 dní v týdnu.
 * Tolerantní k jiným názvům měsíců/dní (různé jazyky / lokalizace).
 */
export function isGregorianLike(config: CalendarConfig): boolean {
  if (config.months.length !== 12) return false;
  if (config.daysOfWeek.length !== 7) return false;
  for (let i = 0; i < 12; i++) {
    if (config.months[i].daysCount !== GREGORIAN_MONTH_DAYS[i]) return false;
  }
  return true;
}

/**
 * Délka daného měsíce ve dnech. Pro Gregorian respektuje leap year
 * v únoru. `monthIndex` se normalizuje modulo počet měsíců.
 *
 * 9.3-F-I — non-Gregorian s `config.leapYearRule`: v přestupném roce
 * se k `leapMonthIndex` měsíci přičte +1 den.
 *
 * 9.3-F-II — `MonthDef.isIntercalary`: v non-leap roce dostane 0 dní
 * (skipne se), v leap roce má `daysCount`. Leap status se určuje
 * z `config.lunisolar` (Metonic 19-letý cyklus pro Hebrew/Chinese/Babylonian/Greek).
 */
export function daysInMonth(
  monthIndex: number,
  year: number,
  config: CalendarConfig,
): number {
  const normalizedMonth = mod(monthIndex, config.months.length);
  if (isGregorianLike(config) && normalizedMonth === 1) {
    return isGregorianLeapYear(year) ? 29 : 28;
  }
  const monthDef = config.months[normalizedMonth];
  // 9.3-F-II — intercalary měsíc dostane 0 dní v non-leap roce.
  if (monthDef.isIntercalary) {
    if (
      config.lunisolar &&
      isLunisolarLeapYear(year, config.lunisolar)
    ) {
      return monthDef.daysCount;
    }
    return 0;
  }
  const base = monthDef.daysCount;
  if (
    config.leapYearRule &&
    normalizedMonth === config.leapYearRule.leapMonthIndex &&
    isLeapYearByRule(year, config.leapYearRule)
  ) {
    return base + 1;
  }
  return base;
}

/**
 * Délka roku v daném kalendáři.
 *
 * Pro Gregorian: 365 nebo 366 (leap se řeší per-měsíc v únoru).
 * Pro non-Gregorian:
 *  - Bez `leapYearRule` ani `lunisolar` → konstanta (suma neintercalary měsíců).
 *  - S `leapYearRule` → +1 v přestupném roce.
 *  - S `lunisolar` (9.3-F-II) → iterate per měsíc (intercalary 0 v non-leap).
 */
export function daysInYear(config: CalendarConfig, year?: number): number {
  // 9.3-F-II — pokud má config lunisolar nebo intercalary měsíce,
  // musí iterate per-month (intercalary záleží na year).
  const hasIntercalary = config.months.some((m) => m.isIntercalary);
  if (hasIntercalary && year !== undefined) {
    let sum = 0;
    for (let i = 0; i < config.months.length; i++) {
      sum += daysInMonth(i, year, config);
    }
    return sum;
  }
  // Standard non-Gregorian / 9.3-F-I leap path.
  const base = config.months
    .filter((m) => !m.isIntercalary)
    .reduce((acc, m) => acc + m.daysCount, 0);
  if (
    config.leapYearRule &&
    year !== undefined &&
    isLeapYearByRule(year, config.leapYearRule)
  ) {
    return base + 1;
  }
  return base;
}

/**
 * `(year:0, monthIndex:0, day:1)` → `absDay 0`.
 * Pro Gregorian používá proleptic kalkulaci (rok 0 = leap dle 400 pravidla).
 * Pro non-Gregorian s `leapYearRule` iteruje roky (per-year suma).
 */
export function toAbsDay(date: FantasyDate, config: CalendarConfig): number {
  if (isGregorianLike(config)) {
    const y = date.year;
    // Proleptic Gregorian: count leap days from year 0 (inclusive) up to y-1.
    // Rok 0 je leap (0 % 400 === 0), takže pro y > 0 zahrnujeme leap day roku 0.
    const leapsBefore =
      y > 0
        ? Math.floor((y - 1) / 4) -
          Math.floor((y - 1) / 100) +
          Math.floor((y - 1) / 400) +
          1
        : Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400);
    let days = y * 365 + leapsBefore;
    for (let i = 0; i < date.monthIndex; i++) {
      days += daysInMonth(i, y, config);
    }
    return days + (date.day - 1);
  }
  // 9.3-F-I/F-II — non-Gregorian. Fast path pokud config nemá ani leapYearRule
  // ani intercalary měsíce. Jinak per-year iterate (acceptable do několika tisíc let).
  const hasIntercalary = config.months.some((m) => m.isIntercalary);
  if (!config.leapYearRule && !hasIntercalary) {
    const yearLen = config.months.reduce((acc, m) => acc + m.daysCount, 0);
    let days = date.year * yearLen;
    for (let i = 0; i < date.monthIndex; i++) {
      days += config.months[i].daysCount;
    }
    return days + (date.day - 1);
  }
  // Leap-aware / lunisolar-aware path.
  let days = 0;
  if (date.year >= 0) {
    for (let y = 0; y < date.year; y++) {
      days += daysInYear(config, y);
    }
  } else {
    for (let y = -1; y >= date.year; y--) {
      days -= daysInYear(config, y);
    }
  }
  for (let i = 0; i < date.monthIndex; i++) {
    days += daysInMonth(i, date.year, config);
  }
  return days + (date.day - 1);
}

/**
 * Inverze `toAbsDay`. Garantuje round-trip:
 *   `toAbsDay(fromAbsDay(n, cfg), cfg) === n`.
 */
export function fromAbsDay(absDay: number, config: CalendarConfig): FantasyDate {
  if (isGregorianLike(config)) {
    let year = Math.floor(absDay / 365.2425);
    while (toAbsDay({ year, monthIndex: 0, day: 1 }, config) > absDay) year--;
    while (toAbsDay({ year: year + 1, monthIndex: 0, day: 1 }, config) <= absDay) year++;
    let remaining = absDay - toAbsDay({ year, monthIndex: 0, day: 1 }, config);
    let monthIndex = 0;
    while (monthIndex < 11) {
      const dim = daysInMonth(monthIndex, year, config);
      if (remaining < dim) break;
      remaining -= dim;
      monthIndex++;
    }
    return { year, monthIndex, day: remaining + 1 };
  }
  const hasIntercalary = config.months.some((m) => m.isIntercalary);
  // Non-Gregorian bez leapYearRule a bez intercalary: fast path.
  if (!config.leapYearRule && !hasIntercalary) {
    const yearLen = config.months.reduce((acc, m) => acc + m.daysCount, 0);
    const year = Math.floor(absDay / yearLen);
    let remaining = absDay - year * yearLen;
    let monthIndex = 0;
    while (monthIndex < config.months.length - 1) {
      const dim = config.months[monthIndex].daysCount;
      if (remaining < dim) break;
      remaining -= dim;
      monthIndex++;
    }
    return { year, monthIndex, day: remaining + 1 };
  }
  // Leap-aware / lunisolar-aware: estimate year via average, doladit ±2 roky.
  const baseYearLen = config.months
    .filter((m) => !m.isIntercalary)
    .reduce((acc, m) => acc + m.daysCount, 0);
  // Average accounting for leap (per rule type) + intercalary contribution.
  let avgLeapDays = 0;
  if (config.leapYearRule) {
    avgLeapDays =
      config.leapYearRule.type === 'every-4'
        ? 0.25
        : config.leapYearRule.type === 'solar-hijri-33'
          ? 8 / 33
          : 11 / 30; // islamic-30
  }
  if (hasIntercalary && config.lunisolar?.type === 'metonic-19') {
    // 7 leap z 19 let → každý leap přidá sum(intercalary daysCount).
    const intercalaryDays = config.months
      .filter((m) => m.isIntercalary)
      .reduce((acc, m) => acc + m.daysCount, 0);
    avgLeapDays +=
      (config.lunisolar.leapYearsInCycle.length / 19) * intercalaryDays;
  }
  const avgYearLen = baseYearLen + avgLeapDays;
  let year = Math.floor(absDay / avgYearLen);
  while (toAbsDay({ year, monthIndex: 0, day: 1 }, config) > absDay) year--;
  while (
    toAbsDay({ year: year + 1, monthIndex: 0, day: 1 }, config) <= absDay
  )
    year++;
  let remaining = absDay - toAbsDay({ year, monthIndex: 0, day: 1 }, config);
  let monthIndex = 0;
  while (monthIndex < config.months.length - 1) {
    const dim = daysInMonth(monthIndex, year, config);
    if (remaining < dim) break;
    remaining -= dim;
    monthIndex++;
  }
  return { year, monthIndex, day: remaining + 1 };
}
