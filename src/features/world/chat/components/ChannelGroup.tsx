import { type CSSProperties, type ReactNode } from 'react';
import { ChevronDown, Plus, Settings } from 'lucide-react';
import clsx from 'clsx';
import { ChannelItem } from './ChannelItem';
import { GroupIcon } from '../lib/groupIcons';
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
  /** D-NEW-chat-mention-sidebar-dot — počet self-mention zpráv per konverzace. */
  mentionCounts?: Map<string, number>;
  pinned: Set<string>;
  canManage: boolean;
  onToggleCollapse: () => void;
  onSelectChannel: (channelId: string) => void;
  onTogglePin: (channelId: string) => void;
  onAddChannel: () => void;
  onEditGroup: () => void;
  onEditChannel: (channel: ChatChannel) => void;
  /** Drag handle slot pro celý kanál (krok 6.5a) — opt-in. */
  dragHandle?: ReactNode;
  /**
   * Render-prop pro vnoření `DndContext` + `SortableContext` kolem celého
   * channel listu (krok 6.5b). Když není dodán, channels se renderují
   * plochým mapem (např. pinned sekce nebo ne-PJ mód).
   */
  renderChannelList?: (channels: ChatChannel[]) => ReactNode;
}

/** Kanál v sidebaru (`ChatGroup`) — sbalovací kontejner konverzací. */
export function ChannelGroup({
  group,
  channels,
  color,
  collapsed,
  activeChannelId,
  unread,
  mentionCounts,
  pinned,
  canManage,
  onToggleCollapse,
  onSelectChannel,
  onTogglePin,
  onAddChannel,
  onEditGroup,
  onEditChannel,
  dragHandle,
  renderChannelList,
}: ChannelGroupProps) {
  const totalUnread = channels.reduce(
    (sum, c) => sum + (unread.get(c.id) ?? 0),
    0,
  );
  const showHeaderBadge = totalUnread > 0;
  // 6.7c revize — sbalený kanál ukáže JEN aktivní konverzaci (Matrix styl).
  const activeChannel = collapsed
    ? channels.find((c) => c.id === activeChannelId)
    : undefined;
  return (
    <section
      className={s.group}
      style={{ '--g-color': color } as CSSProperties}
    >
      <div className={s.header}>
        {dragHandle}
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
          ) : group.iconKey ? (
            <span className={s.iconWrap} aria-hidden="true">
              <GroupIcon iconKey={group.iconKey} size={14} />
            </span>
          ) : (
            <span className={s.spine} aria-hidden="true" />
          )}
          <span className={s.name}>{group.name}</span>
          {showHeaderBadge && (
            <span
              className={s.badge}
              aria-label={`${totalUnread} nepřečtených zpráv v kanálu`}
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </button>
        {canManage && (
          <>
            <button
              type="button"
              className={s.edit}
              onClick={onEditGroup}
              title="Upravit kanál"
              aria-label="Upravit kanál"
            >
              <Settings size={14} />
            </button>
            <button
              type="button"
              className={s.add}
              onClick={onAddChannel}
              title="Nová konverzace"
              aria-label="Nová konverzace"
            >
              <Plus size={14} />
            </button>
          </>
        )}
      </div>

      {collapsed
        ? // Sbaleno → jen aktivní konverzace (pokud v tomto kanálu je), bez reorderu.
          activeChannel && (
            <div className={s.channels}>
              <ChannelItem
                channel={activeChannel}
                active
                unread={unread.get(activeChannel.id) ?? 0}
                mentionCount={mentionCounts?.get(activeChannel.id) ?? 0}
                pinned={pinned.has(activeChannel.id)}
                accentColor={color}
                canManage={canManage}
                onSelect={() => onSelectChannel(activeChannel.id)}
                onTogglePin={() => onTogglePin(activeChannel.id)}
                onEdit={() => onEditChannel(activeChannel)}
              />
            </div>
          )
        : // Rozbaleno → všechny konverzace (sortable reorder).
          <div className={s.channels}>
            {renderChannelList
              ? renderChannelList(channels)
              : channels.map((c) => (
                  <ChannelItem
                    key={c.id}
                    channel={c}
                    active={c.id === activeChannelId}
                    unread={unread.get(c.id) ?? 0}
                    mentionCount={mentionCounts?.get(c.id) ?? 0}
                    pinned={pinned.has(c.id)}
                    accentColor={color}
                    canManage={canManage}
                    onSelect={() => onSelectChannel(c.id)}
                    onTogglePin={() => onTogglePin(c.id)}
                    onEdit={() => onEditChannel(c)}
                  />
                ))}
            {channels.length === 0 && (
              <p className={s.emptyGroup}>Žádné konverzace</p>
            )}
          </div>}
    </section>
  );
}
