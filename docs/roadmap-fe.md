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

*Chat uvnitř konkrétního světa (`/svet/:worldId/chat`) — víc kanálů seskupených do skupin, na rozdíl od globální Hospody/Rozcestí (fáze 4). Fáze 6 přenáší **plný feature set světového chatu starého Matrixu** (`Matrix/frontend/src/pages/World/WorldChat.tsx` + `components/Chat/*`) — kanály/skupiny, dice roll, NPC mód, RP datum, editace, custom emotes — postavený nad novým BE.*

**BE:** modul `chat` (`backend/src/modules/chat`) je **z velké části hotový** — `ChatGateway` (Socket.IO), `ChatService` (CRUD skupin/kanálů/zpráv), schémata `ChatGroup` / `ChatChannel` / `ChatMessage`. REST pod `worlds/:worldId/chat/*`. Umí: accessMode kanálů (`all`/`roles`/`members`), whisper (`visibleTo`), reply, emoji reakce, editaci zpráv, NPC override (`overrideName`/`overrideAvatarUrl`), `rpDate`, `customFont`, `color`, detekci dice rollu (`isDiceRoll`), read status (unread counts), soft-delete, push notifikace. Na `world.created` se automaticky zakládají 2 skupiny (Globální → kanál „obecný", Postavy → kanál „hráči").
**WS eventy:** `typing:start` / `typing:stop` → broadcast `chat:typing`; event-emitter `chat.message.created/updated/deleted`, `chat.channel.*`, `chat.group.*`, `chat.unread.updated`. WS room pattern `chat:${channelId}`.

**Fáze 6 = převážně FE** — napojení na hotový BE + **reuse chat infry z fáze 4** (`src/features/chat/` — `ChatRoom`, `MessageList`, `MessageItem`, `ChatInput`, `UserList`, `MessageAttachments`, socket hooky).

**„Lépe a správněji" vs. starý Matrix:**
- Přílohy = unified `attachments[]` (obrázky + dokumenty) místo starého rozštěpeného `Image` + `Images[]`.
- Přístup ke kanálu = `accessMode` (`all`/`roles`/`members`) + `allowedRoles`/`allowedMemberIds` místo legacy stringu `GroupRequired` + `RoleRequired: int`.
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

### - [ ] 6.1 Světový chat — shell + kanály

*FE shell nad hotovým BE. Cíl: funkční 3-panelový chat (sidebar | zprávy | přítomní) s přepínáním kanálů.*

- [ ] **6.1a — Generalizace chat infry z fáze 4:** `ChatRoom` + hooky (`useGlobalChat`, `useUploadAttachment`, `useToggleReaction`) parametrizovány z `room: RoomKey` na obecné `channelId: string`; socket room `chat:${channelId}`. `MessageList` / `MessageItem` / `ChatInput` jsou už generické — reuse beze změny
- [ ] **6.1b — Sidebar skupin + kanálů:** hierarchie `ChatGroup` → `ChatChannel`, barevné kódování skupin, přepínání kanálu, sbalování skupin; kanály filtrované dle `accessMode` a role/skupiny uživatele — `GET /worlds/:worldId/chat/groups`
- [ ] **6.1c — Připnutí kanálů:** uživatelské připnutí oblíbených kanálů do horní sekce sidebaru (per-user, jako starý Matrix `pinnedChannelIds`)
- [ ] **6.1d — Real-time napojení:** subscribe/unsubscribe na WS room kanálu, typing indikátor, broadcast nových/editovaných/smazaných zpráv; presence v kanálu, seznam přítomných (panel přítomných)
- [ ] **6.1e — Read status:** unread counts per kanál (`GET /worlds/:worldId/chat/unread`), badge v sidebaru i u nav položky Chat, `POST .../channels/:id/read`; soft-deleted zprávy zobrazené jako „Zpráva byla smazána"
- [ ] `mobil-desktop` audit (3-panel layout → mobil kolaps na side-sheet)

