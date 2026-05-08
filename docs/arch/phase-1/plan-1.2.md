# Implementační plán — krok 1.2 Registrace + Superadmin seed

**Datum:** 2026-05-08
**Status:** ⏳ Čeká na schválení
**Spec:** [`spec-1.2.md`](./spec-1.2.md), [`spec-superadmin-seed.md`](./spec-superadmin-seed.md)
**Větev:** `feat/krok-1.2-registrace` (vytvořím při startu)

---

## Pořadí fází

Fáze 0 (Superadmin seed) je nezávislá na 1.2 a běží paralelně — výsledný Tyky účet se hodí pro testování duplicity v 1.2 ("Tato přezdívka už je obsazená").

```
0. Superadmin seed             ── BE, drobnost (~60 ř TS)
1. BE — error code + check     ── auth modul, base pro FE
2. FE typy + utility           ── nezávislé na BE
3. FE hooky                    ── závisí na 1, 2
4. FE komponenty               ── závisí na 3
5. Integrace + cross-link      ── závisí na 4
6. Cleanup orphan souborů      ── nezávislé
7. Stories + finální checks    ── poslední gate
```

Test gates: `npm run lint`, `npm run typecheck`, `npm test` po každé fázi. `npm run test:e2e` po Fázi 1. Skill `mobil-desktop` po Fázi 4 a 5.

---

## Fáze 0 — Superadmin seed

**Cíl:** Tyky účet existuje v DB s rolí Superadmin, použitelný pro login z FE.

### 0.1 Soubory (vznikne)
- `backend/scripts/seed-superadmin/index.ts` — TS skript (~60 ř)

### 0.2 Soubory (modifikace)
- `backend/package.json` — přidat `"seed:superadmin": "ts-node scripts/seed-superadmin/index.ts"`

### 0.3 Pre-flight checks
- [ ] Ověřit `UserRole.Superadmin` enum v `backend/src/modules/users/interfaces/user.interface.ts`
- [ ] Ověřit `userSchema` import path (`backend/src/modules/users/schemas/user.schema.ts` nebo podobně)
- [ ] Ověřit `.gitignore` obsahuje `.env.local` / `.env.*.local`
- [ ] Ověřit existence `MONGODB_URI` v `.env`

### 0.4 Implementace skriptu
1. Read env: `SEED_SUPERADMIN_EMAIL`, `SEED_SUPERADMIN_USERNAME`, `SEED_SUPERADMIN_PASSWORD`, `MONGODB_URI`
2. Validate (email obsahuje `@`, username 3-32 bez `@`, password 6-128) — bez echa hesla
3. `mongoose.connect`
4. Find by email — pokud existuje a role === Superadmin → log + exit; jinak update role → log + exit
5. Pokud neexistuje → `bcrypt.hash(password, 10)` → create user s rolí Superadmin
6. `mongoose.disconnect` → exit 0
7. Catch → log `err.message` (NE celý `err`) → exit 1

### 0.5 Spuštění (pro PJ)
```powershell
$env:SEED_SUPERADMIN_EMAIL = "tykytanjunior@gmail.com"
$env:SEED_SUPERADMIN_USERNAME = "Tyky"
$env:SEED_SUPERADMIN_PASSWORD = "<heslo z konverzace>"
cd C:\Matrix\ProjektIkaros\Projekt-ikaros\backend
npm run seed:superadmin
Remove-Item Env:SEED_SUPERADMIN_PASSWORD
```

### 0.6 Akceptace
- [ ] Skript proběhne, vypíše `✓ Vytvořen Superadmin: Tyky`
- [ ] V DB: `db.users.findOne({ email: "tykytanjunior@gmail.com" })` → `role: "Superadmin"`
- [ ] Druhé spuštění → `✓ Uživatel … už je Superadmin`
- [ ] Spuštění bez env → exit 1, bez echa hesla
- [ ] Login z FE (LoginModal) s `Tyky` + heslo → 200 + token, hlavička ukazuje "UŽIVATELÉ" link

---

## Fáze 1 — BE: error code + check endpointy

**Cíl:** Strukturovaná error response a 2 nové public GET endpointy.

### 1.1 Soubory (modifikace)
- `backend/src/modules/auth/auth.service.ts`
  - `register()` → `ConflictException({ statusCode: 409, message: '…', code: 'EMAIL_TAKEN' | 'USERNAME_TAKEN' })`
  - Nové metody `checkUsername(value)`, `checkEmail(value)` → `{ available: boolean }`
