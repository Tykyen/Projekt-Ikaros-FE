import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Spinner } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { currentUserAtom } from '@/shared/store/authStore';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useSocketEvent } from '@/features/chat/api/useSocket';
import {
  useChatGroups,
  useUnread,
  useUnreadSync,
  useMarkRead,
  worldChatKeys,
} from '../api/useWorldChat';
import { useChannelPresence } from '../api/useChannelPresence';
import { useChatPrefs } from '../api/useChatPrefs';
import { useWorldEmotes } from '../emotes/api/useWorldEmotes';
import { useGlobalEmotes } from '../emotes/api/useGlobalEmotes';
import { mergeEmoteSets } from '../emotes/lib/mergeEmoteSets';
import { groupColorVar } from '../lib/groupColor';
import type { ChannelUnread, ChatChannel, ChatGroup } from '../lib/types';
import { ChannelSidebar } from './ChannelSidebar';
import { ChannelView } from './ChannelView';
import { ChatContextRail } from './rail/ChatContextRail';
import { GroupDialog } from './GroupDialog';
import { ChannelDialog } from './ChannelDialog';
import { ChatSearchModal } from './ChatSearchModal';
import { useChatSkin } from '../skins/useChatSkin';
import { getTheme } from '@/themes/registry';
import s from './WorldChatRoom.module.css';

