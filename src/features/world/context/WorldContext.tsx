import { createContext, useContext } from 'react';
import type { World, WorldRole } from '@/shared/types';

export interface WorldContextValue {
  /** Reálné Mongo ObjectId světa — pro volání BE `/api/worlds/:worldId/...`. */
  worldId: string;
  /** Slug z URL — pro generování odkazů `/svet/<slug>/...`. */
  worldSlug: string;
  world: World | null;
  isPJ: boolean;
  userRole: WorldRole | null;
  loading: boolean;
}

export const WorldContext = createContext<WorldContextValue>({
  worldId: '',
  worldSlug: '',
  world: null,
  isPJ: false,
  userRole: null,
  loading: true,
});

export function useWorldContext(): WorldContextValue {
  return useContext(WorldContext);
}
