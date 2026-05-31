/**
 * 10.2n — testy efektivního přístupového stavu (override ?? default).
 */
import { describe, it, expect } from 'vitest';
import { effectiveHidden, effectiveLocked } from '../sceneAccess';
import type { MapScene } from '../../types';

function makeScene(overrides: Partial<MapScene> = {}): MapScene {
  return {
    id: 's1',
    worldId: 'w1',
    name: 'T',
    imageUrl: '',
    config: { size: 40, originX: 0, originY: 0, showGrid: true },
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
    combat: null,
    activeCharacterIds: [],
    activeBestieIds: [],
    ...overrides,
  };
}

describe('sceneAccess', () => {
  it('bez override → default scény', () => {
    const scene = makeScene({ isHidden: true, isLocked: false });
    expect(effectiveHidden(scene, 'u1')).toBe(true);
    expect(effectiveLocked(scene, 'u1')).toBe(false);
  });

  it('override přebije default (oběma směry)', () => {
    const scene = makeScene({
      isHidden: true,
      isLocked: true,
      playerStates: [{ userId: 'u1', isHidden: false, isLocked: false }],
    });
    expect(effectiveHidden(scene, 'u1')).toBe(false);
    expect(effectiveLocked(scene, 'u1')).toBe(false);
  });

  it('override jen jednoho pole, druhé padá na default', () => {
    const scene = makeScene({
      isHidden: false,
      isLocked: true,
      playerStates: [{ userId: 'u1', isHidden: true }],
    });
    expect(effectiveHidden(scene, 'u1')).toBe(true);
    expect(effectiveLocked(scene, 'u1')).toBe(true); // default
  });

  it('override jiného hráče neovlivní tohoto', () => {
    const scene = makeScene({
      isHidden: false,
      playerStates: [{ userId: 'u2', isHidden: true }],
    });
    expect(effectiveHidden(scene, 'u1')).toBe(false);
  });
});
