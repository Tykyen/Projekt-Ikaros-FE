/**
 * GURPS 4E — preset deníku.
 */
import type { DiarySystemPreset } from '../types';
import { GurpsSheet } from '../sheets/gurps/GurpsSheet';

export const gurpsPreset: DiarySystemPreset = {
  id: 'gurps',
  name: 'GURPS',
  description:
    'GURPS 4. edice, „cold-steel" téma. ST/DX/IQ/HT + Vůle/Vnímání, HP/FP, ' +
    'škody (Úder/Mách), naložení, zbroj (DR po částech těla), aktivní obrana, ' +
    'dovednosti, výhody/nevýhody/zvláštnosti a auto bodový účet.',
  SystemSheet: GurpsSheet,
  loadStyles: () => import('../styles/gurps.css'),
};
