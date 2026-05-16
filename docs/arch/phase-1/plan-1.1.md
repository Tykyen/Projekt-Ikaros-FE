# Implementační plán 1.1 — Login

**Datum:** 2026-05-07
**Spec:** `docs/arch/phase-1/spec-1.1.md`
**Status:** ✅ Implementováno

---

## Strategie

**Pořadí:** BE → FE. Důvod: FE potřebuje funkční BE endpoint s `identifier` polem; bez toho by FE testy padaly nebo by se musely mockovat víc, než je zdravé.

**Commit strategy:** menší PR commity v rámci jedné větve `feat/krok-1.1-login`. Každá fáze (níže) = ideálně 1-2 commity. Po každé fázi build + test + lint zelený.

**Verifikace cizích assumptions:**
- Před BE změnou ověřit existenci `UsersService.findByUsername` (pokud chybí → doplnit jako součást fáze 0)
- Před FE změnou projít BE auth guards na public endpointech (D-008 z specu)
- Před úpravou modalu zkontrolovat, že `<Modal>` komponenta podporuje focus trap + Esc + backdrop

---

## Fáze 0 — Pre-flight (max 30 min)

Žádné kódové změny — jen průzkum a potvrzení assumptions ze specu.

- [ ] **BE-0.1** Otevřít `backend/src/modules/users/users.service.ts` a ověřit, že existuje `findByEmail` (víme že ano) a `findByUsername`. Pokud neexistuje, identifikovat shape data layeru.
- [ ] **BE-0.2** Projít controllery `ikaros-articles`, `ikaros-gallery`, `ikaros-discussions`, `ikaros-news`, `worlds` — kde mají `@UseGuards(JwtAuthGuard)` na `GET` endpointech. Vytvořit přehled "co je veřejné, co ne". Pokud něco vyžaduje auth nezdravě, otevřít D-008.
- [ ] **FE-0.1** Otevřít `src/components/ui/Modal/Modal.tsx` + `Modal.module.css` — ověřit:
  - Esc close
  - backdrop click close
  - focus trap (asi nemá — pravděpodobně doplním)
  - aria-modal, aria-labelledby
- [ ] **FE-0.2** `npm i @hookform/resolvers` (potřeba pro zod resolver v LoginModal)

**Výstup fáze 0:** krátký report v chatu uživateli — zjištění z BE-0.2 + jaký bude rozsah Modal patche.

---

## Fáze 1 — Backend (login by identifier)

**Větev:** `feat/krok-1.1-login` v BE repo (`C:\Matrix\ProjektIkaros\Projekt-ikaros`).

### 1.1 LoginDto změna
- [ ] `backend/src/modules/auth/dto/login.dto.ts`
  - Přejmenovat pole `email` → `identifier`
  - Validace: `@IsString() @MinLength(1) @MaxLength(255)`
  - Odstranit `@IsEmail()` (logika rozhodnutí v service)
  - `password`: ponechat `@IsString() @MinLength(6)` — ale pro **login** snížit min na 1 (nezveřejňujeme constraint)
    - **Pozn.:** Spec říká min(1) na loginu. Soulad — ano.
  - `@ApiProperty()` popis: "E-mail nebo přezdívka uživatele"

### 1.2 AuthService.login update
- [ ] `backend/src/modules/auth/auth.service.ts`
  - Změnit signature `login(dto: LoginDto)` aby četla `dto.identifier` místo `dto.email`
  - Logika lookup:
    ```ts
    const user = dto.identifier.includes('@')
      ? await this.usersService.findByEmail(dto.identifier)
      : await this.usersService.findByUsername(dto.identifier);
    ```
  - Pokud `findByUsername` neexistuje, doplnit do `UsersService` (`backend/src/modules/users/users.service.ts`):
    ```ts
    findByUsername(username: string) {
      return this.userModel.findOne({ where: { username } });
    }
    ```
  - **Důležité:** generická chybová zpráva `UnauthorizedException('Neplatné přihlašovací údaje')` — neprozradit, jestli existuje email vs username.

### 1.3 RegisterDto — username constraint
- [ ] `backend/src/modules/auth/dto/register.dto.ts`
  - Přidat `@Matches(/^[^@]+$/, { message: 'Přezdívka nesmí obsahovat @' })` na `username`
  - Ponechat existující validace (min/max length)

