/**
 * 21.5c — šablony statbloků kouzel per herní systém (spec-21.5c §5).
 *
 * Jediný zdroj pravdy pro pole kouzla v každém systému. BE ukládá
 * `systemStats` schema-less (Record<string, unknown>) — šablonu vynucuje
 * TENTO soubor přes editor (spec R6): přidání systému/pole = jen úprava zde,
 * bez BE migrace.
 *
 * Zásady (spec R2, R3):
 *  - Škola magie je VŽDY první a povinná (`key:'school'`); kde ji systém
 *    nemá, doplňuje autor (combo = nabídka + vlastní text).
 *  - Hodnoty jsou texty (vzorce: „3 magy za blesk", „+16 (6 kol)");
 *    select/checkbox jen u uzavřených množin.
 *  - Volná šablona (`freeform`) = škola + dynamické páry popisek:hodnota
 *    (klíč `extra`) — kouzlo jde založit i bez pevných polí.
 */

export type SpellFieldType =
  | 'text'
  | 'textarea'
  /** Pevná nabídka (uzavřená množina). */
  | 'select'
  /** Nabídka + vlastní text (datalist combobox). */
  | 'combo'
  | 'checkbox'
  /** Více zaškrtnutých hodnot (složky, povolání). */
  | 'multicheck';

export interface SpellFieldDef {
  key: string;
  label: string;
  type: SpellFieldType;
  required?: boolean;
  /** Nabídka pro select/combo/multicheck. */
  options?: string[];
  placeholder?: string;
  /** Krátká nápověda pod polem. */
  hint?: string;
}

export interface SpellSystemTemplate {
  id: string;
  label: string;
  /** Volná šablona — navíc dynamické páry popisek:hodnota (klíč `extra`). */
  freeform?: boolean;
  fields: SpellFieldDef[];
}

/** Klíč dynamických párů volné šablony v `systemStats`. */
export const SPELL_EXTRA_KEY = 'extra';
export interface SpellExtraPair {
  label: string;
  value: string;
}

// ── DrD 1.6 / DrD+ — 6 oborů (magie života · magie hmoty) ──
const DRD16_SCHOOLS = [
  'mentální',
  'vitální',
  'pátrací',
  'časoprostorová',
  'materiální',
  'energetická',
];
const DRDPLUS_SCHOOLS = [
  'mentální',
  'vitální',
  'investigativní',
  'časoprostorová',
  'materiální',
  'energetická',
];

// ── DnD 5e / JaD — 8 škol (překlad d20.cz / JaD) ──
const DND_SCHOOLS = [
  'Věštění',
  'Iluze',
  'Nekromancie',
  'Očarování',
  'Proměny',
  'Vymítání',
  'Vyvolávání',
  'Zaklínání',
];
const DND_CLASSES = [
  'Barbar',
  'Bard',
  'Bojovník',
  'Černokněžník',
  'Druid',
  'Hraničář',
  'Klerik',
  'Kouzelník',
  'Mnich',
  'Paladin',
  'Tulák',
  'Zaklínač',
];
const DND_COMPONENTS = ['V (verbální)', 'P (pohybová)', 'S (surovinová)'];

/** DnD 5e a JaD sdílí kostru — liší se jen terminologie (úroveň/stupeň, jednotky). */
function dnd5eLike(opts: {
  levelLabel: string;
  levelOptions: string[];
  rangePh: string;
  higherLabel: string;
}): SpellFieldDef[] {
  return [
    { key: 'school', label: 'Škola', type: 'select', required: true, options: DND_SCHOOLS },
    {
      key: 'level',
      label: opts.levelLabel,
      type: 'select',
      required: true,
      options: opts.levelOptions,
    },
    { key: 'ritual', label: 'Rituál', type: 'checkbox' },
    { key: 'casting', label: 'Vyvolání', type: 'text', required: true, placeholder: '1 akce / 10 minut' },
    { key: 'range', label: 'Dosah', type: 'text', required: true, placeholder: opts.rangePh },
    { key: 'components', label: 'Složky', type: 'multicheck', options: DND_COMPONENTS },
    {
      key: 'material',
      label: 'Surovina (materiál)',
      type: 'text',
      placeholder: 'rubínový prach v hodnotě 1 500 zl',
    },
    { key: 'duration', label: 'Trvání', type: 'text', required: true, placeholder: '1 hodina / ihned' },
    { key: 'concentration', label: 'Soustředění', type: 'checkbox' },
    { key: 'classes', label: 'Povolání', type: 'multicheck', options: DND_CLASSES },
    { key: 'attack', label: 'Útok / SO', type: 'text', placeholder: 'SO Mou, při úspěchu polovina' },
    { key: 'higher', label: opts.higherLabel, type: 'textarea' },
  ];
}