### - [ ] 6.2 Zprávy ve světovém chatu

*Plný feature set zprávy. Reuse z fáze 4 + dostavba featur, které měl jen starý Matrix. BE endpointy `worlds/:worldId/chat/channels/:id/messages`.*

- [ ] **6.2a — Reply / reakce / whisper:** reuse z fáze 4 — citace zprávy, emoji reakce (`chat:reaction:toggle`), whisper s `visibleTo` filtrem (PJ/Pomocný PJ vidí všechny šepoty)
- [ ] **6.2b — Přílohy:** obrázky + dokumenty, reuse `MessageAttachments` / `useUploadAttachment`; **ověřit / dostavět BE upload endpoint** pro world chat (folder odlišný od `global-chat/`)
- [ ] **6.2c — Editace zpráv:** inline edit vlastní zprávy (`PATCH .../messages/:id`), příznak `isEdited`; dice zprávy needitovatelné
- [ ] **6.2d — RP datum:** volitelný výběr in-game data (`rpDate`) u zprávy — propojení s kalendářem světa (fáze 9.2); zobrazení u zprávy
- [ ] **6.2e — NPC mód:** PJ/Admin píše pod `overrideName`/`overrideAvatarUrl`; v 6.2 free-text identita, výběr z adresáře postav se zpřesní ve fázi 8
- [ ] **6.2f — Barva textu + vlastní font:** `color` a `customFont` per zpráva (z profilu uživatele), kontrast guard vůči pozadí kanálu/světa
- [ ] **6.2g — Custom emote rendering:** `:shortcode:` → emoji/obrázek; statická sada z fáze 4 + per-svět emotes z kroku 6.4

### - [ ] 6.3 Dice roll

*Hod kostkou v chatu. BE detekuje `isDiceRoll` regexem nad obsahem; samotný hod generuje FE. Reference: starý Matrix `src/utils/diceHelpers.ts`.*

- [ ] Dice picker v composeru, nabídka kostek dle `World.dice` (krok 5.3a)
- [ ] Roll engine — Fate (4dF), generic pool (XdN), mixed; textová reprezentace zprávy (`Hod Kostkou (3d6): [2,4,1] = +7`)
- [ ] Rendering hodu — barevné kostky/tváře (kladná/záporná/nula), zvýrazněný součet
- [ ] Pool prompt — modal pro počet kostek u `pool-*` typů
- [ ] Smazání dice zpráv jen PJ/Admin (BE už hlídá), dice zprávy se nepočítají do unread

### - [ ] 6.4 Custom emotes (per-svět)

*Per-svět `:shortcode:` emotes — vlastní obrázkové emotikony světa. Přesunuto z fáze 13.4. Reference: starý Matrix `CustomEmote` + `WorldEmotesAdmin`.*

- [ ] Ověřit / dostavět BE — modul pro `CustomEmote` (`worldId`, `name`, `shortcode`, `imageUrl`) + CRUD endpointy
- [ ] Správa emotes (PJ) — upload obrázku, shortcode, mazání
- [ ] Načtení emote sady světa do chatu, rendering v `MessageItem` (napojení 6.2g)

### - [ ] 6.5 Správa kanálů a skupin (PJ)

*PJ/Pomocný PJ UI nad CRUD endpointy `chat` modulu. Reference: starý Matrix `ChatGroupManager`.*

- [ ] Vytvoření / editace / mazání skupin a kanálů
- [ ] Nastavení kanálu — `accessMode` (`all`/`roles`/`members`), `allowedRoles`, `allowedMemberIds`, pořadí (`order`)
- [ ] Reorder skupin a kanálů (drag-drop), ikona/barva skupiny
- [ ] `mobil-desktop` audit, `napoveda` aktualizace (nová stránka Chat světa + role/oprávnění)

---

