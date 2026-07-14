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
import { applyStartupRestore, saveLastRoute } from '@/shared/lib/lastRoute';
import { UserRole, WorldRole } from '@/shared/types';
import NotFoundPage from '@/pages/errors/NotFoundPage';
import ErrorPage from '@/pages/errors/ErrorPage';

// ── Schema-gated lazy ─────────────────────────────────────────────────────
// D-AUDIT bundle: `bootstrapSchemas()` už neběží sync v main.tsx (schémata
// by seděla v entry chunku). Stránky, které čtou `systemEntitySchemaRegistry`
// hned při renderu (taktická mapa, bestiáře, world chat rail, pop-out token),
// dostanou bootstrap deterministicky: lazy factory počká i na bootstrap chunk.
// Idempotentní — main.tsx pojistka na pozadí smí doběhnout dřív i později.
// Export kvůli smoke testu lazy boundary (router-schema-gate.spec.tsx).
export function withSchemas<T extends { default: ComponentType }>(
  load: () => Promise<T>,
): LazyExoticComponent<ComponentType> {
  return lazy(() =>
    Promise.all([
      load(),
      import('@/features/world/tactical-map/schemas/bootstrap').then((m) =>
        m.bootstrapSchemas(),
      ),
    ]).then(([mod]) => mod),
  );
}

// ── Lazy pages — Ikaros ───────────────────────────────────────────────────
const DashboardPage    = lazy(() => import('@/features/ikaros/pages/DashboardPage'));
const ChatPage         = lazy(() => import('@/features/chat/pages/ChatPage'));
const CampPage     = lazy(() => import('@/features/chat/pages/CampPage'));
const VoiceKrcmaPage = lazy(() => import('@/features/voice/pages/VoiceKrcmaPage'));
const WorldsPage       = lazy(() => import('@/features/ikaros/pages/WorldsPage'));
const CreateWorldPage  = lazy(() => import('@/features/ikaros/pages/CreateWorldPage'));
const SupportersPage   = lazy(() => import('@/features/ikaros/pages/SupportersPage'));
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
// 15B.4a — veřejné landing stránky RPG systémů (hub + detail)
const SystemsHubPage       = lazy(() => import('@/features/ikaros/pages/SystemLanding/SystemsHubPage'));
const SystemLandingPage    = lazy(() => import('@/features/ikaros/pages/SystemLanding/SystemLandingPage'));
const TermsPage            = lazy(() => import('@/features/ikaros/pages/TermsPage'));
// 20A (Příloha C) — legal statické stránky
const PrivacyPage          = lazy(() => import('@/features/ikaros/pages/PrivacyPage'));
const CodeOfConductPage    = lazy(() => import('@/features/ikaros/pages/CodeOfConductPage'));
const ContactPage          = lazy(() => import('@/features/ikaros/pages/ContactPage'));
const DiscussionsNewPage   = lazy(() => import('@/features/ikaros/pages/DiscussionsNewPage'));
// 19.3 — nástěnka náborů (LFG).
const NaboryPage           = lazy(() => import('@/features/ikaros/pages/NaboryPage'));
const NaborNovaPage        = lazy(() => import('@/features/ikaros/pages/NaborNovaPage'));
// 3.7 — `/ikaros/oblibene` stránka oblíbeného obsahu (záložky napříč moduly).
const FavoritesPage        = lazy(() => import('@/features/ikaros/pages/FavoritesPage'));
// 21.5 — „Společná tvorba" rozcestník (21.5d dokončil poslední knihovnu —
// sdílený stub ComingSoonPage už žádná route nepoužívá).
const TvorbaHubPage        = lazy(() => import('@/features/ikaros/pages/SpolecnaTvorba/TvorbaHubPage'));
// 16.2b-2 — komunitní (globální) bestiář (nahrazuje stub `ikaros/bestiar`).
// withSchemas: čtou systemEntitySchemaRegistry (statblocky per systém).
const KomunitniBestiarPage      = withSchemas(() => import('@/features/ikaros/bestiar/KomunitniBestiarPage'));
const KomunitniBestieDetailPage = withSchemas(() => import('@/features/ikaros/bestiar/KomunitniBestieDetailPage'));
// 21.5b — komunitní (globální) herbář (nahrazuje stub `ikaros/herbar`).
const KomunitniHerbarPage       = lazy(() => import('@/features/ikaros/herbar/KomunitniHerbarPage'));
const KomunitniPlantDetailPage  = lazy(() => import('@/features/ikaros/herbar/KomunitniPlantDetailPage'));
// 21.5c — komunitní katalog kouzel (nahrazuje stub `ikaros/kouzla`).
const KomunitniKouzlaPage       = lazy(() => import('@/features/ikaros/kouzla/KomunitniKouzlaPage'));
const KomunitniKouzloDetailPage = lazy(() => import('@/features/ikaros/kouzla/KomunitniKouzloDetailPage'));
// 21.5b — komunitní katalog lektvarů (nahrazuje stub `ikaros/lektvary`).
const KomunitniLektvaryPage      = lazy(() => import('@/features/ikaros/lektvary/KomunitniLektvaryPage'));
const KomunitniLektvarDetailPage = lazy(() => import('@/features/ikaros/lektvary/KomunitniLektvarDetailPage'));
// 21.5e — komunitní katalog předmětů (nová knihovna, realizace „items" z 21.1).
const KomunitniPredmetyPage      = lazy(() => import('@/features/ikaros/predmety/KomunitniPredmetyPage'));
const KomunitniPredmetDetailPage = lazy(() => import('@/features/ikaros/predmety/KomunitniPredmetDetailPage'));
// 21.5d — komunitní katalog hádanek (nahrazuje poslední stub `ikaros/hadanky`).
const KomunitniHadankyPage       = lazy(() => import('@/features/ikaros/hadanky/KomunitniHadankyPage'));
const KomunitniHadankaDetailPage = lazy(() => import('@/features/ikaros/hadanky/KomunitniHadankaDetailPage'));
// 21.5f — komunitní knihovna ceníků (kolekce položek s cenou zl/st/md).
const KomunitniCenikyPage        = lazy(() => import('@/features/ikaros/ceniky/KomunitniCenikyPage'));
const KomunitniCenikDetailPage   = lazy(() => import('@/features/ikaros/ceniky/KomunitniCenikDetailPage'));
// 21.2a — generátory jmen a potomků (jmenné sady = komunitní knihovna).
const GeneratoryPage             = lazy(() => import('@/features/ikaros/generatory/GeneratoryPage'));
const NameSetDetailPage          = lazy(() => import('@/features/ikaros/generatory/NameSetDetailPage'));

