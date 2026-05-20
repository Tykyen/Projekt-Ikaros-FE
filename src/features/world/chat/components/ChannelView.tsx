import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Menu, Users, Search } from 'lucide-react';
import { Spinner } from '@/shared/ui';
import type { User } from '@/shared/types';
import { getSocket } from '@/features/chat/api/socket';
import { useSocketEvent } from '@/features/chat/api/useSocket';
import { MessageList } from '@/features/chat/components/MessageList';
import { TypingIndicator } from '@/features/chat/components/TypingIndicator';
import { toChatItems } from '@/features/chat/lib/chatItems';
import type {
  ChatMessage,
  ChatItem,
} from '@/features/chat/lib/types';
import {
  useChannelMessages,
  useSendMessage,
  useDeleteMessage,
  worldChatKeys,
} from '../api/useWorldChat';
import { ChannelComposer } from './ChannelComposer';
import type { ChatChannel } from '../lib/types';
import s from './ChannelView.module.css';

interface ChannelViewProps {
  worldId: string;
  channel: ChatChannel;
  /** Barva kanálu konverzace — „nit". */
  accentColor: string;
  currentUser: User;
  canManage: boolean;
  /** Mobil — otevře sidebar. */
  onOpenSidebar: () => void;
  /** Toggle panelu Přítomní (PJ-only). Bez prop tlačítko nezobrazím. */
  onToggleMembers?: () => void;
  /** Aktuální stav panelu Přítomní — active styling tlačítka. */
  membersOpen?: boolean;
  /** Počet právě přítomných — badge na tlačítku, když je panel zavřený. */
  presenceCount?: number;
  /** Otevře modal hledání ve zprávách (krok 6.6). */
  onOpenSearch: () => void;
}

interface TypingEvent {
  channelId: string;
  characterName: string;
  isTyping: boolean;
}
interface DeletedEvent {
  messageId: string;
  channelId: string;
}

