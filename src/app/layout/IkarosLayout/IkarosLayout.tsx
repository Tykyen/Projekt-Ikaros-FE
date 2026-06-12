import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { toast } from 'sonner';
import clsx from 'clsx';
import {
  Bell,
  Mail,
  Users,
  User as UserIcon,
  LogOut,
  Home,
  PlusCircle,
  MessageSquare,
  BookOpen,
  Image as ImageIcon,
  HelpCircle,
  Beer,
  Signpost,
  Settings,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import s from './IkarosLayout.module.css';
import { pendingTooltip } from './pendingBadge';
import { useSocketInit } from '@/features/chat/api/useSocket';
import { useAccountTransferNotifications } from '@/features/world/pages/api/useAccountTransferNotifications';
import { usePresenceHeartbeat } from '@/features/chat/api/usePresenceHeartbeat';
import { useRoomPresenceCounts } from '@/features/chat/api/useGlobalChat';
import { myRoomsAtom } from '@/features/chat/store/roomsStore';
import type { RoomKey } from '@/features/chat/lib/types';
import { useMyWorlds, usePublicWorlds } from '@/features/world/api/useWorlds';
import { useUnreadCount } from '@/features/ikaros/api/useMail';
import { useMyFavoriteArticles } from '@/features/ikaros/api/useArticles';
import { useMyFavoriteGallery } from '@/features/ikaros/api/useGallery';
import { useMyFavoriteDiscussions } from '@/features/ikaros/api/useDiscussions';
import { cloudinaryThumb } from '@/shared/lib/cloudinary';
import { useLogout } from '@/features/auth/api/useAuth';
import { usePendingActionsCount } from '@/features/users/api/usePendingActions';
import {
  currentUserAtom,
  isAuthenticatedAtom,
  loginModalOpenAtom,
  registerModalOpenAtom,
} from '@/shared/store/authStore';
import { themeAtom, platformThemePreviewAtom } from '../../../themes/state';
import { getTheme } from '../../../themes/registry';
import { ThemeSwitcher } from '../../../themes/ThemeSwitcher';
import { LoginModal } from '@/features/auth/components/LoginModal';
import { RegisterModal } from '@/features/auth/components/RegisterModal';
import { ForgotPasswordModal } from '@/features/auth/components/ForgotPasswordModal';
import { CornerOrnament } from '@/shared/ui/CornerOrnament/CornerOrnament';
import { UserAvatar } from '@/shared/ui';
import { OnlineDot } from '@/shared/presence/OnlineDot';
import { usePresenceInit } from '@/shared/presence/usePresence';
import { useFriendshipsSocket } from '@/features/friendships/hooks/useFriendshipsSocket';
import { useWorldAccessSocket } from '@/features/world/hooks/useWorldAccessSocket';
import {
  NotificationCenter,
  useChatFeedLive,
  centerOpenAtom,
  chatFeedUnseenAtom,
} from '@/features/notifications';
import {
  PendingActionType,
  UserRole,
  WorldRole,
  type UserThemeSettings,
} from '@/shared/types';

function PanelCorners() {
  return (
    <>
      <CornerOrnament position="tl" />
      <CornerOrnament position="tr" />
      <CornerOrnament position="bl" />
      <CornerOrnament position="br" />
    </>
  );
}

type NavItemDef = {
  navKey: string;
  label: string;
  to: string;
  icon: ReactNode;
  end?: boolean;
  /**
   * Spec 3.8 — pokud je nastaveno, u položky se zobrazí badge s počtem pending
   * akcí daného typu (jen pro uživatele, který typ přes BE `canHandle` vidí).
   */
  pendingType?: PendingActionType;
};

const PRIMARY_NAV: NavItemDef[] = [
  { navKey: 'uvodnik',       label: 'Úvodník',       to: '/',                      end: true, icon: <Home size={18} /> },
  { navKey: 'napoveda',      label: 'Nápověda',      to: '/ikaros/napoveda',                  icon: <HelpCircle size={18} /> },
  { navKey: 'diskuze',       label: 'Diskuze',       to: '/ikaros/diskuze',                   icon: <MessageSquare size={18} />, pendingType: PendingActionType.DiscussionPendingReview },
  { navKey: 'clanky',        label: 'Články',        to: '/ikaros/clanky',                    icon: <BookOpen size={18} />,      pendingType: PendingActionType.ArticlePendingReview },
  { navKey: 'galerie',       label: 'Galerie',       to: '/ikaros/galerie',                   icon: <ImageIcon size={18} />,     pendingType: PendingActionType.GalleryPendingReview },
  { navKey: 'vytvorit-svet', label: 'Vytvořit svět', to: '/ikaros/vytvorit-svet',             icon: <PlusCircle size={18} /> },
];

// Krok 4.1 — Hospoda žije na `/chat`. Krok 4.2a — Rozcestí I.–III. na `/chat/rozcesti*`.
// `roomKey` = BE RoomKey (pro odznak počtu přítomných, 4.2c §4) — pozor, liší se
// od `key` (URL segment bez pomlčky).
const CHAT_ROOMS: {
  key: string;
  roomKey: RoomKey;
  label: string;
  to: string;
  disabled?: boolean;
}[] = [
  { key: 'hospoda',   roomKey: 'hospoda',    label: 'Hospoda',       to: '/chat' },
  { key: 'rozcesti1', roomKey: 'rozcesti-1', label: 'Rozcestí I.',   to: '/chat/rozcesti' },
  { key: 'rozcesti2', roomKey: 'rozcesti-2', label: 'Rozcestí II.',  to: '/chat/rozcesti2' },
  { key: 'rozcesti3', roomKey: 'rozcesti-3', label: 'Rozcestí III.', to: '/chat/rozcesti3' },
];

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className={s.sectionTitle}>{children}</div>;
}

