/**
 * Sortable wrappery pro drag-drop reorder (krok 6.5a/b).
 *
 *  - `SortableChannelGroup` obalí celou ChannelGroup (sidebar level)
 *  - `SortableChannelItem` obalí ChannelItem (uvnitř kanálu)
 *
 * Drag handle vlastní vizuál (3 puntíky / 2 puntíky) z `DragHandle` komponenty
 * dle design auditu §1. Handle se *renderuje* uvnitř ChannelGroup/Item přes
 * `dragHandle` slot — Sortable wrapper sem dosadí `<DragHandle attributes listeners />`.
 *
 * Vnořený `DndContext` se NEvytváří tady — žije v rodiči
 * (ChannelSidebar pro groups, ChannelGroup wrapper pro channels).
 */
import { type CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChannelGroup } from './ChannelGroup';
import { ChannelItem } from './ChannelItem';
import { DragHandle } from './DragHandle';
import type { ChatChannel, ChatGroup } from '../lib/types';
import type { ReactNode } from 'react';

// ─── Group sortable ────────────────────────────────────────────────────────

interface SortableChannelGroupProps {
  group: ChatGroup;
  channels: ChatChannel[];
  color: string;
  collapsed: boolean;
  activeChannelId: string | null;
  unread: Map<string, number>;
  /** D-NEW-chat-mention-sidebar-dot — per-konverzace mention countů. */
  mentionCounts?: Map<string, number>;
  pinned: Set<string>;
  canManage: boolean;
  disabled: boolean;
  onToggleCollapse: () => void;
  onSelectChannel: (channelId: string) => void;
  onTogglePin: (channelId: string) => void;
  onAddChannel: () => void;
  onEditGroup: () => void;
  onEditChannel: (channel: ChatChannel) => void;
  renderChannelList?: (channels: ChatChannel[]) => ReactNode;
}

export function SortableChannelGroup(props: SortableChannelGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: props.group.id, disabled: props.disabled });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    filter: isDragging ? 'saturate(0.5)' : undefined,
    position: 'relative',
  };

  const handle = props.canManage ? (
    <DragHandle
      kind="group"
      ref={setActivatorNodeRef}
      attributes={attributes}
      listeners={listeners}
      label={`Přesunout kanál ${props.group.name}`}
    />
  ) : null;

  return (
    <div ref={setNodeRef} style={style} data-over={isOver || undefined}>
      <ChannelGroup
        group={props.group}
        channels={props.channels}
        color={props.color}
        collapsed={props.collapsed}
        activeChannelId={props.activeChannelId}
        unread={props.unread}
        mentionCounts={props.mentionCounts}
        pinned={props.pinned}
        canManage={props.canManage}
        onToggleCollapse={props.onToggleCollapse}
        onSelectChannel={props.onSelectChannel}
        onTogglePin={props.onTogglePin}
        onAddChannel={props.onAddChannel}
        onEditGroup={props.onEditGroup}
        onEditChannel={props.onEditChannel}
        dragHandle={handle}
        renderChannelList={props.renderChannelList}
      />
    </div>
  );
}

// ─── Channel sortable ──────────────────────────────────────────────────────

interface SortableChannelItemProps {
  channel: ChatChannel;
  active: boolean;
  unread: number;
  pinned: boolean;
  accentColor: string;
  canManage: boolean;
  disabled: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
  onEdit: () => void;
}

export function SortableChannelItem(props: SortableChannelItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: props.channel.id, disabled: props.disabled });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    filter: isDragging ? 'saturate(0.5)' : undefined,
    position: 'relative',
  };

  const handle = props.canManage ? (
    <DragHandle
      kind="channel"
      ref={setActivatorNodeRef}
      attributes={attributes}
      listeners={listeners}
      label={`Přesunout konverzaci ${props.channel.name}`}
    />
  ) : null;

  return (
    <div ref={setNodeRef} style={style} data-over={isOver || undefined}>
      <ChannelItem
        channel={props.channel}
        active={props.active}
        unread={props.unread}
        pinned={props.pinned}
        accentColor={props.accentColor}
        canManage={props.canManage}
        onSelect={props.onSelect}
        onTogglePin={props.onTogglePin}
        onEdit={props.onEdit}
        dragHandle={handle}
      />
    </div>
  );
}
