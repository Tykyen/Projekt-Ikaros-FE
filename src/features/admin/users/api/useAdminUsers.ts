import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, parseApiError } from '@/shared/api/client';
import type {
  AdminAuditAction,
  AdminAuditLogEntry,
  AdminUsersListItem,
  AdminUsernameRequestListItem,
  UsernameChangeRequest,
  UsernameChangeRequestStatus,
  User,
  UserRole,
} from '@/shared/types';

// ── User-facing: vlastní username request ────────────────────────────────

export function useMyUsernameRequest() {
  return useQuery({
    queryKey: ['users', 'me', 'username-request'],
    queryFn: () =>
      api.get<{ request: UsernameChangeRequest | null }>(
        '/users/me/username-request',
      ),
  });
}

export function useRequestUsernameChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestedUsername: string) =>
      api.post<{ request: UsernameChangeRequest }>(
        '/users/me/username-request',
        { requestedUsername },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'me', 'username-request'] });
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      toast.success('Žádost o změnu username odeslána');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function useCancelMyUsernameRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<void>('/users/me/username-request'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'me', 'username-request'] });
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      toast.success('Žádost zrušena');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

// D-028 — Toast po login s rozhodnutou žádostí
export function useMyLastUnseenDecidedRequest(enabled = true) {
  return useQuery({
    queryKey: ['users', 'me', 'username-request', 'last-unseen-decided'],
    queryFn: () =>
      api.get<{ request: UsernameChangeRequest | null }>(
        '/users/me/username-request/last-unseen-decided',
      ),
    enabled,
    staleTime: 60_000,
  });
}

export function useMarkUsernameRequestSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      api.post<void>(`/users/me/username-request/${requestId}/seen`),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['users', 'me', 'username-request', 'last-unseen-decided'],
      });
    },
  });
}

// ── Admin: seznam uživatelů ──────────────────────────────────────────────

export interface AdminUsersQuery {
  page: number;
  limit?: number;
  username?: string;
  role?: UserRole;
  hasPendingRequest?: boolean;
}

export function useAdminUsers(query: AdminUsersQuery, enabled = true) {
  const params: Record<string, unknown> = {
    page: query.page,
    limit: query.limit ?? 20,
  };
  if (query.username) params.username = query.username;
  if (query.role !== undefined) params.role = query.role;
  if (query.hasPendingRequest) params.hasPendingRequest = 'true';
  return useQuery({
    queryKey: ['admin', 'users', query],
    queryFn: () =>
      api.get<{ items: AdminUsersListItem[]; total: number }>(
        '/admin/users',
        params,
      ),
    enabled,
  });
}

export function useAdminUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      api.patch<User>(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Role aktualizována');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function useAdminBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      reason,
      durationDays,
    }: {
      userId: string;
      reason?: string;
      /** D-023 — 0/undefined = trvalý ban */
      durationDays?: number;
    }) =>
      api.post<{ user: User }>(`/admin/users/${userId}/ban`, {
        reason,
        durationDays,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Uživatel zabanován');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function useAdminUnbanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<{ user: User }>(`/admin/users/${userId}/unban`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Uživatel odbanován');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

// ── 1.3c — Admin moderation: delete request + cancel ───────────────────

export function useAdminRequestDeletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      api.post<{ user: User }>(`/admin/users/${userId}/request-deletion`, {
        reason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Účet naplánován na smazání (30denní hold)');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function useAdminCancelDeletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<{ user: User }>(`/admin/users/${userId}/cancel-deletion`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Plánované smazání zrušeno');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export interface AdminPermissionsPatch {
  canManageAdmins?: boolean;
  canModerateContent?: boolean;
  canEditPlatformPages?: boolean;
}

export function useAdminSetAdminPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: AdminPermissionsPatch;
    }) =>
      api.patch<{ user: User }>(
        `/admin/users/${userId}/admin-permissions`,
        permissions,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Oprávnění upraveno');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

// ── Admin: žádosti o username ────────────────────────────────────────────

export function useAdminUsernameRequests(query: {
  status?: UsernameChangeRequestStatus;
  page: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['admin', 'username-requests', query],
    queryFn: () =>
      api.get<{ items: AdminUsernameRequestListItem[]; total: number }>(
        '/admin/username-requests',
        { ...query, limit: query.limit ?? 20 },
      ),
  });
}

export function useAdminApproveUsernameRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      api.post<{ request: UsernameChangeRequest; user: User }>(
        `/admin/username-requests/${requestId}/approve`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'username-requests'] });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Žádost schválena');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

// ── D-025 — Bulk akce ────────────────────────────────────────────────────

export interface BulkResult {
  successful: string[];
  failed: Array<{ userId: string; code: string; message: string }>;
}

function bulkResultToast(result: BulkResult, actionLabel: string): void {
  const ok = result.successful.length;
  const fail = result.failed.length;
  if (fail === 0) {
    toast.success(`${actionLabel}: ${ok} úspěšně`);
  } else {
    toast.warning(`${actionLabel}: ${ok} úspěšně, ${fail} selhalo`);
  }
}

export function useAdminBulkBan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      userIds: string[];
      reason?: string;
      durationDays?: number;
    }) => api.post<BulkResult>('/admin/users/bulk-ban', body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      bulkResultToast(data, 'Bulk ban');
    },
    onError: (err) => toast.error(parseApiError(err)),
  });
}

export function useAdminBulkUnban() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userIds: string[]) =>
      api.post<BulkResult>('/admin/users/bulk-unban', { userIds }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      bulkResultToast(data, 'Bulk unban');
    },
    onError: (err) => toast.error(parseApiError(err)),
  });
}

export function useAdminBulkRoleChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userIds, role }: { userIds: string[]; role: UserRole }) =>
      api.post<BulkResult>('/admin/users/bulk-role-change', { userIds, role }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      bulkResultToast(data, 'Bulk role change');
    },
    onError: (err) => toast.error(parseApiError(err)),
  });
}

// ── D-024 — Admin audit log ──────────────────────────────────────────────

export function useAdminAuditLog(query: {
  action?: AdminAuditAction;
  actorId?: string;
  targetId?: string;
  page: number;
  limit?: number;
}) {
  const params: Record<string, unknown> = {
    page: query.page,
    limit: query.limit ?? 20,
  };
  if (query.action) params.action = query.action;
  if (query.actorId) params.actorId = query.actorId;
  if (query.targetId) params.targetId = query.targetId;
  return useQuery({
    queryKey: ['admin', 'audit-log', query],
    queryFn: () =>
      api.get<{ items: AdminAuditLogEntry[]; total: number }>(
        '/admin/audit-log',
        params,
      ),
  });
}

export function useAdminRejectUsernameRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason?: string;
    }) =>
      api.post<{ request: UsernameChangeRequest }>(
        `/admin/username-requests/${requestId}/reject`,
        { reason },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'username-requests'] });
      toast.success('Žádost odmítnuta');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}
