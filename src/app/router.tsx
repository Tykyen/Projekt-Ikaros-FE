/* eslint-disable react-refresh/only-export-components */
import {
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from 'react';
import { createBrowserRouter, redirect, type LoaderFunctionArgs } from 'react-router-dom';
import { IkarosLayout, WorldLayout } from './layout';
import { Spinner } from '@/shared/ui';
import { RoleGuard } from '@/features/admin/components/RoleGuard';
import { WorldMembershipGuard } from '@/features/admin/components/WorldMembershipGuard';
import { saveLoginIntent } from '@/shared/lib/loginIntent';
import { UserRole, WorldRole } from '@/shared/types';
import NotFoundPage from '@/pages/errors/NotFoundPage';
import ErrorPage from '@/pages/errors/ErrorPage';

// ── Lazy pages — Ikaros ───────────────────────────────────────────────────
const DashboardPage    = lazy(() => import('@/features/ikaros/pages/DashboardPage'));
const ChatPage         = lazy(() => import('@/features/chat/pages/ChatPage'));
const RozcestiPage     = lazy(() => import('@/features/chat/pages/RozcestiPage'));
const WorldsPage       = lazy(() => import('@/features/ikaros/pages/WorldsPage'));
const CreateWorldPage  = lazy(() => import('@/features/ikaros/pages/CreateWorldPage'));
const ProfilePage      = lazy(() => import('@/features/profile/pages/ProfilePage'));
const ResetPasswordPage      = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const EmailVerifyPage        = lazy(() => import('@/features/auth/pages/EmailVerifyPage'));
const EmailChangeConfirmPage = lazy(() => import('@/features/auth/pages/EmailChangeConfirmPage'));
const UsersPage        = lazy(() => import('@/features/users/pages/UsersPage'));
const UserProfilePage  = lazy(() => import('@/features/users/pages/PublicUserProfilePage'));
// 3.1b — `/ikaros/novinky` veřejná stránka (hub: zobrazení + admin správa).
const NovinkyPage          = lazy(() => import('@/features/ikaros/pages/NovinkyPage'));
// 3.1b — `/ikaros/akce` měsíční kalendář globálních akcí.
const AkcePage             = lazy(() => import('@/features/ikaros/pages/AkcePage'));
const ArticlesPage         = lazy(() => import('@/features/ikaros/pages/ArticlesPage'));
const ArticleDetailPage    = lazy(() => import('@/features/ikaros/pages/ArticleDetailPage'));
const ArticleEditorPage    = lazy(() => import('@/features/ikaros/pages/ArticleEditorPage'));
const GalleryPage      = lazy(() => import('@/features/ikaros/pages/GalleryPage'));
const GalleryUploadPage = lazy(() => import('@/features/ikaros/pages/GalleryUploadPage'));
const GalleryDetailPage = lazy(() => import('@/features/ikaros/pages/GalleryDetailPage'));
const DiscussionsPage  = lazy(() => import('@/features/ikaros/pages/DiscussionsPage'));
const DiscussionDetailPage = lazy(() => import('@/features/ikaros/pages/DiscussionDetailPage'));
const MailPage             = lazy(() => import('@/features/ikaros/pages/MailPage'));
const HelpPage             = lazy(() => import('@/features/ikaros/pages/HelpPage/HelpPage'));
const TermsPage            = lazy(() => import('@/features/ikaros/pages/TermsPage'));
const DiscussionsNewPage   = lazy(() => import('@/features/ikaros/pages/DiscussionsNewPage'));
// 3.7 — `/ikaros/oblibene` stránka oblíbeného obsahu (záložky napříč moduly).
const FavoritesPage        = lazy(() => import('@/features/ikaros/pages/FavoritesPage'));

// ── Lazy pages — Admin ────────────────────────────────────────────────────
const PlatformAdminPage  = lazy(() => import('@/features/admin/pages/PlatformAdminPage'));
const DungeonBuilderPage = lazy(() => import('@/features/admin/pages/DungeonBuilderPage'));

// ── Lazy pages — World ────────────────────────────────────────────────────
const WorldDashboardPage = lazy(() => import('@/features/world/pages/WorldDashboardPage'));
const WorldChatPage      = lazy(() => import('@/features/world/pages/WorldChatPage'));
const WorldNewsPage      = lazy(() => import('@/features/world/pages/WorldNewsPage'));
const WorldMembersPage   = lazy(() => import('@/features/world/pages/WorldMembersPage'));
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

/**
 * Spec 2.4 — wrap sub-route content into membership guard. Non-member /
 * pending-access se redirectne na index detail-page (`/svet/:worldSlug`), kde
 * si vybere Vstoupit / Požádat. Sa/Admin bypass přes globální role.
 */
function memberOnly(element: ReactNode): ReactNode {
  return (
    <WorldMembershipGuard
      minWorldRole={WorldRole.Ctenar}
      fallbackGlobalRoles={[UserRole.Superadmin, UserRole.Admin]}
      redirectTo="/svet/:worldSlug"
    >
      {element}
    </WorldMembershipGuard>
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
      { path: 'ikaros/clanky',                element: p(ArticlesPage) },
      // ⚠️ `/novy` musí být před `/:id` (specifické route před parametrické).
      { path: 'ikaros/clanky/novy',           element: p(ArticleEditorPage), loader: requireAuth },
      { path: 'ikaros/clanky/:id/upravit',    element: p(ArticleEditorPage), loader: requireAuth },
      { path: 'ikaros/clanky/:id',            element: p(ArticleDetailPage) },
      { path: 'ikaros/galerie',         element: p(GalleryPage) },
      // ⚠️ `/nahrat` musí být před `/:id` (specifické route před parametrické).
      { path: 'ikaros/galerie/nahrat',        element: p(GalleryUploadPage), loader: requireAuth },
      { path: 'ikaros/galerie/:id/upravit',   element: p(GalleryUploadPage), loader: requireAuth },
      { path: 'ikaros/galerie/:id',           element: p(GalleryDetailPage) },
      { path: 'ikaros/napoveda',        element: p(HelpPage) },
      { path: 'podminky',               element: p(TermsPage) },
      // 1.7 — anonymní routes pro mailové linky (reset / verify / email change)
      { path: 'reset-password',         element: p(ResetPasswordPage) },
      { path: 'email-verify',           element: p(EmailVerifyPage) },
      { path: 'email-change/confirm',   element: p(EmailChangeConfirmPage) },

      // Chráněné — vyžadují přihlášení (per-route loader)
      { path: 'chat',                   element: p(ChatPage),         loader: requireAuth },
      // 4.2a — Rozcestí I.–III. (atmosférické roleplay místnosti)
      { path: 'chat/rozcesti',          element: p(RozcestiPage),     loader: requireAuth },
      { path: 'chat/rozcesti2',         element: p(RozcestiPage),     loader: requireAuth },
      { path: 'chat/rozcesti3',         element: p(RozcestiPage),     loader: requireAuth },
      { path: 'ikaros/vytvorit-svet',   element: p(CreateWorldPage),  loader: requireAuth },
      { path: 'ikaros/profil',          element: p(ProfilePage),      loader: requireAuth },
      { path: 'ikaros/uzivatel/:id',    element: p(UserProfilePage),  loader: requireAuth },
      // 3.4 — diskuze jsou logged-in only (spec-3.4 R4); pořadí: /nova před /:id.
      { path: 'ikaros/diskuze',         element: p(DiscussionsPage),    loader: requireAuth },
      { path: 'ikaros/diskuze/nova',    element: p(DiscussionsNewPage), loader: requireAuth },
      { path: 'ikaros/diskuze/:id',     element: p(DiscussionDetailPage), loader: requireAuth },
      { path: 'ikaros/posta',           element: p(MailPage),         loader: requireAuth },
      // 3.7 — oblíbený obsah (záložky); jen pro přihlášené.
      { path: 'ikaros/oblibene',        element: p(FavoritesPage),    loader: requireAuth },
      // 3.1b — kalendář akcí (akce jsou logged-in only, viz spec 2.1b).
      { path: 'ikaros/akce',            element: p(AkcePage),         loader: requireAuth },

      // Spec 1.4 — `/ikaros/uzivatele` dostupné každému přihlášenému
      // (page sama řeší tab visibility per role; admin-only taby jsou skryté).
      { path: 'ikaros/uzivatele',       element: p(UsersPage),        loader: requireAuth },

      // 3.1b — `/ikaros/novinky` veřejná stránka (anon povolen, bez loaderu).
      { path: 'ikaros/novinky', element: p(NovinkyPage) },
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
          // Dungeon Builder je platformový tool (mimo per-world layout), proto
          // jen Sa/Admin. Per-world varianta by patřila do /svet/:worldId/admin/*.
          <RoleGuard roles={[UserRole.Superadmin, UserRole.Admin]}>
            {p(DungeonBuilderPage)}
          </RoleGuard>
        ),
      },
    ],
  },

  // Chráněné — WorldLayout (celá světová vrstva za auth)
  {
    path: '/svet/:worldSlug',
    element: <WorldLayout />,
    loader: requireAuth,
    errorElement: <ErrorPage />,
    children: [
      // Spec 2.4 — index = pre-join / member dashboard router; bez membership guardu.
      { index: true,                    element: p(WorldDashboardPage) },
      // Spec 2.4 — všechny content sub-routes vyžadují Čtenář+ (non-member redirect).
      { path: 'chat',                   element: memberOnly(p(WorldChatPage)) },
      { path: 'novinky',                element: memberOnly(p(WorldNewsPage)) },
      { path: 'stranky',                element: memberOnly(p(PagesListPage)) },
      { path: 'nova-stranka',           element: memberOnly(p(PageEditorPage)) },
      { path: 'edit/:slug',             element: memberOnly(p(PageEditorPage)) },
      { path: 'postavy',                element: memberOnly(p(CharactersPage)) },
      { path: 'moje-postava',           element: memberOnly(p(MyCharacterPage)) },
      { path: 'mapa',                   element: memberOnly(p(MapPage)) },
      { path: 'takticka-mapa',          element: memberOnly(p(TacticalMapPage)) },
      { path: 'kalendar',               element: memberOnly(p(CalendarPage)) },
      { path: 'timeline',               element: memberOnly(p(TimelinePage)) },
      { path: 'pocasi',                 element: memberOnly(p(WeatherPage)) },
      { path: 'sprava-udalosti',        element: memberOnly(p(EventsPage)) },
      { path: 'pavucina',               element: memberOnly(p(CampaignPage)) },
      { path: 'scenare',                element: memberOnly(p(StorylinesPage)) },
      { path: 'obchod',                 element: memberOnly(p(ShopPage)) },
      { path: 'zvuky',                  element: memberOnly(p(SoundsPage)) },
      { path: 'prevodnik-men',          element: memberOnly(p(CurrencyPage)) },
      { path: 'nastaveni',              element: memberOnly(p(WorldSettingsPage)) },
      { path: 'skupiny',                element: memberOnly(p(GroupsPage)) },
      { path: 'hraci',                  element: memberOnly(p(WorldMembersPage)) },
      { path: 'pravidla',               element: memberOnly(p(RulesPage)) },
      {
        path: 'admin/stranky',
        element: (
          // D-053b — membership-based: PJ DANÉHO světa povolen, Sa/Admin bypass.
          <WorldMembershipGuard
            minWorldRole={WorldRole.PJ}
            fallbackGlobalRoles={[UserRole.Superadmin, UserRole.Admin]}
          >
            {p(PagesAdminPage)}
          </WorldMembershipGuard>
        ),
      },
      {
        path: 'admin/adresar-postav',
        element: (
          // D-053b — membership-based: PJ DANÉHO světa povolen, Sa/Admin bypass.
          <WorldMembershipGuard
            minWorldRole={WorldRole.PJ}
            fallbackGlobalRoles={[UserRole.Superadmin, UserRole.Admin]}
          >
            {p(NPCDirectoryPage)}
          </WorldMembershipGuard>
        ),
      },
      // Wiki stránky — catch-all (musí být poslední)
      { path: ':slug', element: memberOnly(p(PageViewerPage)) },
    ],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);
