# 03 — Profil & presence

Oblast pokrývá vlastní profil uživatele (GET/PATCH /users/me, upload avatarů, profilová pole, bezpečnostní sekce, privacy) a systém real-time presence (online/idle/offline stav, WS eventy, lastSeenAt, OnlineDot).

**BE:** `modules/users` (controller, service, repository, DTO, schema, spec), `modules/presence` (controller, service, spec)
**FE:** `features/profile` (ProfilePage, ProfileHeader, BioSection, CharacterSection, AppearanceSection, PrivacySection, SecuritySection, AccountSection, AvatarUploader, ChatColorPicker, ChangeEmailModal, DeleteAccountModal, EditCard), `shared/presence` (usePresence, OnlineDot, store), `shared/ui/UserAvatar`, `features/chat/api/usePresenceHeartbeat`
**Routy:** `/ikaros/profil`

---

## A. GET /users/me — kontrakt a sanitizace

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| PP-01 | BE `findById` odstraní `passwordHash` ze response (sanitize) `[auto]` | M1, M3 | ⬜ |
| PP-02 | BE response obsahuje všechna pole deklarovaná ve FE `User` interfejsu: `bio`, `city`, `characterName`, `characterBio`, `characterAvatarUrl`, `themeId`, `hiddenPresence`, `hiddenInDirectory`, `profileVisibility`, `chatColor` `[auto]` | M1, M2 | ⬜ |
| PP-03 | FE `useMyProfile` (query key `['users','me']`) je invalidován po každém `useUpdateProfile` onSuccess — oba `qc.setQueryData` i atom `currentUserAtom` jsou zapsány `[auto]` | M1 | ⬜ |
| PP-04 | BE neexponuje `passwordHash`, `bannedAt`, `banReason`, `adminPermissions` v `publicProfile` (starý endpoint GET `/users/profile/:id`) ani v `publicProfileV14` `[auto]` | M1, M3 | ⬜ |
| PP-05 | BE `sanitize()` je volán ve všech větvích `update()` (i po avatar upload, kde se volá `usersService.update(user.id, { avatarUrl: url })`) `[auto]` | M1 | ⬜ |

---

## B. PATCH /users/me — edit polí

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| PP-06 | `PATCH /users/me` odmítne `username` v body s `ForbiddenException` kódem `USERNAME_CHANGE_VIA_REQUEST` `[auto]` | M1, M3 | ⬜ |
| PP-07 | `PATCH /:id` (admin route) odmítne username změnu pro kohokoliv jiného než Superadmin s kódem `USERNAME_CHANGE_REQUIRES_SUPERADMIN` `[auto]` | M1, M4 | ⬜ |
| PP-08 | `PATCH /users/me` validuje `chatColor` regex `/^#[0-9a-fA-F]{6}$/` — neplatný hex → 400 `[auto]` | M1, M2 | ⬜ |
| PP-09 | `PATCH /users/me` správně deep-merguje `themeSettings` (nový klíč přidán, existující zachován, undefined themeSettings = bez přepsání) `[auto]` | M3 | ⬜ |
| PP-10 | `PATCH /users/me` správně deep-merguje `chatPreferences` (stejná logika jako themeSettings) `[auto]` | M1 | ⬜ |
| PP-11 | BE DTO `UpdateUserDto`: `bio` max 1000, `city` max 100, `characterName` max 64, `characterBio` max 1000, `displayName` max 32 (BE) vs FE schema max 64 — **nesoulad na `displayName`**: BE `@MaxLength(32)`, FE `headerSchema` max 64 `[auto]` | M1, M2 | ⬜ |
| PP-12 | FE `profileSchemas.ts` `usernameRequestSchema` regex `^[a-z0-9-]+$` (FE) vs BE username `@MaxLength(32)` bez regex v UpdateUserDto — FE přidává přísnější validaci než BE pro username request, což je správné `[auto]` | M1, M2 | ⬜ |

---

