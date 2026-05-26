import type { CountryData } from './types';

/**
 * Real-world katalog — Severní, Střední a Jižní Amerika (37 zemí, ~75 měst).
 *
 * sourceLevel: DOCUMENTED
 * source: Wikipedia climate boxes + Climate Atlas (cross-referenced ze staré DB
 *         c:/Matrix/Matrix/frontend/src/data/weatherData.ts, port 2026-05-26).
 *
 * Per-city/country monthly temperatures jsou roční průměry (cca 1980-2020).
 * Std dev se doplňuje v mapperu (countryToConfig) z Köppen zóny.
 *
 * Pozn.: USA jsou ve staré DB rozděleny na 3 makro-regiony (Východ/Střed/Západ),
 * každý s vlastními cities. Tato struktura zůstává — odpovídá rozdílným klimatům
 * (subtropický Miami, subarktický Minneapolis, středomořský San Francisco).
 */
export const NORTH_AMERICA: ReadonlyArray<CountryData> = [
  {
    name: 'Kanada',
    temps: [-10, -8, -2, 6, 12, 17, 21, 20, 15, 8, 1, -6],
    cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton'],
  },
  {
    name: 'Mexiko',
    temps: [14, 15, 18, 20, 21, 20, 19, 19, 19, 18, 16, 14],
    cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Cancún'],
  },
  {
    name: 'USA - Východ',
    temps: [1, 2, 6, 12, 17, 22, 25, 24, 20, 14, 9, 3],
    cities: [
      { name: 'New York', temps: [0, 2, 6, 11, 17, 22, 25, 24, 20, 14, 8, 3] },
      { name: 'Boston', temps: [-1, 0, 4, 9, 15, 20, 24, 23, 19, 13, 7, 2] },
      { name: 'Philadelphia', temps: [1, 3, 7, 13, 18, 23, 26, 25, 21, 15, 9, 3] },
      { name: 'Washington D.C.', temps: [3, 5, 9, 15, 20, 25, 27, 26, 22, 16, 11, 5] },
      { name: 'Miami', temps: [20, 21, 22, 24, 26, 28, 29, 29, 28, 27, 24, 22] },
      { name: 'Atlanta', temps: [7, 9, 13, 17, 22, 26, 27, 27, 24, 18, 13, 8] },
    ],
  },
  {
    name: 'USA - Střed',
    temps: [-3, -1, 5, 11, 17, 22, 25, 24, 20, 13, 6, -1],
    cities: [
      { name: 'Chicago', temps: [-4, -2, 4, 10, 16, 22, 24, 23, 19, 12, 5, -1] },
      { name: 'Houston', temps: [11, 13, 17, 21, 25, 28, 29, 29, 27, 22, 17, 13] },
      { name: 'Dallas', temps: [8, 10, 14, 19, 23, 27, 30, 30, 26, 20, 14, 9] },
      { name: 'St. Louis', temps: [0, 2, 8, 14, 19, 24, 26, 25, 21, 15, 8, 2] },
      { name: 'Minneapolis', temps: [-9, -6, 0, 8, 15, 21, 23, 22, 17, 10, 2, -6] },
      { name: 'Denver', temps: [0, 1, 5, 9, 14, 20, 23, 22, 17, 11, 4, -1] },
    ],
  },
  {
    name: 'USA - Západ',
    temps: [13, 14, 15, 17, 19, 21, 24, 25, 24, 21, 17, 13],
    cities: [
      { name: 'Los Angeles', temps: [13, 14, 16, 17, 18, 20, 22, 23, 22, 20, 17, 14] },
      { name: 'San Francisco', temps: [10, 12, 13, 13, 14, 15, 15, 16, 17, 16, 13, 10] },
      { name: 'Seattle', temps: [5, 6, 8, 11, 14, 17, 20, 20, 17, 12, 8, 5] },
      { name: 'Las Vegas', temps: [9, 12, 16, 20, 25, 30, 34, 33, 29, 21, 13, 8] },
      { name: 'Phoenix', temps: [13, 15, 19, 23, 28, 33, 35, 34, 31, 25, 17, 12] },
      { name: 'Portland', temps: [5, 7, 9, 12, 15, 18, 21, 21, 18, 13, 8, 4] },
      'San Diego',
    ],
  },
];

