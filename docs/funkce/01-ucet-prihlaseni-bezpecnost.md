# 01 — Účet, přihlášení & bezpečnost

> Kódem ověřená inventura. FE = `Projekt-ikaros-FE`, BE = `Projekt-ikaros/backend`.
> Globální role (UserRole): Superadmin(1), Admin(2), Ikarus(9), SpravceClanku(10), SpravceGalerie(11), SpravceDiskuzi(12).
> Pozn.: nově registrovaný uživatel dostává roli `Hrac` — ta ale v `UserRole` enumu na FE **neexistuje** (jen world role). Viz Nesrovnalosti.

---

### Registrace
- **Co to je:** Vytvoření nového účtu (modal nad úvodníkem). Po úspěchu BE rovnou vrátí tokeny + uživatele (auto-login).
- **Kde:** Modal `RegisterModal` (otevřen z LoginModalu „Zaregistruj se" nebo přes `registerModalOpenAtom`). Není to samostatná route.
- **Kdo:** Anonym. Žádný guard.
- **Co jde dělat:**
  - Pole: E-mail, Přezdívka (username), Heslo, Potvrzení hesla, checkbox „Souhlasím s podmínkami" (link na `/podminky`), **deklarativní věk** (radio „Je mi 15 nebo více" / „Je mi méně než 15 let", povinné — 20.2/§C2), Cloudflare Turnstile captcha. Pod souhlasem informativní věta „Registrací bereš na vědomí Zásady OÚ" (odkaz na `/soukromi`; Zásady = informace, ne součást souhlasu).
  - Live kontrola dostupnosti přezdívky i e-mailu (ikona) přes `GET /auth/check-username?u=` a `/auth/check-email?e=` (debounce, throttle 60/min).
  - Indikátor síly hesla (`PasswordStrengthIndicator`).
  - Toggle zobrazení hesla.
  - Skrytý honeypot field `hp` (anti-bot, max 0 znaků). Vynucený na **obou** stranách: FE zod `max(0)` + BE `RegisterDto.hp` `@MaxLength(0)` — prázdné (reálný uživatel) projde, vyplněné (bot) → 400. *(BE `hp` doplněno 2026-06-19 — dřív chybělo, `forbidNonWhitelisted` PC-07 odmítal `hp:''` → registrace rozbitá.)*
  - Tlačítko „Vytvořit účet" je disabled dokud captcha nedá token nebo je username/email obsazený.
- **Hranice / co neumí:**
  - Heslo min **8** znaků (FE `registerSchema` + BE `RegisterDto`) — sjednoceno se změnou/resetem (D-NEW-INV-SEC, 2026-06-27).
  - Indikátor síly hesla je čistě vizuální, slabé heslo registraci neblokuje.
  - Bez ověření e-mailu lze účet plně používat (verify je nepovinný, jen badge v profilu).
- **Zvláštnosti:**
  - Captcha fail-closed na **obou** stranách. BE: bez `TURNSTILE_SECRET` v prod → 400 `CAPTCHA_FAILED` (dev/test bez secretu projde s warningem). FE: bez `VITE_TURNSTILE_SITE_KEY` v **prod buildu** → widget se nerenderuje, místo něj hláška + submit blokován (už NEpřepadá tiše na test key — 14.2). Test site key `1x00000000000000000000AA` jen jako dev fallback.
  - GDPR: BE vynucuje `acceptedTerms===true` (jinak `TERMS_NOT_ACCEPTED`), ukládá `acceptedTermsAt` + `termsVersion` (`2026-06-05`).
  - **Věk / nezletilí (20.2/§C2–C3):** volba se odvodí na `isMinor: boolean` (`under15 → true`). **Minimalizace** — neukládá se datum narození, jen flag + `minorSelfDeclaredAt`. Při `isMinor=true` BE nastaví **bezpečné defaulty**: `profileVisibility='friends'` (neveřejný profil), `hiddenInDirectory=true` (skrytý v adresáři) a `parentalConsentStatus='pending'` (u dospělého `'not_required'`). Samotný tok udělení rodičovského souhlasu je zatím stub (jen flag; neblokuje užívání v betě). V profilu se nezletilému ukazuje nenápadná hláška „Účet v režimu ochrany nezletilých" (`AccountSection` → `MinorNotice`).
  - Po registraci BE fire-and-forget pošle verifikační e-mail (selhání mailu registraci nezboří).
  - Throttle `POST /auth/register` = 10/min.
- **Stav:** ✅ funguje.
- **Kód:** FE `src/features/auth/components/RegisterModal.tsx:54` (věk `:296`), `registerSchema.ts:28`, `src/features/auth/api/useAuth.ts:83`, BE `modules/auth/auth.controller.ts:60`, `auth.service.ts:100` (minor defaults `:155`), `dto/register.dto.ts:44` (`isMinor`), `users/schemas/user.schema.ts:93` (`isMinor`/`minorSelfDeclaredAt`/`parentalConsentStatus`), `captcha.service.ts:38`.

---

### Přihlášení + login intent redirect
- **Co to je:** Přihlášení e-mailem nebo přezdívkou. Po úspěchu nasadí access+refresh token a uživatele do Jotai store.
- **Kde:** `LoginModal`. Otevírá se přes `loginModalOpenAtom`, nebo automaticky z URL `?openLogin=1`.
- **Kdo:** Anonym.
- **Co jde dělat:**
  - Pole: „E-mail nebo přezdívka" (identifier), Heslo + toggle zobrazení.
  - Odkazy „Zapomněl/a jsi heslo?" (→ ForgotPasswordModal) a „Zaregistruj se".
  - Po loginu toast „Vítej zpět, …" a navigace na uloženou intent cestu nebo `/`.
- **Login intent (deep-link redirect):** Per-route loader `requireAuth` (router.tsx): když chybí JWT v `localStorage` (`ikaros.jwt`), uloží `pathname+search` přes `saveLoginIntent` a redirectne na `/?openLogin=1`. Po loginu `consumeLoginIntent` vrátí cestu a naviguje tam.
- **Hranice / co neumí:**
  - `requireAuth` kontroluje jen PŘÍTOMNOST tokenu (parse z `localStorage`), NE jeho platnost. Expirovaný token projde loaderem, reálné odmítnutí řeší BE 401 + interceptor.
  - Login je čistě modal — neexistuje samostatná `/login` route.
- **Zvláštnosti:**
  - Discriminated union odpovědi: `status:'ok'` | `'deletion_pending'` (→ ReactivateAccountModal) | `'totp_required'` (→ TotpVerifyStep). Token se vydá jen u `ok`.
  - Při loginu se cache RQ vyčistí (`qc.clear()`) → žádný leak dat předchozího uživatele při přepnutí účtu ve stejném tabu.
  - Throttle `POST /auth/login` = 5/min.
  - BE gate při loginu: `isDeleted`→401 `DELETED`, `bannedAt`→401 `BANNED`, `deletionRequestedAt`→`deletion_pending`, `totpEnabled`→`totp_required` (pokud zařízení není trusted).
  - Refresh token jde do httpOnly cookie (PC-18), zároveň ve výsledku pro starší klienty.
- **Stav:** ✅ funguje.
- **Kód:** FE `LoginModal.tsx:45`, `useAuth.ts:34`, `router.tsx:123` (requireAuth), BE `auth.controller.ts:75`, `auth.service.ts:175`.

---

### Odhlášení
- **Co to je:** Odhlášení s 5s undo oknem.
- **Kde:** `useLogout` (volá se z hlavičky/menu).
- **Kdo:** Přihlášený.
- **Co jde dělat:**
  - Spustí 5s timer (`LOGOUT_UNDO_MS=5000`), vrací cancel funkci pro „Vrátit".
  - Po vypršení: fire-and-forget `POST /auth/logout` (cookie), vymaže tokeny+user, `qc.clear()`.
- **Hranice / co neumí:** Logout je per-relace (rodina tokenů). Globální „odhlásit všude" = `POST /auth/logout-all` (JWT) — od 2026-07-12 má FE UI: profil → Bezpečnost → karta **„Aktivní relace"** s tlačítkem „Odhlásit se ze všech zařízení" (`useLogoutAll` → lokální úklid `clearLocalSession` + navigace domů; bez undo okna — bezpečnostní akce).
- **Zvláštnosti:** `POST /auth/logout` je idempotentní (204 i pro neplatný token), maže cookie. Změna hesla revokuje všechny refresh tokeny (`user.password.changed`).
- **Invalidace access tokenu (pentest PT-35e, 2026-07-12):** access token nese claim `tv` = `user.tokenVersion`. `logout-all` i změna hesla bumpnou `tokenVersion` (`$inc`) → `JwtAuthGuard` porovná `tv` s DB a STARÝ access token (jinak žije až 3 dny) odmítne `401 SESSION_REVOKED`. Dřív se revokoval jen refresh, access token přežil. Default `tokenVersion=0` + starý token bez claimu = 0 → deploy nikoho neodhlásí (kill až po reálném bumpu). FE (2026-07-12): `SESSION_REVOKED` → instant-logout v `client.ts` (vzor `BANNED`) s toastem „Tato relace byla ukončena".
- **Stav:** ✅ funguje (logout, logout-all vč. FE UI, access-token invalidace).
- **Kód:** FE `useAuth.ts` (`useLogout`/`useLogoutAll`), `SecuritySection.tsx` (karta Aktivní relace), `client.ts` (SESSION_REVOKED); BE `auth.controller.ts:197` (logout), `:213` (logout-all).

---

### Reset hesla (zapomenuté heslo)
- **Co to je:** E-mailový flow obnovy hesla.
- **Kde:** `ForgotPasswordModal` (žádost) → e-mail s linkem → route `/reset-password?token=` (`ResetPasswordPage`).
- **Kdo:** Anonym.
- **Co jde dělat:**
  - ForgotPasswordModal: pole E-mail, „Poslat link". Vždy toast „Pokud e-mail existuje…" (anti-enumeration).
  - ResetPasswordPage: nové heslo + potvrzení, indikátor síly, toggle. Bez tokenu v URL → hláška + „Požádat o nový link". Chybový kód → mapovaná hláška (`INVALID_TOKEN`/`EXPIRED_TOKEN`/`ALREADY_USED`) + link na nový.
  - Po úspěchu navigace na `/?openLogin=1`.
- **Hranice / co neumí:**
  - Reset heslo min **8** znaků (BE `ResetPasswordDto`, FE schema) — shodně s registrací (taky 8 od D-NEW-INV-SEC).
  - Token TTL = 1 hodina (`PASSWORD_RESET_TTL_MS`).
  - 1× aktivní token per user+type (nový `issue` invaliduje předchozí).
- **Zvláštnosti:**
  - D-037: pending soft-delete uživatel token DOSTANE — úspěšný reset zároveň REAKTIVUJE účet (vyčistí deletion flagy) a vrátí `deletionReactivated:true` + `revertablePromotions` (info o povýšených Pomocných PJ uložené do sessionStorage, login modal je pak zobrazí).
  - Reset revokuje všechny refresh tokeny + důvěryhodná zařízení (přes `user.password.changed`).
  - Throttle forgot/reset = 5/min.
  - Mailer fail nezboří flow (anti-enumeration, log warning).
- **Stav:** ✅ funguje.
- **Kód:** FE `ForgotPasswordModal.tsx:31`, `ResetPasswordPage.tsx:33`, BE `auth.controller.ts:226`/`:242`, `auth.service.ts:477` (forgot)/`:507` (reset).

---

### Ověření e-mailu
- **Co to je:** Verifikace e-mailu přes one-time token z mailu.
- **Kde:** Route `/email-verify?token=` (`EmailVerifyPage`); resend z profilu hlavičky a z této stránky.
- **Kdo:** Anonym (verify přes token) i přihlášený (resend vyžaduje JWT).
- **Co jde dělat:**
  - On-mount automaticky `POST /auth/verify-email {token}`. Stavy: verifying → success / failed.
  - Failed: pokud přihlášen → „Poslat verifikaci znovu" (`POST /auth/resend-verification`, throttle 3/min); pokud ne → „Přihlas se a požádej o nový link".
  - V profilu badge „✓ Ověřeno" / „⚠ Neověřeno" + „Poslat znovu".
- **Hranice / co neumí:**
  - Ověření e-mailu NIKDE neblokuje funkce — je čistě informativní badge. Žádný gate „musíš mít ověřený e-mail".
  - Token TTL = 24 h (`EMAIL_VERIFY_TTL_MS`).
- **Zvláštnosti:** verify token se vydá při registraci automaticky; `confirmEmailChange` rovněž nastaví `emailVerified=true`.
- **Stav:** ✅ funguje.
- **Kód:** FE `EmailVerifyPage.tsx:39`, BE `auth.controller.ts:255` (verify)/`:268` (resend), `auth.service.ts:563`/`:576`.

---

### Změna e-mailu
- **Co to je:** Žádost o změnu e-mailu s potvrzením linkem na NOVÝ e-mail + notifikací na starý.
- **Kde:** `ChangeEmailModal` (z profilu hlavičky) → e-mail → route `/email-change/confirm?token=` (`EmailChangeConfirmPage`).
- **Kdo:** Přihlášený (request), anonym (confirm přes token).
- **Co jde dělat:**
  - ChangeEmailModal: read-only aktuální e-mail, pole „Nový e-mail" + „Aktuální heslo" (re-auth) + toggle. Field-mapped chyby: `INVALID_PASSWORD`, `SAME_EMAIL`, `EMAIL_TAKEN`. Toast po odeslání s maskovaným cílem.
  - EmailChangeConfirmPage: on-mount `POST /auth/confirm-email-change {token}`, success → invaliduje `['users','me']`, navigace na profil.
- **Hranice / co neumí:**
  - TTL tokenu `EMAIL_CHANGE_TTL_MS` (BE konstanta v UsersService).
  - Race: pokud někdo mezitím zabere e-mail → 409 `EMAIL_TAKEN` při confirmu.
- **Zvláštnosti:**
  - 2 maily: potvrzovací na nový e-mail (`sendEmailChangeConfirm`) + notice na starý (`sendEmailChangeNotice`).
  - Token nese `newEmail` v `meta`; confirm idempotentní (pokud už má cílový e-mail). Throttle request = 5/min, confirm = 5/min.
- **Stav:** ✅ funguje.
- **Kód:** FE `ChangeEmailModal.tsx:21`, `EmailChangeConfirmPage.tsx:40`, BE `users.controller.ts:256` (request), `auth.controller.ts:279` (confirm), `users.service.ts:515`, `auth.service.ts:614`.

---

### Změna hesla (přihlášený)
- **Co to je:** Změna hesla v profilu se zadáním starého hesla.
- **Kde:** Profil → sekce „Bezpečnost" → karta „Změna hesla".
- **Kdo:** Přihlášený (vlastní účet). `PUT /users/password`.
- **Co jde dělat:** Pole: Současné heslo, Nové heslo, Potvrzení. FE refine: nové ≠ staré, min 8 znaků. Špatné staré heslo → 401 → chyba pod polem.
- **Hranice / co neumí:** Min 8 znaků (BE `ChangePasswordDto` newPassword) — vs registrace 6.
- **Zvláštnosti:** Po změně BE emituje `user.password.changed` → revoke všech refresh tokenů (ostatní zařízení odhlášena) + revoke všech důvěryhodných zařízení.
- **Stav:** ✅ funguje.
- **Kód:** FE `SecuritySection.tsx:88`, BE `users.controller.ts:530`, `users.service.ts:321`.

---

### 2FA / TOTP (dvoufaktorové ověření)
- **Co to je:** Druhý faktor TOTP (Google Authenticator/Authy) + jednorázové záložní kódy.
- **Kde:** Profil → „Bezpečnost" → karta „Dvoufaktorové ověření" (`TotpCard` + `TotpSetupWizard`). Login druhý krok = `TotpVerifyStep`.
- **Kdo:** Přihlášený (správa); kontroler `auth/2fa` celý za `JwtAuthGuard`, throttle 15/min.
- **Co jde dělat:**
  - **Zapnutí (wizard):** `POST /auth/2fa/setup` (vygeneruje secret + QR, uloží jako pending `totpEnabled=false`) → naskenovat QR / opsat secret → opsat 6místný kód → `POST /auth/2fa/enable` ověří kód, aktivuje, vrátí 10 záložních kódů (`BackupCodesPanel`, zobrazí se JEN jednou, nutné potvrdit uložení).
  - **Login s 2FA:** po hesle BE vrátí `totp_required`+challengeId → `TotpVerifyStep`: 6místný kód NEBO záložní kód (toggle), checkbox „Důvěřovat tomuto zařízení 30 dní".
  - **Vypnutí:** `POST /auth/2fa/disable` (re-auth heslem) → revokuje i všechna důvěryhodná zařízení.
  - **Regenerace záložních kódů:** `POST /auth/2fa/backup-codes/regenerate` (re-auth heslem) → nová sada (přepíše staré).
- **Hranice / co neumí:**
  - Jen TOTP (`twoFactorMethod:'totp'`). Žádné SMS / e-mail / WebAuthn/passkeys.
  - 10 záložních kódů, každý 1×. Po vyčerpání nutná regenerace (jinak jen TOTP). Žádné varování „dochází ti kódy".
  - TOTP tolerance ±1 okno (±30 s).
  - Challenge TTL = 5 min; `peek` neničí challenge při překlepu.
  - **Per-účet lockout (pentest PT-35a, 2026-07-12):** 5 špatných kódů/záložních kódů → účet zamčen 15 min (`429 TOTP_LOCKED`), úspěch čítač resetuje. Nezávislé na IP — `peek` challenge nespotřebuje, takže bez tohoto by útočník s platným heslem hádal kód donekonečna (per-IP throttler `5/min` obejde rotací IP). Čítač `failedTotpAttempts` + `totpLockedUntil` na useru (atomické `$inc`).
- **Zvláštnosti:**
  - Secret šifrovaný (`TotpCryptoService`, klíč `TOTP_ENC_KEY`). Sanitizace SafeUser odstraní `totpSecretEnc` + `backupCodeHashes`.
  - Challenge se SPOTŘEBUJE až při správném kódu (`consume` po `verifyForLogin`).
  - Při login/totp s `trustDevice` vznikne trust token → cookie `ikaros_td`.
- **Stav:** ✅ funguje.
- **Kód:** FE `TotpCard.tsx:21`, `TotpSetupWizard.tsx:18`, `TotpVerifyStep.tsx:22`, `BackupCodesPanel.tsx:18`, BE `two-factor.controller.ts:31`, `services/totp.service.ts:26`, `auth.service.ts:247` (loginTotp).

---

### Důvěryhodná zařízení (trusted devices)
- **Co to je:** Zařízení, kde se 2FA na 30 dní přeskočí.
- **Kde:** Profil → „Bezpečnost" → karta „Důvěryhodná zařízení" (`TrustedDevicesCard`, zobrazí se JEN když má uživatel 2FA).
- **Kdo:** Přihlášený s 2FA. Endpointy `auth/2fa/trusted-devices`.
- **Co jde dělat:**
  - Výpis zařízení (label z User-Agentu „Chrome · Windows", datum „Naposledy"). Aktuální zařízení označeno „· toto zařízení".
  - „Odvolat" jedno (`DELETE /auth/2fa/trusted-devices/:id`) nebo „Odvolat všechna" (`DELETE /auth/2fa/trusted-devices`).
- **Hranice / co neumí:** Label je hrubý heuristický odhad z UA (žádné IP, geolokace). TTL 30 dní (`TrustedDevicesService.TTL_DAYS`).
- **Zvláštnosti:** V DB jen hash tokenu (cookie `ikaros_td` = plain). Změna hesla i vypnutí 2FA revokují všechna zařízení.
- **Stav:** ✅ funguje.
- **Kód:** FE `TrustedDevicesCard.tsx:22`, BE `two-factor.controller.ts:67`, `trusted-devices/trusted-devices.service.ts:12`.

---

### Security tokens (interní mechanismus)
- **Co to je:** Sdílený jednorázový-token mechanismus pro password_reset, email_verify, email_change, totp_challenge.
- **Kde:** Bez vlastního UI — používá ho auth/users service.
- **Kdo:** Interní.
- **Co jde dělat / vlastnosti:**
  - `issue(userId, type, ttl, meta?)` — vrací plain, do DB jen SHA-256 hash; invaliduje předchozí nepoužité tokeny stejného typu (1× aktivní per user+type).
  - `consume` — verifikuje + označí použitý; rozlišuje `INVALID_TOKEN` / `ALREADY_USED` / `EXPIRED_TOKEN` (pořadí invalid > used > expired). Typová izolace (reset token nelze použít na verify endpoint).
  - `peek` — jako consume, ale token NEspotřebuje (pro TOTP challenge / víc pokusů).
- **Stav:** ✅ funguje.
- **Kód:** BE `modules/security-tokens/security-tokens.service.ts:10`.

---

### Self-delete účtu + account-state gate
- **Co to je:** Uživatelem vyžádané smazání účtu s 30denním hold oknem a reaktivací.
- **Kde:** Profil → sekce „Účet" (`AccountSection`) → `DeleteAccountModal`. Reaktivace přes login (`ReactivateAccountModal`).
- **Kdo:** Přihlášený (vlastní účet). `POST /users/me/deletion-request` (+ `?dryRun=true` preview).
- **Co jde dělat:**
  - Otevření modalu nejdřív dryRun → preview PJ handover plánu.
  - Modal nabízí **„Stáhnout moje data (JSON)"** ještě před smazáním (rámec „mazání = nejdřív nabídnout export", 20.2/§C1).
  - Pokud jsi jediný PJ ve světě bez Pomocného PJ → `SOLE_PJ_BLOCK`, modal přepne na seznam blokujících světů (smazat nelze).
  - Jinak: zobrazí plán povýšení Pomocných PJ → PJ, vyžaduje napsání vlastního username + checkbox potvrzení → ostrý request.
  - Po smazání: auto-logout (revoke refresh tokenů přes `user.deletion.requested`).
  - **Reaktivace:** login během 30 dní → `deletion_pending` → ReactivateAccountModal → `POST /auth/reactivate-deletion` (credentials) vyčistí flagy a přihlásí; NEBO reset hesla (D-037).
  - Stav/zrušení žádosti: `GET`/`DELETE /users/me/deletion-request` (oba `@AllowPendingDeletion`).
