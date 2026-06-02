/**
 * 10.2c — REST API wrapper pro per-scene operations + scene fetch.
 *
 * Endpointy (z 10.2-prep-1):
 *   GET    /maps?worldId=                — list scén ve světě
 *   GET    /maps?worldId=&isActive=true  — list aktivních scén (PJ orchestrator)
 *   GET    /maps/active?worldId=         — per-user resolve aktivní scény
 *   GET    /maps/:id                     — detail (s characterData enrichmentem)
 *   POST   /maps/:id/operations          — apply operace (token/effect/fog/...)
 *   GET    /maps/:id/operations?since=N  — catch-up log
 *
 * Spec: docs/arch/phase-10/spec-10.2c.md §3.7.
 */
import { api } from '@/shared/api/client';
import type {
  MapScene,
  MapOperation,
  ApplyMapOperationResponse,
  MapOperationsListResponse,
} from '../types';

/** Per-user resolve aktuální scény. 404 = `MAP_NO_ACTIVE_SCENE`. */
export function getActiveMapScene(worldId: string): Promise<MapScene> {
  return api.get<MapScene>('/maps/active', { worldId });
}

/** Detail scény dle ID (s `enrichTokens` z BE). */
export function getMapScene(sceneId: string): Promise<MapScene> {
  return api.get<MapScene>(`/maps/${sceneId}`);
}

/** List všech scén světa. */
export function listMapScenes(worldId: string): Promise<MapScene[]> {
  return api.get<MapScene[]>('/maps', { worldId });
}

/** List jen aktivních scén — PJ orchestrator panel. */
export function listActiveMapScenes(worldId: string): Promise<MapScene[]> {
  return api.get<MapScene[]>('/maps', { worldId, isActive: 'true' });
}

/**
 * Apply per-scene operace. Server validates → atomic update → log →
 * WS broadcast `map:operation`.
 *
 * Response obsahuje `inverse` pro klient-side undo stack (10.2m).
 */
export function postMapOperation(
  sceneId: string,
  op: MapOperation,
): Promise<ApplyMapOperationResponse> {
  return api.post<ApplyMapOperationResponse>(
    `/maps/${sceneId}/operations`,
    op,
  );
}

/**
 * Catch-up: vrací operace s `seqNumber > since` (ascending). Pro re-sync
 * po WS reconnect (klient drží `lastSeqNumber`).
 */
export function getMapOperationsSince(
  sceneId: string,
  since: number,
  limit = 500,
): Promise<MapOperationsListResponse> {
  return api.get<MapOperationsListResponse>(
    `/maps/${sceneId}/operations`,
    { since, limit },
  );
}
