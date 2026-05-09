# Spec 1.2 — Registrace

**Datum:** 2026-05-08
**Status:** ⏳ Čeká na schválení
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.2
**Závisí na:** 1.1 (Login modal + per-route auth) ✅, 1.0 (theme systém) ✅
**Souvisí s:** `docs/arch/phase-1/_side-tasks/spec-superadmin-seed.md` (paralelní jednorázová úloha)

---

## 1. Cíl

Umožnit anonymnímu návštěvníkovi **vytvořit účet** v Ikaros platformě přes **modal v hlavičce IkarosLayoutu** — konzistentní s 1.1 Login. Po úspěšné registraci je uživatel **automaticky přihlášen** (BE `register` endpoint vrací `accessToken + refreshToken + user`).

Roadmapa původně říkala "Success → redirect na login", ale to už nedává smysl po deviaci 1.1 (login je modal, ne stránka) a navíc BE auto-login je výhodnější UX.

---

## 2. Rozsah

### 2.1 V rozsahu 1.2

**BE:**
- `ConflictException` v `AuthService.register` rozšířit o `code: 'EMAIL_TAKEN' | 'USERNAME_TAKEN'` (FE field-level chyba)
- Nový public endpoint `GET /api/auth/check-username?u=<value>` → `{ available: boolean }` (throttled)
- Nový public endpoint `GET /api/auth/check-email?e=<value>` → `{ available: boolean }` (throttled)
- Sjednocení BE → FE typů: `RegisterRequest` (FE) ↔ `RegisterDto` (BE) — pole `email`, `username`, `password` (passwordConfirm je čistě FE)
- BE testy: `auth.service.spec` (conflict cases s `code`), `auth.controller.spec` pro check endpointy, `register.dto.spec` (existuje)

**FE:**
- `RegisterModal` komponenta (themed, 3D buttons) — pole email, username, password, passwordConfirm + show/hide toggle
- Indikátor síly hesla (zxcvbn-style barevný progress)
- Debounced live availability check (username/email) — ✓/✗ ikona vedle inputu
- `useRegister` mutace v `useAuth.ts`
- `useCheckUsername`, `useCheckEmail` hooky (TanStack Query, debounced)
- `registerModalOpenAtom` (Jotai) + `?openRegister=1` query trigger v `DashboardPage`
- Cross-linky LoginModal ↔ RegisterModal:
  - LoginModal: "Nemáš účet? Zaregistruj se" → zavře login + otevře register
  - RegisterModal: "Už máš účet? Přihlas se" → zavře register + otevře login
- REGISTRACE button v `IkarosLayout` headeru — odblokovat (1.1 měl `disabled` placeholder)
- Reuse deep-link intent (`sessionStorage('ikaros.loginIntent')`) — po registraci naviguje na uložený intent
- Smazat `src/pages/auth/AuthLayout.tsx` + `src/pages/auth/RegisterPage.tsx` (orphan po 1.1, viz 1.1 spec §2.3)
- Tests + Storybook stories

### 2.2 Mimo rozsah 1.2 (explicitně)

- **Reset hesla** — samostatný krok 1.7 (vyžaduje SMTP / mailer infra)
- **Email verifikace** — BE neumí, samostatný dluh / krok
- **Captcha / honeypot** proti botům — samostatný dluh
- **GDPR souhlas + Podmínky použití** — odložit jako D-010 (nutná samostatná legal stránka, mimo scope této fáze)
- **Profil + avatar + displayName** — krok 1.3
- **Prefill identifier z LoginModalu do RegisterModalu** — vynecháno (uživatel označil jako nepriority)

---

## 3. Backend změny

### 3.1 Strukturovaná chyba pro field-level mapping

**Problém:** BE `register` aktuálně vrací `ConflictException('Email již existuje')` resp. `'Username již existuje'`. FE může parsovat string, ale je to křehké (lokalizace, překlepy).

**Řešení:** Throw `ConflictException` s objektovým payloadem:

```ts
// backend/src/modules/auth/auth.service.ts — register()
if (existing) {
  throw new ConflictException({
    statusCode: 409,
    message: 'Email již existuje',
    code: 'EMAIL_TAKEN',
  });
}
if (existingUsername) {
  throw new ConflictException({
    statusCode: 409,
    message: 'Username již existuje',
    code: 'USERNAME_TAKEN',
  });
}
```

