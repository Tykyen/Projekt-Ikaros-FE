import { useCallback, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useQueryClient } from '@tanstack/react-query';
import { Signpost } from 'lucide-react';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { ChatRoom } from '../components/ChatRoom';
import { CampHeader } from '../components/CampHeader';
import { CampDescription } from '../components/CampDescription';
import { StartHereBlock } from '../components/StartHereBlock';
import { useSocketEvent } from '../api/useSocket';
import {
  chatQueryKeys,
  useChatHistory,
  useRoomEnvironment,
  useSetRoomEnvironment,
} from '../api/useGlobalChat';
import {
  useSavedGame,
  useSaveGame,
  useLoadGame,
  useStartHere,
} from '../api/useSavedGame';
import { resolveCampRoom } from '../lib/campRooms';
import {
  findPlace,
  placeImageUrl,
  CAMP_DEFAULT_GENRE,
  genreLabel,
} from '../lib/campPlaces';
import type { EnvironmentEvent, RoomEnvironment } from '../lib/types';

/** Role s platformovou funkcí — smí měnit prostředí scény (spec 4.2a §4.3). */
const STAFF_ROLES: UserRole[] = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.SpravceClanku,
  UserRole.SpravceGalerie,
  UserRole.SpravceDiskuzi,
];

/** Camp room → URL segment (pro navigaci po načtení hry do jejího Campu). */
const ROOM_SEGMENT: Record<'camp-1' | 'camp-2' | 'camp-3', string> = {
  'camp-1': 'camp',
  'camp-2': 'camp2',
  'camp-3': 'camp3',
};

type CampRoomKey = 'camp-1' | 'camp-2' | 'camp-3';

/** Jedna místnost Camp — drží sdílené prostředí (žánr + lokace) a hru (16.6). */
function CampRoom({ room }: { room: CampRoomKey }) {
  const user = useAtomValue(currentUserAtom);
  const canEdit = !!user && STAFF_ROLES.includes(user.role);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const envKey = chatQueryKeys(room).environment;

  // Domovský žánr Campu (16.6) — default prostředí + detekce staff override.
  const defaultStyle = CAMP_DEFAULT_GENRE[room];
  const defaultEnv: RoomEnvironment = { style: defaultStyle, placeId: '1' };

  // Prostředí drží React Query cache — `useRoomEnvironment` ho seedne z REST,
  // WS event i lokální změna ho aktualizují přes `setQueryData`.
  const envQuery = useRoomEnvironment(room);
  const setEnv = useSetRoomEnvironment(room);
  const env: RoomEnvironment = envQuery.data ?? defaultEnv;
  const [descOpen, setDescOpen] = useState(false);

  // 16.6 — uložení/načtení hry.
  const savedGame = useSavedGame();
  const saveGame = useSaveGame(room);
  const loadGame = useLoadGame();
  const history = useChatHistory(room);
  const canSaveGame = (history.data?.length ?? 0) > 0;
  const hasSavedGame = !!savedGame.data;

  // 16.6 — sdílený blok „Tady jste skončili" (z WS); lokální skrytí přes ×.
  const startHere = useStartHere(room);
  const [hiddenAt, setHiddenAt] = useState<string | null>(null);
  const visibleStartHere =
    startHere && startHere.at !== hiddenAt ? startHere : null;

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

  const handleSaveGame = () => saveGame.mutate();

  // Načtení přepne scénu v Campu, kde byla hra uložena (BE `loadGame`), a
  // vrátí ho ve `view.room` → přeneseme tam hráče (targeted startHere emit
  // ho čeká při join). Když je hra ze stejného Campu, navigace je no-op a
  // scénu i blok přepnou WS eventy.
  const handleLoadGame = () => {
    loadGame.mutate(undefined, {
      onSuccess: (view) => {
        const seg = ROOM_SEGMENT[view.room as CampRoomKey];
        if (seg) navigate(`/chat/${seg}`);
      },
    });
  };

  const place = findPlace(env.style, env.placeId);
  const backgroundUrl = place
    ? placeImageUrl(env.style, place.image)
    : undefined;

  return (
    <ChatRoom
      room={room}
      roomName={genreLabel(env.style)}
      icon={<Signpost size={18} />}
      scene={{
        backgroundUrl,
        node: (
          <>
            <CampHeader
              environment={env}
              canEdit={canEdit}
              defaultStyle={defaultStyle}
              onChange={handleChange}
              descOpen={descOpen}
              onToggleDesc={() => setDescOpen((v) => !v)}
              onSaveGame={handleSaveGame}
              onLoadGame={handleLoadGame}
              canSaveGame={canSaveGame}
              hasSavedGame={hasSavedGame}
            />
            <CampDescription
              style={env.style}
              placeId={env.placeId}
              open={descOpen}
            />
          </>
        ),
        logTopNode: (
          <StartHereBlock
            startHere={visibleStartHere}
            onClose={() => setHiddenAt(startHere?.at ?? null)}
          />
        ),
      }}
    />
  );
}

/** Stránka `/chat/camp*` — atmosférická roleplay místnost (krok 4.2a / 16.6). */
export default function CampPage() {
  const location = useLocation();
  const segment = location.pathname.split('/').filter(Boolean).pop();
  const resolved = resolveCampRoom(segment);

  if (!resolved) return <Navigate to="/chat" replace />;

  // `key` → čistý remount při přepnutí mezi Campy.
  return <CampRoom key={resolved.room} room={resolved.room as CampRoomKey} />;
}
