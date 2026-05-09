import type { ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import ForbiddenPage from '../../pages/errors/ForbiddenPage';

interface Props {
  roles: UserRole[];
  children: ReactNode;
}

export function RoleGuard({ roles, children }: Props) {
  const user = useAtomValue(currentUserAtom);
  if (!user || !roles.includes(user.role)) return <ForbiddenPage />;
  return <>{children}</>;
}
