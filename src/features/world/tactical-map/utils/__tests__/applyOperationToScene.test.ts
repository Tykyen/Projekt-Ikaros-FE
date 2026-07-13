/**
 * 10.2c — testy pro applyOperationToScene pure patcher.
 *
 * Pokrytí: per typ op (23 typů), exhaustive immutability check, edge cases
 * (unknown ID warn-and-skip, combat na inactive, cascade npcTemplate remove).
 */
import { describe, it, expect, vi } from 'vitest';
import { applyOperationToScene } from '../applyOperationToScene';
import type { MapScene, MapToken, MapEffect, MapSceneNpc } from '../../types';

function makeScene(overrides: Partial<MapScene> = {}): MapScene {
  return {
    id: 'scene1',
    worldId: 'world1',
    name: 'Test',
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

function makeToken(id: string, q = 0, r = 0): MapToken {
  return {
    id,
    characterId: 'u1',
    characterSlug: 'abc',
    q,
    r,
    isNpc: false,
    currentHp: 10,
    maxHp: 10,
    baseHp: 10,
    armor: 0,
    baseArmor: 0,
    injury: 0,
    initiative: 0,
    initiativeBase: 0,
    inCombat: false,
    movement: 5,
    abilities: [],
    customData: {},
  };
}

function makeEffect(id: string): MapEffect {
  return { id, type: 'color', hexes: [{ q: 0, r: 0 }], color: '#ff0000' };
}

function makeTemplate(id: string): MapSceneNpc {
  return {
    id,
    name: 'Goblin',
    notes: '',
    maxHp: 5,
    armor: 0,
    injury: 0,
    movement: 5,
    initiativeBase: 0,
    abilities: [],
    customData: {},
  };
}

describe('applyOperationToScene — token ops', () => {
  it('token.add pushne token', () => {
    const scene = makeScene();
    const t = makeToken('t1');
    const next = applyOperationToScene(scene, { type: 'token.add', token: t });
    expect(next.tokens).toHaveLength(1);
    expect(next.tokens[0].id).toBe('t1');
  });

  it('token.move updatuje q/r', () => {
    const scene = makeScene({ tokens: [makeToken('t1', 0, 0)] });
    const next = applyOperationToScene(scene, {
      type: 'token.move',
      tokenId: 't1',
      q: 5,
      r: -2,
    });
    expect(next.tokens[0].q).toBe(5);
    expect(next.tokens[0].r).toBe(-2);
  });

  it('token.move neznámý token → warn + scene unchanged', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const scene = makeScene();
    const next = applyOperationToScene(scene, {
      type: 'token.move',
      tokenId: 'xxx',
      q: 1,
      r: 1,
    });
    expect(next).toBe(scene); // unchanged ref
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('token.remove filtruje token', () => {
    const scene = makeScene({
      tokens: [makeToken('t1'), makeToken('t2')],
    });
    const next = applyOperationToScene(scene, {
      type: 'token.remove',
      tokenId: 't1',
    });
    expect(next.tokens).toHaveLength(1);
    expect(next.tokens[0].id).toBe('t2');
  });

  it('token.update merguje patch', () => {
    const scene = makeScene({ tokens: [makeToken('t1')] });
    const next = applyOperationToScene(scene, {
      type: 'token.update',
      tokenId: 't1',
      patch: { currentHp: 3, injury: 2 },
    });
    expect(next.tokens[0].currentHp).toBe(3);
    expect(next.tokens[0].injury).toBe(2);
    expect(next.tokens[0].maxHp).toBe(10); // unchanged
  });
});

describe('applyOperationToScene — effect ops', () => {
  it('effect.add', () => {
    const scene = makeScene();
    const next = applyOperationToScene(scene, {
      type: 'effect.add',
      effect: makeEffect('e1'),
    });
    expect(next.effects).toHaveLength(1);
  });

  it('effect.remove', () => {
    const scene = makeScene({ effects: [makeEffect('e1'), makeEffect('e2')] });
    const next = applyOperationToScene(scene, {
      type: 'effect.remove',
      effectId: 'e1',
    });
    expect(next.effects).toHaveLength(1);
    expect(next.effects[0].id).toBe('e2');
  });

  it('effect.update', () => {
    const scene = makeScene({ effects: [makeEffect('e1')] });
    const next = applyOperationToScene(scene, {
      type: 'effect.update',
      effectId: 'e1',
      patch: { color: '#00ff00' },
    });
    expect(next.effects[0].color).toBe('#00ff00');
  });
});

describe('applyOperationToScene — fog ops', () => {
  it('fog.set replace celé', () => {
    const scene = makeScene();
    const next = applyOperationToScene(scene, {
      type: 'fog.set',
      enabled: true,
      revealedHexes: [{ q: 1, r: 0 }],
    });
    expect(next.fogEnabled).toBe(true);
    expect(next.revealedHexes).toEqual([{ q: 1, r: 0 }]);
  });

  it('fog.brush reveal — $addToSet (skipne duplikáty)', () => {
    const scene = makeScene({ revealedHexes: [{ q: 0, r: 0 }] });
    const next = applyOperationToScene(scene, {
      type: 'fog.brush',
      mode: 'reveal',
      hexes: [
        { q: 0, r: 0 }, // existující — skip
        { q: 1, r: 0 }, // nový
      ],
    });
    expect(next.revealedHexes).toHaveLength(2);
  });

  it('fog.brush fog — $pullAll (odebere matching)', () => {
    const scene = makeScene({
      revealedHexes: [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
        { q: 2, r: 0 },
      ],
    });
    const next = applyOperationToScene(scene, {
      type: 'fog.brush',
      mode: 'fog',
      hexes: [
        { q: 0, r: 0 },
        { q: 2, r: 0 },
      ],
    });
    expect(next.revealedHexes).toEqual([{ q: 1, r: 0 }]);
  });
});

describe('applyOperationToScene — scene ops', () => {
  it('scene.state partial update', () => {
    const scene = makeScene({ isHidden: false, isLocked: false });
    const next = applyOperationToScene(scene, {
      type: 'scene.state',
      isHidden: true,
    });
    expect(next.isHidden).toBe(true);
    expect(next.isLocked).toBe(false); // unchanged
  });

  // 10.2n — per-hráč override
  it('scene.playerState: upsert override', () => {
    const scene = makeScene({ playerStates: [] });
    const next = applyOperationToScene(scene, {
      type: 'scene.playerState',
      userId: 'u1',
      isHidden: true,
    });
    expect(next.playerStates).toEqual([{ userId: 'u1', isHidden: true }]);
  });

  it('scene.playerState: merge zachová druhé pole', () => {
    const scene = makeScene({ playerStates: [{ userId: 'u1', isLocked: true }] });
    const next = applyOperationToScene(scene, {
      type: 'scene.playerState',
      userId: 'u1',
      isHidden: true,
    });
    expect(next.playerStates).toEqual([
      { userId: 'u1', isLocked: true, isHidden: true },
    ]);
  });

  it('scene.playerState: null smaže pole, prázdný entry zmizí', () => {
    const scene = makeScene({ playerStates: [{ userId: 'u1', isHidden: true }] });
    const next = applyOperationToScene(scene, {
      type: 'scene.playerState',
      userId: 'u1',
      isHidden: null,
    });
    expect(next.playerStates).toEqual([]);
  });

  it('scene.playerState: jiný hráč zůstane nedotčen', () => {
    const scene = makeScene({
      playerStates: [{ userId: 'u2', isLocked: true }],
    });
    const next = applyOperationToScene(scene, {
      type: 'scene.playerState',
      userId: 'u1',
      isHidden: true,
    });
    expect(next.playerStates).toContainEqual({ userId: 'u2', isLocked: true });
    expect(next.playerStates).toContainEqual({ userId: 'u1', isHidden: true });
  });

  it('scene.config replace', () => {
    const scene = makeScene();
    const next = applyOperationToScene(scene, {
      type: 'scene.config',
      config: { size: 50, originX: 10, originY: 20, showGrid: false },
    });
    expect(next.config.size).toBe(50);
    expect(next.config.showGrid).toBe(false);
  });

  it('scene.image', () => {
    const scene = makeScene({ imageUrl: 'old.png' });
    const next = applyOperationToScene(scene, {
      type: 'scene.image',
      imageUrl: 'new.png',
    });
    expect(next.imageUrl).toBe('new.png');
  });

  it('scene.name', () => {
    const scene = makeScene({ name: 'Old' });
    const next = applyOperationToScene(scene, {
      type: 'scene.name',
      name: 'New',
    });
    expect(next.name).toBe('New');
  });

  it('scene.folder null → undefined', () => {
    const scene = makeScene({ folder: 'old' });
    const next = applyOperationToScene(scene, {
      type: 'scene.folder',
      folder: null,
    });
    expect(next.folder).toBeUndefined();
  });
});

describe('applyOperationToScene — sound + combat', () => {
  it('sound.playlist', () => {
    const scene = makeScene();
    const next = applyOperationToScene(scene, {
      type: 'sound.playlist',
      soundIds: ['s1', 's2'],
    });
    expect(next.activeSoundIds).toEqual(['s1', 's2']);
  });

  it('combat.start init', () => {
    const scene = makeScene({
      tokens: [makeToken('t1'), makeToken('t2')],
    });
    const next = applyOperationToScene(scene, {
      type: 'combat.start',
      orderTokenIds: ['t1', 't2'],
    });
    expect(next.combat?.isActive).toBe(true);
    expect(next.combat?.round).toBe(1);
    expect(next.combat?.currentTokenId).toBe('t1');
    expect(next.combat?.order).toEqual(['t1', 't2']);
  });

  it('combat.turn next in order', () => {
    const scene = makeScene({
      combat: {
        isActive: true,
        round: 1,
        currentTokenId: 't1',
        order: ['t1', 't2', 't3'],
        endOfTurnEffects: [],
      },
    });
    const next = applyOperationToScene(scene, { type: 'combat.turn' });
    expect(next.combat?.currentTokenId).toBe('t2');
    expect(next.combat?.round).toBe(1);
  });

  it('combat.turn wrap → round inc', () => {
    const scene = makeScene({
      combat: {
        isActive: true,
        round: 1,
        currentTokenId: 't3',
        order: ['t1', 't2', 't3'],
        endOfTurnEffects: [],
      },
    });
    const next = applyOperationToScene(scene, { type: 'combat.turn' });
    expect(next.combat?.currentTokenId).toBe('t1');
    expect(next.combat?.round).toBe(2);
  });

  it('combat.turn na inactive → warn + scene unchanged', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const scene = makeScene({ combat: null });
    const next = applyOperationToScene(scene, { type: 'combat.turn' });
    expect(next).toBe(scene);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('combat.end', () => {
    const scene = makeScene({
      combat: {
        isActive: true,
        round: 5,
        currentTokenId: 't1',
        order: ['t1'],
        endOfTurnEffects: [],
      },
    });
    const next = applyOperationToScene(scene, { type: 'combat.end' });
    expect(next.combat).toBeNull();
  });

  it('combat.reorder přepíše order, zachová round + currentTokenId', () => {
    const scene = makeScene({
      combat: {
        isActive: true,
        round: 4,
        currentTokenId: 't2',
        order: ['t1', 't2', 't3'],
        endOfTurnEffects: [],
      },
    });
    const next = applyOperationToScene(scene, {
      type: 'combat.reorder',
      orderTokenIds: ['t3', 't1', 't2'],
    });
    expect(next.combat?.order).toEqual(['t3', 't1', 't2']);
    expect(next.combat?.round).toBe(4);
    expect(next.combat?.currentTokenId).toBe('t2');
  });

  it('combat.reorder na inactive → warn + scene unchanged', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const scene = makeScene({ combat: null });
    const next = applyOperationToScene(scene, {
      type: 'combat.reorder',
      orderTokenIds: ['t1'],
    });
    expect(next).toBe(scene);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('applyOperationToScene — npcTemplate cascade', () => {
  it('npcTemplate.add', () => {
    const scene = makeScene();
    const next = applyOperationToScene(scene, {
      type: 'npcTemplate.add',
      template: makeTemplate('tpl1'),
    });
    expect(next.npcTemplates).toHaveLength(1);
  });

  it('npcTemplate.remove cascade — odebere template + všechny instance tokens', () => {
    const scene = makeScene({
      npcTemplates: [makeTemplate('tpl1'), makeTemplate('tpl2')],
      tokens: [
        { ...makeToken('npc1'), isNpc: true, templateId: 'tpl1' },
        { ...makeToken('npc2'), isNpc: true, templateId: 'tpl1' },
        { ...makeToken('npc3'), isNpc: true, templateId: 'tpl2' },
        makeToken('pc1'), // PC token bez templateId
      ],
    });
    const next = applyOperationToScene(scene, {
      type: 'npcTemplate.remove',
      templateId: 'tpl1',
    });
    expect(next.npcTemplates).toHaveLength(1);
    expect(next.npcTemplates[0].id).toBe('tpl2');
    // npc1, npc2 cascade removed; npc3 + pc1 zůstávají
    expect(next.tokens).toHaveLength(2);
    expect(next.tokens.map((t) => t.id).sort()).toEqual(['npc3', 'pc1']);
  });

  it('npcTemplate.update', () => {
    const scene = makeScene({ npcTemplates: [makeTemplate('tpl1')] });
    const next = applyOperationToScene(scene, {
      type: 'npcTemplate.update',
      templateId: 'tpl1',
      patch: { name: 'Hobgoblin', maxHp: 8 },
    });
    expect(next.npcTemplates[0].name).toBe('Hobgoblin');
    expect(next.npcTemplates[0].maxHp).toBe(8);
  });
});

// D-DROBNE-UNDO — ops přicházející typicky jako inverse z undo endpointu
describe('applyOperationToScene — undo ops (D-DROBNE-UNDO)', () => {
  it('scene.activate nastaví isActive (inverse scene.deactivate)', () => {
    const scene = makeScene({ isActive: false });
    const next = applyOperationToScene(scene, { type: 'scene.activate' });
    expect(next.isActive).toBe(true);
    expect(scene.isActive).toBe(false); // immutability
  });

  it('scene.drawings.replace nahradí kresby (inverse drawing.clear)', () => {
    const drawings = [
      {
        id: 'd1',
        kind: 'line' as const,
        points: [0, 0, 10, 10],
        color: '#ffffff',
        createdByUserId: 'u1',
        visibility: 'all' as const,
      },
    ];
    const scene = makeScene({ drawings: [] });
    const next = applyOperationToScene(scene, {
      type: 'scene.drawings.replace',
      drawings,
    });
    expect(next.drawings).toEqual(drawings);
    expect(scene.drawings).toEqual([]); // immutability
  });

  it('scene.drawings.replace prázdným polem kresby smaže (redo clear)', () => {
    const scene = makeScene({
      drawings: [
        {
          id: 'd1',
          kind: 'line' as const,
          points: [0, 0, 10, 10],
          color: '#ffffff',
          createdByUserId: 'u1',
          visibility: 'all' as const,
        },
      ],
    });
    const next = applyOperationToScene(scene, {
      type: 'scene.drawings.replace',
      drawings: [],
    });
    expect(next.drawings).toEqual([]);
  });
});

describe('applyOperationToScene — immutability', () => {
  it('nemutuje původní scene (returns nový objekt)', () => {
    const scene = makeScene({ tokens: [makeToken('t1')] });
    const tokensRef = scene.tokens;
    applyOperationToScene(scene, {
      type: 'token.move',
      tokenId: 't1',
      q: 5,
      r: 5,
    });
    // Původní reference je stejná
    expect(scene.tokens).toBe(tokensRef);
    expect(scene.tokens[0].q).toBe(0); // nedotčeno
  });
});
