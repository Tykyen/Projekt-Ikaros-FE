# Spec 14.1 — Dvoufaktorové přihlášení (2FA / TOTP) + důvěryhodná zařízení

**Status:** ✅ Implementováno (2026-06-18) — BE 91 testů + FE build/smoke zelené; čeká BE restart + `TOTP_ENC_KEY` v prod env
**Rozsah:** BE + FE — nová bezpečnostní featura (TOTP druhý faktor, záložní kódy, remember-device). Větší.
**Repo:** `Projekt-ikaros` (BE) + `Projekt-ikaros-FE` (FE)
**Velikost:** odhad ~30–35 souborů (BE ~18, FE ~15)
**Autor:** PJ + Claude
**Datum:** 2026-06-18
**Roadmap:** `docs/roadmap2.md` → Fáze 14 → 14.1
**Souvisí:** `spec-1.3c` (týž `AuthService.login` union + `LoginModal` switch pattern), PC-18 (httpOnly cookie), security-tokens modul, prod-config audit (env fail-fast)

---

## 1. Cíl

Přidat **druhý zámek u přihlášení**: po hesle volitelně jednorázový kód z authenticator aplikace v mobilu (TOTP). Uniklé heslo pak samo o sobě k převzetí účtu nestačí. Doplňkově:

1. **TOTP** — spárování přes QR kód, ověření při loginu.
2. **Záložní kódy** — 10 jednorázových kódů pro případ ztráty telefonu.
3. **Důvěryhodná zařízení (remember-device)** — volba „důvěřovat tomuto zařízení 30 dní" přeskočí 2FA na známém prohlížeči; plně revokovatelné.

2FA je **dobrovolné pro všechny** (opt-in), bez vynucení. Architektura druhého faktoru je **method-agnostic**, aby šlo později přidat e-mail OTP (follow-up 14.1-a) bez přepisu.

---

## 2. Kontext / motivace

Uniklé/odhalené heslo je nejčastější cesta ke ztrátě účtu; 2FA blokuje drtivou většinu těchto případů. Kritické zvlášť u PJ (ovládá celý svět) a adminů. Roadmapa 14 řadí 2FA mezi „pokud bys měl udělat jen tři věci". Bez 2FA nemá uživatel žádnou obranu, když mu unikne heslo (úniky z jiných služeb, phishing).

Remember-device je v rozsahu vědomě (rozhodnutí PJ 2026-06-18): bez něj se 2FA ptá při každém loginu, což lidi otravuje → vypnou si ho → reálná bezpečnost klesne. Trust zařízení tedy 2FA *podpoří*.

---

## 3. Klíčová rozhodnutí (brainstorm 2026-06-18)

| Téma | Volba | Důvod |
|---|---|---|
| Knihovna TOTP | **otplib** (BE) + **qrcode** (BE generuje QR jako data URL) | otplib aktivně udržovaný; `speakeasy` mrtvý. QR vyrobí BE → secret nemusí jako string na FE. |
| Secret v DB | **AES-256-GCM šifrovaně** (`totpSecretEnc`), klíč z env `TOTP_ENC_KEY` | Server musí secret *číst* pro výpočet kódu → nelze hashovat (na rozdíl od hesla). Šifrování = únik DB sám 2FA neprolomí. |
| Env klíč | `TOTP_ENC_KEY` (32 B, base64) — **fail-fast** při startu, pokud chybí | Stejný vzor jako `JWT_SECRET` (prod-config PC-14). Bez klíče 2FA nesmí běžet. Doplnit do env validationSchema. |
| Partial token (mezi heslem a kódem) | **Opaque challenge** přes security-tokens (`type:'totp_challenge'`, TTL 5 min), **žádný JWT před ověřením kódu** | Před ověřením 2FA nesmí existovat platný auth token — jinak útočník s heslem dostane přístup už v kroku 1. Opaque (ne JWT) nelze omylem akceptovat jako access token. |
| Pokusy o kód | Challenge se **nespotřebuje při špatném kódu**; `meta.attempts++`, po **5** pokusech invaliduj; Throttler 5/min na endpoint | Brute-force ochrana bez zničení challenge jediným překlepem. |
| Záložní kódy | 10 jednorázových, zobrazit **jednou** při zapnutí, v DB jen **bcrypt hash** (`backupCodeHashes[]` na User); použitý se odebere | Pojistka při ztrátě telefonu; bcrypt jako u hesla. |
| Vypnutí 2FA | Vyžaduje **heslo** (re-auth); revokuje všechna trusted devices uživatele | Aby 2FA nevypnul někdo s ukradeným otevřeným sezením. |
| Method-agnostic | Pole `twoFactorMethod: 'totp'` (rozšiřitelné) | Připraví půdu pro e-mail OTP (14.1-a) bez migrace. |
| Trust zařízení | Náhodný **device token** v **httpOnly cookie** (`ikaros_td`, `SameSite=None;Secure` v prod / `Lax` v dev, path `/api/auth`), v DB jen SHA256 hash (kolekce `trusted_devices`); **ne** fingerprint | Fingerprint je nespolehlivý a invazivní. Token v cookie = jako „druhý refresh token" jen pro tento prohlížeč (reuse `auth-cookie.ts` PC-18 pattern; cross-site FE↔BE vyžaduje `None`). |
| Trust TTL | **30 dní** (hardcoded ve V1), TTL index na `expiresAt` | Jednoduché; konfigurovatelnost = dluh. |
| Trust revokace | Endpoint „odvolat" (jedno/vše) + **automaticky vše** při změně hesla a při vypnutí 2FA | Bez revokace je remember-device díra (ukradené zařízení obchází 2FA). |
| Povinnost | **Dobrovolné pro všechny** | Vynucení pro adminy = enrollment gate flow → follow-up 14.1-c. |

