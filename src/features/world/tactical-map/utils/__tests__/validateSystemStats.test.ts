import { describe, it, expect } from 'vitest';
import { validateForCreate, validateForPatch } from '../validateSystemStats';
import type { SystemEntitySchema } from '../../schemas/types';

const schema: SystemEntitySchema = {
  systemId: 'test',
  entityType: 'bestie',
  version: 1,
  sections: [
    {
      key: 'main',
      label: 'Main',
      fields: [
        { key: 'health.max', label: 'HP', type: 'number', default: 10, min: 1, required: true },
        { key: 'armor', label: 'Armor', type: 'number', default: 0, min: 0 },
        { key: 'name', label: 'Name', type: 'string', required: true },
        { key: 'tags', label: 'Tags', type: 'list' },
      ],
    },
  ],
};

describe('validateForCreate', () => {
  it('required missing → invalid', () => {
    const r = validateForCreate({}, schema);
    expect(r.valid).toBe(false);
    expect(r.errors.name).toBeDefined();
  });

  it('default fill', () => {
    const r = validateForCreate({ name: 'X' }, schema);
    expect(r.valid).toBe(true);
    expect(r.filled['health.max']).toBe(10);
    expect(r.filled.armor).toBe(0);
  });

  it('min violation → invalid', () => {
    const r = validateForCreate(
      { name: 'X', 'health.max': 0 },
      schema,
    );
    expect(r.valid).toBe(false);
    expect(r.errors['health.max']).toMatch(/minimum/);
  });

  it('number coercion (string → number)', () => {
    const r = validateForCreate(
      { name: 'X', 'health.max': '15' },
      schema,
    );
    expect(r.valid).toBe(true);
    expect(r.filled['health.max']).toBe(15);
  });

  it('type mismatch string→list rejected', () => {
    const r = validateForCreate(
      { name: 'X', tags: 'not array' },
      schema,
    );
    expect(r.valid).toBe(false);
    expect(r.errors.tags).toBeDefined();
  });
});

describe('validateForPatch', () => {
  it('unknown key strict reject', () => {
    const r = validateForPatch({ unknown: 1 }, schema);
    expect(r.valid).toBe(false);
    expect(r.errors.unknown).toBeDefined();
  });

  it('partial OK', () => {
    const r = validateForPatch({ armor: 5 }, schema);
    expect(r.valid).toBe(true);
  });

  it('partial type mismatch rejected', () => {
    const r = validateForPatch({ armor: 'foo' }, schema);
    expect(r.valid).toBe(false);
  });
});
