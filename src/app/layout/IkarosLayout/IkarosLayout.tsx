import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { toast } from 'sonner';
import clsx from 'clsx';
import {
  Bell,
  Mail,
  Users,
  User as UserIcon,
  UserPlus,
  LogOut,
  Home,
  PlusCircle,
  Palette,
  HelpCircle,
  HandHeart,
  Beer,
  Signpost,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Dices,
} from 'lucide-react';
import s from './IkarosLayout.module.css';
import { pendingTooltip } from './pendingBadge';
import { useSocketInit, useSocketEvent } from '@/features/chat/api/useSocket';
import { useAccountTransferNotifications } from '@/features/world/pages/api/useAccountTransferNotifications';
import { usePresenceHeartbeat } from '@/features/chat/api/usePresenceHeartbeat';
import { useRoomPresenceCounts } from '@/features/chat/api/useGlobalChat';
import { myRoomsAtom } from '@/features/chat/store/roomsStore';
import { anonSessionAtom } from '@/features/chat/store/anonSession';
import type { RoomKey } from '@/features/chat/lib/types';
import { useMyWorlds, usePublicWorlds } from '@/features/world/api/useWorlds';
import { useUnreadCount } from '@/features/ikaros/api/useMail';
import { useMyFavoriteArticles } from '@/features/ikaros/api/useArticles';
import { useMyFavoriteGallery } from '@/features/ikaros/api/useGallery';
import { useMyFavoriteDiscussions } from '@/features/ikaros/api/useDiscussions';
import { cloudinaryThumb } from '@/shared/lib/cloudinary';
import { activateOnKey } from '@/shared/lib/a11y';
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
import { SiteFooter } from '@/shared/ui/SiteFooter/SiteFooter';
import { UserAvatar, useFocusTrap } from '@/shared/ui';
import { OnlineDot } from '@/shared/presence/OnlineDot';
import { usePresenceInit } from '@/shared/presence/usePresence';
import { usePageViewPing } from '@/shared/analytics/usePageViewPing';
import { SYSTEM_LANDINGS_PUBLIC } from '@/features/ikaros/pages/SystemLanding/flag';
import { useFriendshipsSocket } from '@/features/friendships/hooks/useFriendshipsSocket';
import { useWorldAccessSocket } from '@/features/world/hooks/useWorldAccessSocket';
import { useWorldInviteSocket } from '@/features/world/hooks/useWorldInviteSocket';
import { useAdminChatLive } from '@/features/admin/chat/api/useAdminChatLive';
import { useAdminChatUnreadTotal } from '@/features/admin/chat/api/useAdminChat';
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
  /**
   * 21.5 — sloučená nav položka: badge = SOUČET těchto typů (tooltip vyjmenuje
   * neprázdné). Alternativa k `pendingType`, když jedna položka zastřešuje více
   * moderovaných sekcí (např. „Společná tvorba" = Diskuze + Články + Galerie).
   */
  pendingTypes?: PendingActionType[];
  /**
   * Spec 15.7 — položka, která pro anonima vede jen na login (slepý odkaz), se
   * mu v menu vůbec nezobrazí. CTA na tvorbu světa je místo toho v hero kartě.
   */
  anonHidden?: boolean;
};

const PRIMARY_NAV: NavItemDef[] = [
  { navKey: 'uvodnik',       label: 'Úvodník',       to: '/',                      end: true, icon: <Home size={18} /> },
  { navKey: 'napoveda',      label: 'Nápověda',      to: '/ikaros/napoveda',                  icon: <HelpCircle size={18} /> },
  { navKey: 'podporovatele', label: 'Podporovatelé', to: '/ikaros/podporovatele',             icon: <HandHeart size={18} /> },
  // 15B.4a — veřejný rozcestník landing stránek RPG systémů (anon i člen)
  // R3 25.8 — skryto za flag do rozhodnutí licencí (spec-25.8)
  ...(SYSTEM_LANDINGS_PUBLIC
    ? [{ navKey: 'systemy',  label: 'RPG systémy',   to: '/ikaros/systemy',                   icon: <Dices size={18} /> }]
    : []),
  // 21.5 — Diskuze/Články/Galerie sloučeny do rozcestníku „Společná tvorba";
  // badge = součet jejich pending-review typů, ať moderace nezmizí z nav.
  { navKey: 'tvorba',        label: 'Společná tvorba', to: '/ikaros/tvorba',                  icon: <Palette size={18} />,       pendingTypes: [PendingActionType.DiscussionPendingReview, PendingActionType.ArticlePendingReview, PendingActionType.GalleryPendingReview] },
  { navKey: 'vytvorit-svet', label: 'Vytvořit svět', to: '/ikaros/vytvorit-svet',             icon: <PlusCircle size={18} />,    anonHidden: true },
];

