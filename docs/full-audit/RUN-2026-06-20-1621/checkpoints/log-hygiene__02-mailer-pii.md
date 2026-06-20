# log-hygiene / 02-mailer-pii — checkpoint RUN-2026-06-20-1621

Datum: 2026-06-20. Auditor: agent log-hygiene/02-mailer-pii. READ-ONLY.

## Pokrytí

Přečteno (vše HEAD):
- `backend/src/modules/mailer/providers/smtp-mailer.provider.ts`
- `backend/src/modules/mailer/providers/log-mailer.provider.ts`
- `backend/src/modules/mailer/mailer.service.ts`
- `backend/src/modules/mailer/mailer.module.ts`
- `backend/src/modules/mailer/mailer.templates.ts`
- `backend/src/modules/mailer/interfaces/mailer-provider.interface.ts`
- `backend/src/modules/mailer/providers/log-mailer.provider.spec.ts`
- `backend/src/modules/mailer/mailer.service.spec.ts`
- `backend/src/modules/mailer/mailer.module.spec.ts`
- `backend/src/common/logging/log-error.util.ts`
- `backend/src/common/logging/log-hygiene.spec.ts`
- Registr `docs/log-hygiene-audit.md` (stav LH-01..12)
- Scanner výstup `RUN-2026-06-20-1621/scanners/logs.txt`
- Plán `docs/log-hygiene-plan/02-mailer-pii.md` + README
- M-SCAN `--list` výstup (live spuštění)

## Dosažená L vs cílová L

| Osa | Cíl | Dosaženo | Metoda |
|---|---|---|---|
| PII — smtp-mailer success path | L3 | **L3** | statická analýza + teeth spec (LH-03 ✅) |
| PII — dispatch error path | L3 | **L2** | statická analýza — scanner slepá skvrna, spec nepokrývá |
| SEC — token v odkazu (templates) | L3 | **L3** | templates pouze renderují HTML, nelogují tělo; spec pokrývá |
| PII/SEC — log-mailer prod gate | L3 | **L3** | NODE_ENV=production check + teeth spec (LH-04 ✅) |
| OBJ — dispatch err.stack | L3 | **L3** | `err instanceof Error ? err.stack : String(err)` — bez enumerable polí |
| Factory gate (LogMailer v prod) | L3 | **L3** | mailer.module.spec.ts 3 scénáře, factory ověřena |

## Nálezy

### 🆕 LH-RUN-01 — [PII] `dispatch` catch loguje plný e-mail příjemce bez masky

**Kde:** `backend/src/modules/mailer/mailer.service.ts:82`

**Co:** Při SMTP chybě (`provider.send` vyhodí výjimku) se zaloguje:
```
`Mailer send failed: template=${template} to=${payload.to}`
```
`payload.to` = plný e-mail příjemce (např. `uzivatel@gmail.com`) — bez `mask()`. Jde na `logger.error`,
tedy na `log` level, a v produkci je `log` povoleno (LH-02 gate povoluje `['log','warn','error']`).

**Rozdíl od LH-03 (opraveno):** success path v `smtp-mailer.provider.ts:71` e-mail maskuje (`mask()` →
`u***@g***`). Error path v `mailer.service.ts:82` NEMASKUJE — opomenuto.

**Dosažitelnost:** Prod, SMTP timeout / chybná konfigurace / nedostupný relay. Pravděpodobnost při prod
incidentu (SMTP výpadek): vysoká.

**Scanner slepá skvrna:** M-SCAN `codeOnly()` extrahuje obsah `${}` z template literálu, ale
`template` a `payload.to` se konkatenují bez mezery → `templatepayload.to`. `WHOLE_OBJ` regex
hledá `\bpayload\b` — word boundary chybí po `template`, takže se neshoduje. Není flagnutý ani jako
CTX. **Scanner nález tichý = nález auditu, ne scanner chyba.**

