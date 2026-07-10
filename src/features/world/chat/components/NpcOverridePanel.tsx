import { useState } from 'react';
import { Theater, X } from 'lucide-react';
import { usePersonaDirectory } from '@/features/world/pages/api/usePersonaDirectory';
import type { PageDirectoryEntry } from '@/features/world/pages/api/pages.types';
import { PersonaAutocomplete } from './PersonaAutocomplete';
import s from './NpcOverridePanel.module.css';

/**
 * Krok 6.2e — inline NPC pruh pod composer toolbarem („Maska").
 *
 * Sticky napříč zprávami (PJ často píše víc replik za sebou). Vypne se buď
 * × OFF tlačítkem, nebo opětovným klikem na razítko 🎭 v toolbaru.
 *
 * 6.2-followup — pole „Jméno NPC" má našeptávač existujících postav/NPC světa
 * (`usePersonaDirectory`). Výběr vyplní jméno + napojí avatar z karty + uloží
 * `slug` (→ klikací jméno v chatu). Volné psaní (ad-hoc NPC bez karty) zůstává;
 * ruční přepis jména po výběru rozváže `slug` (degraduje na ad-hoc).
 *
 * Avatar URL je free-text (validuje BE `@IsUrl`); editace avataru `slug` neruší.
 */

export interface NpcOverrideState {
  name: string;
  avatarUrl: string;
  /** 6.2-followup — slug karty vybrané z adresáře; undefined = ad-hoc (bez vazby). */
  slug?: string;
}

interface Props {
  state: NpcOverrideState;
  worldId: string;
  onChange: (next: NpcOverrideState) => void;
  /** Vypne NPC mód — composer si schová celý pruh. */
  onTurnOff: () => void;
}

export function NpcOverridePanel({
  state,
  worldId,
  onChange,
  onTurnOff,
}: Props) {
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const directory = usePersonaDirectory(worldId);
  const entries = directory.data ?? [];

  const showAvatar = state.avatarUrl.trim().length > 0 && !avatarBroken;

  // Ruční editace jména rozváže vazbu na kartu — jméno už nemusí sedět.
  const handleNameChange = (name: string) => {
    onChange({ ...state, name, slug: undefined });
    setPickerOpen(true);
  };

  const handlePick = (entry: PageDirectoryEntry) => {
    setAvatarBroken(false);
    onChange({ name: entry.title, avatarUrl: entry.imageUrl ?? '', slug: entry.slug });
    setPickerOpen(false);
  };

  return (
    <div className={s.bar} role="group" aria-label="NPC mód">
      <Theater size={14} className={s.icon} aria-hidden="true" />
      <span className={s.label}>Maska:</span>
      <div className={s.nameWrap}>
        <input
          type="text"
          className={s.input}
          value={state.name}
          maxLength={64}
          placeholder="Jméno NPC"
          onChange={(e) => handleNameChange(e.target.value)}
          onFocus={() => setPickerOpen(true)}
          // Delay — ať mousedown na položce pickeru (preventDefault) stihne vybrat.
          onBlur={() => setTimeout(() => setPickerOpen(false), 120)}
          aria-label="Jméno NPC"
          autoComplete="off"
        />
        {pickerOpen && entries.length > 0 && (
          <PersonaAutocomplete
            query={state.name}
            entries={entries}
            onSelect={handlePick}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
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
        // onError jen detekuje rozbitý náhled avataru, není to uživatelská interakce.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
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
