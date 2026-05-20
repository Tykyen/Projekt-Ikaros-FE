import { useState } from 'react';
import { Theater, X } from 'lucide-react';
import s from './NpcOverridePanel.module.css';

/**
 * Krok 6.2e — inline NPC pruh pod composer toolbarem.
 *
 * Sticky napříč zprávami (PJ často píše víc replik za sebou). Vypne se buď
 * × OFF tlačítkem, nebo opětovným klikem na razítko 🎭 v toolbaru.
 *
 * Avatar URL je free-text (validuje BE `@IsUrl`). Per-postava výběr z adresáře
 * postav přijde ve fázi 8 — zatím stačí URL.
 */

export interface NpcOverrideState {
  name: string;
  avatarUrl: string;
}

interface Props {
  state: NpcOverrideState;
  onChange: (next: NpcOverrideState) => void;
  /** Vypne NPC mód — composer si schová celý pruh. */
  onTurnOff: () => void;
}

export function NpcOverridePanel({ state, onChange, onTurnOff }: Props) {
  const [avatarBroken, setAvatarBroken] = useState(false);

  const showAvatar =
    state.avatarUrl.trim().length > 0 && !avatarBroken;

  return (
    <div className={s.bar} role="group" aria-label="NPC mód">
      <Theater size={14} className={s.icon} aria-hidden="true" />
      <span className={s.label}>Maska:</span>
      <input
        type="text"
        className={s.input}
        value={state.name}
        maxLength={64}
        placeholder="Jméno NPC"
        onChange={(e) => onChange({ ...state, name: e.target.value })}
        aria-label="Jméno NPC"
      />
      <input
        type="url"
        className={s.input}
        value={state.avatarUrl}
        maxLength={512}
        placeholder="Avatar URL (volitelné)"
        onChange={(e) => {
          setAvatarBroken(false);
          onChange({ ...state, avatarUrl: e.target.value });
        }}
        aria-label="Avatar NPC (URL)"
      />
      {showAvatar && (
        <img
          src={state.avatarUrl}
          alt=""
          className={s.preview}
          onError={() => setAvatarBroken(true)}
        />
      )}
      <button
        type="button"
        className={s.off}
        onClick={onTurnOff}
        title="Vypnout NPC mód"
        aria-label="Vypnout NPC mód"
      >
        <X size={14} />
        <span>OFF</span>
      </button>
    </div>
  );
}