export const CENTRAL_AMERICA: ReadonlyArray<CountryData> = [
  {
    name: 'Antigua a Barbuda',
    temps: [25, 25, 26, 26, 27, 28, 28, 28, 28, 28, 27, 26],
    cities: [{ name: "Saint John's", temps: [25, 25, 26, 26, 27, 28, 28, 28, 28, 28, 27, 26] }],
  },
  {
    name: 'Bahamy',
    temps: [21, 22, 23, 24, 26, 28, 29, 29, 28, 27, 25, 23],
    cities: [{ name: 'Nassau', temps: [21, 22, 23, 24, 26, 28, 29, 29, 28, 27, 25, 23] }],
  },
  {
    name: 'Barbados',
    temps: [26, 26, 26, 27, 28, 28, 28, 28, 28, 28, 27, 26],
    cities: [{ name: 'Bridgetown', temps: [26, 26, 26, 27, 28, 28, 28, 28, 28, 28, 27, 26] }],
  },
  {
    name: 'Belize',
    temps: [24, 25, 26, 28, 29, 29, 29, 29, 28, 27, 26, 24],
    cities: [
      { name: 'Belize City', temps: [24, 25, 26, 28, 29, 29, 29, 29, 28, 27, 26, 24] },
      { name: 'Belmopan', temps: [23, 24, 26, 28, 30, 29, 28, 29, 28, 27, 25, 23] },
    ],
  },
  {
    name: 'Dominika',
    temps: [25, 25, 26, 27, 28, 28, 28, 28, 28, 28, 27, 26],
    cities: [{ name: 'Roseau', temps: [25, 25, 26, 27, 28, 28, 28, 28, 28, 28, 27, 26] }],
  },
  {
    name: 'Dominikánská republika',
    temps: [24, 24, 25, 26, 27, 28, 28, 28, 28, 27, 26, 24],
    cities: [
      { name: 'Santo Domingo', temps: [25, 25, 26, 26, 27, 28, 28, 28, 28, 28, 27, 25] },
      {
        name: 'Santiago de los Caballeros',
        temps: [23, 23, 24, 25, 26, 27, 28, 28, 28, 27, 25, 23],
      },
    ],
  },
  {
    name: 'Grenada',
    temps: [26, 26, 27, 28, 28, 28, 28, 28, 29, 28, 28, 27],
    cities: [{ name: "Saint George's", temps: [26, 26, 27, 28, 28, 28, 28, 28, 29, 28, 28, 27] }],
  },
  {
    name: 'Guatemala',
    temps: [17, 18, 19, 21, 22, 21, 21, 21, 21, 20, 19, 17],
    cities: [
      { name: 'Guatemala City', temps: [17, 18, 19, 21, 21, 21, 21, 21, 20, 20, 19, 17] },
      { name: 'Quetzaltenango', temps: [13, 13, 14, 15, 16, 16, 16, 16, 15, 15, 14, 13] },
    ],
  },
  {
    name: 'Haiti',
    temps: [26, 26, 27, 28, 28, 29, 30, 30, 29, 29, 28, 26],
    cities: [{ name: 'Port-au-Prince', temps: [26, 26, 27, 28, 28, 29, 30, 30, 29, 29, 28, 26] }],
  },
  {
    name: 'Honduras',
    temps: [22, 23, 25, 27, 27, 26, 26, 26, 26, 25, 23, 22],
    cities: [
      { name: 'Tegucigalpa', temps: [21, 22, 24, 25, 25, 24, 24, 24, 24, 23, 22, 21] },
      { name: 'San Pedro Sula', temps: [24, 25, 27, 29, 30, 29, 28, 29, 29, 27, 25, 24] },
    ],
  },
  {
    name: 'Jamajka',
    temps: [25, 25, 26, 27, 27, 28, 29, 29, 28, 28, 27, 26],
    cities: [
      { name: 'Kingston', temps: [25, 25, 26, 27, 28, 29, 29, 29, 29, 28, 27, 26] },
      { name: 'Montego Bay', temps: [24, 24, 25, 26, 27, 28, 28, 28, 28, 27, 26, 25] },
    ],
  },
  {
    name: 'Kostarika',
    temps: [22, 22, 23, 24, 24, 23, 23, 23, 22, 22, 22, 22],
    cities: [{ name: 'San José', temps: [22, 22, 23, 24, 24, 23, 23, 23, 22, 22, 22, 22] }],
  },
  {
    name: 'Kuba',
    temps: [22, 22, 24, 25, 27, 28, 29, 29, 28, 27, 25, 23],
    cities: [
      { name: 'Havana', temps: [22, 22, 24, 25, 27, 28, 29, 29, 28, 27, 25, 23] },
      { name: 'Santiago de Cuba', temps: [25, 25, 26, 27, 27, 28, 29, 29, 28, 28, 27, 25] },
    ],
  },
  {
    name: 'Nikaragua',
    temps: [26, 27, 28, 30, 29, 27, 27, 27, 27, 27, 27, 26],
    cities: [
      { name: 'Managua', temps: [26, 27, 28, 30, 29, 27, 27, 27, 27, 27, 27, 26] },
      { name: 'León', temps: [27, 28, 29, 31, 29, 27, 27, 28, 27, 27, 27, 26] },
    ],
  },
  {
    name: 'Panama',
    temps: [27, 27, 28, 28, 28, 28, 28, 28, 28, 27, 27, 27],
    cities: [
      { name: 'Panama City', temps: [27, 27, 28, 28, 28, 28, 28, 28, 28, 27, 27, 27] },
      { name: 'Colón', temps: [27, 27, 27, 28, 28, 28, 27, 28, 28, 28, 27, 27] },
    ],
  },
  {
    name: 'Salvador',
    temps: [23, 24, 25, 26, 26, 25, 25, 25, 24, 24, 24, 23],
    cities: [{ name: 'San Salvador', temps: [23, 24, 25, 26, 26, 25, 25, 25, 24, 24, 24, 23] }],
  },
  {
    name: 'Svatá Lucie',
    temps: [26, 26, 26, 27, 28, 28, 28, 28, 28, 28, 27, 26],
    cities: [{ name: 'Castries', temps: [26, 26, 26, 27, 28, 28, 28, 28, 28, 28, 27, 26] }],
  },
  {
    name: 'Svatý Kryštof a Nevis',
    temps: [25, 25, 26, 27, 28, 28, 28, 28, 28, 28, 27, 26],
    cities: [{ name: 'Basseterre', temps: [25, 25, 26, 27, 28, 28, 28, 28, 28, 28, 27, 26] }],
  },
  {
    name: 'Svatý Vincenc a Grenadiny',
    temps: [26, 26, 26, 27, 28, 28, 28, 28, 28, 28, 27, 26],
    cities: [{ name: 'Kingstown', temps: [26, 26, 26, 27, 28, 28, 28, 28, 28, 28, 27, 26] }],
  },
  {
    name: 'Trinidad a Tobago',
    temps: [26, 26, 27, 28, 28, 27, 27, 28, 28, 28, 27, 26],
    cities: [
      { name: 'Port of Spain', temps: [26, 26, 27, 28, 28, 27, 27, 27, 28, 28, 27, 26] },
      { name: 'San Fernando', temps: [26, 26, 27, 28, 28, 28, 28, 28, 28, 28, 27, 26] },
    ],
  },
];

