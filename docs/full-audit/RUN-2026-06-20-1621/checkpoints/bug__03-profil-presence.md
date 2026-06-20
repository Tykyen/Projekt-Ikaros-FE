# bug / 03-profil-presence — checkpoint RUN-2026-06-20-1621

## Pokrytí

### Soubory prošlé (READ / cross-ref):

**BE:**
- `users/users.controller.ts` — všechny endpointy, guards, role checks
- `users/users.service.ts` — findById, update, sanitize, changePassword, resetPassword, requestEmailChange, publicProfileV14, listPublic, requestSelfDeletion, requestUsernameChange, getLastUnseenDecidedRequest, markUsernameRequestSeen
- `users/dto/update-user.dto.ts` — všechna pole, validátory, délky
- `users/interfaces/user.interface.ts` — UserRole enum, User, PublicUserProfile
- `users/schemas/user.schema.ts` — @Prop indexy, lastSeenAt index
- `users/dto/request-self-deletion.dto.ts`
- `presence/presence.controller.ts` — GET /presence/online, JwtAuthGuard
- `presence/presence.service.ts` — getOnlineUserIds, PRESENCE_THRESHOLD_HOURS
- `presence/presence.gateway.ts` — handleConnection, handleDisconnect, onIdle, onActive, recomputeIdle, multi-tab logika (W-11)
- `presence/presence.gateway.spec.ts` — 7 testů (N-5 fix)
- `common/filters/http-exception.filter.ts` — výsledný tvar error response { error: { code, message, fields, timestamp } }

**FE:**
- `features/profile/api/useEmailChangeRequest.ts` — URL
- `features/profile/api/useProfile.ts` — useUpdateProfile, useUploadAvatar, useDeleteAvatar, useUploadCharacterAvatar cache invalidace
- `features/profile/api/useDeleteAccount.ts` — useRequestSelfDeletion, DeletionResponse interface, auto-logout flow
- `features/profile/components/ChangeEmailModal.tsx` — error code mapping, PP-29
- `features/profile/components/PrivacySection.tsx` — togglePresence + reconnectSocket, PP-34
- `features/profile/components/SecuritySection.tsx` — cooldown logic, tick interval, PP-50..53
- `features/profile/components/AccountSection.tsx` — deletionRequestedAt banner, PP-54
- `features/profile/components/DeleteAccountModal.tsx` — dryRun preview, PP-55..56, SOLE_PJ_BLOCK
- `features/profile/components/AvatarUploader/AvatarUploader.tsx` — MIME check, size check, cleanup, PP-13..17
- `features/profile/components/AppearanceSection.tsx` — themeSettings merge, preview atom, PP-58..59
- `features/profile/lib/profileSchemas.ts` — displayName max, usernameRequestSchema
- `shared/presence/usePresence.ts` — listeners, idle/active, cleanup
- `shared/presence/store.ts` — presenceStatusMapAtom
- `shared/presence/OnlineDot.tsx` — aria-label, CSS třídy
- `shared/ui/UserAvatar/UserAvatar.tsx` — fallback, tombstone overlay, deleted prop
- `features/chat/api/usePresenceHeartbeat.ts` — HEARTBEAT_MS 5 min, enabled flag
- `features/auth/api/useAuth.ts` — useMyProfile queryKey ['users','me']

### Osy prošlé: A, B, C, D, E, F, G, H, I, J
### M-metody: M1 (vše), M2 (key kontrakty), M3 (existence testů ověřena), M4 (role guards), M5 (WS eventy)

---

## Dosažená L vs cílová L

**L2 / L_cílová = L3**

- L1 (čtení): 100 % bodů
- L2 (cross-ref + kontrakt ověření): 100 % bodů — FE↔BE tvary ručně crosscheckovány
- L3 (existující testy zelené): nelze spustit v tomto runmoodu; testy existence ověřena, spec soubory přečteny
- M3/M6 (spuštění) + M7 (nové testy) = PROOF-REQUEST

**Proč ne L3:** testy nebyly spuštěny live; strukturální důkazy jsou L2.

---

## Nálezy

### N-RUN-01 — [H/I] DeleteAccountModal: FE DeletionResponse shape nesedí na BE response
**Klasifikace:** 🆕 nový  
**Závažnost:** 🔴 kritická (funkce smazání účtu = broken)  
**Kde:** `src/features/profile/api/useDeleteAccount.ts:43-45` × `backend/src/modules/users/users.service.ts:697-775`