## C. Avatar upload a správa

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| PP-13 | BE `POST /users/me/avatar` — `FileInterceptor` limit `5 * 1024 * 1024` bytes; chybějící soubor → 400 `NO_FILE` `[auto]` | M1 | ⬜ |
| PP-14 | BE nevaliduje MIME typ při avatar uploadu (spoléhá jen na Multer fileSize limit) — chybí typová validace pro non-image soubory `[auto]` | M1 | ⬜ |
| PP-15 | FE `AvatarUploader` klient-side validuje `file.type.startsWith('image/')` a `file.size > MAX_BYTES (5 MB)` před odesláním — správně `[auto]` | M1 | ⬜ |
| PP-16 | FE `useUploadAvatar` po úspěchu zapíše `data` do `qc.setQueryData(['users','me'])` i do `currentUserAtom` → header se okamžitě překreslí `[auto]` | M1 | ⬜ |
| PP-17 | FE `AvatarUploader` revokuje object URL při unmountu (memory leak prevence), ale při chybě uploadu preview URL zůstane viditelná (záměr dle komentáře) `[auto]` | M1 | ⬜ |
| PP-18 | FE `UserAvatar` fallbackuje na `/defaults/avatars/<type>[-sm].webp` při `onError` (broken img) — `errored` state se nastaví a přepne na fallback URL `[auto]` | M1 | ⬜ |
| PP-19 | FE `UserAvatar` `deleted=true` prop renderuje tombstone overlay (diagonální pásek) a přepíše `alt` na „Smazaný účet" `[auto]` | M1, M3 | ⬜ |
| PP-20 | BE `DELETE /users/me/avatar` nastaví `avatarUrl: ''` — FE to interpretuje jako prázdný string, nikoliv null, UserAvatar pak použije fallback (src falsy check: `!src || errored`) `[auto]` | M1, M2 | ⬜ |
| PP-21 | `characterAvatarUrl` upload jde na dedikovaný endpoint `POST /users/me/character/avatar`, BE ukládá do separátního Cloudinary slotu `ikaros/users/{id}/character` (256px) vs `ikaros/users/{id}/avatar` (512px) `[auto]` | M1 | ⬜ |
| PP-22 | FE `AvatarUploader` nezobrazí tlačítko „Odebrat" pokud `currentUrl` je falsy (prázdný string nebo undefined) — správná podmínka `onDelete && currentUrl` `[auto]` | M1 | ⬜ |

---

## D. Bezpečnost — změna hesla a e-mailu

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| PP-23 | BE `PUT /users/password` ověří staré heslo přes bcrypt compare — špatné heslo → 401 `INVALID_PASSWORD` `[auto]` | M1, M3 | ⬜ |
| PP-24 | BE emituje `user.password.changed` event po changePassword i resetPassword → BE-side refresh token revokace `[auto]` | M1, M3 | ⬜ |
| PP-25 | FE `SecuritySection` po 401 (špatné staré heslo) nastaví `form.setError('oldPassword', ...)` — inline error, ne toast `[auto]` | M1 | ⬜ |
| PP-26 | **URL MISMATCH**: FE `useEmailChangeRequest` volá `POST /users/me/email-change-request`, ale BE exponuje `POST /users/me/request-email-change` — request selže s 404 `[auto]` | M1, M2 | ⬜ |
| PP-27 | BE `requestEmailChange` — stejný e-mail jako aktuální → 400 `SAME_EMAIL` (case-insensitive porovnání) `[auto]` | M1, M3 | ⬜ |
| PP-28 | BE `requestEmailChange` — e-mail obsazený jiným userem → 409 `EMAIL_TAKEN` `[auto]` | M1, M3 | ⬜ |
| PP-29 | FE `ChangeEmailModal` správně mapuje error kódy `INVALID_PASSWORD`, `SAME_EMAIL`, `EMAIL_TAKEN` na inline field errory; 429 → submitError banner `[auto]` | M1 | ⬜ |
| PP-30 | BE `requestEmailChange` mailerové selhání je jen `logger.warn` — nezpůsobí throw, response je stále `{ ok: true }` `[auto]` | M1, M3 | ⬜ |
| PP-31 | BE `PUT /users/password` — endpoint je na `/users/password` (bez `:id`) ale je dostupný bez role gaté pro libovolného přihlášeného; `@CurrentUser` zajišťuje, že mění jen své heslo `[auto]` | M1, M4 | ⬜ |

---

## E. Privacy — neviditelný mód, adresář, friend-only profil

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| PP-32 | BE `publicProfileV14`: `hiddenPresence=true` → `lastSeenAt: null` v response; tombstone → `lastSeenAt: null` i pro admina `[auto]` | M1, M3 | ⬜ |
| PP-33 | BE `publicProfile` (starý endpoint): `lastSeenAt` je podmíněno `hiddenPresence` — skryje se korektně `[auto]` | M1 | ⬜ |
| PP-34 | FE `PrivacySection` po toggle `hiddenPresence` volá `reconnectSocket()` — zajistí, že BE dostane novou session/handshake s aktuálním stavem `[auto]` | M1 | ⬜ |
| PP-35 | BE `listPublic` — `hiddenInDirectory=true` uživatelé jsou filtrováni pro non-admin; admin dostane `includeHidden=true` verzi `[auto]` | M1, M3, M4 | ⬜ |
| PP-36 | BE `publicProfileV14` — `profileVisibility='friends'` a requester není přítel ani admin → 403 `PROFILE_FRIENDS_ONLY`; vlastní profil (requesterId === userId) vždy projde `[auto]` | M1, M3 | ⬜ |
| PP-37 | BE `publicProfileV14` — tombstone nebo pending-deletion uživatel → 404 pro non-admina; admin vidí s `deleted/pendingDeletion` flagem `[auto]` | M1, M3 | ⬜ |
| PP-38 | FE `PrivacySection` nezobrazuje `profileVisibility` stav pro sebe samotného — popis říká „přátele vidí profil", ale vlastní profil vždy viditelný (logika na BE, FE jen toggle) `[human]` | M1 | ⬜ |

