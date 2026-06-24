import { lazy, Suspense, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Smile,
  Download,
  Map as MapIcon,
  Swords,
} from 'lucide-react';
import { Spinner, Tabs, type TabItem } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
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
const MapDefaultsTab = lazy(() => import('./tabs/MapDefaultsTab'));
const ChatCombatDefaultsTab = lazy(
  () => import('./tabs/ChatCombatDefaultsTab'),
);
const DeleteWorldTab = lazy(() => import('./tabs/DeleteWorldTab'));
const ExportTab = lazy(() => import('./tabs/ExportTab'));
// Přesun z world nav (2026-05-25): admin nástroje do Nastavení tabů.
const CalendarConfigsPage = lazy(
  () => import('@/features/world/pages/CalendarConfigsPage/CalendarConfigsPage'),
);
const WorldDiarySchemaEditorPage = lazy(
  () => import('@/features/world/pages/WorldDiarySchemaEditorPage'),
);
const WorldEmotesAdminPage = lazy(
  () => import('@/features/world/pages/WorldEmotesAdminPage/WorldEmotesAdminPage'),
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
    // 15.4 (E) — výchozí nastavení map (typ mřížky, měřítko, HP, kreslení).
    // Seeduje novou scénu; PJ-level.
    id: 'mapy',
    label: 'Mapy',
    icon: <MapIcon size={18} />,
    minRole: WorldRole.PJ,
    render: () => <MapDefaultsTab />,
  },
  {
    // 6.8 / 6.8-followup — PJ identita v chatu i headeru. Viditelný od PomocnyPJ
    // (kvůli self-service „Můj obrázek vedení"); přepínač režimu uvnitř je PJ-only.
    id: 'pj-chat',
    label: 'PJ v chatu',
    icon: <Theater size={18} />,
    minRole: WorldRole.PomocnyPJ,
    render: () => <PjChatTab />,
  },
  {
    // 16.1e — výchozí viditelnost HP v combat rosteru chatu (per typ). PJ-level.
    id: 'chat-souboj',
    label: 'Souboj v chatu',
    icon: <Swords size={18} />,
    minRole: WorldRole.PJ,
    render: () => <ChatCombatDefaultsTab />,
  },
  {
    // 6.4c — custom emoty světa (PomocnyPJ+). N-03: přesun z orphan routy
    // admin/emotes na záložku (jediný přístup, dřív nedosažitelné z UI).
    id: 'emotes',
    label: 'Emoty světa',
    icon: <Smile size={18} />,
    minRole: WorldRole.PomocnyPJ,
    render: () => <WorldEmotesAdminPage />,
  },
  {
    // 9.2b — multi-config kalendáře světa. N-08: PomocnyPJ (parita s BE
    // calendar-config write floor). Přesun z world nav 2026-05-25.
    id: 'kalendare',
    label: 'Kalendáře',
    icon: <Calendar size={18} />,
    minRole: WorldRole.PomocnyPJ,
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
    // Sdílený motiv světa = brand světa → jen vedení (PomocnyPJ+). Bug-fix:
    // dřív Korektor+ → člen přepsal motiv VŠEM včetně PJ. Členská personalizace
    // (vlastní motiv/pozadí/barvy jen pro sebe) žije v tabu „Můj vzhled".
    id: 'vzhled',
    label: 'Vzhled',
    icon: <Palette size={18} />,
    minRole: WorldRole.PomocnyPJ,
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
    // 14.7c — export / záloha celého světa (ZIP). Jen PJ (BE pj-full).
    id: 'export',
    label: 'Export / Záloha',
    icon: <Download size={18} />,
    minRole: WorldRole.PJ,
    render: () => <ExportTab />,
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
 * 5.3 — Nastavení světa. Tabová stránka; viditelnost tabů řízena JEN skutečnou
 * world rolí (R-20 — platform Admin tu nemá governance moc). Aktivní tab drží URL hash.
 */
export default function WorldSettingsPage() {
  const { world, userRole, loading } = useWorldContext();
  const location = useLocation();
  const navigate = useNavigate();

  // R-20 (role-audit) — platformový Admin/Superadmin NEMÁ governance moc ve světě
  // → settings taby řídí JEN skutečná world role (admin bez staff role = žádný
  // tab). Admin pojistka (obnova opuštěného světa) žije v Admin panelu, ne tady.
  const effectiveRole: WorldRole = userRole ?? WorldRole.Zadatel;

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
