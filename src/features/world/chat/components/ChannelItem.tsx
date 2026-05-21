import { type CSSProperties, type ReactNode } from 'react';
import { Globe, Lock, Users, Pin, Settings } from 'lucide-react';
import clsx from 'clsx';
import type { ChatChannel } from '../lib/types';
import s from './ChannelItem.module.css';

const ACCESS_ICON = { all: Globe, roles: Lock, members: Users } as const;

interface ChannelItemProps {
  channel: ChatChannel;
  active: boolean;
  unread: number;
  /**
   * D-NEW-chat-mention-sidebar-dot (2026-05-21) — počet self-mention zpráv po
   * last-read. Pokud >0, vedle unread badge se zobrazí červený dot.
   */
  mentionCount?: number;
  pinned: boolean;
  /** Barva kanálu — aktivní segment + badge. */
  accentColor: string;
  canManage: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
  onEdit: () => void;
  /** Drag handle slot (krok 6.5b) — opt-in; pinned sekce ho nepředá. */
  dragHandle?: ReactNode;
}

/**
 * Řádek konverzace v sidebaru — thumbnail nebo ikona accessMode, název,
 * náhled, unread badge, pin a (pro PJ) Settings ikona.
 */
export function ChannelItem({
  channel,
  active,
  unread,
  mentionCount = 0,
  pinned,
  accentColor,
  canManage,
  onSelect,
  onTogglePin,
  onEdit,
  dragHandle,
}: ChannelItemProps) {
  const Icon = ACCESS_ICON[channel.accessMode] ?? Globe;
  return (
    <div
      className={clsx(s.item, active && s.active)}
      style={{ '--ch-accent': accentColor } as CSSProperties}
    >
      {dragHandle}
      <button type="button" className={s.main} onClick={onSelect}>
        <span className={s.row1}>
          {channel.imageUrl ? (
            <span className={s.thumbWrap} aria-hidden="true">
              <img className={s.thumb} src={channel.imageUrl} alt="" />
              <Icon size={10} className={s.thumbAccess} />
            </span>
          ) : (
            <Icon size={13} className={s.icon} aria-hidden="true" />
          )}
          <span className={s.name}>{channel.name}</span>
          {mentionCount > 0 && (
            <span
              className={s.mentionDot}
              aria-label={`${mentionCount} zmínek pro tebe`}
              title={`${mentionCount} zmínek pro tebe`}
            />
          )}
          {unread > 0 && (
            <span className={s.badge}>{unread > 99 ? '99+' : unread}</span>
          )}
        </span>
        {channel.lastMessagePreview && (
          <span className={s.preview}>{channel.lastMessagePreview}</span>
        )}
      </button>
      {canManage && (
        <button
          type="button"
          className={s.edit}
          onClick={onEdit}
          aria-label="Upravit konverzaci"
          title="Upravit konverzaci"
        >
          <Settings size={12} />
        </button>
      )}
      <button
        type="button"
        className={clsx(s.pin, pinned && s.pinned)}
        onClick={onTogglePin}
        aria-label={pinned ? 'Odepnout konverzaci' : 'Připnout konverzaci'}
        title={pinned ? 'Odepnout' : 'Připnout'}
      >
        <Pin size={12} />
      </button>
    </div>
  );
}