NestJS `ConflictException(object)` propaguje objekt do response body → FE čte `error.response.data.code`.

**FE kontrakt:**
```ts
// src/api/types.ts (nebo blízko parseApiError)
export type RegisterErrorCode = 'EMAIL_TAKEN' | 'USERNAME_TAKEN';
```

### 3.2 Check username / check email endpointy

**Účel:** Live debounced UI feedback během psaní (✓/✗ ikona) — uživatel se hned dozví, že přezdívka/e-mail je obsazený, místo aby vyplnil celý formulář a dostal 409 na submit.

**Endpointy** (oba public, throttled, response 200):

```ts
// auth.controller.ts
@Get('check-username')
@Throttle({ default: { ttl: 60_000, limit: 60 } })  // 60/min — debounced UI
@ApiOperation({ summary: 'Zda je username dostupný (public)' })
checkUsername(@Query('u') username: string): Promise<{ available: boolean }> {
  return this.authService.checkUsername(username);
}

@Get('check-email')
@Throttle({ default: { ttl: 60_000, limit: 60 } })
@ApiOperation({ summary: 'Zda je e-mail dostupný (public)' })
checkEmail(@Query('e') email: string): Promise<{ available: boolean }> {
  return this.authService.checkEmail(email);
}
```

```ts
// auth.service.ts
async checkUsername(username: string): Promise<{ available: boolean }> {
  if (!username || username.length < 3 || username.length > 32 || username.includes('@')) {
    return { available: false };
  }
  const existing = await this.usersRepo.findByUsername(username);
  return { available: !existing };
}

async checkEmail(email: string): Promise<{ available: boolean }> {
  if (!email || !email.includes('@')) {
    return { available: false };
  }
  const existing = await this.usersRepo.findByEmail(email.toLowerCase());
  return { available: !existing };
}
```

**Bezpečnostní pozn.:** Endpointy umožňují enumerate registrovaných e-mailů a přezdívek. Throttling 60/min/IP omezuje masové scrapování. **Akceptujeme** — username je veřejný identifikátor stejně (po 1.4 adresář uživatelů), e-mail je obvyklá UX cena za UX přínos. Pokud BE chce přísnější přístup, dluh.

### 3.3 BE testy

- `auth.service.spec.ts` — register conflict pro email vrací `code: 'EMAIL_TAKEN'`; pro username `'USERNAME_TAKEN'`
- `auth.service.spec.ts` — `checkUsername` a `checkEmail` cases (valid/invalid input, existing/non-existing)
- `auth.controller.spec.ts` (pokud existuje) — endpointy throttled, public (žádný `JwtAuthGuard`)
- E2E `auth.e2e-spec.ts` — register conflict response shape `{ code, message }`; check endpointy

### 3.4 Swagger
`@ApiResponse({ status: 409, schema: { ... code: 'EMAIL_TAKEN' | 'USERNAME_TAKEN' ... } })` v register endpointu.

---

## 4. Frontend — architektura

### 4.1 Nová Jotai atoms

```ts
// src/store/uiStore.ts (nebo new src/store/authModalsStore.ts)
export const loginModalOpenAtom = atom(false);     // už existuje z 1.1
export const registerModalOpenAtom = atom(false);  // nové

// Helper akce — zaručí, že nikdy nejsou oba modaly otevřené najednou
export const openLoginModalAtom = atom(null, (_get, set) => {
  set(registerModalOpenAtom, false);
  set(loginModalOpenAtom, true);
});
export const openRegisterModalAtom = atom(null, (_get, set) => {
  set(loginModalOpenAtom, false);
  set(registerModalOpenAtom, true);
});
```

### 4.2 RegisterModal — komponenta

`src/components/auth/RegisterModal.tsx` (nová komponenta vedle `LoginModal.tsx`):

- Open/close: `registerModalOpenAtom`
- Otevírání:
  - Klik na REGISTRACE v hlavičce → `setRegisterModalOpen(true)`
  - Auto při `?openRegister=1` (DashboardPage `useEffect`)
  - Z LoginModalu cross-link
- Zavření: X / Esc / backdrop (existující `Modal` UI komponenta z 1.0)
- Po úspěchu (auto-login):
  - Zápis tokenů + user do atomů (stejný `useLogin.onSuccess` flow)
  - `setRegisterModalOpen(false)`
  - Pokud `sessionStorage.getItem('ikaros.loginIntent')` → `navigate(intent)` + smazat klíč
  - Toast (sonner): "Vítej, {přezdívka}! Účet vytvořen."