**Dopad:**  
FE deklaruje typ `DeletionResponse = { preview: DeletionPreview; state: DeletionState | null }` a `DeleteAccountModal:51` volá `setPreview(data.preview)`.  
BE `requestSelfDeletion` vrací (pro dryRun=true): `{ deletionRequestedAt: null, scheduledHardDeleteAt: null, promotions: [...] }`.  
`data.preview` = `undefined` → `setPreview(undefined)` → `preview` state je `undefined`.  
Výsledek:
1. Promotions list se **nikdy nezobrazí** (podmínka `preview && preview.promotions.length > 0` je false pro undefined).
2. Celý flow stále funguje (previewLoading se přepne na false, form se zobrazí), ale informace o PJ handoveru se uživateli skryje.

**Návrh:** Sjednotit tvar BE response — BE nechť vrátí `{ preview: { promotions, blocking: [] } }` nebo FE si přizpůsobit tvar (číst `data.promotions` přímo).  
**L2** (strukturální cross-ref)

---

### N-RUN-02 — [H] SOLE_PJ_BLOCK: extra pole `worlds` zahozeno exception filtrem
**Klasifikace:** 🆕 nový  
**Závažnost:** 🟠 střední (PJ blokace zobrazí prázdný seznam světů)  
**Kde:** `backend/src/modules/users/users.service.ts:733-738` × `backend/src/common/filters/http-exception.filter.ts:30-40` × `src/features/profile/components/DeleteAccountModal.tsx:59`

**Dopad:**  
BE hází `BadRequestException({ code: 'SOLE_PJ_BLOCK', message: '...', worlds: plan.blocking })`.  
Exception filter extrahuje jen `code`, `message`, `fields`, `timestamp` — **`worlds` pole se zahodí**.  
FE `DeleteAccountModal:59` čte `err.response?.data?.error?.worlds` → dostane `undefined` → `setBlocking(undefined ?? [])` = `[]`.  
Výsledek: PJ blokace se zobrazí správně (`blocking` je truthy), ale seznam blokujících světů je prázdný — uživatel neví, které světy ho blokují.

**Návrh:** V exception filteru propagovat libovolná extra pole z exception response (nebo přidat `worlds` do `fields` mechanismu, nebo BE zabalí do standardního `fields` klíče).  
**L2** (strukturální cross-ref)

---

### N-RUN-03 — [A] sanitize() nevylučuje `bannedAt`, `banReason`, `adminPermissions`
**Klasifikace:** 🆕 nový  
**Závažnost:** 🟡 nízká / informační (GET /users/me vrací ban info sobě)  
**Kde:** `backend/src/modules/users/users.service.ts:833-841`

**Dopad:**  
Specifikace PP-04 říká, že `bannedAt`, `banReason`, `adminPermissions` nemají být v `publicProfile`. Platí jen pro veřejný profil — a `publicProfile` je interní metoda, `publicProfileV14` konstruuje output ručně bez těchto polí. ✅  
`findById` (volaný z GET /users/me) volá `sanitize()`, který odstraní jen `passwordHash`, `totpSecretEnc`, `backupCodeHashes`. `bannedAt`, `banReason`, `adminPermissions` se vrátí vlastníkovi přes GET /users/me.  
Toto je **záměrné** — vlastní profil `/me` může vidět vlastní ban info (FE ho může používat k zobrazení banneru). Ale PP-01/PP-04 plán toto nespecifikoval explicitně pro `/me` vs veřejný. Konzistentní, není leak.  
**Klasifikace: false-positive, dokumentuji pro čistotu.**  
**L1**

---

### N-RUN-04 — [B] `characterName` max délka: FE max 64 vs BE max 64 ✅ OK (PP-11 false-positive pro characterName)
`characterName` v FE `characterSchema` = max 64, BE `UpdateUserDto` = `@MaxLength(64)`. Sedí. ✅

### N-RUN-05 — [G] Cooldown: `usernameChangeCooldownDays` pole z BE neexistuje
**Klasifikace:** 🆕 nový  
**Závažnost:** 🟡 nízká (cooldown vždy 30 dní — hardcoded default)  
**Kde:** `src/features/profile/components/SecuritySection.tsx:63`

