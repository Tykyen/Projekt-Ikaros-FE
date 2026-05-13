# Plán 1.7 — Reset hesla, e-mail verifikace, změna e-mailu (mailer integrace)

**Datum:** 2026-05-12
**Status:** ✅ Implementováno 2026-05-12 (BE 960 testů ✓, FE 240 testů ✓, tsc ✓, lint ✓, lint:colors ✓, build ✓)
**Spec:** `docs/arch/phase-1/spec-1.7.md` ✅ schváleno 2026-05-12 (defaults §9: Q1-A až Q9-A — všechny doporučené)
**Pořadí prací:** BE mailer foundation → BE SecurityToken → BE password reset → BE email verify → BE email change → BE notifikační maily → FE password reset → FE email verify → FE email change → cleanup/docs

---

## 0. Předpoklady (ověřit před startem)

1. **BE** má `MailerModule` jako global stub (potvrzeno — `backend/src/modules/mailer/mailer.module.ts` s `@Global()`)
2. **BE** `MailerService.sendEmailVerification` + `sendPasswordReset` API už existuje (stub) — zachovat **API tvar** (pro existující call-site z `auth.service.register`), uvnitř přepsat na reálný transport
3. **BE** `EventEmitter2` je globálně dostupný (audit log, password.changed event) — reuse pro notifikační maily
4. **BE** `ConfigService` čte `FRONTEND_URL` (potvrzeno — `mailer.service.ts:27`)
5. **FE** `LoginModal` má `openLoginModalAtom` pattern (potvrzeno — `RegisterModal.tsx` ho používá)
6. **FE** `useAvailability` hook reusable pro email check (potvrzeno — `features/auth/api/useAvailability.ts`)
7. **FE** `PasswordStrengthIndicator` reusable z 1.2 (potvrzeno — `features/auth/components/PasswordStrengthIndicator.tsx`)
8. **FE** router používá `requireAuth` per-route loader + `IkarosLayout` jako public shell (potvrzeno — `src/app/router.tsx:70`)

Pokud kterýkoliv bod neplatí — pozastavit a komunikovat.

---

## 1. Pre-flight checklist

### 1.1 BE — npm závislosti k instalaci
- [ ] `@nestjs-modules/mailer` (Nest wrapper)
- [ ] `nodemailer` (SMTP klient)
- [ ] `@types/nodemailer` (dev)
- [ ] `handlebars` (peer dep, ověřit verzi)

### 1.2 BE — ENV nové
Doplnit do `.env.example` + lokální `.env`:
- `MAIL_HOST=smtp.resend.com`
- `MAIL_PORT=465`
- `MAIL_USER=resend`
- `MAIL_PASS=` *(prázdné = stub mode pro dev)*
- `MAIL_FROM=Projekt Ikaros <onboarding@resend.dev>`

### 1.3 BE — nest-cli.json
- [ ] Přidat `"assets": [{ "include": "modules/mailer/templates/**/*.hbs", "outDir": "dist" }]` (nebo equivalent — ověřit existující strukturu)

### 1.4 FE — npm závislosti
- Žádné nové (vše reusable)

### 1.5 FE — `src/shared/types/index.ts`
- [ ] Doplnit typ `User.emailVerified` + `emailVerifiedAt` (pokud zatím chybí ve FE typu — BE už to má)

### 1.6 CSS tokens
Žádné nové theme tokeny v 1.7 (reuse existujících `--color-success`, `--color-warning`, `--color-danger` pro badge stavy).

---

## 2. Backend — Fáze A: Mailer foundation

> Pracovní adresář BE: `C:\Matrix\ProjektIkaros\Projekt-ikaros\backend`

### 2.1 Instalace závislostí
```bash
npm i @nestjs-modules/mailer nodemailer handlebars
npm i -D @types/nodemailer
```

### 2.2 `mailer.module.ts` — přepojit na `@nestjs-modules/mailer`

**Soubor:** `backend/src/modules/mailer/mailer.module.ts`

- Importovat `MailerModule as NestMailerModule` z `@nestjs-modules/mailer`
- `forRootAsync` config:
  - `transport`: pokud `MAIL_HOST` chybí nebo prázdné `MAIL_PASS` → `null` (stub mode, log only)
  - jinak `nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })`
  - `defaults`: `{ from: MAIL_FROM }`
  - `template`: Handlebars adapter, `dir: join(__dirname, 'templates')`
- Zachovat `@Global()` + export naší `MailerService` (která wrapne Nest mailer)

### 2.3 `mailer.service.ts` — nahradit stub reálnou implementací

**Soubor:** `backend/src/modules/mailer/mailer.service.ts`