### 1.4 BE testy
- [ ] `backend/src/modules/auth/auth.service.spec.ts`
  - Update existujících testů (`email` → `identifier`)
  - Nový case: `login by username (no @)` — mock `findByUsername`
  - Nový case: `login by email (with @)` — mock `findByEmail`
  - Nový case: `user not found by username → 401`
- [ ] `backend/src/modules/auth/dto/register.dto.spec.ts` (vytvořit pokud neexistuje)
  - Username s `@` → validation chyba
  - Username bez `@` → OK
- [ ] `backend/test/auth.e2e-spec.ts` nebo `auth-throttle.e2e-spec.ts`
  - Update payloadu z `{ email }` na `{ identifier }`
  - Nový E2E case: registrace → login by username → 200

### 1.5 BE manuální verifikace
- [ ] `npm run start:dev` v BE
- [ ] curl test:
  ```
  POST /api/auth/login { identifier: "test@test.com", password: "..." } → 200
  POST /api/auth/login { identifier: "username", password: "..." } → 200
  POST /api/auth/login { identifier: "neexistuje", password: "..." } → 401
  POST /api/auth/login { identifier: "", password: "..." } → 400
  ```
- [ ] Swagger `/api/docs` ukazuje LoginDto.identifier

### 1.6 Commit + PR
- [ ] Commit: `feat(auth): login by email or username (BE)`
- [ ] **Pause:** než pokračuji na FE, dotaz uživateli — chce BE PR otevřít hned, nebo počkat až bude FE hotový a otevřít oboje najednou?

---

## Fáze 2 — Frontend infrastruktura (atomy, hooky, utils)

**Větev:** `feat/krok-1.1-login` v FE repo.

### 2.1 Typy
- [ ] `src/types/index.ts`
  - `LoginRequest`: pole `email` → `identifier`
  - `AuthResponse.user`: `Omit<User, 'passwordHash'>` → jen `User` (cleanup D-007)

### 2.2 currentUserAtom — persistence
- [ ] `src/store/authStore.ts`
  - `currentUserAtom: atom<User | null>(null)` → `atomWithStorage<User | null>('ikaros.user', null)`
  - Přidat `pendingLogoutAtom: atom<{ startedAt: number; timer: number } | null>(null)`
  - Update `isAuthenticatedAtom` aby vracel `false` když je pending logout:
    ```ts
    export const isAuthenticatedAtom = atom((get) =>
      get(accessTokenAtom) !== null && get(pendingLogoutAtom) === null
    );
    ```
  - Přidat `loginModalOpenAtom: atom<boolean>(false)`

### 2.3 JWT decode utility
- [ ] `src/utils/jwt.ts` (nový soubor)
  ```ts
  export function decodeJwt<T>(token: string): T | null { ... }
  export function isJwtExpired(token: string): boolean { ... }
  ```
- [ ] `src/utils/jwt.spec.ts` — 4 cases: valid, expired, malformed, empty

### 2.4 useAuth hook
- [ ] `src/api/hooks/useAuth.ts` (nový)
  - `useLogin()` — TanStack `useMutation`, onSuccess zapíše tokeny + user do store
  - `useLogout()` — 5s undo timer logika:
    - Set `pendingLogoutAtom`
    - `setTimeout(5000)` → BE call + clear atoms
    - Vrátit `cancelLogout()` funkci pro "Vrátit"
  - `useAuthBootstrap()` — `useEffect` při mount, hydratuje currentUserAtom z JWT pokud token je a user není

### 2.5 Tests
- [ ] `src/api/hooks/useAuth.spec.ts`
  - useLogin happy path
  - useLogout 5s timer + undo

---

## Fáze 3 — Frontend Login modal

### 3.1 Schema
- [ ] `src/components/auth/loginSchema.ts` (nová složka)
  ```ts
  export const loginSchema = z.object({
    identifier: z.string().min(1, 'Zadej e-mail nebo přezdívku'),
    password: z.string().min(1, 'Zadej heslo'),
  });
  export type LoginFormValues = z.infer<typeof loginSchema>;
  ```
