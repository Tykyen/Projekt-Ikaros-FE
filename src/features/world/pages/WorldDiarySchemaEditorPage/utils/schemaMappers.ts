import type {
  DiarySchemaBlock,
  DiaryBlockType,
} from '../../api/diarySchema.types';
import type { CustomDiaryBlock } from '../../api/characters.types';

/**
 * 8.5 — převod „hnízděného" world-level bloku na flat per-postava blok.
 * Per-postava override (`CustomDiaryBlock`) má všechna config pole na top-level.
 */
export function flattenSchemaBlock(b: DiarySchemaBlock): CustomDiaryBlock {
  return {
    id: b.id ?? b.key,
    key: b.key,
    type: b.type,
    label: b.label,
    description: b.config?.description,
    maxValue: b.config?.maxValue,
    minValue: b.config?.minValue,
    color: b.config?.color,
    options: b.config?.options,
    order: b.order,
    layoutArea: b.config?.layoutArea,
    imageUrl: b.config?.imageUrl,
    // 16.2g F1a — dřív se `expression` ztrácela → formula nikdy nefungovala.
    expression: b.config?.expression,
  };
}

/**
 * 8.5 — opačný směr. UI per-postava editor produkuje `CustomDiaryBlock`;
 * pokud se uloží do schématu světa, projde tímto mapperem.
 */
export function nestCustomBlock(b: CustomDiaryBlock): DiarySchemaBlock {
  const config: DiarySchemaBlock['config'] = {};
  if (b.description !== undefined) config.description = b.description;
  if (b.maxValue !== undefined) config.maxValue = b.maxValue;
  if (b.minValue !== undefined) config.minValue = b.minValue;
  if (b.color !== undefined) config.color = b.color;
  if (b.options !== undefined) config.options = b.options;
  if (b.layoutArea !== undefined) config.layoutArea = b.layoutArea;
  if (b.imageUrl !== undefined) config.imageUrl = b.imageUrl;
  if (b.expression !== undefined) config.expression = b.expression;
  return {
    id: b.id,
    key: b.key || slugify(b.label) || b.id,
    label: b.label,
    type: b.type as DiaryBlockType,
    order: b.order,
    config: Object.keys(config).length > 0 ? config : undefined,
  };
}

/** cs transliterace pro auto-key z labelu (podobné `useWorldSlug`). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^[^a-z]/, 'k_') // klíč musí začínat písmenem
    .slice(0, 64);
}

/** Dummy hodnota pro preview — nereprezentuje skutečná data. */
export function dummyValueFor(b: DiarySchemaBlock): unknown {
  switch (b.type) {
    case 'stat':
    case 'number':
      return b.config?.minValue ?? 0;
    case 'bar':
      return b.config?.minValue ?? 0;
    case 'list':
      return b.config?.options?.[0] ?? '';
    case 'text':
    case 'textarea':
      return '…';
    case 'image':
      // V preview ukážeme default URL ze schématu (žádné customData override).
      return b.config?.imageUrl ?? '';
    default:
      return null;
  }
}
