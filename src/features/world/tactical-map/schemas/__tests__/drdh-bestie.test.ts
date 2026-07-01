/**
 * 16b bestie — Dračí Hlídka (drdh) schéma testy.
 * Ověřuje meta, combatBehavior klíče (damageable/movement/initiative), útoky/
 * odolnosti/schopnosti list tvar, a že token je SUPERSET bestie fields (BE
 * strict validace token.update by jinak edit zahodila).
 */
import { describe, it, expect } from 'vitest';
import { drdhBestieSchema } from '../drdh/bestie';
import { drdhTokenSchema } from '../drdh/token';
import { drdhSchemas } from '../drdh';
import { systemEntitySchemaRegistry } from '../registry';

function bestieFields() {
  return drdhBestieSchema.sections.flatMap((s) => s.fields);
}
function tokenFieldKeys() {
  return new Set(drdhTokenSchema.sections.flatMap((s) => s.fields.map((f) => f.key)));
}

describe('drdhBestieSchema', () => {
  it('má správnou meta', () => {
    expect(drdhBestieSchema.systemId).toBe('drdh');
    expect(drdhBestieSchema.entityType).toBe('bestie');
    expect(drdhBestieSchema.version).toBe(1);
  });

  it('má sekce Boj/Tělo/Atributy/Odolnosti/Meta/Popis', () => {
    expect(drdhBestieSchema.sections.map((s) => s.key)).toEqual([
      'boj',
      'telo',
      'atributy',
      'odolnosti',
      'meta',
      'popis',
    ]);
  });

  it('Životy = number, combatBehavior=damageable, required (HP na mapě)', () => {
    const hp = bestieFields().find((f) => f.key === 'hp');
    expect(hp?.type).toBe('number');
    expect(hp?.combatBehavior).toBe('damageable');
    expect(hp?.required).toBe(true);
  });

  it('Pohyb = movement, Iniciativa = initiative combatBehavior', () => {
    const mov = bestieFields().find((f) => f.key === 'movement');
    const init = bestieFields().find((f) => f.key === 'initiative');
    expect(mov?.combatBehavior).toBe('movement');
    expect(init?.combatBehavior).toBe('initiative');
  });

  it('Útoky = list (name/kind/uc/dmg)', () => {
    const attacks = bestieFields().find((f) => f.key === 'attacks');
    expect(attacks?.type).toBe('list');
    expect(attacks?.listItemFields?.map((f) => f.key)).toEqual([
      'name',
      'kind',
      'uc',
      'dmg',
    ]);
    expect(attacks?.listItemFields?.find((f) => f.key === 'uc')?.type).toBe(
      'number',
    );
    expect(attacks?.listItemFields?.find((f) => f.key === 'dmg')?.type).toBe(
      'string',
    );
  });

  it('Odolnosti = list s enum kind rez/imu/slab', () => {
    const resist = bestieFields().find((f) => f.key === 'resist');
    expect(resist?.type).toBe('list');
    const kind = resist?.listItemFields?.find((f) => f.key === 'kind');
    expect(kind?.type).toBe('enum');
    expect(kind?.enumValues).toEqual(['rez', 'imu', 'slab']);
  });

  it('má 5 atributů str/dex/con/int/cha (number)', () => {
    const attrs = bestieFields().filter((f) =>
      ['str', 'dex', 'con', 'int', 'cha'].includes(f.key),
    );
    expect(attrs).toHaveLength(5);
    attrs.forEach((a) => expect(a.type).toBe('number'));
  });

  it('Zvláštní schopnosti = list (name/desc), taktika = string', () => {
    const abil = bestieFields().find((f) => f.key === 'abilities');
    expect(abil?.listItemFields?.map((f) => f.key)).toEqual(['name', 'desc']);
    expect(bestieFields().find((f) => f.key === 'tactic')?.type).toBe('string');
  });

  it('token je SUPERSET bestie fields (BE strict token.update)', () => {
    const tokenKeys = tokenFieldKeys();
    for (const f of bestieFields()) {
      expect(tokenKeys.has(f.key)).toBe(true);
    }
  });

  it('token má health.current damageable + drdh-bestie sekci', () => {
    expect(drdhTokenSchema.systemId).toBe('drdh');
    expect(drdhTokenSchema.entityType).toBe('token');
    const cur = drdhTokenSchema.sections
      .flatMap((s) => s.fields)
      .find((f) => f.key === 'health.current');
    expect(cur?.combatBehavior).toBe('damageable');
    expect(drdhTokenSchema.sections.map((s) => s.key)).toContain('drdh-bestie');
  });

  it('drdhSchemas jde zaregistrovat a získat z registry', () => {
    systemEntitySchemaRegistry._clearForTesting();
    for (const s of drdhSchemas) systemEntitySchemaRegistry.register(s);
    expect(systemEntitySchemaRegistry.get('drdh', 'bestie')).toBe(
      drdhBestieSchema,
    );
    expect(systemEntitySchemaRegistry.get('drdh', 'token')).toBe(
      drdhTokenSchema,
    );
  });
});
