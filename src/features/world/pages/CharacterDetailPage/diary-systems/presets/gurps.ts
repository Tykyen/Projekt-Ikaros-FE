/**
 * 8.7g — Preset pro GURPS.
 */
import type { DiarySystemPreset } from '../types';
import { GurpsSheet } from '../sheets/gurps/GurpsSheet';

export const gurpsPreset: DiarySystemPreset = {
  id: 'gurps',
  name: 'GURPS',
  description:
    'Universal Cold-Steel Blue téma. 6 hlavních atributů, HP/FP, encumbrance, ' +
    'výhody/nevýhody, reakční modifikátory, jazyky, melee + ranged zbraně, inventory.',
  SystemSheet: GurpsSheet,
  loadStyles: () => import('../styles/gurps.css'),
};
