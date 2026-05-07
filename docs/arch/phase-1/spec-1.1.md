# Spec 1.1 — Login

**Datum:** 2026-05-07
**Status:** ⏳ Čeká na schválení
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.1
**Závisí na:** 0.4 (auth infra) ✅, 1.0 (theme systém) ✅
**Blokuje:** 1.2 (Registrace), 1.3 (Profil), 1.4 (Adresář), 1.5 (Presence), 1.6 (Přátelé)

---

## 1. Cíl

Umožnit uživateli **přihlásit se do Ikaros platformy** přes modal v hlavičce (e-mailem nebo přezdívkou). Zároveň otevřít platformu **veřejně** — nepřihlášený uživatel si může prohlédnout úvodník, články, galerii, otevřené diskuze a nápovědu, aniž by byl gatován.

Tento krok kompletně mění architekturu auth gatingu (z global `authLoader` na per-route + modal flow) a definuje, jak vypadá hlavička pro logged-out i logged-in stav.

---

## 2. Rozsah

### 2.1 V rozsahu 1.1
- **BE**:
  - `LoginDto`: pole `identifier` (string, min 1) místo `email` — přijímá e-mail NEBO přezdívku
  - `AuthService.login()`: lookup uživatele podle `email` (pokud `identifier` obsahuje `@`) jinak podle `username`
  - `RegisterDto`: validace, že `username` neobsahuje `@`
  - **Bez** změny endpointu `/api/auth/refresh` a `/api/auth/logout` (zůstávají)
- **FE**:
  - Nový `LoginModal` (themed, 3D tlačítka, email/přezdívka + heslo + show/hide toggle)
  - Hlavička IkarosLayoutu přepracovaná — logged-out vs logged-in varianta
  - Logged-out IkarosLayout — viditelnost sekcí + role-aware navigace
  - `useAuth.ts` hook — `useLogin`, `useLogout` mutace
  - Logout flow s 5s "Vrátit" toastem (sonner)
  - JWT decode utility pro hydrataci `currentUserAtom`
  - `currentUserAtom` přejde na `atomWithStorage`
  - Per-route auth guard nahrazující global `authLoader` na chráněných routes — s memoizací deep-link cíle
  - `?openLogin=1` query trigger pro modal po redirectu z chráněné route
  - Smazání `/login`, `/register`, `LoginPage.tsx`, `RegisterPage.tsx`, `AuthLayout` (po 1.2 — viz pozn.)
  - Tests + Storybook stories

### 2.2 Mimo rozsah 1.1 (explicitně)
- Registrace — krok 1.2 (REGISTRACE tlačítko v 1.1 jen disabled placeholder)
- Profil + avatar — krok 1.3
- Adresář uživatelů — krok 1.4
- Presence — krok 1.5
- Přátelé — nová fáze 1.6 (PŘÁTELÉ link v 1.1 jen placeholder)
- Reset hesla — BE neumí, samostatný dluh (D-006, viz §10)
- POŠTA endpoint — krok 3.5 (link v 1.1 placeholder; `useUnreadCount` z 0.5 už existuje, ale data dorazí až s 3.5)

### 2.3 Pozn. k AuthLayoutu
`AuthLayout.tsx` zůstane v repo do 1.2 — pak ho 1.2 finálně odstraní spolu s `RegisterPage`. V 1.1 se z routeru pouze odstraní reference (kód souboru zůstane orphan, ale neimportovaný).

---

## 3. Backend změny

### 3.1 LoginDto
```ts
// backend/src/modules/auth/dto/login.dto.ts
import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1, { message: 'Zadej e-mail nebo přezdívku' })
  @MaxLength(255)
  identifier: string;     // e-mail (obsahuje @) NEBO username

  @IsString()
  @MinLength(1, { message: 'Zadej heslo' })
  password: string;       // POZN: bez min(6) na loginu — nezveřejňujeme constraint
}
```

**Breaking change:** API kontrakt mění pole `email` → `identifier`. FE klient (axios) i BE testy se musí upravit.

### 3.2 AuthService.login
```ts
async login(dto: LoginDto) {
  const isEmail = dto.identifier.includes('@');
  const user = isEmail
    ? await this.usersService.findByEmail(dto.identifier)
    : await this.usersService.findByUsername(dto.identifier);

  if (!user) throw new UnauthorizedException('Neplatné přihlašovací údaje');
  // ... zbytek beze změny (bcrypt compare, vystavit tokeny)
}
```

