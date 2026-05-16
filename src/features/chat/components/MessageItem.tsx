import { Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { ChatMessage } from '../lib/types';
import { parseEmotes } from '../lib/emotes';
import { guardChatColor } from '../lib/chatColorGuard';
import { formatTime } from '../lib/format';
import s from './MessageItem.module.css';

interface MessageItemProps {
  message: ChatMessage;
  currentUserId: string;
  /** Po sobě jdoucí zpráva téhož autora — skryje hlavičku (jméno + čas). */
  grouped: boolean;
  /** Computed `--theme-surface` pro kontrast guard barvy textu. */
  surfaceColor: string;
  /** Admin/Superadmin → zobrazí tlačítko smazat. */
  canDelete: boolean;
  /** userId → username, pro popisek cíle whisperu. */
  usersById: Map<string, string>;
  onDelete: (messageId: string) => void;
}

/** Jedna položka výpisu chatu — veřejná zpráva / whisper / smazaná zpráva. */
export function MessageItem({
  message,
  currentUserId,
  grouped,
  surfaceColor,
  canDelete,
  usersById,
  onDelete,
}: MessageItemProps) {
  const isSelf = message.senderId === currentUserId;
  const isWhisper = !!message.visibleTo && message.visibleTo.length > 0;
  const time = formatTime(message.createdAt);

  if (message.isDeleted) {
    return (
      <div className={clsx(s.item, s.deleted)}>
        <span className={s.deletedText}>Zpráva byla smazána</span>
      </div>
    );
  }

  const content = parseEmotes(message.content ?? '');
  const textColor = guardChatColor(message.color, surfaceColor);

  // Popisek whisperu: odesílatel vidí „→ příjemce", příjemce „od odesílatele".
  let whisperLabel = '';
  if (isWhisper) {
    if (isSelf) {
      const toId = message.visibleTo!.find((id) => id !== currentUserId);
      whisperLabel = `→ ${(toId && usersById.get(toId)) || 'někomu'}`;
    } else {
      whisperLabel = `od ${message.senderName}`;
    }
  }

  return (
    <div
      className={clsx(s.item, isWhisper && s.whisper, grouped && s.grouped)}
    >
      {!grouped && (
        <div className={s.meta}>
          <span className={s.name}>{message.senderName}</span>
          {time && <time className={s.time}>{time}</time>}
        </div>
      )}
      <div className={s.body}>
        {isWhisper && <span className={s.whisperTag}>[šepot {whisperLabel}]</span>}{' '}
        <span className={s.content} style={{ color: textColor }}>
          {content}
        </span>
        {grouped && time && <time className={s.timeHover}>{time}</time>}
        {canDelete && (
          <button
            type="button"
            className={s.delete}
            onClick={() => onDelete(message.id)}
            title="Smazat zprávu"
            aria-label="Smazat zprávu"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