- Inject `NestMailerService` (z `@nestjs-modules/mailer`)
- Detekce stub mode: `const isStub = !config.get('MAIL_PASS')` → log only (zachovat existující stub log pattern pro dev)
- Veřejné metody (nové + rozšíření existujících):
  - `sendEmailVerification({ to, username, token })` — template `verify-email`, context `{ username, verifyUrl }`
  - `sendPasswordReset({ to, username, token })` — template `password-reset`, context `{ username, resetUrl }`
  - `sendEmailChangeConfirm({ to, username, token })` — template `email-change`, context `{ username, confirmUrl }`
  - `sendEmailChangeNotice({ to, username, newEmailMasked })` — template `email-change-notice`, žádný link
  - `sendUsernameDecided({ to, username, status, newUsername, reason })` — template `username-decided`
  - `sendAccountDeletionScheduled({ to, username, scheduledHardDeleteAt, reason, byAdmin })` — template `account-deletion`
- **Best-effort wrapper:** všechny metody `try/catch` → `logger.warn` (NIKDY throw)
- **URL helper:** `private buildUrl(path, token)` → `${frontendUrl}${path}?token=${encodeURIComponent(token)}`

### 2.4 Handlebars šablony

**Nový adresář:** `backend/src/modules/mailer/templates/`