Pokud `findByUsername` neexistuje, doplníme do `UsersService` (případně `findOne({ where: { username } })`).

### 3.3 RegisterDto — username constraint
```ts
@Matches(/^[^@]+$/, { message: 'Přezdívka nesmí obsahovat @' })
@MinLength(3) @MaxLength(32)
username: string;
```

(Plus existující validace.) **Pozn.:** Existující uživatelé s `@` v username (pokud jsou) zůstanou — validace platí jen pro nové registrace. Migrace dat není potřeba.

### 3.4 BE testy
- `auth.controller.spec` / `auth.service.spec` — update existujících, doplnit case "login by username"
- `register.dto.spec` — case "username obsahuje @ → 400"
- E2E `auth.e2e-spec` — login by email + login by username

### 3.5 Swagger
`@ApiProperty()` v LoginDto popíše `identifier` jako "E-mail nebo přezdívka uživatele".

---

## 4. Frontend — architektonické změny

### 4.1 Routing — odstranění globálního authLoaderu

**Před:**
```
/  (IkarosLayout, loader=authLoader)  ← celá platforma za auth
  ├─ index → DashboardPage
  └─ ... všechny chráněné
```

**Po:**
```
/  (IkarosLayout, BEZ loaderu — public shell)
  ├─ index → DashboardPage (public — úvodník)
  ├─ ikaros/clanky    (public)
  ├─ ikaros/galerie   (public)
  ├─ ikaros/diskuze   (public — BE filtruje "open" diskuze pro anon)
  ├─ ikaros/napoveda  (public)
  ├─ ikaros/vesmiry   (public — viditelné jsou jen public worlds)
  ├─ ikaros/posta            (loader=requireAuth)
  ├─ ikaros/profil           (loader=requireAuth)
  ├─ ikaros/vytvorit-svet    (loader=requireAuth)
  ├─ ikaros/uzivatele        (loader=requireAuth + RoleGuard admin/superadmin)
  ├─ chat                    (loader=requireAuth)
  └─ admin/...               (loader=requireAuth + RoleGuard)
```

**Nová utilita** `requireAuth` loader:
```ts
export function requireAuth({ request }: LoaderFunctionArgs) {
  const token = readToken();
  if (!token) {
    const url = new URL(request.url);
    const target = url.pathname + url.search;  // např. /ikaros/posta
    sessionStorage.setItem('ikaros.loginIntent', target);
    return redirect('/?openLogin=1');
  }
  return null;
}
```

**Smaže se:**
- `/login`, `/register` routes (router.tsx)
- `authLoader` na root IkarosLayout

### 4.2 Login modal — komponenta

`src/components/auth/LoginModal.tsx` (nová složka `components/auth`):
- Open/close stav: Jotai atom `loginModalOpenAtom`
- Otevírání:
  - Klik na PŘIHLÁSIT SE v hlavičce → `setLoginModalOpen(true)`
  - Auto-otevření při načtení `?openLogin=1` (DashboardPage `useEffect`)
- Zavření: X + Esc + backdrop klik (existující `Modal` komponenta z `components/ui/Modal`)
- Po úspěchu:
  - Zápis tokenů + user do store
  - `setLoginModalOpen(false)`
  - Pokud `sessionStorage.getItem('ikaros.loginIntent')` → `navigate(intent)` + smazat klíč
  - Jinak zůstat na current page
  - Toast (sonner): "Vítej zpět, {přezdívka}!"

**Form (RHF + zod):**
```ts
// loginSchema.ts
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Zadej e-mail nebo přezdívku'),
  password: z.string().min(1, 'Zadej heslo'),
});
```

**RHF mode:** `onBlur` + revalidate `onChange` po prvním submitu.

**Pole:**
- Identifier: `<Input label="E-mail nebo přezdívka" autoComplete="username" autoCapitalize="none" autoFocus />`
- Password: `<Input label="Heslo" type={show ? 'text' : 'password'} autoComplete="current-password" />` + ikona oka napravo (toggle)
- Submit: `<Button variant="primary" loading={isPending} type="submit">Přihlásit se</Button>`