**Dopad:** 🟡 střední — PII (e-mail) v prod logu na error cestě. Nižší frekvence než success path
(error = SMTP výpadek), ale vyšší citlivost — výpadky bývají i v neočekávaný čas.

**Návrh:** V `dispatch` použít `SmtpMailerProvider.mask()` (nebo extrahovat do sdíleného utility)
pro `payload.to` i v error message:
```ts
`Mailer send failed: template=${template} to=${maskEmail(payload.to)}`
```
`mask()` je privátní static — buď zpřístupnit (exportovat), nebo duplikovat triviální logiku do
`mailer.service.ts` (1 řádek). Preferovaná varianta: přesunout `mask()` do sdíleného modulu
`common/logging/mask-pii.util.ts`, aby bylo dostupné oběma provideru i service. L3 🆕

---

### ♻️ Konfirmace existujících nálezů (bez nových)

| Nález | Stav v registru | Ověřeno HEAD | Verdikt |
|---|---|---|---|
| LH-03 smtp-mailer mask e-mailu | ✅ OPRAVENO | `smtp-mailer.provider.ts:54,71` — `mask()` existuje, používá se v `send()` | ✅ potvrzeno |
| LH-04 LogMailer prod gate | ✅ OPRAVENO | `log-mailer.provider.ts:27` — `if (process.env.NODE_ENV === 'production')` → jen warn bez obsahu | ✅ potvrzeno |
| K-LOG3 token[0:8] délka | ⚖️ 8 znaků OK? | `payload.token.slice(0,8)` — tokeny jsou 64-hex (crypto.randomBytes(32).toString('hex') nebo UUID v4 36 znaků) — 8 znaků z 36–64 = <22 % → statisticky zanedbatelné pro bruteforce | ✅ by-design, token délka ≥36 |
| Factory gate (LogMailer nikdy v prod s SMTP env) | ♻️ ověřit | `mailer.module.ts:16` — `!!SMTP_HOST && !!SMTP_USER` → jinak LogMailer; LogMailer v prod vrací jen warn | ✅ dvojitá pojistka: factory + NODE_ENV check |
| Tělo mailu (HTML/text) nelogováno | K-LOG3 past | `mailer.templates.ts` — `renderEmail` vrací object; smtp provider volá `sendMail` a loguje jen `mask(to)`, ne tělo | ✅ token v URL, ale tělo nelogováno |
| `dispatch` `err.stack` — ne enumerable PII | ⚖️ ověřit | `err instanceof Error ? err.stack : String(err)` — NestJS 2. arg jako trace string, stack neobsahuje enumerable citlivá pole (Mongo keyValue apod.) — logError wrapper pro tenhle pattern; dispatch exception = SMTP error (ne Mongo) | ✅ OK |

## PROOF-REQUEST

**PR-01 — Runtime stdout capture pro dispatch error path (L5)**

Oblast: `PII`, nález LH-RUN-01.

Stávající spec `log-hygiene.spec.ts` testuje:
- `SmtpMailerProvider.send()` success (maskovaný e-mail) ✅
- `LogMailerProvider.send()` prod gate ✅
- `logError` / `logWarn` (Mongo-style chyba) ✅

**Chybí:** test `MailerService.dispatch()` catch path — kdy `provider.send` vyhodí výjimku.
Proof by měl:
1. Mockovat `IMailerProvider.send` aby hodil `new Error('SMTP timeout')`.
2. Zavolat `service.sendPasswordReset({ to: CANARY_EMAIL, ... })`.
3. Zachytit `Logger.prototype.error` args (spy — jako ostatní testy).
4. Asertovat `assertNoCanary()` — v současném kódu SELŽE (odhalí LH-RUN-01).
5. Po opravě (`mask()` v dispatch) test PROJDE → L5 na dispatch error path.

Bez živé infry (SMTP relay) — plně testovatelné syntetickým mockem. Nevyžaduje prod prostředí.
