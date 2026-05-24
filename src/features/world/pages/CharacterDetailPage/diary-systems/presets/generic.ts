/**
 * 8.7a — Generic preset: fallback pro světy bez dedikovaného sheetu.
 * Renderuje se přes `DiaryBlockView` z PJ-definovaného schématu (8.5).
 *
 * `SystemSheet` záměrně chybí — provider rozpozná a použije generic flow.
 */
import type { DiarySystemPreset } from '../types';

export const genericPreset: DiarySystemPreset = {
  id: 'generic',
  name: 'Bez dedikovaného deníku',
  description:
    'Generický deník — bloky definuje PJ přes editor šablony (8.5). ' +
    'Vizuál sleduje aktivní skin platformy bez systémových přepisů.',
  loadStyles: () => import('../styles/generic.css'),
};
