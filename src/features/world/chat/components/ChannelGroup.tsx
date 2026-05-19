import { type CSSProperties } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import clsx from 'clsx';
import { ChannelItem } from './ChannelItem';
import type { ChatChannel, ChatGroup } from '../lib/types';
import s from './ChannelGroup.module.css';

interface ChannelGroupProps {
  group: ChatGroup;
  channels: ChatChannel[];
  /** Barva kanálu (`var(--chat-group-N)`). */
  color: string;
  collapsed: boolean;
  activeChannelId: string | null;
  unread: Map<string, number>;
  pinned: Set<string>;
  canManage: boolean;
  onToggleCollapse: () => void;
  onSelectChannel: (channelId: string) => void;
  onTogglePin: (channelId: string) => void;
  onAddChannel: () => void;
}

/** Kanál v sidebaru (`ChatGroup`) — sbalovací kontejner konverzací. */
export function ChannelGroup({
  group,
  channels,
  color,
  collapsed,
  activeChannelId,
  unread,
  pinned,
  canManage,
  onToggleCollapse,
  onSelectChannel,
  onTogglePin,
  onAddChannel,
}: ChannelGroupProps) {
  return (
    <section
      className={s.group}
      style={{ '--g-color': color } as CSSProperties}
    >
      <div className={s.header}>
        <button
          type="button"
          className={s.headMain}
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
        >
          <ChevronDown
            size={14}
            className={clsx(s.chevron, collapsed && s.chevronUp)}
          />
          {group.imageUrl ? (
            <img className={s.thumb} src={group.imageUrl} alt="" />
          ) : (
            <span className={s.spine} aria-hidden="true" />
          )}
          <span className={s.name}>{group.name}</span>
        </button>
        {canManage && (
          <button
            type="button"
            className={s.add}
            onClick={onAddChannel}
            title="Nová konverzace"
            aria-label="Nová konverzace"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className={s.channels}>
          {channels.map((c) => (
            <ChannelItem
              key={c.id}
              channel={c}
              active={c.id === activeChannelId}
              unread={unread.get(c.id) ?? 0}
              pinned={pinned.has(c.id)}
              accentColor={color}
              onSelect={() => onSelectChannel(c.id)}
              onTogglePin={() => onTogglePin(c.id)}
            />
          ))}
          {channels.length === 0 && (
            <p className={s.emptyGroup}>Žádné konverzace</p>
          )}
        </div>
      )}
    </section>
  );
}