- [ ] `src/components/auth/loginSchema.spec.ts` — 4 cases

### 3.2 LoginModal komponenta
- [ ] `src/components/auth/LoginModal.tsx`
  - Ovládá se přes `loginModalOpenAtom`
  - RHF + zod resolver, mode `onBlur`, reValidate `onChange`
  - Pole: identifier (autoFocus, autoCapitalize="none", autoComplete="username")
  - Pole: password (autoComplete="current-password") + show/hide toggle (oko ikona)
  - Submit button (loading při pending)
  - Error banner (mezi posledním fieldem a submitem):
    - 401 / network / 429 / 5xx mapping (via `parseApiError` + status code)
  - onSuccess:
    - `setLoginModalOpen(false)`
    - `sessionStorage.getItem('ikaros.loginIntent')` → `navigate(intent)` + smazat
    - Sonner toast `Vítej zpět, ${přezdívka}!`
- [ ] `src/components/auth/LoginModal.module.css`
  - Per-theme background (`var(--bg-elevated)`)
  - 3D efekt na primary buttonu (z `decorations.css` nebo Button už má)
  - Glow border (per-theme)
- [ ] `src/components/auth/index.ts` — barrel export

### 3.3 Modal komponenta — patch (pokud chybí features)
**Závisí na výsledku FE-0.1:**
- [ ] Pokud `<Modal>` nemá focus trap → doplnit (`useFocusTrap` hook nebo lib)
- [ ] Pokud nemá Esc/backdrop → doplnit
- [ ] Pokud nemá aria-modal/labelledby → doplnit

### 3.4 Tests
- [ ] `src/components/auth/LoginModal.spec.tsx`
  - render + autoFocus
  - submit valid → atoms set, modal close
  - 401 → banner
  - 429 → banner
  - network → banner
  - password toggle
  - close (X / Esc / backdrop)
  - focus trap
- [ ] Storybook stories `src/components/auth/LoginModal.stories.tsx`
  - Idle, Loading, Error401, Error429, Network

---

## Fáze 4 — Frontend routing (per-route auth)

### 4.1 requireAuth loader
- [ ] `src/router.tsx`
  - Nová utilita `requireAuth({ request })` — viz spec §4.1
  - Smaže `authLoader` na root IkarosLayout
  - Aplikuje `requireAuth` na chráněné child routes:
    - `ikaros/posta`, `ikaros/profil`, `ikaros/vytvorit-svet`
    - `ikaros/uzivatele`, `ikaros/uzivatel/:id` (1.4 stub, ale gate ano)
    - `chat`, `admin/*`
  - Veřejné child routes ZŮSTANOU bez loaderu:
    - index (DashboardPage)
    - `ikaros/clanky`, `ikaros/galerie`, `ikaros/diskuze`, `ikaros/diskuze/nova`, `ikaros/napoveda`, `ikaros/vesmiry`
  - **Pozn.:** `ikaros/diskuze/nova` přes `requireAuth`? — Pravděpodobně ano (nelze tvořit bez auth). Ano, dá se na chráněné.
  - Smazat routy `/login` a `/register` (z root array)
  - Smazat import `AuthLayout`, `LoginPage`, `RegisterPage` z router.tsx

### 4.2 World routes
- [ ] `/svet/:worldId/*` — zatím nechám `loader=authLoader` (přejmenuju na `requireAuth`). Veřejnost světů řeší fáze 5+.

### 4.3 Cleanup
- [ ] Smazat `src/pages/auth/LoginPage.tsx`
- [ ] **Ne smazat** `RegisterPage.tsx` — 1.2 ho použije nebo smaže
- [ ] **Ne smazat** `AuthLayout` — 1.2 ho dořeší
- [ ] Export `authLoader` v router.tsx přejmenovat na `requireAuth` (pokud někde dál used → zkontrolovat)

### 4.4 DashboardPage — auto-open modal
- [ ] `src/pages/ikaros/DashboardPage.tsx`
  - `useEffect`: pokud `searchParams.get('openLogin') === '1'` && nejsem authenticated → `setLoginModalOpen(true)`, smazat query param via `setSearchParams({})` (replace)

---

## Fáze 5 — Frontend IkarosLayout (logged-out / logged-in)