**Error banner** (mezi posledním fieldem a submit tlačítkem, `aria-live="polite"`):
- 401 → "Nesprávné přihlašovací údaje"
- 429 → "Příliš mnoho pokusů. Zkus to znovu za chvíli."
- network/0 → "Nepodařilo se připojit k serveru."
- 5xx → "Něco se pokazilo. Zkus to znovu."

### 4.3 IkarosLayout — conditional rendering

**Hlavička (logged-out):**
- Logo "Projekt Ikaros"
- ThemeSwitcher (existující)
- `<Button>PŘIHLÁSIT SE</Button>` → otevře modal
- `<Button disabled title="Připravujeme">REGISTRACE</Button>`

**Hlavička (logged-in):**
- Logo "Projekt Ikaros"
- ThemeSwitcher
- POŠTA (s badge `useUnreadCount`)
- PŘÁTELÉ — placeholder (klik = toast "Připravujeme") pro role Hrac, Korektor, Ctenar, …
- UŽIVATELÉ — pro role Admin, Superadmin (klik = `/ikaros/uzivatele`, ale ten je 1.4 → placeholder s toastem "Připravujeme")
- Přezdívka (klik = `/ikaros/profil`, ale ten je 1.3 → placeholder)
- ODHLÁSIT — viz §4.5

**Sidebar (logged-out):**
- Skryté: VYTVOŘIT SVĚT, sekce CHAT (Hospoda)
- Viditelné: ÚVODNÍK, VESMÍRY (s public worlds), DISKUZE, ČLÁNKY, GALERIE, NÁPOVĚDA
- VESMÍRY sekce v sidebaru: pro logged-out volá nový query `usePublicWorlds()` (viz §6.3)

**Sidebar (logged-in):** beze změny (jak je teď).

**Pravý sloupec (logged-out):** **úplně skryt** (žádné "Moje diskuze", "Moje světy").

**Pravý sloupec (logged-in):** beze změny.

### 4.4 useAuth hook — `src/api/hooks/useAuth.ts`

```ts
export function useLogin() {
  return useMutation({
    mutationFn: (dto: LoginRequest) =>
      api.post<AuthResponse>('/auth/login', dto),
    onSuccess: ({ accessToken, refreshToken, user }) => {
      const store = getDefaultStore();
      store.set(accessTokenAtom, accessToken);
      store.set(refreshTokenAtom, refreshToken);
      store.set(currentUserAtom, user);
    },
  });
}

export function useLogout() {
  // Implementace s 5s "Vrátit" — viz §4.5
}
```

`LoginRequest` typ se aktualizuje:
```ts
export interface LoginRequest {
  identifier: string;   // bylo: email
  password: string;
}
```

### 4.5 Logout flow s 5s undo

**State:** Jotai atom `pendingLogoutAtom: { startedAt: number; timer: number } | null`.

**Klik ODHLÁSIT:**
1. Set `pendingLogoutAtom = { startedAt: Date.now(), timer }` — timer 5000ms
2. Skryj UI logged-in (`isAuthenticatedAtom` derived → vrátí false během pending)
3. Zobrazit sonner toast s tlačítkem "Vrátit" (5s timeout)
4. Po 5s vyprší timer:
   - Volat `POST /api/auth/logout` s refresh tokenem (fire-and-forget, ignoruj error)
   - Smazat `accessTokenAtom`, `refreshTokenAtom`, `currentUserAtom`
   - Smazat `pendingLogoutAtom`
5. Klik "Vrátit" před vypršením:
   - `clearTimeout(timer)`
   - Smazat `pendingLogoutAtom` → UI se obživne
   - Toast: "Odhlášení zrušeno"

**Pozn.:** Když je odhlášení pending a user navštíví chráněnou route, chová se jako logged-out (per-route guard zafunguje). To je akceptovatelný side effect — pokud user spěchá pryč, prostě odhlášení dokončí.

**Derived atom:**
```ts
export const isAuthenticatedAtom = atom((get) =>
  get(accessTokenAtom) !== null && get(pendingLogoutAtom) === null
);
```

### 4.6 JWT decode pro hydrataci

**Nová utilita** `src/utils/jwt.ts`:
```ts
export function decodeJwt<T>(token: string): T | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch { return null; }
}
```

