# 00 — Cross-cutting: tooling, render harness, katalog os, pasti

> Sdílená infrastruktura pro celý sweep. Zbytek oblastí (01–07) na ní staví. Tady se postaví **dva
> nástroje** (statický diff + render harness), zafixuje **path-normalizace** a popíše **3 vrstvy guardu**,
> proti kterým se měří `GC`/`RG`.

---

## A. Mapa routovací architektury (recon 2026-06-13)

| Vrstva | Soubor | Co drží |
|---|---|---|
| **Router (SSOT rout)** | [`src/app/router.tsx`](../../src/app/router.tsx) | `createBrowserRouter` (~ř. 141); 31 lazy stránek; root `/` (IkarosLayout) + `/svet/:worldSlug` (WorldLayout); catch-all `*` (~ř. 360) |
| **Root layout** | [`IkarosLayout.tsx`](../../src/app/layout/IkarosLayout/IkarosLayout.tsx) | `<Outlet>`, sidebar, `PRIMARY_NAV` (~ř. 95), `CHAT_ROOMS` (~ř. 107), FavoriteSection |
| **World layout** | [`WorldLayout.tsx`](../../src/app/layout/WorldLayout/WorldLayout.tsx) | `<Outlet>`, čte `worldSlug` z URL, hamburger drawer (mobil), renderuje `buildFullWorldNav` |
| **Nav generátory** | [`worldNavConfig.ts`](../../src/features/world/lib/worldNavConfig.ts) · [`headlineNav.ts`](../../src/features/world/lib/headlineNav.ts) · [`groupMembers.ts`](../../src/features/world/lib/groupMembers.ts) | `buildWorldNav` (~ř. 155), `buildFullWorldNav`, `headlineToNavGroups`, `buildGroupNavEntries`, `HIDEABLE_NAV_ITEMS` |
| **Guardy** | [`RoleGuard.tsx`](../../src/features/admin/components/RoleGuard.tsx) · [`WorldMembershipGuard.tsx`](../../src/features/admin/components/WorldMembershipGuard.tsx) | viz vrstvy guardu níže |
| **Error stránky** | `pages/errors/{NotFoundPage,ForbiddenPage,ErrorPage}.tsx` | 404 / 403 / loader error |

### 3 vrstvy guardu (proti čemu měří `GC`/`RG`)
1. **`requireAuth` loader** ([router.tsx](../../src/app/router.tsx) ~ř. 125) — má JWT? ne → `saveLoginIntent` + redirect `/?openLogin=1`. Vrstva **autentizace** (přihlášen vs anonym).
2. **`RoleGuard`** ([RoleGuard.tsx](../../src/features/admin/components/RoleGuard.tsx)) — `currentUser.role ∈ roles[]`? ne → `<ForbiddenPage/>` (403). Vrstva **globální role** (Superadmin/Admin); synchronní, bez loaderu.
3. **`WorldMembershipGuard` / `memberOnly()`** ([WorldMembershipGuard.tsx](../../src/features/admin/components/WorldMembershipGuard.tsx)) — `loading`→Spinner; `role ∈ fallbackGlobalRoles` (Sa/Admin) → projde; `worldRole >= minWorldRole` → projde; jinak `redirectTo` (`/svet/:worldSlug`) nebo 403. Vrstva **world role**. `memberOnly(el, minRole=Ctenar)` je obal s fallbackem `[Superadmin, Admin]`.

> ⚠️ **R-20** ([project_admin_world_governance]): platform Admin **nemá moc uvnitř světa**. Fallback
> `[Superadmin, Admin]` v `memberOnly()` je **read-viditelnost**, ne governance — `RG` cross-ref ověří, že
> se přes něj neprosákne write/manage akce, kterou má hradit jen PJ. To je hraniční nález pro [role-audit].

---

## B. Nástroj 1 — `nav-audit.mjs` (statický diff)  → [tools/nav-scan.md](tools/nav-scan.md)

📚 **Co dělá:** vytáhne **dvě množiny** a porovná je, jako `route-audit.mjs` dělá pro API:

1. **PATH-SET** — všechny `path:` z [`router.tsx`](../../src/app/router.tsx), složené do plných cest podle
   zanoření (root → world). Včetně příznaků: guard? role? je za catch-all?
2. **LINK-SET** — všechny navigační cíle z FE: `<Link to=>`, `<NavLink to=>`, `<Navigate to=>`,
   `navigate(...)`, a **výstup nav generátorů** (string literály `${b}/...`). Normalizované params.

**Diff → 3 reporty:**
- **Dead links** = LINK-SET ∖ PATH-SET (odkaz na neexistující routu) → 🟠/🔴
- **Orphan routy** = PATH-SET ∖ LINK-SET (routa bez vstupu) → 🟡 (po odečtení legitimních: catch-all, index, deep-link-only, mailové)
- **Shadowed routy** = routa deklarovaná **za** catch-all v témže parent stromu → 🔴