---

## F. Presence — WS eventy a online stav

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| PP-39 | **KRITICKÉ**: FE `usePresenceInit` naslouchá na `presence:snapshot` a `presence:update` WS eventi, ale v celém BE neexistuje žádná implementace těchto eventů (`grep` přes všechny *.ts nenalezl žádný emit) — presence mapa bude vždy prázdná `[auto]` | M1, M5 | ⬜ |
| PP-40 | FE `usePresenceInit` emituje `presence:idle` a `presence:active` na socket — BE tyto eventy neposlouchá v žádném gateway `[auto]` | M1, M5 | ⬜ |
| PP-41 | BE `GET /presence/online` vrací `string[]` userIds aktivních za posledních 25h (konfigurovatelné via `PRESENCE_THRESHOLD_HOURS`) — prahová logika používá `lastSeenAt` z DB `[auto]` | M1, M3 | ⬜ |
| PP-42 | BE `lastSeenAt` se aktualizuje v `JwtAuthGuard` při každém HTTP requestu (fire & forget, chyba jen loguje) a při loginu v `auth.service` — nikoli přes WS eventy `[auto]` | M1 | ⬜ |
| PP-43 | FE `useIsOnline(userId)` vrátí `false` pro `undefined`/`null`, pro online i idle vrátí `true` (mapa contains) `[auto]` | M1, M3 | ⬜ |
| PP-44 | FE `usePresenceStatus(userId)` vrátí `'online' | 'idle' | 'offline'` — `'offline'` když userId není v mapě `[auto]` | M1, M3 | ⬜ |
| PP-45 | FE `OnlineDot` renderuje správný aria-label (`Online/Idle/Offline`) a CSS třídu per stav; offline = průhledná (ne červená) `[auto]` | M1, M3 | ⬜ |
| PP-46 | FE idle threshold = 5 min; interval tick = 30 s; skrytá záložka (`document.hidden`) → okamžitý `presence:idle` emit; návrat aktivity → `presence:active` `[auto]` | M1 | ⬜ |
| PP-47 | FE `usePresenceHeartbeat` emituje `chat:heartbeat` co 5 min — zastaví se, když záložka je zavřená/uspená (Tab API limit) `[auto]` | M1 | ⬜ |
| PP-48 | FE `usePresenceInit` cleanup korektně odregistruje všechny event listenery (socket.off + window.removeEventListener + clearInterval) `[auto]` | M1, M3 | ⬜ |
| PP-49 | BE `findOnlineSince(since: Date)` dotaz nemá index na `lastSeenAt` ve smyslu složeného indexu — `UserSchema.index({ lastSeenAt: 1 })` existuje (schema.ts řádek 133), takže dotaz je krytý `[auto]` | M1 | ⬜ |

---

## G. Username change request flow

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| PP-50 | FE `SecuritySection` zobrazí banner s pending žádostí nebo cooldown hint nebo formulář (tři stavy jsou vzájemně vylučující) `[auto]` | M1 | ⬜ |
| PP-51 | BE `getLastUnseenDecidedRequest` vrátí `{ request: null }` bez seenAt záznamu; `markUsernameRequestSeen` je idempotentní — opakovaný call na již označenou žádost nic neudělá `[auto]` | M1, M3 | ⬜ |
| PP-52 | FE cooldown počítá `usernameChangedAt + cooldownDays * DAY_MS > Date.now()` — správně `[auto]` | M1 | ⬜ |
| PP-53 | FE `tick` state (Date.now() snapshot) se refreshuje každých 60 s přes `setInterval` — cooldown se vizuálně přepne bez reload stránky `[auto]` | M1 | ⬜ |

---

## H. Účet a smazání

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| PP-54 | FE `AccountSection` zobrazí banner „smazání naplánováno" když `currentUserAtom.deletionRequestedAt` je truthy — zobrazí datum i `scheduledHardDeleteAt` `[auto]` | M1 | ⬜ |
| PP-55 | FE `DeleteAccountModal` dělá dryRun=true call při otevření — pokud `blocking.length > 0` přepne na `PJBlockView` (sole PJ blocker) `[auto]` | M1 | ⬜ |
| PP-56 | `useRequestSelfDeletion` onSuccess (dryRun=false) vymaže `accessTokenAtom`, `refreshTokenAtom`, `currentUserAtom` → auto-logout bez BE volání `[auto]` | M1 | ⬜ |
| PP-57 | BE `DELETE /users/:id` — self-delete (requester.id === id) povoleno; jiný user bez Admin role → 403 `[auto]` | M1, M4 | ⬜ |

