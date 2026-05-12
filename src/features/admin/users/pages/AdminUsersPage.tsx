import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UsersTable } from '../components/UsersTab/UsersTable';
import { UsersFilters } from '../components/UsersTab/UsersFilters';
import { RequestsTable } from '../components/RequestsTab/RequestsTable';
import { AuditLogTab } from '../components/AuditLogTab/AuditLogTab';
import {
  useAdminUsers,
  useAdminUsernameRequests,
} from '../api/useAdminUsers';
import { UserRole } from '@/shared/types';
import s from './AdminUsersPage.module.css';

type Tab = 'users' | 'requests' | 'audit';

const LIMIT = 20;

export default function AdminUsersPage() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: Tab =
    tabParam === 'requests'
      ? 'requests'
      : tabParam === 'audit'
        ? 'audit'
        : 'users';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [page, setPage] = useState(1);

  const usersQuery = useAdminUsers({
    page,
    limit: LIMIT,
    username: search || undefined,
    role: roleFilter,
    hasPendingRequest,
  });

  // Badge počet pending — vždy načteme, nezávisle na tabu (pro UI)
  const pendingCount = useAdminUsernameRequests({ status: 'pending', page: 1 });

  function setTab(next: Tab) {
    const newParams = new URLSearchParams(params);
    if (next === 'users') newParams.delete('tab');
    else newParams.set('tab', next);
    setParams(newParams, { replace: true });
  }

  return (
    <div className={s.page}>
      <h1 className={s.title}>Administrace uživatelů</h1>

      <div className={s.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'users'}
          className={`${s.tab} ${tab === 'users' ? s.tabActive : ''}`}
          onClick={() => setTab('users')}
        >
          Uživatelé
          {usersQuery.data && (
            <span className={s.tabBadge}>{usersQuery.data.total}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'requests'}
          className={`${s.tab} ${tab === 'requests' ? s.tabActive : ''}`}
          onClick={() => setTab('requests')}
        >
          Žádosti o username
          {pendingCount.data && pendingCount.data.total > 0 && (
            <span className={s.tabBadge}>{pendingCount.data.total}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'audit'}
          className={`${s.tab} ${tab === 'audit' ? s.tabActive : ''}`}
          onClick={() => setTab('audit')}
        >
          Audit log
        </button>
      </div>

      {tab === 'users' && (
        <>
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
        </>
      )}

      {tab === 'requests' && <RequestsTable />}

      {tab === 'audit' && <AuditLogTab />}
    </div>
  );
}
