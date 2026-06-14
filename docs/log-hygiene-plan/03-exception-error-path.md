# 03 — Exception & error path

> **Otázka:** loguje se `err`/stack **syrově** a leaknou interní detaily/PII? Je top-level pád kontrolovaný?
> **Osy:** `EXC` `OBJ` `TOP` `CTX`. **Plocha:** [http-exception.filter.ts], `logger.error(..., err)` napříč
> službami (chat 11, upload 7, worlds 7), top-level `main.ts`.

## Povrch

| Vzor | Místa (recon) | Riziko |
|---|---|---|
| `logger.error('msg', err)` s **celým `Error`** | chat.service.ts:1526-1840 (~8×), captcha:68 | 🟠 `OBJ`/`EXC` — stack + pole |
| `logger.warn('... ${err.message}')` | auth.service.ts:148,395,502 | ✅ jen message (kontrolované) |
| exception filtr stack | http-exception.filter.ts:113 | ⚖️ server-side, klientovi nic (F1) |
| top-level handler | **chybí** (recon) | 🟡 `TOP` — Node default dump |

## Co ověřit

1. **K-LOG4** `OBJ` — `logger.error('msg', err)`: NestJS 2. arg = `trace` (string). Předáním **`Error`
   objektu** se zaloguje celý. Pole `err` u Mongo/HTTP chyb může nést **query/dokument/URL s credentials**.
   Návrh: logovat `err instanceof Error ? err.stack : String(err)` (jen stack string), ne objekt. Nebo
   centrální `logError(logger, msg, err)` helper s redakcí.
2. **K-LOG5** `EXC` ⚖️ — filtr [http-exception.filter.ts:113] loguje `name: message` + stack **server-side**,
   klientovi generická CS hláška. **GOOD** (error-contract F1). Ověřit: (a) je to jediné místo se stackem?
   (b) neobsahuje stack PII (jména souborů OK, ale ne hodnoty proměnných — Node stack je jen volání).
3. **K-LOG8** `TOP` — žádný `process.on('unhandledRejection'/'uncaughtException')` → pád = Node default raw
   dump na stderr (celý error). Návrh: handler co zaloguje `name+message` (přes Logger) a graceful shutdown,
   ne raw dump. ⚠️ trade-off: uncaughtException handler bez `process.exit` může nechat app v nekonzistentním
   stavu → logovat + exit.
4. **`CTX`** — catch bloky v chat/upload/worlds: logují jen `worldId`/`userId` (recon — IDs) nebo celý
   `dto`/`payload`/`user`? M-SCAN taint na 2. arg + okolní proměnné.

## Pasti
- Stack na disku bez rotace (`SINK`, oblast 08) leží napořád → i „jen stack" je retence problém.
- `logger.error(msg, err)` vs `logger.error(msg, err.stack)` — rozdíl mezi objektem a stringem; M-SCAN musí
  rozlišit (AST typ argumentu).
- Mongo error objekt nese `keyValue` s **daty porušeného unique** (e-mail!) → `OBJ` u duplicate-key logů.
