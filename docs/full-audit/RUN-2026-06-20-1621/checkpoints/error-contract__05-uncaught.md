# error-contract / 05-uncaught — checkpoint RUN-2026-06-20-1621

## Pokrytí

Prošel jsem:
- `backend/src/common/filters/http-exception.filter.ts` — catch-all @Catch(), větve HttpException/Multer/CastError/E11000/fallback
- `backend/src/common/filters/http-exception.filter.spec.ts` — unit testy filtru (9 testů)
- `backend/src/common/pipes/validation-exception.factory.ts` — F2 exceptionFactory
- `backend/src/main.ts` — registrace filtru, ValidationPipe, unhandledRejection/uncaughtException handler
- `backend/src/modules/global-chat/global-chat.service.ts:179-187` — InternalServerErrorException string message
- `backend/src/modules/ikaros-articles/ikaros-articles.service.ts:480-524` — bulkApprove/bulkReject `err.message`
- `backend/src/modules/character-subdocs/character-accounts.service.ts` — throw new Error() ve fallback path
- `backend/src/modules/worlds/worlds.service.ts` — throw new Error() ve fallback path
- `backend/src/modules/campaign/services/campaign-purchase.service.ts` — throw new Error() ve fallback path
- `backend/src/modules/world-export/world-export.service.ts` — streaming path + exception body
- `backend/src/modules/world-export/world-export.controller.ts`
- `backend/src/modules/upload/upload.service.ts` — Cloudinary fallback
- `backend/src/modules/push/push.service.ts` — push error handling
- `backend/src/modules/maps/maps.gateway.ts` — WS emit('error') tvary
- `backend/src/gateways/app.gateway.ts` — return {error:string} ack tvary
- `src/shared/api/client.ts` — parseApiError fallback tvar #3
- `src/shared/ui/GlobalErrorBoundary.tsx`
- `src/features/chat/api/socket.ts` — globální socket.on('error')
- Grep `throw new Error` / `InternalServerErrorException` / `err.message` v BE src/
- Grep `@UseFilters` — hledání controller-level přetížení filtru
- Scanner `errors.txt` (M-GREP, 2026-06-20): 860 throwů / 75 souborů / 0 mrtvých statusCode

## Dosažená L vs cílová L

- **UE osa** (uncaught/500): L3 — statické čtení + kontext dosažitelnosti; L9 fault injection z předchozího běhu 2026-06-14 ✅ (CastError→400, E11000→409 M-SHAPE potvrzeno)
- **LK osa** (leak): L3 — statické čtení + dosažitelnost; nový nález LK potvrzený staticky
- **Cílová**: `UE` L9 (fault injection) ← L9 z předchozího auditu přetrvává; žádné nové cesty mimo filtr nenalezeny
- Cílová hloubka L3 (statická) dosažena; L9 z předchozíhoběhu nepotřebuje opakovat (žádné změny filtru od 2026-06-14)

## Nálezy

### EC-RUN-10 — `LK` — `InternalServerErrorException` string message leakuje interní text klientovi — L3 🆕

**Kde:** `backend/src/modules/global-chat/global-chat.service.ts:182-185`

```ts
throw new InternalServerErrorException(
  `Global channel '${room}' not initialized`,
);
```

`InternalServerErrorException` extends `HttpException` → projde filtrem větví #1 (HttpException). `getResponse()` vrací string `"Global channel 'hospoda' not initialized"` → `isObject=false` → `message = string` → klient dostane `{error:{code:'INTERNAL_SERVER_ERROR', message:"Global channel 'hospoda' not initialized", timestamp}}`.

