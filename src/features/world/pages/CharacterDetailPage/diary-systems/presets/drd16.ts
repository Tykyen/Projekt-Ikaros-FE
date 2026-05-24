/**
 * 8.7l — Preset pro Dračí doupě 1.6 (Drd16).
 *
 * SCOPE NOTE: Matrix/Matrix má 13 class-specific modulů (Warrior/Ranger/
 * Thief/Wizard/Alchemy/Theurg/AlchemyItems/NonMagicItems/SwordsmanFints/
 * RangerSpells/WizardData/ThiefData/ThiefConstants) — ~17k řádků kódu +
 * 100KB data files (spell database, thief skill tabulky). Tato iterace
 * (8.7l) implementuje **base sheet** (atributy, HP/mana trackery, weapons
 * tables, skills, defense, encumbrance, povolání select, textarea pro
 * spells & special abilities). Class-specific moduly = budoucí iterace
 * 8.7n+ (každý modul samostatný sub-spec). PJ v Ikarosu vyplňuje
 * specializace ručně.
 */
import type { DiarySystemPreset } from '../types';
import { Drd16Sheet } from '../sheets/drd16/Drd16Sheet';

export const drd16Preset: DiarySystemPreset = {
  id: 'drd16',
  name: 'Dračí doupě 1.6',
  description:
    'Klasická Jeskyně — warm medieval amber téma (#d4892c). 7 primárních + ' +
    '5 sekundárních vlastností s auto-bonusy (DrdBonus formule), HP/Mana ' +
    'trackery s ±1/±5 tlačítky, melee + ranged zbraně + dovednosti tabulky, ' +
    '15 povolání select, defense box, textareas pro spells/special abilities. ' +
    'Class-specific moduly (warrior finty, wizard spell DB, thief skill tabulky) ' +
    '= budoucí iterace 8.7n+.',
  SystemSheet: Drd16Sheet,
  loadStyles: () => import('../styles/drd16.css'),
};