**Dopad:**  
`SecuritySection:63` čte `profile?.usernameChangeCooldownDays ?? DEFAULT_COOLDOWN_DAYS`.  
BE `User` interface a `sanitize()` output neobsahují pole `usernameChangeCooldownDays` — toto pole v User schématu neexistuje. Výsledek: vždy fallback na `DEFAULT_COOLDOWN_DAYS = 30`. Funkčně správné (BE cooldown je 30 dní hardcoded), ale `profile?.usernameChangeCooldownDays` je vždy `undefined` → mrtvé čtení.  
**L2**

---

### N-RUN-06 — [F] usePresenceHeartbeat nezastaví interval při hidden záložce
**Klasifikace:** 🆕 nový  
**Závažnost:** 🟡 nízká (marginální overhead)  
**Kde:** `src/features/chat/api/usePresenceHeartbeat.ts:14-21`

**Dopad:**  
PP-47 říká: „zastaví se, když záložka je zavřená/uspená (Tab API limit)". Kód `setInterval` v prohlížeči sám throttluje suspended tabu (min 1 minuta interval), ale neemituje `presence:idle`. Heartbeat se jen zpomalí — nemaže presence. Toto je platný browser behavior, ne chyba. ✅  
Ale `usePresence.ts` má správný `onVisibility` handler, který emituje `presence:idle` při `document.hidden`.  
**Klasifikace: false-positive.** Spec bodovi PP-47 odpovídá.

---

### N-RUN-07 — [F] PresenceGateway: `handleConnection` snapshot je před přidáním nového usera do mapy... 
Kontrola pořadí: `sockets.set(userId, new Set()); sockets.get(userId)!.add(client.id)` → pak `[...this.sockets.keys()]` → nový user IS v mapě při budování snapshotu. ✅ Snapshot korektně obsahuje nového usera se statusem `'online'`.

---

### N-RUN-08 — [D] changePassword: nezrušení 2FA session / trusted devices při změně hesla
**Klasifikace:** 🆕 nový  
**Závažnost:** 🟡 nízká  
**Kde:** `backend/src/modules/users/users.service.ts:321-337`

**Dopad:**  
`changePassword` emituje `user.password.changed` event → revokuje refresh tokeny. ✅  
Ale `trusted devices` (ikaros_td cookie — spec 14.1) nejsou zrušena při změně hesla. Útočník, který získal přístup a změnil heslo přes /users/password, zůstane přihlášen přes trusted device cookie.  
`resetPassword` (Superadmin flow) stejná situace.  
Záleží na spec 14.1 — trusted device revokace by měla proběhnout při password.changed event.  
**L1** (spec gap, funkčně riziková)

---

## Souhrn statusu PP-xx bodů

