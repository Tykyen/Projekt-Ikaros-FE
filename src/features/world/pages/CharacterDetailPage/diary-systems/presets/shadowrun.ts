/**
 * 8.7k — Preset pro Shadowrun.
 * Cyberpunk Neon Magenta + Cyan téma, 2 taby (Postava+Vlastnosti /
 * Matrix+Magie+Boj). 8 hlavních atributů (Tělo/Obratnost/Reakce/Síla/
 * Vůle/Logika/Intuice/Charisma) + speciální (Hrana/Magie/Esence/3×
 * Iniciativa). Condition Tracks s -1 penalty per 3 boxy, Matrix panel
 * s damage track.
 */
import type { DiarySystemPreset } from '../types';
import { ShadowrunSheet } from '../sheets/shadowrun/ShadowrunSheet';

export const shadowrunPreset: DiarySystemPreset = {
  id: 'shadowrun',
  name: 'Shadowrun',
  description:
    'Cyberpunk neon (magenta + cyan). 8 atributů, Condition Tracks ' +
    '(Phys/Stun) s -1 penalty per 3 boxy, Matrix panel (Device + 4 attrs ' +
    '+ programs + 12-box damage), kouzla, augmentace, vozidla, Nuyeny.',
  SystemSheet: ShadowrunSheet,
  loadStyles: () => import('../styles/shadowrun.css'),
};
