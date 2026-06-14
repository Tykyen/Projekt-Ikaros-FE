# 02 — Mailer & PII

> **Otázka:** logují mailer providery **e-maily uživatelů a tokeny** do prod logu? **Osy:** `PII` `SEC`.
> **Plocha:** [smtp-mailer.provider.ts], [log-mailer.provider.ts], [mailer.service.ts], `mailer.templates`.

## Povrch (recon — konkrétní)

| Místo | Co loguje | Úroveň | Prod? | Verdikt-hypotéza |
|---|---|---|---|---|
| [smtp-mailer.provider.ts:62] | `Sent ${template} → ${payload.to}` (**e-mail příjemce**) | `log` | ✅ ano (prod provider) | 🟡 `PII` — K-LOG2 |
| [log-mailer.provider.ts:22-36] | `to`/`oldEmail`/`newEmail`/`username` + `token[0:8]` JSON | `log` | ⚖️ jen když SMTP env chybí | 🟡 `PII/SEC` — K-LOG3 |
| mailer.service.ts dispatch | swallow chyb do logu (`err.message`?) | ? | ✅ | ověřit `OBJ` |

## Co ověřit (L3)

1. **K-LOG2** — SMTP provider loguje e-mail příjemce **každého** mailu v prod. PII v logu. Návrh fix:
   logovat jen `template` + pseudonym (`userId`/hash e-mailu), ne plný e-mail. Nízká provozní hodnota plného
   e-mailu vs PII riziko.
2. **K-LOG3** — `LogMailerProvider` je dev/test (factory gate: aktivní jen když chybí `SMTP_HOST`+`SMTP_USER`).
   Ověřit, že **prod má SMTP env** → provider se nikdy nepoužije (cross-ref [paměť `project_smtp_email_setup`]).
   Pokud ano → leak je dev-only (⚖️). Pokud prod běží bez SMTP → 🟠 e-maily + token[0:8] v prod logu.
3. **Token v odkazu** — `mailer.templates` staví reset/verify URL s **plným tokenem**. Ověřit, že se
   **renderovaný HTML/text neloguje** (jen odesílá). Recon: smtp neloguje tělo (dobře), log-mailer jen
   token[0:8].
4. **`dispatch` swallow** — `MailerService.dispatch()` polyká SMTP chyby do logu (anti-enumeration, GOOD) →
   ověřit, že loguje `err.message`, ne celý `err` s e-mailem v transportu.

## Pasti
- E-mail = PII i bez tokenu (GDPR). Plný e-mail v prod logu = nález i bez secretu.
- `LogMailerProvider` token[0:8] je „anti-leak" komentář, ale 8 znaků = částečný leak při krátkém tokenu →
  ověřit délku tokenu (pokud ≥ 32, 8 znaků je OK; pokud kratší, problém).
- Po BE změně mailer factory → **restart** (jinak starý provider).
