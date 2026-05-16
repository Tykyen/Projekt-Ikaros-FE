# Roadmap — Projekt Ikaros FE

**Stav:** Vite + React 19 + TS scaffold  
**BE repo:** `C:\Matrix\ProjektIkaros\Projekt-ikaros`  
**Referenční FE:** `C:\Matrix\Matrix\frontend` — pouze funkcionální reference, vizuální NE

**Hierarchie a pořadí stavby:**
1. **Ikaros platforma** — auth, komunita, správa světů, globální chat
2. **Světová vrstva** — jednou postavená, funguje pro každý svět (Matrix, D&D, ...)

---

## Přehled fází

| # | Název | Doména | Splněno |
|---|-------|--------|---------|
| 0 | Základ a infrastruktura | — | ✅ |
| 1 | Auth & Uživatelé | Ikaros | ✅ (1.0–1.8 hotovo) |
| 2 | Ikaros jádro | Ikaros | ⬜ |
| 3 | Ikaros komunita | Ikaros | ⬜ |
| 4 | Globální chat (Hospoda + Rozcestí) | Ikaros | ⬜ |
| — | **← Ikaros platforma hotová** | — | — |
| 5 | Svět — základ | Svět | ⬜ |
| 6 | Svět — chat | Svět | ⬜ |
| 7 | Svět — wiki stránky | Svět | ⬜ |
| 8 | Svět — postavy | Svět | ⬜ |
| — | **← MVP hranice** | — | — |
| 9 | Svět — herní nástroje | Svět | ⬜ |
| 10 | Svět — mapy | Svět | ⬜ |
| 11 | Svět — kampaně | Svět | ⬜ |
| 12 | Admin & nastavení | Ikaros + Svět | ⬜ |
| 13 | Pokročilé funkce | Ikaros + Svět | ⬜ |

> Legenda: ✅ Hotovo &nbsp;|&nbsp; 🟡 Rozpracováno &nbsp;|&nbsp; ⬜ Čeká

---

## Fáze 0 — Základ a infrastruktura

**Závislosti:**
- `jotai` — global state
- `sonner` — toast notifikace
- `clsx` — podmíněné CSS třídy
- `react-hook-form` + `zod` — formuláře a validace

### - [x] 0.1 Design system
- [x] CSS variables / theme tokeny (spacing, typografie, velikosti) — barvy a vizuální styl se řeší separátně
- [x] Základní UI komponenty: Button, Input, Card, Modal, Spinner, Badge
- [x] Theming architektura: `data-theme` atribut — Ikaros platforma / každý svět vlastní téma

### - [x] 0.2 Layout systém
- [x] `IkarosLayout` — 3-column shell (header, sidebar, main, right panel)
- [x] `WorldLayout` — světový shell (EXIT, název světa, dropdown nav, full-width main)
- [x] `AuthLayout` — prázdný layout pro login/register
- [x] Responsive — desktop 3 sloupce → tablet 2 → mobil drawer
- [x] `WorldContext` provider — worldId, world, isPJ, userRole, loading

### - [x] 0.3 Routing struktura
- [x] `src/router.tsx` — kompletní route tree (React Router v7)
- [x] `authLoader` — PrivateRoute přes loader pattern (redirect na `/login`)
- [x] `RoleGuard` — 403 stránka pro nedostatečnou roli
- [x] Lazy loading stránek (React.lazy + Suspense)

### - [x] 0.4 Auth infrastruktura
- [x] `useAuthStore` (Jotai atomWithStorage) — accessToken, refreshToken, currentUser
- [x] Axios interceptor — `Authorization: Bearer` + refresh při 401 (`POST /api/auth/refresh`)
- [x] `PrivateRoute` loader — redirect na `/login` (implementováno v 0.3 jako `authLoader`)
- [x] `RoleGuard` — 403 stránka (implementováno v 0.3)

### - [x] 0.5 API vrstva
- [x] Typovaný `apiClient` s `get/post/put/patch/delete`
- [x] Error handling — parsování BE error payloadu (`parseApiError`)
- [x] `useMyWorlds`, `useWorld` — TanStack Query hooky
- [x] `useUnreadCount` — REST + socket invalidace
- [x] Globální error boundary (`GlobalErrorBoundary` — class component nad RouterProvider)

### - [x] 0.6 Socket.IO infrastruktura
- [x] `SocketManager` singleton — JWT auth, status atom
- [x] `useSocketInit` — lifecycle (connect při přihlášení, disconnect při odhlášení)
- [x] `useSocket`, `useSocketEvent` — hooky pro komponenty
- [x] Toast při ztrátě / obnovení spojení (D-002 opraveno)
- [x] `main.tsx` — JotaiProvider, QueryClientProvider, GlobalErrorBoundary, Toaster, ThemeSync

---

## Fáze 1 — Auth & Uživatelé

**BE:** `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/users/me`, `PATCH /api/users/me`

### - [x] 1.0 Globální theme systém ✅

**Iterace A** (foundation + 3 reference themes) + **Iterace B** (zbývajících 18 témat) — viz `docs/superpowers/specs/2026-05-07-theme-system-design.md` a `docs/superpowers/plans/2026-05-07-theme-system-iterace-{a,b}.md`.

- [x] Definice **21 vizuálních témat platformy**: modré nebe (default), zlatý standard, sci-fi, vesmírná loď, vesmírná bitva, kyberpunk, postapo, příroda, pergamen, hospoda, nemrtví, temná červeň, čtyři živly, magie, severské runy, indiánské, africké, arabský svět, měsíc, slunce, bílá
- [x] CSS design tokeny per téma (`data-theme` atribut na layout root) — `src/themes/themes/<id>/index.ts`
- [x] 3D moderní efekty tlačítek per téma — translateY + box-shadow + per-theme glow v `decorations.css`
- [x] **Theme switcher v hlavičce** (deviace od původního plánu — switcher je v headeru místo v profilu, vždy dostupný)
- [x] Uložení volby uživatele — `themeAtom` (Jotai `atomWithStorage('ikaros.theme')`) + hybrid BE sync (graceful 404)
- [x] Výchozí téma před přihlášením — `DEFAULT_THEME = 'modre-nebe'` + pre-hydration script (žádný FOUT)

**Bonus nad rámec původního plánu:**
- [x] WCAG AA kontrast pro všech 21 témat (`npm run audit:contrast`)
- [x] Storybook gallery (Themes/Gallery → All Themes) pro vizuální testování
- [x] `prefers-reduced-motion` auto-disable animací
- [x] Lazy-load decorations.css + display fontů per téma
- [x] Architecture připravená pro **fázi 5.0** (theme scope na úrovni layoutu — `IkarosLayout` vs `WorldLayout`)
- [x] `lint:colors` skript zakazující hardcoded barvy v komponentech
- [x] 36 unit testů (registry, applyTheme, useTheme, useThemeSync)
- [x] Asset pipeline — `npm run themes:optimize` (sharp PNG → WebP, 21 thumbs + 21 backgrounds)

**Tracked dluhy:** D-003 (BE endpoint `PATCH /users/me { themeId }`), D-004 (`User.themeId` field type)

### - [x] 1.0f Modré nebe — heraldic upgrade ✅ (2026-05-09)

Spec: `docs/arch/phase-1/spec-1.0f-modre-nebe-upgrade.md`, plán: `docs/arch/phase-1/plan-1.0f.md`.

- [x] Header band (gold rule + central diamond) + logo s baked-in flourish
- [x] Page-frame ornaments na 4 rozích každého panelu (sidebar, right, welcome, novinky) — TL/TR/BL/BR mirror varianty generované sharp `flop()/flip()`
- [x] Section title finials (`◆ ━ TITLE ━ ◆` → cobalt jewel + filigree end-caps) přes `nav-end-cap-l` / `-r`
- [x] Andel medallion ve square shield rámu s cornerstones
- [x] PJ chip cobalt-cyan gradient pill, „Zobrazit vše →" zlatá pill
- [x] Welcome card script divider mezi text a signaturu (gold gradient + 2× cobalt finials)
- [x] **Heraldic icon swap** — 6 lucide-react ikon (Home/PlusCircle/MessageSquare/BookOpen/Image/HelpCircle) + Beer skryto přes `[data-theme] svg.lucide-*`, nahrazeno custom AI-generated illuminated assety přes `:has()` selektor
- [x] Nav button Level 1 enhancements — inner gold sheen, 4 cornerstone rivety v rozích, hover gold shimmer animace, aktivní cobalt cornerstones
- [x] Asset pipeline rozšíření — auto-mirror pro page-frame (4 variants), nav-end-cap (2 variants), trim+chroma-key pro logo

**Vše scoped na `[data-theme="modre-nebe"]`** — žádný globální dopad, žádná změna React komponent (CornerOrnament, IkarosCard, IkarosLayout, DashboardPage netknuté).

**Bonus:** infrastruktura přenositelná na další themata (zlatý standard, sci-fi, bila) — pattern + asset pipeline + selector strategie ověřena.

### - [x] 1.1 Login ✅

**Realizováno jako modal v hlavičce IkarosLayoutu** (deviace od původního "Login na `/login`" — viz spec `docs/arch/phase-1/spec-1.1.md`). Klíčové změny:

- [x] **BE:** `LoginDto.email` → `identifier` (přijímá e-mail NEBO přezdívku); `AuthService.login` rozhoduje podle `@`; `RegisterDto.username` zakázán `@`
- [x] **FE:** `LoginModal` komponenta (RHF + zod, themed, 3D buttons) — show/hide password toggle, error banner pro 401/429/network/5xx
- [x] **IkarosLayout je teď public shell** — anon vidí úvodník, vesmíry, články, galerii, diskuze, nápovědu; pravý sloupec a CHAT sekce jen pro logged-in
- [x] **Hlavička role-aware** — logged-out: PŘIHLÁSIT SE / REGISTRACE-disabled; logged-in: POŠTA, PŘÁTELÉ (placeholder pro 1.8) / UŽIVATELÉ (admin → 1.4), avatar+přezdívka, ODHLÁSIT
- [x] **Logout flow s 5s "Vrátit"** (sonner toast) — tokeny se mažou až po vypršení timeru
- [x] **Per-route `requireAuth` loader** nahradil global authLoader — chráněné routes redirectují na `/?openLogin=1` + uloží intent do sessionStorage
- [x] **JWT decode** pro hydrataci user dat po refreshi (`useAuthBootstrap`)
- [x] **`@hookform/resolvers`** přidán; `/login` a `/register` URL smazané, `LoginPage.tsx` smazán, `AuthLayout` čeká na 1.2

**Test coverage:** 72 FE testů (loginSchema, jwt, useAuth, LoginModal, themes); 22 BE unit + 9 E2E (auth-login-identifier).

**Tracked dluhy:** D-005 (`/users/me` plnohodnotná hydratace — 1.3), D-006 (Reset hesla — BE neumí, samostatný krok), D-008 (BE controller-level guards na `ikaros-articles/gallery/discussions` — vyřeší 3.2-3.4).

### - [x] 1.2 Registrace ✅

**Realizováno jako modal v hlavičce IkarosLayoutu** (konzistence s 1.1 — viz spec `docs/arch/phase-1/spec-1.2.md` a plán `plan-1.2.md`). BE auto-login: po úspěšné registraci jsou tokeny zapsány a uživatel je rovnou přihlášen.