---

## I. Appearance — tema a barva chatu

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| PP-58 | FE `AppearanceSection` ukládá `themeSettings.adjust.brightness/contrast` a `themeSettings.overrides` přes `PATCH /users/me` — merge sémantika zachová ostatní klíče v themeSettings `[auto]` | M1 | ⬜ |
| PP-59 | FE `AppearanceSection` živý preview (`platformThemePreviewAtom`) se vypne při unmountu sekce (`setPreview(null)`) `[auto]` | M1 | ⬜ |
| PP-60 | FE `ChatColorPicker` ukládá hex color přes `update.mutateAsync({ chatColor: color })` — BE validuje regex `/^#[0-9a-fA-F]{6}$/` (viz PP-08) `[human]` | M2 | ⬜ |

---

## J. Role-based access gaté na controller endpointech

| # | Bod | Metoda | Status |
|---|-----|--------|--------|
| PP-61 | `GET /users/me` — vyžaduje `JwtAuthGuard`; bez tokenu → 401 `[auto]` | M1, M4 | ⬜ |
| PP-62 | `PATCH /:id` — jen `requester.id === id` nebo `Admin+`; jiný user → 403 `[auto]` | M1, M4 | ⬜ |
| PP-63 | `GET /users/getCalendarMonth/:id` / `PUT /users/updateCalendarMonth/:id` — self nebo `role <= Admin` (chybná podmínka: `requester.role > UserRole.Admin` = Superadmin je blokován pro cizí ID — pozor na enum hodnoty: nutno ověřit zda `Admin < Superadmin` numericky) `[auto]` | M1, M4 | ⬜ |
| PP-64 | `PUT /users/:id/reset-password` — pouze Superadmin; jiná role → 403 `PASSWORD_RESET_REQUIRES_SUPERADMIN` `[auto]` | M1, M4 | ⬜ |
| PP-65 | `GET /presence/online` vyžaduje `JwtAuthGuard` `[auto]` | M1, M4 | ⬜ |

---

## Test coverage gaps

- `usePresenceInit` idle/active logika (timer tick, visibilitychange) — existující spec nekryje timer tick ani visibilitychange handler → kandidát na M7
- FE `AvatarUploader` — žádný test; zejm. drag&drop flow, MIME validace klient-side, object URL cleanup → kandidát na M7
- FE `PrivacySection` — žádný test toggle logiky ani `reconnectSocket` call → kandidát na M7
- FE `SecuritySection` — žádný test; cooldown banner logika, username request form submit → kandidát na M7
- FE `AppearanceSection` — žádný test; themeSettings merge, preview atom lifecycle → kandidát na M7
- BE `users.repository.ts updateLastSeen` — není testováno v repository spec → kandidát na M7
- BE `presence.service.spec.ts` nekryje případ kdy `findOnlineSince` vrátí prázdné pole ani konfiguraci s jiným `PRESENCE_THRESHOLD_HOURS` → kandidát na M7
- FE `useEmailChangeRequest` — žádný test; kritický path navíc obsahuje URL bug (PP-26) → M7 po opravě URL

---

## Známá rizika

- **PP-26 (kritické)**: FE volá `/users/me/email-change-request`, BE exponuje `/users/me/request-email-change` — funkce změny e-mailu je nefunkční; každý pokus vrátí 404.
- **PP-39/PP-40 (kritické)**: `presence:snapshot`, `presence:update`, `presence:idle`, `presence:active` WS eventy neexistují na BE straně. FE `presenceStatusMapAtom` je vždy prázdná → `OnlineDot` nikdy nezobrazí online/idle status, `useIsOnline` vždy vrátí false. BE jen obnovuje `lastSeenAt` přes HTTP guard (PP-42) a nabízí REST endpoint `GET /presence/online` — ale chybí WS push notifikace.
- **PP-11 (nesoulad)**: FE `headerSchema` povoluje `displayName` max 64 znaků, BE `UpdateUserDto` má `@MaxLength(32)` — uživatel může odeslat 33–64 znakový displayName který FE přijme, BE vrátí 400 bez inline erroru (jen toast `Profil uložen` se nezobrazí a error se nespracuje v `onSuccess`).
- **PP-63 (podezřelé)**: Podmínka `requester.role > UserRole.Admin` pro admin gate — pokud enum `UserRole` má `Admin < Superadmin` numericky, Superadmin je blokován pro cizí userId (správně), ale Admin projde (správně). Nutno ověřit enum hodnoty — chyba by způsobila, že Superadmin nemůže číst/zapisovat calendarMonth pro cizí uživatele.
