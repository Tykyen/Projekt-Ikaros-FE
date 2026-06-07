/**
 * 2.3d — Univerzální škála technologické úrovně (TÚ 0–14) pro select „od–do"
 * v create formu. Rozsah se při založení vypíše na stránku Technologie.
 *
 * ⚠️ Názvy jsou duplikované s BE (`technology-template.ts`) — cross-repo import
 * nelze. Při změně názvu uprav obě místa. Jádro úrovní drží jen BE.
 *
 * Viz spec: docs/arch/phase-2/spec-2.3d-technology-seed.md
 */
export interface TechLevelOption {
  level: number;
  name: string;
}

export const TECH_LEVELS: TechLevelOption[] = [
  { level: 0, name: 'Prvotní / předtechnická' },
  { level: 1, name: 'Kmenová / neolitická' },
  { level: 2, name: 'Bronzová / dávnověká' },
  { level: 3, name: 'Železná / antická' },
  { level: 4, name: 'Středověká / feudální' },
  { level: 5, name: 'Renesanční / raný střelný prach' },
  { level: 6, name: 'Parní / raně průmyslová' },
  { level: 7, name: 'Elektrická / dieselová' },
  { level: 8, name: 'Moderní / digitální' },
  { level: 9, name: 'Kyberpunková / blízká budoucnost' },
  { level: 10, name: 'Pokročilá planetární sci-fi' },
  { level: 11, name: 'Meziplanetární' },
  { level: 12, name: 'Mezihvězdná' },
  { level: 13, name: 'Galaktická / postnedostatková' },
  { level: 14, name: 'Transcendentní / božská technologie' },
];

/** Výchozí pásmo nového světa — klasická středověká fantasy. */
export const DEFAULT_TECH_MIN = 4;
export const DEFAULT_TECH_MAX = 4;
