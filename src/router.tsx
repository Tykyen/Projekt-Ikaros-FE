/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { createBrowserRouter, redirect, type LoaderFunctionArgs } from 'react-router-dom';
import { IkarosLayout, WorldLayout } from './components/layout';
import { Spinner } from './components/ui';
import { RoleGuard } from './components/guards/RoleGuard';
import { saveLoginIntent } from './auth/loginIntent';
import { UserRole } from '@/shared/types';
import NotFoundPage from './pages/errors/NotFoundPage';
import ErrorPage from './pages/errors/ErrorPage';

// ── Lazy pages — Ikaros ───────────────────────────────────────────────────
const DashboardPage    = lazy(() => import('./pages/ikaros/DashboardPage'));
const ChatPage         = lazy(() => import('./pages/ikaros/ChatPage'));
const WorldsPage       = lazy(() => import('./pages/ikaros/WorldsPage'));
const CreateWorldPage  = lazy(() => import('./pages/ikaros/CreateWorldPage'));
const ProfilePage      = lazy(() => import('./pages/ikaros/ProfilePage'));
const UsersPage        = lazy(() => import('./pages/ikaros/UsersPage'));
const UserProfilePage  = lazy(() => import('./pages/ikaros/UserProfilePage'));
const ArticlesPage     = lazy(() => import('./pages/ikaros/ArticlesPage'));
const GalleryPage      = lazy(() => import('./pages/ikaros/GalleryPage'));
const DiscussionsPage  = lazy(() => import('./pages/ikaros/DiscussionsPage'));
const MailPage             = lazy(() => import('./pages/ikaros/MailPage'));
const HelpPage             = lazy(() => import('./pages/ikaros/HelpPage'));
const TermsPage            = lazy(() => import('./pages/ikaros/TermsPage'));
const DiscussionsNewPage   = lazy(() => import('./pages/ikaros/DiscussionsNewPage'));

// ── Lazy pages — Admin ────────────────────────────────────────────────────
const PlatformAdminPage  = lazy(() => import('./pages/admin/PlatformAdminPage'));
const DungeonBuilderPage = lazy(() => import('./pages/admin/DungeonBuilderPage'));

// ── Lazy pages — World ────────────────────────────────────────────────────
const WorldDashboardPage = lazy(() => import('./pages/world/WorldDashboardPage'));
const WorldChatPage      = lazy(() => import('./pages/world/WorldChatPage'));
const PagesListPage      = lazy(() => import('./pages/world/PagesListPage'));
const PageViewerPage     = lazy(() => import('./pages/world/PageViewerPage'));
const PageEditorPage     = lazy(() => import('./pages/world/PageEditorPage'));
const CharactersPage     = lazy(() => import('./pages/world/CharactersPage'));
const MyCharacterPage    = lazy(() => import('./pages/world/MyCharacterPage'));
const MapPage            = lazy(() => import('./pages/world/MapPage'));
const TacticalMapPage    = lazy(() => import('./pages/world/TacticalMapPage'));
const CalendarPage       = lazy(() => import('./pages/world/CalendarPage'));
const TimelinePage       = lazy(() => import('./pages/world/TimelinePage'));
const WeatherPage        = lazy(() => import('./pages/world/WeatherPage'));
const EventsPage         = lazy(() => import('./pages/world/EventsPage'));
const CampaignPage       = lazy(() => import('./pages/world/CampaignPage'));
const StorylinesPage     = lazy(() => import('./pages/world/StorylinesPage'));
const ShopPage           = lazy(() => import('./pages/world/ShopPage'));
const SoundsPage         = lazy(() => import('./pages/world/SoundsPage'));
const CurrencyPage       = lazy(() => import('./pages/world/CurrencyPage'));
const WorldSettingsPage  = lazy(() => import('./pages/world/WorldSettingsPage'));
const GroupsPage         = lazy(() => import('./pages/world/GroupsPage'));
const RulesPage          = lazy(() => import('./pages/world/RulesPage'));
const PagesAdminPage     = lazy(() => import('./pages/world/PagesAdminPage'));
const NPCDirectoryPage   = lazy(() => import('./pages/world/NPCDirectoryPage'));

// ── Suspense wrapper ──────────────────────────────────────────────────────
function p(Comp: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={<Spinner center />}>
      <Comp />
    </Suspense>
  );
}

