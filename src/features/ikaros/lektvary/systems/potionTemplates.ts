/**
 * 21.5b — šablony statbloků lektvarů per herní systém (spec-21.5b §4).
 *
 * Jediný zdroj pravdy pro pole lektvaru v každém systému. Reuse infrastruktury
 * kouzel (21.5c): typy polí, editor (`SpellStatsFields`) i view
 * (`SpellStatblockView`) jsou generické nad `SpellSystemTemplate`.
 *
 * Rozdíl proti kouzlům: DRUH lektvaru je v JÁDRU (systémově neutrální,
 * spec R2), statblok nese jen výrobu + mechaniku. Hodnoty = text (vzorce),
 * enum jen uzavřené množiny (vzácnost, forma, spouštěč…).
 */
import type { SpellSystemTemplate } from '../../kouzla/systems/spellTemplates';

export {
  SPELL_EXTRA_KEY as POTION_EXTRA_KEY,
  spellExtras as potionExtras,
  validateSpellStats as validatePotionStats,
  formatSpellValue as formatPotionValue,
} from '../../kouzla/systems/spellTemplates';
export type {
  SpellFieldDef as PotionFieldDef,
  SpellSystemTemplate as PotionSystemTemplate,
} from '../../kouzla/systems/spellTemplates';

/** Druhy lektvarů (jádro, combo = nabídka + vlastní text). */
export const POTION_KINDS = [
  'léčivý',
  'posilující',
  'ochranný',
  'jed',
  'proměnový',
  'iluzorní',
  'poznávací',
  'očarovací',
];

/** Vzácnosti kouzelných předmětů DnD 5e / JaD (překlad d20.cz / JaD SRD). */
const DND_RARITIES = [
  'běžný',
  'neobvyklý',
  'vzácný',
  'velmi vzácný',
  'legendární',
];

/** DnD 5e a JaD sdílí kostru lektvaru (kouzelný předmět + výroba). */
const dnd5eLike: SpellSystemTemplate['fields'] = [
  {
    key: 'rarity',
    label: 'Vzácnost',
    type: 'select',
    required: true,
    options: DND_RARITIES,
  },
  {
    key: 'effect',
    label: 'Účinek (mechanika)',
    type: 'textarea',
    required: true,
    placeholder: 'Obnoví 2k4+2 Bodů výdrže…',
  },
  { key: 'duration', label: 'Trvání', type: 'text', placeholder: '1 hodina / ihned' },
  { key: 'crafting', label: 'Výroba (cena / čas)', type: 'text', placeholder: '50 zl / 1 den' },
];

/**
 * Šablony všech systémů. Pořadí = nabídka v editoru (mirror kouzel).
 */
