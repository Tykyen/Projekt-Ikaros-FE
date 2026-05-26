/**
 * 9.4 — Globální sety počasních generátorů.
 *
 * PJ stiskne 1 tlačítko „Použít set" → vytvoří N generátorů najednou.
 *
 * sourceLevel: GLOBAL (FE-static). Per-world custom sety jsou v BE collection
 * (`/worlds/:worldId/weather-sets`).
 *
 * ⚠️ PresetID stringy MUSÍ odpovídat přesně klíčům v REAL_WORLD_CATALOG /
 * ARCHETYPE_CATALOG / EXTREMES. Kanonický format definuje `buildAllPresetItems`
 * (modals/wizard/buildPresetItems.ts):
 *   - `city:<Continent>:<Country>:<City>`
 *   - `country:<Continent>:<Country>`
 *   - `archetype:<archetypeId>`
 *   - `extreme:<extremeId>`
 *   - `custom:<id>`  (per-world saved presety, nikdy v GLOBAL setech)
 *
 * Sets jsou ověřeny testem `index.spec.ts` — 0 unresolved presetIds.
 */
import type { WeatherGeneratorSetItem } from '@/shared/types';

// ── Helpery ──────────────────────────────────────────────────────────

function city(
  continent: string,
  country: string,
  cityName: string,
  generatorName?: string,
): WeatherGeneratorSetItem {
  return {
    presetId: `city:${continent}:${country}:${cityName}`,
    generatorName: generatorName ?? cityName,
  };
}

function countryItem(
  continent: string,
  countryName: string,
  generatorName?: string,
): WeatherGeneratorSetItem {
  return {
    presetId: `country:${continent}:${countryName}`,
    generatorName: generatorName ?? countryName,
  };
}

function archetype(
  id: string,
  generatorName: string,
): WeatherGeneratorSetItem {
  return { presetId: `archetype:${id}`, generatorName };
}

// Reserved pro budoucí sety s extrémy (exported aby TS noUnusedLocals neselhal).
export function extreme(id: string, generatorName: string): WeatherGeneratorSetItem {
  return { presetId: `extreme:${id}`, generatorName };
}

export interface GlobalSet {
  id: string;
  name: string;
  description: string;
  emoji: string;
  items: WeatherGeneratorSetItem[];
}

// ── 14 globálních setů ────────────────────────────────────────────────

