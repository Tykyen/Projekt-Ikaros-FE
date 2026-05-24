/**
 * 8.7b — Preset pro Jeskyně a draci (JaD).
 * Český port D&D 5e — světlá parchment paleta, 18 dovedností, spell tabs.
 */
import type { DiarySystemPreset } from '../types';
import { JadSheet } from '../sheets/jad/JadSheet';

export const jadPreset: DiarySystemPreset = {
  id: 'jad',
  name: 'Jeskyně a draci',
  description:
    'Český port D&D 5e. Světlá parchment paleta s koženými akcenty, ' +
    '6 atributů, 18 dovedností, záchrany, kouzla 0.–9. stupně.',
  SystemSheet: JadSheet,
  loadStyles: () => import('../styles/jad.css'),
};
