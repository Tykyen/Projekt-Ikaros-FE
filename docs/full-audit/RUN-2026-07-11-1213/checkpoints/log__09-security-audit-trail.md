# log-hygiene — 09 security audit trail (inverzní) (RUN-2026-07-11-1213)

**Osy AUD/INJ. Verdikt: ✅ základ drží + ZLEPŠENÍ (brute-force alert). 0 nálezů, 1 pozitivní delta.**

## AUD — co se loguje (drží + nové)
- Refresh token reuse (krádež) — `warn` `userId`+`familyId` [auth.service.ts]. 🟢 vzor
- Password change — `log` `userId` [auth.service.ts:505]. 🟢
- Mailer fail (reset/verify) — `warn` `userId`+`err.message`. 🟢
- **🆕 Brute-force login spike** — [brute-force.monitor.ts] agregátní počet selhání (`INVALID_CREDENTIALS` z exception filtru [:67-69]), práh 20/min → critical alert do Discordu. **Částečně zavírá K-LOG10 gap „failed login neloguje stopu"** — agregátní signál místo per-pokus (chytí i IP-rotaci, kterou per-IP throttler mine). Bez PII (jen počet). 🟢 zlepšení.

## INJ (K-LOG11)
Auth/admin cesta loguje `userId` (ID, ne vstup). Žádný `logger.warn('… for ${username}')` s user inputem → žádný `\n` forging. ✅

## AUD × PII trade-off
Vše pseudonymní (`userId`/`familyId`), žádný e-mail/username/heslo/token v audit logu. ✅ jeden vzor pro AUD i PII.

## Zbývá (nice-to-have, ne nález)
- Per-pokus failed login stále neloguje individuální stopu (jen agregátní spike). Authz denial (RolesGuard `return false`) neloguje — tichý 403 (objem vs. hodnota, ⚖️).

## 🆕 tento run: 0 nálezů (1 pozitivní delta = brute-force monitor)
