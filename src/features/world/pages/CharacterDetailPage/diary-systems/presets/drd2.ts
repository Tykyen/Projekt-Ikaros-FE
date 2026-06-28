/**
 * 16.2e — Preset pro Dračí doupě 2 (DrD II).
 * Fantasy pergamenový list (default skin `fantasy`). Jeden sloučený list:
 * zdroje Tělo/Duše/Vliv (segmentové stupnice), Ohrožení/Výhoda 1–9, zbraně,
 * pomocníci a rituální předměty (seznamy), povolání basic/advanced/master
 * s 5-pip trackerem, ZS zadávané ručně. Katalog ZS je z UI odpojen (ALTAR).
 */
import type { DiarySystemPreset } from '../types';
import { Drd2Sheet } from '../sheets/drd2/Drd2Sheet';

export const drd2Preset: DiarySystemPreset = {
  id: 'drd2',
  name: 'Dračí doupě 2',
  description:
    'Fantasy pergamenový deník DrD II — jeden list: Tělo/Duše/Vliv (klikací ' +
    'stupnice) s jizvami, Ohrožení/Výhoda 1–9, zbraně, pomocníci a rituální ' +
    'předměty (add/remove), povolání basic/advanced/master s úrovněmi, ZS ručně.',
  SystemSheet: Drd2Sheet,
  loadStyles: () => import('../styles/drd2.css'),
};
