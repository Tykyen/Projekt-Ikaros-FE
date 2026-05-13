# Spec 1.7 — Reset hesla, e-mail verifikace, změna e-mailu (mailer integrace)

**Datum:** 2026-05-12
**Status:** ✅ Schváleno + implementováno 2026-05-12 (defaults §9: Q1-A až Q9-A přijaty)
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.7
**Závisí na:** 1.1 (LoginModal), 1.2 (RegisterModal + indikátor síly hesla), 1.3a (`PATCH /users/me`, profile sekce Header + Security), 1.3c (soft-delete hold)
**Předchází:** 1.8 (Přátelé — žádné přímé závislosti, ale notifikace o žádostech se bude opírat o stejný mailer)
**Uzavírá dluhy:** D-006 (reset hesla), D-012 (email verifikace full flow), D-026 (notifikace o username žádosti), D-036 (notifikace o account deletion), D-037 (reset hesla během deletion hold)

---

## 1. Cíl

Postavit **reálnou e-mailovou infrastrukturu** a tři uživatelské flow na ní:

1. **Reset hesla** — uživatel zapomněl heslo → zadá e-mail → klikne na link v mailu → nastaví nové heslo
2. **Verifikace e-mailu** — po registraci dostane uživatel verifikační link; `emailVerified=true` se nastaví po kliknutí
3. **Změna e-mailu** — uživatel zadá nový e-mail v profilu → klikne na link v mailu zaslaném **na nový e-mail** → e-mail se přepne

Sjednoceno pod jeden mailer modul + jednotný **token-hash + TTL** pattern. SMTP provider je vyměnitelný (Resend default → ENV).

---

## 2. Rozsah

### 2.1 V rozsahu 1.7