export const SOUTH_AMERICA: ReadonlyArray<CountryData> = [
  {
    name: 'Argentina',
    temps: [25, 23, 21, 17, 14, 11, 11, 13, 15, 18, 21, 24],
    cities: [
      { name: 'Buenos Aires', temps: [24, 23, 21, 18, 14, 11, 11, 12, 14, 17, 20, 23] },
      { name: 'Córdoba', temps: [26, 25, 22, 19, 15, 12, 11, 14, 17, 19, 23, 25] },
      { name: 'Rosario', temps: [25, 24, 22, 19, 15, 12, 12, 13, 15, 18, 22, 24] },
      { name: 'Mendoza', temps: [23, 22, 20, 16, 12, 9, 7, 9, 12, 17, 20, 22] },
    ],
  },
  {
    name: 'Bolívie',
    temps: [9, 9, 9, 8, 6, 5, 5, 6, 8, 9, 10, 9],
    cities: [
      { name: 'La Paz', temps: [9, 9, 9, 8, 7, 6, 6, 7, 8, 9, 10, 9] },
      { name: 'Santa Cruz', temps: [26, 26, 25, 23, 21, 19, 19, 21, 24, 25, 26, 26] },
      { name: 'Sucre', temps: [16, 16, 16, 15, 14, 13, 13, 14, 15, 16, 17, 17] },
    ],
  },
  {
    name: 'Brazílie',
    temps: [27, 27, 27, 26, 24, 23, 23, 24, 25, 26, 26, 27],
    cities: [
      { name: 'São Paulo', temps: [23, 23, 22, 20, 18, 16, 16, 17, 18, 20, 21, 22] },
      { name: 'Rio de Janeiro', temps: [26, 27, 26, 25, 23, 22, 21, 22, 22, 23, 24, 25] },
      { name: 'Brasília', temps: [21, 21, 21, 21, 20, 18, 18, 20, 22, 22, 21, 21] },
      { name: 'Salvador', temps: [26, 27, 27, 26, 25, 24, 24, 24, 24, 25, 26, 26] },
      { name: 'Fortaleza', temps: [27, 27, 27, 27, 27, 26, 26, 26, 27, 27, 27, 27] },
    ],
  },
  {
    name: 'Ekvádor',
    temps: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
    cities: [
      { name: 'Quito', temps: [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14] },
      { name: 'Guayaquil', temps: [26, 26, 26, 26, 25, 24, 24, 24, 24, 24, 24, 25] },
      { name: 'Cuenca', temps: [15, 15, 15, 15, 14, 13, 12, 13, 14, 14, 15, 15] },
    ],
  },
  {
    name: 'Guyana',
    temps: [26, 26, 27, 27, 27, 27, 27, 28, 28, 28, 27, 27],
    cities: [{ name: 'Georgetown', temps: [26, 26, 26, 26, 26, 26, 26, 27, 27, 27, 27, 26] }],
  },
  {
    name: 'Chile',
    temps: [21, 20, 18, 15, 12, 9, 9, 10, 12, 14, 17, 19],
    cities: [
      { name: 'Santiago', temps: [21, 20, 18, 15, 12, 9, 8, 10, 12, 15, 18, 20] },
      { name: 'Valparaíso', temps: [17, 17, 16, 14, 13, 12, 11, 12, 13, 14, 15, 16] },
      { name: 'Concepción', temps: [17, 16, 15, 13, 11, 10, 9, 10, 11, 12, 14, 16] },
    ],
  },
  {
    name: 'Kolumbie',
    temps: [14, 15, 15, 15, 15, 15, 15, 15, 15, 14, 14, 14],
    cities: [
      { name: 'Bogotá', temps: [14, 14, 15, 15, 15, 14, 14, 14, 14, 14, 14, 14] },
      { name: 'Medellín', temps: [22, 22, 22, 22, 22, 22, 22, 22, 22, 21, 21, 21] },
      { name: 'Cali', temps: [24, 24, 24, 24, 24, 24, 24, 25, 24, 24, 23, 23] },
      { name: 'Barranquilla', temps: [27, 27, 28, 28, 29, 29, 29, 29, 28, 28, 28, 27] },
    ],
  },
  {
    name: 'Paraguay',
    temps: [28, 27, 26, 23, 20, 18, 18, 20, 22, 24, 26, 27],
    cities: [
      { name: 'Asunción', temps: [28, 28, 27, 24, 21, 19, 19, 20, 23, 25, 26, 28] },
      { name: 'Ciudad del Este', temps: [26, 26, 25, 22, 19, 17, 17, 19, 21, 24, 25, 26] },
    ],
  },
  {
    name: 'Peru',
    temps: [20, 21, 21, 19, 17, 16, 15, 15, 16, 17, 18, 19],
    cities: [
      { name: 'Lima', temps: [22, 23, 23, 21, 19, 17, 17, 16, 17, 18, 19, 21] },
      { name: 'Arequipa', temps: [15, 15, 15, 15, 14, 14, 13, 14, 15, 15, 15, 16] },
      { name: 'Trujillo', temps: [21, 22, 22, 21, 20, 19, 18, 18, 18, 18, 19, 20] },
      { name: 'Cusco', temps: [11, 11, 11, 11, 10, 9, 9, 10, 11, 12, 12, 12] },
    ],
  },
  {
    name: 'Surinam',
    temps: [26, 27, 27, 27, 27, 27, 27, 28, 29, 29, 28, 27],
    cities: [{ name: 'Paramaribo', temps: [27, 27, 27, 27, 27, 27, 27, 28, 29, 29, 28, 27] }],
  },
  {
    name: 'Uruguay',
    temps: [23, 23, 21, 17, 14, 11, 11, 12, 14, 16, 19, 22],
    cities: [
      { name: 'Montevideo', temps: [23, 23, 21, 18, 15, 12, 11, 12, 14, 16, 19, 22] },
      { name: 'Salto', temps: [25, 24, 23, 20, 16, 12, 12, 14, 17, 20, 22, 24] },
    ],
  },
  {
    name: 'Venezuela',
    temps: [21, 22, 22, 23, 23, 22, 22, 22, 23, 22, 22, 21],
    cities: [
      { name: 'Caracas', temps: [20, 21, 22, 23, 24, 23, 23, 23, 24, 23, 22, 21] },
      { name: 'Maracaibo', temps: [27, 28, 28, 28, 28, 28, 29, 29, 28, 28, 27, 27] },
      { name: 'Valencia', temps: [25, 26, 27, 27, 27, 26, 26, 26, 26, 26, 26, 25] },
    ],
  },
];
