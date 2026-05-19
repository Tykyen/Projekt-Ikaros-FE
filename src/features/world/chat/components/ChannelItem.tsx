import { type CSSProperties } from 'react';
import { Globe, Lock, Users, Pin } from 'lucide-react';
import clsx from 'clsx';
import type { ChatChannel } from '../lib/types';
import s from './ChannelItem.module.css';

const ACCESS_ICON = { all: Globe, roles: Lock, members: Users } as const;

interface ChannelItemProps {
  channel: ChatChannel;
  active: boolean;
  unread: number;
  pinned: boolean;
  /** Barva kanálu — aktivní segment + badge. */
  accentColor: string;
  onSelect: () => void;
  onTogglePin: () => void;
}

/** Řádek konverzace v sidebaru — ikona accessMode, název, náhled, unread, pin. */
export function ChannelItem({
  channel,
  active,
  unread,
  pinned,
  accentColor,
  onSelect,
  onTogglePin,
}: ChannelItemProps) {
  const Icon = ACCESS_ICON[channel.accessMode] ?? Globe;
  return (
    <div
      className={clsx(s.item, active && s.active)}
      style={{ '--ch-accent': accentColor } as CSSProperties}
    >
      <button type="button" className={s.main} onClick={onSelect}>
        <span className={s.row1}>
          <Icon size={13} className={s.icon} aria-hidden="true" />
          <span className={s.name}>{channel.name}</span>
          {unread > 0 && (
            <span className={s.badge}>{unread > 99 ? '99+' : unread}</span>
          )}
        </span>
        {channel.lastMessagePreview && (
          <span className={s.preview}>{channel.lastMessagePreview}</span>
        )}
      </button>
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
