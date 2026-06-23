/**
 * 8.7n — Matrix RPG konstanty.
 *
 * Matrix je vlastní herní systém projektu Matrix/Ikaros (cyberpunk-magie
 * setting). Konstanty 1:1 z `c:/Matrix/Matrix/frontend/src/entities.ts`.
 */

/** Penalty pro životy (4 segmenty: full / -1 / -2 / smrt). */
export const MATRIX_HEALTH_PENALTY: (number | string)[] = [
  0,
  -1,
  -2,
  'smrt',
];

/** Penalty pro únavu (5 segmenty: 0..5 / 6..10 / 11..15 / 16..20 bezvědomí / 21+ smrt). */
export const MATRIX_TIREDNESS_PENALTY: (number | string)[] = [
  0,
  -1,
  -2,
  'bezvědomí',
  'smrt',
];

/** Seznam magických schopností (21) — používá se pro `is-magic` styling. */
export const MATRIX_MAGIC: string[] = [
  'Alchymie',
  'Antimagie',
  'Démonologie',
  'Druidská magie',
  'Exorcismus',
  'Léčebná magie',
  'Magie těla',
  'Nekromancie',
  'Obranná magie',
  'Ohnivá magie',
  'Ovládání energie',
  'Psionika',
  'Rostlinná magie',
  'Stínová magie',
  'Šamanská magie',
  'Teleportační magie',
  'Věštecká magie',
  'Vodní magie',
  'Vzdušná magie',
  'Zemní magie',
  'Zvířecí magie',
];

/** 4 typy přetlaků (Overpressure). */
export const MATRIX_PRESSURE_TYPES = [
  { key: 'physical', label: 'Fyzický' },
  { key: 'magical', label: 'Magický' },
  { key: 'diplomatic', label: 'Diplomatický' },
  { key: 'technical', label: 'Technický' },
] as const;

export interface MatrixTagValue {
  /** Label (např. „Ohnivá magie" pro ability / „Čeština" pro language). */
  label: string;
  /** Hodnota (např. úroveň „1"–„6" pro ability / „C2" pro jazyk / „Nabitý"/„Vybitý" pro aspect). */
  value: string;
}

/**
 * 16.2a — univerzální stupnice úrovní schopností 1–10. Domény si hráč
 * pojmenovává sám, proto jedno měřítko „jak dobře to umí" napříč okruhy.
 * Tooltip u pipů ukazuje tento název.
 */
export const MATRIX_SKILL_LEVELS: Record<number, string> = {
  1: 'Talent',
  2: 'Základní výcvik',
  3: 'Profesionál',
  4: 'Elita',
  5: 'Mistr oboru',
  6: 'Nadlidský',
  7: 'Vrchol smrtelnosti',
  8: 'Entita',
  9: 'Entita',
  10: 'Entita',
};

/** Hráč (PC) = lidský strop 7 pipů; NPC/Bestie = extrém až 10 (entity). */
export const MATRIX_SKILL_MAX_PC = 7;
export const MATRIX_SKILL_MAX_NPC = 10;

/** Název stupně pro tooltip (clamp 1–10). */
export function matrixLevelName(lvl: number): string {
  const k = Math.max(1, Math.min(10, Math.round(lvl)));
  return MATRIX_SKILL_LEVELS[k] ?? '';
}

/**
 * 16.2a — 📘 auto-match: schopnost je magická, pokud se její název shoduje
 * s magií v pravidlech ({@link MATRIX_MAGIC}). Žádný ruční flag.
 */
export function isMatrixMagic(name: string): boolean {
  const n = (name ?? '').trim().toLowerCase();
  return n.length > 0 && MATRIX_MAGIC.some((m) => m.toLowerCase() === n);
}

/** Slug magie-stránky z názvu (odkaz na pravidlo, např. „Magie těla" → „magie-tela"). */
export function matrixMagicSlug(name: string): string {
  return (name ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '-');
}