- **Account-state gate:** `JwtAuthGuard` per-request čte `request.user.id` a načítá usera: `!user || isDeleted`→401 `DELETED`, `bannedAt`→401 `BANNED`, `deletionRequestedAt` (bez `@AllowPendingDeletion`)→401 `DELETION_PENDING`. (Access token žije 3 dny — `JWT_EXPIRES_IN`, dřív 7 d/1 d; proto gate per-request, ne jen při loginu.) Optional routy gate nemají (public read-only).
- **Hranice / co neumí:**
  - Hard-delete je ANONYMIZACE, ne fyzické smazání řádku: cron `account-cleanup.cron` přepíše PII a emituje `user.deletion.hardDeleted`. Komunitní příspěvky (chat/články/galerie/diskuze) zůstávají s anonymním autorem.
  - **Dluh D-034b:** revert PJ handoveru při reaktivaci NENÍ automatický — uživatel po obnově musí role ve světech upravit ručně (modal o tom informuje).
  - Chybí T-24h reminder mail před finálním smazáním (přiznaný dluh v JSDoc cronu; `MailerService` je v cronu injectnutý jen do zásoby).
- **Zvláštnosti:**
  - Hold = 30 dní (`DELETION_HOLD_DAYS`).
  - **Pozn. nesrovnalost:** JSDoc cronu tvrdí „Běží 1× za hodinu", reálný `@Cron('0 3 * * *')` = denně 03:00 Europe/Prague.
  - **✅ ODSTRANĚNO 2026-07-05 (N-RUN-07, RUN-2026-07-05):** legacy `DELETE /users/:id` (hard-delete bez holdu, jen self nebo Admin, `users.controller.ts`) obcházel celý tenhle 30denní flow — FE ho nikdy nevolal, ale jako přímé API volání šlo smazat účet okamžitě bez reaktivačního okna. Endpoint smazán; **jediná** cesta ke smazání účtu je teď `POST /users/me/deletion-request` výše.
