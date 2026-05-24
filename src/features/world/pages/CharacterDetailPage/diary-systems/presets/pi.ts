/**
 * 8.7j — Preset pro Příběhy Impéria (PI).
 * Victorian Literary Brass téma (#bda989, Merriweather serif).
 * Sdílí strukturu s Fate (FateLikeSheet), liší se prefix data (`pi_*`)
 * a vizuál (brass+serif vs Fate modré+sans).
 */
import type { DiarySystemPreset } from '../types';
import { PiSheet } from '../sheets/pi/PiSheet';

export const piPreset: DiarySystemPreset = {
  id: 'pi',
  name: 'Příběhy Impéria',
  description:
    'Viktoriánské literární brass téma (Merriweather serif, muted gold ' +
    '#bda989). Aspekty postavy, 5-stavový konflikt tracker, dlouhodobé + ' +
    'krátkodobé cíle s checkboxy, dovednosti se 6-pip trackerem, deník. ' +
    'Data v customData s prefixem `pi_*` (legacy z Matrix/Matrix).',
  SystemSheet: PiSheet,
  loadStyles: () => import('../styles/pi.css'),
};
