# Spec 1.3c — Smazání účtu + tombstone + cleanup

**Datum:** 2026-05-12
**Status:** ✅ Implementováno
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.3c
**Závisí na:** 1.3a (Profil) ✅, 1.3b (Admin role + ban) ✅
**Předchází:** 1.4 (Adresář uživatelů — bude číst tombstones)
**Souvisí s:** ban infrastruktura 1.3b, `JwtStrategy.validate`, `AdminGuard`, `UserBanCacheService`

---

## 1. Cíl

Dát uživateli a adminům kontrolovaný způsob, jak odstranit účet z platformy, **při zachování integrity komunitních příspěvků** (chat, články, galerie, diskuze zůstanou s vizuálně označeným tombstone autorem).

Tři propojené capability:

1. **Self-delete s 30denním hold** — uživatel požádá o smazání, dostane 30denní grace period. Během ní se může vrátit jediným loginem (= reaktivace). Cron job po 30 dnech provede hard cleanup.
2. **Moderační delete (admin/superadmin)** — admin spustí smazání cizího účtu se stejným 30denním hold (admin může revertnout dokud cron neproběhne). Hierarchy guards identické jako u banu (§2.5 spec 1.3b).
3. **Tombstone vizualizace** — po hard cleanup zůstává User řádek s `isDeleted: true`, anonymizovanou e-mailovou adresou, žádným heslem ani osobními poli; username + displayName + avatar fragments + chatColor zůstávají, aby reference v chatu/článcích zachovaly kontext. `<UserAvatar deleted />` zobrazuje černou pásku overlay.

Po implementaci: AccountSection v profilu je live (1.3a placeholder odstraněn), admin tabulka má akci „Smazat účet" + „Obnovit", a všechny komponenty zobrazující autora příspěvku korektně renderují tombstone.

---

## 2. Klíčová rozhodnutí (brainstorm 2026-05-12)

| Téma | Volba |
|---|---|
| Soft delete model | Pole `deletionRequestedAt`, `deletionRequestedBy`, `deletionReason` přímo na `User` — žádná separátní kolekce |
| Hard delete model | Stejný `users` dokument, `isDeleted: true` + anonymizace sensitive polí (passwordHash, email, bio, lastLoginAt…), zachované `username`, `usernameLower`, `displayName`, `avatarUrl` (snapshot), `chatColor`, `defaultAvatarType`, `deletedAt` |
| Hold délka | **30 dní** od `deletionRequestedAt` (hardcoded; admin-config = dluh) |
| Cron interval | Daily v 03:00 server time (`@nestjs/schedule` `@Cron('0 3 * * *')`) |
| Self-delete confirm | **Typing username** (GitHub-style; user napíše `<vlastní_username>` jako potvrzení) |
| Hold UX po requestu | **Automatický logout** + tokeny revokovány (jako ban). Login během hold = automatická obnova s confirm dialog „Tvůj účet byl naplánovaný na smazání. Obnovit?" |
| Email po hard delete | **Anonymizovat na `deleted-<userId>@deleted.local`** (zachová unique constraint, splní GDPR — žádné PII) |
| Username po hard delete | **Trvalá rezervace** — zachováme `username` + `usernameLower` (unique constraint drží, registrace nepřevezme) |
| PJ handling | **Auto-promote Pomocného PJ** (`WorldRole.PomocnyPJ = 2` v BE už existuje, audit Fáze 0). Pokud world má Pomocného PJ → BE atomicky povýší při deletion-request. Pokud nemá → **tvrdá blokace** 400 + seznam světů. Při deletion-request modal zobrazí list "Tito Pomocní PJ budou povýšeni: …" pro transparentnost. |
| Moderační delete | **Stejný 30denní hold** — admin může revertnout dokud cron neproběhne (konzistence s self-delete; chrání proti unáhleným akcím). Admin nastavuje povinný `deletionReason` |
| Moderační hierarchy | `assertCanModerate(actor, target, 'DELETE')` — stejná pravidla jako ban (§2.5 spec 1.3b): nikdo se nesmí smazat sám, Admin bez `canManageAdmins` nesmí smazat Admina, jen Superadmin smí smazat Superadmina |
| `UserBanCacheService` reuse | Cache se rozšiřuje o příznak `isDeletionPending` (a `isDeleted` po hard cleanup) — `JwtStrategy.validate` jednou DB lookup respektuje obě i `bannedAt` (sjednocený gate) |
| Avatar soubory | Při hard cleanup **smazat z disku** (GDPR — soubory s PII) + `avatarUrl = null` + `characterAvatarUrl = null`. Tombstone používá `defaultAvatarType` ikonku s černou páskou. |
| Friendship po hard cleanup | Existující `Friendship` záznamy zachováme, ale FE filtruje `target.isDeleted === true` z user-facing seznamů (zachová DB consistency, nezobrazuje smazané přátele) |
| Reset hesla během hold | Out-of-scope (1.7 mailer ještě není). Pokud uživatel zapomene heslo během hold → musí kontaktovat support (admin manual revert). Dluh tracked. |

---

## 3. Rozsah

### 3.1 V rozsahu 1.3c

**BE:**
- Rozšíření `User` schema o 5 polí: `deletionRequestedAt`, `deletionRequestedBy`, `deletionReason`, `deletedAt`, `isDeleted`
- Endpointy user-facing:
  - `POST /api/users/me/deletion-request` — body `{ confirmUsername: string }`; vytvoří soft-delete request + revokuje refresh tokens (auto-logout)
  - `DELETE /api/users/me/deletion-request` — uživatel-side cancel během hold (nepoužije se po novém kontraktu, ale endpoint pro úplnost — viz §4.2.2)
  - `GET /api/users/me/deletion-request` — vrátí `{ deletionRequestedAt, scheduledHardDeleteAt } | null`
- Endpointy admin:
  - `POST /api/admin/users/:id/deletion-request` — body `{ reason: string }` (povinný, max 500); stejné guards jako ban
  - `DELETE /api/admin/users/:id/deletion-request` — admin revertne (jen pokud `deletionRequestedAt != null && deletedAt == null`)
- Endpoint reaktivace:
  - `POST /api/auth/reactivate-deletion` — user pošle credentials + `confirmReactivate: true`; pokud match a `isDeleted === false && deletionRequestedAt != null` → clear flagy + log in jako obvykle