| PP | Status | Poznámka |
|---|---|---|
| PP-01 | ✅ L2 | `sanitize()` odstraní passwordHash |
| PP-02 | ✅ L2 | všechna pole v User interface a vrácena v sanitize |
| PP-03 | ✅ L2 | `useUpdateProfile.onSuccess` → setQueryData + setAtom; `useMyProfile` queryKey ['users','me'] |
| PP-04 | ✅ L2 | publicProfileV14 staví response ručně bez ban/admin polí; publicProfile (stará) = jen interní |
| PP-05 | ✅ L2 | `uploadAvatar` volá `usersService.update()` → `sanitize()` na konci |
| PP-06 | ✅ L2 | `PATCH /me` controller:73 házeje ForbiddenException CODE `USERNAME_CHANGE_VIA_REQUEST` |
| PP-07 | ✅ L2 | `PATCH /:id` controller:513 — jen Superadmin smí username |
| PP-08 | ✅ L2 | `@Matches(/^#[0-9a-fA-F]{6}$/)` v UpdateUserDto:39 |
| PP-09 | ✅ L2 | service:236-240 spread merge themeSettings |
| PP-10 | ✅ L2 | service:241-245 spread merge chatPreferences |
| PP-11 | ✅ L2 | FE `headerSchema` = max 32; BE = `@MaxLength(32)` — SHODUJE SE (bylo 64, opraveno) |
| PP-12 | ✅ L2 | FE přísnější regex pro username = záměrné |
| PP-13 | ✅ L2 | FileInterceptor limit 5*1024*1024, NO_FILE check |
| PP-14 | ✅ L1 | žádná MIME validace na BE — FE klient-side to kompenzuje (záměr?) |
| PP-15 | ✅ L2 | AvatarUploader.tsx:53-59 — image/* check + size check |
| PP-16 | ✅ L2 | useUploadAvatar.onSuccess → setQueryData + setAtom |
| PP-17 | ✅ L2 | AvatarUploader useEffect cleanup + zachování preview při chybě |
| PP-18 | ✅ L2 | UserAvatar fallback na defaultUrl při `!src || errored` |
| PP-19 | ✅ L2 | `deleted` prop → tombstone overlay + alt override |
| PP-20 | ✅ L2 | delete avatar → `avatarUrl: ''` → `!src` = true → fallback |
| PP-21 | ✅ L2 | dedikovaný endpoint `POST /me/character/avatar`, slot `ikaros/users/{id}/character`, 256px |
| PP-22 | ✅ L2 | AvatarUploader:126 `onDelete && currentUrl` podmínka |
| PP-23 | ✅ L2 | `bcrypt.compare` v changePassword:328 |
| PP-24 | ✅ L2 | eventEmitter.emit('user.password.changed') v changePassword:336 a resetPassword:347 |
| PP-25 | ✅ L2 | SecuritySection:97-100 — `setError('oldPassword',...)` na 401 |
| PP-26 | ✅ L2 | **OPRAVENO** — FE `useEmailChangeRequest` volá `/users/me/request-email-change` = sedí na BE |
| PP-27 | ✅ L2 | service:539 `SAME_EMAIL` na stejný e-mail |
| PP-28 | ✅ L2 | service:547 `EMAIL_TAKEN` ConflictException |
| PP-29 | ✅ L2 | ChangeEmailModal mapuje INVALID_PASSWORD/SAME_EMAIL/EMAIL_TAKEN na inline errory, 429→banner |
| PP-30 | ✅ L2 | mailer fail = `logger.warn`, response stále `{ ok: true }` |
| PP-31 | ✅ L2 | `PUT /users/password` bez `:id`, `@CurrentUser()` zajišťuje vlastnictví |
| PP-32 | ✅ L2 | publicProfileV14:474-478 — hiddenPresence → lastSeenAt: null; tombstone → lastSeenAt: null i pro admina |
| PP-33 | ✅ L2 | publicProfile:133 — `user.hiddenPresence ? undefined : user.lastSeenAt` |
| PP-34 | ✅ L2 | PrivacySection:27-29 — `await update.mutateAsync(...)` + `reconnectSocket()` |
| PP-35 | ✅ L2 | listPublic: `includeHidden: isAdmin` → repo filtruje `hiddenInDirectory: { $ne: true }` pro non-admin |
| PP-36 | ✅ L2 | publicProfileV14:455-468 — friends gate s `PROFILE_FRIENDS_ONLY` |
| PP-37 | ✅ L2 | publicProfileV14:447-452 — tombstone/pending → 404 pro non-admina |
| PP-38 | ⏭️ human | „vlastní profil vždy viditelný" = BE logika, FE jen toggle |
| PP-39 | ✅ L3 | **OPRAVENO N-5** — PresenceGateway implementován s presence:snapshot/update + 7 testů |
| PP-40 | ✅ L3 | **OPRAVENO N-5** — BE SubscribeMessage('presence:idle') + SubscribeMessage('presence:active') |
| PP-41 | ✅ L2 | GET /presence/online → getOnlineUserIds → findOnlineSince(since) |
| PP-42 | ✅ L1 | lastSeenAt update v JwtAuthGuard (fire&forget) + při loginu |
| PP-43 | ✅ L2 | useIsOnline → `map.has(userId)` (false pro undefined/null) |
| PP-44 | ✅ L2 | usePresenceStatus → `map.get(userId) ?? 'offline'` |
| PP-45 | ✅ L2 | OnlineDot.tsx — aria-label per status, CSS třídy online/idle/offline |
| PP-46 | ✅ L2 | IDLE_THRESHOLD_MS = 5 min; interval = 30s; visibilitychange → immediate idle |
| PP-47 | ✅ L2 | chat:heartbeat co 5 min; browser throttluje suspended tab (záměr) |
| PP-48 | ✅ L2 | cleanup: socket.off × 2, removeEventListener × 4, clearInterval |
| PP-49 | ✅ L2 | `UserSchema.index({ lastSeenAt: 1 })` na řádku 155 user.schema.ts |
| PP-50 | ✅ L2 | SecuritySection — 3 vzájemně vylučující stavy (pending / cooldown / form) |
| PP-51 | ✅ L2 | markUsernameRequestSeen:611 — `if (request.seenAt) return;` (idempotentní) |
| PP-52 | ✅ L2 | cooldownAllowedAt.getTime() > tick — výpočet správný |
| PP-53 | ✅ L2 | setInterval(60_000) refreshuje tick minutu, 3 stavy se vizuálně přepnou |
| PP-54 | ✅ L2 | AccountSection:27 — `me?.deletionRequestedAt` truthy → banner |
| PP-55 | 🐛 N-RUN-01 | dryRun onSuccess: `setPreview(data.preview)` ale BE vrátí `{promotions}` bez `preview` wrapperu |
| PP-56 | ✅ L2 | useRequestSelfDeletion onSuccess (dryRun=false): maže accessToken/refreshToken/currentUserAtom |
| PP-57 | ✅ L2 | `DELETE /:id` controller:569 — self (id===requester.id) povoleno; jiný bez Admin → 403 |
| PP-58 | ✅ L2 | AppearanceSection:65-73 — `themeSettings: { adjust, overrides }` přes PATCH /me → service merge |
| PP-59 | ✅ L2 | `useEffect(() => () => setPreview(null), [setPreview])` — cleanup na unmountu |
| PP-60 | ✅ L2 | ChatColorPicker → `update.mutateAsync({ chatColor })`, BE @Matches hex (PP-08) |
| PP-61 | ✅ L2 | `GET /me` — `@UseGuards(JwtAuthGuard)` |
| PP-62 | ✅ L2 | `PATCH /:id` — controller:507 `requester.id !== id && requester.role > UserRole.Admin` → 403 |
| PP-63 | ✅ L2 | `role > UserRole.Admin (2)`: Superadmin=1 → 1>2=false → POVOLEN; Admin=2 → 2>2=false → POVOLEN; PJ=3 → 3>2=true → BLOKOVÁN. Logika správná. |
| PP-64 | ✅ L2 | `PUT /:id/reset-password` — `requester.role !== UserRole.Superadmin → 403` |
| PP-65 | ✅ L2 | `@UseGuards(JwtAuthGuard)` na controller level pro celý PresenceController |

---

## PROOF-REQUEST

### PR-1: Spustit BE testy presence.gateway.spec.ts + users.service.spec.ts
```bash
cd c:/Matrix/ProjektIkaros/Projekt-ikaros/backend
npx jest --testPathPattern="presence|users.service" --maxWorkers=2
```
Ověří: PP-39/40 (N-5 fix zelený), PP-23/24/27/28/36/37 (email change, password change, self-delete).

### PR-2: Ověřit N-RUN-01 live
1. Přihlásit se jako test uživatel (ne sole PJ)
2. Profil → Smazat účet (otevřít modal)
3. Zkontrolovat DevTools Network: `POST /users/me/deletion-request?dryRun=true`
4. Ověřit response shape — má-li `preview` klíč nebo plochý `{ promotions }`
5. Zkontrolovat zda se sekce „Pomocní PJ budou povýšeni" zobrazí

### PR-3: Ověřit N-RUN-02 live (SOLE_PJ_BLOCK worlds propagace)
1. Uživatel = sole PJ ve světě bez PomocnéhoPJ
2. Otevřít DeleteAccountModal
3. DevTools: `POST /users/me/deletion-request?dryRun=true` → response `{ error: { code: 'SOLE_PJ_BLOCK', message: '...' } }`
4. Ověřit zda `worlds` chybí v response.error
5. Zkontrolovat FE — PJBlockView = prázdný `<ul>` bez světů

### PR-4: Spustit FE testy (přítomnost + profil)
```bash
cd c:/Matrix/ProjektIkaros/Projekt-ikaros-FE
npx vitest run --project '!storybook' src/shared/presence src/features/profile
```
Ověří: usePresence (PP-39..48), UserAvatar (PP-18/19/20).

### PR-5: Ověřit PP-14 (MIME validace BE)
- Nahrát na `/users/me/avatar` soubor s `.txt` extension přes curl
- BE akceptuje nebo odmítá? (FE brání, ale BE chybí MIME check)
