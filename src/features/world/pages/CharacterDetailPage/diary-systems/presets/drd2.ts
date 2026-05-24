/**
 * 8.7h — Preset pro Dračí doupě 2 (DrD II).
 * Dark Forest Emerald téma. 3 pilíře, mega-boxy, kompletní katalog
 * 264 zvláštních schopností (12 základních × 12 + 10 mistrovských × 12).
 */
import type { DiarySystemPreset } from '../types';
import { Drd2Sheet } from '../sheets/drd2/Drd2Sheet';

export const drd2Preset: DiarySystemPreset = {
  id: 'drd2',
  name: 'Dračí doupě 2',
  description:
    'Dark Forest Emerald. 3 pilíře (Tělo/Duše/Vliv) s jizvami, mega-boxy ' +
    'Ohrožení/Výhoda (64px font), profession-cards (basic/advanced/master) ' +
    's 5-pip level trackerem, ZS tabulka s catalog dropdown z 264 schopností.',
  SystemSheet: Drd2Sheet,
  loadStyles: () => import('../styles/drd2.css'),
};
