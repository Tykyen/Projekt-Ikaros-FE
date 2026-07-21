import { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, Outlet, Link, useParams, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import {
  NewPageWizardModal,
  type NewPageChoice,
} from '@/features/world/pages/PageEditor/components/NewPageWizardModal';
import { WorldSearchModal } from '@/features/world/search/components/WorldSearchModal';
import { ChatNavLink } from '@/features/world/chat/components/ChatNavLink/ChatNavLink';
import { useAtomValue, useSetAtom } from 'jotai';
import clsx from 'clsx';
import s from './WorldLayout.module.css';
import { WorldContext, type WorldContextValue, type WorldCharacterSlot } from '@/features/world/context/WorldContext';
import { useWorld } from '@/features/world/api/useWorlds';
import { useWorldSocket } from '@/features/world/hooks/useWorldSocket';
import { useWorldStatus } from '@/features/world/api/useWorldStatus';
import { useCharacterDirectory } from '@/features/world/pages/api/useCharacterDirectory';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole, WorldRole } from '@/shared/types';
import { UserAvatar, useFocusTrap } from '@/shared/ui';
import {
  themeAtom,
  worldThemePreviewAtom,
  worldThemeActiveAtom,
} from '../../../themes/state';
import { getTheme } from '../../../themes/registry';
import { applyTheme } from '../../../themes/applyTheme';
import { resolveWorldTheme } from '../../../themes/worldTheme';
import { MatrixRain } from '../../../themes/effects/MatrixRain';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { usePagesDirectory } from '@/features/world/pages/api/usePagesDirectory';
import { buildFullWorldNav } from '@/features/world/lib/worldNavConfig';
import type { NavNode, NavLinkItem } from '@/features/world/lib/headlineNav';
import { WorldNotFound } from '@/features/world/components/WorldNotFound';
import { AdminElevationToggle } from '@/features/world/components/AdminElevationToggle';
import { LastInfoBar } from '@/features/world/components/LastInfoBar';
import { ShowcaseBar } from '@/features/world/components/ShowcaseBar/ShowcaseBar';
import { WorldRequestsBell } from '@/features/world/components/WorldRequests';
import { resolvePersona } from './resolvePersona';
import { usePageViewPing } from '@/shared/analytics/usePageViewPing';
import { WorldVoiceHost } from '@/features/voice/components/WorldVoiceHost';
import { VypravecRoot } from '@/shared/vypravec/ui/VypravecRoot';

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
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    // 17.8 — Escape zavře dropdown a vrátí fokus na spouštěč (klávesnice).
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
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
        ref={btnRef}
        className={clsx(s.navLink, open && s.navLinkActive)}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {group.label}
        <span className={clsx(s.chevron, open && s.chevronOpen)} aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className={s.dropdown} role="menu">
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
  // 17.8 — mobilní drawer světa: focus trap + navrácení fokusu na hamburger
  // (dřív chyběl i Escape). `inert` + dialog role viz JSX drawer níže.
  const worldDrawerRef = useRef<HTMLDivElement>(null);
  // Dvouřádková hlavička (topbar): měříme reálnou výšku a publikujeme ji jako
  // `--world-header-h` na shellu (viz efekt níže).
  const headerRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  useFocusTrap({ active: drawerOpen, containerRef: worldDrawerRef });
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);
  // 9.1 — wizard pro tvorbu nového obsahu (Wiki / PC / NPC).
  const [wizardOpen, setWizardOpen] = useState(false);
  // 15.11 — wizard v režimu „hráč navrhuje" (whitelist typy → pending).
  const [proposeMode, setProposeMode] = useState(false);
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
    // 15.11 — propose whitelist typy (Lokace/Galerie/Rodokmen) + PC/NPC/wiki.
    const typeParam =
      choice === 'pc'
        ? '?type=PostavaHrace'
        : choice === 'npc'
          ? '?type=NPC'
          : choice === 'lokace'
            ? '?type=Lokace'
            : choice === 'galerie'
              ? '?type=Galerie'
              : choice === 'rodokmen'
                ? '?type=Rodokmen'
                : choice === 'frakce'
                  ? '?type=Frakce'
                  : choice === 'organizace'
                    ? '?type=Organizace'
                    : choice === 'stat'
                      ? '?type=Stat'
                      : '';
    navigate(`${base}${typeParam}`);
  }
  const currentUser = useAtomValue(currentUserAtom);
  const { data: world, isLoading } = useWorld(worldSlug);
  // Reálné ObjectId — pro membership lookup i BE volání downstream.
  const realWorldId = world?.id ?? '';

  // W-9 — world-level real-time (world:updated/deleted/membership). Jediný
  // vlastník `world:{id}` roomu pro celý svět; drží i reconnect re-join.
  useWorldSocket(realWorldId || null);

  // 15B.7 — page-view ping pro analytics (world routy; Ikaros routy = IkarosLayout).
  usePageViewPing();

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
  // Elevation — platform admin má world pravomoci JEN když je v tomto světě
  // „nahozený" (world.elevated z BE). `isPlatformAdmin` je jen pro zobrazení
  // toggle zámku (kdo SMÍ elevovat), ne pro samotné pravomoci.
  const isElevatedHere = world?.elevated === true;
  const isPlatformAdmin =
    currentUser?.role !== undefined && currentUser.role <= UserRole.Admin;
  // 10.2l — PJ flag pro nav: owner / elevated admin / world membership PomocnyPJ+.
  const isPJForNav =
    world?.ownerId === currentUser?.id ||
    isElevatedHere ||
    (membership?.role ?? -1) >= WorldRole.PomocnyPJ;
  // N-04/05 — nav položku ukaž jen když na ni uživatel reálně dosáhne (parita
  // s route guardem: owner + elevated admin bypass, jinak membership >= min role).
  const navBypass = world?.ownerId === currentUser?.id || isElevatedHere;
  const navRole = membership?.role ?? -1;
  const { data: settings } = useWorldSettings(realWorldId);
  // D-NEW-INV-WIKI — slugy existujících stránek pro skrytí mrtvých referenčních
  // odkazů (magicky-system/technologie). `isPlaceholderData` → directory ještě
  // nenačtené (hook vrací `[]`, ne undefined) → předej undefined = ukaž vše,
  // ať odkazy neproblikávají před načtením.
  const { data: pagesDir = [], isPlaceholderData: pagesDirPlaceholder } =
    usePagesDirectory(realWorldId);
  const existingPageSlugs = useMemo(
    () =>
      pagesDirPlaceholder
        ? undefined
        : new Set(pagesDir.map((p) => p.slug)),
    [pagesDirPlaceholder, pagesDir],
  );
  const nav = useMemo(
    () =>
      buildFullWorldNav(
        worldSlug,
        isPJForNav,
        settings?.hiddenNavItems,
        settings?.customHeadline,
        settings?.customGroups,
        (min) => navBypass || navRole >= min,
        existingPageSlugs,
      ),
    [
      worldSlug,
      isPJForNav,
      navBypass,
      navRole,
      settings?.hiddenNavItems,
      settings?.customHeadline,
      settings?.customGroups,
      existingPageSlugs,
    ],
  );

  // N-16 — isPJ musí (stejně jako isPJForNav) zahrnout world membership
  // PomocnyPJ+, jinak ne-owner PomocnyPJ viděl isPJ=false a mizelo mu PJ UI
  // (tlačítko „Nová stránka", editace). Elevated admin = plné PJ UI.
  const isPJ =
    world?.ownerId === currentUser?.id ||
    isElevatedHere ||
    (membership?.role ?? -1) >= WorldRole.PomocnyPJ;
  // Full nav pustí člena světa NEBO elevovaného admina (de-elevated admin vidí
  // jen shell + toggle, ne nav — jako nečlen).
  const isGlobalAdmin = isElevatedHere;

  // Spec 5.1 — loading shellu: header skeleton, dokud world + status nedoběhnou.
  const loading = isLoading || statusLoading;

  // Spec 2.4 — full nav jen pro membery (libovolná role 0–5) nebo globální adminy.
  // Spec 5.1 — když world chybí (404 / private bez přístupu), nav se nesmí
  // renderovat ani globálnímu adminovi; tělo ukáže `WorldNotFound`.
  const showFullNav =
    !!world && !loading && (status === 'member' || isGlobalAdmin);
  // 22.4 vitrína — anonym/nečlen na světě s veřejným nahlížením dostane
  // redukovanou lištu vitrínových sekcí (místo plné member navigace).
  const showShowcaseBar =
    !!world && !loading && !showFullNav && world.publicShowcase === true;

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
  // 5.9b — člen si může pro sebe zvolit vlastní motiv + pozadí (uloženo na jeho
  // membership, nikdy ve World). Když má vlastní motiv ≠ svět, jeho vrstva je
  // SAMOSTATNÁ: PJ overrides/pozadí (laděné pro skin světa) se na cizí skin
  // nevztáhnou. Bez vlastního motivu jen vrší své úpravy nad sdíleným (jako 5.9).
  const memberThemeId = membership?.themeId || undefined;
  const memberBg = membership?.themeBackgroundUrl || undefined;
  const usingMemberMotif = !!memberThemeId && memberThemeId !== resolved.themeId;

  const themeId = preview?.themeId ?? memberThemeId ?? resolved.themeId;

  // Krok 5.9 — uživatelské overrides člena se vrší nad sdílené (PJ); u vlastního
  // motivu (5.9b) jen vlastní overrides.
  const memberOverrides = usingMemberMotif
    ? (membership?.themeUserOverrides ?? {})
    : membership?.themeUserOverrides
      ? { ...resolved.overrides, ...membership.themeUserOverrides }
      : resolved.overrides;
  // 5.9b — vlastní pozadí přebíjí svět; u vlastního motivu bez vlastního pozadí
  // padne na default zvoleného skinu (`backgroundUrl` undefined → theme.background).
  const memberBackground = usingMemberMotif
    ? memberBg
    : (memberBg ?? resolved.backgroundUrl);

  const overrides = preview ? preview.overrides : memberOverrides;
  const backgroundUrl = preview ? preview.backgroundUrl : memberBackground;
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

  // `:root` po dobu existence světa vlastní WorldLayout — `ThemeProvider`
  // globální `applyTheme` přeskočí (jinak by ho race po opuštění profilu
  // přepsal globálním motivem, viz worldThemeActiveAtom).
  const setWorldThemeActive = useSetAtom(worldThemeActiveAtom);
  useEffect(() => {
    setWorldThemeActive(true);
    return () => setWorldThemeActive(false);
  }, [setWorldThemeActive]);

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

  // Topbar — reálná výška dvouřádkové hlavičky → `--world-header-h` na shellu.
  // Chat / taktická mapa / sticky TOC uvnitř světa počítají výšku z ní (fallback
  // `--header-h` mimo svět), takže druhý řádek (ani zalomení dlouhého názvu) je
  // nerozhodí. ResizeObserver drží hodnotu i při změně obsahu / resize.
  useEffect(() => {
    const header = headerRef.current;
    const shell = shellRef.current;
    // jsdom (testy) ResizeObserver nemá → no-op; downstream fallbackne na --header-h.
    if (!header || !shell || typeof ResizeObserver === 'undefined') return;
    const sync = () =>
      shell.style.setProperty('--world-header-h', `${header.offsetHeight}px`);
    const ro = new ResizeObserver(sync);
    ro.observe(header);
    sync();
    return () => ro.disconnect();
  }, []);

  // 6.8-followup / 5.1 — persona slot headeru. Vedení (PJ/Pomocný PJ) → role +
  // persona avatar (klik → deník PJ); hráč s postavou → postava (klik → profil);
  // jinak username (neklik). Větvení drží `resolvePersona` (čistý, testovatelný).
  const persona = resolvePersona({
    worldSlug,
    role: (membership?.role ?? null) as WorldRole | null,
    character: ctxValue.character,
    pjPersonaAvatarUrl: membership?.pjPersonaAvatarUrl,
    pjMode: settings?.pjChatPersona?.mode ?? 'unified',
    sharedPjAvatar: settings?.pjChatPersona?.avatarUrl ?? null,
    account: {
      username: currentUser?.username,
      avatarUrl: currentUser?.profileImageUrl ?? currentUser?.avatarUrl ?? null,
    },
  });

  return (
    <WorldContext.Provider value={ctxValue}>
      <div
        ref={shellRef}
        className={s.shell}
        data-theme={themeId}
        data-world-shell
        style={bgStyle}
      >
        {/* Spec 5.7a — JS canvas efekt skinu (Matrix rain u `ikaros`) */}
        {theme.effect === 'matrix-rain' && <MatrixRain />}
        <header className={s.header} ref={headerRef}>
          {/* ── Řádek 1 — titulek světa + utility (hledání, akce, persona) ── */}
          <div className={s.topRow}>
            {/* EXIT — funkční i během loadingu / 404 */}
            <Link to="/" className={s.exitBtn}>EXIT</Link>

            {loading ? (
              /* Spec 5.1 — header skeleton během načítání světa */
              <>
                <span className={clsx(s.skeletonBlock, s.skeletonName)} aria-hidden="true" />
                <span className={clsx(s.skeletonBlock, s.skeletonBadge)} aria-hidden="true" />
              </>
            ) : (
              /* Název světa — accessMode + genre badge přesunuty na úvodní
                 stránku světa (duplikovaly se v hederu, 2026-05-25). */
              <Link
                to={`/svet/${worldSlug}`}
                className={s.worldName}
                title={world?.name ?? 'Svět nenalezen'}
              >
                {world?.name ?? 'Svět nenalezen'}
              </Link>
            )}

            {/* Elevation toggle — pro platform admina i MIMO full nav, aby se mohl
                „nahodit" i ve světě, kde není člen (de-elevated vidí jen shell). */}
            {!loading && isPlatformAdmin && world && (
              <AdminElevationToggle worldId={world.id} elevated={isElevatedHere} />
            )}

            {/* Utility vpravo (hledání, +Nová, pošta, ⚙, persona) — jen membeři /
                globální admini; `margin-left:auto` je drží u pravé hrany. */}
            {showFullNav && (
              <>
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
                  {/* 15.10 — zvoneček „ke zpracování" (žádosti o vstup); jen PJ/co-PJ. */}
                  {isPJ && (
                    <WorldRequestsBell
                      worldId={realWorldId}
                      worldSlug={worldSlug}
                    />
                  )}
                  {isPJ && (
                    <button
                      type="button"
                      onClick={() => {
                        setProposeMode(false);
                        setWizardOpen(true);
                      }}
                      className={s.newPageBtn}
                    >
                      + Nová stránka
                    </button>
                  )}
                  {/* 15.11 — hráč (Hráč+) navrhne obsah ke schválení PJ. */}
                  {!isPJ && navRole >= WorldRole.Hrac && (
                    <button
                      type="button"
                      onClick={() => {
                        setProposeMode(true);
                        setWizardOpen(true);
                      }}
                      className={s.newPageBtn}
                      title="Navrhnout NPC, lokaci nebo stránku — schválí PJ"
                    >
                      + Navrhnout
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
                  {/* ≤768px: ⚙ ustupuje searchi (s.settingsBtn skryto), nastavení
                      je dostupné z draweru — viz drawer níže. */}
                  <Link
                    to={`/svet/${worldSlug}/nastaveni`}
                    className={clsx(s.actionBtn, s.settingsBtn)}
                    title="Nastavení světa"
                  >
                    ⚙
                  </Link>

                  {/* 6.8-followup — persona slot: postava (klik→profil) / vedení
                      (klik→deník PJ) / username (neklik). */}
                  {persona.to ? (
                    <Link
                      to={persona.to}
                      className={clsx(s.persona, s.personaLink)}
                      title={persona.name}
                    >
                      <UserAvatar
                        src={persona.avatarUrl}
                        defaultType={currentUser?.defaultAvatarType}
                        size="sm"
                        alt={persona.name}
                      />
                      <span className={s.personaName}>{persona.name}</span>
                    </Link>
                  ) : (
                    <div className={s.persona} title={persona.name}>
                      <UserAvatar
                        src={persona.avatarUrl}
                        defaultType={currentUser?.defaultAvatarType}
                        size="sm"
                        alt={persona.name}
                      />
                      <span className={s.personaName}>{persona.name}</span>
                    </div>
                  )}
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
          </div>

          {/* ── Řádek 2 — navigační lišta (Chat + Informace/Svět/Hra/Kalendář).
              Jen ≥1200px; níž Chat i nav přebírá hamburger (.navRow media query),
              takže druhý řádek na mobilu odpadá. ── */}
          {showFullNav && (
            <div className={s.navRow}>
              {/* Tester-feedback — chat byl přehlížený (chyběl v nav). Zvýrazněný
                  vstup jako PRVNÍ položka nav lišty, accent pill + unread badge. */}
              {realWorldId && (
                <ChatNavLink
                  variant="bar"
                  worldSlug={worldSlug}
                  worldId={realWorldId}
                />
              )}
              <nav className={s.nav}>
                {nav.map((group) => (
                  <NavDropdown
                    key={group.label}
                    group={group}
                    onClose={() => {}}
                  />
                ))}
              </nav>
            </div>
          )}
        </header>

        {/* 12.2 — „Last info" proužek (oznámení PJ) pod hlavičkou, jen pro membery */}
        {showFullNav && (
          <LastInfoBar worldId={realWorldId} lastInfo={settings?.lastInfo} />
        )}

        {/* 22.4 — vitrínová lišta pro anonyma/nečlena (veřejné nahlížení). */}
        {showShowcaseBar && <ShowcaseBar worldSlug={worldSlug} />}

        {/* Mobile drawer (zprava) — jen pro membery */}
        {showFullNav && (
          <>
            {/* Klikací backdrop zavírá drawer; klávesová cesta existuje (Esc /
                focus trap draweru), overlay nemusí být fokusovatelný. */}
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
            <div
              className={clsx(s.drawerBackdrop, drawerOpen && s.drawerBackdropOpen)}
              onClick={() => setDrawerOpen(false)}
            />
            <div
              ref={worldDrawerRef}
              tabIndex={-1}
              inert={!drawerOpen}
              role="dialog"
              aria-modal="true"
              aria-label="Menu světa"
              className={clsx(s.drawer, drawerOpen && s.drawerOpen)}
            >
              {/* Tester-feedback — zvýrazněný chat jako první položka draweru. */}
              {realWorldId && (
                <ChatNavLink
                  variant="drawer"
                  worldSlug={worldSlug}
                  worldId={realWorldId}
                  onClick={() => setDrawerOpen(false)}
                />
              )}
              {/* Nastavení světa — v draweru JEN na mobilu (≤768), kde ⚙ ustoupilo
                  z headeru searchi. Nad 768px je ⚙ v headeru → tady skryto
                  (s.drawerSettingsOnly), ať se nedubluje. Taby uvnitř gatuje role. */}
              <div className={clsx(s.drawerSection, s.drawerSettingsOnly)}>
                <Link
                  to={`/svet/${worldSlug}/nastaveni`}
                  className={s.drawerLink}
                  onClick={() => setDrawerOpen(false)}
                >
                  ⚙ Nastavení světa
                </Link>
              </div>
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
          onClose={() => {
            setWizardOpen(false);
            setProposeMode(false);
          }}
          onChoose={handleWizardChoice}
          canUseBestiary={isPJ}
          proposeMode={proposeMode}
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

        {/* 17.6 — hlasový hovor světa; hostuje se tu (mimo Outlet), aby přežil
            přechod mapa↔chat. Zobrazí se jen když je session aktivní. */}
        {realWorldId && <WorldVoiceHost />}

        {/* Spec 26.1/26.2 — Vypravěč (Joe): kotva FAB, world scope + role pro
            role-aware hlavičku „Kde jsem". */}
        <VypravecRoot
          scope="world"
          world={{
            name: world?.name,
            userRole: (membership?.role ?? null) as WorldRole | null,
            isPJ,
          }}
        />
      </div>
    </WorldContext.Provider>
  );
}
