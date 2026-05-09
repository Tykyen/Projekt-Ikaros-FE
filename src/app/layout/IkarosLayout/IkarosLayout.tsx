import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { toast } from 'sonner';
import clsx from 'clsx';
import {
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
} from 'lucide-react';
import s from './IkarosLayout.module.css';
import { useSocketInit } from '@/features/chat/api/useSocket';
import { useMyWorlds, usePublicWorlds } from '@/features/world/api/useWorlds';
import { useUnreadCount } from '@/features/chat/api/useMessages';
import { useLogout } from '@/features/auth/api/useAuth';
import {
  currentUserAtom,
  isAuthenticatedAtom,
  loginModalOpenAtom,
  registerModalOpenAtom,
} from '@/shared/store/authStore';
import { themeAtom } from '../../../themes/state';
import { getTheme } from '../../../themes/registry';
import { ThemeSwitcher } from '../../../themes/ThemeSwitcher';
import { LoginModal } from '@/features/auth/components/LoginModal';
import { RegisterModal } from '@/features/auth/components/RegisterModal';
import { CornerOrnament } from '@/shared/ui/CornerOrnament/CornerOrnament';
import { UserAvatar } from '@/shared/ui';
import { UserRole, type World } from '@/shared/types';

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
};

const PRIMARY_NAV: NavItemDef[] = [
  { navKey: 'uvodnik',       label: 'Úvodník',       to: '/',                      end: true, icon: <Home size={18} /> },
  { navKey: 'napoveda',      label: 'Nápověda',      to: '/ikaros/napoveda',                  icon: <HelpCircle size={18} /> },
  { navKey: 'diskuze',       label: 'Diskuze',       to: '/ikaros/diskuze',                   icon: <MessageSquare size={18} /> },
  { navKey: 'clanky',        label: 'Články',        to: '/ikaros/clanky',                    icon: <BookOpen size={18} /> },
  { navKey: 'galerie',       label: 'Galerie',       to: '/ikaros/galerie',                   icon: <ImageIcon size={18} /> },
  { navKey: 'vytvorit-svet', label: 'Vytvořit svět', to: '/ikaros/vytvorit-svet',             icon: <PlusCircle size={18} /> },
];

const CHAT_ROOMS: { key: string; label: string; to: string }[] = [
  { key: 'hospoda',   label: 'Dimenzionální hospoda', to: '/chat/hospoda' },
  { key: 'rozcesti1', label: 'Rozcestí I.',           to: '/chat/rozcesti' },
  { key: 'rozcesti2', label: 'Rozcestí II.',          to: '/chat/rozcesti2' },
  { key: 'rozcesti3', label: 'Rozcestí III.',         to: '/chat/rozcesti3' },
];

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className={s.sectionTitle}>{children}</div>;
}

function NavItem({ navKey, to, end, icon, label, onClick }: NavItemDef & { onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      data-nav-key={navKey}
      onClick={onClick}
      className={({ isActive }) => clsx(s.navItem, isActive && s.navItemActive)}
    >
      <span className={s.navItemIcon}>{icon}</span>
      <span className={s.navItemLabel}>{label}</span>
    </NavLink>
  );
}

