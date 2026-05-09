import { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, Outlet, Link, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import clsx from 'clsx';
import s from './WorldLayout.module.css';
import { WorldContext } from '@/features/world/context/WorldContext';
import { useWorld } from '@/features/world/api/useWorlds';
import { currentUserAtom } from '@/shared/store/authStore';
import { WorldRole } from '@/shared/types';
import { themeAtom } from '../../../themes/state';
import { getTheme } from '../../../themes/registry';

/* ── Nav definice ── */
function buildNav(worldId: string) {
  const b = `/svet/${worldId}`;
  return [
    {
      label: 'Informace',
      items: [
        { label: 'Přehled',    to: b },
        { label: 'Pravidla',   to: `${b}/pravidla` },
      ],
    },
    { label: 'Chat',           to: `${b}/chat` },
    { label: 'Svět',           to: `${b}/stranky` },
    {
      label: 'Nástroje',
      items: [
        { label: 'Mapa vesmíru',     to: `${b}/mapa` },
        { label: 'Taktická mapa',    to: `${b}/takticka-mapa` },
        { label: 'Převodník měn',    to: `${b}/prevodnik-men` },
        { label: 'Generátor počasí', to: `${b}/pocasi` },
        { label: 'Zvuková databáze', to: `${b}/zvuky` },
        { label: 'Tvorba podzemí',   to: `/admin/dungeon-builder` },
        { label: 'Storyboard',       to: `${b}/scenare` },
      ],
    },
    {
      label: 'Společenství',
      items: [
        { label: 'Obchod',   to: `${b}/obchod` },
        { label: 'Skupiny',  to: `${b}/skupiny` },
        { label: 'Pavučina', to: `${b}/pavucina` },
      ],
    },
    { label: 'Kalendář',       to: `${b}/kalendar` },
  ] as const;
}

type NavGroup = ReturnType<typeof buildNav>[number];

/* ── Dropdown komponenta ── */
function NavDropdown({ group, onClose }: { group: NavGroup; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!('items' in group)) {
    return (
      <NavLink
        to={group.to}
        className={({ isActive }) => clsx(s.navLink, isActive && s.navLinkActive)}
        onClick={onClose}
      >
        {group.label}
      </NavLink>
    );
  }

  return (
    <div className={s.navItem} ref={ref}>
      <button
        className={clsx(s.navLink, open && s.navLinkActive)}
        onClick={() => setOpen((v) => !v)}
      >
        {group.label}
        <span className={clsx(s.chevron, open && s.chevronOpen)}>▾</span>
      </button>
      {open && (
        <div className={s.dropdown}>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={s.dropdownItem}
              onClick={() => { setOpen(false); onClose(); }}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── WorldLayout ── */
export function WorldLayout() {
  const { worldId = '' } = useParams<{ worldId: string }>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentUser = useAtomValue(currentUserAtom);
  const { data: world, isLoading } = useWorld(worldId);
  const nav = useMemo(() => buildNav(worldId), [worldId]);

  const isPJ =
    world?.ownerId === currentUser?.id ||
    (currentUser?.role !== undefined && currentUser.role <= 3); // Admin, PJ, Superadmin

  const ctxValue = useMemo(() => ({
    worldId,
    world: world ?? null,
    isPJ,
    userRole: null as WorldRole | null,
    loading: isLoading,
  }), [worldId, world, isPJ, isLoading]);

  const themeId = useAtomValue(themeAtom);
  const theme = getTheme(themeId);
  const bgStyle = theme.background
    ? { backgroundImage: `url(${theme.background})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' as const }
    : undefined;

  return (
    <WorldContext.Provider value={ctxValue}>
      <div className={s.shell} data-theme={themeId} style={bgStyle}>
        <header className={s.header}>
          {/* EXIT */}
          <Link to="/" className={s.exitBtn}>EXIT</Link>

          {/* Název světa */}
          <Link to={`/svet/${worldId}`} className={s.worldName}>
            {world?.name ?? (isLoading ? '...' : 'Svět')}
          </Link>
          {world?.genre && <span className={s.genreBadge}>{world.genre}</span>}

          {/* Desktop nav */}
          <nav className={s.nav}>
            {nav.map((group) => (
              <NavDropdown key={group.label} group={group} onClose={() => {}} />
            ))}
          </nav>

          {/* Akce */}
          <div className={s.actions}>
            <div className={s.searchBar}>Hledat...</div>
            {isPJ && (
              <Link to={`/svet/${worldId}/nova-stranka`} className={s.newPageBtn}>
                + Nová stránka
              </Link>
            )}
            <Link to="/ikaros/posta" className={s.actionBtn} title="Pošta">✉</Link>
          </div>

          {/* Hamburger — mobile */}
          <button
            className={s.hamburger}
            onClick={() => setDrawerOpen(true)}
            aria-label="Otevřít menu"
          >
            ☰
          </button>
        </header>

        {/* Mobile drawer (zprava) */}
        <div
          className={clsx(s.drawerBackdrop, drawerOpen && s.drawerBackdropOpen)}
          onClick={() => setDrawerOpen(false)}
        />
        <div className={clsx(s.drawer, drawerOpen && s.drawerOpen)}>
          {isPJ && (
            <Link
              to={`/svet/${worldId}/nova-stranka`}
              className={s.drawerNewPage}
              onClick={() => setDrawerOpen(false)}
            >
              + Nová stránka
            </Link>
          )}
          {nav.map((group) => (
            <div key={group.label} className={s.drawerSection}>
              {'items' in group ? (
                <>
                  <div className={s.drawerSectionTitle}>{group.label}</div>
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={s.drawerLink}
                      onClick={() => setDrawerOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </>
              ) : (
                <NavLink
                  to={group.to}
                  className={s.drawerLink}
                  onClick={() => setDrawerOpen(false)}
                >
                  {group.label}
                </NavLink>
              )}
            </div>
          ))}
        </div>

        <main className={s.main}>
          <Outlet />
        </main>
      </div>
    </WorldContext.Provider>
  );
}
