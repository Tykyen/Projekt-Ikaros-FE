import { describe, it, expect } from 'vitest';
import {
  buildBestieToken,
  buildNpcToken,
  buildPcToken,
} from '../buildSpawnToken';
import type { Bestie } from '@/features/world/bestiar/types';
import { systemEntitySchemaRegistry } from '../../schemas/registry';
import { drd16BestieSchema } from '../../schemas/drd16/bestie';

describe('buildSpawnToken — PC', () => {
  it('PC token má isNpc=false a správné identifiers', () => {
    const t = buildPcToken(
      {
        kind: 'pc',
        characterId: 'c1',
        characterSlug: 'jan',
        name: 'Jan',
      },
      3,
      -2,
    );
    expect(t.isNpc).toBe(false);
    expect(t.characterId).toBe('c1');
    expect(t.characterSlug).toBe('jan');
    expect(t.instanceName).toBe('Jan');
    expect(t.q).toBe(3);
    expect(t.r).toBe(-2);
    expect(t.id).toMatch(/^_pending_\d+_[a-z0-9]+_jan$/);
    expect(t.currentHp).toBe(0); // fixed default — BE doplní z Character
  });
});

describe('buildSpawnToken — NPC', () => {
  it('NPC token má isNpc=true', () => {
    const t = buildNpcToken(
      {
        kind: 'npc',
        characterId: 'n1',
        characterSlug: 'duch',
        name: 'Duch',
      },
      0,
      0,
    );
    expect(t.isNpc).toBe(true);
    expect(t.characterId).toBe('n1');
    expect(t.characterSlug).toBe('duch');
    expect(t.instanceName).toBe('Duch');
  });
});

describe('buildSpawnToken — Bestie', () => {
  function makeBestie(overrides: Partial<Bestie> = {}): Bestie {
    return {
      id: 'b1',
      scope: 'world',
      systemId: 'drd2',
      name: 'Skřet',
      notes: '',
      systemStats: {
        'health.max': 12,
        armor: 2,
        injury: 0,
        'initiative.base': 1,
        movement: 6,
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      ...overrides,
    };
  }

  it('templateId + characterId vychází z bestie.id', () => {
    const t = buildBestieToken(makeBestie(), 1, 1);
    expect(t.templateId).toBe('b1');
    expect(t.characterId).toBe('bestie:b1');
    expect(t.characterSlug).toBe('b1');
    expect(t.isNpc).toBe(true);
  });

  it('snapshot systemStats kopíruje (ne shared reference) + seeduje health.current', () => {
    const bestie = makeBestie();
    const t = buildBestieToken(bestie, 0, 0);
    // health.current seedováno z health.max (bestie schema má jen max).
    expect(t.systemStats).toEqual({
      ...bestie.systemStats,
      'health.current': 12,
    });
    expect(t.systemStats).not.toBe(bestie.systemStats); // copy, ne ref
  });

  it('dvě instance téže bestie dostanou různé id (anti-kolize)', () => {
    const bestie = makeBestie();
    const a = buildBestieToken(bestie, 0, 0);
    const b = buildBestieToken(bestie, 1, 1);
    expect(a.id).not.toBe(b.id);
  });

  it('notes = snapshot bestie.notes (instanční default)', () => {
    const t = buildBestieToken(makeBestie({ notes: 'Nemrtvý' }), 0, 0);
    expect(t.notes).toBe('Nemrtvý');
  });

  it('chybějící health.max → health.current seed z defaultu (10)', () => {
    const t = buildBestieToken(makeBestie({ systemStats: {} }), 0, 0);
    expect(t.systemStats?.['health.current']).toBe(10);
  });

  it('fixed pole se vypočítají z systemStats', () => {
    const t = buildBestieToken(makeBestie(), 0, 0);
    expect(t.maxHp).toBe(12);
    expect(t.currentHp).toBe(12);
    expect(t.armor).toBe(2);
    expect(t.movement).toBe(6);
    expect(t.initiativeBase).toBe(1);
  });

  it('schopnosti ze systemStats.abilities → token.abilities (label/value → name/description)', () => {
    const t = buildBestieToken(
      makeBestie({
        systemStats: {
          'health.max': 12,
          abilities: [
            { label: 'Nemrtvá síla', value: '2' },
            { label: 'Ledový dotek', value: '4' },
          ],
        },
      }),
      0,
      0,
    );
    expect(t.abilities).toEqual([
      { name: 'Nemrtvá síla', description: '2' },
      { name: 'Ledový dotek', description: '4' },
    ]);
  });

  it('bez schopností → prázdné token.abilities', () => {
    const t = buildBestieToken(makeBestie(), 0, 0);
    expect(t.abilities).toEqual([]);
  });

  it('chybějící systemStats fields → defaults', () => {
    const t = buildBestieToken(
      makeBestie({ systemStats: {} }),
      0,
      0,
    );
    expect(t.maxHp).toBe(10); // default
    expect(t.armor).toBe(0);
    expect(t.movement).toBe(5);
  });

  it('drd16 bestie: HP z `hp` klíče + pohyb z `movement` (schema-aware)', () => {
    systemEntitySchemaRegistry._clearForTesting();
    systemEntitySchemaRegistry.register(drd16BestieSchema);
    const t = buildBestieToken(
      makeBestie({
        systemId: 'drd16',
        systemStats: {
          hp: 3,
          defense: 7,
          movement: 15,
          attacks: [{ name: 'ostny', value: 3 }],
        },
      }),
      0,
      0,
    );
    expect(t.maxHp).toBe(3); // z `hp` (ne matrix `health.max`)
    expect(t.currentHp).toBe(3);
    expect(t.movement).toBe(15);
    // staty (attacks/defense) snapshotnuté na token pro panel
    expect(t.systemStats?.attacks).toEqual([{ name: 'ostny', value: 3 }]);
    expect(t.systemStats?.defense).toBe(7);
    systemEntitySchemaRegistry._clearForTesting();
  });
});
