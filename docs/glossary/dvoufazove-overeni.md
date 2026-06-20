---
name: dvoufazove-overeni
aliases: [2FA, dvoufázové ověření, TOTP, two-factor, trusted device, důvěryhodné zařízení]
category: architektura
related: [[globalni-role], [superadmin], [reaktivace]]
status: draft
---

# Dvoufázové ověření (2FA)

**TL;DR:** TOTP druhý faktor při přihlášení (challenge-flow — žádný token před ověřením); důvěryhodné zařízení přeskočí 2FA na 30 dní.

## Detail

2FA (roadmap2 14.1) chrání přihlášení druhým faktorem (TOTP, knihovna `otplib` v12):
- **challenge-flow** — před ověřením kódu se nevydá žádný token (peek ≠ consume),
- **secret šifrovaný** klíčem `TOTP_ENC_KEY` (fail-closed; klíč PATŘÍ DO ZÁLOH),
- **trusted device** — cookie `ikaros_td`, přeskočí 2FA na 30 dní, auto-revoke,
- sanitace na 2 místech (auth + users `/me`).

⚠️ Vyžaduje BE restart + env klíč.

## Kde se objevuje

- v dokumentaci: [01-ucet-prihlaseni-bezpecnost.md](docs/funkce/01-ucet-prihlaseni-bezpecnost.md)
- v UI: nastavení zabezpečení účtu, přihlašovací challenge

## Nepleť s

- **[[reaktivace]]** — obnovení smazaného účtu; 2FA je ověření při loginu.
