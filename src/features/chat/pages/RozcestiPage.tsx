import { useCallback, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useQueryClient } from '@tanstack/react-query';
import { Signpost } from 'lucide-react';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { ChatRoom } from '../components/ChatRoom';
import { RozcestiHeader } from '../components/RozcestiHeader';
import { RozcestiDescription } from '../components/RozcestiDescription';
import { useSocketEvent } from '../api/useSocket';
import {
  chatQueryKeys,
  useRoomEnvironment,
  useSetRoomEnvironment,
} from '../api/useGlobalChat';
import { resolveRozcestiRoom } from '../lib/rozcestiRooms';
import { findPlace, placeImageUrl } from '../lib/rozcestiPlaces';
import type { EnvironmentEvent, RoomEnvironment, RoomKey } from '../lib/types';

/** Role s platformovou funkcí — smí měnit prostředí scény (spec 4.2a §4.3). */
const STAFF_ROLES: UserRole[] = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.SpravceClanku,
  UserRole.SpravceGalerie,
  UserRole.SpravceDiskuzi,
];

const DEFAULT_ENV: RoomEnvironment = { style: 'fantasy', placeId: '1' };

/** Jedna místnost Rozcestí — drží sdílené prostředí (styl + lokace). */
function RozcestiRoom({ room, name }: { room: RoomKey; name: string }) {
  const user = useAtomValue(currentUserAtom);
  const canEdit = !!user && STAFF_ROLES.includes(user.role);
  const qc = useQueryClient();
  const envKey = chatQueryKeys(room).environment;

  // Prostředí drží React Query cache — `useRoomEnvironment` ho seedne z REST,
  // WS event i lokální změna ho aktualizují přes `setQueryData` (žádný
  // duplicitní useState → žádný seed-effect).
  const envQuery = useRoomEnvironment(room);
  const setEnv = useSetRoomEnvironment(room);
  const env: RoomEnvironment = envQuery.data ?? DEFAULT_ENV;
  const [descOpen, setDescOpen] = useState(false);

  // Sdílená změna prostředí od kohokoli z místnosti.
  const handleEnvEvent = useCallback(
    (e: EnvironmentEvent) => {
      if (e.room === room) {
        qc.setQueryData<RoomEnvironment>(envKey, {
          style: e.style,
          placeId: e.placeId,
        });
      }
    },
    [room, qc, envKey],
  );
  useSocketEvent<EnvironmentEvent>('chat:room:environment', handleEnvEvent);

  const handleChange = (next: RoomEnvironment) => {
    qc.setQueryData<RoomEnvironment>(envKey, next); // optimistic — WS echo potvrdí
    setEnv.mutate(next);
  };

  const place = findPlace(env.style, env.placeId);
  const backgroundUrl = place
    ? placeImageUrl(env.style, place.image)
    : undefined;

  return (
    <ChatRoom
      room={room}
      roomName={name}
      icon={<Signpost size={18} />}
      scene={{
        backgroundUrl,
        node: (
          <>
            <RozcestiHeader
              environment={env}
              canEdit={canEdit}
              onChange={handleChange}
              descOpen={descOpen}
              onToggleDesc={() => setDescOpen((v) => !v)}
            />
            <RozcestiDescription
              style={env.style}
              placeId={env.placeId}
              open={descOpen}
            />
          </>
        ),
      }}
    />
  );
}

/** Stránka `/chat/rozcesti*` — atmosférická roleplay místnost (krok 4.2a). */
export default function RozcestiPage() {
  const location = useLocation();
  const segment = location.pathname.split('/').filter(Boolean).pop();
  const resolved = resolveRozcestiRoom(segment);

  if (!resolved) return <Navigate to="/chat" replace />;

  // `key` → čistý remount při přepnutí mezi Rozcestími I.–III.
  return (
    <RozcestiRoom key={resolved.room} room={resolved.room} name={resolved.name} />
  );
}
