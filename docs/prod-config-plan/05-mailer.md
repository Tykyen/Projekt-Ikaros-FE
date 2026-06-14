# 05 — Mailer config (SMTP)

> **Osy:** `ML` (mailer config), `PA` (config parita — odkazy v mailech), `TL` (SMTP transport).
> **Cílová otázka:** odesílá mailer přes **produkční SMTP** se správným `secure` a míří **odkazy v mailech**
> (reset hesla, notifikace) na **živou produkční FE URL** — nebo na localhost / mrtvý web?
>
> ⚠️ Cross-ref aktivní úkol [paměť `project_smtp_email_setup`] — SMTP setup probíhá **právě teď**; tato
> oblast ho audituje jako součást deploye.

---

## Povrch

| Co | Kde | Fallback |
|---|---|---|
| Provider switch (SMTP vs Log) | mailer.module.ts:14-18 | `!SMTP_HOST \|\| !SMTP_USER` → `LogMailerProvider` |
| SMTP transport | smtp-mailer.provider.ts:34-49 | host/port/user/pass z config |
| `secure` flag | smtp-mailer.provider.ts:46 | `port === 465` (465=TLS, 587=STARTTLS) |
| `MAIL_FROM` | smtp-mailer.provider.ts:40 | `Projekt Ikaros <${SMTP_USER}>` |
| **Odkazy v mailech** (`appUrl`) | smtp-mailer.provider.ts:42 | **`FRONTEND_URL ?? 'https://newmatrix.patrikzplzne.cz'`** |

---

## Kontrolní kroky (sweep)

1. **`appUrl` fallback** (K-PC2) 🔴 — [smtp-mailer.provider.ts:42] fallbackuje na `https://newmatrix.patrikzplzne.cz`. Podle [paměť `project_server_swap`] je to **starý .NET server se starou DB** — nový cíl je `www.projekt-ikaros.com`. Tedy: pokud `FRONTEND_URL` v mailer kontextu chybí, reset-hesla odkaz vede uživatele na **cizí mrtvý web**. Návrh: nahradit fail-fast nebo produkční URL; **nikdy** hardcoded doménu.
2. **Konzistence `FRONTEND_URL`** — mailer `appUrl` musí být **stejná** hodnota jako CORS origin (oblast 03) a FE `VITE_API_URL` směřuje na backend. Jeden `FRONTEND_URL` napříč. `PA`.
3. **`secure` / port** — prod SMTP: 587 (STARTTLS) nebo 465 (TLS). Ověř, že `secure: port===465` logika sedí s reálným prod portem; STARTTLS na 587 vyžaduje `requireTLS` (ověřit, zda nastaveno).
4. **LogMailer v prod** — pokud `SMTP_HOST`/`SMTP_USER` chybí v prod, maily se **jen logují** (neodešlou). Reset hesla tiše nefunguje. Ověř, že deploy předává SMTP proměnné (cross-ref `ED` oblast 01).
5. **Anti-enumeration** — `dispatch()` swallows errors (recon §6) — správné (neúnik existence účtu), ale ověř, že selhání odeslání se aspoň loguje server-side.

---

## Seed mapping

- **K-PC2** 🔴 `ML`/`PA` — fallback na newmatrix.patrikzplzne.cz (mrtvý server). **Hlavní 🔴 oblasti.**
- **K-PC10** 🟠 `PA` — `FRONTEND_URL` konzistence napříč mailer/CORS/FE.

## Pasti

- ⚠️ Dva fallbacky `FRONTEND_URL` se liší: main.ts → `localhost:5173`, mailer → `newmatrix.patrikzplzne.cz`. **Nekonzistentní** — důkaz chybějícího centrálního configu.
- ⚠️ Reset-hesla token v URL — ověř, že odkaz nese token bezpečně (HTTPS, krátká expirace); cross-ref [form-schema] reset hesla naming-drop.

## Pozitiva k ověření

- ✅ Provider switch (SMTP vs Log) — app funguje bez SMTP (dev).
- ✅ Anti-enumeration (errors swallowed).
