/**
 * 17.6 — presence hlasového hovoru (kdo je „na mikrofonu" + mute/cam).
 *
 * `inCall=false` → jen poslouchá roster (kdo je v krčmě), sám se nepřipojuje.
 * `inCall=true` → emituje `voice:join` (mount) / `voice:leave` (unmount) a po
 * reconnectu re-join (server po výpadku roster zapomene — viz useSocketReconnect).
 * `sendState` hlásí změnu vlastního mikrofonu/kamery do rosteru ostatních.
 */
import { useCallback, useEffect, useState } from 'react';
import { getSocket } from '@/features/chat/api/socket';
import {
  useSocketEvent,
  useSocketReconnect,
} from '@/features/chat/api/useSocket';
import type {
  RoomKey,
  VoiceParticipant,
  VoiceRosterEvent,
  VoiceStateEvent,
} from '@/features/chat/lib/types';

export interface VoicePresenceHandle {
  roster: VoiceParticipant[];
  sendState: (muted: boolean, cam: boolean) => void;
}

export function useVoicePresence(
  room: RoomKey,
  inCall: boolean,
): VoicePresenceHandle {
  const [roster, setRoster] = useState<VoiceParticipant[]>([]);

  // Celý snímek rosteru (po každém voice join/leave).
  useSocketEvent<VoiceRosterEvent>('chat:voice:presence', (e) => {
    if (e.room === room) setRoster(e.roster);
  });

  // Delta mute/cam jednoho účastníka.
  useSocketEvent<VoiceStateEvent>('chat:voice:state', (e) => {
    if (e.room !== room) return;
    setRoster((prev) =>
      prev.map((p) =>
        p.userId === e.userId ? { ...p, muted: e.muted, cam: e.cam } : p,
      ),
    );
  });

  // Vstup/odchod z hovoru.
  useEffect(() => {
    if (!inCall) return;
    const socket = getSocket();
    socket.emit('voice:join', { room });
    return () => {
      socket.emit('voice:leave', { room });
    };
  }, [room, inCall]);

  // Reconnect — server po výpadku sítě roster zapomene → re-join.
  useSocketReconnect(() => {
    if (inCall) getSocket().emit('voice:join', { room });
  });

  const sendState = useCallback(
    (muted: boolean, cam: boolean) => {
      getSocket().emit('voice:state', { room, muted, cam });
    },
    [room],
  );

  return { roster, sendState };
}