- **Stav:** ✅ funguje (s přiznanými dluhy D-034b a chybějícím reminderem).
- **Kód:** FE `AccountSection.tsx:23`, `DeleteAccountModal.tsx:28`, `ReactivateAccountModal.tsx:37`, BE `users.controller.ts:321`, `users.service.ts:697`, `common/guards/jwt-auth.guard.ts:24`, `services/account-cleanup.cron.ts:22`.

---

### GDPR export dat
- **Co to je:** Export vlastních dat (JSON) podle GDPR (čl. 15/20).
- **Kde:** BE `GET /data-export/me` (za `JwtAuthGuard`). FE tlačítko **„Stáhnout moje data (JSON)"** v profilu → sekce „Účet" (`AccountSection`) a v `DeleteAccountModal` (nabídka před smazáním účtu).
- **Kdo:** Přihlášený (jen vlastní data).
- **Co jde dělat:** klik → hook `useDataExport` volá `GET /data-export/me` → prohlížeč stáhne Blob jako `ikaros-data-<YYYY-MM-DD>.json`. Dostupné i v pending-delete stavu.
- **Hranice / co neumí:** account-centric rozsah (profil, world memberships, přátelství/bloky, username request, admin audit kde je uživatel cílem) — ne obsah stránek/postav/zpráv. Admin nemůže exportovat cizí účet.
- **Stav:** ✅ (20.2/§C1 — FE tlačítko doplněno; dříve BE bez FE).
- **Kód:** BE `modules/data-export/data-export.controller.ts:16`. FE `src/features/profile/api/useDataExport.ts:30`, `components/AccountSection.tsx:21`.

