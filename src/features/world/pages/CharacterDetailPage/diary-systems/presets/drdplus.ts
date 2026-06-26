/**
 * 16.2d — Preset pro Dračí doupě Plus (DrdPlus).
 * „Iluminovaný kodex" — jeden souvislý pergamenový list (Postava / Boj /
 * Na cesty / Profese pod sebou). Povolání se volí erbem; erb řídí akcent
 * listu i proměnlivou sekci Profese (6 povolání: Bojovník, Čaroděj,
 * Hraničář, Kněz, Theurg, Zloděj — vč. formulí, démonů a vazeb theurga).
 */
import type { DiarySystemPreset } from '../types';
import { DrdPlusSheet } from '../sheets/drdplus/DrdPlusSheet';

export const drdplusPreset: DiarySystemPreset = {
  id: 'drdplus',
  name: 'Dračí doupě Plus',
  description:
    'Iluminovaný kodex — jeden list (Postava / Boj / Na cesty / Profese). ' +
    'Povolání se volí erbem a mění barvu listu i spodní proměnlivou sekci ' +
    '(6 povolání s vlastní strukturou, vč. theurgových formulí a démonů).',
  SystemSheet: DrdPlusSheet,
  loadStyles: () => import('../styles/drdplus.css'),
};
