import { MOON_EPOCH_REFERENCE_ABSDAY } from '../gregorianDefault';
import { buildPreset } from './calibration';
import type { CalendarPreset } from './types';

/**
 * Staroegyptský civilní — historicky 365 dní **bez přestupů**.
 * Postupně driftoval vůči ročním obdobím („wandering year"). Pro koptskou
 * návaznost používáme stejné měsíce, ale pevně 365 dní. Letopočet =
 * regnal years (rok vlády panovníka) — PJ může v editoru upravit.
 *
 * Anchor (0, 8, 17) = rok 0 (PJ ho upraví na rok panovníka), pashons 17.
 */
export const EGYPTIAN_CIVIL_PRESET: CalendarPreset = buildPreset({
  slug: 'egyptian-civil',
  name: 'Staroegyptský civilní',
  description:
    '13 měsíců (12×30 + 5 epagomenálních), 365 dní pevně bez přestupů. Letopočet = regnal years.',
  category: 'historicky',
  hoursPerDay: 24,
  daysOfWeek: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], // dekáda
  months: [
    { name: 'thout (akhet I)',  daysCount: 30 },
    { name: 'paopi (akhet II)', daysCount: 30 },
    { name: 'hathor (akhet III)', daysCount: 30 },
    { name: 'koiak (akhet IV)', daysCount: 30 },
    { name: 'tobi (peret I)',   daysCount: 30 },
    { name: 'meshir (peret II)', daysCount: 30 },
    { name: 'paremhat (peret III)', daysCount: 30 },
    { name: 'parmouti (peret IV)', daysCount: 30 },
    { name: 'pashons (šemu I)', daysCount: 30 },
    { name: 'paoni (šemu II)',  daysCount: 30 },
    { name: 'epip (šemu III)',  daysCount: 30 },
    { name: 'mesori (šemu IV)', daysCount: 30 },
    { name: 'epagomenální', daysCount: 5 },
  ],
  // Bez leapYearRule — staroegyptský civilní fixně 365 dní.
  celestialBodies: [
    {
      id: 'moon',
      name: 'Měsíc',
      orbitalPeriodDays: 29.5306,
      color: '#c0c8d0',
      epochOffset: MOON_EPOCH_REFERENCE_ABSDAY,
    },
    {
      id: 'sirius',
      name: 'Sirius',
      orbitalPeriodDays: 365.25,
      color: '#e8f4f8',
      epochOffset: MOON_EPOCH_REFERENCE_ABSDAY,
    },
  ],
  seasons: [
    { id: 'akhet', name: 'Akhet (Záplavy)', startMonthIndex: 0, startDay: 1, color: '#0288d1', icon: '🌊' },
    { id: 'peret', name: 'Peret (Růst)',    startMonthIndex: 4, startDay: 1, color: '#7cb342', icon: '🌱' },
    { id: 'shemu', name: 'Šemu (Sklizeň)',  startMonthIndex: 8, startDay: 1, color: '#fbc02d', icon: '🌾' },
  ],
  // PJ řekl „modelově dle koptské návaznosti 17. pašons / období šemu".
  // Použijeme stejný month index jako Coptic (8) a den 17, rok 0 (PJ upraví na regnal).
  anchor: { year: 0, monthIndex: 8, day: 17 },
  note:
    'Letopočet je modelově rok 0 = anchor. V editoru ho můžeš změnit na rok panovníka (např. „rok 5 vlády Ramesse II"). Kalendář bez přestupů → drift vůči ročním obdobím (historicky 1 rok / 1460 let — sothický cyklus).',
});
