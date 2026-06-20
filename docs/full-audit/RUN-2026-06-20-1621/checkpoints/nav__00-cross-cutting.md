# nav / 00-cross-cutting — checkpoint RUN-2026-06-20-1621

## Pokrytí

Projeto celý HEAD kódu (FE + BE) napříč všemi 17 osami (`DR`/`PA`/`GC`/`RG`/`OR`/`DL`/`RI`/`VR`/`DP`/`IR`/`MP`/`EX`/`HP`/`BP`/`RX`/`FZ`/`TE`).

Soubory přečteny:
- `src/app/router.tsx` — plný path-set (64 rout)
- `src/features/world/lib/worldNavConfig.ts` — buildWorldNav, buildFullWorldNav, HIDEABLE_NAV_ITEMS
- `src/features/world/lib/headlineNav.ts` — headlineToNavGroups, isExternalHref, NavNode
- `src/features/world/lib/groupMembers.ts` — buildGroupNavEntries, encodeGroupKey
- `src/app/layout/WorldLayout/WorldLayout.tsx` — render nav, drawer, hamburger
- `src/app/layout/IkarosLayout/IkarosLayout.tsx` — PRIMARY_NAV, CHAT_ROOMS, sidebar
- `src/features/admin/components/RoleGuard.tsx`
- `src/features/admin/components/WorldMembershipGuard.tsx`
- `src/shared/lib/loginIntent.ts` — intent round-trip, open-redirect guard
- `src/features/world/pages/CharacterDetailPage/CharacterDetailRoute.tsx` — legacy redirect
- `src/features/world/pages/PageEditor/PageEditorPage.tsx` — nova-stranka guard
- `src/features/world/hooks/useWorldSocket.ts` — world:deleted navigate
- `src/features/ikaros/pages/HelpPage/` — všechny sekce HP parita
- `src/app/__tests__/nav-guard-matrix.spec.tsx` — L6-matrix (60 buněk)
- BE: `world-gm-notes.service.ts`, `timeline.service.ts`, `world-weather.service.ts`, `campaign.service.ts`
- Scanner `nav.txt`: dead:0 orphan:0 ambiguita:0

## Dosažená L vs cílová L

| Osa | Dosažená | Cílová |
|---|---|---|
| `DR` Route–Link drift | L2 (tool scan clean) | L4 |
| `PA` Param contract | L3 (čtení + scan) | L4 |
| `GC` Guard coverage | L3 (čtení + matice L6) | L4 |
| `RG` Role-gate | L3 (čtení + matice L6) | L4 |
| `OR` Ordering/shadowing | L3 (K-NAV2 mýtus empiricky vyvrácen) | L4 |
| `DL` Dead link | L2 (scan clean) | L4 |
| `RI` Redirect integrity | L3 (čtení, ~25 navigate() target všechny OK) | L4 |
| `VR` Visibility vs reachability | L3 (čtení — skrytí=odkaz, guard zůstává; by-design) | L3 |
| `DP` Deep-link/refresh | L3 (WorldLayout čte slug z URL, context-independent) | L5 |
| `IR` Intent round-trip | L3 (loginIntent.ts — `isSafeRelativePath` blokuje `//`) | L5 |
| `MP` Mobile parita | L3 (drawer stejný `nav` proměnná jako desktop) | L5 |
| `EX` External/propadlé | L2 (čtení — isExternalHref OK; `target`/`rel` chybí 🐛) | L3 |
| `HP` Help parita | L2 (links na `/ikaros/vesmiry`, `/ikaros/profil`, `/ikaros/uzivatele` — živé) | L3 |
| `BP` BE-parita 👑 | L3 (čtení BE services; denik-pj/timeline/pocasi/campaign OK) | L7-stack |
| `RX` Reachability (crawl) | ⏭️ PROOF-REQUEST | L6-crawl |
| `FZ` Fuzz robustnost | ⏭️ PROOF-REQUEST | L7-fuzz |
| `TE` Teeth (mutace) | ⏭️ PROOF-REQUEST | L7-teeth |

Render harness L4 (M-MATRIX 60 buněk) pokrývá `GC`/`RG` na L6-matrix — zahrnuto z existujícího
`src/app/__tests__/nav-guard-matrix.spec.tsx`.

## Nálezy

