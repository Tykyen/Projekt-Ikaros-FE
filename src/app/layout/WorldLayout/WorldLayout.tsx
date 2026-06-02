import { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, Outlet, Link, useParams, useNavigate } from 'react-router-dom';
import {
  NewPageWizardModal,
  type NewPageChoice,
} from '@/features/world/pages/PageEditor/components/NewPageWizardModal';
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
import { isNavItemHidden } from '@/features/world/lib/worldNavConfig';
import { WorldNotFound } from '@/features/world/components/WorldNotFound';

/* ── Nav definice ── */
// `id` na items = klíč pro `WorldSettings.hiddenNavItems` filter (9.3-followup).
// Esenciální (Přehled/Stránky/Novinky/Pravidla) `id` mít nemusí — beztak nelze
// skrýt (`HIDEABLE_NAV_IDS` whitelist v `worldNavConfig.ts`).
function buildNav(worldSlug: string, isPJ: boolean) {
  const b = `/svet/${worldSlug}`;
  return [
    {
      label: 'Informace',
      items: [
        { label: 'Přehled', to: b },
        { label: 'Novinky', to: `${b}/novinky` },
        { label: 'Pravidla', to: `${b}/pravidla` },
      ],
    },
    {
      // 9.x — „Svět" je obsah světa (stránky + historie + místa + ekonomika + vztahy).
      label: 'Svět',
      items: [
        { label: 'Stránky', to: `${b}/stranky` },
        { id: 'timeline', label: 'Časová osa', to: `${b}/timeline` },
        { id: 'mapa', label: 'Mapa vesmíru', to: `${b}/mapa` },
        { id: 'pavucina', label: 'Pavučina', to: `${b}/pavucina` },
        { id: 'obchod', label: 'Obchod', to: `${b}/obchod` },
      ],
    },
    {
      // 9.x — „Hra" je aktivní použití u stolu (souboj, scéna, pomůcky).
      // Skupiny vyhozeny (stub, duplikuje 5.3 Členové). NPC šablony /
      // Šablona deníku / Kalendáře přesunuty do ⚙ Nastavení tabů.
      label: 'Hra',
      items: [
        { id: 'takticka-mapa', label: 'Taktická mapa', to: `${b}/takticka-mapa` },
        // 10.2l — deník PJ mimo mapu. PJ-only (hráč ho v menu nevidí).
        ...(isPJ
          ? ([{ id: 'denik-pj', label: 'Deník PJ', to: `${b}/denik-pj` }] as const)
          : ([] as const)),
        { id: 'bestiar', label: 'Bestiář', to: `${b}/bestiar` },
        // 11.2 — Storyboard je PJ-nástroj (PJ + PomocnyPJ); hráč ho v menu nevidí.
        ...(isPJ
          ? ([{ id: 'scenare', label: 'Storyboard', to: `${b}/scenare` }] as const)
          : ([] as const)),
        { id: 'pocasi', label: 'Generátor počasí', to: `${b}/pocasi` },
        { id: 'prevodnik-men', label: 'Převodník měn', to: `${b}/prevodnik-men` },
        { id: 'zvuky', label: 'Zvuková databáze', to: `${b}/zvuky` },
        // Globální route — vede mimo svět (vizuálně označeno ↗).
        { id: 'dungeon-builder', label: 'Tvorba podzemí', to: `/admin/dungeon-builder`, external: true },
      ],
    },
    { id: 'kalendar', label: 'Kalendář', to: `${b}/kalendar` },
  ] as const;
}

/**
 * 9.3-followup — odfiltruje skryté položky podle `WorldSettings.hiddenNavItems`.
 * Group s prázdnými `items` po filtru se vyřadí (skryje celý dropdown).
 * Esenciální items (bez `id`) projdou vždy.
 */
function filterNavByHidden(
  nav: ReturnType<typeof buildNav>,
  hiddenNavItems: readonly string[] | undefined,
) {
  return nav
    .map((group) => {
      if (!('items' in group)) {
        // Top-level (Kalendář) — skryt pokud match.
        return isNavItemHidden(
          (group as { id?: string }).id,
          hiddenNavItems,
        )
          ? null
          : group;
      }
      const items = group.items.filter(
        (item) =>
          !isNavItemHidden((item as { id?: string }).id, hiddenNavItems),
      );
      if (items.length === 0) return null;
      return { ...group, items };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);
}

// NavGroup widened (items = ReadonlyArray, ne tuple) — drží shape z buildNav
// ale snese .filter/.map widening v filterNavByHidden bez TS errors.
type NavGroupItem = {
  readonly label: string;
  readonly to: string;
  readonly id?: string;
  readonly external?: boolean;
};
type NavGroup =
  | {
      readonly label: string;
      readonly items: ReadonlyArray<NavGroupItem>;
      readonly id?: undefined;
      readonly to?: undefined;
    }
  | {
      readonly id: string;
      readonly label: string;
      readonly to: string;
      readonly items?: undefined;
    };

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
          {(group.items ?? []).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={s.dropdownItem}
              onClick={() => { setOpen(false); onClose(); }}
            >
              {item.label}
              {'external' in item && item.external && (
                <span className={s.externalIcon} aria-label="otevře mimo svět">↗</span>
              )}
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
  // 9.1 — wizard pro tvorbu nového obsahu (Wiki / PC / NPC).
  const [wizardOpen, setWizardOpen] = useState(false);
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
    () => filterNavByHidden(
      buildNav(worldSlug, isPJForNav),
      settings?.hiddenNavItems,
    ),
    [worldSlug, isPJForNav, settings?.hiddenNavItems],
  );

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

  // 8.3 — slot „moje postava" ve světě. Najde entry v directory dle
  // membership.characterPath; pokud chybí (žádná postava / smazaná postava),
  // slot zůstane null a header fallbackuje na účet (řádky 201–209).
  const characterSlot = useMemo<WorldCharacterSlot | null>(() => {
    const path = membership?.characterPath;
    if (!path || !directory) return null;
    const entry = directory.find((e) => e.slug === path);
    if (!entry) return null;
    // 9.1 (cleanup) — avatarUrl už není v CharacterDirectoryEntry (BE jen
    // legacy redukovaný shape). PostavaLayout / PageEditor drží imageUrl
    // v Page entity; pokud chceme slot postavy zobrazit s avatarem, musíme
    // ho dotáhnout přes /pages/<slug>. Zatím undefined → fallback ikona.
    return {
      characterPath: entry.slug,
      name: entry.name,
      avatarUrl: undefined,
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
                <div className={s.searchBar}>Hledat...</div>
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

        {/* Mobile drawer (zprava) — jen pro membery */}
        {showFullNav && (
          <>
            <div
              className={clsx(s.drawerBackdrop, drawerOpen && s.drawerBackdropOpen)}
              onClick={() => setDrawerOpen(false)}
            />
            <div className={clsx(s.drawer, drawerOpen && s.drawerOpen)}>
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
                          {'external' in item && item.external && (
                            <span className={s.externalIcon} aria-label="otevře mimo svět">↗</span>
                          )}
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
      </div>
    </WorldContext.Provider>
  );
}
