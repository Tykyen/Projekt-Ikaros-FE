/**
 * 17.6 — React hook obalující `VoiceProvider` (vzor 13.3 `useYoutubePlayer`).
 *
 * Drží stav hovoru (nepřipojen → připojuje se → v hovoru) a lokální mute/cam/
 * screen. UI vykreslí Jitsi do `containerRef` a ovládá přes vrácené funkce.
 * Provider je vyměnitelný — dnes Jitsi, později LiveKit (jedna změna importu).
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { JitsiVoiceProvider } from './provider/JitsiVoiceProvider';
import type { VoiceProvider, VoiceLocalState } from './provider/types';

export interface VoiceSession {
  containerRef: RefObject<HTMLDivElement | null>;
  joined: boolean;
  connecting: boolean;
  error: string | null;
  local: VoiceLocalState;
  join: () => void;
  leave: () => void;
  toggleMic: () => void;
  toggleCam: () => void;
  toggleScreen: () => void;
}

export function useVoice(opts: {
  roomName: string;
  displayName?: string;
  onJoined?: () => void;
  onLeft?: () => void;
}): VoiceSession {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const providerRef = useRef<VoiceProvider | null>(null);
  const [joined, setJoined] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState<VoiceLocalState>({
    muted: false,
    cam: false,
    screen: false,
  });

  // Callbacky přes ref, ať join/leave nemusí záviset na jejich identitě.
  const onJoinedRef = useRef(opts.onJoined);
  const onLeftRef = useRef(opts.onLeft);
  useEffect(() => {
    onJoinedRef.current = opts.onJoined;
    onLeftRef.current = opts.onLeft;
  }, [opts.onJoined, opts.onLeft]);

  const leave = useCallback(() => {
    providerRef.current?.dispose();
    providerRef.current = null;
    setJoined(false);
    setConnecting(false);
    onLeftRef.current?.();
  }, []);

  const join = useCallback(() => {
    if (providerRef.current || !containerRef.current) return;
    setConnecting(true);
    setError(null);
    const provider = new JitsiVoiceProvider({
      onJoined: () => {
        setJoined(true);
        setConnecting(false);
        onJoinedRef.current?.();
      },
      onLocalStateChanged: setLocal,
      onReadyToClose: () => leave(),
    });
    providerRef.current = provider;
    void provider
      .join(containerRef.current, {
        roomName: opts.roomName,
        displayName: opts.displayName,
        startWithVideoMuted: true,
      })
      .catch(() => {
        setError('Nepodařilo se připojit k hovoru. Zkus to prosím znovu.');
        setConnecting(false);
        providerRef.current = null;
      });
  }, [opts.roomName, opts.displayName, leave]);

  // Úklid při odmountování (odchod ze stránky / pop-out).
  useEffect(() => {
    return () => {
      providerRef.current?.dispose();
      providerRef.current = null;
    };
  }, []);

  const toggleMic = useCallback(() => providerRef.current?.toggleMic(), []);
  const toggleCam = useCallback(() => providerRef.current?.toggleCam(), []);
  const toggleScreen = useCallback(
    () => providerRef.current?.toggleScreen(),
    [],
  );

  return {
    containerRef,
    joined,
    connecting,
    error,
    local,
    join,
    leave,
    toggleMic,
    toggleCam,
    toggleScreen,
  };
}