**Form (RHF + zod):**

```ts
// src/components/auth/registerSchema.ts
export const registerSchema = z
  .object({
    email: z.string().min(1, 'Zadej e-mail').email('Neplatný formát e-mailu').max(255),
    username: z
      .string()
      .min(3, 'Minimálně 3 znaky')
      .max(32, 'Maximálně 32 znaků')
      .regex(/^[^@]+$/, 'Přezdívka nesmí obsahovat @'),
    password: z
      .string()
      .min(6, 'Minimálně 6 znaků')
      .max(128, 'Maximálně 128 znaků'),
    passwordConfirm: z.string().min(1, 'Potvrď heslo'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Hesla se neshodují',
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
```

**RHF mode:** `onBlur` + revalidate `onChange` po prvním submitu (stejně jako LoginModal).

**Pole modalu** (vertikálně):
1. **E-mail** — `<Input type="email" autoComplete="email" autoCapitalize="none" inputMode="email" />` + ✓/✗ availability ikona vpravo (debounced)
2. **Přezdívka** — `<Input autoComplete="username" autoCapitalize="none" />` + ✓/✗ availability ikona vpravo (debounced)
3. **Heslo** — `<Input type={show ? 'text' : 'password'} autoComplete="new-password" />` + show/hide ikona + indikátor síly (barevný progress bar pod inputem)
4. **Potvrzení hesla** — `<Input type={show ? 'text' : 'password'} autoComplete="new-password" />`
5. **Submit** — `<Button variant="primary" loading={isPending} disabled={!canSubmit} type="submit">Vytvořit účet</Button>`
6. Pod tlačítkem: `<a>Už máš účet? Přihlas se</a>` → `set(openLoginModalAtom)`

**`canSubmit` derivace:**
- form je valid (zod prošel)
- availability checks neukazují ✗ (nebo nejsou pending)

**Error banner** (nad submit, `aria-live="polite"`, `role="alert"`):
- 409 + `code: 'EMAIL_TAKEN'` → `setError('email', { message: 'Tento e-mail už je registrovaný' })` (field-level, ne banner)
- 409 + `code: 'USERNAME_TAKEN'` → `setError('username', { message: 'Tato přezdívka už je obsazená' })`
- 400 (nečekaný validation z BE) → banner "Některá data nejsou platná"
- 429 → banner "Příliš mnoho pokusů. Zkus to za chvíli."
- network/0 → banner "Nepodařilo se připojit k serveru."
- 5xx → banner "Něco se pokazilo. Zkus to znovu."

### 4.3 Indikátor síly hesla

**Knihovna:** `zxcvbn-ts` (cca 50 KB gzipped, lazy-loaded). Alternativa: ruční heuristika (delka, různorodost). **Návrh:** Začneme jednoduchou heuristikou, zxcvbn je opt-in později.

```ts
// src/components/auth/passwordStrength.ts
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ['Velmi slabé', 'Slabé', 'Průměrné', 'Silné', 'Velmi silné'];
  const colors = ['var(--danger)', 'var(--warning)', 'var(--accent)', 'var(--success)', 'var(--success)'];
  return { score: clamped, label: labels[clamped], color: colors[clamped] };
}
```

**UI:** 5-segmentový bar pod password inputem, vyplňuje se podle `score`. Label vedle "Heslo: Slabé".

**Pozn.:** Skóre není gate — uživatel může zaregistrovat i se "Slabým" heslem (BE pouze `min(6)`). Indikátor je jen edukativní.

### 4.4 Live availability check — `useCheckUsername`, `useCheckEmail`

```ts
// src/api/hooks/useAvailability.ts
import { useDebouncedValue } from '@/utils/useDebounce';

export function useCheckUsername(value: string) {
  const debounced = useDebouncedValue(value, 400);
  return useQuery({
    queryKey: ['check-username', debounced],
    queryFn: () => api.get<{ available: boolean }>(`/auth/check-username`, { params: { u: debounced } }),
    enabled: debounced.length >= 3 && !debounced.includes('@'),
    staleTime: 30_000,
    retry: false,
  });
}

export function useCheckEmail(value: string) {
  const debounced = useDebouncedValue(value, 400);
  return useQuery({
    queryKey: ['check-email', debounced],
    queryFn: () => api.get<{ available: boolean }>(`/auth/check-email`, { params: { e: debounced } }),
    enabled: debounced.length >= 5 && debounced.includes('@'),
    staleTime: 30_000,
    retry: false,
  });
}
```

