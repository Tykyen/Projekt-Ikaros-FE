# ext-33 — Odolnost 3. stran · dosažená L3 (statika)

## Verdikt: seed 🔴 (Redis crash) VYVRÁCENO na HEAD
- `socket-io.adapter.ts:100-105` pub+sub `.on('error')` ✅; `user-ban-cache.service.ts:65-67`, `redis.module.ts:34-36` taky. Commit c8c1b9ea to opravil.
- `main.ts:36-41` unhandledRejection jen loguje (neshazuje); `main.ts:42-48` uncaughtException → exit(1).

## ⭐ FIX (BE, bezpečné) — outbound bez timeoutu (drží HTTP slot ~5 min):
- `auth/captcha.service.ts:61` → `fetch(..., { signal: AbortSignal.timeout(5000) })` (request-critical, fail-closed)
- `mailer/providers/smtp-mailer.provider.ts:45` → `createTransport({ connectionTimeout:10000, greetingTimeout:10000, socketTimeout:20000 })`
- `upload/upload.service.ts:146` konstruktor → `cloudinary.config({ timeout: 60000 })` (pokryje i admin-costs)
- `search/meili-search.service.ts:30` → `new MeiliSearch({ host, apiKey, timeout: 5000 })` (ověřit název pole dle verze)
- `push/push.service.ts:208` → web-push nemá timeout option → Promise.race s Abortem NEBO https agent s timeoutem
- `search/search.controller.ts:153` → doplnit `.catch(err => logError(...))` (parita s pages.service)

## ⭐/○ k diskuzi (NEfixovat v této dávce):
- throttler storage (`throttler.config.ts:54`) při `THROTTLER_REDIS=1` si ThrottlerStorageRedisService dělá vlastní ioredis z URL — možná bez `.on('error')` → reziduální 🔴; předat předkonfigurovanou Redis instanci. OVĚŘIT.
- Meili index drift (fire-and-forget bez retry) → dluh, ne rychlofix.
- disk-fallback upload 404 cross-instance při SOCKET_IO_REDIS=1 → návrhové rozhodnutí (sdílený volume / vypnout fallback).

## Fix status: 6 timeoutů = FIXNU (BE). throttler reziduum OVĚŘIT. Zbytek → dluh.
