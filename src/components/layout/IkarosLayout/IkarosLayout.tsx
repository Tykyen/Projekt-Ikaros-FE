import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { toast } from 'sonner';
import clsx from 'clsx';
import s from './IkarosLayout.module.css';
import { useSocketInit } from '../../../api/hooks/useSocket';
import { useMyWorlds, usePublicWorlds } from '../../../api/hooks/useWorlds';
import { useUnreadCount } from '../../../api/hooks/useMessages';
import { useLogout } from '../../../api/hooks/useAuth';
import {
  currentUserAtom,
  isAuthenticatedAtom,
  loginModalOpenAtom,
} from '../../../store/authStore';
import { themeAtom } from '../../../themes/state';
import { getTheme } from '../../../themes/registry';
import { ThemeSwitcher } from '../../../themes/ThemeSwitcher';
import { Button } from '../../ui/Button/Button';
import { LoginModal } from '../../auth/LoginModal';
import { UserRole, type World } from '../../../types';

const PRIMARY_NAV_PUBLIC = [
  { label: 'Úvodník',  to: '/',                  end: true },
  { label: 'Vesmíry',  to: '/ikaros/vesmiry' },
  { label: 'Diskuze',  to: '/ikaros/diskuze' },
  { label: 'Články',   to: '/ikaros/clanky' },
  { label: 'Galerie',  to: '/ikaros/galerie' },
  { label: 'Nápověda', to: '/ikaros/napoveda' },
];

const PRIMARY_NAV_AUTH = [
  { label: 'Úvodník',       to: '/',                      end: true },
  { label: 'Vesmíry',       to: '/ikaros/vesmiry' },
  { label: 'Vytvořit svět', to: '/ikaros/vytvorit-svet' },
  { label: 'Diskuze',       to: '/ikaros/diskuze' },
  { label: 'Články',        to: '/ikaros/clanky' },
  { label: 'Galerie',       to: '/ikaros/galerie' },
  { label: 'Nápověda',      to: '/ikaros/napoveda' },
];

function SidebarContent({
  isAuthenticated,
  onNav,
}: {
  isAuthenticated: boolean;
  onNav?: () => void;
}) {
  const myWorldsQuery = useMyWorlds();
  const publicWorldsQuery = usePublicWorlds();
  const worlds: World[] | undefined = isAuthenticated
    ? myWorldsQuery.data
    : publicWorldsQuery.data;
  const nav = isAuthenticated ? PRIMARY_NAV_AUTH : PRIMARY_NAV_PUBLIC;

  return (
    <>
      <div className={s.section}>
        <div className={s.sectionTitle}>Navigace</div>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNav}
            className={({ isActive }) => clsx(s.navLink, isActive && s.navLinkActive)}
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className={s.section}>
        <div className={s.sectionTitle}>Vesmíry</div>
        {worlds?.slice(0, 8).map((w) => (
          <Link key={w.id} to={`/svet/${w.id}`} className={s.worldLink} onClick={onNav}>
            <span className={s.worldOnlineDot} />
            {w.name}
          </Link>
        ))}
        {(worlds?.length ?? 0) > 0 && (
          <Link to="/ikaros/vesmiry" className={s.showAllLink} onClick={onNav}>
            Zobrazit vše →
          </Link>
        )}
        {(worlds?.length ?? 0) === 0 && !isAuthenticated && (
          <p className={s.rightPanelEmpty}>Žádné dostupné světy</p>
        )}
      </div>

      {isAuthenticated && (
        <div className={s.section}>
          <div className={s.sectionTitle}>Chat</div>
          <NavLink
            to="/chat"
            onClick={onNav}
            className={({ isActive }) => clsx(s.navLink, isActive && s.navLinkActive)}
          >
            Hospoda
          </NavLink>
        </div>
      )}
    </>
  );
}

function RightPanel() {
  const { data: worlds } = useMyWorlds();

  return (
    <>
      <div className={s.section}>
        <div className={s.rightPanelHeader}>
          <span className={s.rightPanelTitle}>Moje diskuze</span>
          <Link to="/ikaros/diskuze/nova" className={s.rightPanelAdd} title="Nová diskuze">+</Link>
        </div>
        <p className={s.rightPanelEmpty}>Žádné diskuze</p>
      </div>

      <div className={s.section}>
        <div className={s.rightPanelHeader}>
          <span className={s.rightPanelTitle}>Moje světy</span>
          <Link to="/ikaros/vytvorit-svet" className={s.rightPanelAdd} title="Vytvořit svět">+</Link>
        </div>
        {worlds?.slice(0, 5).map((w) => (
          <Link key={w.id} to={`/svet/${w.id}`} className={s.worldLink}>
            <span className={s.worldOnlineDot} />
            {w.name}
          </Link>
        ))}
        {(worlds?.length ?? 0) === 0 && (
          <p className={s.rightPanelEmpty}>Žádné světy</p>
        )}
        {(worlds?.length ?? 0) > 0 && (
          <Link to="/ikaros/vesmiry" className={s.showAllLink}>Zobrazit vše →</Link>
        )}
      </div>
    </>
  );
}

