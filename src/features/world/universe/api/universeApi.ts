// 10.1 — low-level volání BE `universe` modulu.
// Endpointy: GET /universe?worldId=, PUT /universe?worldId=,
//            PATCH /universe/:worldId/nodes/:nodeId/visibility
import { api } from '@/shared/api/client';
import type {
  UniverseMap,
  UpdateUniverseInput,
  UpdateNodeVisibilityInput,
} from '../types';

export function getUniverse(worldId: string): Promise<UniverseMap> {
  return api.get<UniverseMap>(
    `/universe?worldId=${encodeURIComponent(worldId)}`,
  );
}

export function putUniverse(
  worldId: string,
  input: UpdateUniverseInput,
): Promise<UniverseMap> {
  return api.put<UniverseMap>(
    `/universe?worldId=${encodeURIComponent(worldId)}`,
    input,
  );
}

export function patchNodeVisibility(
  worldId: string,
  nodeId: string,
  input: UpdateNodeVisibilityInput,
): Promise<UniverseMap> {
  return api.patch<UniverseMap>(
    `/universe/${encodeURIComponent(worldId)}/nodes/${encodeURIComponent(nodeId)}/visibility`,
    input,
  );
}