- `base.hbs` — sdílený HTML layout (head + body wrapper s nadpisem + footer)
  - Inline CSS pro email-client kompatibilitu
  - Logo: inline `<svg>` nebo text fallback („Projekt Ikaros")
  - Footer: „Tento e-mail je automatický, neodpovídej. Helpdesk: ..."
- `verify-email.hbs` — extends base, slot:
  ```
  Ahoj {{username}}, klikni pro ověření e-mailu:
  [BUTTON: Ověřit e-mail → {{verifyUrl}}]
  Link platí 24 hodin.
  ```
- `password-reset.hbs` — `Ahoj {{username}}, klikni pro reset hesla: ... Link platí 1 hodinu. Pokud jsi reset nepožadoval/a, ignoruj tento e-mail.`
- `email-change.hbs` — `Ahoj {{username}}, potvrzuješ změnu e-mailu na tuto adresu... Link platí 1 hodinu.`
- `email-change-notice.hbs` — `Ahoj {{username}}, někdo požádal o změnu tvého e-mailu na {{newEmailMasked}}. Pokud jsi to neudělal/a, okamžitě změň heslo. Link na změnu hesla: ...`
- `username-decided.hbs` — větvení `{{#if approved}}` / `{{else}}` (rejected s `{{reason}}`)
- `account-deletion.hbs` — `Tvůj účet je naplánován ke smazání {{scheduledHardDeleteAt}}. Jak zrušit: přihlas se a klikni „Obnovit účet". {{#if byAdmin}}Důvod správce: {{reason}}{{/if}}`

> **Pozn.:** Šablony minimalistické, bez external CSS, žádné obrázky kromě inline SVG/text. Branding upgrade je out-of-scope (§2.2 spec).

### 2.5 `nest-cli.json` — assets

**Soubor:** `backend/nest-cli.json`

- Přidat `assets` blok aby `.hbs` šablony skončily v `dist/`:
  ```json
  "compilerOptions": {
    "assets": [{ "include": "modules/mailer/templates/**/*.hbs", "outDir": "dist" }],
    "watchAssets": true
  }
  ```

### 2.6 ENV doplnění

**Soubor:** `backend/.env.example` (a lokální `.env`)
- Přidat MAIL_* proměnné (§1.2)
- Komentář: „Prázdné `MAIL_PASS` = stub mode pro dev"

### 2.7 Test — `mailer.service.spec.ts`

**Nový soubor:** `backend/src/modules/mailer/mailer.service.spec.ts`
- Test 1: stub mode (no MAIL_PASS) → log only, žádné selhání
- Test 2: real mode → `NestMailerService.sendMail` mock je zavoláno s correct template + context
- Test 3: template render fails → `logger.warn`, žádný throw
- Test 4: URL builder produces `?token=<encoded>` s `encodeURIComponent`
- Test 5: každý public method (6) — mock NestMailerService a ověř template name + context fields

---

## 3. Backend — Fáze B: SecurityToken infrastruktura

### 3.1 Schema

**Nový soubor:** `backend/src/modules/security-tokens/schemas/security-token.schema.ts`

```ts
@Schema({ collection: 'security_tokens', timestamps: true })
export class SecurityTokenSchemaClass {
  @Prop({ required: true, enum: ['password_reset', 'email_change', 'email_verify'] })
  type: SecurityTokenType;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, unique: true, index: true })
  tokenHash: string;       // sha256(plainToken), hex

  @Prop({ required: true, index: { expireAfterSeconds: 0 } })
  expiresAt: Date;          // TTL index — Mongo auto-purge

  @Prop()
  usedAt?: Date;

  @Prop({ type: Object })
  meta?: { newEmail?: string };
}
```

Indexy:
- `{ tokenHash: 1 }` (unique, primary lookup)
- `{ userId: 1, type: 1, usedAt: 1 }` (rate limiting + cleanup-on-issue)
- TTL `{ expiresAt: 1 }` — Mongo auto-cleanup

### 3.2 Interface + Repository

**Nové soubory:**
- `backend/src/modules/security-tokens/interfaces/security-token.interface.ts`
- `backend/src/modules/security-tokens/interfaces/security-tokens-repository.interface.ts`
- `backend/src/modules/security-tokens/repositories/security-tokens.repository.ts`

Repo API:
- `save(input)` — insert
- `findByHash(tokenHash)` — pro lookup at consume time
- `markUsed(id, now)`
- `invalidateAllByUserAndType(userId, type)` — při resend
- `deleteExpired()` — fallback, Mongo TTL by měl zvládnout

### 3.3 Service

**Nový soubor:** `backend/src/modules/security-tokens/security-tokens.service.ts`

```ts
@Injectable()
export class SecurityTokensService {
  constructor(@Inject('ISecurityTokensRepository') private readonly repo) {}

  async issue(userId: string, type: SecurityTokenType, ttlMs: number, meta?: SecurityTokenMeta) {
    await this.repo.invalidateAllByUserAndType(userId, type);  // jen 1 active per type per user
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
    const expiresAt = new Date(Date.now() + ttlMs);
    await this.repo.save({ type, userId, tokenHash, expiresAt, meta });
    return plainToken;
  }

  async consume(plainToken: string, type: SecurityTokenType): Promise<{ userId: string; meta?: SecurityTokenMeta }> {
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
    const record = await this.repo.findByHash(tokenHash);
    if (!record) throw new BadRequestException({ code: 'INVALID_TOKEN', message: 'Token neplatný' });
    if (record.type !== type) throw new BadRequestException({ code: 'INVALID_TOKEN', message: 'Token neplatný' });
    if (record.usedAt) throw new BadRequestException({ code: 'ALREADY_USED', message: 'Token byl již použit' });
    if (record.expiresAt.getTime() < Date.now()) throw new BadRequestException({ code: 'EXPIRED_TOKEN', message: 'Token vypršel' });
    await this.repo.markUsed(record.id, new Date());
    return { userId: record.userId, meta: record.meta };
  }
}
```

### 3.4 Module

**Nový soubor:** `backend/src/modules/security-tokens/security-tokens.module.ts`

- `@Global()` — service injektovat všude
- Imports: `MongooseModule.forFeature([SecurityTokenSchemaClass])`
- Providers: service + repository injection token
- Exports: service

### 3.5 Test — `security-tokens.service.spec.ts`

**Nový soubor:** stejný adresář
- 10 testů: issue/consume happy + expired + used + not-found + wrong-type + invalidateAllByUserAndType + meta roundtrip + hash determinism + random uniqueness

### 3.6 Integrace v `app.module.ts`
- Importovat `SecurityTokensModule` mezi existující globální moduly

---

## 4. Backend — Fáze C: Password reset flow

### 4.1 DTOs

**Nové soubory v `backend/src/modules/auth/dto/`:**
- `forgot-password.dto.ts` — `{ @IsEmail() email: string }`
- `reset-password-token.dto.ts` — `{ @IsString() token: string; @IsString() @MinLength(8) @MaxLength(128) newPassword: string }`
  - **Pozn.:** existující `users/dto/reset-password.dto.ts` je pro Superadmin endpoint `PUT /:id/reset-password` (vyžaduje `newPassword` jen) — NECHAT beze změny, nová DTO má jiný shape (anon endpoint, vyžaduje token)

### 4.2 AuthController — nové endpointy

**Soubor:** `backend/src/modules/auth/auth.controller.ts`

```ts
@Post('forgot-password')
@Throttle({ default: { ttl: 15 * 60_000, limit: 3 } })
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Zahájit reset hesla (vždy 200, anti-enumeration)' })
forgotPassword(@Body() dto: ForgotPasswordDto) {
  return this.authService.forgotPassword(dto.email);
}

@Post('reset-password')
@Throttle({ default: { ttl: 15 * 60_000, limit: 10 } })
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Dokončit reset hesla pomocí tokenu z e-mailu' })
resetPassword(@Body() dto: ResetPasswordTokenDto) {
  return this.authService.resetPasswordByToken(dto.token, dto.newPassword);
}
```

### 4.3 AuthService — `forgotPassword(email)`

```ts
async forgotPassword(email: string): Promise<{ ok: true }> {
  const user = await this.usersRepo.findByEmail(email.toLowerCase());
  // anti-enumeration — vždy 200 ok
  if (!user || user.isDeleted) return { ok: true };

  // D-037: nabídka resetu i pro pending deletion
  const plainToken = await this.securityTokens.issue(user.id, 'password_reset', 60 * 60_000);  // 1h
  try {
    await this.mailer.sendPasswordReset({ to: user.email, username: user.username, token: plainToken });
  } catch (err) {
    this.logger.warn(`Mailer reset hesla selhal: ${(err as Error).message}`);
  }
  return { ok: true };
}
```

### 4.4 AuthService — `resetPasswordByToken(token, newPassword)`

```ts
async resetPasswordByToken(token: string, newPassword: string): Promise<{ ok: true; deletionReactivated?: boolean; revertablePromotions?: ... }> {
  const { userId } = await this.securityTokens.consume(token, 'password_reset');
  const user = await this.usersRepo.findById(userId);
  if (!user) throw new BadRequestException({ code: 'INVALID_TOKEN', message: 'Token neplatný' });
  if (user.isDeleted) throw new BadRequestException({ code: 'INVALID_TOKEN', message: 'Účet neexistuje' });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const updates: Partial<User> = { passwordHash };

  // D-037 — auto-reaktivace pending deletion
  let deletionReactivated = false;
  let revertablePromotions: ... | undefined;
  if (user.deletionRequestedAt) {
    revertablePromotions = user.deletionPromotions ?? [];
    Object.assign(updates, {
      deletionRequestedAt: undefined,
      deletionRequestedBy: undefined,
      deletionReason: undefined,
      deletionPromotions: [],
    });
    deletionReactivated = true;
  }

  await this.usersRepo.update(user.id, updates);
  if (deletionReactivated) this.banCache.invalidate(user.id);

  await this.refreshRepo.revokeAllForUser(user.id);  // bezpečnost — všechny session pryč
  this.eventEmitter.emit('user.password.changed', { userId: user.id });

  if (deletionReactivated) {
    this.eventEmitter.emit('user.deletion.reactivated', {
      userId: user.id,
      username: user.username,
      previousDeletionRequestedAt: user.deletionRequestedAt,
    });
  }

  return {
    ok: true,
    deletionReactivated: deletionReactivated || undefined,
    revertablePromotions: revertablePromotions?.length ? revertablePromotions : undefined,
  };
}
```

### 4.5 AuthModule — DI
- Importovat `SecurityTokensModule` (už `@Global` — netřeba explicit, ale connectivity check)
- Žádné nové providers

### 4.6 Test — `auth.service.spec.ts` rozšíření
- `forgotPassword`: existující user → token issued + mail sent / unknown → no token, ok 200 / isDeleted → no token, ok 200
- `resetPasswordByToken`: happy → password updated + tokens revoked / invalid token → 400 INVALID_TOKEN / expired → 400 EXPIRED_TOKEN / used → 400 ALREADY_USED / D-037: deletion-pending user → password updated + deletion cleared + event emitted + revertablePromotions returned

**Cíl:** +12 testů

### 4.7 E2E — `auth-password-reset.e2e.spec.ts`
**Nový soubor:** `backend/test/auth-password-reset.e2e.spec.ts`
- 3 testy: full flow forgot → mail capture (spy on mailer) → token extract → reset → login s novým heslem
- D-037 flow: request deletion → forgot → reset → ověř `deletionRequestedAt=null`

---

## 5. Backend — Fáze D: Email verify flow

### 5.1 DTOs

**Nové soubory v `backend/src/modules/auth/dto/`:**
- `email-verify.dto.ts` — `{ @IsString() token: string }`

### 5.2 AuthController — nové endpointy

```ts
@Post('email-verify')
@Throttle({ default: { ttl: 15 * 60_000, limit: 10 } })
@HttpCode(HttpStatus.OK)
emailVerify(@Body() dto: EmailVerifyDto) {
  return this.authService.verifyEmail(dto.token);
}

@Post('email-verify/resend')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { ttl: 15 * 60_000, limit: 3 } })
@HttpCode(HttpStatus.OK)
emailVerifyResend(@CurrentUser() user: RequestUser) {
  return this.authService.resendEmailVerification(user.id);
}
```

### 5.3 AuthService — metody

```ts
async verifyEmail(token: string): Promise<{ ok: true }> {
  const { userId } = await this.securityTokens.consume(token, 'email_verify');
  await this.usersRepo.update(userId, { emailVerified: true, emailVerifiedAt: new Date() });
  return { ok: true };
}

async resendEmailVerification(userId: string): Promise<{ ok: true }> {
  const user = await this.usersRepo.findById(userId);
  if (!user) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Uživatel nenalezen' });
  if (user.emailVerified) throw new BadRequestException({ code: 'ALREADY_VERIFIED', message: 'E-mail je již ověřen' });
  const plainToken = await this.securityTokens.issue(user.id, 'email_verify', 24 * 60 * 60_000);  // 24h
  try {
    await this.mailer.sendEmailVerification({ to: user.email, username: user.username, token: plainToken });
  } catch (err) {
    this.logger.warn(`Mailer email-verify resend selhal: ${(err as Error).message}`);
  }
  return { ok: true };
}
```

### 5.4 AuthService — `register` integrace
- V existujícím `register` (řádek ~129) nahradit stub token `pending-1.7-${user.id}` za reálný:
  ```ts
  const plainToken = await this.securityTokens.issue(user.id, 'email_verify', 24 * 60 * 60_000);
  await this.mailer.sendEmailVerification({ to: user.email, username: user.username, token: plainToken });
  ```
- Pattern `try/catch + logger.warn` zachovat (best-effort)

### 5.5 User entity — `emailVerifiedAt`
- Ověřit zda `User.emailVerifiedAt` existuje — pokud ne, doplnit do `user.schema.ts` + `user.interface.ts`
- `emailVerified: boolean` už existuje (default false)

### 5.6 Test — `auth.service.spec.ts` rozšíření
- `verifyEmail` happy + invalid/expired/used token (consume už pokryto, tady jen že `user.emailVerified=true`)
- `resendEmailVerification` happy + already-verified → 400 ALREADY_VERIFIED
- `register` integration: spy na securityTokens.issue že je voláno s `'email_verify'` + `24h`

**Cíl:** +7 testů

### 5.7 E2E — `auth-email-verify.e2e.spec.ts`
**Nový soubor:** register → mail capture → POST verify token → GET /users/me → `emailVerified=true`

---

## 6. Backend — Fáze E: Email change flow

### 6.1 DTOs

**Nové soubory:**
- `backend/src/modules/users/dto/email-change-request.dto.ts` — `{ @IsEmail() newEmail: string; @IsString() currentPassword: string }`
- `backend/src/modules/auth/dto/email-change-confirm.dto.ts` — `{ @IsString() token: string }`

### 6.2 UsersController + AuthController

**`users.controller.ts`** — nový endpoint:
```ts
@Post('me/email-change-request')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { ttl: 15 * 60_000, limit: 3 } })
@HttpCode(HttpStatus.OK)
requestEmailChange(@Body() dto: EmailChangeRequestDto, @CurrentUser() requester: Requester) {
  return this.usersService.requestEmailChange(requester.id, dto);
}
```

**`auth.controller.ts`** — nový endpoint (anon, na samé úrovni jako email-verify):
```ts
@Post('email-change-confirm')
@Throttle({ default: { ttl: 15 * 60_000, limit: 10 } })
@HttpCode(HttpStatus.OK)
emailChangeConfirm(@Body() dto: EmailChangeConfirmDto) {
  return this.authService.confirmEmailChange(dto.token);
}
```

### 6.3 UsersService — `requestEmailChange`

```ts
async requestEmailChange(userId: string, dto: EmailChangeRequestDto) {
  const user = await this.usersRepo.findById(userId);
  if (!user) throw new NotFoundException({ code: 'NOT_FOUND', ... });

  const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
  if (!valid) throw new BadRequestException({ code: 'INVALID_PASSWORD', message: 'Aktuální heslo nesouhlasí' });

  const newEmailLower = dto.newEmail.toLowerCase();
  if (newEmailLower === user.email.toLowerCase()) {
    throw new BadRequestException({ code: 'SAME_EMAIL', message: 'Nový e-mail je stejný jako aktuální' });
  }
  const taken = await this.usersRepo.findByEmail(newEmailLower);
  if (taken && taken.id !== user.id) {
    throw new ConflictException({ code: 'EMAIL_TAKEN', message: 'E-mail je obsazený' });
  }

  const plainToken = await this.securityTokens.issue(user.id, 'email_change', 60 * 60_000, { newEmail: newEmailLower });

  // Mail na NOVÝ e-mail s confirm linkem
  try {
    await this.mailer.sendEmailChangeConfirm({ to: newEmailLower, username: user.username, token: plainToken });
  } catch (err) { this.logger.warn(...); }

  // Info mail na STARÝ e-mail
  try {
    await this.mailer.sendEmailChangeNotice({ to: user.email, username: user.username, newEmailMasked: maskEmail(newEmailLower) });
  } catch (err) { this.logger.warn(...); }

  return { ok: true, sentTo: maskEmail(newEmailLower) };
}
```

### 6.4 AuthService — `confirmEmailChange`

```ts
async confirmEmailChange(token: string): Promise<{ ok: true }> {
  const { userId, meta } = await this.securityTokens.consume(token, 'email_change');
  if (!meta?.newEmail) throw new BadRequestException({ code: 'INVALID_TOKEN', message: 'Token neplatný (chybí cíl)' });

  // Race check — někdo si mezitím newEmail vzal?
  const taken = await this.usersRepo.findByEmail(meta.newEmail);
  if (taken && taken.id !== userId) {
    throw new ConflictException({ code: 'EMAIL_TAKEN', message: 'E-mail je obsazený jiným uživatelem' });
  }

  await this.usersRepo.update(userId, {
    email: meta.newEmail,
    emailVerified: true,
    emailVerifiedAt: new Date(),
  });
  return { ok: true };
}
```

### 6.5 Helper — `maskEmail`

**Nový soubor:** `backend/src/common/utils/mask-email.util.ts`
```ts
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 1) return `*@${domain}`;
  return `${local[0]}${'*'.repeat(Math.max(2, local.length - 1))}@${domain}`;
}
```

### 6.6 Test — `users.service.spec.ts` + `auth.service.spec.ts`
- `requestEmailChange`: happy / invalid password / same email / taken / mailer fail = warn no throw
- `confirmEmailChange`: happy / invalid token / race (jiný user už má email)
- `mask-email.util.spec.ts`: 4 edge cases

**Cíl:** +9 testů

### 6.7 E2E — `email-change.e2e.spec.ts`
**Nový soubor:** register → request email change → mail capture (2 maily) → confirm → GET /users/me → email změněn

---

## 7. Backend — Fáze F: Notifikační maily (D-026 + D-036)

### 7.1 Event listenery v MailerService (nebo dedicated `MailerEventListener`)

**Nový soubor:** `backend/src/modules/mailer/mailer-event.listener.ts`

```ts
@Injectable()
export class MailerEventListener {
  constructor(
    private readonly mailer: MailerService,
    private readonly usersRepo: ... ,  // pro lookup e-mailu příjemce
  ) {}

  @OnEvent('username-request.decided')
  async onUsernameDecided(payload: { userId: string; status: 'approved' | 'rejected'; newUsername?: string; reason?: string }) {
    const user = await this.usersRepo.findById(payload.userId);
    if (!user || user.isDeleted) return;
    await this.mailer.sendUsernameDecided({ to: user.email, username: user.username, ...payload });
  }

  @OnEvent('account.deletion.scheduled')
  async onDeletionScheduled(payload: { userId: string; scheduledHardDeleteAt: Date; reason: string | null; byAdmin: boolean }) {
    const user = await this.usersRepo.findById(payload.userId);
    if (!user || user.isDeleted) return;
    await this.mailer.sendAccountDeletionScheduled({ to: user.email, username: user.username, ...payload });
  }
}
```

### 7.2 Emit eventů — find call-sites a doplnit

**D-026 — username decided:**
- `users.service.ts` (nebo `admin.service.ts`) — najít `approveUsernameRequest` / `rejectUsernameRequest`
- Po DB update emit `username-request.decided` s payloadem

**D-036 — account deletion scheduled:**
- `users.service.ts.requestSelfDeletion` — po set `deletionRequestedAt` emit `account.deletion.scheduled` s `byAdmin: false`
- `admin.service.ts` moderation delete — po set `deletionRequestedAt` emit s `byAdmin: true, reason`

### 7.3 Test — `mailer-event.listener.spec.ts`
- 4 testy: každý event handler s mockem usersRepo + mailer, ověř call s correct payload + skip pokud `isDeleted`

**Cíl:** +4 testy

---

## 8. Frontend — Fáze G: Password reset

> Pracovní adresář FE: `c:\Matrix\ProjektIkaros\Projekt-ikaros-FE`

### 8.1 Schemas

**Nový soubor:** `src/features/auth/lib/forgotPasswordSchema.ts`
```ts
import { z } from 'zod';
export const forgotPasswordSchema = z.object({
  email: z.string().email('Neplatný formát e-mailu'),
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
```

**Nový soubor:** `src/features/auth/lib/resetPasswordSchema.ts`
```ts
export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Min. 8 znaků').max(128),
  passwordConfirm: z.string(),
}).refine(d => d.newPassword === d.passwordConfirm, { path: ['passwordConfirm'], message: 'Hesla se neshodují' });
```

### 8.2 API hooks

**Nový soubor:** `src/features/auth/api/useForgotPassword.ts`
```ts
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => apiClient.post('/auth/forgot-password', { email }).then(r => r.data),
  });
}
```

**Nový soubor:** `src/features/auth/api/useResetPassword.ts`
- POST `/auth/reset-password` { token, newPassword }
- Response shape: `{ ok: true; deletionReactivated?: boolean; revertablePromotions?: [...] }`

**Nový soubor:** `src/features/auth/api/useEmailVerify.ts`
- POST `/auth/email-verify` + `/auth/email-verify/resend`

### 8.3 ForgotPasswordModal

**Nový soubor:** `src/features/auth/components/ForgotPasswordModal.tsx`

- Reuse Modal + EditCard-like layout (TBD podle existujících LoginModal stylů)
- Forma: 1 pole `email` + 2 buttony („Zrušit", „Poslat link")
- Po success: toast „Pokud e-mail existuje, poslali jsme reset link" + zavřít modal
- Atom `openForgotPasswordModalAtom` pro otevření z LoginModal

### 8.4 LoginModal — link na reset

**Edit:** `src/features/auth/components/LoginModal.tsx`
- Pod password input vložit:
  ```tsx
  <button type="button" className={s.linkButton} onClick={() => openForgotPasswordModal()}>
    Zapomněl/a jsi heslo?
  </button>
  ```
- Atom-driven: kliknutí setne `openLoginModalAtom=false` + `openForgotPasswordModalAtom=true`

### 8.5 ResetPasswordPage

**Nový soubor:** `src/features/auth/pages/ResetPasswordPage.tsx`

- Použít `useSearchParams()` pro token (nebudeme pre-validovat)
- Pokud token chybí → zobrazit error stav „Neplatný link, požádej znovu" + tlačítko otevírající ForgotPasswordModal
- Forma (RHF + zod): `newPassword`, `passwordConfirm`, show/hide toggle, `PasswordStrengthIndicator` reuse
- Submit:
  - 200 → toast + `navigate('/?openLogin=1')`
    - Pokud `deletionReactivated` → druhý toast info
    - Pokud `revertablePromotions?.length` → store info do session storage (LoginModal po loginu zobrazí modal — pattern z 1.3c)
  - 400 INVALID_TOKEN / EXPIRED_TOKEN / ALREADY_USED → toast + button „Požádat o nový link" (otevře ForgotPasswordModal)

### 8.6 Routing

**Edit:** `src/app/router.tsx`
- Přidat lazy `ResetPasswordPage`, `EmailVerifyPage`, `EmailChangeConfirmPage`
- Routes pod `IkarosLayout` (public shell), bez `requireAuth` loaderu:
  ```ts
  { path: 'reset-password',         element: p(ResetPasswordPage) },
  { path: 'email-verify',           element: p(EmailVerifyPage) },
  { path: 'email-change/confirm',   element: p(EmailChangeConfirmPage) },
  ```

### 8.7 Testy
- `forgotPasswordSchema.spec.ts` — 2 testy (valid, invalid)
- `resetPasswordSchema.spec.ts` — 3 testy (match, mismatch, too short)
- `useForgotPassword.spec.tsx` / `useResetPassword.spec.tsx` — 2+2
- `ForgotPasswordModal.spec.tsx` — render, submit ok, submit err — 4
- `ResetPasswordPage.spec.tsx` — token missing, submit happy, submit invalid token, weak password — 6

**Cíl:** +19 testů

### 8.8 Mobil-desktop audit
- Po dokončení FE Fáze G → spustit skill `mobil-desktop`

---

## 9. Frontend — Fáze H: Email verify

### 9.1 EmailVerifyPage

**Nový soubor:** `src/features/auth/pages/EmailVerifyPage.tsx`

- Stejný shell jako ResetPasswordPage (`IkarosLayout` public)
- On-mount: `useEffect` → `POST /auth/email-verify { token }`
- Stavy (React state):
  - `'verifying'` — spinner + „Ověřuji…"
  - `'success'` — checkmark + „E-mail úspěšně ověřen!" + button „Pokračovat" (`navigate('/')`)
  - `'failed'` — X + chyba (z BE code) + button „Poslat verifikaci znovu" (pokud JWT) / „Přihlas se" (pokud anon)

### 9.2 ProfilePage — stav e-mailu badge

**Edit:** `src/features/profile/components/ProfileHeader.tsx`
- U e-mail řádku přidat:
  - Pokud `user.emailVerified=true` → zelený badge „Ověřeno"
  - Pokud `false` → žlutý badge „Neověřeno" + tlačítko „Poslat verifikaci znovu" → `POST /auth/email-verify/resend` → toast
- Stávající tooltip „Změna emailu bude dostupná v 1.7" smazat (přijde modal — viz Fáze I)

### 9.3 Testy
- `EmailVerifyPage.spec.tsx` — verifying state, success, failed, retry button — 4
- `ProfileHeader.spec.tsx` rozšíření (pokud existuje) nebo nový — badge variants — 3
- `useEmailVerify.spec.tsx` — 2

**Cíl:** +9 testů

---

## 10. Frontend — Fáze I: Email change

### 10.1 Schema

**Nový soubor:** `src/features/profile/lib/emailChangeSchema.ts`
```ts
export const emailChangeSchema = z.object({
  newEmail: z.string().email('Neplatný formát'),
  currentPassword: z.string().min(1, 'Heslo je povinné'),
});
```

### 10.2 API hooks

**Nové soubory:**
- `src/features/profile/api/useEmailChangeRequest.ts` — POST `/users/me/email-change-request`
- `src/features/auth/api/useEmailChangeConfirm.ts` — POST `/auth/email-change-confirm`

### 10.3 ChangeEmailModal

**Nový soubor:** `src/features/profile/components/ChangeEmailModal.tsx`

- RHF + zod (`emailChangeSchema`)
- Pole: `newEmail` (s `useAvailability` debounced check — reuse z 1.2), `currentPassword` (show/hide toggle)
- Submit → mutation:
  - 200 → toast `Klikni na link v e-mailu pro potvrzení (poslali jsme ho na ${sentTo})` + zavřít
  - 400 INVALID_PASSWORD → inline field error na `currentPassword`
  - 400 SAME_EMAIL → inline field error na `newEmail`
  - 409 EMAIL_TAKEN → inline field error na `newEmail`

### 10.4 ProfileHeader — odblokovat email change

**Edit:** `src/features/profile/components/ProfileHeader.tsx`
- Tlačítko „Změnit e-mail" vedle email řádky → otevře `ChangeEmailModal`

### 10.5 EmailChangeConfirmPage

**Nový soubor:** `src/features/auth/pages/EmailChangeConfirmPage.tsx`

- Analogický `EmailVerifyPage`: auto-fire on mount, stavy verifying/success/failed
- Success → toast + redirect `/ikaros/profil` (s `queryClient.invalidateQueries(['me'])` aby se zobrazil nový e-mail)
- Fail (`EMAIL_TAKEN` race) → speciální zpráva „Mezitím si e-mail zaregistroval někdo jiný"

### 10.6 Testy
- `emailChangeSchema.spec.ts` — 3 testy
- `useEmailChangeRequest.spec.tsx` / `useEmailChangeConfirm.spec.tsx` — 4
- `ChangeEmailModal.spec.tsx` — render, validation, availability check, submit ok, submit err (4 typy) — 7
- `EmailChangeConfirmPage.spec.tsx` — verifying, success, failed, race — 4

**Cíl:** +18 testů

---

## 11. Cleanup, dokumentace, dluhy

### 11.1 Roadmap update
**Soubor:** `docs/roadmap-fe.md`
- Sekce 1.7 — zaškrtnout `[x]` u všech BE + FE položek + uzavřené dluhy

### 11.2 Dluhy zavřít
**Soubor:** `docs/dluhy.md`
- Přesunout do "Uzavřené" sekce: D-006, D-012, D-026, D-036, D-037
- Aktualizovat top summary

### 11.3 HelpPage update
- Spustit skill `napoveda` (per `base.md`) — aktualizuje sekci „Stránky" o nové routes a sekci „FAQ" o nový flow (zapomenuté heslo, změna e-mailu)

### 11.4 Quality gates (před commitem)

**BE:**
```bash
npm run test:unit          # cíl 950+ testů ✓
npm run test:e2e           # nové: password-reset, email-verify, email-change
npm run lint               # ✓
npm run build              # ✓ (verify .hbs assets in dist/)
```

**FE:**
```bash
npm run test:run           # cíl 270+ testů ✓
npm run lint               # ✓
npm run lint:colors        # ✓ žádné hardcoded barvy
npm run build              # ✓
```

### 11.5 Smoke test (manuální, dev s reálným SMTP)
1. Forgot password flow s reálným mailem (PJ test účet)
2. Register → email verify mail dorazí + funguje
3. Email change s confirmation linkem
4. Username request approve → notification mail
5. Self-delete → notification mail s instrukcemi

---

## 12. Pořadí commitů (doporučené)

1. `feat(be/mailer): real SMTP transport + Handlebars templates` (Fáze A + dokumentace)
2. `feat(be/security-tokens): generic token entity + service` (Fáze B)
3. `feat(be/auth): password reset flow (D-006, D-037)` (Fáze C)
4. `feat(be/auth): email verification full flow (D-012)` (Fáze D)
5. `feat(be/users+auth): email change flow` (Fáze E)
6. `feat(be/mailer): notification emails for username + deletion (D-026, D-036)` (Fáze F)
7. `feat(fe/auth): forgot/reset password modal + page` (Fáze G)
8. `feat(fe/auth+profile): email verify page + status badge` (Fáze H)
9. `feat(fe/profile): change email modal + confirm page` (Fáze I)
10. `docs(1.7): close debts, update roadmap + napoveda`

Commit messages bez emoji, podpis Tyky (per existující git log).

---

## 13. Rizika a fallbacky

| Riziko | Mitigation |
|---|---|
| Resend domain unverified → mail neprojde | Dev fallback: stub mode (žádný start failure). PJ verify before deploy. |
| `.hbs` šablony nezkopírovány do `dist/` | `nest-cli.json` `assets` config + smoke test po build |
| Race při email change (jiný user mezitím) | `confirmEmailChange` check + 409 EMAIL_TAKEN |
| Token DB roste neomezeně | Mongo TTL index na `expiresAt` (auto-cleanup) |
| Email leak při forgot-password enumeration | Vždy 200 (anti-enumeration), throttle 3/15min/IP |
| Password reset zneužit attackerem | Token single-use, TTL 1h, hash-only v DB, revoke all refresh tokens po resetu |
| Email change vyžaduje password ale user zapomněl | Doporučit nejdřív reset hesla, pak email change (UX edge) |
| Notifikační mail selže (mailer down) | Best-effort + logger.warn, žádný impact na response usera |

---

## 14. Po dokončení implementace

1. Označit spec `Status: ✅ Implementováno` + datum
2. Roadmap → krok 1.7 `[x]`
3. Dluhy: D-006, D-012, D-026, D-036, D-037 → uzavřené
4. HelpPage aktualizace přes skill `napoveda`
5. Pull-request popis s checklistem akceptačních kritérií ze spec §6
