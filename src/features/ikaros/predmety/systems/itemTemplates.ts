/**
 * 21.5e — šablony statbloků předmětů per herní systém (spec-21.5e §4).
 *
 * Klíčový mechanismus (spec R1): DRUH předmětu z JÁDRA řídí VARIANTU polí —
 * `weapon` (zbraň, střelná/vrhací) · `armor` (zbroj, štít) · `general`
 * (vše ostatní vč. vlastního druhu). Všechny varianty mají zapnuté volné
 * páry popisek:hodnota (spec R3 — předměty jsou nejrozmanitější doména).
 *
 * Šablony = superset zbraní/zbrojí z deníků (Drd16Weapon/Armor, DrdhWeapon/
 * Armor, GurpsMelee/Ranged, CocWeapon, DndWeapon/JadWeapon) → budoucí import
 * do výbavy postavy bez převodníku. Reuse infrastruktury kouzel (typy polí,
 * editor `SpellStatsFields`, view `SpellStatblockView`).
 */
import type {
  SpellFieldDef,
  SpellSystemTemplate,
} from '../../kouzla/systems/spellTemplates';

export {
  SPELL_EXTRA_KEY as ITEM_EXTRA_KEY,
  spellExtras as itemExtras,
  validateSpellStats as validateItemStats,
  formatSpellValue as formatItemValue,
} from '../../kouzla/systems/spellTemplates';
export type {
  SpellFieldDef as ItemFieldDef,
  SpellSystemTemplate as ItemSystemTemplate,
} from '../../kouzla/systems/spellTemplates';

/** Skupina polí statbloku odvozená z druhu předmětu (spec R1). */
export type ItemKindGroup = 'weapon' | 'armor' | 'general';

/** Druhy předmětů (jádro, combo = nabídka + vlastní text) → skupina polí. */
export const ITEM_KINDS: { label: string; group: ItemKindGroup }[] = [
  { label: 'zbraň', group: 'weapon' },
  { label: 'střelná/vrhací zbraň', group: 'weapon' },
  { label: 'zbroj', group: 'armor' },
  { label: 'štít', group: 'armor' },
  { label: 'oděv', group: 'general' },
  { label: 'nástroj', group: 'general' },
  { label: 'šperk', group: 'general' },
  { label: 'spotřební', group: 'general' },
  { label: 'kouzelný předmět', group: 'general' },
  { label: 'jiné', group: 'general' },
];

/** Druh (i vlastní text) → skupina polí. Neznámý druh = obecná pole. */
export function itemKindGroup(kind: string): ItemKindGroup {
  const k = kind.trim().toLowerCase();
  return ITEM_KINDS.find((x) => x.label === k)?.group ?? 'general';
}

interface ItemSystemVariants {
  id: string;
  label: string;
  weapon: SpellFieldDef[];
  armor: SpellFieldDef[];
  general: SpellFieldDef[];
}

const cenaVaha: SpellFieldDef[] = [
  { key: 'price', label: 'Cena', type: 'text' },
  { key: 'weight', label: 'Váha', type: 'text' },
];

// DnD 5e / JaD — vlastnosti zbraní (překlad d20.cz / JaD SRD).
const DND_WEAPON_PROPS = [
  'lehká',
  'těžká',
  'všestranná',
  'vytříbená',
  'dvouruční',
  'dosahová',
  'vrhací',
  'dostřelná',
  'nabíjecí',
];
// Kouzelné předměty — volitelná trojice ve všech variantách (spec R4).
const DND_MAGIC: SpellFieldDef[] = [
  {
    key: 'rarity',
    label: 'Vzácnost (kouzelný předmět)',
    type: 'select',
    options: ['běžný', 'neobvyklý', 'vzácný', 'velmi vzácný', 'legendární'],
  },
  { key: 'attunement', label: 'Vyžaduje naladění', type: 'checkbox' },
  { key: 'magic', label: 'Magické vlastnosti', type: 'textarea' },
];

function dnd5eLike(rangePh: string): Omit<ItemSystemVariants, 'id' | 'label'> {
  return {
    weapon: [
      { key: 'damage', label: 'Zranění', type: 'text', required: true, placeholder: '1k8 sečné' },
      { key: 'props', label: 'Vlastnosti', type: 'multicheck', options: DND_WEAPON_PROPS },
      { key: 'range', label: 'Dostřel', type: 'text', placeholder: rangePh },
      ...cenaVaha,
      ...DND_MAGIC,
    ],
    armor: [
      { key: 'ac', label: 'OČ', type: 'text', required: true, placeholder: '14 + Obr (max 2)' },
      {
        key: 'category',
        label: 'Kategorie',
        type: 'select',
        options: ['lehká', 'střední', 'těžká', 'štít'],
      },
      { key: 'stealthDis', label: 'Nevýhoda k Nenápadnosti', type: 'checkbox' },
      { key: 'strReq', label: 'Požadavek Síly', type: 'text', placeholder: 'Síla 13' },
      ...cenaVaha,
      ...DND_MAGIC,
    ],
    general: [
      ...cenaVaha,
      { key: 'usage', label: 'Použití', type: 'textarea' },
      ...DND_MAGIC,
    ],
  };
}

