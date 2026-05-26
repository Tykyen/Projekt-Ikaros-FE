import type { CountryData } from './types';

/**
 * Real-world katalog — Asie (45 zemí, ~140 měst).
 *
 * sourceLevel: DOCUMENTED
 * source: Wikipedia climate boxes + Climate Atlas (cross-referenced ze staré DB
 *         c:/Matrix/Matrix/frontend/src/data/weatherData.ts, port 2026-05-26).
 *
 * Per-city/country monthly temperatures jsou roční průměry (cca 1980-2020).
 * Std dev se doplňuje v mapperu (countryToConfig) z Köppen zóny.
 */
export const ASIA: ReadonlyArray<CountryData> = [
  {
    name: 'Afghánistán',
    temps: [0, 2, 9, 15, 20, 25, 27, 26, 21, 15, 8, 3],
    cities: [
      { name: 'Kábul', temps: [0, 2, 7, 13, 18, 23, 25, 24, 20, 14, 8, 2] },
      { name: 'Kandahár', temps: [6, 9, 14, 20, 26, 30, 32, 29, 24, 18, 11, 7] },
      { name: 'Herát', temps: [4, 6, 11, 17, 22, 27, 29, 27, 22, 16, 9, 5] },
      { name: 'Mazáre Šaríf', temps: [3, 6, 11, 18, 24, 30, 32, 30, 24, 17, 10, 5] },
    ],
  },
  {
    name: 'Arménie',
    temps: [-3, -1, 5, 12, 17, 21, 25, 25, 20, 14, 6, 0],
    cities: [
      { name: 'Jerevan', temps: [-2, 0, 7, 13, 18, 23, 27, 26, 22, 15, 8, 0] },
      'Gjumri',
      'Vanadzor',
    ],
  },
  {
    name: 'Ázerbájdžán',
    temps: [4, 4, 7, 13, 18, 23, 26, 26, 22, 16, 11, 6],
    cities: [
      { name: 'Baku', temps: [6, 6, 9, 14, 20, 25, 28, 28, 24, 18, 12, 8] },
      'Gjandža',
      'Sumqayit',
    ],
  },
  {
    name: 'Bahrajn',
    temps: [17, 18, 21, 26, 31, 34, 35, 35, 33, 29, 24, 19],
    cities: [
      { name: 'Manáma', temps: [17, 19, 22, 27, 31, 34, 35, 35, 33, 29, 25, 20] },
      'Muharrak',
      'Riffa',
    ],
  },
  {
    name: 'Bangladéš',
    temps: [18, 21, 26, 28, 29, 29, 29, 29, 29, 27, 24, 19],
    cities: [
      { name: 'Dháka', temps: [18, 22, 27, 30, 30, 30, 29, 29, 29, 28, 24, 20] },
      { name: 'Čittágong', temps: [20, 23, 26, 29, 29, 28, 28, 28, 28, 28, 25, 21] },
      { name: 'Khulna', temps: [18, 21, 26, 30, 30, 29, 28, 28, 28, 27, 23, 19] },
    ],
  },
  {
    name: 'Bhútán',
    temps: [5, 7, 11, 15, 18, 21, 22, 22, 20, 16, 11, 7],
    cities: [
      { name: 'Thimphu', temps: [6, 8, 11, 14, 17, 20, 21, 21, 19, 15, 10, 7] },
      { name: 'Phuntsholing', temps: [15, 18, 22, 25, 27, 28, 28, 28, 27, 25, 21, 17] },
    ],
  },
  {
    name: 'Brunej',
    temps: [27, 27, 28, 28, 28, 28, 28, 28, 28, 27, 27, 27],
    cities: ['Bandar Seri Begawan'],
  },
  {
    name: 'Čína',
    temps: [-4, -1, 5, 13, 19, 23, 26, 25, 20, 13, 5, -2],
    cities: [
      { name: 'Peking', temps: [-4, -1, 6, 14, 20, 24, 27, 25, 20, 13, 5, -2] },
      { name: 'Šanghaj', temps: [5, 6, 10, 16, 21, 25, 29, 29, 25, 20, 14, 7] },
      { name: 'Kanton', temps: [14, 15, 19, 23, 26, 28, 29, 29, 27, 24, 19, 15] },
      { name: 'Šen-čen', temps: [16, 17, 20, 23, 26, 28, 29, 29, 28, 25, 21, 17] },
      { name: 'Čcheng-tu', temps: [7, 9, 14, 19, 23, 26, 28, 28, 23, 18, 13, 8] },
      { name: 'Wu-chan', temps: [4, 6, 11, 18, 23, 26, 29, 29, 24, 18, 12, 6] },
      { name: 'Si-an', temps: [1, 3, 9, 15, 20, 25, 27, 26, 20, 14, 6, 1] },
      { name: 'Chang-čou', temps: [5, 7, 11, 17, 22, 25, 29, 28, 24, 19, 13, 7] },
      { name: 'Čchung-čching', temps: [8, 10, 15, 20, 24, 26, 29, 29, 24, 19, 14, 10] },
    ],
  },
  {
    name: 'Filipíny',
    temps: [26, 26, 27, 29, 29, 28, 28, 28, 28, 28, 27, 26],
    cities: [
      { name: 'Manila', temps: [26, 27, 28, 30, 30, 29, 28, 28, 28, 28, 27, 26] },
      { name: 'Quezon City', temps: [26, 27, 28, 30, 30, 29, 28, 28, 28, 28, 27, 26] },
      { name: 'Davao', temps: [27, 27, 28, 28, 28, 28, 27, 27, 27, 27, 27, 27] },
      { name: 'Cebu', temps: [27, 27, 28, 29, 30, 29, 28, 28, 28, 28, 28, 27] },
    ],
  },
  {
    name: 'Gruzie',
    temps: [2, 3, 7, 13, 18, 22, 25, 25, 21, 15, 9, 4],
    cities: [
      { name: 'Tbilisi', temps: [3, 4, 8, 13, 18, 22, 25, 25, 21, 15, 9, 5] },
      { name: 'Batumi', temps: [7, 8, 10, 14, 18, 22, 25, 25, 22, 18, 13, 9] },
      'Kutaisi',
    ],
  },
  {
    name: 'Indie',
    temps: [14, 17, 23, 29, 33, 33, 31, 30, 29, 26, 20, 15],
    cities: [
      { name: 'Dillí', temps: [14, 17, 23, 29, 33, 33, 31, 30, 29, 26, 20, 15] },
      { name: 'Bombaj', temps: [24, 25, 27, 29, 30, 29, 28, 27, 27, 28, 28, 25] },
      { name: 'Kalkata', temps: [19, 22, 27, 30, 30, 30, 29, 29, 29, 27, 23, 19] },
      { name: 'Čennaí', temps: [25, 26, 28, 30, 32, 32, 30, 30, 29, 28, 26, 25] },
      { name: 'Bengalúru', temps: [21, 23, 26, 27, 27, 24, 23, 23, 23, 23, 22, 20] },
      { name: 'Hajdarábád', temps: [22, 25, 29, 31, 33, 30, 27, 26, 27, 26, 24, 21] },
      { name: 'Ahmadábád', temps: [20, 23, 28, 32, 34, 33, 30, 29, 29, 28, 25, 21] },
    ],
  },
  {
    name: 'Indonésie',
    temps: [26, 26, 27, 27, 27, 27, 27, 27, 27, 27, 27, 26],
    cities: [
      { name: 'Jakarta', temps: [27, 27, 28, 28, 28, 28, 28, 28, 28, 28, 28, 27] },
      { name: 'Surabaja', temps: [27, 27, 27, 28, 28, 28, 27, 27, 28, 29, 29, 28] },
      { name: 'Bandung', temps: [23, 23, 23, 23, 23, 22, 22, 22, 23, 23, 23, 23] },
      { name: 'Medan', temps: [26, 27, 27, 27, 28, 28, 28, 28, 27, 27, 27, 26] },
    ],
  },
  {
    name: 'Irák',
    temps: [10, 12, 16, 22, 28, 33, 35, 35, 31, 25, 17, 11],
    cities: [
      { name: 'Bagdád', temps: [10, 13, 17, 23, 29, 33, 35, 35, 31, 25, 17, 12] },
      'Basra',
      'Mosul',
      'Erbíl',
    ],
  },
  {
    name: 'Írán',
    temps: [3, 5, 10, 16, 22, 28, 31, 30, 26, 19, 11, 5],
    cities: [
      { name: 'Teherán', temps: [3, 5, 10, 16, 22, 27, 30, 29, 25, 19, 11, 5] },
      { name: 'Mašhad', temps: [1, 3, 8, 14, 20, 25, 28, 26, 21, 15, 8, 3] },
      { name: 'Isfahán', temps: [3, 6, 10, 15, 21, 26, 29, 28, 24, 17, 9, 4] },
      { name: 'Šíráz', temps: [6, 8, 12, 16, 22, 27, 29, 28, 25, 19, 12, 7] },
      'Karadž',
    ],
  },
  {
    name: 'Izrael',
    temps: [9, 10, 13, 17, 21, 24, 26, 26, 24, 21, 16, 11],
    cities: [
      { name: 'Jeruzalém', temps: [9, 10, 12, 16, 20, 23, 24, 24, 23, 20, 15, 11] },
      { name: 'Tel Aviv', temps: [13, 14, 16, 19, 22, 25, 27, 28, 27, 24, 20, 15] },
      { name: 'Haifa', temps: [13, 14, 16, 19, 22, 25, 27, 28, 27, 24, 20, 15] },
    ],
  },
  {
    name: 'Japonsko',
    temps: [5, 6, 9, 14, 19, 22, 26, 27, 23, 18, 12, 8],
    cities: [
      { name: 'Tokio', temps: [6, 7, 10, 15, 20, 23, 27, 28, 24, 19, 13, 8] },
      { name: 'Jokohama', temps: [7, 7, 10, 15, 20, 23, 27, 28, 25, 19, 14, 9] },
      { name: 'Ósaka', temps: [6, 7, 10, 15, 20, 24, 27, 29, 25, 19, 13, 8] },
      { name: 'Nagoja', temps: [4, 5, 9, 14, 19, 23, 27, 28, 24, 19, 13, 7] },
      { name: 'Sapporo', temps: [-4, -3, 1, 7, 12, 17, 21, 22, 18, 11, 4, -2] },
      { name: 'Fukuoka', temps: [7, 8, 11, 15, 20, 23, 27, 28, 24, 19, 13, 9] },
      { name: 'Kóbe', temps: [6, 7, 10, 15, 20, 24, 28, 29, 25, 19, 13, 8] },
      { name: 'Kjóto', temps: [6, 7, 10, 16, 20, 24, 28, 29, 25, 19, 13, 7] },
    ],
  },
  {
    name: 'Jemen',
    temps: [14, 15, 18, 20, 23, 25, 24, 24, 23, 19, 16, 14],
    cities: [
      { name: "San'á", temps: [12, 14, 17, 19, 22, 24, 23, 22, 21, 18, 14, 13] },
      'Aden',
      'Taiz',
    ],
  },
  {
    name: 'Jižní Korea',
    temps: [-2, 0, 6, 13, 18, 22, 25, 26, 21, 15, 7, 0],
    cities: [
      { name: 'Soul', temps: [-3, 0, 5, 11, 16, 21, 24, 25, 20, 14, 7, 0] },
      { name: 'Pusan', temps: [3, 5, 9, 15, 19, 22, 26, 27, 23, 18, 11, 5] },
      { name: 'Inčchon', temps: [-1, 2, 7, 12, 18, 23, 26, 27, 23, 17, 10, 1] },
      { name: 'Tegu', temps: [2, 4, 9, 15, 20, 24, 27, 28, 23, 16, 10, 4] },
    ],
  },
  {
    name: 'Jordánsko',
    temps: [8, 9, 12, 17, 21, 24, 26, 26, 24, 20, 14, 9],
    cities: [
      { name: 'Ammán', temps: [8, 9, 12, 17, 21, 24, 26, 26, 24, 20, 14, 9] },
      'Zarká',
      'Irbid',
    ],
  },
  {
    name: 'Kambodža',
    temps: [26, 27, 29, 30, 29, 28, 28, 28, 27, 27, 26, 26],
    cities: [
      { name: 'Phnompenh', temps: [26, 27, 29, 31, 30, 29, 28, 28, 28, 27, 27, 26] },
      { name: 'Siem Reap', temps: [26, 27, 29, 31, 30, 29, 28, 28, 28, 27, 27, 26] },
      { name: 'Battambang', temps: [26, 27, 29, 31, 30, 29, 28, 28, 28, 27, 27, 26] },
    ],
  },
  {
    name: 'Katar',
    temps: [17, 18, 22, 27, 32, 34, 36, 35, 33, 29, 24, 19],
    cities: [
      { name: 'Dauhá', temps: [17, 18, 21, 26, 31, 34, 35, 34, 32, 29, 24, 19] },
      'Al Rayyan',
      'Umm Salal',
    ],
  },
  {
    name: 'Kazachstán',
    temps: [-14, -13, -5, 7, 15, 21, 23, 21, 15, 6, -4, -11],
    cities: [
      { name: 'Almaty', temps: [-6, -5, 2, 10, 16, 21, 24, 23, 18, 10, 2, -4] },
      { name: 'Nur-Sultan', temps: [-16, -15, -7, 5, 14, 20, 21, 19, 13, 5, -6, -13] },
      'Šymkent',
      'Karaganda',
    ],
  },
  {
    name: 'Kuvajt',
    temps: [13, 15, 20, 26, 32, 36, 38, 37, 34, 28, 20, 14],
    cities: [
      { name: 'Kuvajt', temps: [14, 16, 21, 27, 33, 37, 39, 39, 36, 29, 21, 15] },
      'Al Ahmadi',
      'Hawalli',
    ],
  },
  {
    name: 'Kypr',
    temps: [12, 12, 14, 17, 21, 25, 28, 28, 26, 22, 17, 13],
    cities: [
      { name: 'Nikósie', temps: [12, 12, 14, 18, 22, 27, 29, 29, 26, 22, 17, 13] },
      'Limassol',
      'Larnaka',
    ],
  },
  {
    name: 'Kyrgyzstán',
    temps: [-4, -2, 5, 12, 17, 22, 25, 24, 18, 11, 3, -2],
    cities: [
      { name: 'Biškek', temps: [-3, -1, 6, 13, 18, 23, 26, 25, 20, 13, 5, -1] },
      'Oš',
      'Džalal-Abad',
    ],
  },
  {
    name: 'Laos',
    temps: [21, 23, 26, 28, 28, 28, 27, 27, 27, 26, 24, 21],
    cities: [
      { name: 'Vientiane', temps: [22, 24, 27, 30, 29, 29, 28, 28, 28, 27, 25, 22] },
      { name: 'Pakse', temps: [24, 26, 28, 30, 29, 28, 27, 27, 27, 27, 26, 24] },
      { name: 'Savannakhet', temps: [22, 24, 28, 30, 29, 29, 28, 28, 28, 27, 25, 22] },
    ],
  },
  {
    name: 'Libanon',
    temps: [13, 13, 15, 18, 21, 24, 27, 27, 26, 23, 18, 14],
    cities: [
      { name: 'Bejrút', temps: [13, 13, 15, 18, 21, 24, 27, 28, 27, 24, 19, 15] },
      { name: 'Tripolis', temps: [13, 13, 15, 18, 21, 24, 27, 28, 27, 24, 19, 15] },
      { name: 'Sidon', temps: [11, 12, 15, 19, 23, 26, 28, 28, 27, 24, 18, 13] },
    ],
  },
  {
    name: 'Malajsie',
    temps: [27, 27, 28, 28, 28, 28, 28, 28, 27, 27, 27, 27],
    cities: [
      { name: 'Kuala Lumpur', temps: [27, 27, 28, 28, 28, 28, 28, 28, 27, 27, 27, 27] },
      { name: 'George Town', temps: [27, 27, 28, 28, 28, 28, 28, 28, 27, 27, 27, 27] },
      { name: 'Ipoh', temps: [26, 27, 27, 28, 28, 28, 28, 28, 27, 27, 27, 26] },
      { name: 'Johor Bahru', temps: [26, 27, 27, 28, 28, 28, 27, 27, 27, 27, 27, 26] },
    ],
  },
  {
    name: 'Maledivy',
    temps: [28, 28, 29, 29, 29, 28, 28, 28, 28, 28, 28, 28],
    cities: [
      { name: 'Male', temps: [28, 28, 29, 29, 29, 29, 29, 28, 28, 28, 28, 28] },
      { name: 'Addu City', temps: [28, 28, 29, 29, 29, 29, 29, 28, 28, 28, 28, 28] },
    ],
  },
  {
    name: 'Mongolsko',
    temps: [-21, -17, -7, 2, 10, 16, 18, 16, 10, 1, -11, -19],
    cities: [
      { name: 'Ulánbátar', temps: [-22, -18, -9, 1, 10, 16, 18, 16, 10, 1, -10, -19] },
      { name: 'Erdenet', temps: [-19, -15, -7, 2, 10, 16, 18, 16, 9, 1, -9, -17] },
      { name: 'Darkhan', temps: [-22, -17, -8, 2, 11, 17, 19, 17, 10, 1, -10, -20] },
    ],
  },
  {
    name: 'Myanmar',
    temps: [20, 22, 26, 30, 29, 27, 27, 27, 27, 27, 25, 21],
    cities: [
      { name: 'Rangún', temps: [25, 27, 29, 31, 29, 27, 27, 27, 27, 27, 27, 25] },
      { name: 'Mandalaj', temps: [21, 24, 29, 32, 31, 30, 30, 29, 29, 28, 25, 21] },
      { name: 'Neipyijto', temps: [21, 24, 29, 32, 31, 30, 30, 29, 29, 28, 25, 21] },
    ],
  },
  {
    name: 'Nepál',
    temps: [10, 12, 17, 22, 25, 26, 26, 26, 25, 22, 17, 12],
    cities: [
      { name: 'Káthmándú', temps: [10, 12, 16, 19, 22, 23, 24, 24, 23, 19, 14, 11] },
      { name: 'Pokhara', temps: [13, 15, 19, 23, 25, 26, 26, 26, 25, 21, 16, 13] },
      { name: 'Lalitpur', temps: [10, 12, 16, 19, 22, 23, 24, 24, 23, 19, 14, 11] },
    ],
  },
  {
    name: 'Omán',
    temps: [21, 22, 25, 29, 33, 34, 33, 31, 30, 29, 25, 22],
    cities: [
      { name: 'Maskat', temps: [21, 22, 25, 30, 34, 36, 34, 32, 31, 30, 26, 23] },
      'Salála',
      'Sohár',
    ],
  },
  {
    name: 'Pákistán',
    temps: [13, 16, 21, 27, 32, 34, 33, 32, 31, 27, 21, 15],
    cities: [
      { name: 'Karáčí', temps: [19, 21, 25, 28, 30, 31, 30, 29, 29, 28, 24, 20] },
      { name: 'Lahore', temps: [12, 15, 21, 27, 32, 34, 32, 31, 30, 26, 19, 13] },
      { name: 'Faisalabad', temps: [12, 15, 21, 27, 32, 34, 32, 31, 30, 26, 19, 13] },
      { name: 'Rávalpindí', temps: [10, 13, 17, 23, 28, 32, 31, 30, 28, 23, 16, 11] },
      { name: 'Islámábád', temps: [10, 13, 18, 24, 29, 31, 31, 30, 28, 24, 17, 12] },
    ],
  },
  {
    name: 'Saúdská Arábie',
    temps: [14, 16, 21, 26, 31, 35, 36, 36, 33, 27, 21, 16],
    cities: [
      { name: 'Rijád', temps: [14, 16, 21, 26, 31, 35, 36, 36, 33, 27, 21, 16] },
      { name: 'Džidda', temps: [23, 23, 25, 27, 29, 30, 32, 32, 31, 29, 27, 24] },
      { name: 'Medína', temps: [18, 20, 24, 28, 33, 36, 36, 37, 35, 30, 24, 19] },
      'Mekka',
      'Dammám',
    ],
  },
  {
    name: 'Severní Korea',
    temps: [-6, -3, 3, 10, 16, 20, 23, 24, 19, 12, 5, -3],
    cities: [
      { name: 'Pchjongjang', temps: [-6, -2, 5, 12, 18, 23, 25, 25, 20, 14, 6, -3] },
      { name: 'Hamhung', temps: [-2, -1, 4, 10, 15, 20, 24, 25, 20, 15, 7, 0] },
      { name: 'Čchongdžin', temps: [-7, -5, 1, 8, 14, 18, 22, 23, 19, 12, 4, -5] },
    ],
  },
  {
    name: 'Singapur',
    temps: [27, 27, 28, 28, 29, 29, 29, 29, 28, 28, 27, 27],
    cities: ['Singapur'],
  },
  {
    name: 'Spojené arabské emiráty',
    temps: [19, 20, 23, 27, 31, 33, 35, 35, 33, 29, 25, 21],
    cities: [
      { name: 'Dubaj', temps: [21, 22, 24, 28, 31, 34, 36, 35, 34, 31, 27, 24] },
      'Abú Zabí',
      'Šardžá',
    ],
  },
  {
    name: 'Srí Lanka',
    temps: [27, 27, 28, 28, 28, 28, 28, 28, 28, 27, 27, 27],
    cities: [
      { name: 'Kolombo', temps: [27, 28, 29, 29, 29, 28, 28, 28, 28, 28, 27, 27] },
      { name: 'Kandy', temps: [21, 22, 24, 24, 24, 24, 23, 23, 23, 23, 22, 21] },
      { name: 'Galle', temps: [27, 27, 28, 29, 29, 28, 28, 28, 28, 28, 27, 27] },
    ],
  },
  {
    name: 'Sýrie',
    temps: [7, 9, 13, 17, 22, 27, 30, 30, 26, 20, 13, 8],
    cities: [
      { name: 'Damašek', temps: [7, 9, 13, 17, 22, 27, 30, 30, 26, 20, 13, 8] },
      { name: 'Aleppo', temps: [6, 8, 12, 17, 22, 27, 31, 31, 26, 20, 13, 8] },
      'Homs',
      'Hamá',
    ],
  },
  {
    name: 'Tádžikistán',
    temps: [1, 3, 9, 15, 20, 25, 28, 26, 21, 15, 8, 3],
    cities: [
      { name: 'Dušanbe', temps: [2, 4, 10, 16, 21, 27, 30, 29, 24, 17, 10, 4] },
      { name: 'Chudžand', temps: [2, 4, 10, 17, 23, 28, 30, 28, 23, 16, 9, 4] },
      'Kulob',
    ],
  },
  {
    name: 'Thajsko',
    temps: [26, 28, 30, 31, 30, 29, 29, 29, 28, 28, 27, 26],
    cities: [
      { name: 'Bangkok', temps: [26, 28, 29, 31, 30, 29, 29, 29, 28, 28, 27, 26] },
      { name: 'Nonthaburi', temps: [26, 28, 29, 31, 30, 29, 29, 29, 28, 28, 27, 26] },
      { name: 'Nakhon Ratchasima', temps: [24, 26, 28, 30, 29, 29, 29, 28, 28, 27, 26, 24] },
      { name: 'Čiang Mai', temps: [21, 23, 27, 30, 29, 28, 27, 27, 27, 26, 24, 21] },
    ],
  },
  {
    name: 'Tchaj-wan',
    temps: [16, 17, 19, 22, 25, 27, 29, 29, 27, 24, 21, 18],
    cities: [
      { name: 'Tchaj-pej', temps: [17, 17, 19, 23, 25, 28, 30, 29, 27, 25, 21, 18] },
      { name: 'Kao-siung', temps: [20, 21, 24, 26, 28, 29, 30, 29, 28, 26, 24, 21] },
      { name: 'Tchaj-čung', temps: [16, 17, 20, 23, 26, 28, 29, 28, 27, 25, 21, 18] },
    ],
  },
  {
    name: 'Turecko',
    temps: [3, 5, 8, 13, 17, 22, 25, 25, 21, 16, 10, 5],
    cities: [
      { name: 'Istanbul', temps: [6, 6, 8, 13, 18, 22, 24, 24, 21, 16, 12, 8] },
      { name: 'Ankara', temps: [1, 3, 7, 12, 17, 21, 25, 25, 21, 15, 8, 3] },
      'Izmir',
      'Bursa',
      'Adana',
      'Gaziantep',
      'Antalya',
    ],
  },
  {
    name: 'Turkmenistán',
    temps: [3, 5, 11, 18, 24, 30, 32, 30, 24, 16, 10, 5],
    cities: [
      { name: 'Ašchabad', temps: [4, 6, 11, 18, 24, 30, 32, 30, 25, 17, 10, 5] },
      'Turkmenabat',
      'Daşoguz',
    ],
  },
  {
    name: 'Uzbekistán',
    temps: [1, 4, 10, 17, 23, 28, 30, 28, 22, 15, 8, 3],
    cities: [
      { name: 'Taškent', temps: [2, 4, 10, 16, 22, 27, 29, 27, 22, 15, 8, 3] },
      { name: 'Namangan', temps: [1, 4, 10, 17, 22, 27, 29, 27, 22, 15, 8, 2] },
      'Samarkand',
      'Andižan',
    ],
  },
  {
    name: 'Vietnam',
    temps: [17, 18, 20, 24, 27, 29, 29, 29, 28, 26, 22, 19],
    cities: [
      { name: 'Ho Či Minovo Město', temps: [27, 28, 29, 30, 29, 28, 28, 28, 28, 27, 27, 27] },
      { name: 'Hanoj', temps: [17, 18, 20, 24, 27, 29, 29, 29, 28, 25, 22, 18] },
      { name: 'Haiphong', temps: [16, 17, 20, 23, 27, 29, 29, 28, 27, 25, 22, 17] },
      { name: 'Da Nang', temps: [21, 22, 24, 27, 29, 30, 30, 30, 28, 26, 24, 22] },
    ],
  },
  {
    name: 'Východní Timor',
    temps: [27, 27, 27, 27, 27, 26, 25, 25, 26, 27, 28, 27],
    cities: ['Dili', 'Baucau'],
  },
];
