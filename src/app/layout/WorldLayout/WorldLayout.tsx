import { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, Outlet, Link, useParams, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import {
  NewPageWizardModal,
  type NewPageChoice,
} from '@/features/world/pages/PageEditor/components/NewPageWizardModal';
import { WorldSearchModal } from '@/features/world/search/components/WorldSearchModal';
import { useAtomValue } from 'jotai';
import clsx from 'clsx';
import s from './WorldLayout.module.css';
import { WorldContext, type WorldContextValue, type WorldCharacterSlot } from '@/features/world/context/WorldContext';
import { useWorld } from '@/features/world/api/useWorlds';
import { useWorldStatus } from '@/features/world/api/useWorldStatus';
import { useCharacterDirectory } from '@/features/world/pages/api/useCharacterDirectory';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole, WorldRole } from '@/shared/types';
import { UserAvatar } from '@/shared/ui';
import { themeAtom, worldThemePreviewAtom } from '../../../themes/state';
import { getTheme } from '../../../themes/registry';
import { applyTheme } from '../../../themes/applyTheme';
import { resolveWorldTheme } from '../../../themes/worldTheme';
import { MatrixRain } from '../../../themes/effects/MatrixRain';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { buildFullWorldNav } from '@/features/world/lib/worldNavConfig';
import type { NavNode, NavLinkItem } from '@/features/world/lib/headlineNav';
import { WorldNotFound } from '@/features/world/components/WorldNotFound';
import { LastInfoBar } from '@/features/world/components/LastInfoBar';

/* ── Nav ── */
// Systémová nav + filtrace + vlastní headline (12.2) žijí v `worldNavConfig.ts`
// (SSOT sdílený s náhledem na `/admin/headline`). `NavNode` = render tvar.

/* ── Rozbalovací položka uvnitř dropdownu (12.3 — „Skupiny") ── */
function DropdownAccordion({
  item,
  onPick,
}: {
  item: NavLinkItem;
  onPick: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.subGroup}>
      <button
        type="button"
        className={clsx(s.dropdownItem, s.subToggle)}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {item.label}
        <span className={clsx(s.chevron, open && s.chevronOpen)}>▾</span>
      </button>
      {open &&
        (item.children ?? []).map((child) => (
          <NavLink
            key={child.to}
            to={child.to ?? '#'}
            className={clsx(s.dropdownItem, s.dropdownSubItem)}
            onClick={onPick}
          >
            {child.label}
          </NavLink>
        ))}
    </div>
  );
}

/* ── Sbalovací sekce mobilního draweru (Informace / Svět / Hra) ── */
function DrawerSection({
  group,
  onNavigate,
}: {
  group: Extract<NavNode, { items: ReadonlyArray<NavLinkItem> }>;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.drawerSection}>
      <button
        type="button"
        className={s.drawerSectionToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {group.label}
        <span className={clsx(s.chevron, open && s.chevronOpen)}>▾</span>
      </button>
      {open &&
        group.items.map((item) =>
          item.children ? (
            <DrawerSubGroup
              key={item.label}
              item={item}
              onNavigate={onNavigate}
            />
          ) : (
            <NavLink
              key={item.to}
              to={item.to ?? '#'}
              className={s.drawerLink}
              onClick={onNavigate}
            >
              {item.label}
              {item.external && (
                <span className={s.externalIcon} aria-label="otevře mimo svět">↗</span>
              )}
            </NavLink>
          ),
        )}
    </div>
  );
}

/* ── Rozbalovací „Skupiny" v mobilním draweru (12.3) ── */
function DrawerSubGroup({
  item,
  onNavigate,
}: {
  item: NavLinkItem;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.drawerSubGroup}>
      <button
        type="button"
        className={clsx(s.drawerLink, s.drawerSubToggle)}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {item.label}
        <span className={clsx(s.chevron, open && s.chevronOpen)}>▾</span>
      </button>
      {open &&
        (item.children ?? []).map((child) => (
          <NavLink
            key={child.to}
            to={child.to ?? '#'}
            className={clsx(s.drawerLink, s.drawerSubLink)}
            onClick={onNavigate}
          >
            {child.label}
          </NavLink>
        ))}
    </div>
  );
}

