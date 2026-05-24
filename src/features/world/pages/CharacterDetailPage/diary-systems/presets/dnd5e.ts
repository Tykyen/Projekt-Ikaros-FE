/**
 * 8.7d — Preset pro Dungeons & Dragons 5e.
 * Elegantní light-fantasy parchment, Cinzel serif, 3-sloupcový layout
 * (atributy + saves + skills | combat + HP + attacks | personality + features).
 */
import type { DiarySystemPreset } from '../types';
import { DndSheet } from '../sheets/dnd5e/DndSheet';

export const dnd5ePreset: DiarySystemPreset = {
  id: 'dnd5e',
  name: 'Dungeons & Dragons 5e',
  description:
    'Klasický D&D 5e deník. 6 atributů, 18 dovedností (česky), záchrany, ' +
    'kouzla 0.–9. úrovně se sloty (pips), Death Saves, útoky/zbraně, ' +
    'personality + schopnosti.',
  SystemSheet: DndSheet,
  loadStyles: () => import('../styles/dnd5e.css'),
};