function HeaderLoggedOut() {
  const setLoginModalOpen = useSetAtom(loginModalOpenAtom);

  return (
    <nav className={s.headerNav}>
      <ThemeSwitcher />
      <Button
        variant="primary"
        size="sm"
        onClick={() => setLoginModalOpen(true)}
      >
        Přihlásit se
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled
        title="Připravujeme"
      >
        Registrace
      </Button>
    </nav>
  );
}

function HeaderLoggedIn() {
  const user = useAtomValue(currentUserAtom);
  const { data: unread } = useUnreadCount();
  const totalUnread = (unread?.unreadCount ?? 0) + (unread?.pendingRequestCount ?? 0);
  const startLogout = useLogout();

  if (!user) return null;

  const initials = (user.displayName ?? user.username).slice(0, 2).toUpperCase();
  const displayName = user.displayName ?? user.username;
  const isAdmin =
    user.role === UserRole.Superadmin || user.role === UserRole.Admin;

  function handleLogout() {
    const cancel = startLogout();
    toast('Odhlášeno', {
      duration: 5000,
      action: { label: 'Vrátit', onClick: cancel },
    });
  }

  function notReady() {
    toast.info('Připravujeme.');
  }

  return (
    <nav className={s.headerNav}>
      <ThemeSwitcher />

      <NavLink
        to="/ikaros/posta"
        className={({ isActive }) => clsx(s.headerLink, isActive && s.headerLinkActive)}
      >
        <span className={s.headerLinkText}>Pošta</span>
        {totalUnread > 0 && (
          <span className={s.badge}>{totalUnread > 99 ? '99+' : totalUnread}</span>
        )}
      </NavLink>

      {isAdmin ? (
        <NavLink
          to="/ikaros/uzivatele"
          className={({ isActive }) => clsx(s.headerLink, isActive && s.headerLinkActive)}
        >
          <span className={s.headerLinkText}>Uživatelé</span>
        </NavLink>
      ) : (
        <button
          type="button"
          className={s.headerLink}
          onClick={notReady}
          title="Připravujeme"
        >
          <span className={s.headerLinkText}>Přátelé</span>
        </button>
      )}

      <Link to="/ikaros/profil" className={s.userBtn}>
        {user.avatarUrl
          ? <img src={user.avatarUrl} alt={user.username} className={s.avatar} />
          : <span className={s.avatar}>{initials}</span>
        }
        <span className={s.headerLinkText}>{displayName}</span>
      </Link>

      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Odhlásit
      </Button>
    </nav>
  );
}

export function IkarosLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);

  // useSocketInit interně rozhoduje podle tokenu (no-op pro anon)
  useSocketInit();

  const themeId = useAtomValue(themeAtom);
  const theme = getTheme(themeId);
  const bgStyle = theme.background
    ? { backgroundImage: `url(${theme.background})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' as const }
    : undefined;

  return (
    <div
      className={clsx(s.shell, !isAuthenticated && s.shellAnon)}
      data-theme={themeId}
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

        <Link to="/" className={s.logo}>Projekt Ikaros</Link>

        {isAuthenticated ? <HeaderLoggedIn /> : <HeaderLoggedOut />}
      </header>

      <div className={s.body}>
        <aside className={s.sidebar}>
          <SidebarContent isAuthenticated={isAuthenticated} />
        </aside>

        <div
          className={clsx(s.drawerBackdrop, drawerOpen && s.drawerBackdropOpen)}
          onClick={() => setDrawerOpen(false)}
        />
        <aside className={clsx(s.drawerSidebar, drawerOpen && s.drawerSidebarOpen)}>
          <SidebarContent
            isAuthenticated={isAuthenticated}
            onNav={() => setDrawerOpen(false)}
          />
        </aside>

        <main className={s.main}>
          <Outlet />
        </main>

        {isAuthenticated && (
          <aside className={s.rightPanel}>
            <RightPanel />
          </aside>
        )}
      </div>

      {/* Globální login modal — otvírá se přes loginModalOpenAtom */}
      <LoginModal />
    </div>
  );
}