function SidebarContent({
  isAuthenticated,
  onNav,
}: {
  isAuthenticated: boolean;
  onNav?: () => void;
}) {
  const currentUser = useAtomValue(currentUserAtom);
  const myWorldsQuery = useMyWorlds();
  const publicWorldsQuery = usePublicWorlds();
  const worlds: World[] | undefined = isAuthenticated
    ? myWorldsQuery.data
    : publicWorldsQuery.data;
  const { data: unread } = useUnreadCount();
  const chatCount = isAuthenticated ? unread?.unreadCount ?? 0 : 0;

  return (
    <div className={s.sidebarInner}>
      <div className={s.section}>
        <SectionTitle>Navigace</SectionTitle>
        <div className={s.navList}>
          {PRIMARY_NAV.map((item) => (
            <NavItem key={item.to} {...item} onClick={onNav} />
          ))}
        </div>
      </div>

      <div className={s.section}>
        <SectionTitle>Vesmíry</SectionTitle>
        <div className={s.navList}>
          {worlds?.slice(0, 8).map((w) => (
            <Link key={w.id} to={`/svet/${w.id}`} className={s.navItem} onClick={onNav}>
              <span className={s.worldOnlineDot} />
              <span className={s.navItemLabel}>{w.name}</span>
              {currentUser?.id && w.ownerId === currentUser.id && (
                <span className={s.pjBadge} data-pj-badge>PJ</span>
              )}
            </Link>
          ))}
          {(worlds?.length ?? 0) > 0 && (
            <Link to="/ikaros/vesmiry" className={s.showAllLink} onClick={onNav}>
              Zobrazit vše →
            </Link>
          )}
          {(worlds?.length ?? 0) === 0 && !isAuthenticated && (
            <p className={s.emptyHint}>Žádné dostupné světy</p>
          )}
        </div>
      </div>

      <div className={s.section}>
        <SectionTitle>{`Chat (${chatCount})`}</SectionTitle>
        <div className={s.navList}>
          {CHAT_ROOMS.map((room, idx) => (
            <NavLink
              key={room.key}
              to={room.to}
              data-nav-key={room.key}
              onClick={onNav}
              className={({ isActive }) => clsx(s.navItem, isActive && s.navItemActive)}
            >
              {idx === 0 && (
                <span className={s.navItemIcon}><Beer size={18} /></span>
              )}
              <span className={s.navItemLabel}>{room.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

function RightPanel() {
  const currentUser = useAtomValue(currentUserAtom);
  const { data: worlds } = useMyWorlds();
  const isAdmin =
    currentUser?.role === UserRole.Superadmin || currentUser?.role === UserRole.Admin;

  return (
    <div className={s.rightPanelInner}>
      <div className={s.section}>
        <SectionTitle>Administrace</SectionTitle>
        <div className={s.themeSwitcherSlot}>
          <ThemeSwitcher />
        </div>
        <div className={s.navList}>
          {isAdmin ? (
            <Link to="/ikaros/uzivatele" className={s.navItem}>
              <span className={s.navItemIcon}><Users size={18} /></span>
              <span className={s.navItemLabel}>Uživatelé</span>
            </Link>
          ) : (
            <Link to="/ikaros/profil#pratele" className={s.navItem}>
              <span className={s.navItemIcon}><Users size={18} /></span>
              <span className={s.navItemLabel}>Přátelé</span>
            </Link>
          )}
        </div>
      </div>

      <div className={s.section}>
        <div className={s.rightSectionHeader}>
          <SectionTitle>Moje světy</SectionTitle>
          <Link to="/ikaros/vytvorit-svet" className={s.rightAddBtn} title="Vytvořit svět">+</Link>
        </div>
        <div className={s.navList}>
          {worlds?.slice(0, 5).map((w) => (
            <Link key={w.id} to={`/svet/${w.id}`} className={s.navItem}>
              <span className={s.worldOnlineDot} />
              <span className={s.navItemLabel}>{w.name}</span>
              {currentUser?.id && w.ownerId === currentUser.id && (
                <span className={s.pjBadge} data-pj-badge>PJ</span>
              )}
            </Link>
          ))}
          {(worlds?.length ?? 0) === 0 && (
            <p className={s.emptyHint}>Žádné světy</p>
          )}
          {(worlds?.length ?? 0) > 0 && (
            <Link to="/ikaros/vesmiry" className={s.showAllLink}>Zobrazit vše →</Link>
          )}
        </div>
      </div>

      <div className={s.section}>
        <div className={s.rightSectionHeader}>
          <SectionTitle>Moje diskuze</SectionTitle>
          <Link to="/ikaros/diskuze/nova" className={s.rightAddBtn} title="Nová diskuze">+</Link>
        </div>
        <p className={s.emptyHint}>Žádné diskuze</p>
      </div>

      <div className={s.section}>
        <SectionTitle>Oblíbené články</SectionTitle>
        <p className={s.emptyHint}>Žádné oblíbené</p>
      </div>

      <div className={s.section}>
        <SectionTitle>Oblíbené obrázky</SectionTitle>
        <p className={s.emptyHint}>Žádné oblíbené</p>
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
        <span className={s.headerBtnLabel}>Registrace</span>
      </button>
    </nav>
  );
}

function HeaderLoggedIn() {
  const user = useAtomValue(currentUserAtom);
  const { data: unread } = useUnreadCount();
  const totalUnread = (unread?.unreadCount ?? 0) + (unread?.pendingRequestCount ?? 0);
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
        to="/ikaros/posta"
        icon={<Mail size={16} />}
        label="Pošta"
        badge={totalUnread}
      />

      <Link to="/ikaros/profil" className={s.headerBtn}>
        <UserAvatar
          src={user.avatarUrl}
          defaultType={user.defaultAvatarType ?? 'male'}
          size="sm"
          alt={user.username}
          className={s.avatar}
        />
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
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);

  useSocketInit();

  const themeId = useAtomValue(themeAtom);
  const theme = getTheme(themeId);
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
          onClick={() => setDrawerOpen(true)}
          aria-label="Otevřít menu"
        >
          ☰
        </button>

        <Link to="/" className={s.logo} aria-label="Projekt Ikaros — domů">
          <span className={s.logoImg} aria-hidden="true" />
          <span className={s.logoFallback}>Projekt Ikaros</span>
        </Link>

        {isAuthenticated ? <HeaderLoggedIn /> : <HeaderLoggedOut />}
      </header>

      <div className={s.body}>
        <aside className={s.sidebar} data-frame-panel="sidebar">
          <PanelCorners />
          <SidebarContent isAuthenticated={isAuthenticated} />
        </aside>

        <div
          className={clsx(s.drawerBackdrop, drawerOpen && s.drawerBackdropOpen)}
          onClick={() => setDrawerOpen(false)}
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

        <main className={s.main}>
          <Outlet />
        </main>

        {isAuthenticated && (
          <aside className={s.rightPanel} data-frame-panel="right">
            <PanelCorners />
            <RightPanel />
          </aside>
        )}
      </div>

      <LoginModal />
      <RegisterModal />
    </div>
  );
}
