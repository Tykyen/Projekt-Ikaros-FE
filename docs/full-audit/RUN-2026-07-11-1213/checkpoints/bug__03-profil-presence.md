# bug — 03 Profil & presence · dosažená L2 (spot L3) / cílová L2–L3 [auto]

Oblast: `docs/bug-plan/03-profil-presence.md` (PP-01…PP-65). Styl bug, registr `docs/bug-audit.md` (prefix N-).
BE `modules/users` + `modules/presence`; FE `features/profile` + `shared/presence` + `shared/ui/UserAvatar`.

## Souhrn
**1 nový nález (🟡).** Naprostá většina „kritických/known" bodů bug-planu je v HEAD kódu už OPRAVENÁ (N-5, N-6a, UM-01/07) nebo je to planý poplach. Bug-plan 03 byl psaný proti staršímu stavu.

---

## 🆕 NOVÝ nález

### N-RUN — [D. Bezpečnost/heslo] FE čeká status 401, BE vrací 400 → inline chyba „špatné staré heslo" se nikdy nezobrazí
- **Kde:** FE `src/features/profile/components/SecuritySection.tsx:97` `if (isAxiosError(err) && err.response?.status === 401)` × BE `backend/src/modules/users/users.service.ts:366` `changePassword` → `throw new BadRequestException({ code: 'INVALID_PASSWORD' })` (**400**, komentář FIX-50 „400, ne 401: špatné staré heslo není auth-selhání requestu").
- **Dopad:** při špatném současném hesle BE vrátí 400 `INVALID_PASSWORD`; FE podmínka `=== 401` je false → spadne do `else` → generická root chyba „Nepodařilo se změnit heslo. Zkus to znovu." místo cíleného inline erroru na poli `oldPassword` „Současné heslo je špatně". Nejčastější chybová cesta změny hesla ukazuje matoucí hlášku na špatném místě. Není bezpečnostní, jen UX/kontrakt.
- **Vzorec:** contract drift po BE FIX-50 (401→400), FE neaktualizován. Sesterská komponenta `ChangeEmailModal.tsx:57` to řeší SPRÁVNĚ — čte `parseApiErrorCode(err)` (kód `INVALID_PASSWORD`), ne status. SecuritySection měl použít stejný vzor.
- **Návrh:** ve `SecuritySection.onSubmitPassword` číst error přes `parseApiErrorCode(err) === 'INVALID_PASSWORD'` (status-agnostic) místo `status === 401`.
- **Klasifikace:** 🆕 (není v `bug-audit.md` ani `docs/dluhy.md`). PP-23/PP-25 v bug-planu chybně předpokládají 401.
- **L:** L2 (obě strany staticky ověřeny; červený test by dal L4).

---

## ♻️ Známé/opravené (NEHLÁSÍM jako nové) — potvrzeno proti HEAD

- **PP-39/PP-40 (bug-plan „KRITICKÉ": presence WS eventy neexistují)** → **OPRAVENO = N-5.** `presence/presence.gateway.ts` implementuje `presence:snapshot/update/idle/active` (in-memory registry, per-socket idle W-11, hidden-mód W-RUN-01). FE `usePresence.ts` konzumuje přes `useSocketEvent` (reregistrace po reconnectu). Kontrakt sedí.
- **PP-26 (bug-plan „URL MISMATCH kritické")** → **OPRAVENO = N-6a.** FE `useEmailChangeRequest.ts:13` volá `/users/me/request-email-change` = BE `users.controller.ts:264`. Žádný 404.
- **PP-11 (displayName FE 64 vs BE 32)** → **OPRAVENO.** FE `profileSchemas.ts:17` `displayName max(32)` = BE `update-user.dto.ts:23` `@MaxLength(32)`. Sedí (C-14 vyřešeno).
- **PP-14 (BE nevaliduje MIME avataru)** → **NEPLATÍ (UM-01/UM-07).** `upload.service.ts:615-626 uploadUserImage` má image-whitelist + `assertMagicBytes` (magic-byte kontrola). Avatar upload je typově chráněný.
- **PP-11/N-11 themeId** → `@IsIn(THEME_IDS)` (`update-user.dto.ts:58`). OK.

## 🔓 Planý poplach (bug-plan „podezřelé")

- **PP-63 (calendar role gate „Superadmin blokován?")** → **FALSE ALARM.** Enum `user.interface.ts:4` `Superadmin=1, Admin=2` (nižší číslo = vyšší práva). Gate `requester.role > UserRole.Admin` (controller :412/441/490/511/532) tedy pustí Superadmin(1) i Admin(2), blokuje PJ(3)+. Korektní. Bug-plan mylně předpokládal `Admin < Superadmin` numericky.

---

## Prošlé body (ověřeno OK, L1–L2, žádný nový nález)

- **A. GET /me & sanitize:** PP-01 `sanitize()` škrtá `passwordHash`+`totpSecretEnc`+`backupCodeHashes` (service :881). PP-02 FE User pole kompletní. PP-03 `useUpdateProfile` píše `setQueryData(['users','me'])` + `currentUserAtom` (useProfile.ts:25-26); `useMyProfile` key `['users','me']` (useAuth.ts:218). PP-04 starý `GET profile/:id` ODSTRANĚN (controller :395), `publicProfile`/`publicProfileV14` whitelist. PP-05 avatar upload → `usersService.update` → sanitize.
- **B. PATCH /me:** PP-06 `USERNAME_CHANGE_VIA_REQUEST` (controller :74). PP-07 `USERNAME_CHANGE_REQUIRES_SUPERADMIN` (:538). PP-08 chatColor regex `/^#[0-9a-fA-F]{6}$/` (dto :48). PP-09/10 themeSettings/chatPreferences merge (service :239-250) — pozn.: je SHALLOW spread merge (top-level klíče), ne hloubkový; pro kontrakt „nový klíč přidán, existující zachován" dostačuje, ne nález.
- **C. Avatar:** PP-13 FileInterceptor 5 MB + `NO_FILE` (controller :102/109). PP-15/17/22 AvatarUploader klient validace image/*+5MB, revoke objectURL při unmount, delete jen `onDelete && currentUrl` (:55-62/46-50/131). PP-16 `useUploadAvatar` setQueryData+atom (:58-60). PP-18/19/20 UserAvatar fallback `!src||errored`, tombstone band + alt „Smazaný účet" (:65/69-88). PP-21 dedikovaný `/me/character/avatar`, sloty avatar 512 / character 256 (controller :114/145).
- **D. Bezpečnost:** PP-23 bcrypt compare (service :361) — **ale 400 ne 401, viz N-RUN.** PP-24 emit `user.password.changed` po change+reset (:372/384). PP-27 `SAME_EMAIL` case-insensitive (:587). PP-28 `EMAIL_TAKEN` 409 (:595). PP-29 ChangeEmailModal mapuje kódy přes `parseApiErrorCode`, 429→banner (:57-75). PP-30 mailer fail = `logger.warn`, `{ok:true}` (:609-633). PP-31 `PUT password` bez `:id`, `@CurrentUser` (:547).
- **E. Privacy:** PP-32 publicProfileV14 `lastSeenAt=null` pro hiddenPresence|tombstone (service :519-524). PP-33 publicProfile podmíněné (:134). PP-34 PrivacySection togglePresence → `reconnectSocket()` (:28). PP-35 listPublic `includeHidden=isAdmin` (:418). PP-36 friend-only 403 `PROFILE_FRIENDS_ONLY`, self projde (:500-514). PP-37 tombstone/pending → 404 non-admin (:492).
- **F. Presence:** PP-41 `GET /presence/online` threshold `PRESENCE_THRESHOLD_HOURS` def 25 (service). PP-42 `updateLastSeen` fire&forget v `JwtAuthGuard` (:77-81). PP-43/44/45 useIsOnline/usePresenceStatus/OnlineDot stavy + aria-label. PP-46 idle 5 min, tick 30 s, `document.hidden`→idle (usePresence :24/69-90). PP-48 cleanup přes useSocketEvent+useEffect return. PP-49 `UserSchema.index({ lastSeenAt: 1 })` (schema :190).
- **G. Username request:** PP-50/51 controller+service `username-request` base CRUD (N-6b), `markUsernameRequestSeen` idempotentní (:659). PP-52/53 cooldown + tick 60 s (SecuritySection :57-70).
- **H. Účet:** PP-55/56 self-deletion service (`requestSelfDeletion` dryRun/SOLE_PJ_BLOCK/USERNAME_MISMATCH :745). PP-57 `DELETE /users/:id` gate (self / role<=Admin).
- **J. Role gaty:** PP-61 `GET /me` JwtAuthGuard. PP-62/63/64 gaty korektní (viz PP-63 planý poplach). PP-65 `/presence/online` JwtAuthGuard (controller :14).

## Neprošel plně (nižší priorita, čistě čtení, bez podezření)
- I. Appearance PP-58/59/60 (AppearanceSection themeSettings merge + platformThemePreviewAtom lifecycle) — jen letmo; merge sémantika stejná jako PP-09 (shallow spread, OK pro kontrakt). ChatColorPicker → PP-08 regex platí. Bez nálezu.

## PROOF-REQUESTy
- **N-RUN:** M7 červený test — FE `SecuritySection` submit se špatným heslem → mock 400 `INVALID_PASSWORD` → očekávat inline error na `oldPassword`, ne root banner (dnes selže). Po fixu zelený.
- (volitelně) M3 presence.gateway.spec + usePresence.spec projít pro L3 na PP-39/40/46/48.
