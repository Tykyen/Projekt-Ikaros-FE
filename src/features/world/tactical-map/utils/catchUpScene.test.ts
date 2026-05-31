import { describe, it, expect, vi, beforeEach } from 'vitest';
import { catchUpScene } from './catchUpScene';
import { getMapOperationsSince } from '../api/mapApi';
import { applyOperationToScene } from './applyOperationToScene';
import type { MapScene, MapOperation } from '../types';

vi.mock('../api/mapApi', () => ({ getMapOperationsSince: vi.fn() }));
vi.mock('./applyOperationToScene', () => ({
  // identity + zaznamenej aplikovanou op (pořadí ověříme přes mock.calls)
  applyOperationToScene: vi.fn((scene: MapScene) => scene),
}));

const baseScene = { id: 'scene1', lastSeqNumber: 5 } as unknown as MapScene;

const entry = (seqNumber: number): { seqNumber: number; op: MapOperation } => ({
  seqNumber,
  op: { type: 'token.move', tokenId: `t${seqNumber}` } as unknown as MapOperation,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('catchUpScene', () => {
  it('aplikuje zmeškané ops v pořadí a nastaví lastSeqNumber na server hodnotu', async () => {
    vi.mocked(getMapOperationsSince).mockResolvedValue({
      sceneId: 'scene1',
      lastSeqNumber: 8,
      operations: [entry(6), entry(7), entry(8)],
    });

    const result = await catchUpScene(baseScene, 5);

    expect(result).not.toBe('too-big');
    expect((result as MapScene).lastSeqNumber).toBe(8);
    // aplikováno přesně 3× a v pořadí 6,7,8
    expect(applyOperationToScene).toHaveBeenCalledTimes(3);
    const calledOps = vi.mocked(applyOperationToScene).mock.calls.map(
      (c) => (c[1] as { tokenId: string }).tokenId,
    );
    expect(calledOps).toEqual(['t6', 't7', 't8']);
    expect(getMapOperationsSince).toHaveBeenCalledWith('scene1', 5, 500);
  });

  it('prázdný seznam → vrátí scénu beze změny (lastSeqNumber ze serveru)', async () => {
    vi.mocked(getMapOperationsSince).mockResolvedValue({
      sceneId: 'scene1',
      lastSeqNumber: 5,
      operations: [],
    });

    const result = await catchUpScene(baseScene, 5);

    expect(result).not.toBe('too-big');
    expect((result as MapScene).lastSeqNumber).toBe(5);
    expect(applyOperationToScene).not.toHaveBeenCalled();
  });

  it('plná stránka (gap > limit) → "too-big"', async () => {
    const ops = Array.from({ length: 3 }, (_, i) => entry(6 + i));
    vi.mocked(getMapOperationsSince).mockResolvedValue({
      sceneId: 'scene1',
      lastSeqNumber: 99,
      operations: ops,
    });

    const result = await catchUpScene(baseScene, 5, 3); // limit = 3, vrátilo 3

    expect(result).toBe('too-big');
    expect(applyOperationToScene).not.toHaveBeenCalled();
  });
});
