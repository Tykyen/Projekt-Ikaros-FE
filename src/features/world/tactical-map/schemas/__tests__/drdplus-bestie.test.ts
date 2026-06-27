import { describe, it, expect } from 'vitest';
import { drdplusBestieSchema } from '../drdplus/bestie';
import { drdplusSchemas } from '../drdplus';
import { systemEntitySchemaRegistry } from '../registry';

function allFields() {
  return drdplusBestieSchema.sections.flatMap((s) => s.fields);
}

describe('drdplusBestieSchema', () => {
  it('má správnou meta', () => {
    expect(drdplusBestieSchema.systemId).toBe('drdplus');
    expect(drdplusBestieSchema.entityType).toBe('bestie');
    expect(drdplusBestieSchema.version).toBe(1);
  });

  it('má 6 sekcí v pořadí Boj/Vlastnosti/Tělo/Smysly/Výskyt/Schopnosti', () => {
    expect(drdplusBestieSchema.sections.map((s) => s.key)).toEqual([
      'combat',
      'stats',
      'body',
      'senses',
      'ecology',
      'abilities',
    ]);
  });

  it('Mez zranění = number, damageable, required (HP na mapě)', () => {
    const hp = allFields().find((f) => f.key === 'mez_zraneni');
    expect(hp?.type).toBe('number');
    expect(hp?.combatBehavior).toBe('damageable');
    expect(hp?.required).toBe(true);
  });

  it('Ochrana = armor-reducer, Rychlost = movement', () => {
    expect(allFields().find((f) => f.key === 'ochrana')?.combatBehavior).toBe(
      'armor-reducer',
    );
    expect(allFields().find((f) => f.key === 'rychlost')?.combatBehavior).toBe(
      'movement',
    );
  });

  it('Útoky = list (Název/BČ/ÚČ/OČ/ZZ/Typ); ZZ číslo, Typ enum B/S/D', () => {
    const utoky = allFields().find((f) => f.key === 'utoky');
    expect(utoky?.type).toBe('list');
    expect(utoky?.listItemFields?.map((f) => f.key)).toEqual([
      'name',
      'bc',
      'uc',
      'oc',
      'zz',
      'type',
    ]);
    const zz = utoky?.listItemFields?.find((f) => f.key === 'zz');
    expect(zz?.type).toBe('number');
    const typ = utoky?.listItemFields?.find((f) => f.key === 'type');
    expect(typ?.type).toBe('enum');
    expect(typ?.enumValues).toEqual(['B', 'S', 'D']);
  });

  it('6 vlastností Sil/Obr/Zrč/Vol/Int/Chr', () => {
    const stats = drdplusBestieSchema.sections.find((s) => s.key === 'stats');
    expect(stats?.fields.map((f) => f.key)).toEqual([
      'sil',
      'obr',
      'zrc',
      'vol',
      'int',
      'chr',
    ]);
  });

  it('Četnost = enum (5 hodnot), Aktivita = enum (4 hodnoty)', () => {
    const cetnost = allFields().find((f) => f.key === 'cetnost');
    expect(cetnost?.type).toBe('enum');
    expect(cetnost?.enumValues).toEqual([
      'hojný',
      'běžný',
      'neobvyklý',
      'vzácný',
      'velmi vzácný',
    ]);
    const aktivita = allFields().find((f) => f.key === 'aktivita');
    expect(aktivita?.enumValues).toEqual(['den', 'noc', 'šero', 'stále']);
  });

  it('Schopnosti = list (label + value), kompatibilní s ostatními systémy', () => {
    const abilities = allFields().find((f) => f.key === 'abilities');
    expect(abilities?.type).toBe('list');
    expect(abilities?.listItemFields?.map((f) => f.key)).toEqual([
      'label',
      'value',
    ]);
  });

  it('drdplusSchemas obsahuje bestie schéma', () => {
    expect(drdplusSchemas).toContain(drdplusBestieSchema);
  });

  it('drdplusSchemas jde zaregistrovat a získat z registry', () => {
    systemEntitySchemaRegistry._clearForTesting();
    for (const s of drdplusSchemas) systemEntitySchemaRegistry.register(s);
    expect(systemEntitySchemaRegistry.get('drdplus', 'bestie')).toBe(
      drdplusBestieSchema,
    );
  });
});
