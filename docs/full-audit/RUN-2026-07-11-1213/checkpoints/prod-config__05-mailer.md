# prod-config — 05 Mailer config (SMTP) · dosažená L3 (statika)

> READ-ONLY. Osy `ML`/`PA`/`TL`. Registr: `docs/prod-config-audit.md` (PC-01..24, sweep 2026-06-14 „opraveno").
> Legenda: 🆕 nový · ♻️ recyklace (už našel jiný styl/registr) · 🔓 reopen/oslabená náprava.
> Pozn. ze stylu 45 (delivery): „Sent"=relay-accept · forgot-password inline blok · MAIL_FROM nevalidováno.

---

## 🔓 N-01 — PC-02 náprava OSLABENA: reset-odkazy → `localhost:5173` v prod (tiše)  🟠
**Nejzávažnější nález.** PC-02 (🔴 mrtvý web) byl „opraven" nahrazením hardcoded `newmatrix.patrikzplzne.cz`
za dev fallback + spolehnutím na env.validation, že v prod bude `FRONTEND_URL` povinné. **To ale neplatí.**

- `smtp-mailer.provider.ts:43` — `this.appUrl = config.get('FRONTEND_URL') ?? 'http://localhost:5173';`
- Komentář `smtp-mailer.provider.ts:21-22` tvrdí: *„v produkci povinné přes env.validation, takže odkazy
  nikdy nemíří na localhost/cizí web"* — **NEPRAVDA.**
- `env.validation.ts:17` `REQUIRED_IN_PROD = ['MONGODB_URI','JWT_SECRET','JWT_REFRESH_SECRET']` — **FRONTEND_URL tam NENÍ.**
- `env.validation.ts:28-40` `RECOMMENDED_IN_PROD` obsahuje `FRONTEND_URL` → chybění jen `console.warn` (`env.validation.ts:76-86`), **app nabootuje.**
- `env.validation.ts:65-70` PROD_URLS localhost-check se spustí JEN když je `FRONTEND_URL` string; při **chybějící** hodnotě `typeof val==='string'` selže → přeskočí (jen „missing degradovaný režim" warning).
- Provider se instancuje čistě z `SMTP_HOST`+`SMTP_USER` (`mailer.module.ts:15-17`), **nezávisle na FRONTEND_URL**.

**Dosažitelnost v prod:** SMTP nastaven + `FRONTEND_URL` zapomenut → mailer aktivní, reset/verify odkaz
= `http://localhost:5173/reset-password?token=…` (`mailer.templates.ts:68,79,90` + `link()` :54-57). Uživatel
dostane rozbitý odkaz, jen jeden `console.warn` v logu. Registr `prod-config-audit.md:42` navíc opakuje
lživé „v prod povinné FRONTEND_URL (validace)". **Kořen:** softening po „deploy incidentu 2026-06-14"
(`env.validation.ts:6-11`) proběhl AŽ PO označení PC-02 za opravené → záruka eroduje.
Původní 🔴 (cizí web) je pryč; varianta „rozbité odkazy v prod" **re-opened na 🟠**.

## 🆕 N-02 — STARTTLS/587 bez `requireTLS` → plaintext downgrade  🟡 (⭐ TL)
- `smtp-mailer.provider.ts:45-50` — `createTransport({ host, port, secure: port===465, auth })`.
- Dokumentovaný default port = **587** (`:18,36` `?? 587`), tj. `secure:false` → nodemailer dělá
  **oportunistický** STARTTLS. Chybí `requireTLS:true`. Aktivní MITM, který odstřihne serverem inzerované
  STARTTLS, → SMTP AUTH (App Password) + celý mail letí **v plaintextu**, bez chyby.
- Plán `05-mailer.md` kontrolní krok 3 to **explicitně žádal ověřit** („STARTTLS na 587 vyžaduje requireTLS") —
  v registru PC-01..24 **není zaznamenáno**. Reálný exploit vyžaduje aktivní MITM (Gmail STARTTLS vždy inzeruje) → 🟡.
- Sub-bod: žádný `connectionTimeout`/`greetingTimeout`/`socketTimeout` → visící SMTP blokuje `await` v
  `forgotPassword` (`auth.service.ts:530`) → latence/DoS okno na HTTP flow. Náprava = timeouty + `requireTLS`.

## ♻️ N-03 — „Sent" = relay-accept, ne doručení  🟡 (styl 45)
- `smtp-mailer.provider.ts:70-72` `logger.log('Sent ${template} → …')` — `transporter.sendMail` potvrzuje
  jen **přijetí obálky SMTP relayem**, ne doručení. Bounce později = žádná viditelnost. Observability, ne config-průlom.

## ♻️ N-04 — forgot-password inline try/catch je mrtvý  🟡 (styl 45)
- `auth.service.ts:529-539` obaluje `sendPasswordReset` do try/catch a loguje `forgotPassword mailer fail for ${user.id}`.
- Ale `MailerService.dispatch` (`mailer.service.ts:101-113`) **všechny chyby už spolkne** (nikdy nere-throwuje) →
  vnější catch je **nedosažitelný dead code**. Duplikát swallowingu. Kosmetika.

## ♻️/🆕 N-05 — MAIL_FROM nevalidováno + úplně mimo env.validation  🟡
- `smtp-mailer.provider.ts:40` `this.from = config.get('MAIL_FROM') ?? 'Projekt Ikaros <${user}>';` — **žádná
  kontrola formátu.** Špatná hodnota (`MAIL_FROM=noreply` bez domény) → relay odmítne VŠECHNY maily, tiše
  (dispatch spolkne). `MAIL_FROM` chybí v `REQUIRED_IN_PROD` i `RECOMMENDED_IN_PROD` i v healthchecku
  (`app.controller.ts:86-94` ověřuje jen HOST+USER). Styl 45 už surfoval „nevalidováno"; pro prod-config je
  navíc EV-mezera (proměnná nezná žádná validační vrstva). By-design fallback → 🟡.

---

## Pozitiva (potvrzeno L1-L3)
- ✅ Anti-enumeration: `forgotPassword` vždy `{ok:true}` (`auth.service.ts:518-541`) + `dispatch` swallow.
- ✅ Fail-open na cizí web (`newmatrix`) fakticky **odstraněn** z kódu (`smtp-mailer.provider.ts:43` = localhost).
- ✅ Log hygiena: e-mail maskovaný (`mask()` :53-59 + `mailer.service.ts:94-99`), token jen 8 znaků (log-mailer :39).
- ✅ LogMailer v prod nedumpuje obsah, jen varuje (`log-mailer.provider.ts:27-32`).
- ✅ HTML escaping username/emailu (`mailer.templates.ts:22-30 esc()`), token `encodeURIComponent` (:54-57).
- ✅ `secure: port===465` logika správně mapuje 465=implicit TLS.

## Klasifikace nálezů
| # | Typ | Záv. | Osa | Soubor:řádek |
|---|---|---|---|---|
| N-01 | 🔓 reopen PC-02 | 🟠 | ML/PA/EV | smtp-mailer.provider.ts:43 + env.validation.ts:17,28 |
| N-02 | 🆕 | 🟡 | TL | smtp-mailer.provider.ts:45-50 |
| N-03 | ♻️ (st.45) | 🟡 | ML | smtp-mailer.provider.ts:70-72 |
| N-04 | ♻️ (st.45) | 🟡 | ML | auth.service.ts:529-539 |
| N-05 | ♻️/🆕 | 🟡 | ML/EV | smtp-mailer.provider.ts:40 |

**Návrhy (gated, neopravovat tiše):** N-01 → přidat `FRONTEND_URL` do `REQUIRED_IN_PROD` (fail-fast v prod),
NEBO opravit lživý komentář+registr a přijmout jako vědomý dluh. N-02 → `requireTLS: port!==465` + timeouty.
N-05 → doplnit MAIL_FROM do RECOMMENDED + healthcheck. N-03/N-04 = kosmetika, low priority.
