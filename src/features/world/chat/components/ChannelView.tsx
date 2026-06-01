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
  ChatAttachment,
} from '@/features/chat/lib/types';
import {
  useChannelMessages,
  useDeleteMessage,
  useMarkRead,
  worldChatKeys,
} from '../api/useWorldChat';
import { useEditMessage } from '../api/useEditMessage';
import { useToggleReaction } from '../api/useToggleReaction';
import { useUploadWorldAttachment } from '../api/useUploadWorldAttachment';
import { useMembershipAppearance } from '../api/useMembershipAppearance';
import { useOptimisticSend } from '../api/useOptimisticSend';
import { useChannelMembers } from '../api/useChannelMembers';
import { useWorld } from '@/features/world/api/useWorlds';
import { getFontStack, getFontSize } from '../lib/chatFonts';
import { renderChatContent, type WorldEmoteSet } from '../lib/renderChatContent';
import { ChannelComposer, type ComposerSendPayload } from './ChannelComposer';
import { SoundNowPlayingBanner } from './SoundNowPlayingBanner';
import { MessageEditInline } from './MessageEditInline';
import { RpDateBadge } from './RpDateBadge';
import messageStyles from '@/features/chat/components/MessageItem.module.css';
import type { ChannelUnread, ChatChannel } from '../lib/types';
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
  /** Krok 6.4 — sjednocená sada custom emotů (per-svět + globální). */
  worldEmotes?: WorldEmoteSet;
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
  worldEmotes,
}: ChannelViewProps) {
  const qc = useQueryClient();
  const channelId = channel.id;
  const history = useChannelMessages(worldId, channelId);
  const deleteMutation = useDeleteMessage(worldId);
  const markRead = useMarkRead(worldId);
  const editMutation = useEditMessage(worldId);
  const reactionMutation = useToggleReaction(worldId);
  const uploadMutation = useUploadWorldAttachment(worldId);
  const appearance = useMembershipAppearance(worldId);
  const { members } = useChannelMembers(worldId, channel);
  // Krok 6.3a — `World.dice` whitelist + slug pro CTA v prázdném stavu pickeru.
  const worldQuery = useWorld(worldId);
  const worldDice = worldQuery.data?.dice ?? [];
  const worldSlug = worldQuery.data?.slug ?? worldId;

  const optimistic = useOptimisticSend({
    worldId,
    channelId,
    user: currentUser,
    appearance: appearance.data,
  });

  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [surfaceColor, setSurfaceColor] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  // ── Mention lookup pro renderChatContent (6.2i) ──────────────────────
  const usersByUsername = useMemo(() => {
    const m = new Map<string, { id: string; username: string }>();
    for (const member of members) {
      const u = member.user?.username ?? member.characterPath;
      if (!u) continue;
      m.set(u.toLowerCase(), { id: member.userId, username: u });
    }
    return m;
  }, [members]);

  const resolveFont = useCallback(
    (key: string | null | undefined): string | undefined =>
      key ? getFontStack(key) : undefined,
    [],
  );
  const resolveFontSize = useCallback(
    (key: string | null | undefined): string | undefined =>
      key ? getFontSize(key) : undefined,
    [],
  );

  // Avatar fallback (account-level) — když membership a NPC override nemají
  // obrázek, použij globální profilový avatar uživatele.
  const accountAvatarById = useMemo(() => {
    const m = new Map<string, string>();
    for (const member of members) {
      const url = member.user?.avatarUrl;
      if (url) m.set(member.userId, url);
    }
    return m;
  }, [members]);

  const resolveAccountAvatar = useCallback(
    (senderId: string) => accountAvatarById.get(senderId),
    [accountAvatarById],
  );

  const renderContent = useCallback(
    (m: ChatMessage) => {
      const text = m.content ?? '';
      return renderChatContent(text, {
        worldEmotes,
        mentions: {
          byUsername: usersByUsername,
          mentionedUserIds: new Set(m.mentions ?? []),
          currentUserId: currentUser.id,
        },
        mentionClass: messageStyles.mention,
        mentionSelfClass: messageStyles.mentionSelf,
        emoteClass: messageStyles.emote,
      });
    },
    [usersByUsername, currentUser.id, worldEmotes],
  );

  // ── WS lifecycle ─────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    socket.emit('room:join', `chat:${channelId}`);
    socket.emit('chat:channel:join', {
      channelId,
      userId: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
    });
    // Po otevření konverzace ji okamžitě označ za přečtenou (Discord/Messenger
    // chování — focus = read). BE odbroadcastne `chat:unread { count: 0 }` →
    // sidebar badge zmizí.
    markRead.mutate(channelId);
    return () => {
      socket.emit('chat:channel:leave', { channelId });
      socket.emit('room:leave', `chat:${channelId}`);
    };
    // markRead je stable per worldId — schválně mimo deps (jinak loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, currentUser.id, currentUser.username, currentUser.avatarUrl]);

  useEffect(() => {
    const timers = typingTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // ── WS listenery (dedup dle id + clientNonce — 6.2h) ─────────────────
  const handleMessage = useCallback(
    (m: ChatMessage) => {
      if (m.channelId !== channelId) return;
      qc.setQueryData<ChatMessage[]>(messagesKey, (old) => {
        const list = old ?? [];
        if (list.some((x) => x.id === m.id)) return list;
        // 6.2h — pokud máme lokální optimistic se stejným nonce, swap.
        if (m.clientNonce) {
          const i = list.findIndex((x) => x.clientNonce === m.clientNonce);
          if (i !== -1) {
            const next = [...list];
            next[i] = m;
            return next;
          }
        }
        return [...list, m];
      });
      // Auto-read: konverzaci právě sleduji → ať badge nikdy nenaskočí.
      // Optimisticky vynuluj unread cache (kdyby BE poslal `chat:unread`
      // dřív, než dorazí potvrzení markRead) a pošli markRead. Pro vlastní
      // zprávu je markRead idempotentní → pojistka i pro race scénáře.
      qc.setQueryData<ChannelUnread[]>(
        worldChatKeys(worldId).unread,
        (old) =>
          (old ?? []).map((u) =>
            u.channelId === channelId ? { ...u, count: 0 } : u,
          ),
      );
      if (m.senderId !== currentUser.id) {
        markRead.mutate(channelId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qc, messagesKey, channelId, currentUser.id, worldId],
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

  // ── Akce composeru ───────────────────────────────────────────────────
  const send = (payload: ComposerSendPayload) => {
    optimistic.send({
      content: payload.content,
      attachments: payload.attachments,
      replyToId: payload.replyToId,
      visibleTo: payload.visibleTo,
      overrideName: payload.overrideName,
      overrideAvatarUrl: payload.overrideAvatarUrl,
      rpDate: payload.rpDate,
      color: appearance.data?.chatColor ?? undefined,
      customFont: appearance.data?.chatFont ?? undefined,
      // Krok 6.3 — propagace dice payload + skinu (pokud composer poslal hod).
      dicePayload: payload.dicePayload,
      diceSkin: payload.diceSkin,
    });
  };

  const emitTyping = (isTyping: boolean) => {
    getSocket().emit(isTyping ? 'typing:start' : 'typing:stop', {
      channelId,
      characterName: currentUser.username,
    });
  };

  const startEdit = useCallback((m: ChatMessage) => setEditingId(m.id), []);
  const cancelEdit = useCallback(() => setEditingId(null), []);

  const saveEdit = useCallback(
    async (
      messageId: string,
      payload: {
        content?: string;
        attachmentsToAdd: ChatAttachment[];
        attachmentsToRemove: string[];
      },
    ) => {
      try {
        await editMutation.mutateAsync({ messageId, ...payload });
        setEditingId(null);
      } catch {
        // toast handled by mutation wrapper if needed; keep edit open.
      }
    },
    [editMutation],
  );

  const renderEditor = useCallback(
    (m: ChatMessage) => (
      <MessageEditInline
        worldId={worldId}
        initialContent={m.content ?? ''}
        initialAttachments={m.attachments ?? []}
        onSave={(payload) => saveEdit(m.id, payload)}
        onCancel={cancelEdit}
      />
    ),
    [worldId, saveEdit, cancelEdit],
  );

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
            usersById={new Map(members.map((m) => [m.userId, m.user?.username ?? m.userId]))}
            emptyText="Zatím žádné depeše."
            allowReply={true}
            allowReactions={true}
            renderContent={renderContent}
            renderEditor={renderEditor}
            editingMessageId={editingId}
            onStartEdit={startEdit}
            onRetry={optimistic.retry}
            onDiscard={optimistic.discard}
            renderRpDate={(d) => <RpDateBadge rpDate={d} />}
            resolveFont={resolveFont}
            resolveFontSize={resolveFontSize}
            resolveAccountAvatar={resolveAccountAvatar}
            onDelete={(id) => deleteMutation.mutate(id)}
            onReply={setReplyTo}
            onToggleReaction={(messageId, emoji) =>
              reactionMutation.mutate({ messageId, emoji })
            }
          />
        )}
      </div>

      <div className={s.foot}>
        <SoundNowPlayingBanner
          channelId={channelId}
          currentUserId={currentUser.id}
          canManage={canManage}
        />
        <TypingIndicator names={typingNames} />
        <ChannelComposer
          disabled={false}
          accentColor={accentColor}
          currentUserId={currentUser.id}
          members={members}
          canManage={canManage}
          surfaceColor={surfaceColor}
          worldId={worldId}
          worldDice={worldDice}
          worldSlug={worldSlug}
          channelId={channelId}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onUploadAttachment={(f) => uploadMutation.mutateAsync(f)}
          onSend={send}
          onTypingStart={() => emitTyping(true)}
          onTypingStop={() => emitTyping(false)}
        />
      </div>
    </div>
  );
}
