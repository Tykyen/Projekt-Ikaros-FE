import type { CountryData } from './types';

/**
 * Real-world katalog — Austrálie a Oceánie (15 zemí, ~20 měst).
 *
 * sourceLevel: DOCUMENTED
 * source: Wikipedia climate boxes + Climate Atlas (cross-referenced ze staré DB
 *         c:/Matrix/Matrix/frontend/src/data/weatherData.ts, port 2026-05-26).
 *
 * Per-city/country monthly temperatures jsou roční průměry (cca 1980-2020).
 * Pozor: jižní hemisféra — měsíční pole stále Jan..Dec, ale teplotně inverze
 * vůči severní hemisféře (leden = léto, červenec = zima).
 * Std dev se doplňuje v mapperu (countryToConfig) z Köppen zóny.
 */
export const OCEANIA: ReadonlyArray<CountryData> = [
  {
    name: 'Austrálie',
    temps: [23, 23, 22, 19, 16, 14, 13, 14, 16, 18, 20, 22],
    cities: [
      { name: 'Sydney', temps: [23, 23, 22, 19, 16, 14, 13, 14, 16, 19, 21, 23] },
      { name: 'Melbourne', temps: [21, 21, 19, 16, 14, 11, 10, 11, 13, 15, 17, 19] },
      { name: 'Brisbane', temps: [26, 26, 25, 23, 20, 18, 17, 18, 20, 22, 24, 25] },
      { name: 'Perth', temps: [25, 25, 23, 20, 17, 15, 14, 14, 16, 18, 21, 23] },
      { name: 'Adelaide', temps: [23, 23, 21, 18, 15, 13, 12, 13, 15, 17, 20, 21] },
      { name: 'Canberra', temps: [21, 20, 18, 14, 10, 7, 6, 8, 10, 13, 16, 19] },
    ],
  },
  {
    name: 'Fidži',
    temps: [27, 27, 27, 26, 25, 24, 23, 23, 24, 25, 26, 26],
    cities: [
      { name: 'Suva', temps: [27, 27, 27, 26, 25, 24, 23, 23, 24, 25, 26, 26] },
      { name: 'Lautoka', temps: [27, 27, 27, 27, 26, 25, 24, 24, 25, 26, 27, 27] },
    ],
  },
  {
    name: 'Kiribati',
    temps: [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    cities: [{ name: 'Tarawa', temps: [28, 28, 28, 28, 28, 29, 28, 29, 29, 29, 28, 28] }],
  },
  {
    name: 'Marshallovy ostrovy',
    temps: [27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27],
    cities: [{ name: 'Majuro', temps: [27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27] }],
  },
  {
    name: 'Mikronésie',
    temps: [27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27],
    cities: [{ name: 'Palikir', temps: [27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27] }],
  },
  {
    name: 'Nauru',
    temps: [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    cities: [{ name: 'Yaren', temps: [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28] }],
  },
  {
    name: 'Nová Kaledonie',
    temps: [26, 26, 25, 24, 22, 21, 20, 20, 21, 22, 24, 25],
    cities: [{ name: 'Nouméa', temps: [26, 26, 25, 23, 22, 21, 20, 20, 21, 23, 24, 26] }],
  },
  {
    name: 'Nový Zéland',
    temps: [17, 17, 16, 13, 11, 9, 8, 9, 11, 12, 14, 16],
    cities: [
      { name: 'Auckland', temps: [20, 20, 19, 16, 14, 12, 11, 12, 13, 15, 17, 18] },
      { name: 'Wellington', temps: [17, 17, 16, 14, 11, 10, 9, 10, 11, 13, 14, 16] },
      { name: 'Christchurch', temps: [17, 17, 15, 12, 9, 6, 6, 7, 9, 11, 14, 16] },
      { name: 'Queenstown', temps: [16, 15, 13, 10, 7, 4, 3, 5, 8, 10, 12, 14] },
    ],
  },
  {
    name: 'Palau',
    temps: [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    cities: [
      { name: 'Ngerulmud', temps: [27, 27, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28] },
      { name: 'Koror', temps: [27, 27, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28] },
    ],
  },
  {
    name: 'Papua Nová Guinea',
    temps: [27, 27, 27, 27, 27, 26, 26, 26, 27, 27, 27, 27],
    cities: [
      { name: 'Port Moresby', temps: [28, 28, 28, 28, 28, 27, 26, 26, 27, 28, 29, 29] },
      { name: 'Lae', temps: [27, 27, 27, 27, 26, 26, 25, 25, 26, 26, 27, 27] },
    ],
  },
  {
    name: 'Samoa',
    temps: [27, 27, 27, 27, 27, 27, 26, 26, 27, 27, 27, 27],
    cities: [{ name: 'Apia', temps: [27, 27, 27, 27, 27, 27, 26, 26, 27, 27, 27, 27] }],
  },
  {
    name: 'Šalamounovy ostrovy',
    temps: [27, 27, 27, 27, 27, 27, 26, 26, 27, 27, 27, 27],
    cities: [{ name: 'Honiara', temps: [27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27] }],
  },
  {
    name: 'Tonga',
    temps: [26, 26, 26, 25, 24, 23, 22, 22, 23, 24, 25, 25],
    cities: [{ name: "Nuku'alofa", temps: [26, 26, 26, 25, 24, 23, 22, 22, 23, 24, 25, 25] }],
  },
  {
    name: 'Tuvalu',
    temps: [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    cities: [{ name: 'Funafuti', temps: [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28] }],
  },
  {
    name: 'Vanuatu',
    temps: [26, 26, 26, 25, 24, 23, 22, 22, 23, 24, 25, 26],
    cities: [{ name: 'Port Vila', temps: [27, 27, 27, 26, 25, 24, 23, 23, 24, 25, 26, 27] }],
  },
];
