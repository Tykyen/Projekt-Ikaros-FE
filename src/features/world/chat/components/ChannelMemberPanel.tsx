import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, X } from 'lucide-react';
import clsx from 'clsx';
import { UserAvatar } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { worldMemberAvatar } from '@/features/world/lib/worldMemberAvatar';
import { formatLastSeen } from '../lib/lastSeen';
import type { ChannelPresenceUser, ChatChannel } from '../lib/types';
import s from './ChannelMemberPanel.module.css';

interface ChannelMemberPanelProps {
  worldId: string;
  channel: ChatChannel;
  /** Živá presence aktivní konverzace — vlastníkem hooku je `WorldChatRoom`. */
  presence: ChannelPresenceUser[];
  /** Mobil i desktop — zavře panel; default je zavřeno. */
  onClose?: () => void;
  /** 16.1a — klik na člena (s přiřazenou postavou) → otevři jeho deník v railu. */
  onSelectMember?: (entry: RosterEntry) => void;
  /** 16.1b — slot pod hlavičkou (search NPC) — vykreslí ho rail jen PJ. */
  topSlot?: ReactNode;
}

export interface RosterEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  worldRole: WorldRole;
  online: boolean;
  lastSeenAt?: string;
  /** Slug/path přiřazené postavy — když chybí, řádek nelze otevřít do deníku. */
  characterPath?: string;
}

/** Sekce panelu — grupování dle world role (krok 6.1d). */
const BUCKETS: { key: string; label: string; roles: WorldRole[] }[] = [
  { key: 'gm', label: 'Vypravěči', roles: [WorldRole.PJ, WorldRole.PomocnyPJ] },
  { key: 'corr', label: 'Korektoři', roles: [WorldRole.Korektor] },
  {
    key: 'rest',
    label: 'Ostatní',
    roles: [WorldRole.Hrac, WorldRole.Ctenar, WorldRole.Zadatel],
  },
];

/** Má člen s danou rolí přístup ke konverzaci? Zrcadlí BE `hasChannelAccess`. */
function canAccess(
  channel: ChatChannel,
  role: WorldRole,
  userId: string,
): boolean {
  if (channel.accessMode === 'members') {
    return channel.allowedMemberIds.includes(userId);
  }
  if (role === WorldRole.Zadatel) return false;
  if (channel.accessMode === 'all') return role >= WorldRole.Hrac;
  return channel.allowedRoles.includes(role);
}

/**
 * Presence panel konverzace (krok 6.1d) — roster členů grupovaný dle world
 * role, se zelenou tečkou u právě přítomných. Renderuje se jen PJ/Pomocnému PJ
 * (gating řeší `WorldChatRoom`).
 */
export function ChannelMemberPanel({
  worldId,
  channel,
  presence,
  onClose,
  onSelectMember,
  topSlot,
}: ChannelMemberPanelProps) {
  const members = useWorldMembers(worldId);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const onlineIds = useMemo(
    () => new Set(presence.map((p) => p.userId)),
    [presence],
  );

  const roster = useMemo<RosterEntry[]>(() => {
    return (members.data ?? [])
      .filter((m) => m.user && canAccess(channel, m.role, m.userId))
      .map((m) => ({
        userId: m.userId,
        username: m.user!.username,
        avatarUrl: worldMemberAvatar(m),
        worldRole: m.role,
        online: onlineIds.has(m.userId),
        lastSeenAt: m.user!.lastSeenAt,
        characterPath: m.characterPath,
      }));
  }, [members.data, channel, onlineIds]);

  return (
    <aside className={s.panel}>
      <div className={s.head}>
        <span className={s.headLabel}>Přítomní</span>
        {onClose && (
          <button
            type="button"
            className={s.close}
            onClick={onClose}
            aria-label="Zavřít"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {topSlot}

      <div className={s.scroll}>
        {BUCKETS.map((bucket) => {
          const entries = roster
            .filter((r) => bucket.roles.includes(r.worldRole))
            .sort((a, b) => {
              if (a.online !== b.online) return a.online ? -1 : 1;
              return a.username.localeCompare(b.username, 'cs');
            });
          if (entries.length === 0) return null;
          const isCollapsed = collapsed[bucket.key];
          return (
            <section key={bucket.key} className={s.section}>
              <button
                type="button"
                className={s.sectionHead}
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [bucket.key]: !c[bucket.key] }))
                }
              >
                <ChevronDown
                  size={13}
                  className={clsx(s.chevron, isCollapsed && s.chevronUp)}
                />
                <span>{bucket.label}</span>
                <span className={s.count}>({entries.length})</span>
              </button>
              {!isCollapsed && (
                <ul className={s.list}>
                  {entries.map((e) => {
                    const seen = formatLastSeen(e.lastSeenAt, e.online);
                    const clickable = Boolean(
                      onSelectMember && e.characterPath,
                    );
                    const inner = (
                      <>
                        <span
                          className={clsx(s.seen, s[`seen_${seen.tier}`])}
                          title={
                            e.lastSeenAt
                              ? `Naposledy: ${new Date(
                                  e.lastSeenAt,
                                ).toLocaleString('cs-CZ')}`
                              : undefined
                          }
                        >
                          {seen.label}
                        </span>
                        <UserAvatar
                          src={e.avatarUrl}
                          size="sm"
                          alt={e.username}
                        />
                        <span className={s.name}>{e.username}</span>
                      </>
                    );
                    return (
                      <li
                        key={e.userId}
                        className={clsx(s.member, !e.online && s.offline)}
                      >
                        {clickable ? (
                          <button
                            type="button"
                            className={s.memberRow}
                            onClick={() => onSelectMember!(e)}
                            title="Otevřít deník postavy"
                          >
                            {inner}
                          </button>
                        ) : (
                          <div
                            className={s.memberRow}
                            title={
                              onSelectMember
                                ? 'Bez přiřazené postavy'
                                : undefined
                            }
                          >
                            {inner}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
        {roster.length === 0 && (
          <p className={s.empty}>Žádní členové.</p>
        )}
      </div>
    </aside>
  );
}
