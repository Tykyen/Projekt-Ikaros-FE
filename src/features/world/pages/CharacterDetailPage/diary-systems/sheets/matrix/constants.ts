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