---

### Captcha (Cloudflare Turnstile)
- **Co to je:** Anti-bot ochrana registrace.
- **Kde:** RegisterModal (widget) + BE `CaptchaService`.
- **Co jde dělat:** Widget vrátí token → posílá se v `register` body → BE verify přes Cloudflare siteverify.
- **Hranice / co neumí:** Používá se JEN při registraci (login/reset captchu nemají — chrání je throttling).
- **Zvláštnosti:** Fail-closed na BE (PC-01 historicky fail-open, opraveno) i FE (prod bez site key → widget nahrazen hláškou, 14.2). Honeypot `hp` jako doplněk — BE-enforced přes `RegisterDto.hp @MaxLength(0)` (od 2026-06-19). Provider ověřen živě: prod site key reálný (`0x…`), BE secret odmítá fake token.
- **Stav:** ✅ funguje.
- **Kód:** FE `RegisterModal.tsx` (`TURNSTILE_SITE_KEY` konst. + widget), BE `captcha.service.ts:38`, `dto/register.dto.ts` (`hp`).

---

### Rate-limiting / throttling (auth)
- **Co to je:** `@nestjs/throttler` limity na citlivých endpointech (default 100/min/IP + per-endpoint `@Throttle`).
- **Hodnoty (ověřeno):** register 10/min, login 5/min, login/totp 5/min, reactivate-deletion 5/min, refresh 30/min, forgot/reset 5/min, verify-email 30/min, resend-verification 3/min, confirm-email-change 5/min, check-username/check-email 60/min, 2FA kontroler 15/min, request-email-change 5/min.
- **Storage (14.6):** přepínatelné. Default in-memory (single-instance — správné, nulový overhead). `THROTTLER_REDIS=1` + dostupný `REDIS_URL` → sdílený counter přes Redis (`@nest-lab/throttler-storage-redis`) pro 2+ replik BE; boot-time probe, při nedostupném Redisu fallback in-memory + warn. Limity beze změny. Vzor `SOCKET_IO_REDIS=1`. (Uzavřelo BE dluh D-028.)
- **Stav:** ✅ funguje (Redis storage opt-in, zatím nezapnutý — single-instance deploy).
- **Kód:** BE `auth.controller.ts` (jednotlivé `@Throttle`), `two-factor.controller.ts:29`, `common/throttler/throttler.config.ts`, `app.module.ts` (`ThrottlerModule.forRootAsync`).

