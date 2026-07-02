/**
 * 16.2g F1d — startovní šablony deníku pro „Vlastní Systém".
 *
 * Prázdný editor je pro amatéra odrazující. Tyhle šablony vloží smysluplný
 * výchozí bod (sekce + typy polí + ukázková `formula`), který PJ dál upraví.
 *
 * Záměrně jen data (`DiarySchemaBlock[]`) — žádná grafika. Vizuál řeší skiny
 * (F6). Klíče (`key`) jsou validní identifikátory (bez diakritiky) — na ně
 * odkazují `formula` výrazy.
 */
import type { DiarySchemaBlock } from '../../api/diarySchema.types';

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `b_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

type BlockSeed = Omit<DiarySchemaBlock, 'id' | 'order'>;

/** Přiřadí čerstvé `id` a pořadí dle indexu — jako `handleAdd` v editoru. */
function instantiate(seeds: BlockSeed[]): DiarySchemaBlock[] {
  return seeds.map((seed, i) => ({ ...seed, id: makeId(), order: i }));
}

export interface StarterTemplate {
  /** Stabilní klíč varianty (pro React key / telemetrii). */
  key: string;
  label: string;
  hint: string;
  build: () => DiarySchemaBlock[];
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    key: 'fantasy',
    label: 'Fantasy hrdina',
    hint: 'Vlastnosti, životy s dopočtem kondice, výbava.',
    build: () =>
      instantiate([
        { key: 'sila', label: 'Síla', type: 'stat', config: { minValue: 0, maxValue: 20, layoutArea: 'Vlastnosti' } },
        { key: 'obratnost', label: 'Obratnost', type: 'stat', config: { minValue: 0, maxValue: 20, layoutArea: 'Vlastnosti' } },
        { key: 'odolnost', label: 'Odolnost', type: 'stat', config: { minValue: 0, maxValue: 20, layoutArea: 'Vlastnosti' } },
        { key: 'inteligence', label: 'Inteligence', type: 'stat', config: { minValue: 0, maxValue: 20, layoutArea: 'Vlastnosti' } },
        { key: 'hp', label: 'Životy', type: 'number', config: { minValue: 0, layoutArea: 'Boj' } },
        { key: 'hp_max', label: 'Životy (max)', type: 'number', config: { minValue: 1, layoutArea: 'Boj' } },
        { key: 'kondice', label: 'Kondice %', type: 'formula', config: { expression: 'hp / hp_max * 100', layoutArea: 'Boj' } },
        { key: 'zbroj', label: 'Zbroj', type: 'number', config: { minValue: 0, layoutArea: 'Boj' } },
        { key: 'vybava', label: 'Výbava', type: 'textarea', config: { layoutArea: 'Výbava' } },
        { key: 'poznamky', label: 'Poznámky', type: 'textarea', config: { layoutArea: 'Výbava' } },
      ]),
  },
  {
    key: 'scifi',
    label: 'Sci-fi operativec',
    hint: 'Atributy, štít s dopočtem integrity, kyberware.',
    build: () =>
      instantiate([
        { key: 'telo', label: 'Tělo', type: 'stat', config: { minValue: 0, maxValue: 12, layoutArea: 'Atributy' } },
        { key: 'reflexy', label: 'Reflexy', type: 'stat', config: { minValue: 0, maxValue: 12, layoutArea: 'Atributy' } },
        { key: 'intelekt', label: 'Intelekt', type: 'stat', config: { minValue: 0, maxValue: 12, layoutArea: 'Atributy' } },
        { key: 'vule', label: 'Vůle', type: 'stat', config: { minValue: 0, maxValue: 12, layoutArea: 'Atributy' } },
        { key: 'stit', label: 'Štít', type: 'number', config: { minValue: 0, layoutArea: 'Systémy' } },
        { key: 'stit_max', label: 'Štít (max)', type: 'number', config: { minValue: 1, layoutArea: 'Systémy' } },
        { key: 'integrita', label: 'Integrita %', type: 'formula', config: { expression: 'stit / stit_max * 100', layoutArea: 'Systémy' } },
        { key: 'energie', label: 'Energie', type: 'bar', config: { minValue: 0, maxValue: 10, layoutArea: 'Systémy' } },
        { key: 'kyberware', label: 'Kyberware', type: 'textarea', config: { layoutArea: 'Výbava' } },
      ]),
  },
  {
    key: 'minimal',
    label: 'Minimalistický',
    hint: 'Jen to nejnutnější — jméno, životy, poznámky.',
    build: () =>
      instantiate([
        { key: 'jmeno', label: 'Jméno postavy', type: 'text', config: {} },
        { key: 'hp', label: 'Životy', type: 'bar', config: { minValue: 0, maxValue: 20 } },
        { key: 'poznamky', label: 'Poznámky', type: 'textarea', config: {} },
      ]),
  },
];
