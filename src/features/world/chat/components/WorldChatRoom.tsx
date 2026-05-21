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
import { useChannelPresence } from '../api/useChannelPresence';
import { useWorldEmotes } from '../emotes/api/useWorldEmotes';
import { useGlobalEmotes } from '../emotes/api/useGlobalEmotes';
import { mergeEmoteSets } from '../emotes/lib/mergeEmoteSets';
import { groupColorVar } from '../lib/groupColor';
import type { ChannelUnread, ChatChannel, ChatGroup } from '../lib/types';
import { ChannelSidebar } from './ChannelSidebar';
import { ChannelView } from './ChannelView';
import { ChannelMemberPanel } from './ChannelMemberPanel';
import { GroupDialog } from './GroupDialog';
import { ChannelDialog } from './ChannelDialog';
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

  // Krok 6.4b — custom emoty (per-svět + globální). Mapa pro `renderChatContent`.
  const worldEmotesQ = useWorldEmotes(worldId);
  const globalEmotesQ = useGlobalEmotes();
  const emoteSet = useMemo(
    () => mergeEmoteSets(worldEmotesQ.data ?? [], globalEmotesQ.data ?? []),
    [worldEmotesQ.data, globalEmotesQ.data],
  );

  const isManager =
    userRole !== null && userRole >= WorldRole.PomocnyPJ;

  const storeKey = `wchat:active:${worldId}`;
  const membersKey = `wchat:members:${worldId}`;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Default: zavřeno. PJ si panel otevře přes Users ikonu, badge ho upozorní
  // na příchody. localStorage drží volbu per world.
  const [membersOpen, setMembersOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(membersKey) === '1';
  });
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (membersOpen) localStorage.setItem(membersKey, '1');
    else localStorage.removeItem(membersKey);
  }, [membersOpen, membersKey]);
  const [groupDialog, setGroupDialog] = useState<{
    mode: 'create' | 'edit';
    initial?: ChatGroup;
  } | null>(null);
  const [channelDialog, setChannelDialog] = useState<{
    mode: 'create' | 'edit';
    initial?: ChatChannel;
    groupId: string | null;
  } | null>(null);

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

  // D-NEW-chat-mention-sidebar-dot (2026-05-21) — mapa self-mention countů.
  const mentionMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of unread.data ?? []) {
      if (u.mentionCount > 0) m.set(u.channelId, u.mentionCount);
    }
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
  // Krok 6.5a/b — reorder broadcasty. Invalidate je nejjednodušší cesta —
  // BE je autoritativní (znovu načteme order ze serveru). Optimistic update
  // u iniciátora už proběhl v mutaci; ostatní klienti si vyžádají fresh data.
  useSocketEvent('chat:groups:reordered', invalidateGroups);
  useSocketEvent('chat:channels:reordered', invalidateGroups);

  // Živá synchronizace unread přes WS. Pro aktivní konverzaci klient drží
  // count: 0 — i kdyby BE poslal vyšší (race s markRead, vlastní zpráva,
  // reconnect). Sledovaná konverzace prostě nemůže mít unread.
  useUnreadSync(worldId, activeChannelId);

  // Presence aktivní konverzace — volaná na úrovni room, ať badge na ikoně
  // Přítomní zůstane živý i když je panel zavřený. PJ-only.
  const presence = useChannelPresence(worldId, activeChannelId, isManager);

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
        isManager && membersOpen && s.withMembers,
        sidebarOpen && s.sidebarOpen,
        membersOpen && s.membersOpen,
      )}
    >
      <div className={s.sidebarSlot}>
        <ChannelSidebar
          worldId={worldId}
          groups={groupList}
          activeChannelId={activeChannelId}
          unread={unreadMap}
          mentionCounts={mentionMap}
          canManage={isManager}
          onSelectChannel={selectChannel}
          onAddGroup={() => setGroupDialog({ mode: 'create' })}
          onEditGroup={(group) =>
            setGroupDialog({ mode: 'edit', initial: group })
          }
          onAddChannel={(groupId) =>
            setChannelDialog({ mode: 'create', groupId })
          }
          onEditChannel={(channel) =>
            setChannelDialog({
              mode: 'edit',
              initial: channel,
              groupId: channel.groupId,
            })
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
            onToggleMembers={
              isManager ? () => setMembersOpen((o) => !o) : undefined
            }
            membersOpen={membersOpen}
            presenceCount={isManager ? presence.length : 0}
            onOpenSearch={() => setSearchOpen(true)}
            worldEmotes={emoteSet}
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
            presence={presence}
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
        <GroupDialog
          worldId={worldId}
          mode={groupDialog.mode}
          initial={groupDialog.initial}
          onClose={() => setGroupDialog(null)}
        />
      )}
      {channelDialog && (
        <ChannelDialog
          worldId={worldId}
          mode={channelDialog.mode}
          initial={channelDialog.initial}
          onClose={() => setChannelDialog(null)}
          groups={groupList}
          defaultGroupId={channelDialog.groupId}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
