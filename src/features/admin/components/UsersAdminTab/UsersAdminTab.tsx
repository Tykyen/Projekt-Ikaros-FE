import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/shared/ui';
import { UserRole } from '@/shared/types';
import { UsersFilters } from '../../users/components/UsersTab/UsersFilters';
import { UsersTable } from '../../users/components/UsersTab/UsersTable';
import { CreateUserModal } from '../../users/components/UsersTab/CreateUserModal';
import { useAdminUsers } from '../../users/api/useAdminUsers';
import s from '../../users/components/UsersTab/UsersTable.module.css';

const LIMIT = 20;

/**
 * 12.1 — správa uživatelů pod `/admin` (relokace z `/ikaros/uzivatele`).
 * Filtry (search / role / pending request) + admin tabulka (bulk, ban, role,
 * delete, admin-perms — vše uvnitř `UsersTable`) + paginace.
 * D-NEW-INV-ADMIN-UI — „Nový uživatel" (`POST /admin/users`; AdminGuard =
 * celý tab je za RoleGuardem Admin+, hierarchii rolí hlídá modal + BE).
 */
export function UsersAdminTab() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const usersQuery = useAdminUsers({
    page,
    limit: LIMIT,
    username: search || undefined,
    role: roleFilter,
    hasPendingRequest,
  });

  return (
    <>
      <div className={s.tabToolbar}>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateOpen(true)}
        >
          <UserPlus size={16} /> Nový uživatel
        </Button>
      </div>
      <UsersFilters
        search={search}
        role={roleFilter}
        hasPendingRequest={hasPendingRequest}
        onChange={(next) => {
          setSearch(next.search);
          setRoleFilter(next.role);
          setHasPendingRequest(next.hasPendingRequest);
          setPage(1);
        }}
      />
      <UsersTable
        items={usersQuery.data?.items ?? []}
        total={usersQuery.data?.total ?? 0}
        page={page}
        limit={LIMIT}
        isLoading={usersQuery.isLoading}
        onPageChange={setPage}
      />
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
