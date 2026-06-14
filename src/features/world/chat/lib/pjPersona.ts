/**
 * 6.8 / 6.8-followup — PJ identita v chatu.
 *
 * Vedení světa (role ≥ PomocnyPJ) vystupuje místo přihlašovacího jména pod
 * personou. Řeší se **při vykreslení** podle role odesílatele — aplikuje se tak
 * zpětně i na historické (migrované) zprávy a je živé.
 *
 * `pjChatPersona.mode` ve `WorldSettings`:
 *   - `unified` (default) → jednotná anonymní identita „PJ" + 1 sdílený avatar,
 *   - `individual` → každý člen vedení vystupuje pod **svou rolí** („PJ" /
 *     „Pomocný PJ") + **vlastním avatarem** (`membership.pjPersonaAvatarUrl`),
 *     takže příjemce pozná, kdo píše. Fallback avataru → účet.
 *
 * Priorita v `MessageItem`: NPC override (`overrideName`) > PJ persona > membership.
 */
import { WorldRole, type PjChatPersona } from '@/shared/types';

export interface PjDisplay {
  name: string;
  avatarUrl: string | null;
}

interface MemberLike {
  userId: string;
  role: number;
  /** 6.8-followup — vlastní avatar vedení (režim individual). */
  pjPersonaAvatarUrl?: string;
  /** Účtové summary (fallback avatar). */
  user?: { avatarUrl?: string };
}

/** Role label vedení pro režim `individual`. Volá se jen pro role ≥ PomocnyPJ. */
function leaderRoleLabel(role: number): string {
  return role >= WorldRole.PJ ? 'PJ' : 'Pomocný PJ';
}

/**
 * Vytvoří resolver `senderId → PjDisplay | null`. `null` znamená „není vedení"
 * → render použije normální jméno/avatar.
 */
export function makePjDisplayResolver(
  members: MemberLike[],
  persona: PjChatPersona | null | undefined,
): (senderId: string) => PjDisplay | null {
  // Vedení = role ≥ PomocnyPJ (mapa kvůli per-člen datům v režimu individual).
  const leaders = new Map<string, MemberLike>();
  for (const m of members) {
    if (m.role >= WorldRole.PomocnyPJ) leaders.set(m.userId, m);
  }
  if (leaders.size === 0) return () => null;

  // `undefined` (nenastaveno / stará cache) = výchozí `unified` (dnešní chování).
  const mode = persona?.mode ?? 'unified';

  if (mode === 'individual') {
    // Každý člen vedení: vlastní role + vlastní avatar (fallback účet).
    return (senderId: string) => {
      const m = leaders.get(senderId);
      if (!m) return null;
      return {
        name: leaderRoleLabel(m.role),
        avatarUrl: m.pjPersonaAvatarUrl ?? m.user?.avatarUrl ?? null,
      };
    };
  }

  // unified — jednotná anonymní identita „PJ" + sdílený avatar.
  const display: PjDisplay = {
    name: persona?.name?.trim() || 'PJ',
    avatarUrl: persona?.avatarUrl ?? null,
  };
  return (senderId: string) => (leaders.has(senderId) ? display : null);
}
