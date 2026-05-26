import type { CountryData } from './types';

/**
 * Real-world katalog — Evropa (40 zemí, ~150 měst).
 *
 * sourceLevel: DOCUMENTED
 * source: Wikipedia climate boxes + Climate Atlas (cross-referenced ze staré DB
 *         c:/Matrix/Matrix/frontend/src/data/weatherData.ts, port 2026-05-26).
 *
 * Per-city/country monthly temperatures jsou roční průměry (cca 1980-2020).
 * Std dev se doplňuje v mapperu (countryToConfig) z Köppen zóny.
 */
export const EUROPE: ReadonlyArray<CountryData> = [
  {
    name: 'Albánie',
    temps: [7, 8, 10, 14, 19, 23, 26, 26, 22, 17, 12, 8],
    cities: ['Tirana', 'Durrës', 'Vlorë', 'Shkodër'],
  },
  {
    name: 'Andorra',
    temps: [4, 5, 7, 9, 13, 17, 21, 21, 17, 13, 8, 5],
    cities: ['Andorra la Vella', 'Escaldes-Engordany'],
  },
  {
    name: 'Belgie',
    temps: [3, 4, 7, 10, 14, 17, 19, 19, 16, 12, 7, 4],
    cities: [
      { name: 'Brusel', temps: [3, 4, 8, 11, 15, 18, 20, 20, 16, 12, 7, 4] },
      'Antverpy',
      'Gent',
      'Bruggy',
    ],
  },
  {
    name: 'Bělorusko',
    temps: [-5, -4, 0, 7, 14, 17, 19, 18, 13, 7, 1, -3],
    cities: ['Minsk', 'Gomel', 'Mogilev'],
  },
  {
    name: 'Bosna a Hercegovina',
    temps: [0, 2, 6, 11, 16, 19, 21, 21, 16, 11, 6, 1],
    cities: ['Sarajevo', 'Banja Luka', 'Tuzla'],
  },
  {
    name: 'Bulharsko',
    temps: [1, 3, 7, 12, 17, 21, 24, 24, 19, 13, 8, 3],
    cities: [
      { name: 'Sofie', temps: [0, 4, 7, 12, 17, 20, 23, 23, 18, 13, 7, 3] },
      'Plovdiv',
      'Varna',
      'Burgas',
    ],
  },
  {
    name: 'Černá Hora',
    temps: [5, 7, 11, 15, 20, 25, 28, 28, 23, 18, 11, 7],
    cities: ['Podgorica', 'Nikšić', 'Herceg Novi'],
  },
  {
    name: 'Česká republika',
    temps: [-1, 1, 5, 10, 15, 18, 20, 19, 15, 10, 4, 0],
    cities: [
      { name: 'Praha', temps: [0, 2, 6, 11, 15, 19, 21, 21, 16, 11, 6, 2] },
      { name: 'Brno', temps: [0, 2, 7, 12, 16, 20, 22, 22, 17, 11, 6, 1] },
      { name: 'Ostrava', temps: [-1, 1, 6, 11, 15, 19, 21, 20, 15, 10, 5, 0] },
      'Plzeň',
      'Liberec',
      'Olomouc',
    ],
  },
  {
    name: 'Dánsko',
    temps: [1, 1, 3, 7, 11, 15, 17, 17, 14, 10, 5, 2],
    cities: [
      { name: 'Kodaň', temps: [1, 2, 5, 9, 13, 17, 19, 19, 15, 11, 7, 3] },
      'Aarhus',
      'Odense',
    ],
  },
  {
    name: 'Estonsko',
    temps: [-3, -4, 0, 6, 11, 15, 18, 17, 12, 7, 2, -1],
    cities: [
      { name: 'Tallinn', temps: [-3, -4, -1, 5, 10, 15, 18, 17, 13, 8, 3, -1] },
      'Tartu',
      'Narva',
    ],
  },
  {
    name: 'Finsko',
    temps: [-6, -6, -2, 4, 10, 15, 17, 15, 10, 5, 0, -4],
    cities: [
      { name: 'Helsinky', temps: [-4, -4, -1, 5, 11, 16, 19, 17, 12, 7, 2, -1] },
      'Espoo',
      'Tampere',
      'Vantaa',
      'Oulu',
    ],
  },
  {
    name: 'Francie',
    temps: [5, 6, 9, 11, 15, 19, 21, 21, 18, 14, 9, 6],
    cities: [
      { name: 'Paříž', temps: [5, 6, 9, 13, 16, 19, 21, 21, 17, 13, 8, 5] },
      'Marseille',
      'Lyon',
      'Toulouse',
      'Nice',
      'Nantes',
      'Strasbourg',
    ],
  },
  {
    name: 'Chorvatsko',
    temps: [4, 5, 9, 13, 18, 22, 25, 24, 20, 15, 10, 5],
    cities: [
      { name: 'Záhřeb', temps: [1, 3, 8, 12, 17, 21, 23, 23, 18, 13, 7, 2] },
      'Split',
      'Rijeka',
      'Osijek',
      'Dubrovník',
    ],
  },
  {
    name: 'Irsko',
    temps: [5, 5, 7, 8, 11, 14, 16, 16, 14, 11, 8, 6],
    cities: [
      { name: 'Dublin', temps: [5, 6, 8, 9, 12, 15, 17, 16, 14, 11, 9, 7] },
      'Cork',
      'Limerick',
      'Galway',
    ],
  },
  {
    name: 'Island',
    temps: [0, 1, 1, 3, 6, 9, 11, 10, 7, 4, 1, 0],
    cities: [
      { name: 'Reykjavík', temps: [0, 1, 1, 4, 7, 10, 12, 11, 8, 5, 2, 0] },
      'Kópavogur',
      'Hafnarfjörður',
    ],
  },
  {
    name: 'Itálie',
    temps: [8, 9, 12, 15, 19, 23, 26, 26, 22, 18, 13, 9],
    cities: [
      { name: 'Řím', temps: [8, 9, 12, 15, 19, 23, 27, 27, 23, 18, 13, 9] },
      'Milán',
      'Neapol',
      'Turín',
      'Palermo',
      'Janov',
      'Bologna',
      'Florencie',
    ],
  },
  {
    name: 'Kosovo',
    temps: [0, 2, 7, 12, 17, 21, 24, 24, 19, 13, 7, 2],
    cities: ['Priština', 'Prizren', 'Peć'],
  },
  {
    name: 'Lichtenštejnsko',
    temps: [0, 2, 6, 10, 14, 17, 19, 19, 15, 11, 5, 2],
    cities: ['Vaduz', 'Schaan'],
  },
  {
    name: 'Litva',
    temps: [-3, -3, 1, 7, 13, 16, 18, 17, 13, 8, 3, -1],
    cities: [
      { name: 'Vilnius', temps: [-3, -3, 1, 7, 13, 16, 18, 17, 13, 8, 3, -2] },
      'Kaunas',
      'Klaipėda',
    ],
  },
  {
    name: 'Lotyšsko',
    temps: [-3, -3, 1, 6, 11, 15, 18, 17, 12, 7, 2, -1],
    cities: [
      { name: 'Riga', temps: [-3, -3, 1, 6, 11, 16, 18, 17, 13, 8, 3, -1] },
      'Daugavpils',
      'Liepāja',
    ],
  },
  {
    name: 'Lucembursko',
    temps: [2, 3, 6, 9, 13, 16, 19, 19, 15, 11, 6, 3],
    cities: ['Lucemburk', 'Esch-sur-Alzette'],
  },
  {
    name: 'Maďarsko',
    temps: [0, 2, 7, 12, 17, 20, 22, 22, 17, 12, 6, 1],
    cities: [
      { name: 'Budapešť', temps: [0, 2, 7, 12, 17, 21, 23, 23, 18, 12, 6, 1] },
      'Debrecín',
      'Segedín',
      'Miskolc',
    ],
  },
  {
    name: 'Malta',
    temps: [13, 13, 14, 17, 21, 24, 28, 28, 25, 22, 18, 14],
    cities: ['Valletta', 'Birkirkara', 'Mosta'],
  },
  {
    name: 'Moldavsko',
    temps: [-2, 0, 5, 12, 18, 21, 23, 22, 17, 11, 5, 0],
    cities: ['Kišiněv', 'Bălți', 'Tiraspol'],
  },
  {
    name: 'Monako',
    temps: [10, 10, 12, 14, 17, 21, 24, 24, 21, 17, 13, 11],
    cities: ['Monako', 'Monte Carlo'],
  },
  {
    name: 'Německo',
    temps: [1, 2, 5, 9, 14, 17, 19, 19, 15, 10, 5, 2],
    cities: [
      { name: 'Berlín', temps: [0, 2, 6, 11, 15, 18, 20, 20, 16, 11, 6, 2] },
      'Hamburk',
      'Mnichov',
      'Kolín nad Rýnem',
      'Frankfurt nad Mohanem',
      'Stuttgart',
      'Düsseldorf',
      'Dortmund',
      'Essen',
      'Lipsko',
    ],
  },
  {
    name: 'Nizozemsko',
    temps: [3, 3, 6, 9, 13, 16, 18, 18, 15, 11, 7, 4],
    cities: [
      { name: 'Amsterdam', temps: [4, 4, 7, 10, 14, 17, 19, 19, 16, 12, 8, 5] },
      'Rotterdam',
      'Haag',
      'Utrecht',
      'Eindhoven',
    ],
  },
  {
    name: 'Norsko',
    temps: [-4, -4, -1, 4, 9, 13, 16, 15, 10, 5, 0, -3],
    cities: [
      { name: 'Oslo', temps: [-3, -2, 2, 7, 12, 16, 19, 18, 13, 7, 2, -2] },
      'Bergen',
      'Trondheim',
      'Stavanger',
    ],
  },
  {
    name: 'Polsko',
    temps: [-1, 0, 4, 9, 14, 17, 19, 19, 14, 9, 4, 0],
    cities: [
      { name: 'Varšava', temps: [-2, -1, 3, 9, 15, 18, 20, 19, 14, 9, 4, -1] },
      'Krakov',
      'Lodž',
      'Vratislav',
      'Poznaň',
      'Gdaňsk',
    ],
  },
  {
    name: 'Portugalsko',
    temps: [11, 12, 14, 15, 18, 21, 23, 24, 22, 19, 15, 12],
    cities: [
      { name: 'Lisabon', temps: [12, 13, 15, 17, 19, 22, 24, 24, 23, 20, 16, 13] },
      'Porto',
      'Vila Nova de Gaia',
      'Amadora',
    ],
  },
  {
    name: 'Rakousko',
    temps: [-1, 1, 5, 10, 15, 18, 20, 19, 15, 10, 4, 0],
    cities: [
      { name: 'Vídeň', temps: [1, 3, 7, 12, 17, 20, 22, 22, 17, 12, 6, 2] },
      'Štýrský Hradec',
      'Linec',
      'Salcburk',
      'Innsbruck',
    ],
  },
  {
    name: 'Rumunsko',
    temps: [-2, 0, 5, 11, 17, 21, 23, 22, 17, 11, 5, -1],
    cities: [
      { name: 'Bukurešť', temps: [0, 3, 7, 12, 17, 22, 24, 24, 19, 13, 7, 2] },
      'Kluž',
      'Temešvár',
      'Jasy',
    ],
  },
  {
    name: 'Rusko',
    temps: [-6, -5, 0, 8, 15, 19, 21, 19, 13, 6, 0, -4],
    cities: [
      { name: 'Moskva', temps: [-6, -6, 0, 7, 13, 17, 20, 18, 12, 6, 0, -4] },
      'Petrohrad',
      'Novosibirsk',
      'Jekatěrinburg',
      'Kazaň',
      'Nižnij Novgorod',
    ],
  },
  {
    name: 'Řecko',
    temps: [10, 10, 12, 16, 20, 25, 28, 28, 24, 19, 15, 11],
    cities: [
      { name: 'Athény', temps: [10, 10, 12, 16, 21, 26, 29, 29, 25, 20, 15, 11] },
      'Soluň',
      'Patras',
      'Heraklion',
    ],
  },
  {
    name: 'San Marino',
    temps: [5, 6, 9, 12, 17, 21, 24, 24, 19, 14, 10, 6],
    cities: ['San Marino', 'Serravalle'],
  },
  {
    name: 'Severní Makedonie',
    temps: [1, 4, 8, 13, 18, 23, 26, 26, 21, 15, 8, 2],
    cities: ['Skopje', 'Bitola', 'Kumanovo'],
  },
  {
    name: 'Slovensko',
    temps: [-2, 0, 4, 10, 15, 18, 20, 20, 16, 10, 4, 0],
    cities: [
      { name: 'Bratislava', temps: [-3, 0, 5, 11, 16, 20, 22, 22, 17, 11, 5, 0] },
      'Košice',
      'Prešov',
      'Žilina',
      'Banská Bystrica',
      'Nitra',
    ],
  },
  {
    name: 'Slovinsko',
    temps: [0, 2, 6, 11, 16, 19, 21, 21, 17, 12, 6, 1],
    cities: [
      { name: 'Lublaň', temps: [2, 4, 7, 11, 15, 20, 23, 21, 17, 13, 7, 3] },
      'Maribor',
      'Celje',
      'Kranj',
    ],
  },
  {
    name: 'Spojené království',
    temps: [5, 5, 7, 9, 13, 16, 18, 18, 15, 11, 8, 5],
    cities: [
      { name: 'Londýn', temps: [6, 6, 8, 11, 14, 17, 19, 19, 16, 13, 9, 7] },
      'Birmingham',
      'Manchester',
      'Glasgow',
      'Leeds',
      'Liverpool',
      'Edinburgh',
    ],
  },
  {
    name: 'Srbsko',
    temps: [1, 3, 7, 12, 17, 20, 22, 22, 18, 13, 7, 2],
    cities: [
      { name: 'Bělehrad', temps: [1, 4, 10, 15, 19, 24, 26, 27, 21, 15, 9, 3] },
      'Novi Sad',
      'Niš',
      'Kragujevac',
    ],
  },
  {
    name: 'Španělsko',
    temps: [6, 7, 10, 12, 16, 21, 25, 25, 21, 16, 10, 7],
    cities: [
      { name: 'Madrid', temps: [6, 8, 11, 13, 17, 23, 26, 26, 22, 16, 10, 7] },
      'Barcelona',
      'Valencie',
      'Sevilla',
      'Zaragoza',
      'Málaga',
    ],
  },
  {
    name: 'Švédsko',
    temps: [-3, -3, 0, 5, 11, 16, 18, 17, 12, 7, 2, -1],
    cities: [
      { name: 'Stockholm', temps: [-2, -2, 1, 6, 11, 16, 19, 18, 14, 9, 4, -1] },
      'Göteborg',
      'Malmö',
      'Uppsala',
    ],
  },
  {
    name: 'Švýcarsko',
    temps: [0, 2, 6, 10, 14, 18, 20, 19, 15, 11, 5, 1],
    cities: [
      { name: 'Curych', temps: [0, 2, 5, 9, 14, 17, 20, 19, 15, 11, 5, 0] },
      'Ženeva',
      'Basilej',
      'Bern',
      'Lausanne',
    ],
  },
  {
    name: 'Ukrajina',
    temps: [-4, -3, 2, 9, 15, 19, 21, 20, 15, 9, 2, -2],
    cities: [
      { name: 'Kyjev', temps: [-4, -2, 3, 12, 18, 23, 24, 24, 18, 10, 4, -1] },
      'Charkov',
      'Oděsa',
      'Dnipro',
      'Doněck',
      'Záporoží',
      'Lvov',
    ],
  },
  {
    name: 'Vatikán',
    temps: [7, 8, 12, 15, 19, 23, 26, 26, 22, 17, 12, 8],
    cities: ['Vatikán'],
  },
];