Filtr logicky správně zpracuje HttpException, ale **interní implementační detail** (název room klíče, inicializační stav) se dostane do `error.message` — na rozdíl od plain `new Error()` (větev #5 = generická CS hláška bez leaku). `INTERNAL_SERVER_ERROR` je generický `code` (HTTP status name fallback), ne doménový.

**Dosažitelnost:** Střední — nastane jen při startu aplikace bez seedování globálních kanálů (chyba DB seed), ale `getChannelId()` volají REST endpointy dostupné každému přihlášenému (`/api/global-chat` GET).

**Dopad:** Minor info-leak — uživatel vidí `"Global channel 'hospoda' not initialized"` v chybové zprávě. Neodhaluje stack ani interní architekturu kriticky, ale narušuje vzor "generická hláška pro 500". Konzistentní s `LK` osou.

**Návrh:** Nahradit `new InternalServerErrorException(stringMsg)` za buď `new InternalServerErrorException({code: 'GLOBAL_CHAT_INIT_ERROR', message: 'Globální chat není dostupný'})`, nebo plain `throw new Error(stringMsg)` (catch-all větev #5 → nesakne zprávu klientovi + zaloguje server-side).

**Závažnost:** 🟡 (minor info-leak; dosažitelnost nízká — jen při init selhání; admin-like kontext, ne auth bypass)

---

### EC-RUN-11 — `LK` — `bulkApprove`/`bulkReject` v `ikaros-articles` posílají `err.message` jako `failed[].reason` v 200 těle — L3 🆕

**Kde:** `backend/src/modules/ikaros-articles/ikaros-articles.service.ts:495-497` + `519-521`

```ts
const msg = err instanceof Error ? err.message : 'Neznámá chyba';
failed.push({ id, reason: msg });
```

Bulk operace zachytávají chyby per-ID a vrací `{succeeded, failed[{id, reason}]}` jako 200 success payload (prochází filtrem jako success, ne jako exception). Pro `HttpException` typy (např. `NotFoundException`) je `err.message` = správná Czech doménová hláška. Ale pro neočekávané `Error` (DB selhání, Mongoose error) je `err.message` = raw interní text (např. Mongoose zpráva, `'upsert failed to return document'`).

**Dosažitelnost:** Nízká — endpoint je `POST /ikaros-articles/bulk/approve` s guard `assertAdmin(role, username)` → Superadmin / Admin / SpravceClanku. Reálný Mongo error při bulk operaci je edge case.

**Dopad:** Admin vidí raw interní Mongo zprávu v `failed[].reason`. Nikoli bezpečnostní průlom (admin-only), ale narušuje kontrakt "interní detail neprochází klientem". Analogicky `admin.service.ts` bulk operace (bulkBan/Unban/RoleChange) správně čtou `e.response?.message` (doménová Czech hláška z HttpException payloadu) — konzistentnější vzor.

**Návrh:** Nahradit `err.message` za `e?.response?.message ?? 'Selhalo'` (vzor z `admin.service.ts`) — dostane Czech doménovou hlášku pro HttpException a `'Selhalo'` fallback pro ostatní.

**Závažnost:** 🟡 (admin-only; minor; nenarušuje bezpečnost; ale porušuje LK kontrakt)

---

## Ověřené pozitivní nálezy (UE/LK pass)

| Oblast | Stav |
|---|---|
| `@Catch()` catch-all filtr — ne-HTTP chyby neleakují stack/message | ✅ ověřeno L3 |
| `throw new Error('...')` fallback → větev #5 → `INTERNAL` + CS hláška, server-log | ✅ ověřeno L3 |
| MulterError sloučen do filtru, LIMIT_FILE_SIZE CS, ostatní `UPLOAD_ERROR` bez EN leak | ✅ ověřeno L3 |
| Mongoose CastError → 400 INVALID_ID | ✅ ověřeno L3 |
| E11000 duplicate key → 409 DUPLICATE_KEY | ✅ ověřeno L3 + L9 (předchozí) |
| `unhandledRejection` / `uncaughtException` → Logger only, neovlivňuje HTTP response | ✅ ověřeno L3 |
| `upload.service.ts` Cloudinary fallback: `e.message` jen v logger.warn | ✅ ověřeno L3 |
| `push.service.ts` push error: `String(err)` jen v logger.warn | ✅ ověřeno L3 |
| Žádný `@UseFilters` na controller úrovni (nepřepisuje global filtr) | ✅ grep: 0 hitů |
| `world-export` streaming: výjimky před `archive.pipe(res)` jdou filtrem | ✅ ověřeno L3 |
| Žádný jiný `MulterExceptionFilter` / separátní upload filtr v codebase | ✅ glob: 1 soubor (filter.ts sám) |
| scanner: 0 mrtvých `statusCode` v těle (EC-05 codemod) | ✅ errors.txt |
| M-CONTRACT drift 0 (z checkpoint 07) | ✅ |
| FE `parseApiError` fallback tvar #3 — `error.message` (axios msg), ne undefined | ✅ ověřeno L3 |
| `socket.on('error')` globální záchyt v socket.ts — F5 přidán | ✅ ověřeno L3 |
| `maps.gateway` WS emit('error') má vždy `{code, message}` — žádný raw stack | ✅ ověřeno L3 |
| `app.gateway` return {error:string} — CS text, ne raw exception | ✅ ověřeno L3 |

## Srovnání s plánem oblasti 05

| Kontrolní bod z plánu | Stav |
|---|---|
| Tvar #3 dosažitelný (CastError/E11000 → M-SHAPE) | ✅ potvrzeno L9 (předchozí) |
| FE fallback u tvaru #3 — anglická axios hláška | ✅ potvrzeno (fallback = `err.message`) |
| Stack leak v prod — NestJS default 500 generický | ✅ ne-HTTP → catch-all → `'Vnitřní chyba serveru'` |
| `message: err.message` v throw / catch → leak | 🟡 EC-RUN-10 + EC-RUN-11 (nové, nízká závažnost) |
| Mongoose CastError → 400 nebo 500 | ✅ 400 INVALID_ID (F1) |
| Catch-all filtr chybí | ✅ OPRAVENO (F1) — `@Catch()` funguje |
| Logging ne-HTTP chyb server-side | ✅ logger.error v catch-all větvi #5 |

## PROOF-REQUEST

Žádný — L9 fault injection provedena v předchozím běhu (2026-06-14), filtr od té doby beze změny. Nové nálezy EC-RUN-10/11 jsou staticky prokázané (L3); live ověření by potvrdilo detail ale nemění závěr.

**Doporučeno (ne blocker):** Pro EC-RUN-10 — restart BE bez seedovaných kanálů → hit `/api/global-chat` → ověřit, že klient vidí `"Global channel '...' not initialized"` (empiricky potvrdí L3 → L4).
