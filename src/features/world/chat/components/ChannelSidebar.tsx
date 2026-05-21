import { useMemo, useState } from 'react';
import { Plus, Pin } from 'lucide-react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { usePinnedChannels } from '../api/usePinnedChannels';
import {
  useReorderGroups,
  useReorderChannels,
} from '../api/useChannelMutations';
import { groupColorVarFor } from '../lib/groupColor';
import { ChannelItem } from './ChannelItem';
import {
  SortableChannelGroup,
  SortableChannelItem,
} from './SortableChannels';
import type { ChatChannel, ChatGroup, GroupWithChannels } from '../lib/types';
import s from './ChannelSidebar.module.css';

interface ChannelSidebarProps {
  /** ID světa — potřebný pro reorder mutace (krok 6.5a/b). */
  worldId: string;
  groups: GroupWithChannels[];
  activeChannelId: string | null;
  unread: Map<string, number>;
  /** D-NEW-chat-mention-sidebar-dot — počet self-mention zpráv per konverzace. */
  mentionCounts?: Map<string, number>;
  canManage: boolean;
  onSelectChannel: (channelId: string) => void;
  onAddGroup: () => void;
  onAddChannel: (groupId: string) => void;
  onEditGroup: (group: ChatGroup) => void;
  onEditChannel: (channel: ChatChannel) => void;
}

/** Sidebar světového chatu — připnuté konverzace + kanály → konverzace. */
export function ChannelSidebar({
  worldId,
  groups,
  activeChannelId,
  unread,
  mentionCounts,
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
  const reorderGroups = useReorderGroups(worldId);
  const reorderChannels = useReorderChannels(worldId);
  // Drag handle activation — touch má long-press (chrání scroll), myš jen distance.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Připnuté konverzace napříč kanály — s barvou svého kanálu.
  const pinnedChannels = useMemo(() => {
    const out: { channel: GroupWithChannels['channels'][number]; color: string }[] =
      [];
    for (const { group, channels } of groups) {
      const color = groupColorVarFor(group);
      for (const c of channels) {
        if (pinnedSet.has(c.id)) out.push({ channel: c, color });
      }
    }
    return out;
  }, [groups, pinnedSet]);

  const groupIds = useMemo(() => groups.map((g) => g.group.id), [groups]);

  const handleGroupsDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = groupIds.indexOf(String(e.active.id));
    const newIdx = groupIds.indexOf(String(e.over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(groupIds, oldIdx, newIdx);
    reorderGroups.mutate(reordered.map((id, i) => ({ id, order: i })));
  };

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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleGroupsDragEnd}
        >
          <SortableContext
            items={groupIds}
            strategy={verticalListSortingStrategy}
          >
            {groups.map(({ group, channels }) => {
              const color = groupColorVarFor(group);
              const channelIds = channels.map((c) => c.id);
              return (
                <SortableChannelGroup
                  key={group.id}
                  group={group}
                  channels={channels}
                  color={color}
                  collapsed={!!collapsed[group.id]}
                  activeChannelId={activeChannelId}
                  unread={unread}
                  mentionCounts={mentionCounts}
                  pinned={pinnedSet}
                  canManage={canManage}
                  disabled={reorderGroups.isPending || !canManage}
                  onToggleCollapse={() =>
                    setCollapsed((c) => ({
                      ...c,
                      [group.id]: !c[group.id],
                    }))
                  }
                  onSelectChannel={onSelectChannel}
                  onTogglePin={togglePin}
                  onAddChannel={() => onAddChannel(group.id)}
                  onEditGroup={() => onEditGroup(group)}
                  onEditChannel={onEditChannel}
                  renderChannelList={(list) => (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => {
                        if (!e.over || e.active.id === e.over.id) return;
                        const oldIdx = channelIds.indexOf(String(e.active.id));
                        const newIdx = channelIds.indexOf(String(e.over.id));
                        if (oldIdx < 0 || newIdx < 0) return;
                        const reordered = arrayMove(channelIds, oldIdx, newIdx);
                        reorderChannels.mutate({
                          groupId: group.id,
                          items: reordered.map((id, i) => ({ id, order: i })),
                        });
                      }}
                    >
                      <SortableContext
                        items={channelIds}
                        strategy={verticalListSortingStrategy}
                      >
                        {list.map((c) => (
                          <SortableChannelItem
                            key={c.id}
                            channel={c}
                            active={c.id === activeChannelId}
                            unread={unread.get(c.id) ?? 0}
                            pinned={pinnedSet.has(c.id)}
                            accentColor={color}
                            canManage={canManage}
                            disabled={
                              reorderChannels.isPending || !canManage
                            }
                            onSelect={() => onSelectChannel(c.id)}
                            onTogglePin={() => togglePin(c.id)}
                            onEdit={() => onEditChannel(c)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                />
              );
            })}
          </SortableContext>
        </DndContext>

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