- `AuthService.login` — nový return path: pokud `deletionRequestedAt != null && isDeleted === false` → return 200 s `{ status: 'deletion_pending', deletionRequestedAt, scheduledHardDeleteAt }` (FE pak otevře confirm modal)
- `JwtStrategy.validate` — DB lookup respektuje `isDeleted`, `deletionRequestedAt`, `bannedAt` (sjednocený gate; `UserBanCacheService` rozšíříme)
- Cron `AccountCleanupCron` — daily 03:00, najde `users` kde `deletionRequestedAt != null && isDeleted === false && now - deletionRequestedAt >= 30 dní` → hard cleanup (§4.4)
- PJ-blokace check — `WorldsService.findWorldsWhereUserIsSolePJ(userId)` → pokud array.length > 0 → throw 400 s detailem
- BE testy (§7)

**FE:**
- **Sekce Účet v profilu** odblokovaná:
  - Read view: tlačítko "Smazat účet" (variant danger)
  - Click → `DeleteAccountModal` — typing username + checkbox „Rozumím, smazání spustí 30denní hold" + tlačítko "Naplánovat smazání"
  - Pokud BE 400 PJ blokace → modal zobrazí seznam blokujících světů + návod
  - Po úspěchu → toast "Účet je naplánovaný na smazání. Můžeš se vrátit jediným loginem do 30 dnů." → automatický logout → redirect na `/?accountDeletion=scheduled`
- **AdminUsersPage** nová akce v `UserRowActions`:
  - "Smazat účet" (pokud `deletionRequestedAt == null`) → `AdminDeleteUserModal` (povinný reason + typing target username) → POST
  - "Obnovit smazání" (pokud `deletionRequestedAt != null && isDeleted === false`) → confirm → DELETE
  - Status chip rozšíření: `pendingDeletion` (oranžový "DELETION PENDING")
- **`LoginModal` rozšíření** — pokud BE vrátí `status: 'deletion_pending'`:
  - Modal zobrazí confirm `ReactivateAccountModal` „Tvůj účet je naplánovaný na smazání (od `<datum>`, hard delete `<datum>`). Obnovit a přihlásit?"
  - Tlačítko "Obnovit a přihlásit" → POST `/auth/reactivate-deletion` → standardní login response + redirect domů + toast
  - Tlačítko "Zrušit" → modal se zavře, uživatel zůstává odhlášen
- **`<UserAvatar deleted />` overlay** — nová `deleted` prop, CSS-only černá diagonální páska přes avatar
- **Axios interceptor** — 401 s `code: 'DELETED'` nebo `code: 'DELETION_PENDING'` → force logout + toast (analog ban)
- **Auth interceptor 403 s `code: 'DELETED'`** — stejný flow
- **AccountSection** plnohodnotná, AccountSectionPlaceholder hint smazán
- Tombstone rendering: komponenty zobrazující autora (chat, články, galerie, diskuze) musí podporovat `<UserAvatar deleted />`. **V 1.3c implementujeme jen overlay komponentu** — integraci do konkrétních komponent provedou fáze 3.x/6.x (chat) až ty komponenty vzniknou. Zatím dotčen jen profile header (vlastní účet by se tam neměl ukázat smazaný — sám sebe neuvidí), admin tabulka a (volitelně) friend list placeholder.
- FE testy (§7)

### 3.2 Mimo rozsah 1.3c (explicitně)

- **Auto-promote Pomocného PJ** — koncept Pomocného PJ vzniká až v 5.3 (Nastavení světa); 1.3c jen blokuje. Dluh tracked.
- **GDPR data export** (právo na přenositelnost) — samostatný spec / dluh
- **Audit log delete akcí** — dluh (analog D-024 z 1.3b)
- **Email notifikace** o naplánovaném smazání / obnově — čeká na 1.7 mailer
- **Reset hesla během hold** — vyžaduje mailer (1.7). Workaround: admin manual revert
- **Cleanup tombstones starší X let** — out-of-scope (data retention policy zatím nemáme)
- **Tombstone integrace do chatu / článků / galerie / diskuze rendering** — fáze 3.x/6.x, kde ty komponenty vzniknou. 1.3c jen poskytuje primitive (`<UserAvatar deleted />` + `isDeleted` v MeResponse / UserPublicProfile shape).
- **`tombstone` jako separátní kolekce** — odmítnuto; stejný `users` dokument s `isDeleted: true` je jednodušší (žádný cross-collection join při čtení autora)

---

## 4. Backend změny

### 4.1 Datový model

#### 4.1.1 User schema (rozšíření)

`backend/src/modules/users/schemas/user.schema.ts`:

```ts
// 1.3c — soft delete + tombstone
@Prop({ type: Date, default: null }) deletionRequestedAt: Date | null;
@Prop({ type: String, default: null }) deletionRequestedBy: string | null; // admin userId pokud moderační; jinak self.id (pro audit)
@Prop({ type: String, default: null, maxlength: 500 }) deletionReason: string | null;
@Prop({ type: Date, default: null }) deletedAt: Date | null;
@Prop({ type: Boolean, default: false, index: true }) isDeleted: boolean;
```

Index `isDeleted: 1` umožní cron rychle scanovat kandidáty (`deletionRequestedAt != null && isDeleted === false`).

`backend/src/modules/users/interfaces/user.interface.ts`:

```ts
deletionRequestedAt?: Date;
deletionRequestedBy?: string;
deletionReason?: string;
deletedAt?: Date;
isDeleted: boolean;
```

`MongoUsersRepository.toEntity()` — namapovat.

#### 4.1.2 MeResponse rozšíření

```ts
deletionRequestedAt: string | null;          // ISO; null pokud žádný request
scheduledHardDeleteAt: string | null;        // ISO; null pokud žádný request
// `isDeleted` se NIKDY nevrací v `/users/me` — pokud je true, gate v JwtStrategy už requested vrátil 401
```

#### 4.1.3 AdminUsers row rozšíření

`GET /api/admin/users` items:
```ts
deletionRequestedAt: string | null;
deletionReason: string | null;
isDeleted: boolean;
// status chip priorita FE: isDeleted > bannedAt > deletionRequestedAt > pendingUsernameRequest
```

### 4.2 Endpointy — user-facing

#### 4.2.1 `POST /api/users/me/deletion-request`

DTO `RequestAccountDeletionDto`:
```ts
@IsString() @Length(3, 32) confirmUsername: string;  // musí matchnout aktuální username (case-insensitive)
```

