# prod-config / 05-mailer — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20  
Auditor: hloubkový agent (oblast 05, read-only)

---

## Pokrytí

Přečtené soubory (HEAD):
- `backend/src/modules/mailer/providers/smtp-mailer.provider.ts`
- `backend/src/modules/mailer/mailer.module.ts`
- `backend/src/modules/mailer/mailer.service.ts`
- `backend/src/modules/mailer/mailer.templates.ts`
- `backend/src/modules/mailer/interfaces/mailer-provider.interface.ts`
- `backend/src/modules/mailer/providers/log-mailer.provider.ts`
- `backend/src/modules/mailer/providers/log-mailer.provider.spec.ts`
- `backend/src/modules/mailer/mailer.module.spec.ts`
- `backend/src/modules/mailer/mailer.service.spec.ts`
- `backend/src/modules/mailer/mailer.templates.spec.ts`
- `backend/src/common/config/env.validation.ts`
- `backend/src/common/config/env.validation.spec.ts`
- `backend/.env.example` (SMTP sekce)
- `docker-compose.prod.yml` (SMTP sekce, řádky 95–116)
- `.github/workflows/deploy.yml` (řádky 50–93)
- `docs/full-audit/RUN-2026-06-20-1621/scanners/config.txt` (M-FALLBACK katalog)
- `docs/prod-config-audit.md` (registr + stav oprav)
- `docs/prod-config-plan/05-mailer.md`
- `docs/prod-config-plan/README.md`

Osy pokryté: `ML` (mailer config), `PA` (config parita — odkazy), `TL` (SMTP transport),
`DP` (deploy parita SMTP vars), `EV` (env.validation dopad na mailer).

---

## Dosažená L vs cílová L

| Osa | Cíl | Dosaženo | Poznámka |
|---|---|---|---|
| `ML` | L4 | **L3** | Statika + kontext dosažitelnosti; deploy parita SMTP vars ověřena čtením; live SMTP test = PROOF-REQUEST |
| `PA` | L3 | **L3** | appUrl fallback opravena, kruh FRONTEND_URL→env.validation ověřen |
| `TL` | L2 | **L2** | `secure: port===465` logic přečtena; `requireTLS` pro STARTTLS = nalezena díra (PC-RUN-01) |
| `DP` | L4 | **L3** | SMTP vars přítomny v deploy.yml + compose, ale bez `:?required` (PC-RUN-02); SMTP_PASS klasifikace ověřena |

---

## Nálezy

### ♻️ PC-02 — OPRAVENO (ověřeno kódem)

Původní nález: `smtp-mailer.provider.ts:42` fallback na `https://newmatrix.patrikzplzne.cz`.  
**Aktuální stav HEAD:** řádek 43 nyní:
```ts
this.appUrl = config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
```
Komentář na ř.41-42 dokumentuje opravu (`PC-02: žádný hardcoded fallback na starý web`).  
`env.validation.ts` přidává `FRONTEND_URL` do `RECOMMENDED_IN_PROD` → v prod varuje při absenci.  
Závěr: **♻️ PC-02 opraveno v kódu, L3 ověřeno staticky.** Zbývá živý SMTP test (PROOF-REQUEST).

---

### PC-RUN-01 — [TL] STARTTLS bez `requireTLS` · 🟡

**Kde:** `smtp-mailer.provider.ts:45-50`  
**Co:** nodemailer transport na port 587 (STARTTLS) používá `secure: false` (správně — `port===465` vrátí false pro 587), ale chybí `requireTLS: true`. Bez `requireTLS` nodemailer **akceptuje i plaintext připojení** pokud server STARTTLS nenabídne (downgrade). U Gmail (smtp.gmail.com:587) to v praxi nevadí, protože Gmail STARTTLS vždy vyžaduje — ale kód tuto záruku nedává a závisí na chování externího SMTP serveru.  
**Dopad:** pokud by se změnil SMTP_HOST na server bez povinného STARTTLS, maily by mohly odejít plaintextem bez chyby. Riziko je nízké (Gmail to dělá správně), ale přítomné jako konfigurační dluh.  
**Návrh:** přidat `requireTLS: true` do `createTransport` options — 1 řádek, nulový risk na Gmail.  
**L2 · 🟡 · 🆕**

---

### PC-RUN-02 — [DP] SMTP_HOST / SMTP_USER bez compose `:?required` · 🟡

**Kde:** `docker-compose.prod.yml:103,105`  
```yaml
SMTP_HOST: ${SMTP_HOST}
SMTP_USER: ${SMTP_USER}
```
**Co:** SMTP_HOST a SMTP_USER jsou v compose předány jako `${VAR}` (bez `:?required`), zatímco JWT_SECRET a JWT_REFRESH_SECRET mají `${VAR:?...}`. Pokud tyto vars chybí v deployi, `createMailerProvider()` vrátí `LogMailerProvider` a maily se tiše **neodešlou** — bez chyby při startu, jen warn v logu.  
**Kontext dosažitelnosti (L3):** `env.validation.ts:38-39` (`RECOMMENDED_IN_PROD`) varuje, ale neshazuje. Takže: compose spustí BE bez chyby, `LogMailerProvider` varuje při volání, ale reset hesla tichý selže.  
**Dopad:** reset hesla / email verify tichý fail v produkci — uživatel nic nedostane. Existující varování v `LogMailerProvider.send()` to aspoň signalizuje v logu (server-side OK), ale není fail-fast.  
**Návrh:** přidat `:?required` do compose pro `SMTP_HOST`/`SMTP_USER` NEBO přijmout jako by-design (LogMailer v prod = vědomý downgrade). Alternativa: env.validation přesunout SMTP_HOST do vyšší priority varování.  
**L3 · 🟡 · 🆕**

