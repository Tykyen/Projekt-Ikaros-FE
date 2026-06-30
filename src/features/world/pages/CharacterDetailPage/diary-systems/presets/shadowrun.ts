/**
 * Shadowrun 6e (Sixth World) — preset deníku. Sci-fi „operátorský HUD"
 * (token rodina --mx-*, default skin scifi). Výpočetní jádro: 8 atributů
 * (Tělo/Obratnost/Reakce/Síla/Vůle/Logika/Intuice/Charisma) → odvozené
 * hodnoty (iniciativa, HO, Composure/Odhad/Paměť/Zvedání) + velikosti
 * záznamníků (8+⌈atr/2⌉); zranění (−1/3 boxy) se promítá do dice poolů.
 * Sekce: hero · atributy · odvozené+záznamníky · dovednosti · zbraně/zbroj ·
 * magie/Matrix · augmentace/kvality · kontakty/identita · poznámky.
 * (Peníze = tab Finance, obecný inventář = tab Výbava — v deníku nejsou.)
 */
import type { DiarySystemPreset } from '../types';
import { ShadowrunSheet } from '../sheets/shadowrun/ShadowrunSheet';

export const shadowrunPreset: DiarySystemPreset = {
  id: 'shadowrun',
  name: 'Shadowrun',
  description:
    'Shadowrun 6e — cyberpunk sci-fi HUD. 8 atributů s odvozenými hodnotami, ' +
    'fyzický + omračovací záznamník (−1/3 boxy do poolů), dice-pool dovedností/' +
    'zbraní (atribut + dovednost), Matrix panel (A/M/Z/F + záznamník), kouzla/' +
    'rituály, adeptské síly, augmentace s esencí, zbroj/HO, kvality, kontakty.',
  SystemSheet: ShadowrunSheet,
  loadStyles: () => import('../styles/shadowrun.css'),
};
