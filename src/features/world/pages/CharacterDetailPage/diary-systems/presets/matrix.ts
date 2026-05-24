/**
 * 8.7n — Preset pro Matrix RPG (vlastní herní systém projektu Matrix/Ikaros).
 *
 * Cyberpunk-magie setting s navy pozadím + modrými akcenty (#6b8cff) +
 * fialovou pro magii (#a855f7) + Rajdhani titulky. 6 sekcí (Overview /
 * Vitals s penalty stripy / Přetlaky / Jazyky / Schopnosti s magic flag /
 * Aspekty s Nabitý/Vybitý chip / Výbava textarea).
 *
 * Data v customData s prefixem `matrix_*` — mapping z přímých polí
 * `Character` entity legacy projektu (name, bornWhere, magicGene,
 * abilityPoints, fatePoints, health, magicHealth, armor, tiredness,
 * overPressure, languages, aspects, abilities, inventory).
 */
import type { DiarySystemPreset } from '../types';
import { MatrixSheet } from '../sheets/matrix/MatrixSheet';

export const matrixPreset: DiarySystemPreset = {
  id: 'matrix',
  name: 'Matrix RPG',
  description:
    'Vlastní herní systém projektu Matrix/Ikaros — cyberpunk + magie. ' +
    'Životy s penalty (max 5) + Runa + Vesta + Únava (max 25) + 4 ' +
    'přetlaky × 5 segmentů + jazyky (TagValue) + 21 magických schopností ' +
    's auto-detection (✦ icon) + aspekty Nabitý/Vybitý chip + výbava.',
  SystemSheet: MatrixSheet,
  loadStyles: () => import('../styles/matrix.css'),
};