**App init** (např. v `main.tsx` nebo nové komponentě `<AuthBootstrap />`):
```ts
useEffect(() => {
  const token = store.get(accessTokenAtom);
  const user = store.get(currentUserAtom);
  if (token && !user) {
    const payload = decodeJwt<AccessTokenPayload>(token);
    if (payload && payload.exp * 1000 > Date.now()) {
      // Naplň minimální user objekt z JWT
      store.set(currentUserAtom, {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        role: payload.role,
        characterPath: payload.characterPath,
        ikarosSkin: payload.ikarosSkin,
        // ostatní pole (themeSettings, chatPreferences, …) jsou prázdná —
        // doplní se v 1.3 přes /api/users/me
        themeSettings: {},
        chatPreferences: {},
        favoriteDiscussionIds: [],
        isOnline: true,
        lastSeenAt: '',
        displayName: undefined,
        avatarUrl: undefined,
        profileImageUrl: undefined,
        createdAt: '',
        updatedAt: '',
      });
    } else {
      // Token expired/invalid → clear
      store.set(accessTokenAtom, null);
      store.set(refreshTokenAtom, null);
    }
  }
}, []);
```

**Pozn.:** Některá pole `User` typu jsou v JWT prázdná (avatarUrl, displayName, …). Pro 1.1 stačí `username` + `role` v hlavičce. Plná hydratace přes `/me` je 1.3.

### 4.7 currentUserAtom persistence
```ts
// store/authStore.ts
export const currentUserAtom = atomWithStorage<User | null>('ikaros.user', null);
```

Risk: stale data. Akceptujeme — JWT decode při init přepíše a 1.3 dotáhne `/me`.

---

## 5. UI/UX detail modalu

### 5.1 Vizuální spec
- **Container:** existující `<Modal>` komponenta (viz `components/ui/Modal`) — ověřit, že podporuje:
  - Esc + backdrop close
  - `aria-labelledby`, `aria-modal`
  - Focus trap (focus uvnitř modalu, návrat po zavření)
- **Šířka:** 420px desktop, full-width minus padding na mobilu
- **Pozadí karty:** `var(--bg-elevated)` (per-theme)
- **Border:** `1px solid var(--border-primary)` + per-theme glow z `decorations.css`
- **Nadpis "Přihlášení":** display font (per-theme, např. `--font-display`)
- **Tlačítko PŘIHLÁSIT SE:** plnou šířku, 3D efekt z `decorations.css` (translateY + box-shadow + glow)

### 5.2 A11y
- `aria-invalid="true"` na input s validation chybou
- `aria-describedby` propojení input ↔ error msg
- Banner `role="alert"` + `aria-live="polite"`
- Focus trap uvnitř modalu
- Po zavření modalu focus zpět na PŘIHLÁSIT SE button

### 5.3 Mobile
- Card full-width minus 16px padding
- Inputy `inputMode="email"` na identifier (ne, identifier nemusí být email — necháme default text)
- `autoCapitalize="none"` na identifier
- Tap targety ≥44px

### 5.4 Theme switcher na logged-out
- ThemeSwitcher v hlavičce **viditelný i logged-out** — uživatel si může nastavit téma před loginem
- Volba se ukládá do localStorage (`themeAtom` přes `atomWithStorage`) — funguje i pro anon

---

## 6. Veřejné endpointy a queries

### 6.1 Co je veřejně dostupné z BE
**Nutno ověřit (BE side):**
- `GET /api/worlds` — vrací jen public worlds bez auth? (Pravděpodobně `accessMode in ['public', 'open']`.) Pokud BE vyžaduje auth, dluh.
- `GET /api/ikaros-articles` — public read?
- `GET /api/ikaros-gallery` — public read?
- `GET /api/ikaros-discussions` — filtr "open" pro anon?
- `GET /api/ikaros-news` — public (roadmap to říká: "čtení bez přihlášení")

### 6.2 axios klient — anon volání
Aktuální interceptor přidává Bearer header jen pokud token existuje. Anon volání projdou bez Authorization. ✓

### 6.3 useMyWorlds vs usePublicWorlds
Pro logged-out sidebar potřebujeme variantu `useMyWorlds` která vrací public worlds.
- Buď nový hook `usePublicWorlds()` — `GET /api/worlds?public=true`
- Nebo `useMyWorlds` rozšířit aby fungoval i bez auth (vrátí public worlds)

