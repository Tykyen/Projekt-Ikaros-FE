import type { DiarySchemaBlock } from '../../api/diarySchema.types';
import { DIARY_BLOCK_TYPES } from '../../api/diarySchema.types';

export interface SchemaError {
  blockIndex?: number;
  field: string;
  message: string;
}

const KEY_REGEX = /^[a-z][a-z0-9_]*$/;
const MAX_BLOCKS = 50;

/**
 * 8.5 — pre-submit validace celého schématu. Vrátí seznam chyb; prázdné pole =
 * vše OK, submit smí jít. Žádné side effects.
 */
export function validateSchema(blocks: DiarySchemaBlock[]): SchemaError[] {
  const errors: SchemaError[] = [];
  const keysSeen = new Set<string>();

  if (blocks.length > MAX_BLOCKS) {
    errors.push({
      field: 'schema',
      message: `Maximální počet bloků je ${MAX_BLOCKS} (máš ${blocks.length}).`,
    });
  }

  blocks.forEach((b, i) => {
    if (!b.label.trim()) {
      errors.push({
        blockIndex: i,
        field: 'label',
        message: 'Label nesmí být prázdný',
      });
    }
    if (!KEY_REGEX.test(b.key)) {
      errors.push({
        blockIndex: i,
        field: 'key',
        message: 'Klíč musí začínat písmenem (a-z) a obsahovat jen a-z 0-9 _',
      });
    }
    if (keysSeen.has(b.key)) {
      errors.push({
        blockIndex: i,
        field: 'key',
        message: `Duplicitní klíč "${b.key}"`,
      });
    }
    keysSeen.add(b.key);

    if (!DIARY_BLOCK_TYPES.includes(b.type)) {
      errors.push({
        blockIndex: i,
        field: 'type',
        message: `Neznámý typ "${b.type}"`,
      });
    }

    const min = b.config?.minValue;
    const max = b.config?.maxValue;
    if (
      (b.type === 'bar' || b.type === 'stat' || b.type === 'number') &&
      min != null &&
      max != null &&
      max <= min
    ) {
      errors.push({
        blockIndex: i,
        field: 'maxValue',
        message: 'Max musí být větší než Min',
      });
    }

    if (
      b.type === 'list' &&
      (!b.config?.options || b.config.options.length < 2)
    ) {
      errors.push({
        blockIndex: i,
        field: 'options',
        message: 'List musí mít alespoň 2 položky',
      });
    }

    // D-DIARY-3 — image blok smí mít prázdný default URL (postava může
    // override per-customData). Nicméně warning by byl OK pokud admin
    // chce dát default. Žádná hard validace zde.
  });

  return errors;
}

/** Detekce keys, které byly přejmenovány mezi původním a novým schématem.
 *  Vrací mapping { staryKey: novyKey } pro bloky se stejným `id`, ale jiným `key`.
 *  Slouží UI varování + následnému `POST .../diary/remap` na postavách. */
export function detectRenamedKeys(
  previous: DiarySchemaBlock[],
  next: DiarySchemaBlock[],
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const prevById = new Map(previous.filter((b) => b.id).map((b) => [b.id!, b]));
  next.forEach((b) => {
    if (!b.id) return;
    const prev = prevById.get(b.id);
    if (prev && prev.key !== b.key) {
      mapping[prev.key] = b.key;
    }
  });
  return mapping;
}