// ── Per-route auth loader ─────────────────────────────────────────────────
// Pokud chybí token, uloží zamýšlenou cestu do sessionStorage (LoginModal
// po úspěšném přihlášení tam naviguje), redirectne na úvodník s
// `?openLogin=1` aby se modal automaticky otevřel.
export function requireAuth({ request }: LoaderFunctionArgs) {
  const raw = localStorage.getItem('ikaros.jwt');
  if (raw) {
    try {
      const token: string | null = JSON.parse(raw);
      if (token) return null;
    } catch {
      // fall through
    }
  }
  const url = new URL(request.url);
  saveLoginIntent(url.pathname + url.search);
  return redirect('/?openLogin=1');
}

// ── Router ────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // IkarosLayout — některé child routes veřejné, některé chráněné per-route
  {
    path: '/',
    element: <IkarosLayout />,
    errorElement: <ErrorPage />,
    children: [
      // Veřejné — anon má přístup
      { index: true,                    element: p(DashboardPage) },
      { path: 'ikaros/vesmiry',         element: p(WorldsPage) },
      { path: 'ikaros/clanky',          element: p(ArticlesPage) },
      { path: 'ikaros/galerie',         element: p(GalleryPage) },
      { path: 'ikaros/diskuze',         element: p(DiscussionsPage) },
      { path: 'ikaros/napoveda',        element: p(HelpPage) },
      { path: 'podminky',               element: p(TermsPage) },

      // Chráněné — vyžadují přihlášení (per-route loader)
      { path: 'chat',                   element: p(ChatPage),         loader: requireAuth },
      { path: 'ikaros/vytvorit-svet',   element: p(CreateWorldPage),  loader: requireAuth },
      { path: 'ikaros/profil',          element: p(ProfilePage),      loader: requireAuth },
      { path: 'ikaros/uzivatel/:id',    element: p(UserProfilePage),  loader: requireAuth },
      { path: 'ikaros/diskuze/nova',    element: p(DiscussionsNewPage), loader: requireAuth },
      { path: 'ikaros/posta',           element: p(MailPage),         loader: requireAuth },

      // Chráněné + role gate
      {
        path: 'ikaros/uzivatele',
        loader: requireAuth,
        element: (
          <RoleGuard roles={[UserRole.Superadmin, UserRole.Admin]}>
            {p(UsersPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'admin',
        loader: requireAuth,
        element: (
          <RoleGuard roles={[UserRole.Superadmin, UserRole.Admin]}>
            {p(PlatformAdminPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'admin/dungeon-builder',
        loader: requireAuth,
        element: (
          <RoleGuard roles={[UserRole.Superadmin, UserRole.Admin, UserRole.PJ]}>
            {p(DungeonBuilderPage)}
          </RoleGuard>
        ),
      },
    ],
  },

  // Chráněné — WorldLayout (celá světová vrstva za auth)
  {
    path: '/svet/:worldId',
    element: <WorldLayout />,
    loader: requireAuth,
    errorElement: <ErrorPage />,
    children: [
      { index: true,                    element: p(WorldDashboardPage) },
      { path: 'chat',                   element: p(WorldChatPage) },
      { path: 'stranky',                element: p(PagesListPage) },
      { path: 'nova-stranka',           element: p(PageEditorPage) },
      { path: 'edit/:slug',             element: p(PageEditorPage) },
      { path: 'postavy',                element: p(CharactersPage) },
      { path: 'moje-postava',           element: p(MyCharacterPage) },
      { path: 'mapa',                   element: p(MapPage) },
      { path: 'takticka-mapa',          element: p(TacticalMapPage) },
      { path: 'kalendar',               element: p(CalendarPage) },
      { path: 'timeline',               element: p(TimelinePage) },
      { path: 'pocasi',                 element: p(WeatherPage) },
      { path: 'sprava-udalosti',        element: p(EventsPage) },
      { path: 'pavucina',               element: p(CampaignPage) },
      { path: 'scenare',                element: p(StorylinesPage) },
      { path: 'obchod',                 element: p(ShopPage) },
      { path: 'zvuky',                  element: p(SoundsPage) },
      { path: 'prevodnik-men',          element: p(CurrencyPage) },
      { path: 'nastaveni',              element: p(WorldSettingsPage) },
      { path: 'skupiny',                element: p(GroupsPage) },
      { path: 'pravidla',               element: p(RulesPage) },
      {
        path: 'admin/stranky',
        element: (
          <RoleGuard roles={[UserRole.Superadmin, UserRole.Admin, UserRole.PJ]}>
            {p(PagesAdminPage)}
          </RoleGuard>
        ),
      },
      {
        path: 'admin/adresar-postav',
        element: (
          <RoleGuard roles={[UserRole.Superadmin, UserRole.Admin, UserRole.PJ]}>
            {p(NPCDirectoryPage)}
          </RoleGuard>
        ),
      },
      // Wiki stránky — catch-all (musí být poslední)
      { path: ':slug', element: p(PageViewerPage) },
    ],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);
