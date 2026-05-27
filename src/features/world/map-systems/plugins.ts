/**
 * 10.2-prep-3 — plugin definice per herní systém.
 *
 * V této fázi obsahuje jen system metadata (`id`, `label`, `defaultDice`).
 * Komponenty (`NpcEditModal`, `NpcStatBlock`) + `rollSkill` se doplní:
 *   - MVP 1 (10.2d/e) — NPC modaly + stat blocky
 *   - MVP 4 (10.2j) — rollSkill přes 6.3 dice engine
 *
 * Strategie 1 soubor se všemi stuby místo 13 zvlášť — méně boilerplate,
 * kompaktnější import surface. Až komponenty přijdou, lze split do
 * `plugins/<id>.tsx` per systém.
 *
 * Spec: docs/takticka-mapa-matrix.md §23.2.
 */
import type { MapSystemPlugin } from './types';

export const matrixPlugin: MapSystemPlugin = {
  id: 'matrix',
  label: 'Matrix (default)',
  defaultDice: ['fate'],
};

export const cocPlugin: MapSystemPlugin = {
  id: 'coc',
  label: 'Call of Cthulhu 7e',
  defaultDice: ['d100'],
};

export const dnd5ePlugin: MapSystemPlugin = {
  id: 'dnd5e',
  label: 'Dungeons & Dragons 5e',
  defaultDice: ['d20', 'mixed'],
};

export const drd2Plugin: MapSystemPlugin = {
  id: 'drd2',
  label: 'Dračí doupě II',
  defaultDice: ['d6', 'd10'],
};

export const drd16Plugin: MapSystemPlugin = {
  id: 'drd16',
  label: 'Dračí doupě 1.6',
  defaultDice: ['d6'],
};

export const drdhPlugin: MapSystemPlugin = {
  id: 'drdh',
  label: 'Dračí doupě Hrdinové',
  defaultDice: ['d6'],
};

export const drdplusPlugin: MapSystemPlugin = {
  id: 'drdplus',
  label: 'Dračí doupě+',
  defaultDice: ['d6'],
};

export const fatePlugin: MapSystemPlugin = {
  id: 'fate',
  label: 'Fate',
  defaultDice: ['fate'],
};

export const piPlugin: MapSystemPlugin = {
  id: 'pi',
  label: 'Příběhy Impéria',
  defaultDice: ['fate'],
};

export const gurpsPlugin: MapSystemPlugin = {
  id: 'gurps',
  label: 'GURPS',
  defaultDice: ['d6'], // typicky 3d6, v UI se sčítají
};

export const jadPlugin: MapSystemPlugin = {
  id: 'jad',
  label: 'JaD',
  defaultDice: ['d10'],
};

export const shadowrunPlugin: MapSystemPlugin = {
  id: 'shadowrun',
  label: 'Shadowrun',
  defaultDice: ['d6'],
};

export const genericPlugin: MapSystemPlugin = {
  id: 'generic',
  label: 'Obecný (custom schema)',
  defaultDice: ['d20'],
};
