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
  // N-AD-02 (plný audit 2026-06-20) — BE čte ?hasPendingDeletion= (ne
  // ?hasPendingRequest=), jinak filtr „čeká na smazání" nikdy nefunguje.
  if (query.hasPendingRequest) params.hasPendingDeletion = 'true';
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

/** 19.4 — admin uděluje/odebírá status Podporovatel. */
export function useAdminSetSupporter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      isSupporter,
    }: {
      userId: string;
      isSupporter: boolean;
    }) =>
      api.patch<User>(`/admin/users/${userId}/supporter`, { isSupporter }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: adminKeys.users });
      qc.invalidateQueries({ queryKey: ['public-users'] });
      qc.invalidateQueries({ queryKey: ['public-user-profile'] });
      qc.invalidateQueries({ queryKey: adminKeys.stats });
      qc.invalidateQueries({ queryKey: adminKeys.auditLog });
      toast.success(
        vars.isSupporter
          ? 'Status Podporovatel udělen'
          : 'Status Podporovatel odebrán',
      );
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

// ── D-NEW-INV-ADMIN-UI — reset hesla / založení uživatele / změna e-mailu ──

/**
 * Reset hesla uživatele — `PUT /users/:id/reset-password` (Superadmin-only,
 * BE 403 `PASSWORD_RESET_REQUIRES_SUPERADMIN`). BE heslo NEgeneruje ani
 * nevrací (204) — nové heslo dodává admin v body (`newPassword`, 8–128).
 * Úspěch NEtoastuje hook: `ResetPasswordModal` přepíná do stavu „nastaveno",
 * kde heslo zůstává viditelné ke zkopírování.
 */
export function useAdminResetPassword() {
  return useMutation({
    mutationFn: ({
      userId,
      newPassword,
    }: {
      userId: string;
      newPassword: string;
    }) => api.put<void>(`/users/${userId}/reset-password`, { newPassword }),
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

/**
 * Založení uživatele adminem — `POST /admin/users` (AdminGuard; hierarchie:
 * Admin nesmí zakládat admin role). Vrací SafeUser (201).
 * `onError` záměrně chybí — `CreateUserModal` mapuje `EMAIL_TAKEN` /
 * `USERNAME_TAKEN` na field-level chyby (vzor RegisterModal), toast by dubloval.
 */
export function useAdminCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      email: string;
      username: string;
      password: string;
      role?: UserRole;
    }) => api.post<User>('/admin/users', body),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: adminKeys.users });
      // C-12 — nový účet se objevuje i ve veřejném adresáři.
      qc.invalidateQueries({ queryKey: ['public-users'] });
      // C-51/C-52 — dashboard county + audit-log (USER_CREATE je auditovaný).
      qc.invalidateQueries({ queryKey: adminKeys.stats });
      qc.invalidateQueries({ queryKey: adminKeys.auditLog });
      toast.success(`Uživatel ${user.username} vytvořen`);
    },
  });
}

/**
 * Změna e-mailu uživatele — `PATCH /admin/users/:id/email` (Superadmin-only).
 * Chyby: 400 `SAME_EMAIL` · 409 `EMAIL_TAKEN` · 403 `SELF_MODIFICATION` /
 * `EMAIL_CHANGE_REQUIRES_SUPERADMIN` · 404 `USER_NOT_FOUND`. Nová adresa je
 * na BE označena `emailVerified: false`.
 * `onError` záměrně chybí — `AdminChangeEmailModal` mapuje kódy na field chyby.
 */
export function useAdminUpdateUserEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, email }: { userId: string; email: string }) =>
      api.patch<User>(`/admin/users/${userId}/email`, { email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users });
      // C-52 — EMAIL_CHANGE je auditovaná akce.
      qc.invalidateQueries({ queryKey: adminKeys.auditLog });
      toast.success('E-mail změněn (nová adresa je neověřená)');
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
