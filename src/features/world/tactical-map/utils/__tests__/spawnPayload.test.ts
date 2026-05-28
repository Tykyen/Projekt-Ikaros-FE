import { describe, it, expect } from 'vitest';
import {
  parseSpawnPayload,
  serializeSpawnPayload,
  hasSpawnPayloadType,
  readSpawnPayload,
  writeSpawnPayload,
  SPAWN_PAYLOAD_MIME,
  type SpawnPayload,
} from '../spawnPayload';

describe('spawnPayload — serialize/parse', () => {
  it('PC round-trip', () => {
    const p: SpawnPayload = {
      kind: 'pc',
      characterId: 'c1',
      characterSlug: 'jan',
      name: 'Jan',
      imageUrl: 'https://x/i.png',
    };
    expect(parseSpawnPayload(serializeSpawnPayload(p))).toEqual(p);
  });

  it('NPC round-trip bez imageUrl', () => {
    const p: SpawnPayload = {
      kind: 'npc',
      characterId: 'n1',
      characterSlug: 'duch',
      name: 'Duch',
    };
    const parsed = parseSpawnPayload(serializeSpawnPayload(p));
    expect(parsed).toEqual({ ...p, imageUrl: undefined });
  });

  it('Bestie round-trip', () => {
    const p: SpawnPayload = { kind: 'bestie', bestieId: 'b1', name: 'Skřet' };
    expect(parseSpawnPayload(serializeSpawnPayload(p))).toEqual(p);
  });

  it('null/undefined/empty → null', () => {
    expect(parseSpawnPayload(null)).toBeNull();
    expect(parseSpawnPayload(undefined)).toBeNull();
    expect(parseSpawnPayload('')).toBeNull();
  });

  it('invalid JSON → null', () => {
    expect(parseSpawnPayload('{nope}')).toBeNull();
  });

  it('neznámý kind → null', () => {
    expect(parseSpawnPayload(JSON.stringify({ kind: 'effect' }))).toBeNull();
  });

  it('PC missing fields → null', () => {
    expect(
      parseSpawnPayload(JSON.stringify({ kind: 'pc', characterId: 'c1' })),
    ).toBeNull();
  });

  it('bestie missing name → null', () => {
    expect(
      parseSpawnPayload(JSON.stringify({ kind: 'bestie', bestieId: 'b1' })),
    ).toBeNull();
  });
});

// jsdom DataTransfer mock — vitest jsdom env nemá DataTransfer plně
function makeDataTransfer(): DataTransfer {
  const store = new Map<string, string>();
  return {
    setData: (type: string, value: string) => store.set(type, value),
    getData: (type: string) => store.get(type) ?? '',
    get types() {
      return Array.from(store.keys());
    },
    effectAllowed: 'none',
    dropEffect: 'none',
    items: {} as DataTransferItemList,
    files: {} as FileList,
    clearData: () => store.clear(),
    setDragImage: () => undefined,
  } as unknown as DataTransfer;
}

describe('spawnPayload — DataTransfer write/read', () => {
  it('write + read round-trip přes primary MIME', () => {
    const dt = makeDataTransfer();
    const p: SpawnPayload = {
      kind: 'pc',
      characterId: 'c1',
      characterSlug: 'jan',
      name: 'Jan',
    };
    writeSpawnPayload(dt, p);
    expect(dt.effectAllowed).toBe('copy');
    expect(readSpawnPayload(dt)).toEqual({ ...p, imageUrl: undefined });
  });

  it('hasSpawnPayloadType true po write', () => {
    const dt = makeDataTransfer();
    writeSpawnPayload(dt, { kind: 'bestie', bestieId: 'b1', name: 'X' });
    expect(hasSpawnPayloadType(dt)).toBe(true);
  });

  it('hasSpawnPayloadType false na prázdný DataTransfer', () => {
    const dt = makeDataTransfer();
    expect(hasSpawnPayloadType(dt)).toBe(false);
  });

  it('fallback z text/plain, když primary MIME prázdné', () => {
    const dt = makeDataTransfer();
    // Simulace Safari, kde primary MIME byl strip
    dt.setData(
      'text/plain',
      JSON.stringify({
        kind: 'npc',
        characterId: 'n1',
        characterSlug: 'x',
        name: 'X',
      }),
    );
    // SPAWN_PAYLOAD_MIME prázdné → fallback funguje
    expect(dt.getData(SPAWN_PAYLOAD_MIME)).toBe('');
    expect(readSpawnPayload(dt)?.kind).toBe('npc');
  });
});
