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

// S-02 — listener na server-push `error` event volá toast.error; mockujeme
// sonner, ať ověříme zpětnou vazbu bez reálného UI.
const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (msg: string) => toastError(msg) } }));

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

describe('useMapSocket — ping (10.2m)', () => {
  it('emitPing pošle map:ping se sceneId + souřadnicemi + jménem', () => {
    const { result } = renderHook(() => useMapSocket({ sceneId: 'scene-1' }));
    result.current.emitPing(120, 80, 'Gandalf');
    expect(mockSocket.emit).toHaveBeenCalledWith('map:ping', {
      sceneId: 'scene-1',
      x: 120,
      y: 80,
      userName: 'Gandalf',
    });
  });

  it('emitPing je no-op když sceneId == null', () => {
    const { result } = renderHook(() => useMapSocket({ sceneId: null }));
    result.current.emitPing(1, 2, 'X');
    expect(mockSocket.emit).not.toHaveBeenCalledWith(
      'map:ping',
      expect.anything(),
    );
  });

  it('registruje listener map:pinged a předá poziční args do onPing', () => {
    const onPing = vi.fn();
    renderHook(() => useMapSocket({ sceneId: 'scene-1', onPing }));
    const call = mockSocket.on.mock.calls.find((c) => c[0] === 'map:pinged');
    expect(call).toBeDefined();
    const handler = call![1] as (x: number, y: number, n: string) => void;
    handler(50, 60, 'Bilbo');
    expect(onPing).toHaveBeenCalledWith(50, 60, 'Bilbo');
  });

  it('bez onPing listener neregistruje', () => {
    renderHook(() => useMapSocket({ sceneId: 'scene-1' }));
    expect(mockSocket.on).not.toHaveBeenCalledWith(
      'map:pinged',
      expect.anything(),
    );
  });
});

describe('useMapSocket — server error (S-02)', () => {
  const getErrorHandler = (): ((p: {
    code?: string;
    message?: string;
  }) => void) => {
    const call = mockSocket.on.mock.calls.find((c) => c[0] === 'error');
    expect(call).toBeDefined();
    return call![1] as (p: { code?: string; message?: string }) => void;
  };

  it('S-02 — registruje listener na socket error event', () => {
    renderHook(() => useMapSocket({ sceneId: 'scene-1' }));
    expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('S-02 — error event s message zobrazí toast.error s textem ze serveru', () => {
    renderHook(() => useMapSocket({ sceneId: 'scene-1' }));
    getErrorHandler()({ code: 'forbidden', message: 'Nemáš oprávnění.' });
    expect(toastError).toHaveBeenCalledWith('Nemáš oprávnění.');
  });

  it('S-02 — error event bez message má fallback hlášku (operace tichý no-op fix)', () => {
    renderHook(() => useMapSocket({ sceneId: 'scene-1' }));
    getErrorHandler()({});
    expect(toastError).toHaveBeenCalledWith('Operace na mapě se nezdařila.');
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
