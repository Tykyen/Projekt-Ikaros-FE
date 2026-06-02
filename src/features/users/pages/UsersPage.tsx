import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { UsersPageTabs } from '../components/UsersPageTabs';
import {
  defaultTabForRole,
  visibleTabsForRole,
  type UsersPageTab,
} from '../components/usersPageTabs.helpers';
import { FriendsTab } from '../components/tabs/FriendsTab/FriendsTab';
import { UsersTab } from '../components/tabs/UsersTab/UsersTab';
import { ZpracovatTab } from '../components/tabs/ZpracovatTab/ZpracovatTab';
import { usePendingActionsCount } from '../api/usePendingActions';
import s from './UsersPage.module.css';

const TAB_TITLES: Record<UsersPageTab, string> = {
  pratele: 'Přátelé',
  uzivatele: 'Uživatelé',
  zpracovat: 'Zpracovat',
};

/**
 * 12.1 — `/ikaros/uzivatele` zúženo na komunitní taby (Přátelé / Uživatelé /
 * Zpracovat) pro všechny role. Hloubková admin správa + Audit log se
 * přesunuly pod `/admin`. Role-aware visibility, default tab, silent redirect.
 */
export default function UsersPage() {
  const me = useAtomValue(currentUserAtom);
  const role = me?.role ?? UserRole.Ikarus;

  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab') as UsersPageTab | null;
  const visible = useMemo(() => visibleTabsForRole(role), [role]);
  const fallback = defaultTabForRole(role);
  const tab: UsersPageTab =
    requestedTab && visible.includes(requestedTab) ? requestedTab : fallback;

  const { data: pendingCount } = usePendingActionsCount();

  // Silent redirect při nedostupném tabu
  useEffect(() => {
    if (!requestedTab) return;
    if (visible.includes(requestedTab)) return;
    toast.error('Nemáš oprávnění k tomuto tabu');
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', fallback);
        return next;
      },
      { replace: true },
    );
  }, [requestedTab, visible, fallback, setParams]);

  const changeTab = (next: UsersPageTab) => {
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        out.set('tab', next);
        // Reset view/page state mezi taby (jiná data)
        out.delete('page');
        out.delete('view');
        out.delete('sort');
        out.delete('search');
        out.delete('includeDeleted');
        return out;
      },
      { replace: false },
    );
  };

  const badges: Partial<Record<UsersPageTab, number>> = {
    zpracovat: pendingCount?.total ?? 0,
  };

  return (
    <div className={s.page}>
      <h1 className={s.title}>{TAB_TITLES[tab]}</h1>
      <UsersPageTabs
        active={tab}
        visible={visible}
        badges={badges}
        onChange={changeTab}
      />
      {tab === 'pratele' && <FriendsTab />}
      {tab === 'uzivatele' && <UsersTab />}
      {tab === 'zpracovat' && <ZpracovatTab />}
    </div>
  );
}
