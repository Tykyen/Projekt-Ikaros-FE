/**
 * 8.7f — Preset pro Dračí doupě Plus (DrdPlus).
 * Arkanní svět s purpurovými akcenty (#7c5cbf), 4 taby (Postava, Boj, Cesty,
 * Profese), 6 povolání s vlastními inline renderery (Bojovník, Čaroděj,
 * Hraničář, Kněz, Theurg, Zloděj).
 */
import type { DiarySystemPreset } from '../types';
import { DrdPlusSheet } from '../sheets/drdplus/DrdPlusSheet';

export const drdplusPreset: DiarySystemPreset = {
  id: 'drdplus',
  name: 'Dračí doupě Plus',
  description:
    'Arkanní svět s purpurovými akcenty. 6 hlavních + 9 odvozených vlastností, ' +
    '4 taby (Postava / Boj / Cesty / Profese). Poslední tab dynamicky podle ' +
    'volby povolání (6 různých rendererů — Bojovník, Čaroděj, Hraničář, Kněz, ' +
    'Theurg, Zloděj) s vlastní strukturou.',
  SystemSheet: DrdPlusSheet,
  loadStyles: () => import('../styles/drdplus.css'),
};
