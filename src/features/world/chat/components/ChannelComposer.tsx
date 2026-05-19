import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Send } from 'lucide-react';
import s from './ChannelComposer.module.css';

interface ChannelComposerProps {
  disabled: boolean;
  /** Barva kanálu — akcent focus-ringu („nit kanálu"). */
  accentColor: string;
  onSend: (text: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

/**
 * Minimální composer světového chatu (krok 6.1) — prostý text + Enter.
 * Whisper / přílohy / reply / NPC mód přijdou v kroku 6.2 (plný feature set).
 */
export function ChannelComposer({
  disabled,
  accentColor,
  onSend,
  onTypingStart,
  onTypingStop,
}: ChannelComposerProps) {
  const [text, setText] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const typing = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-grow textarea do ~5 řádků.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [text]);

  const stopTyping = () => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    if (typing.current) {
      typing.current = false;
      onTypingStop();
    }
  };

  const handleChange = (v: string) => {
    setText(v);
    if (v.trim() && !typing.current) {
      typing.current = true;
      onTypingStart();
    }
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(stopTyping, 3000);
  };

  const send = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText('');
    stopTyping();
  };

  useEffect(() => () => stopTyping(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={s.composer}
      style={{ '--composer-accent': accentColor } as CSSProperties}
    >
      <textarea
        ref={taRef}
        className={s.input}
        value={text}
        rows={1}
        disabled={disabled}
        placeholder={disabled ? 'Vyber konverzaci…' : 'Napiš zprávu…'}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={stopTyping}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />
      <button
        type="button"
        className={s.send}
        onClick={send}
        disabled={disabled || !text.trim()}
        aria-label="Odeslat zprávu"
      >
        <Send size={16} />
      </button>
    </div>
  );
}
