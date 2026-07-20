# 01 — Účet, přihlášení & bezpečnost

> Kódem ověřená inventura. FE = `Projekt-ikaros-FE`, BE = `Projekt-ikaros/backend`.
> Stavy `✅` popisují stav **kódu na HEAD**, ne stav nasazení. Co běží v produkci, se zjistí z `GET /api/health` → `version.sha` (`app.controller.ts:156`), ne z této inventury.
> Globální role (UserRole): Superadmin(1), Admin(2), Ikarus(9), SpravceClanku(10), SpravceGalerie(11), SpravceDiskuzi(12), Guest(99).
> BE enum (`users/interfaces/user.interface.ts:3`) navíc drží `PJ(3)` (legacy, globálně ho po D-053 nikdo nemá) a `Hrac(5)` = **default role při registraci**. FE enum (`shared/types/index.ts:6`) `Hrac` nepojmenovává — pracuje s hodnotou jen numericky (BE komentář `user.interface.ts:18`). `Guest(99)` = sentinel z guest tokenu (15.8, bez DB účtu); gating jede „nižší číslo = vyšší práva" (`role <= X`), takže 99 neprojde žádným gate.

---

### Registrace
- **Co to je:** Vytvoření nového účtu (modal nad úvodníkem). Po úspěchu BE rovnou vrátí tokeny + uživatele (auto-login).
- **Kde:** Modal `RegisterModal` (otevřen z LoginModalu „Zaregistruj se" nebo přes `registerModalOpenAtom`). Není to samostatná route.
- **Kdo:** Anonym. Žádný guard.
- **Co jde dělat:**
  - Pole: E-mail, Přezdívka (username), Heslo, Potvrzení hesla, checkbox „Souhlasím s podmínkami" (link na `/podminky`), **deklarativní věk** (radio „Je mi 15 nebo více" / „Je mi méně než 15 let", povinné — 20.2/§C2), Cloudflare Turnstile captcha. Pod souhlasem informativní věta „Registrací bereš na vědomí Zásady OÚ" (odkaz na `/soukromi`; Zásady = informace, ne součást souhlasu).
  - Live kontrola dostupnosti přezdívky i e-mailu (ikona) přes `GET /auth/check-username?u=` a `/auth/check-email?e=` (debounce, throttle **10/min** — zpřísněno z 60/min, D-SEC-GAP anti-enumeration, 2026-07-13: na debounced check ve formuláři stačí, hromadný scraping existence účtů brzdí).
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
  - GDPR: BE vynucuje `acceptedTerms===true` (jinak `TERMS_NOT_ACCEPTED`), ukládá `acceptedTermsAt` + `termsVersion` = `'1.0'` (konstanta `AuthService.TERMS_VERSION`, `auth.service.ts:109`; Podmínky 1.0 z 2026-06-18).
  - **Věk 15+ (politika provozního rámce, D-SEC-GAP, 2026-07-13):** volba „Je mi méně než 15 let" registraci **BLOKUJE**. FE: hned při volbě inline vlídné vysvětlení („Platforma je určena hráčům od 15 let. Registrace zatím není možná — mrkni k nám později!", `isUnder15` v `RegisterModal.tsx:330`) + submit blokuje zod `refine` v `registerSchema.ts:43` (radio `under15` se NEodstraňuje — age-gate bez dotazu by lhali všichni). BE pojistka: `isMinor:true` → 400 `AGE_REQUIREMENT_NOT_MET` (`auth.service.ts:170`; kryje starý bundle / obejití formuláře — FE kód mapuje na tutéž hlášku). **Nahrazuje dřívější 20C tok** „registrace projde s `parentalConsentStatus='pending'`" — žádný consent flow není, platforma je od 15 let. **Minimalizace trvá:** neukládá se datum narození, jen `isMinor` (po gate u nových účtů vždy `false`) + `minorSelfDeclaredAt`; `parentalConsentStatus` u nových = vždy `'not_required'`. Bezpečné defaulty nezletilého (neveřejný profil, skrytí v adresáři, `MinorNotice` v profilu) zůstávají ve schématu i kódu pro **legacy účty** registrované před gate.
  - Po registraci BE fire-and-forget pošle verifikační e-mail (selhání mailu registraci nezboří; od 2026-07-13 jde s SMTP providerem přes outbox frontu — viz „Reset hesla" níže / kap. 00).
  - Throttle `POST /auth/register` = 10/min.
- **Stav:** ✅ funguje.
- **Kód:** FE `src/features/auth/components/RegisterModal.tsx:66` (věk `:312`, under15 blok `:330`, mapování `AGE_REQUIREMENT_NOT_MET` `:175`), `src/features/auth/lib/registerSchema.ts:30` (refine `:43`), `src/features/auth/api/useAuth.ts:98`, BE `modules/auth/auth.controller.ts:50`, `auth.service.ts:144` (age gate `:170`, minor defaulty legacy `:217`), `dto/register.dto.ts:44` (`isMinor`), `users/schemas/user.schema.ts:94` (`isMinor`/`minorSelfDeclaredAt`/`parentalConsentStatus`), `captcha.service.ts:42`.

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
- **Kód:** FE `LoginModal.tsx:45`, `useAuth.ts:39`, `router.tsx:221` (requireAuth), BE `auth.controller.ts:80`, `auth.service.ts:244` (dummy `bcrypt.compare` proti timing enumeraci `:249`).

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
- **Invalidace access tokenu (pentest PT-35e, 2026-07-12):** access token nese claim `tv` = `user.tokenVersion`. `logout-all` i změna hesla bumpnou `tokenVersion` (`$inc`) → `JwtAuthGuard` porovná `tv` s DB a STARÝ access token (jinak žije až do expirace access TTL, viz níže) odmítne `401 SESSION_REVOKED`. Dřív se revokoval jen refresh, access token přežil. Default `tokenVersion=0` (`user.schema.ts:170`) + starý token bez claimu = 0 → deploy nikoho neodhlásí (kill až po reálném bumpu). FE (2026-07-12): `SESSION_REVOKED` → instant-logout v `client.ts:134` (vzor `BANNED`) s toastem „Tato relace byla ukončena".
- **Stav:** ✅ funguje (logout, logout-all vč. FE UI, access-token invalidace).
- **Kód:** FE `useAuth.ts:146` (`useLogout`) / `:174` (`useLogoutAll`), `SecuritySection.tsx:304` (karta Aktivní relace), `client.ts:134` (SESSION_REVOKED); BE `auth.controller.ts:201` (logout), `:217` (logout-all), `auth.service.ts:625` (`handlePasswordChanged` → revoke refresh + `incrementTokenVersion`).

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
  - Throttle forgot/reset = 5/min (per IP).
  - **Per-příjemce throttle reset mailů (D-AUDIT, 2026-07-11):** max 1 mail na jeden e-mail za **2 min** (`AuthService.RESET_MAIL_THROTTLE_MS`, `auth.service.ts:105`). IP throttle 5/min nechrání denní SMTP cap před distribuovaným spamem na JEDEN účet. In-memory `Map` (single-instance OK).
  - Mailer fail nezboří flow (anti-enumeration, log warning).
  - **SMTP outbox fronta (D-LAUNCH-GAP „SMTP bez fronty", 2026-07-13):** s SMTP providerem se maily neposílají přímo, ale přes Mongo frontu `mail_outbox` (cron à 30 s). Reset hesla má **vysokou prioritu** — nad denním capem (`SMTP_DAILY_CAP`, default 400) odchází UŽ JEN on, ostatní maily se odloží na další den. Retry/backoff 1→5→30→240 min, po 5 pokusech `failed` + alert (reset hesla = critical). Fail-safe: selže-li zápis do outboxu (Mongo down), mail jde PŘÍMO přes provider — reset hesla nikdy neumře na frontě. Detail kap. 00 „Průřezové koncepty".
- **Stav:** ✅ funguje.
- **Kód:** FE `ForgotPasswordModal.tsx:31`, `ResetPasswordPage.tsx:33`, BE `auth.controller.ts:234` (forgot)/`:245` (reset), `auth.service.ts:643` (forgot)/`:693` (`resetPasswordByToken`).

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
- **Kód:** FE `EmailVerifyPage.tsx:31`, `ProfileHeader.tsx:273` (badge + „Poslat znovu" `:292`), `useEmailVerify.ts:19`, BE `auth.controller.ts:261` (verify)/`:274` (resend), `auth.service.ts:749` (`verifyEmail`)/`:762` (`resendEmailVerification`).

---

### Změna e-mailu
- **Co to je:** Žádost o změnu e-mailu s potvrzením linkem na NOVÝ e-mail + notifikací na starý.
- **Kde:** `ChangeEmailModal` (z profilu hlavičky) → e-mail → route `/email-change/confirm?token=` (`EmailChangeConfirmPage`).
- **Kdo:** Přihlášený (request), anonym (confirm přes token).
- **Co jde dělat:**
  - ChangeEmailModal: read-only aktuální e-mail, pole „Nový e-mail" + „Aktuální heslo" (re-auth) + toggle. Field-mapped chyby: `INVALID_PASSWORD`, `SAME_EMAIL`, `EMAIL_TAKEN`. Toast po odeslání s maskovaným cílem.
  - EmailChangeConfirmPage: on-mount `POST /auth/confirm-email-change {token}`, success → invaliduje `['users','me']`, navigace na profil.
- **Hranice / co neumí:**
  - TTL tokenu = **1 hodina** (`UsersService.EMAIL_CHANGE_TTL_MS`, `users.service.ts:56`).
  - Race: pokud někdo mezitím zabere e-mail → 409 `EMAIL_TAKEN` při confirmu.
- **Zvláštnosti:**
  - 2 maily: potvrzovací na nový e-mail (`sendEmailChangeConfirm`) + notice na starý (`sendEmailChangeNotice`).
  - Token nese `newEmail` v `meta`; confirm idempotentní (pokud už má cílový e-mail). Throttle request = 5/min, confirm = 5/min.
- **Stav:** ✅ funguje.
- **Kód:** FE `ChangeEmailModal.tsx:21`, `EmailChangeConfirmPage.tsx:32`, BE `users.controller.ts:280` (request), `auth.controller.ts:287` (confirm), `users.service.ts:599` (`requestEmailChange`), `auth.service.ts:800` (`confirmEmailChange`).

---

### Změna hesla (přihlášený)
- **Co to je:** Změna hesla v profilu se zadáním starého hesla.
- **Kde:** Profil → sekce „Bezpečnost" → karta „Změna hesla".
- **Kdo:** Přihlášený (vlastní účet). `PUT /users/password`.
- **Co jde dělat:** Pole: Současné heslo, Nové heslo, Potvrzení. FE refine: nové ≠ staré, min 8 znaků. Špatné staré heslo → 401 → chyba pod polem.
- **Hranice / co neumí:** Min 8 znaků (BE `ChangePasswordDto.newPassword` `@MinLength(8)`, `change-password.dto.ts:5`) — **shodně s registrací i resetem** (všude 8 od D-NEW-INV-SEC).
- **Zvláštnosti:** Po změně BE emituje `user.password.changed` → 2 listenery: `auth.service.ts:625` revokuje všechny refresh tokeny + bumpne `tokenVersion` (zabije i staré access tokeny, `SESSION_REVOKED`) a `trusted-devices.service.ts:90` revokuje všechna důvěryhodná zařízení.
- **Stav:** ✅ funguje.
- **Kód:** FE `SecuritySection.tsx:44` (karta „Změna hesla" `:236`), BE `users.controller.ts:563` (`PUT /users/password`, 204), `users.service.ts:390`.

---

### 2FA / TOTP (dvoufaktorové ověření)
- **Co to je:** Druhý faktor TOTP (Google Authenticator/Authy) + jednorázové záložní kódy.
- **Kde:** Profil → „Bezpečnost" → karta „Dvoufaktorové ověření" (`TotpCard` + `TotpSetupWizard`). Login druhý krok = `TotpVerifyStep`.
- **Kdo:** Přihlášený (správa); kontroler `auth/2fa` celý za `JwtAuthGuard` (`two-factor.controller.ts:28`), throttle 15/min (`:29`).
- **Co jde dělat:**
  - **Zapnutí (wizard):** `POST /auth/2fa/setup` (vygeneruje secret + QR, uloží jako pending `totpEnabled=false`) → naskenovat QR / opsat secret → opsat 6místný kód → `POST /auth/2fa/enable` ověří kód, aktivuje, vrátí 10 záložních kódů (`BackupCodesPanel`, zobrazí se JEN jednou, nutné potvrdit uložení).
  - **Login s 2FA:** po hesle BE vrátí `totp_required`+challengeId → `TotpVerifyStep`: 6místný kód NEBO záložní kód (toggle), checkbox „Důvěřovat tomuto zařízení 30 dní".
  - **Vypnutí:** `POST /auth/2fa/disable` (re-auth heslem) → revokuje i všechna důvěryhodná zařízení.
  - **Regenerace záložních kódů:** `POST /auth/2fa/backup-codes/regenerate` (re-auth heslem) → nová sada (přepíše staré).
- **Hranice / co neumí:**
  - Jen TOTP (`twoFactorMethod:'totp'`). Žádné SMS / e-mail / WebAuthn/passkeys.
  - 10 záložních kódů, každý 1×. Po vyčerpání nutná regenerace (jinak jen TOTP). Žádné varování „dochází ti kódy".
  - TOTP tolerance ±1 okno (±30 s) — `authenticator.options = { window: 1 }`, `totp.service.ts:33`.
  - Challenge TTL = 5 min; `peek` neničí challenge při překlepu.
  - **Per-účet lockout (pentest PT-35a, 2026-07-12):** 5 špatných kódů/záložních kódů (`MAX_TOTP_FAILURES`, `auth.service.ts:68`) → účet zamčen 15 min (`TOTP_LOCK_MS`, `:69`; `429 TOTP_LOCKED` + `retryAfterSec`), úspěch čítač resetuje (`resetTotpFailures`). Nezávislé na IP — `peek` challenge nespotřebuje, takže bez tohoto by útočník s platným heslem hádal kód donekonečna (per-IP throttler `5/min` obejde rotací IP). Čítač `failedTotpAttempts` + `totpLockedUntil` na useru (atomické `$inc`).
- **Zvláštnosti:**
  - Secret šifrovaný (`TotpCryptoService`, klíč `TOTP_ENC_KEY`). Sanitizace SafeUser odstraní `totpSecretEnc` + `backupCodeHashes`.
  - Challenge se SPOTŘEBUJE až při správném kódu (`consume` po `verifyForLogin`).
  - Při login/totp s `trustDevice` vznikne trust token → cookie `ikaros_td` (`httpOnly`, `secure`+`SameSite=None` v prod, `path=/api/auth`, TTL 30 d — `auth-cookie.ts:59`).
- **Stav:** ✅ funguje.
- **Kód:** FE `TotpCard.tsx:21`, `TotpSetupWizard.tsx:18`, `TotpVerifyStep.tsx:23` (checkbox důvěry `:118`), `BackupCodesPanel.tsx:18`, BE `two-factor.controller.ts:31`, `services/totp.service.ts:26`, `auth.service.ts:323` (`loginTotp`), `auth.controller.ts:100` (`POST /auth/login/totp`).

---

### Důvěryhodná zařízení (trusted devices)
- **Co to je:** Zařízení, kde se 2FA na 30 dní přeskočí.
- **Kde:** Profil → „Bezpečnost" → karta „Důvěryhodná zařízení" (`TrustedDevicesCard`, self-gating `if (!enabled) return null` podle `profile.totpEnabled` — `TrustedDevicesCard.tsx:28`).
- **Kdo:** Přihlášený s 2FA. Endpointy `auth/2fa/trusted-devices`.
- **Co jde dělat:**
  - Výpis zařízení (label z User-Agentu „Chrome · Windows", datum „Naposledy"). Aktuální zařízení označeno „· toto zařízení".
  - „Odvolat" jedno (`DELETE /auth/2fa/trusted-devices/:id`) nebo „Odvolat všechna" (`DELETE /auth/2fa/trusted-devices`).
- **Hranice / co neumí:** Label je hrubý heuristický odhad z UA (žádné IP, geolokace). TTL 30 dní (`TrustedDevicesService.TTL_DAYS`, `trusted-devices.service.ts:13`).
- **Zvláštnosti:** V DB jen hash tokenu (cookie `ikaros_td` = plain). Změna hesla (`@OnEvent('user.password.changed')`, `trusted-devices.service.ts:90`), vypnutí 2FA i hard-delete (`:103`) revokují všechna zařízení.
- **Stav:** ✅ funguje.
- **Kód:** FE `TrustedDevicesCard.tsx:22`, BE `two-factor.controller.ts:67` (GET), `:73` (DELETE `:id`), `:83` (DELETE vše), `modules/trusted-devices/trusted-devices.service.ts:12`.

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
- **Account-state gate:** `JwtAuthGuard` per-request čte `request.user.id` a načítá usera: `!user || isDeleted`→401 `DELETED`, `bannedAt`→401 `BANNED`, `deletionRequestedAt` (bez `@AllowPendingDeletion`)→401 `DELETION_PENDING`. Access token je stateless a žije dny (kódový default `3d` v `auth.module.ts:40`, compose default `JWT_EXPIRES_IN=1d`) — proto gate per-request, ne jen při loginu. Guard zároveň přepisuje `request.user.role` z DB (freshness role: demotovaný Admin nedrží práva ze staré JWT) a porovnává `tv`/`tokenVersion` (`SESSION_REVOKED`). Optional routy (`OptionalJwtAuthGuard`) gate záměrně nemají (public read-only).
- **Hranice / co neumí:**
  - Hard-delete je ANONYMIZACE, ne fyzické smazání řádku: cron `account-cleanup.cron` přepíše PII a emituje `user.deletion.hardDeleted`. Komunitní příspěvky (chat/články/galerie/diskuze) zůstávají s anonymním autorem.
  - **Dluh D-034b:** revert PJ handoveru při reaktivaci NENÍ automatický — uživatel po obnově musí role ve světech upravit ručně (modal o tom informuje).
  - Chybí T-24h reminder mail před finálním smazáním (přiznaný dluh v JSDoc cronu; `MailerService` je v cronu injectnutý jen do zásoby).
- **Zvláštnosti:**
  - Hold = 30 dní (`DELETION_HOLD_DAYS`, `users.service.ts:50` + `auth.service.ts:66`; `AccountCleanupCron.GRACE_PERIOD_DAYS = 30`).
  - Cron běží denně 03:00 Europe/Prague (`@Cron('0 3 * * *')`, `account-cleanup.cron.ts:43`) — JSDoc to od 2026-06-18 uvádí shodně (`:14`), dřívější rozpor „1× za hodinu" už v kódu není. `CronLockService` zajistí, že při 2+ replikách BE proběhne sweep jen na jedné.
  - **✅ ODSTRANĚNO 2026-07-05 (N-RUN-07, RUN-2026-07-05):** legacy `DELETE /users/:id` (hard-delete bez holdu, jen self nebo Admin, `users.controller.ts`) obcházel celý tenhle 30denní flow — FE ho nikdy nevolal, ale jako přímé API volání šlo smazat účet okamžitě bez reaktivačního okna. Endpoint smazán; **jediná** cesta ke smazání účtu je teď `POST /users/me/deletion-request` výše.
- **Stav:** ✅ funguje (s přiznanými dluhy D-034b a chybějícím reminderem).
- **Kód:** FE `AccountSection.tsx:54`, `DeleteAccountModal.tsx:30`, `ReactivateAccountModal.tsx:37`, BE `users.controller.ts:338` (POST) / `:364` (GET) / `:373` (DELETE), `users.service.ts:781` (`requestSelfDeletion`, `SOLE_PJ_BLOCK` `:819`), `common/guards/jwt-auth.guard.ts:28` (`canActivate`), `users/services/account-cleanup.cron.ts:25`.

---

### GDPR export dat
- **Co to je:** Export vlastních dat (JSON) podle GDPR (čl. 15/20).
- **Kde:** BE `GET /data-export/me` (za `JwtAuthGuard`). FE tlačítko **„Stáhnout moje data (JSON)"** v profilu → sekce „Účet" (`AccountSection`) a v `DeleteAccountModal` (nabídka před smazáním účtu).
- **Kdo:** Přihlášený (jen vlastní data).
- **Co jde dělat:** klik → hook `useDataExport` volá `GET /data-export/me` → prohlížeč stáhne Blob jako `ikaros-data-<YYYY-MM-DD>.json`. Dostupné i v pending-delete stavu.
- **Hranice / co neumí:** account-centric rozsah (profil, world memberships, přátelství/bloky, username request, admin audit kde je uživatel cílem) — ne obsah stránek/postav/zpráv. Admin nemůže exportovat cizí účet.
- **Stav:** ✅ (20.2/§C1 — FE tlačítko doplněno; dříve BE bez FE).
- **Kód:** BE `modules/data-export/data-export.controller.ts:16` (`@UseGuards(JwtAuthGuard)` `:17`, `@Get('me')` `:21`). FE `src/features/profile/api/useDataExport.ts:30`, `components/AccountSection.tsx:54`.

---

### Captcha (Cloudflare Turnstile)
- **Co to je:** Anti-bot ochrana registrace a guest session.
- **Kde:** RegisterModal (widget) + BE `CaptchaService`.
- **Co jde dělat:** Widget vrátí token → posílá se v `register` body → BE verify přes Cloudflare siteverify.
- **Hranice / co neumí:** Captchu vyžadují **dva** endpointy — `POST /auth/register` (`auth.service.ts:150`) a `POST /auth/anon-session` (guest session pro Hospodu, 15.8, `auth.service.ts:839`). Login/reset captchu nemají — chrání je throttling.
- **Zvláštnosti:** Fail-closed na BE (`captcha.service.ts:42`: prázdný token → false; chybějící `TURNSTILE_SECRET` v prod → false, mimo prod DEV bypass s warningem; síťová chyba Cloudflare → false; PC-01 historicky fail-open, opraveno) i FE (prod bez site key → widget nahrazen hláškou a submit blokován, `RegisterModal.tsx:55`+`:349`, 14.2). Honeypot `hp` jako doplněk — BE-enforced přes `RegisterDto.hp @MaxLength(0)` (`register.dto.ts:67`, od 2026-06-19).
- **Stav:** ✅ funguje.
- **Kód:** FE `RegisterModal.tsx:55` (`TURNSTILE_SITE_KEY` konst.) + `:349` (widget/fallback), BE `captcha.service.ts:42`, `dto/register.dto.ts:67` (`hp`).

---

### Rate-limiting / throttling (auth)
- **Co to je:** `@nestjs/throttler` limity na citlivých endpointech (default 100/min/IP + per-endpoint `@Throttle`).
- **Hodnoty (ověřeno proti `@Throttle` dekorátorům):** register 10/min (`auth.controller.ts:51`), anon-session 5/min (`:72`), login 5/min (`:81`), login/totp 5/min (`:101`), reactivate-deletion 5/min (`:130`), check-username/check-email **10/min** (`:154`/`:166` — zpřísněno z 60/min 2026-07-13, D-SEC-GAP anti-enumeration; endpoint záměrně vrací existenci účtu jako UX oporu registrace, limit brzdí hromadný scraping), refresh 30/min (`:175`), forgot 5/min (`:235`), reset 5/min (`:246`), verify-email 30/min (`:262`), resend-verification 3/min (`:277`), confirm-email-change 5/min (`:288`), 2FA kontroler 15/min (`two-factor.controller.ts:29`), request-email-change 5/min (`users.controller.ts:282`). `PUT /users/password` a `POST /users/me/deletion-request` vlastní `@Throttle` nemají — platí default 100/min.
- **Storage (14.6):** přepínatelné, **default in-memory** — `createThrottlerOptions` vrací in-memory, dokud `THROTTLER_REDIS !== '1'` (`throttler.config.ts:31`); pro single-instance je to správná volba (nulová Redis latence). `THROTTLER_REDIS=1` + dostupný `REDIS_URL` → sdílený counter přes Redis (`@nest-lab/throttler-storage-redis`) pro 2+ replik BE; boot-time probe (`:42`), při chybějícím/nedostupném Redisu fallback in-memory + warn (`:35`, `:57`). Limity beze změny. Vzor `SOCKET_IO_REDIS=1`. (Uzavřelo BE dluh D-028.)
- **Stav:** ✅ funguje.
- **Kód:** BE `auth.controller.ts` (jednotlivé `@Throttle`), `two-factor.controller.ts:29`, `common/throttler/throttler.config.ts:27` (default 100/min `:10`), `app.module.ts` (`ThrottlerModule.forRootAsync`).

---

### Refresh token rotace + reuse detection
- **Co to je:** Rotace refresh tokenu s detekcí krádeže + sliding session.
- **Co jde dělat / vlastnosti:** `POST /auth/refresh` (cookie má přednost, body fallback). Při použití revokovaného tokenu → revoke celé rodiny + 401 `REFRESH_TOKEN_ABUSED` (`auth.service.ts:525`). Refresh navíc kontroluje `isDeleted`/`bannedAt` (FIX-6, `:542`/`:548`) — zabanovaný účet už nedostane nový access token. **Sliding session:** každý refresh razí NOVÝ token s expirací od teď (`generateTokenPair`) → aktivní uživatel se neodhlásí; logout až po **60 dnech** nečinnosti zařízení (`JWT_REFRESH_TTL_DAYS`, kódový default 60 v `auth.service.ts:876` i compose default). Access TTL: kódový default `3d` (`auth.module.ts:40`), compose default `JWT_EXPIRES_IN=1d`. Cookie `ikaros_rt`: `httpOnly`, `secure` + `SameSite=None` v produkci (`Lax` v devu), `path=/api/auth` → chodí jen na auth endpointy, `maxAge` = `JWT_REFRESH_TTL_DAYS` dní (`common/utils/auth-cookie.ts:30`).
- **Zvláštnosti (23.5/23.7):** souběžné refreshe neodhlašují. **FE single-flight** — paralelní 401 sdílí jeden refresh promise (`client.ts:70` `refreshPromise` / `:73` `refreshAccessToken`); toast+logout při failu právě 1×. **BE grace okno 60 s** — reuse čerstvě zrotovaného jti (multi-tab, PWA, síťový retry) vrátí týž nástupnický pár z in-memory cache místo revoke rodiny (`auth.service.ts:514`); okno je konfigurovatelné přes `REFRESH_REUSE_GRACE_MS` (default `DEFAULT_REFRESH_REUSE_GRACE_MS = 60 s`, `:76`/`:138`; `0` = vypnuto, pro e2e). Reuse PO okně = reuse-detection jako dřív (detekce krádeže zpožděna max o 60 s). Cache je in-memory: při 2+ replikách BE by bylo potřeba Redis (vzor `THROTTLER_REDIS`).
- **Stav:** ✅ funguje.
- **Kód:** BE `auth.controller.ts:174`, `auth.service.ts:479` (`refresh`) / `:564` (`rememberGracePair`). FE `src/shared/api/client.ts:73` (`refreshAccessToken`).

---

## ⚠️ Nesrovnalosti & dluhy (ověřeno proti HEAD)

- ✅ VYŘEŠENO 2026-06-27 (D-NEW-INV-SEC) — **min. délka hesla SJEDNOCENA:** registrace i změna/reset = min **8** (`register.dto.ts:23`, `registerSchema.ts:18`, `change-password.dto.ts:5`, `reset-password.dto.ts:13`). Re-auth `PasswordConfirmDto` (2FA disable) zůstává **6** (`password-confirm.dto.ts:8`) — záměrně: validuje **stávající** heslo, legacy 6znaková se nesmí zamknout.
- ✅ VYŘEŠENO 20.2/§C1 — **GDPR data-export má FE.** Tlačítko „Stáhnout moje data (JSON)" v profilu → Účet i v `DeleteAccountModal` (`useDataExport` → `GET /data-export/me` → Blob). Dřív BE bez FE.
- ✅ VYŘEŠENO 2026-07-12 — **`logout-all` má UI:** profil → Bezpečnost → karta „Aktivní relace" („Odhlásit se ze všech zařízení", `useLogoutAll`). Ostatní zařízení dostanou `401 SESSION_REVOKED` → instant-logout.
- ✅ VYŘEŠENO 2026-07-12 — **login timing enumeration:** neexistující identifier dřív odpověděl o ~100 ms rychleji (přeskočil bcrypt); teď dummy `bcrypt.compare` proti hash z uuid (login i reaktivace). Pozn.: `/auth/check-email` existenci dál vrací (záměrná UX opora registrace) — viz D-SEC-GAP.
- ✅ VYŘEŠENO 2026-06-18 — **Cron doc↔chování:** JSDoc `account-cleanup.cron.ts:14` i dekorátor `:43` dnes shodně říkají „denně 03:00 Europe/Prague". Dřívější tvrzení „1× za hodinu" už v kódu není.
- **PLATÍ — Reminder mail před hard-delete chybí:** přiznaný dluh v JSDoc cronu (`account-cleanup.cron.ts:20`: „Mimo rozsah (dluh): T-24h reminder mail"); `MailerService` injectnutý „do zásoby" (`:33` + `void this.mailer` `:38`).
- **PLATÍ — Revert PJ handoveru při reaktivaci = manuální (D-034b):** po obnově účtu zůstanou 2 PJ ve světě, uživatel musí role spravit ručně. Dluh přiznaný v kódu (`auth.service.ts:412`); BE jen předá snapshot `revertablePromotions` (`admin.service.ts:668`, `auth.service.ts:737`), FE ho zobrazí (`ReactivateAccountModal.tsx:46`, `ResetPasswordPage.tsx:92`) — žádná automatická demotion neexistuje.
- **PLATÍ — `requireAuth` loader nevaliduje token:** `router.tsx:221` kontroluje jen přítomnost `ikaros.jwt` v `localStorage` (JSON parse, truthy check); expirovaný token projde na chráněnou route a teprve BE vrátí 401 → interceptor `client.ts`.
- ✅ VYJASNĚNO — **Role `Hrac` u registrace:** BE `auth.service.ts:199` nastaví `role: UserRole.Hrac` = **5** (`users/interfaces/user.interface.ts:20`, výslovně „DEFAULT role při registraci"). FE `UserRole` (`shared/types/index.ts:6`) tuhle hodnotu **nepojmenovává** a pracuje s ní jen numericky — není to chyba ani world role, jen záměrná mezera ve FE enumu. Dřívější domněnka „přemapovaná migrací d053 na Ikarus" **neplatí**: d053 přesunula world role do membershipů, globální `Hrac(5)` zůstal. Gating je fail-closed (`role <= Admin` / `=== konkrétní role`), takže nepojmenovaná hodnota se chová jako běžný uživatel.
- **PLATÍ — Ověření e-mailu nikde negatuje:** verify je čistě kosmetický badge (`ProfileHeader.tsx:273`); žádná funkce nevyžaduje ověřený e-mail (pro budoucí expanzi: zvážit gate na citlivé akce).
- **PLATÍ — grace cache refreshe je in-memory:** `AuthService.refreshGrace` je `Map` v procesu (`auth.service.ts:95`). Při 2+ replikách BE by souběžný refresh trefil jinou instanci bez cache → reuse-detection a odhlášení. Pro single-instance deploy bez dopadu; multi-instance by potřebovalo sdílené úložiště (vzor `THROTTLER_REDIS`).
