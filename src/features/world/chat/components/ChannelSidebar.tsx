import { useMemo } from 'react';
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
import { useChatPrefs } from '../api/useChatPrefs';
import { applyOrder } from '../lib/applyOrder';
import { groupColorVarFor } from '../lib/groupColor';
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
  const pinnedSet = useMemo(() => new Set(pinned), [pinned]);
  // 6.7b/c — osobní pořadí + sbalení (per hráč, ne globální PJ reorder).
  const {
    groupOrder,
    channelOrder,
    expandedGroups,
    pinnedOrder,
    setGroupOrder,
    setChannelOrder,
    toggleExpanded,
    setPinnedOrder,
  } = useChatPrefs(worldId);
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

  // D-032 — osobní pořadí připnutých; nově připnuté padají na konec.
  const orderedPinned = useMemo(
    () => applyOrder(pinnedChannels, pinnedOrder, (p) => p.channel.id),
    [pinnedChannels, pinnedOrder],
  );
  const pinnedIds = useMemo(
    () => orderedPinned.map((p) => p.channel.id),
    [orderedPinned],
  );

  const handlePinnedDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = pinnedIds.indexOf(String(e.active.id));
    const newIdx = pinnedIds.indexOf(String(e.over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    setPinnedOrder(arrayMove(pinnedIds, oldIdx, newIdx));
  };

  // Osobní pořadí kanálů; nově vzniklé padají na konec dle globálního order.
  const orderedGroups = useMemo(
    () => applyOrder(groups, groupOrder, (g) => g.group.id),
    [groups, groupOrder],
  );
  const groupIds = useMemo(
    () => orderedGroups.map((g) => g.group.id),
    [orderedGroups],
  );

  const handleGroupsDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = groupIds.indexOf(String(e.active.id));
    const newIdx = groupIds.indexOf(String(e.over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    setGroupOrder(arrayMove(groupIds, oldIdx, newIdx));
  };

  /**
   * 6.7c (revize 2026-06-12) — sbalení řídí čistě `expandedGroups`, BEZ override
   * aktivní konverzací. Sbalený kanál s aktivní konverzací ji ukáže sám (viz
   * `ChannelGroup`, Matrix styl) → kanál jde vždy zavřít.
   */
  const isCollapsed = (groupId: string): boolean =>
    !expandedGroups.includes(groupId);

  return (
    <nav className={s.sidebar} aria-label="Kanály a konverzace">
      <div className={s.scroll}>
        {orderedPinned.length > 0 && (
          <div className={s.pinned}>
            <div className={s.pinnedHead}>
              <Pin size={11} aria-hidden="true" /> Připnuté
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handlePinnedDragEnd}
            >
              <SortableContext
                items={pinnedIds}
                strategy={verticalListSortingStrategy}
              >
                {orderedPinned.map(({ channel, color }) => (
                  <SortableChannelItem
                    key={channel.id}
                    channel={channel}
                    active={channel.id === activeChannelId}
                    unread={unread.get(channel.id) ?? 0}
                    pinned
                    accentColor={color}
                    canManage={canManage}
                    disabled={false}
                    onSelect={() => onSelectChannel(channel.id)}
                    onTogglePin={() => togglePin(channel.id)}
                    onEdit={() => onEditChannel(channel)}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
            {orderedGroups.map(({ group, channels }) => {
              const color = groupColorVarFor(group);
              const orderedChannels = applyOrder(
                channels,
                channelOrder[group.id] ?? [],
                (c) => c.id,
              );
              const channelIds = orderedChannels.map((c) => c.id);
              return (
                <SortableChannelGroup
                  key={group.id}
                  group={group}
                  channels={orderedChannels}
                  color={color}
                  collapsed={isCollapsed(group.id)}
                  activeChannelId={activeChannelId}
                  unread={unread}
                  mentionCounts={mentionCounts}
                  pinned={pinnedSet}
                  canManage={canManage}
                  disabled={false}
                  onToggleCollapse={() => toggleExpanded(group.id)}
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
                        setChannelOrder(
                          group.id,
                          arrayMove(channelIds, oldIdx, newIdx),
                        );
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
                            disabled={false}
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
