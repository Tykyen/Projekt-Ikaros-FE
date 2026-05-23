import { describe, it, expect } from 'vitest';
import {
  validateSchema,
  detectRenamedKeys,
} from '../utils/schemaValidation';
import type { DiarySchemaBlock } from '../../api/diarySchema.types';

const baseBlock: DiarySchemaBlock = {
  key: 'hp',
  label: 'HP',
  type: 'stat',
  order: 0,
};

describe('validateSchema', () => {
  it('platné schéma → []', () => {
    expect(validateSchema([baseBlock])).toEqual([]);
  });

  it('prázdný label → error', () => {
    const errors = validateSchema([{ ...baseBlock, label: '   ' }]);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'label' }),
      ]),
    );
  });

  it('neplatný key (začíná číslem) → error', () => {
    const errors = validateSchema([{ ...baseBlock, key: '1hp' }]);
    expect(errors[0].field).toBe('key');
  });

  it('duplicitní key → error', () => {
    const errors = validateSchema([
      { ...baseBlock, key: 'hp', label: 'A' },
      { ...baseBlock, key: 'hp', label: 'B' },
    ]);
    expect(errors.some((e) => e.message.includes('Duplicitní'))).toBe(true);
  });

  it('bar/stat s max <= min → error', () => {
    const errors = validateSchema([
      {
        ...baseBlock,
        type: 'bar',
        config: { minValue: 10, maxValue: 5 },
      },
    ]);
    expect(errors.some((e) => e.field === 'maxValue')).toBe(true);
  });

  it('list bez options nebo s < 2 → error', () => {
    const errors = validateSchema([
      { ...baseBlock, type: 'list', config: { options: ['jen jedna'] } },
    ]);
    expect(errors.some((e) => e.field === 'options')).toBe(true);
  });

  it('> 50 bloků → error', () => {
    const many: DiarySchemaBlock[] = Array.from({ length: 51 }, (_, i) => ({
      key: `b${i}`,
      label: `Block ${i}`,
      type: 'stat',
      order: i,
    }));
    const errors = validateSchema(many);
    expect(errors.some((e) => e.field === 'schema')).toBe(true);
  });
});

describe('detectRenamedKeys', () => {
  it('najde rename podle stabilního id', () => {
    const prev: DiarySchemaBlock[] = [
      { id: 'u1', key: 'stamina_max', label: 'Stamina', type: 'stat', order: 0 },
    ];
    const next: DiarySchemaBlock[] = [
      { id: 'u1', key: 'endurance', label: 'Endurance', type: 'stat', order: 0 },
    ];
    expect(detectRenamedKeys(prev, next)).toEqual({ stamina_max: 'endurance' });
  });

  it('beze změny key → {}', () => {
    const prev: DiarySchemaBlock[] = [
      { id: 'u1', key: 'hp', label: 'HP', type: 'stat', order: 0 },
    ];
    const next: DiarySchemaBlock[] = [
      { id: 'u1', key: 'hp', label: 'Health', type: 'stat', order: 0 },
    ];
    expect(detectRenamedKeys(prev, next)).toEqual({});
  });

  it('bez id v previous → {} (rename se nedetekuje)', () => {
    const prev: DiarySchemaBlock[] = [
      { key: 'hp', label: 'HP', type: 'stat', order: 0 },
    ];
    const next: DiarySchemaBlock[] = [
      { key: 'health', label: 'HP', type: 'stat', order: 0 },
    ];
    expect(detectRenamedKeys(prev, next)).toEqual({});
  });
});