// Krok 4.1 — Hospoda žije na `/chat`. Krok 4.2a — Camp I.–III. na `/chat/camp*`.
// `roomKey` = BE RoomKey (pro odznak počtu přítomných, 4.2c §4) — pozor, liší se
// od `key` (URL segment bez pomlčky).
const CHAT_ROOMS: {
  key: string;
  roomKey: RoomKey;
  label: string;
  to: string;
  disabled?: boolean;
  /** Spec 15.7 — Camp jsou login-only roleplay; anonimovi se skryjí.
   *  Hospoda zůstává (budoucí anon-chat, zatím klik → login). */
  anonHidden?: boolean;
}[] = [
  { key: 'hospoda',   roomKey: 'hospoda',    label: 'Putyka',        to: '/chat' },
  // 17.6 — Voice krčma: hlasová místnost mezi Putykou a Campy, jen registrovaní.
  { key: 'voice', roomKey: 'voice-krcma', label: 'Voice krčma', to: '/chat/voice', anonHidden: true },
  { key: 'camp1', roomKey: 'camp-1', label: 'Fantasy camp', to: '/chat/camp',  anonHidden: true },
  { key: 'camp2', roomKey: 'camp-2', label: 'Mystery camp', to: '/chat/camp2', anonHidden: true },
  { key: 'camp3', roomKey: 'camp-3', label: 'Sci-fi camp',  to: '/chat/camp3', anonHidden: true },
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
  pendingTypes,
  pendingByType,
  onClick,
}: NavItemDef & {
  onClick?: () => void;
  pendingByType?: Partial<Record<PendingActionType, number>>;
}) {
  // Spec 3.8 + 21.5 — badge = jeden typ (pendingType) NEBO součet více typů
  // (pendingTypes; sloučená položka „Společná tvorba"). Chybějící klíč v
  // byType = uživatel daný typ nevidí (0).
  const pendingReviewTypes = pendingTypes ?? (pendingType ? [pendingType] : []);
  const pendingCount = pendingReviewTypes.reduce(
    (sum, t) => sum + (pendingByType?.[t] ?? 0),
    0,
  );
  const tooltip =
    pendingCount > 0
      ? pendingReviewTypes
          .filter((t) => (pendingByType?.[t] ?? 0) > 0)
          .map((t) => pendingTooltip(t, pendingByType?.[t] ?? 0))
          .join(' · ')
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

export function SidebarContent({
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
          {PRIMARY_NAV.filter((item) => isAuthenticated || !item.anonHidden).map(
            (item) => (
              <NavItem
                key={item.to}
                {...item}
                pendingByType={pendingCount?.byType}
                onClick={onNav}
              />
            ),
          )}
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
          {/* 19.3 — vstup na nástěnku náborů (LFG). */}
          <Link to="/ikaros/nabory" className={s.showAllLink} onClick={onNav}>
            Hledá se →
          </Link>
        </div>
      </div>

      <div className={s.section} data-section-key="chat">
        <SectionTitle>
          {chatPresence > 0 ? `Chat (${chatPresence})` : 'Chat'}
        </SectionTitle>
        <div className={s.navList}>
          {CHAT_ROOMS.filter((room) => isAuthenticated || !room.anonHidden).map(
            (room) => {
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
  // 20.5b — badge „Chat správy": BE-backed součet nepřečtených (přežije reload).
  const adminChatUnseen = useAdminChatUnreadTotal(isAdmin);

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
          {isAdmin && (
            <Link to="/admin/chat" className={s.navItem} onClick={onNav}>
              <span className={s.navItemIcon}>
                <MessageSquare size={18} />
              </span>
              <span className={s.navItemLabel}>Chat správy</span>
              {adminChatUnseen > 0 && (
                <span
                  className={s.navItemBadge}
                  aria-label={`${adminChatUnseen} nepřečtených zpráv`}
                >
                  {adminChatUnseen}
                </span>
              )}
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

/**
 * Spec 15.7 — pravý panel pro anonima (místo Administrace/Moje světy). Timeline
 * 3 kroků „Začni tady"; krok 1 je klikací → otevře registraci.
 */
function AnonStartPanel({ onNav }: { onNav?: () => void } = {}) {
  const setRegisterOpen = useSetAtom(registerModalOpenAtom);
  return (
    <div className={s.rightPanelInner}>
      <div className={s.section} data-section-key="zacni-tady">
        <SectionTitle>Začni tady</SectionTitle>
        <ol className={s.startSteps}>
          <li className={s.startStep}>
            <span className={s.startNum}>1</span>
            <button
              type="button"
              className={s.startStepLink}
              onClick={() => {
                setRegisterOpen(true);
                onNav?.();
              }}
            >
              <span className={s.startStepTitle}>Zaregistruj se</span>
              <span className={s.startStepDesc}>Zdarma, během chvilky</span>
            </button>
          </li>
          <li className={s.startStep}>
            <span className={s.startNum}>2</span>
            <div className={s.startStepText}>
              <span className={s.startStepTitle}>Vytvoř svůj svět</span>
              <span className={s.startStepDesc}>Nebo se přidej k existujícímu</span>
            </div>
          </li>
          <li className={s.startStep}>
            <span className={s.startNum}>3</span>
            <div className={s.startStepText}>
              <span className={s.startStepTitle}>Pozvi přátele</span>
              <span className={s.startStepDesc}>A hrajte společně</span>
            </div>
          </li>
        </ol>
      </div>
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
        <span className={s.headerBtnIcon}><UserPlus size={16} /></span>
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
  // 17.8 — focus trap + navrácení fokusu na hamburger u obou mobilních draverů
  // (dřív jen Escape). `inert` na zavřeném draveru viz JSX níže.
  const leftDrawerRef = useRef<HTMLElement | null>(null);
  const rightDrawerRef = useRef<HTMLElement | null>(null);
  useFocusTrap({ active: drawerOpen, containerRef: leftDrawerRef });
  useFocusTrap({ active: rightDrawerOpen, containerRef: rightDrawerRef });
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  // FIX-3 — host (guest session, 15.8) taky musí posílat heartbeat, jinak ho
  // BE po 60 min nečinnosti vyhodí z Putyky (heartbeat dřív jel jen pro
  // členy — `isAuthenticated` = `accessTokenAtom != null`).
  const anon = useAtomValue(anonSessionAtom);
  const isPresent = isAuthenticated || !!anon;
  // Hospoda (`/chat*`) běží bez pravého panelu — viz spec-chat-hide-right-panel.
  const pathname = useLocation().pathname;
  const isChat = pathname.startsWith('/chat');
  // Administrace = široká správní tabulka → skryj pravý panel (Moje světy /
  // Oblíbené) pro plnou šířku main, stejně jako chat (focus mód).
  const isAdmin = pathname.startsWith('/admin');
  // 20.5 — admin chat běží ve full-height chat módu (jako `/chat`), ne
  // v 220px admin gridu → shell vyplní celý viewport přes celou plochu.
  const isAdminChat = pathname.startsWith('/admin/chat');
  // 16.2b-2 — globální bestiář = imerzivní full-width plocha („kniha") bez obou
  // bočních panelů. Reuse bodyFull (1 sloupec + skrytý levý sidebar).
  const isBestiar = pathname.startsWith('/ikaros/bestiar');
  // Spec 15.7 — pravý panel se ukáže i anonimovi (obsah = AnonStartPanel
  // „Začni tady" místo Administrace). Skrytý v chat/admin focus módu + bestiar.
  const showRightPanel = !isChat && !isAdmin && !isBestiar;

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

  // 17.8 — Escape zavře otevřený mobilní drawer (klávesová obsluha).
  useEffect(() => {
    if (!drawerOpen && !rightDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setRightDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen, rightDrawerOpen]);

  const setMyRooms = useSetAtom(myRoomsAtom);
  useSocketInit();
  usePresenceInit();
  useFriendshipsSocket();
  useWorldAccessSocket();
  useWorldInviteSocket();
  // 4.2d §4 — chat heartbeat běží globálně: presence drží i mimo `ChatRoom`.
  // FIX-3 — gate na member NEBO host (anon), ne jen člen.
  usePresenceHeartbeat(isPresent);
  // Presence self-detection (varianta A): BE pošle tomuto socketu jeho reálné
  // místnosti → nav odečítá „mě" dle serveru, ne dle efemérního klientského
  // stavu. Opravuje „vidím se v Putyce, kam jsem nešel" (socket tam zůstal).
  useSocketEvent<RoomKey[]>('chat:my-rooms', (rooms) =>
    setMyRooms(new Set(rooms)),
  );
  // D-8.6-transfer-notification — globální subscriber na WS event
  // `account:transfer:received` (toast + cache invalidate).
  useAccountTransferNotifications();
  // 13.2a — „Souhrn chatů" živě: badge u zvonku tiká na `chat:feed:bump`.
  useChatFeedLive();
  // 20.5 — live badge admin chatu: tiká na `platform-chat:activity`.
  useAdminChatLive();
  // 15B.7 — page-view ping pro analytics (fire-and-forget; boti/prerender se
  // filtrují na BE). Pokrývá všechny Ikaros routy; world routy řeší WorldLayout.
  usePageViewPing();

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
      // Spec 15.7 — anon má nahoře showcase banner; skiny, které kreslí
      // dekorace do horní zóny main (arabsky-svet lampa), je přes tento
      // atribut pro anonima skryjí, ať nekolidují s bannerem.
      data-anon={!isAuthenticated ? '' : undefined}
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

        {/* Administrace (pravý drawer) — přesunuto vlevo hned vedle hamburgeru,
            ikona hvězdy místo ozubeného kolečka. Mobil-only (viz CSS). */}
        {showRightPanel && (
          <button
            className={s.rightHamburger}
            onClick={openRightDrawer}
            aria-label={isAuthenticated ? 'Otevřít administraci' : 'Otevřít panel Začni tady'}
          >
            <Sparkles size={20} />
          </button>
        )}

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

        {isAuthenticated ? <HeaderLoggedIn /> : <HeaderLoggedOut />}
      </header>

      <div
        className={clsx(
          s.body,
          // Admin chat = full-bleed (jen 1 sloupec); jinak chat/admin = bez
          // pravého panelu. Výlučně, ať se konfliktní grid třídy nepřekrývají.
          isAdminChat || isBestiar
            ? s.bodyFull
            : (isChat || isAdmin) && s.bodyNoRight,
        )}
      >
        <aside className={s.sidebar} data-frame-panel="sidebar">
          <PanelCorners />
          <SidebarContent isAuthenticated={isAuthenticated} />
        </aside>

        <div
          className={clsx(s.drawerBackdrop, (drawerOpen || rightDrawerOpen) && s.drawerBackdropOpen)}
          onClick={closeDrawers}
          onKeyDown={activateOnKey(closeDrawers)}
          role="button"
          tabIndex={-1}
          aria-label="Zavřít menu"
        />
        <aside
          ref={leftDrawerRef}
          tabIndex={-1}
          inert={!drawerOpen}
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
          className={clsx(s.main, (isChat || isAdminChat) && s.mainChat)}
          style={mainStyle}
        >
          <Outlet />
          {/* 20A — sdílená patička s legal odkazy; skrytá v chat/admin focus
              módu (stejný gate jako pravý panel). */}
          {showRightPanel && <SiteFooter />}
        </main>

        {showRightPanel && (
          <aside className={s.rightPanel} data-frame-panel="right">
            <PanelCorners />
            {isAuthenticated ? <RightPanel /> : <AnonStartPanel />}
          </aside>
        )}

        {showRightPanel && (
          <aside
            ref={rightDrawerRef}
            tabIndex={-1}
            inert={!rightDrawerOpen}
            className={clsx(s.drawerRightSidebar, rightDrawerOpen && s.drawerRightSidebarOpen)}
            data-frame-panel="right"
          >
            <PanelCorners />
            {isAuthenticated ? (
              <RightPanel onNav={() => setRightDrawerOpen(false)} />
            ) : (
              <AnonStartPanel onNav={() => setRightDrawerOpen(false)} />
            )}
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
