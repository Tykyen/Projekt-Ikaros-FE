/**
 * 8.7c — Preset pro Call of Cthulhu 7e.
 * Lovecraftovský parchment, 8 vlastností × 3 stupně (zákl./pol./pět.),
 * 44 dovedností, vitals (HP/MP/Luck/Sanity), 6 status flagů.
 */
import type { DiarySystemPreset } from '../types';
import { CocSheet } from '../sheets/coc/CocSheet';

export const cocPreset: DiarySystemPreset = {
  id: 'coc',
  name: 'Call of Cthulhu 7e',
  description:
    'Lovecraftovský horor s parchmentovou estetikou. ' +
    '8 vlastností × 3 stupně, 44 dovedností (česky), HP/MP/Štěstí/Příčetnost, ' +
    'status flagy (šílenství, bezvědomí, …), bojová tabulka.',
  SystemSheet: CocSheet,
  loadStyles: () => import('../styles/coc.css'),
};