**Service flow** (`UsersService.requestSelfDeletion(userId, dto)`):
1. Načti user
2. `dto.confirmUsername.toLowerCase() !== user.usernameLower` → throw `BadRequestException({ code: 'USERNAME_MISMATCH' })`
3. `user.deletionRequestedAt != null` → throw `ConflictException({ code: 'ALREADY_PENDING_DELETION' })`
4. **PJ blokace:** `worldsService.findWorldsWhereUserIsSolePJ(user.id)` → pokud `worlds.length > 0` → throw `BadRequestException({ code: 'SOLE_PJ_BLOCK', worlds: worlds.map(w => ({ id, slug, name })) })`
5. Update user: `deletionRequestedAt = now`, `deletionRequestedBy = user.id`, `deletionReason = null`
6. `refreshTokenService.revokeAllForUser(user.id)` — invalidate tokens (auto-logout všech zařízení)
7. `userBanCache.invalidate(user.id)` — JwtStrategy další request odmítne
8. Response `200 { deletionRequestedAt, scheduledHardDeleteAt }`

#### 4.2.2 `DELETE /api/users/me/deletion-request`

**Pozn.:** Po `POST .../deletion-request` je uživatel odhlášený a nemá platný JWT, takže tento endpoint je technicky volatelný jen v race condition (user vyvolá request a před invalidací cache zavolá DELETE). Endpoint zachováváme pro symetrii a edge cases. Self-revert přes login flow (§4.3) je primární cesta.

1. `user.deletionRequestedAt == null` → `404 NOT_FOUND`
2. Clear pole: `deletionRequestedAt = null`, `deletionRequestedBy = null`, `deletionReason = null`
3. Response `204`

#### 4.2.3 `GET /api/users/me/deletion-request`

Return `{ deletionRequestedAt, scheduledHardDeleteAt } | null`. Většinou se nepoužije — info je už v `MeResponse`, ale endpoint poskytujeme pro hluboké linky / polling.

### 4.3 Endpointy — auth (reaktivace)

#### 4.3.1 `AuthService.login` — rozšíření

```ts
async login(dto: LoginDto): Promise<LoginResponse | DeletionPendingResponse> {
  const user = await this.usersRepo.findByIdentifier(dto.identifier);
  if (!user) throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
  if (!await bcrypt.compare(dto.password, user.passwordHash)) {
    throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
  }

  // 1.3b ban gate
  if (user.bannedAt != null) throw new ForbiddenException({ code: 'BANNED', ... });

  // 1.3c hard delete = nikdy login
  if (user.isDeleted) throw new UnauthorizedException({ code: 'DELETED' });

  // 1.3c soft delete = nabídka reaktivace (NE log-in)
  if (user.deletionRequestedAt != null) {
    return {
      status: 'deletion_pending',
      deletionRequestedAt: user.deletionRequestedAt.toISOString(),
      scheduledHardDeleteAt: addDays(user.deletionRequestedAt, 30).toISOString(),
    };
  }

  // standardní login flow (1.3a / 1.3b)
  // ... lastLoginAt update, JWT issue, refresh token persist ...
  return { status: 'ok', accessToken, refreshToken, user };
}
```

LoginResponse je union `{ status: 'ok', ... } | { status: 'deletion_pending', ... }`. FE switchne dle `status`.

#### 4.3.2 `POST /api/auth/reactivate-deletion`

DTO `ReactivateDeletionDto`:
```ts
@IsString() identifier: string;   // email nebo username (jako login)
@IsString() @MinLength(6) password: string;
```

Service:
1. Ověř credentials (stejně jako login)
2. `user.isDeleted` → 401 DELETED
3. `user.deletionRequestedAt == null` → 400 NO_PENDING_DELETION (běžný login by stačil)
4. Clear: `deletionRequestedAt = null`, `deletionRequestedBy = null`, `deletionReason = null`
5. `lastLoginAt = now`, `userBanCache.invalidate(user.id)`
6. Issue JWT + refresh token (jako login)
7. Response `200 { status: 'ok', accessToken, refreshToken, user }`

### 4.4 Endpointy — admin

#### 4.4.1 `POST /api/admin/users/:id/deletion-request`

DTO `AdminDeleteUserDto`: `@IsString() @Length(1, 500) reason: string` (povinný).

Guard: `AdminGuard`. Service:
1. `assertCanModerate(actor, target, 'DELETE')` — stejná hierarchy jako ban (self/Superadmin/canManageAdmins; viz §2.5 spec 1.3b)
2. `target.deletionRequestedAt != null` → `409 ALREADY_PENDING_DELETION`
3. `target.isDeleted` → `409 ALREADY_DELETED`
4. **PJ blokace:** stejná jako u self-delete
5. Update target: `deletionRequestedAt = now`, `deletionRequestedBy = actor.id`, `deletionReason = dto.reason`
6. `refreshTokenService.revokeAllForUser(target.id)` + `userBanCache.invalidate(target.id)`
7. Response `200 { user: SafeUser }`

#### 4.4.2 `DELETE /api/admin/users/:id/deletion-request`

Admin revertne pending deletion.

1. `assertCanModerate(actor, target, 'DELETE')`
2. `target.deletionRequestedAt == null` → `404 NOT_FOUND`
3. `target.isDeleted` → `409 ALREADY_DELETED` (po cron nelze)
4. Clear: `deletionRequestedAt = null`, `deletionRequestedBy = null`, `deletionReason = null`
5. `userBanCache.invalidate(target.id)`
6. Response `200 { user: SafeUser }`

#### 4.4.3 Rozšíření `GET /api/admin/users`

Items navíc:
```ts
deletionRequestedAt: string | null;
deletionReason: string | null;
isDeleted: boolean;
```

Query filter navíc: `?hasPendingDeletion=true`, `?includeDeleted=true` (default `false` — admin běžně nevidí tombstones; `true` umožní audit).

### 4.5 PJ handling — `WorldsService.assessPJHandover` + auto-promote

**Audit Fáze 0 zjistil:** `WorldRole.PomocnyPJ = 2` už existuje v `worlds/interfaces/world-membership.interface.ts`. Můžeme rovnou udělat auto-promote bez čekání na 5.x.

