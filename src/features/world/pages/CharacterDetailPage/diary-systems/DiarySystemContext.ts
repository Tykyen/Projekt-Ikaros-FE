/**
 * 8.7a — Context a hook pro Diary System Preset.
 *
 * Samostatný soubor (ne v Provideru), aby fast-refresh respektoval
 * `react-refresh/only-export-components` pravidlo.
 */
import { createContext, useContext } from 'react';
import type { DiarySystemPreset } from './types';

export interface DiarySystemContextValue {
  preset: DiarySystemPreset;
  /** True po dokončení dynamic importu CSS (nebo hned, pokud preset nemá styles). */
  stylesReady: boolean;
}

export const DiarySystemContext =
  createContext<DiarySystemContextValue | null>(null);

/**
 * Hook pro přístup k aktuálnímu presetu. Musí být zavolán uvnitř
 * `DiarySystemProvider`, jinak throwne.
 */
export function useDiarySystem(): DiarySystemContextValue {
  const ctx = useContext(DiarySystemContext);
  if (!ctx) {
    throw new Error(
      'useDiarySystem must be used inside <DiarySystemProvider>',
    );
  }
  return ctx;
}