---

### PC-RUN-03 — [ML] `mailer.templates.spec.ts` používá starý `newmatrix` URL jako APP_URL · 🟡

**Kde:** `backend/src/modules/mailer/mailer.templates.spec.ts:4`  
```ts
const APP_URL = 'https://newmatrix.patrikzplzne.cz';
```
**Co:** testovací konstanta stále odkazuje na mrtvý `newmatrix.patrikzplzne.cz` jako `APP_URL`. Testy testují `renderEmail()` s tímto URL a ověřují, že odkaz obsahuje tento prefix — takže assertují na mrtvé doméně.  
**Dopad:** testy procházejí (renderEmail je agnostický na URL), ale jsou zavádějící — při review vypadá, jako by byl mrtvý web schválený vstup. Navíc: pokud by test někdy testoval, že URL míří na produkční doménu, selžou.  
**Návrh:** nahradit `const APP_URL = 'https://www.projekt-ikaros.com'` (nebo neutrální `https://example.com`).  
**L1 · 🟡 · 🆕**

---

### PC-RUN-04 — [DP] `TOTP_ENC_KEY` chybí v deploy.yml i docker-compose.prod.yml · 🟠

**Kde:** `deploy.yml` (celý) + `docker-compose.prod.yml` (celý) + `.env.example` (není v souboru)  
**Co:** `TOTP_ENC_KEY` (14.1 2FA šifrovací klíč) je:
- čteno v kódu: `totp-crypto.service.ts:26`
- v `RECOMMENDED_IN_PROD` v `env.validation.ts:39` → varování, ne boot-fatal
- **NENÍ** v `deploy.yml` (vůbec) → nebude předáno do `.env` při deployi
- **NENÍ** v `docker-compose.prod.yml` → compose ho nevidí
- **NENÍ** v `.env.example` → vývojář neví, že existuje

Scanner `config.txt` sekcí (a) ho hlásí jako čteno-ale-nepředáno. env.validation varuje, TotpCryptoService pak fail-closes (`throw` v `loadKey`) → **2FA setup je v prod tichý fail-closed** bez klíče (uživatel nemůže zapnout 2FA), ale app běží.  
**Dopad:** každý pokus o zapnutí 2FA v prod selže (runtime throw z TotpCryptoService), přestože feature je implementována a paměť `project_2fa_architecture` ji označuje jako HOTOVO. Nezdokumentovaný OPS krok.  
**Cross-ref:** oblast 01 (env inventory) + oblast 02 (secrets) — primárně tam patří, zde jako cross-oblast pro mailer (mailer sekce v deploy.yml je nejbližší kontext v deploy.yml).  
**Návrh:** přidat `TOTP_ENC_KEY=${{ secrets.TOTP_ENC_KEY }}` do deploy.yml + compose + .env.example.  
**L3 · 🟠 · 🆕** *(mimo striktní mailer oblast — cross-oblast nález, zaznamenán zde protože config.txt ho ukázal při mailer sweepovém čtení deploy.yml)*

---

### ✅ Ověřena pozitiva (z plánu oblasti)

| Pozitivum | Stav | Kde |
|---|---|---|
| Provider switch (SMTP vs Log) | ✅ funguje | `mailer.module.ts:14-17` — `!!SMTP_HOST && !!SMTP_USER` |
| Anti-enumeration (errors swallowed) | ✅ | `mailer.service.ts:74-85` — dispatch swallows + loguje |
| FRONTEND_URL fallback opravena (ne mrtvý web) | ✅ | `smtp-mailer.provider.ts:43` — localhost:5173 |
| env.validation FRONTEND_URL v RECOMMENDED_IN_PROD | ✅ | `env.validation.ts:29` |
| `secure: port===465` logika | ✅ | `smtp-mailer.provider.ts:48` |
| SMTP vars v deploy.yml předány správně | ✅ | `deploy.yml:69-73` |
| SMTP_PASS jako `secrets.SMTP_PASS` (ne vars) | ✅ | `deploy.yml:72` — správná klasifikace |
| LogMailerProvider v prod hlasitě varuje | ✅ | `log-mailer.provider.ts:27-31` |
| PII masking v SMTP logu | ✅ | `smtp-mailer.provider.ts:54-59` `mask()` |
| HTML escape username v šablonách (anti-XSS) | ✅ | `mailer.templates.ts:23-30` `esc()` |
| Token URL-enkódování | ✅ | `mailer.templates.ts:54-57` `encodeURIComponent()` |
| .env.example dokumentuje SMTP sekci | ✅ | `.env.example:49-56` |
| MAIL_FROM v .env.example (ne in-code jen) | ✅ | `.env.example:56` |
| auth v transport undefined když user/pass chybí | ✅ | `smtp-mailer.provider.ts:49` |

---

## PROOF-REQUEST

### PR-ML-01 — Live SMTP odeslání (Gmail + App Password)
**Osy:** `ML` `TL`  
**Co ověřit:** připojení smtp.gmail.com:587 proběhne s STARTTLS (ne plaintext); mail skutečně dorazí na cílovou adresu; odkaz v mailu míří na `https://www.projekt-ikaros.com` (prod FRONTEND_URL).  
**Jak:** BE restart s prod env → spustit forgot-password → zkontrolovat doručený mail + URL v odkazu.  
**Blokuje L5.**

### PR-ML-02 — LogMailer warn při chybějícím SMTP v produkci
**Co ověřit:** spustit BE v `NODE_ENV=production` bez `SMTP_HOST` → volat endpoint pro reset hesla → v logu musí být `warn: mailer není nakonfigurován`. Žádný mail, žádná chyba v response.  
**Jak:** boot-probe s minimálním env (DB+JWT, bez SMTP).  
**Blokuje L5.**
