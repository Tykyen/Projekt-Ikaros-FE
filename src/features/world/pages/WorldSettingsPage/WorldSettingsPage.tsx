import { lazy, Suspense, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import {
  Settings,
  ShieldHalf,
  Users,
  Eye,
  Palette,
  DoorOpen,
} from 'lucide-react';
import { Spinner, Tabs, type TabItem } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole, WorldRole } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { WorldNotFound } from '@/features/world/components/WorldNotFound';
import type { ReactNode } from 'react';
import s from './WorldSettingsPage.module.css';

const BasicInfoTab = lazy(() => import('./tabs/BasicInfoTab'));
const AccessModeTab = lazy(() => import('./tabs/AccessModeTab'));
const MembersTab = lazy(() => import('./tabs/MembersTab'));
const AkjTab = lazy(() => import('./tabs/AkjTab'));
const ThemeTab = lazy(() => import('./tabs/ThemeTab'));
const MembershipTab = lazy(() => import('./tabs/MembershipTab'));

interface SettingsTab extends TabItem {
  /** Minimální světová role, která tab uvidí. */
  minRole: WorldRole;
  render: () => ReactNode;
}

const TABS: SettingsTab[] = [
  {
    id: 'zakladni',
    label: 'Základní info',
    icon: <Settings size={18} />,
    minRole: WorldRole.Korektor,
    render: () => <BasicInfoTab />,
  },
  {
    id: 'pristup',
    label: 'Přístup',
    icon: <ShieldHalf size={18} />,
    minRole: WorldRole.Korektor,
    render: () => <AccessModeTab />,
  },
  {
    id: 'clenove',
    label: 'Členové',
    icon: <Users size={18} />,
    minRole: WorldRole.PomocnyPJ,
    render: () => <MembersTab />,
  },
  {
    id: 'akj',
    label: 'AKJ úrovně',
    icon: <Eye size={18} />,
    minRole: WorldRole.PomocnyPJ,
    render: () => <AkjTab />,
  },
  {
    id: 'vzhled',
    label: 'Vzhled',
    icon: <Palette size={18} />,
    minRole: WorldRole.Korektor,
    render: () => <ThemeTab />,
  },
  {
    id: 'clenstvi',
    label: 'Členství',
    icon: <DoorOpen size={18} />,
    minRole: WorldRole.Ctenar,
    render: () => <MembershipTab />,
  },
];

/**
 * 5.3 — Nastavení světa. Tabová stránka; viditelnost tabů řízena rolí
 * (globální Admin/Superadmin = jako PJ). Aktivní tab drží URL hash.
 */
export default function WorldSettingsPage() {
  const { world, userRole, loading } = useWorldContext();
  const currentUser = useAtomValue(currentUserAtom);
  const location = useLocation();
  const navigate = useNavigate();

  const isGlobalAdmin =
    currentUser?.role !== undefined && currentUser.role <= UserRole.Admin;
  const effectiveRole: WorldRole = isGlobalAdmin
    ? WorldRole.PJ
    : (userRole ?? WorldRole.Zadatel);

  const visibleTabs = useMemo(
    () => TABS.filter((t) => effectiveRole >= t.minRole),
    [effectiveRole],
  );

  const hashId = location.hash.replace('#', '');
  const activeId =
    visibleTabs.find((t) => t.id === hashId)?.id ?? visibleTabs[0]?.id ?? '';
  const activeTab = visibleTabs.find((t) => t.id === activeId);

  if (loading) return <Spinner center />;
  if (!world) return <WorldNotFound />;

  return (
    <div className={s.page}>
      <h1 className={s.heading}>Nastavení světa</h1>
      <Tabs
        items={visibleTabs}
        activeId={activeId}
        onChange={(id) => navigate({ hash: id })}
      >
        <Suspense fallback={<Spinner center />}>
          {activeTab?.render()}
        </Suspense>
      </Tabs>
    </div>
  );
}