// ── Lazy pages — Admin ────────────────────────────────────────────────────
const PlatformAdminPage  = lazy(() => import('@/features/admin/pages/PlatformAdminPage'));
const AdminChatPage      = lazy(() => import('@/features/admin/chat/pages/AdminChatPage'));
const IkarosEmotesAdminPage = lazy(() => import('@/features/ikaros/pages/IkarosEmotesAdminPage/IkarosEmotesAdminPage'));

// ── Lazy pages — World ────────────────────────────────────────────────────
const WorldDashboardPage = lazy(() => import('@/features/world/pages/WorldDashboardPage'));
// withSchemas: chat rail (bestie panely) čte systemEntitySchemaRegistry.
const WorldChatPage      = withSchemas(() => import('@/features/world/pages/WorldChatPage'));
const WorldNewsPage      = lazy(() => import('@/features/world/pages/WorldNewsPage'));
const WorldMembersPage   = lazy(() => import('@/features/world/pages/WorldMembersPage'));
const PagesListPage      = lazy(() => import('@/features/world/pages/PagesListPage'));
const PageViewerPage     = lazy(() => import('@/features/world/pages/PageViewerPage'));
const PageEditorPage     = lazy(() => import('@/features/world/pages/PageEditorPage'));
const CharactersPage     = lazy(() => import('@/features/world/pages/CharactersPage'));
// 9.1 (cleanup) — legacy CharacterDetailPage smazán; `/postava/:slug`
// redirectuje na unified `/<slug>` přes CharacterDetailRoute (existuje
// jen pro bookmarky uživatelů).
const CharacterDetailRoute = lazy(() => import('@/features/world/pages/CharacterDetailPage/CharacterDetailRoute'));
const MyCharacterPage    = lazy(() => import('@/features/world/pages/MyCharacterPage'));
const MapPage            = lazy(() => import('@/features/world/pages/MapPage'));
const WorldMapsPage      = lazy(() => import('@/features/world/maps'));
// withSchemas: tokeny/statblocky čtou systemEntitySchemaRegistry při renderu.
const TacticalMapPage    = withSchemas(() => import('@/features/world/pages/TacticalMapPage'));
const BestiarPage        = withSchemas(() => import('@/features/world/bestiar/BestiarPage'));
const CalendarPage       = lazy(() => import('@/features/world/pages/CalendarPage'));
const TimelinePage       = lazy(() => import('@/features/world/pages/TimelinePage'));
const WeatherPage        = lazy(() => import('@/features/world/pages/WorldWeatherPage'));
const EventsPage         = lazy(() => import('@/features/world/pages/EventsPage'));
const CampaignPage       = lazy(() => import('@/features/world/pages/CampaignPage'));
const StorylinesPage     = lazy(() => import('@/features/world/pages/StorylinesPage'));
const ShopPage           = lazy(() => import('@/features/world/pages/ShopPage'));
const SoundsPage         = lazy(() => import('@/features/world/pages/SoundsPage'));
// 21.3a — tvorba podzemí (per-world; nahradila platformový /admin/dungeon-builder stub).
const DungeonsPage       = lazy(() => import('@/features/world/pages/DungeonsPage'));
const DungeonEditorPage  = lazy(() => import('@/features/world/pages/DungeonEditorPage'));
const CurrencyPage       = lazy(() => import('@/features/world/pages/CurrencyPage'));
const WorldSettingsPage  = lazy(() => import('@/features/world/pages/WorldSettingsPage'));
const RulesPage          = lazy(() => import('@/features/world/pages/RulesPage'));
const PagesAdminPage     = lazy(() => import('@/features/world/pages/PagesAdminPage'));
const WorldGmDiaryPage   = lazy(() => import('@/features/world/pages/WorldGmDiaryPage'));
const CalendarConfigsPage = lazy(() => import('@/features/world/pages/CalendarConfigsPage/CalendarConfigsPage'));
const WorldHeadlineAdminPage = lazy(() => import('@/features/world/pages/WorldHeadlineAdminPage'));
const GroupMembersPage   = lazy(() => import('@/features/world/pages/GroupMembersPage'));
// 17.11 — pop-out karta tokenu do samostatného okna (mimo WorldLayout = bez menu).
// withSchemas: token panel čte systemEntitySchemaRegistry.
const TokenCardPopoutPage = withSchemas(() => import('@/features/world/pages/TokenCardPopoutPage'));

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
function memberOnly(
  element: ReactNode,
  minWorldRole: WorldRole = WorldRole.Ctenar,
): ReactNode {
  return (
    <WorldMembershipGuard
      minWorldRole={minWorldRole}
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
// PWA „obnov poslední místo": přepíše URL na poslední route PŘED inicializací
// routeru (cold open standalone PWA na rootu) → router naběhne rovnou tam, bez
// bliknutí dashboardu. No-op v prohlížeči / při refreshi / pro nepřihlášeného.
applyStartupRestore();

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
      // 21.5 — „Společná tvorba" hub (veřejný); všech 6 knihoven už žije.
      { path: 'ikaros/tvorba',          element: p(TvorbaHubPage) },
      // 16.2b-2 — komunitní bestiář (list + detail) nahrazuje stub.
      { path: 'ikaros/bestiar',         element: p(KomunitniBestiarPage) },
      { path: 'ikaros/bestiar/:id',     element: p(KomunitniBestieDetailPage) },
      // 21.5b — komunitní herbář (list + detail) nahrazuje stub.
      { path: 'ikaros/herbar',          element: p(KomunitniHerbarPage) },
      { path: 'ikaros/herbar/:id',      element: p(KomunitniPlantDetailPage) },
      // 21.5b — komunitní katalog lektvarů (list + detail) nahrazuje stub.
      { path: 'ikaros/lektvary',        element: p(KomunitniLektvaryPage) },
      { path: 'ikaros/lektvary/:id',    element: p(KomunitniLektvarDetailPage) },
      // 21.5c — komunitní katalog kouzel (list + detail) nahrazuje stub.
      { path: 'ikaros/kouzla',          element: p(KomunitniKouzlaPage) },
      { path: 'ikaros/kouzla/:id',      element: p(KomunitniKouzloDetailPage) },
      // 21.5e — komunitní katalog předmětů (nová knihovna).
      { path: 'ikaros/predmety',        element: p(KomunitniPredmetyPage) },
      { path: 'ikaros/predmety/:id',    element: p(KomunitniPredmetDetailPage) },
      // 21.5d — komunitní katalog hádanek (list + detail) nahrazuje poslední stub.
      { path: 'ikaros/hadanky',         element: p(KomunitniHadankyPage) },
      { path: 'ikaros/hadanky/:id',     element: p(KomunitniHadankaDetailPage) },
      // 21.5f — komunitní knihovna ceníků (list + detail).
      { path: 'ikaros/ceniky',          element: p(KomunitniCenikyPage) },
      { path: 'ikaros/ceniky/:id',      element: p(KomunitniCenikDetailPage) },
      // 21.2a — generátory (jména + potomci) a detail jmenné sady.
      { path: 'ikaros/generatory',           element: p(GeneratoryPage) },
      { path: 'ikaros/generatory/sady/:id',  element: p(NameSetDetailPage) },
      { path: 'ikaros/napoveda',        element: p(HelpPage) },
      { path: 'ikaros/podporovatele',   element: p(SupportersPage) },
      // 15B.4a — landing systémů (veřejné, bez requireAuth); specifické před :slug
      { path: 'ikaros/systemy',         element: p(SystemsHubPage) },
      { path: 'ikaros/systemy/:slug',   element: p(SystemLandingPage) },
      { path: 'podminky',               element: p(TermsPage) },
      // 20A (Příloha C) — Zásady OÚ (GDPR čl. 13), Pravidla komunity, Kontakt
      { path: 'soukromi',               element: p(PrivacyPage) },
      { path: 'kodex',                  element: p(CodeOfConductPage) },
      { path: 'kontakt',                element: p(ContactPage) },
      // 1.7 — anonymní routes pro mailové linky (reset / verify / email change)
      { path: 'reset-password',         element: p(ResetPasswordPage) },
      { path: 'email-verify',           element: p(EmailVerifyPage) },
      { path: 'email-change/confirm',   element: p(EmailChangeConfirmPage) },

      // Chráněné — vyžadují přihlášení (per-route loader)
      // 15.8 — `/chat` (Hospoda) veřejné: host bez session dostane captcha bránu
      // (ChatPage). Camp níže zůstávají login-only.
      { path: 'chat',                   element: p(ChatPage) },
      // 17.6 — Voice krčma (hlasová místnost, jen registrovaní)
      { path: 'chat/voice',         element: p(VoiceKrcmaPage), loader: requireAuth },
      // 4.2a — Camp I.–III. (atmosférické roleplay místnosti)
      { path: 'chat/camp',          element: p(CampPage),     loader: requireAuth },
      { path: 'chat/camp2',         element: p(CampPage),     loader: requireAuth },
      { path: 'chat/camp3',         element: p(CampPage),     loader: requireAuth },
      // Rename Rozcestí→Camp: staré URL přesměruj (deep-linky, záložky, mailové odkazy)
      { path: 'chat/rozcesti',          loader: () => redirect('/chat/camp') },
      { path: 'chat/rozcesti2',         loader: () => redirect('/chat/camp2') },
      { path: 'chat/rozcesti3',         loader: () => redirect('/chat/camp3') },
      { path: 'ikaros/vytvorit-svet',   element: p(CreateWorldPage),  loader: requireAuth },
      { path: 'ikaros/profil',          element: p(ProfilePage),      loader: requireAuth },
      { path: 'ikaros/uzivatel/:id',    element: p(UserProfilePage),  loader: requireAuth },
      // 3.4 — diskuze jsou logged-in only (spec-3.4 R4); pořadí: /nova před /:id.
      { path: 'ikaros/diskuze',         element: p(DiscussionsPage),    loader: requireAuth },
      { path: 'ikaros/diskuze/nova',    element: p(DiscussionsNewPage), loader: requireAuth },
      { path: 'ikaros/diskuze/:id',     element: p(DiscussionDetailPage), loader: requireAuth },
      // 19.3 — nábory (LFG); logged-in only. Pořadí: /nova před případným /:id.
      { path: 'ikaros/nabory',          element: p(NaboryPage),       loader: requireAuth },
      { path: 'ikaros/nabory/nova',     element: p(NaborNovaPage),    loader: requireAuth },
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
        // 20.5 — interní chat správy platformy (samostatná stránka, ne tab).
        path: 'admin/chat',
        loader: requireAuth,
        element: (
          <RoleGuard roles={[UserRole.Superadmin, UserRole.Admin]}>
            {p(AdminChatPage)}
          </RoleGuard>
        ),
      },
      // 21.3a — /admin/dungeon-builder (Sa/Admin stub) zrušen; tvorba podzemí
      // je per-world route `svet/:worldSlug/podzemi` (Hrac+ / Podporovatel).
      {
        path: 'ikaros/admin/emotes',
        loader: requireAuth,
        element: (
          // 6.4d — globální emoty spravuje jen platformový Admin+.
          <RoleGuard roles={[UserRole.Superadmin, UserRole.Admin]}>
            {p(IkarosEmotesAdminPage)}
          </RoleGuard>
        ),
      },
    ],
  },

  // D-063 — `/svet/:worldSlug` shell je veřejný (anon vidí public/open svět,
  // private svět dostane WorldNotFound — řízeno BE OptionalJwtAuthGuard).
  // Sub-routes mají memberOnly() guard, který non-member/anon přesměruje
  // na index detail-page, kde si vybere Vstoupit / Požádat / Přihlásit.
  {
    path: '/svet/:worldSlug',
    element: <WorldLayout />,
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
      { path: 'postava/:slug',          element: memberOnly(p(CharacterDetailRoute)) },
      { path: 'moje-postava',           element: memberOnly(p(MyCharacterPage)) },
      { path: 'mapa',                   element: memberOnly(p(MapPage)) },
      { path: 'mapy',                   element: memberOnly(p(WorldMapsPage)) },
      { path: 'takticka-mapa',          element: memberOnly(p(TacticalMapPage)) },
      { path: 'bestiar',                element: memberOnly(p(BestiarPage)) },
      // R-18 — kalendář = „PJ pohled" (BE aggregate PomocnyPJ+); gate dřív na route.
      { path: 'kalendar',               element: memberOnly(p(CalendarPage), WorldRole.PomocnyPJ) },
      // R-06 — timeline read = Hrac+ (BE `timeline.assertMember`); gate Ctenar
      // už na route, ať nenarazí na 403 na načtené stránce.
      { path: 'timeline',               element: memberOnly(p(TimelinePage), WorldRole.Hrac) },
      // R-18 — počasí read = Hrac+ (BE `world-weather.assertMember`).
      { path: 'pocasi',                 element: memberOnly(p(WeatherPage), WorldRole.Hrac) },
      // 9.1-I — game events. Legacy redirect /sprava-udalosti odstraněn 2026-06-20
      // (zaveden 2026-05-25 „na 1 měsíc", expirováno).
      { path: 'akce',                   element: memberOnly(p(EventsPage)) },
      { path: 'pavucina',               element: memberOnly(p(CampaignPage)) },
      {
        // 11.2 — Storyboard (scénáře) je PJ-nástroj: PJ + PomocnyPJ daného světa,
        // Sa/Admin bypass. Hráč/Čtenář nemá přístup ani přes přímou URL.
        path: 'scenare',
        element: (
          <WorldMembershipGuard
            minWorldRole={WorldRole.PomocnyPJ}
            fallbackGlobalRoles={[UserRole.Superadmin, UserRole.Admin]}
          >
            {p(StorylinesPage)}
          </WorldMembershipGuard>
        ),
      },
      { path: 'obchod',                 element: memberOnly(p(ShopPage)) },
      { path: 'zvuky',                  element: memberOnly(p(SoundsPage)) },
      // 21.3a — tvorba podzemí: route Hrac+ (BE navíc gatuje tvorbu na
      // Podporovatele ∨ PJ+; ne-podporovatel vidí teaser + svoje stavby).
      { path: 'podzemi',                element: memberOnly(p(DungeonsPage), WorldRole.Hrac) },
      { path: 'podzemi/:dungeonId',     element: memberOnly(p(DungeonEditorPage), WorldRole.Hrac) },
      { path: 'prevodnik-men',          element: memberOnly(p(CurrencyPage)) },
      { path: 'nastaveni',              element: memberOnly(p(WorldSettingsPage)) },
      { path: 'hraci',                  element: memberOnly(p(WorldMembersPage)) },
      { path: 'pravidla',               element: memberOnly(p(RulesPage)) },
      // 12.3 — autogenerovaná stránka skupiny (záložka „Informace").
      { path: 'skupina/:groupKey',      element: memberOnly(p(GroupMembersPage)) },
      {
        // 10.2l — deník PJ (world-level poznámky, per-PJ). Mimo mapu, PJ+.
        path: 'denik-pj',
        element: (
          <WorldMembershipGuard
            minWorldRole={WorldRole.PomocnyPJ}
            fallbackGlobalRoles={[UserRole.Superadmin, UserRole.Admin]}
          >
            {p(WorldGmDiaryPage)}
          </WorldMembershipGuard>
        ),
      },
      {
        path: 'admin/stranky',
        element: (
          // D-053b — membership-based, Sa/Admin bypass. N-07: PomocnyPJ (parita
          // s BE `pages.assertCanWrite` = PomocnyPJ; PJ-only by lhalo o přístupu).
          <WorldMembershipGuard
            minWorldRole={WorldRole.PomocnyPJ}
            fallbackGlobalRoles={[UserRole.Superadmin, UserRole.Admin]}
          >
            {p(PagesAdminPage)}
          </WorldMembershipGuard>
        ),
      },
      // N-02/03 — `admin/sablona-deniku` a `admin/emotes` byly orphan routy
      // (žádný odkaz v UI); sablona-deniku navíc obcházela `minSystem=custom`
      // gate Settings tabu. Kanonický přístup = záložky v Nastavení světa
      // (WorldSettingsPage TABS: „Šablona deníku", „Emoty světa").
      {
        path: 'admin/kalendare',
        element: (
          // 9.2b — Multi-config kalendáře. N-08: PomocnyPJ (parita s BE
          // `world-calendar-config.assertCanWrite` = PomocnyPJ).
          <WorldMembershipGuard
            minWorldRole={WorldRole.PomocnyPJ}
            fallbackGlobalRoles={[UserRole.Superadmin, UserRole.Admin]}
          >
            {p(CalendarConfigsPage)}
          </WorldMembershipGuard>
        ),
      },
      {
        // 12.2 — Hlavní lišta světa: headline / menu builder (PJ+).
        path: 'admin/headline',
        element: (
          <WorldMembershipGuard
            minWorldRole={WorldRole.PJ}
            fallbackGlobalRoles={[UserRole.Superadmin, UserRole.Admin]}
          >
            {p(WorldHeadlineAdminPage)}
          </WorldMembershipGuard>
        ),
      },
      // Wiki stránky — catch-all (musí být poslední)
      { path: ':slug', element: memberOnly(p(PageViewerPage)) },
    ],
  },

  // 17.11 — pop-out karta tokenu: standalone okno (druhý monitor), MIMO
  // WorldLayout (bez horního menu). Statický `karta-tokenu` je specifičtější než
  // wiki catch-all `:slug` uvnitř `/svet/:worldSlug` → vyhrává matching.
  {
    path: '/svet/:worldSlug/karta-tokenu',
    element: p(TokenCardPopoutPage),
    errorElement: <ErrorPage />,
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);

// Pamatuj poslední „smysluplnou" route (mimo dashboard/auth) pro PWA cold-open
// obnovu. localStorage přežije zavření PWA (na rozdíl od sessionStorage intent).
router.subscribe((state) => {
  saveLastRoute(state.location.pathname + state.location.search);
});
