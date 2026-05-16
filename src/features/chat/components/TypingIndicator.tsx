import { typingLabel } from '../lib/typing';
import s from './TypingIndicator.module.css';

interface TypingIndicatorProps {
  /** Jména právě píšících uživatelů (bez aktuálního uživatele). */
  names: string[];
}

/** Indikátor psaní — 3 pulzující tečky + text. */
export function TypingIndicator({ names }: TypingIndicatorProps) {
  if (names.length === 0) return null;
  return (
    <div className={s.wrap} aria-live="polite">
      <span className={s.dots} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className={s.text}>{typingLabel(names)}</span>
    </div>
  );
}