---

### Refresh token rotace + reuse detection
- **Co to je:** Rotace refresh tokenu s detekcí krádeže.
- **Co jde dělat / vlastnosti:** `POST /auth/refresh` (cookie má přednost, body fallback). Při použití revokovaného tokenu → revoke celé rodiny + 401 `REFRESH_TOKEN_ABUSED`. **Sliding session:** každý refresh razí NOVÝ token s expirací od teď (`generateTokenPair`) → aktivní uživatel se neodhlásí. **TTL 3 dny** (`JWT_REFRESH_TTL_DAYS`, dřív 30) = 3 dny nečinnosti → logout (2026-06-21). ⚠️ V prod refresh nejspíš nejede (cross-site cookie) → reálný kořen předčasného odhlašování = deploy (domény API vs web), viz deník.
- **Stav:** ✅ funguje.
- **Kód:** BE `auth.controller.ts:168`, `auth.service.ts:364`.

---

## ⚠️ Nesrovnalosti & dluhy (k ověření)

- **Min. délka hesla SJEDNOCENA** (2026-06-27, D-NEW-INV-SEC): registrace i změna/reset = min **8** (`RegisterDto`/`registerSchema` zvednuto na 8). Re-auth `PasswordConfirmDto` (2FA disable) zůstává 6 — validuje **stávající** heslo, legacy 6-znaková se nesmí zamknout.
- ✅ VYŘEŠENO 20.2/§C1 — **GDPR data-export má FE.** Tlačítko „Stáhnout moje data (JSON)" v profilu → Účet i v `DeleteAccountModal` (`useDataExport` → `GET /data-export/me` → Blob). Dřív BE bez FE.
- ✅ VYŘEŠENO 2026-07-12 — **`logout-all` má UI:** profil → Bezpečnost → karta „Aktivní relace" („Odhlásit se ze všech zařízení", `useLogoutAll`). Ostatní zařízení dostanou `401 SESSION_REVOKED` → instant-logout.
- ✅ VYŘEŠENO 2026-07-12 — **login timing enumeration:** neexistující identifier dřív odpověděl o ~100 ms rychleji (přeskočil bcrypt); teď dummy `bcrypt.compare` proti hash z uuid (login i reaktivace). Pozn.: `/auth/check-email` existenci dál vrací (záměrná UX opora registrace) — viz D-SEC-GAP.
- ✅ OPRAVENO 2026-06-18 — **Cron doc↔chování:** `account-cleanup.cron` JSDoc tvrdí „1× za hodinu", reálně `@Cron('0 3 * * *')` = denně 03:00.
- **Reminder mail před hard-delete chybí:** přiznaný dluh; `MailerService` injectnutý do cronu „do zásoby" (`void this.mailer`).
- **Revert PJ handoveru při reaktivaci = manuální (D-034b):** po obnově účtu zůstanou 2 PJ ve světě, uživatel musí role spravit ručně.
- **`requireAuth` loader nevaliduje token:** kontroluje jen jeho přítomnost v localStorage; expirovaný token projde na chráněnou route a teprve BE vrátí 401.
- **Role `Hrac` u registrace mimo FE enum:** BE `auth.service.register` nastaví `role: UserRole.Hrac`, ale FE `UserRole` enum `Hrac` nemá (je to world role). Globální role nově registrovaného je tak na FE reprezentovaná mimo deklarovaný výčet — k ověření, jak se mapuje (zřejmě BE-only hodnota přemapovaná migrací d053 na Ikarus).
- **Ověření e-mailu nikde negatuje:** verify je čistě kosmetický badge; žádná funkce nevyžaduje ověřený e-mail (pro budoucí expanzi: zvážit gate na citlivé akce).