### 5.1 Refactor IkarosLayout.tsx
- [ ] `src/components/layout/IkarosLayout/IkarosLayout.tsx`
  - Číst `isAuthenticatedAtom` (případně `currentUserAtom`)
  - **Hlavička:**
    - Logo (vždy)
    - ThemeSwitcher (vždy)
    - **Logged-out:**
      - `<Button onClick={openLoginModal}>Přihlásit se</Button>`
      - `<Button disabled title="Připravujeme">Registrace</Button>`
    - **Logged-in:**
      - POŠTA NavLink + badge (jak je teď)
      - PŘÁTELÉ (běžný uživatel) / UŽIVATELÉ (admin/superadmin) — placeholder s toastem
      - `<UserAvatar>` (přejmenuju link `/ikaros/profil` na placeholder onClick toast — `navigate` zatím nemá kam smysluplně)
        - **POZN.:** `/ikaros/profil` route teď v routeru EXISTUJE (chráněná, stub komponenta). Můžeme nechat klik na přezdívku → `navigate('/ikaros/profil')` → otevře se 1.3 stub. Bez toastu. Lepší než toast — funkční navigace na stub.
        - Update specu nepotřeba, bere se to jako "klik funguje, jen content stub" — což je pravda i teď.
      - ODHLÁSIT button — viz `useLogout` hook
  - **Sidebar:**
    - PRIMARY_NAV pro logged-out: bez `Vytvořit svět`
    - Sekce VESMÍRY:
      - Logged-in: `useMyWorlds`
      - Logged-out: `usePublicWorlds` (viz §5.2)
    - Sekce CHAT: jen pro logged-in
  - **Pravý sloupec (`<RightPanel>`):**
    - Render jen pro logged-in
- [ ] `src/components/layout/IkarosLayout/IkarosLayout.module.css`
  - Případné drobné úpravy gridu když chybí `<aside.rightPanel>`
- [ ] Připojit `<LoginModal />` do shellu (ať existuje globálně) — buď v IkarosLayout, nebo v `main.tsx` u Toaster

### 5.2 usePublicWorlds hook
- [ ] `src/api/hooks/useWorlds.ts`
  - Přidat `usePublicWorlds()` — `GET /api/worlds?public=true` (nebo bez params, závisí na BE z BE-0.2)
  - **Závislost:** pokud BE neumí filtr nebo vyžaduje auth → otevřít D-008 a v 1.1 sidebar pro logged-out skrýt sekci VESMÍRY (jen "Přihlaš se pro zobrazení"). Spec sekce 6.1 to akceptuje jako otevřený bod.

### 5.3 Tests
- [ ] `src/components/layout/IkarosLayout/IkarosLayout.spec.tsx`
  - logged-out render: bez right panel, bez Vytvořit svět, bez Chat, hlavička s Přihlásit/Registrace
  - logged-in render: kompletní layout
- [ ] Storybook story `IkarosLayout/LoggedOut`, `IkarosLayout/LoggedIn`

---

## Fáze 6 — Logout flow + AuthBootstrap

### 6.1 AuthBootstrap komponenta
- [ ] `src/components/auth/AuthBootstrap.tsx`
  - Volá `useAuthBootstrap()` při mountu
  - Žádné rendering — vrací `null`
- [ ] Přidat do `main.tsx` před `<RouterProvider>`

### 6.2 Logout button + toast
- [ ] V IkarosLayout hlavičce:
  - `const { logout, cancelLogout } = useLogout()` — nebo nějaký podobný API
  - Klik na ODHLÁSIT:
    ```ts
    const cancel = logout();  // start 5s timer, vrátí cancel funkci
    toast('Odhlášeno', {
      duration: 5000,
      action: { label: 'Vrátit', onClick: cancel },
    });
    ```
  - Po vypršení timeru: `useLogout` interně volá BE `/auth/logout` + clearuje atomy.

### 6.3 Tests
- [ ] `useAuth.spec.ts` doplnit:
  - logout 5s flow (fake timers via vitest)
  - logout cancel flow

---

## Fáze 7 — Cleanup + finální verifikace