**`useDebouncedValue`** — buď použít existující hook (pokud je v utils), nebo přidat triviální:
```ts
export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
```

**UI integrace:** Vedle inputu ikona dle stavu:
- `idle` (prázdný / krátký) → nic
- `loading` → mini spinner
- `available: true` → zelená ✓ "K dispozici"
- `available: false` → červená ✗ "Obsazené"

### 4.5 useRegister hook — `src/api/hooks/useAuth.ts`

```ts
export function useRegister() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (dto: RegisterRequest) =>
      api.post<AuthResponse>('/auth/register', dto),
    onSuccess: ({ accessToken, refreshToken, user }) => {
      const store = getDefaultStore();
      store.set(accessTokenAtom, accessToken);
      store.set(refreshTokenAtom, refreshToken);
      store.set(currentUserAtom, user);
      store.set(registerModalOpenAtom, false);

      const intent = sessionStorage.getItem('ikaros.loginIntent');
      if (intent) {
        sessionStorage.removeItem('ikaros.loginIntent');
        navigate(intent);
      }
      toast.success(`Vítej, ${user.username}! Účet vytvořen.`);
    },
  });
}
```

`RegisterRequest` typ:
```ts
// src/api/types.ts
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}
```

### 4.6 IkarosLayout header — odblokovat REGISTRACE

**Před (z 1.1):**
```tsx
<Button disabled title="Připravujeme">REGISTRACE</Button>
```

**Po:**
```tsx
<Button onClick={() => setRegisterModalOpen(true)}>REGISTRACE</Button>
```

Zbytek headeru zůstává (z 1.1 — PŘIHLÁSIT SE / logged-in varianta beze změny).

### 4.7 Cross-link LoginModal ↔ RegisterModal

**LoginModal** — pod submit tlačítkem přidat:
```tsx
<button type="button" className={styles.crossLink} onClick={() => setOpenRegister()}>
  Nemáš účet? Zaregistruj se
</button>
```

**RegisterModal** — pod submit tlačítkem analogicky:
```tsx
<button type="button" className={styles.crossLink} onClick={() => setOpenLogin()}>
  Už máš účet? Přihlas se
</button>
```

**Pozn.:** Akce přes `openLoginModalAtom` / `openRegisterModalAtom` — zaručí, že není otevřen jeden přes druhý.

### 4.8 `?openRegister=1` query trigger

V `DashboardPage` (existující useEffect z 1.1 pro `openLogin`):

```ts
useEffect(() => {
  const params = new URLSearchParams(location.search);
  if (params.get('openLogin') === '1') {
    setLoginModalOpen(true);
    navigate(location.pathname, { replace: true });
  } else if (params.get('openRegister') === '1') {
    setRegisterModalOpen(true);
    navigate(location.pathname, { replace: true });
  }
}, [location]);
```

### 4.9 Smazání AuthLayout + RegisterPage

Po 1.1 zůstaly orphan soubory:
- `src/pages/auth/AuthLayout.tsx`
- `src/pages/auth/RegisterPage.tsx` (případně `LoginPage.tsx` pokud nebyl smazán)

V 1.2 finálně **smazat** — žádný router je neimportuje.

---

## 5. UI/UX detail modalu

### 5.1 Vizuální spec
- Container: existující `<Modal>` (focus trap, aria-modal, Esc, backdrop close)
- Šířka: 480px desktop (širší než LoginModal kvůli 4 polím), full-width minus padding na mobilu
- Pozadí: `var(--bg-elevated)` per-theme + glow z `decorations.css`
- Nadpis: "Registrace" (display font per-theme)
- Submit tlačítko full-width, 3D efekt (translateY + box-shadow + glow per-theme)

### 5.2 A11y
- `aria-invalid="true"` na inputy s validation chybou
- `aria-describedby` propojení input ↔ error msg
- `aria-describedby` na password ↔ strength indicator
- Banner `role="alert"` + `aria-live="polite"`
- Focus trap uvnitř modalu, focus zpět na REGISTRACE button po zavření
- Availability ikona má `aria-label="K dispozici"` / `"Obsazené"` (čteno screen readerem)

