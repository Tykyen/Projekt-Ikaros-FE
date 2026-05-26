/**
 * 9.4 dluh #4 — favorites generátorů počasí (localStorage, per-user × per-world).
 *
 * Pattern: localStorage klíč `weather-favorites:<userId>:<worldId>` = JSON array
 * generator IDs. PJ označí kartu hvězdou → setřídí se v gridu nahoru a stav
 * přežívá refresh / přepnutí zařízení (pro stejný user × world).
 *
 * Limit: max 20 favorites per world (rozumný strop — nad to už ztrácí smysl,
 * lepší by bylo přeorganizovat displayOrder).
 *
 * Quota / private mode: silently swallow chyby — UI nikdy nespadne kvůli
 * disabled storage.
 *
 * `useSyncExternalStore` zajistí, že multiple instances hooku v jednom stromu
 * (a v jiných tabs přes `storage` event) zůstávají v synchronizaci.
 */
import { useCallback, useSyncExternalStore } from 'react';

const PREFIX = 'weather-favorites';
const MAX_FAVORITES = 20;

function getKey(userId: string | null | undefined, worldId: string): string | null {
  if (!userId || !worldId) return null;
  return `${PREFIX}:${userId}:${worldId}`;
}

function readFavorites(key: string | null): string[] {
  if (!key) return [];
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

function writeFavorites(key: string | null, ids: string[]): void {
  if (!key || typeof window === 'undefined') return;
  try {
    const trimmed = ids.slice(0, MAX_FAVORITES);
    window.localStorage.setItem(key, JSON.stringify(trimmed));
    // Cross-component sync — `storage` event nativně padá jen v jiných tabs,
    // takže uvnitř stejného window posíláme custom event ručně.
    window.dispatchEvent(new StorageEvent('storage', { key }));
  } catch {
    // localStorage quota / disabled / private mode — silent fail.
  }
}

export interface UseFavoritesResult {
  /** Array IDs (pořadí dle insertion order). */
  favorites: string[];
  /** O(n) lookup — pro grid map / single card check stačí. */
  isFavorite: (generatorId: string) => boolean;
  /** Toggle (add if missing, remove if present). Bez confirmace. */
  toggle: (generatorId: string) => void;
  /** Vyprázdní seznam. */
  clear: () => void;
}

export function useFavorites(
  userId: string | null | undefined,
  worldId: string,
): UseFavoritesResult {
  const key = getKey(userId, worldId);

  // useSyncExternalStore — komponenta se re-renderne při změně localStorage
  // (vlastním write events + cross-tab storage events).
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === 'undefined') return () => {};
      const handler = (e: StorageEvent) => {
        // null key = storage.clear(), match na náš key, nebo žádný klíč → re-read.
        if (!key) return;
        if (e.key === null || e.key === key) {
          invalidateSnapshot(key);
          callback();
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    // Stejný key → stejný array reference díky JSON.parse stability je nepravdivý
    // (parse vrací nové objekty pokaždé), proto cache na úrovni `key`.
    return readSnapshot(key);
  }, [key]);

  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isFavorite = useCallback(
    (generatorId: string) => ids.includes(generatorId),
    [ids],
  );

  const toggle = useCallback(
    (generatorId: string) => {
      if (!key || !generatorId) return;
      const current = readFavorites(key);
      const next = current.includes(generatorId)
        ? current.filter((id) => id !== generatorId)
        : [...current, generatorId];
      writeFavorites(key, next);
      invalidateSnapshot(key);
    },
    [key],
  );

  const clear = useCallback(() => {
    if (!key) return;
    writeFavorites(key, []);
    invalidateSnapshot(key);
  }, [key]);

  return { favorites: ids, isFavorite, toggle, clear };
}

// ─── Snapshot cache ──────────────────────────────────────────────────────
// `useSyncExternalStore` vyžaduje, aby `getSnapshot()` vracelo stejnou
// referenci pokud se nic nezměnilo (jinak React varuje a může nekonečně
// re-renderovat). Cachujeme parsed array per-key a invalidujeme jen po write.
const snapshotCache = new Map<string, string[]>();
const EMPTY: string[] = [];

function readSnapshot(key: string | null): string[] {
  if (!key) return EMPTY;
  const cached = snapshotCache.get(key);
  if (cached) return cached;
  const fresh = readFavorites(key);
  snapshotCache.set(key, fresh);
  return fresh;
}

function invalidateSnapshot(key: string | null): void {
  if (key) snapshotCache.delete(key);
}

function getServerSnapshot(): string[] {
  return EMPTY;
}

/** Testing-only — vyčistí snapshot cache mezi testy. */
export function __resetFavoritesCache(): void {
  snapshotCache.clear();
}
