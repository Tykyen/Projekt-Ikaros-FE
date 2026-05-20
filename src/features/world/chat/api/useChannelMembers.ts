import { useMemo } from 'react';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { WorldRole, type WorldMembership } from '@/shared/types';
import type { ChatChannel } from '../lib/types';

/**
 * Krok 6.2a + 6.2i — členové dané konverzace (whisper picker + mention
 * autocomplete).
 *
 * Filtr se aplikuje na klientovi nad výsledkem `GET /worlds/:id/members`:
 * - `accessMode: 'all'` → členové s rolí ≥ Hrac (Čtenář/Žadatel nevidí
 *   globální kanály — viz spec 6.1 §4.7 C),
 * - `accessMode: 'roles'` → členové s rolí v `allowedRoles`,
 * - `accessMode: 'members'` → ti, jejichž userId ∈ `allowedMemberIds`.
 *
 * PJ a Pomocný PJ světa **jsou vždy v seznamu navíc** (mohou whispernout
 * komukoli; mention autocomplete je má vždy ukázat). Sender se vyfiltruje
 * v UI vrstvě (`ChannelComposer`), tady ho necháváme být.
 */
export function useChannelMembers(
  worldId: string,
  channel: ChatChannel | null,
) {
  const all = useWorldMembers(worldId);

  const filtered = useMemo<WorldMembership[]>(() => {
    const list = all.data ?? [];
    if (!channel) return list;

    const staffSet = new Set(
      list
        .filter((m) => m.role >= WorldRole.PomocnyPJ)
        .map((m) => m.userId),
    );

    let base: WorldMembership[];
    if (channel.accessMode === 'all') {
      base = list.filter((m) => m.role >= WorldRole.Hrac);
    } else if (channel.accessMode === 'roles') {
      const allowed = new Set(channel.allowedRoles);
      base = list.filter((m) => allowed.has(m.role));
    } else {
      const allowed = new Set(channel.allowedMemberIds);
      base = list.filter((m) => allowed.has(m.userId));
    }

    // PJ + PomocnyPJ vždy připojit (deduplikovat dle userId)
    const baseIds = new Set(base.map((m) => m.userId));
    const extra = list.filter(
      (m) => staffSet.has(m.userId) && !baseIds.has(m.userId),
    );
    return [...base, ...extra];
  }, [all.data, channel]);

  return { ...all, members: filtered };
}
