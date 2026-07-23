import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { useQueryClient } from '@tanstack/react-query';
import { Users, X, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { currentUserAtom } from '@/shared/store/authStore';
import { anonSessionAtom } from '../store/anonSession';
import type { User } from '@/shared/types';
import { UserRole } from '@/shared/types';
import { Spinner } from '@/shared/ui';
import { useSocketEvent, useSocketReconnect } from '../api/useSocket';
import { getSocket } from '../api/socket';
import {
  chatQueryKeys,
  useRoomInfo,
  useChatHistory,
  useSendMessage,
  useDeleteMessage,
  useToggleReaction,
  useUploadAttachment,
} from '../api/useGlobalChat';
import type {
  ChatAttachment,
  ChatItem,
  ChatMessage,
  MessageDeletedEvent,
  PresenceEvent,
  ReactionEvent,
  RoomInfo,
  RoomKey,
  TypingEvent,
} from '../lib/types';
import { presentUsers } from '../lib/presenceUsers';
import { roomAvatarFor } from '../lib/roomAvatar';
import { toChatItems } from '../lib/chatItems';
import { myRoomsAtom } from '../store/roomsStore';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { UserList } from './UserList';
import { CharacterDetailModal } from './CharacterDetailModal';
import { TypingIndicator } from './TypingIndicator';
import s from './ChatRoom.module.css';

/** Volitelné prostředí Campu — záhlaví scény + pozadí z ilustrace lokace. */
export interface RoomScene {
  /** Obsah pod hlavičkou (výběr stylu/lokace + 📖 panel). */
  node: ReactNode;
  /** URL ilustrace lokace — pozadí místnosti. */
  backgroundUrl?: string;
  /** 16.6 — obsah nad živým logem (blok „Tady jste skončili"). */
  logTopNode?: ReactNode;
}

export interface ChatRoomProps {
  room: RoomKey;
  roomName: string;
  icon: ReactNode;
  /** Vyplněno → místnost běží v „divadelním" režimu Camp. */
  scene?: RoomScene;
}

/** Globální chat — drží socket lifecycle a stav místnosti (Hospoda i Camp). */
export function ChatRoom({ room, roomName, icon, scene }: ChatRoomProps) {
  const member = useAtomValue(currentUserAtom);
  // 15.8 — host (guest): pseudo-identita z anonSession (currentUser je null).
  // Roleplay role je Guest → canDelete/akce pro role≥Admin se ho netýkají.
  const anon = useAtomValue(anonSessionAtom);
  const isGuest = !member && !!anon;
  const user = useMemo<User | null>(
    () =>
      member ??
      (anon
        ? ({
            id: anon.anonId,
            username: anon.anonName,
            role: UserRole.Guest,
          } as User)
        : null),
    [member, anon],
  );
  const navigate = useNavigate();
  const qc = useQueryClient();
  const keys = useMemo(() => chatQueryKeys(room), [room]);
  const roomInfo = useRoomInfo(room);
  const history = useChatHistory(room);
  const sendMutation = useSendMessage(room);
  const deleteMutation = useDeleteMessage(room);
  const toggleReaction = useToggleReaction(room);
  const uploadAttachment = useUploadAttachment(room);

  const [typingNames, setTypingNames] = useState<string[]>([]);
  // Zpráva, na kterou se právě odpovídá (4.3a); `null` = běžná zpráva.
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [usersOpen, setUsersOpen] = useState(false);
  // Detail postavy v Campu — ID kliknuté osoby z `PŘÍTOMNÍ`, `null` = zavřeno.
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  // Auto-odhlášení pro neaktivitu (4.2c §5) — BE odebral z presence.
  const [kicked, setKicked] = useState(false);
  const setMyRooms = useSetAtom(myRoomsAtom);
  const store = useStore();
  // Prázdné dokud effect nepřečte skutečné --theme-surface z DOM.
  const [surfaceColor, setSurfaceColor] = useState('');

  const roomRef = useRef<HTMLDivElement>(null);
  const typingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const channelId = roomInfo.data?.channelId;
  // Dedup dle userId + self-include — viz `presentUsers`.
  const users = useMemo(
    () => presentUsers(roomInfo.data?.users, user),
    [roomInfo.data, user],
  );
  const messages = useMemo(() => history.data ?? [], [history.data]);

  const canDelete =
    !!user &&
    (user.role === UserRole.Superadmin || user.role === UserRole.Admin);
  const usersById = useMemo(
    () => new Map(users.map((u) => [u.userId, u.username])),
    [users],
  );

  // 4.2e §2 — avatar zprávy dle místnosti: Hospoda účet, Camp postava
  // (fallback účet). Zdroj = živá presence. Je to fallback pro zprávy BEZ
  // snapshotu `senderAvatarUrl` (odeslané před BE deployem) od přítomných
  // autorů; v `MessageItem` má snapshot přednost (`senderAvatarUrl ?? …`).
  const avatarByUserId = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of users) {
      const url = roomAvatarFor(room, u);
      if (url) m.set(u.userId, url);
    }
    return m;
  }, [users, room]);

  const resolveAccountAvatar = useCallback(
    (senderId: string) => avatarByUserId.get(senderId),
    [avatarByUserId],
  );

  // Pozn.: ChatRoom se při přepnutí místnosti vždy remountuje (`CampRoom`
  // má `key={room}`, Hospoda je statická) → lokální stav se resetuje sám.

  // Výpis chatu — běžné i systémové zprávy z jedné cache (4.2d §5).
  const items = useMemo<ChatItem[]>(() => toChatItems(messages), [messages]);

  // Barva pozadí panelu pro kontrast guard textu zpráv (čteno z DOM po mountu).
  useEffect(() => {
    if (!roomRef.current) return;
    const bg = getComputedStyle(roomRef.current).backgroundColor;
    if (bg) setSurfaceColor(bg);
  }, []);

  // ── WS listenery — mutují React Query cache, resp. lokální UI stav ─────
  const handleMessage = useCallback(
    (m: ChatMessage) => {
      // N-31 — whisper přichází přes `user:{id}` room do VŠECH otevřených
      // místností (sdílený socket). Přidej zprávu jen pokud patří TÉTO
      // konverzaci, jinak se whisper zobrazí v cizí místnosti.
      if (channelId && m.channelId && m.channelId !== channelId) return;
      qc.setQueryData<ChatMessage[]>(keys.messages, (old) => {
        const list = old ?? [];
        return list.some((x) => x.id === m.id) ? list : [...list, m];
      });
    },
    [qc, keys.messages, channelId],
  );

  const handleDeleted = useCallback(
    (e: MessageDeletedEvent) => {
      qc.setQueryData<ChatMessage[]>(keys.messages, (old) =>
        (old ?? []).map((x) =>
          x.id === e.messageId
            ? { ...x, isDeleted: true, content: null }
            : x,
        ),
      );
    },
    [qc, keys.messages],
  );

  const handlePresence = useCallback(
    (e: PresenceEvent) => {
      // Overlay auto-odhlášení jen pro `timeout` (60min nečinnost). `disconnect`
      // (reload/zavření jiného socketu) ani `explicit` ho nespustí.
      if (
        e.action === 'leave' &&
        e.userId &&
        e.userId === user?.id &&
        e.reason === 'timeout'
      ) {
        setKicked(true);
        // BE nás odebral z místnosti → uvolnit i klientský stav, ať „Vrátit
        // se" znovu joinuje (joinRoom přeskakuje místnosti v `myRoomsAtom`).
        setMyRooms((prev) => {
          const next = new Set(prev);
          next.delete(room);
          return next;
        });
      }
      qc.setQueryData<RoomInfo>(keys.roomInfo, (old) => {
        if (!old) return old;
        if (e.action === 'join') {
          if (!e.userId || old.users.some((u) => u.userId === e.userId)) {
            return old;
          }
          return {
            ...old,
            users: [
              ...old.users,
              {
                userId: e.userId,
                username: e.username,
                avatarUrl: e.avatarUrl,
                characterName: e.characterName,
                characterAvatarUrl: e.characterAvatarUrl,
              },
            ],
          };
        }
        return {
          ...old,
          // N-32 — filtruj výhradně podle userId. Dřívější `&& username !==`
          // odstranilo i nevinného uživatele se stejným jménem a nechalo ghost
          // viset, když si odcházející mezitím změnil přezdívku.
          users: old.users.filter((u) => u.userId !== e.userId),
        };
      });
    },
    [qc, keys.roomInfo, user?.id, room, setMyRooms],
  );

  const handleReaction = useCallback(
    (e: ReactionEvent) => {
      qc.setQueryData<ChatMessage[]>(keys.messages, (old) =>
        (old ?? []).map((x) =>
          x.id === e.messageId ? { ...x, reactions: e.reactions } : x,
        ),
      );
    },
    [qc, keys.messages],
  );

  const handleTyping = useCallback(
    (e: TypingEvent) => {
      if (e.characterName === user?.username) return;
      const timers = typingTimers.current;
      const existing = timers.get(e.characterName);
      if (existing) clearTimeout(existing);
      if (e.isTyping) {
        timers.set(
          e.characterName,
          setTimeout(() => {
            timers.delete(e.characterName);
            setTypingNames(Array.from(timers.keys()));
          }, 5000),
        );
      } else {
        timers.delete(e.characterName);
      }
      setTypingNames(Array.from(timers.keys()));
    },
    [user?.username],
  );

  useSocketEvent<ChatMessage>('chat:message', handleMessage);
  useSocketEvent<MessageDeletedEvent>('chat:message:deleted', handleDeleted);
  useSocketEvent<ReactionEvent>('chat:message:reaction', handleReaction);
  useSocketEvent<PresenceEvent>('chat:presence', handlePresence);
  useSocketEvent<TypingEvent>('chat:typing', handleTyping);

  // C-05 — po reconnectu socket ztratí room membership; re-join + refetch
  // history, ať se doplní zprávy zmeškané během výpadku (jako ChannelView).
  useSocketReconnect(() => {
    if (!channelId || !user) return;
    const socket = getSocket();
    socket.emit('room:join', `chat:${channelId}`);
    // Identita (userId/username/avatar) jde z ověřeného JWT + DB na BE
    // (anti-spoof W-10) — klientská pole se ignorují, posílá se jen `room`.
    if (room === 'hospoda') {
      socket.emit('chat:hospoda:join');
    } else {
      socket.emit('chat:room:join', { room });
    }
    void qc.invalidateQueries({ queryKey: keys.messages });
  });

  // Vstup do místnosti — vyčleněno z effectu, ať ho lze zavolat i ručně
  // po auto-odhlášení („Vrátit se"). Hospoda jede na `chat:hospoda:*` (4.1),
  // Camp na `chat:room:*`.
  const joinRoom = useCallback(() => {
    if (!channelId || !user) return;
    // Už v místnosti jsem (překlik mezi stránkami) → žádný nový join ani
    // hláška „vchází" (4.2d §1). Vstoupit jde znovu jen po skutečném odchodu.
    if (store.get(myRoomsAtom).has(room)) return;
    const socket = getSocket();
    socket.emit('room:join', `chat:${channelId}`);
    // Identita (userId/username/avatar) jde z ověřeného JWT + DB na BE
    // (anti-spoof W-10) — klientská pole se ignorují, posílá se jen `room`.
    if (room === 'hospoda') {
      socket.emit('chat:hospoda:join');
    } else {
      socket.emit('chat:room:join', { room });
    }
    setMyRooms((prev) => new Set(prev).add(room));
  }, [channelId, user, room, setMyRooms, store]);

  // Explicitní odchod z místnosti (4.2d §1/§4) — opuštění stránky neodhlašuje.
  const leaveRoom = useCallback(() => {
    if (!channelId) return;
    const socket = getSocket();
    if (room === 'hospoda') {
      socket.emit('chat:hospoda:leave');
    } else {
      socket.emit('chat:room:leave', { room });
    }
    socket.emit('room:leave', `chat:${channelId}`);
    setMyRooms((prev) => {
      const next = new Set(prev);
      next.delete(room);
      return next;
    });
  }, [channelId, room, setMyRooms]);

  // Vstup při mountu. Odchod NENÍ vázán na unmount — místnost se opouští
  // jen explicitně (tlačítko Odejít / „×" v nav / 60min timeout).
  useEffect(() => {
    joinRoom();
  }, [joinRoom]);

  // Úklid typing timerů při odmountování.
  useEffect(() => {
    const timers = typingTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // ── Akce ──────────────────────────────────────────────────────────────
  // FIX-4 — `mutateAsync` + návratová hodnota, ať `ChatInput.send()` ví, jestli
  // smí smazat rozepsaný text/přílohy (jen po skutečném úspěchu). Toast na
  // chybu řeší `useSendMessage` (onError), tady jen signalizujeme selhání.
  const sendPublic = async (
    text: string,
    attachments: ChatAttachment[],
  ): Promise<boolean> => {
    try {
      await sendMutation.mutateAsync({
        content: text,
        color: user?.chatColor,
        replyToId: replyTo?.id,
        attachments,
      });
      setReplyTo(null);
      return true;
    } catch {
      return false;
    }
  };

  // FIX-4 — whisper jde přes holý socket.emit bez ack; jediná ověřitelná chyba
  // je odpojený socket (dřív tiché zahození zprávy). Reálný BE-side reject se
  // takto nezachytí (žádný ack v protokolu), ale disconnected-case je hlavní
  // pozorovaný symptom tichého selhání.
  const sendWhisper = (
    toUserId: string,
    text: string,
    attachments: ChatAttachment[],
  ): boolean => {
    const socket = getSocket();
    if (!socket.connected) {
      toast.error('Nejsi připojen k chatu — zpráva nebyla odeslána.');
      return false;
    }
    socket.emit('ikaros:whisper', {
      toUserId,
      content: text,
      color: user?.chatColor,
      room,
      replyToId: replyTo?.id,
      attachments,
    });
    setReplyTo(null);
    return true;
  };

  const emitTyping = (isTyping: boolean) => {
    if (!channelId || !user) return;
    getSocket().emit(isTyping ? 'typing:start' : 'typing:stop', {
      channelId,
      characterName: user.username,
    });
  };

  // Odejít z místnosti — explicitní leave + návrat na Úvodník.
  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };
  // Po auto-odhlášení „Vrátit se" — znovu joinuje stejnou místnost.
  const handleReturn = () => {
    setKicked(false);
    joinRoom();
  };

  // ── Render ────────────────────────────────────────────────────────────
  if (!user) return null;

  if (roomInfo.isLoading || history.isLoading) {
    return (
      <div className={s.state}>
        <Spinner />
      </div>
    );
  }

  if (roomInfo.isError) {
    return (
      <div className={s.state}>
        Místnost se nepodařilo otevřít. Zkus to znovu.
      </div>
    );
  }

  return (
    <div
      className={clsx(
        s.room,
        usersOpen && s.usersOpen,
        scene && s.scene,
      )}
      ref={roomRef}
    >
      {scene?.backgroundUrl && (
        <div
          key={scene.backgroundUrl}
          className={s.sceneBg}
          style={{ backgroundImage: `url(${scene.backgroundUrl})` }}
          aria-hidden="true"
        />
      )}

      <header className={s.header}>
        <h1 className={s.title}>
          {icon} {roomName}
        </h1>
        <div className={s.headerActions}>
          {/* Vstup k Vypravěči — FAB je na kolizní ploše skrytý a drawer
              položka je mobil-only; bez tohohle je desktop jen Shift+V. */}
          <button
            type="button"
            className={s.count}
            onClick={() => window.dispatchEvent(new Event('vypravec:otevrit'))}
            aria-label="Vypravěč — nápověda a průvodce"
            title="Vypravěč (Shift+V)"
          >
            🗝️
          </button>
          <button
            type="button"
            className={s.count}
            onClick={() => setUsersOpen((v) => !v)}
            aria-label="Přítomní"
          >
            <Users size={14} /> {users.length}
          </button>
          <button
            type="button"
            className={s.leave}
            onClick={handleLeave}
            aria-label="Odejít z místnosti"
          >
            <LogOut size={14} />
            <span className={s.leaveLabel}>Odejít</span>
          </button>
        </div>
      </header>

      {scene?.node}

      <div className={s.body}>
        <div className={clsx(s.messages, scene && s.scenePanel)}>
          {scene?.logTopNode}
          <MessageList
            items={items}
            currentUserId={user.id}
            surfaceColor={surfaceColor}
            canDelete={canDelete}
            usersById={usersById}
            resolveAccountAvatar={resolveAccountAvatar}
            onDelete={(id) => deleteMutation.mutate(id)}
            onReply={setReplyTo}
            onToggleReaction={toggleReaction}
          />
        </div>

        <aside className={clsx(s.users, scene && s.scenePanel)}>
          <div className={s.usersHead}>
            <span className={s.usersLabel}>Přítomní ({users.length})</span>
            <button
              type="button"
              className={s.usersClose}
              onClick={() => setUsersOpen(false)}
              aria-label="Zavřít"
            >
              <X size={16} />
            </button>
          </div>
          <UserList
            users={users}
            currentUserId={user.id}
            mode={room === 'hospoda' ? 'account' : 'character'}
            onSelectUser={
              room === 'hospoda' ? undefined : setSelectedUserId
            }
          />
        </aside>
      </div>

      <div className={s.foot}>
        <TypingIndicator names={typingNames} />
        <ChatInput
          disabled={!channelId}
          isGuest={isGuest}
          users={users}
          currentUserId={user.id}
          replyTo={replyTo}
          onSendPublic={sendPublic}
          onSendWhisper={sendWhisper}
          onUploadAttachment={(file) => uploadAttachment.mutateAsync(file)}
          onTypingStart={() => emitTyping(true)}
          onTypingStop={() => emitTyping(false)}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>

      <CharacterDetailModal
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />

      {kicked && (
        <div className={s.kicked} role="alertdialog" aria-label="Odhlášen">
          <p className={s.kickedText}>
            Byl jsi odhlášen z místnosti pro neaktivitu.
          </p>
          <button
            type="button"
            className={s.kickedBtn}
            onClick={handleReturn}
          >
            Vrátit se
          </button>
        </div>
      )}
    </div>
  );
}