**Závislosti / návaznosti:**
- 6.2d RP datum → plné propojení s kalendářem světa až **fáze 9.2**.
- 6.2e NPC mód → výběr identity z adresáře postav až **fáze 8**.
- 6.3 dice picker čte `World.dice` → závisí na **5.3a** (editace světa).
- 6.2b (upload endpoint) a 6.4 (modul custom emotes) mohou vyžadovat zásah do **BE repa** — ověřit ve spec.

**Mimo rozsah (nebylo ani ve starém Matrixu):**
- Fulltextové hledání ve zprávách → fáze 13.1.
- Threads / hierarchické reply, message pinning → mimo MVP.

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

### - [ ] 7.1 Page viewer (`/svet/:worldId/:slug`)

*Nahrazuje stub `PageViewerPage`. Catch-all routa — musí zůstat poslední v dětech `/svet/:worldSlug`.*

- [ ] **7.1a — Render obsahu:** TipTap HTML read-only (reuse `RichTextEditor` v `readOnly` módu), `AutoTOC` (obsah z `<h2>`/`<h3>`)
- [ ] **7.1b — Typové layouty:** odlišný layout dle `type` — Noviny (titulek + metadata), Galerie (`galleryImages`), Rodokmen (strom), Seznam, Lokace, Ostatní; boční panel = hero obrázek + datová tabulka
- [ ] **7.1c — Přístup:** interpretace `accessRequirements` (`UserId`/`AKJ`/`Role`/`AKJType`) — skrytí / 403; AKJ banner stylizovaný dle světa
- [ ] **7.1d — Navigace:** breadcrumbs, oblíbené (hvězdička → `favorite` endpoint), odkazy mezi stránkami + detekce broken-linku

### - [ ] 7.2 Page editor (`/nova-stranka`, `/edit/:slug`)

*Nahrazuje stub `PageEditorPage`. Reuse `RichTextEditor` + panely.*

- [ ] **7.2a — Rich-text editor:** reuse `RichTextEditor` + `RTEToolbar`; vkládání obrázků přes `useUploadContentImage` (`POST /upload/content-image`); nadpisy, seznamy, odkazy, tabulky
- [ ] **7.2b — Identita stránky:** `title`, `type` (7 typů), kategorie/`menu`, hero obrázek + `bigImage`, slug (auto z titulku)
- [ ] **7.2c — Datové šablony:** rozšiřitelná sada šablon (Stát, Město, Noviny, Projekty…) → vyplní `table` (hlavičky/hodnoty); systém config-driven, snadno doplnitelný o nové šablony
- [ ] **7.2d — Sekce:** přidávání / mazání / řazení collapsible sekcí (`sections`)
- [ ] **7.2e — Přístupová práva:** UI pro `accessRequirements` — whitelist uživatelů, **min. AKJ úroveň** (úrovně pojmenované PJ v kroku 5.3d), role ve světě; řídí, kteří hráči stránku uvidí
- [ ] **7.2f — Auto-save draftu:** `useDraftAutoSave` (localStorage debounce), obnova rozepsaného

### - [ ] 7.3 Index stránek (`/svet/:worldId/stranky`)

*Nahrazuje stub `PagesListPage`. Member-facing přehled encyklopedie světa.*

- [ ] Seznam stránek (`GET .../pages/directory` — lightweight), filtr dle typu, hledání
- [ ] Oblíbené stránky uživatele, prokliky na viewer
- [ ] `mobil-desktop` audit

### - [ ] 7.4 Správa stránek (`/svet/:worldId/admin/stranky`)

*Nahrazuje stub `PagesAdminPage`. PJ/Pomocný PJ.*

- [ ] Přehled všech stránek světa, řazení (`order`), poslední editované
- [ ] Vytvoření / mazání stránek, hromadné akce
- [ ] `mobil-desktop` audit, `napoveda` aktualizace (nová stránka Wiki + role/oprávnění)

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

### - [ ] 8.1 Detail postavy (`/svet/:worldId/postava/:slug`)

