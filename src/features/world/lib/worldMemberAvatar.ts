import type { WorldMembership } from '@/shared/types';

/**
 * Avatar člena ve světě. Preferuje world-scoped `membership.avatarUrl` (vzhled
 * přiřazené postavy, který BE plní z obrázku postavy a při odpojení `$unset`-ne)
 * a teprve když chybí, fallbackuje na globální profilový avatar uživatele.
 *
 * Pravidlo: člen bez postavy → globální avatar; člen s postavou → vzhled té
 * postavy v daném světě (ne globální). Viz spec member-character assignment.
 */
export function worldMemberAvatar(
  m: Pick<WorldMembership, 'avatarUrl' | 'user'>,
): string | undefined {
  return m.avatarUrl ?? m.user?.avatarUrl;
}