export function NavItem({
  navKey,
  to,
  end,
  icon,
  label,
  pendingType,
  pendingByType,
  onClick,
}: NavItemDef & {
  onClick?: () => void;
  pendingByType?: Partial<Record<PendingActionType, number>>;
}) {
  // Spec 3.8 — badge se zobrazí jen když má položka pendingType a BE pro
  // current usera vrátil nenulový počet (chybějící klíč = uživatel typ nevidí).
  const pendingCount = pendingType ? pendingByType?.[pendingType] ?? 0 : 0;
  const tooltip =
    pendingType && pendingCount > 0
      ? pendingTooltip(pendingType, pendingCount)
      : undefined;
  return (
    <NavLink
      to={to}
      end={end}
      data-nav-key={navKey}
      onClick={onClick}
      title={tooltip}
      className={({ isActive }) => clsx(s.navItem, isActive && s.navItemActive)}
    >
      <span className={s.navItemIcon}>{icon}</span>
      <span className={s.navItemLabel}>{label}</span>
      {pendingCount > 0 && (
        <span className={s.navItemBadge} aria-label={tooltip}>
          {pendingCount}
        </span>
      )}
    </NavLink>
  );
}

type SidebarWorld = {
  id: string;
  slug: string;
  name: string;
  isPJ: boolean;
  /** ISO — pro řazení „nejnovější vytvořené první". */
  createdAt: string;
};

/** Seřadí světy podle data vytvoření, nejnovější první (ISO string desc). */
function byNewest(a: SidebarWorld, b: SidebarWorld): number {
  return b.createdAt.localeCompare(a.createdAt);
}