**BE — mailer infrastruktura:**
- Nahradit stub `MailerService` plnohodnotnou implementací nad `@nestjs-modules/mailer` + `nodemailer`
- SMTP konfigurace přes ENV (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`) — Resend SMTP (`smtp.resend.com:465` / `:587`)
- Handlebars šablony v `backend/src/modules/mailer/templates/*.hbs` — base layout + 4 konkrétní (verify-email, password-reset, email-change, username-decided)
- Dev fallback: pokud `MAIL_HOST` chybí, zachovat **logovací stub** (žádné selhání při startu, log varovně) → vývoj bez SMTP účtu funguje stejně jako dnes
- Best-effort odesílání (`try/catch` v call-site, logger.warn, nikdy throw do response) — pattern už používá `auth.service.register` pro D-012 stub

**BE — token entity (generický pattern):**
- `SecurityToken` schema (Mongoose) s discriminator pole `type: 'password_reset' | 'email_change' | 'email_verify'`
  - `tokenHash` (sha256 hex; **plain token nikdy v DB**), `userId`, `expiresAt`, `usedAt?`, `meta?` (pro `email_change` drží `newEmail`)
  - Compound index `{ tokenHash: 1 }` (lookup), `{ userId: 1, type: 1, usedAt: 1 }` (rate limiting), TTL index na `expiresAt` (Mongo auto-cleanup po expiraci)
- Repository `SecurityTokensRepository` (interface + Mongoose impl + spec)
- Service `SecurityTokensService` — `issue(userId, type, ttl, meta?)` vrátí `plainToken` (předaný do mailu) + persist `hash`; `consume(token, type)` ověří + označí `usedAt` + vrátí `userId/meta`

**BE — password reset flow:**
- `POST /api/auth/forgot-password` (anon, throttle 3/15min/IP) — body `{ email }`
  - Vždy 200 `{ ok: true }` (proti enumeraci — nezdroujeme info zda e-mail existuje)
  - Pokud user existuje a **není** `isDeleted`, vystavíme token TTL 1h (i pro `deletionRequestedAt` → D-037), pošleme mail
  - **Hard-deleted (isDeleted=true)** → bez tokenu, ale stále 200 (nerozlišovat)
- `POST /api/auth/reset-password` (anon, throttle 10/15min/IP) — body `{ token, newPassword }`
  - Ověří hash, zkonzumuje token, nastaví heslo (`bcrypt`), `revokeAllForUser` (rodina refresh tokenů), emit event `user.password.changed`
  - **Reaktivace deletion při resetu (D-037):** pokud user měl `deletionRequestedAt`, reset hesla **současně zruší pending deletion** (stejně jako `/auth/reactivate-deletion`) + vrátí `revertablePromotions` info — viz §3.2 detail
  - Response: `{ ok: true, deletionReactivated?: boolean, revertablePromotions?: [...] }`
  - **NIKDY auto-login** — FE po úspěchu otevře LoginModal

**BE — email verification flow:**
- `POST /api/auth/register` — místo stub tokenu `pending-1.7-${id}` použije `securityTokens.issue(user.id, 'email_verify', 24h)` a pošle reálný mail
- `POST /api/auth/email-verify` (anon, throttle 10/15min/IP) — body `{ token }`
  - Ověří hash, zkonzumuje token, nastaví `User.emailVerified=true` + `emailVerifiedAt=now`
  - Response: `{ ok: true }`
- `POST /api/auth/email-verify/resend` (auth JWT, throttle 3/15min/user) — resend verifikační mail
  - Pokud `user.emailVerified=true` → 400 `ALREADY_VERIFIED`
  - Jinak invaliduje existující `email_verify` tokeny pro usera, vystaví nový, pošle mail
- **Grandfathering:** všichni existující uživatelé (před 1.7 deploy) zůstávají `emailVerified=false` jako dnes (default v `User.schema`), ale jsou **nepenalizováni** — žádný flow je dnes nevyžaduje. Future flow (poslat e-mail z fáze 3.x) si může vyžádat verifikaci a uživatel ji v ten moment provede. **Žádný bulk grandfather → true.**

**BE — email change flow:**
- `POST /api/users/me/email-change-request` (JWT, throttle 3/15min/user) — body `{ newEmail, currentPassword }`
  - **Vyžaduje aktuální heslo** (bezpečnostní kontrola — analogicky jako `changePassword`)
  - Validace: `newEmail` musí být validní + lowercase + nesmí být shodný s aktuálním + nesmí existovat na jiném useru
  - Vystaví token `email_change` TTL 1h s `meta: { newEmail }`, pošle verifikační mail **NA NOVÝ E-MAIL**
  - Response: `{ ok: true, sentTo: newEmailMasked }` (`j****@example.com` — FE jen pro UX confirmation)
- `POST /api/auth/email-change-confirm` (anon, throttle 10/15min/IP) — body `{ token }`
  - Ověří hash, zkonzumuje token, přepne `User.email = meta.newEmail`, nastaví `emailVerified=true` (nový mail je už prokázaný klikem) + `emailVerifiedAt=now`
  - Race: pokud mezitím někdo zaregistroval `newEmail` na svůj účet → 409 `EMAIL_TAKEN`
  - Response: `{ ok: true }`
- **Bezpečnost:** odeslat **informativní mail i na starý e-mail** s textem „Byla podána žádost o změnu e-mailu. Pokud jsi to neudělal/a, kontaktuj administraci." (signál o případném zneužití)

**BE — notifikační maily (D-026, D-036):**
- **Username request decided** (D-026) — po `approveUsernameRequest` / `rejectUsernameRequest` emit event `username-request.decided`; mailer poslouchá → `username-decided.hbs` šablona
- **Account deletion scheduled** (D-036) — po `requestSelfDeletion` / admin moderation delete emit event `account.deletion.scheduled`; mailer poslouchá → `account-deletion.hbs` šablona (info o 30denním hold + jak zrušit)
- Volitelně: account deletion **reverted** mail (pokud admin zruší pending deletion) — nice to have, je-li čas
- **Throttle není** (server-initiated, ne user-triggered) — best-effort odeslání v event handleru

**FE — auth modální flow:**
- `LoginModal` — přidat link **„Zapomněl/a jsi heslo?"** (pod password input, malé písmo) → otevře `ForgotPasswordModal`
- `ForgotPasswordModal` (nová komponenta) — RHF + zod, jediné pole `email`, button „Poslat link" → po `POST /auth/forgot-password` → toast `success` + zavřít modal
- Route `/reset-password?token=...` (anon, lazy) → `ResetPasswordPage` (mounted **mimo** `IkarosLayout` — public úzký layout, ne shell)
  - **Token validation up-front:** FE neoveruje token před POSTem (chrání proti probe leak); rovnou nabídne form
  - Form: `newPassword` + `passwordConfirm` + indikátor síly (reuse z 1.2: `<PasswordStrengthBar />`) + show/hide toggle
  - Po submit `POST /auth/reset-password { token, newPassword }`:
    - 200 → toast „Heslo změněno, přihlas se" → redirect na `/?openLogin=1`
      - Pokud `deletionReactivated=true` → druhý toast „Účet byl současně obnoven ze stavu mazání"
      - Pokud `revertablePromotions?.length` → modal s informací (reuse `RevertablePromotionsModal` pattern z 1.3c reaktivace)
    - 400 `INVALID_TOKEN` / `EXPIRED_TOKEN` → toast + button „Požádat o nový link" (re-open `ForgotPasswordModal`)
    - 400 `WEAK_PASSWORD` → inline field error

**FE — email verifikace:**
- Route `/email-verify?token=...` (anon, lazy) → `EmailVerifyPage` (úzký layout)
  - On-mount auto `POST /auth/email-verify { token }`
  - Stavy: `verifying` (spinner) → `success` (✓ + tlačítko „Pokračovat" → `/` nebo `/?openLogin=1` podle auth stavu) / `failed` (X + button „Poslat verifikaci znovu" pokud JWT, jinak „Přihlas se")
- `ProfilePage` Header karta — nová sekce **„Stav e-mailu"**:
  - Pokud `user.emailVerified=true` → zelený badge „Ověřeno" (statický)
  - Pokud `false` → žlutý badge „Neověřeno" + button **„Poslat verifikaci znovu"** → `POST /auth/email-verify/resend` → toast

**FE — změna e-mailu na profilu:**
- `ProfilePage` Header karta — **odblokovat read-only e-mail z 1.3a:**
  - Vedle e-mailu button „Změnit e-mail" → otevře `ChangeEmailModal`
- `ChangeEmailModal` (nová komponenta) — RHF + zod:
  - Pole: `newEmail`, `currentPassword`, debounced check availability (reuse `useAvailability` z 1.2)
  - Submit `POST /users/me/email-change-request { newEmail, currentPassword }` → toast „Klikni na link v e-mailu pro potvrzení (poslali jsme ho na **j\*\*\*\*@example.com**)"
- Route `/email-change/confirm?token=...` (anon, lazy) → `EmailChangeConfirmPage`
  - On-mount auto `POST /auth/email-change-confirm { token }`
  - Stavy: `verifying` → `success` (toast + redirect na `/ikaros/profil`) / `failed` (s důvody: invalid/expired/taken)

**FE — privacy section (D-045):**
- **Mimo rozsah 1.7** — viz §2.2

### 2.2 Mimo rozsah 1.7

- **D-011 (captcha provider)** — vyžaduje samostatné rozhodnutí PJ o providerovi (hCaptcha vs Turnstile vs Friendly). 1.7 nepřidává captchu do nového flow; pokud bude zneužíváno, řešíme separátním krokem.
- **D-045 (privacy „skrýt mě v adresáři")** — analogický flag k D-052 (`hiddenPresence`), ale samostatný UX/scope. Otevřený dluh, není v 1.7 nutný.
- **Detail e-mailových šablon (vizuální polish, branding)** — 1.7 dodá funkční Handlebars šablony s minimálním HTML. Pretty design (responzivní, dark mode) řešíme následně.
- **Multi-tenant / vlastní doména** — Resend default, vlastní doména přijde s nasazením prod (vyžaduje DNS).
- **2FA / 2-step verifikace** — out-of-scope, samostatný spec až po MVP.
- **Magic-link login** (heslo-méně přihlášení) — out-of-scope.
- **Notifikace o ban / unban** — nepriorita, separátní D pokud bude potřeba.
- **Account deletion reverted mail** — nice to have, je-li čas; jinak D-NEW.
- **Privacy toggle pro mailing preferences** (opt-out z non-essential) — v MVP fázi všechny maily jsou essential (security/account); separátní krok pokud přijdou marketing/digest.

---

## 3. Datový kontrakt (BE)

### 3.1 SecurityToken schema

```ts
type SecurityTokenType = 'password_reset' | 'email_change' | 'email_verify';

interface SecurityToken {
  _id: ObjectId;
  type: SecurityTokenType;
  userId: ObjectId;
  tokenHash: string;          // sha256(plainToken), hex
  expiresAt: Date;            // TTL index — Mongo auto-purge
  usedAt?: Date;              // null = nepoužitý; jakmile usedAt, nelze znovu
  meta?: {
    newEmail?: string;        // jen pro 'email_change'
  };
  createdAt: Date;
}
```

**Token generace:** `crypto.randomBytes(32).toString('hex')` (64-char hex string) → `sha256` hash do DB → plain do URL (`/reset-password?token=<plain>`).

**TTL per type:**
- `password_reset`: 1 h
- `email_change`: 1 h
- `email_verify`: 24 h

### 3.2 Reset hesla — reaktivace deletion (D-037)

Pokud user má `deletionRequestedAt != null` v okamžiku `POST /auth/reset-password`:

1. Reset hesla projde normálně (heslo se přepíše).
2. **Současně** vyčistíme `deletionRequestedAt/By/Reason/Promotions` (stejný atomický update jako v `reactivateDeletion`).
3. `banCache.invalidate(userId)`.
4. Vrátíme `{ ok: true, deletionReactivated: true, revertablePromotions }`.
5. Audit event `user.deletion.reactivated` (D-035) — reuse stávajícího event handleru.

**Důvod:** uživatel zapomněl heslo, dostal verifikační link na svůj e-mail = prokázal vlastnictví účtu = stejná úroveň důvěry jako login + reactivate. Bez tohoto chování by user s pending deletion uvízl: nemohl by se přihlásit (LoginModal switch na reactivate vyžaduje heslo, které nezná) a reset by mu vrátil přístup, ale účet by stále směřoval k hard-delete.

**Hard-deleted (`isDeleted=true`)** zůstává blokované — reset endpoint NEvystavuje token pro hard-deleted účet (forgot-password vrátí 200 ale nic nepošle).

### 3.3 REST kontrakty

| Method | Path | Auth | Throttle | Body | Response |
|---|---|---|---|---|---|
| POST | `/auth/forgot-password` | anon | 3/15min/IP | `{ email: string }` | `200 { ok: true }` (always) |
| POST | `/auth/reset-password` | anon | 10/15min/IP | `{ token, newPassword }` | `200 { ok, deletionReactivated?, revertablePromotions? }` / `400 INVALID_TOKEN \| EXPIRED_TOKEN \| WEAK_PASSWORD` |
| POST | `/auth/email-verify` | anon | 10/15min/IP | `{ token }` | `200 { ok: true }` / `400 INVALID_TOKEN \| EXPIRED_TOKEN \| ALREADY_USED` |
| POST | `/auth/email-verify/resend` | JWT | 3/15min/user | — | `200 { ok: true }` / `400 ALREADY_VERIFIED` |
| POST | `/users/me/email-change-request` | JWT | 3/15min/user | `{ newEmail, currentPassword }` | `200 { ok, sentTo: <masked> }` / `400 INVALID_PASSWORD \| SAME_EMAIL \| INVALID_FORMAT` / `409 EMAIL_TAKEN` |
| POST | `/auth/email-change-confirm` | anon | 10/15min/IP | `{ token }` | `200 { ok: true }` / `400 INVALID_TOKEN \| EXPIRED_TOKEN \| ALREADY_USED` / `409 EMAIL_TAKEN` |

**Error code policy** — vždy `{ statusCode, code, message }` (návaznost na D-009).

### 3.4 Email šablony (Handlebars `.hbs`)

| Šablona | Subject | Trigger | Příjemce |
|---|---|---|---|
| `verify-email.hbs` | „Ověř svůj e-mail — Projekt Ikaros" | `register` + `email-verify/resend` | nový/existující e-mail |
| `password-reset.hbs` | „Reset hesla — Projekt Ikaros" | `forgot-password` | aktuální e-mail |
| `email-change.hbs` | „Potvrď změnu e-mailu — Projekt Ikaros" | `email-change-request` | **NOVÝ** e-mail |
| `email-change-notice.hbs` | „Žádost o změnu e-mailu — Projekt Ikaros" | `email-change-request` | **STARÝ** e-mail (info, žádný odkaz) |
| `username-decided.hbs` | „Tvá žádost o přezdívku byla rozhodnuta" | event `username-request.decided` (D-026) | uživatel |
| `account-deletion.hbs` | „Účet naplánován ke smazání" | event `account.deletion.scheduled` (D-036) | uživatel |

**Base layout** (`base.hbs`) — sdílená hlavička s logem + footer. Plain HTML, žádný JS, žádné external assets (logo inline SVG / base64 mini-PNG). Wide compatibility (Gmail, Outlook).

---

## 4. UI — modaly + stránky

### 4.1 LoginModal — link na reset

Pod password input, vlevo:

```
Heslo: [____________] [👁]
       Zapomněl/a jsi heslo?  ← link, otevírá ForgotPasswordModal
```

`ForgotPasswordModal` (jeden input + button) — stejný theme/3D styl jako LoginModal.

### 4.2 ResetPasswordPage (`/reset-password?token=...`)

Standalone úzký layout (BÚ analogicky `AuthLayout` smazaný v 1.1 → nyní reuse `IkarosLayout` ale s `<main>` centered + sidebar skrytý? Nebo nový mini-layout?).

**Rozhodnutí:** **Reuse `IkarosLayout` jako public shell**, content jen `<ResetPasswordForm />` centered. Žádný nový layout — konzistence s public shellem z 1.1.

Form:
```
┌─ Resetovat heslo ───────────┐
│  Nové heslo: [____] [👁]    │
│  ▓▓▓▓░░░░ (síla)             │
│  Potvrzení: [____] [👁]      │
│                              │
│  [   Nastavit nové heslo ]   │
└──────────────────────────────┘
```

Po success → toast + redirect `/?openLogin=1` (deep-link reuse z 1.1).

### 4.3 EmailVerifyPage (`/email-verify?token=...`)

Stejný shell. Auto-fire `POST /auth/email-verify` on mount.

```
┌─ Ověření e-mailu ───────────┐
│  ✓ E-mail úspěšně ověřen!    │
│                              │
│  [   Pokračovat   ]          │
└──────────────────────────────┘
```

### 4.4 ChangeEmailModal (z profilu)

```
┌─ Změnit e-mail ─────────────┐
│  Aktuální: jan@example.com   │
│  Nový e-mail: [____] ✓       │
│  Aktuální heslo: [____] [👁] │
│                              │
│  [ Zrušit ]  [ Odeslat link ]│
└──────────────────────────────┘
```

Po success → toast + zavřít. Žádný redirect.

### 4.5 EmailChangeConfirmPage (`/email-change/confirm?token=...`)

Stejný shell jako EmailVerifyPage. Auto-fire POST, stavy `verifying / success / failed`.

### 4.6 ProfilePage — stav e-mailu

V Header kartě, vedle e-mail řádku:

```
E-mail:   jan@example.com   [✓ Ověřeno]      ← zeleny badge

         nebo

E-mail:   jan@example.com   [⚠ Neověřeno]  [Poslat znovu]
                              ↑ žluty badge
```

A pod tím „Změnit e-mail" button (otevírá ChangeEmailModal).

### 4.7 Responsive (per `base.md`)

- ForgotPasswordModal / ChangeEmailModal: mobilní fullscreen overlay (≤768px), desktop ~400px wide modal — analogicky LoginModal/RegisterModal
- ResetPasswordPage / EmailVerifyPage: centered card, max-width 480px, padding adaptivní `clamp(16px, 4vw, 32px)`
- Po každé UI změně spustit skill `mobil-desktop` (per `base.md`)

---

## 5. Otevřené otázky (rozhodnout před implementací)

**Q1 — Reset hesla během deletion hold (D-037):** auto-reaktivace ANO/NE?
- (A) **ANO** — reset hesla = prokázané vlastnictví = stejná důvěra jako login+reactivate. Bez toho user s pending deletion uvízne. **Doporučení.**
- (B) NE — reset jen heslo, deletion zůstává; user pak ručně v LoginModalu projde reactivate flow. Bezpečnější ale neintuitivní.

**Q2 — Forgot password při `isDeleted=true`:** vrátit 200 (proti enumeraci) NEBO 400?
- (A) **200 jako pro neexistujícího usera** — žádný token, žádný mail, ale stejný response. **Doporučení** (anti-enumeration; isDeleted je tombstone, účet už neexistuje).
- (B) 400 `ACCOUNT_DELETED` — explicitní info. Leakuje existenci účtu před hard-delete.

**Q3 — Email verify resend kde?** Profile sekce ANO/NE?
- (A) **Profile Header karta** — vždy viditelný stav + button. **Doporučení.**
- (B) Jen LoginModal pop-up („tvůj e-mail není ověřen — chceš poslat link?") — invazivní, ne intuitivní.
- (C) Obojí — overkill.

**Q4 — Email verify gating:** vyžadovat ověřený e-mail pro něco v 1.7?
- (A) **NE** — ověření je pasivní (badge + možnost resendu); žádný flow nepřinucuje. **Doporučení** (žádné existující flow to nevyžaduje a grandfathering by jinak rozbil platform).
- (B) ANO pro něco konkrétního (např. „nemůžeš si měnit e-mail dokud nepotvrdíš aktuální") — komplexní edge cases.

**Q5 — Auto-login po reset hesla:** ANO/NE?
- (A) **NE — `?openLogin=1` redirect** (bezpečnostní convention: vědomé přihlášení). **Doporučení** (industry standard).
- (B) ANO — UX rychlejší, ale slabší security signal.

**Q6 — Notifikační mail při admin moderation delete:** poslat?
- (A) **ANO** — uživatel se musí dozvědět, že admin mu naplánoval smazání (povinné GDPR transparency). **Doporučení.**
- (B) NE — admin context, ručně mu napíše. Necitlivé.

**Q7 — Mail provider default:**
- (A) **Resend SMTP** (rozhodnuto v roadmap-fe.md). **Doporučení.**
- (B) Něco jiného — vyžaduje úvodní účet.

**Q8 — Token TTL hodnoty:**
- (A) **Reset 1h, change 1h, verify 24h** (verify je nice-to-have, ne security-critical). **Doporučení.**
- (B) Všechno 1h — bezpečnější, ale user může minout verify link v UPS / spamu.

**Q9 — Email change request — vyžadovat current password?**
- (A) **ANO** — analogicky `changePassword`, brání hijack přes ukradenou session. **Doporučení.**
- (B) NE — UX rychlejší, ale slabší.

---

## 6. Akceptační kritéria

### 6.1 Funkční — password reset

1. User klikne „Zapomněl jsi heslo?" v LoginModal → otevře se `ForgotPasswordModal`
2. Po submitu validního e-mailu obdrží mail s linkem (v dev: log)
3. Klik na link otevře `/reset-password?token=...` se formem
4. Po validním resetu se v BE: heslo přehashed, refresh tokens revoked, token marked used
5. FE redirect na `/?openLogin=1` + toast „Heslo změněno"
6. Token použitý podruhé → 400 `ALREADY_USED`
7. Token po expiraci (>1h) → 400 `EXPIRED_TOKEN`
8. Neznámý token → 400 `INVALID_TOKEN`
9. Forgot-password s neexistujícím e-mailem → 200 ok, žádný mail (anti-enumeration)
10. **Deletion hold reaktivace (D-037):** reset hesla u usera s `deletionRequestedAt` současně zruší pending deletion + vrátí `revertablePromotions`

### 6.2 Funkční — email verify

1. Po registraci je odeslán verifikační mail (real SMTP, ne stub)
2. Klik na link otevře `/email-verify?token=...` → auto-POST → `User.emailVerified=true`
3. ProfilePage zobrazuje stav badge (Ověřeno / Neověřeno + resend tlačítko)
4. Resend funguje jen pro `emailVerified=false`, throttle 3/15min/user
5. Verify TTL 24h
6. Existující uživatelé bez verify (před 1.7) mají badge „Neověřeno" + funkční resend (žádný negative impact)

### 6.3 Funkční — email change

1. ProfilePage „Změnit e-mail" otevře modal
2. Validace: format, lowercase, dostupnost, neshoda s aktuálním, správné currentPassword
3. Po submitu se odešle mail **NA NOVÝ E-MAIL** + info mail na starý
4. Klik na link v novém mailu → `/email-change/confirm?token=...` → user.email se přepne + `emailVerified=true`
5. Race: jiný user mezitím zaregistroval newEmail → 409 EMAIL_TAKEN při confirm
6. Token TTL 1h
7. Po confirm refresh `useMyProfile` invalidate (BE vrací nový email) — FE okamžitě zobrazí

### 6.4 Funkční — notifikační maily

1. Username approve → mail příjemce s textem rozhodnutí (link na profil) — D-026 ✅
2. Username reject → mail s důvodem (pokud zadán) — D-026 ✅
3. Self-delete request → mail s instrukcemi „máš 30 dní, jak zrušit: ..." — D-036 ✅
4. Admin moderation delete → mail user s důvodem (povinné `reason` z 1.3c) — D-036 ✅

### 6.5 Bezpečnost

- **Token v DB jen jako sha256 hash** — plain leakuje jen jednou v URL
- **Tokens single-use** — `usedAt` markováno atomicky se side-effects (transaction není nutná pro Mongo, ale pořadí ops `consume → side-effect`)
- **Anti-enumeration na forgot-password** — vždy 200
- **Throttle na všech endpointech** — viz §3.3
- **Reset hesla → revoke all refresh tokens** — reuse `user.password.changed` event
- **Email change vyžaduje currentPassword** — Q9-A
- **Info mail na starý e-mail při change** — signál o případném zneužití
- **TTL index na `SecurityToken.expiresAt`** — Mongo auto-cleanup expired tokens
- **Žádný auto-login po reset hesla** — Q5-A

### 6.6 Performance

- TTL index na `expiresAt` (Mongo background sweep)
- Email odeslání async (non-blocking response — Promise queue, ne await) — BE response < 200ms i při SMTP delay
- SMTP `try/catch` warn → nikdy 500 do FE kvůli mail selhání

### 6.7 Testy

**BE — nové testy (cíl ~50):**
- `SecurityTokensService.spec` — issue/consume happy + edge (expired, used, wrong type, not found) — 10
- `auth.controller.spec` rozšíření — forgot-password (200 always, mail call), reset-password (success, expired, invalid, used, weak, deletion-reactivate) — 10
- `auth.controller.spec` — email-verify (success, expired, used, invalid) + resend (success, already-verified, throttle) — 7
- `users.controller.spec` — email-change-request (success, wrong password, same email, taken, invalid format) — 5
- `auth.controller.spec` — email-change-confirm (success, expired, taken-race) — 4
- `MailerService.spec` — template rendering (Handlebars compile + variables), provider fallback (no SMTP env → stub mode) — 5
- E2E `auth-password-reset.e2e.spec.ts` — full flow forgot → mail capture → reset → login s novým — 3
- E2E `auth-email-verify.e2e.spec.ts` — register → verify token → login — 2
- E2E `email-change.e2e.spec.ts` — request → confirm → check user.email — 2
- E2E `password-reset-deletion-hold.e2e.spec.ts` (D-037) — request deletion → forgot → reset → check pending cleared — 2

**FE — nové testy (cíl ~30):**
- `ForgotPasswordModal.spec.tsx` — render, submit, toast — 4
- `ResetPasswordPage.spec.tsx` — token from query, submit success/expired/invalid, password strength — 6
- `EmailVerifyPage.spec.tsx` — auto-fire, states, retry — 4
- `ChangeEmailModal.spec.tsx` — validation, availability, password check, submit — 5
- `EmailChangeConfirmPage.spec.tsx` — auto-fire, states — 3
- `useForgotPassword.spec.ts` / `useResetPassword.spec.ts` / `useEmailChange.spec.ts` — 6
- `forgotPasswordSchema.spec.ts` / `resetPasswordSchema.spec.ts` / `changeEmailSchema.spec.ts` — 4

---

## 7. Architektonické důsledky

- **První „outbound integrace"** platformy — externí provider (Resend SMTP). Pattern (env config + provider abstraction + best-effort + dev fallback) bude reusován pro budoucí third-party (push notifs 13.2, atd.).
- **`SecurityToken` univerzální schema** — připravený na další typy (`magic_link`, `unsubscribe`, ...) bez nutnosti nového modulu.
- **Mail provider abstraction** — `@nestjs-modules/mailer` umožňuje swap transporteru beze změny call-site.
- **Event-driven notifikační maily** — `EventEmitter2` (už používán pro audit log) → mailer poslouchá. Nikdy nesvazuje response čas s mail odesláním.
- **Šablony jako repo asset** — `.hbs` v `backend/src/modules/mailer/templates/` (NOT v public folderu). Build vyžaduje copy assets — viz §8.

---

## 8. Závislosti a deploy

**npm balíčky (BE):**
- `@nestjs-modules/mailer` — Nest wrapper
- `nodemailer` — SMTP klient
- `handlebars` — template engine (peer dep `nestjs-modules/mailer`)
- `@types/nodemailer` (dev)

**ENV (BE) — nové:**
- `MAIL_HOST=smtp.resend.com`
- `MAIL_PORT=465` (TLS) nebo `587` (STARTTLS)
- `MAIL_USER=resend` (Resend username pattern)
- `MAIL_PASS=re_XXXXXXXX` (Resend API key jako password — žádné jiné credentials)
- `MAIL_FROM=Projekt Ikaros <no-reply@projekt-ikaros.cz>` (vyžaduje verified domain v Resend, jinak `onboarding@resend.dev` test)
- `FRONTEND_URL=http://localhost:5173` (už existuje pro stub mailer)

**ENV (FE) — žádné nové.**

**Build:**
- `backend/nest-cli.json` — `assets: ["modules/mailer/templates/**/*.hbs"]` pro copy do `dist/`

**Deploy gate:**
- Resend účet + verified domain (PJ založí před deployem)
- Test mailu na `tykytanjunior@gmail.com` (superadmin) ručně po deploy
- ENV check: pokud `MAIL_HOST` chybí → log warn + stub mode (žádný start failure)

**Dluhy zavírá:**
- D-006 (reset hesla) ✅
- D-012 (e-mail verifikace full flow) ✅
- D-026 (notifikace o username žádosti) ✅
- D-036 (notifikace o account deletion) ✅
- D-037 (reset hesla během deletion hold) ✅

---

## 9. Doporučení (defaults pokud user nezasáhne)

- Q1 → **(A)** Reaktivace deletion při resetu hesla ANO (D-037)
- Q2 → **(A)** 200 pro `isDeleted=true` (anti-enumeration)
- Q3 → **(A)** Email verify resend v ProfilePage Header kartě
- Q4 → **(A)** Žádné verify gating v 1.7
- Q5 → **(A)** Bez auto-loginu po reset hesla
- Q6 → **(A)** Mail při admin moderation delete ANO
- Q7 → **(A)** Resend SMTP
- Q8 → **(A)** Reset/change 1h, verify 24h
- Q9 → **(A)** Email change vyžaduje currentPassword

---

## 10. Stručný checklist před schválením

- [ ] PJ má (nebo založí) Resend účet a verified domain — JINAK 1.7 zůstává v stub mode (vývoj funguje, prod ne)
- [ ] PJ odsouhlasí Q1 — auto-reaktivace deletion při resetu (D-037)
- [ ] PJ odsouhlasí Q5 — žádný auto-login po resetu (security default)
- [ ] PJ odsouhlasí Q9 — currentPassword pro email change
- [ ] Rozsah notifikačních mailů (Q6) — admin delete ANO/NE