*Character sheet — bio + 5 subdokumentů v tabech. Reuse `RichTextEditor`.*

- [ ] **8.1a — Hlavička + bio:** avatar, `publicBio` + `publicInfoBlocks`; `privateBio` + `privateInfoBlocks` jen PJ/vlastník; přístup dle `accessRequirements` (AKJ / role / whitelist)
- [ ] **8.1b — Deník:** sekce (`sections`), dynamické fieldy dle schématu deníku, `RichTextEditor` pro zápisy; `GET/PATCH .../diary`
- [ ] **8.1c — Finance:** zůstatek, měsíční příjmy (`entries`), historie transakcí, „zaúčtovat měsíc" + undo; `.../finance` + `add-monthly` + `undo`
- [ ] **8.1d — Výbava:** inventář v sekcích s položkami (text / množství / poznámka); `GET/PATCH .../inventory`
- [ ] **8.1e — Poznámky:** soukromé poznámky postavy; `GET/PATCH .../notes`
- [ ] **8.1f — Kalendář postavy:** náhled / odkaz; plný kalendář = fáze 9.2; `GET/PUT .../calendar`
- [ ] **8.1g — Extra volné bloky:** `extraBlocks` (volné schema bloky nad rámec šablony)

### - [ ] 8.2 Tvorba postavy + kaskáda

*Vznik postavy spustí BE kaskádu subdokumentů. Společné pro PC / NPC / location-entitu.*

- [ ] Formulář vytvoření — jméno, typ (PC / NPC / Lokace), avatar, bio; `POST .../characters`
- [ ] Po vytvoření se automaticky založí přidružené subdokumenty (BE event) — FE je jen zobrazí
- [ ] Convert PC ↔ NPC — `PATCH .../convert`; ošetřit skrytí/odkrytí financí + výbavy
- [ ] Přiřazení postavy hráči — `PATCH .../members/:id/character` (`characterPath`); kdo smí tvořit (PJ; PC příp. přes žádost hráče)
- [ ] Mazání postavy (PJ)

### - [ ] 8.3 Adresář postav (`/svet/:worldId/postavy`) + vlastní postava (`/moje-postava`)

*Member-facing přehled. Nahrazuje stuby `CharactersPage` + `MyCharacterPage`.*

- [ ] Adresář — `GET .../characters/directory`, seskupení (PC / NPC / Lokace), hledání, prokliky na detail
- [ ] Vlastní postava — `/moje-postava` redirect na postavu z `membership.characterPath`; fallback „zatím nemáš postavu"
- [ ] Slot postavy ve `WorldContext` (dotahuje krok 5.1)
- [ ] `mobil-desktop` audit

### - [ ] 8.4 NPC šablony + bestiář (`/svet/:worldId/admin/adresar-postav`)

*PJ správa. Nahrazuje stub `NPCDirectoryPage`.*

- [ ] Správa `npc-templates` — CRUD (jméno, obrázek, `maxHp`, `armor`, `injury`, `movement`, `initiativeBase`, `abilities`, poznámky)
- [ ] Globální bestiář — `GET .../npc-templates/global`, import šablony do světa (`POST .../:id/import`)
- [ ] Vytvoření NPC z šablony
- [ ] `mobil-desktop` audit

### - [ ] 8.5 Dynamické šablony deníku (diary schema)

*„Nové šablony" — rozšiřitelný systém polí postavy dle herního systému.*

- [ ] Editor schématu deníku světa — bloky (stat / bar / list / text), pořadí, layout; ukládá novou verzi `diary-schema-versions`
- [ ] Verzování — `GET /worlds/:id/diary-schema-versions` (meta + detail), starší verze archivované
- [ ] Per-postava override — `personalDiarySchema` na deníku postavy
- [ ] `napoveda` aktualizace (stránky Postavy + sekce Role & oprávnění)

---

