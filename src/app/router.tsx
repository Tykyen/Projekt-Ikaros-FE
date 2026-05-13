/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { createBrowserRouter, redirect, type LoaderFunctionArgs } from 'react-router-dom';
import { IkarosLayout, WorldLayout } from './layout';
import { Spinner } from '@/shared/ui';
import { RoleGuard } from '@/features/admin/components/RoleGuard';
import { saveLoginIntent } from '@/shared/lib/loginIntent';
import { UserRole } from '@/shared/types';
import NotFoundPage from '@/pages/errors/NotFoundPage';
import ErrorPage from '@/pages/errors/ErrorPage';

// ── Lazy pages — Ikaros ───────────────────────────────────────────────────
const DashboardPage    = lazy(() => import('@/features/ikaros/pages/DashboardPage'));
const ChatPage         = lazy(() => import('@/features/chat/pages/ChatPage'));
const WorldsPage       = lazy(() => import('@/features/ikaros/pages/WorldsPage'));
const CreateWorldPage  = lazy(() => import('@/features/ikaros/pages/CreateWorldPage'));
const ProfilePage      = lazy(() => import('@/features/profile/pages/ProfilePage'));
const ResetPasswordPage      = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const EmailVerifyPage        = lazy(() => import('@/features/auth/pages/EmailVerifyPage'));
const EmailChangeConfirmPage = lazy(() => import('@/features/auth/pages/EmailChangeConfirmPage'));
const UsersPage        = lazy(() => import('@/features/users/pages/UsersPage'));
const UserProfilePage  = lazy(() => import('@/features/users/pages/PublicUserProfilePage'));
const ArticlesPage     = lazy(() => import('@/features/ikaros/pages/ArticlesPage'));
const GalleryPage      = lazy(() => import('@/features/ikaros/pages/GalleryPage'));
const DiscussionsPage  = lazy(() => import('@/features/ikaros/pages/DiscussionsPage'));
const MailPage             = lazy(() => import('@/features/ikaros/pages/MailPage'));
const HelpPage             = lazy(() => import('@/features/ikaros/pages/HelpPage/HelpPage'));
const TermsPage            = lazy(() => import('@/features/ikaros/pages/TermsPage'));
const DiscussionsNewPage   = lazy(() => import('@/features/ikaros/pages/DiscussionsNewPage'));

// ── Lazy pages — Admin ────────────────────────────────────────────────────
const PlatformAdminPage  = lazy(() => import('@/features/admin/pages/PlatformAdminPage'));
const DungeonBuilderPage = lazy(() => import('@/features/admin/pages/DungeonBuilderPage'));

// ── Lazy pages — World ────────────────────────────────────────────────────
const WorldDashboardPage = lazy(() => import('@/features/world/pages/WorldDashboardPage'));
const WorldChatPage      = lazy(() => import('@/features/world/pages/WorldChatPage'));
const PagesListPage      = lazy(() => import('@/features/world/pages/PagesListPage'));
const PageViewerPage     = lazy(() => import('@/features/world/pages/PageViewerPage'));
const PageEditorPage     = lazy(() => import('@/features/world/pages/PageEditorPage'));
const CharactersPage     = lazy(() => import('@/features/world/pages/CharactersPage'));
const MyCharacterPage    = lazy(() => import('@/features/world/pages/MyCharacterPage'));
const MapPage            = lazy(() => import('@/features/world/pages/MapPage'));
const TacticalMapPage    = lazy(() => import('@/features/world/pages/TacticalMapPage'));
const CalendarPage       = lazy(() => import('@/features/world/pages/CalendarPage'));
const TimelinePage       = lazy(() => import('@/features/world/pages/TimelinePage'));
const WeatherPage        = lazy(() => import('@/features/world/pages/WeatherPage'));
const EventsPage         = lazy(() => import('@/features/world/pages/EventsPage'));
const CampaignPage       = lazy(() => import('@/features/world/pages/CampaignPage'));
const StorylinesPage     = lazy(() => import('@/features/world/pages/StorylinesPage'));
const ShopPage           = lazy(() => import('@/features/world/pages/ShopPage'));
const SoundsPage         = lazy(() => import('@/features/world/pages/SoundsPage'));
const CurrencyPage       = lazy(() => import('@/features/world/pages/CurrencyPage'));
const WorldSettingsPage  = lazy(() => import('@/features/world/pages/WorldSettingsPage'));
const GroupsPage         = lazy(() => import('@/features/world/pages/GroupsPage'));
const RulesPage          = lazy(() => import('@/features/world/pages/RulesPage'));
const PagesAdminPage     = lazy(() => import('@/features/world/pages/PagesAdminPage'));
const NPCDirectoryPage   = lazy(() => import('@/features/world/pages/NPCDirectoryPage'));

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
      // 1.7 — anonymní routes pro mailové linky (reset / verify / email change)
      { path: 'reset-password',         element: p(ResetPasswordPage) },
      { path: 'email-verify',           element: p(EmailVerifyPage) },
      { path: 'email-change/confirm',   element: p(EmailChangeConfirmPage) },

      // Chráněné — vyžadují přihlášení (per-route loader)
      { path: 'chat',                   element: p(ChatPage),         loader: requireAuth },
      { path: 'ikaros/vytvorit-svet',   element: p(CreateWorldPage),  loader: requireAuth },
      { path: 'ikaros/profil',          element: p(ProfilePage),      loader: requireAuth },
      { path: 'ikaros/uzivatel/:id',    element: p(UserProfilePage),  loader: requireAuth },
      { path: 'ikaros/diskuze/nova',    element: p(DiscussionsNewPage), loader: requireAuth },
      { path: 'ikaros/posta',           element: p(MailPage),         loader: requireAuth },

      // Spec 1.4 — `/ikaros/uzivatele` dostupné každému přihlášenému
      // (page sama řeší tab visibility per role; admin-only taby jsou skryté).
      { path: 'ikaros/uzivatele',       element: p(UsersPage),        loader: requireAuth },
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
