import { useEffect, useRef } from 'react';
import type { ChatItem, ChatMessage } from '../lib/types';
import { MessageItem } from './MessageItem';
import { formatTime } from '../lib/format';
import s from './MessageList.module.css';

/** Časové okno pro seskupení zpráv téhož autora. */
const GROUP_WINDOW_MS = 3 * 60 * 1000;
/** Vzdálenost od konce, do které ještě auto-scrollujeme na novou zprávu. */
const STICK_THRESHOLD_PX = 140;

interface MessageListProps {
  items: ChatItem[];
  currentUserId: string;
  surfaceColor: string;
  canDelete: boolean;
  usersById: Map<string, string>;
  onDelete: (messageId: string) => void;
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
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const didInit = useRef(false);

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
    return <div className={s.empty}>Hospoda je tichá… zatím. 🍺</div>;
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
            onDelete={onDelete}
          />
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