**Závislosti / návaznosti:**
- 8.1f kalendář postavy → plný kalendář **fáze 9.2**.
- Slot postavy ve `WorldContext` — dotahuje krok **5.1**.
- Wiki stránka typu `Lokace` (lore) = krok **7**; location-entita s kalendářem = krok 8.

**Mimo rozsah / k ověření ve spec:**
- Soft-delete postav — BE má jen fyzický `DELETE` → příp. dodělat.
- Runtime validace `accessRequirements` na postavě — BE má strukturu, evaluaci ověřit.
- Ověřit podmínku kaskády — location-entita by měla dostat jen kalendář + deník + poznámky (ne finance/výbavu); příp. úprava BE.
- Postavy na mapě (`MapToken`, instance NPC) → fáze 10 (mapy).

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

### - [ ] 9.1 Game Events (`/svet/:worldId/sprava-udalosti`)

*BE `game-events` kompletní. Reuse `IkarosEventCard`/`Modal`.*

- [ ] **9.1a — Seznam událostí:** nadcházející / proběhlé, karta události (reuse adaptovaného `IkarosEventCard`) — `GET /game-events?worldId=`
- [ ] **9.1b — RSVP:** potvrzení / odhlášení účasti — `POST /game-events/:id/confirm`
- [ ] **9.1c — Skupinová viditelnost:** `targetGroup` + `groupOnly` — událost vidí jen daná skupina hráčů; barvy skupin
- [ ] **9.1d — Komentáře:** vláknové komentáře (reply `parentId`), emoji reakce, editace, soft-delete — `.../comments*`
- [ ] **9.1e — Správa (PomocnyPJ+):** vytvoření / editace / mazání události, upload obrázku
- [ ] `mobil-desktop` audit

### - [ ] 9.2 Kalendář (`/svet/:worldId/kalendar`)

*BE `world-calendar-config` (fantasy kalendář) + `calendars` (agregace per-postava) + `character-calendar` subdoc. Reuse `calendarGrid`.*

- [ ] **9.2a — Měsíční pohled:** fantasy kalendář — vlastní měsíce / dny v týdnu / `hoursPerDay` dle `world-calendar-config`; `buildMonthGrid` zobecnit z gregoriánského na fantasy
- [ ] **9.2b — Per-postava kalendáře:** události postav, agregovaný PJ pohled na všechny (`GET .../calendars/aggregate`), barvy per kalendář
- [ ] **9.2c — Nebeská tělesa:** fáze měsíce / slunce / planety / komety dle config
- [ ] **9.2d — Nastavení kalendáře (PJ):** fantasy config (měsíce, dny, tělesa, `referenceDate`) — `PUT /worlds/:worldId/calendar-config`
- [ ] Napojení na 8.1f (kalendář postavy); `mobil-desktop` audit

### - [ ] 9.3 Timeline (`/svet/:worldId/timeline`)

*BE `timeline` kompletní. Reference: starý Matrix vertikální osa.*

- [ ] **9.3a — Historická osa:** vertikální timeline, fantasy datum (rok/měsíc/den/hodina), filtr dle roku, hledání, lightbox obrázků, odkazy na wiki stránky
- [ ] **9.3b — Správa (PomocnyPJ+):** přidávání / editace / mazání událostí osy
- [ ] **9.3c — Celestial overrides:** ruční stav nebeských těles pro daný den (`celestialOverrides`)
- [ ] `mobil-desktop` audit

### - [ ] 9.4 Počasí (`/svet/:worldId/pocasi`)

*BE `world-weather` kompletní — generátory, generování, broadcast (WS).*

- [ ] **9.4a — Aktuální počasí:** zobrazení (teplota, oblačnost, srážky, vítr, tlak, vlhkost, narrative text)
- [ ] **9.4b — Generátory (PJ):** správa generátorů (config), vygenerování počasí, ruční nastavení
- [ ] **9.4c — Broadcast:** rozeslání počasí do chatu / na mapu — `POST .../broadcast` (BE už emituje `weather.updated`)
- [ ] `mobil-desktop` audit

