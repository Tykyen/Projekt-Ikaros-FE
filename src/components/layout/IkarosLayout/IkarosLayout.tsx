import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import clsx from 'clsx';
import s from './IkarosLayout.module.css';
import { useSocketInit } from '../../../api/hooks/useSocket';
import { useMyWorlds } from '../../../api/hooks/useWorlds';
import { useUnreadCount } from '../../../api/hooks/useMessages';
import { currentUserAtom } from '../../../store/authStore';
import { themeAtom } from '../../../themes/state';
import { getTheme } from '../../../themes/registry';
import { ThemeSwitcher } from '../../../themes/ThemeSwitcher';

const PRIMARY_NAV = [
  { label: 'Úvodník',       to: '/',                      end: true },
  { label: 'Vesmíry',       to: '/ikaros/vesmiry' },
  { label: 'Vytvořit svět', to: '/ikaros/vytvorit-svet' },
  { label: 'Diskuze',       to: '/ikaros/diskuze' },
  { label: 'Články',        to: '/ikaros/clanky' },
  { label: 'Galerie',       to: '/ikaros/galerie' },
  { label: 'Nápověda',      to: '/ikaros/napoveda' },
];

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const { data: worlds } = useMyWorlds();

  return (
    <>
      <div className={s.section}>
        <div className={s.sectionTitle}>Navigace</div>
        {PRIMARY_NAV.map((item) => (
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
      </div>

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

function UserAvatar() {
  const user = useAtomValue(currentUserAtom);
  if (!user) return null;

  const initials = (user.displayName ?? user.username).slice(0, 2).toUpperCase();

  return (
    <Link to="/ikaros/profil" className={s.userBtn}>
      {user.avatarUrl
        ? <img src={user.avatarUrl} alt={user.username} className={s.avatar} />
        : <span className={s.avatar}>{initials}</span>
      }
      <span className={s.headerLinkText}>{user.displayName ?? user.username}</span>
    </Link>
  );
}

export function IkarosLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: unread } = useUnreadCount();
  const totalUnread = (unread?.unreadCount ?? 0) + (unread?.pendingRequestCount ?? 0);

  useSocketInit();

  const themeId = useAtomValue(themeAtom);
  const theme = getTheme(themeId);
  const bgStyle = theme.background
    ? { backgroundImage: `url(${theme.background})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' as const }
    : undefined;

  return (
    <div className={s.shell} data-theme={themeId} style={bgStyle}>
      {/* Header */}
      <header className={s.header}>
        <button
          className={s.hamburger}
          onClick={() => setDrawerOpen(true)}
          aria-label="Otevřít menu"
        >
          ☰
        </button>

        <Link to="/" className={s.logo}>Projekt Ikaros</Link>

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

          <NavLink
            to="/ikaros/uzivatele"
            className={({ isActive }) => clsx(s.headerLink, isActive && s.headerLinkActive)}
          >
            <span className={s.headerLinkText}>Uživatelé</span>
          </NavLink>

          <UserAvatar />
        </nav>
      </header>

      {/* 3-column body */}
      <div className={s.body}>
        {/* Sidebar — desktop */}
        <aside className={s.sidebar}>
          <SidebarContent />
        </aside>

        {/* Drawer — mobile */}
        <div
          className={clsx(s.drawerBackdrop, drawerOpen && s.drawerBackdropOpen)}
          onClick={() => setDrawerOpen(false)}
        />
        <aside className={clsx(s.drawerSidebar, drawerOpen && s.drawerSidebarOpen)}>
          <SidebarContent onNav={() => setDrawerOpen(false)} />
        </aside>

        {/* Main */}
        <main className={s.main}>
          <Outlet />
        </main>

        {/* Right panel — desktop + tablet schovává CSS */}
        <aside className={s.rightPanel}>
          <RightPanel />
        </aside>
      </div>
    </div>
  );
}
