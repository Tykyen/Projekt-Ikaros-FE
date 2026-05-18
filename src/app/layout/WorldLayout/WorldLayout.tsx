import { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, Outlet, Link, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import clsx from 'clsx';
import s from './WorldLayout.module.css';
import { WorldContext, type WorldContextValue } from '@/features/world/context/WorldContext';
import { useWorld } from '@/features/world/api/useWorlds';
import { useWorldStatus } from '@/features/world/api/useWorldStatus';
import { accessModeLabel } from '@/features/world/lib/accessMode';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole, WorldRole } from '@/shared/types';
import { UserAvatar } from '@/shared/ui';
import { themeAtom } from '../../../themes/state';
import { getTheme } from '../../../themes/registry';
import { applyTheme } from '../../../themes/applyTheme';
import { useWorldTheme } from '../../../themes/useWorldTheme';
import { WorldThemeSwitcher } from '@/features/world/components/WorldThemeSwitcher';

/* ── Nav definice ── */
function buildNav(worldSlug: string) {
  const b = `/svet/${worldSlug}`;
  return [
    {
      label: 'Informace',
      items: [
        { label: 'Přehled',    to: b },
        { label: 'Novinky',    to: `${b}/novinky` },
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
        { label: 'Hráči',    to: `${b}/hraci` },
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
  // URL nese slug (`/svet/matrix`) — případně ObjectId u starých odkazů.
  const { worldSlug = '' } = useParams<{ worldSlug: string }>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentUser = useAtomValue(currentUserAtom);
  const { data: world, isLoading } = useWorld(worldSlug);
  // Reálné ObjectId — pro membership lookup i BE volání downstream.
  const realWorldId = world?.id ?? '';
  const { status, membership, isLoading: statusLoading } =
    useWorldStatus(realWorldId);
  const nav = useMemo(() => buildNav(worldSlug), [worldSlug]);

  const isPJ =
    world?.ownerId === currentUser?.id ||
    (currentUser?.role !== undefined && currentUser.role <= 3); // Admin, PJ, Superadmin
  const isGlobalAdmin =
    currentUser?.role !== undefined && currentUser.role <= UserRole.Admin;

  // Spec 5.1 — loading shellu: header skeleton, dokud world + status nedoběhnou.
  const loading = isLoading || statusLoading;

  // Spec 2.4 — full nav jen pro membery (libovolná role 0–5) nebo globální adminy.
  // Spec 5.1 — když world chybí (404 / private bez přístupu), nav se nesmí
  // renderovat ani globálnímu adminovi; tělo ukáže `WorldNotFound`.
  const showFullNav =
    !!world && !loading && (status === 'member' || isGlobalAdmin);

  const ctxValue = useMemo<WorldContextValue>(
    () => ({
      worldId: realWorldId,
      worldSlug,
      world: world ?? null,
      isPJ,
      userRole: (membership?.role ?? null) as WorldRole | null,
      // Fáze 8 — aktivní postava; do té doby null (header fallbackuje na účet).
      character: null,
      loading,
    }),
    [realWorldId, worldSlug, world, isPJ, membership, loading],
  );

  // Spec 5.0 — světový theme. `.shell` vykresluje motiv světa; po vstupu se
  // přepne globální `:root` (kvůli portálům — modaly mimo `.shell`), EXIT obnoví.
  const { themeId, overrides, backgroundUrl } = useWorldTheme(world ?? null);
  const theme = getTheme(themeId);
  const bg = backgroundUrl ?? theme.background;
  const bgStyle = bg
    ? { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' as const }
    : undefined;

  // Globální motiv uživatele — ref, aby unmount cleanup měl aktuální hodnotu.
  const globalThemeId = useAtomValue(themeAtom);
  const globalThemeIdRef = useRef(globalThemeId);
  useEffect(() => {
    globalThemeIdRef.current = globalThemeId;
  }, [globalThemeId]);

  // Apply motiv světa na `:root` (až po načtení světa — během loadingu
  // zůstává globální motiv).
  useEffect(() => {
    if (loading || !world) return;
    void applyTheme(themeId, { overrides, backgroundUrl });
  }, [loading, world, themeId, overrides, backgroundUrl]);

  // Unmount (EXIT ze světa) → obnova uživatelova globálního motivu.
  useEffect(() => {
    return () => {
      void applyTheme(globalThemeIdRef.current);
    };
  }, []);

  // Spec 5.1 — slot „aktuální přihlášená postava". Fáze 8 dotáhne reálnou
  // postavu; do té doby fallback na username účtu. Neklikatelné.
  const personaName =
    ctxValue.character?.name ??
    currentUser?.username ??
    'Účet';
  const personaAvatar =
    ctxValue.character?.avatarUrl ??
    currentUser?.profileImageUrl ??
    currentUser?.avatarUrl ??
    null;

  return (
    <WorldContext.Provider value={ctxValue}>
      <div className={s.shell} data-theme={themeId} style={bgStyle}>
        <header className={s.header}>
          {/* EXIT — funkční i během loadingu / 404 */}
          <Link to="/" className={s.exitBtn}>EXIT</Link>

          {loading ? (
            /* Spec 5.1 — header skeleton během načítání světa */
            <>
              <span className={clsx(s.skeletonBlock, s.skeletonName)} aria-hidden="true" />
              <span className={clsx(s.skeletonBlock, s.skeletonBadge)} aria-hidden="true" />
            </>
          ) : (
            <>
              {/* Název světa */}
              <Link to={`/svet/${worldSlug}`} className={s.worldName}>
                {world?.name ?? 'Svět nenalezen'}
              </Link>
              {world && (
                <span
                  className={s.accessBadge}
                  data-mode={world.accessMode}
                  aria-label={`Přístupový režim: ${accessModeLabel(world.accessMode)}`}
                >
                  {accessModeLabel(world.accessMode)}
                </span>
              )}
              {world?.genre && <span className={s.genreBadge}>{world.genre}</span>}
            </>
          )}

          {/* Spec 2.4 — full nav jen pro membery / globální adminy */}
          {showFullNav && (
            <>
              <nav className={s.nav}>
                {nav.map((group) => (
                  <NavDropdown
                    key={group.label}
                    group={group}
                    onClose={() => {}}
                  />
                ))}
              </nav>

              <div className={s.actions}>
                <div className={s.searchBar}>Hledat...</div>
                {isPJ && (
                  <Link
                    to={`/svet/${worldSlug}/nova-stranka`}
                    className={s.newPageBtn}
                  >
                    + Nová stránka
                  </Link>
                )}
                <Link
                  to="/ikaros/posta"
                  className={s.actionBtn}
                  title="Pošta"
                >
                  ✉
                </Link>

                {/* Spec 5.0e — preset switcher „Vzhled světa" */}
                <WorldThemeSwitcher />

                {/* Spec 5.1 — slot postavy (fallback na účet), neklikatelné */}
                <div className={s.persona} title={personaName}>
                  <UserAvatar
                    src={personaAvatar}
                    defaultType={currentUser?.defaultAvatarType}
                    size="sm"
                    alt={personaName}
                  />
                  <span className={s.personaName}>{personaName}</span>
                </div>
              </div>

              <button
                className={s.hamburger}
                onClick={() => setDrawerOpen(true)}
                aria-label="Otevřít menu"
              >
                ☰
              </button>
            </>
          )}
        </header>

        {/* Mobile drawer (zprava) — jen pro membery */}
        {showFullNav && (
          <>
            <div
              className={clsx(s.drawerBackdrop, drawerOpen && s.drawerBackdropOpen)}
              onClick={() => setDrawerOpen(false)}
            />
            <div className={clsx(s.drawer, drawerOpen && s.drawerOpen)}>
              {isPJ && (
                <Link
                  to={`/svet/${worldSlug}/nova-stranka`}
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
          </>
        )}

        <main className={s.main}>
          <Outlet />
        </main>
      </div>
    </WorldContext.Provider>
  );
}
