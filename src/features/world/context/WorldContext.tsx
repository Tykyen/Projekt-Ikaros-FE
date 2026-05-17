import { createContext, useContext } from 'react';
import type { World, WorldRole } from '@/shared/types';

/**
 * Spec 5.1 — aktivní postava uživatele v tomto světě. Slot zaveden teď, aby
 * fáze 8 (character flow) neměnila tvar `WorldContextValue` napříč konzumenty.
 * Do fáze 8 je vždy `null` → header fallbackuje na účet uživatele.
 */
export interface WorldCharacterSlot {
  /** Slug postavy → odkaz `/svet/<worldSlug>/<characterPath>`. */
  characterPath: string;
  name: string;
  avatarUrl?: string;
}

export interface WorldContextValue {
  /** Reálné Mongo ObjectId světa — pro volání BE `/api/worlds/:worldId/...`. */
  worldId: string;
  /** Slug z URL — pro generování odkazů `/svet/<slug>/...`. */
  worldSlug: string;
  world: World | null;
  isPJ: boolean;
  userRole: WorldRole | null;
  /** Fáze 8 — aktivní postava ve světě. Do té doby `null`. */
  character: WorldCharacterSlot | null;
  loading: boolean;
}

export const WorldContext = createContext<WorldContextValue>({
  worldId: '',
  worldSlug: '',
  world: null,
  isPJ: false,
  userRole: null,
  character: null,
  loading: true,
});

export function useWorldContext(): WorldContextValue {
  return useContext(WorldContext);
}
