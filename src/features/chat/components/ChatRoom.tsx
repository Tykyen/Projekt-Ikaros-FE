import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useQueryClient } from '@tanstack/react-query';
import { Beer, Users, X } from 'lucide-react';
import clsx from 'clsx';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { Spinner } from '@/shared/ui';
import { useSocketEvent } from '../api/useSocket';
import { getSocket } from '../api/socket';
import {
  useRoomInfo,
  useChatHistory,
  useSendMessage,
  useDeleteMessage,
} from '../api/useGlobalChat';
import type {
  ChatItem,
  ChatMessage,
  MessageDeletedEvent,
  PresenceEvent,
  RoomInfo,
  TypingEvent,
} from '../lib/types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { UserList } from './UserList';
import { TypingIndicator } from './TypingIndicator';
import s from './ChatRoom.module.css';

const ROOM_NAME = 'Interdimenzionální hospoda';
const MESSAGES_KEY = ['global-chat', 'messages'];
const ROOM_INFO_KEY = ['global-chat', 'room-info'];

interface SystemLine {
  id: string;
  text: string;
  at: string;
}

const itemTime = (i: ChatItem): number =>
  new Date(i.kind === 'message' ? i.message.createdAt : i.at).getTime();

/** Globální chat „Hospoda" — drží socket lifecycle a stav místnosti. */
export function ChatRoom() {
  const user = useAtomValue(currentUserAtom);
  const qc = useQueryClient();
  const roomInfo = useRoomInfo();
  const history = useChatHistory();
  const sendMutation = useSendMessage();
  const deleteMutation = useDeleteMessage();

  const [systemLines, setSystemLines] = useState<SystemLine[]>([]);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [usersOpen, setUsersOpen] = useState(false);
  // Prázdné dokud effect nepřečte skutečné --theme-surface z DOM.
  const [surfaceColor, setSurfaceColor] = useState('');

  const roomRef = useRef<HTMLDivElement>(null);
  const typingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const channelId = roomInfo.data?.channelId;
  // Dedup dle userId — `room-info` může téhož uživatele uvést víckrát
  // (víc otevřených tabů / socket spojení jednoho člověka).
  const users = useMemo(() => {
    const seen = new Set<string>();
    return (roomInfo.data?.users ?? []).filter((u) => {
      if (seen.has(u.userId)) return false;
      seen.add(u.userId);
      return true;
    });
  }, [roomInfo.data]);
  const messages = useMemo(() => history.data ?? [], [history.data]);

  const canDelete =
    !!user &&
    (user.role === UserRole.Superadmin || user.role === UserRole.Admin);
  const usersById = useMemo(
    () => new Map(users.map((u) => [u.userId, u.username])),
    [users],
  );

  // Zprávy (z React Query cache) + systémové hlášky → jeden časově seřazený výpis.
  const items = useMemo<ChatItem[]>(() => {
    const msgItems: ChatItem[] = messages.map((m) => ({
      kind: 'message',
      message: m,
    }));
    const sysItems: ChatItem[] = systemLines.map((l) => ({
      kind: 'system',
      id: l.id,
      text: l.text,
      at: l.at,
    }));
    return [...msgItems, ...sysItems].sort((a, b) => itemTime(a) - itemTime(b));
  }, [messages, systemLines]);

  // Barva pozadí panelu pro kontrast guard textu zpráv (čteno z DOM po mountu).
  useEffect(() => {
    if (!roomRef.current) return;
    const bg = getComputedStyle(roomRef.current).backgroundColor;
    if (bg) setSurfaceColor(bg);
  }, []);

  // ── WS listenery — mutují React Query cache, resp. lokální UI stav ─────
  const handleMessage = useCallback(
    (m: ChatMessage) => {
      qc.setQueryData<ChatMessage[]>(MESSAGES_KEY, (old) => {
        const list = old ?? [];
        return list.some((x) => x.id === m.id) ? list : [...list, m];
      });
    },
    [qc],
  );

  const handleDeleted = useCallback(
    (e: MessageDeletedEvent) => {
      qc.setQueryData<ChatMessage[]>(MESSAGES_KEY, (old) =>
        (old ?? []).map((x) =>
          x.id === e.messageId
            ? { ...x, isDeleted: true, content: null }
            : x,
        ),
      );
    },
    [qc],
  );

  const handlePresence = useCallback(
    (e: PresenceEvent) => {
      qc.setQueryData<RoomInfo>(ROOM_INFO_KEY, (old) => {
        if (!old) return old;
        if (e.action === 'join') {
          if (!e.userId || old.users.some((u) => u.userId === e.userId)) {
            return old;
          }
          return {
            ...old,
            users: [
              ...old.users,
              { userId: e.userId, username: e.username },
            ],
          };
        }
        return {
          ...old,
          users: old.users.filter(
            (u) => u.userId !== e.userId && u.username !== e.username,
          ),
        };
      });
      setSystemLines((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          text:
            e.action === 'join'
              ? `${e.username} přichází do hospody.`
              : `${e.username} odchází z hospody.`,
          at: new Date().toISOString(),
        },
      ]);
    },
    [qc],
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
  useSocketEvent<PresenceEvent>('chat:presence', handlePresence);
  useSocketEvent<TypingEvent>('chat:typing', handleTyping);

  // Vstup / odchod z místnosti. `getSocket()` voláme až v effectu —
  // má vedlejší efekty (vytvoření socketu), nesmí běžet při renderu.
  useEffect(() => {
    if (!channelId || !user) return;
    const socket = getSocket();
    const room = `chat:${channelId}`;
    socket.emit('room:join', room);
    socket.emit('chat:hospoda:join', {
      username: user.username,
      userId: user.id,
    });
    return () => {
      socket.emit('chat:hospoda:leave', { username: user.username });
      socket.emit('room:leave', room);
    };
  }, [channelId, user]);

  // Úklid typing timerů při odmountování.
  useEffect(() => {
    const timers = typingTimers.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  // ── Akce ──────────────────────────────────────────────────────────────
  const sendPublic = (text: string) => {
    sendMutation.mutate({ content: text, color: user?.chatColor });
  };

  const sendWhisper = (toUserId: string, text: string) => {
    getSocket().emit('ikaros:whisper', {
      toUserId,
      content: text,
      color: user?.chatColor,
    });
  };

  const emitTyping = (isTyping: boolean) => {
    if (!channelId || !user) return;
    getSocket().emit(isTyping ? 'typing:start' : 'typing:stop', {
      channelId,
      characterName: user.username,
    });
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
        Hospodu se nepodařilo otevřít. Zkus to znovu.
      </div>
    );
  }

  return (
    <div className={clsx(s.room, usersOpen && s.usersOpen)} ref={roomRef}>
      <header className={s.header}>
        <h1 className={s.title}>
          <Beer size={18} /> {ROOM_NAME}
        </h1>
        <button
          type="button"
          className={s.count}
          onClick={() => setUsersOpen((v) => !v)}
          aria-label="Přítomní"
        >
          <Users size={14} /> {users.length}
        </button>
      </header>

      <div className={s.body}>
        <div className={s.messages}>
          <MessageList
            items={items}
            currentUserId={user.id}
            surfaceColor={surfaceColor}
            canDelete={canDelete}
            usersById={usersById}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </div>

        <aside className={s.users}>
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
          <UserList users={users} currentUserId={user.id} />
        </aside>
      </div>

      <div className={s.foot}>
        <TypingIndicator names={typingNames} />
        <ChatInput
          disabled={!channelId}
          users={users}
          currentUserId={user.id}
          onSendPublic={sendPublic}
          onSendWhisper={sendWhisper}
          onTypingStart={() => emitTyping(true)}
          onTypingStop={() => emitTyping(false)}
        />
      </div>
    </div>
  );
}