- `backend/src/modules/auth/auth.controller.ts`
  - `@Get('check-username')` + `@Throttle({ default: { ttl: 60_000, limit: 60 } })`
  - `@Get('check-email')` analogicky
  - `@ApiResponse` Swagger
- `backend/src/modules/auth/auth.service.spec.ts`
  - Update register conflict cases (assert `code` field)
  - 6 cases pro `checkUsername` (existing/new/short/with-@/empty/long)
  - 6 cases pro `checkEmail`
- `backend/src/modules/auth/auth.controller.spec.ts` (pokud existuje, jinak vytvořit)
  - check-username/check-email: bez JwtAuthGuard, throttle decorator
- `backend/test/auth.e2e-spec.ts`
  - register conflict response shape `{ code, message }`
  - GET check endpointy (200 pro existující/neexistující, 429 přes throttle)

### 1.2 Verifikace
```bash
cd backend
npm run lint
npm run typecheck
npm test -- auth
npm run test:e2e -- auth
```

### 1.3 Akceptace
- [ ] `POST /auth/register` duplicate email → 409 + `{ code: 'EMAIL_TAKEN' }`
- [ ] `POST /auth/register` duplicate username → 409 + `{ code: 'USERNAME_TAKEN' }`
- [ ] `GET /auth/check-username?u=Tyky` → `{ available: false }`
- [ ] `GET /auth/check-username?u=NewUser123` → `{ available: true }`
- [ ] `GET /auth/check-email?e=tykytanjunior@gmail.com` → `{ available: false }`
- [ ] 60+ requestů/min na check endpoint → 429
- [ ] Existující testy auth.e2e projdou

---

## Fáze 2 — FE: typy + utility

**Cíl:** Validation schema, typy, čisté utility — bez UI.

### 2.1 Soubory (modifikace / vznik)
- `src/api/types.ts` (modifikace)
  - Přidat `RegisterRequest { email; username; password }`
  - Přidat `export type RegisterErrorCode = 'EMAIL_TAKEN' | 'USERNAME_TAKEN'`
- `src/utils/useDebouncedValue.ts` (vznik, pokud neexistuje — viz check níže)
- `src/utils/useDebouncedValue.spec.ts` (vznik)
- `src/components/auth/registerSchema.ts` (vznik) — zod schema z spec §4.2
- `src/components/auth/registerSchema.spec.ts` (vznik) — 8 cases dle spec §7.2
- `src/components/auth/passwordStrength.ts` (vznik) — heuristika z spec §4.3
- `src/components/auth/passwordStrength.spec.ts` (vznik)

### 2.2 Pre-flight check
- [ ] `Grep -r "useDebouncedValue\|useDebounce" src/utils src/api` — pokud existuje, reuse, nevytvářej

### 2.3 Verifikace
```bash
npm run lint
npm run typecheck
npm test -- registerSchema passwordStrength useDebouncedValue
```

### 2.4 Akceptace
- [ ] `registerSchema.spec.ts` 8 cases ✓
- [ ] `passwordStrength.spec.ts` boundary values ✓
- [ ] Žádný TS error v projektu

---

## Fáze 3 — FE: hooky a state

**Cíl:** Data layer pro RegisterModal — bez UI.

### 3.1 Soubory (modifikace / vznik)
- `src/store/uiStore.ts` (modifikace) NEBO `src/store/authModalsStore.ts` (vznik) — preferuju nový soubor pro čistotu
  - `registerModalOpenAtom`
  - `openLoginModalAtom` (write-only akce)
  - `openRegisterModalAtom` (write-only akce)
  - Zachovat existující `loginModalOpenAtom` (z 1.1)
- `src/api/hooks/useAvailability.ts` (vznik) — `useCheckUsername`, `useCheckEmail`
- `src/api/hooks/useAuth.ts` (modifikace) — přidat `useRegister` mutaci
- `src/api/hooks/useAuth.spec.ts` (modifikace) — `useRegister` 4 cases (success → atomy + toast + intent navigate; 409 EMAIL_TAKEN; 409 USERNAME_TAKEN; 429)
- `src/api/hooks/useAvailability.spec.ts` (vznik) — debounce + query enable conditions

### 3.2 Verifikace
```bash
npm run lint
npm run typecheck
npm test -- useAuth useAvailability
```

### 3.3 Akceptace
- [ ] `useRegister.onSuccess` zapíše atomy, zavře modal, naviguje na intent (pokud existuje), zobrazí toast
- [ ] `useCheckUsername` debounced 400ms, enabled jen pro length≥3 a bez `@`
- [ ] `useCheckEmail` debounced 400ms, enabled jen pro length≥5 a obsahuje `@`