/* ── Dropdown komponenta ── */
function NavDropdown({ group, onClose }: { group: NavNode; onClose: () => void }) {
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
          {(group.items ?? []).map((item) =>
            item.children ? (
              <DropdownAccordion
                key={item.label}
                item={item}
                onPick={() => { setOpen(false); onClose(); }}
              />
            ) : (
              <NavLink
                key={item.to}
                to={item.to ?? '#'}
                className={s.dropdownItem}
                onClick={() => { setOpen(false); onClose(); }}
              >
                {item.label}
                {item.external && (
                  <span className={s.externalIcon} aria-label="otevře mimo svět">↗</span>
                )}
              </NavLink>
            ),
          )}
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
  // 9.1 — wizard pro tvorbu nového obsahu (Wiki / PC / NPC).
  const [wizardOpen, setWizardOpen] = useState(false);
  // 13.1 — vyhledávací modal světa (otevírá pole „Hledat…" i Ctrl/Cmd+K).
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  function handleWizardChoice(choice: NewPageChoice) {
    setWizardOpen(false);
    setDrawerOpen(false);
    // NPC z bestiáře navádí na Bestiář světa, kde PJ vytvoří/upraví bestie
    // a odtud je spawnuje na taktickou mapu.
    if (choice === 'npc-bestiary') {
      navigate(`/svet/${worldSlug}/bestiar`);
      return;
    }
    const base = `/svet/${worldSlug}/nova-stranka`;
    const typeParam =
      choice === 'pc'
        ? '?type=PostavaHrace'
        : choice === 'npc'
          ? '?type=NPC'
          : '';
    navigate(`${base}${typeParam}`);
  }
  const currentUser = useAtomValue(currentUserAtom);
  const { data: world, isLoading } = useWorld(worldSlug);
  // Reálné ObjectId — pro membership lookup i BE volání downstream.
  const realWorldId = world?.id ?? '';

  // 13.1 — Ctrl/Cmd+K otevře vyhledávání světa (jen když je svět načtený).
  useEffect(() => {
    if (!realWorldId) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [realWorldId]);
  const { status, membership, isLoading: statusLoading } =
    useWorldStatus(realWorldId);
  // 8.3 — directory pro naplnění `character` slotu (jméno + avatar postavy
  // přihlášeného člena). Sdílí cache s CharactersPage; žádný extra endpoint.
  const { data: directory } = useCharacterDirectory(realWorldId);
  // 10.2l — PJ flag pro nav: owner / globální Admin+ / world membership
  // PomocnyPJ+. Dřív chyběl membership → ne-owner PJ neviděl PJ-only položky.
  const isPJForNav =
    world?.ownerId === currentUser?.id ||
    (currentUser?.role !== undefined && currentUser.role <= 3) ||
    (membership?.role ?? -1) >= WorldRole.PomocnyPJ;
  const { data: settings } = useWorldSettings(realWorldId);
  const nav = useMemo(
    () =>
      buildFullWorldNav(
        worldSlug,
        isPJForNav,
        settings?.hiddenNavItems,
        settings?.customHeadline,
        settings?.customGroups,
      ),
    [
      worldSlug,
      isPJForNav,
      settings?.hiddenNavItems,
      settings?.customHeadline,
      settings?.customGroups,
    ],
  );

  // N-16 — isPJ musí (stejně jako isPJForNav) zahrnout world membership
  // PomocnyPJ+, jinak ne-owner PomocnyPJ viděl isPJ=false a mizelo mu PJ UI
  // (tlačítko „Nová stránka", editace).
  const isPJ =
    world?.ownerId === currentUser?.id ||
    (currentUser?.role !== undefined && currentUser.role <= 3) || // Admin, PJ, Superadmin
    (membership?.role ?? -1) >= WorldRole.PomocnyPJ;
  const isGlobalAdmin =
    currentUser?.role !== undefined && currentUser.role <= UserRole.Admin;

  // Spec 5.1 — loading shellu: header skeleton, dokud world + status nedoběhnou.
  const loading = isLoading || statusLoading;

  // Spec 2.4 — full nav jen pro membery (libovolná role 0–5) nebo globální adminy.
  // Spec 5.1 — když world chybí (404 / private bez přístupu), nav se nesmí
  // renderovat ani globálnímu adminovi; tělo ukáže `WorldNotFound`.
  const showFullNav =
    !!world && !loading && (status === 'member' || isGlobalAdmin);

  // 8.3 — slot „moje postava" ve světě. Najde entry v directory dle
  // membership.characterPath; pokud chybí (žádná postava / smazaná postava),
  // slot zůstane null a header fallbackuje na účet (řádky 201–209).
  const characterSlot = useMemo<WorldCharacterSlot | null>(() => {
    const path = membership?.characterPath;
    if (!path || !directory) return null;
    const entry = directory.find((e) => e.slug === path);
    if (!entry) return null;
    // World-scoped avatar = obrázek postavy ve světě (directory nese imageUrl).
    // Když postava obrázek nemá, header fallbackuje na globální účet (řádek ~345).
    return {
      characterPath: entry.slug,
      name: entry.name,
      avatarUrl: entry.imageUrl,
    };
  }, [membership, directory]);

  const ctxValue = useMemo<WorldContextValue>(
    () => ({
      worldId: realWorldId,
      worldSlug,
      world: world ?? null,
      isPJ,
      userRole: (membership?.role ?? null) as WorldRole | null,
      // 8.3 — aktivní postava člena (jméno + avatar). null = bez postavy
      // (členové bez přiřazení nebo non-member adminové).
      character: characterSlot,
      loading,
    }),
    [realWorldId, worldSlug, world, isPJ, membership, characterSlot, loading],
  );

  // Spec 5.0 — světový theme. `.shell` vykresluje motiv světa; po vstupu se
  // přepne globální `:root` (kvůli portálům — modaly mimo `.shell`), EXIT obnoví.
  // Krok 5.7b — editor vzhledu publikuje náhled; má přednost před `World`.
  const preview = useAtomValue(worldThemePreviewAtom);
  const resolved = resolveWorldTheme(world ?? null);
  const themeId = preview?.themeId ?? resolved.themeId;
  // Krok 5.9 — uživatelské overrides člena se vrší nad sdílené (PJ).
  const sharedOverrides = membership?.themeUserOverrides
    ? { ...resolved.overrides, ...membership.themeUserOverrides }
    : resolved.overrides;
  const overrides = preview ? preview.overrides : sharedOverrides;
  const backgroundUrl = preview ? preview.backgroundUrl : resolved.backgroundUrl;
  // Krok 5.9 — jas / kontrast (přístupnost) přes filter na obsahové vrstvě.
  const adjust = preview ? preview.adjust : membership?.themeAdjust;
  const mainStyle =
    adjust && (adjust.brightness != null || adjust.contrast != null)
      ? {
          filter: `brightness(${adjust.brightness ?? 1}) contrast(${
            adjust.contrast ?? 1
          })`,
        }
      : undefined;
  const theme = getTheme(themeId);
  // `||` (ne `??`) — prázdný `themeBackgroundUrl` ('') musí padnout na
  // pozadí skinu, jinak svět zůstane bez obrázku (krok 5.7a).
  const bg = (backgroundUrl && backgroundUrl.trim()) || theme.background;
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
      <div
        className={s.shell}
        data-theme={themeId}
        data-world-shell
        style={bgStyle}
      >
        {/* Spec 5.7a — JS canvas efekt skinu (Matrix rain u `ikaros`) */}
        {theme.effect === 'matrix-rain' && <MatrixRain />}
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
              {/* Název světa — accessMode + genre badge přesunuty na úvodní
                  stránku světa (duplikovaly se v hederu, 2026-05-25). */}
              <Link to={`/svet/${worldSlug}`} className={s.worldName}>
                {world?.name ?? 'Svět nenalezen'}
              </Link>
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
                {/* 13.1 — desktop: plné pole; ≤1024px: kompaktní lupa */}
                <button
                  type="button"
                  className={s.searchBar}
                  onClick={() => setSearchOpen(true)}
                >
                  <Search size={16} aria-hidden="true" />
                  <span className={s.searchBarText}>Hledat…</span>
                  <kbd className={s.searchKbd}>Ctrl K</kbd>
                </button>
                <button
                  type="button"
                  className={clsx(s.actionBtn, s.searchIconBtn)}
                  onClick={() => setSearchOpen(true)}
                  title="Hledat"
                  aria-label="Hledat"
                >
                  <Search size={16} aria-hidden="true" />
                </button>
                {isPJ && (
                  <button
                    type="button"
                    onClick={() => setWizardOpen(true)}
                    className={s.newPageBtn}
                  >
                    + Nová stránka
                  </button>
                )}
                <Link
                  to="/ikaros/posta"
                  className={s.actionBtn}
                  title="Pošta"
                >
                  ✉
                </Link>

                {/* Krok 5.7a — vstup do Nastavení světa (vč. tab Vzhled);
                    viditelnost tabů uvnitř gatuje role */}
                <Link
                  to={`/svet/${worldSlug}/nastaveni`}
                  className={s.actionBtn}
                  title="Nastavení světa"
                >
                  ⚙
                </Link>

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

        {/* 12.2 — „Last info" proužek (oznámení PJ) pod hlavičkou, jen pro membery */}
        {showFullNav && (
          <LastInfoBar worldId={realWorldId} lastInfo={settings?.lastInfo} />
        )}

        {/* Mobile drawer (zprava) — jen pro membery */}
        {showFullNav && (
          <>
            <div
              className={clsx(s.drawerBackdrop, drawerOpen && s.drawerBackdropOpen)}
              onClick={() => setDrawerOpen(false)}
            />
            <div className={clsx(s.drawer, drawerOpen && s.drawerOpen)}>
              {/* 13.1 — hledání v draweru (na mobilu není lupa v headeru) */}
              <button
                type="button"
                className={s.drawerSearch}
                onClick={() => {
                  setDrawerOpen(false);
                  setSearchOpen(true);
                }}
              >
                <Search size={16} aria-hidden="true" />
                Hledat ve světě
              </button>
              {isPJ && (
                <button
                  type="button"
                  className={s.drawerNewPage}
                  onClick={() => {
                    setDrawerOpen(false);
                    setWizardOpen(true);
                  }}
                >
                  + Nová stránka
                </button>
              )}
              {nav.map((group) =>
                group.items ? (
                  // 12.3 — celá sekce (Informace / Svět / Hra) = sbalovací accordion.
                  <DrawerSection
                    key={group.label}
                    group={group}
                    onNavigate={() => setDrawerOpen(false)}
                  />
                ) : (
                  <div key={group.label} className={s.drawerSection}>
                    <NavLink
                      to={group.to}
                      className={s.drawerLink}
                      onClick={() => setDrawerOpen(false)}
                    >
                      {group.label}
                    </NavLink>
                  </div>
                ),
              )}
            </div>
          </>
        )}

        <main className={s.main} style={mainStyle}>
          {/* Spec 5.1 — když svět po načtení chybí (404 / private bez přístupu),
              tělo ukáže WorldNotFound místo Outletu. Bez toho dílčí stránky
              (např. taktická mapa) renderovaly svůj obsah nad neexistujícím
              světem — hlavička „Svět nenalezen", ale tělo PJ empty state. */}
          {!loading && !world ? <WorldNotFound /> : <Outlet />}
        </main>

        {/* 9.1 — wizard pro tvorbu nového obsahu (Wiki / PC / NPC). */}
        <NewPageWizardModal
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onChoose={handleWizardChoice}
          canUseBestiary={isPJ}
        />

        {/* 13.1 — vyhledávání stránek světa (worldId filtr = izolace světů).
            Mountuje se až při otevření → search hooky neběží zbytečně. */}
        {realWorldId && searchOpen && (
          <WorldSearchModal
            open
            onClose={() => setSearchOpen(false)}
            worldId={realWorldId}
            worldSlug={worldSlug}
          />
        )}
      </div>
    </WorldContext.Provider>
  );
}
