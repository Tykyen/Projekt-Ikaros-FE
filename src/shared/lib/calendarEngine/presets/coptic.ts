import { MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { buildPreset } from './calibration';
import type { CalendarPreset } from './types';

/**
 * Koptský — kalendář egyptských křesťanů. Stejná struktura jako Etiopský
 * (13 měsíců, 12×30 + pi kogi enavot 5/6). Letopočet AM (éra mučedníků,
 * 284 CE = 1 AM). Pi kogi enavot +1 v každém 4. roce.
 */
export const COPTIC_PRESET: CalendarPreset = buildPreset({
  slug: 'coptic',
  name: 'Koptský',
  description:
    'Kalendář egyptských křesťanů (odvozen od staroegyptského). 13 měsíců, letopočet od roku 284 CE.',
  category: 'soucasne-nabozenske',
  hoursPerDay: 24,
  daysOfWeek: [
    'pesnau',     // pondělí
    'pshoment',   // úterý
    'peftoou',    // středa
    'ptiou',      // čtvrtek
    'psoou',      // pátek
    'psabbaton',  // sobota
    'tkyriake',   // neděle
  ],
  months: [
    { name: 'thout',    daysCount: 30 },
    { name: 'paopi',    daysCount: 30 },
    { name: 'hathor',   daysCount: 30 },
    { name: 'koiak',    daysCount: 30 },
    { name: 'tobi',     daysCount: 30 },
    { name: 'meshir',   daysCount: 30 },
    { name: 'paremhat', daysCount: 30 },
    { name: 'parmouti', daysCount: 30 },
    { name: 'pashons',  daysCount: 30 },
    { name: 'paoni',    daysCount: 30 },
    { name: 'epip',     daysCount: 30 },
    { name: 'mesori',   daysCount: 30 },
    { name: 'pi kogi enavot', daysCount: 5 }, // +1 v každém 4. roce
  ],
  leapYearRule: { type: 'every-4', leapMonthIndex: 12 },
  celestialBodies: [
    {
      id: 'moon',
      name: 'Měsíc',
      orbitalPeriodDays: 29.5306,
      color: '#c0c8d0',
      epochOffset: MOON_EPOCH_REFERENCE_ABSDAY,
    },
  ],
  seasons: [
    { id: 'akhet',  name: 'Akhet (Záplavy)',  startMonthIndex: 0, startDay: 1, color: '#0288d1', icon: '🌊' },
    { id: 'peret',  name: 'Peret (Růst)',     startMonthIndex: 4, startDay: 1, color: '#7cb342', icon: '🌱' },
    { id: 'shemu',  name: 'Šemu (Sklizeň)',   startMonthIndex: 8, startDay: 1, color: '#fbc02d', icon: '🌾' },
  ],
  anchor: { year: 1742, monthIndex: 8, day: 17 }, // 17. pashons 1742 AM
});