- [x] **BE:** `ConflictException` v register() rozšířen o `code: 'EMAIL_TAKEN' | 'USERNAME_TAKEN'`; `HttpExceptionFilter` propaguje custom code z payloadu
- [x] **BE:** Nové public endpointy `GET /api/auth/check-username?u=...` a `GET /api/auth/check-email?e=...` (throttle 60/min)
- [x] **FE:** `RegisterModal` (RHF + zod, themed, 3D buttons) — email, username, password, passwordConfirm, show/hide toggle
- [x] **FE:** Indikátor síly hesla — vlastní heuristika (5-segmentový bar bez externí deps)
- [x] **FE:** Debounced live check username/email availability (✓/✗/spinner ikona, 400ms debounce)
- [x] **FE:** Cross-linky LoginModal ↔ RegisterModal přes `openLoginModalAtom` / `openRegisterModalAtom` (vždy max 1 modal otevřený)
- [x] **FE:** REGISTRACE button v hlavičce odblokovaný; `?openRegister=1` query trigger; deep-link intent reuse
- [x] **FE:** Smazány orphan `AuthLayout.tsx`, `RegisterPage.tsx`, `LoginPage.tsx`
- [x] **Tests:** 117 FE testů (registerSchema 9, passwordStrength 8, useDebouncedValue 3, useRegister 3, useAvailability 7, RegisterModal 14, +cross-link); BE 35 unit + 11 e2e + 4 filter testy
- [x] **Bonus:** Superadmin seed skript `npm run seed:superadmin` — Tyky účet (spec `_side-tasks/spec-superadmin-seed.md`)

**Tracked dluhy:** D-009 (BE `code` field napříč moduly), D-010 (GDPR souhlas), D-011 (captcha), D-012 (email verifikace).

### - [x] 1.3 Uživatelský profil — rozděleno do tří podkroků ✅ (všechny tři dokončené 2026-05-12)

Rozsah narostl po brainstormingu (avatar postavy, soft delete s tombstone, role infrastruktura, admin schvalování username) → tři menší PR místo jednoho monolitu.

#### - [x] 1.3a Profil — self-edit (`/ikaros/profil`) ✅

**Spec:** `docs/arch/phase-1/spec-1.3a.md`, **Plan:** `docs/arch/phase-1/plan-1.3a.md`