/** Varianty polí per systém. Volná šablona = všechny tři prázdné (jen páry). */
export const ITEM_SYSTEM_TEMPLATES: ItemSystemVariants[] = [
  { id: 'generic', label: 'Obecný / vlastní', weapon: [], armor: [], general: [] },
  { id: 'dnd5e', label: 'D&D 5e', ...dnd5eLike('dostřel 6/18') },
  {
    id: 'drd16',
    label: 'Dračí doupě 1.6',
    // Tabulky zbraní DrD 1.6 (útok/obrana/délka/váha/cena); superset deníku.
    weapon: [
      { key: 'attack', label: 'Útočnost', type: 'text', required: true, placeholder: '4+1' },
      { key: 'defense', label: 'Obrana zbraně (OZ)', type: 'text', placeholder: '-2' },
      { key: 'length', label: 'Délka', type: 'text', placeholder: '1' },
      { key: 'weight', label: 'Váha (mn)', type: 'text', placeholder: '20' },
      { key: 'price', label: 'Cena', type: 'text', placeholder: '32 zl' },
      { key: 'range', label: 'Dostřel (malý/střední/velký)', type: 'text', placeholder: '20/40/80' },
    ],
    armor: [
      { key: 'quality', label: 'Kvalita zbroje', type: 'text', required: true, placeholder: '3' },
      { key: 'weight', label: 'Váha (mn)', type: 'text' },
      { key: 'price', label: 'Cena', type: 'text' },
    ],
    general: [
      { key: 'weight', label: 'Váha (mn)', type: 'text' },
      { key: 'price', label: 'Cena', type: 'text' },
      { key: 'usage', label: 'Použití', type: 'textarea' },
    ],
  },
  { id: 'drd2', label: 'Dračí doupě II', weapon: [], armor: [], general: [] },
  {
    id: 'drdplus',
    label: 'Dračí doupě+',
    // ⚠️ přesné názvy sloupců doladit na živých datech (spec §4).
    weapon: [
      { key: 'attack', label: 'Útočnost', type: 'text' },
      { key: 'damage', label: 'Zranění', type: 'text' },
      { key: 'parry', label: 'Kryt', type: 'text' },
      { key: 'length', label: 'Délka', type: 'text' },
      ...cenaVaha,
    ],
    armor: [
      { key: 'protection', label: 'Ochrana', type: 'text' },
      { key: 'restriction', label: 'Omezení', type: 'text' },
      ...cenaVaha,
    ],
    general: [...cenaVaha, { key: 'usage', label: 'Použití', type: 'textarea' }],
  },
  { id: 'jad', label: 'Jeskyně a draci', ...dnd5eLike('dostřel 6/18 sáhů') },
  {
    id: 'drdh',
    label: 'Dračí hlídka',
    // Superset deníku (DrdhWeapon atk/dmg/def + kind, DrdhArmor quality/zo).
    weapon: [
      {
        key: 'type',
        label: 'Typ',
        type: 'select',
        required: true,
        options: ['na blízko', 'na dálku'],
      },
      { key: 'attack', label: 'Útočnost', type: 'text', required: true, placeholder: '+2' },
      { key: 'damage', label: 'Zranění', type: 'text', required: true, placeholder: '1k6+2' },
      { key: 'defense', label: 'Obrana', type: 'text', placeholder: '+1' },
      ...cenaVaha,
    ],
    armor: [
      { key: 'quality', label: 'Kvalita', type: 'text' },
      { key: 'zo', label: 'Základ obrany (ZO)', type: 'text', required: true, placeholder: '4' },
      ...cenaVaha,
    ],
    general: [...cenaVaha, { key: 'usage', label: 'Použití', type: 'textarea' }],
  },
  { id: 'pi', label: 'Příběhy impéria', weapon: [], armor: [], general: [] },
  {
    id: 'matrix',
    label: 'Matrix',
    // ⚠️ vlastní systém projektu — pole potvrdit s autorem.
    weapon: [...cenaVaha, { key: 'effect', label: 'Účinek', type: 'textarea' }],
    armor: [...cenaVaha, { key: 'effect', label: 'Účinek', type: 'textarea' }],
    general: [...cenaVaha, { key: 'effect', label: 'Účinek', type: 'textarea' }],
  },
  {
    id: 'coc',
    label: 'Volání Cthulhu',
    // Superset deníku (CocWeapon skill/dmg/attacks/range/ammo/malf).
    weapon: [
      { key: 'skill', label: 'Dovednost', type: 'text', required: true, placeholder: 'Stř. zbraně (Pistole)' },
      { key: 'damage', label: 'Zranění', type: 'text', required: true, placeholder: '1k10' },
      { key: 'attacks', label: 'Útoky / kolo', type: 'text', placeholder: '1 (3)' },
      { key: 'range', label: 'Dostřel', type: 'text', placeholder: '15 m' },
      { key: 'ammo', label: 'Náboje', type: 'text', placeholder: '8' },
      { key: 'malf', label: 'Porucha', type: 'text', placeholder: '100' },
      { key: 'price', label: 'Cena', type: 'text' },
    ],
    armor: [
      { key: 'armor', label: 'Zbroj (body)', type: 'text', required: true, placeholder: '1' },
      { key: 'price', label: 'Cena', type: 'text' },
    ],
    general: [
      { key: 'price', label: 'Cena', type: 'text' },
      { key: 'era', label: 'Éra', type: 'text', placeholder: '20. léta / současnost' },
      { key: 'usage', label: 'Použití / účinek', type: 'textarea' },
    ],
  },
  {
    id: 'gurps',
    label: 'GURPS',
    // Superset deníku (GurpsMelee dmg/reach/parry, GurpsRanged dmg/acc/range/shots).
    weapon: [
      { key: 'damage', label: 'Zranění', type: 'text', required: true, placeholder: 'sw+1 sečné' },
      { key: 'reach', label: 'Dosah / Dostřel', type: 'text', placeholder: '1,2 / 100 m' },
      { key: 'parry', label: 'Kryt (Parry)', type: 'text', placeholder: '0' },
      { key: 'acc', label: 'Přesnost (Acc)', type: 'text', placeholder: '2' },
      { key: 'shots', label: 'Rány', type: 'text', placeholder: '6(2)' },
      { key: 'minst', label: 'Min. Síla (ST)', type: 'text', placeholder: '10' },
      ...cenaVaha,
    ],
    armor: [
      { key: 'dr', label: 'DR', type: 'text', required: true, placeholder: '3' },
      {
        key: 'locations',
        label: 'Lokace',
        type: 'multicheck',
        options: ['hlava', 'trup', 'paže', 'nohy', 'ruce', 'chodidla'],
      },
      ...cenaVaha,
    ],
    general: [
      ...cenaVaha,
      { key: 'tl', label: 'TL (tech level)', type: 'text', placeholder: '3' },
      { key: 'usage', label: 'Použití', type: 'textarea' },
    ],
  },
  {
    id: 'shadowrun',
    label: 'Shadowrun',
    weapon: [
      { key: 'dv', label: 'Poškození (DV)', type: 'text', required: true, placeholder: '3F' },
      { key: 'ar', label: 'Útočné hodnocení', type: 'text', placeholder: '10/10/8/-/-' },
      { key: 'modes', label: 'Režimy palby', type: 'text', placeholder: 'SA/BF' },
      { key: 'ammo', label: 'Zásobník', type: 'text', placeholder: '15(c)' },
      { key: 'avail', label: 'Dostupnost', type: 'text', placeholder: '3(R)' },
      { key: 'price', label: 'Cena', type: 'text', placeholder: '450 ¥' },
    ],
    armor: [
      { key: 'rating', label: 'Hodnocení zbroje', type: 'text', required: true, placeholder: '3' },
      { key: 'avail', label: 'Dostupnost', type: 'text' },
      { key: 'price', label: 'Cena', type: 'text' },
    ],
    general: [
      { key: 'rating', label: 'Hodnocení (rating)', type: 'text' },
      { key: 'essence', label: 'Esence (cyberware)', type: 'text', placeholder: '0.2' },
      { key: 'avail', label: 'Dostupnost', type: 'text' },
      { key: 'price', label: 'Cena', type: 'text' },
    ],
  },
  { id: 'fae', label: 'Fate Accelerated', weapon: [], armor: [], general: [] },
  { id: 'fate', label: 'Fate Core', weapon: [], armor: [], general: [] },
];

/** Šablona pro (systém × druh z jádra). Volné páry vždy zapnuté (spec R3). */
export function getItemTemplate(
  systemId: string,
  kind: string,
): SpellSystemTemplate {
  const sys =
    ITEM_SYSTEM_TEMPLATES.find((t) => t.id === systemId) ??
    ITEM_SYSTEM_TEMPLATES[0]; // generic fallback (neznámý/vlastní systém)
  return {
    id: sys.id,
    label: sys.label,
    freeform: true,
    fields: sys[itemKindGroup(kind)],
  };
}

export function itemSystemLabel(id: string): string {
  return ITEM_SYSTEM_TEMPLATES.find((t) => t.id === id)?.label ?? id;
}
