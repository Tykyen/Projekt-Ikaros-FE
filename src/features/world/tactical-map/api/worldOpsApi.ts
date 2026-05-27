/**
 * 10.2c — REST API wrapper pro cross-scene operations.
 *
 * Endpointy (z 10.2-prep-1):
 *   POST   /worlds/:worldId/operations          — member.* assignment ops
 *   GET    /worlds/:worldId/operations?since=N  — PJ orchestrator catch-up
 *
 * Spec: docs/arch/phase-10/spec-10.2c.md §3.7.
 */
import { api } from '@/shared/api/client';
import type {
  WorldOperation,
  ApplyWorldOperationResponse,
} from '../types';

/**
 * Apply cross-scene operace (`member.assignToScene` / `.unassign` / `.bulkAssign`).
 *
 * Server: validate → assertCanDoWorldOp → cascade `token.remove` ze staré scény →
 * atomic update `WorldMembership.currentSceneId` → log + emit:
 *   - `map:operation` (cascade) → room oldSceneId
 *   - `world:operation` → room `world:{worldId}` (PJ orchestrator)
 *   - private `map:reassigned` → user:{userId} room (affected hráč)
 */
export function postWorldOperation(
  worldId: string,
  op: WorldOperation,
): Promise<ApplyWorldOperationResponse> {
  return api.post<ApplyWorldOperationResponse>(
    `/worlds/${worldId}/operations`,
    op,
  );
}

/** Catch-up cross-scene log (PJ-only — server enforce). */
export interface WorldOperationsListResponse {
  worldId: string;
  lastSeqNumber: number;
  operations: Array<{
    seqNumber: number;
    op: WorldOperation;
    byUserId: string;
    appliedAt: string;
    cascadeMapOpIds: string[];
  }>;
}

export function getWorldOperationsSince(
  worldId: string,
  since: number,
  limit = 200,
): Promise<WorldOperationsListResponse> {
  return api.get<WorldOperationsListResponse>(
    `/worlds/${worldId}/operations`,
    { since, limit },
  );
}
