/**
 * 6.8 — PJ identita v chatu.
 *
 * Vedení světa (role ≥ PomocnyPJ) vystupuje pod jednotnou personou „PJ" místo
 * přihlašovacího jména. Řeší se **při vykreslení** podle role odesílatele —
 * aplikuje se tak zpětně i na historické (migrované) zprávy a je živé.
 *
 * `pjChatPersona` ve `WorldSettings`:
 *   - `null`/`undefined` → výchozí ZAPNUTO (label „PJ", avatar fallback na iniciálu),
 *   - `enabled:false` → vypnuto (vedení vystupuje pod svým jménem),
 *   - `name`/`avatarUrl` → PJ přizpůsobení per svět.
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
}

/**
 * Vytvoří resolver `senderId → PjDisplay | null`. `null` znamená „není PJ /
 * persona vypnutá" → render použije normální jméno/avatar.
 */
export function makePjDisplayResolver(
  members: MemberLike[],
  persona: PjChatPersona | null | undefined,
): (senderId: string) => PjDisplay | null {
  // Vypnuto JEN explicitním enabled:false. Null/undefined = výchozí zapnuto.
  if (persona && persona.enabled === false) return () => null;

  const pjIds = new Set(
    members.filter((m) => m.role >= WorldRole.PomocnyPJ).map((m) => m.userId),
  );
  if (pjIds.size === 0) return () => null;

  const display: PjDisplay = {
    name: persona?.name?.trim() || 'PJ',
    avatarUrl: persona?.avatarUrl ?? null,
  };
  return (senderId: string) => (pjIds.has(senderId) ? display : null);
}
