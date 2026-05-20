import { useMemo, useState } from 'react';
import { Plus, Pin } from 'lucide-react';
import { usePinnedChannels } from '../api/usePinnedChannels';
import { groupColorVar } from '../lib/groupColor';
import { ChannelGroup } from './ChannelGroup';
import { ChannelItem } from './ChannelItem';
import type { ChatChannel, ChatGroup, GroupWithChannels } from '../lib/types';
import s from './ChannelSidebar.module.css';

interface ChannelSidebarProps {
  groups: GroupWithChannels[];
  activeChannelId: string | null;
  unread: Map<string, number>;
  canManage: boolean;
  onSelectChannel: (channelId: string) => void;
  onAddGroup: () => void;
  onAddChannel: (groupId: string) => void;
  onEditGroup: (group: ChatGroup) => void;
  onEditChannel: (channel: ChatChannel) => void;
}

/** Sidebar světového chatu — připnuté konverzace + kanály → konverzace. */
export function ChannelSidebar({
  groups,
  activeChannelId,
  unread,
  canManage,
  onSelectChannel,
  onAddGroup,
  onAddChannel,
  onEditGroup,
  onEditChannel,
}: ChannelSidebarProps) {
  const { pinned, togglePin } = usePinnedChannels();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const pinnedSet = useMemo(() => new Set(pinned), [pinned]);

  // Připnuté konverzace napříč kanály — s barvou svého kanálu.
  const pinnedChannels = useMemo(() => {
    const out: { channel: GroupWithChannels['channels'][number]; color: string }[] =
      [];
    for (const { group, channels } of groups) {
      const color = groupColorVar(group.id);
      for (const c of channels) {
        if (pinnedSet.has(c.id)) out.push({ channel: c, color });
      }
    }
    return out;
  }, [groups, pinnedSet]);

  return (
    <nav className={s.sidebar} aria-label="Kanály a konverzace">
      <div className={s.scroll}>
        {pinnedChannels.length > 0 && (
          <div className={s.pinned}>
            <div className={s.pinnedHead}>
              <Pin size={11} aria-hidden="true" /> Připnuté
            </div>
            {pinnedChannels.map(({ channel, color }) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                active={channel.id === activeChannelId}
                unread={unread.get(channel.id) ?? 0}
                pinned
                accentColor={color}
                canManage={canManage}
                onSelect={() => onSelectChannel(channel.id)}
                onTogglePin={() => togglePin(channel.id)}
                onEdit={() => onEditChannel(channel)}
              />
            ))}
          </div>
        )}

        {groups.map(({ group, channels }) => (
          <ChannelGroup
            key={group.id}
            group={group}
            channels={channels}
            color={groupColorVar(group.id)}
            collapsed={!!collapsed[group.id]}
            activeChannelId={activeChannelId}
            unread={unread}
            pinned={pinnedSet}
            canManage={canManage}
            onToggleCollapse={() =>
              setCollapsed((c) => ({ ...c, [group.id]: !c[group.id] }))
            }
            onSelectChannel={onSelectChannel}
            onTogglePin={togglePin}
            onAddChannel={() => onAddChannel(group.id)}
            onEditGroup={() => onEditGroup(group)}
            onEditChannel={onEditChannel}
          />
        ))}

        {groups.length === 0 && (
          <p className={s.empty}>Svět zatím nemá žádné kanály.</p>
        )}
      </div>

      {canManage && (
        <button type="button" className={s.addGroup} onClick={onAddGroup}>
          <Plus size={14} aria-hidden="true" /> Nový kanál
        </button>
      )}
    </nav>
  );
}
