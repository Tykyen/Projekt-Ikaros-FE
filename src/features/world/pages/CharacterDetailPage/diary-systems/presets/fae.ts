/**
 * Preset pro Fate Accelerated (FAE).
 *
 * Vzhled „Karty osudu" (sdílený s Fate Core přes styles/fate.css). Liší se
 * JEDINÝ blok: FAE = 6 fixních Přístupů (Pečlivě…Lstivě). Zbytek sdílí
 * `_shared/FateLikeSheet.tsx`. Data v customData s prefixem `fae_*`.
 */
import type { DiarySystemPreset } from '../types';
import { FaeSheet } from '../sheets/fae/FaeSheet';

export const faePreset: DiarySystemPreset = {
  id: 'fae',
  name: 'Fate Accelerated',
  description:
    'Karty osudu (slonovina + sépiové serify). 6 fixních Přístupů ' +
    '(Pečlivě…Lstivě) + Hlavní koncept + Problém + aspekty, Triky, Stres ' +
    '(sized boxy), Následky (2/4/6) a Obnova. Data s prefixem `fae_*`.',
  SystemSheet: FaeSheet,
  loadStyles: () => import('../styles/fate.css'),
};
