import { useEffect, useState } from 'react';
import { Input } from '@/shared/ui';
import { UserRole } from '@/shared/types';
import { ROLE_LABELS, ASSIGNABLE_ROLES } from '@/shared/types/userRoleLabels';
import s from './UsersTable.module.css';

interface Props {
  search: string;
  role?: UserRole;
  hasPendingRequest: boolean;
  onChange: (next: {
    search: string;
    role?: UserRole;
    hasPendingRequest: boolean;
  }) => void;
}

export function UsersFilters({
  search,
  role,
  hasPendingRequest,
  onChange,
}: Props) {
  const [localSearch, setLocalSearch] = useState(search);

  // Debounce search 300ms
  useEffect(() => {
    const id = setTimeout(() => {
      if (localSearch !== search) {
        onChange({ search: localSearch, role, hasPendingRequest });
      }
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  return (
    <div className={s.filters}>
      <Input
        className={s.searchInput}
        type="search"
        placeholder="🔍 Hledat uživatele..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        aria-label="Hledat podle username"
      />
      <select
        className={s.roleSelect}
        value={role ?? ''}
        onChange={(e) =>
          onChange({
            search: localSearch,
            role: e.target.value ? (Number(e.target.value) as UserRole) : undefined,
            hasPendingRequest,
          })
        }
        aria-label="Filtrovat role"
      >
        <option value="">Všechny role</option>
        {ASSIGNABLE_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      <label className={s.filterCheckbox}>
        <input
          type="checkbox"
          checked={hasPendingRequest}
          onChange={(e) =>
            onChange({
              search: localSearch,
              role,
              hasPendingRequest: e.target.checked,
            })
          }
        />
        Jen s pending request
      </label>
    </div>
  );
}
