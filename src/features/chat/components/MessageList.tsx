import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatItem, ChatMessage } from '../lib/types';
import { MessageItem } from './MessageItem';
import { formatTime } from '../lib/format';
import s from './MessageList.module.css';

/** Časové okno pro seskupení zpráv téhož autora. */
const GROUP_WINDOW_MS = 3 * 60 * 1000;
/** Vzdálenost od konce, do které ještě auto-scrollujeme na novou zprávu. */
const STICK_THRESHOLD_PX = 140;
/** Jak dlouho po skoku z citace zvýraznit originál. */
const HIGHLIGHT_MS = 1200;

interface MessageListProps {
  items: ChatItem[];
  currentUserId: string;
  surfaceColor: string;
  canDelete: boolean;
  usersById: Map<string, string>;
  onDelete: (messageId: string) => void;
  /** Začít odpověď na zprávu (4.3a). */
  onReply: (message: ChatMessage) => void;
  /** Toggle emoji reakce (4.3a). */
  onToggleReaction: (messageId: string, emoji: string) => void;
  /** Text prázdného stavu. Default Hospoda („Hospoda je tichá…"). */
  emptyText?: string;
  /** 6.1 — skryje reply tlačítka (reply až 6.2). Default true. */
  allowReply?: boolean;
  /** 6.1 — skryje přidávání reakcí (reakce až 6.2). Default true. */
  allowReactions?: boolean;
}

const isWhisper = (m: ChatMessage) => !!m.visibleTo && m.visibleTo.length > 0;
const msgTime = (m: ChatMessage) => new Date(m.createdAt).getTime();

/** Scrollovací výpis zpráv — seskupování, auto-scroll, empty stav. */
export function MessageList({
  items,
  currentUserId,
  surfaceColor,
  canDelete,
  usersById,
  onDelete,
  onReply,
  onToggleReaction,
  emptyText = 'Hospoda je tichá… zatím. 🍺',
  allowReply = true,
  allowReactions = true,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const didInit = useRef(false);
  // ID zprávy → její root element (pro skok z citace na originál, 4.3a).
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  }, []);

  // Skok na citovaný originál — scroll + krátké zvýraznění. Pokud originál
  // vypadl z načteného okna (starší 50 zpráv), klik nic neudělá.
  const handleJump = useCallback((messageId: string) => {
    const el = itemRefs.current.get(messageId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(messageId);
    clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(
      () => setHighlightedId(null),
      HIGHLIGHT_MS,
    );
  }, []);

  useEffect(() => () => clearTimeout(highlightTimer.current), []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || items.length === 0) return;
    // První naplnění historií — skok na konec bez animace.
    if (!didInit.current) {
      didInit.current = true;
      endRef.current?.scrollIntoView({ behavior: 'auto' });
      return;
    }
    // Dál scrollujeme jen když uživatel není odscrollovaný v historii.
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX;
    if (nearBottom) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items]);

  if (items.length === 0) {
    return <div className={s.empty}>{emptyText}</div>;
  }

  return (
    <div className={s.scroll} ref={scrollRef}>
      {items.map((item, i) => {
        if (item.kind === 'system') {
          return (
            <div key={item.id} className={s.system}>
              <span className={s.systemTime}>{formatTime(item.at)}</span>{' '}
              {item.text}
            </div>
          );
        }
        const prev = items[i - 1];
        const grouped =
          prev?.kind === 'message' &&
          prev.message.senderId === item.message.senderId &&
          isWhisper(prev.message) === isWhisper(item.message) &&
          !item.message.replyToId &&
          msgTime(item.message) - msgTime(prev.message) < GROUP_WINDOW_MS;
        return (
          <MessageItem
            key={item.message.id}
            message={item.message}
            currentUserId={currentUserId}
            grouped={!!grouped}
            surfaceColor={surfaceColor}
            canDelete={canDelete}
            usersById={usersById}
            highlighted={highlightedId === item.message.id}
            onDelete={onDelete}
            onReply={onReply}
            onJumpToMessage={handleJump}
            onToggleReaction={onToggleReaction}
            registerRef={registerRef}
            allowReply={allowReply}
            allowReactions={allowReactions}
          />
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