/** Orchestrátor světového chatu — sidebar + konverzace + presence panel. */
export function WorldChatRoom() {
  const { worldId, userRole, world } = useWorldContext();
  const user = useAtomValue(currentUserAtom);
  const qc = useQueryClient();

  // 16.1d — skin chatu = motiv světa (override per hráč přebíjí). `applyVars`
  // jen při overridu ≠ motiv světa → inline `--theme-*` zvoleného skinu; jinak
  // chat dědí `:root` (zachová 5.9b overrides + přesný vzhled světa).
  const chatSkin = useChatSkin(worldId);
  const chatSkinStyle = chatSkin.applyVars
    ? (getTheme(chatSkin.skin).vars as unknown as CSSProperties)
    : undefined;

  const groups = useChatGroups(worldId);
  const unread = useUnread(worldId);
  const markRead = useMarkRead(worldId);
  // Cross-device poslední konverzace (server) + deep-link z push notifikace.
  const { lastActiveChannelId, setLastActiveChannel, prefsLoaded } =
    useChatPrefs(worldId);
  const [searchParams, setSearchParams] = useSearchParams();

  // Krok 6.4b — custom emoty (per-svět + globální). Mapa pro `renderChatContent`.
  const worldEmotesQ = useWorldEmotes(worldId);
  const globalEmotesQ = useGlobalEmotes();
  const emoteSet = useMemo(
    () => mergeEmoteSets(worldEmotesQ.data ?? [], globalEmotesQ.data ?? []),
    [worldEmotesQ.data, globalEmotesQ.data],
  );

  // Elevation — admin má world bypass jen když je v tomto světě „nahozený".
  const isManager =
    world?.elevated === true ||
    (userRole !== null && userRole >= WorldRole.PomocnyPJ);

  const storeKey = `wchat:active:${worldId}`;
  const membersKey = `wchat:members:${worldId}`;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Deep-link z push notifikace (`?konverzace={channelId}`) → vyber konverzaci.
  // Adjustment-during-render (ne effect) — reaguje i na opakovaný deep-link bez
  // remountu, bez cascading renderu. Platnost ID řeší `activeChannelId` níž.
  const deepLinkParam = searchParams.get('konverzace');
  const [lastDeepLink, setLastDeepLink] = useState<string | null>(null);
  if (deepLinkParam && deepLinkParam !== lastDeepLink) {
    setLastDeepLink(deepLinkParam);
    setSelectedId(deepLinkParam);
  }
  // Deep-link na konkrétní zprávu (`?zprava={messageId}`, z notifikačního feedu)
  // → po otevření konverzace na ni `MessageList` doscrolluje. Drží se ve stavu,
  // ať skok přežije úklid URL paramu (skok proběhne až po načtení historie).
  const jumpParam = searchParams.get('zprava');
  const [lastJump, setLastJump] = useState<string | null>(null);
  const [jumpToMessageId, setJumpToMessageId] = useState<string | null>(null);
  if (jumpParam && jumpParam !== lastJump) {
    setLastJump(jumpParam);
    setJumpToMessageId(jumpParam);
  }
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Default: zavřeno. PJ si rail otevře přes ikonu (Přítomní), hráč přes
  // ikonu „Můj deník". localStorage drží volbu per world (sdílený klíč).
  const [railOpen, setRailOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(membersKey) === '1';
  });
  const [searchOpen, setSearchOpen] = useState(false);
  // Rail v deníkovém/bestie/combat módu = širší sloupec (jako panel taktické mapy).
  const [railWide, setRailWide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (railOpen) localStorage.setItem(membersKey, '1');
    else localStorage.removeItem(membersKey);
  }, [railOpen, membersKey]);
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
    if (
      lastActiveChannelId &&
      allChannels.some((c) => c.id === lastActiveChannelId)
    ) {
      return lastActiveChannelId;
    }
    // Server seed ještě nedorazil → počkej, ať default „první kanál"
    // nepřebije cross-device poslední konverzaci (race kanály × prefs).
    if (!prefsLoaded) return null;
    return allChannels[0].id;
  }, [selectedId, allChannels, storeKey, lastActiveChannelId, prefsLoaded]);

  // Persist poslední aktivní konverzace (per svět) — i tu default-zobrazenou,
  // ať se po refreshi / reorderu kanálů vrátíme přesně sem, ne na první kanál.
  // Vedlejší efekt: neplatné uložené ID (smazaný kanál) se přepíše fallbackem.
  // Server (cross-device) se ukládá jen při vědomé volbě (selectChannel /
  // deep-link), ne tady — default by jinak přebil seed z jiného zařízení.
  useEffect(() => {
    if (!activeChannelId) return;
    localStorage.setItem(storeKey, activeChannelId);
  }, [activeChannelId, storeKey]);

  // Po vybrání deep-linku (adjustment výše) ho ulož na server jako vědomou
  // volbu (cross-device) a vyčisti param z URL (replace), ať refresh nezůstane
  // zaseklý. Čeká na načtení kanálů, ať na server ukládáme jen platné ID.
  useEffect(() => {
    if (!deepLinkParam || allChannels.length === 0) return;
    if (allChannels.some((c) => c.id === deepLinkParam)) {
      setLastActiveChannel(deepLinkParam);
    }
    setSearchParams(
      (prev) => {
        prev.delete('konverzace');
        prev.delete('zprava');
        return prev;
      },
      { replace: true },
    );
  }, [deepLinkParam, allChannels, setSearchParams, setLastActiveChannel]);

  // ── WS: živé aktualizace kanálů/konverzací/unread ───────────────────────
  // `world:{id}` room joinuje WorldLayout (`useWorldSocket`) pro CELÝ svět —
  // jediný vlastník (W-7/W-9). Kdyby ho držel i WorldChatRoom, přechod
  // chat→jiná stránka by `room:leave` vykopl i WorldLayout. Tady jen
  // posloucháme structure eventy (room + reconnect re-join řeší WorldLayout).
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
      // localStorage řeší effect na `activeChannelId`; server (cross-device)
      // ukládáme jen tady při vědomé volbě — default nepřepisuje seed.
      setSelectedId(id);
      setLastActiveChannel(id);
      setSidebarOpen(false);
    },
    [setLastActiveChannel],
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
        active && railOpen && s.withMembers,
        active && railOpen && railWide && s.railWide,
        sidebarOpen && s.sidebarOpen,
        railOpen && s.membersOpen,
      )}
      data-chat-skin={chatSkin.skin}
      style={chatSkinStyle}
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
            onToggleRail={() => setRailOpen((o) => !o)}
            railOpen={railOpen}
            presenceCount={isManager ? presence.length : 0}
            onOpenSearch={() => setSearchOpen(true)}
            worldEmotes={emoteSet}
            jumpToMessageId={
              active.id === lastDeepLink ? jumpToMessageId : null
            }
          />
        ) : (
          <div className={s.state}>
            {isManager
              ? 'Zatím žádná konverzace — založ kanál a konverzaci.'
              : 'Zatím tu pro tebe není žádná konverzace.'}
          </div>
        )}
      </div>

      {active && (
        <div className={s.membersSlot}>
          <ChatContextRail
            worldId={worldId}
            channel={active}
            activeChannelId={activeChannelId}
            isManager={isManager}
            currentUser={user}
            presence={presence}
            onClose={() => setRailOpen(false)}
            onWideChange={setRailWide}
          />
        </div>
      )}

      {/* Mobil — zhasnutí overlaye klikem mimo. */}
      {(sidebarOpen || railOpen) && (
        <button
          type="button"
          className={s.scrim}
          aria-label="Zavřít"
          onClick={() => {
            setSidebarOpen(false);
            setRailOpen(false);
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
