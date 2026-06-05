/**
 * C-54 — centrální query-key factory pro admin namespace.
 *
 * Klíče `['admin', …]` se dřív psaly inline na ~15 místech napříč
 * `useAdminUsers` / `useAdminFriendships` / `useAdminStats`. Cross-file drift
 * (zvlášť `audit-log`, který invaliduje víc souborů) = riziko, že refetch klíč
 * a invalidační klíč se rozejdou → tichý stale. Jeden zdroj pravdy to ruší.
 *
 * Pozn.: `search-index-stats` (useSearchIndex) je lokální self-contained const
 * (query i invalidace v jednom souboru) → není zde, drift mu nehrozí.
 */
export const adminKeys = {
  users: ['admin', 'users'] as const,
  usernameRequests: ['admin', 'username-requests'] as const,
  auditLog: ['admin', 'audit-log'] as const,
  friendships: ['admin', 'friendships'] as const,
  /** prefix; konkrétní dotaz je `[...stats, 'overview']`. */
  stats: ['admin', 'stats'] as const,
};
