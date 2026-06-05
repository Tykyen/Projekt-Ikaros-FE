import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, parseApiError } from '@/shared/api/client';
import { adminKeys } from '../../api/adminKeys';
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
        // F-27 — BE `RequestUsernameChangeDto` očekává `newUsername` (ne
        // `requestedUsername`). Bez mapování whitelist pole zahodí → 400.
        { newUsername: requestedUsername },
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
    queryKey: [...adminKeys.users, query],
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
      qc.invalidateQueries({ queryKey: adminKeys.users });
      // C-12 — role/ban/deletion se zobrazují i na veřejném profilu/adresáři.
      qc.invalidateQueries({ queryKey: ['public-users'] });
      qc.invalidateQueries({ queryKey: ['public-user-profile'] });
      // C-51/C-52 — obnov i dashboard county a audit-log (akce jsou auditované).
      qc.invalidateQueries({ queryKey: adminKeys.stats });
      qc.invalidateQueries({ queryKey: adminKeys.auditLog });
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
      qc.invalidateQueries({ queryKey: adminKeys.users });
      // C-12 — role/ban/deletion se zobrazují i na veřejném profilu/adresáři.
      qc.invalidateQueries({ queryKey: ['public-users'] });
      qc.invalidateQueries({ queryKey: ['public-user-profile'] });
      // C-51/C-52 — obnov i dashboard county a audit-log (akce jsou auditované).
      qc.invalidateQueries({ queryKey: adminKeys.stats });
      qc.invalidateQueries({ queryKey: adminKeys.auditLog });
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
      qc.invalidateQueries({ queryKey: adminKeys.users });
      // C-12 — role/ban/deletion se zobrazují i na veřejném profilu/adresáři.
      qc.invalidateQueries({ queryKey: ['public-users'] });
      qc.invalidateQueries({ queryKey: ['public-user-profile'] });
      // C-51/C-52 — obnov i dashboard county a audit-log (akce jsou auditované).
      qc.invalidateQueries({ queryKey: adminKeys.stats });
      qc.invalidateQueries({ queryKey: adminKeys.auditLog });
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
      qc.invalidateQueries({ queryKey: adminKeys.users });
      // C-12 — role/ban/deletion se zobrazují i na veřejném profilu/adresáři.
      qc.invalidateQueries({ queryKey: ['public-users'] });
      qc.invalidateQueries({ queryKey: ['public-user-profile'] });
      // C-51/C-52 — obnov i dashboard county a audit-log (akce jsou auditované).
      qc.invalidateQueries({ queryKey: adminKeys.stats });
      qc.invalidateQueries({ queryKey: adminKeys.auditLog });
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
      qc.invalidateQueries({ queryKey: adminKeys.users });
      // C-12 — role/ban/deletion se zobrazují i na veřejném profilu/adresáři.
      qc.invalidateQueries({ queryKey: ['public-users'] });
      qc.invalidateQueries({ queryKey: ['public-user-profile'] });
      // C-51/C-52 — obnov i dashboard county a audit-log (akce jsou auditované).
      qc.invalidateQueries({ queryKey: adminKeys.stats });
      qc.invalidateQueries({ queryKey: adminKeys.auditLog });
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
      qc.invalidateQueries({ queryKey: adminKeys.users });
      // C-12 — role/ban/deletion se zobrazují i na veřejném profilu/adresáři.
      qc.invalidateQueries({ queryKey: ['public-users'] });
      qc.invalidateQueries({ queryKey: ['public-user-profile'] });
      // C-51/C-52 — obnov i dashboard county a audit-log (akce jsou auditované).
      qc.invalidateQueries({ queryKey: adminKeys.stats });
      qc.invalidateQueries({ queryKey: adminKeys.auditLog });
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
    queryKey: [...adminKeys.usernameRequests, query],
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
      qc.invalidateQueries({ queryKey: adminKeys.usernameRequests });
      qc.invalidateQueries({ queryKey: adminKeys.users });
      // C-12 — role/ban/deletion se zobrazují i na veřejném profilu/adresáři.
      qc.invalidateQueries({ queryKey: ['public-users'] });
      qc.invalidateQueries({ queryKey: ['public-user-profile'] });
      // C-51/C-52 — obnov i dashboard county a audit-log (akce jsou auditované).
      qc.invalidateQueries({ queryKey: adminKeys.stats });
      qc.invalidateQueries({ queryKey: adminKeys.auditLog });
      // C-45 — UsernameRequest je pending-action → obnov bell/nav/panel badge.
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
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
      qc.invalidateQueries({ queryKey: adminKeys.users });
      qc.invalidateQueries({ queryKey: ['public-users'] }); // C-12
      qc.invalidateQueries({ queryKey: ['public-user-profile'] }); // C-12
      qc.invalidateQueries({ queryKey: adminKeys.stats }); // C-51
      qc.invalidateQueries({ queryKey: adminKeys.auditLog }); // C-52
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
      qc.invalidateQueries({ queryKey: adminKeys.users });
      qc.invalidateQueries({ queryKey: ['public-users'] }); // C-12
      qc.invalidateQueries({ queryKey: ['public-user-profile'] }); // C-12
      qc.invalidateQueries({ queryKey: adminKeys.stats }); // C-51
      qc.invalidateQueries({ queryKey: adminKeys.auditLog }); // C-52
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
      qc.invalidateQueries({ queryKey: adminKeys.users });
      qc.invalidateQueries({ queryKey: ['public-users'] }); // C-12
      qc.invalidateQueries({ queryKey: ['public-user-profile'] }); // C-12
      qc.invalidateQueries({ queryKey: adminKeys.stats }); // C-51
      qc.invalidateQueries({ queryKey: adminKeys.auditLog }); // C-52
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
    queryKey: [...adminKeys.auditLog, query],
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
      qc.invalidateQueries({ queryKey: adminKeys.usernameRequests });
      qc.invalidateQueries({ queryKey: adminKeys.users }); // C-45 bonus — sloupec pending v listu
      qc.invalidateQueries({ queryKey: adminKeys.auditLog }); // C-52
      // C-45 — UsernameRequest je pending-action → obnov bell/nav/panel badge.
      qc.invalidateQueries({ queryKey: ['pending-actions'] });
      toast.success('Žádost odmítnuta');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}