```ts
// backend/src/modules/worlds/worlds.service.ts (nová metoda)

interface PJHandoverPlan {
  worldId: string;
  worldName: string;
  worldSlug: string;
  // null = blocking (žádný Pomocný PJ není k povýšení)
  promotedHelper: { userId: string; username: string } | null;
}

async assessPJHandover(userId: string): Promise<PJHandoverPlan[]> {
  const userMemberships = await this.membershipRepo.findByUserId(userId);
  const asPJ = userMemberships.filter(m => m.role === WorldRole.PJ);
  if (asPJ.length === 0) return [];

  const plans: PJHandoverPlan[] = [];
  for (const m of asPJ) {
    const otherPJs = await this.membershipRepo.findByWorldId(m.worldId, { role: WorldRole.PJ });
    const remainingPJs = otherPJs.filter(o => o.userId !== userId);
    if (remainingPJs.length > 0) continue; // má jiného PJ → bez handoveru

    // Najdi Pomocné PJ (může být 0 nebo víc)
    const helpers = await this.membershipRepo.findByWorldId(m.worldId, { role: WorldRole.PomocnyPJ });
    const world = await this.worldsRepo.findById(m.worldId);
    if (!world) continue;

    if (helpers.length > 0) {
      // Vyber prvního helper (deterministicky podle joinedAt asc — kdo dřív, ten povýší)
      const promoted = helpers.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0];
      const promotedUser = await this.usersRepo.findById(promoted.userId);
      plans.push({
        worldId: m.worldId,
        worldName: world.name,
        worldSlug: world.slug,
        promotedHelper: { userId: promoted.userId, username: promotedUser?.username ?? '?' },
      });
    } else {
      plans.push({
        worldId: m.worldId,
        worldName: world.name,
        worldSlug: world.slug,
        promotedHelper: null, // blocking
      });
    }
  }
  return plans;
}

async executePJHandover(plans: PJHandoverPlan[]): Promise<void> {
  for (const plan of plans) {
    if (!plan.promotedHelper) continue; // blocking plan → caller už vyhodil 400
    // Atomicky: helper PomocnyPJ → PJ
    const helperMembership = await this.membershipRepo.findByUserAndWorld(
      plan.promotedHelper.userId,
      plan.worldId,
    );
    if (helperMembership) {
      await this.membershipRepo.update(helperMembership.id, { role: WorldRole.PJ });
    }
  }
}
```

**Use-site v `UsersService.requestSelfDeletion` (a `AdminUsersService.requestDeletion`):**

```ts
const plans = await this.worldsService.assessPJHandover(userId);
const blocking = plans.filter(p => p.promotedHelper === null);
if (blocking.length > 0) {
  throw new BadRequestException({
    code: 'SOLE_PJ_BLOCK',
    message: `Nelze smazat účet — uživatel je jediný PJ ve světech bez Pomocného PJ.`,
    worlds: blocking.map(p => ({ id: p.worldId, slug: p.worldSlug, name: p.worldName })),
  });
}
// Auto-promote (atomicky před nastavením deletionRequestedAt)
await this.worldsService.executePJHandover(plans);
// (zbytek logiky — set deletionRequestedAt, revoke tokens, invalidate cache)
```

**Pozn.: Reaktivace** — pokud user reaktivuje účet, povýšení Pomocného PJ na PJ **nezvracíme**. World má teď 2 PJ — acceptable (oba spravují). Tracked dluh **D-pozdější**: dialog při reaktivaci "Tvůj svět má teď 2 PJ. Chceš odebrat svou PJ roli?" — out-of-scope 1.3c.

**Pozn.: Modal UX** — `DeleteAccountModal` před submit zavolá `GET /users/me/deletion-preview` (nebo zahrne plán v `POST .../deletion-request` response payload pre-confirm). Pro jednoduchost: dělat 2-fázové submit (preview → confirm) nebo zahrnout flag `dryRun: true` v request body, BE vrátí plán bez side effects.

**Rozhodnutí pro 1.3c:** Endpoint `POST /users/me/deletion-request` přijímá `?dryRun=true` query → vrátí plán bez side effects. FE volá nejprve dryRun, zobrazí seznam povýšení v modalu, user potvrdí (typing username + checkbox) → druhý request bez dryRun → execute.

### 4.6 JwtStrategy — sjednocený gate

```ts
async validate(payload: JwtPayload) {
  const user = await this.userBanCache.getOrFetch(payload.sub);
  if (!user) throw new UnauthorizedException({ code: 'USER_NOT_FOUND' });
  if (user.isDeleted) throw new UnauthorizedException({ code: 'DELETED' });
  if (user.bannedAt != null) throw new UnauthorizedException({ code: 'BANNED', bannedAt: user.bannedAt, banReason: user.banReason });
  if (user.deletionRequestedAt != null) throw new UnauthorizedException({ code: 'DELETION_PENDING' });
  return { id: user.id, role: user.role };
}
```

`UserBanCacheService` (1.3b) cachuje celý `User` snapshot — rozšíříme cache entry o nová pole, žádná nová cache vrstva.

### 4.7 Cron — `AccountCleanupCron`

```ts
@Injectable()
export class AccountCleanupCron {
  private readonly logger = new Logger(AccountCleanupCron.name);
  private readonly HOLD_DAYS = 30;

  constructor(
    private readonly usersRepo: IUsersRepository,
    private readonly mediaUpload: MediaUploadService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly userBanCache: UserBanCacheService,
  ) {}

  @Cron('0 3 * * *', { name: 'account-hard-delete', timeZone: 'Europe/Prague' })
  async hardDeleteExpired() {
    const cutoff = new Date(Date.now() - this.HOLD_DAYS * 86_400_000);
    const candidates = await this.usersRepo.find({
      deletionRequestedAt: { $lte: cutoff, $ne: null },
      isDeleted: false,
    });

    this.logger.log(`Cron account-hard-delete: found ${candidates.length} candidates`);

    for (const user of candidates) {
      try {
        await this.hardDeleteOne(user.id);
      } catch (err) {
        this.logger.error(`Hard delete failed for user ${user.id}`, err);
      }
    }
  }

  private async hardDeleteOne(userId: string): Promise<void> {
    const user = await this.usersRepo.findById(userId);
    if (!user || user.isDeleted) return;

    // 1) Smaž avatar soubory (GDPR)
    if (user.avatarUrl) await this.mediaUpload.delete(user.avatarUrl);
    if (user.characterAvatarUrl) await this.mediaUpload.delete(user.characterAvatarUrl);

    // 2) Anonymizuj sensitive pole, zachovej tombstone-relevantní
    await this.usersRepo.update(userId, {
      // ANONYMIZACE (GDPR)
      email: `deleted-${userId}@deleted.local`,
      passwordHash: '',
      bio: null,
      city: null,
      characterName: null,
      characterBio: null,
      characterAvatarUrl: null,
      avatarUrl: null,
      lastLoginAt: null,
      acceptedTermsAt: null,
      themeSettings: {},
      chatPreferences: {},
      favoriteDiscussionIds: [],
      isOnline: false,
      // TOMBSTONE FLAGY
      isDeleted: true,
      deletedAt: new Date(),
      // ZACHOVANÉ (pro reference v komunitních příspěvcích):
      // username, usernameLower, displayName, chatColor, defaultAvatarType, createdAt
    });

    // 3) Revoke refresh tokens (jistota)
    await this.refreshTokens.revokeAllForUser(userId);

    // 4) Invalidate cache
    this.userBanCache.invalidate(userId);

    this.logger.log(`Hard-deleted user ${userId}`);
  }
}
```

