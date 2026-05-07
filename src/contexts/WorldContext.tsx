import { createContext, useContext } from 'react';
import type { World, WorldRole } from '../types';

export interface WorldContextValue {
  worldId: string;
  world: World | null;
  isPJ: boolean;
  userRole: WorldRole | null;
  loading: boolean;
}

export const WorldContext = createContext<WorldContextValue>({
  worldId: '',
  world: null,
  isPJ: false,
  userRole: null,
  loading: true,
});

export function useWorldContext(): WorldContextValue {
  return useContext(WorldContext);
}
