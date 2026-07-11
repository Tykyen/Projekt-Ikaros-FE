# log-hygiene — 02 mailer & PII (RUN-2026-07-11-1213)

**Osy PII/SEC. Verdikt: ✅ čisté, 0 nových nálezů. Prior fixy LH-03/LH-04 drží.**

## Ověřeno (L3)
- **SmtpMailerProvider (prod provider)** [smtp-mailer.provider.ts:70-72] — `Sent ${template} → ${SmtpMailerProvider.mask(payload.to)}` → e-mail maskovaný `t***@g***` (LH-03). ✅ Tělo mailu (reset/verify URL s plným tokenem) se NELOGUJE — jen `transporter.sendMail`. ✅
- **MailerService.dispatch** [mailer.service.ts:108-111] — catch loguje `template=… to=${mask(payload.to)}` + `err.stack` string (ne celý `err`). ✅ (LH-03 mirror + LH-01 vzor)
- **LogMailerProvider (dev/test)** [log-mailer.provider.ts:26-49]:
  - **prod větev** [:27-31] — `if (NODE_ENV==='production')` → jen warn „mailer není nakonfigurován … NEBYL odeslán", **žádný obsah**, return. ✅ (LH-04)
  - dev větev [:33] — JSON s `to`/`username`/token[0:8]/oldEmail/newEmail. Scanner flag `SEC,OBJ,JSON,CTX`, ale **dev-only** (za prod gate) → v prod nedosažitelné. ⚖️

## Prod gate (dosažitelnost)
LogMailer se instancuje jen když chybí `SMTP_HOST`+`SMTP_USER` (factory gate). Prod má SMTP env → SmtpMailer. I kdyby prod běžel bez SMTP (misconfig), LogMailer v prod jen warnuje bez obsahu. Dvojitá pojistka. ✅

## 🆕 tento run: 0
