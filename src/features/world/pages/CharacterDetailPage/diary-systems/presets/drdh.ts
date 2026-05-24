/**
 * 8.7e — Preset pro Dračí Hlídku (DrdH).
 * Heroic Golden téma, 6 povolání (Válečník, Hraničář, Alchymista, Kouzelník,
 * Zloděj, Klerik), každé má vlastní sekundární zdroj a profession-tabulku.
 */
import type { DiarySystemPreset } from '../types';
import { DrdhSheet } from '../sheets/drdh/DrdhSheet';

export const drdhPreset: DiarySystemPreset = {
  id: 'drdh',
  name: 'Dračí Hlídka',
  description:
    'Heroic golden téma, 5 atributů, 6 povolání (Válečník, Hraničář, ' +
    'Alchymista, Kouzelník, Zloděj, Klerik) — každé s vlastním sekundárním ' +
    'zdrojem (Adrenalin / Duševní síla / Mana + Suroviny / Mana / Kostýmy / ' +
    'Přízeň) a vlastní profession-tabulkou (triky / kouzla / recepty / prosby).',
  SystemSheet: DrdhSheet,
  loadStyles: () => import('../styles/drdh.css'),
};
