import { describe, it, expect } from 'vitest';
import { applyOperationToScene } from './applyOperationToScene';
import type { MapScene, MapDiceRoll } from '../types';

/** Minimální platná scéna pro testy. */
const baseScene: MapScene = {
  id: 'scene-1',
  worldId: 'world-1',
  name: 'Test Scene',
  imageUrl: '',
  config: {
    size: 40,
    originX: 0,
    originY: 0,
    showGrid: true,
  },
  tokens: [],
  npcTemplates: [],
  effects: [],
  fogEnabled: false,
  revealedHexes: [],
  isActive: true,
  isHidden: false,
  isLocked: false,
  playerStates: [],
  activeSoundIds: [],
  lastSeqNumber: 0,
  activeCharacterIds: [],
  activeBestieIds: [],
  diceRolls: [],
};

// ─── dice.roll ────────────────────────────────────────────────────────────────

describe('dice.roll', () => {
  const roll = (id: string): MapDiceRoll => ({
    id,
    rolledAt: '2026-05-31T08:00:00.000Z',
    byUserId: 'u1',
    rollerName: 'Tyky',
    rollerKind: 'pc',
    category: 'custom',
    dicePayload: { type: 'd20', faces: [18], sum: 18, total: 18 } as never,
  });

  it('append do diceRolls', () => {
    const next = applyOperationToScene(baseScene, { type: 'dice.roll', roll: roll('r1') });
    expect(next.diceRolls).toHaveLength(1);
    expect(next.diceRolls?.[0].id).toBe('r1');
  });

  it('cap 50 — odřízne nejstarší', () => {
    const scene = { ...baseScene, diceRolls: Array.from({ length: 50 }, (_, i) => roll(`r${i}`)) };
    const next = applyOperationToScene(scene, { type: 'dice.roll', roll: roll('new') });
    expect(next.diceRolls).toHaveLength(50);
    expect(next.diceRolls?.[0].id).toBe('r1'); // r0 vypadl
    expect(next.diceRolls?.at(-1)?.id).toBe('new');
  });

  it('idempotent dedup podle id (optimistic + broadcast)', () => {
    const scene = { ...baseScene, diceRolls: [roll('r1')] };
    const next = applyOperationToScene(scene, { type: 'dice.roll', roll: roll('r1') });
    expect(next.diceRolls).toHaveLength(1);
  });
});