> ⚠️ **Past normalizace:** `${slug}`, `:param`, `encodeGroupKey(g)` musí kolabovat na stejný placeholder
> (`:x`) v obou množinách, jinak falešný drift. Recon ukázal, že **lidský sumář se v `skupina`/`skupinu`
> spletl** — strojový diff na normalizovaných cestách tuhle chybu nedělá. To je důvod existence nástroje.

**Hranice nástroje (statika neuvidí):**
- dynamicky složené cesty z proměnných mimo literál (`navigate(target)` kde `target` přijde z propu) → fallback na render/e2e
- jestli je orphan routa **záměr** (deep-link-only) nebo mrtvý kód → lidský verdikt
- jestli guard **logicky** sedí (jen že tam je) → `RG` cross-ref + render test

---

## C. Nástroj 2 — Render harness (vitest + MemoryRouter)

📚 **Co dělá:** pro každou routu z PATH-SET mountne strom přes `MemoryRouter initialEntries={[path]}` a
tvrdí:
- **pozitivně** — vykreslí se cílová stránka (ne `NotFoundPage`, ne thrown error). To chytí `OR` (stínění),
  `PA` (param mismatch → crash) a lazy-load.
- **negativně (guard)** — se špatnou identitou (anonym / nízká role) → `<ForbiddenPage/>` / redirect, ne
  obsah. To chytí `GC` (díra) a `RG` (špatná role). Vzor už existuje:
  [`WorldMembershipGuard.spec.tsx`](../../src/features/admin/components/WorldMembershipGuard.spec.tsx).
- **deep-link / param edge** — neexistující `:slug`/`:id` → graceful (empty state / 404), ne bílá stránka
  ani crash. Osa `DP`/`PA`.

> ⚠️ Render test běží proti **mockovaným** atomům (`currentUserAtom`, world membership) — neověřuje BE.
> To je v pořádku: `GC`/`RG` je **FE rozhodnutí kdo smí vidět routu**; BE enforcement řeší [role-audit] /
> [auth-policy]. Tady jen, že FE guard **existuje a větví správně**.

---

## D. Nástroj 3 — e2e proklik (Playwright, L5, klíčové cesty)

Reálný prohlížeč: přihlas PJ + hráče (seed z [seed-scenario]), **proklikej celé menu** (`buildFullWorldNav`
desktop + hamburger mobil), assert 0 dead clicks (žádné 404), pak **F5 na hluboké URL** (postava, stránka)
== stejný stav. Pokrývá `MP`/`DP`/`IR` na L5. Jen klíčové cesty — ne každá routa (to dělá render harness).

> ⚠️ Ověřit, jestli je Playwright v repu; pokud ne, je to `[human]` rozhodnutí (přidat devDep). Bez něj
> `MP`/`DP` dobíhá na L4 přes render harness s nastaveným viewportem (mobil-desktop skill).

---

## D2. Nadstavbové nástroje (Maximum+ — strop hloubky)