- [x] Hydratace `GET /users/me` (vyřešen D-005) — `useMyProfile` hook + `useAuthBootstrap` druhá fáze; rozšířeno o `displayName`, `city`, `bio`, `avatarUrl`, `defaultAvatarType`, `characterName`, `characterBio`, `characterAvatarUrl`, `chatColor`, `themeId`, `emailVerified`, `lastLoginAt`, `createdAt`
- [x] Route `/ikaros/profil` (lazy, `requireAuth` loader, pod `IkarosLayout`)
- [x] **Header karta** (`ProfileHeader`) — avatar, username, displayName, město, účet založen, poslední přihlášení, barva chatu (swatch), globální motiv
- [x] **Sekce NĚCO O MNĚ** (`BioSection`) — bio textarea, max 1000, counter
- [x] **Sekce POSTAVA V ROZCESTÍ** (`CharacterSection`) — jméno + bio + avatar (samostatný `<AvatarUploader scope="character">`)
- [x] **Sekce MOJE SVĚTY** (`WorldsSection`) — read-only readout
- [x] **Placeholder sekce** (`CommunityPlaceholders`) Moje diskuze / Moje články / Moje galerie
- [x] Edit pole přes `<EditCard>` (Upravit / Uložit / Zrušit) — displayName, město, bio, postava, barva chatu (`react-colorful` `<HexColorPicker>` + sync hex input, default `#FFFFFF`), theme
- [x] Email v header kartě **read-only** + tooltip "Změna emailu bude dostupná v 1.7"
- [x] **Sekce Bezpečnost** (`SecuritySection`) — změna hesla (currentPassword + newPassword, vyžaduje staré heslo, BE revokuje rodinu refresh tokenů); username field disabled + tooltip
- [x] **Sekce Účet** (`AccountSection`) — smazání účtu disabled + tooltip "Připravujeme (1.3c)"
- [x] **Default avatary** muž / žena / bytost — `assets-source/default-avatars/{male,female,being}.png` → `scripts/optimize-default-avatars.mjs` → `public/defaults/avatars/{type}{,-sm}.webp` (sharp 512+256, WebP q=85)
- [x] **`UserAvatar`** komponenta — fallback na `defaultAvatarType` + onError fallback
- [x] **`AvatarUploader`** komponenta — drag&drop + file input, client-side validace (typ image/*, ≤5 MB), preview, progress
- [x] BE Cloudinary upload pipeline (reuse existující `UploadService`, `publicId: 'main'` strategie přepíše)
- [x] BE endpointy: `GET /users/me` (rozšířený shape + worldsCount agregát), `PATCH /users/me`, `PATCH /users/me/password`, `POST /users/me/avatar`, `POST /users/me/character/avatar`, `DELETE` varianty
- [x] BE: `lastLoginAt` updatovaný v `auth.service.login()` a `register()`
- [x] **IkarosLayout header** — dynamic avatar přes `<UserAvatar>` (live update po profile change)
- [x] **Theme write-back** — `useThemeSync` posílá `themeId` do `PATCH /users/me` (vyřešen D-003 + D-004)
- [x] Username change UI **disabled** v 1.3a (přijde v 1.3b)
- [x] Smazání účtu UI **disabled** v 1.3a (přijde v 1.3c)
- [x] Tests: `profileSchemas.spec.ts`, `UserAvatar.spec.tsx` + 140 FE testů celkem prochází
- [x] `lint`, `lint:colors`, `test:run`, `build` ✅

**Tracked dluhy z 1.3a:** D-019 (legacy User polí cleanup), D-020 (JWT/me payload dedup).

#### - [x] 1.3b Username change + Admin role infrastruktura

**Spec:** `docs/arch/phase-1/spec-1.3b.md` ✅ schváleno 2026-05-12
**Plán:** `docs/arch/phase-1/plan-1.3b.md` ✅ 9 fází dokončeno 2026-05-12

- [x] BE entity `UsernameChangeRequest` (Mongoose schema + interface + repo, partial unique index pro pending)
- [x] BE: cooldown 30 dní (jen od posledního approved, `usernameChangedAt` na User)
- [x] BE endpointy user: `POST/GET/DELETE /api/users/me/username-request`
- [x] BE endpointy admin: `GET /api/admin/username-requests`, `POST .../:id/approve`, `POST .../:id/reject`
- [x] BE: role machinery doplněna o hierarchy (`assertCanChangeRole`, `assertCanModerate`) + granular `canManageAdmins` flag
- [x] BE endpointy ban: `POST /api/admin/users/:id/ban`, `POST /api/admin/users/:id/unban`, `POST /api/admin/users/:id/admin-permissions` (Superadmin-only)
- [x] BE: ban gate v `JwtStrategy.validate` (DB lookup; cache = D-026) + `AuthService.login` 403 BANNED + revokace refresh tokenů
- [x] FE: SecuritySection — žádost o username + pending banner + cooldown UI
- [x] FE: `/ikaros/uzivatele` plnohodnotná stránka — taby Uživatelé + Žádosti, filtry, role-change dropdown, ban/unban modaly, canManageAdmins toggle
- [x] FE: axios interceptor BANNED → instant logout
- [x] D-032 (enum mismatch FE↔BE) vyřešeno — sjednocený `UserRole` enum (Superadmin=1, …, SpravceClanku=10, SpravceGalerie=11, SpravceDiskuzi=12; Zakaz=8 deprecated)

**Tracked dluhy z 1.3b:** D-021 (timed ban), D-022 (audit log), D-023 (bulk akce), D-024 (email notif), D-025 (cooldown configurable), D-026 (cache ban check), D-027 (detail link 1.4), D-028 (toast po login), D-029 (Zakaz deprecate), D-030 (audit canManageAdmins), D-031 (granular perm framework).

#### - [x] 1.3c Tombstone smazaného účtu + cleanup ✅ (2026-05-12)

**Spec:** `docs/arch/phase-1/spec-1.3c.md`, **Plán:** `docs/arch/phase-1/plan-1.3c.md`

- [x] BE: soft delete (`deletionRequestedAt`, `deletionRequestedBy`, `deletionReason`, `deletedAt`, `isDeleted`), 30denní hold; `AccountCleanupCron` daily 03:00 Europe/Prague hard delete
- [x] BE: tombstone řádek (zachovává `username`/`displayName`/`chatColor`/`defaultAvatarType` s `isDeleted: true` + `deletedAt`; email anonymizován na `deleted-<id>@deleted.local`)
- [x] BE: blokace smazání pokud jediný PJ světa bez Pomocného PJ (`SOLE_PJ_BLOCK`); **auto-promote Pomocného PJ** při smazání (Fáze 0 audit objevil `WorldRole.PomocnyPJ = 2`, helper `pj-handover.helper.ts`)
- [x] BE: moderační smazání (admin/superadmin přes `POST /admin/users/:id/deletion-request`) → 30denní hold + povinný `reason` + revert přes `DELETE /admin/users/:id/deletion-request`; hierarchy guards stejné jako ban (self/Superadmin/canManageAdmins)
- [x] BE: chat / články / galerie / diskuze **zachovány**, autor → tombstone (avatar files smazány z disku — GDPR right-to-erasure)
- [x] FE: sekce **Účet** v profilu plnohodnotná — tlačítko "Smazat účet" + `DeleteAccountModal` (typing username + checkbox + PJ handover preview přes `dryRun=true`) + banner pending stavu
- [x] FE: `login()` union response (`status: 'ok' | 'deletion_pending'`); LoginModal switchne na `ReactivateAccountModal` při deletion_pending → `POST /auth/reactivate-deletion`
- [x] FE: `<UserAvatar deleted />` overlay komponenta (CSS black diagonální páska + grayscale + brightness 0.6; theme-independent token `--tombstone-band`)
- [x] FE: admin moderační delete v `/ikaros/uzivatele` — akce "Smazat účet" / "Obnovit smazání" v `UsersTable` + `AdminDeleteUserModal` (typing target username + povinný reason); status chip DELETION PENDING / DELETED
- [x] BE: trvalá rezervace `username`/`usernameLower` (unique index drží i pro tombstone řádky); email anonymizovaný format `deleted-<id>@deleted.local` (unique constraint splněn)
- [x] BE: `JwtStrategy.validate` sjednocený gate — `isDeleted` (401 DELETED), `deletionRequestedAt` (401 DELETION_PENDING), `bannedAt` (401 BANNED — regression z 1.3b)
- [x] BE: `AuthService.login` rozšířený — `isDeleted` → 401 DELETED, `deletionRequestedAt` → 200 `{ status: 'deletion_pending', ... }` (nabídka reaktivace)
- [x] FE: axios interceptor rozšíření — 401 DELETED / DELETION_PENDING → force logout + redirect
- [x] Testy: BE 816 (61 suites passed) + FE 140 (23 suites passed); FE build OK

**Tracked dluhy z 1.3c:** D-034b (revert PJ handover při reaktivaci), D-035 (audit log delete akcí), D-036 (email notif — 1.7), D-037 (reset hesla během hold — 1.7), D-038 (cooldown configurable), D-039 (dev-only trigger-cleanup endpoint), D-040 (tombstone integrace do chat/článků/galerie — fáze 3.x/6.x), D-041 (Friendship hard-delete při tombstone), D-042 (GDPR data export endpoint), D-043 (tombstone retention policy).

**D-034 ✅ uzavřen** — auto-promote Pomocného PJ rovnou implementován díky Fáze 0 auditu (`WorldRole.PomocnyPJ` už v BE existoval).

### - [x] 1.4 Stránka Uživatelé (tabs) + Veřejný profil + univerzální Zpracovat tab ✅ (2026-05-12)

**Spec:** `docs/arch/phase-1/spec-1.4.md` ✅ schváleno 2026-05-12
**Design audit:** `docs/arch/phase-1/design-1.4.md` ✅ schváleno 2026-05-12
**Plán:** `docs/arch/phase-1/plan-1.4.md` ✅ implementováno 2026-05-12 (BE 850 testů, FE 197 testů, tsc ✓, lint ✓, build ✓)

Sjednocená stránka `/ikaros/uzivatele` s horními taby, role-aware viditelnost. Architektonický princip: **tab „Zpracovat" je univerzální action queue** — cokoliv co vyžaduje rozhodnutí příjemce (přátele, world join, content approval, …) sem vstoupí.

**Tab visibility:**
- **Admin/Superadmin:** 4 taby — Přátelé + Uživatelé + Zpracovat + Audit (default `?tab=uzivatele`)
- **SpravceClanku/Galerie/Diskuzi + PJ + Hrac:** 2 taby — Přátelé + Zpracovat (default `?tab=pratele`)

**Tab obsah v 1.4:**
- **Přátelé** — kostra (placeholder, naplnění v 1.8)
- **Uživatelé** (Admin/Superadmin) — view-toggle `▦ Karty | ≡ Tabulka` (default Karty), search, sort, paginace, kebab akce na kartě (reuse modaly z 1.3b)
- **Zpracovat:**
  - Admin/Superadmin — funkční (Žádosti o username, přesun z 1.3b „Žádosti" tabu)
  - Spravce*/PJ/Hrac — placeholder „X bude dostupné s krokem Y"
- **Audit** (Admin/Superadmin) — read-only historie admin akcí (přesun `AuditLogTab` z 1.3b bez funkčních změn)

**Veřejný profil `/ikaros/uzivatel/:id`** — read-only zrcadlo 1.3a profilu bez citlivých polí (email, lastLoginAt, themeId, chatColor, ban/delete metadata). Dostupný každému přihlášenému (D-027 se uzavírá: admin „Otevřít v administraci" link).

**BE:**
- [x] `GET /api/users` — paginovaný adresář (RoleGuard Admin/Superadmin), search/sort/includeDeleted
- [x] `GET /api/users/profile/:id` — public profile (auth, bez role gate), 404 pro tombstone/pending, admin výjimka 200+flag
- [x] `PendingActionType` enum + `IPendingActionProvider` interface + první konkrétní `UsernameRequestProvider` (přesun z 1.3b)
- [x] `GET /api/pending-actions/count` + `GET /api/pending-actions?type=...` agregátor endpoint
- [x] DTO: `PublicUserListItem`, `PublicUserProfile`, `PublicUsersQuery`
- [x] Throttle 60/min/IP, privacy test (response neobsahuje email/lastLoginAt/themeId/chatColor/bannedAt/deletionRequestedAt/passwordHash)
- [x] Mongo compound indexy pro `findPublicPaginated` (`{ isDeleted, deletionRequestedAt, createdAt }` + `displayName`)
- [x] BE testy: 17 nových (PendingActions 12, listPublic/publicProfileV14 5) + celkem 850 ✓

**FE:**
- [x] Refactor `AdminUsersPage` → `UsersPage` v `src/features/users/` (4/2 taby + role-aware visibility + view-toggle uvnitř Uživatelé)
- [x] `PublicUserProfilePage` (naplnění stávajícího stubu — 5 sub-komponent: PublicProfileHeader / PublicBioSection / PublicCharacterSection / PublicProfileActions / SelfProfileBanner + TombstoneBanner)
- [x] `UserCard` (karta s avatarem, role chipem, městem, worldsCount, kebab menu, 4 cornerstones, deletion overlay)
- [x] `RoleChip` (jednotná komponenta, ikona + label + barva, 5 variant + None pro Hrac/PJ)
- [x] Zpracovat tab kontejner + renderer-by-type registry + `UsernameRequestRenderer`
- [x] Pravý panel: adaptivní label (Uživatelé/Přátelé), badge s pending count
- [x] Self-profile banner „Toto je tvůj veřejný profil — upravit můžeš v Nastavení"
- [x] `?tab=…&view=…&page=…&search=…&sort=…&includeDeleted=…` URL state (sdíleno mezi módy)
- [x] CSS tokeny: role chip semantic colors + cornerstones + tab + status pásek v `_shared/tokens.css`
- [x] FE testy: 27 nových (RoleChip 9, helpers 11, UserCard 11+) + celkem 197 ✓
- [x] Storybook stories: RoleChip + UserCard + PendingActionCard (D-047)

**Uzavírá:** D-029 (admin detail link), D-040 *principiálně* (tombstone v public adresáři), D-044 *částečně* (Mongo indexy).

**Mimo rozsah:** plnohodnotná funkčnost Přátelé (1.8), funkční Zpracovat pro Spravce* (3.2-3.4), pro PJ (2.4), pro Hrac (1.8); online indikátor (1.5); samostatná URL `/ikaros/pratele` (sjednoceno do `?tab=pratele`).

### - [x] 1.5 Presence ✅ (2026-05-12)

**Spec:** `docs/arch/phase-1/spec-1.5.md` ✅ schváleno 2026-05-12
**Plán:** `docs/arch/phase-1/plan-1.5.md` ✅ implementováno 2026-05-12 (BE 871 testů, FE 219 testů)

Canonický presence stav (online = aktivní socket spojení) napříč platformou — jediný zdroj pravdy v BE, push aktualizace přes Socket.IO, sjednocená vizualizace přes `<OnlineDot />`.

- [x] **BE:** `OnlinePresenceRegistry` (in-memory Map<userId, Set<socketId>>, multi-socket aware)
- [x] **BE:** `PresenceGateway` (Nest WebSocketGateway) — JWT verify v handshake, emit `presence:snapshot` { userIds } novému klientovi + broadcast `presence:update` { userId, online } při změně stavu
- [x] **BE:** `GET /api/presence/online-now` endpoint (dev tooling, throttle 30/min)
- [x] **BE:** stávající `GET /api/presence/online` (25h `lastSeenAt` threshold) zachován beze změny
- [x] **FE:** Jotai `onlineUserIdsAtom: Set<string>` + `usePresenceInit()` (přihlášení snapshot/update v `IkarosLayout`) + `useIsOnline(id)` selector
- [x] **FE:** `<OnlineDot userId size>` komponenta (absolute overlay, transparent offline — Q1-A; ring `var(--presence-ring)`)
- [x] **FE:** integrace v header avataru (`HeaderLoggedIn`, size sm), `UserCard` (Uživatelé tab, size md), `PublicProfileHeader` (size md)
- [x] **FE cleanup:** smazán placeholder `worldOnlineDot` u světů (sidebar + right panel) — světy nemají presence
- [x] **CSS tokeny:** `--presence-online` (#22c55e), `--presence-offline` (transparent), `--presence-ring` (theme bg) v `_shared/tokens.css`
- [x] **Tests:** BE 21 nových (12 registry + 9 gateway) + FE 13 nových (6 hook + 6 OnlineDot)

**Cleanup batch (2026-05-12):** D-049 ✅ idle stav (3-stavový, activity tracker, BE registry idle aggregate), D-050 ✅ last-seen tooltip (`relativeTimeCs` util + tooltip pro offline usery), D-052 ✅ privacy „neviditelný" mód (`User.hiddenPresence` + `PrivacySection` v profilu). Pre-existing failures vyřešené (`PendingActionCard.stories.tsx` TS cast, `RoleStar.tsx` barvy → tokeny, chevrons SVG `currentColor`).

**Mimo rozsah:** D-051 (Redis adapter pro multi-instance deploy — čeká škálování).

### - [x] 1.6 Cleanup — feature moduly, assets, docs/arch ✅ (2026-05-09)

**Specy:** `docs/arch/phase-1/spec-1.6{a,b,c}.md`

Strukturní úklid, **0 funkční změny** — proto v přehledové tabulce splývá s „1.0–1.8 hotovo".

- [x] **1.6a — feature-based moduly** (merge `1a94bd9`, 5 commitů) — kód sjednocen do `src/features/<feature>/` (auth, profile, world, chat, admin, ikaros, users, friendships) + generika do `src/shared/`; zaveden path alias `@/` (`a350410`).
- [x] **1.6b — assets cleanup** (`5eb4848`) — sjednocení úložiště obrázků: `assets-source/` (zdrojové PNG) vs `public/` (produkční WebP), deduplikace.
- [x] **1.6c — docs/arch cleanup** (`eaba656`) — sjednocení konvence pojmenování spec dokumentů + `README.md` index.

### - [x] 1.7 Reset hesla, e-mail verifikace, změna e-mailu (mailer integrace) ✅ (2026-05-12)

**Spec:** `docs/arch/phase-1/spec-1.7.md` ✅ schváleno 2026-05-12 (defaults Q1-A až Q9-A)
**Plán:** `docs/arch/phase-1/plan-1.7.md` ✅ implementováno 2026-05-12 (BE 960 testů ✓, FE 240 testů ✓)

Mailer infrastruktura + tři uživatelské flow + dvě notifikace. Stack: Resend (SMTP) přes `@nestjs-modules/mailer` + `nodemailer` + Handlebars šablony v repo. Token: 32-byte crypto random, v DB jen sha256 hash, single-use, TTL 1 h (reset/change) / 24 h (verify).

- [x] **BE mailer:** real SMTP transport, **stub fallback** pokud `MAIL_PASS` chybí (dev funguje bez SMTP účtu, žádné selhání při startu), 6 Handlebars šablon (verify-email, password-reset, email-change, email-change-notice, username-decided, account-deletion)
- [x] **BE SecurityTokens modul:** univerzální schema `SecurityToken` (type: `password_reset | email_change | email_verify`), Mongo TTL index pro auto-cleanup, `SecurityTokensService.issue/consume` (invaliduje předchozí tokeny stejného typu při issue)
- [x] **Password reset (D-006):** `POST /auth/forgot-password` (vždy 200, anti-enumeration, throttle 3/15min/IP) + `POST /auth/reset-password` (revokuje všechny refresh tokeny, žádný auto-login, redirect na `/?openLogin=1`)
- [x] **D-037 reaktivace:** reset hesla u pending-deletion účtu současně zruší soft-delete + vrátí `revertablePromotions` (sjednocený flow s `reactivateDeletion`)
- [x] **Email verify (D-012):** `register` nahrazuje stub token reálným, `POST /auth/email-verify` (anon) + `POST /auth/email-verify/resend` (JWT, throttle 3/15min/user), `User.emailVerifiedAt` field, route `/email-verify?token=...`
- [x] **Email change:** `POST /users/me/email-change-request` (vyžaduje `currentPassword`, throttle 3/15min/user) → confirm mail na NOVÝ + info mail na STARÝ; `POST /auth/email-change-confirm` (anon, race check 409 EMAIL_TAKEN), `mask-email.util` pro UX, route `/email-change/confirm?token=...`
- [x] **Notifikační maily (D-026 + D-036):** `MailerEventListener` poslouchá `username-request.decided` (z `AdminService.approveUsernameRequest/rejectUsernameRequest`) a `account.deletion.scheduled` (z `UsersService.requestSelfDeletion` + `AdminService.requestUserDeletion`); best-effort, nikdy nebrzdí response
- [x] **FE auth modaly:** `ForgotPasswordModal` (atom-driven, cross-link s LoginModal a RegisterModal), link „Zapomněl/a jsi heslo?" v LoginModalu, `?openForgotPassword=1` deep-link trigger v DashboardPage
- [x] **FE stránky:** `ResetPasswordPage` (token z query, PasswordStrengthIndicator reuse, RHF + zod, mapování chybových kódů z BE), `EmailVerifyPage` (auto-fire on mount, 3 stavy verifying/success/failed, resend tlačítko pro JWT), `EmailChangeConfirmPage` (auto-fire, 3 stavy, `EMAIL_TAKEN` race handling)
- [x] **FE profil:** `ChangeEmailModal` z ProfileHeader karty (současně řeší read-only email z 1.3a), `EmailVerifyBadge` v Header kartě (✓ Ověřeno / ⚠ Neověřeno + „Poslat znovu" link)
- [x] **Schemas:** `forgotPasswordSchema`, `resetPasswordSchema` (zod + match validace), `emailChangeSchema`
- [x] **Hooks:** `useForgotPassword`, `useResetPassword`, `useEmailVerify`, `useEmailVerifyResend`, `useEmailChangeRequest`, `useEmailChangeConfirm`
- [x] **Routes:** `/reset-password`, `/email-verify`, `/email-change/confirm` (lazy, anon, pod IkarosLayout public shell)
- [x] **ENV:** `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` (validace v Joi schema + dev warn pokud chybí)
- [x] **Bezpečnost:** token v DB jen sha256 hash, single-use, TTL index Mongo, anti-enumeration na `forgot-password`, throttle všude, `currentPassword` pro email change, info mail na starý e-mail při change, revoke refresh tokens po resetu

**Uzavírá dluhy:** D-006 (reset hesla), D-012 (e-mail verifikace full flow), D-026 (notifikace o username žádosti), D-036 (notifikace o account deletion), D-037 (reset hesla během deletion hold)

**Mimo rozsah (samostatné dluhy):** D-011 (captcha provider), D-045 (privacy „skrýt mě v adresáři"), branding e-mailových šablon, multi-tenant / vlastní doména, 2FA, magic-link login

### - [x] 1.8 Přátelé ✅ (2026-05-13)

**Spec:** `docs/arch/phase-1/spec-1.8.md` ✅ schváleno 2026-05-13 (Q1=B, Q2=skryté, Q3=full agregátor, Q4=B, Q5=B)
**Plán:** `docs/arch/phase-1/plan-1.8.md` ✅ 11 fází (A–K) dokončeno 2026-05-13

Naplnění tabu „Přátelé" + queue typ `friend_request` ve Zpracovat tabu. Sjednoceno do `/ikaros/uzivatele?tab=pratele` (žádný samostatný route).

**BE (nový modul `friendships`):**
- [x] Entity `Friendship` (`userAId < userBId` kanonicky, status `pending|accepted|declined|blocked`, `requestedById`, `lastDeclinedAt`, `lastDeclinedById`)
- [x] `GET /api/friends`, `GET /api/friends/requests/outgoing`, `GET /api/friends/status/:userId`
- [x] `POST /api/friends/request` (body `{ userId }`), `POST /api/friends/:id/accept`, `DELETE /api/friends/:id`, `DELETE /api/friends/by-user/:userId`
- [x] **`FriendRequestProvider implements IPendingActionProvider`** — registrace v `onApplicationBootstrap`
- [x] `FriendshipsGateway` (JWT v handshake, EventEmitter2 most service↔gateway, 5 eventů: `friend:request:incoming/accepted/declined/canceled`, `friend:removed`)
- [x] Per-pair cool-down 24h (Q4 — env `FRIEND_REQUEST_COOLDOWN_HOURS`, persistentní `declined` status + `lastDeclinedAt` marker, asymetrický — blokuje jen odmítnutou stranu, po vypršení recyklace na `pending`)
- [x] Tombstone gate: `sendRequest` na `isDeleted` / `deletionRequestedAt` → 404 `USER_NOT_FOUND`

**FE (nový feature `src/features/friendships/`):**
- [x] API hooky: `useFriends`, `useOutgoingFriendRequests`, `useFriendshipStatus`, `useSendFriendRequest` / `useAccept` / `useRemove` / `useRemoveByUserId` (mutations s cílenými error toasty na 429 `REJECTED_RECENTLY`, 409 `ALREADY_FRIENDS`, 409 `REQUEST_EXISTS`)
- [x] `FriendsTab` plně naplněn — sekce „Moji přátelé" (grid `UserCard` reuse s friend kebab menu) + collapsible „Odeslané žádosti" + empty state s CTA „Otevřít adresář →"
- [x] `OutgoingRequestCard` (inline řádek, design audit §3)
- [x] `FriendRequestRenderer` v `PENDING_ACTION_RENDERERS` registry (Zpracovat tab)
- [x] `PublicProfileActions` plnohodnotně dynamický — 5 stavů: `none` → primary, `pending_outgoing` → ghost se „Zrušit", `pending_incoming` → 2 buttons (Odmítnout/Přijmout), `accepted` → secondary + confirm modal, `cooldown` → schované (Q2)
- [x] `useFriendshipsSocket` v `IkarosLayout` — invaliduje query klíče + akční toast (`incoming` s linkem do Zpracovat tabu, `accepted` success)
- [x] **`ZpracovatTab` přepsán na agregátor (Q3)** — smyčka přes všechny registered typy v `PENDING_ACTION_RENDERERS`, group se sám skryje pokud má 0 items, globální empty state z `usePendingActionsCount`

**Nové sdílené primitivy (Q1=B, design audit §1, §6):**
- [x] `<ConfirmDialog>` v `src/shared/ui/ConfirmDialog/` (wrapper nad existující `<Modal>` se cancel/confirm tlačítky, focus na cancel default, danger variant pro destructive akce)
- [x] `<KebabMenu>` v `src/shared/ui/KebabMenu/` (popover na desktopu, bottom-sheet na ≤ 768 px, generic API s `KebabMenuItem[]`)

**Pre-existing fix mimo scope spec 1.8:**
- [x] `backend/src/modules/security-tokens/schemas/security-token.schema.ts` — explicit `@Prop({ type: String, ... })` u union pole `type: SecurityTokenType` (bez toho e2e testy importující AppModule padaly při evaluaci modulu)

**Testy:** BE 50 nových (3 canonical-pair + 9 repo + 25 service + 6 provider + 7 gateway) + 13 e2e (full happy path / 409/403 paths / cool-down asymetrie / status endpoint / pending-actions integrace / by-user alias). FE 36 nových (5 ConfirmDialog + 6 KebabMenu + 5 useFriendshipStatus + 4 useSendFriendRequest + 5 FriendRequestRenderer + 5 FriendsTab + 6 ostatní). Celkem 1019 BE unit ✓, 13+ e2e ✓, 276 FE ✓. `lint`, `lint:colors`, `tsc`, `build` ✓.

**Tracked dluhy z 1.8 (otevřené):** D-057 (friend-only privacy v profilu/poště — čeká na 3.5 pošta).

**Post-1.8 cleanup batch (2026-05-13):** **D-041** (tombstone cleanup pipeline volá `friendshipsRepo.deleteAllByUser` v `AccountCleanupCron.hardDeleteOne`), **D-055** (block flow side-task: `POST/DELETE /api/friends/block/:userId`, `GET /api/friends/blocks`, kind `'blocked_by_me'`, anti-stalk asymetrie, `isBlockedBetween` helper pro 3.5+ forward-compat, sekce „Zablokovaní" v FriendsTab, kebab v PublicProfileActions), **D-056** (admin friendship debug — nový `AdminFriendshipsController` s 3 endpointy, `AdminAuditAction` rozšířen o `FRIENDSHIP_COOLDOWN_RESET`, 5. tab „Friendship debug" v UsersPage pro Admin/Superadmin), **D-058** (sdílený `<KebabMenu>` v `shared/ui` — uzavřen rovnou v 1.8), **D-059** (4× native `window.confirm()` → sdílený `<ConfirmDialog>` v admin akcích).

**Uzavírá:** placeholder z 1.4 (`FriendsTab` + `PublicProfileActions` „Přidat do přátel" + `ZpracovatTab` non-admin placeholder).

**Mimo rozsah (dluhy a budoucí fáze):** blokace uživatelů (D-055), spam mitigation beyond per-pair cooldown (D-056), friend-only privacy (D-057), mail notifikace o žádosti.

---

## Fáze 2 — Ikaros jádro

**BE:** `/api/worlds`, `/api/worlds/:id`, `/api/worlds/:id/join`, `/api/worlds/:id/members`, `/api/ikaros-news`

### - [x] 2.1 Ikaros dashboard (`/`) ✅ (2026-05-13)

**Spec:** `docs/arch/phase-2/spec-2.1.md`, **Plán:** `docs/arch/phase-2/plan-2.1.md`

- [x] **BE:** `GET /api/game-events/upcoming/mine?limit=<n>` — cross-world agregátor blížících se eventů přihlášeného uživatele; respektuje `Zadatel` filter + `groupOnly`/`targetGroup` + binární `myRsvp: 'confirmed'|'none'`
- [x] **BE:** `findUpcomingForWorlds` v `MongoGameEventRepository` (`$in: worldIds`, sort `date: 1`, limit cap 500)
- [x] **BE:** `UpcomingEventDto` + `UpcomingQueryDto` (validation `@IsInt`, `@Min(1)`, `@Max(20)`)
- [x] **BE:** 9 nových unit testů + 6 e2e (visibility, ordering, group filter, RSVP myRsvp, 401 anon)
- [x] **FE bug fix:** `useMyWorlds` shape `MyWorldEntry[] = { world, membership }[]` (BE vrací tento shape, FE měl `World[]` typ → sidebar PJ badge byl počítán přes `world.ownerId === currentUser.id` místo `membership.role === WorldRole.PJ`). Tři callsite opravené: SidebarContent + RightPanel + ProfileWorldsSection.
- [x] **FE typy:** `MyWorldEntry`, `IkarosNews`, `UpcomingEventDto` v `src/shared/types/index.ts`
- [x] **FE hooky:** `useIkarosNews` (5min cache, public), `useUpcomingEventsMine` (1min cache, JWT-gated), `useToggleRsvp` (POST `/game-events/:id/confirm` + invalidace)
- [x] **FE util:** `relativeEventDate(iso, now)` — cs lokál (dnes/zítra/weekday/D.M./jiný rok) + `isWithin24h` urgency hint
- [x] **FE komponenta:** `WorldRoleChip` (6 rolí, 2 sizes, použitelný napříč platformou — analog `RoleChip` pro globální role)
- [x] **FE struktura:** `DashboardPage/` složka — orchestrátor + 4 sekce (`AnonWelcomeSection`, `WorldsSection`, `UpcomingEventsSection`, `PlatformNewsSection`) + 3 inner karty (`WorldCard`, `EventCard`, `NewsCard`) + sdílený `SectionHeader` + util `formatRelativePast`
- [x] **Auth-aware:** anon = welcome card + Novinky (beze změny); logged-in = Moje světy → Blížící se schůzky → Novinky
- [x] **WorldCard:** hero 96/80 px (desktop/mobil), gradient fallback bez obrázku, role chip, počet hráčů (singulár/paukal/plural), popis truncate 2 řádky, "Vstoupit do světa" CTA
- [x] **Empty state Moje světy:** "Zatím nejsi v žádném světě" + 2 CTA (Prozkoumat / Vytvořit)
- [x] **EventCard:** datum chip (relativní formát, urgent variant ≤24h), název + svět, RSVP toggle Půjdu/none (binární), klik na řádek → `/svet/:id`, `stopPropagation` na RSVP button
- [x] **NewsCard:** nadpis + excerpt 2-line + autor + relativní datum
- [x] **Responsivita:** grid 2col → 1col @ 768px, touch targety 44px+ na mobilu, ne-hardcoded barvy (`var(--surface-2)`, `var(--frame-border)`, `var(--shadow-lg)`, `var(--accent)`, `var(--role-world-*)`)
- [x] **Stagger reveal** 0/80/160/240 ms + `prefers-reduced-motion: reduce` override
- [x] **48 nových FE testů:** WorldRoleChip 8, relativeEventDate 12, useIkarosNews 2, useGameEvents 4, WorldCard 8, EventCard 5, NewsCard 2, DashboardPage 2, BE service findUpcomingForUser 9 + BE e2e 6 (celkem +63)
- [x] `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓ — FE 324 testů, BE 62+ game-events.service testů

**Tracked dluhy z 2.1:** **D-NEW1** (cross-world kalendář link — Eventy "Zobrazit vše →" vede dočasně na `/ikaros/vesmiry`, finální target s fází 9.2), **D-NEW2** (BE `GET /api/IkarosNews` paginace — pokud bude novinek mnoho, FE dnes slice(0,5) na FE).

**Uzavírá / souvisí:** Bug fix `useMyWorlds` shape (sidebar PJ badge přesněji přes membership.role místo ownerId).

**Mimo rozsah (samostatné fáze):** Správa novinek (3.1), 3-stavový RSVP (9.1), detail eventu (9.1), cross-world kalendář (9.2), stránka `/ikaros/novinky` (3.1).

**Post-2.1 následné úpravy:**
- **Skeleton loading na dashboardu pryč** (2026-05-14) — `useIkarosNews` + `useUpcomingEventsMine` mají `placeholderData: []`, sekce rovnou ukazují empty state místo skeleton pulse.
- **3.1a — early Novinky create modal** (2026-05-14) — Admin/Superadmin vidí `+` v hlavičce Novinek, otevře `CreateNewsModal` (plain text title + content). Spec: `docs/arch/phase-3/spec-3.1a-news-create-early.md`. Full 3.1 (admin správa, editor, kategorie, obrázek) zůstává na fázi 3. Tracked dluh **D-063** (BE: zúžit `POST /IkarosNews` autorizaci jen na globální role — dnes povoluje i `WorldRole.PJ`).
- **2.1b — Globální Ikaros akce + revize dashboardu** (2026-05-14) — FE: hooky `useIkarosEvents/useUpcomingIkarosEvents/useCreateIkarosEvent/useToggleIkarosEventRsvp/useUploadImage`, komponenty `IkarosEventsSection/IkarosEventCard/CreateIkarosEventModal` (datetime-local picker, image upload preview, confirmable RSVP toggle). Dashboard: smazán `UpcomingEventsSection` (cross-world game-events), přidán `IkarosEventsSection` (globální akce). Profil (`/ikaros/profil`): nová sekce `ProfileEventsSection` (přesun cross-world game-events agregátoru). Globální vs. světové oddělení: globální obsah na úvodníku, světový jen ve světě, nikdy spolu. Spec: `docs/arch/phase-2/spec-2.1b-ikaros-events.md`. FE: +26 testů.
  - ⚠️ **OPRAVA (3.1b, 2026-05-15):** BE část tohoto záznamu byla nepravdivá — modul `ikaros-events` ani generic `POST /upload/image` **nikdy nevznikly** (`git log --all` = 0 commitů). FE volalo neexistující endpointy, sekce „Akce" na dashboardu byla rozbitá. Backend dodán až ve fázi 3.1b.
- **2.1b-focal — Image focal point** (2026-05-14) ✅ — Po uploadu obrázku ke globální akci uživatel klikne na preview kam má být střed výřezu. BE: `IkarosEvent.imageFocalX/Y: number | null` (0–100). FE: clickable overlay s vizuálním markerem v `CreateIkarosEventModal`, `IkarosEventCard` aplikuje `object-position: x% y%` na `<img>` (default center 50/50). Auto-reset markeru při změně obrázku. BE +2 testy (21 total), FE +3 testy.
- **2.1c — Edit a Delete Ikaros akce** (2026-05-14) ✅ — Admin/Superadmin má v rohu karty kebab menu (•••) s akcemi **Upravit** a **Smazat**. Refactor `CreateIkarosEventModal` → `IkarosEventModal` s optional `event?` propem (jeden formulář pro create i edit). Edit reuse existující BE endpoint `PUT /api/ikaros-events/:id` (z 2.1b). Delete přes `useDeleteIkarosEvent` (hook existoval, ale neměl UI) + sdílený `<ConfirmDialog>`. „Odebrat obrázek" v editu pošle `imageUrl: null`. Spec: `docs/arch/phase-2/spec-2.1c-ikaros-events-edit.md`. Uzavřel dluh D-XXX z 2.1b + skrytý dluh „delete UI". FE +7 testů (383 total).

### - [x] 2.2 Přehled vesmírů (`/ikaros/vesmiry`) ✅ (2026-05-13)

**Spec:** `docs/arch/phase-2/spec-2.2.md`

- [x] **BE:** `World.maxPlayers?: number` (min 1, max 999, default null) — schema + interface + DTO (create/update) + repo toEntity mapping
- [x] **FE typy:** `World.maxPlayers` v `src/shared/types/index.ts`
- [x] **FE `WorldsPage/` složka** — orchestrátor + `WorldsToolbar` (search + filter chip + sort dropdown) + reuse `WorldCard` z 2.1 (`membership` volitelný — anon dostane "Detail světa →" místo "Vstoupit")
- [x] **WorldCard úprava:** zobrazuje `X / Y hráčů` pokud `maxPlayers != null`, jinak `X hráčů` (singulár/paukal/plural). Role chip jen pro logged-in member.
- [x] **Visibility:** anon vidí public/open (BE `OptionalJwtAuthGuard`), logged-in navíc moje světy (merge `usePublicWorlds` + `useMyWorlds` přes `Map<worldId, World>`)
- [x] **Search:** debounce-free substring match `world.name` (case-insensitive `cs`)
- [x] **Filter chip group:** Vše / Veřejné (public+open) / Mé světy (logged-in only)
- [x] **Sort dropdown:** Nejnovější (createdAt DESC, default) / Abecedně (name ASC `cs`) / Volná místa (`(maxPlayers ?? 0) - playerCount` DESC)
- [x] **URL state:** `?q=&filter=&sort=` (replace: true, back/forward funguje)
- [x] **Sidebar update:** "Zobrazit vše →" pro 0+světové, "Prozkoumat světy →" pro 0-světové (i anon) — vše vede na `/ikaros/vesmiry`
- [x] **Responsivita:** 2col grid → 1col @ 768 px; touch targety filter chip + sort select 44px+ na mobilu
- [x] **Empty state:** "Žádné světy odpovídající filtru." / "Zatím tu nejsou žádné aktivní světy."
- [x] **Loading skeleton:** 3 placeholder cards
- [x] **FE testy:** +12 nových (6 WorldsToolbar + 4 WorldsPage + 2 WorldCard update). Celkem 336 FE testů zelených.

**Mimo rozsah (samostatné fáze):** Wizard pro nastavení `maxPlayers` (2.3), join flow (2.4), pagination (až bude víc světů), genre/tones filtr, server-side search.

### - [x] 2.3 Vytvoření světa (`/ikaros/vytvorit-svet`) ✅ (2026-05-14)

**Spec:** `docs/arch/phase-2/spec-2.3.md`, **Plán:** `docs/arch/phase-2/plan-2.3.md`

- [x] **BE:** `CreateWorldDto` přijímá `tones`, `playersWanted`, `dice` (+ `MaxLength` pro description a playersWanted). `UpdateWorldDto` měl pole už dříve. Service `create` spreaduje `...dto` → propagace zdarma.
- [x] **BE:** 1 nový unit test (`forwards tones/dice/playersWanted to worldsRepo.save`). Celkem 39 worlds.service testů ✓.
- [x] **FE typy:** `World.playersWanted?: string` a `World.dice?: string[]` v `src/shared/types/index.ts`.
- [x] **FE hook:** `useCreateWorld` (`POST /worlds`, invalidates `['worlds','public'|'my']`).
- [x] **FE design:** směr „Workshop" (po frontend-design auditu) — 2col card grid, pill chips místo checkboxů, sticky footer s blur, žádné progress dots, žádné ornamenty.
- [x] **FE struktura:** `CreateWorldPage/` složka — orchestrátor + 5 sekčních komponent (`BasicInfo`, `Genre`, `Players`, `Access`, `System`) + sdílený `SectionCard` (s pořadovým číslem ①–⑤ jako vodoznak) + reusable `PillChips` (multi-select) + `useWorldSlug` (cs translit + dirty flag).
- [x] **FE konstanty:** 4 soubory — `genres` (10 + Vlastní), `tones` (24 + Vlastní), `dice` (13), `systems` (13 RPG presetů, default `matrix`).
- [x] **13 herních systémů:** Matrix / D&D 5e / Jeskyně a Draci / Dračí Doupě 1.6 / DrD Plus / DrD II / Dračí Hlídka / Příběhy Impéria / Shadowrun / GURPS / Fate / Call of Cthulhu / Vlastní (mapping na BE `system-presets`; chybějící presety → empty diarySchema).
- [x] **„Vlastní" volba** pro Žánr / Tón / Systém vyvolá free-text input; jeho hodnota putuje do BE místo labelu „Vlastní".
- [x] **Auto-slug** z názvu s cs transliterací (š→s, č→c, ř→r…), max 40 znaků. Po manuálním editu dirty flag zastaví auto-derive.
- [x] **Validace:** Název 2–60 / Adresa 2+ / Žánr required / Systém required. Submit disabled-tooltip „Vyplň: X, Y" identifikuje chybějící pole.
- [x] **Submit flow:** sonner toast „Svět «name» byl vytvořen." + `navigate('/svet/:id')`. 409 `WORLD_SLUG_TAKEN` → toast „Adresa už existuje, zvol jinou."
- [x] **Animace:** stagger reveal sekce 0/80/160/240/320 ms, respekt `prefers-reduced-motion: reduce`.
- [x] **Responsivita:** 2col → 1col @ 1024 px, padding tighter @ 768 px, touch target pill chips 44px+ na mobilu.
- [x] **Vizuální vrstva 100% skin-agnostická** — `var(--surface-*)`, `var(--frame-border)`, `var(--accent)`, `var(--text-*)`. Žádné hardcoded barvy v novém kódu.
- [x] **+12 FE testů:** useWorldSlug 6 (translit, dirty flag, length cap), PillChips 3 (toggle add/remove + aria-pressed), CreateWorldPage 3 (submit blocked → enabled → mutation called; slug auto-derive a manual override; Vlastní žánr free-text submitted). Celkem 395 FE testů ✓.
- [x] `npx tsc --noEmit`, `npm run build`, `npm run test:run` ✓.

**Mimo rozsah (samostatné fáze):**
- 2.4 Detail světa + join flow
- 2.5 World settings (edit existujícího světa, hero image upload)

**Post-2.3 následné úpravy (2026-05-14):**
- ✅ **D-NEW-slug-check** — BE `GET /api/worlds/slug-available?slug=` (public, bez auth) + `worlds.service.isSlugAvailable` (validuje regex `^[a-z0-9-]+$` + délku 2–40). FE `useSlugAvailability(slug)` (debounce 350 ms přes `useDebouncedValue` + react-query, 30s cache) vrací `idle|invalid|checking|available|taken`. `BasicInfoSection` zobrazí inline status: ✓ k dispozici (zelený) / ✗ obsazeno (červený) / Adresa musí být…/Ověřuji (helper). Submit blokován při `taken`/`invalid`/`checking`. +4 testy.
- ✅ **D-NEW-quota** — BE konstanta `MAX_ACTIVE_WORLDS_PER_OWNER = 30`. `worlds.service.create(dto, ownerId, ownerRole?)` přijímá role; pro `role > UserRole.Admin` count `worldsRepo.findByOwnerId(ownerId)` aktivních; pokud `>= 30` → `ForbiddenException` s code `WORLD_QUOTA_REACHED`. Superadmin/Admin (≤ Admin) skip; legacy callers bez role skip. Controller předá `user.role` z `RequestUser`. FE `CreateWorldPage` `onError` zachytí code → specific toast: „Dosáhl jsi limitu 30 aktivních světů. Smaž některý nebo požádej admina." +3 BE testy + 1 FE test.
- ✅ **D-NEW-tooltips** — `PillChips` má volitelný prop `descriptions: Record<string, string>`. Pokud existuje match, chip dostane native `title` attribut (hover desktop / long-press mobil) + viditelný `?` indikátor uvnitř chipu (vpravo, `currentColor` border, opacity 0.55). `TONE_DESCRIPTIONS` (24 + Vlastní) a `DICE_DESCRIPTIONS` (13) jako konstanty. GenreSection + SystemSection propnou popisky do PillChips. Žádný custom Tooltip overlay — native browser tooltip stačí pro MVP.
- Celkem **+5 FE testů** (4 useSlugAvailability + 1 quota toast), +6 BE testů (3 isSlugAvailable + 3 quota). Total: 400 FE + 45 worlds.service ✓.

### - [x] 2.4 Detail světa + join flow (`/svet/:worldId`) ✅ (2026-05-14)

**Spec:** [spec-2.4.md](arch/phase-2/spec-2.4.md), **Plán:** [plan-2.4.md](arch/phase-2/plan-2.4.md)

- [x] Informace o světě (hero + popis + tóny/kostky chips + stats)
- [x] Join tlačítko (public = přímý join jako **Čtenář**, open/private = `WorldAccessRequest` žádost)
- [x] **`WorldAccessRequest` pre-membership entita** — nová Mongo kolekce `worldaccessrequests` s unique indexem `(worldId, userId)`. Po schválení vznikne `WorldMembership` s rolí `Ctenar`.
- [x] **Žádost o vstup do open/private světa** → queue typ `world_access_request` ve Zpracovat tabu PJ vlastníka (přejmenováno z `world_join_request`). `WorldAccessRequestProvider implements IPendingActionProvider`. Renderer karty: avatar žadatele + název světa + tlačítka Přijmout/Odmítnout.
- [x] **WorldLayout split** — non-member/pending-access vidí *light header* (EXIT + název + accessMode badge), member plný nav.
- [x] **Sub-route guard** — `/svet/:id/chat`, `/stranky`, …, `/pravidla` chráněné `WorldMembershipGuard(minWorldRole=Ctenar, redirectTo='/svet/:worldId')` (non-member redirect na index detail-page).
- [x] **Private 404 scoping** — `GET /worlds/:id` pro private vrátí 404 non-memberovi bez pending AR (= GitHub private repo pattern, neprozradí existenci).
- [x] **WS eventy:** `world:access-requested/approved/rejected/cancelled` (specifické místo reuse `membership:changed` kvůli per-akci toastům, konzistence s `friend:request:*`).
- [x] **BE testy:** 956 passed (worlds.service +12 cases pro joinPublic/requestAccess/cancel/approve/reject/findMyAccessRequests/findByIdForRequester).

**Sémantika rolí (PJ 2026-05-14, mění od původního v1 draftu):**
- `WorldAccessRequest` = pre-membership entita, žadatel zatím **není** člen.
- `Čtenář` (1) = první role po schválení (= „má přístup, jen čte").
- `Žadatel` (0) = člen čekající na **postavu** (fáze 5+). Není pre-membership stav.

**Uzavírá dluhy:** D-053b membership guard rozšířen o `redirectTo` prop.

**Mimo rozsah (samostatné fáze / dluhy):**
- World settings (edit světa, hero upload, leave world, accessMode toggle, promote rolí) → **krok 5.3**.
- Fáze 5+ Žádost o postavu (Čtenář → Žadatel role upgrade) — nový character flow.
- **D-NEW-character-request** (in-world akce „Žádám PJ o postavu").
- **D-NEW-anon-world-detail** (logged-out viewing public/open detailu).
- **D-NEW-leave-world** (self-leave pro Ctenar+, ne PJ).
- **D-NEW-mongo-replica-set** (atomická transakce v approveAccessRequest — dnes pragmatický fallback).
- **D-NEW-world-invites** (pozvánky PJ → konkrétní user).
- **D-NEW-bulk-pending** (bulk approve/reject ve Zpracovat tabu).

---

## Fáze 3 — Ikaros komunita

**BE:** `/api/ikaros-articles`, `/api/ikaros-gallery`, `/api/ikaros-discussions`, `/api/ikaros-messages`, `/api/ikaros-news`

**Nové balíčky:** `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-table`

### - [x] 3.1 Ikaros novinky ✅ (2026-05-15)

**Spec:** [spec-3.1.md](arch/phase-3/spec-3.1.md), **Plán:** [plan-3.1.md](arch/phase-3/plan-3.1.md)

- [x] V dashboardu — čtení bez přihlášení (krok 2.1)
- [x] **Admin správa** (`/ikaros/novinky`) — full list s tabs Aktivní / Archiv, paginace 20/page, edit (PATCH), archive/unarchive (idempotent), hard delete (ConfirmDialog "nevratné"). Mobile = stacked layout. → **3.1b:** nahrazeno veřejným hubem `/ikaros/novinky` (zobrazení + správa na jednom místě, rozbalovací karty).
- [x] **BE rozšíření:** schema field `archived` + audit (archivedAtUtc, archivedByUserId); endpointy `PATCH /:id`, `POST /:id/archive`, `POST /:id/unarchive`; `GET ?scope=active\|archived\|all` s OptionalJwtAuthGuard (anon vidí jen active).
- [x] **FE:** nová page `IkarosNewsManagementPage`, refactor `CreateNewsModal` → `NewsFormModal { mode: 'create'\|'edit' }`, 5 nových react-query hooks, menu „Správa novinek" v sekci Administrace pro Admin/Superadmin.
- [x] Tests: BE 46/46 (+27 cases), FE 427/427 (+14 cases v page spec + 6 cases v modal spec).
- [x] **3.1a (early slice, 2026-05-14):** Vytvoření novinky z dashboardu — `+` tlačítko v hlavičce Novinky pro Admin/Superadmin, modal s plain textarea, mutation hook, sonner toasty. Spec: [spec-3.1a-news-create-early.md](arch/phase-3/spec-3.1a-news-create-early.md).

**Uzavírá dluhy:**
- D-NEW3 z 3.1a (BE povoloval `WorldRole.PJ` pro create/delete) → uzavřen jako **D-069** (zúžení authz na Admin/Superadmin, commit `584946d0`).
- D-NEW2 z 2.1 (BE paginace `IkarosNews`) → uzavřen jako **D-068** (`?limit=&offset=` + `GET /count`, commit `584946d0`).
- ~~D-065~~ ✅ Legacy `isActive` pole vyčištěno (2026-05-15, commity `324e2929` BE + `98d7b5b` FE).

**Nově vzniklé dluhy (otevřené):**
- ~~**D-066**~~ ✅ uzavřen v 3.2 (TipTap rich-text editor — sdílená komponenta + retrofit novinek).
- **D-067** (FE/BE): Audit log UI pro archive/delete (fields se ukládají, UI chybí).

### - [x] 3.1b Novinky — typy/obrázek + kalendář akcí + dostavba BE z 2.1b ✅ (2026-05-15)

**Spec:** [spec-3.1b-novinky-rozsireni.md](arch/phase-3/spec-3.1b-novinky-rozsireni.md), **Plán:** [plan-3.1b.md](arch/phase-3/plan-3.1b.md)

- [x] **Novinky — typ + obrázek:** `IkarosNews.type` (info/warning/system — barevně odlišený nadpis přes tokeny `--news-*`) + `imageUrl`.
- [x] **Rozbalovací karta `NewsCard`:** sbaleno = nadpis + typ + datum; rozbaleno = obrázek + rich-text obsah + autor. Sdílená dashboardem i stránkou Novinky.
- [x] **Stránka `/ikaros/novinky`** — veřejný hub: zobrazení (anon i hráč) + admin správa (Aktivní/Archiv, „Nová novinka", inline edit/archiv/smazat). Nahradil redirect i tab v `/ikaros/uzivatele`.
- [x] **Stránka `/ikaros/akce`** — měsíční kalendář globálních akcí (minulé i budoucí), klik → detail; mobil ≤768px = seznam Nadcházející/Proběhlé.
- [x] **Dashboard:** novinky i akce omezeny na první 3 + prokliky „Všechny novinky →" / „Kalendář akcí →".
- [x] **Dostavba chybějícího BE z 2.1b:** nový modul `ikaros-events` (schema, CRUD, RSVP toggle, soft delete, `GET/POST/PUT/DELETE /ikaros-events` + `/:id/confirm`) + generic `POST /upload/image`. Opravilo rozbitou sekci „Akce" na dashboardu.
- [x] Tab „Novinky" odstraněn z `/ikaros/uzivatele`; `NewsManagementTab` smazán.
- [x] Tests: BE +42 (upload 4, ikaros-news 6, ikaros-events 32), FE +31. Commity přímo do `main` (10 sub-fází 3.1b-a … 3.1b-j).

**Otevřené dluhy:** ~~D-NEW-event-color-lint~~ (uzavřen 2026-05-15 v rámci 3.3e — hardcoded barvy v `IkarosEventCard/Modal` + `AkcePage` nahrazeny tokeny `--img-ctrl-*` / `--img-marker-*`; `lint:colors` clean).

### - [x] 3.2 Články (`/ikaros/clanky`) ✅ (2026-05-15)

**Spec:** [spec-3.2.md](arch/phase-3/spec-3.2.md), **Plány:** [plan-3.2a.md](arch/phase-3/plan-3.2a.md) – [plan-3.2e.md](arch/phase-3/plan-3.2e.md)

Rozsah rozdělen na 5 sub-fází (3.2a–e). Vizuální směr „Editorial Atelier" (drop cap, glyph dividers, sticky margin-note autor card, 65ch reading width).

- [x] **3.2a — BE infra** (commit `8b9e386e`): `ArticleReviewProvider` (queue typ `article_pending_review`), anon read přes `OptionalJwtAuthGuard`, `article_reads` collection (mark-as-read tracking), `article_categories` collection s admin CRUD + seed 6 výchozích, kategorie refactor z enumu na DB slug. **Pre-fix:** `PendingActionsModule` zapojen do `AppModule` (1.4 infra byla dangling). +34 BE testů.
- [x] **3.2b — Sdílený TipTap editor** (commit `73952d4`): `<RichTextEditor>` v `src/shared/ui/RichTextEditor/` — bubble menu 7 tlačítek, `useDraftAutoSave` (localStorage debounce 3 s), readOnly + drop cap mode. Self-hostované fonty Fraunces/Crimson Pro/JetBrains Mono. +17 testů.
- [x] **3.2c — Stránky** (commit `cee1c91`): `/ikaros/clanky` (Přehled/Moje taby, search, sort, kategorie filter, mini stats), `/clanky/:id` detail (reading flow, rating distribuce, „více od autora"), `/clanky/novy` + `/:id/upravit` editor, `RejectReasonModal` (povinný reason min 10 znaků). +20 testů.
- [x] **3.2d — Zpracovat renderer** (commit `42ca2a9`): `ArticleReviewRenderer` registrován v `PENDING_ACTION_RENDERERS`. +11 testů.
- [x] **3.2e — Discovery** (commit `486e52a`): `AutoTOC` (sticky desktop / accordion mobile). RatingDistribution + MoreFromAuthor + mark-as-read shipped už v 3.2c. +12 testů.
- [x] **3.2f — Dluhový úklid:** retrofit novinek `NewsFormModal` na `<RichTextEditor>` (zavírá D-066), BE enum rename `SpravceClankuu→SpravceClanku` / `SpravceDisukzi→SpravceDiskuzi` (D-NEW-role-name-mismatch), touch targety 44px na mobilu (D-NEW-touch-targets).

**Uzavírá dluhy:** D-066 (TipTap — vč. retrofitu novinek), D-NEW-pending-actions-wired, D-NEW-role-name-mismatch, D-NEW-touch-targets.

**Mimo rozsah → přesunuto do navazujících fází:**
- Cloudinary upload obrázku v TipTap → **3.3** (po vybudování Cloudinary infra).
- „Diskuze o článku" link → **3.4** (po vytvoření modulu diskuzí).

**Otevřené dluhy (budoucí featury / optimalizace, ne nedodělky 3.2):** D-NEW-search-be (server-side search až nad ~500 článků), D-NEW-bulk-pending-articles, D-NEW-article-versions.

### - [x] 3.3 Galerie (`/ikaros/galerie`) ✅ (2026-05-15)

**Spec:** [spec-3.3.md](arch/phase-3/spec-3.3.md), **Plány:** [plan-3.3a.md](arch/phase-3/plan-3.3a.md), [plan-3.3c.md](arch/phase-3/plan-3.3c.md), [plan-3.3x.md](arch/phase-3/plan-3.3x.md)

Vizuální směr „Salon" (masonry, wall label, lightbox). **Brownfield** — BE modul `ikaros-gallery` z velké části existoval z feature-parity kroku; 3.3a ho rozšířil. Rozsah rozdělen na sub-fáze 3.3a–e (+ 3.3x mimo).

- [x] **3.3a — BE rozšíření `ikaros-gallery`:** schema pole `category`/`width`/`height`/`publicId`, `gallery_categories` collection + seed (5) + CRUD endpointy, `stats` endpoint, anon read, povinný reject reason, odebrán `PJ` z `ADMIN_ROLES`; `UploadService` vrací rozměry + `deleteImage()`. +35 BE testů.
- [x] **3.3b — Pending-actions:** `GalleryReviewProvider` (queue `gallery_pending_review`) + registrace; FE `GalleryReviewRenderer` v `PENDING_ACTION_RENDERERS`. `RejectReasonModal` zobecněn (content-agnostic, sdílí články i galerie).
- [x] **3.3c — Přehled + upload:** `GalleryPage` (masonry CSS columns, taby, filtr kategorií, hledání, statistiky), `GalleryUploadPage` (inline multipart upload + edit), tokeny „Salon" (`--gal-*`), routing. +12 FE testů.
- [x] **3.3d — Detail + lightbox:** `GalleryDetailPage` (rating, admin/autor akce), `Lightbox` (fullscreen, klávesy ←/→/Esc, swipe), sdílená `RatingStars`. +5 FE testů.
- [x] **3.3e — Úklid:** `napoveda` (galerie 🚧→✅, queue typ ve FAQ), `mobil-desktop` audit, Lightbox barvy → tokeny; uzavřen i preexistující dluh **D-NEW-event-color-lint** (event/akce barvy → `--img-ctrl-*` tokeny). `lint:colors` clean.
- [x] **3.3x — TipTap `Image` extension** pro `<RichTextEditor>`: nový BE endpoint `POST /upload/content-image` (bez admin gate, folder `content`), `Image` extension volitelně přes prop `onImageUpload`, `RTEToolbar` s tlačítkem „Obrázek", napojeno na `ArticleEditorPage`. Galerie RTE nepoužívá (popis = plain textarea). +5 FE, +2 BE testů.

### - [x] 3.4 Diskuze (`/ikaros/diskuze`) ✅ (2026-05-15)

**Spec:** [spec-3.4.md](arch/phase-3/spec-3.4.md), **Plán:** [plan-3.4a.md](arch/phase-3/plan-3.4a.md)
Brownfield — BE modul `ikaros-discussions` existoval z feature-parity. Diskuze = samostatné téma (ne komentář k obsahu).

- [x] **3.4a+b — BE rozšíření + pending integrace**: pole `joinRequestIds`, collection `ikaros_discussion_reports`, endpointy toggle-like / managers / join-request / report / resolve-report, `User.likedDiscussionIds`, PJ pryč z `ADMIN_ROLES`; 3 providery (`DiscussionReview/Report/Join`) + enum `discussion_pending_review`; FE 3 renderery do Zpracovat tabu, `useDiscussions` workflow hooky. +25 BE testů.
- [x] **3.4c — FE seznam + vytvoření**: `DiscussionsPage` (taby Přehled/Moje, hledání, řazení), `DiscussionsNewPage`, `lib/discussions`, routing (diskuze logged-in only — R4).
- [x] **3.4d — FE detail/vlákno**: `DiscussionDetailPage` (vlákno RTE příspěvků, like/oblíbené, admin schválení), `DiscussionManagePanel` (zámek, vývěska, správci, pozvánky, žádosti o přidání), hlášení příspěvků. BE: `GET /users/lookup` (picker), `GET /ikaros-discussions/:id/members`.
- [x] **3.4e — úklid**: nápověda (diskuze 🚧→✅, FAQ, StartSection), responsivní audit (mobil i desktop).
- [x] **3.4f — Recenze**: hodnocení 1–5★ článků (3.2) i obrázků (3.3) rozšířeno o textovou recenzi (`text`/`userName`/`createdAtUtc`); sdílená `ReviewsSection` na obou detailech. *(Nahrazuje původní položku „Diskuze o článku" — spec-3.4 R5: je to recenze, ne diskuze.)*

**Dluhy:** ~~D-NEW-postcount-race~~ (vyřešeno 2026-05-15 — atomický `$inc`); D-NEW-discussion-pagination → přesunuto na „čeká na trigger"; **D-NEW-html-sanitization zůstává otevřený** — blokuje `npm install sanitize-html` (TLS/CA chyba registry). Viz `docs/dluhy.md`.

### - [x] 3.5 Soukromá pošta (`/ikaros/posta`) ✅ (2026-05-15)

**Spec:** `docs/arch/phase-3/spec-3.5.md`, **Plán:** `docs/arch/phase-3/plan-3.5.md`

- [x] Master-detail stránka — taby Doručené / Odeslané (URL `?slozka=`), detail jako vlákno konverzace
- [x] Nová zpráva + Odpovědět (`RecipientPicker` našeptávač nad `/users/lookup`), mazání zpráv (soft-delete)
- [x] BE threading — `conversationId`/`replyToId` na `IkarosMessage`, endpoint `GET /ikaros-messages/conversation/:id`, migrace `migrate-message-threads`
- [x] Počítadlo nepřečtených v headeru — opraven latentní bug (`getUnreadCount` vracel `{messages,pendingRequests}`, FE čekal jiný tvar → badge byl vždy 0)
- [x] **RSVP eventů „zůstává v poště"** — vyřešeno threadingem: RSVP-konverzace = běžná zpráva + odpověď, žádná event-specific logika; potvrzení účasti zůstává na `/ikaros/akce`
- [x] **Dluh A** — `useUnreadCount` přesunut z `chat/api/` do `ikaros/api/useMail`
- [x] **Dluh B** — odstraněn legacy `world_join_request`/`resolve`/`handleJoinRequest` z `IkarosMessage` (mrtvý kód — `world.join.requested` nemá emittera, world-join jede přes `pending-actions`)
- [x] **D-057** — friend-only privacy: `User.profileVisibility`, enforce na profilu i poště, přepínač v profilu (sekce Soukromí)
- [x] **Bonus** — opraven `users.repository.toEntity`, který zahazoval 16 polí (`isDeleted`, ban*, `adminPermissions`… → tombstone hiding tiše nefungoval)
- [x] Testy: BE +nové unit (1131 ✓), FE +13 (`useMail`, `MailListItem`, `RecipientPicker`)

**Hranice pošta vs. Zpracovat (z 1.4):** Pošta = konverzace + informativní zprávy. Zpracovat = aktionovatelné žádosti (přátele, world join, content approval, discussion join). Action zprávy v poště vědomě descopovány — pošta je jen osobní konverzace.

### - [x] 3.6 Nápověda (`/ikaros/napoveda`) ✅ (2026-05-12, vytaženo dopředu)

**Spec:** `docs/arch/phase-3/spec-3.6.md`, **Plán:** `docs/arch/phase-3/plan-3.6.md`

- [x] Statická stránka — 5 tabů (Začni tady / Stránky / Účet & profil / Role & oprávnění / FAQ)
- [x] URL state `?sekce=...` (back/forward funguje, neznámý sekce fallback na default)
- [x] Sekce Stránky — všechny funkční (✅) i připravované (🚧) stránky platformy
- [x] Sekce Role — globální tabulka + akční matice + světové role
- [x] FAQ s nativním `<details>` accordionem (žádný JS state)
- [x] Anon i logged-in identický obsah (žádný gating)
- [x] Žádné nové theme tokeny ani ornamenty — reuse `var(--*)` napříč 21 motivy
- [x] Tests: 9 cases (tabs render, URL sync, parseTab, fallback, sections smoke)

#### - [x] 3.6a Role matrix — dvouúrovňový model + vizuální matice (2026-05-13)

**Spec:** `docs/arch/phase-3/spec-3.6a-role-matrix.md`, **Plán:** `docs/arch/phase-3/plan-3.6a-role-matrix.md`

- [x] Sekce „Role & oprávnění" rozdělena na **dva bloky** — Globální role + Role ve světech
- [x] Každý blok = **karty rolí** (6 kusů) + **matice oprávnění** (✓ v barvě role / —)
- [x] Nová sdílená komponenta `<WorldRoleIcon>` s 6 lucide ikonami (Crown / Shield / PenLine / User / Eye / Hourglass)
- [x] 6 nových CSS tokenů `--role-world-*` (theme-independent base, skiny mohou override)
- [x] Mobil < 720 px — matice horizontálně scrollovatelná, první sloupec sticky
- [x] Sekce „Hierarchie a omezení adminů" + „Co kdo smí udělat s kým" + tip o Pomocném PJ zachovány
- [x] Tests: +9 cases (8× WorldRoleIcon role + size + showLabel, rozšířený HelpPage role-tab test)

**Otevřené dluhy z 3.6a:** ~~D-053~~ (uzavřen 2026-05-13 — viz `docs/arch/phase-1/_side-tasks/spec-d053-role-architecture-cleanup.md`), ~~D-054~~ (uzavřen 2026-05-13 — point-fix `ASSIGNABLE_ROLES`). Follow-up **D-053b** otevřen pro per-world PJ check.

**Tracked dluh (zůstává):** D-NEW (HelpPage content drift — aktualizovat tab Stránky/FAQ při fázích 1.5/1.7/1.8/2.x/3.x).

### - [x] 3.7 Oblíbené — globální obsah (články / diskuze / obrázky) ✅ (2026-05-16)

**Spec:** `docs/arch/phase-3/spec-3.7.md`, **Plán:** `docs/arch/phase-3/plan-3.7.md`

- [x] **Datový model** — tři pole `favorite*Ids` na `User` (`favoriteDiscussionIds`
  už byl, přibyl `favoriteArticleIds` + `favoriteGalleryIds`) + tři `pinned*Ids`.
  Sjednocené `favorites[]` zamítnuto — nulová migrace, konzistence s diskuzemi.
- [x] **Dvě vrstvy** — *oblíbené* (celá kolekce záložek, stránka `/ikaros/oblibene`)
  vs. *připnuté* (ručně vybraná podmnožina v pravém panelu, max 5/typ).
- [x] **BE** — `toggle-favorite` + `toggle-pin` + `my-favorites` ve všech třech
  modulech (články, galerie nově; diskuze doplněno o pin). Pin guardy: jen
  oblíbené (`409 NOT_FAVORITE`), limit 5 (`409 PIN_LIMIT`); cascade odepnutí
  při odebrání z oblíbených. `repo.findByIds` doplněn do článků i galerie.
- [x] **FE** — sdílené komponenty `<FavoriteToggle>` (ikona `Bookmark`) a
  `<PinToggle>` (`Pin`). `DiscussionDetailPage` refaktorován ze `Star` na
  `Bookmark`. Záložka na detailu i kartách článků/galerie.
- [x] **Stránka `/ikaros/oblibene`** — 3 taby (Diskuze/Články/Obrázky), URL
  `?typ=`, mřížka karet s připínáním.
- [x] **Sidebar** — pravý panel naplnil 3 sekce (diskuze nově) reálnými daty;
  zobrazuje připnuté, fallback na 5 nejnovějších oblíbených; „Zobrazit vše →".
- [x] **Ikona = záložka, ne hvězda** — hvězda kolidovala s rating hvězdičkami
  na kartách; oblíbené ≠ hodnocení.
- [x] Tests: BE +21 (3 moduly: toggle/pin/limit/cascade, 1180 ✓), FE +17
  (`FavoriteToggle`, `PinToggle`, `FavoritesPage`).

### - [x] 3.8 Badge pending akcí u nav Diskuze / Články / Galerie ✅ (2026-05-16)

**Spec:** `docs/arch/phase-3/spec-3.8.md`, **Plán:** `docs/arch/phase-3/plan-3.8.md`

- [x] BE: `GET /pending-actions/count` rozšířen o `byType` rozpad (počet per
  queue typ; obsahuje jen typy, které uživatel přes `canHandle` vidí). `total`
  zachován — stávající badge „Uživatelé" beze změny.
- [x] FE: u nav položek Diskuze / Články / Galerie badge s počtem obsahu ve
  stavu `Pending` (reuse `navItemBadge`, žádný nový vizuál ani token).
- [x] Role gating čistě z BE — admin/superadmin vidí vše, SpravceClanku jen
  články, SpravceGalerie jen galerii, SpravceDiskuzi jen diskuze. FE roli neřeší.
- [x] Badge u „Diskuze" = jen `discussion_pending_review` (schvalování nových
  diskuzí). Reporty + žádosti o vstup zůstávají v agregátním badge + „Zpracovat".
- [x] Tooltip se skloňováním (1 / 2–4 / 5+) + `aria-label`.
- [x] Tests: BE +2 (`byType` rozpad, prázdné `byType`), FE +8 (`NavItem` badge
  render/skrytí, `pendingTooltip` skloňování).

---

## Fáze 4 — Globální chat (Hospoda + Rozcestí)

**BE:** Socket.IO `GlobalChatGateway`  
**WS eventy:** viz `Projekt-ikaros/docs/websocket-api.md`

### - [ ] 4.1 Hospoda (`/chat`)
- [ ] Interdimenzionální chat, kanály (Hospoda, Pokec), real-time zprávy
- [ ] Emotes (`:shortcode:`), typing indikátory

### - [ ] 4.2 Rozcestí (`/chat/rozcesti`)
- [ ] Atmosférická roleplay místnost — bez kostek a mechanik, hra na jeden večer
- [ ] 3 nezávislé místnosti (Rozcestí I.–III.) — víc her současně
- [ ] 3 styly prostředí (Fantasy / Sci-fi / Mystika), každý 20 lokací
- [ ] Ilustrace lokace jako pozadí chatu + slovní popis místa (📖 panel)
- [ ] Přepínání stylu/lokace v záhlaví, synchronizace stylu přes WS (`SetRoomStyle`)
- [ ] „Postava v Rozcestí" (≤200 znaků) — editace v Osobní kartě profilu
- [ ] Barva textu uživatele, šepot (whisper) konkrétnímu hráči
- [x] Ilustrace lokací (60 ks) migrovány ze starého Matrixu, převedeny na `.webp` → `public/images/rozcesti/`
- [ ] Slovní popisy 60 lokací — migrovat ze starého Matrixu (`descriptions/{fantasy,scifi,mystic}.ts`)

### - [ ] 4.3 Zprávy — rozšíření
- [ ] Reply, reakce (emoji), přílohy

---

## ← Ikaros platforma hotová →

---

## Fáze 5 — Svět — základ

*Tato fáze buduje světový shell. Vše níže běží v tomto shellu.*

### - [ ] 5.0 Světový theme systém
- [ ] Každý svět má vlastní vizuální styl, nezávislý na globálním tématu platformy
- [ ] Theme se definuje při vytvoření světa (nebo v nastavení světa)
- [ ] CSS design tokeny per svět (přepisují platformové tokeny uvnitř `WorldLayout`)
- [ ] Výběr a správa světového tématu (`/svet/:worldId/nastaveni`)

### - [ ] 5.1 WorldLayout (dokončení)
- [ ] Sidebar s navigací světa (chat, stránky, mapa, postavy...)
- [ ] Header s názvem světa, aktuální přihlášená postava
- [ ] Světový kontext (worldId, role v světě)

### - [ ] 5.2 World dashboard (`/svet/:worldId`)
- [ ] Novinky světa, poslední stránky, blížící se eventy

### - [ ] 5.3 Nastavení světa (`/svet/:worldId/nastaveni`)
- [ ] Základní info (název, popis, obrázek / hero upload) — PJ+
- [ ] Custom skupiny, správa členů (role, promote Čtenář → PJ apod.)
- [ ] **accessMode toggle** (public ↔ open ↔ private) — PJ+ (z dluhu 2.5)
- [ ] **Leave world** (self-leave pro Ctenar+, ne PJ) — z dluhu 2.5 / D-NEW-leave-world

---

## Fáze 6 — Svět — chat

**BE:** Socket.IO `ChatGateway`  
**WS eventy:** `chat:join`, `chat:message`, `chat:typing`, `chat:read`

### - [ ] 6.1 Světový chat (`/svet/:worldId/chat`)
- [ ] Sidebar s kanály a skupinami (ChatGroup barevné kódování)
- [ ] Read status, soft-deleted zprávy

### - [ ] 6.2 Zprávy — rozšíření
- [ ] Reply, reakce, přílohy, dice roll, whisper (visibleTo filter)

---

## Fáze 7 — Svět — Wiki stránky

**BE:** `/api/pages`, `/api/worlds/:id/pages`

### - [ ] 7.1 Page viewer (`/svet/:worldId/:slug`)
- [ ] TipTap JSON → HTML render, accessRequirements, breadcrumbs

### - [ ] 7.2 Page editor (`/nova-stranka`, `/edit/:slug`)
- [ ] TipTap editor (headings, bold/italic, links, images, tables, code)
- [ ] Access settings, auto-save draft

### - [ ] 7.3 Správa stránek (`/admin/stranky`)
- [ ] Přehled, řazení, mazání, oblíbené (hvězdička)

---

## Fáze 8 — Svět — Postavy

**BE:** `/api/characters`, `/api/worlds/:id/characters`, `/api/npc-templates`

### - [ ] 8.1 Deník postavy (`/svet/:worldId/postava/:slug`)
- [ ] Dynamické fieldy dle `diarySchema` světa (D&D, DrD, GURPS, Matrix...)
- [ ] Extra volné bloky

### - [ ] 8.2 Vlastní postava (`/svet/:worldId/moje-postava`)
- [ ] Shortcut na postavu přihlášeného uživatele v tomto světě

### - [ ] 8.3 NPC adresář (`/admin/adresar-postav`)
- [ ] NPC šablony (hp, armor, injury, abilities, notes), vytváření / editace

---

## ← MVP hranice — výše je funkční základ pro hráče →

---

## Fáze 9 — Svět — Herní nástroje

### - [ ] 9.1 Game Events (`/svet/:worldId/sprava-udalosti`)
- [ ] RSVP (confirm/decline), skupinová viditelnost (targetGroup), komentáře

### - [ ] 9.2 Kalendář (`/svet/:worldId/kalendar`)
- [ ] Per-postava deníky, PJ pohled, fantasy data, nastavení barev

### - [ ] 9.3 Timeline (`/svet/:worldId/timeline`)
- [ ] Historická osa, fantasy datový formát (celestial overrides), přidávání událostí

### - [ ] 9.4 Počasí (`/svet/:worldId/pocasi`)
- [ ] Aktuální počasí, správa generátoru (admin)

### - [ ] 9.5 Světové novinky
- [ ] V dashboardu světa, admin správa

---

## Fáze 10 — Svět — Mapy

**BE:** `/api/maps`, `/api/dungeon-maps`, `/api/universe`  
**Nové balíčky:** `three`, `react-force-graph-3d`, `konva`, `react-konva`

### - [ ] 10.1 Universe mapa 3D (`/svet/:worldId/mapa`)
- [ ] 3D force graph (nodes = lokace, links = cesty), visibility filter, click → detail

### - [ ] 10.2 Taktická mapa (`/svet/:worldId/takticka-mapa`)
- [ ] Hex mřížka Konva canvas, tokeny (drag & drop, HP, initiative)
- [ ] Fog of war, efekty, Socket.IO `MapsGateway` sync

### - [ ] 10.3 Dungeon Builder (`/admin/dungeon-builder`)
- [ ] Tile-based editor, export jako MapTemplate / MapScene

---

## Fáze 11 — Svět — Kampaně

**BE:** `/api/campaign`  
**Nové balíčky:** `react-force-graph` (2D)

### - [ ] 11.1 Pavučina (`/svet/:worldId/pavucina`)
- [ ] 2D force graph vztahů, CampaignSubject nodes
- [ ] CampaignRelationship hrany (SideA/SideB perspektiva), editace

### - [ ] 11.2 Storylines & Scénáře (`/svet/:worldId/scenare`)
- [ ] Storyboard pro PJ, Storylines (fáze, status, next step)
- [ ] Scénáře s TipTap obsahem a obrázky

### - [ ] 11.3 QuickNotes & Shop (`/svet/:worldId/obchod`)
- [ ] QuickNote pin/unpin, status
- [ ] ShopItem seznam s cenou a skupinou

### - [ ] 11.4 Currency converter (`/svet/:worldId/prevodnik-men`)
- [ ] Výpočet konverzí mezi měnami světa (WorldCurrencies)

---

## Fáze 12 — Admin & nastavení

### - [ ] 12.1 Platform admin (`/admin`)
- [ ] Dashboard (statistiky), správa uživatelů (role, ban)
- [ ] Schvalování obsahu (articles, galerie)

### - [ ] 12.2 World admin
- [ ] `/admin/nastaveni-kalendare` — WorldCalendarConfig
- [ ] `/admin/meny` — WorldCurrencies (CRUD)
- [ ] `/admin/emotes` — custom emotes (shortcode → obrázek)
- [ ] `/admin/headline` — "Last info" box

---

## Fáze 13 — Pokročilé funkce

### - [ ] 13.1 Vyhledávání
- [ ] Globální search bar v headeru (Ctrl+K)
- [ ] MeiliSearch fulltext výsledky, filtry (stránky, postavy, diskuze)

### - [ ] 13.2 Push notifikace
- [ ] VAPID subscription registrace (`POST /api/push/subscribe`)
- [ ] Povolení při prvním přihlášení

### - [ ] 13.3 Zvuková databáze (`/svet/:worldId/zvuky`)
- [ ] Přehrávač (YouTube link), filtry (intensity, emotionalTone)
- [ ] Integrace s taktickou mapou (background ambient)

### - [ ] 13.4 Custom Emotes
- [ ] Správa per-world (`/admin/emotes`)
- [ ] Picker v chatu při psaní `:`

---

## Potřebné npm závislosti (celkový seznam)

```json
{
  "dependencies": {
    "jotai": "^2.x",
    "sonner": "^1.x",
    "clsx": "^2.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@tiptap/react": "^2.x",
    "@tiptap/starter-kit": "^2.x",
    "@tiptap/extension-image": "^2.x",
    "@tiptap/extension-link": "^2.x",
    "@tiptap/extension-table": "^2.x",
    "three": "^0.x",
    "react-force-graph-3d": "^1.x",
    "react-force-graph": "^1.x",
    "konva": "^9.x",
    "react-konva": "^18.x",
    "@cloudinary/react": "^1.x",
    "react-datepicker": "^6.x"
  }
}
```

---

## Architektura src/

```
src/
├── api/
│   ├── client.ts
│   ├── socket.ts
│   └── hooks/             # useAuth, useWorlds, useChat, usePages, useCharacters...
├── components/
│   ├── ui/                # Button, Input, Modal, Card, Badge, Spinner...
│   ├── layout/            # IkarosLayout, WorldLayout, AuthLayout
│   └── features/          # ChatMessage, CharacterCard, PageCard, EventCard...
├── contexts/
│   └── WorldContext.tsx
├── pages/
│   ├── auth/              # Login, Register
│   ├── ikaros/            # Dashboard, Vesmiry, Clanky, Galerie, Diskuze, Posta...
│   ├── world/             # Chat, Stranky, Postavy, Mapa, Kalendar...
│   └── admin/             # Platform admin, World admin
├── store/
│   ├── authStore.ts       # JWT, user, role
│   ├── uiStore.ts         # sidebar, theme
│   └── socketStore.ts     # connection status
├── types/
│   └── index.ts           # TypeScript entity typy
└── utils/
```
