import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Bug,
  Search,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { Tabs, type TabItem } from '@/shared/ui/Tabs/Tabs';
import { OverviewTab } from '../components/OverviewTab/OverviewTab';
import { UsersAdminTab } from '../components/UsersAdminTab/UsersAdminTab';
import { AuditLogTab } from '../users/components/AuditLogTab/AuditLogTab';
import { SearchIndexTab } from '../components/SearchIndexTab/SearchIndexTab';
import { DeletedWorldsTab } from '../components/DeletedWorldsTab/DeletedWorldsTab';
import { ChybyTab } from '../components/ChybyTab/ChybyTab';
import { FriendshipDebugTab } from '@/features/users/components/tabs/FriendshipDebugTab/FriendshipDebugTab';
import s from './PlatformAdminPage.module.css';

type AdminTab =
  | 'prehled'
  | 'uzivatele'
  | 'smazane-svety'
  | 'chyby'
  | 'audit'
  | 'search-index'
  | 'friendship-debug';

const IS_DEV = import.meta.env.DEV;

const TABS: TabItem[] = [
  { id: 'prehled', label: 'Přehled', icon: <LayoutDashboard size={18} /> },
  { id: 'uzivatele', label: 'Uživatelé', icon: <Users size={18} /> },
  {
    id: 'smazane-svety',
    label: 'Smazané světy',
    icon: <Trash2 size={18} />,
  },
  { id: 'chyby', label: 'Chyby', icon: <Bug size={18} /> },
  { id: 'audit', label: 'Audit log', icon: <ClipboardList size={18} /> },
  { id: 'search-index', label: 'Search index', icon: <Search size={18} /> },
  // 20.5 — „Chat" není obsahový tab: navádí na samostatnou route /admin/chat.
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={18} /> },
  // Dev-only nástroj — na produkci se nezobrazí.
  ...(IS_DEV
    ? [
        {
          id: 'friendship-debug',
          label: 'Friendship debug',
          icon: <Bug size={18} />,
        } as TabItem,
      ]
    : []),
];

const VALID = new Set<AdminTab>([
  'prehled',
  'uzivatele',
  'smazane-svety',
  'chyby',
  'audit',
  'search-index',
  ...(IS_DEV ? (['friendship-debug'] as AdminTab[]) : []),
]);

/**
 * 12.1 — platformový admin hub. RoleGuard (Superadmin/Admin) je na route.
 * Taby: Přehled (dashboard) / Uživatelé (správa) / Audit log + Friendship
 * debug (jen DEV). „Zpracovat" zůstává na `/ikaros/uzivatele` — je to osobní
 * fronta každého uživatele, ne admin nástroj. URL `?tab=`.
 */
export default function PlatformAdminPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const raw = params.get('tab');
  const tab: AdminTab =
    raw && VALID.has(raw as AdminTab) ? (raw as AdminTab) : 'prehled';

  const changeTab = (next: string) => {
    // 20.5 — „Chat" je odkaz na samostatnou stránku, ne přepnutí obsahu.
    if (next === 'chat') {
      navigate('/admin/chat');
      return;
    }
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        out.set('tab', next);
        // Prefill hledání (deep-link z profilu) nepatří jinému tabu.
        out.delete('search');
        return out;
      },
      { replace: false },
    );
  };

  return (
    <div className={s.page}>
      <h1 className={s.title}>Administrace</h1>
      <Tabs
        items={TABS}
        activeId={tab}
        onChange={changeTab}
        orientation="horizontal"
      >
        {tab === 'prehled' && <OverviewTab />}
        {tab === 'uzivatele' && <UsersAdminTab />}
        {tab === 'smazane-svety' && <DeletedWorldsTab />}
        {tab === 'chyby' && <ChybyTab />}
        {tab === 'audit' && <AuditLogTab />}
        {tab === 'search-index' && <SearchIndexTab />}
        {tab === 'friendship-debug' && IS_DEV && <FriendshipDebugTab />}
      </Tabs>
    </div>
  );
}