export const POTION_SYSTEM_TEMPLATES: SpellSystemTemplate[] = [
  {
    id: 'generic',
    label: 'Obecný / vlastní',
    freeform: true,
    fields: [],
  },
  { id: 'dnd5e', label: 'D&D 5e', fields: dnd5eLike },
  {
    id: 'drd16',
    label: 'Dračí doupě 1.6',
    // Oficiální formát alchymistických předmětů (PPZ/PPE).
    fields: [
      { key: 'mana', label: 'Magenergie', type: 'text', required: true, placeholder: '7 magů' },
      { key: 'materials', label: 'Suroviny', type: 'text', required: true, placeholder: '30 zl' },
      {
        key: 'base',
        label: 'Základ',
        type: 'text',
        placeholder: 'křišťálová lahvička (5 mn)',
        hint: 'Co je k výrobě potřeba; v závorce hmotnost v mincích.',
      },
      { key: 'crafting', label: 'Výroba', type: 'text', required: true, placeholder: '1 směna' },
      { key: 'duration', label: 'Trvání', type: 'text', required: true, placeholder: 'ihned / 1 směna' },
      { key: 'trap', label: 'Past', type: 'text', placeholder: 'Odl ~ 5 ~ nic/otrava' },
      { key: 'source', label: 'Zdroj / kniha', type: 'text' },
    ],
  },
  {
    id: 'drd2',
    label: 'Dračí doupě II',
    freeform: true,
    fields: [
      {
        key: 'cost',
        label: 'Zdroje / cena',
        type: 'text',
        placeholder: 'Tělo / Duše / Vliv',
        hint: 'DrD II vaří mastičkář improvizací ze schopností.',
      },
      { key: 'effect', label: 'Účinek', type: 'textarea' },
    ],
  },
  {
    id: 'drdplus',
    label: 'Dračí doupě+',
    freeform: true,
    fields: [
      {
        key: 'effect',
        label: 'Účinek',
        type: 'textarea',
        hint: 'DrD+ oficiálního alchymistu nemá — parametry doplň volnými poli.',
      },
    ],
  },
  { id: 'jad', label: 'Jeskyně a draci', fields: dnd5eLike },
  {
    id: 'drdh',
    label: 'Dračí hlídka',
    // Superset alchymistových receptů z deníku (mana/suroviny/základ/obtížnost).
    fields: [
      { key: 'mana', label: 'Mana', type: 'text', required: true, placeholder: '4' },
      { key: 'materials', label: 'Suroviny', type: 'text', required: true, placeholder: '20 st' },
      { key: 'base', label: 'Základ', type: 'text', placeholder: 'lahvička, bylina' },
      { key: 'difficulty', label: 'Obtížnost', type: 'text', required: true, placeholder: '14' },
      { key: 'crafting', label: 'Výroba', type: 'text', placeholder: '1 hodina' },
      { key: 'duration', label: 'Trvání', type: 'text', placeholder: 'ihned / 6 kol' },
    ],
  },
  {
    id: 'pi',
    label: 'Příběhy impéria',
    freeform: true,
    fields: [],
  },
  {
    id: 'matrix',
    label: 'Matrix',
    fields: [
      { key: 'cost', label: 'Cena / náročnost', type: 'text' },
      { key: 'effect', label: 'Účinek', type: 'textarea' },
      { key: 'duration', label: 'Trvání', type: 'text' },
    ],
  },
  {
    id: 'coc',
    label: 'Volání Cthulhu',
    freeform: true,
    fields: [
      {
        key: 'cost',
        label: 'Náklady',
        type: 'text',
        placeholder: '1k4 bodů příčetnosti; 3 body magie',
        hint: 'Mýtické odvary — náklady na výrobu/pozření dle úsudku Strážce.',
      },
      { key: 'effect', label: 'Účinek', type: 'textarea' },
    ],
  },
  {
    id: 'gurps',
    label: 'GURPS',
    // Elixíry (GURPS Magic, kap. Alchemy).
    fields: [
      {
        key: 'form',
        label: 'Forma',
        type: 'select',
        required: true,
        options: ['lektvar', 'mast', 'prášek', 'pastilka'],
      },
      { key: 'materials', label: 'Cena surovin', type: 'text', required: true, placeholder: '$100' },
      { key: 'crafting', label: 'Doba výroby', type: 'text', required: true, placeholder: '2 týdny' },
      { key: 'duration', label: 'Trvání', type: 'text', required: true, placeholder: '1 hodina' },
      { key: 'prereq', label: 'Dovednost / předpoklad', type: 'text', placeholder: 'Alchemy-12' },
    ],
  },
  {
    id: 'shadowrun',
    label: 'Shadowrun',
    // Alchymistické preparáty (SR6) — CZ termíny doladit při živém testu.
    fields: [
      {
        key: 'trigger',
        label: 'Spouštěč',
        type: 'select',
        required: true,
        options: ['kontaktní', 'povelový', 'časový'],
      },
      { key: 'potency', label: 'Síla (potency)', type: 'text', required: true, placeholder: '4' },
      { key: 'spell', label: 'Založeno na kouzle', type: 'text', placeholder: 'Léčivý dotyk' },
      { key: 'drain', label: 'Odliv', type: 'text', placeholder: '5' },
      { key: 'duration', label: 'Trvání', type: 'text' },
    ],
  },
  { id: 'fae', label: 'Fate Accelerated', freeform: true, fields: [] },
  { id: 'fate', label: 'Fate Core', freeform: true, fields: [] },
];

export function getPotionTemplate(systemId: string): SpellSystemTemplate {
  return (
    POTION_SYSTEM_TEMPLATES.find((t) => t.id === systemId) ??
    POTION_SYSTEM_TEMPLATES[0] // generic fallback (neznámý/vlastní systém)
  );
}

export function potionSystemLabel(id: string): string {
  return POTION_SYSTEM_TEMPLATES.find((t) => t.id === id)?.label ?? id;
}