/** Prostřední panel — aktivní konverzace: header + zprávy + composer. */
export function ChannelView({
  worldId,
  channel,
  accentColor,
  currentUser,
  canManage,
  onOpenSidebar,
  onToggleMembers,
  membersOpen = false,
  presenceCount = 0,
  onOpenSearch,
}: ChannelViewProps) {
  const qc = useQueryClient();
  const channelId = channel.id;
  const history = useChannelMessages(worldId, channelId);
  const sendMutation = useSendMessage(worldId, channelId);
  const deleteMutation = useDeleteMessage(worldId);

  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [surfaceColor, setSurfaceColor] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const typingTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  const messagesKey = useMemo(
    () => worldChatKeys(worldId).messages(channelId),
    [worldId, channelId],
  );
  const messages = useMemo(() => history.data ?? [], [history.data]);
  const items = useMemo<ChatItem[]>(() => toChatItems(messages), [messages]);

  // Barva pozadí pro kontrast guard textu zpráv.
  useEffect(() => {
    if (!rootRef.current) return;
    const bg = getComputedStyle(rootRef.current).backgroundColor;
    if (bg) setSurfaceColor(bg);
  }, []);

  // ── WS lifecycle: vstup/odchod z roomu konverzace + presence ────────────
  useEffect(() => {
    const socket = getSocket();
    socket.emit('room:join', `chat:${channelId}`);
    socket.emit('chat:channel:join', {
      channelId,
      userId: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
    });
    return () => {
      socket.emit('chat:channel:leave', { channelId });
      socket.emit('room:leave', `chat:${channelId}`);
    };
  }, [channelId, currentUser.id, currentUser.username, currentUser.avatarUrl]);

  // Úklid typing timerů při odmountování (komponenta se remountuje per
  // konverzace — `key` ve `WorldChatRoom` → stav se resetuje sám).
  useEffect(() => {
    const timers = typingTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // ── WS listenery ────────────────────────────────────────────────────────
  const handleMessage = useCallback(
    (m: ChatMessage) => {
      if (m.channelId !== channelId) return;
      qc.setQueryData<ChatMessage[]>(messagesKey, (old) => {
        const list = old ?? [];
        return list.some((x) => x.id === m.id) ? list : [...list, m];
      });
    },
    [qc, messagesKey, channelId],
  );

  const handleUpdated = useCallback(
    (m: ChatMessage) => {
      if (m.channelId !== channelId) return;
      qc.setQueryData<ChatMessage[]>(messagesKey, (old) =>
        (old ?? []).map((x) => (x.id === m.id ? m : x)),
      );
    },
    [qc, messagesKey, channelId],
  );

  const handleDeleted = useCallback(
    (e: DeletedEvent) => {
      if (e.channelId !== channelId) return;
      qc.setQueryData<ChatMessage[]>(messagesKey, (old) =>
        (old ?? []).map((x) =>
          x.id === e.messageId
            ? { ...x, isDeleted: true, content: null }
            : x,
        ),
      );
    },
    [qc, messagesKey, channelId],
  );

  const handleTyping = useCallback(
    (e: TypingEvent) => {
      if (e.channelId !== channelId) return;
      if (e.characterName === currentUser.username) return;
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
    [channelId, currentUser.username],
  );

  useSocketEvent<ChatMessage>('chat:message', handleMessage);
  useSocketEvent<ChatMessage>('chat:message:updated', handleUpdated);
  useSocketEvent<DeletedEvent>('chat:message:deleted', handleDeleted);
  useSocketEvent<TypingEvent>('chat:typing', handleTyping);

  // ── Akce ────────────────────────────────────────────────────────────────
  const send = (text: string) => {
    sendMutation.mutate({ content: text, color: currentUser.chatColor });
  };

  const emitTyping = (isTyping: boolean) => {
    getSocket().emit(isTyping ? 'typing:start' : 'typing:stop', {
      channelId,
      characterName: currentUser.username,
    });
  };

  return (
    <div
      className={s.view}
      ref={rootRef}
      style={{ '--ch-accent': accentColor } as CSSProperties}
    >
      <header className={s.header}>
        <button
          type="button"
          className={s.iconBtn}
          onClick={onOpenSidebar}
          aria-label="Konverzace"
        >
          <Menu size={18} />
        </button>
        <h1 className={s.title}>{channel.name}</h1>
        <button
          type="button"
          className={s.search}
          onClick={onOpenSearch}
          aria-label="Hledat ve zprávách"
          title="Hledat ve zprávách"
        >
          <Search size={18} />
        </button>
        {onToggleMembers && (
          <button
            type="button"
            className={clsx(
              s.membersBtn,
              membersOpen && s.membersBtnActive,
            )}
            onClick={onToggleMembers}
            aria-label={
              membersOpen
                ? 'Zavřít panel Přítomní'
                : presenceCount > 0
                  ? `Přítomní (${presenceCount} online)`
                  : 'Přítomní'
            }
            title={
              membersOpen ? 'Zavřít panel Přítomní' : 'Otevřít panel Přítomní'
            }
          >
            <Users size={18} />
            {!membersOpen && presenceCount > 0 && (
              <span className={s.presenceBadge}>
                {presenceCount > 99 ? '99+' : presenceCount}
              </span>
            )}
          </button>
        )}
      </header>

      <div className={s.body}>
        {history.isLoading ? (
          <div className={s.state}>
            <Spinner />
          </div>
        ) : history.isError ? (
          <div className={s.state}>Konverzaci se nepodařilo načíst.</div>
        ) : (
          <MessageList
            items={items}
            currentUserId={currentUser.id}
            surfaceColor={surfaceColor}
            canDelete={canManage}
            usersById={new Map()}
            emptyText="Zatím žádné depeše."
            allowReply={false}
            allowReactions={false}
            onDelete={(id) => deleteMutation.mutate(id)}
            onReply={() => {}}
            onToggleReaction={() => {}}
          />
        )}
      </div>

      <div className={s.foot}>
        <TypingIndicator names={typingNames} />
        <ChannelComposer
          disabled={sendMutation.isPending}
          accentColor={accentColor}
          onSend={send}
          onTypingStart={() => emitTyping(true)}
          onTypingStop={() => emitTyping(false)}
        />
      </div>
    </div>
  );
}
