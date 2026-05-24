/**
 * 8.7i — Preset pro Fate Core.
 * Neural sleek ledově modré téma (#60a5fa), 2-sloupcový layout
 * (Aspekty / Konflikt / Cíle | Dovednosti / Deník). Sdílí strukturu
 * s PI (Příběhy Impéria) — viz `_shared/FateLikeSheet.tsx`.
 */
import type { DiarySystemPreset } from '../types';
import { FateSheet } from '../sheets/fate/FateSheet';

export const fatePreset: DiarySystemPreset = {
  id: 'fate',
  name: 'Fate Core',
  description:
    'Neural sleek ledově modré téma. 2 sloupce: Aspekty + 5-stavový ' +
    'konflikt tracker + Cíle (dlouhodobé/krátkodobé s checkboxy); ' +
    'Dovednosti se 6-pip trackerem + Deník. Data v customData s ' +
    'prefixem `fate_*`.',
  SystemSheet: FateSheet,
  loadStyles: () => import('../styles/fate.css'),
};
