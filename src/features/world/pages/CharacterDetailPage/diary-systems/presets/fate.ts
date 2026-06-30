/**
 * Preset pro Fate Core.
 *
 * Vzhled „Karty osudu" (stará slonovina + sépiové serify), sdílený s FAE
 * (styles/fate.css scoped na `fate` i `fae`). Liší se JEDINÝ blok: Core =
 * volné Dovednosti + žebříček (FAE = 6 fixních Přístupů). Vše ostatní
 * (Hlavní koncept + Problém + aspekty, Triky, Stres, Následky, Obnova, Deník)
 * sdílí `_shared/FateLikeSheet.tsx`. Data v customData s prefixem `fate_*`.
 */
import type { DiarySystemPreset } from '../types';
import { FateSheet } from '../sheets/fate/FateSheet';

export const fatePreset: DiarySystemPreset = {
  id: 'fate',
  name: 'Fate Core',
  description:
    'Karty osudu (slonovina + sépiové serify). Dovednosti se žebříčkem + ' +
    'Hlavní koncept + Problém + aspekty, Triky, Stres (sized boxy), Následky ' +
    '(2/4/6) a Obnova. Data v customData s prefixem `fate_*`.',
  SystemSheet: FateSheet,
  loadStyles: () => import('../styles/fate.css'),
};