**Návrh:** Nový hook `usePublicWorlds()`. `useMyWorlds()` zůstane "moje členství" pro logged-in.

V IkarosLayout sidebaru vybereme dle `isAuthenticatedAtom`.

---

## 7. Akceptační kritéria

### 7.1 Funkční (logged-out)
- [ ] Anon uživatel otevře `/` → vidí úvodník bez redirectu
- [ ] V hlavičce vidí: logo, theme switcher, PŘIHLÁSIT SE, REGISTRACE-disabled
- [ ] V sidebaru vidí: ÚVODNÍK, VESMÍRY (public worlds), DISKUZE, ČLÁNKY, GALERIE, NÁPOVĚDA
- [ ] V sidebaru **NEvidí**: VYTVOŘIT SVĚT, CHAT/Hospoda
- [ ] Pravý sloupec **NENÍ** zobrazen
- [ ] Klik na VYTVOŘIT SVĚT (kdyby nějak zobrazený nebyl skryt — nemá se to stát) → redirect / + auto-modal
- [ ] Klik na PŘIHLÁSIT SE → otevře modal
- [ ] Klik REGISTRACE → nic (disabled), tooltip "Připravujeme"

### 7.2 Funkční (modal)
- [ ] Zadám platný e-mail + heslo → 200 → modal zmizí, hlavička přepne na logged-in
- [ ] Zadám platnou přezdívku + heslo → 200 → modal zmizí
- [ ] Zadám špatné údaje → 401 → banner "Nesprávné přihlašovací údaje"
- [ ] >5 pokusů/min → 429 → banner "Příliš mnoho pokusů…"
- [ ] Network down → banner "Nepodařilo se připojit"
- [ ] Prázdné identifier → zod chyba pod fieldem
- [ ] Prázdné heslo → zod chyba pod fieldem
- [ ] Klik X / Esc / backdrop → modal zmizí (data v polích zahozena)
- [ ] Klik na ikonu oka → heslo se ukáže/skryje
- [ ] Submit během loadingu → tlačítko disabled, spinner

### 7.3 Funkční (logged-in)
- [ ] Po přihlášení hlavička ukáže POŠTA, PŘÁTELÉ/UŽIVATELÉ (role-based), přezdívku, ODHLÁSIT
- [ ] Sidebar ukáže VYTVOŘIT SVĚT + CHAT/Hospoda
- [ ] Pravý sloupec se zobrazí
- [ ] Refresh stránky (F5) → hlavička stále ukazuje přezdívku (JWT decode)
- [ ] Token expired → axios refresh → pokud i ten vyprší, redirect / + auto-modal
- [ ] Klik na PŘÁTELÉ → toast "Připravujeme"
- [ ] Klik na UŽIVATELÉ (admin) → toast "Připravujeme" (1.4)
- [ ] Klik na přezdívku → toast "Připravujeme" (1.3)

### 7.4 Funkční (logout)
- [ ] Klik ODHLÁSIT → hlavička okamžitě přepne na logged-out + toast s "Vrátit"
- [ ] 5s neklikám → tokeny smazány, BE volání `/auth/logout` proběhlo
- [ ] Klik "Vrátit" do 5s → hlavička obživne, tokeny zůstanou, žádné BE volání

### 7.5 Funkční (deep link)
- [ ] Anon: `/ikaros/posta` v URL → redirect `/?openLogin=1` → modal otevřený
- [ ] Po loginu z deep linku → naviguje na `/ikaros/posta`
- [ ] Modal otevřu z hlavičky (ne z deep linku) → po loginu zůstanu na current page

### 7.6 A11y
- [ ] Modal: focus trap, Esc, aria-modal, aria-labelledby
- [ ] Inputs: aria-invalid při chybě, aria-describedby pro error msg
- [ ] Banner: role="alert", aria-live="polite"
- [ ] Tab order rozumný

### 7.7 Mobile
- [ ] Modal full-width minus padding
- [ ] Inputy autoCapitalize="none" na identifier
- [ ] Tap targety ≥44px
- [ ] Po `mobil-desktop` skill kontrole — žádný regression