<NAV-RUN-01 — [EX] Externe nav linky v headline menu bez `target="_blank"` / `rel="noopener noreferrer"` · Kde: `src/app/layout/WorldLayout/WorldLayout.tsx:104,201` (NavLink desktop dropdown + mobile drawer) · Dopad: vlastní odkaz PJ s `https://` URL se otevírá ve stejné kartě (ne nové), přestože ikona ↗ napovídá „nová karta" — UX nesoulad + potenciální tab-hijacking pokud PJ vloží odkaz na stránku s `window.opener`; nástrojová `isExternalHref()` správně detekuje, render to ale nevyužívá (chybí `target`/`rel` na `<NavLink>`). Návrh: při `item.external === true` renderovat `<a href={item.to} target="_blank" rel="noopener noreferrer">` místo `<NavLink to={item.to}>`. · L2 čtení · 🆕>

### Ověřené (verdikty seed kandidátů)

| Kandidát | Osa | Verdikt |
|---|---|---|
| K-NAV3 | `GC`/`VR` | ✅ by-design — skrytí = odkaz zmizí, routa+guard zůstávají; žádný leak |
| K-NAV4 | `GC` | ✅ všechny world child routy mají guard (index záměrně bez) |
| K-NAV5 | `PA` | ✅ params konzistentní: `:worldSlug`, `:slug`, `:id`, `:groupKey` — scan L2 clean |
| K-NAV9 | `RI` | ✅ ~25 navigate() post-action cílů resolvuje na živé routy |
| K-NAV10 IR | `IR` | ✅ open-redirect guard (`isSafeRelativePath`) blokuje `//evil.com` |
| K-NAV10 EX | `EX` | 🐛 → NAV-RUN-01 (externe linky bez target/rel) |
| K-NAV11 | `DP` | ✅ WorldLayout čte `worldSlug` z URL, context-independent — deep-link bezpečný |
| K-NAV12 | `MP` | ✅ mobilní drawer stejný `nav` jako desktop (stejná proměnná buildFullWorldNav) |
| K-NAV13 | `HP` | ✅ Nápověda odkazuje na `/ikaros/vesmiry`, `/ikaros/profil`, `/ikaros/uzivatele` — živé |
| K-NAV14 | `BP` | ✅ denik-pj (BE PomocnyPJ), timeline (BE Hrac+), pocasi (BE Hrac+), campaign (NAV-06 fix drží), pages/calendar-config (NAV-07/08 fix drží) |
| K-NAV15 | `RX`/`FZ` | ⏭️ PROOF-REQUEST (vyžaduje živou infrastrukturu) |
| K-NAV16 | `TE` | ⏭️ PROOF-REQUEST (Stryker mutace) |

### Dodatečná pozorování (bez nálezového čísla)

- **`nova-stranka` / `edit/:slug` route guard** (GC/VR): FE outer route = `memberOnly(Ctenar)`, vnitřní `PageEditorPage` gate = `PomocnyPJ`. BE `assertCanWrite` = `PomocnyPJ`. Pattern záměrný (outer guard ověří membership, inner redirect řeší roli) — žádný leak, BE hraje finální roli. Stav: ⚖️ by-design.
- **`world-gm-notes.service.ts` nečlen fallback** (BP): `membership?.role ?? WorldRole.Hrac` (ř. 50) — nečlen dostane Hrac → `< PomocnyPJ` → `ForbiddenException`. Výsledek správný, ale anti-pattern (nečlen impersonuje roli). Předáno jako pozorování; žádný leak. Cross-ref K-NAV14.

## PROOF-REQUEST

| # | Co | Proč chybí | Oblast |
|---|---|---|---|
| PR-1 | **L4 render test** — render každé routy přes MemoryRouter (mount = OK, ne 404/crash); guard negativně (špatná role → redirect/403) | Harness `nav-guard-matrix.spec.tsx` pokrývá guard logiku, ale ne plný path-set + lazy-load mount; chybí param-edge render pro každou routu | oblast 00 |
| PR-2 | **L5 e2e proklik** — Playwright projde celé menu (desktop + mobilní drawer), 0 dead clicks, deep-link/F5 na postava + wiki; intent round-trip po loginu | Playwright instalován (devDep), ale test suite neexistuje; vyžaduje živou app + seed data | oblast 05 |
| PR-3 | **L6-crawl reachability** — Playwright spider jako každá role; empirický graf vs statický PATH-SET; 0 console/404/smyček | Viz PR-2 infra | oblast 09 |
| PR-4 | **L7-fuzz** — fast-check náhodné/zlomyslné `:slug`/`:id` (unicode, `../`, délka 5000) → žádný crash/bílá/smyčka | fast-check nainstalován, ale fuzz harness neexistuje | oblast 09 |
| PR-5 | **L7-teeth** — Stryker zmutuje guard/router → nav testy musí zčervenat | Stryker nainstalován (devDep), config chybí; oddělit od default vitest běhu (past z `project_vitest_config_gotchas`) | oblast 09 |
