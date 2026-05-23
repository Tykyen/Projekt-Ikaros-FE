import { describe, it, expect } from 'vitest';
import {
  flattenSchemaBlock,
  nestCustomBlock,
  slugify,
  dummyValueFor,
} from '../utils/schemaMappers';
import type { DiarySchemaBlock } from '../../api/diarySchema.types';

describe('schemaMappers', () => {
  it('flatten + nest = round-trip pro plný blok', () => {
    const original: DiarySchemaBlock = {
      id: 'uuid-1',
      key: 'hp',
      label: 'HP',
      type: 'bar',
      order: 0,
      config: {
        minValue: 0,
        maxValue: 100,
        color: '#ef4444',
        description: 'Životy',
      },
    };
    const flat = flattenSchemaBlock(original);
    const nested = nestCustomBlock(flat);
    expect(nested).toEqual(original);
  });

  it('flatten bez config → flat má undefined config fields', () => {
    const block: DiarySchemaBlock = {
      id: 'x',
      key: 'note',
      label: 'Poznámka',
      type: 'text',
      order: 0,
    };
    const flat = flattenSchemaBlock(block);
    expect(flat.id).toBe('x');
    expect(flat.maxValue).toBeUndefined();
    expect(flat.color).toBeUndefined();
  });

  it('slugify převede cs label na valid key', () => {
    expect(slugify('Síla')).toBe('sila');
    expect(slugify('Šťastný den')).toBe('stastny_den');
    expect(slugify('123start')).toMatch(/^k_/);
  });

  it('dummyValueFor — různé typy', () => {
    expect(dummyValueFor({ key: 'a', label: '', type: 'stat', order: 0, config: { minValue: 5 } })).toBe(5);
    expect(dummyValueFor({ key: 'a', label: '', type: 'list', order: 0, config: { options: ['X', 'Y'] } })).toBe('X');
    expect(dummyValueFor({ key: 'a', label: '', type: 'text', order: 0 })).toBe('…');
    expect(
      dummyValueFor({ key: 'a', label: '', type: 'image', order: 0, config: { imageUrl: 'u' } }),
    ).toBe('u');
  });

  it('D-DIARY-3 — image typ round-trip přes imageUrl', () => {
    const original: DiarySchemaBlock = {
      id: 'uuid-img',
      key: 'avatar',
      label: 'Avatar',
      type: 'image',
      order: 0,
      config: { imageUrl: 'https://cdn.example.com/x.png' },
    };
    const flat = flattenSchemaBlock(original);
    expect(flat.imageUrl).toBe('https://cdn.example.com/x.png');
    const nested = nestCustomBlock(flat);
    expect(nested.config?.imageUrl).toBe('https://cdn.example.com/x.png');
  });
});