---

## Fáze 4 — FE: komponenty

**Cíl:** RegisterModal s plnou funkcionalitou.

### 4.1 Soubory (vznik)
- `src/components/auth/RegisterModal.tsx`
- `src/components/auth/RegisterModal.module.css`
- `src/components/auth/RegisterModal.spec.tsx`
- `src/components/auth/PasswordStrengthIndicator.tsx` — 5-segmentový bar
- `src/components/auth/PasswordStrengthIndicator.module.css`
- `src/components/auth/AvailabilityIcon.tsx` — ✓/✗/spinner
- `src/components/auth/AvailabilityIcon.module.css`

### 4.2 Implementační poznámky
- `RegisterModal` reuse existující `<Modal>` z `components/ui/Modal` (focus trap, Esc, backdrop) — pokud podporuje `width` prop, předat 480px; jinak rozšíření Modalu (drobnost)
- 3D button efekt z `themes/_shared/btn3d.module.css` (existující z 1.1)
- Field-level error mapping (409 response code → `setError('email' | 'username', { message })`)
- `aria-*` atributy dle spec §5.2
- Pole pořadí: email → username → password → passwordConfirm → submit → cross-link

### 4.3 RTL test cases (RegisterModal.spec.tsx)
- [ ] render + autoFocus na email
- [ ] submit valid → mock 201 → modal close, atomy nastaveny, toast
- [ ] submit duplicate email (mock 409 EMAIL_TAKEN) → field error pod email
- [ ] submit duplicate username (mock 409 USERNAME_TAKEN) → field error pod username
- [ ] submit 429 → banner
- [ ] submit network error → banner
- [ ] password show/hide toggle
- [ ] password confirm mismatch → field error
- [ ] password strength indicator se aktualizuje při psaní
- [ ] availability ✓/✗ ikony
- [ ] cross-link "Už máš účet?" → loginModalOpenAtom = true, registerModalOpenAtom = false
- [ ] close (X / Esc / backdrop) zahodí data
- [ ] focus trap (tab cyklí uvnitř modalu)

### 4.4 Verifikace
```bash
npm run lint
npm run typecheck
npm test -- RegisterModal PasswordStrengthIndicator AvailabilityIcon
```

### 4.5 Skill `mobil-desktop`
Po dokončení modalu spustit dle `base.md`. Iterovat dokud bez regressions.

---

## Fáze 5 — FE: integrace + cross-link

**Cíl:** Modal je dosažitelný z hlavičky, LoginModal, deep-link, query trigger.

### 5.1 Soubory (modifikace)
- `src/components/layout/IkarosLayout/IkarosLayout.tsx`
  - REGISTRACE button: odebrat `disabled` + `title`, přidat `onClick={() => set(openRegisterModalAtom)}`
- `src/components/auth/LoginModal.tsx`
  - Pod submit přidat cross-link "Nemáš účet? Zaregistruj se" → `set(openRegisterModalAtom)`
- `src/pages/ikaros/DashboardPage.tsx`
  - Rozšířit existující `useEffect` (`?openLogin=1`) o `?openRegister=1` větvení
- `src/components/auth/LoginModal.spec.tsx` (modifikace) — test cross-link
- `src/components/layout/IkarosLayout/IkarosLayout.spec.tsx` (modifikace, pokud existuje) — test REGISTRACE button funkční (ne disabled)

### 5.2 Verifikace
```bash
npm run lint
npm run typecheck
npm test
npm run dev   # manual smoke
```

### 5.3 Manual smoke test (dev server)
- [ ] `/` → klik REGISTRACE → modal otevřen
- [ ] V LoginModalu klik "Nemáš účet?" → register otevřen, login zavřen
- [ ] V RegisterModalu klik "Už máš účet?" → opačně
- [ ] `/ikaros/posta` jako anon → redirect `/?openLogin=1` → LoginModal otevřen
- [ ] V LoginModalu cross-link → RegisterModal → po úspěchu naviguje na `/ikaros/posta`
- [ ] `/?openRegister=1` přímo v URL → RegisterModal auto-otevřen
- [ ] Submit s Tyky username → field error "Tato přezdívka už je obsazená"
- [ ] Submit s tykytanjunior@gmail.com → field error "Tento e-mail už je registrovaný"
- [ ] Submit s novými údaji → success → auto-login → hlavička přepne na logged-in

