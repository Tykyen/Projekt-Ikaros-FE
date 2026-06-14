# 05 — Uncaught & 500 (`UE` `LK`)

> **Otázka:** co se stane, když spadne **ne-HttpException** chyba (`Error`, Mongoose `CastError`/`ValidationError`,
> `TypeError`, výpadek závislosti)? Dostane klient `{error:{…}}` wrapper, nebo cizí tvar? A **neleakuje** se
> v prod stack trace / interní Mongo zpráva?

## Kořen oblasti
`HttpExceptionFilter` je **`@Catch(HttpException)`** ([http-exception.filter.ts:10]) → ne-HTTP chyba **propadne**
na NestJS default exception handler → tvar #3 `{statusCode:500, message:'Internal server error'}` **bez `error`
wrapperu** → FE `parseApiError` ([client.ts:91]) → `data.error.message` = undefined → fallback `err.message`
(axios „Request failed with status code 500"). **Ověřeno čtením. K-EC1.**

## Povrch
- Filtr `@Catch(HttpException)` — chybí catch-all `@Catch()`.
- Místa, kde může vzniknout ne-HTTP chyba: Mongoose operace (`CastError` na špatném ObjectId!), `JSON.parse`, externí volání (Cloudinary/Meili/SMTP), `await` bez try/catch.
- `NODE_ENV` větvení defaultního 500 (leak stack v dev?).

## Kontrolní body
- [ ] **Tvar #3 dosažitelný** — endpoint s `findById(invalidObjectId)` bez guardu → Mongoose `CastError` → 500 #3? M-SHAPE vynutí. **K-EC1.**
- [ ] **FE fallback** — co uživatel vidí u tvaru #3? „Request failed…" (EN, technické). `FE`.
- [ ] **Stack leak v prod** — NestJS default 500 je generický (`'Internal server error'`) — ✅ neleakuje. Ale je někde **vlastní** `catch` co vrací `err.message` klientovi (leak Mongo/interní)? Grep `message: err.message` / `.message` v throw. `LK`.
- [ ] **Mongoose chyby** — `CastError`/`ValidationError`/`DuplicateKey(11000)` → mapují se na 400/409, nebo propadnou na 500? (duplicate key na unique indexu = častý → měl by být 409, ne 500).
- [ ] **Catch-all filtr (chybí)** — doporučený fix: `@Catch()` filtr co i ne-HTTP obalí do `{error:{code:'INTERNAL',message:'…',timestamp}}` + loguje original server-side (ne klientovi).
- [ ] **Logging** — loguje se ne-HTTP chyba server-side (jinak slepá v prod)? Cross-ref absence Sentry (dluh).

## Metoda
M-SHAPE (vynucený 500 přes CastError / test-route throw) → L4. M-FAULT (Mongo/Cloudinary outage → tvar) → L9. M-FUZZ (malformed → nikdy syrový 500 leak).

## Seed
`K-EC1` (ne-HTTP mine filtr 🟠/🔴), `LK` (leak interní message).