**Modul registrace:** `ScheduleModule.forRoot()` v `AppModule` (audit — pokud už existuje, jen přidáme `AccountCleanupCron` jako provider; jinak instalace `@nestjs/schedule`).

**Operations note:** Cron běží jen v produkčním Node procesu. V testech ho mockujeme. V dev mu lze spustit ručně přes `nestjs-cli schedule` nebo expose dev-only endpoint `POST /api/admin/_dev/trigger-cleanup` — **out-of-scope 1.3c**, dluh tracked.

### 4.8 Audit existujících tras

| Endpoint | Aktuální stav | 1.3c oprava |
|---|---|---|
| `JwtStrategy.validate` | Ban gate (1.3b) | Doplnit `isDeleted` + `deletionRequestedAt` |
| `AuthService.login` | Ban gate | Doplnit `isDeleted` (401 DELETED) + `deletionRequestedAt` (deletion_pending response) |
| `GET /api/users/me` | Funguje pro logged-in | `JwtStrategy` odmítne dříve než dorazí — žádná úprava |
| `GET /api/admin/users` | List | Doplnit `deletionRequestedAt`, `isDeleted`, `deletionReason` + query filters |
| `GET /api/users/exists/:username` | Public check | **Vrací `false` i pro tombstoned username** (username rezervovaný — bot/útočník to vidí jako „obsazené") |
| `RegisterDto` validace | Unique check | Žádná úprava — unique index na `username`/`email` drží i pro tombstone řádky (rezervace funguje automaticky) |

### 4.9 BE testy (§7)

---

## 5. Frontend — architektura

### 5.1 Router

Žádné nové routes. `/login` neexistuje (modal z 1.1), reaktivace probíhá v `LoginModal` switchnutém na `ReactivateAccountModal`.

### 5.2 Komponentní strom

```
features/profile/components/AccountSection.tsx           (rozšíření 1.3a stubu)
  └── DeleteAccountModal.tsx                              (NEW)

features/auth/components/
  ├── LoginModal.tsx                                       (rozšíření — switch na reactivate)
  └── ReactivateAccountModal.tsx                          (NEW)

features/admin/users/components/UsersTab/
  ├── UserRowActions.tsx                                   (rozšíření — Smazat / Obnovit smazání)
  └── AdminDeleteUserModal.tsx                            (NEW — povinný reason + typing target username)

shared/ui/UserAvatar/UserAvatar.tsx                       (rozšíření — deleted prop + overlay CSS)
shared/api/client.ts                                       (interceptor 401/403 DELETED/DELETION_PENDING)
shared/store/authStore.ts                                  (currentUserAtom rozšíření)
features/auth/components/AuthBootstrap.tsx                 (handle deletion_pending)

features/admin/users/api/useAdminUsers.ts                  (nové hooky):
  ├── useAdminDeleteUser()
  └── useAdminUndoDeleteUser()
features/profile/api/useProfile.ts                         (nové hooky):
  ├── useRequestSelfDeletion()
  └── useReactivateDeletion()
```

### 5.3 AccountSection — rozšíření

```tsx
const { mutate: requestDeletion, isPending } = useRequestSelfDeletion();
const [modalOpen, setModalOpen] = useState(false);
const { data: me } = useMyProfile();

if (me?.deletionRequestedAt) {
  return (
    <Banner variant="warning">
      Tvůj účet je naplánovaný na smazání ({formatDate(me.deletionRequestedAt)}).
      Hard delete proběhne {formatDate(me.scheduledHardDeleteAt)}.
      Pro obnovení se odhlas a přihlas znovu.
    </Banner>
  );
}

return (
  <Card>
    <h2>Účet</h2>
    <p>Smazání spustí 30denní hold; po něm dojde k trvalému anonymizování v komunitních příspěvcích (chat, články, galerie, diskuze zůstanou).</p>
    <Button variant="danger" onClick={() => setModalOpen(true)}>Smazat účet</Button>
    {modalOpen && <DeleteAccountModal onClose={() => setModalOpen(false)} onConfirm={requestDeletion} />}
  </Card>
);
```

### 5.4 DeleteAccountModal

```
┌─────────────────────────────────────────────────────┐
│  ⚠ Smazat účet                              [×]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Tato akce spustí 30denní hold:                     │
│  • Účet bude okamžitě odhlášen ze všech zařízení    │
│  • Můžeš se vrátit jediným loginem do 30 dnů        │
│  • Po 30 dnech proběhne nevratná anonymizace        │
│  • Komunitní příspěvky (chat, články, galerie,     │
│    diskuze) zůstanou s anonymním autorem            │
│                                                     │
│  Pro potvrzení napiš svůj username:                 │
│  ┌─────────────────────────────────────────────┐   │
│  │ tyky                                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ☐ Rozumím, smazání spustí 30denní hold.            │
│                                                     │
├─────────────────────────────────────────────────────┤
│           [Zrušit]  [Naplánovat smazání]            │
└─────────────────────────────────────────────────────┘
```

- Tlačítko "Naplánovat smazání" je disabled dokud `typedUsername.toLowerCase() === user.usernameLower.toLowerCase() && checkboxChecked`
- Submit → POST `/users/me/deletion-request` → success: toast + `useAuthStore.logout()` (clear tokens) + navigate `/?accountDeletion=scheduled`
- Error 400 `SOLE_PJ_BLOCK` → modal switchne na **PJBlockView**: seznam blokujících světů (link `/svet/:slug`) + návod „Předej PJ jinému uživateli ve nastavení světa, nebo kontaktuj admina."

### 5.5 LoginModal — handle deletion_pending

Po submit `useLogin().mutate(creds)`:
```tsx
onSuccess: (response) => {
  if (response.status === 'deletion_pending') {
    // Switch modal content na ReactivateAccountModal
    setReactivationContext({
      identifier: creds.identifier,
      password: creds.password,
      deletionRequestedAt: response.deletionRequestedAt,
      scheduledHardDeleteAt: response.scheduledHardDeleteAt,
    });
    return;
  }
  // standardní login flow
  setAuth(response);
  closeModal();
};
```

### 5.6 ReactivateAccountModal

```
┌──────────────────────────────────────────────────┐
│  Tvůj účet čeká na smazání             [×]      │
├──────────────────────────────────────────────────┤
│                                                  │
│  Naplánováno: 10. 5. 2026                        │
│  Hard delete: 9. 6. 2026                         │
│                                                  │
│  Chceš pokračovat s přihlášením? Smazání bude   │
│  zrušeno.                                        │
│                                                  │
├──────────────────────────────────────────────────┤
│   [Nepřihlašovat]  [Obnovit a přihlásit]         │
└──────────────────────────────────────────────────┘
```

- "Obnovit a přihlásit" → POST `/auth/reactivate-deletion` se stejnými credentials → standardní login response → setAuth + toast „Účet obnoven, vítej zpět" + redirect domů
- "Nepřihlašovat" → modal se zavře, uživatel zůstává odhlášen

### 5.7 AdminDeleteUserModal

Identicky DeleteAccountModal, jen:
- Cílový username (ne vlastní): "Pro potvrzení napiš username uživatele: `<target.username>`"
- **Povinný reason** textarea (min 1 znak, max 500)
- Tlačítko "Naplánovat smazání"
- Submit → POST `/admin/users/:id/deletion-request` → success: refresh AdminUsers list, toast

Pokud target už má `deletionRequestedAt`, AdminUsersPage zobrazuje akci „Obnovit smazání" → confirm modal → DELETE.

### 5.8 Status chip rozšíření

`features/admin/users/components/UsersTab/UserStatusChips.tsx` — priorita:
1. `isDeleted` → 🪦 černý "DELETED" (zobrazí se jen s `includeDeleted=true` query)
2. `bannedAt != null` → ❌ červený "BANNED"
3. `deletionRequestedAt != null` → ⏳ oranžový "DELETION PENDING"
4. `pendingUsernameRequest != null` → 🕐 žlutý "PENDING USERNAME"
5. jinak nic

### 5.9 `<UserAvatar deleted />` overlay

```tsx
// shared/ui/UserAvatar/UserAvatar.tsx — rozšíření Props
interface Props {
  // ... existing
  deleted?: boolean;
}

return (
  <div className={clsx(styles.wrap, deleted && styles.deletedWrap)}>
    <img ... />
    {deleted && <span className={styles.deletedBand} aria-hidden="true" />}
  </div>
);
```

```css
/* UserAvatar.module.css */
.wrap { position: relative; display: inline-block; }
.deletedBand {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    -45deg,
    transparent 40%,
    rgba(0, 0, 0, 0.85) 40%,
    rgba(0, 0, 0, 0.85) 60%,
    transparent 60%
  );
  border-radius: inherit;
  pointer-events: none;
}
.deletedWrap img { filter: grayscale(1) brightness(0.6); }
```

`alt` při deleted: `alt="Smazaný účet"` (override).

### 5.10 currentUserAtom rozšíření

```ts
type CurrentUser = {
  // ... existing
  deletionRequestedAt?: string | null;
  scheduledHardDeleteAt?: string | null;
};
```

`useAuthBootstrap` (z 1.3a) automaticky propaguje nová pole z `/users/me`.

### 5.11 Axios interceptor rozšíření

`src/shared/api/client.ts`:
```ts
if (status === 401) {
  const code = error.response.data?.code;
  if (code === 'BANNED' || code === 'DELETED' || code === 'DELETION_PENDING') {
    logout();
    if (code === 'BANNED') toast.error('Tvůj účet byl zabanován');
    if (code === 'DELETED') toast.error('Účet byl odstraněn');
    if (code === 'DELETION_PENDING') toast.warning('Účet čeká na smazání. Přihlas se znovu pro obnovení.');
  }
}
```

---

## 6. UI/UX detail

### 6.1 Theme

Všechny komponenty respektují `data-theme`. Žádné per-theme přepisy v admin / profile / auth komponentech ([feedback_theme_isolation](../../../../../../Users/arafo/.claude/projects/c--Matrix-ProjektIkaros-Projekt-ikaros-FE/memory/feedback_theme_isolation.md)).

Černá páska tombstone overlay je **theme-independent** (smazaný účet má vždy stejný vizuál — záměr).

### 6.2 Mobile

- DeleteAccountModal, ReactivateAccountModal, AdminDeleteUserModal — `Modal` s full-screen mobile variantou (existující v Modal komponentě)
- AccountSection card stack se zarovná do flow profilu
- Po grafických úpravách: skill `mobil-desktop`

### 6.3 A11y

- Modaly: focus trap, ESC zavírá, focus na první input
- Confirm input má `aria-describedby` ukazující na vysvětlující odstavec
- Banner v pending stavu: `role="status"` + `aria-live="polite"`
- Tombstone avatar: `aria-label="Smazaný účet"` na obalu

### 6.4 Loading / error states

- `useRequestSelfDeletion.isPending` → "Naplánovat smazání" tlačítko disabled + spinner
- 400 SOLE_PJ_BLOCK → modal switchne na PJBlockView (UI s linkbox seznamem světů)
- 5xx → toast s `parseApiError(error)`

---

## 7. Akceptační kritéria

### 7.1 Self-delete (user-side)

- [ ] Otevři profil → sekce Účet zobrazí tlačítko "Smazat účet" (idle stav)
- [ ] Klik → DeleteAccountModal otevře
- [ ] Tlačítko "Naplánovat smazání" je disabled bez correct typing + bez checkbox
- [ ] Napíšu špatný username → tlačítko stále disabled
- [ ] Napíšu correct username + zaškrtnu checkbox → tlačítko enabled
- [ ] Submit → POST 200 → toast + automatický logout → redirect `/?accountDeletion=scheduled`
- [ ] Po hold requestu otevřu profil v cached tab → axios 401 DELETION_PENDING → další logout flow
- [ ] Login během hold: zadám credentials → BE vrátí `status: 'deletion_pending'` → ReactivateAccountModal
- [ ] Klik "Obnovit a přihlásit" → POST `/auth/reactivate-deletion` 200 → login + toast "Účet obnoven"
- [ ] Klik "Nepřihlašovat" → modal zavře, zůstávám odhlášen
- [ ] Po 30 dnech (testovatelně: mock cron / fast-forward Date.now) → cron hard-delete → login s těmi credentials → 401 DELETED → toast "Účet byl odstraněn"

### 7.2 Self-delete PJ blokace

- [ ] Uživatel je jediný PJ světa "Matrix" → request → 400 SOLE_PJ_BLOCK
- [ ] Modal switchne na PJBlockView se seznamem světů (link na `/svet/matrix`)
- [ ] Uživatel přidá Pomocného PJ (1.3c neimplementuje — manuál test: další PJ promote přes admin /uzivatele) → request → 200 OK
- [ ] Uživatel není PJ žádného světa → request → 200 OK

### 7.3 Admin moderační delete

- [ ] AdminUsersPage → kliknu "Smazat účet" u jiného usera → AdminDeleteUserModal
- [ ] Modal vyžaduje typing target username + povinný reason (min 1, max 500)
- [ ] Bez reason → submit disabled
- [ ] Bez correct typing → submit disabled
- [ ] Submit → POST 200 → user v tabulce má `DELETION PENDING` chip, akce se přepne na "Obnovit smazání"
- [ ] Admin (canManageAdmins=false) zkusí smazat Admina → 403 CANNOT_MANAGE_ADMINS → toast
- [ ] Admin (canManageAdmins=true) smaže Admina → 200
- [ ] Admin (any) zkusí smazat Superadmina → 403 INSUFFICIENT_ROLE
- [ ] Admin zkusí smazat sám sebe (action disabled v UI + BE 400 self) → fail-safe
- [ ] Kliknu "Obnovit smazání" → confirm → DELETE 200 → chip mizí

### 7.4 Tombstone vizualizace

- [ ] `<UserAvatar src={null} defaultType="male" deleted />` rendruje fallback `male.webp` + černá páska overlay
- [ ] `<UserAvatar src="https://.../avatar.webp" deleted />` rendruje avatar + páska
- [ ] `alt="Smazaný účet"` při deleted (test RTL)
- [ ] CSS přes themes/skiny vždy zobrazuje pásku konzistentně

### 7.5 BE — gates

- [ ] `JwtStrategy.validate` pro `isDeleted` user → 401 DELETED
- [ ] `JwtStrategy.validate` pro `deletionRequestedAt != null` → 401 DELETION_PENDING
- [ ] `JwtStrategy.validate` pro `bannedAt != null` → 401 BANNED (regression 1.3b)
- [ ] `AuthService.login` pro `isDeleted` user → 401 DELETED
- [ ] `AuthService.login` pro `deletionRequestedAt != null` → 200 `{ status: 'deletion_pending', ... }`
- [ ] `AuthService.login` pro `bannedAt != null` → 403 BANNED (regression)
- [ ] `POST /auth/reactivate-deletion` valid → 200 + clear flagy + JWT issued
- [ ] `POST /auth/reactivate-deletion` špatné heslo → 401 INVALID_CREDENTIALS
- [ ] `POST /auth/reactivate-deletion` `isDeleted` user → 401 DELETED
- [ ] `POST /auth/reactivate-deletion` user bez pending → 400 NO_PENDING_DELETION

### 7.6 BE — endpoint kontrakty

- [ ] `POST /users/me/deletion-request` valid (correct typing) → 200; refresh tokeny revokované (manuální test: druhý tab next request → 401)
- [ ] `POST /users/me/deletion-request` špatný username → 400 USERNAME_MISMATCH
- [ ] `POST /users/me/deletion-request` druhý request → 409 ALREADY_PENDING_DELETION
- [ ] `POST /users/me/deletion-request` sole PJ → 400 SOLE_PJ_BLOCK + payload `worlds`
- [ ] `DELETE /users/me/deletion-request` má valid token + pending → 204 + flagy clear
- [ ] `GET /users/me/deletion-request` → správný shape

- [ ] `POST /admin/users/:id/deletion-request` happy + hierarchy + self + reason validace + PJ blokace
- [ ] `DELETE /admin/users/:id/deletion-request` happy + hierarchy + already-deleted 409 + no-pending 404
- [ ] `GET /admin/users` items rozšířené o `deletionRequestedAt`, `deletionReason`, `isDeleted`

### 7.7 Cron

- [ ] Mock Date → user s `deletionRequestedAt = 31 dní zpět` → cron tick → user.isDeleted === true
- [ ] Cron tick → avatar soubor smazán z disku (test FS check)
- [ ] Cron tick → email anonymizován `deleted-<id>@deleted.local`
- [ ] Cron tick → passwordHash = ''
- [ ] Cron tick → username + displayName + chatColor + defaultAvatarType zachované
- [ ] Cron tick → refresh tokeny revokované
- [ ] Cron tick → userBanCache invalidated
- [ ] Cron pro user s `deletionRequestedAt = 5 dní zpět` → no-op
- [ ] Cron pro user `isDeleted: true` → no-op (idempotent)
- [ ] Cron pro user bez `deletionRequestedAt` → no-op

### 7.8 Mobile / a11y

- [ ] Skill `mobil-desktop` prošel
- [ ] DeleteAccountModal full-screen na mobile
- [ ] Focus trap + ESC v modalech
- [ ] Banner v profilu má `role="status"`

---

## 8. Testy

### 8.1 BE

**Unit (jest):**
- `users.service.spec.ts` rozšíření:
  - `requestSelfDeletion` — happy, username mismatch, already pending, sole PJ
  - `getMyDeletionRequest`
  - `cancelMyDeletionRequest`
- `admin.service.spec.ts` rozšíření:
  - `adminRequestDeletion` — happy, hierarchy (self, Superadmin, canManageAdmins), already pending, already deleted, sole PJ, reason validace
  - `adminCancelDeletion` — happy, hierarchy, not found, already deleted
- `auth.service.spec.ts`:
  - `login` deletion_pending response
  - `login` isDeleted → 401
  - `reactivateDeletion` — happy, bad creds, no pending, isDeleted
- `jwt.strategy.spec.ts` — DELETED, DELETION_PENDING, BANNED (regression)
- `account-cleanup.cron.spec.ts` — hard delete eligible, hard delete idempotent, no-op pro krátké hold, avatar mazání, anonymizace, cache invalidate
- `worlds.service.spec.ts` (nebo users.service inline) — `findWorldsWhereUserIsSolePJ` happy / empty / multi-PJ

**E2E (supertest):**
- `users.deletion.e2e-spec.ts` — full self-delete + reactivate flow
- `admin.deletion.e2e-spec.ts` — admin moderační flow + revert
- `auth.deletion-gate.e2e-spec.ts` — login + JWT access odmítnuté v každém stavu

**Schema:**
- `user.schema.spec.ts` rozšíření — nová pole defaultně, `isDeleted` index

### 8.2 FE

**Unit (vitest):**
- `deleteAccountSchema.spec.ts` — zod (typing username match)
- `useRequestSelfDeletion.spec.ts` — TanStack hook cache, invalidace `users/me`
- `useReactivateDeletion.spec.ts` — login flow integrace
- `useAdminDeleteUser.spec.ts`, `useAdminUndoDeleteUser.spec.ts`

**Component (RTL):**
- `AccountSection.spec.tsx` — idle, pending banner, modal otevření
- `DeleteAccountModal.spec.tsx` — typing matching, checkbox, submit, SOLE_PJ error
- `ReactivateAccountModal.spec.tsx` — confirm, cancel
- `AdminDeleteUserModal.spec.tsx` — povinný reason, typing target username
- `UserAvatar.spec.tsx` rozšíření — deleted prop rendering

**Storybook:**
- `AccountSection/Idle`, `AccountSection/PendingDeletion`, `AccountSection/PJBlocked`
- `DeleteAccountModal/Default`, `DeleteAccountModal/PJBlocked`
- `ReactivateAccountModal/Default`
- `AdminDeleteUserModal/Default`
- `UserAvatar/Deleted` (různé velikosti, default types)

---

## 9. Migrace / breaking changes

### 9.1 BE

- **Rozšíření User schema** (5 nových polí, vše default null/false) — additive, non-breaking
- **Nový endpoint `/users/me/deletion-request`** (POST/GET/DELETE) — additive
- **Nový endpoint `/admin/users/:id/deletion-request`** (POST/DELETE) — additive
- **Nový endpoint `/auth/reactivate-deletion`** — additive
- **`AuthService.login` response union** — `LoginResponse = { status: 'ok', ... } | { status: 'deletion_pending', ... }` — **mírně breaking pro FE**, ale `status` field je nový → FE typeguard v jednom místě (`useLogin.onSuccess`)
- **`JwtStrategy.validate` rozšíření** — additive (více throw cases)
- **Cron `AccountCleanupCron`** — nová komponenta, vyžaduje `ScheduleModule.forRoot()` v AppModule (audit)
- **`UserBanCacheService`** rozšíření o `isDeleted`/`deletionRequestedAt` — additive

### 9.2 FE

- `currentUserAtom` typ rozšíření — TS errors navedou na callsites (vše v profile / auth)
- `useLogin` typeguard na `status: 'deletion_pending'` — jedna nová větev
- `AccountSection` z 1.3a placeholder na plnou funkčnost
- `UserAvatar` rozšíření o `deleted` prop — additive (defaultně `false`)
- Axios interceptor rozšíření o DELETED/DELETION_PENDING codes — additive

### 9.3 Závislosti

- BE: `@nestjs/schedule` — pokud ještě není (audit; pravděpodobně bude pro budoucí jobs); ~80 kB
- FE: žádné nové npm balíčky

---

## 10. Tracked dluhy

- **D-034** ✅ **vyřešeno v 1.3c** (Fáze 0 audit objevil `WorldRole.PomocnyPJ = 2` v BE) — auto-promote Pomocného PJ implementován v `WorldsService.assessPJHandover` + `executePJHandover`. Reverse rollback při reaktivaci = nový dluh **D-034b** (modal "Tvůj svět má teď 2 PJ, chceš odebrat svou PJ roli?").
- **D-035** — Audit log delete akcí (kdo komu kdy proč). 1.3c uchovává jen `deletionRequestedBy`/`deletionReason` na aktuálním záznamu.
- **D-036** — Email notifikace o naplánovaném smazání / přicházejícím hard delete. Čeká na 1.7 mailer.
- **D-037** — Reset hesla během deletion hold. Čeká na 1.7 mailer; mezitím admin manual revert.
- **D-038** — Cron jako admin-konfigurovatelná délka hold (aktuálně hardcoded 30 dní). Analog D-027.
- **D-039** — Dev-only endpoint `POST /api/admin/_dev/trigger-cleanup` pro manuální spuštění cronu v testech / staging.
- **D-040** — Tombstone integrace do chat / článek / galerie / diskuze renderingu. 1.3c poskytuje `<UserAvatar deleted />` primitive; integraci provedou fáze 3.x/6.x.
- **D-041** — `Friendship` cleanup pri hard delete (zatím necháváme všechny záznamy, FE filtruje na render). Po 3.5 (přátelé) zvážit hard delete.
- **D-042** — GDPR data export endpoint (právo na přenositelnost) — samostatný spec.
- **D-043** — Tombstone retention policy (po X letech opravdu smazat řádek z DB). Out-of-scope; samostatný spec.

---

## 11. Otevřené body (pre-implementation)

- [ ] **`@nestjs/schedule` audit** — ověřit, jestli BE už balíček má a `ScheduleModule.forRoot()` je v AppModule. Pokud ne, instalovat + zaregistrovat.
- [ ] **`WorldsService.findWorldsWhereUserIsSolePJ` umístění** — existuje `WorldsService`? Pokud ano, přidat metodu tam. Pokud ne (asi neexistuje protože fáze 2 ještě nezačala), implementovat přímý dotaz na `world_members` kolekci v `UsersService` a tracked dluh na refactor.
- [ ] **`UserBanCacheService` snapshot shape** — ověřit, že cache entry obsahuje celý `User` (ne jen `{ bannedAt }`). Pokud jen ban-fields, rozšíříme; jinak invalidate logika beze změny.
- [ ] **Existující `GET /admin/users` aggregate** — auditovat současný `$lookup` pipeline (z 1.3b username request join) — přidání `isDeleted` / `deletionRequestedAt` filter v `$match` má jednoduchý dopad. Pro `includeDeleted=true` default false znamená, že běžný admin list **nevidí** tombstones (transparentní); audit potřebuje samostatný query.
- [ ] **Sole-PJ check performance** — pro každého PJ usera procházíme jeho world members. Pokud user není PJ žádného, instant return. Pro PJ s mnoha světy: max ~5–10 dotazů. Acceptable, optimalizace = D-pozdější (pokud).

---

## 12. Po schválení tohoto specu

Vytvořím `docs/arch/phase-1/plan-1.3c.md` — implementační plán s konkrétními soubory, pořadím změn (BE schema → BE service → BE auth flow → BE cron → BE admin endpoints → FE hooky → FE components → FE LoginModal handler → tests → docs), test stepy a checklisty. Počkám na schválení toho, pak začnu kódovat.
