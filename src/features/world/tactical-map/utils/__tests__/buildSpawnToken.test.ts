import { describe, it, expect } from 'vitest';
import {
  buildBestieToken,
  buildNpcToken,
  buildPcToken,
} from '../buildSpawnToken';
import type { Bestie } from '@/features/world/bestiar/types';

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
    expect(t.id).toMatch(/^_pending_\d+_jan$/);
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
      abilities: [{ label: 'Útok', value: '3' }],
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

  it('snapshot systemStats kopíruje (ne shared reference)', () => {
    const bestie = makeBestie();
    const t = buildBestieToken(bestie, 0, 0);
    expect(t.systemStats).toEqual(bestie.systemStats);
    expect(t.systemStats).not.toBe(bestie.systemStats); // copy, ne ref
  });

  it('fixed pole se vypočítají z systemStats', () => {
    const t = buildBestieToken(makeBestie(), 0, 0);
    expect(t.maxHp).toBe(12);
    expect(t.currentHp).toBe(12);
    expect(t.armor).toBe(2);
    expect(t.movement).toBe(6);
    expect(t.initiativeBase).toBe(1);
  });

  it('abilities mapping label/value → name/description', () => {
    const t = buildBestieToken(makeBestie(), 0, 0);
    expect(t.abilities).toEqual([{ name: 'Útok', description: '3' }]);
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
});