### 5.4 Skill `mobil-desktop`
Po integraci znovu (header changes mohou ovlivnit responsivitu).

---

## Fáze 6 — Cleanup orphan souborů

### 6.1 Soubory (smazat)
Pre-flight: ověřit, že žádný import na ně nikde neukazuje.

```bash
# Před smazáním
Grep -r "AuthLayout\|RegisterPage\|LoginPage" src/
```

- [ ] `src/pages/auth/AuthLayout.tsx` — smazat
- [ ] `src/pages/auth/RegisterPage.tsx` — smazat
- [ ] `src/pages/auth/LoginPage.tsx` — smazat (pokud ještě existuje po 1.1)
- [ ] `src/pages/auth/` adresář — smazat pokud prázdný

### 6.2 Verifikace
```bash
npm run typecheck   # nesmí spadnout na chybějícím importu
npm test
```

---

## Fáze 7 — Storybook + finální gates

### 7.1 Soubory (vznik)
- `src/components/auth/RegisterModal.stories.tsx` — 8 stories dle spec §7.2:
  - Idle, Loading, Error409Email, Error409Username, Error429, Network, StrongPassword, WeakPassword

### 7.2 Finální checks
- [ ] `npm run lint` ✓
- [ ] `npm run typecheck` ✓
- [ ] `npm test` ✓ (full suite, ne jen filtered)
- [ ] `npm run test:e2e` v BE ✓
- [ ] `npm run lint:colors` ✓ (z 1.0 — žádné hardcoded barvy)
- [ ] `npm run audit:contrast` ✓ (WCAG AA)
- [ ] Skill `mobil-desktop` ✓
- [ ] Manual smoke test ze 5.3 znovu ✓
- [ ] Storybook stories vizuálně OK ve všech 21 tématech (smoke check 3-4 randomně)

### 7.3 Git commits (návrh struktury)

Striktně po fázích (jeden commit ≈ jedna fáze) pro snadné review/rollback:

```
feat(auth): seed skript pro Superadmin účet (Tyky)             [Fáze 0]
feat(auth): BE error code field + check-username/email         [Fáze 1]
feat(auth): FE registrační schema + password strength + utils  [Fáze 2]
feat(auth): useRegister + useAvailability hooky + atoms        [Fáze 3]
feat(auth): RegisterModal komponenta + sub-komponenty          [Fáze 4]
feat(auth): RegisterModal integrace v hlavičce + cross-link    [Fáze 5]
chore(auth): smaž orphan AuthLayout/RegisterPage/LoginPage     [Fáze 6]
docs(auth): Storybook stories + roadmap update krok 1.2 ✅      [Fáze 7]
```

Branch: `feat/krok-1.2-registrace`. PR vytvoříme až po dokončení a všech zelených testech, ne během práce.

---

## Závěrečná akceptace (gate před označením 1.2 ✅)

- [ ] Všechny BE testy zelené (unit + e2e)
- [ ] Všechny FE testy zelené (vitest + RTL)
- [ ] `npm run lint` + `typecheck` + `lint:colors` + `audit:contrast` zelené
- [ ] Manual smoke test ze 5.3 prošel kompletně
- [ ] Skill `mobil-desktop` bez regressions
- [ ] Storybook stories renderují
- [ ] Tyky účet dostupný v DB, login funkční
- [ ] Roadmap 1.2 označen ✅, dluhy D-009/D-010/D-011/D-012 zapsány (✓ už hotové z brainstormingu)
- [ ] Commit history čistá (8 commitů dle 7.3)

---

## Otevřené otázky před startem

- [ ] **Modal `width` prop** — ověřím v Fázi 4.1 a buď použiju, nebo rozšířím (drobnost)
- [ ] **`useDebouncedValue` reuse** — ověřím v Fázi 2.2
- [ ] **`UserRole.Superadmin` enum** — ověřím ve Fázi 0.3 (předpoklad: existuje, dle 1.1)
- [ ] **`auth.controller.spec.ts`** — pokud BE projekt nemá controller spec pattern, vytvořím nový

Pokud cokoli z toho nepasuje, **přeruším a doptám se** — drobné odchylky vyřeším v rámci plánu.

---

## Po schválení tohoto plánu

Začnu Fází 0 (Superadmin seed) — paralelně s Fází 1 (BE změny). Reportuju po každé fázi krátkým souhrnem (co hotovo, co dál). Plán slouží jako referenční checklist — neměním ho bez tvého souhlasu.