### Matice guardů `M-MATRIX` (L6-matrix) → osa `GC`/`RG`
Parametrizovaný vitest: **kartézský součin** `IDENTITY[] × PROTECTED_ROUTE[]`. `IDENTITY` =
{anonym, Ctenar, Hrac, PomocnyPJ, PJ, platform Admin, Superadmin, **nečlen**, **člen jiného světa**}.
Pro každou buňku mock identity + mount routy přes MemoryRouter → assert **přesný** výsledek z tabulky
očekávání (render / `<ForbiddenPage>` / redirect na index). Dnešní spot-testy guard **vzorkují**; tohle
ho **vyčerpá** — jedna routa se špatnou rolí mezi ~40 neunikne. Tabulka očekávání je **artefakt k revizi**
(human čte „takhle to MÁ být" před spuštěním).

### FE↔BE parita `M-PARITY` (L7-stack) → osa `BP` 👑
Cross-repo. Pro každou **guardovanou** FE routu:
1. zjisti, které **BE endpointy** stránka volá (z `api.get/post(...)` v dané feature složce),
2. najdi BE guard těch endpointů (`@UseGuards`, `@Roles`, world-role guard) v
   [`Projekt-ikaros/backend/src`](../../../Projekt-ikaros/backend/src),
3. assert **BE guard ≥ FE guard** (BE nesmí být volnější).

> 👑 Tohle je **nejhlubší vrstva**: chytí leak, kde FE schová položku, ale BE endpoint servíruje komukoli
> → obsah dosažitelný přímým API/URL voláním. Žádný FE-only ani BE-only audit tu spáru nevidí. Cross-ref
> [role-audit](../role-audit.md) (BE enforcement) + [bug-audit](../bug-audit.md) (`route-audit.mjs` API mapování).
> Podezřelé řádově: `kalendar`/`timeline`/`pocasi` (FE Hrac/PomocnyPJ) a `denik-pj`/`admin/*` (FE PJ).

### Crawler `M-CRAWL` (L6-crawl) → osa `RX`
Playwright spider: start z `/` jako každá role, BFS po `href`/klikatelných, postav **empirický** graf
dosažitelnosti. Diff vs statický PATH-SET (nedosažitelná routa = pravý orphan). Během průchodu **fail na**
jakoukoli console error / 404 network / redirect smyčku → chytí tiché rozbití, co render test mine.

### Fuzz `M-FUZZ` (osa `FZ`)
`fast-check` property test: generuj náhodné/zlomyslné cesty (`:slug`/`:id` = unicode, `../`, prázdné,
5000 znaků, URL-encoded) → assert app vždy skončí na **reálné stránce nebo graceful 404/403**, nikdy
crash / bílá / nekonečný redirect.

### Teeth `M-MUT` (L7-teeth) → osa `TE`
Stryker zmutuje guard/router logiku (`>=`→`>`, prohození rolí v `memberOnly`, smazání `requireAuth`)
→ ověř, že **matrix/render testy zčervenají**. Zelené při mutaci = pokrytí je divadlo. Past z paměti
`project_vitest_config_gotchas` (Stryker config oddělit, nezahrnout do default běhu).

> ⚠️ Nadstavba má **infra cenu**: `M-CRAWL`/`M-FUZZ` chtějí Playwright + běžící app, `M-MUT` Stryker
> devDep + dlouhý běh. `M-MATRIX` a `M-PARITY` běží jen na vitestu/čtení = levné, vysoký zisk → **dělat
> první**. Crawl/fuzz/mutace jsou `[human]` rozhodnutí podle dostupné infry.

---

## E. Katalog os → kde se tvrdí

| Osa | Nástroj | Oblast |
|---|---|---|
| `DR` Route–Link drift | M-SCAN | 01, 02 |
| `PA` Param contract | M-SCAN + M-RENDER | 02, 05 |
| `GC` Guard coverage | M1 + M-RENDER | 03 |
| `RG` Role-gate | M1 + M2 (role-audit) | 03, 06 |
| `OR` Ordering/shadowing | M-SCAN | 02 |
| `DL` Dead link | M-SCAN + M-RENDER | 01 |
| `RI` Redirect integrity | M1 + M-RENDER | 04 |
| `VR` Visibility vs reachability | M1 + M-RENDER | 03, 05 |
| `DP` Deep-link/refresh | M-RENDER + M-E2E | 05 |
| `IR` Intent round-trip | M-RENDER + M-E2E | 04 |
| `MP` Mobile parita | M-E2E + mobil-desktop | 05 |
| `EX` External/propadlé | M1 + M2 | 07 |
| `HP` Help parita | M1 + M2 (napoveda) | 07 |
| `BP` BE-parita guardu 👑 | M-PARITY | 08 |
| `RX` Reachability (crawl) | M-CRAWL | 09 |
| `FZ` Fuzz robustnost | M-FUZZ | 09 |
| `TE` Teeth (mutace) | M-MUT | 09 |

---

## F. Globální pasti (platí pro všechny oblasti)

- **Pořadí = pravda** — React Router v7 bere **první match**. `OR` není kosmetika: routa za `:slug`/`*` je mrtvá. Tool MUSÍ řadit podle pořadí deklarace, ne abecedy.
- **World index výjimka** — `{ index: true }` bez guardu je **záměr** (join/pre-join dash). Whitelistovat, ať `GC` nehlásí false positive.
- **Mailové routy** (`reset-password`, `email-verify`, `email-change/confirm`) jsou orphan **záměrně** (vstup z mailu, ne z menu) — whitelist v orphan reportu.
- **Legacy redirecty** (`sprava-udalosti`, `/postava/:slug`) NEJSOU dead links — jsou to `<Navigate>`; tool je počítá jako routy s cílem, ne odkazy.
- **`hiddenNavItems`** mění LINK-SET dynamicky (per-svět). Tool bere **plný** generátor (vše možné), `VR` pak řeší rozdíl skryté vs dosažitelné.
- **FE testy**: vitest bez globals (explicit importy), `fireEvent` ne user-event, žádný precommit hook → ruční běh ([project_fe_test_precommit]). Tooling formátovat `eslint --fix`, **ne prettier** ([feedback_fe_no_prettier]).
- **Před push** ověř `npm run build` (tsc -b), ne jen `--noEmit` ([project_fe_build_preexisting_errors]).

---

## G. Teardown / výstup

- Nálezy → [`../nav-audit.md`](../nav-audit.md) jako `NAV-xx` (osa · routa/odkaz · reprodukce · vratné?).
- `nav-audit.mjs` zůstává jako **CI guard** (`npm run audit:nav`) — drift se už nevrátí tiše.
- Render harness zůstává jako **regrese** (každá nová routa musí projít).
- Opravy **gated** (souhlas), neopravovat tiše — pravidlo [base.md].
