# ext-35 — Auth/session attack surface · dosažená L3 (statika)

## Verdikt 1 — guard role staleness: VYVRÁCENO (REST) / reziduum CONFIRMED
- `jwt-auth.guard.ts:43,69` už bere roli čerstvě z DB (findById per-request), demotovaný Admin práva na REST NEdrží. `optional-jwt-auth.guard.ts` taky.
- REZIDUUM: access token nejde zneplatnit — žádný tokenVersion/jti/passwordChangedAt.
  - `auth.service.ts:503-509` handlePasswordChanged revokuje jen refresh → 🔴 přiživený access token útočníka žije až 3 dny (JWT_EXPIRES_IN 3d).
  - `auth.service.ts:477-480` logoutAll jen refresh+elevace → ⭐ access žije.
  - WS: `socket-io.adapter.ts:34-51` wsAccountGate kontroluje jen ban/delete, roli NEobnovuje → ⭐ stale role na WS.

## Verdikt 2 — TOTP bez per-účet lockoutu: 🔴 POTVRZENO
- `totp.service.ts:120-133` verifyForLogin vrací bool, nic neinkrementuje; `auth.service.ts:293-298` špatný kód → throw ale challenge NEspotřebuje (consume až při úspěchu :301). Challenge žije 5 min.
- Jediná ochrana = IP throttle (`auth.controller.ts:101` 5/60s, default IP tracker) → rotací IP neomezené pokusy. window:1 = 3 platné kódy/pokus. Multi-instance in-memory throttle dělí limit.

## Verdikt 3 — enumeration: ⭐ POTVRZENO
- Login timing: `auth.service.ts:195-199` neexistující účet → throw BEZ bcrypt.compare; existující → bcrypt.compare (pomalé) → časový orákl. Žádný dummy-hash.
- `/auth/check-email` `:495-501` vrací `{available}` = přímý orákl (rate 60/min). register EMAIL_TAKEN taky.
- forgot-password: VYVRÁCENO (vždy `{ok:true}` ✅).

## FIX plán (BE):
- **F2 TOTP lockout** 🔴 = SAFE FIX (aditivní čítač, nemění happy-path). totpFailedAttempts/totpLockedUntil na User NEBO Redis `totp:{userId}`, inkrement v loginTotp při !ok, po 5 zamknout X min nezávisle na IP. Test auth.service.spec.
- **F3 dummy bcrypt** ⭐ = SAFE FIX. neexistující účet → bcrypt.compare proti fix hashi (konstantní čas). Test timing delta.
- **F1 tokenVersion** 🔴 = VYŠŠÍ BLAST-RADIUS (chyba = odhlásí všechny). tokenVersion na User + do access payloadu; guard porovná `(payload.tokenVer ?? 0) === (user.tokenVersion ?? 0)` (backward-compat!); inkrement při logoutAll/passwordChanged/ban. Guest (anon_*) vynechat. WS wsAccountGate doplnit. Test-first + jest+e2e MUSÍ projít.

## Fix status: F2+F3 = FIXNU (safe, BE). F1 = fixnu opatrně test-first NEBO nechám na review (rozhodnu dle času).