### 5.3 Mobile
- Card full-width minus 16px
- Tap targety ≥44px
- Po grafických úpravách spustit skill `mobil-desktop` (per `base.md`)

### 5.4 Theme
- Modal používá per-theme tokeny (stejně jako LoginModal)
- Indikátor síly hesla barvy: `--danger`, `--warning`, `--accent`, `--success` (definované per-theme)

---

## 6. Akceptační kritéria

### 6.1 Funkční (otevírání)
- [ ] Klik REGISTRACE v headeru → modal otevřen
- [ ] `/?openRegister=1` v URL → modal auto-otevřen, query odstraněn
- [ ] LoginModal "Nemáš účet?" link → login zavřen, register otevřen
- [ ] Klik X / Esc / backdrop → modal zmizí (data v polích zahozena)

### 6.2 Funkční (validace + availability)
- [ ] Prázdné e-mail → zod chyba "Zadej e-mail"
- [ ] Špatný formát e-mailu → zod chyba "Neplatný formát"
- [ ] Username < 3 znaky → zod chyba
- [ ] Username obsahuje `@` → zod chyba "Přezdívka nesmí obsahovat @"
- [ ] Heslo < 6 znaků → zod chyba
- [ ] Hesla neshoduji → zod chyba pod passwordConfirm
- [ ] Píšu existující e-mail → po 400ms ✗ ikona "Obsazené"
- [ ] Píšu existující username → po 400ms ✗ ikona "Obsazené"
- [ ] Píšu nové username → po 400ms ✓ ikona "K dispozici"
- [ ] Submit disabled, dokud availability ✗
- [ ] Heslo "abc" → indikátor "Velmi slabé" (červený segment)
- [ ] Heslo "Abc1234567!" → indikátor "Velmi silné" (5 zelených segmentů)

### 6.3 Funkční (submit)
- [ ] Validní data → 201 → modal zmizí, toast "Vítej, {přezdívka}!", hlavička přepne na logged-in
- [ ] 409 EMAIL_TAKEN → field error pod e-mail "Tento e-mail už je registrovaný"
- [ ] 409 USERNAME_TAKEN → field error pod username "Tato přezdívka už je obsazená"
- [ ] 429 → banner "Příliš mnoho pokusů…"
- [ ] Network down → banner "Nepodařilo se připojit"
- [ ] Submit během loadingu → tlačítko disabled, spinner
- [ ] Po success + sessionStorage intent → naviguje na intent

### 6.4 A11y
- [ ] Focus trap, Esc zavírá, aria-modal
- [ ] Inputy aria-invalid při chybě, aria-describedby pro error msg
- [ ] Banner role="alert", aria-live="polite"
- [ ] Availability ikona má aria-label

### 6.5 Mobile
- [ ] Modal full-width minus padding
- [ ] Tap targety ≥44px
- [ ] `mobil-desktop` skill prošel — žádný regression

### 6.6 BE
- [ ] `POST /auth/register` s validními daty → 201 (auto-login response)
- [ ] `POST /auth/register` duplikátní e-mail → 409 + `code: 'EMAIL_TAKEN'`
- [ ] `POST /auth/register` duplikátní username → 409 + `code: 'USERNAME_TAKEN'`
- [ ] `POST /auth/register` username s `@` → 400 (existující validace)
- [ ] `GET /auth/check-username?u=Tyky` (existující) → `{ available: false }`
- [ ] `GET /auth/check-username?u=NoveDramatickeJmeno` → `{ available: true }`
- [ ] `GET /auth/check-email?e=tyky@gmail.com` (existující) → `{ available: false }`
- [ ] Throttling check endpointů: 60+/min/IP → 429
- [ ] Existující `auth.e2e-spec.ts` projdou po update

---

## 7. Testy

### 7.1 BE
- `auth.service.spec.ts`:
  - register conflict pro email → `code: 'EMAIL_TAKEN'`
  - register conflict pro username → `code: 'USERNAME_TAKEN'`
  - `checkUsername` pro existující → `{ available: false }`
  - `checkUsername` pro nový → `{ available: true }`
  - `checkUsername` pro neplatný (`@`, < 3) → `{ available: false }` (early return)
  - `checkEmail` analogicky
- `auth.controller.spec.ts` — endpointy bez `JwtAuthGuard`, `@Throttle` decorator přítomen
- E2E `auth.e2e-spec.ts` — register conflict response shape; check endpointy

