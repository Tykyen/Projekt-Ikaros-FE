import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Spinner } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { currentUserAtom } from '@/shared/store/authStore';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { getSocket } from '@/features/chat/api/socket';
import { useSocketEvent } from '@/features/chat/api/useSocket';
import {
  useChatGroups,
  useUnread,
  useUnreadSync,
  useMarkRead,
  worldChatKeys,
} from '../api/useWorldChat';
import { groupColorVar } from '../lib/groupColor';
import type { ChannelUnread } from '../lib/types';
import { ChannelSidebar } from './ChannelSidebar';
import { ChannelView } from './ChannelView';
import { ChannelMemberPanel } from './ChannelMemberPanel';
import { CreateGroupDialog } from './CreateGroupDialog';
import { CreateChannelDialog } from './CreateChannelDialog';
import { ChatSearchModal } from './ChatSearchModal';
import s from './WorldChatRoom.module.css';

/** Orchestrátor světového chatu — sidebar + konverzace + presence panel. */
export function WorldChatRoom() {
  const { worldId, userRole } = useWorldContext();
  const user = useAtomValue(currentUserAtom);
  const qc = useQueryClient();

  const groups = useChatGroups(worldId);
  const unread = useUnread(worldId);
  const markRead = useMarkRead(worldId);

  const isManager =
    userRole !== null && userRole >= WorldRole.PomocnyPJ;

  const storeKey = `wchat:active:${worldId}`;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [groupDialog, setGroupDialog] = useState(false);
  const [channelDialog, setChannelDialog] = useState<{
    open: boolean;
    groupId: string | null;
  }>({ open: false, groupId: null });

  const groupList = useMemo(() => groups.data ?? [], [groups.data]);
  const allChannels = useMemo(
    () => groupList.flatMap((g) => g.channels),
    [groupList],
  );

  // Mapa unread pro sidebar.
  const unreadMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of unread.data ?? []) m.set(u.channelId, u.count);
    return m;
  }, [unread.data]);

  // Aktivní konverzace = výběr uživatele, fallback poslední otevřená
  // (localStorage), pak první přístupná. Odvozeno, ne synchronizováno efektem.
  const activeChannelId = useMemo<string | null>(() => {
    if (allChannels.length === 0) return null;
    if (selectedId && allChannels.some((c) => c.id === selectedId)) {
      return selectedId;
    }
    const stored = localStorage.getItem(storeKey);
    if (stored && allChannels.some((c) => c.id === stored)) return stored;
    return allChannels[0].id;
  }, [selectedId, allChannels, storeKey]);

  // ── WS: world room + živé aktualizace kanálů/konverzací/unread ──────────
  useEffect(() => {
    if (!worldId) return;
    const socket = getSocket();
    socket.emit('room:join', `world:${worldId}`);
    return () => {
      socket.emit('room:leave', `world:${worldId}`);
    };
  }, [worldId]);

  const invalidateGroups = useCallback(() => {
    void qc.invalidateQueries({ queryKey: worldChatKeys(worldId).groups });
  }, [qc, worldId]);

  useSocketEvent('chat:channel:created', invalidateGroups);
  useSocketEvent('chat:channel:updated', invalidateGroups);
  useSocketEvent('chat:channel:deleted', invalidateGroups);
  useSocketEvent('chat:group:created', invalidateGroups);
  useSocketEvent('chat:group:updated', invalidateGroups);
  useSocketEvent('chat:group:deleted', invalidateGroups);

  // Živá synchronizace unread přes WS.
  useUnreadSync(worldId);

  // ── Označení přečteno při otevření konverzace ───────────────────────────
  useEffect(() => {
    if (!activeChannelId) return;
    markRead.mutate(activeChannelId);
    qc.setQueryData<ChannelUnread[]>(
      worldChatKeys(worldId).unread,
      (old) =>
        (old ?? []).map((u) =>
          u.channelId === activeChannelId ? { ...u, count: 0 } : u,
        ),
    );
    // markRead/qc jsou stabilní — sledujeme jen konverzaci.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelId, worldId]);

  const selectChannel = useCallback(
    (id: string) => {
      setSelectedId(id);
      localStorage.setItem(storeKey, id);
      setSidebarOpen(false);
    },
    [storeKey],
  );

  // ── Render ──────────────────────────────────────────────────────────────
  if (!user) return null;

  if (groups.isLoading) {
    return (
      <div className={s.state}>
        <Spinner />
      </div>
    );
  }
  if (groups.isError) {
    return <div className={s.state}>Chat se nepodařilo načíst.</div>;
  }

  const active = allChannels.find((c) => c.id === activeChannelId) ?? null;
  const accent = active?.groupId
    ? groupColorVar(active.groupId)
    : 'var(--theme-accent)';

  return (
    <div
      className={clsx(
        s.room,
        isManager && s.withMembers,
        sidebarOpen && s.sidebarOpen,
        membersOpen && s.membersOpen,
      )}
    >
      <div className={s.sidebarSlot}>
        <ChannelSidebar
          groups={groupList}
          activeChannelId={activeChannelId}
          unread={unreadMap}
          canManage={isManager}
          onSelectChannel={selectChannel}
          onAddGroup={() => setGroupDialog(true)}
          onAddChannel={(groupId) =>
            setChannelDialog({ open: true, groupId })
          }
        />
      </div>

      <div className={s.viewSlot}>
        {active ? (
          <ChannelView
            key={active.id}
            worldId={worldId}
            channel={active}
            accentColor={accent}
            currentUser={user}
            canManage={isManager}
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenMembers={
              isManager ? () => setMembersOpen(true) : undefined
            }
            onOpenSearch={() => setSearchOpen(true)}
          />
        ) : (
          <div className={s.state}>
            {isManager
              ? 'Zatím žádná konverzace — založ kanál a konverzaci.'
              : 'Zatím tu pro tebe není žádná konverzace.'}
          </div>
        )}
      </div>

      {isManager && active && (
        <div className={s.membersSlot}>
          <ChannelMemberPanel
            worldId={worldId}
            channel={active}
            onClose={() => setMembersOpen(false)}
          />
        </div>
      )}

      {/* Mobil — zhasnutí overlaye klikem mimo. */}
      {(sidebarOpen || membersOpen) && (
        <button
          type="button"
          className={s.scrim}
          aria-label="Zavřít"
          onClick={() => {
            setSidebarOpen(false);
            setMembersOpen(false);
          }}
        />
      )}

      {searchOpen && (
        <ChatSearchModal
          worldId={worldId}
          groups={groupList}
          onClose={() => setSearchOpen(false)}
          onSelectResult={selectChannel}
        />
      )}

      {groupDialog && (
        <CreateGroupDialog
          worldId={worldId}
          onClose={() => setGroupDialog(false)}
        />
      )}
      {channelDialog.open && (
        <CreateChannelDialog
          worldId={worldId}
          onClose={() => setChannelDialog({ open: false, groupId: null })}
          groups={groupList}
          defaultGroupId={channelDialog.groupId}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