export const GLOBAL_SETS: readonly GlobalSet[] = [
  {
    id: 'world-tour',
    name: 'Svět komplet',
    description:
      'Top metropole z 6 kontinentů — Praha, Tokio, New York, Káhira, Sydney, Buenos Aires, Reykjavík, Singapur.',
    emoji: '🌍',
    items: [
      city('Evropa', 'Česká republika', 'Praha'),
      city('Asie', 'Japonsko', 'Tokio'),
      city('Severní Amerika', 'USA - Východ', 'New York'),
      city('Afrika', 'Egypt', 'Káhira'),
      city('Austrálie a Oceánie', 'Austrálie', 'Sydney'),
      city('Jižní Amerika', 'Argentina', 'Buenos Aires'),
      city('Evropa', 'Island', 'Reykjavík'),
      city('Asie', 'Singapur', 'Singapur'),
    ],
  },
  {
    id: 'europe',
    name: 'Evropa',
    description:
      'Hlavní evropské metropole — Praha, Berlín, Paříž, Londýn, Řím, Madrid, Athény, Stockholm, Moskva.',
    emoji: '🇪🇺',
    items: [
      city('Evropa', 'Česká republika', 'Praha'),
      city('Evropa', 'Německo', 'Berlín'),
      city('Evropa', 'Francie', 'Paříž'),
      city('Evropa', 'Spojené království', 'Londýn'),
      city('Evropa', 'Itálie', 'Řím'),
      city('Evropa', 'Španělsko', 'Madrid'),
      city('Evropa', 'Řecko', 'Athény'),
      city('Evropa', 'Švédsko', 'Stockholm'),
      city('Evropa', 'Rusko', 'Moskva'),
    ],
  },
  {
    id: 'asia',
    name: 'Asie',
    description:
      'Asijská velkoměsta — Tokio, Peking, Soul, Bangkok, Bombaj, Dubaj, Singapur, Jakarta.',
    emoji: '🌏',
    items: [
      city('Asie', 'Japonsko', 'Tokio'),
      city('Asie', 'Čína', 'Peking'),
      city('Asie', 'Jižní Korea', 'Soul'),
      city('Asie', 'Thajsko', 'Bangkok'),
      city('Asie', 'Indie', 'Bombaj'),
      city('Asie', 'Spojené arabské emiráty', 'Dubaj'),
      city('Asie', 'Singapur', 'Singapur'),
      city('Asie', 'Indonésie', 'Jakarta'),
    ],
  },
  {
    id: 'africa',
    name: 'Afrika',
    description:
      'Africké metropole — Káhira, Lagos, Kapské Město, Nairobi, Casablanca, Addis Abeba.',
    emoji: '🌍',
    items: [
      city('Afrika', 'Egypt', 'Káhira'),
      city('Afrika', 'Nigérie', 'Lagos'),
      city('Afrika', 'Jihoafrická republika', 'Kapské Město'),
      city('Afrika', 'Keňa', 'Nairobi'),
      city('Afrika', 'Maroko', 'Casablanca'),
      city('Afrika', 'Etiopie', 'Addis Abeba'),
    ],
  },
  {
    id: 'north-america',
    name: 'Severní Amerika',
    description:
      'Severoamerické metropole — New York, Los Angeles, Chicago, Toronto, Vancouver, Mexico City.',
    emoji: '🌎',
    items: [
      city('Severní Amerika', 'USA - Východ', 'New York'),
      city('Severní Amerika', 'USA - Západ', 'Los Angeles'),
      city('Severní Amerika', 'USA - Střed', 'Chicago'),
      city('Severní Amerika', 'Kanada', 'Toronto'),
      city('Severní Amerika', 'Kanada', 'Vancouver'),
      city('Severní Amerika', 'Mexiko', 'Mexico City'),
    ],
  },
  {
    id: 'south-america',
    name: 'Jižní Amerika',
    description:
      'Jihoamerické metropole — Buenos Aires, São Paulo, Rio de Janeiro, Lima, Bogotá.',
    emoji: '🌅',
    items: [
      city('Jižní Amerika', 'Argentina', 'Buenos Aires'),
      city('Jižní Amerika', 'Brazílie', 'São Paulo'),
      city('Jižní Amerika', 'Brazílie', 'Rio de Janeiro'),
      city('Jižní Amerika', 'Peru', 'Lima'),
      city('Jižní Amerika', 'Kolumbie', 'Bogotá'),
    ],
  },
  {
    id: 'oceania',
    name: 'Austrálie a Oceánie',
    description:
      'Australasijská metropole — Sydney, Melbourne, Auckland, Wellington.',
    emoji: '🦘',
    items: [
      city('Austrálie a Oceánie', 'Austrálie', 'Sydney'),
      city('Austrálie a Oceánie', 'Austrálie', 'Melbourne'),
      city('Austrálie a Oceánie', 'Nový Zéland', 'Auckland'),
      city('Austrálie a Oceánie', 'Nový Zéland', 'Wellington'),
    ],
  },
  {
    id: 'czechia',
    name: 'Česko',
    description: 'Česká města — Praha, Brno, Ostrava, Plzeň, Liberec.',
    emoji: '🇨🇿',
    items: [
      city('Evropa', 'Česká republika', 'Praha'),
      city('Evropa', 'Česká republika', 'Brno'),
      city('Evropa', 'Česká republika', 'Ostrava'),
      city('Evropa', 'Česká republika', 'Plzeň'),
      city('Evropa', 'Česká republika', 'Liberec'),
    ],
  },
  {
    id: 'mountain',
    name: 'Vysokohorská kampaň',
    description:
      'Vysokohorské lokality — Cusco (3400 m), La Paz (3640 m) + horský klimat Nepálu.',
    emoji: '🏔',
    items: [
      city('Jižní Amerika', 'Peru', 'Cusco'),
      city('Jižní Amerika', 'Bolívie', 'La Paz'),
      // Lhasa (Tibet/Čína) neexistuje v cities — fallback na country-level
      // Nepál (Himálajský klimat).
      countryItem('Asie', 'Nepál', 'Himálaj (Nepál)'),
    ],
  },
  {
    id: 'naval',
    name: 'Mořeplavecká',
    description:
      'Mořská prostředí — otevřený oceán, karibské vody, Severní moře, korálový atol.',
    emoji: '🌊',
    items: [
      archetype('sea-open-ocean', 'Otevřený oceán'),
      archetype('sea-caribbean', 'Karibské vody'),
      archetype('sea-north-sea', 'Severní moře'),
      archetype('sea-coral-atoll', 'Korálový atol'),
    ],
  },
  {
    id: 'mars',
    name: 'Mars expedice',
    description:
      'Marsovské prostředí — celá planeta, Gale Crater (Curiosity site), polární čepička.',
    emoji: '🪐',
    items: [
      archetype('planet-mars', 'Mars (planeta)'),
      archetype('planet-mars-gale-crater', 'Mars: Gale Crater'),
      archetype('planet-mars-polar', 'Mars: polární čepička'),
    ],
  },
  {
    id: 'space-station',
    name: 'Vesmírná stanice',
    description:
      'Vesmírná stanice — ISS, bridge, hydroponics, med-bay, crew quarters, cargo hold.',
    emoji: '🛰',
    items: [
      archetype('station-iss', 'ISS modul'),
      archetype('ship-bridge', 'Bridge (můstek)'),
      archetype('ship-hydroponics', 'Hydroponics'),
      archetype('ship-med-bay', 'Med-bay'),
      archetype('ship-crew-quarters', 'Crew quarters'),
      archetype('ship-cargo-hold', 'Cargo hold'),
    ],
  },
  {
    id: 'spaceship',
    name: 'Vesmírná loď komplet',
    description:
      'Všech 10 vnitřních prostor lodi — od bridge po cryo-bay.',
    emoji: '🚀',
    items: [
      archetype('ship-crew-quarters', 'Crew quarters'),
      archetype('ship-bridge', 'Bridge'),
      archetype('ship-engine-room', 'Engine room'),
      archetype('ship-cargo-hold', 'Cargo hold'),
      archetype('ship-airlock', 'Airlock'),
      archetype('ship-eva-suit-interior', 'EVA suit'),
      archetype('ship-hydroponics', 'Hydroponics'),
      archetype('ship-med-bay', 'Med-bay'),
      archetype('ship-cryo-bay', 'Cryo-bay'),
      archetype('ship-mess-hall', 'Mess hall'),
    ],
  },
  {
    id: 'solar-system',
    name: 'Solar System tour',
    description:
      'Tělesa Sluneční soustavy — Mars, Měsíc, Venuše, Titan, Europa, Enceladus, Pluto, Jupiter.',
    emoji: '☀',
    items: [
      archetype('planet-mars', 'Mars'),
      archetype('planet-moon', 'Měsíc'),
      archetype('planet-venus', 'Venuše'),
      archetype('planet-titan', 'Titan'),
      archetype('planet-europa', 'Europa'),
      archetype('planet-enceladus', 'Enceladus'),
      archetype('planet-pluto', 'Pluto'),
      archetype('planet-jupiter', 'Jupiter'),
    ],
  },
] as const;