### - [ ] 9.5 Světové novinky (`/svet/:worldId/novinky`)

*BE `world-news` kompletní. Reuse `NewsCard` + `NovinkyPage` pattern z 3.1b.*

- [ ] **9.5a — Stránka novinek světa:** seznam (`GET /news?worldId=`), rozbalovací karty
- [ ] **9.5b — Sekce v dashboardu světa:** napojení na krok 5.2 (novinky světa na dashboardu)
- [ ] **9.5c — Správa (PomocnyPJ+):** vytvoření / editace / mazání novinky
- [ ] `mobil-desktop` audit, `napoveda` aktualizace (herní nástroje + role/oprávnění)

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

- [ ] **10.2a — Rendering jádro + výkonová kostra:** PixiJS/WebGL plátno, oddělené vrstvy (pozadí / grid / efekty / tokeny / fog / ping), viewport culling, dirty-flag + RAF překreslení, pan (myš/touch) + zoom (pinch/wheel) s persistencí. *Toto je základ, na kterém stojí 10.2b–m.*
- [ ] **10.2b — Hex mřížka:** axiální q/r, `HexUtils` (axial↔pixel, sousedé, radius, snap-to-grid); grid jako jeden draw (dlaždicová textura), ne N polygonů
- [ ] **10.2c — Scény (`MapScene`):** načtení aktivní / konkrétní scény, pozadí mapy, přepínání, debounced uložení; stavy `isActive` / `isHidden` / `isLocked`
- [ ] **10.2d — Tokeny:** PC i NPC tokeny, drag&drop na hex, pozice q/r, vizuál (avatar ze sprite atlasu, ring, výběr); NPC instancované z `npc-templates` (krok 8.4); optimistický lokální pohyb
- [ ] **10.2e — Staty tokenu:** HP / maxHP, zbroj, zranění, `currentHp`; HP bar barevně dle stavu; obousměrný sync se staty postavy (krok 8)
- [ ] **10.2f — Iniciativa:** tracker pořadí tahů, řazení dle iniciativy, indikace „koho je tah", `InitiativeInput`
- [ ] **10.2g — Efekty:** `color` zóny / `barrier` (DC, kruh nebo brush) / `explosion` (soustředné rings, damage, variant fire / gas / smoke); paleta nástrojů
- [ ] **10.2h — Fog of war:** mlha + odhalování (brush reveal / fog) jako render-texture maska (ne per-hex polygony), tokeny PC vždy viditelné, odlišný pohled PJ vs hráč
- [ ] **10.2i — Real-time sync:** `MapsGateway` WS (`token-moved`, `config-updated`, `effect-added/removed`, `fog-updated`, `ping`, `scene-state-changed`, `sound-changed`); throttling + coalescing odchozích eventů, reconnect + catch-up
- [ ] **10.2j — Hod kostkou:** kostky na mapě, sdílený dice engine s krokem 6.3, 3D overlay (lazy-load `three`), broadcast výsledku (`map:dice-rolled`)
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
- **Počasí (krok 9.4)** — BE už emituje `weather.updated` → `weather:updated` na mapě.
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

### - [ ] 11.4 Měny a převodník (`/svet/:worldId/prevodnik-men`)

*Měny světa + konverze. BE modul `world-currencies`.*

- [ ] **11.4a — Správa měn (PJ):** CRUD měn světa (`code` / `name` / `symbol` / `rate`); první měna = základ (rate 1.0), kurz dalších relativně; genre-seed při vzniku světa — **přesunuto z 12.2 `/admin/meny`**
- [ ] **11.4b — Převodník:** konverze mezi měnami světa — `POST /worlds/:worldId/currencies/convert`; pro hráče i jako zdroj cen pro shop (11.3c)
- [ ] **11.4c — `mobil-desktop` audit, `napoveda`** (kampaňové nástroje + role/oprávnění)

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
