import { lazy, Suspense, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import {
  Settings,
  ShieldHalf,
  Users,
  Eye,
  Palette,
  SlidersHorizontal,
  DoorOpen,
  LayoutTemplate,
  UserCog,
  Calendar,
  BookText,
  Navigation,
  Trash2,
  Theater,
} from 'lucide-react';
import { Spinner, Tabs, type TabItem } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole, WorldRole } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { WorldNotFound } from '@/features/world/components/WorldNotFound';
import { SYSTEM_CUSTOM_ID } from '@/features/ikaros/pages/CreateWorldPage/constants/systems';
import type { ReactNode } from 'react';
import s from './WorldSettingsPage.module.css';

const BasicInfoTab = lazy(() => import('./tabs/BasicInfoTab'));
const AccessModeTab = lazy(() => import('./tabs/AccessModeTab'));
const MembersTab = lazy(() => import('./tabs/MembersTab'));
const AkjTab = lazy(() => import('./tabs/AkjTab'));
const ThemeTab = lazy(() => import('./tabs/ThemeTab'));
const MyThemeTab = lazy(() => import('./tabs/MyThemeTab'));
const MembershipTab = lazy(() => import('./tabs/MembershipTab'));
const PageTemplatesTab = lazy(() => import('./tabs/PageTemplatesTab'));
const CharacterTabsVisibilityTab = lazy(
  () => import('./tabs/CharacterTabsVisibilityTab'),
);
const HeadlineLinkTab = lazy(() => import('./tabs/HeadlineLinkTab'));
const PjChatTab = lazy(() => import('./tabs/PjChatTab'));
const DeleteWorldTab = lazy(() => import('./tabs/DeleteWorldTab'));
// Přesun z world nav (2026-05-25): admin nástroje do Nastavení tabů.
const CalendarConfigsPage = lazy(
  () => import('@/features/world/pages/CalendarConfigsPage/CalendarConfigsPage'),
);
const WorldDiarySchemaEditorPage = lazy(
  () => import('@/features/world/pages/WorldDiarySchemaEditorPage'),
);

interface SettingsTab extends TabItem {
  /** Minimální světová role, která tab uvidí. */
  minRole: WorldRole;
  /**
   * Volitelný gate na `world.system`. Pokud nastaveno, tab se zobrazí
   * jen pro světy s tímto systémem (např. `SYSTEM_CUSTOM_ID` = „vlastni"
   * pro Šablonu deníku).
   */
  minSystem?: string;
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
    id: 'postavy-npc',
    label: 'Postavy & NPC',
    icon: <UserCog size={18} />,
    minRole: WorldRole.PJ,
    render: () => <CharacterTabsVisibilityTab />,
  },
  {
    // 12.2 — správa navigace přesunuta na dedikovanou stránku „Hlavní lišta"
    // (/admin/headline). Tento tab je rozcestník (konsolidace dvojkolejnosti).
    id: 'navigace',
    label: 'Hlavní lišta',
    icon: <Navigation size={18} />,
    minRole: WorldRole.PJ,
    render: () => <HeadlineLinkTab />,
  },
  {
    id: 'sablony',
    label: 'Šablony',
    icon: <LayoutTemplate size={18} />,
    minRole: WorldRole.Korektor,
    render: () => <PageTemplatesTab />,
  },
  {
    // 6.8 — PJ identita v chatu (jméno + avatar persony „PJ").
    id: 'pj-chat',
    label: 'PJ v chatu',
    icon: <Theater size={18} />,
    minRole: WorldRole.PJ,
    render: () => <PjChatTab />,
  },
  {
    // 9.2b — multi-config kalendáře světa (PJ+). Přesun z world nav 2026-05-25.
    id: 'kalendare',
    label: 'Kalendáře',
    icon: <Calendar size={18} />,
    minRole: WorldRole.PJ,
    render: () => <CalendarConfigsPage />,
  },
  {
    // 8.5 — editor schématu deníku. Smysl má jen pro „Vlastní Systém"
    // (u presetů je schema seedované přes SystemPresetsService).
    id: 'sablona-deniku',
    label: 'Šablona deníku',
    icon: <BookText size={18} />,
    minRole: WorldRole.PJ,
    minSystem: SYSTEM_CUSTOM_ID,
    render: () => <WorldDiarySchemaEditorPage />,
  },
  {
    id: 'vzhled',
    label: 'Vzhled',
    icon: <Palette size={18} />,
    minRole: WorldRole.Korektor,
    render: () => <ThemeTab />,
  },
  {
    id: 'muj-vzhled',
    label: 'Můj vzhled',
    icon: <SlidersHorizontal size={18} />,
    minRole: WorldRole.Ctenar,
    render: () => <MyThemeTab />,
  },
  {
    id: 'clenstvi',
    label: 'Členství',
    icon: <DoorOpen size={18} />,
    minRole: WorldRole.Ctenar,
    render: () => <MembershipTab />,
  },
  {
    // Soft-delete světa (PJ vlastník + Admin). Obnova do 30 dní jen Admin.
    id: 'smazat',
    label: 'Smazat svět',
    icon: <Trash2 size={18} />,
    minRole: WorldRole.PJ,
    render: () => <DeleteWorldTab />,
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
    () =>
      TABS.filter(
        (t) =>
          effectiveRole >= t.minRole &&
          // minSystem gate — viz Šablona deníku (jen Vlastní Systém).
          (!t.minSystem || world?.system === t.minSystem),
      ),
    [effectiveRole, world?.system],
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
