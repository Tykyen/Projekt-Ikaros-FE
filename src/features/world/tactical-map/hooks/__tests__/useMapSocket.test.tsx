import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMapSocket } from '../useMapSocket';

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};
vi.mock('@/features/chat/api/socket', () => ({
  getSocket: () => mockSocket,
}));

beforeEach(() => vi.clearAllMocks());

describe('useMapSocket — spotlight (10.2f-3)', () => {
  it('emitSpotlight pošle map:spotlight se sceneId + tokenId', () => {
    const { result } = renderHook(() => useMapSocket({ sceneId: 'scene-1' }));
    result.current.emitSpotlight('tok-9');
    expect(mockSocket.emit).toHaveBeenCalledWith('map:spotlight', {
      sceneId: 'scene-1',
      tokenId: 'tok-9',
    });
  });

  it('emitSpotlight je no-op když sceneId == null', () => {
    const { result } = renderHook(() => useMapSocket({ sceneId: null }));
    result.current.emitSpotlight('tok-9');
    expect(mockSocket.emit).not.toHaveBeenCalledWith(
      'map:spotlight',
      expect.anything(),
    );
  });

  it('registruje listener map:spotlight když je onSpotlight předán', () => {
    renderHook(() =>
      useMapSocket({ sceneId: 'scene-1', onSpotlight: vi.fn() }),
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      'map:spotlight',
      expect.any(Function),
    );
  });

  it('příchozí map:spotlight zavolá onSpotlight s payloadem', () => {
    const onSpotlight = vi.fn();
    renderHook(() => useMapSocket({ sceneId: 'scene-1', onSpotlight }));
    // najdi handler registrovaný pro 'map:spotlight'
    const call = mockSocket.on.mock.calls.find(
      (c) => c[0] === 'map:spotlight',
    );
    expect(call).toBeDefined();
    const handler = call![1] as (p: { tokenId: string }) => void;
    handler({ tokenId: 'tok-3' });
    expect(onSpotlight).toHaveBeenCalledWith({ tokenId: 'tok-3' });
  });
});

describe('useMapSocket — reconnect (10.2i)', () => {
  const getConnectHandler = (): (() => void) => {
    const call = mockSocket.on.mock.calls.find((c) => c[0] === 'connect');
    expect(call).toBeDefined();
    return call![1] as () => void;
  };

  it('registruje listener na socket connect event', () => {
    renderHook(() => useMapSocket({ sceneId: 'scene-1' }));
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
  });

  it('na connect re-joinne scene room a zavolá onReconnect', () => {
    const onReconnect = vi.fn();
    renderHook(() => useMapSocket({ sceneId: 'scene-1', onReconnect }));
    mockSocket.emit.mockClear(); // odfiltruj initial map:join

    getConnectHandler()();

    expect(mockSocket.emit).toHaveBeenCalledWith('map:join', 'scene-1');
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it('na connect bez sceneId nere-joinne, ale onReconnect se nevolá s null scénou', () => {
    const onReconnect = vi.fn();
    renderHook(() => useMapSocket({ sceneId: null, onReconnect }));

    getConnectHandler()();

    expect(mockSocket.emit).not.toHaveBeenCalledWith('map:join', expect.anything());
    // onReconnect se zavolá (guard scene==null je v useMapScene callbacku, ne tady)
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });
});
