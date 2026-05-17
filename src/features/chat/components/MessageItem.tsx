import { useRef, useState } from 'react';
import { Trash2, Reply, SmilePlus, CornerUpLeft } from 'lucide-react';
import clsx from 'clsx';
import type { ChatMessage } from '../lib/types';
import { parseEmotes } from '../lib/emotes';
import { guardChatColor } from '../lib/chatColorGuard';
import { formatTime } from '../lib/format';
import { EmojiPickerPopover } from './EmojiPickerPopover';
import { MessageAttachments } from './MessageAttachments';
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
  /** Krátké zvýraznění po skoku z citace na originál (4.3a). */
  highlighted: boolean;
  onDelete: (messageId: string) => void;
  /** Začít odpověď na tuto zprávu. */
  onReply: (message: ChatMessage) => void;
  /** Skok na citovaný originál (klik na citaci). */
  onJumpToMessage: (messageId: string) => void;
  /** Toggle emoji reakce. */
  onToggleReaction: (messageId: string, emoji: string) => void;
  /** Registrace root elementu do mapy `MessageList` (pro scroll-to). */
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}

/** Jedna položka výpisu chatu — veřejná zpráva / whisper / smazaná zpráva. */
export function MessageItem({
  message,
  currentUserId,
  grouped,
  surfaceColor,
  canDelete,
  usersById,
  highlighted,
  onDelete,
  onReply,
  onJumpToMessage,
  onToggleReaction,
  registerRef,
}: MessageItemProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const reactionBtnRef = useRef<HTMLButtonElement>(null);
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
  const reactions = Object.entries(message.reactions ?? {});

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
      ref={(el) => registerRef(message.id, el)}
      className={clsx(
        s.item,
        isWhisper && s.whisper,
        grouped && s.grouped,
        highlighted && s.highlighted,
      )}
    >
      {!grouped && (
        <div className={s.meta}>
          <span className={s.name}>{message.senderName}</span>
          {time && <time className={s.time}>{time}</time>}
        </div>
      )}

      {/* Citace zprávy, na kterou se odpovídá (4.3a). */}
      {message.replyToId && (
        <button
          type="button"
          className={s.replyQuote}
          onClick={() => onJumpToMessage(message.replyToId!)}
        >
          <CornerUpLeft size={12} className={s.replyIcon} />
          <span className={s.replyName}>
            {message.replyToSenderName ?? 'někdo'}
          </span>
          <span className={s.replyPreview}>{message.replyToPreview}</span>
        </button>
      )}

      <div className={s.body}>
        {isWhisper && <span className={s.whisperTag}>[šepot {whisperLabel}]</span>}{' '}
        <span className={s.content} style={{ color: textColor }}>
          {content}
        </span>
        {grouped && time && <time className={s.timeHover}>{time}</time>}

        <div className={s.actions}>
          <button
            type="button"
            className={s.action}
            onClick={() => onReply(message)}
            title="Odpovědět"
            aria-label="Odpovědět"
          >
            <Reply size={14} />
          </button>
          <button
            ref={reactionBtnRef}
            type="button"
            className={s.action}
            onClick={() => setPickerOpen((v) => !v)}
            title="Přidat reakci"
            aria-label="Přidat reakci"
          >
            <SmilePlus size={14} />
          </button>
          {pickerOpen && (
            <EmojiPickerPopover
              anchorRef={reactionBtnRef}
              onSelect={(emoji) => onToggleReaction(message.id, emoji)}
              onClose={() => setPickerOpen(false)}
            />
          )}
          {canDelete && (
            <button
              type="button"
              className={clsx(s.action, s.delete)}
              onClick={() => onDelete(message.id)}
              title="Smazat zprávu"
              aria-label="Smazat zprávu"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Přílohy zprávy (4.3b). */}
      {message.attachments && message.attachments.length > 0 && (
        <MessageAttachments attachments={message.attachments} />
      )}

      {/* Emoji reakce (4.3a). */}
      {reactions.length > 0 && (
        <div className={s.reactions}>
          {reactions.map(([emoji, userIds]) => (
            <button
              key={emoji}
              type="button"
              className={clsx(
                s.chip,
                userIds.includes(currentUserId) && s.chipMine,
              )}
              onClick={() => onToggleReaction(message.id, emoji)}
              aria-label={`Reakce ${emoji}, ${userIds.length}×`}
            >
              <span className={s.chipEmoji}>{emoji}</span>
              <span className={s.chipCount}>{userIds.length}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