### 7.2 FE
**Unit (vitest):**
- `registerSchema.spec.ts` — 8 cases: valid, prázdný email, neplatný email, krátký username, `@` v username, krátké heslo, dlouhé heslo, mismatch confirm
- `passwordStrength.spec.ts` — boundary values
- `useDebouncedValue.spec.ts` (pokud nový) — debounce behavior
- `useAuth.spec.ts` — `useRegister.onSuccess` zapíše atomy, naviguje na intent, zobrazí toast

**Component (RTL):**
- `RegisterModal.spec.tsx`:
  - render, autoFocus na email
  - submit valid → mock 201 → modal close, atomy nastaveny, toast
  - submit duplicate email → 409 EMAIL_TAKEN → field error pod email
  - submit duplicate username → 409 USERNAME_TAKEN → field error pod username
  - submit rate-limited → 429 → banner
  - network error → banner
  - password toggle ikona
  - password confirm mismatch
  - password strength indicator se aktualizuje při psaní
  - availability check ✓/✗
  - cross-link "Už máš účet?" → otevře LoginModal
  - close (X / Esc / backdrop)
  - focus trap

**Storybook:**
- `RegisterModal/Idle`
- `RegisterModal/Loading`
- `RegisterModal/Error409Email`
- `RegisterModal/Error409Username`
- `RegisterModal/Error429`
- `RegisterModal/Network`
- `RegisterModal/StrongPassword`
- `RegisterModal/WeakPassword`

**Skill `mobil-desktop`** — po grafických úpravách (per `base.md`).

---

## 8. Migrace / breaking changes

### 8.1 BE
- `ConflictException` payload změna z stringu na objekt → klienti čekající na `error.message` jako string dostanou `error.message` z NestJS standard wrapperu (`HttpException` zpracuje objekt). FE patrně nikdo jiný neexistuje.
- Nové endpointy `check-username`, `check-email` jsou additive — žádný breaking impact.

### 8.2 FE
- Žádné breaking — jen additive (nový modal, nový hook, hlavička REGISTRACE button).
- Smazání `AuthLayout.tsx` + `RegisterPage.tsx` → orphan soubory už nikdo neimportuje (po 1.1).

---

## 9. Tracked dluhy

- **D-009** — sjednotit BE `code` field pro VŠECHNY relevantní HTTP exceptiony (ne jen register conflict). Aktuálně 1.2 řeší jen register; ostatní endpointy stále vracejí jen `message`. Otevřu po 1.2 jako BE-side patch napříč moduly.
- **D-010** — GDPR souhlas + Podmínky použití. Vyžaduje legal stránku (`/podminky`) a checkbox v RegisterModalu. Nyní out-of-scope — řešit před produkčním nasazením, samostatný spec.
- **D-011** — Captcha / honeypot proti registračním botům. Aktuálně jen rate limit BE (10/min/IP). Pro produkci doplnit hCaptcha nebo invisible reCAPTCHA. Otevřeno po MVP.
- **D-012** — Email verifikace (potvrzovací e-mail po registraci). Vyžaduje stejnou mailer infra jako 1.7 Reset hesla. Souvisí s D-006.

---

## 10. Otevřené body k revizi

- [ ] **Existing `useDebouncedValue`** — ověřit, zda už neexistuje v `src/utils/`. Pokud ano, reuse.
- [ ] **Modal komponenta podpora širšího layoutu** — `LoginModal` byl 420px; `RegisterModal` 480px. Ověřit, že `<Modal>` přijímá `width` prop, případně rozšířit (drobnost).
- [ ] **`zxcvbn-ts` vs. ruční heuristika** — návrh ruční heuristiky v 1.2 (jednoduchost, žádná dep). Pokud user chce přesnější skóre, lazy-load `zxcvbn-ts` (~50 KB) — opt-in dluh.
- [ ] **`/auth/check-*` endpointy a privacy** — akceptujeme enumeraci jako trade-off pro UX. Pokud BE chce konzervativnější přístup (např. pouze username public, e-mail check skrytý), domluva s BE týmem.

---

## 11. Po schválení tohoto specu

Vytvořím `docs/arch/phase-1/plan-1.2.md` — implementační plán s konkrétními soubory, pořadím změn (BE → FE), test stepy a checklisty. Počkám na schválení toho, pak budu kódovat.