### 7.8 BE
- [ ] `POST /auth/login` s `{ identifier: "x@y.z", password }` → 200
- [ ] `POST /auth/login` s `{ identifier: "username", password }` → 200
- [ ] `POST /auth/login` s `{ identifier: neexistuje, password }` → 401 (generický)
- [ ] `POST /auth/login` s `{ identifier: "x", password: "" }` → 400
- [ ] `POST /auth/register` s `{ username: "user@bad", … }` → 400 "Přezdívka nesmí obsahovat @"
- [ ] Existující testy `auth.e2e-spec.ts` projdou po update na `identifier`

---

## 8. Testy

### 8.1 BE
- `auth.service.spec.ts` — login by email + login by username (mock UsersService)
- `register.dto.spec.ts` — username s `@` → validation error
- `auth.e2e-spec.ts` — update existujících testů na pole `identifier`, doplnit username case

### 8.2 FE
**Unit (vitest):**
- `loginSchema.spec.ts` — 4 cases: valid, prázdný identifier, prázdné heslo, oba prázdné
- `jwt.spec.ts` — decode valid token, expired token, malformed token
- `useAuth.spec.ts` — useLogin onSuccess zapíše do atoms; useLogout 5s timer + undo

**Component (RTL):**
- `LoginModal.spec.tsx`:
  - render, autoFocus na identifier
  - submit valid → mock API success → modal close, atomy nastaveny
  - submit invalid creds → 401 → banner se zobrazí
  - submit rate-limited → 429 → banner
  - network error → banner
  - password toggle ikona
  - close (X / Esc / backdrop)
  - focus trap
- `IkarosLayout.spec.tsx`:
  - logged-out: žádný pravý sloupec, sidebar bez Chat/Vytvořit svět, hlavička s PŘIHLÁSIT/REGISTRACE
  - logged-in: kompletní layout

**Storybook stories:**
- `LoginModal/Idle`, `LoginModal/Loading`, `LoginModal/Error401`, `LoginModal/Error429`, `LoginModal/Network`
- `IkarosLayout/LoggedOut`, `IkarosLayout/LoggedIn`

**Skill `mobil-desktop`** — po grafických úpravách spustit (per `base.md`).

---

## 9. Migrace / breaking changes

### 9.1 BE breaking
- `LoginDto.email` → `identifier`. Klienti volající `/auth/login` se starým tělem dostanou 400.
- **Migrace:** žádná — FE se mění současně, žádný jiný klient (podle dosud známých BE klientů).

### 9.2 FE breaking
- `/login` route → 404 (kdo má záložku, dostane NotFoundPage). Akceptovatelné — modal nahradil.
- `LoginRequest` typ změněn (`email` → `identifier`). Žádné jiné call site (jen LoginPage stub).

---

## 10. Tracked dluhy

- **D-005** — `currentUserAtom` plnohodnotná hydratace přes `/api/users/me` při startu (nad rámec JWT decode). Vyřeší 1.3.
- **D-006** — Reset hesla. BE neumí, ani FE flow neexistuje. Samostatný krok mimo Fáze 1 (zvážit 1.7 nebo přidat do 1.3).
- **D-007** — `User` typ má `Omit<User, 'passwordHash'>` v `AuthResponse`, ale `User` type field `passwordHash` nemá → no-op. Cleanup typu — vyřeším při scope 1.1 (drobnost).
- **D-008** — Ověřit anon dostupnost `/api/worlds`, `/api/ikaros-articles`, `/api/ikaros-gallery`, `/api/ikaros-discussions`, `/api/ikaros-news`. Pokud některý vyžaduje auth bez důvodu, BE patch. Otevřu po analýze BE auth guards.

---

## 11. Otevřené body k revizi

- [ ] **BE side endpoint guards** — než začnu kódovat, projdu BE controllery a zjistím, které veřejné endpointy mají `@UseGuards(JwtAuthGuard)`. Pokud něco nepasuje s logged-out scopem, otevřu jako D-008.
- [ ] **`Modal` UI komponenta** — ověřit, že podporuje focus trap + aria. Pokud ne, doplnit (drobné rozšíření).
- [ ] **`UsersService.findByUsername`** — ověřit existenci, případně doplnit.

---

## 12. Po schválení tohoto specu

Vytvořím `docs/arch/phase-1/plan-1.1.md` — implementační plán s konkrétními soubory, pořadím změn (BE → FE), test stepy a checklisty. Počkám na schválení toho, pak budu kódovat.