function SidebarContent({
  isAuthenticated,
  onNav,
}: {
  isAuthenticated: boolean;
  onNav?: () => void;
}) {
  // Levý panel = objevování: poslední vytvořené veřejné světy (public/open),
  // stejně pro anon i přihlášené. Osobní „Moje světy" žijí v pravém panelu.
  const publicWorldsQuery = usePublicWorlds();
  const worlds: SidebarWorld[] | undefined = publicWorldsQuery.data
    ?.map((w) => ({
      id: w.id,
      slug: w.slug,
      name: w.name,
      isPJ: false,
      createdAt: w.createdAt,
    }))
    .sort(byNewest);
  // 4.2c §4 — počet přítomných per místnost (REST seed + WS živá aktualizace).
  const roomCounts = useRoomPresenceCounts();
  // Badge/nadpis počítají jen OSTATNÍ (bez tebe) — jinak místnost, kde jsi sám,
  // svítí „1" a multi-room členství (4.2d) tě „rozmnoží" do všech proklikaných.
  const myRooms = useAtomValue(myRoomsAtom);
  const othersInRoom = (rk: RoomKey) =>
    Math.max(0, (roomCounts?.[rk] ?? 0) - (myRooms.has(rk) ? 1 : 0));
  // D-069 — nadpis sekce „Chat" = počet ostatních lidí přítomných v chatu
  // (součet místností bez tebe), ne nepřečtená pošta.
  const chatPresence = roomCounts
    ? (Object.keys(roomCounts) as RoomKey[]).reduce(
        (sum, rk) => sum + othersInRoom(rk),
        0,
      )
    : 0;
  // Spec 3.8 — sdílená query s pravým panelem (`['pending-actions','count']`),
  // druhé volání nestojí extra request. Pro anon disabled → žádný badge.
  const { data: pendingCount } = usePendingActionsCount(isAuthenticated);

  return (
    <div className={s.sidebarInner}>
      <div className={s.section} data-section-key="navigace">
        <SectionTitle>Navigace</SectionTitle>
        <div className={s.navList}>
          {PRIMARY_NAV.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              pendingByType={pendingCount?.byType}
              onClick={onNav}
            />
          ))}
        </div>
      </div>

      <div className={s.section} data-section-key="vesmiry">
        <SectionTitle>Vesmíry</SectionTitle>
        <div className={s.navList}>
          {worlds?.slice(0, 3).map((w) => (
            <Link key={w.id} to={`/svet/${w.slug}`} className={s.navItem} onClick={onNav}>
              <span className={s.navItemLabel}>{w.name}</span>
            </Link>
          ))}
          {(worlds?.length ?? 0) > 0 ? (
            <Link to="/ikaros/vesmiry" className={s.showAllLink} onClick={onNav}>
              Zobrazit vše →
            </Link>
          ) : (
            <Link to="/ikaros/vesmiry" className={s.showAllLink} onClick={onNav}>
              Prozkoumat světy →
            </Link>
          )}
        </div>
      </div>

      <div className={s.section} data-section-key="chat">
        <SectionTitle>
          {chatPresence > 0 ? `Chat (${chatPresence})` : 'Chat'}
        </SectionTitle>
        <div className={s.navList}>
          {CHAT_ROOMS.map((room) => {
            if (room.disabled) {
              return (
                <span
                  key={room.key}
                  className={s.navItemDisabled}
                  data-nav-key={room.key}
                  title="Brzy — krok 4.2"
                >
                  <span className={s.navItemLabel}>{room.label}</span>
                  <span className={s.soonBadge}>Brzy</span>
                </span>
              );
            }
            const count = othersInRoom(room.roomKey);
            return (
              <NavLink
                key={room.key}
                to={room.to}
                data-nav-key={room.key}
                onClick={onNav}
                className={({ isActive }) =>
                  clsx(s.navItem, isActive && s.navItemActive)
                }
              >
                <span className={s.navItemIcon}>
                  {room.key === 'hospoda' ? (
                    <Beer size={18} />
                  ) : (
                    <Signpost size={18} />
                  )}
                </span>
                <span className={s.navItemLabel}>{room.label}</span>
                <span
                  className={clsx(
                    s.roomCount,
                    count > 0 && s.roomCountActive,
                  )}
                  aria-label={`${count} dalších přítomných`}
                  title={`Další přítomní: ${count}`}
                >
                  {count}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * 3.7 — vybere položky pro sidebar sekci Oblíbené: připnuté (v pořadí
 * `pinnedIds`), a když uživatel nic nepřipnul, fallback na 5 naposledy
 * přidaných oblíbených. Pořadí přidání = index ve `favoriteIds` (BE pushuje
 * na konec) → konec pole je nejnovější.
 */
function pinnedFirst<T extends { id: string }>(
  items: T[] | undefined,
  pinnedIds: string[] | undefined,
  favoriteIds: string[] | undefined,
): T[] {
  if (!items || items.length === 0) return [];
  const pinned = pinnedIds ?? [];
  if (pinned.length > 0) {
    const byId = new Map(items.map((i) => [i.id, i]));
    return pinned
      .map((id) => byId.get(id))
      .filter((i): i is T => !!i)
      .slice(0, 5);
  }
  // Fallback — `my-favorites` ($in) nezachovává pořadí, takže seřadíme dle
  // indexu ve favoriteIds a vezmeme 5 naposledy přidaných (nejnovější první).
  const order = favoriteIds ?? [];
  const sorted = [...items].sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id),
  );
  return sorted.slice(-5).reverse();
}

interface FavoriteSectionItem {
  id: string;
  label: string;
  to: string;
  thumbUrl?: string;
}

/** 3.7 — sidebar sekce Oblíbené (diskuze / články / obrázky). */
function FavoriteSection({
  title,
  sectionKey,
  items,
  totalCount,
  allHref,
  onNav,
}: {
  title: string;
  sectionKey: string;
  items: FavoriteSectionItem[];
  totalCount: number;
  allHref: string;
  onNav?: () => void;
}) {
  return (
    <div className={s.section} data-section-key={sectionKey}>
      <SectionTitle>{title}</SectionTitle>
      <div className={s.navList}>
        {items.map((it) => (
          <Link
            key={it.id}
            to={it.to}
            className={s.navItem}
            onClick={onNav}
          >
            {it.thumbUrl && (
              <img
                src={it.thumbUrl}
                alt=""
                className={s.favThumb}
                loading="lazy"
              />
            )}
            <span className={s.navItemLabel}>{it.label}</span>
          </Link>
        ))}
        {items.length === 0 && (
          <p className={s.emptyHint}>Žádné oblíbené</p>
        )}
        {totalCount > 0 && (
          <Link to={allHref} className={s.showAllLink} onClick={onNav}>
            Zobrazit vše →
          </Link>
        )}
      </div>
    </div>
  );
}

function RightPanel({ onNav }: { onNav?: () => void } = {}) {
  const currentUser = useAtomValue(currentUserAtom);
  const {
    data: myWorlds,
    isLoading: worldsLoading,
    isError: worldsError,
  } = useMyWorlds();
  const worlds: SidebarWorld[] | undefined = myWorlds
    ?.map(({ world, membership }) => ({
      id: world.id,
      slug: world.slug,
      name: world.name,
      isPJ: membership.role === WorldRole.PJ,
      createdAt: world.createdAt,
    }))
    .sort(byNewest);
  const isAdmin =
    currentUser?.role === UserRole.Superadmin || currentUser?.role === UserRole.Admin;
  const { data: pendingCount } = usePendingActionsCount(!!currentUser);

  const label = isAdmin ? 'Uživatelé' : 'Přátelé';
  const badge = pendingCount?.total ?? 0;

  // 3.7 — oblíbené pro sidebar (připnuté + fallback)
  const { data: favDiscussions } = useMyFavoriteDiscussions({
    enabled: !!currentUser,
  });
  const { data: favArticles } = useMyFavoriteArticles({
    enabled: !!currentUser,
  });
  const { data: favGallery } = useMyFavoriteGallery({
    enabled: !!currentUser,
  });

  const sidebarDiscussions = pinnedFirst(
    favDiscussions,
    currentUser?.pinnedDiscussionIds,
    currentUser?.favoriteDiscussionIds,
  );
  const sidebarArticles = pinnedFirst(
    favArticles,
    currentUser?.pinnedArticleIds,
    currentUser?.favoriteArticleIds,
  );
  const sidebarGallery = pinnedFirst(
    favGallery,
    currentUser?.pinnedGalleryIds,
    currentUser?.favoriteGalleryIds,
  );

  return (
    <div className={s.rightPanelInner}>
      <div className={s.section} data-section-key="administrace">
        <SectionTitle>Administrace</SectionTitle>
        <div className={s.themeSwitcherSlot}>
          <ThemeSwitcher />
        </div>
        <div className={s.navList}>
          <Link to="/ikaros/uzivatele" className={s.navItem} onClick={onNav}>
            <span className={s.navItemIcon}><Users size={18} /></span>
            <span className={s.navItemLabel}>{label}</span>
            {badge > 0 && (
              <span className={s.navItemBadge} aria-label={`${badge} čekajících akcí`}>
                {badge}
              </span>
            )}
          </Link>
          {isAdmin && (
            <Link to="/admin" className={s.navItem} onClick={onNav}>
              <span className={s.navItemIcon}>
                <ShieldCheck size={18} />
              </span>
              <span className={s.navItemLabel}>Správa platformy</span>
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/ikaros/admin/emotes"
              className={s.navItem}
              onClick={onNav}
            >
              <span className={s.navItemIcon}>
                <Sparkles size={18} />
              </span>
              <span className={s.navItemLabel}>Emoty</span>
            </Link>
          )}
        </div>
      </div>

      <div className={s.section} data-section-key="moje-svety">
        <div className={s.rightSectionHeader}>
          <SectionTitle>Moje světy</SectionTitle>
          <Link to="/ikaros/vytvorit-svet" className={s.rightAddBtn} title="Vytvořit svět" onClick={onNav}>+</Link>
        </div>
        <div className={s.navList}>
          {worlds?.slice(0, 5).map((w) => (
            <Link key={w.id} to={`/svet/${w.slug}`} className={s.navItem} onClick={onNav}>
              <span className={s.navItemLabel}>{w.name}</span>
              {w.isPJ && (
                <span className={s.pjBadge} data-pj-badge>PJ</span>
              )}
            </Link>
          ))}
          {worldsLoading && !worlds && (
            <p className={s.emptyHint}>Načítání…</p>
          )}
          {worldsError && !worlds && (
            <p className={s.emptyHint} role="alert">Nelze načíst</p>
          )}
          {!worldsLoading && !worldsError && (worlds?.length ?? 0) === 0 && (
            <p className={s.emptyHint}>Žádné světy</p>
          )}
          {(worlds?.length ?? 0) > 0 && (
            <Link to="/ikaros/vesmiry?filter=mine" className={s.showAllLink} onClick={onNav}>Zobrazit vše →</Link>
          )}
        </div>
      </div>

      <FavoriteSection
        title="Oblíbené diskuze"
        sectionKey="oblibene-diskuze"
        items={sidebarDiscussions.map((d) => ({
          id: d.id,
          label: d.title,
          to: `/ikaros/diskuze/${d.id}`,
        }))}
        totalCount={favDiscussions?.length ?? 0}
        allHref="/ikaros/oblibene?typ=diskuze"
        onNav={onNav}
      />

      <FavoriteSection
        title="Oblíbené články"
        sectionKey="oblibene-clanky"
        items={sidebarArticles.map((a) => ({
          id: a.id,
          label: a.title,
          to: `/ikaros/clanky/${a.id}`,
        }))}
        totalCount={favArticles?.length ?? 0}
        allHref="/ikaros/oblibene?typ=clanky"
        onNav={onNav}
      />

      <FavoriteSection
        title="Oblíbené obrázky"
        sectionKey="oblibene-obrazky"
        items={sidebarGallery.map((g) => ({
          id: g.id,
          label: g.title,
          to: `/ikaros/galerie/${g.id}`,
          thumbUrl: cloudinaryThumb(g.imageUrl, 80),
        }))}
        totalCount={favGallery?.length ?? 0}
        allHref="/ikaros/oblibene?typ=obrazky"
        onNav={onNav}
      />
    </div>
  );
}

function HeaderButton({
  to,
  onClick,
  icon,
  label,
  badge,
  active,
  disabled,
  title,
}: {
  to?: string;
  onClick?: () => void;
  icon: ReactNode;
  label: string;
  badge?: number;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  const className = clsx(s.headerBtn, active && s.headerBtnActive, disabled && s.headerBtnDisabled);
  const content = (
    <>
      <span className={s.headerBtnIcon}>{icon}</span>
      <span className={s.headerBtnLabel}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={s.badge}>{badge > 99 ? '99+' : badge}</span>
      )}
    </>
  );
  if (to) {
    return (
      <NavLink
        to={to}
        title={title}
        className={({ isActive }) => clsx(s.headerBtn, isActive && s.headerBtnActive)}
      >
        {content}
      </NavLink>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled} title={title}>
      {content}
    </button>
  );
}

function HeaderLoggedOut() {
  const setLoginModalOpen = useSetAtom(loginModalOpenAtom);
  const setRegisterModalOpen = useSetAtom(registerModalOpenAtom);

  return (
    <nav className={s.headerNav}>
      <ThemeSwitcher />
      <button
        type="button"
        className={clsx(s.headerBtn, s.headerBtnPrimary)}
        onClick={() => setLoginModalOpen(true)}
      >
        <span className={s.headerBtnIcon}><UserIcon size={16} /></span>
        <span className={s.headerBtnLabel}>Přihlásit se</span>
      </button>
      <button
        type="button"
        className={s.headerBtn}
        onClick={() => setRegisterModalOpen(true)}
      >
        <span className={s.headerBtnLabel}>Registrace</span>
      </button>
    </nav>
  );
}

function HeaderLoggedIn() {
  const user = useAtomValue(currentUserAtom);
  const { data: unread } = useUnreadCount();
  const totalUnread = unread?.unreadCount ?? 0;
  const chatUnseen = useAtomValue(chatFeedUnseenAtom);
  const setCenterOpen = useSetAtom(centerOpenAtom);
  // Badge zvonku = nové chat zprávy + nepřečtená systémová oznámení (Události).
  const centerBadge = chatUnseen + (unread?.systemUnread ?? 0);
  const startLogout = useLogout();

  if (!user) return null;

  function handleLogout() {
    const cancel = startLogout();
    toast('Odhlášeno', {
      duration: 5000,
      action: { label: 'Vrátit', onClick: cancel },
    });
  }

  return (
    <nav className={s.headerNav}>
      <HeaderButton
        onClick={() => setCenterOpen(true)}
        icon={<Bell size={16} />}
        label="Notifikace"
        badge={centerBadge}
        title="Notifikační centrum"
      />

      <HeaderButton
        to="/ikaros/posta"
        icon={<Mail size={16} />}
        label="Pošta"
        badge={totalUnread}
      />

      <Link to="/ikaros/profil" className={s.headerBtn}>
        <span className={s.avatarWrapper}>
          <UserAvatar
            src={user.avatarUrl}
            defaultType={user.defaultAvatarType ?? 'male'}
            size="xs"
            alt={user.username}
            className={s.avatar}
          />
          <OnlineDot userId={user.id} size="sm" />
        </span>
        <span className={s.headerBtnLabel}>{user.username}</span>
      </Link>

      <button type="button" className={s.headerBtn} onClick={handleLogout}>
        <span className={s.headerBtnIcon}><LogOut size={16} /></span>
        <span className={s.headerBtnLabel}>Odhlásit</span>
      </button>
    </nav>
  );
}

export function IkarosLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  // Hospoda (`/chat*`) běží bez pravého panelu — viz spec-chat-hide-right-panel.
  const isChat = useLocation().pathname.startsWith('/chat');
  const showRightPanel = isAuthenticated && !isChat;

  function openLeftDrawer() {
    setRightDrawerOpen(false);
    setDrawerOpen(true);
  }
  function openRightDrawer() {
    setDrawerOpen(false);
    setRightDrawerOpen(true);
  }
  function closeDrawers() {
    setDrawerOpen(false);
    setRightDrawerOpen(false);
  }

  useSocketInit();
  usePresenceInit();
  useFriendshipsSocket();
  useWorldAccessSocket();
  // 4.2d §4 — chat heartbeat běží globálně: presence drží i mimo `ChatRoom`.
  usePresenceHeartbeat(isAuthenticated);
  // D-8.6-transfer-notification — globální subscriber na WS event
  // `account:transfer:received` (toast + cache invalidate).
  useAccountTransferNotifications();
  // 13.2a — „Souhrn chatů" živě: badge u zvonku tiká na `chat:feed:bump`.
  useChatFeedLive();

  const themeId = useAtomValue(themeAtom);
  const theme = getTheme(themeId);
  // Krok 5.9 — uživatelské doladění jasu/kontrastu platformy (přístupnost).
  const platformPreview = useAtomValue(platformThemePreviewAtom);
  const themeUser = useAtomValue(currentUserAtom);
  const tsAdjust = (
    themeUser?.themeSettings as UserThemeSettings | undefined
  )?.adjust;
  const adjust = platformPreview ? platformPreview.adjust : tsAdjust;
  const mainStyle =
    adjust && (adjust.brightness != null || adjust.contrast != null)
      ? {
          filter: `brightness(${adjust.brightness ?? 1}) contrast(${
            adjust.contrast ?? 1
          })`,
        }
      : undefined;
  const bgStyle = theme.background
    ? {
        backgroundImage: `url(${theme.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed' as const,
      }
    : undefined;

  return (
    <div
      className={clsx(s.shell, !isAuthenticated && s.shellAnon)}
      data-theme={themeId}
      data-shell="ikaros"
      style={bgStyle}
    >
      <header className={s.header}>
        <button
          className={s.hamburger}
          onClick={openLeftDrawer}
          aria-label="Otevřít menu"
        >
          ☰
        </button>

        <Link to="/" className={s.logo} aria-label="Projekt Ikaros — domů">
          <span className={s.logoImg} aria-hidden="true" />
          <span className={s.logoFallback}>Projekt Ikaros</span>
        </Link>

        {/* Theme decoration: status strip — viditelná jen pro vesmirna-bitva (gated via CSS) */}
        <div data-theme-decoration="status-strip" aria-hidden="true">
          <span className="reticle" />
          <span className="status-text">VŠECHNY SYSTÉMY V POHOTOVOSTI</span>
          <span className="chevrons">
            <svg viewBox="0 0 24 12" xmlns="http://www.w3.org/2000/svg" width="24" height="12">
              <polygon points="0,0 10,6 0,12" fill="currentColor" opacity="0.85" />
              <polygon points="13,0 23,6 13,12" fill="currentColor" opacity="0.85" />
            </svg>
          </span>
        </div>

        {showRightPanel && (
          <button
            className={s.rightHamburger}
            onClick={openRightDrawer}
            aria-label="Otevřít administraci"
          >
            <Settings size={20} />
          </button>
        )}

        {isAuthenticated ? <HeaderLoggedIn /> : <HeaderLoggedOut />}
      </header>

      <div className={clsx(s.body, isChat && s.bodyNoRight)}>
        <aside className={s.sidebar} data-frame-panel="sidebar">
          <PanelCorners />
          <SidebarContent isAuthenticated={isAuthenticated} />
        </aside>

        <div
          className={clsx(s.drawerBackdrop, (drawerOpen || rightDrawerOpen) && s.drawerBackdropOpen)}
          onClick={closeDrawers}
        />
        <aside
          className={clsx(s.drawerSidebar, drawerOpen && s.drawerSidebarOpen)}
          data-frame-panel="sidebar"
        >
          <PanelCorners />
          <SidebarContent
            isAuthenticated={isAuthenticated}
            onNav={() => setDrawerOpen(false)}
          />
        </aside>

        <main
          className={clsx(s.main, isChat && s.mainChat)}
          style={mainStyle}
        >
          <Outlet />
        </main>

        {showRightPanel && (
          <aside className={s.rightPanel} data-frame-panel="right">
            <PanelCorners />
            <RightPanel />
          </aside>
        )}

        {showRightPanel && (
          <aside
            className={clsx(s.drawerRightSidebar, rightDrawerOpen && s.drawerRightSidebarOpen)}
            data-frame-panel="right"
          >
            <PanelCorners />
            <RightPanel onNav={() => setRightDrawerOpen(false)} />
          </aside>
        )}
      </div>

      {/* Theme decorations: gated displej via CSS — viditelné pouze pro temna-cerven */}
      <div data-theme-decoration="petals" aria-hidden="true">
        <span className="petal" />
        <span className="petal" />
        <span className="petal" />
        <span className="petal" />
        <span className="petal" />
      </div>

      <LoginModal />
      <RegisterModal />
      <ForgotPasswordModal />
      {isAuthenticated && <NotificationCenter />}
    </div>
  );
}