const levelOptions = (word: string) => [
  'Trik (0)',
  ...Array.from({ length: 9 }, (_, i) => `${i + 1}. ${word}`),
];

/**
 * Šablony všech systémů. Pořadí = nabídka v editoru (mirror BESTIE_SYSTEMS).
 */
export const SPELL_SYSTEM_TEMPLATES: SpellSystemTemplate[] = [
  {
    id: 'generic',
    label: 'Obecný / vlastní',
    freeform: true,
    fields: [
      {
        key: 'school',
        label: 'Škola magie',
        type: 'combo',
        required: true,
        hint: 'Vlastní zařazení — např. ohnivá, ochranná, runová…',
      },
    ],
  },
  {
    id: 'dnd5e',
    label: 'D&D 5e',
    fields: dnd5eLike({
      levelLabel: 'Úroveň',
      levelOptions: levelOptions('úroveň'),
      rangePh: '30 metrů / dotyk',
      higherLabel: 'Na vyšších úrovních',
    }),
  },
  {
    id: 'drd16',
    label: 'Dračí doupě 1.6',
    fields: [
      {
        key: 'school',
        label: 'Škola (druh)',
        type: 'combo',
        required: true,
        options: DRD16_SCHOOLS,
        hint: '1.6 nemá jednotnou taxonomii — vyber druh, nebo napiš vlastní.',
      },
      { key: 'incantation', label: 'Zaklínadlo', type: 'text' },
      { key: 'mana', label: 'Magenergie', type: 'text', required: true, placeholder: '6 mágů / 3 magy za blesk' },
      { key: 'trap', label: 'Past', type: 'text', placeholder: 'Odl ~ 7 ~ polovina' },
      { key: 'range', label: 'Dosah', type: 'text', required: true, placeholder: 'dotek / 30 sáhů' },
      { key: 'scope', label: 'Rozsah', type: 'text', required: true, placeholder: 'jedno mrtvé tělo' },
      { key: 'casting', label: 'Vyvolání', type: 'text', required: true, placeholder: '3 kola' },
      { key: 'duration', label: 'Trvání', type: 'text', required: true, placeholder: 'stále / 6 kol' },
      { key: 'effect', label: 'Působení', type: 'text', placeholder: '1–10 kol' },
      { key: 'source', label: 'Zdroj / kniha', type: 'text', placeholder: 'Kniha Plíživé Smrti' },
    ],
  },
  {
    id: 'drd2',
    label: 'Dračí doupě II',
    freeform: true,
    fields: [
      {
        key: 'school',
        label: 'Okruh (škola)',
        type: 'combo',
        required: true,
        options: [
          'přírodní magie',
          'magie ohně',
          'magie větru',
          'zvířecí magie',
          'psychická magie',
          'kletby',
          'rituální magie',
          'vědmácká znamení',
        ],
        hint: 'DrD II magii improvizuje ze schopností — zařaď dle okruhu povolání.',
      },
      { key: 'cost', label: 'Zdroje / cena', type: 'text', placeholder: 'Tělo / Duše / Vliv' },
      { key: 'difficulty', label: 'Náročnost / Ohrožení', type: 'text' },
      { key: 'effect', label: 'Účinek', type: 'textarea' },
    ],
  },
  {
    id: 'drdplus',
    label: 'Dračí doupě+',
    fields: [
      {
        key: 'school',
        label: 'Obor',
        type: 'select',
        required: true,
        options: DRDPLUS_SCHOOLS,
        hint: 'Magie života: mentální · vitální · investigativní — magie hmoty: časoprostorová · materiální · energetická.',
      },
      { key: 'mana', label: 'Magenergie', type: 'text', required: true, placeholder: '2 mg [3]' },
      {
        key: 'difficulty',
        label: 'Náročnost',
        type: 'textarea',
        required: true,
        placeholder: '+14 → Tloušťka +0\n+17 → Tloušťka +3\n+20 → Tloušťka +6',
        hint: 'Prahy náročnosti → hodnota parametru (řádek na práh).',
      },
      { key: 'casting', label: 'Vyvolání', type: 'text', required: true, placeholder: '+0' },
      { key: 'range', label: 'Dosah', type: 'text', required: true, placeholder: 'dotek' },
      { key: 'scope', label: 'Rozsah', type: 'text', required: true, placeholder: 'stěna' },
      { key: 'duration', label: 'Trvání', type: 'text', required: true, placeholder: '+16 (6 kol)' },
      { key: 'formaAction', label: 'Forma — působení', type: 'select', options: ['Přímá', 'Nepřímá'] },
      { key: 'formaShape', label: 'Forma — projev', type: 'select', options: ['Paprsek', 'Plocha', 'Objem'] },
      { key: 'formaMatter', label: 'Forma — hmota', type: 'select', options: ['Hmotná', 'Nehmotná'] },
      {
        key: 'formaVis',
        label: 'Forma — viditelnost',
        type: 'select',
        options: ['Viditelná', 'Neviditelná'],
      },
    ],
  },
  {
    id: 'jad',
    label: 'Jeskyně a draci',
    fields: dnd5eLike({
      levelLabel: 'Stupeň',
      levelOptions: levelOptions('stupeň'),
      rangePh: '6 sáhů / dotyk',
      higherLabel: 'Na vyšších stupních',
    }),
  },
  {
    id: 'drdh',
    label: 'Dračí hlídka',
    fields: [
      {
        key: 'school',
        label: 'Obor',
        type: 'select',
        required: true,
        options: [
          'Divoká magie',
          'Magie proměn',
          'Mentální magie',
          'Ochranná magie',
          'Vitální magie',
          'Vysoká magie',
        ],
      },
      { key: 'incantation', label: 'Zaklínadlo', type: 'text' },
      {
        key: 'cost',
        label: 'Cena (mana / duš. síla)',
        type: 'text',
        required: true,
        placeholder: '4 many',
        hint: 'Kouzelník platí manou, hraničář duševní silou.',
      },
      { key: 'difficulty', label: 'Obtížnost', type: 'text', required: true, placeholder: '14' },
      { key: 'check', label: 'Ověření', type: 'text', placeholder: 'proti Odolnosti cíle' },
      { key: 'casting', label: 'Vyvolání', type: 'text', required: true, placeholder: '1 akce' },
      { key: 'range', label: 'Dosah', type: 'text', required: true, placeholder: '10 sáhů / —' },
      { key: 'scope', label: 'Rozsah', type: 'text', required: true, placeholder: 'tvor / místo / předmět' },
      { key: 'duration', label: 'Trvání', type: 'text', required: true, placeholder: 'ihned / 6 kol' },
      { key: 'requires', label: 'Vyžaduje', type: 'text', placeholder: 'obory magie / stupeň' },
    ],
  },
  {
    id: 'pi',
    label: 'Příběhy impéria',
    freeform: true,
    fields: [
      {
        key: 'school',
        label: 'Škola / okruh',
        type: 'combo',
        required: true,
        hint: 'Aspektový systém — okruh doplň dle svého světa.',
      },
    ],
  },
  {
    id: 'matrix',
    label: 'Matrix',
    fields: [
      {
        key: 'school',
        label: 'Škola magie',
        type: 'select',
        required: true,
        // 21 magií deníku Matrix (MATRIX_MAGIC).
        options: [
          'Alchymie',
          'Antimagie',
          'Démonologie',
          'Druidská magie',
          'Exorcismus',
          'Léčebná magie',
          'Magie těla',
          'Nekromancie',
          'Obranná magie',
          'Ohnivá magie',
          'Ovládání energie',
          'Psionika',
          'Rostlinná magie',
          'Stínová magie',
          'Šamanská magie',
          'Teleportační magie',
          'Věštecká magie',
          'Vodní magie',
          'Vzdušná magie',
          'Zemní magie',
          'Zvířecí magie',
        ],
      },
      { key: 'cost', label: 'Cena / náročnost', type: 'text' },
      { key: 'range', label: 'Dosah', type: 'text' },
      { key: 'duration', label: 'Trvání', type: 'text' },
    ],
  },
  {
    id: 'coc',
    label: 'Volání Cthulhu',
    fields: [
      {
        key: 'school',
        label: 'Škola / kategorie',
        type: 'combo',
        required: true,
        options: ['mýtická', 'lidová', 'snová'],
        hint: 'CoC školy nemá — zařazení doplň sám.',
      },
      {
        key: 'cost',
        label: 'Náklady',
        type: 'text',
        required: true,
        placeholder: '8 bodů magie; 1k6 bodů příčetnosti',
      },
      { key: 'castingTime', label: 'Doba sesílání', type: 'text', required: true, placeholder: '1 kolo / 2 hodiny' },
      { key: 'altNames', label: 'Alternativní jména', type: 'text' },
      { key: 'deeper', label: 'Hlubší varianty', type: 'textarea' },
    ],
  },
  {
    id: 'gurps',
    label: 'GURPS',
    fields: [
      {
        key: 'school',
        label: 'Kolej (škola)',
        type: 'combo',
        required: true,
        options: [
          'vzduch',
          'země',
          'oheň',
          'voda',
          'zvířata',
          'ovládání těla',
          'komunikace a empatie',
          'tvoření a lámání',
          'očarování',
          'jídlo',
          'brány',
          'léčení',
          'iluze a tvoření',
          'poznání',
          'světlo a tma',
          'meta-kouzla',
          'mysl',
          'pohyb',
          'nekromantická',
          'rostliny',
          'ochrana a varování',
          'zvuk',
          'technologická',
          'počasí',
        ],
      },
      {
        key: 'class',
        label: 'Třída',
        type: 'select',
        options: ['Obyčejné', 'Plošné', 'Střela', 'Blokovací', 'Informační', 'Odporované'],
      },
      {
        key: 'cost',
        label: 'Cena (seslání / udržování)',
        type: 'text',
        required: true,
        placeholder: '4 / 2',
      },
      { key: 'castTime', label: 'Doba seslání', type: 'text', required: true, placeholder: '1 s' },
      { key: 'duration', label: 'Trvání', type: 'text', required: true, placeholder: '1 minuta' },
      { key: 'prereq', label: 'Předpoklady', type: 'text', placeholder: 'Magery 1, Světlo' },
    ],
  },
  {
    id: 'shadowrun',
    label: 'Shadowrun',
    fields: [
      {
        key: 'school',
        label: 'Kategorie',
        type: 'select',
        required: true,
        options: ['Bojová', 'Detekční', 'Léčebná', 'Iluzní', 'Manipulační'],
      },
      { key: 'type', label: 'Typ', type: 'select', required: true, options: ['Many (M)', 'Fyzické (F)'] },
      {
        key: 'range',
        label: 'Dosah',
        type: 'select',
        required: true,
        options: ['Dotyk', 'Přímá viditelnost', 'Přímá viditelnost (oblast)', 'Vlastní'],
      },
      {
        key: 'duration',
        label: 'Trvání',
        type: 'select',
        required: true,
        options: ['Okamžité', 'Udržované', 'Permanentní'],
      },
      { key: 'drain', label: 'Odliv', type: 'text', required: true, placeholder: '5' },
      { key: 'damage', label: 'Poškození', type: 'text', placeholder: 'F / O' },
    ],
  },
  {
    id: 'fae',
    label: 'Fate Accelerated',
    freeform: true,
    fields: [
      {
        key: 'school',
        label: 'Škola / okruh',
        type: 'combo',
        required: true,
        hint: 'Aspektový systém — přidej aspekt, přístup, cenu bodu osudu…',
      },
    ],
  },
  {
    id: 'fate',
    label: 'Fate Core',
    freeform: true,
    fields: [
      {
        key: 'school',
        label: 'Škola / okruh',
        type: 'combo',
        required: true,
        hint: 'Aspektový systém — přidej aspekt, dovednost, cenu bodu osudu…',
      },
    ],
  },
];

