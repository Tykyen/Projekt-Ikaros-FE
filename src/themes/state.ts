import { atomWithStorage } from 'jotai/utils';
import { atom } from 'jotai';
import type { ThemeId } from './types';
import { DEFAULT_THEME } from './registry';

export const themeAtom = atomWithStorage<ThemeId>('ikaros.theme', DEFAULT_THEME);
export const worldThemeAtom = atom<ThemeId | null>(null);
