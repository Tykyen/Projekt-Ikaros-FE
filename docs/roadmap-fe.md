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

### - [x] 4.1 Hospoda (`/chat`) ✅ (2026-05-16)

**Spec:** `docs/arch/phase-4/spec-4.1.md`, **Plán:** `docs/arch/phase-4/plan-4.1.md`

- [x] Interdimenzionální hospoda — jeden globální kanál, real-time veřejné zprávy.
  „Pokec" zrušen — BE má jen jeden globální kanál (nemělo oporu v backendu).
- [x] Whisper (soukromý šepot), seznam přítomných, typing indikátory.
- [x] Emotes (`:shortcode:` → emoji, klientský set), barva textu (`chatColor`)
  s kontrast guardem vůči aktivnímu tématu.
- [x] BE: `color` v message DTO + `userId` v `chat:presence` (dluhy #4/#5 vyřešeny).
- [x] Mazání zpráv (Admin/Superadmin).
- [x] Sidebar: Hospoda → `/chat`; Rozcestí I.–III. disabled položky do kroku 4.2.
- [x] Tests: BE +4 (color v sendMessage/sendWhisper), FE +37 (lib, api, komponenty).

### - [x] 4.2a Rozcestí (`/chat/rozcesti*`) ✅ (2026-05-16)

**Spec:** `docs/arch/phase-4/spec-4.2a.md`, **Plán:** `docs/arch/phase-4/plan-4.2a.md`

- [x] Atmosférická roleplay místnost — bez kostek a mechanik, hra na jeden večer
- [x] 3 nezávislé místnosti (Rozcestí I.–III.) — víc her současně, presence per-channel
- [x] 3 styly prostředí (Fantasy / Sci-fi / Mystika), každý 20 lokací
- [x] Ilustrace lokace jako pozadí chatu + slovní popis místa (📖 panel)
- [x] Přepínání stylu **i lokace** v záhlaví, sdílené přes WS `chat:room:environment`
  (REST `PUT .../environment` za role guardem — jen platformová funkce)
- [x] Šepot (whisper) konkrétnímu hráči, barva textu — reuse infry Hospody
- [x] Ilustrace lokací (60 ks) migrovány ze starého Matrixu, převedeny na `.webp`
- [x] Slovní popisy 60 lokací migrovány ze starého Matrixu
- [x] BE: `global-chat` rozšířen o víc kanálů; FE: `ChatRoom` parametrizován
- [x] Tests: BE +12 (kanály, presence, environment), FE +22 (lib, api, RozcestiHeader)

### - [x] 4.2b Rozcestí — vazba na profil postavy ✅ (2026-05-16)
- [x] Seznam přítomných v Rozcestí zobrazuje postavu z profilu
  (`characterName`/`characterAvatarUrl`); fallback na účet. Dodáno v rámci
  kroku 4.2d §8.

### - [x] 4.2c Chat — presence & přítomnost ✅ (2026-05-16)

**Spec:** `docs/arch/phase-4/spec-4.2c.md`, **Plán:** `docs/arch/phase-4/plan-4.2c.md`

- [x] Self-include — uživatel se po vstupu hned vidí v seznamu přítomných
  (bez refreshe; Hospoda i Rozcestí).
- [x] Tlačítko „Odejít" v hlavičce místnosti → navigace na Úvodník.
- [x] Narativní hlášky příchodu/odchodu — krčmářský tón Hospody vs. poutnický
  Rozcestí (`presenceLine`).
- [x] Počet přítomných u Hospody / Rozcestí I.–III. v levém nav — živě
  (BE `chat:rooms:presence` broadcast + REST `rooms/presence`).
- [x] Auto-odhlášení po 60 min nečinnosti — FE heartbeat á 5 min, BE cleanup
  cron á 5 min; socket se neodpojuje (sdílený aplikací), jen presence.
- [x] Chat fullheight — `/chat*` ruší 220px rezervu nad oknem (side-task).
- [x] Tests: BE +4 (counts, heartbeat, cleanup), FE +9 (presenceLine,
  presentUsers, useRoomPresenceCounts).
- Dluh D-069 — „Chat (N)" v nav nadpisu = počet nepřečtené pošty.

### - [x] 4.2d Chat — multi-room presence ✅ (2026-05-16)

**Spec:** `docs/arch/phase-4/spec-4.2d.md`, **Plán:** `docs/arch/phase-4/plan-4.2d.md`

Revize 4.2c — model přítomnosti „jsem v místnosti, dokud z ní explicitně neodejdu".

- [x] Multi-room — uživatel je přítomný ve víc místnostech zároveň; odchod jen
  tlačítkem Odejít / „×" v nav / 60min timeout, ne opuštěním stránky.
- [x] Příchod/odchod jako uložené systémové zprávy (`isSystem`) — vidí je
  i pozdější příchozí; `presenceLine` přesunut na BE.
- [x] `chat:presence` přes `server.to()` — uživatel vidí i vlastní příchod.
- [x] Heartbeat globálně v layoutu (presence drží i mimo `ChatRoom`).
- [x] Počty u místností v nav vždy (i „0"); „×" pro odchod u místnosti, kde jsem.
- [x] §8 — seznam přítomných: Hospoda = účet, Rozcestí = postava
  (`characterName`/`characterAvatarUrl`). Splňuje krok 4.2b.
- [x] Tests: BE +5 (multi-room, dedup, character, systémová zpráva), FE +7
  (toChatItems, UserList režim).

### - [x] 4.3a Zprávy — Reply + reakce ✅ (2026-05-17)

**Spec:** `docs/arch/phase-4/spec-4.3a.md`, **Plán:** `docs/arch/phase-4/plan-4.3a.md`

- [x] Reply — odpověď na zprávu; BE `replyToId` v DTO/whisper, citace
  (jméno + úryvek 120 zn.) přežije smazání originálu
- [x] Emoji reakce — WS `chat:reaction:toggle` + broadcast
  `chat:message:reaction`; plný picker (`frimousse`, headless)
- [x] Funguje i u whisperů (`visibleTo` omezuje viditelnost reakce)
- [x] Klik na citaci skočí na originál (krátké zvýraznění)
- [x] Tests: BE +14 (reply validace/fallback, toggleReaction, broadcast scope),
  FE +9 (MessageItem citace/chipy, ChatInput reply lišta, useToggleReaction)

### - [x] 4.3b Zprávy — Přílohy ✅ (2026-05-17)

**Spec:** `docs/arch/phase-4/spec-4.3b.md`, **Plán:** `docs/arch/phase-4/plan-4.3b.md`

- [x] Upload příloh — REST `POST /global-chat/upload`, Cloudinary folder
  `global-chat/<room>`; obrázky + dokumenty (bez videa), max 10 MB
- [x] Zpráva s přílohami — `attachments` v DTO/whisperu; `content` volitelný
  (zpráva smí být jen příloha); BE ověří původ přílohy (doména + folder)
- [x] ChatInput — tlačítko 📎, náhledová lišta, upload-on-send
  (max 10 obrázků / 4 dokumenty na zprávu)
- [x] MessageItem — obrázky v mřížce + `ImageLightbox`, dokumenty jako chip
- [x] Úklid Cloudinary — prune job i admin delete mažou osiřelé assety
- [x] `cloudinaryThumb` → `shared/lib`, nový generický `ImageLightbox`
  v `shared/ui` (galerijní Lightbox je gallery-specific)
- [x] Tests: BE +17 (uploadGlobalChatFile, validateAttachments, attachment-only
  zpráva, whisper přílohy, úklid event), FE +22 (attachments util, ChatInput
  výběr/odebrání/upload-on-send, MessageAttachments, useUploadAttachment)

---

## ← Ikaros platforma hotová →

---

## Fáze 5 — Svět — základ

*Tato fáze buduje světový shell. Vše níže běží v tomto shellu.*

*Velká část kostry už existuje z kroku 2.4 — `WorldLayout` (split header), `WorldContext`, routing `/svet/:worldSlug/*` s `memberOnly` guardem, `WorldDashboardPage` (větvení non-member / pending / member). Fáze 5 = **dokončení + naplnění stubů**, ne stavba od nuly.*

**BE:** modul `worlds` z velké části hotový — `PATCH /worlds/:id` (vč. `accessMode`), `GET/PUT /worlds/:worldId/settings`, member endpointy (`role`/`group`/`character`), `DELETE /worlds/:worldId/members/:membershipId` (generický remove/leave). **Jediná chybějící BE věc:** pole `themeId` na `World` → krok 5.0a.

**Pořadí stavby:** 5.1 → 5.0 → 5.3 → 5.2 *(5.0 a 5.3 sdílí UI theme selektoru; 5.2 nejvíc závisí na pozdějších fázích).*

**Rozhodnutí (delegováno autorem 2026-05-17):**
- Světový theme = **dvouvrstvý**: sdílený základ (PJ nastaví na `World` — „kanonický vzhled světa", default pro všechny) + **volitelný per-uživatel override** (každý člen si může vzhled světa pro sebe přenastavit; fallback na sdílený základ). Viz 5.0a/d (základ) a 5.0e (override).
- Headline builder (PJ skrývá moduly / staví vlastní menu, jak měl starý Matrix) **descopován na fázi 12** (World admin). Nav v 5.1 zůstává statický.
- World dashboard „poslední stránky" **descopováno** — wiki modul je fáze 7; do té doby placeholder.

**Klíčové existující soubory FE (vstup pro spec):**
- `src/app/layout/WorldLayout/WorldLayout.tsx` — split header, nav dropdowny, mobile drawer
- `src/features/world/context/WorldContext.tsx` — `worldId` / `worldSlug` / `world` / `isPJ` / `userRole`
- `src/features/world/pages/WorldDashboardPage/` + `components/MemberDashboardStub`
- `src/features/world/api/` — `useWorld`, `useWorldStatus`, `useMyWorlds`, `useWorldJoin`
- `src/themes/` — `registry.ts` (`THEMES`, `getTheme`, `listThemes`), `applyTheme.ts`, `state.ts` (`worldThemeAtom` — rezervovaný, `null`), `_shared/tokens.css`
- `src/app/router.tsx` — `/svet/:worldSlug/*` (20+ sub-rout, `memberOnly` guard)

---

### - [x] 5.1 WorldLayout — dokončení

*Malý dodělek — kostra stojí z 2.4. Cíl: layout připravený přijmout světový theme (5.0) a kontext postavy (fáze 8). Spec: [spec-5.1.md](arch/phase-5/spec-5.1.md).*

- [x] **WorldContext** — ověřena kompletnost; přidán slot `character` (`WorldCharacterSlot | null`, zatím `null` / fallback na účet)
- [x] **Header** — název světa + accessMode badge + genre badge + EXIT; slot „aktuální přihlášená postava" (neklikatelný, fallback na účet uživatele)
- [x] **Nav** — finální statické dropdowny; 22 nehotových stránek nahrazeno jednotnou `WorldStubPage` (mapa route→krok `worldStubMap`)
- [x] **Mobile drawer** — ověřen, touch targety ≥ 44px (`drawerLink`, `drawerNewPage`, `hamburger`)
- [x] **Loading / error stav** — header skeleton během načítání; chybějící svět → jen light header + `WorldNotFound`
- [x] `mobil-desktop` audit layoutu — CSS audit (playwright MCP nedostupný); opraveno přetékání headeru (worldName ellipsis, genre/newPageBtn skryté ≤768)

### - [x] 5.0 Světový theme systém

*Per-svět vizuální styl, nezávislý na globálním tématu platformy. Reuse infry z kroku 1.0 (`THEMES` registry, `applyTheme`, CSS tokeny `_shared/tokens.css`). Spec: [spec-5.0.md](arch/phase-5/spec-5.0.md) · plán: [plan-5.0.md](arch/phase-5/plan-5.0.md).*

> **Odklony od původního návrhu (spec §4):** (1) místo `applyWorldTheme` scoped na `.shell` se motiv aplikuje **přepnutím globálního `:root`** (portály + kolize ornamentů). (2) Motiv se **odvozuje ze žánru světa** (32 žánrů, `themeForGenre`) — ne ruční výběr z dlaždic. (3) Žádný dedikovaný „Matrix skin" — Matrix svět má motiv ze žánru + vlastní pozadí.

- [x] **5.0a — BE:** `themeId` + `themeOverrides` + `themeBackgroundUrl` na `World` schema + `Create/UpdateWorldDto` + default; migrace existujících světů; vracen v `GET /worlds/:id` i `/slug/:slug`
- [x] **5.0b — FE infra:** `ThemeScope` rozšířen o `'world'`; `listThemes('world')`; `applyTheme(id, opts)` přijímá `overrides`+`backgroundUrl`, čistí staré tokeny; `worldThemeOverridesAtom` + `useWorldTheme` resolver (override → `World` základ)
- [x] **5.0c — FE aplikace:** `WorldLayout` přepíná `:root` na motiv světa při vstupu, EXIT obnoví globální motiv uživatele
- [x] **5.0d — Vlastní (custom) theme světa:** *runtime hotový* — `World.themeOverrides` + `themeBackgroundUrl`, `applyTheme` vrství overrides nad preset. **Editor UI** (color pickery, upload pozadí) = krok **5.3f**
- [x] **5.0e — Uživatelský override:** preset switcher „Vzhled světa" v hlavičce; localStorage keyed `worldId` (per zařízení); „Reset" vrací na sdílený základ PJ
- [x] **Sada motivů + žánry** — 21 globálních + **16 žánrových skinů** portovaných ze starého Matrixu (krok 5.0g) = 37 motivů; `themeForGenre` mapuje 32 žánrů 1:1 na vlastní skin (bez sdílení)
- [x] **Kontrast guard** — manuální audit; automatický guard v editoru = krok 5.3f
- [x] Výběr motivu v UI — ve wizardu (odvozen ze žánru, PJ přepíše); plný editor = 5.3f
                                                                          
#### - [x] 5.0g Port 16 žánrových skinů ze starého Matrixu

*Krok 5.0 přenesl jen 21 motivů a 16 žánrů posdílel — regrese vůči starému Matrixu (`GENRE_TO_SKIN`, 32 skinů). 5.0g doplňuje chybějících 16 jako samostatné theme definice. Spec: [spec-5.0g-skin-port.md](arch/phase-5/spec-5.0g-skin-port.md), plán: [plan-5.0g.md](arch/phase-5/plan-5.0g.md).*

- [x] 16 nových theme definic (`index.ts` přes sdílený `buildSkinVars` + `decorations.css` se signature ornamentem): fantasy, heroic, urban-fantasy, soft-sci-fi, biopunk, post-postapo, dystopie, military, psycho, lovecraft, thriller, alt-historie, steampunk, dieselpunk, weird, grimdark
- [x] `ThemeId` +16, registry = 37 motivů, `genres.ts` přemapováno 1:1
- [x] Pozadí/thumbnaily sdílené s existujícími motivy (věrný port — starý Matrix `$skins-bg` rovněž sdílel); dedikované assety = dluh **D-NEW-skin-assets**

### - [x] 5.3 Nastavení světa (`/svet/:worldSlug/nastaveni`)

*Nahrazuje stub `WorldSettingsPage`. Tabová stránka, viditelnost tabů dle role. BE: oprava role DTO + nový AKJ endpoint + populace jmen členů (viz [spec-5.3](arch/phase-5/spec-5.3.md) §8). Spec: [spec-5.3.md](arch/phase-5/spec-5.3.md), plán: [plan-5.3.md](arch/phase-5/plan-5.3.md).*

> **Revize oproti návrhu:** guarding respektuje BE hierarchii místo paušálního „PJ+" (Korektor+ vidí Základní info/Přístup/Vzhled, PomocnyPJ+ Členy a AKJ). AKJ úrovně přesunuty z PJ+ na PomocnyPJ+ → nový BE endpoint `PUT .../settings/akj-types`. Hero upload jde přes `/upload/content-image` (`/upload/image` je Admin-only).

- [x] **5.3a — Základní info:** formulář (`react-hook-form` + `zod`) — name / popis / genre / system / kostky / maxPlayers / playersWanted; reuse `sections.module.css` + constants z `/ikaros/vytvorit-svet`; hero upload přes `POST /upload/content-image`; slug read-only; ukládá `PATCH /worlds/:id` — **Korektor+**
- [x] **5.3b — accessMode toggle:** přepínač public ↔ open ↔ private ↔ closed s vysvětlením, `closed` potvrzen dialogem; ukládá `PATCH /worlds/:id` — **Korektor+**
- [x] **5.3c — Správa členů:** tabulka členů (`GET /worlds/:id/members`), změna role / skupiny / AKJ; hierarchie (PJ nedemotuje sebe, promote na PJ s confirm); barvy skupin přes `PUT .../settings` — **PomocnyPJ+** (barvy skupin PJ+)
- [x] **5.3d — AKJ — úrovně viditelnosti stránek:** editor `akjTypes` (přidat/přejmenovat/smazat/level); ukládá `PUT /worlds/:worldId/settings/akj-types` — **PomocnyPJ+**
- [x] **5.3e — Leave world:** „Odejít ze světa" (Čtenář+, ne PJ), confirm, `DELETE .../members/:membershipId`, invalidace `useMyWorlds`, redirect `/` — **uzavírá D-064**
- [x] **5.3f — Theme světa (selektor + editor):** preset grid `listThemes('world')` + editor barevných tokenů (hex/alpha), upload pozadí, živý náhled, kontrast guard; ukládá `themeId` / `themeOverrides` / `themeBackgroundUrl` přes `PATCH /worlds/:id`
- [x] **5.3g — úklid:** `mobil-desktop` audit (responzivita v CSS), `napoveda` aktualizace

### - [x] 5.2 World dashboard (`/svet/:worldSlug`)

*Member větev `WorldDashboardPage` přestavěna na 3sloupcový dashboard — věrná replika starého Matrixu (`WorldInfo.tsx`). Non-member / pending větve beze změny z 2.4. Spec: [spec-5.2.md](arch/phase-5/spec-5.2.md), plán: [plan-5.2.md](arch/phase-5/plan-5.2.md).*

- [x] **Akce** (levý sloupec) — nadcházející herní akce světa (`GET /game-events?worldId=`), karty s datem, „Zobrazit další"
- [x] **Novinky** (prostřední sloupec) — oznámení světa (`GET /world-news?worldId=` — světové + globální) + tvorba/editace/mazání pro PomocnyPJ+ (editor modal)
- [x] **Oblíbené stránky** (pravý sloupec) — placeholder nad `favoritePageSlugs`; wiki modul = krok 7
- [x] **Statistiky** — spodní lišta: počet hráčů / nadcházejících akcí / novinek
- [x] **Layout** — 3 / 2 / 1 sloupec dle šířky; `mobil-desktop` audit (responzivita v CSS)

### - [x] 5.4 Restrukturalizace stránky světa (`/svet/:worldSlug`)

*Krok 1 záměru „změnit skiny v rámci světa" — sjednocení shared struktury stránky světa. Nízký hero banner místo 16:7 panoramatu, název nahoře, oddělení member / non-member obsahu. Spec: [spec-5.4.md](arch/phase-5/spec-5.4.md), plán: [plan-5.4.md](arch/phase-5/plan-5.4.md).*

- [x] **Hero** — nízký pruh `clamp(180px, 24vh, 240px)` místo `aspect-ratio: 16/7`; název + badge v horní části, overlay ztmavuje horní okraj
- [x] **Member větev** — `WorldDetailInfo` se členovi nerenderuje; pořadí hero → dashboard → `WorldAboutPanel`
- [x] **`WorldAboutPanel`** — nová sbalitelná komponenta (`<details>`) pod dashboardem: popis + tóny + kostky
- [x] **Vertikální rytmus** — jednotný `gap` na `.page` místo roztroušených `margin-top`
- [x] **Úklid** — `mobil-desktop` audit (responzivita v CSS)

### - [x] 5.5 Rozšíření world dashboardu + stránky akcí a novinek

*Limity dashboard sloupců + plné stránky kalendáře akcí a novinek světa. Spec: [spec-5.5.md](arch/phase-5/spec-5.5.md), plán: [plan-5.5.md](arch/phase-5/plan-5.5.md).*

- [x] **5.5b — BE `world-news`** — `archived` pole, `scope` (active/archived/all), offset paginace, `GET /world-news/count`, `POST /:id/archive` + `/unarchive`; oprava cesty `/news` → `/world-news`
- [x] **5.5c — Kalendář akcí světa** — plná stránka `/svet/:worldSlug/kalendar` (měsíční mřížka, i minulé akce); `calendarGrid.ts` přesunut do `shared/lib` (sdílí s globální `AkcePage`)
- [x] **5.5d — Stránka novinek světa** — `/svet/:worldSlug/novinky` (archiv + paginace, 1:1 jako globální `NovinkyPage`); odkaz v nav
- [x] **5.5a — Dashboard sloupce** — limity Akce 3 / Novinky 3 / Oblíbené 10 + tlačítka „na vše" pod sloupci
- [x] **Úklid** — `mobil-desktop` audit, `napoveda` (kalendář + novinky → ✅)

> **Mimo rozsah:** tlačítko Oblíbené funkčně + připnuté stránky = krok 7 (wiki modul). Otevřený dluh D-071 (drift světové vrstvy v nápovědě).

### - [x] 5.6 Stránka hráčů světa (adresář členů)

*Adresář členů `/svet/:worldSlug/hraci` — vedení a členové po skupinách. Spec: [spec-5.6.md](arch/phase-5/spec-5.6.md), plán: [plan-5.6.md](arch/phase-5/plan-5.6.md).*

- [x] **Stránka `WorldMembersPage`** — sekce PJ + Pomocní PJ, skupiny s členy, „Bez skupiny"; Zadatelé skryti
- [x] **`MemberCard`** — avatar + jméno + role chip; skupiny nesou barvu z `groupColors`
- [x] **Vstupy** — klikací dlaždice „Hráči" ve `StatBar` + položka „Hráči" v nav (Společenství)
- [x] **Úklid** — `mobil-desktop` audit, `napoveda` (Hráči světa → ✅)

> **Mimo rozsah:** veřejná stránka postavy + deníky = fáze 8 (character flow); `MemberCard` má pro ně připravený slot.

### - [x] 5.7 Reforma vzhledů světa — 11 žánrových skinů + Ikaros styl ✅ (2026-05-19)

*Přestavba sady vzhledů světa od základu: 12 world skinů (11 žánrů + Ikaros) místo dnešní směsi 37 motivů, zúžení wizardu na 11 žánrů + „Vlastní", zrušení per-uživatel overridu. Master spec: [spec-5.7.md](arch/phase-5/spec-5.7.md). Implementace skin po skinu — každý podkrok má vlastní design spec + prompt soubor pro assety (vzor 1.0c–1.0s).*

#### - [x] 5.7a Infrastruktura ✅ (2026-05-18)
- [x] `scope` flip 21 platformových skinů `both → platform`; `types.ts` / `registry.ts` (37→22 motivů)
- [x] zrušení `WorldThemeSwitcher` + `worldThemeOverridesAtom`; `useWorldTheme` → `resolveWorldTheme`
- [x] `genres.ts` → 11 žánrů + „Vlastní"
- [x] skin `ikaros` (fialové synthwave) + pozadí `ikaros.webp` + JS `MatrixRain` efekt (`Theme.effect`)
- [x] vstup do Nastavení světa (ikona ⚙ v headeru); separace platform/world selektorů
- [x] BE migrace existujících světů (`migrate-world-theme-5.7`) + seed Matrix světa; `mobil-desktop` audit

#### - [x] 5.7b–5.7l Žánrové skiny (11×) ✅ (2026-05-19)
- [x] **5.7b Fantasy** ✅ (2026-05-19) — elfí síň, zlato/smaragd na noční smaragdové
- [x] **5.7c Dark Fantasy** ✅ (2026-05-19) — gotická katedrála, krvavý měsíc, krkavci
- [x] **5.7d Sci-Fi** ✅ (2026-05-19, slug `vesmir`) — můstek hvězdné lodi, ledová cyan
- [x] **5.7e Cyberpunk** ✅ (2026-05-19) — korporátní megablok, kyselá žluť/černá
- [x] **5.7f Steampunk** ✅ (2026-05-19) — parní metropole, mosaz a měděná patina
- [x] **5.7g Post-apokalypsa** ✅ (2026-05-19, slug `apokalypsa`) — zarostlé město, mechová zeleň
- [x] **5.7h Horor** ✅ (2026-05-19) — opuštěné sídlo, chvějivá svíčka, tma
- [x] **5.7i Mystery** ✅ (2026-05-19) — deštivá noirová ulice, žluté světlo lampy
- [x] **5.7j Historický** ✅ (2026-05-19, slug `historie`) — barokní sál, zlato a vinná červeň
- [x] **5.7k Současnost** ✅ (2026-05-19, slug `moderni`) — útulný večerní interiér, terakota
- [x] **5.7l Western** ✅ (2026-05-19) — prašné pohraniční městečko za soumraku
- [ ] každý skin = design spec (paleta + signature ornament) → `prompts-5.7X-<skin>-assets.md` → impl (`index.ts` + `decorations.css`) → `mobil-desktop` audit

### - [x] 5.8 Jednotná 3D vrstva UI světa ✅ (2026-05-19)

*UI prvky uvnitř světa z plochého „glass" stylu na 3D matnou hmotu — scoped `[data-world-shell]`, globální platforma beze změny. Spec: [spec-5.8-3d-buttons.md](arch/phase-5/spec-5.8-3d-buttons.md).*

- [x] **sk.1** — `data-world-shell` hook + 3D button systém (`Button` scoped, `--depth-*` tokeny)
- [x] **sk.2** — 3D panely (`[data-frame-panel]` / `data-elev="panel"`)
- [x] **sk.3** — 3D karty a dlaždice (`data-elev="card"`, hover se zvedne)
- [x] **sk.4** — 3D hlavička a navigace (raised tlačítka, zamáčknutá aktivní nav)
- [x] **sk.5** — 3D zapuštěná vstupní pole
- [x] hloubkové tokeny v `tokens.css`, scoped vrstva `_shared/world-depth.css`

### - [x] 5.9 Uživatelské doladění vzhledu (přístupnost) ✅ (2026-05-19)

*Per-uživatel barevné doladění (jas / kontrast / barvy) nad sdíleným skinem — svět i platforma. Skin a font se nemění. Spec: [spec-5.9-user-theme-a11y.md](arch/phase-5/spec-5.9-user-theme-a11y.md).*

- [x] **rovina A — svět** — `WorldMembership.themeAdjust` + `themeUserOverrides`, endpoint `PUT /worlds/:worldId/members/me/theme`, tab „Můj vzhled" (`Čtenář+`), vrstvení ve `WorldLayout`
- [x] **rovina B — platforma** — `User.themeSettings` (adjust + overrides), sekce „Doladění vzhledu" v profilu, vrstvení v `ThemeProvider` + `IkarosLayout`
- [x] jas/kontrast přes `filter` na obsahové vrstvě (nerozbije `fixed` prvky); `bgDim` odložen

---

**Uzavírá dluhy:** D-064 (leave world — 5.3e).

**Nové dluhy z 5.3:**
- **D-NEW-world-transfer** — předání vlastnictví světa (`ownerId`) jinému uživateli; BE endpoint neexistuje. Blokuje PJ leave.
- **D-NEW-slug-rename** — změna slugu světa (vyžaduje redirect strategii starých odkazů); v 5.3a je slug read-only.

**Závislosti / návaznosti:**
- 5.1 header „postava" → plně až **fáze 8** (character flow).
- 5.2 „poslední stránky" → **fáze 7** (wiki), eventy → příp. **fáze 9** (game events).
- 5.0a vyžaduje zásah do **BE repa** (`Projekt-ikaros`) — jediný BE krok fáze 5.

**Mimo rozsah:**
- Character flow (Čtenář → Žadatel → Hráč s postavou) → fáze 8.
- Headline builder (custom menu světa, `hiddenNavItems`/`customHeadline`) → fáze 12.
- World invites (pozvánky PJ → user, D-NEW-world-invites) → fáze 12.
- „Poslední stránky" na dashboardu → po fázi 7.

---

## Fáze 6 — Svět — chat

*Chat uvnitř konkrétního světa (`/svet/:worldId/chat`) — víc konverzací seskupených do kanálů, na rozdíl od globální Hospody/Rozcestí (fáze 4). Fáze 6 přenáší **plný feature set světového chatu starého Matrixu** (`Matrix/frontend/src/pages/World/WorldChat.tsx` + `components/Chat/*`) — kanály/konverzace, dice roll, NPC mód, RP datum, editace, custom emotes — postavený nad novým BE.*

> **Názvosloví** (PJ 2026-05-19): **kanál** = sbalovací kontejner v sidebaru (BE `ChatGroup`); **konverzace** = chatovací místnost uvnitř (BE `ChatChannel`). Kód a WS drží BE názvy (`ChatChannel`, `channelId`); v textu níže `ChatGroup` = kanál, `ChatChannel` = konverzace.

**BE:** modul `chat` (`backend/src/modules/chat`) je **z velké části hotový** — `ChatGateway` (Socket.IO), `ChatService` (CRUD kanálů/konverzací/zpráv), schémata `ChatGroup` / `ChatChannel` / `ChatMessage`. REST pod `worlds/:worldId/chat/*`. Umí: accessMode konverzací (`all`/`roles`/`members`), whisper (`visibleTo`), reply, emoji reakce, editaci zpráv, NPC override (`overrideName`/`overrideAvatarUrl`), `rpDate`, `customFont`, `color`, detekci dice rollu (`isDiceRoll`), read status (unread counts), soft-delete, push notifikace. Na `world.created` se automaticky zakládá kanál „Globální" (konverzace „obecný") + kanál „Postavy" (konverzace „hráči").
**WS eventy:** `typing:start` / `typing:stop` → broadcast `chat:typing`; event-emitter `chat.message.created/updated/deleted`, `chat.channel.*`, `chat.group.*`, `chat.unread.updated`. WS room pattern `chat:${channelId}`.

**Fáze 6 = převážně FE** — napojení na hotový BE + **reuse chat infry z fáze 4** (`src/features/chat/` — `ChatRoom`, `MessageList`, `MessageItem`, `ChatInput`, `UserList`, `MessageAttachments`, socket hooky).

**„Lépe a správněji" vs. starý Matrix:**
- Přílohy = unified `attachments[]` (obrázky + dokumenty) místo starého rozštěpeného `Image` + `Images[]`.
- Přístup ke konverzaci = `accessMode` (`all`/`roles`/`members`) + `allowedRoles`/`allowedMemberIds` místo legacy stringu `GroupRequired` + `RoleRequired: int`.
- Real-time = Socket.IO + perzistence v Mongu místo SignalR + in-memory `ConcurrentDictionary`.
- Reakce/reply/whisper = jednotné s globálním chatem (fáze 4), ne duplicitní implementace.

**Pořadí stavby:** 6.1 → 6.2 → 6.3 → 6.4 → 6.5.

**Rozhodnutí (delegováno autorem 2026-05-17):**
- Fáze 6 **nedescopuje** featury, které starý Matrix měl — editace zpráv, RP datum, NPC mód, custom emotes zůstávají v rozsahu.
- **Custom emotes přesunuty z fáze 13.4 do kroku 6.4** — per-svět feature světového chatu, patří sem (13.4 se tím ruší / sloučí).
- NPC mód: BE override pole hotová → použitelné hned (free-text); výběr identity z **adresáře postav** se zpřesní ve fázi 8, ale samotný mód je už v 6.2.
- Dice roll = samostatný krok **6.3** (vlastní roll engine + rendering).

**Klíčové reference (vstup pro spec):**
- FE nový: `src/features/chat/components/` (`ChatRoom`, `MessageList`, `MessageItem`, `ChatInput`, `UserList`, `MessageAttachments`, `EmojiPickerPopover`), `src/features/chat/api/` (`socket.ts`, `useSocket.ts`, `useGlobalChat.ts`, `usePresenceHeartbeat.ts`), `src/features/chat/lib/` (`types.ts`, `attachments.ts`, `emotes.ts`, `chatColorGuard.ts`)
- FE stub: `src/features/world/pages/WorldChatPage.tsx`; routa `/svet/:worldSlug/chat` (`memberOnly` guard)
- Starý Matrix (funkční vzor): `Matrix/frontend/src/components/Chat/` (`ChatSidebar`, `ChatArea`, `MessageComposer`, `ChatUserList`, `ChatGroupManager`, `chatHelpers.ts`), `src/utils/diceHelpers.ts`

---

### - [x] 6.1 Světový chat — shell + konverzace

*FE shell nad hotovým BE. Cíl: funkční 3-panelový chat (sidebar | zprávy | přítomní — panel přítomných jen PJ) s přepínáním konverzací. Spec: `docs/arch/phase-6/spec-6.1.md`. **Hotovo 2026-05-19.***

- [x] **6.1a — Nová world-chat vrstva:** paralelní `WorldChatRoom` + world API hooky nad `worlds/:worldId/chat/*` (fáze 4 `ChatRoom` se nemění); reuse prezentačních komponent `MessageList` / `MessageItem` (rozšířeny o `allowReply`/`allowReactions`); dedikovaný `ChannelComposer` místo úpravy `ChatInput`; socket room `chat:${channelId}`
- [x] **6.1b — Sidebar kanálů + konverzací:** hierarchie `ChatGroup` → `ChatChannel`, barevné kódování kanálů, přepínání konverzace, sbalování kanálů, náhled poslední zprávy u konverzace; konverzace filtrované dle `accessMode` a role uživatele — `GET /worlds/:worldId/chat/groups`
- [x] **6.1c — Připnutí konverzací:** uživatelské připnutí oblíbených konverzací do horní sekce sidebaru (per-user `chatPreferences.pinnedChannelIds`, jako starý Matrix)
- [x] **6.1d — Real-time + presence:** subscribe/unsubscribe na WS room konverzace, typing indikátor, broadcast nových/editovaných/smazaných zpráv; živá presence v konverzaci (BE dostavba `ChatGateway`), panel přítomných **jen PJ/Pomocný PJ** — roster grupovaný dle world role (Vypravěči / Korektoři / Ostatní), časový štítek „naposledy viděn" (`User.lastSeenAt`, respektuje `hiddenPresence`)
- [x] **6.1e — Read status:** unread counts per konverzaci (`GET /worlds/:worldId/chat/unread`), badge v sidebaru i u nav položky Chat, `POST .../channels/:id/read`; soft-deleted zprávy zobrazené jako „Zpráva byla smazána"
- [x] **6.1f — Zakládání kanálů a konverzací (PJ):** vtaženo z 6.5 — PJ/Pomocný PJ zakládá kanály a konverzace (`accessMode` all/roles/members), hromadná akce „1:1 se všemi hráči", obrázek kanálu
- [x] **6.1g — Auto-zakládání kanálů:** při založení světa kanály „Globální" + „Postavy"; za každou světovou družinu (`world.settings.updated` → `customGroups`) automaticky kanál + `members` konverzace; backfill existujících světů při startu BE (`onApplicationBootstrap`). Průběžná synchronizace členství = dluh `D-NEW-channel-group-sync`
- [x] `mobil-desktop` audit (3-panel layout → mobil kolaps na side-sheet) — CSS-level, touch terče ≥ 44px

### - [x] 6.2 Zprávy ve světovém chatu

*Plný feature set zprávy. Reuse z fáze 4 + dostavba featur, které měl jen starý Matrix. BE endpointy `worlds/:worldId/chat/channels/:id/messages`. Spec: `docs/arch/phase-6/spec-6.2.md`, design: `design-6.2.md`, plán: `plan-6.2.md`. **Hotovo 2026-05-20.***

- [x] **6.2a — Reply / reakce / whisper:** reuse `MessageItem`/`EmojiPickerPopover` z fáze 4; `useToggleReaction` REST → BE emit `chat.message.updated`; whisper přes `visibleTo` z DTO, `useChannelMembers` pro picker
- [x] **6.2b — Přílohy:** `POST /worlds/:worldId/chat/upload` (Cloudinary folder `world-chat/{worldId}/`); upload-on-send přes `useUploadWorldAttachment`; reuse `MessageAttachments` + `attachments.ts` limity
- [x] **6.2c — Editace zpráv:** `MessageEditInline` swap content → textarea (Enter uložit / Esc zrušit); `useEditMessage` PATCH; BE `editMessage` blokuje dice (`CHAT_DICE_NOT_EDITABLE`)
- [x] **6.2d — RP datum:** `<input type="date">` v composer popoveru, `RpDateBadge` nad jménem zprávy (`Intl.DateTimeFormat('cs-CZ')`)
- [x] **6.2e — NPC mód:** `NpcOverridePanel` inline pruh (jen `canManage`), sticky napříč zprávami; BE už ohlídá role v `sendMessage` (`CHAT_NPC_FORBIDDEN`)
- [x] **6.2f — Per-svět barva + font:** `WorldMembership.chatColor` + `chatFont` (whitelist 8 fontů v `chatFonts.ts`); `AppearancePopover` v composeru s live preview; BE `CreateMessageDto.color` na `@IsHexColor()` + server-side fill v `sendMessage` (řeší bug N1)
- [x] **6.2g — Custom emote rendering:** `renderChatContent` v `lib/` — statické `EMOTES` + per-svět `worldEmotes` mapa (6.4 ji naplní); `MessageItem.module.css` `.emote { height: 1.4em }`
- [x] **6.2h — Optimistic send + retry:** `clientNonce` (UUID v4) v DTO + sparse unique index `(channelId, clientNonce)`; `useOptimisticSend` (pending → swap po response/WS / failed → retry/discard chip v MessageItem)
- [x] **6.2i — Mentions `@user`:** `MentionAutocomplete` Discord-style picker; BE `sendMessage` regex extract + `ChatMessage.mentions: string[]`; mention-only push (jiní recipient nedostane), self-mention outline v `MessageItem`

### - [x] 6.3 Dice roll

*Hod kostkou v chatu. BE detekuje `isDiceRoll` z `dicePayload` (primární) nebo regexu (fallback); FE generuje hod + 3D CSS scénu se skinem (1820 textur ve 30 skinech). Spec: `docs/arch/phase-6/spec-6.3.md`, design: `design-6.3.md`, plán: `plan-6.3.md`. **Hotovo 2026-05-20.***

- [x] **6.3a Dice picker** v composeru — popover s rychlými typy kostek (Fate, k4..k20, k%) filtrovanými dle `World.dice` (krok 5.3a); Pool/Mixed linky, label/modifier inputs, link na skin picker. Prázdný stav s CTA „Otevřít nastavení světa" jen pro PJ.
- [x] **6.3b Roll engine** — port `diceHelpers.ts` (Fate 4dF, generic XdN, pool, mixed, d100), textová reprezentace `Hod Kostkou (3d6): [2,4,1] = +7` (BE regex kompatibilní); `dicePayload` discriminated union + buildery; 13/13 unit testů zelené.
- [x] **6.3c Pool prompt modal** — grid 3×3 karet typu kostky se steppery 0..20, pool režim disabluje ostatní typy po prvním výběru, mixed dovolí kombinaci; live total counter, „Hodit ▸" CTA.
- [x] **6.3d 3D rendering hodu** v `MessageItem` — CSS 3D scéna (port modelů ze starého Matrixu, ne three.js → 0 KB bundle impact); rolling animace (1.4 s chaos + slerp do TARGETS) pro čerstvé hody (≤ 5 s od `createdAt`), settled state pro historii a `prefers-reduced-motion`. Total v Iceland fontu s glow accent dle znamení (cyan +3+, rose −3−); Přetlak pulse pro Fate ≥ 7.
- [x] **6.3e Skin systém** — ~30 skinů v 5 kategoriích (core/elemental/draconic/undead/nature), 1820 textur v `public/textures/`. `WorldMembership.diceSkinMapping` per-typ volba s `default` fallbackem. SkinPickerPanel modal se sběratelskými kartami (140×180) a 3D cube náhledem dle aktivního typu. Render zprávy fixuje `ChatMessage.diceSkin` v okamžiku hodu.
- [x] **6.3f Guards** — BE už ošetřuje (`CHAT_DICE_NOT_EDITABLE` v 6.2c, `CHAT_DICE_FORBIDDEN` pro mazání); FE skrývá ✎ pro dice a 🗑 pro non-PJ; dice se nepočítají do unread (existující BE chování).
- [x] `mobil-desktop` audit — popover na mobilu jako bottom-sheet, pool modal full-screen, skin picker sidebar zaniká → horizontální chips kategorií. Composer 🎲 razítko 32×32 zařazeno do existující toolbar řady (5 + nové 6 razítek na mobilu se nepřeplní díky `flex-wrap` na sloupcích vlevo).

### - [x] 6.4 Custom emotes (per-svět + globální)

*Per-svět `:shortcode:` emotes + paralelně globální platformová sada. Přesunuto z fáze 13.4. Reference: starý Matrix `CustomEmote` + `WorldEmotesAdmin`. Spec: `docs/arch/phase-6/spec-6.4.md`, design: `design-6.4.md`. **Hotovo 2026-05-21.***

- [x] **6.4a — BE doplňky:** `imageUrl` field v schema/DTO/repo; limit 100/svět + 200 globálních (`EMOTE_LIMIT_REACHED`); `emote.deleted` event + `emote:deleted` / `emote:deleted-global` WS broadcast; `count*` repo metody. Existující CRUD endpointy + WS `emote:created` jsou hotové.
- [x] **6.4b — Render v chatu:** `useWorldEmotes` + `useGlobalEmotes` hooky s WS sync; `mergeEmoteSets` (per-svět priorita při kolizi); `buildEmoteUrl` přes Cloudinary `c_limit,w_128,h_128`; `WorldChatRoom → ChannelView → renderChatContent` propaguje `worldEmotes` mapu.
- [x] **6.4c — PJ admin per-svět:** stránka `/svet/:worldSlug/admin/emotes` (PomocnyPJ+); grid karet + counter progress bar 8/100; upload modal s kruhovým „sigil" drop targetem + tokenized shortcode input; kopírování do jiného světa.
- [x] **6.4d — Admin globální:** stránka `/ikaros/admin/emotes` (Admin+); nav položka „Emoty" v Administrace panelu IkarosLayout; sdílené komponenty s `variant: 'world' | 'global'`.
- [x] **6.4e — Picker v composeru:** `ChatEmotePickerPopover` se 3 sekcemi (Tohoto světa / Globální / Statické Unicode přes frimousse) + search; klik vloží `:shortcode:` nebo unicode na pozici kurzoru. Reakce na zprávy dál používají původní `EmojiPickerPopover`.
- [x] **6.4f — WS sync:** `emote:created` / `emote:deleted` (world room) + `emote:created-global` / `emote:deleted-global` (server-wide); aktualizace React Query cache bez nutnosti refresh.

### - [x] 6.5 Správa kanálů a konverzací (PJ)

*Edit/mazání + nastavení přístupu pokryto 6.1f (`GroupDialog` / `ChannelDialog`); v 6.5 dodán drag-drop reorder + barva/ikona kanálu. Spec: `docs/arch/phase-6/spec-6.5.md`. **Hotovo 2026-05-21.***

- [x] Editace / mazání kanálů a konverzací (pokryto 6.1f — `GroupDialog`, `ChannelDialog` s `mode: 'edit'` a delete confirm)
- [x] Nastavení konverzace — `accessMode` (`all`/`roles`/`members`), `allowedRoles`, `allowedMemberIds` (6.1f); pořadí (`order`) přes drag-drop (6.5b)
- [x] **6.5a/b** Reorder kanálů a konverzací (drag-drop, `@dnd-kit/core` + `sortable`); **6.5c** barva kanálu (12 preset slotů + Auto) + ikona kanálu (24 lucide ikon + Bez ikony); BE `POST /chat/groups/reorder` + `/chat/channels/reorder` (bulk, `MIXED_GROUPS` guard pro channels)
- [x] `mobil-desktop` audit (drag handle 44×44 px touch terč, long-press 250 ms aktivace), `napoveda` aktualizace (PJ správa chatu — drag-drop reorder, barva/ikona kanálu)

### - [x] 6.6 Hledání ve zprávách

*Hledání ve zprávách světového chatu (Messenger/Discord styl). Přesunuto z fáze 13.1. Spec: `docs/arch/phase-6/spec-6.6.md`. **Hotovo 2026-05-19.***

- [x] BE — search endpoint `GET /worlds/:worldId/chat/search` (substring v `content`, přístupové + whisper filtry), `searchInChannels` v message repo
- [x] FE — `ChatSearchModal` (celý svět + filtr konverzace), `useSearchMessages` hook, lupa v hlavičce konverzace
- [x] Klik na výsledek přepne na konverzaci

---

**Závislosti / návaznosti:**
- 6.2d RP datum → plné propojení s kalendářem světa až **fáze 9.2**.
- 6.2e NPC mód → výběr identity z adresáře postav až **fáze 8**.
- 6.3 dice picker čte `World.dice` → závisí na **5.3a** (editace světa).
- 6.2b (upload endpoint) a 6.4 (modul custom emotes) mohou vyžadovat zásah do **BE repa** — ověřit ve spec.

**Mimo rozsah (nebylo ani ve starém Matrixu):**
- Threads / hierarchické reply, message pinning → mimo MVP.

> Pozn.: Fulltextové hledání ve zprávách bylo původně plánováno na fázi 13.1 — přesunuto a dodáno jako krok **6.6**.

---

## Fáze 7 — Svět — Wiki stránky

*Encyklopedie uvnitř světa — typované stránky (lokace, lore, pravidla, novinky) s rich-text obsahem, datovými tabulkami a granulárními přístupovými právy.*

**BE:** modul `pages` (`backend/src/modules/pages`) je **z velké části hotový** — schema / repository / service / controller (15 endpointů pod `/worlds/:worldId/pages*`). Umí: 7 typů stránek, `content` jako HTML string, `accessRequirements` (`UserId`/`AKJ`/`Role`/`AKJType` — per-world), `table` / `sections` / `galleryImages` / `videos` / `customData`, `order`, `isWoodWide`, `plainText` (extraktor HTML→text), oblíbené (`World.favoritePageSlugs` + add/remove endpointy), directory + random + meta endpointy, fulltext/embedding search integraci. Write = `PomocnyPJ+`. Na `POST /worlds` se zakládá 5 šablonových stránek.
**Typy stránek (BE enum):** `Lokace`, `Noviny`, `Seznam`, `Galerie`, `Rodokmen`, `Obrazovka`, `Ostatní`.

**Fáze 7 = FE** — všechny 4 FE stránky jsou stuby. Napojení na hotový BE + **reuse z fáze 3.2 (Články)**: `RichTextEditor` (`src/shared/ui/RichTextEditor/` — bubble menu, `RTEToolbar`, `useDraftAutoSave`, Image extension), `AutoTOC` (`src/features/ikaros/`), `useUploadContentImage` (`POST /upload/content-image`). Articles pattern (list / detail / editor) = vzor.

**Rozhodnutí (delegováno autorem 2026-05-17):**
- **Postavy nejsou stránky.** Starý Matrix měl PC/NPC jako typy stránky; nový BE má oddělený modul `characters`. Krok 7 = jen encyklopedie světa; PC / NPC / deník / finance / poznámky → **fáze 8** (`characters` modul, jako subdokumenty postavy).
- Typy `Finance` / `Batoh` ze starého Matrixu se do `pages` **nevracejí** — jsou to data postavy → fáze 8.
- `content` = HTML string (jako Články 3.2), ne TipTap JSON jako starý Matrix.

**Co staré umělo a necháváme (přenos ze starého Matrixu):**
- Typované stránky se speciálním layoutem — Noviny (titulek + metadata Stát/Vydavatel/Datum), Galerie (`galleryImages`), Rodokmen (strom), Seznam.
- Datové **šablony** stránky — vyplní `table` (hlavičky + hodnoty); systém šablon **rozšiřitelný** o nové (config-driven, ne hardcoded `switch` jako starý Matrix).
- Boční panel stránky — hero obrázek + datová tabulka („profil").
- Collapsible **sekce** (`sections`).
- Přístupová práva — whitelist uživatelů + min. AKJ + role (`accessRequirements`), AKJ banner.
- Oblíbené stránky (hvězdička), poslední editované.

**Přidružené artefakty (kaskáda) — řeší krok 8:**
Wiki stránka typu `Lokace` (krok 7) = encyklopedický článek o místě (**lore, bez kaskády**). Interaktivní entity (PC / NPC / location-entita) a jejich kaskáda subdokumentů (kalendář, deník, finance, výbava, poznámky) patří do **fáze 8** (`characters` modul, BE event `character.created`). „Lokace" má tedy dva významy — lore stránka (zde) × location-entita (krok 8).

**Pořadí stavby:** 7.1 → 7.2 → 7.3 → 7.4.

**Klíčové soubory:**
- FE stuby: `src/features/world/pages/` — `PageViewerPage`, `PageEditorPage`, `PagesListPage`, `PagesAdminPage`
- Routy: `/svet/:worldSlug/:slug` (viewer, catch-all), `/nova-stranka` + `/edit/:slug` (editor), `/stranky` (index), `/admin/stranky` (PJ)
- Reuse: `src/shared/ui/RichTextEditor/`, `src/features/ikaros/components/AutoTOC.tsx`, `src/features/ikaros/api/useUploadContentImage.ts`
- **Chybí a vznikne v 7.x:** API hooky (`usePages`, `usePage`, `useCreatePage`, `useUpdatePage`…), typ `WikiPage`

---

### - [x] 7.1 Page viewer (`/svet/:worldSlug/:slug`)

*Nahrazuje stub `PageViewerPage`. Catch-all routa — zůstává poslední v dětech `/svet/:worldSlug`. Spec: `docs/arch/phase-7/spec-7.1.md`. **Hotovo 2026-05-21.***

- [x] **7.1a — Render obsahu:** TipTap HTML read-only (reuse `RichTextEditor` v `readOnly` módu), `AutoTOC` (obsah z `<h2>`/`<h3>`, scroll-spy, mobile accordion)
- [x] **7.1b — Typové layouty:** 7 typů — Lokace, Noviny (metadata HUD z `customData`), Galerie (grid + lightbox), Rodokmen (ZoomableImage 0.25–5×), Seznam (3-col nav/content/sidebar), Obrazovka (YouTube embed + video sidebar), Ostatní; boční panel = hero obrázek + datová tabulka
- [x] **7.1c — Přístup:** BE hlídá 403 → AccessDenied screen s `isWoodWide` hintem (přes `usePageMeta`); AKJ banner stylizovaný dle světa, **klikatelný → meta stránka `akj-<key>`**
- [x] **7.1d — Navigace:** breadcrumbs (4-level), favorite hvězda s optimistic update, broken-link detekce přes `useBrokenLinks` + slug index z `usePagesDirectory`
- [x] **7.1e — Sticky AutoTOC + scroll-spy:** reuse existující `AutoTOC` přes `data-article-content` selector, hash deeplink scroll
- [x] **7.1f — Inline image lightbox:** klik na jakýkoliv `<img>` v obsahu → `GalleryLightbox` (reuse z Galerie typu)
- [x] **7.1g — Read-time estimate:** „📖 ~N min čtení" v hlavičce (z `plainText`, 220 wpm)
- [x] **7.1h — Quote-on-select popup:** výběr textu (>5 znaků) → floating popup s Kopírovat citát + Anchor link na sekci
- [x] **7.1i — Floating quick-action dock:** vpravo dole — ⭐ favorite / ⬆ scroll-top / ✏️ edit / 🔗 copy URL; auto-hide na scroll down
- [x] **7.1j — `Cmd/Ctrl+K` palette:** fuzzy match z `usePagesDirectory`, arrow nav + Enter; vlastní `fuzzyMatch.ts` (žádná lib)
- [x] **7.1k — Keyboard shortcuts:** `f`/`e`/`Esc`/`?`/`g s`/`Ctrl+K` + help overlay; `useKeyboardShortcut`/`useKeyboardSequence` sdílené hooky
- [x] **7.1l — Backlinks panel „Odkazuje sem":** nový BE endpoint `GET /worlds/:worldId/pages/:slug/backlinks` (regex `$regex` přes `content` HTML); FE `usePageBacklinks` + `BacklinksPanel`
- [x] **7.1m — Print stylesheet:** `@media print` skryje UI chrome (dock, palette, breadcrumbs), rozbalí sekce, normalizuje barvy

### - [x] 7.2 Page editor (`/nova-stranka`, `/edit/:slug`)

*Nahrazuje stub `PageEditorPage`. Reuse `RichTextEditor` + panely. Spec: `docs/arch/phase-7/spec-7.2.md`. **Hotovo 2026-05-21.***

- [x] **7.2a — Rich-text editor:** reuse `RichTextEditor` + image upload + **table extension** (`@tiptap/extension-table` doinstalován)
- [x] **7.2b — Identita stránky:** title, type (7), slug (auto z titulku, manuál po edit zamrzne; warning v edit mode), hero + `bigImage`, isWoodWide, order
- [x] **7.2c — Datové šablony:** 6 config-driven presets (Stát/Město/Noviny/Projekt/Frakce/Organizace), template picker filtered dle type, přepis warning modal
- [x] **7.2d — Sekce:** add/remove + drag-reorder (@dnd-kit/sortable), per-section content (RichTextEditor) + items (text/qty/note)
- [x] **7.2e — Přístupová práva + AKJ creation flow:** AccessPanel s chips (UserId/AKJ/AKJType/Role), UserId autocomplete přes `useWorldMembers`, AKJ select primárně z dropdownu existujících; **AkjCreateModal s existence detection** (fuzzy match, exact match warn + disabled create, substring suggestions), slug collision auto-suffix, auto-create meta stránky `akj-<key>` s checkbox toggle + meta page collision silent skip; stale AKJ chip warning ikona
- [x] **7.2f — Auto-save draftu:** **plný form draft** (sections/table/galleryImages/videos/menu/customData/accessRequirements/...) přes nový `useFormDraftAutoSave`; debounce 3s, beforeunload warning, restore modal s preview (titul/typ/počet sekcí/obrázků/...)
- [x] **7.2g — `[[wikilink]]` autocomplete:** TipTap suggestion plugin (`@tiptap/suggestion` doinstalován), fuzzy match z `usePagesDirectory`, šipky+Enter+Esc, tippy.js dropdown
- [x] **7.2h — `Ctrl/Cmd+S` save shortcut:** reuse `useKeyboardShortcut` z 7.1, disabled v inputech/modalech
- [x] **7.2i — Type-switch warning modal:** detekce ztráty dat při změně typu (galleryImages/videos/menu/customData), konzervativní (data v BE zůstávají)
- [x] **7.2j — Live preview split view:** sticky pravý panel, debounce 300ms, virtualPage → PageViewer, hidden mobile (<1024px)
- [x] **7.2k — Optimistic concurrency:** BE service kontroluje `expectedUpdatedAt`, vrací 409 PAGE_CONFLICT pokud stránka mezitím změněna; FE ConflictModal s 3 volbami (Refresh / Přepsat / Zrušit)
- [x] **Type-specific panely conditionally dle type:** GalleryPanel (upload + URL + caption + reorder), VideosPanel (YouTube URL parse + thumbnail + reorder), MenuPanel (label/href + reorder), CustomDataPanel (Stát/Vydavatel/Datum/Číslo vydání/Šéfredaktor)
- [x] **DeletePageModal:** confirm dialog s typem slug pro misclick protection

### - [x] 7.3 Index stránek (`/svet/:worldId/stranky`) ✅ (2026-05-22)

*Nahrazuje stub `PagesListPage`. Member-facing přehled encyklopedie světa.*

- [x] Seznam stránek (`GET .../pages/directory` — lightweight), filtr dle typu, hledání
- [x] Oblíbené stránky uživatele, prokliky na viewer
- [x] `mobil-desktop` audit
- [x] FavoritePagesColumn (dashboard) — tituly místo slugů

### - [x] 7.4 Správa stránek (`/svet/:worldId/admin/stranky`) ✅ (2026-05-22)

*Nahrazuje stub `PagesAdminPage`. PJ (Admin/Superadmin bypass).*

- [x] Přehled všech stránek světa, řazení (klik na hlavičku), poslední editace
- [x] Mazání stránek jednotlivé i hromadné (výběr checkboxy)
- [x] BE: `updatedAt` v directory projekci
- [x] `mobil-desktop` audit, `napoveda` aktualizace

---

**Závislosti / návaznosti:**
- Wiki stránka `Lokace` (krok 7) = lore článek bez kalendáře; interaktivní lokace s kalendářem = location-entita v kroku **8**.
- AKJ (stupňovaná viditelnost stránek): definice + přejmenování úrovní = krok **5.3d**, přiřazení členům = **5.3c**, nastavení požadované úrovně na stránce = **7.2e**.
- Typ `Obrazovka` cílí na **fázi 10.3** (Dungeon Builder) — v kroku 7 jen základní render.

**Mimo rozsah:**
- Postavy (PC/NPC), deník, finance, poznámky → **fáze 8** (`characters` modul).
- Hierarchie stránek (parent-child strom) — BE ji nemá; organizace přes konvenci slugů a kategorie `menu`.
- Verzování / historie stránek → mimo MVP.

---

## Fáze 8 — Svět — Postavy

*Postavy uvnitř světa — PC (hráčské), NPC a location-entity. Každá postava nese veřejné/soukromé bio a 5 přidružených subdokumentů: deník, kalendář, finance, výbava (inventář), poznámky.*

**BE:** moduly `characters` + `character-subdocs` + `npc-templates` + `diary-schema-versions` jsou **z velké části hotové.**
- `characters` — CRUD (`/worlds/:worldId/characters*`), `publicBio`/`privateBio` + info bloky, `diaryData`, `extraBlocks`, `accessRequirements`, příznaky `isNpc`/`isLocation`, convert PC↔NPC, adresář.
- `character-subdocs` — 5 kolekcí (diary / calendar / finance / inventory / notes), vlastní GET/PATCH endpointy; finance umí měsíční příjmy + transakce + undo.
- `npc-templates` — CRUD + globální bestiář + import do světa.
- `diary-schema-versions` — verzované schéma deníku per svět+systém.
**Kaskáda subdokumentů je BE-hotová** — event `character.created`.

**Fáze 8 = převážně FE** — 3 FE stránky jsou stuby; vznikne i 4. (`/postavy`). Reuse `RichTextEditor` (bio, deníkové zápisy), `CharacterDetailModal` (existuje z fáze 4).

**Rozhodnutí (delegováno autorem 2026-05-17):**
- PC / NPC / location-entita = vše v `characters` modulu se subdokumenty. Postavy nejsou wiki stránky (potvrzeno v kroku 7).
- **„Lokace" má dva významy:** wiki stránka typu `Lokace` (lore článek, krok **7**) × location-**entita** (`isLocation=true`, krok **8**, nese kalendář + deník). Záměrně oddělené — stejný název, různé věci.
- Per-systémové character sheety starého Matrixu (D&D / GURPS / DrD / …) nahrazeny **schema-driven dynamickými fieldy** — pole postavy definuje `diary-schema-versions` per svět+systém. „Lépe a správněji": nový systém = nová šablona schématu, ne nová komponenta.
- Herní atributy (HP, zbroj, únava, schopnosti…) nejsou pevné sloupce — žijí v `diaryData`/`customData`/`extraBlocks` řízených schématem deníku.

**Kaskáda přidružených artefaktů (BE event `character.created`) — zachováno ze starého Matrixu:**
- **PC** → postava + kalendář + deník + **finance** + **výbava** + poznámky
- **NPC** → postava + kalendář + deník + poznámky
- **Location-entita** → záznam + kalendář + deník + poznámky
- Convert PC↔NPC (`character.converted`) → skryje / odkryje finance + výbavu
- Kaskáda je event-driven → snadno rozšiřitelná o další subdokument, pokud bude potřeba.

**Klíčové soubory:**
- FE stuby: `src/features/world/pages/` — `CharactersPage`, `MyCharacterPage`, `NPCDirectoryPage`
- FE reuse: `src/shared/ui/RichTextEditor/`, `src/features/chat/components/CharacterDetailModal.tsx`
- Routy: `/svet/:worldSlug/postava/:slug`, `/moje-postava`, `/postavy`, `/admin/adresar-postav`
- **Chybí a vznikne v 8.x:** API hooky (`useCharacters`, `useCharacter`, `useMyCharacter`, subdoc hooky), typy postav, slot postavy ve `WorldContext`
- Starý Matrix (vzor): `Matrix/frontend/src/pages/CharacterSheet.tsx`, `components/diary/StructuredDiary.tsx`, `finance/FinanceViewer.tsx`, `inventory/StructuredInventory.tsx`, `Map/CustomDiaryBuilder.tsx`, `pages/CharacterDirectory.tsx`

**Pořadí stavby:** 8.1 → 8.2 → 8.3 → 8.4 → 8.5.

### - [x] 8.1 Detail postavy (`/svet/:worldId/postava/:slug`)

*Character sheet — bio + 5 subdokumentů v tabech. Reuse `RichTextEditor`.*

- [x] **8.1a — Hlavička + bio:** avatar, `publicBio` + `publicInfoBlocks`; `privateBio` + `privateInfoBlocks` jen PJ/vlastník; přístup dle `accessRequirements` (AKJ / role / whitelist)
- [x] **8.1b — Deník:** sekce (`sections`), dynamické fieldy dle schématu deníku, `RichTextEditor` pro zápisy; `GET/PATCH .../diary`
- [x] **8.1c — Finance:** zůstatek, měsíční příjmy (`entries`), historie transakcí, „zaúčtovat měsíc" + undo; `.../finance` + `add-monthly` + `undo`
- [x] **8.1d — Výbava:** inventář v sekcích s položkami (text / množství / poznámka); `GET/PATCH .../inventory`
- [x] **8.1e — Poznámky:** soukromé poznámky postavy; `GET/PATCH .../notes`
- [x] **8.1f — Kalendář postavy:** náhled / odkaz; plný kalendář = fáze 9.2; `GET/PUT .../calendar`
- [x] **8.1g — Extra volné bloky:** `extraBlocks` (volné schema bloky nad rámec šablony)
- [x] **8.1-FIR — Finance / Výbava redesign + recovery** (2026-05-24): Matrix-style hero karta s zůstatkem + split příjmy/výdaje + profilová aside karta (portrait + 🛡️🔑💶🔄 metadata + „Odpojit účet"); Výbava jako collapsible sekce s inline qty stepperem + „Rozepsané" RichText karta. BE lazy-create Finance + Inventory pro **všechny** typy postav (Matrix nedělil PC/NPC/Lokaci); kaskáda `character.created` rozšířena. Subdoc taby (Finance/Výbava/Kalendář/Deník/Poznámky) **jen pro PJ/PomocnyPJ a vlastníka** — Lokace dorovnána na PomocnyPJ+ read. Nová `SubdocErrorState` (404 NOT_APPLICABLE deprekováno, retry pro 5xx). Pole `notes: string` přidáno do `CharacterFinance` + `CharacterInventory` schématu. Spec: [arch/phase-8/spec-8.1-finance-inventory-recovery.md](arch/phase-8/spec-8.1-finance-inventory-recovery.md), plán: [arch/phase-8/plan-8.1-finance-inventory-recovery.md](arch/phase-8/plan-8.1-finance-inventory-recovery.md).

### - [x] 8.2 Adresář postav + tvorba / mazání / convert

*Vznik postavy spustí BE kaskádu subdokumentů (PC / NPC / Lokace). Adresář vyřeší vstupní bod tvorby. Rozsah upraven 2026-05-22: jádro adresáře přesunuto sem z 8.3.*

- [x] Adresář postav `/svet/:worldSlug/postavy` — 3 sekce (PC / NPC / Lokace), filtr typu, karty s prokliky (`GET .../characters/directory`)
- [x] Formulář vytvoření (`CreateCharacterModal`) — jméno, slug, typ, hráč (PC), avatar, bio; `POST .../characters`
- [x] Po vytvoření se automaticky založí přidružené subdokumenty (BE `emitAsync` — 201 přijde s kompletní kaskádou)
- [x] Convert PC ↔ NPC — `PATCH .../convert`; BE skryje/odkryje finance + výbavu; v hlavičce detailu (kebab menu, PJ)
- [x] Přiřazení postavy hráči — `PATCH .../members/:id/character` (`characterPath` = slug); v `MemberRow` (PomocnyPJ+/sám); tvorba PC pro člena (PJ)
- [x] Mazání postavy (PJ) — kaskáda subdokumentů (`character.deleted`) + vyčištění `characterPath` členů

### - [x] 8.3 `/moje-postava` + slot ve `WorldContext` + member-facing vychytávky adresáře ✅ (2026-05-23)

*Vlastní postava přihlášeného hráče + dotažení adresáře o hledání a seskupení.*

**Spec:** `docs/arch/phase-8/spec-8.3.md` ✅ schváleno 2026-05-23

- [x] **Slot postavy ve `WorldContext`** (dotahuje krok 5.1) — `WorldLayout` čte `membership.characterPath`, dohledá entry v `useCharacterDirectory` cache (žádný nový BE endpoint) a naplní `character: { characterPath, name, avatarUrl }`. Header se aktualizuje automaticky, do té doby fallback na účet (řádky 201–209). Fix invalidace `['worlds', 'my']` v `useUpdateMemberCharacter` (jinak by se slot neaktualizoval do staleTime 5 min).
- [x] **`/moje-postava` redirect + fallback** — `MyCharacterPage` přestal být stub. Šťastná cesta: `<Navigate replace>` na detail. Fallback: 3 stavy (loading / žádná postava / stale slug — postava smazána). PJ varianta fallbacku má sekundární CTA „Vytvořit postavu" s `?create=1` query trigger; adresář otevře `CreateCharacterModal` a vyčistí param.
- [x] **Adresář — fulltext hledání** — toolbar nad `FilterBar` s search inputem; klient-side filtr přes `normalize()` util (lower-case + NFD-strip diakritika), hledá v `name | slug | playerName`. Empty state s tlačítkem „Vymazat hledání". URL state `?q=`.
- [x] **Adresář — oblíbené** — hvězdička overlay top-right na `CharacterCard` (`stopPropagation`, touch target 32→36 px na mobilu). Hook `useFavoriteCharacters` přes `useSyncExternalStore` (idiomatic React pro externí store) + cross-tab sync přes `storage` event + manual dispatch pro same-tab sync. Per (`userId` × `worldId`) v localStorage, max 200 slugů. Sekce „Oblíbené" se objeví nad PC/NPC/Lokace jen když `favorites.size > 0`.
- [x] **Adresář — seskupení dle herních skupin** — `▦ Skupiny` pill toggle v toolbaru. Když aktivní, PC sekce se rozdělí na pod-sekce dle `membership.group` (`WorldSettings.customGroups`) + „Bez skupiny" jako poslední. Barva skupiny (`WorldSettings.groupColors`) jako accent pásek vlevo u pod-sekce. NPC + Lokace beze změny (nemají group). URL state `?group=1`.
- [x] **`mobil-desktop` audit** — toolbar wrap na 2 řádky pod 768 px, search input 40 px na mobilu, group pill 44 px, fav button 36 px, btn CTA v MyCharacterPage full-width column layout na mobilu.

**Testy:** 22 nových v hlavní vlně (normalize 3, useFavoriteCharacters 5, MyCharacterPage 6, CharacterDirectory rozšíření o 8 testů — search/favorites/grouping). WorldLayout test rozšířen o mock `useCharacterDirectory`. Celkem 1014 FE testů ✓, build ✓, lint nemá nové errors v 8.3 souborech.

**Follow-up (2026-05-23) — D-074 + D-075 uzavřeny v rámci stejné fáze:**
- **D-074:** BE `User.favoriteCharacters: Map<worldId, slug[]>` + `PUT /users/me/favorite-characters/:worldId`. FE `useFavoriteCharacters` refaktor z `useSyncExternalStore` na TanStack Query (optimistic update přes `api.put`) + jednorázová migrace z localStorage do BE. Oblíbené sdílené napříč zařízeními.
- **D-075:** BE `GET /users/me/characters` cross-world agregátor (membership × character × world join, sort `worldName` cs). FE hook `useMyCharactersGlobal` + nová sekce `MyCharactersSection` v `/ikaros/profil` (grid karet, link na detail postavy ve světě).
- BE +9 testů (1361 ✓), FE +11 testů (1031 ✓), prettier čistý.

**Uzavírá / souvisí:** Naplňuje slot postavy ve `WorldContext` připravený od kroku 5.1; doplňuje invalidaci `useMyWorlds` cache v `useUpdateMemberCharacter` (latentní bug — PJ změna postavy se neprojevila v session žadatele do staleTime). Po follow-upu **fáze 8.3 nezanechává žádné otevřené dluhy**.

### - [x] 8.4 NPC šablony + bestiář (`/svet/:worldId/admin/adresar-postav`) — 2026-05-23 ⚠️ REFACTOR V 10.2d-prep-B

⚠️ **Po vyjasnění Bestie ≠ NPC postava** (memory [[project-npc-vs-bestie]]) je tento modul **refaktorován v 10.2d-prep-B**: `npcTemplates` → `bestiae` (3-scope: system/user/world), drop `diarySchema`/`diaryData`, per-system staty přes prep-A engine, drop CreateCharacterModal „import šablony" flow (NPC postavy se nově tvoří přes Pages UI 9.1 přímo). Route `/svet/:worldId/admin/adresar-postav` → `/svet/:worldId/bestiar`. Viz [spec-10.2d-prep-B.md](arch/phase-10/spec-10.2d-prep-B.md) + [plan-10.2d-prep-B.md](arch/phase-10/plan-10.2d-prep-B.md).


*PJ správa. Nahrazuje stub `NPCDirectoryPage`. Spec: [spec-8.4.md](arch/phase-8/spec-8.4.md).*

- [x] Správa `npc-templates` — CRUD (jméno, obrázek, `maxHp`, `armor`, `injury`, `movement`, `initiativeBase`, `abilities`, poznámky)
- [x] Globální bestiář — `GET .../npc-templates/global`, import šablony do světa (`POST .../:id/import`)
- [x] Vytvoření NPC ze šablony — cesta (A): NPC postavy ve světě vznikají přes existující `CreateCharacterModal` (`isNpc=true`); šablona je knihovna statů, ne instance.
- [x] `mobil-desktop` audit

**Bonus uvnitř 8.4 (EXTENDED — všechny dluhy do scope):**
- [x] 8.4-BE-1: `movement` + `initiativeBase` v Create/Update DTO + controller mapping
- [x] 8.4-BE-2: `importToWorld` guard — zdroj musí mít `worldId === null` (proti úniku obsahu napříč světy)
- [x] D-NPC-1: `useUploadImage` přesunut do `shared/api/`, 11 konzumentů přemigrováno (`features/world → features/ikaros` závislost odstraněna)
- [x] D-NPC-2: drag & drop pořadí abilities (HTML5 native + klávesnice `ArrowUp` / `ArrowDown`)
- [x] D-NPC-3: `PreviewTemplateModal` — read-only náhled globální šablony před importem
- [x] D-NPC-4: soft-delete + koš + restore + hard delete (`deletedAt`, `GET /trash`, `POST /:id/restore`, `DELETE /:id/hard`)
- [x] D-NPC-5: `AdminNpcTemplatesController` + `/ikaros/admin/npc-bestiar` — Sa/Admin správa globálního bestiáře (předtím šlo naplnit jen DB zásahem)

**BE změny:** `backend/src/modules/npc-templates/` — schema/interface/DTO/repository/service/controller + nový `admin-npc-templates.controller.ts`. **40 jednotkových testů, všechny zelené.**

**FE změny:** `src/features/world/pages/NPCDirectoryPage/` (složka — page + 4 komponenty + 2 hook moduly + utils + testy) + `src/shared/api/useUploadImage.ts` (přesun) + route `/ikaros/admin/npc-bestiar`.

### - [x] 8.5 Dynamické šablony deníku (diary schema) ✅ (2026-05-23)

*„Nové šablony" — rozšiřitelný systém polí postavy dle herního systému. Master spec: [spec-8.5.md](arch/phase-8/spec-8.5.md) (EXTENDED scope).*

- [x] Editor schématu deníku světa (`/svet/:worldSlug/admin/sablona-deniku`, PJ+) — 3-panel: bloky / konfigurace / náhled; bloky `stat / bar / list / text / number / textarea`, pořadí přes drag&drop (HTML5 native + ▲▼ fallback pro touch), layoutArea grouping
- [x] Verzování — `GET /worlds/:id/diary-schema-versions` (meta + detail) + `POST` pro novou verzi (PJ+); archivace předchozí + auto-increment version; live snapshot v `world_settings.diarySchema`
- [x] Per-postava override — `personalDiarySchema` v `DiaryTab`, akce „Vlastní šablona" / „Vrátit ke světové" + editační modal; fallback view na svět-level když override chybí (postavy bez override teď uvidí svět-level bloky, dříve viděly prázdno)
- [x] Extended — diff viewer mezi pracovním stavem a uloženou verzí; bulk reset overridů přes všechny postavy světa; JSON export/import schématu
- [x] `napoveda` aktualizace (Šablona deníku jako nová PJ stránka)

**BE změny:**
- 8.5-BE-1 `POST /worlds/:id/diary-schema-versions` (PJ+) — archive + create
- 8.5-BE-2 `createWorld` + system change ukládá verzi do `diary_schema_versions`; před fixem tabulka u nových světů zůstávala prázdná
- 8.5-BE-3 `UpdateCharacterDiaryDto` + `CustomDiaryBlockDto` — PATCH `/diary` má typovou validaci, akceptuje `personalDiarySchema: null` (reset)
- 8.5-BE-4 `coerceCustomData` filter (read+write) — odřezává keys mimo aktivní schéma
- D-DIARY-1 `POST .../diary/remap` — přejmenování keys customData po rename bloku
- D-DIARY-2 `POST /worlds/:id/diary-overrides/reset-all` — bulk smaže `personalDiarySchema` u všech postav
- Bug fix: `archivedAt` v `DiarySchemaVersion` schématu mělo default `new Date()` → každá nová verze byla okamžitě archivovaná. Změna na `Date | null` (default null).

### - [x] 8.6 Finance multi-account + transfers + měny + sdílené účty ✅ (2026-05-24)

*Velké rozšíření Financí postavy nad rámec 8.1-FIR. Spec: [spec-8.6-finance-multi-account.md](arch/phase-8/spec-8.6-finance-multi-account.md), plán: [plan-8.6-finance-multi-account.md](arch/phase-8/plan-8.6-finance-multi-account.md).*

- [x] **F1 — Měsíční výdaje** symetricky k příjmům: nová pole `incomeEntries[]` + `expenseEntries[]`. „Zaúčtovat měsíc" = Σ income − Σ expense.
- [x] **F2 — Transfer mezi účty / postavami** — `POST /worlds/:worldId/accounts/:id/transfer`. Sekvenční atomický update s revert-on-fail (Mongo replica set chybí v dev → dluh D-8.6-replica-set). FE `TransferModal` s pickerem postavy a účtu, currency mismatch blok.
- [x] **F3 — Měny světa** — BE modul `world-currencies` byl už hotový (`/worlds/:id/currencies` GET/PUT/convert, seed per genre). FE `useWorldCurrencies` hook + select v `CreateAccountModal` a `SettingsAccountSection`.
- [x] **F4 — PJ-only nastavení účtu** přesunuto do „Nastavení účtu" sekce dole. Hráč vidí read-only, PJ edituje. Permission gate v service (`assertWriteSettingsAccess`).
- [x] **F5 — „Vedeno u" = reference na postavu** — `accessLocation: { type: 'character', characterId } | null`. Picker přes `CharacterDirectory` (všechny typy postav).
- [x] **F6 — Multi-účet** — nová collection `character_accounts` (`CharacterAccountSchemaClass`), `CharacterAccountRepository`, `CharacterAccountsService`. Postava může mít až 20 účtů. `AccountSwitcher` (tabs/dropdown podle počtu), `SummaryBanner` per měna.
- [x] **F7 — Sdílené účty** — `ownerCharacterIds[]` per účet, primary + co-owners. `addCoOwner` / `removeCoOwner` endpointy. UI s primary badge + odebráním. Při smazání postavy primary přejde na dalšího co-owner; pokud zbyl jediný = mazaná, účet se smaže (Q8.2).
- [x] Migrační skript `scripts/migrate-finance-multi-account-8.6/` — idempotentní, převede staré `CharacterFinance.entries[]` na `incomeEntries[]` + `expenseEntries[]` per znaménko amount.
- [x] Kaskáda `character.created` rozšířena — Finance + Inventory pro všechny typy (PC + NPC + Lokace) per 8.1-FIR rozhodnutí.
- [x] Permission gating per role: PJ+ a vlastník/co-owner = read + write-content; settings (typ, vedeno u, měna, co-owners) jen PJ; delete = primary owner + PJ.
- [x] FE komponenty: `AccountSwitcher`, `CreateAccountModal`, `TransferModal`, `SettingsAccountSection` v `components/accounts/`.
- [x] BE 25 nových testů (CRUD, addMonthly bilance, transfer happy + revert + validace, co-owner ops, permission guards, character.deleted cleanup). FE 11 nových testů (multi-account view, summary, switcher, shared badge, error state, edit save, empty state).

**Otevřené dluhy:**
- **D-8.6-replica-set** — Mongo dev běží bez replica set, `withTransaction` nelze. Použit sekvenční update s revert-on-fail. Spec [`docs/arch/infrastructure-spec.md`](arch/infrastructure-spec.md) §1.
- **D-8.6-transferPrimary** — ✅ vyřešeno 2026-05-24 (sweep). Endpoint + FE hook + 3 BE testy.
- **D-8.6-transfer-notification** — ✅ vyřešeno 2026-05-24 (sweep). EventEmitter + Gateway + FE toast listener.
- **D-8.6-accessLocation-backfill** — ✅ vyřešeno 2026-05-24 (sweep). Migrační skript NFD normalize 1:1 match.

### - [x] 8.7 Diary system presets — 12 herních systémů ✅ (2026-05-24)

*Migrace 12 deníkových systémů z legacy projektu `c:/Matrix/Matrix` do Ikarosu jako preset-based architektury. `world.system` určuje vizuál + strukturu deníku (`data-diary-system="X"` scoped CSS, žádný conflict se skinem `data-theme="Y"`). Spec: [spec-8.7-diary-system-presets.md](arch/phase-8/spec-8.7-diary-system-presets.md), plán: [plan-8.7-diary-system-presets.md](arch/phase-8/plan-8.7-diary-system-presets.md).*

- [x] **8.7a — Infrastruktura** — `DiarySystemProvider` + `DiarySystemContext` + `getDiaryPreset` registry + `generic` fallback preset + `_shared/cdAccess.ts` helper s per-systémovým prefixem. `DiaryTab` obalen providerem; editor schématu 8.5 skryt pro dedikované systémy. `DiaryBlockView` legacy class names + `data-block-type` pro per-system CSS bez sahání do shared module CSS.
- [x] **8.7b JaD (pilot)** — Jeskyně a draci, parchment téma, 6 atributů + 18 dovedností (česky), spell tab.
- [x] **8.7c CoC** — Call of Cthulhu 7e, Lovecraft parchment, 8 vlastností × 3 stupně (Zákl./Pol./Pět.), 44 dovedností (česky), HP/MP/Štěstí/Příčetnost, 6 status flagů.
- [x] **8.7d DnD 5e** — Arcane Parchment, skill prof cycle 0/1/2, passive perception (10 + skill mod), death save pips, spell slot tracker (0.–9. úroveň).
- [x] **8.7e DrdH** — Heroic Golden, 6 povolání s vlastním sekundárním zdrojem (Adrenalin / Duševní síla / Mana+Suroviny / Mana / Kostýmy / Přízeň) a vlastní profession-tabulkou.
- [x] **8.7f DrdPlus** — Mystical Arcane purple, 4 taby (Postava / Boj / Cesty / Profese), 6 inline profession rendererů.
- [x] **8.7g GURPS** — Universal Cold-Steel Blue, 8 atributů + HP/FP, encumbrance tabulka 5 úrovní, výhody/nevýhody, melee+ranged zbraně, inventory totals.
- [x] **8.7h Drd2** — Dark Forest Emerald, 3 pilíře (Tělo/Duše/Vliv) s jizvami, mega-boxy Ohrožení/Výhoda, profession-cards s 5-pip level trackerem, **kompletní katalog 264 schopností** (12 základních povolání × 12 + 10 mistrovských × 12) v `drd2Abilities.ts`.
- [x] **8.7i Fate** — Neural Sleek modré, sdílené komponenty `_shared/SkillPips.tsx` (6-pip tracker) + `_shared/ConflictTrack.tsx` (5-stavový) + `_shared/FateLikeSheet.tsx`. 2-sloupcový layout (Aspekty/Konflikt/Cíle | Dovednosti/Deník).
- [x] **8.7j PI (Příběhy Impéria)** — Victorian Brass (Merriweather serif), reuse `_shared/FateLikeSheet` s prefixem `pi_*`. Identická struktura jako Fate, jiný vizuál.
- [x] **8.7k Shadowrun** — Cyberpunk Neon Magenta+Cyan, 8 atributů, Condition Tracks (Phys/Stun) s -1 penalty per 3 boxy, Matrix panel (Device + 4 attrs + Programs + 12-box damage track).
- [x] **8.7l Drd16 base** — Klasická Jeskyně amber, 7 primárních + 5 sekundárních vlastností s DrdBonus auto-formulí, HP/Mana trackery s ±1/±5 tlačítky, 15 povolání select, weapons + skills tabulky. Class-specific moduly (13 souborů, ~17k řádků + 100KB data files) = budoucí iterace 8.7n+.
- [x] **8.7m — Spec + plán do docs/arch/phase-8/ + Help page sekce + manuální mobil-desktop audit (3 skiny × 3 systémy).**
- [x] **8.7n — Matrix RPG (12. systém, vlastní pro projekt Matrix/Ikaros)** — cyberpunk-magie setting, navy + modré (#6b8cff) + Rajdhani titulky. Overview (jméno/stát/magický gen/datum/body schopností s auto-počítáním z `triangle sum`/body osudu max 3), Vitals (Životy max 5 + Runa + Vesta + Únava max 25 se 2 penalty stripy `0/-1/-2/smrt` a `0/-1/-2/Bez/Smrt`), 4 přetlaky × 5 segmentů (klik na aktivní = reset na -1), jazyky/schopnosti/aspekty TagValue lists, **21 magických schopností** auto-detection (📘 ikona pro `Ohnivá magie`, `Léčebná magie`, …), aspekt chip Nabitý/Vybitý toggleable, výbava textarea. Plus **GURPS upgrade** (`gurps_player` field do header + rename `total_points`→`points_total`, `unspent_points`→`points_unspent` pro datovou kompatibilitu s legacy). Plus **systém aliasy v registry** (`dnd`→`dnd5e`, `pribehy_imperia`+`pribehy`+`pribehy-imperia`→`pi`, case-insensitive normalize, neznámé ID → `generic` fallback).

**Architektura:** `world.system === 'X'` → `DiarySystemProvider` lazy-loaduje `styles/X.css` (dynamic import, bundle nezatížen dokud deník není otevřen) + vloží `data-diary-system="X"` wrapper. Místo generic `DiaryBlockView` se renderuje `preset.SystemSheet`. Sdílené komponenty v `_shared/` (cdAccess helper, SkillPips, ConflictTrack, FateLikeSheet).

**Test coverage:** 133 testů (12 sheet specs + Drd16 + DnD + JaD formulas + Matrix 11 + 5 alias testů). Žádný regres na 8.5 schema editoru.

**Commit série:** `0ed55a8` (infra+JaD+CoC) → `7462c87` (DnD5e) → `fbb8863` (DrdH) → `5e800e1` (DrdPlus) → `d3d78e6` (GURPS) → `9663ea5` (Drd2) → `d1907ea` (Fate) → `9d0324c` (PI) → `387b222` (Shadowrun) → `794b1b4` (Drd16 base) → `fc223cd` (docs) → **`8.7n`** (Matrix + GURPS upgrade + aliasy).

**Dluhy / future scope:**
- **8.7o+ Drd16 class moduly** — Warrior/Ranger/Thief/Wizard/Alchemy/Theurg power-class komponenty (~17k řádků v Matrix/Matrix) + spell database 56KB + thief skill tabulky. Každý power-class samostatný sub-spec.
- **10.2l Map diary overlays** — kompaktní deník na map tokenu (CocMapDiaryOverlay, DndMapDiaryOverlay, atd.) — patří k mapové iteraci.

### - [x] Sweep dluhů 2026-05-24 (D-016 + D-044 + D-NEW-search-be + D-NEW-emote-categories částečně + D-NEW-discussion-pagination částečně)

Uživatel zadal „všechny dluhy musíme zvládnout" → rozjet sweep zelených dluhů + spec infrastruktury pro blokované (`docs/arch/infrastructure-spec.md`).

- [x] **D-016** — Auth audit ověřil že 5 PUBLIC endpointů (`world-news`, `ikaros-news`, `users.profile/exists`, `map-templates` GET, `system-presets`) je záměrné, žádný security hole.
- [x] **D-044** — `UserSchema.index({ usernameLower: 'text', displayName: 'text' })` připraven pro fulltext nad 10k+ uživateli.
- [x] **D-NEW-search-be** — `IkarosArticleSchema.index({ title: 'text', content: 'text' })` + `service.findAll(role, username, search?)` + endpoint `GET /ikaros-articles?search=`. Server-side fulltext s `textScore` sortingem.
- [x] **D-NEW-emote-categories (částečně)** — BE: `CustomEmote.tags: string[]` + DTO `tags?` (max 10, ≤32 chars). Create/createGlobal/copyToWorld zachovává tags. **FE filter chips v admin gridu zbývá** (~30 min, nezablokuje žádné featury).
- [x] **D-NEW-discussion-pagination (částečně)** — BE: `findAllPaginated(offset, limit)` v repo + service + controller s clamp 1..200. Zpětně kompatibilní (bez `limit` = old non-paged response). **FE hook `useDiscussions({ offset, limit })` zbývá** (~1 h, čeká na trigger ~stovky diskuzí).

**Spec infrastruktury** [`docs/arch/infrastructure-spec.md`](arch/infrastructure-spec.md) — sjednocuje 6 zbývajících dluhů blokovaných externí infrou: D-011 captcha (Cloudflare Turnstile), D-028 + D-051 + D-NEW-chat-presence-scale (Redis), D-061 + D-8.6-replica-set (Mongo replica set). Pořadí rolloutu navržené.

**Testy:** BE +5 (transferPrimary 3 + transfer-notification 2), 1431 celkem zelených (žádné regrese).

**FE změny:** `src/features/world/pages/WorldDiarySchemaEditorPage/` (složka — orchestrátor + 5 komponent + 6 hooks + utils + 3 test soubory) + `DiaryBlockView` extrahováno do shared komponenty + `DiaryTab` fallback + route `/svet/:worldSlug/admin/sablona-deniku` + nav item v `WorldLayout` Nástroje (PJ-only).

---

**Závislosti / návaznosti:**
- 8.1f kalendář postavy → plný kalendář **fáze 9.2**.
- Slot postavy ve `WorldContext` — dotahuje krok **5.1**.
- Wiki stránka typu `Lokace` (lore) = krok **7**; location-entita s kalendářem = krok 8.

**Mimo rozsah / k ověření ve spec:**
- Soft-delete postav — BE má jen fyzický `DELETE` → příp. dodělat.
- Runtime validace `accessRequirements` na postavě — BE má strukturu, evaluaci ověřit.
- ~~Ověřit podmínku kaskády — location-entita by měla dostat jen kalendář + deník + poznámky.~~ **Vyřešeno 8.2:** Lokace dostane jen kalendář (BE stav přijat).
- Postavy na mapě (`MapToken`, instance NPC) → fáze 10 (mapy).

### - [x] 8.x-prep Finance polish — currency integrace + adjust + in-game datum ✅ (2026-05-27)

**Spec:** [`spec-8.x-prep-finance-currency.md`](arch/phase-8/spec-8.x-prep-finance-currency.md)
**Plán:** [`plan-8.x-prep-finance-currency.md`](arch/phase-8/plan-8.x-prep-finance-currency.md)

*Mezikrok mezi 11.4 (currency platform) a 8.0 (character finance MVP). 4 sub-cíle ve 4 commitech (1 BE + 3 FE + 1 docs).*

- [x] **B1 — Currency integrace:** FinanceTab konzumuje sdílenou currency vrstvu z 11.4 jako první mimo-currency konzument. Hero balance, income/expense sum, transaction history přes `<CurrencyDisplay>` (symbol z world-currencies, ne surový code). Summary panel s `useUserPreferredCurrency` → hlavní „Celkem (v {preferred})" + per-currency rozklad. `<UnknownCurrencyChip>` ⚠ pro účty s `currency` ne ve `world_currencies` (např. „EU"). `<CurrencySelect>` v SettingsAccountSection.
- [x] **B2 — UX fix Zaúčtovat měsíc:** EntryList má visible labels „Popis" / „Částka ({symbol})" nad sloupci (incident 2026-05-26 — uživatel napsal „15 000" do label inputu). `type="number"` na amount inputu. Tlačítko Zaúčtovat měsíc otevírá nový **`<ConfirmAddMonthlyModal>`** s preview delty + varování ⚠ při delta=0 + toast s konkrétní deltou („Zaúčtováno: −15 000 Zl (úbytek)").
- [x] **B3 — Manuální vklad/výběr:** BE nový endpoint `POST /accounts/:id/adjust` + `allowPlayerSelfAdjust: boolean` flag + `assertCanAdjust` permission (PJ+ vždy, hráč-vlastník jen pokud flag). FE **`<AdjustBalanceModal>`** s Vklad/Výběr toggle + povinný reason (1–200 znaků) + `InGameDateField`. Settings checkbox „Povolit hráči samostatný vklad i výběr" (PJ-only edit). Tlačítko „💰 Vklad / Výběr" v FinanceTab header (visible podle role + flag).
- [x] **B4 — In-game datum transakcí:** schema rozšířeno o `FinanceTransaction.inGameDate?: FantasyDateLike | null`. Sdílený **`<InGameDateField>`** reuse `<FantasyDatePicker>` z 9.3 (custom calendar) + Gregorian fallback. Default value = `worldSettings.currentInGameDate` (přes nový `useDefaultInGameDate` helper). Tlačítko „Dnes" reset. Všechny 3 transakční modaly (addMonthly / adjust / transfer) propagují inGameDate do BE. Historie zobrazí in-game datum primárně + 📅 chip marker + real-world datum v tooltipu. Legacy transakce bez `inGameDate` fallbackují na real-world (žádná data migrace).

**Klíčová rozhodnutí (z konverzace):**
- Hráč přes flag smí vklad **i** výběr (jeden flag, ne dva)
- Povinný reason text (audit) místo voliteno+default
- Unknown currency = fallback display + ⚠ chip (NE auto-migrace existujících „EU" stringů)
- BE serverside validace `inGameDate` mimo scope (BE nemá sdílený calendar engine; FE picker clampuje den dle config)

**Testy:** BE 31 → 40 (+9: adjust permission matrix + inGameDate propagace). FE 1845 → 1862 (+17: InGameDateField 6 + UnknownCurrencyChip 2 + AdjustBalanceModal 5 + ConfirmAddMonthlyModal 4). Lint 0 errors, build ✓.

**Uzavírá:** D-incident 2026-05-26 (uživatel napsal label místo částky → 0 EU transakce — vyřešeno labels + suffix + ConfirmDialog při delta=0).

**Mimo rozsah (samostatné dluhy):**
- Auto-repeat měsíčních entries (žádný cron, manuální seed zůstává)
- Limit částky na hráčův adjust (PJ vypne flagem kdykoli)
- BE serverside calendar validace inGameDate
- Auto-advance `currentInGameDate` po Zaúčtovat měsíc
- Filtrování / řazení historie podle in-game data (zůstává v insert pořadí = real-world chronology)

---

## ← MVP hranice — výše je funkční základ pro hráče →

---

## Fáze 9 — Svět — Herní nástroje

*Pět herních nástrojů uvnitř světa — události, kalendář, timeline, počasí, novinky. Funkčně osvědčené ze starého Matrixu („fungují docela dobře").*

**BE:** všech 5 modulů je **kompletních** — `game-events`, `world-calendar-config` + `calendars`, `timeline`, `world-weather`, `world-news`. Plné CRUD, role guardy, schémata. **Fáze 9 = čistě FE** — stavba UI nad hotovým BE; hlavní přidaná hodnota = **vizuální ztvárnění** (sladit s designem světa, ne jen přenést starý Matrix 1:1).

**Reuse z fáze 3.1b (Ikaros akce/novinky):**
- `IkarosEventCard` / `IkarosEventModal` — rozbalovací karta události + editor → vzor pro game events
- `AkcePage` + `calendarGrid.ts` (`buildMonthGrid`, `dayKey`) — měsíční mřížka → vzor pro kalendář
- `NewsCard` — rozbalovací karta novinky → reuse pro světové novinky
- `relativeEventDate` util (`src/features/world/utils/`) — relativní datum

**Klíčové soubory:**
- FE stuby: `src/features/world/pages/` — `EventsPage`, `CalendarPage`, `TimelinePage`, `WeatherPage` (+ vznikne `WorldNewsPage`)
- FE: `src/features/world/api/useGameEvents.ts` (existuje — `useUpcomingEventsMine`, `useToggleRsvp`)
- Routy: `/svet/:worldSlug/{sprava-udalosti, kalendar, timeline, pocasi}` (+ `/novinky`)
- Starý Matrix (vzor): `Matrix/frontend/src/pages/{Calender,PJcalenders,Timeline,WeatherGenerator}.tsx`, `components/{EventCard,EventsSidebar,NewsSidebar}.tsx`

**Pořadí stavby:** 9.1 → 9.2 → 9.3 → 9.4 → 9.5. Admin funkce (tvorba/nastavení) řešeny role-gateovaně přímo ve stránkách, ne samostatnými routami.

### - [x] 9.1 Game Events (`/svet/:worldSlug/akce`) ✅ (9.1-I + 9.1-II hotové 2026-05-25)

*BE `game-events` kompletní. Reuse `IkarosEventCard`/`Modal` (copy-adapt).*

**Iterace 9.1-I (2026-05-24 ✅)** — spec [`spec-9.1-game-events.md`](arch/phase-9/spec-9.1-game-events.md), plán [`plan-9.1-game-events.md`](arch/phase-9/plan-9.1-game-events.md):

- [x] **9.1a — Seznam událostí:** chip group `Nadcházející | Archiv` (PJ+), grid `GameEventCard` (copy-adapt z IkarosEventCard), countdown badge „DNES/ZÍTRA/za N dní" (Matrix vzor), focal-point obrázek
- [x] **9.1b — RSVP:** `useToggleRsvp` invalidace upcoming+archive+dashboard, optimistic update, attendees chips
- [x] **9.1c — Skupinová viditelnost:** `GroupChip` barva z `WorldSettings.groupColors`, Lock ikona při `groupOnly`, group filter dropdown v toolbaru, BE per-record filter (existující)
- [x] **9.1e — Správa (PomocnyPJ+):** `GameEventModal` (create+edit), upload + focal-point overlay, `useDeleteGameEvent` s `ConfirmDialog`
- [x] **Archive policy (Matrix-style 24h cut-off, varianta A — implicit filter):** smazán `GameEventCleanupJob` + `deleteOlderThan`, BE konstanta `ACTIVE_WINDOW_HOURS = 24` v `time.constants.ts`, `findList` rozšířen o `toDate` + archive query sort DESC; role gate `Hrac → 403 ARCHIVE_PJ_ONLY` při explicit archive query + auto-clamp `fromDate = cutoff` pro Hrac bez filtru
- [x] **BE rozšíření:** `imageFocalX/Y` (schema + DTO + interface + repo, parita s IkarosEvent)
- [x] **Route přejmenování:** `/sprava-udalosti` → `/akce` (legacy redirect 1 měsíc), `worldStubMap` label `Akce`
- [x] **FE infra:** 6 nových hooků (`useUpcomingGameEvents`, `useArchiveGameEvents`, `useCreateGameEvent`, `useUpdateGameEvent`, `useDeleteGameEvent`, reuse `useToggleRsvp`), zod `createGameEventSchema`, util `relativeCountdown` + `activeWindowCutoffIso` (zaokrouhleno na minutu — stabilní query key)
- [x] **Testy:** BE +11 (focal create/update, archive role gate, auto-clamp, toDate filter) → **1475/1475 ✓**. FE +25 (`relativeCountdown` 8, `GroupChip` 4, `createGameEventSchema` 7, `EventsToolbar` 6) → všechny zelené.

**Iterace 9.1-II (2026-05-25 ✅)** — spec [`spec-9.1-II-comments.md`](arch/phase-9/spec-9.1-II-comments.md), plán [`plan-9.1-II-comments.md`](arch/phase-9/plan-9.1-II-comments.md):

- [x] **9.1d — Komentáře:** expand-on-click pod kartou (`grid-column: 1 / -1`), lazy fetch přes `useGameEventDetail`. Vláknové komentáře — root DESC + jednoúrovňová reply ASC pod root. Emoji reakce — fixní sada 6 (👍 ❤️ 😂 😮 😢 🎉), chip s count 0 = ghost (opacity 0.55), aktivní reakce = border accent. Edit in-place (textarea s Enter submit / Esc cancel) + pill „upraveno". Soft-delete vlastní nebo PJ+ → placeholder „*Komentář byl smazán*", reply zůstanou. Plain text formát s `white-space: pre-wrap`. Composer: Enter submit, Shift+Enter newline, counter zobrazen >1800 znaků. 5 nových hooků (`useGameEventDetail`, `useAddComment`, `useEditComment`, `useDeleteComment`, `useReactToComment`) + invalidace. 17 nových FE testů (ReactionsRow 7, Footer 7, Thread 3).

**Memory:** [[project-game-events-archive-policy]] — pattern pro 9.5 a další event-based moduly.

**Otevřené dluhy z 9.1-I:** pagination / year-grouping archivu (pokud per-svět překročí ~10 000 eventů — samostatný dluh, zatím limit 200).

### - [ ] 9.2 Kalendář (`/svet/:worldId/kalendar`) — multi-config + fantasy datum všude

*BE `world-calendar-config` (singular) + `calendars` (agregace per-postava) + `character-calendar` subdoc existuje. **9.2 plán přepracován 2026-05-25** — multi-config per svět, společný `absDay` epoch napříč kalendáři, fantasy datum i na entitách / novinkách. Roadmapový mapping aktualizován níže.*

**Aktualizovaný sub-spec sled (2026-05-25):**

- [x] **9.2a — Fantasy/Gregorian engine** ([spec](arch/phase-9/spec-9.2a-fantasy-engine.md), [plán](arch/phase-9/plan-9.2a-fantasy-engine.md)) — datový model `FantasyDate`, převody absDay, 8-fázový lunární cyklus, sezóny (wraparound-safe), Gregorian default config s reálným Měsícem 29.5306d. 11 souborů, 72/72 testů, žádné UI.
- [x] **9.2b — Multi-config per svět + config editor (PJ)** ([spec](arch/phase-9/spec-9.2b-multi-config-editor.md), [plán](arch/phase-9/plan-9.2b-multi-config-editor.md)) — BE konsolidace dvou storage (drop inline `World.calendarConfig`), kolekce `world_calendar_configs` s `{worldId+slug}` UNIQUE, sjednocený `CelestialBody` shape s FE engine (8-fázový lunar, žádný discriminated union). World pole `defaultCalendarConfigSlug` + `timelineEpoch`. Endpoints `GET/POST/PATCH/DELETE /worlds/:id/calendar-configs[/:slug]` + `PATCH /worlds/:id/calendar-defaults`. Auto-seed Gregorian při create world. Backfill skript `backfill-multi-calendar-config-9.2b/`. FE editor `/svet/:slug/admin/kalendare` (PJ+) s sidebar seznamem + 6-sekcovým formulářem (Identita / Hodiny / Týden / Měsíce / Tělesa / Sezóny). Commits BE: 9.2b-I `fb8b11bd`, 9.2b-II `d5cf7841`, 9.2b-III `8abf1c29`.
- [x] **9.2c — Per-entita mřížka (Postava/NPC/Lokace)** ([spec+plán](arch/phase-9/spec-9.2cde-konzumenti.md)) — BE `CalendarEvent.start/end` z `string` na `FantasyDate` object, `Character.preferredCalendarConfigId`, backfill skript. FE `<FantasyDatePicker>` shared komponenta (pořadí den/měsíc/rok), `CalendarTabGrid` měsíční mřížka s lunar/sezóna overlay, edit modal flow (klik buňka = create, klik chip = edit). Last-used datum cache. Symbol per event. Commits BE `2dd8a463`, FE `4ba0db8`, `c73d686`.
- [x] **9.2d — PJ aggregate view** — BE aggregate response rozšířen o `isNpc`. FE `useCalendarsAggregate` hook, refactor `CalendarPage.tsx` — sjednocení game events + character/NPC/Lokace agregát přes engine `toAbsDay/fromAbsDay`, sidebar filter (4 typy + per-entita toggle se swatch barvou), toolbar dropdown display kalendáře + jump-to-date popover + Dnes tlačítko, multi-day souvislé lišty (start/middle/end + restart názvu na pondělí), lunar/sezóna overlay v buňkách, today highlight, modal detail. Commits BE `7fb5af70`, FE `622c748`, `3520287`, `e918ae4`.
- [x] **9.2e — Fantasy datum na `WorldNews`** — BE `calendarConfigId + calendarDate` (oba nullable), DTO ValidateNested. FE `WorldNewsEditorModal` toggle „Reálné/Ve světě" + `<FantasyDatePicker>`, `WorldNewsCard` preferuje fantasy datum před real-world (s tooltipem na audit). Commits BE `64454d5f`, FE `b5327a0`.
- [x] **Polish iterace (9.2-FIX + FIX2 + FIX3)** — modal flow místo inline listu, multi-day souvislé lišty (margin overlap přes cell padding/gap), restart názvu na pondělí (cross-row/cross-month), jump-to-date popover (klik na month label), Dnes tlačítko, today cell highlight, hover „+" hint na prázdné buňce. Commits `c73d686`, `3520287`, `e918ae4`.
- [x] WorldLayout nav — položka „Kalendáře" v admin sekci (PJ+).
- [x] `napoveda` aktualizace ✓ (commit `5f32ba4`).
- [ ] `mobil-desktop` audit po dokončení polish iterací.

**9.4 — Calendar scalability (2026-05-26)** ([spec](arch/phase-9/spec-9.4-calendar-scalability.md), [plán](arch/phase-9/plan-9.4-calendar-scalability.md)) — pro 100 → 1000+ entit:
- [x] **Density toggle:** Detail / Kompakt (4px proužky) / Heat (gradient + count), auto-fallback při překročení 8 / 30 events/den, force-user-choice badge. `useDensity` hook s persistencí per `worldId` v localStorage. Commit `bfef737`.
- [x] **Compact density rendering:** `EventChipCompact` 4px proužek, tooltip on hover, multi-day spojitost zachována. Commit `9bcb3e4`.
- [x] **Heat density rendering:** `CellHeatLayer` overlay opacity per threshold (12%/24%/40%/60%), event count vedle čísla dne, cell click → drawer. Commit `f07bc54`.
- [x] **Day Detail Drawer:** side panel zprava 380px (100vw mobile), slide-in 180ms, sortable (gameEvent → player → npc → location → čas), focus trap, ESC close, „+N dalších" link v Detail/Compact mode + klik na heat cell trigger. `useFocusTrap` custom hook. Commit `4cccca2`.
- [x] **Entity Filter Tree:** search box (debounce 150ms), 4 collapsible groups s tri-state checkboxy, per-entita color swatch + count, bulk „Schovat vše"/„Reset". `useEntityIndex` hook s sorted entry list a search index. `expandedGroups` persistence per `worldId`. Commit `f2d226c`.
- [x] **Refactor + memo:** extrakce `CalendarCell` (200ř.) + `React.memo`, stable `eventByIdMap` + `useCallback` v parent — memo cells nepřerenderují při unrelated state. CalendarPage.tsx 690 → 574ř. Commit `4c452fa`.
- [x] **Mobile + a11y:** sidebar `max-height 50vh + sticky` na ≤900px, touch targets ≥40px (density btn, drawer close, entity row, bulk btn), search input 14px (iOS Safari zoom prevent). Commit `d1c26e4`.
- [x] **Nápověda update:** `/ikaros/napoveda` PagesSection.tsx rozšířen o 9.4 funkce (density, drawer, filter tree).
- **Bug fixy v 9.4 sweepu:** select option styling globally v `reset.css` (kontrast v 20+ formulářích), calendar chip continuity (−7px margin místo −5px), 10 pre-existujících TS errors (lunisolar preset typing, timelineCalendarSlug mocks, timelineEventSchema input/output, SectionCard subtitle→description, WorldLayout NavGroup ReadonlyArray), 1 hard lint error (TimelineAxis cardIndex reassign). 44 R19 strict warningy mimo scope → [D-react19-strict-cleanup](dluhy.md). Commits `5bb8ce4` `ef81f03` `c724da1`.

**Dílčí sub-spec (Lokace kalendář):**
- [x] **spec-9.2-lokace-kalendar.md** — re-introduction kalendáře jako tab v LokaceLayout (Page typu Lokace dostane `characterRef` → `kind:'location'` Character → `characterCalendar` subdoc; PostavaLayout pattern, 2 taby Profil/Kalendář). Commits: BE `5170f3ca`, FE `214738d`, backfill `4a081bc9`. Dokončeno 2026-05-24.

### - [x] 9.3 Timeline (`/svet/:worldId/timeline`) ✅ (9.3-I hotové 2026-05-25)

*BE `timeline` kompletní + 4× rozšíření v 9.3-I. Reference: starý Matrix vertikální osa.*

- [x] **9.3a — Historická osa:** vertikální timeline (centrální čára střídavě desktop / levý rail mobil), fantasy datum s BC (rok/měsíc/den/hodina), year range filter + server-side search, ImageLightbox, externí link + wiki link (PagePicker), celestial chips na kartě (max 3 + „+N"). Cursor pagination (žádný 500-cap dluh, dle PJ vize Q14).
- [x] **9.3b — Správa (PomocnyPJ+):** create/edit/delete v modal (RHF + zod), FantasyDatePicker reuse, RichTextEditor (TipTap HTML), image upload + focal-point overlay, ConfirmDialog na delete.
- [x] **9.3c — Celestial overrides:** collapsible sekce v modalu, per-body checkbox + 8-phase select; karta zobrazí `celestialStates[]` z BE (s `isManualOverride` tooltipem „přepsáno PJ").
- [x] `mobil-desktop` audit
- [x] BE rozšíření: `WorldSettings.timelineCalendarSlug` + **nový `getTimelineConfig` getter** (žádný side-effect na 9.2/9.4 `getConfigInternal`), `pageSlug` field, `imageFocalX/Y`, server-side `search` (regex escape), **cursor pagination** (breaking response shape), `GET /timeline/year-counts` aggregate endpoint
- [x] FE: `YearScrubber` sidebar (desktop) + drawer (mobil) pro skip-to-year navigaci v rozsahu −10 000 až +2039
- [x] `CalendarConfigsPage` rozšířen o „Aktivní pro časovou osu" Clock ikonu + hover-revealed btn → `worldSettings.timelineCalendarSlug`
- Spec: [docs/arch/phase-9/spec-9.3-timeline.md](arch/phase-9/spec-9.3-timeline.md), plán: [plan-9.3-timeline.md](arch/phase-9/plan-9.3-timeline.md)
- Commits: 7× BE + 7× FE

**9.3 followup** ✅ (2026-05-25):
- [x] Fallback timeline kalendáře = `world.defaultCalendarConfigSlug` (jinak `configs[0]`)
- [x] Nav přesun: `Časová osa` v dropdownu „Svět"
- [x] `WorldSettings.hiddenNavItems` + tab „Navigace" v Nastavení světa (PJ skryje volitelné top-nav položky)

**9.3-F-I** ✅ (2026-05-25) — Databáze 10 historických kalendářů + konvertor:
- [x] Engine extension: `LeapYearRule` opt-in (every-4 / solar-hijri-33 / islamic-30) — BC fast-path pokud bez něj
- [x] 10 preset templates v `src/shared/lib/calendarEngine/presets/`: Gregorian, Julian, Solar Hijri (Perský), Saka, Ethiopian, Coptic, Buddhist Thai, Egyptian Civil, Holocene, Islamic Hijri. **Deterministická calibration** (anchor 25.5.2026 z PJ datasetu → auto-spočítaný `epochOffset`).
- [x] `CalendarConfigsPage` 2-step wizard (PresetPicker → identity), auto-suffix slug při konfliktu
- [x] `CreateWorldPage` calendar selector — multi-select 10 presetů, radio ⭐ default (PJ může Gregorian odškrtnout = svět bez kalendáře)
- [x] `DateConversionPopup` na timeline kartě — 🔄 btn převede datum do všech ostatních kalendářů světa (klient-side přes `globalAbsDay` osu)
- [x] BE: `WorldCalendarConfig.leapYearRule` field + `applyPresetTemplate(worldId, dto)` (internal seed) + `CreateWorldDto.calendars[]` + `defaultCalendarSlug`
- Spec: [spec-9.3-followup-historical-calendars.md](arch/phase-9/spec-9.3-followup-historical-calendars.md), plán: [plan-9.3-F-I-presets.md](arch/phase-9/plan-9.3-F-I-presets.md), data: [PRESETS-DATASET.md](arch/phase-9/PRESETS-DATASET.md)

**9.3-F-II** ✅ (2026-05-26) — 4 lunisolární kalendáře:
- [x] Engine extension: `MonthDef.isIntercalary?` + `CalendarConfig.lunisolar?: LunisolarRule` (Metonic 19-letý cyklus, 7 přestupných roků na pozicích [3,6,8,11,14,17,19]). BC: bez `lunisolar` zachován fast-path.
- [x] 4 presety: `hebrew` (adar I intercalary), `chinese-simple` (13. měsíc, Yellow Emperor éra 4723), `babylonian` (addaru II, Seleukovská éra 2337), `greek-attic` (poseideón II, athénský rok).
- [x] BE mirror: `LunisolarRule` + `MonthDef.isIntercalary` v interface/schema/repo/DTO/service (atomicky s FE).
- Calibration tolerance: ±1 Hebrew, ±2 Chinese/Babylonian, ±3 Greek Attic (lunar drift + historické zdroje nejednotné).
- Wizard auto-pickne nové presety v kategoriích „Současné náboženské" (Hebrew, Chinese) a „Historické" (Babylonian, Greek Attic) — žádná wizard změna.
- 32 nových calibration testů + 13 lunisolar engine testů. Celkem **115 v presets/ + 177 v engine** prošlo.

**9.3-F-III** (next) — 6 speciálních (Mayan, Aztec, Roman, French Rev, Cotsworth, World Calendar) přes `CalendarKind` enum.
**9.3-F-V** (bonus) — `chinese-precise` přes astronomy-engine lib.

### - [x] 9.4 Počasí (`/svet/:worldSlug/pocasi`) ✅ KOMPLETNĚ (2026-05-26)
*Status: 9.4-I + 9.4-II + 9.4-III všechny hotové 2026-05-26.*
*Commits BE: ccbd2e71. FE: f96f451 + 5e41fbd + fa9d932 + 1d7e641 + (9.4-II/III commit).*

*BE `world-weather` existující CRUD + generování + broadcast + WS `weather.updated`. 9.4-I přidává **2 BE rozšíření**: `displayOrder` field + reorder endpoint, calendar integration v generování.*

**Spec:** [spec-9.4-pocasi.md](arch/phase-9/spec-9.4-pocasi.md) — 937 presetů ve 17 kategoriích s `sourceLevel` audit trail (MEASURED/DOCUMENTED/ANALOGY/INFERRED/FICTIONAL), všechny vycházejí z primárních zdrojů (NASA/JPL pro vesmír, Köppen-Peel 2007 pro klima, Fonstad Atlas pro Středozem, WotC FRCS pro Faerůn, atd.). Citace v kódu, **v UI skryto** — PJ vidí jen čistý český název + popisek.

**Architektura:** dvouvrstvá — A (real-world katalog 810 zemí+měst+extrémů) + B (127 archetypů v 17 kategoriích). Preset = startovací bod, PJ může vše editovat. FE-side preview (3 trial rolly před commit), žádné BE změny.

**Rozděleno na 3 kompletní sub-iterace** (memory `feedback_no_debt` — každá iterace ship-ready sama o sobě):

#### 🌍 9.4-I — Reálný svět (MVP, hotov 2026-05-26)
- [x] **BE rozšíření 1: `displayOrder` field** — schema, repo, `PUT /reorder` endpoint, 2 nové repo testy
- [x] **BE rozšíření 2: Calendar integration v generování** — `WorldWeatherService.generate` přijímá `monthIndex?` query, načte `worldSettings.timelineCalendarSlug` + world-calendar config, `WeatherResult.calendarMonth` field, Gregorian fallback
- [x] **Variance model BE+FE shared (E varianta):** simulation modul v BE + 1:1 mirror v FE, Gaussian variance per měsíc, Markov persistence weather type (per Köppen zóna), 5% extrémy s `isAnomaly` flag, parity test gate (7 fixtures stejný seed → identický output)
- [x] **A vrstva:** real-world katalog 199 zemí v 7 kontinentech + 7 reálných extrémů (Naica, Vostok, Death Valley, Cherrapunji, McMurdo, Mariana, Yellowstone) — sourceLevel: DOCUMENTED/MEASURED
- [x] **B-01 Köppen klimatické zóny** (16) — Peel et al. 2007 + per-zone std dev defaults + Markov matrices
- [x] **B-06 Mořská prostředí** (6) — WMO Sea State, NOAA buoys
- [x] **UI komplet:** route `/svet/:worldSlug/pocasi`, multi-generator grid karet, drag-to-reorder (@dnd-kit + optimistic), modal (3 taby), preset wizard (3 stadia + search + recently used + 3 trial rolly), broadcast modal, ručně nastavit
- [x] **Weather-responsive theming karty:** per weather type (clear/cloudy/rain/storm/snow/fog) — bg tint + deterministic particles (hash z generatorId, žádný layout shift) + lightning flash + blur. `prefers-reduced-motion` respektován
- [x] **WS live update:** FE subscribe na `weather.updated` přes existing useSocketEvent
- [x] **Role gating:** Hráč=read-only, PomocnyPJ+=create/edit/generate/broadcast/reorder, PJ+=delete
- [x] **Hooks:** 9 React Query (CRUD + generate + setCurrent + broadcast + reorder s optimistic + rollback) + WS subscribe + useTrialMonths + usePreviewWeather
- [x] **Tests:** 110 BE (51 původních + 59 simulation) + 130 FE (7 parity + 85 presets + 13 hooks + 25 UI/modals/wizard)
- [x] **napoveda** sekce „Počasí" v Herních nástrojích
- [x] **mobil-desktop** audit — všech 11 CSS modulů má @media queries pro breakpointy 768/1024px

#### 🐉 9.4-II — Fantasy & Mytologie ✅ (53 presetů, 2026-05-26)
- [x] **B-04 Literární fantasy** (28) — Středozem (7), Westeros+Essos (8), Faerůn (5), Witcher (3), Tamriel (5)
- [x] **B-05 Prehistorická prostředí** (4) — Křídové tropy, Doba ledová, Karbonský prales, Permská poušť
- [x] **B-07 Mytologická / božská** (6) — Olymp, Asgard, Helheim, Hádes, Duat, Avalon
- [x] **B-09 Steampunk / Viktoriánské** (3) — Smog Londýn 1880, Industriální fields, Plynové ulice
- [x] **B-10 Horror / Lovecraft** (4) — Innsmouth, Antarktida (Mountains of Madness), R'lyeh, Arkham
- [x] **B-11 Vzdušné / Létající** (3) — Floating ostrovy, Stratosféra, Vzdušné město
- [x] **B-12 Magické / Bioluminiscentní** (5) — Bioluminiscentní džungle, Magická bouřková zóna, Magicky upravený les, Fae plán, Krystalové pole
- [x] Integrace: ARCHETYPE_CATALOG rozšířen, PresetCrossroads fantasy unlock, PresetCategories 7 fantasy dlaždic, buildPresetItems handler
- [x] sourceLevel: literary převážně ANALOGY (z Fonstad/Martin/FRCS/Sapkowski/Bethesda), mythological DOCUMENTED (Hesiod/Eddas/Book of the Dead), prehistoric MEASURED (Hay & Floegel 2012, Clark 2009), 5 magické FICTIONAL

#### 🚀 9.4-III — Sci-fi & Vesmír ✅ (45 presetů, 2026-05-26)
- [x] **B-02 Reálná planetární tělesa** (11) — Mars+Gale+čepička, Luna, Venuš, Titan, Europa, Enceladus, Io, Pluto, Jupiter
- [x] **B-03 Teoretické exoplanetární** (5) — Tidally locked (Proxima b), Eyeball, Hycean ocean (Kepler-138), Hot Jupiter, ISS-like kupole
- [x] **B-08 Cyberpunk / urbanní dystopie** (4) — Neon City, Megacity smog (Delhi), Korpo věže, Mall klimatizovaný
- [x] **B-14 Vesmírné stanice** (5) — ISS, Mir, Skylab, O'Neill cylinder, Stanford Torus (NASA-STD-3001 + O'Neill 1974)
- [x] **B-15 Lodní interiéry per-room** (10) — kajuty, můstek, strojovna, cargo, airlock, EVA suit, hydroponics, med-bay, cryo-bay, mess hall
- [x] **B-16 Typy lodí** (6) — Generation (Orion/Daedalus), mining, military, civilian, exploration, cryo-haul (Spaceworks Torpor NIAC 2014)
- [x] **B-17 EVA exteriéry** (4) — Apollo lunar, ISS orbital, Mars surface (DRA 5.0), asteroid (NIAC asteroid retrieval)
- [x] Integrace: ARCHETYPE_CATALOG rozšířen, PresetCrossroads scifi unlock, PresetCategories 7 scifi dlaždic, buildPresetItems handler
- [x] sourceLevel: planetary všechny MEASURED (Curiosity REMS, Cassini, Galileo, Juno, New Horizons, Venera), stations MEASURED/DOCUMENTED, EVA monthlyTemps držené na 22°C (oblek-relevant, exteriérový swing v hazards)

**Dluhy 9.4 — status (2026-05-26):**
- [x] **#1 Auto-generate advance-day mechanism** — `POST /weather-generators/advance-day` posune `worldSettings.currentInGameDate` o N dní + auto-vygeneruje weather pro všechny generátory světa s odpovídajícím monthIndex. UI: tlačítka „+1 den" / „+7 dní" v header. Custom calendar transition (přelom roku) řešen přes total-days algoritmus.
- [x] **#2 Historie počasí** — nová collection `world_weather_history`, snapshot persist při generate/setCurrent/advance-day, `GET /:id/history` endpoint, FE WeatherHistoryModal v kebab menu Card. Best-effort persist (selhání neshazuje primary op).
- [x] **#3 Save-as-custom-preset** — nová collection `world_custom_weather_presets`, per-world scoped. CRUD endpointy + `POST /:id/use` usage counter. FE: „Uložit jako preset" button v generator modal + 4. rozcestí karta „⭐ Mé presety" v wizardu. Config immutable po save (jen name/description/emoji jdou updatovat).
- [x] **#4 Favorites generátorů** — FE-only s localStorage (klíč `weather-favorites:<userId>:<worldId>`, max 20). Star button na kartě, favorited generátory sortují se nahoru v gridu. Per-user × per-world isolation.
- [x] **WS live update** — hotov v 9.4-I (FE subscribe). **Pozn. 10.2i:** odhalen + opraven bug — BE emituje socket `weather:updated` (dvojtečka), FE poslouchal `weather.updated` (tečka) → live-update fakticky nefungoval; sjednoceno na `weather:updated`.
- [x] **Map integration broadcast** *(10.2i, 2026-05-31)* — PJ „Vyslat na mapu" (`broadcast target:map`) → `World.activeMapWeather` snapshot → panel + atmosféra na taktické mapě. Viz 10.2i.
- [ ] **Monorepo migrace (A-3)** — odložena jako samostatná fáze; vyžaduje user akce (GitHub repo creation, CI/CD koordinace). Viz [plan-monorepo-migration.md](arch/plan-monorepo-migration.md).

**Tests po dluzích:** BE 131/131 (původních 110 + 13 advance-day/history + 8 custom presets), FE 189/189 v weather oblasti.

#### 📦 9.4 Generator Sets ✅ (2026-05-26)
- [x] **BE entity** `world_weather_generator_sets` — schema + interface + repo + 5 endpointů (CRUD + apply). Whitelist update (name/description/emoji/items, ne appliedCount/createdBy/worldId). `incrementAppliedCount` přes $inc po úspěšném apply.
- [x] **BE Apply protokol** — FE-resolve pattern. BE neumí rozresolvovat preset IDs (catalogs jsou FE-side), FE pošle `resolvedItems: [{ name, description?, config }]`, BE iteruje a volá `WorldWeatherService.create()` per item.
- [x] **14 globálních setů** (FE static):
  - **Geografické (10):** Svět komplet, Evropa, Asie, Afrika, Severní Amerika, Jižní Amerika, Austrálie a Oceánie, Česko, Vysokohorská kampaň, Mořeplavecká
  - **Sci-fi (4):** Mars expedice, Vesmírná stanice, Vesmírná loď komplet, Solar System tour
- [x] **FE hooks** `useGeneratorSets.ts` — 6 hooks (list/detail/create/update/delete/apply), apply invaliduje oba klíče (weather-sets + weather-generators)
- [x] **FE resolver** `resolveSetItems(items, customPresets) → { resolved, unresolved }` přes `buildAllPresetItems` katalog
- [x] **FE UI** `WeatherSetsModal.tsx` — taby Globální (14 setů) + Mé sety (custom z BE), expand „Náhled" → items list, „Aplikovat" → confirm dialog → unresolved warning + force-apply, šablona z globálního → custom
- [x] **Page header tlačítko „📦 Sety"** — PJ+ otevírá WeatherSetsModal
- [x] **5. rozcestí karta v wizardu** — „📦 Sety" → callback `onSwitchToSets` → parent zavře generator modal a otevře sets modal
- [x] **Role gating** — Hráč read-only (jen Globální tab), PomocnyPJ+ create/apply, PJ+ delete
- [x] **Tests:** BE 147/147 (131 baseline + 16 sets), FE 235/235 (189 baseline + 31 hooks/resolver/15 setů + 15 modal/wizard integration)

**MVP rozsah Sets (vyhrazeno jako follow-up):**
- Save-from-existing generátorů (vyžaduje reverse mapping config→presetId nebo configSnapshot v BE schemat)
- Build-from-scratch multi-select wizard (nahrazeno „Šablona z globálního" tlačítkem)

#### 📅 9.4 Set In-Game Date ✅ (2026-05-26)
- [x] **BE endpoint** `PUT /worlds/:worldId/weather-generators/set-in-game-date` (PomocnyPJ+) — body `{ year, monthIndex, day, regenerateAll?: boolean }`, BCE support (year ≥ -25000), custom calendar monthIndex validation, regenerateAll best-effort loop přes všechny generátory
- [x] **BE generate() integration** — `resolveCalendarContext` rozšířen o `explicitDay`, persistedDate z `worldSettings.currentInGameDate` má prioritu před real-world fallback (explicit query > persistedDate > real-world)
- [x] **FE hook** `useSetInGameDate(worldId)` — invaliduje weather-generators + world-settings
- [x] **FE modal** `SetInGameDateModal.tsx` — 3 inputy (rok / měsíc / den), custom calendar month names z `useCalendarConfigs`, day clamp dle `monthsList[monthIndex].daysCount`, toggle „Vygenerovat počasí pro všechny generátory" (default ON)
- [x] **FE page header tlačítko „📅 Nastavit datum"** — vedle „+1 den" / „+7 dní" (PomocnyPJ+), `CalendarClock` ikona
- [x] **Climate epoch utility** ponechána v simulation modulu (paleo/IPCC data pro budoucí use), ne volaná v generate() — user explicit odmítl ad-hoc per-generate adjustment, preferuje persistent date setting
- [x] **Tests:** BE 174/174 (147 + 27 nových), FE 275/275 (235 + 40 nových modal + utility + integration)

### - [x] 9.5 Světové novinky (`/svet/:worldId/novinky`) ✅ (2026-05-25, parita s 9.1)

**Iterace 9.5 (parita s game events)** — spec [`spec-9.5-world-news-parity.md`](arch/phase-9/spec-9.5-world-news-parity.md), plán [`plan-9.5-world-news-parity.md`](arch/phase-9/plan-9.5-world-news-parity.md):

- [x] **BE rozšíření:** `imageUrl`/`imageFocalX`/`imageFocalY`/`linkPageSlug` v `WorldNews` schema/DTO/interface/repo/service (parita s game-events 9.1). Update DTO s `ValidateIf` pro nullable. Backward compat: legacy `link` field zachován, FE preferuje `linkPageSlug`. 5 nových BE testů (54 → 59), full BE suite 1480/1480.
- [x] **FE — `WorldNewsCard` refactor** na plnohodnotnou kartu: 16:9 hero obrázek s focal point, TypeChip (info/alert/system) s ikonou a barvou per typ, kebab menu Upravit / Archivovat / Smazat (PomocnyPJ+), archive opacity 0.78. Resolution `linkPageSlug` → page title přes `usePagesDirectory` (cache sdílená napříč kartami).
- [x] **FE — `WorldNewsEditorModal` refactor:** image upload + focal overlay (reuse `useUploadImage`), `<PagePicker>` autocomplete pro výběr stránky světa, UI vynutí mutual exclusivity mezi page-link a externí URL. Zod refine.
- [x] **Sdílené komponenty:** `<TypeChip>` (3 typy), `<PagePicker>` (autocomplete z `usePagesDirectory`, max 8 výsledků, Enter = první výsledek, Esc zavře dropdown).
- [x] Wireup: `NewsColumn` dashboard (nový `worldId`+`worldSlug` props), `WorldNewsPage` (toolbar Aktivní/Archiv beze změny).
- [x] **9.5b** napojení na 5.2 — sekce Novinky na dashboardu světa renderuje plnohodnotné karty s obrázkem.
- [x] **9.5c** Správa (PomocnyPJ+) — kebab Upravit/Archivovat/Smazat hotové.
- [x] **9.5a** Stránka novinek světa — wireup hotov.
- [x] `napoveda` aktualizace ✓ — záznam „Novinky světa" rozšířen o obrázek + page link + mutual exclusivity.

**Testy:** FE +11 nových (TypeChip 4, PagePicker 7) + 6 update v cards.spec (WorldNewsCard 9.5 refactor) + 2 fix v columns.spec (EventsColumn po 9.1 follow-up potřeboval mock useWorldSettings + assertion update na /akce). Vše zelené.

**Tracked dluhy z 9.5:** RichText content (Q1-B), multi-page link, custom emoji picker analog, komentáře pod novinkou (paralela 9.1-II — samostatný spec pokud chce).

---

**Závislosti / návaznosti:**
- 9.2 kalendář ↔ krok **8.1f** (kalendář postavy) — sdílený `character-calendar` subdoc.
- 9.5b ↔ krok **5.2** (novinky světa na dashboardu).
- 9.3c celestial overrides ↔ `world-calendar-config` (nebeská tělesa z 9.2d).

**Mimo rozsah / k ověření ve spec:**
- **BE gap — Game Events WS:** live sync událostí přes WebSocket chybí (push notifikace přes job ale fungují) → příp. dodělat.
- **BE gap — per-postava kalendář:** endpointy pro CRUD jednotlivých událostí postavy chybí (existuje jen agregace + nastavení) → příp. dodělat.
- **BE gap — Timeline celestial states:** výpočet stavu těles v response je placeholder → příp. dodělat.

---

## Fáze 10 — Svět — Mapy

*Tři mapové nástroje světa. **Taktická mapa (10.2) je nejkomplexnější a nejpropojenější část celé platformy** — bojová hex mapa s tokeny, mlhou, efekty, iniciativou a real-time synchronizací; napojená napříč postavami, NPC, kostkami, zvuky, počasím a dungeon builderem. Fáze 10 je navržená **výkonově napřed** — renderer a datový tok se volí podle stropu výkonu, ne podle pohodlí; funkce zůstávají v plném rozsahu.*

**BE:** moduly `maps`, `universe`, `dungeon-maps` jsou **kompletní** (schémata + endpointy + role guardy). `maps` má i plný WS gateway. **Fáze 10 = FE** — všechny 3 stránky jsou stuby; objemově největší FE blok projektu (starý Matrix `MapPage` = 1651 řádků + 10+ subkomponent).

### Tři pilíře taktické mapy — Výkon · Vzhled · UX

Taktická mapa stojí na **třech rovnocenných pilířích**. Každý podkrok 10.2 je musí ctít. Volba rendereru (WebGL) je záměrně taková, aby sloužila všem třem najednou — ne kompromis mezi nimi.

**1. Výkon** — priorita „nejlepší možný":
- **Renderer = WebGL (`PixiJS` + `@pixi/react`)** — ne SVG, ne canvas 2D. WebGL je výkonový strop a standard pro virtuální stoly (Foundry VTT). **SVG zamítnuto** — starý Matrix měl SVG taktickou mapu a musel zavést „high-perf mode" (vypínání `feTurbulence` mlhy na mobilu) = přímý důkaz, že SVG na herní ploše neškáluje. Canvas 2D (`Konva`) by stačil pro běžný počet tokenů, ale WebGL je bezpečnější strop bez kompromisů i u velkých scén.
- Viewport culling — kreslí se jen viditelná oblast; hexy/tokeny/efekty mimo obraz se nevykreslují.
- Vrstvy + dirty-flag redraw — statické vrstvy (pozadí, grid) se cachují; překresluje se jen změněná vrstva.
- RAF-řízené překreslení (jen při změně), hex grid jako jeden draw (dlaždicová textura), fog jako render-texture maska.
- Sprite atlas + cache textur, WS throttling + coalescing, optimistické lokální updaty, lazy-load těžkých modulů.

**2. Vzhled** — mapa musí být krásná, ne jen funkční:
- **Respekt světového motivu (krok 5.0)** — plátno, grid, chrome i panely čerpají tokeny tématu světa; mapa nepůsobí jako cizí nástroj nalepený na svět.
- GPU efekty „zdarma" — WebGL umožňuje plynulé gradienty, glow, měkkou mlhu a kvalitní výbuchové efekty (fire/gas/smoke) bez výkonové daně.
- Vizuální hierarchie — tokeny, efekty a mlha čitelně oddělené; aktivní token / „na tahu" jasně zvýrazněn.
- Leštěné UI chrome — toolbar, palety, iniciativa, deníkový dock laděné s designem platformy.

**3. Uživatelská příjemnost (UX)** — ovládání musí být plynulé a intuitivní:
- Plynulý pan/zoom (myš i touch), hladký drag tokenů s okamžitým optimistickým feedbackem, příjemný snap-to-hex.
- Plnohodnotné **touch ovládání** — mapa použitelná na tabletu i mobilu, ne jen desktop.
- Jasné affordance PJ vs hráč — hráč hned vidí, co smí (svůj token), PJ má nástroje po ruce.
- Klávesové zkratky, undo, hover stavy, ping; rozumné defaulty, objevitelný toolbar, minimum kliků.
- Stabilní FPS i pod zátěží — zde se UX a výkon potkávají: trhání = špatný UX.

*WebGL renderer je společný jmenovatel všech tří pilířů — dává výkon (1), umožňuje efekty bez kompromisu (2) a drží stabilní FPS pro plynulé ovládání (3).*

**Nové balíčky:** `pixi.js` + `@pixi/react` (taktická mapa — WebGL), `three` + `react-force-graph-3d` (universe 3D — taktéž WebGL), `konva` + `react-konva` (dungeon builder — editor, ne herní plocha, canvas 2D plně stačí). Vše lazy-loaded per-route, takže bundle hráče nezatěžují naráz. `socket.io-client` už je.

**Routing Dungeon Builderu — oprava:** BE `dungeon-maps` je per-svět (`worldId` povinný), FE stub je ale chybně na platformové `/ikaros/admin/dungeon-builder` → **přesunout na `/svet/:worldId/admin/dungeon-builder`** (PJ+).

**BE gap:** `dungeon-maps` nemá WS gateway — builder je single-PJ editor, real-time sync netřeba; ověřit ve spec.

**Klíčové soubory:**
- FE stuby: `src/features/world/pages/` — `MapPage`, `TacticalMapPage`; `src/features/admin/pages/DungeonBuilderPage`
- Routy: `/svet/:worldSlug/mapa`, `/takticka-mapa`, `/admin/dungeon-builder`
- Starý Matrix (funkční vzor — herní logika, ne renderer): `Matrix/frontend/src/pages/MapPage.tsx`, `UniverseMap.tsx`, `components/Map/` (`HexUtils`, `MapToken`, `FogOfWar`, `MapEffectOverlay`, `EffectsPalette`, `MapToolbar`, `InitiativeInput`, `Dice/`, `Builder/DungeonBuilder`)

**Pořadí stavby:** 10.1 → 10.3 → 10.2 *(Dungeon Builder produkuje podklady taktické mapy; taktická mapa jako poslední — je nejnáročnější).*

### - [ ] 10.1 Universe mapa 3D (`/svet/:worldId/mapa`)

*3D graf lokací světa. BE `universe` kompletní. `three` + `react-force-graph-3d` (WebGL).*

- [ ] **10.1a — 3D force graph:** uzly = lokace (planet / star / nebula / asteroid / moon / blackhole), hrany = cesty (`isOrbit`); render dle typu uzlu; pozastavení force simulace po ustálení (úspora CPU)
- [ ] **10.1b — Viditelnost:** `isPublic` + `visibleToPlayerIds` — PJ vidí vše, hráč jen povolené; editor viditelnosti uzlů (PJ)
- [ ] **10.1c — Detail lokace:** klik na uzel → zoom + panel; odkaz na wiki stránku lokace (krok 7); editor uzlů/hran (PJ) — `PUT /universe`
- [ ] **10.1d — Real-time:** WS `universe:updated`; `mobil-desktop` audit

### - [ ] 10.2 Taktická mapa (`/svet/:worldId/takticka-mapa`)

*Bojová hex mapa — jádro herní vrstvy. BE `maps` kompletní vč. WS gateway. Stavěno na výkonovém jádru (10.2a); funkce v plném rozsahu.*

- [x] **10.2-prep-1 — BE Operations API + event log** *(2026-05-27)* — atomic ops přes `POST /maps/:id/operations` + `POST /worlds/:worldId/operations`, append-only `mapOperations`/`worldOperations` logy s TTL 30 dní, per-player scene assignment přes `WorldMembership.currentSceneId` + cascade `token.remove` na opuštěné scéně, WS Gateway JWT auth + `map:operation`/`world:operation` emit, OperationsAuthorizer per-op role matice (Sa/Admin global bypass, `>=PomocnyPJ` per-world). Spec: `Projekt-ikaros/docs/arch/maps/operations/`. Plán + commits: `phase-10/plan-10.2-prep-1.md`.
- [x] **10.2-prep-2 — BE atomic legacy fix** *(2026-05-27)* — `MapsService.moveToken/removeToken` přepsány z full `repo.replace` na atomic `repo.atomicUpdate` (Mongo positional `tokens.$.q/.r` + `$pull`). Legacy `PATCH /move-token` a `/remove-token` endpointy (zachované jako deprecated) jsou nyní race-safe. 6 D-053b testů aktualizováno na `atomicUpdate` mock. Commit `673ddb21`.
- [x] **10.2-prep-3 — FE per-system plugin registry** *(2026-05-27)* — nový `src/features/world/map-systems/` adresář s `MapSystemPlugin` interface (id, label, defaultDice, optional NpcEditModal/NpcStatBlock/rollSkill), 13 plugin stubů (matrix/coc/dnd5e/drd2/drd16/drdh/drdplus/fate/pi/gurps/jad/shadowrun/generic), `getMapSystemPlugin(systemId)` resolver s aliasy (dnd→dnd5e, pribehy_imperia→pi) zarovnanými na `diary-systems/registry.ts`. 10 testů. Commit `2df409c`.
- [x] **10.2-prep-4 — FE theming CSS vars** *(2026-05-27)* — `src/themes/_shared/map-tokens.css` definuje 17 `--map-*` proměnných (canvas-bg, grid-stroke, token-ring-*, fog-pj/player-fill, effect-fire/gas/smoke-base, ping-color, toolbar-bg/text) pro PixiJS `getComputedStyle` lookup v 10.2a. Per-skin overrides v `themes/<skin>/index.css` přes `[data-theme]` scope. Commit `943d8cd`.
- [x] **10.2a — Rendering jádro + výkonová kostra** *(2026-05-27)* — PixiJS v8 + @pixi/react v8 (React 19), `TacticalMapView` mountuje `<Application>` se 6 prázdnými vrstvami (background/grid/effects/tokens/fog/pings) v určeném z-order. Single transform root container (x/y/scale). Pan: middle/left mouse drag + 2-finger touch. Zoom: Ctrl/Cmd+wheel cursor-anchored + pinch midpoint-anchored. Clamp [0.2, 3]. LocalStorage persist (`ikaros.map.*`, 250 ms debounce). `useMapTheme` čte 17 `--map-*` CSS vars přes `getComputedStyle` (re-load přes MutationObserver na `[data-theme]` + `'skin-changed'` event). Empty state když `WorldContext` není ready. Zoom controls + fullscreen toggle. 36 nových testů (parseHexColor, parsePxNumber, useMapTheme, useViewportSize, useViewportPanZoom). Soubory: `src/features/world/tactical-map/`. Commits `e94ac73` → `485898c`. Spec: `docs/arch/phase-10/spec-10.2a.md`. Plán: `phase-10/plan-10.2a.md`.
- [x] **10.2b — Hex mřížka** *(2026-05-27)* — port Matrix `HexUtils.ts` 1:1 (axialToPixel/pixelToAxial s cube-round, getHexCorner/Points/PolyPoints, getHexNeighbor s modulo wrap, getHexRing/InRadius, AXIAL_DIRECTIONS), nový `hexDistance` pro 10.2m. Flat-top orientace. `HexGrid` PixiJS komponenta: single Graphics, useEffect re-draw na [config, theme] change, ±25 hex range MVP (2601 hexů, true viewport culling defer). Integrace v `TacticalMapView` přes demo config (plný scene config v 10.2c). 30 unit testů zelených. Commits `f6931c1`, `f322361`. Spec: `phase-10/spec-10.2b.md`, plán: `plan-10.2b.md`.
- [x] **10.2c — Scény** *(2026-05-27)* — kompletní integrace Operations API z 10.2-prep-1: `useMapScene` (TanStack Query + WS patcher + catch-up gap detection), `useReassignmentListener` (private `map:reassigned` event → autoload nové scény po PJ assign), `useActiveScenes` + `useWorldMembers` pro PJ orchestrator. `applyOperationToScene` pure patcher pro všech 23 op typů (mirror BE atomic logic) + 26 testů. `MapBackground` (PixiJS Sprite, Assets.load async), `MapHiddenOverlay` (full-bleed black plachta, hráč), `MapLockedOverlay` (pulse banner, hráč). `MapPjPanel` floating right-side: `ActiveScenesList` + `MemberAssignmentTable` (per-user dropdown, member.assignToScene mutation). Per-user resolve přes `WorldMembership.currentSceneId` (rozšířen v shared/types). PJ branching `>= PomocnyPJ` (zarovnané s BE). Commits `6700b34` → `17cb546`. Spec: `phase-10/spec-10.2c.md`.
- [x] **10.2d-prep-A — Per-system schema engine** *(2026-05-27)*: foundation pro per-system staty napříč bestiemi / NPC / PC tokeny i deníky. `MapToken.systemStats: Record<string, unknown>` (žádná fixed pole), `SystemEntitySchema` definice (sections + fields + `combatBehavior` tagy), schémata definovaná FE TS → `pnpm export-schemas` → JSON do `shared/schemas/` → BE čte. `<EntitySchemaForm>` + `<EntityStatbar>` dynamic renderery. BE `SystemStatsValidator` integrate v `token.add/update` ops. MVP baseline = DrD2 (mirror legacy); D&D 5e / CoC = další pluginy config-only. Spec: `phase-10/spec-10.2d-prep-A.md`, plán: `plan-10.2d-prep-A.md`.
- [x] **10.2d-prep-B — Bestiář (standalone vedle 8.4)** *(2026-05-27)* — pivot: 8.4 zachováno jako NPC šablony s deníkem; bestiae je separátní modul jen pro statbloky bez deníku. BE `bestiae` modul (schema, repository, service s 3-scope visibility + clone + authorization, controller, app.module wired) + FE feature `bestiar/` (types, api, hooks, BestiarPage 3 taby, BestieEditorModal s `<EntitySchemaForm>` z prep-A, CloneBestieModal, BestieCard, route `/svet/:wid/bestiar` PJ+). 10.2d palette pak čte přes `useBestiar()`. rename modul `npc-templates` → `bestiae`, schema refactor (3-scope system/user/world; drop diary fields; staty přes prep-A `systemStats`), migrace existing dat (worldId mapping na scope), BE `token.add` handler s bestie snapshot logikou, FE `NPCDirectoryPage` → `BestiarPage` (rename + 3 taby + `<EntitySchemaForm>` integrate), clone endpoint nahrazuje existing `import`, drop CreateCharacterModal „import šablony" flow. Route přesun z `/admin/adresar-postav` na `/bestiar` (PJ+ top-nav). Spec: `phase-10/spec-10.2d-prep-B.md`, plán: `plan-10.2d-prep-B.md`.
- [x] **10.2d — Tokeny** *(2026-05-27)* — token render (TokenLayer + TokenSprite s ring/sprite/fallback/label), stagger pro multi-token v hexu, drag&drop s optimistic mutation + rollback, selection state v TacticalMapView, Bestie spawn paleta v PJ panelu (3 taby Můj/Svět/System), permission gate (canDrag přes characterSlug match nebo Sa/Admin bypass), `findFirstFreeHex` BFS pro spawn pozice. 2 velké commits + tests. Spec: `phase-10/spec-10.2d.md`, plán: `plan-10.2d.md`. PC token spawn (button v MemberAssignmentTable) + NPC postava spawn (z Pages) — defer 10.2e (vyžaduje statbar overlay). Right-click context menu + drag-from-palette polishing → 10.2m.
- [x] **10.2e — Staty tokenu** *(2026-05-27)* — HP bar v PixiJS (schema-driven, color tier green/yellow/red), TokenStatbarModal (HTML modal s EntitySchemaForm editable nebo EntityStatbar read-only), useTokenUpdate optimistic mutation, tokenIsBestie discriminator. PC + NPC postava spawn palety v PJ panelu (vedle Bestie). Character sync TODO defer (Character.systemStats v 8.x reload nepřidaný).
- [x] **10.2c-edit-1 — Scene Assignment UX + Security audit** *(2026-05-28)* — doplnění per-player assignment z 10.2c. BE: `assertCanReadScene` v `OperationsAuthorizer` (paralelní s log varianta, error code `MAP_FORBIDDEN_OTHER_SCENE`), security bug fix `GET /maps/:id` (chyběl `JwtAuthGuard` + permission gate, hráč mohl GETnout libovolnou scénu přes ID). Nový `scene.deactivate` op typ (PJ-only) — atomic CAS `isActive: true → false` + cascade unassign všech hráčů s `currentSceneId === scene.id` (per affected: setCurrentScene null + worldOps `member.unassign` log + emit `world:operation` + privát `map:reassigned`). Idempotent: match miss → `applied: false`, žádný log/broadcast. `ApplyMapOperationResult` rozšířen o optional `applied`. FE: `ActiveScenesList` ✕ tlačítko + `ConfirmDialog` (danger variant), `MapEmptyState` redesign pro hráče (karty PC ve světě přes `useCharacterDirectory`, filter `!isNpc && userId===self`), `useReassignmentListener` komentář potvrzuje out-of-the-box podporu `newSceneId: null`. 13 nových testů (BE 9 authorizer + 4 deactivate, FE 9 ActiveScenesList + 7 MapEmptyState). Spec: `docs/arch/maps/scene-assignment-ux/`. Plán: `phase-10/plan-10.2c-edit-1.md`.
- [x] **10.2c-edit-3 — Bug fixes (více aktivních scén, load=nová scéna)** *(2026-05-28)* — user feedback z manuálního testu: (1) „+ Nová scéna" v PJ panelu deaktivovala ostatní aktivní scény (regress: `MapsRepository.setActive` měl `updateMany({worldId, isActive: true}, {isActive: false})` z doby 1-scéna-svět — removed, memory `project_takticka_mapa_assignment` říká paralelní existence dovolena). (2) Load šablony přepisoval current scenu místo vytvoření nové — refactor `MapLibraryModal.loadMutation` z 7-op sekvence na single POST /maps + setActive + assignToScene. ConfirmDialog text změněn z danger „přepíše aktuální scénu" na primary „vytvořím novou aktivní scénu, současné zůstanou". Spec updates v `library-snapshot/purpose.md` (load semantika) a `api.md` (FE load behavior).
- [x] **10.2c-edit-4 — Layout redesign: orchestrace levý dolní + Boj/Mimo boj toggle** *(2026-05-28)* — user feedback z manuálního testu po edit-3: orchestrace má být v levém dolním rohu (ne pravém horním), solid background (ne průsvitné), iniciativa odložena do 10.2f (rozšířená poznámka). PJ rozhoduje kdo je v boji manuálně přes klik na badge „V BOJI"/„MIMO BOJ" v TokenStatbarModal — toggle volá `token.update {patch: {inCombat: !current}}` op. Hráč vidí badge jen jako read-only span (canEdit=false). CSS: `--map-toolbar-bg-solid` nový shared theme token v `_shared/map-tokens.css` (fallback `#0a0814`). MapPjPanel position `bottom: 20px; left: 20px` (mobile `bottom/left/right: 12px`). 145/145 tests pass.
- [x] **10.2c-edit-2 — Map Library full snapshot + per-PJ ownership** *(2026-05-28)* — kompletní oprava `mapTemplates` knihovny: full-snapshot save + per-PJ vlastnictví + cross-world přenos. **BE:** `MapTemplate` schema rewrite (`ownerId: required + indexed`, `timestamps: true` nahrazuje `lastModified`, compound index `{ownerId, updatedAt}`), repository `findByOwner` + toEntity mapper rozšíření, `CreateMapTemplateDto` class-validator, controller přepsán (per-PJ filter v findAll, ownership matrix v findById/PUT/DELETE, Admin+ bypass, `ownerId` immutable, server-side PC token strip přes `filterOutPcTokens` helper, bug fix NotFoundException → ForbiddenException u 403). 5 nových PJ-only op typů pro load sekvenci (`scene.fog.replace`, `scene.effects.replace`, `scene.npc-templates.replace`, `scene.tokens.replace-npc`, `scene.sounds.set`) v DTO + computeInverse + applyAtomic. Migrační skript `scripts/migrate-map-templates-ownerid-10.2c-edit-2/` (dry-run default, `--apply` aktivuje, `--owner-email` override, default Tyky). **FE:** `MapLibraryModal` save full snapshot (filter `t.isNpc === true`), load sekvence 7 ops (image → config → fog → effects → npc-templates → tokens-npc → sounds) s `ConfirmDialog`, částečný stav povolený s toast hlášku „načtení selhalo po N/7 operací". `types.ts` rozšířen o 5 nových MapOperation typů, `applyOperationToScene` patcher 5 nových cases (mirror BE atomic logic). **Tests:** 29 nových (24 controller + 5 nové ops scenarios). Cross-world přenos funguje implicitně (žádný worldId v MapTemplate). **Prod migrace odložená** — čeká na explicitní spuštění s `--apply` na produkční DB. Spec: `docs/arch/maps/library-snapshot/`. Plán: `phase-10/plan-10.2c-edit-2.md`.
- [x] **10.2f — Iniciativa** *(2026-05-30)* — horní full-width lišta + combat tracker, ve 3 sub-krocích. **f-1 (FE):** `useCombat` hook nad hotovými `combat.*` ops; `InitiativeBar` (controls + strip), `InitiativeBarItem` (kruhový portrét, HP-tier border, badge pořadí, `InitiativeInput` port, „i" deník), Stav A (sort dle initiative desc) vs Stav B (`combat.order` snapshot, zlatý „na tahu" glow+pulse přes `useTick`). Klik na položku = pan-to-token (`centerOnPoint` tween 250 ms) + select. Permission: PJ ovládá boj + edituje init všem, hráč read-only + edit vlastního PC. `hpTier`/`getInitials` vyextrahováno do utils (sdíleno s tokenem). **f-2 (BE+FE):** nová op `combat.reorder { orderTokenIds }` (zachovává `round`+`currentTokenId`, na rozdíl od `combat.start`) — DTO/registry/applyAtomic/computeInverse + 4 BE testy; FE patcher + `useCombat.reorder()` + hod iniciativy za boje (token.update + reorder); tlačítka „🎲/⇅" ve Stav B. **f-3 (BE+FE):** ephemeral WS `map:spotlight` (PJ „ukazováček" — klik na bojovníka rozsvítí na mapě **červený pulsující ring** všem, ~3 s; PJ-only gate v gateway), FE `useMapSocket.emitSpotlight` + `useMapScene` propojení + `TokenSprite` spotlight glow. Při opravě cesty doplněno: opraveno 8 pre-existujících TS chyb + 3 lint warningy. **Při tom odhalené dluhy:** D-064 (orchestr PC-katalog), D-065 (GurpsSheet bez iniciativy). Spec: `phase-10/spec-10.2f.md`, plán: `plan-10.2f.md`. **Původní implementační poznámka (z 10.2c-edit-4 design diskuze 2026-05-28):** Iniciativa lišta má být **horní lišta full-width** (top: 0; left: 0; right: 0;), zobrazuje tokeny s `inCombat: true` sortované desc by initiative. Visible PJ+hráč (oba vidí). PJ rozhoduje kdo je v boji manuálně přes „Boj/Mimo boj" toggle na TokenStatbarModal (10.2c-edit-4 doplnilo) — NE auto inCombat při spawn. Per token na liště: portrét + jméno (truncated) + InitiativeInput + klik = select v mapě / scroll-to-token. „i" badge = open diary. Enter = blur+save v inputu, Tab = native next. Empty (nikdo v boji) = lišta hidden. Bestie (s `inCombat: true`) jsou automaticky v liště. Combat tracker (start/turn/end/round counter, „aktivní bojovník" indikátor) zůstává jako samostatné rozšíření v rámci 10.2f.
- [x] **10.2g — Efekty** *(2026-05-30)* — port Matrix `MapEffectOverlay`+`EffectsPalette` ze SVG na **PixiJS v8**. Tři efekty: `color` (8 barev, 1 hex/klik), `barrier` (DC text uprostřed; brush tažení nebo kruh `getHexesInRadius`), `explosion` (soustředné rings `getHexRing` od středu, per-ring damage, variant fire/gas/smoke s tier škálami, alpha puls přes `useTick`, respekt `prefers-reduced-motion`). **Nové:** `effects/EffectsLayer.tsx` (Pixi render 3 typů, klik-na-efekt mazání), `effects/EffectsPalette.tsx`+css (plovoucí toolbar vpravo dole nad zoom, panel doleva, aktivní nástroj nese svou barvu+puls — frontend-design audit), `effects/effectColors.ts` (port tier konstant), `hooks/useEffectTool.ts` (state machine + LS persist). **Integrace:** `effect.add/update/remove` + `scene.effects.replace` ops (vše hotové z prep fází, BE zachovává FE effect id → brush append spolehlivý), optimistic mutace, klik-na-hex effect větev (nejvyšší priorita), barrier brush tažení přes `brushBarrierIdRef` (master, imunní vůči staleness) + fresh scéna z cache. `useViewportPanZoom` nový param `suppressLeftPan` (effect tool / placement = left-drag kreslí, nepanuje). Deník v dock módu vystaví `--map-dock-width` → paleta i zoom se odsunou doleva vedle něj. 21 nových testů (effectColors, useEffectTool, EffectsPalette). Fog vynechán → 10.2h. Spec: `phase-10/spec-10.2g.md`, plán: `plan-10.2g.md`.
- [x] **10.2h — Fog of war** *(2026-05-30)* — mlha + odhalování. **Datová vrstva + BE hotové z prep** (`fogEnabled`/`revealedHexes`, ops `fog.set`/`fog.brush` atomic `$addToSet`/`$pullAll`, FE patcher, authorizer PJ-only gate) → krok čistě FE. **`FogLayer`** (PixiJS): spike ukázal, že RenderTexture by u celoplošného fogu narazila na paměťový strop + imperativní lifecycle cizí deklarativní codebase → zvolena **varianta B** (schválený fallback z plánu): jeden `Graphics` (jeden GPU batch, ne tisíce DOM polygonů jako Matrix SVG) iteruje bbox mapy (rozsah + culling jako HexGrid), fog poly jen na ne-odhalených hexech, `BlurFilter` = měkké okraje. Barva/alpha dle role (`--map-fog-pj-fill` 0.16 / `--map-fog-player-fill` 0.94). **`useFogTool`** (mode/brushSize + LS persist `ikr-map-fog-*`), **`FogPalette`** + css (dock „🌫️ Mlha" vedle Efektů, frontend-design audit — mlhový accent `#9fb4d4`, master switch zap/vyp, odhalit/zahalit, štětec 1/7/19 hexů, reset s ConfirmDialog), **`fogUtils`** (`fogBrushHexes`, `effectivelyRevealed` = revealed ∪ PC, `isTokenHiddenByFog`, `parseAlpha`). **Integrace:** `suppressLeftPan` + fog tool, optimistic `fog.brush` brush (dedup `lastFogHexRef`), vzájemné vyloučení effect/fog (akce-based wrappery), NPC visibility gate v `TokenLayer` (hráč nevidí NPC/bestie v zamlženém hexu, PC vždy), WS auto-sync přes patcher (žádný nový event). 24 nových testů (useFogTool 5, fogUtils 19). Spec: `phase-10/spec-10.2h.md`, plán: `plan-10.2h.md`.
- [x] **10.2i — Real-time sync + počasí na mapě** *(2026-05-31)* — přerámováno: většina „real-time sync" už stála z 10.2-prep-1 (generický `map:operation` + `seqNumber` + append-only log) a 10.2c (seq tracking + gap detection + patcher), takže původní scope (specifické eventy `token-moved`/`fog-updated`/… + throttling/coalescing) je **nahrazený operation modelem** — coalescing vědomě OUT (posíláme diskrétní ops, ne stream; brush má dedup). **i-1 robustnost:** `catchUpScene` sdílený helper (gap-detection + reconnect, + ochrana „too-big" gap > limit → full refetch), **reconnect catch-up** (`useMapSocket` listener na socket `connect` → re-join scene room + forced catch-up; zacelilo díru, kdy za klidu na scéně po výpadku nepřišel žádný event a klient tiše držel stará data), `MapConnectionBadge` (online/synchronizuji/odpojeno přes `socketStatusAtom`), narovnán `websocket-api.md` (MapsGateway sekce na operation model, legacy relay eventy → deprecated). **i-2 počasí:** `World.activeMapWeather` (BE schema+mapper, persist při broadcast `target:map`, `DELETE …/map-weather/active` clear), `useMapWeather` (world-room join `room:join world:{id}` i pro hráče + `weather:updated` listener → patch World cache + FX toggle LS), `MapWeatherPanel` (otvírací pravý horní roh, reuse `WeatherBarometer`, PJ výběr generátoru/vyslat/vypnout, hráč read-only), `MapWeatherAtmosphere` (DOM overlay reuse `WeatherAtmosphere`, NE Pixi — atmosféra fixovaná k viewportu; jen rain/snow/storm/fog/cloudy, per-user vyp + reduced-motion). **Při tom opraven bug:** BE emitoval socket `weather:updated` (dvojtečka), FE poslouchal `weather.updated` (tečka) → live-update počasí (i na stránce 9.4) fakticky nefungoval; sjednoceno na `weather:updated`. Nové tokeny `--map-status-*` + `--map-weather-accent`. 6 nových BE testů + ~30 FE (catchUpScene, useMapSocket reconnect, useMapWeather, MapWeatherPanel, MapWeatherAtmosphere). Spec: `phase-10/spec-10.2i.md`, plán: `plan-10.2i.md`. **Defer (ne dluh):** per-scéna počasí (MVP per-svět), počasí ovlivňující mlhu/světlo.
- [x] **10.2j — Hod kostkou** *(2026-05-31)* — viditelný hod na mapě, **reuse 6.3 CSS dice** (engine/skiny/overlay/picker/vězení; `three.js` zahozen — viz spec odchylka). Persistovaná historie přes op `dice.roll` (atomic `$push`+`$slice -50`, authorizer anti-spoof + token ownership), FE patcher s dedup+cap. **World-level visibility** `World.diceVisibility` (3 toggly v Základní info: PJ hody def. vyp, NPC+bestie def. vyp, spoluhráči def. zap) — řídí overlay na ploše **i** log přes sdílený `canSeeRoll`. **Log** = plovoucí panel vlevo dole nad PJ panelem (port legacy vzhledu, CSS Modules), **per-user clear** (`clearedBefore` v localStorage, nemaže nikomu jinému). Spouštěče: **vlastní hod** (`DiceRollButton` reuse `DicePickerPopover`), **schopnost + iniciativa** ze sheetů (`TokenSystemSheet`/`BestiePanelView` → `mapDice.roll`, ownership gated), bestie hody také. Live overlay cizích viditelných hodů jen v happy-path (catch-up replay nespouští — anti-stale guard). Per-system kategorie přes `map-systems` `rollCategories`. Spec: `phase-10/spec-10.2j.md`, plán: `plan-10.2j.md`.
- [ ] **10.2k — Zvuky:** ambient playlist scény (`activeSoundIds`), YouTube přehrávač; napojení na zvukovou databázi (krok 13.3)
- [ ] **10.2l — Deníky na mapě:** token → deník / staty postavy (overlay nebo dock panel), úprava HP / statů přímo z deníku (krok 8)
- [ ] **10.2m — Nástroje + oprávnění:** ping (double-click), fullscreen, měření vzdálenosti; PJ (tokeny / fog / efekty / scéna) vs hráč (jen vlastní token, respekt `isLocked`); `mobil-desktop` audit, `napoveda`

### - [ ] 10.3 Dungeon Builder (`/svet/:worldId/admin/dungeon-builder`)

*Tile editor map. BE `dungeon-maps` kompletní. Konva canvas 2D (editor, ne herní plocha — výkon zde není kritický). PJ+.*

- [ ] **10.3a — Tile editor:** mřížka (square / hex), buňky (floor / wall / door / stairs / water / lava / pit), `wallEdges`, kreslení štětcem + guma
- [ ] **10.3b — Dekorace:** props (dveře, truhly, schody, stoly…), umístění, rotace (Konva `Transformer`)
- [ ] **10.3c — Téma:** `dyson` (pergamen, perokresba) / `modern`
- [ ] **10.3d — Export:** `POST .../export-template` (→ `MapTemplate`) a `.../export-scene` (→ `MapScene`) — vznik podkladu pro taktickou mapu (10.2c); `mobil-desktop` audit

---

**Napojení napříč systémy (proč je taktická mapa „propojená"):**
- **Postavy (krok 8)** — token = postava; HP / staty se synchronizují s deníkem postavy; deník otevíratelný z mapy.
- **NPC šablony (krok 8.4)** — NPC tokeny jsou instance z `npc-templates` / bestiáře.
- **Kostky (krok 6.3)** — hod kostkou na mapě sdílí dice engine s chatem.
- **Zvuky (krok 13.3)** — ambient playlist scény.
- **Počasí (krok 9.4)** — ✅ hotovo v 10.2i: PJ vysílá počasí generátoru na mapu (`World.activeMapWeather`), panel + vizuální atmosféra.
- **Dungeon Builder (10.3)** — export produkuje `MapScene` / `MapTemplate` = podklad taktické mapy.
- **Wiki Lokace (krok 7) / Universe mapa (10.1)** — scéna může být vázaná na lokaci světa.

**Závislosti:** 10.2 staví na krocích 6.3 (dice), 8 (postavy / NPC), 9.4 (počasí), 13.3 (zvuky) — část napojení (zvuky) lze dotáhnout až po fázi 13. 10.3 by mělo předcházet 10.2 (produkuje podklady).

**Mimo rozsah / k ověření ve spec:**
- Konečné potvrzení rendereru (PixiJS) — doporučeno výkonově, spec 10.2a potvrdí; fallback `Konva` pokud se WebGL ukáže jako neúměrná složitost.
- `dungeon-maps` WS gateway — viz BE gap výše.

---

## Fáze 11 — Svět — Kampaně

*Nástroje PJ na řízení kampaně — vztahová pavučina, příběhové linie a scénáře, rychlé poznámky, obchod a měny. Převážně PJ-facing; hráč vidí jen sdílené / vlastní.*

**BE:** modul `campaign` je **kompletní** — 7 entit (`CampaignSubject`, `CampaignRelationship`, `CampaignStoryline`, `CampaignScenario`, `CampaignQuickNote`, `CampaignShopItem`, `CampaignChangeLog`), plné CRUD pod `/campaign/*`, dashboard endpoint, role-based access. Měny řeší samostatný modul `world-currencies` (`code` / `name` / `symbol` / `rate`, genre-seed, convert endpoint). **Fáze 11 = FE** — 4 stránky jsou stuby.

**Model viditelnosti (promítnout do FE):** kampaňová data jsou **owner-scoped** — každý PJ / Pomocný PJ má vlastní sadu (`ownerId`), příznakem `isShared` ji může sdílet. Hráč vidí jen vlastní + sdílené. FE rozlišuje „moje / sdílené" a respektuje to, co BE vrátí (BE filtruje dle role + ownera).

**Reuse:** `RichTextEditor` (scénáře — TipTap obsah + obrázky), dashboard-card pattern (QuickNotes karty), tab layout, `Modal` / `ConfirmDialog`.

**Nové balíčky:** `react-force-graph` (2D — pavučina). *Na rozdíl od taktické mapy (krok 10, WebGL) je pavučina PJ nástroj s omezeným počtem uzlů — 2D force graph (canvas) plně stačí, WebGL zde netřeba.*

**Klíčové soubory:**
- FE stuby: `src/features/world/pages/` — `CampaignPage`, `StorylinesPage`, `ShopPage`, `CurrencyPage`
- Routy: `/svet/:worldSlug/{pavucina, scenare, obchod, prevodnik-men}`
- Starý Matrix (vzor): `Matrix/frontend/src/pages/CampaignCenter.tsx`, `World/WorldStoryboard.tsx`, `World/WorldShop.tsx`, `World/WorldCurrency.tsx`, `components/RelationshipGraph.tsx`

**Pořadí stavby:** 11.4 → 11.1 → 11.2 → 11.3 *(měny první — shop je potřebuje; pak pavučina jako základ, na který se vážou storyliny i poznámky).*

### - [ ] 11.1 Pavučina (`/svet/:worldId/pavucina`)

*Vztahový graf kampaně + PJ dashboard. Jádro kampaňových nástrojů.*

- [ ] **11.1a — Subjekty:** `CampaignSubject` CRUD — typy (PC / NPC / FACTION / ORG / LOCATION / OTHER), avatar, tagy, status; vazba na wiki stránku (`linkedPageSlug`) a postavu (`linkedCharacterSlug`)
- [ ] **11.1b — Vztahy:** `CampaignRelationship` CRUD — asymetrické strany `sideA` / `sideB` (tón, chování, záměr PJ, síla 1–10), sdílené pole (`whatHappened` veřejné × `behindTheScenes` tajné), status (active / dormant / crisis / closed), priorita 1–5
- [ ] **11.1c — 2D force graph:** vizualizace — uzly barevně dle typu, hrany dle statusu, drag uzlů, pan/zoom, fokus na uzel, filtr dle storyline
- [ ] **11.1d — Dashboard „Dnes":** `GET /campaign/dashboard` — krizové vztahy, aktivní storyliny, připnuté poznámky, poslední změny (`CampaignChangeLog`, TTL 90 dní)
- [ ] **11.1e — Moje / sdílené:** přepínání vlastní vs sdílené kampaňové vrstvy (`isShared`); `mobil-desktop` audit

### - [ ] 11.2 Storylines & Scénáře (`/svet/:worldId/scenare`)

*Příběhové linie a strom scén. Editor PJ-only.*

- [ ] **11.2a — Storyliny:** `CampaignStoryline` — úroveň (macro / mid / micro), status, fáze, shrnutí, `whatHappened` / `truth` / `playersBelief` / `gmIntent` / `nextStep`; vazby na subjekty a vztahy
- [ ] **11.2b — Strom scénářů:** `CampaignScenario` jako strom — parent-child, `branchLabel` (větvení dle voleb hráčů), status (draft / active / optional / resolved), pořadí
- [ ] **11.2c — Editor scénáře:** `RichTextEditor` (TipTap obsah + obrázky), tajné `gmNotes`, cíl / výsledek scény
- [ ] **11.2d — Provázání assetů:** scénář ↔ mapy (`MapScene`, krok 10.2), lokace (wiki stránky, krok 7), subjekty, storyliny
- [ ] **11.2e — `mobil-desktop` audit**

### - [ ] 11.3 QuickNotes & Shop (`/svet/:worldId/obchod`)

*Rychlé poznámky PJ + obchod světa.*

- [ ] **11.3a — QuickNotes:** `CampaignQuickNote` — pin/unpin, status (open / done), vazby na subjekty a storyliny; připnuté se zobrazují v dashboardu 11.1d
- [ ] **11.3b — Shop:** `CampaignShopItem` — skupina / podskupina, cena + `currencyCode`, „doporučeno" badge, „často kupováno s" (`linkedItemIds`), `referenceLink`
- [ ] **11.3c — Filtry + cena v měně:** hledání, filtr dle skupiny, řazení; zobrazení ceny v hráčem zvolené měně (převod přes 11.4)
- [ ] **11.3d — `mobil-desktop` audit**

### - [x] 11.4 Měny a převodník (`/svet/:worldId/prevodnik-men`) ✅ (2026-05-26)

**Spec:** `docs/arch/phase-11/spec-11.4.md` ✅ schváleno 2026-05-26
**Plán:** `docs/arch/phase-11/plan-11.4.md` ✅ 11 fází + BE patch dokončeno 2026-05-26

*Měny světa + konverze + sdílená infrastruktura připravená pro Shop (11.3c) a Character finance (8.x). BE modul `world-currencies` rozšířen o jemnější role gate pro PomocnyPJ (edit existujících).*

- [x] **11.4a — Správa měn (3-úrovňový role gate):** CRUD měn světa (`code` / `name` / `symbol` / `rate`); první měna = základ (rate 1.0), kurz dalších relativně; genre-seed při vzniku světa zachován. **PomocnyPJ smí editovat existující měny** (rate/name/symbol) + „Nastavit jako základ"; **PJ+ a Admin/Super** smí přidat / smazat. Hráč jen čte. BE patch v `world-currencies.service` (`isMetadataOnlyEdit` diff helper + `assertCanEdit` pro PomocnyPJ).
- [x] **11.4b — Převodník + sdílená infrastruktura:** stránka `/svet/<slug>/prevodnik-men` (každý člen), live recalc debounced 250 ms s optimistic klient preview + autoritativní BE result (`POST .../convert`). Sdílená vrstva `src/features/world/currencies/shared/` — `convertAmount` util, `formatCurrency`, `useUserPreferredCurrency(worldId)` hook (per-world persist v `localStorage`), `<CurrencySelect>`, `<CurrencyDisplay>`, `<CurrencyAmountInput>` — připravené pro 11.3c (Shop) a 8.x (Character finance) konzumenty bez refactoru.
- [x] **11.4c — `mobil-desktop` audit + `napoveda`:** desktop ≥ 1024 / tablet 769–1024 / mobil ≤ 768 px ✓ (tabulka → cards na 600 px, max-width 720 px, swap button viditelný, modal scroll). Nápověda doplněna do `PagesSection` (WORLD_PAGES_OK) + `SOON_WORLD Kampaně` zúžen na fáze 11.1–11.3.

**Testy:** BE +5 unit (PomocnyPJ edit ok / set-as-base ok / add 403 / delete 403 / Hrac 403) → 20 total. FE +81 (16 convertAmount + 5 useUserPreferredCurrency + 5 CurrencySelect + 4 CurrencyDisplay + 5 CurrencyAmountInput + 8 setAsBase + 12 validation + 6 ConverterSection + 8 CurrenciesListSection + 12 z foundation). Full FE suite 1845/1845 ✓, lint 0 errors (44 pre-existing warnings), build ✓.

**Klíčová rozhodnutí (spec §4.7b, §4.8b):**
- **Sdílená vrstva first** (dogfooding stránkou samotnou) — refaktor 1-na-N je bolestivější než N-na-1; Shop 11.3c a Character finance 8.x to konzumují bez vlastního BE/util kódu.
- **Per-world `useUserPreferredCurrency`** přes Jotai atomFamily + localStorage `ikaros.currency.preferred.<worldId>` — Shop a Finance budou ukazovat ceny v hráčově preferované měně.
- **BE jemnější role gate** přes `isMetadataOnlyEdit` diff (sada `code` beze změny = edit, jinak add/delete) → PomocnyPJ může spravovat kurzy, ne přidávat/mazat (přesný PJ záměr).

**Mimo rozsah (samostatné dluhy / fáze):**
- Integrace `<CurrencyDisplay>` do Shop = **11.3c** (přijde s ostatními kampaňovými nástroji)
- Integrace `<CurrencySelect>` do AccountPanel = **8.x** (Character finance)
- Drag-reorder měn, currency icon picker, audit log změn kurzu, cascade integrity check (shop/finance ref) — všechno explicitně out-of-scope

---

**Napojení napříč systémy:**
- **Postavy (krok 8)** — `CampaignSubject.linkedCharacterSlug`; `Character.campaignSubjectId` váže postavu na uzel pavučiny.
- **Wiki stránky (krok 7)** — subjekty i scénáře odkazují na lokace (`linkedPageSlug`).
- **Mapy (krok 10)** — scénáře se vážou na `MapScene` (10.2).
- **Finance postavy (krok 8)** — `CharacterFinance.currency` používá kódy měn z `world-currencies` (11.4).

**Mimo rozsah / k ověření ve spec:**
- **BE gap:** `campaign` nemá WS gateway — real-time sync pavučiny mezi PJ chybí; campaign je ale primárně PJ příprava (ne live), nejspíš netřeba.
- Bulk import/export pavučiny, PDF export scénářů → mimo MVP.

---

## Fáze 12 — Admin & nastavení

*Závěrečná administrativní vrstva. **Velká část už existuje** — BE `admin` modul je kompletní, schvalování obsahu běží přes „Zpracovat" tab (krok 3.x), správa světa je rozdělena do fází 5–11. Fáze 12 = převážně zapojení hotových dílů + dvě dostavby.*

**BE:** modul `admin` je **kompletní** — seznam uživatelů s filtry, změna role (s hierarchií), ban / unban, plánované smazání (30denní hold), `adminPermissions` (granular), username requests, **bulk akce** (ban / unban / role-change), audit log. Modul `world-settings` kompletní (`hiddenNavItems`, `customHeadline`, `menuTemplates`…). **BE gap:** chybí endpoint pro platformové statistiky (počet uživatelů / světů / obsahu) — `stats` modul dnes umí jen search index.

**FE — co už existuje:** komponenty správy uživatelů (`AdminUsersPage`, `UsersTab`, `RequestsTab`, `AuditLogTab`, `BanModal`, hooky `useAdminUsers*`) jsou **hotové, ale nezapojené v routeru**. „Zpracovat" tab (pending-actions, 8 typů) běží na `/ikaros/uzivatele`.

⚠️ **Nesrovnalost k vyřešení ve spec:** správa uživatelů je dnes dvojkolejná — admin komponenty (`AdminUsersPage`) existují jako nezapojený sirotek, zároveň `/ikaros/uzivatele` má admin taby. `/admin` (`PlatformAdminPage`) je stub. **Návrh:** `/admin` = platformový admin hub (zapojit hotové `AdminUsersPage` komponenty), `/ikaros/uzivatele` ponechat pro „Zpracovat" + Přátelé + veřejné profily; hloubkové admin nástroje (ban, role, audit, bulk) konsolidovat pod `/admin`.

**Pořadí stavby:** 12.1 → 12.2.

### - [ ] 12.1 Platform admin (`/admin`)

*Nahrazuje stub `PlatformAdminPage`. Superadmin / Admin. Většina FE dílů existuje — jde hlavně o zapojení a konsolidaci.*

- [ ] **12.1a — Admin hub + dashboard:** stránka `/admin`, platformové statistiky (počet uživatelů / světů / článků / galerie…) — **vyžaduje nový BE endpoint** (jediná BE dostavba fáze 12)
- [ ] **12.1b — Správa uživatelů:** zapojit hotové komponenty (`AdminUsersPage`, `UsersTab`) — seznam + filtry, změna role (hierarchie), ban / unban, plánované smazání (30denní hold)
- [ ] **12.1c — Admin permissions:** granular oprávnění (`canManageAdmins` / `canModerateContent` / `canEditPlatformPages`) — Superadmin only
- [ ] **12.1d — Bulk akce:** hromadný ban / unban / role-change (BE hotové, FE `BulkToolbar` dotáhnout)
- [ ] **12.1e — Username requests + audit log:** schvalování username (`RequestsTab`), audit log admin akcí (`AuditLogTab`) — zapojit pod `/admin`
- [ ] **12.1f — Konsolidace + úklid:** odstranit dvojkolejnost správy uživatelů (viz nesrovnalost výše); `mobil-desktop` audit, `napoveda`
- *Schvalování obsahu (články / galerie / diskuze) — hotové přes „Zpracovat" tab (krok 3.x), mimo rozsah fáze 12.*

### - [ ] 12.2 World admin — headline / menu builder

*Jediný zbylý světový admin nástroj — ostatní správa světa je v krocích 5.3 / 6.5 / 7.4 / 8.4 / 9.x / 11.4.*

- [ ] **Headline / menu builder** (`/svet/:worldId/admin/headline`, PJ+) — PJ skrývá systémové moduly (`hiddenNavItems`) a staví vlastní navigaci světa (`customHeadline` — strom uzlů: skupiny + odkazy na stránky), `menuTemplates`; „Last info" box
- [ ] Ukládá `PUT /worlds/:worldId/settings`; promítne se do nav ve `WorldLayout` (krok 5.1)
- [ ] `mobil-desktop` audit, `napoveda`
- ~~`/admin/meny`~~ → krok **11.4a** &nbsp;·&nbsp; ~~`/admin/nastaveni-kalendare`~~ → krok **9.2d** &nbsp;·&nbsp; ~~`/admin/emotes`~~ → krok **6.4**

---

**Mimo rozsah / k ověření ve spec:**
- Platformový dashboard endpoint (statistiky) — jediná BE dostavba fáze 12.
- Custom RPG presety — `system-presets` je dnes read-only (13 systémů); editace vlastních presetů mimo MVP.
- GDPR export / anonymizace uživatelských dat — mimo MVP.

---

## Fáze 13 — Pokročilé funkce

*Závěrečná fáze — vyhledávání, push notifikace, zvuková databáze. BE je u všech tří hotový; fáze 13 = FE.*

**BE:** moduly jsou **kompletní** —
- `search` — hybridní vyhledávání: MeiliSearch (fulltext, typo tolerance) + ONNX embeddings (sémantické), orchestruje `SearchCoordinator`; endpointy `GET /search`, `/search/providers`, rebuild/reindex.
- `push` — VAPID, subscribe / unsubscribe, `PushService.notify*`; game-events už push posílají (vč. 24h reminder jobu).
- `sounds` + `world-sounds` — `Sound` s 20+ metadaty, globální i per-svět, nominační workflow (svět → pending → admin approve → globální).

**Nové balíčky:** `vite-plugin-pwa` (+ `workbox`) pro 13.2 — FE dnes **nemá žádnou PWA infrastrukturu** (žádný service worker, manifest).

**Pořadí stavby:** kroky 13.1–13.3 jsou nezávislé — dle priority.

### - [ ] 13.1 Vyhledávání

*Globální search. BE `search` kompletní — hybridní fulltext + sémantické.*

- [ ] **13.1a — Search UI:** funkční search bar v headeru (`IkarosLayout` i `WorldLayout` — dnes jen statický `<div>Hledat…</div>`), zkratka Ctrl+K, modal / dropdown s výsledky, debounce
- [ ] **13.1b — Výsledky + provideri:** `GET /search?q=&provider=&worldId=` — výběr provideru (Combined / fulltext / sémantický), skóre, proklik na výsledek
- [ ] **13.1c — Index monitoring (admin):** stav indexace, rebuild / reindex (`stats` modul) — zapojit do admin hubu (fáze 12)
- [ ] `mobil-desktop` audit

### - [ ] 13.2 Push notifikace (PWA)

*BE `push` modul kompletní (game-events už push posílají). FE staví PWA infrastrukturu od nuly.*

- [ ] **13.2a — PWA infrastruktura:** `vite-plugin-pwa`, service worker, `manifest.webmanifest`, PWA meta tagy, registrace SW v `main.tsx`
- [ ] **13.2b — Push subscription:** VAPID flow — `GET /push/vapid-public-key` → `pushManager.subscribe` → `POST /push/subscribe`; permission dialog (povolení), `unsubscribe`
- [ ] **13.2c — Příjem notifikace:** SW handlery `push` + `notificationclick`, deep-link na URL z payloadu
- [ ] **13.2d — Správa zařízení:** uživatel vidí svá zařízení / subscriptions, může je odebrat; zap / vyp notifikací
- [ ] `mobil-desktop` audit

### - [ ] 13.3 Zvuková databáze (`/svet/:worldId/zvuky`)

*BE `sounds` + `world-sounds` kompletní vč. nominačního workflow. Nahrazuje stub `SoundsPage`.*

- [ ] **13.3a — Knihovna světa:** grid karet zvuků (`GET /worlds/:worldId/sounds`), YouTube přehrávač, náhled
- [ ] **13.3b — Filtry:** bohatá metadata — `mediaType` / `environment` / `emotionalTone` / `intensity` / `factionStyle` / `techLevel` / `magicLevel`…; hledání + filtrování
- [ ] **13.3c — Správa (PJ):** CRUD zvuků světa, import schválených globálních (`POST .../sounds/import/:globalId`)
- [ ] **13.3d — Nominační workflow:** člen nominuje zvuk do globální databáze (`POST .../sounds/:id/nominate`), admin schvaluje / zamítá (`/sounds/:id/approve|reject`)
- [ ] **13.3e — Integrace s taktickou mapou:** `MapScene.activeSoundIds` — ambient playlist scény (napojení krok 10.2j)
- [ ] `mobil-desktop` audit, `napoveda`

### 13.4 Custom Emotes → přesunuto do kroku 6.4
*Per-svět custom emotes (`:shortcode:` → obrázek) jsou součástí světového chatu — viz **krok 6.4**. Tato položka tím zaniká.*

---

**Mimo rozsah / k ověření ve spec:**
- **BE gap — rozsah indexace:** `search` indexuje dnes jen `pages` (wiki stránky). Roadmapa počítá s hledáním i v postavách / diskuzích / článcích → vyžaduje rozšíření indexace na BE; ve spec 13.1 rozhodnout (pages-first vs plný scope).
- Notification center (historie notifikací, read/unread), per-typ preference notifikací → mimo MVP.
- Audio mixer / scheduling / efekty u zvuků → mimo MVP.

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
    "pixi.js": "^8.x",
    "@pixi/react": "^8.x",
    "konva": "^9.x",
    "react-konva": "^18.x",
    "@cloudinary/react": "^1.x",
    "react-datepicker": "^6.x",
    "vite-plugin-pwa": "^1.x"
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