### 7.1 Code quality
- [ ] `npm run lint` zelený
- [ ] `npm run lint:colors` zelený
- [ ] `npm run audit:contrast` zelený (mělo by být — žádné nové themes)
- [ ] `tsc -b` (`npm run build`) bez chyb
- [ ] `npm run test:run` zelený
- [ ] `npm run build-storybook` projde

### 7.2 Manuální FE verifikace
- [ ] BE běží lokálně
- [ ] FE `npm run dev`
- [ ] Otevřít `localhost:5173` (incognito) → vidím úvodník bez redirectu
- [ ] Hlavička: PŘIHLÁSIT SE, REGISTRACE-disabled, theme switcher
- [ ] Sidebar: bez Vytvořit svět, bez CHAT
- [ ] Pravý sloupec: skrytý
- [ ] Klik PŘIHLÁSIT SE → modal se otevře
- [ ] Esc → modal zavřený
- [ ] Submit prázdný → zod chyby
- [ ] Submit neplatné údaje → 401 banner
- [ ] Submit 6× rychle → 429 banner
- [ ] Vypnout BE → submit → network banner
- [ ] Submit platný (e-mailem) → modal zmizí, hlavička se přepne
- [ ] Refresh F5 → stále přihlášený, hlavička ukazuje přezdívku
- [ ] Klik ODHLÁSIT → toast s "Vrátit"
- [ ] Klik "Vrátit" → hlavička obživne
- [ ] Klik ODHLÁSIT, počkat 6s → odhlášeno
- [ ] Otevřít přímo `/ikaros/posta` (anon) → redirect / + modal
- [ ] Po loginu z deep linku → naviguje na `/ikaros/posta`
- [ ] Login přezdívkou → funguje

### 7.3 Mobile verifikace (`mobil-desktop` skill)
- [ ] Spustit `mobil-desktop` skill — projde modal, hlavičku, layout

### 7.4 Commit & PR
- [ ] Commit FE: `feat(auth): login modal + public IkarosLayout (krok 1.1)`
- [ ] PR review (uživatelská)
- [ ] Po merge: označit 1.1 v `roadmap-fe.md` jako ✅ s krátkým shrnutím

### 7.5 Dluhy update
- [ ] V `dluhy.md` přidat D-005, D-006, D-007 (pokud neresolved), D-008 (pokud relevantní)

---

## Časový odhad

| Fáze | Odhad |
|---|---|
| 0 — Pre-flight | 30 min |
| 1 — BE | 2-3 h (vč. testů) |
| 2 — FE infra | 1.5 h |
| 3 — LoginModal | 2.5 h (vč. testů + stories) |
| 4 — Routing | 1 h |
| 5 — IkarosLayout refactor | 2 h |
| 6 — Logout + Bootstrap | 1.5 h |
| 7 — Cleanup + verifikace | 1.5 h |
| **Celkem** | **~12-13 h** |

---

## Rizika

1. **`<Modal>` neumí focus trap / Esc** — v takovém případě se z toho stane mini-refactor Modal komponenty. Akceptovatelné, není v kritické cestě.
2. **`UsersService.findByUsername` neexistuje** — drobné, doplníme za pár minut.
3. **BE veřejné endpointy mají `JwtAuthGuard`** — dluh D-008. V 1.1 fallback: skrýt sekce, kde data nelze získat (např. VESMÍRY pro logged-out).
4. **JWT payload neobsahuje všechny fields, které `User` typ vyžaduje** — JWT decode plní jen základní fields, zbytek prázdné. Pro 1.1 stačí. 1.3 dotáhne přes `/me`.
5. **Fáze 1 a Fáze 2-7 běží v různých repech** — uživateli musí být jasné, že před FE testem musí mít BE z `feat/krok-1.1-login` rebuildnutý a běžící.

---

## Otevřené body — finální dotazy

1. **Po dokončení BE Fáze 1 — chceš ode mne hned PR v BE repo, nebo počkat až bude FE hotový?** (Default: PR až po obou fázích.)
2. **Test runner v BE** — `npm test` v BE repo? Jiné? Pre-flight zjistím sám, ale pokud víš jiný command, řekni.
3. **Branch naming** — v obou repech `feat/krok-1.1-login`? OK?

Po schválení tohoto plánu spustím Fázi 0 (pre-flight) a budu se hlásit s reportem před Fází 1.
