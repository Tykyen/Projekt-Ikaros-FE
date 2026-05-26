import { useMemo, useState } from 'react';

export type Density = 'detail' | 'compact' | 'heat';

interface UseDensityArgs {
  worldId: string | null;
  maxEventsPerDay: number;
}

interface UseDensityResult {
  /** User-vybraná hodnota (perzistovaná). */
  density: Density;
  /** Skutečně použitá hodnota (s auto-fallback). */
  effectiveDensity: Density;
  /** True pokud effectiveDensity ≠ density (auto-fallback aktivní). */
  isFallback: boolean;
  setDensity: (next: Density) => void;
  /** Force override fallback — user explicitně zachová svou volbu. */
  forceUserChoice: () => void;
  forced: boolean;
}

const COMPACT_THRESHOLD = 8;
const HEAT_THRESHOLD = 30;
const STORAGE_PREFIX = 'calendar-density-';

function loadDensity(worldId: string | null): Density {
  if (!worldId) return 'detail';
  try {
    const v = localStorage.getItem(STORAGE_PREFIX + worldId);
    if (v === 'detail' || v === 'compact' || v === 'heat') return v;
  } catch {
    /* localStorage unavailable — ignore */
  }
  return 'detail';
}

function saveDensity(worldId: string | null, density: Density) {
  if (!worldId) return;
  try {
    localStorage.setItem(STORAGE_PREFIX + worldId, density);
  } catch {
    /* ignore */
  }
}

/**
 * 9.4 — Density mode pro kalendář s auto-fallback.
 *
 * - User vybere `detail` / `compact` / `heat`, persistence per `worldId`.
 * - Pokud `maxEventsPerDay > threshold`, `effectiveDensity` se degraduje:
 *   detail → compact (>8), compact → heat (>30).
 * - User může `forceUserChoice()` zachovat svou volbu i přes fallback.
 */
export function useDensity({ worldId, maxEventsPerDay }: UseDensityArgs): UseDensityResult {
  const [density, setDensityState] = useState<Density>(() => loadDensity(worldId));
  const [forced, setForced] = useState(false);
  // Reset state při změně worldId — pattern "adjustment during render" (React 19).
  const [prevWorldId, setPrevWorldId] = useState(worldId);
  if (prevWorldId !== worldId) {
    setPrevWorldId(worldId);
    setDensityState(loadDensity(worldId));
    setForced(false);
  }

  const effectiveDensity = useMemo<Density>(() => {
    if (forced) return density;
    if (density === 'detail' && maxEventsPerDay > COMPACT_THRESHOLD) {
      return maxEventsPerDay > HEAT_THRESHOLD ? 'heat' : 'compact';
    }
    if (density === 'compact' && maxEventsPerDay > HEAT_THRESHOLD) {
      return 'heat';
    }
    return density;
  }, [density, maxEventsPerDay, forced]);

  function setDensity(next: Density) {
    setDensityState(next);
    saveDensity(worldId, next);
    setForced(false);
  }

  function forceUserChoice() {
    setForced(true);
  }

  return {
    density,
    effectiveDensity,
    isFallback: effectiveDensity !== density,
    setDensity,
    forceUserChoice,
    forced,
  };
}

export const DENSITY_THRESHOLDS = {
  compact: COMPACT_THRESHOLD,
  heat: HEAT_THRESHOLD,
} as const;
