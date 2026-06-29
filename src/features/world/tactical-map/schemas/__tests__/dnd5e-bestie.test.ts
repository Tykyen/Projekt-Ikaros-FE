import { describe, it, expect } from 'vitest';
import { dnd5eBestieSchema, dnd5eTokenSchema } from '../dnd5e';

const beFields = dnd5eBestieSchema.sections.flatMap((s) => s.fields);
const tokFields = dnd5eTokenSchema.sections.flatMap((s) => s.fields);

describe('dnd5eBestieSchema (8.7r)', () => {
  it('meta', () => {
    expect(dnd5eBestieSchema.systemId).toBe('dnd5e');
    expect(dnd5eBestieSchema.entityType).toBe('bestie');
  });

  it('Výdrž = damageable HP, povinné', () => {
    const f = beFields.find((f) => f.key === 'vydrz');
    expect(f?.combatBehavior).toBe('damageable');
    expect(f?.required).toBe(true);
  });

  it('Obratnost = iniciativa, Rychlost = pohyb, OČ = cíl útoku', () => {
    expect(beFields.find((f) => f.key === 'attributes.dex')?.combatBehavior).toBe(
      'initiative',
    );
    expect(beFields.find((f) => f.key === 'rychlost')?.combatBehavior).toBe(
      'movement',
    );
    expect(beFields.find((f) => f.key === 'obranne_cislo')?.combatBehavior).toBe(
      'roll-target',
    );
  });

  it('N/Ob/PV jsou čísla, Přesvědčení = výběr, Velikost = text (zapsání)', () => {
    expect(beFields.find((f) => f.key === 'nebezpecnost')?.type).toBe('number');
    expect(beFields.find((f) => f.key === 'pasivni_vnimani')?.type).toBe('number');
    expect(beFields.find((f) => f.key === 'presvedceni')?.type).toBe('enum');
    expect(beFields.find((f) => f.key === 'velikost')?.type).toBe('string');
  });

  it('vlastnosti mají computed bonus (floor((skóre-10)/2))', () => {
    const mod = beFields.find((f) => f.key === 'attributes.str_mod');
    expect(mod?.type).toBe('computed');
    expect(mod?.formula).toBe('floor((attributes.str - 10) / 2)');
  });

  it('ZH = list (vlastnost + bonus), ZD = list (dovednost + bonus)', () => {
    const zh = beFields.find((f) => f.key === 'zachrany');
    expect(zh?.type).toBe('list');
    expect(zh?.listItemFields?.map((f) => f.key)).toEqual(['vlastnost', 'bonus']);
    const zd = beFields.find((f) => f.key === 'zdatnosti');
    expect(zd?.listItemFields?.map((f) => f.key)).toEqual(['dovednost', 'bonus']);
  });

  it('schopnosti mají typ (Akce/Reakce/Legendární jako speciální)', () => {
    const ab = beFields.find((f) => f.key === 'abilities');
    const typ = ab?.listItemFields?.find((f) => f.key === 'typ');
    expect(typ?.enumValues).toContain('Akce');
    expect(typ?.enumValues).toContain('Reakce');
    expect(typ?.enumValues).toContain('Legendární akce');
  });
});

describe('dnd5eTokenSchema (8.7r)', () => {
  it('health.current = damageable (runtime HP)', () => {
    expect(tokFields.find((f) => f.key === 'health.current')?.combatBehavior).toBe(
      'damageable',
    );
  });

  it('nese bestie pole pro snapshot (BE strict edit)', () => {
    const keys = tokFields.map((f) => f.key);
    expect(keys).toContain('vydrz');
    expect(keys).toContain('attributes.str');
    expect(keys).toContain('utoky');
    expect(keys).toContain('abilities');
  });
});
