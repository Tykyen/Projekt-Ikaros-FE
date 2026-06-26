import { describe, it, expect } from 'vitest';
import { drd16BestieSchema } from '../drd16/bestie';
import { drd16Schemas } from '../drd16';
import { systemEntitySchemaRegistry } from '../registry';

function allFields() {
  return drd16BestieSchema.sections.flatMap((s) => s.fields);
}

describe('drd16BestieSchema', () => {
  it('má správnou meta', () => {
    expect(drd16BestieSchema.systemId).toBe('drd16');
    expect(drd16BestieSchema.entityType).toBe('bestie');
    expect(drd16BestieSchema.version).toBe(1);
  });

  it('má 4 sekce Boj/Tělo/Mysl/Odměna', () => {
    expect(drd16BestieSchema.sections.map((s) => s.key)).toEqual([
      'combat',
      'body',
      'mind',
      'reward',
    ]);
  });

  it('Životy = number, combatBehavior=damageable, required', () => {
    const hp = allFields().find((f) => f.key === 'hp');
    expect(hp?.type).toBe('number');
    expect(hp?.combatBehavior).toBe('damageable');
    expect(hp?.required).toBe(true);
  });

  it('Útoky = list (název + číslo)', () => {
    const attacks = allFields().find((f) => f.key === 'attacks');
    expect(attacks?.type).toBe('list');
    expect(attacks?.listItemFields?.map((f) => f.key)).toEqual([
      'name',
      'value',
    ]);
    expect(
      attacks?.listItemFields?.find((f) => f.key === 'name')?.type,
    ).toBe('string');
    expect(
      attacks?.listItemFields?.find((f) => f.key === 'value')?.type,
    ).toBe('number');
  });

  it('Přesvědčení = enum ZkD/ZmD/N/ZmZ/ZkZ', () => {
    const al = allFields().find((f) => f.key === 'alignment');
    expect(al?.type).toBe('enum');
    expect(al?.enumValues).toEqual(['ZkD', 'ZmD', 'N', 'ZmZ', 'ZkZ']);
    expect(al?.default).toBe('N');
  });

  it('Pohyblivost má combatBehavior=movement', () => {
    const mov = allFields().find((f) => f.key === 'movement');
    expect(mov?.combatBehavior).toBe('movement');
  });

  it('drd16Schemas obsahuje bestie schéma', () => {
    expect(drd16Schemas).toContain(drd16BestieSchema);
  });

  it('drd16Schemas jde zaregistrovat a získat z registry', () => {
    systemEntitySchemaRegistry._clearForTesting();
    for (const s of drd16Schemas) systemEntitySchemaRegistry.register(s);
    expect(systemEntitySchemaRegistry.get('drd16', 'bestie')).toBe(
      drd16BestieSchema,
    );
  });
});
