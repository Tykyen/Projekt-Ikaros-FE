import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import clsx from 'clsx';
import type { ChatUser } from '../lib/types';
import s from './ChatInput.module.css';

/** Po jak dlouhé nečinnosti přestaneme hlásit „píše". */
const TYPING_IDLE_MS = 3000;

interface ChatInputProps {
  disabled: boolean;
  users: ChatUser[];
  currentUserId: string;
  onSendPublic: (text: string) => void;
  onSendWhisper: (toUserId: string, text: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

/** Vstupní lišta — výběr cíle (Všem / whisper), pole, odeslání, typing eventy. */
export function ChatInput({
  disabled,
  users,
  currentUserId,
  onSendPublic,
  onSendWhisper,
  onTypingStart,
  onTypingStop,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [target, setTarget] = useState('all');
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const isTyping = useRef(false);

  const stopTyping = () => {
    clearTimeout(typingTimer.current);
    if (isTyping.current) {
      isTyping.current = false;
      onTypingStop();
    }
  };

  // Cíl whisperu, který mezitím odešel z místnosti, degraduje zpět na „Všem".
  const effectiveTarget =
    target !== 'all' && users.some((u) => u.userId === target) ? target : 'all';

  // Úklid typing stavu při odmountování.
  useEffect(() => stopTyping, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setText(v);
    if (v.trim()) {
      if (!isTyping.current) {
        isTyping.current = true;
        onTypingStart();
      }
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
    } else {
      stopTyping();
    }
  };

  const send = () => {
    const t = text.trim();
    if (!t || disabled) return;
    if (effectiveTarget === 'all') onSendPublic(t);
    else onSendWhisper(effectiveTarget, t);
    setText('');
    stopTyping();
  };

  const isWhisper = effectiveTarget !== 'all';

  return (
    <div className={clsx(s.bar, isWhisper && s.barWhisper)}>
      <select
        className={s.target}
        value={effectiveTarget}
        onChange={(e) => setTarget(e.target.value)}
        disabled={disabled}
        aria-label="Komu napsat"
      >
        <option value="all">Všem</option>
        {users
          .filter((u) => u.userId !== currentUserId)
          .map((u) => (
            <option key={u.userId} value={u.userId}>
              → {u.username}
            </option>
          ))}
      </select>
      <input
        type="text"
        className={s.input}
        value={text}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') send();
        }}
        placeholder={isWhisper ? 'Šeptaná zpráva…' : 'Napiš do hospody…'}
        maxLength={4000}
        disabled={disabled}
      />
      <button
        type="button"
        className={s.send}
        onClick={send}
        disabled={disabled || !text.trim()}
        aria-label="Odeslat"
      >
        <Send size={16} />
      </button>
    </div>
  );
}
