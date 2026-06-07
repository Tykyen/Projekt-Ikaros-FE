import type { usePush } from '../api/usePush';
import s from './NotificationCenter.module.css';

interface PushToggleProps {
  /** Sdílený push stav z `usePush` (zvednutý v NotificationCenter). */
  push: ReturnType<typeof usePush>;
}

/**
 * Spec 13.2c — přepínač push notifikací na tomto zařízení (patička centra).
 * Skryje se na zařízeních bez podpory push.
 */
export function PushToggle({ push }: PushToggleProps) {
  const { supported, isSubscribed, busy, denied, enable, disable } = push;

  if (!supported) return null;

  return (
    <div className={s.pushBar}>
      <span className={s.pushLabel}>🔔 Upozornění na tomto zařízení</span>
      {denied ? (
        <span className={s.pushHint}>Zakázáno v prohlížeči</span>
      ) : (
        <button
          type="button"
          className={s.pushBtn}
          onClick={() => void (isSubscribed ? disable() : enable())}
          disabled={busy}
          aria-pressed={isSubscribed}
        >
          {busy ? '…' : isSubscribed ? 'Vypnout' : 'Zapnout'}
        </button>
      )}
    </div>
  );
}