export function getSpellTemplate(systemId: string): SpellSystemTemplate {
  return (
    SPELL_SYSTEM_TEMPLATES.find((t) => t.id === systemId) ??
    SPELL_SYSTEM_TEMPLATES[0] // generic fallback (neznámý/vlastní systém)
  );
}

export function spellSystemLabel(id: string): string {
  return SPELL_SYSTEM_TEMPLATES.find((t) => t.id === id)?.label ?? id;
}

/** Škola magie ze statbloku (badge v listu/detailu). */
export function spellSchool(stats: Record<string, unknown> | undefined): string {
  const school = stats?.school;
  return typeof school === 'string' ? school : '';
}

/** Dynamické páry volné šablony (bezpečné čtení). */
export function spellExtras(
  stats: Record<string, unknown> | undefined,
): SpellExtraPair[] {
  const raw = stats?.[SPELL_EXTRA_KEY];
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (p): p is SpellExtraPair =>
      !!p &&
      typeof (p as SpellExtraPair).label === 'string' &&
      typeof (p as SpellExtraPair).value === 'string',
  );
}

/** Validace povinných polí šablony (editor). Vrací mapu key→chyba. */
export function validateSpellStats(
  template: SpellSystemTemplate,
  stats: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of template.fields) {
    if (!f.required) continue;
    const v = stats[f.key];
    const empty =
      v === undefined ||
      v === null ||
      (typeof v === 'string' && !v.trim()) ||
      (Array.isArray(v) && v.length === 0);
    if (empty) errors[f.key] = 'Povinné pole.';
  }
  return errors;
}

/** Zobrazitelná hodnota pole (view). Prázdné → ''. */
export function formatSpellValue(field: SpellFieldDef, value: unknown): string {
  if (value === undefined || value === null) return '';
  if (field.type === 'checkbox') return value === true ? 'ano' : '';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return String(value).trim();
}