---

## 4. Rozsah

### 4.1 V rozsahu 14.1

**BE:**
- User schema +5 polí (`totpEnabled`, `totpSecretEnc`, `backupCodeHashes`, `totpEnabledAt`, `twoFactorMethod`) + interface + `toEntity` mapper.
- Nová kolekce `trusted_devices` (schema + interface + repository) s TTL indexem.
- `TotpCryptoService` (AES-256-GCM encrypt/decrypt, klíč z env) + env validace `TOTP_ENC_KEY`.
- `SecurityTokenType` rozšíření o `'totp_challenge'`.
- Management endpointy (JwtAuthGuard): `setup`, `enable`, `disable`, `backup-codes/regenerate`, `trusted-devices` (GET/DELETE/DELETE all).
- Login integrace: `POST /auth/login` rozšíření (totp gate + trust cookie zkratka), nový `POST /auth/login/totp`.
- `MeResponse` +`totpEnabled`/`twoFactorMethod`; `sanitize()` vyloučí `totpSecretEnc`+`backupCodeHashes`.
- Auto-revoke trusted devices na `user.password.changed` event + při disable.
- Nové npm: `otplib`, `qrcode`.
- BE testy (§9).

**FE:**
- Profil → `SecuritySection`: nová karta **„Dvoufaktorové ověření"** (stav, setup wizard s QR + kódem, zobrazení backup kódů, vypnutí) + karta **„Důvěryhodná zařízení"** (výpis + odvolat).
- *(Addendum 2026-07-12, dluh D-SEC-GAP/PT-35e follow-up):* karta **„Aktivní relace"** — tlačítko „Odhlásit se ze všech zařízení" (`useLogoutAll` → `POST /auth/logout-all`, lokální úklid `clearLocalSession` bez undo okna). Ostatní zařízení dostanou `401 SESSION_REVOKED` (tokenVersion mismatch) → `client.ts` instant-logout s toastem (vzor `BANNED`).
- `LoginModal`: nový krok `status:'totp_required'` → `TotpVerifyStep` (6místný kód / backup kód + „důvěřovat zařízení").
- Hooks (`useTotpSetup`, `useEnableTotp`, `useDisableTotp`, `useRegenerateBackupCodes`, `useTrustedDevices`, `useRevokeTrustedDevice`), zod schémata, typy `LoginResponse` union rozšíření.
- Žádné nové FE npm (QR je obrázek z BE).
- FE testy (§9).

### 4.2 Mimo rozsah 14.1 (follow-upy)

- **14.1-a** E-mail OTP jako volitelná **slabší** metoda — podmínka: musí být označená a **nesmí sdílet kanál s resetem hesla** (jinak nulová ochrana). Method-agnostic pole už připravené.
- **14.1-b** ~~remember-device~~ → **přesunuto DO V1** (rozhodnutí 2026-06-18).
- **14.1-c** Vynucení 2FA pro Admin/Superadmin (enrollment gate: co s adminem bez 2FA při loginu).
- Konfigurovatelná trust TTL / počet backup kódů (dluh).
- WebAuthn/passkey (samostatný spec, mimo Etapu II rozsah).
- Audit log 2FA akcí (analog dluhu z 1.3b/1.3c).

---

## 5. Backend změny

### 5.1 Datový model

**`users/schemas/user.schema.ts`** (rozšíření):
```ts
// 14.1 — 2FA / TOTP
@Prop({ default: false, index: true }) totpEnabled: boolean;
@Prop({ type: String, default: null }) totpSecretEnc: string | null;   // AES-256-GCM: "iv:tag:ct" base64; pending i aktivní
@Prop({ type: [String], default: [] }) backupCodeHashes: string[];      // bcrypt hashe jednorázových kódů
@Prop({ type: Date, default: null }) totpEnabledAt: Date | null;
@Prop({ type: String, default: 'totp' }) twoFactorMethod: string;       // method-agnostic ('totp' | budoucí 'email')
```

**`users/interfaces/user.interface.ts`** — táž pole. **`users.repository.ts` `toEntity()`** — namapovat (memory `project_be_field_checklist` — začít od mapperu).

**`trusted-devices/schemas/trusted-device.schema.ts`** (nová kolekce):
```ts
@Schema({ collection: 'trusted_devices', timestamps: true })
export class TrustedDeviceSchemaClass {
  @Prop({ required: true, index: true }) userId: string;
  @Prop({ required: true, unique: true, index: true }) tokenHash: string;  // SHA256(device token)
  @Prop({ required: true }) label: string;                                  // "Chrome · Windows" (z User-Agent)
  @Prop({ type: Date, default: () => new Date() }) lastUsedAt: Date;
  @Prop({ required: true, type: Date }) expiresAt: Date;                    // now + 30d
}
// auto-cleanup po expiraci
TrustedDeviceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### 5.2 `TotpCryptoService` + env

```ts
// crypto: AES-256-GCM, klíč z env TOTP_ENC_KEY (32 B, base64)
encryptSecret(plain: string): string  // → "iv:tag:ct" (base64 části)
decryptSecret(enc: string): string
```
- Env validationSchema: `TOTP_ENC_KEY` **required**, délka po base64-decode == 32 B → jinak **fail-fast** při startu (vzor `JWT_SECRET`, PC-14). Doplnit i do `.env.example` a compose `${TOTP_ENC_KEY:?required}`.

### 5.3 SecurityTokenType

`security-tokens/interfaces/...` — `'password_reset' | 'email_verify' | 'email_change' | 'totp_challenge'`. Challenge se vydává `issue(userId, 'totp_challenge', 5*60_000, { attempts: 0 })`; ověřuje se **bez consume** (peek přes repo `findByHash` + kontrola expirace + `meta.attempts`), `markUsed` až po úspěchu.

> ⚠️ Stávající `consume()` označí `usedAt` hned — to nám zničí challenge při prvním špatném kódu. Přidám `securityTokens.peek(plain, type)` (najde, ověří expiraci/typ, **nespotřebuje**) vedle `consume()`. Po úspěšném ověření kódu volám `consume()`.

### 5.4 Endpointy — management (vyžadují plné přihlášení, `JwtAuthGuard`)

| Endpoint | Body | Akce |
|---|---|---|
| `POST /auth/2fa/setup` | — | Vygeneruj TOTP secret (otplib), ulož `totpSecretEnc` jako **pending** (`totpEnabled` zůstává false), vrať `{ qrDataUrl, secret }` (secret pro manuální zadání). Opakované volání přepíše pending. |
| `POST /auth/2fa/enable` | `{ code }` | Ověř `code` proti pending secretu. OK → `totpEnabled=true`, `totpEnabledAt=now`, vygeneruj 10 backup kódů → vrať je **jednou** plaintextem `{ backupCodes[] }`, ulož jejich bcrypt hashe. |
| `POST /auth/2fa/disable` | `{ password }` | Re-auth heslem → `totpEnabled=false`, `totpSecretEnc=null`, `backupCodeHashes=[]`, revokuj všechna trusted devices uživatele. |
| `POST /auth/2fa/backup-codes/regenerate` | `{ password }` | Re-auth → vygeneruj nových 10, vrať jednou, přepiš hashe. |
| `GET /auth/2fa/trusted-devices` | — | `[{ id, label, lastUsedAt, createdAt, current: bool }]` (current = odpovídá trust cookie tohoto požadavku). |
| `DELETE /auth/2fa/trusted-devices/:id` | — | Odvolat jedno (jen vlastní). |
| `DELETE /auth/2fa/trusted-devices` | — | Odvolat všechna uživatelova. |

### 5.5 Login flow — rozšíření

**`AuthService.login`** — nová větev (po ověření hesla + ban/deletion gates, před vydáním tokenů):
```ts
if (user.totpEnabled) {
  // H — zkratka přes důvěryhodné zařízení
  const trusted = await this.trustedDevices.matchFromCookie(req, user.id); // čte ikaros.tdev cookie
  if (trusted) {
    await this.trustedDevices.touch(trusted.id);        // lastUsedAt
    // pokračuj standardním vydáním tokenů → status 'ok'
  } else {
    const challengeId = await this.securityTokens.issue(user.id, 'totp_challenge', 5*60_000, { attempts: 0 });
    return { status: 'totp_required', challengeId };     // ŽÁDNÝ JWT
  }
}
```
Union rozšíření: `LoginResult = {status:'ok',...} | {status:'deletion_pending',...} | {status:'totp_required', challengeId}`.

> 💡 Místo pro budoucí trust-zkratku (H) je v logice už zapracované jako samostatná větev — přidání dalších metod (14.1-a) = nová `else if`, ne refaktor.

**`POST /auth/login/totp`** — DTO `{ challengeId, code, trustDevice?: boolean }`:
1. `peek(challengeId, 'totp_challenge')` → není/expirovalo → `401 TOTP_CHALLENGE_INVALID`.
2. `meta.attempts >= 5` → invaliduj + `429 TOTP_TOO_MANY_ATTEMPTS`.
3. Načti usera (z `meta.userId`). Ověř `code`:
   - TOTP přes otplib (proti `decryptSecret(totpSecretEnc)`), **window ±1** (clock drift), NEBO
   - backup kód: `bcrypt.compare` proti `backupCodeHashes[]`; shoda → odeber použitý hash.
4. Špatný → `meta.attempts++`, `401 TOTP_INVALID_CODE`.
5. OK → `consume(challengeId)`; pokud `trustDevice` → vytvoř `TrustedDevice` + nastav `ikaros_td` cookie (httpOnly, Secure+SameSite=None v prod, 30 d); vydej JWT + refresh (jako standardní login) → `{ status:'ok', ... }`.

Throttle endpointu: `@Throttle({ default: { ttl: 60_000, limit: 5 } })`.

### 5.6 Sanitize / MeResponse

- `sanitize()` rozšířit: nikdy nevrací `totpSecretEnc`, `backupCodeHashes`.
- `/users/me` přidá `totpEnabled: boolean`, `twoFactorMethod: string`.

### 5.7 Auto-revoke trustu

```ts
@OnEvent('user.password.changed')   // už existuje (revokuje refresh tokeny)
async onPasswordChanged({ userId }) { await this.trustedDevices.revokeAllForUser(userId); }
```
+ disable 2FA volá totéž.

### 5.8 Cookie helper

Rozšířit `common/utils/auth-cookie.ts` (PC-18) o `setTrustCookie` / `clearTrustCookie` / `readTrustCookie`. Name `ikaros_td`, httpOnly, `secure`+`sameSite:'none'` v prod (jinak `lax`), **path `/api/auth`** (pokrývá login i 2fa endpointy, jako refresh cookie), maxAge 30 d.

---

## 6. Frontend

### 6.1 Komponentní strom
```
features/profile/components/
  ├── SecuritySection.tsx               (rozšíření — přidat 2 karty)
  ├── TotpCard.tsx                       (NEW — stav + setup wizard + disable)
  ├── TotpSetupWizard.tsx                (NEW — QR → kód → backup kódy)
  └── TrustedDevicesCard.tsx             (NEW — výpis + odvolat)
features/auth/components/
  ├── LoginModal.tsx                     (rozšíření — switch na TotpVerifyStep)
  └── TotpVerifyStep.tsx                 (NEW — 6místný kód / backup + trust checkbox)
features/auth/api/useAuth.ts            (useLogin union + useLoginTotp)
features/profile/api/useProfile.ts      (nové 2FA hooky)
features/profile/lib/profileSchemas.ts  (totp/disable zod)
shared/types/...                         (LoginResponse union, MeResponse.totpEnabled)
```

### 6.2 Login flow (LoginModal)
Po `login.mutateAsync(values)`:
```ts
if (result.status === 'totp_required') {
  setTotpContext({ challengeId: result.challengeId });   // přepne obsah modalu na TotpVerifyStep
  return;
}
// (deletion_pending jako dnes; 'ok' standardně)
```
`TotpVerifyStep`: input 6 číslic (autofocus, inputMode numeric), odkaz „Použít záložní kód", checkbox „Důvěřovat tomuto zařízení 30 dní" → `loginTotp.mutateAsync({ challengeId, code, trustDevice })` → `'ok'` → setAuth + zavřít. Chyby: `TOTP_INVALID_CODE` → „Neplatný kód", `TOTP_TOO_MANY_ATTEMPTS` → „Příliš mnoho pokusů, přihlas se znovu" (zpět na krok hesla), `TOTP_CHALLENGE_INVALID` → totéž.

### 6.3 Profil — TotpCard + wizard
- **Vypnuto:** popis + tlačítko „Zapnout 2FA" → `TotpSetupWizard`:
  1. `POST /auth/2fa/setup` → zobraz **QR** (img z `qrDataUrl`) + secret pro manuální zadání + návod (Google Authenticator/Authy).
  2. Input kódu → `POST /auth/2fa/enable` → zobraz **10 backup kódů** s „Stáhnout/Zkopírovat" + povinné zaškrtnutí „Uložil jsem si je" → hotovo, invalidate `users/me`.
- **Zapnuto:** stav „Aktivní od `<datum>`", tlačítko „Vygenerovat nové záložní kódy" (heslo) a „Vypnout 2FA" (heslo).

### 6.4 TrustedDevicesCard
Výpis (label, „naposledy `<datum>`", odznak „toto zařízení"), „Odvolat" u každého + „Odvolat všechna". Prázdný stav: „Žádná důvěryhodná zařízení."

---

## 7. UI/UX detail

- **Theme:** žádné per-theme přepisy (`feedback_theme_isolation`); karty respektují `data-theme`.
- **Mobile:** wizard a verify krok plně na mobilu (QR čitelná, velký numerický input, backup kódy v mono bloku); po grafice skill `mobil-desktop`.
- **A11y:** modal focus trap, kód input `aria-label`, backup kódy `role="list"`, chybové hlášky `role="alert"`.
- **Prázdné/loading stavy:** spinner při setup/enable; disable a regenerate s potvrzením heslem.
- **Friendly messaging:** auth chyby věcné (`friendly-messaging` auth-flow výjimka — bezpečnostně přesné, ne vlídně mlžící).

---

## 8. Acceptance kritéria

**Setup & enable**
- [ ] Profil → „Zapnout 2FA" → QR + manuální secret se zobrazí.
- [ ] Naskenuji v authenticatoru, zadám kód → 2FA aktivní, zobrazí se 10 backup kódů.
- [ ] Backup kódy nelze zavřít bez zaškrtnutí „Uložil jsem si je".
- [ ] `/users/me` má `totpEnabled:true`, nikdy nevrací secret ani hashe.

**Login s 2FA**
- [ ] Login heslem u 2FA usera → `status:'totp_required'`, **žádný token** ve store.
- [ ] Správný TOTP kód → přihlášení OK.
- [ ] Backup kód funguje jednou; podruhé týž kód → neplatný.
- [ ] 5× špatný kód → `429`, návrat na krok hesla.
- [ ] Odchycený `challengeId` po 5 min → `401 CHALLENGE_INVALID`.

**Remember-device**
- [ ] Při verify zaškrtnu „důvěřovat" → příští login na témž prohlížeči **přeskočí** 2FA.
- [ ] Jiný prohlížeč/inkognito → 2FA se ptá.
- [ ] Profil → „Důvěryhodná zařízení" ukazuje záznam s „toto zařízení".
- [ ] „Odvolat" → příští login zase vyžaduje 2FA.
- [ ] Změna hesla → všechna trusted devices revokována.
- [ ] Vypnutí 2FA → trusted devices revokována + secret/backup smazány.

**Disable & bezpečnost**
- [ ] Vypnutí 2FA bez hesla → odmítnuto.
- [ ] Secret v DB je šifrovaný (ne plaintext); bez `TOTP_ENC_KEY` BE nenastartuje.

**Mobil/a11y**
- [ ] Skill `mobil-desktop` prošel pro wizard, verify krok i karty.

---

## 9. Test plán

**BE (jest, `--maxWorkers=2` dle `project_be_test_mongo_flaky`):**
- `totp-crypto.service.spec` — encrypt/decrypt round-trip, chybný klíč.
- `auth.service.spec` — login totp_required vs trust-zkratka vs ok; login/totp happy, špatný kód, attempts, backup kód jednorázovost.
- `trusted-devices.service.spec` — match z cookie, touch, revoke (jedno/vše/by-user), TTL.
- `auth.2fa.e2e-spec` — setup→enable→login s kódem→trust→druhý login skip→revoke.
- env fail-fast test (chybí `TOTP_ENC_KEY`).

**FE (vitest, explicit importy, fireEvent — `project_fe_test_precommit`):**
- `TotpVerifyStep.spec` — kód submit, backup toggle, chyby.
- `TotpSetupWizard.spec` — QR krok, enable, backup gating.
- `TrustedDevicesCard.spec` — výpis, revoke.
- `useAuth`/`useProfile` hook testy (union, invalidace `users/me`).

**Build:** `npm run build` (tsc -b) před push (`project_fe_build_preexisting_errors`). BE po změně **restart** (`feedback_be_restart_required`).

---

## 10. Riziko & rollback

| Riziko | Mitigace |
|---|---|
| Ztráta `TOTP_ENC_KEY` v prod = nečitelné secrety, nikdo s 2FA se nepřihlásí | Klíč zálohovat mimo DB; backup kódy jako únik; admin manuální disable přes DB. Doplnit do DR runbooku (14.4). |
| Clock drift telefon↔server | otplib window ±1 (±30 s). |
| Trust cookie únik | httpOnly (mimo JS), v DB jen hash, revokovatelné, 30 d TTL. |
| Challenge brute-force | attempts cap 5 + Throttler 5/min. |
| Uživatel se zamkne (ztráta telefonu i kódů) | Admin disable 2FA (zváž endpoint v 14.1-c) — zatím DB/manuál, dluh. |

**Rollback:** featura je opt-in a additivní — `totpEnabled:false` = chování beze změny. Nouzově: globální disable přes feature-flag / hromadné `totpEnabled:false` v DB; FE krok je za `status:'totp_required'`, který BE bez 2FA nikdy nevrátí.

---

## 11. Tracked dluhy / follow-upy

- **14.1-a** E-mail OTP metoda (slabší, oddělená od resetu hesla).
- **14.1-c** Vynucení 2FA pro Admin/Superadmin + admin „disable 2FA usera" (lockout recovery).
- **D-NEW-2FA-TTL** Konfigurovatelná trust TTL + počet backup kódů (hardcoded ve V1).
- **D-NEW-2FA-AUDIT** Audit log 2FA akcí (enable/disable/trust revoke).
- **Vazba na 14.4 (DR):** `TOTP_ENC_KEY` do zálohy/runbooku — bez něj jsou 2FA secrety po obnově nečitelné.

---

## 12. Otevřené body (pre-implementation)

- [ ] Ověřit, že `@nestjs/throttler` je dostupný na `/auth/login/totp` (je — login už throttluje).
- [ ] Ověřit přesné jméno `user.password.changed` eventu a `setRefreshCookie` helperu v BE (rešerše je našla, potvrdit při kódu).
- [ ] Rozhodnout formát „Stáhnout backup kódy" (txt soubor vs jen kopírovat) — drobnost, default: kopírovat + .txt download.

---

## 13. Po schválení tohoto specu

Napíšu `docs/arch/phase-14/plan-14.1.md` — implementační plán s pořadím (BE: env+crypto → schema/repo → security-token peek → trusted-devices modul → 2fa service+controller → login integrace → testy · FE: types → hooks → TotpVerifyStep+login → profil karty → testy → `mobil-desktop` → `napoveda`), konkrétní soubory a checklisty. Pak teprve kód.

**Pozn.:** V1 vědomě obsahuje remember-device celé (vč. revokace) — žádné půlené řešení.
