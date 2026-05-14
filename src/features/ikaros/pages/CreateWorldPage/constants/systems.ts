/**
 * 2.3 — RPG systémy. `id` se ukládá do `world.system` (volný string).
 * BE `SystemPresetsService.findOne(id)` seedne `diarySchema` z presetu,
 * pokud existuje; jinak prázdné schema (uživatel doplní přes nastavení).
 */
export interface RpgSystem {
  id: string;
  label: string;
}

export const RPG_SYSTEMS: RpgSystem[] = [
  { id: 'matrix',          label: 'Matrix (Klasická TTRPG Pravidla)' },
  { id: 'dnd5e',           label: 'Dungeons & Dragons 5e' },
  { id: 'jad',             label: 'Jeskyně a Draci' },
  { id: 'drd16',           label: 'Dračí Doupě 1.6' },
  { id: 'drd-plus',        label: 'Dračí Doupě Plus' },
  { id: 'drd2',            label: 'Dračí Doupě II' },
  { id: 'draci-hlidka',    label: 'Dračí Hlídka' },
  { id: 'pi',              label: 'Příběhy Impéria' },
  { id: 'shadowrun',       label: 'Shadowrun' },
  { id: 'gurps',           label: 'GURPS' },
  { id: 'fate',            label: 'Fate Core / Accelerated' },
  { id: 'call-of-cthulhu', label: 'Call of Cthulhu' },
  { id: 'vlastni',         label: 'Vlastní Systém' },
];

export const DEFAULT_SYSTEM = 'matrix';
export const SYSTEM_CUSTOM_ID = 'vlastni';
