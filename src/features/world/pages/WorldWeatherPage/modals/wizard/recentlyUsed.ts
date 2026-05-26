/**
 * 9.4-I — Recently used presety v localStorage.
 *
 * Klíč: `weather-recent-presets:<userId>:<worldId>` — per-user, per-svět.
 * Hodnota: JSON array preset ID stringů (nejnovější první, max 3).
 *
 * Quota fallback: silently swallow chyby (private mode, quota exceeded).
 */

const MAX_RECENT = 3;

function storageKey(userId: string, worldId: string): string {
  return `weather-recent-presets:${userId}:${worldId}`;
}

export function getRecentPresetIds(
  userId: string | null | undefined,
  worldId: string,
): string[] {
  if (!userId || !worldId) return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId, worldId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function pushRecentPresetId(
  userId: string | null | undefined,
  worldId: string,
  presetId: string,
): void {
  if (!userId || !worldId || !presetId) return;
  try {
    const current = getRecentPresetIds(userId, worldId);
    const next = [presetId, ...current.filter((id) => id !== presetId)].slice(
      0,
      MAX_RECENT,
    );
    window.localStorage.setItem(storageKey(userId, worldId), JSON.stringify(next));
  } catch {
    // ignore — read-only / quota
  }
}
